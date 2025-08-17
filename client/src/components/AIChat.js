"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import { Send, ArrowLeft, Bot, User, Trash2, FileText } from "lucide-react"
import axios from "axios"
import LoadingSpinner from "./LoadingSpinner"

const AIChat = () => {
  const { owner, repo } = useParams()
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [chatLoading, setChatLoading] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchChatHistory()
  }, [owner, repo])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchChatHistory = async () => {
    try {
      setChatLoading(true)
      const response = await axios.get(`/api/ai/conversations/${owner}/${repo}`)
      setMessages(response.data.messages || [])
    } catch (error) {
      console.error("Failed to fetch chat history:", error)
      // Initialize with welcome message if no history exists
      setMessages([
        {
          role: "assistant",
          content: `Hello! I'm your AI assistant for the ${owner}/${repo} repository. I can help you understand the codebase, find specific files, explain functionality, and answer questions about the code. What would you like to know?`,
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    const userMessage = {
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setLoading(true)

    try {
      const response = await axios.post(`/api/ai/chat/${owner}/${repo}`, {
        message: inputMessage,
        history: messages,
      })

      const assistantMessage = {
        role: "assistant",
        content: response.data.response,
        suggestedFiles: response.data.suggestedFiles,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Failed to send message:", error)
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error while processing your request. Please try again.",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = async () => {
    try {
      await axios.delete(`/api/ai/conversations/${owner}/${repo}`)
      setMessages([
        {
          role: "assistant",
          content: `Chat history cleared! I'm ready to help you explore the ${owner}/${repo} repository. What would you like to know?`,
          timestamp: new Date().toISOString(),
        },
      ])
    } catch (error) {
      console.error("Failed to clear chat:", error)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const suggestedQuestions = [
    "Where is the main entry point of this application?",
    "How does authentication work in this project?",
    "What are the main components/modules?",
    "Where are the API routes defined?",
    "How is the database configured?",
    "What testing framework is used?",
    "Where are the environment variables configured?",
    "How does the build process work?",
  ]

  if (chatLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              to={`/repository/${owner}/${repo}`}
              className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Link>

            <div className="flex items-center">
              <Bot className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">AI Assistant</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {owner}/{repo}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Chat
            </button>

            <Link
              to={`/repository/${owner}/${repo}`}
              className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Code
            </Link>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex max-w-3xl ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 ${message.role === "user" ? "ml-3" : "mr-3"}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === "user" ? "bg-primary-600" : "bg-green-600"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className={`flex-1 ${message.role === "user" ? "text-right" : "text-left"}`}>
                <div
                  className={`inline-block p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {/* Suggested Files */}
                  {message.suggestedFiles && message.suggestedFiles.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-sm font-medium mb-2">Relevant files:</p>
                      <div className="space-y-1">
                        {message.suggestedFiles.map((file, fileIndex) => (
                          <Link
                            key={fileIndex}
                            to={`/repository/${owner}/${repo}?file=${encodeURIComponent(file.path)}`}
                            className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            {file.path}
                            {file.lines && <span className="ml-1 text-xs text-gray-500">(lines {file.lines})</span>}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                    message.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading Message */}
        {loading && (
          <div className="flex justify-start">
            <div className="flex max-w-3xl">
              <div className="flex-shrink-0 mr-3">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="inline-block p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <div className="flex items-center">
                    <LoadingSpinner size="small" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      Thinking<span className="loading-dots"></span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions (show when no messages) */}
      {messages.length <= 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Try asking:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(question)}
                className="text-left p-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about this repository..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows="3"
              disabled={loading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || loading}
            className="p-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}

export default AIChat
