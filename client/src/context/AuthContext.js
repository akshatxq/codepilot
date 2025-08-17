"use client"

import { createContext, useContext, useState, useCallback } from "react"
import axios from "axios"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setLoading(false)
        return
      }

      // Set authorization header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`

      console.log("🔄 Checking authentication status...")
      const response = await axios.get("/api/auth/me")
      setUser(response.data.user)
      console.log("✅ User authenticated:", response.data.user.login)
    } catch (error) {
      console.error("❌ Auth check failed:", error.response?.data || error.message)
      localStorage.removeItem("token")
      delete axios.defaults.headers.common["Authorization"]
    } finally {
      setLoading(false)
    }
  }, [])

  // Login with GitHub
  const loginWithGitHub = useCallback(() => {
    // Redirect to GitHub OAuth
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000"
    console.log("🔄 Redirecting to GitHub OAuth...")
    window.location.href = `${apiUrl}/api/auth/github`
  }, [])

  // Handle OAuth callback
  const handleOAuthCallback = useCallback(async (code) => {
    try {
      setLoading(true)
      console.log("🔄 Processing OAuth callback...")

      const response = await axios.post("/api/auth/github/callback", { code })

      const { token, user: userData } = response.data

      // Store token and set authorization header
      localStorage.setItem("token", token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`

      setUser(userData)
      console.log("✅ Authentication successful:", userData.login)

      // Redirect to dashboard
      window.location.href = "/"

      return true
    } catch (error) {
      console.error("❌ OAuth callback failed:", error.response?.data || error.message)

      // Show user-friendly error message
      const errorMessage = error.response?.data?.error || "Authentication failed"
      alert(`Authentication failed: ${errorMessage}. Please try again.`)

      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Logout
  const logout = useCallback(() => {
    console.log("🔄 Logging out user...")
    localStorage.removeItem("token")
    delete axios.defaults.headers.common["Authorization"]
    setUser(null)
    console.log("✅ User logged out successfully")
  }, [])

  const value = {
    user,
    loading,
    checkAuth,
    loginWithGitHub,
    handleOAuthCallback,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
