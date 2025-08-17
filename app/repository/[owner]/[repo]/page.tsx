"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Sidebar from "@/app/components/Sidebar"
import LoadingSpinner from "@/app/components/LoadingSpinner"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism"
import { useTheme } from "next-themes"
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Star,
  GitFork,
  ExternalLink,
  MessageSquare,
  Download,
  Eye,
  Calendar,
} from "lucide-react"

interface Repository {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  updated_at: string
  private: boolean
  owner: {
    login: string
    avatar_url: string
  }
}

interface FileTreeItem {
  name: string
  path: string
  type: "file" | "dir"
  size?: number
  sha: string
  download_url?: string
}

interface FileContent {
  name: string
  path: string
  content: string
  size: number
}

export default function RepositoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { theme } = useTheme()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [repository, setRepository] = useState<Repository | null>(null)
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([])
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [fileLoading, setFileLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const owner = params.owner as string
  const repo = params.repo as string

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    if (session?.accessToken && owner && repo) {
      fetchRepository()
      fetchFileTree()
    }
  }, [session, status, owner, repo, router])

  const fetchRepository = async () => {
    try {
      const response = await fetch(`/api/github/repository/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch repository")
      }

      const data = await response.json()
      setRepository(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const fetchFileTree = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/github/repository/${owner}/${repo}/tree?recursive=true`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch file tree")
      }

      const data = await response.json()
      setFileTree(data.tree || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fetchFileContent = async (path: string) => {
    try {
      setFileLoading(true)
      const response = await fetch(`/api/github/repository/${owner}/${repo}/file?path=${encodeURIComponent(path)}`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch file content")
      }

      const data = await response.json()
      setSelectedFile(data)
    } catch (err) {
      console.error("Error fetching file:", err)
    } finally {
      setFileLoading(false)
    }
  }

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const getFileLanguage = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase()
    const languageMap: { [key: string]: string } = {
      js: "javascript",
      jsx: "jsx",
      ts: "typescript",
      tsx: "tsx",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      h: "c",
      css: "css",
      html: "html",
      json: "json",
      md: "markdown",
      yml: "yaml",
      yaml: "yaml",
      xml: "xml",
      sh: "bash",
      sql: "sql",
      php: "php",
      rb: "ruby",
      go: "go",
      rs: "rust",
    }
    return languageMap[ext || ""] || "text"
  }

  const buildFileTree = (items: FileTreeItem[]) => {
    const tree: { [key: string]: any } = {}

    items.forEach((item) => {
      const parts = item.path.split("/")
      let current = tree

      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            name: part,
            path: parts.slice(0, index + 1).join("/"),
            type: index === parts.length - 1 ? item.type : "dir",
            children: {},
            item: index === parts.length - 1 ? item : null,
          }
        }
        current = current[part].children
      })
    })

    return tree
  }

  const renderFileTree = (tree: any, level = 0) => {
    return Object.values(tree).map((node: any) => {
      const isFolder = node.type === "dir" || Object.keys(node.children).length > 0
      const isExpanded = expandedFolders.has(node.path)
      const hasChildren = Object.keys(node.children).length > 0

      return (
        <div key={node.path}>
          <div
            className={`flex items-center text-sm cursor-pointer py-1 px-2 border-b border-gray-200 dark:border-gray-700 
              hover:bg-gray-100 dark:hover:bg-gray-700 ${
                selectedFile?.path === node.path ? "bg-gray-200 dark:bg-gray-600 font-medium" : ""
              }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => {
              if (isFolder) {
                toggleFolder(node.path)
              } else {
                fetchFileContent(node.path)
              }
            }}
          >
            {isFolder ? (
              <>
                {hasChildren ? (
                  isExpanded ? (
                    <ChevronDown className="w-4 h-4 mr-1" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mr-1" />
                  )
                ) : (
                  <div className="w-4 h-4 mr-1" />
                )}
                <Folder className="w-4 h-4 text-gray-500 mr-1" />
              </>
            ) : (
              <>
                <div className="w-4 h-4 mr-1" />
                <File className="w-4 h-4 text-gray-500 mr-1" />
              </>
            )}
            <span className="truncate">{node.name}</span>
          </div>
          {isFolder && isExpanded && hasChildren && <div>{renderFileTree(node.children, level + 1)}</div>}
        </div>
      )
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const tree = buildFileTree(fileTree)

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900 text-sm">
      <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Repository Header - Codeforces style */}
        {repository && (
          <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-4 py-2 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-gray-900 dark:text-white">{repository.full_name}</h1>
                  {repository.private && (
                    <span className="px-1 py-0.5 text-xs bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-600">
                      Private
                    </span>
                  )}
                </div>
                <div className="flex gap-4 mt-1 text-gray-700 dark:text-gray-300">
                  {repository.language && <span>{repository.language}</span>}
                  <span>★ {repository.stargazers_count}</span>
                  <span>⑂ {repository.forks_count}</span>
                  <span>Updated {formatDate(repository.updated_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/chat/${owner}/${repo}`)}
                  className="px-2 py-1 border border-gray-400 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  AI Chat
                </button>
                <a
                  href={repository.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 border border-gray-400 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* File Tree - Codeforces style */}
          <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 overflow-auto">
            <div className="px-3 py-2 border-b border-gray-300 dark:border-gray-700 font-semibold bg-gray-100 dark:bg-gray-700">
              Files
            </div>
            <div className="">{error ? <div className="p-2 text-red-600">{error}</div> : renderFileTree(tree)}</div>
          </div>

          {/* File Content (kept same) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedFile ? (
              <>
                <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-gray-500">{selectedFile.size} bytes</span>
                  </div>
                  {selectedFile.download_url && (
                    <a
                      href={selectedFile.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Download
                    </a>
                  )}
                </div>
                <div className="flex-1 overflow-auto">
                  {fileLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : (
                    <SyntaxHighlighter
                      language={getFileLanguage(selectedFile.name)}
                      style={theme === "dark" ? vscDarkPlus : vs}
                      showLineNumbers
                      wrapLines
                      customStyle={{
                        margin: 0,
                        padding: "1rem",
                        background: "transparent",
                        fontSize: "14px",
                        lineHeight: "1.5",
                      }}
                    >
                      {selectedFile.content}
                    </SyntaxHighlighter>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Select a file to view</h3>
                  <p className="text-gray-500">Choose a file from the tree to see its contents</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
