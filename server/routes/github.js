const express = require("express")
const axios = require("axios")
const Repository = require("../models/Repository")

const router = express.Router()

// GitHub API base configuration
const createGitHubAPI = (accessToken) => {
  return axios.create({
    baseURL: "https://api.github.com",
    headers: {
      Authorization: `token ${accessToken}`,
      "User-Agent": "CodePilot-AI",
      Accept: "application/vnd.github.v3+json",
    },
  })
}

// Get user repositories
router.get("/repositories", async (req, res) => {
  try {
    const { sort = "updated", per_page = 100 } = req.query
    const github = createGitHubAPI(req.user.accessToken)

    const response = await github.get("/user/repos", {
      params: {
        sort,
        per_page,
        affiliation: "owner,collaborator",
      },
    })

    const repositories = response.data

    // Cache repositories in database for faster future access
    for (const repo of repositories) {
      await Repository.findOneAndUpdate(
        { githubId: repo.id },
        {
          githubId: repo.id,
          owner: {
            login: repo.owner.login,
            avatar_url: repo.owner.avatar_url,
          },
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          clone_url: repo.clone_url,
          language: repo.language,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          watchers_count: repo.watchers_count,
          size: repo.size,
          default_branch: repo.default_branch,
          topics: repo.topics || [],
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          pushed_at: repo.pushed_at,
          cachedBy: req.user._id,
        },
        { upsert: true, new: true },
      )
    }

    res.json(repositories)
  } catch (error) {
    console.error("Failed to fetch repositories:", error)
    res.status(500).json({ error: "Failed to fetch repositories" })
  }
})

// Get specific repository
router.get("/repository/:owner/:repo", async (req, res) => {
  try {
    const { owner, repo } = req.params
    const github = createGitHubAPI(req.user.accessToken)

    const response = await github.get(`/repos/${owner}/${repo}`)
    res.json(response.data)
  } catch (error) {
    console.error("Failed to fetch repository:", error)
    res.status(500).json({ error: "Failed to fetch repository" })
  }
})

// Get repository file tree
router.get("/repository/:owner/:repo/tree", async (req, res) => {
  try {
    const { owner, repo } = req.params
    const github = createGitHubAPI(req.user.accessToken)

    // Check if we have cached file tree
    const cachedRepo = await Repository.findOne({
      "owner.login": owner,
      name: repo,
    })

    const cacheExpiry = 10 * 60 * 1000 // 10 minutes
    const now = new Date()

    if (
      cachedRepo &&
      cachedRepo.fileTree &&
      cachedRepo.fileTreeLastUpdated &&
      now - cachedRepo.fileTreeLastUpdated < cacheExpiry
    ) {
      return res.json(cachedRepo.fileTree)
    }

    // Fetch fresh file tree from GitHub
    const response = await github.get(`/repos/${owner}/${repo}/git/trees/HEAD`, {
      params: { recursive: 1 },
    })

    const tree = response.data.tree

    // Build hierarchical file tree
    const fileTree = buildFileTree(tree)

    // Cache the file tree
    if (cachedRepo) {
      cachedRepo.fileTree = fileTree
      cachedRepo.fileTreeLastUpdated = now
      await cachedRepo.save()
    }

    res.json(fileTree)
  } catch (error) {
    console.error("Failed to fetch file tree:", error)
    res.status(500).json({ error: "Failed to fetch file tree" })
  }
})

// Get file content
router.get("/repository/:owner/:repo/file", async (req, res) => {
  try {
    const { owner, repo } = req.params
    const { path } = req.query
    const github = createGitHubAPI(req.user.accessToken)

    const response = await github.get(`/repos/${owner}/${repo}/contents/${path}`)
    const file = response.data

    if (file.type !== "file") {
      return res.status(400).json({ error: "Path is not a file" })
    }

    // Decode base64 content
    const content = Buffer.from(file.content, "base64").toString("utf-8")

    res.json({
      path: file.path,
      name: file.name,
      size: file.size,
      content: content,
      sha: file.sha,
    })
  } catch (error) {
    console.error("Failed to fetch file content:", error)
    res.status(500).json({ error: "Failed to fetch file content" })
  }
})

// Helper function to build hierarchical file tree
function buildFileTree(flatTree) {
  const root = []
  const pathMap = new Map()

  // Sort by path to ensure proper hierarchy
  flatTree.sort((a, b) => a.path.localeCompare(b.path))

  for (const item of flatTree) {
    const parts = item.path.split("/")
    let currentLevel = root
    let currentPath = ""

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      currentPath = currentPath ? `${currentPath}/${part}` : part

      let existingItem = currentLevel.find((child) => child.name === part)

      if (!existingItem) {
        const isFile = i === parts.length - 1 && item.type === "blob"

        existingItem = {
          name: part,
          path: currentPath,
          type: isFile ? "blob" : "tree",
          children: isFile ? undefined : [],
        }

        currentLevel.push(existingItem)
        pathMap.set(currentPath, existingItem)
      }

      if (existingItem.children) {
        currentLevel = existingItem.children
      }
    }
  }

  return root
}

module.exports = router
