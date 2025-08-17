import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import {Providers} from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const viewport = "width=device-width, initial-scale=1"

export const metadata: Metadata = {
  title: "CodePilot AI - Intelligent Code Assistant",
  description: "AI-powered code exploration and assistance platform for GitHub repositories",
  keywords: ["AI", "Code Assistant", "GitHub", "Developer Tools", "Code Analysis"],
  authors: [{ name: "CodePilot AI Team" }],
  openGraph: {
    title: "CodePilot AI",
    description: "AI-powered code exploration and assistance platform",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
