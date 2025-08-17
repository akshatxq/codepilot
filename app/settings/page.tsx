"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import Sidebar from "@/app/components/Sidebar"
import LoadingSpinner from "@/app/components/LoadingSpinner"
import { SettingsIcon, User, Palette, Key, Database, Github, Bot, Save, Eye, EyeOff } from "lucide-react"
import Image from "next/image"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [settings, setSettings] = useState({
    aiProvider: "gemini",
    maxTokens: 1000,
    temperature: 0.7,
    autoSuggestFiles: true,
    saveConversations: true,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
      return
    }
  }, [status, router])

  const handleSaveSettings = () => {
    localStorage.setItem("codepilot-settings", JSON.stringify(settings))
    alert("Settings saved successfully!")
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex">
        <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[#f5f5f5] text-black dark:bg-[#1a1a1a] dark:text-gray-200 font-sans">
      <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="border-b border-gray-300 dark:border-gray-700 pb-3 mb-6">
            <div className="flex items-center gap-3 mb-1">
              <SettingsIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage your account preferences and AI configuration
            </p>
          </div>

          <div className="max-w-4xl space-y-6">
            {/* Section Wrapper */}
            {[
              {
                title: "Profile",
                icon: <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                content: session?.user && (
                  <div className="flex items-center gap-4">
                    <Image
                      src={session.user.image || "/placeholder.svg?height=64&width=64"}
                      alt={session.user.name || "User"}
                      width={64}
                      height={64}
                      className="border border-gray-300 dark:border-gray-600"
                    />
                    <div>
                      <h3 className="font-medium">{session.user.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{session.user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Github className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Connected via GitHub</span>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                title: "Appearance",
                icon: <Palette className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                content: (
                  <div className="flex gap-2">
                    {["light", "dark", "system"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`px-3 py-1 border text-sm ${
                          theme === t
                            ? "border-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                            : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                ),
              },
              {
                title: "AI Configuration",
                icon: <Bot className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                content: (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">AI Provider</label>
                      <select
                        value={settings.aiProvider}
                        onChange={(e) => handleSettingChange("aiProvider", e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-800"
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI GPT</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Max Tokens: {settings.maxTokens}</label>
                      <input
                        type="range"
                        min="100"
                        max="2000"
                        step="100"
                        value={settings.maxTokens}
                        onChange={(e) => handleSettingChange("maxTokens", Number.parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Temperature: {settings.temperature}</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.temperature}
                        onChange={(e) => handleSettingChange("temperature", Number.parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={settings.autoSuggestFiles}
                          onChange={(e) => handleSettingChange("autoSuggestFiles", e.target.checked)}
                        />
                        Auto-suggest relevant files
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={settings.saveConversations}
                          onChange={(e) => handleSettingChange("saveConversations", e.target.checked)}
                        />
                        Save conversation history
                      </label>
                    </div>
                  </div>
                ),
              },
              {
                title: "API Keys",
                icon: <Key className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                content: (
                  <div>
                    <button
                      onClick={() => setShowApiKeys(!showApiKeys)}
                      className="text-sm underline text-blue-600 dark:text-blue-400"
                    >
                      {showApiKeys ? "Hide API Keys" : "Show API Keys"}
                    </button>
                    {showApiKeys && (
                      <div className="mt-3 space-y-2 text-sm font-mono">
                        <div>Gemini API Key: {process.env.GEMINI_API_KEY ? "••••••••" : "Not configured"}</div>
                        <div>OpenAI API Key: {process.env.OPENAI_API_KEY ? "••••••••" : "Not configured"}</div>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: "Database",
                icon: <Database className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                content: (
                  <div className="flex items-center gap-2 text-sm">
                    <span>MongoDB:</span>
                    <span
                      className={`font-medium ${
                        process.env.MONGODB_URI ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {process.env.MONGODB_URI ? "Connected" : "Not configured"}
                    </span>
                  </div>
                ),
              },
            ].map((section, idx) => (
              <div key={idx} className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className="flex items-center gap-2 mb-3 border-b pb-1 border-gray-200 dark:border-gray-700">
                  {section.icon}
                  <h2 className="text-lg font-semibold">{section.title}</h2>
                </div>
                {section.content}
              </div>
            ))}

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium border border-blue-700"
              >
                <Save className="w-4 h-4 inline-block mr-1" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
