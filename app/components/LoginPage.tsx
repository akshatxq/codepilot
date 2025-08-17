"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { Github, Code2, Zap, Shield, Brain, AlertTriangle } from "lucide-react"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("github", { callbackUrl: "/dashboard" })
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white dark:bg-gray-800 shadow-lg border border-gray-300 dark:border-gray-700">
        {/* Codeforces-like header */}
        <div className="bg-blue-600 dark:bg-blue-800 text-white p-4 border-b border-blue-700 dark:border-blue-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Code2 className="h-7 w-7" />
              <h1 className="text-2xl font-bold">CodePilot AI</h1>
            </div>
            <div className="text-md font-medium"></div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 p-8">
          {/* Left side - Login Box (enlarged and sharp edges) */}
          <div className="border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-300 dark:border-gray-700">
              SIGN IN WITH GITHUB
            </h2>
            
            <div className="space-y-6">
              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-6 py-3 border border-gray-400 dark:border-gray-600 text-md font-bold text-white bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin mr-3" />
                ) : (
                  <Github className="w-5 h-5 mr-3" />
                )}
                {isLoading ? "AUTHENTICATING..." : "CONTINUE WITH GITHUB"}
              </button>

              <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-4 flex items-start border border-yellow-300 dark:border-yellow-700">
                <AlertTriangle className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-sm">
                  <strong>NOTE:</strong> We require read access to your public repositories to provide code insights. Private repositories are never accessed without explicit permission.
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Features (enlarged and sharp edges) */}
          <div className="space-y-8">
            <div className="border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-300 dark:border-gray-700">
                KEY FEATURES
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 border border-blue-200 dark:border-blue-800">
                    <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">AI CODE ANALYSIS</h4>
                    <p className="text-md text-gray-600 dark:text-gray-400">
                      Deep analysis of your codebase with intelligent suggestions and pattern recognition
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 border border-green-200 dark:border-green-800">
                    <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">INSTANT ANSWERS</h4>
                    <p className="text-md text-gray-600 dark:text-gray-400">
                      Get immediate explanations for any part of your code with our AI assistant
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-3 border border-purple-200 dark:border-purple-800">
                    <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">SECURE & PRIVATE</h4>
                    <p className="text-md text-gray-600 dark:text-gray-400">
                      Enterprise-grade security with strict access controls and encryption
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Why CodePilot AI?
              </h2>
              <p className="text-md text-gray-600 dark:text-gray-400">
              CodePilot AI helps developers understand complex codebases faster with AI-powered analysis and intelligent Q&A. Perfect for onboarding, code reviews, and legacy code exploration.
              </p>
            </div>
          </div>
        </div>

        {/* Codeforces-like footer */}
        <div className="bg-gray-100 dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 p-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <div className="font-bold mb-1">CODEPILOT AI</div>
          <div>© {new Date().getFullYear()} All Rights Reserved</div>
        </div>
      </div>
    </div>
  )
}