"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Code, Home, Settings, Moon, Sun, Menu, X, Github, LogOut } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import axios from "axios"

const Sidebar = ({ isOpen, onToggle }) => {
  const location = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [repositories, setRepositories] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchRepositories()
    }
  }, [user])

  const fetchRepositories = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/api/github/repositories")
      setRepositories(response.data.slice(0, 10)) // Show first 10 repos
    } catch (error) {
      console.error("Failed to fetch repositories:", error)
    } finally {
      setLoading(false)
    }
  }

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/"
    }
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onToggle} />}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 z-50 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300
        ${isOpen ? "w-64" : "w-16"}
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {isOpen && (
            <div className="flex items-center">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Code className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">CodePilot AI</span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isOpen ? (
              <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* User Info */}
        {isOpen && user && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <img src={user.avatar_url || "/placeholder.svg"} alt={user.name} className="h-10 w-10 rounded-full" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name || user.login}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">@{user.login}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActive(item.href)
                        ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {isOpen && <span className="ml-3">{item.name}</span>}
                </Link>
              )
            })}
          </div>

          {/* Repositories */}
          {isOpen && (
            <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Recent Repositories
              </h3>
              <div className="mt-3 space-y-1">
                {loading ? (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
                ) : (
                  repositories.map((repo) => (
                    <Link
                      key={repo.id}
                      to={`/repository/${repo.owner.login}/${repo.name}`}
                      className="flex items-center px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Github className="h-4 w-4 mr-3" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{repo.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{repo.owner.login}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {isOpen && (
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
