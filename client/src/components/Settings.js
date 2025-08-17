"use client"

import { useState, useEffect } from "react"
import { User, Github, Key, Trash2, Save, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import axios from "axios"

const Settings = () => {
  const { user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [settings, setSettings] = useState({
    aiProvider: "gemini",
    maxTokens: 2000,
    temperature: 0.7,
    notifications: true,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await axios.get("/api/user/settings")
      setSettings({ ...settings, ...response.data })
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      await axios.put("/api/user/settings", settings)
      setMessage({ type: "success", text: "Settings saved successfully!" })
      setTimeout(() => setMessage({ type: "", text: "" }), 3000)
    } catch (error) {
      console.error("Failed to save settings:", error)
      setMessage({ type: "error", text: "Failed to save settings. Please try again." })
      setTimeout(() => setMessage({ type: "", text: "" }), 3000)
    } finally {
      setSaving(false)
    }
  }

  const clearAllData = async () => {
    if (!window.confirm("Are you sure you want to clear all your data? This action cannot be undone.")) {
      return
    }

    try {
      await axios.delete("/api/user/data")
      setMessage({ type: "success", text: "All data cleared successfully!" })
      setTimeout(() => setMessage({ type: "", text: "" }), 3000)
    } catch (error) {
      console.error("Failed to clear data:", error)
      setMessage({ type: "error", text: "Failed to clear data. Please try again." })
      setTimeout(() => setMessage({ type: "", text: "" }), 3000)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account preferences and AI assistant configuration
        </p>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5 mr-3" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-3" />
          )}
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-6">
            <User className="h-6 w-6 text-gray-600 dark:text-gray-400 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Information</h2>
          </div>

          {user && (
            <div className="flex items-center">
              <img src={user.avatar_url || "/placeholder.svg"} alt={user.name} className="h-16 w-16 rounded-full" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{user.name || user.login}</h3>
                <p className="text-gray-600 dark:text-gray-400">@{user.login}</p>
                <div className="flex items-center mt-2">
                  <Github className="h-4 w-4 mr-2 text-gray-500" />
                  <a
                    href={user.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    View GitHub Profile
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Assistant Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-6">
            <Key className="h-6 w-6 text-gray-600 dark:text-gray-400 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Assistant Configuration</h2>
          </div>

          <div className="space-y-6">
            {/* AI Provider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Provider</label>
              <select
                value={settings.aiProvider}
                onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI GPT</option>
              </select>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choose your preferred AI model for code analysis
              </p>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Tokens: {settings.maxTokens}
              </label>
              <input
                type="range"
                min="500"
                max="4000"
                step="100"
                value={settings.maxTokens}
                onChange={(e) => setSettings({ ...settings, maxTokens: Number.parseInt(e.target.value) })}
                className="w-full"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Maximum number of tokens for AI responses</p>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Creativity: {settings.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => setSettings({ ...settings, temperature: Number.parseFloat(e.target.value) })}
                className="w-full"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Higher values make responses more creative, lower values more focused
              </p>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Appearance</h2>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark themes</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDark ? "bg-primary-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDark ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-6">
            <Trash2 className="h-6 w-6 text-red-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Data Management</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Clear All Data</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                This will permanently delete all your chat history, settings, and cached repository data.
              </p>
              <button
                onClick={clearAllData}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
