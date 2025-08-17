import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    console.log("Session in API route:", session)
    console.log("Access token in session:", session?.accessToken ? "Present" : "Missing")

    if (!session?.accessToken) {
      console.log("No session or access token found:", session)
      return NextResponse.json({ error: "Unauthorized - No access token" }, { status: 401 })
    }

    console.log("Making GitHub API request with token:", session.accessToken?.substring(0, 10) + "...")

    // Fetch user repositories from GitHub API
    const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CodePilot-AI",
      },
    })

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status}`)
      const errorText = await response.text()
      console.error("GitHub API error response:", errorText)
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const repositories = await response.json()

    // Filter and format repository data
    const formattedRepos = repositories.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      language: repo.language,
      updated_at: repo.updated_at,
      private: repo.private,
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
      },
    }))

    return NextResponse.json(formattedRepos)
  } catch (error) {
    console.error("Error fetching repositories:", error)
    return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 500 })
  }
}
