import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
export async function GET(request: NextRequest, { params }: { params: { owner: string; repo: string } }) {
  try {
    const session = await getServerSession(authOptions)
    console.log("Session from getServerSession():", session);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { owner, repo } = params
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path")

    if (!path) {
      return NextResponse.json({ error: "Path parameter is required" }, { status: 400 })
    }

    // Fetch file content from GitHub API
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CodePilot-AI",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "File not found" }, { status: 404 })
      }
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const data = await response.json()

    // Check if it's a file (not a directory)
    if (data.type !== "file") {
      return NextResponse.json({ error: "Path is not a file" }, { status: 400 })
    }

    // Decode base64 content
    const content = Buffer.from(data.content, "base64").toString("utf-8")

    const formattedFile = {
      name: data.name,
      path: data.path,
      size: data.size,
      sha: data.sha,
      content: content,
      encoding: data.encoding,
      download_url: data.download_url,
    }

    return NextResponse.json(formattedFile)
  } catch (error) {
    console.error("Error fetching file:", error)
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 })
  }
}
