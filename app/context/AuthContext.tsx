"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import axios from "axios"

interface User {
  id: string
  githubId: string
  login: string
  name: string
  email: string
  avatar_url: string
  html_url: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  checkAuth: () => Promise<void>
  loginWithGitHub: () => void
  handleOAuthCallback: (code: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
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
    } catch (error: any) {
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    console.log("🔄 Redirecting to GitHub OAuth...")
    window.location.href = `${apiUrl}/api/auth/github`
  }, [])

  // Handle OAuth callback
  const handleOAuthCallback = useCallback(async (code: string) => {
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
    } catch (error: any) {
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
