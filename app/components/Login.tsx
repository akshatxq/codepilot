"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Github, Code, Zap, Shield } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import LoadingSpinner from "./LoadingSpinner"

export default function Login() {
  const { loginWithGitHub, handleOAuthCallback, loading } = useAuth()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Handle OAuth callback
    const code = searchParams.get("code")
    if (code) {
      console.log("🔄 Processing OAuth callback with code:", code.substring(0, 10) + "...")
      handleOAuthCallback(code)
    }
  }, [searchParams, handleOAuthCallback])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Authenticating with GitHub...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary-600 p-3 rounded-xl">
              <Code className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">CodePilot AI</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">Your intelligent code exploration companion</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
            <Github className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">GitHub Integration</h3>
            <p className="text-gray-600 dark:text-gray-300">Seamlessly browse and explore your GitHub repositories</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
            <Zap className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI-Powered Assistant</h3>
            <p className="text-gray-600 dark:text-gray-300">Get intelligent answers about your codebase instantly</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
            <Shield className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Secure & Private</h3>
            <p className="text-gray-600 dark:text-gray-300">Your code stays secure with encrypted connections</p>
          </div>
        </div>

        {/* Login Button */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Get Started</h2>
          <button
            onClick={() => {
              console.log("🔄 Initiating GitHub OAuth login...")
              loginWithGitHub()
            }}
            className="flex items-center justify-center w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            <Github className="h-5 w-5 mr-3" />
            Continue with GitHub
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
            We'll only access your public repositories and basic profile information
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">Built with ❤️ for developers who love clean code</p>
        </div>
      </div>
    </div>
  )
}
