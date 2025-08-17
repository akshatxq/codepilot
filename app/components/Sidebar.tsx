"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"
import {
  Home,
  Settings,
  LogOut,
  Menu,
  X,
  Github,
  MessageSquare,
  Code2,
  User,
} from "lucide-react"

export default function Sidebar() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      current: pathname === "/dashboard",
    },
    {
      name: "Repositories",
      href: "/dashboard",
      icon: Github,
      current: pathname.startsWith("/repository"),
    },
    {
      name: "AI Chat",
      href: "/dashboard",
      icon: MessageSquare,
      current: pathname.startsWith("/chat"),
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      current: pathname === "/settings",
    },
  ]

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  return (
    <div
      className={`bg-white dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-14" : "w-56"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-300 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Code2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-gray-900 dark:text-white">
              CodePilot AI
            </span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {isCollapsed ? (
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1 text-sm">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center space-x-3 px-2 py-2 rounded border ${
                item.current
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "border-transparent text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600"
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </button>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-300 dark:border-gray-700 p-3 text-sm">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0">
            {session?.user?.image ? (
              <img
                className="h-7 w-7 rounded-full border border-gray-400 dark:border-gray-600"
                src={session.user.image || "/placeholder.svg"}
                alt={session.user.name || "User"}
              />
            ) : (
              <div className="h-7 w-7 rounded-full border border-gray-400 dark:border-gray-600 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {session?.user?.name || "User"}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {session?.user?.email}
              </span>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={handleSignOut}
            className="mt-3 w-full flex items-center space-x-2 px-2 py-1.5 border border-gray-400 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        )}
      </div>
    </div>
  )
}
