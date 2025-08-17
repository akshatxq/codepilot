"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Sidebar from "@/app/components/Sidebar"
import LoadingSpinner from "@/app/components/LoadingSpinner"
import { Send, Trash2, FileText, MessageSquare, Bot, User, RefreshCw } from "lucide-react"

interface Conversation {
  id: string
  message: string
  response: string
  suggestedFiles: string[]
  timestamp: string
}

interface Repository {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  owner: {
    login: string
    avatar_url: string
  }
  language: string | null
}

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [repository, setRepository] = useState<Repository | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const owner = params.owner as string
  const repo = params.repo as string

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    if (session?.accessToken && owner && repo) {
      fetchRepository()
      fetchConversations()
    }
  }, [session, status, owner, repo, router])

  useEffect(() => {
    scrollToBottom()
  }, [conversations])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchRepository = async () => {
    try {
      const response = await fetch(`/api/github/repository/${owner}/${repo}`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      })

      if (!response.ok) throw new Error("Failed to fetch repository")

      const data = await response.json()
      setRepository(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/ai/conversations/${owner}/${repo}`)
      if (!response.ok) throw new Error("Failed to fetch conversations")

      const data = await response.json()
      setConversations(data)
    } catch (err) {
      console.error("Error fetching conversations:", err)
    }
  }

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return

    const message = currentMessage.trim()
    setCurrentMessage("")
    setIsLoading(true)
    setError(null)

    const userMessage: Conversation = {
      id: Date.now().toString(),
      message: message,
      response: "",
      suggestedFiles: [],
      timestamp: new Date().toISOString(),
    }

    setConversations((prev) => [...prev, userMessage])

    try {
      const response = await fetch(`/api/ai/chat/${owner}/${repo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          context: {
            repository: repository?.full_name,
            description: repository?.description,
            language: repository?.language,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to get AI response")

      const data = await response.json()

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === userMessage.id
            ? { ...conv, response: data.response, suggestedFiles: data.suggestedFiles }
            : conv,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setConversations((prev) => prev.filter((conv) => conv.id !== userMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  const clearConversations = async () => {
    try {
      const response = await fetch(`/api/ai/conversations/${owner}/${repo}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to clear conversations")
      setConversations([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear conversations")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleFileClick = (filePath: string) => {
    router.push(`/repository/${owner}/${repo}?file=${encodeURIComponent(filePath)}`)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
        <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col border-l border-gray-300 dark:border-gray-700">
        {/* Chat Header */}
        {repository && (
          <div className="bg-gray-200 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold">{repository.name} - AI Chat</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Ask about your codebase. Simple Q&A like Codeforces discussions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchConversations}
                  className="px-2 py-1 text-sm border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={clearConversations}
                  className="px-2 py-1 text-sm border border-gray-400 dark:border-gray-600 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => router.push(`/repository/${owner}/${repo}`)}
                  className="px-3 py-1 text-sm border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" /> View Code
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {conversations.length === 0 && !isLoading ? (
            <div className="text-center mt-20">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400">No conversations yet. Start by asking a question.</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {conversations.map((conversation) => (
                <div key={conversation.id} className="space-y-3">
                  {/* User Message */}
                  <div className="flex gap-2 items-start">
                    <div className="w-7 h-7 flex items-center justify-center border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm">
                      {conversation.message}
                    </div>
                  </div>

                  {/* AI Response */}
                  {conversation.response && (
                    <div className="flex gap-2 items-start">
                      <div className="w-7 h-7 flex items-center justify-center border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                        <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="bg-white dark:bg-gray-800 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm">
                        <p className="whitespace-pre-wrap">{conversation.response}</p>

                        {conversation.suggestedFiles.length > 0 && (
                          <div className="mt-2 text-xs">
                            <span className="font-semibold">Suggested files:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {conversation.suggestedFiles.map((file, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleFileClick(file)}
                                  className="px-2 py-0.5 border border-gray-400 dark:border-gray-600 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                  {file}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 items-start">
                  <div className="w-7 h-7 flex items-center justify-center border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                    <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                    <LoadingSpinner size="sm" /> <span className="ml-2">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 pb-2">
            <div className="max-w-3xl mx-auto p-2 border border-red-400 bg-red-50 dark:bg-red-900/30 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-6 py-3">
          <div className="max-w-3xl mx-auto flex gap-2">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
              className="flex-1 text-sm p-2 border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-900 resize-none"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!currentMessage.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm transition disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4 inline" />} Send
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter to send, Shift+Enter for newline</p>
        </div>
      </div>
    </div>
  )
}
