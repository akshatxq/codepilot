

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

    // Fetch repository details from GitHub API
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CodePilot-AI",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Repository not found" }, { status: 404 })
      }
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const repository = await response.json()

    // Format repository data
    const formattedRepo = {
      id: repository.id,
      name: repository.name,
      full_name: repository.full_name,
      description: repository.description,
      html_url: repository.html_url,
      clone_url: repository.clone_url,
      stargazers_count: repository.stargazers_count,
      forks_count: repository.forks_count,
      language: repository.language,
      languages_url: repository.languages_url,
      updated_at: repository.updated_at,
      created_at: repository.created_at,
      private: repository.private,
      default_branch: repository.default_branch,
      owner: {
        login: repository.owner.login,
        avatar_url: repository.owner.avatar_url,
      },
    }

    return NextResponse.json(formattedRepo)
  } catch (error) {
    console.error("Error fetching repository:", error)
    return NextResponse.json({ error: "Failed to fetch repository" }, { status: 500 })
  }
}
