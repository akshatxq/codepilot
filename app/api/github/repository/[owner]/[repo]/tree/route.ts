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
    const path = searchParams.get("path") || ""
    const recursive = searchParams.get("recursive") === "true"

    // Fetch repository tree from GitHub API
    const url = recursive
      ? `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`
      : `https://api.github.com/repos/${owner}/${repo}/contents/${path}`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CodePilot-AI",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Path not found" }, { status: 404 })
      }
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const data = await response.json()

    if (recursive) {
      // Format tree data for recursive request
      const formattedTree = data.tree.map((item: any) => ({
        name: item.path.split("/").pop(),
        path: item.path,
        type: item.type,
        size: item.size,
        sha: item.sha,
      }))

      return NextResponse.json({ tree: formattedTree })
    } else {
      // Format contents data for non-recursive request
      const formattedContents = Array.isArray(data)
        ? data.map((item: any) => ({
            name: item.name,
            path: item.path,
            type: item.type,
            size: item.size,
            sha: item.sha,
            download_url: item.download_url,
          }))
        : [
            {
              name: data.name,
              path: data.path,
              type: data.type,
              size: data.size,
              sha: data.sha,
              download_url: data.download_url,
            },
          ]

      return NextResponse.json(formattedContents)
    }
  } catch (error) {
    console.error("Error fetching repository tree:", error)
    return NextResponse.json({ error: "Failed to fetch repository tree" }, { status: 500 })
  }
}
