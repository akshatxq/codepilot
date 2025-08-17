"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  ArrowLeft,
  ExternalLink,
  Star,
  GitFork,
  Eye,
} from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism"
import axios from "axios"
import LoadingSpinner from "./LoadingSpinner"
import { useTheme } from "../context/ThemeContext"

const RepositoryView = () => {
  const { owner, repo } = useParams()
  const { isDark } = useTheme()
  const [repository, setRepository] = useState(null)
  const [fileTree, setFileTree] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [fileLoading, setFileLoading] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState(new Set([""]))

  useEffect(() => {
    fetchRepository()
    fetchFileTree()
  }, [owner, repo])

  const fetchRepository = async () => {
    try {
      const response = await axios.get(`/api/github/repository/${owner}/${repo}`)
      setRepository(response.data)
    } catch (error) {
      console.error("Failed to fetch repository:", error)
    }
  }

  const fetchFileTree = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/github/repository/${owner}/${repo}/tree`)
      setFileTree(response.data)
    } catch (error) {
      console.error("Failed to fetch file tree:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFileContent = async (path) => {
    try {
      setFileLoading(true)
      const response = await axios.get(`/api/github/repository/${owner}/${repo}/file`, {
        params: { path },
      })
      setFileContent(response.data.content)
      setSelectedFile({ path, ...response.data })
    } catch (error) {
      console.error("Failed to fetch file content:", error)
      setFileContent("Failed to load file content")
    } finally {
      setFileLoading(false)
    }
  }

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const getFileLanguage = (filename) => {
    const ext = filename.split(".").pop().toLowerCase()
    const languageMap = {
      js: "javascript",
      jsx: "jsx",
      ts: "typescript",
      tsx: "tsx",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      php: "php",
      rb: "ruby",
      go: "go",
      rs: "rust",
      swift: "swift",
      kt: "kotlin",
      html: "html",
      css: "css",
      scss: "scss",
      json: "json",
      xml: "xml",
      yaml: "yaml",
      yml: "yaml",
      md: "markdown",
      sh: "bash",
      sql: "sql",
    }
    return languageMap[ext] || "text"
  }

  const renderFileTree = (items, parentPath = "") => {
    return items.map((item) => {
      const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name
      const isExpanded = expandedFolders.has(fullPath)

      if (item.type === "tree") {
        return (
          <div key={fullPath}>
            <div
              className={`file-tree-item ${selectedFile?.path === fullPath ? "active" : ""}`}
              onClick={() => toggleFolder(fullPath)}
              style={{ paddingLeft: `${(fullPath.split("/").length - 1) * 20 + 8}px` }}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              <Folder className="h-4 w-4 mr-2 text-blue-500" />
              {item.name}
            </div>
            {isExpanded && item.children && <div>{renderFileTree(item.children, fullPath)}</div>}
          </div>
        )
      } else {
        return (
          <div
            key={fullPath}
            className={`file-tree-item ${selectedFile?.path === fullPath ? "active" : ""}`}
            onClick={() => fetchFileContent(fullPath)}
            style={{ paddingLeft: `${(fullPath.split("/").length - 1) * 20 + 8}px` }}
          >
            <File className="h-4 w-4 mr-2 text-gray-500" />
            {item.name}
          </div>
        )
      }
    })
  }

  if (loading) {
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
            <Link to="/" className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Link>

            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {owner}/{repo}
              </h1>
              {repository && (
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    {repository.stargazers_count}
                  </div>
                  <div className="flex items-center">
                    <GitFork className="h-4 w-4 mr-1" />
                    {repository.forks_count}
                  </div>
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {repository.watchers_count}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/chat/${owner}/${repo}`}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              AI Chat
            </Link>

            {repository && (
              <a
                href={repository.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Files</h3>
            <div className="space-y-1">{renderFileTree(fileTree)}</div>
          </div>
        </div>

        {/* File Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedFile ? (
            <>
              {/* File Header */}
              <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <File className="h-5 w-5 mr-2 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedFile.path}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{selectedFile.size} bytes</div>
                </div>
              </div>

              {/* File Content */}
              <div className="flex-1 overflow-auto">
                {fileLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <SyntaxHighlighter
                    language={getFileLanguage(selectedFile.path)}
                    style={isDark ? vscDarkPlus : vs}
                    className="code-viewer h-full"
                    showLineNumbers
                    wrapLines
                  >
                    {fileContent}
                  </SyntaxHighlighter>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a file to view</h3>
                <p className="text-gray-600 dark:text-gray-400">Choose a file from the tree to see its contents</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RepositoryView
