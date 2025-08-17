"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "./Sidebar"
import LoadingSpinner from "./LoadingSpinner"

interface Repository {
  id: number
  name: string
  full_name: string
  description: string
  html_url: string
  language: string
  stargazers_count: number
  forks_count: number
  updated_at: string
  private: boolean
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchRepositories()
    } else if (status !== "loading") {
      setLoading(false)
    }
  }, [session, status])

  const fetchRepositories = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/github/repositories")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch repositories")
      }
      const data = await response.json()
      setRepositories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const filteredRepositories = repositories.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleRepositoryClick = (repo: Repository) => {
    const [owner, repoName] = repo.full_name.split("/")
    router.push(`/repository/${owner}/${repoName}`)
  }

  const handleRefresh = () => {
    fetchRepositories()
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <header className="border-b border-gray-300 dark:border-gray-700 px-6 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-blue-700 dark:text-blue-400">
                  Your Repositories
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Welcome back, {session?.user?.name}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm border border-blue-700 hover:bg-blue-700"
                >
                  Refresh
                </button>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-56 px-3 py-1.5 border border-gray-400 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <svg
                    className="absolute right-2 top-2 h-4 w-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {error ? (
              <div className="border border-red-400 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
                <p className="font-medium">Error loading repositories</p>
                <p>{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-1 underline text-red-600 dark:text-red-400 hover:text-red-800"
                >
                  Try again
                </button>
              </div>
            ) : (
              <table className="w-full border border-gray-300 dark:border-gray-700 text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
                  <tr className="text-left">
                    <th className="px-3 py-2 border-r border-gray-300 dark:border-gray-700">Name</th>
                    <th className="px-3 py-2 border-r border-gray-300 dark:border-gray-700">Description</th>
                    <th className="px-3 py-2 border-r border-gray-300 dark:border-gray-700">Language</th>
                    <th className="px-3 py-2 border-r border-gray-300 dark:border-gray-700">Stars</th>
                    <th className="px-3 py-2 border-r border-gray-300 dark:border-gray-700">Forks</th>
                    <th className="px-3 py-2">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRepositories.map((repo, idx) => (
                    <tr
                      key={repo.id}
                      onClick={() => handleRepositoryClick(repo)}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        idx % 2 === 1 ? "bg-gray-50 dark:bg-gray-900/20" : ""
                      }`}
                    >
                      <td className="px-3 py-2 font-medium text-blue-700 dark:text-blue-400">
                        {repo.name} {repo.private && <span className="text-xs text-yellow-600 ml-1">(Private)</span>}
                      </td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                        {repo.description || "—"}
                      </td>
                      <td className="px-3 py-2">{repo.language || "—"}</td>
                      <td className="px-3 py-2">{repo.stargazers_count}</td>
                      <td className="px-3 py-2">{repo.forks_count}</td>
                      <td className="px-3 py-2">{new Date(repo.updated_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {filteredRepositories.length === 0 && !loading && !error && (
              <div className="text-center py-12 text-sm text-gray-600 dark:text-gray-400">
                No repositories found.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
