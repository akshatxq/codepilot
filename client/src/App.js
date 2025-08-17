"use client"

import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import axios from "axios"

// Components
import Sidebar from "./components/Sidebar"
import Dashboard from "./components/Dashboard"
import Login from "./components/Login"
import RepositoryView from "./components/RepositoryView"
import AIChat from "./components/AIChat"
import Settings from "./components/Settings"
import LoadingSpinner from "./components/LoadingSpinner"

// Context
import { AuthProvider, useAuth } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000"

function AppContent() {
  const { user, loading, checkAuth } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-16"}`}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/repository/:owner/:repo" element={<RepositoryView />} />
          <Route path="/chat/:owner/:repo" element={<AIChat />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
