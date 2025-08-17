"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Github, Star, GitFork, Clock, MessageSquare, Search, Filter, ExternalLink } from "lucide-react"
import axios from "axios"
import LoadingSpinner from "./LoadingSpinner"

const Dashboard = () => {
  const [repositories, setRepositories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("updated")
  const [stats, setStats] = useState({
    totalRepos: 0,
    totalStars: 0,
    totalForks: 0,
  })

  useEffect(() => {
    fetchRepositories()
  }, [sortBy])

  const fetchRepositories = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/github/repositories?sort=${sortBy}`)
      const repos = response.data

      setRepositories(repos)

      // Calculate stats
      const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0)
      const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0)

      setStats({
        totalRepos: repos.length,
        totalStars,
        totalForks,
      })
    } catch (error) {
      console.error("Failed to fetch repositories:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRepositories = repositories.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getLanguageColor = (language) => {
    const colors = {
      JavaScript: "#f1e05a",
      TypeScript: "#2b7489",
      Python: "#3572A5",
      Java: "#b07219",
      "C++": "#f34b7d",
      C: "#555555",
      PHP: "#4F5D95",
      Ruby: "#701516",
      Go: "#00ADD8",
      Rust: "#dea584",
      Swift: "#ffac45",
      Kotlin: "#F18E33",
    }
    return colors[language] || "#6b7280"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Explore your repositories and get AI-powered insights</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Github className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRepos}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Repositories</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStars}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Stars</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <GitFork className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalForks}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Forks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
            <option value="pushed">Recently Pushed</option>
            <option value="full_name">Name</option>
          </select>
        </div>
      </div>

      {/* Repository Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRepositories.map((repo) => (
          <div
            key={repo.id}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  <Link
                    to={`/repository/${repo.owner.login}/${repo.name}`}
                    className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {repo.name}
                  </Link>
                </h3>
                {repo.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{repo.description}</p>
                )}
              </div>

              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center gap-4">
                {repo.language && (
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: getLanguageColor(repo.language) }}
                    />
                    {repo.language}
                  </div>
                )}

                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  {repo.stargazers_count}
                </div>

                <div className="flex items-center">
                  <GitFork className="h-4 w-4 mr-1" />
                  {repo.forks_count}
                </div>
              </div>

              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {formatDate(repo.updated_at)}
              </div>
            </div>

            <div className="flex gap-2">
              <Link to={`/repository/${repo.owner.login}/${repo.name}`} className="flex-1 btn-primary text-center">
                Explore Code
              </Link>
              <Link
                to={`/chat/${repo.owner.login}/${repo.name}`}
                className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                AI Chat
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredRepositories.length === 0 && !loading && (
        <div className="text-center py-12">
          <Github className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No repositories found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm ? "Try adjusting your search terms." : "You don't have any repositories yet."}
          </p>
        </div>
      )}
    </div>
  )
}

export default Dashboard
