const express = require("express")
const axios = require("axios")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const authMiddleware = require("../middleware/auth")

const router = express.Router()

// Use actual environment variables
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000"
const JWT_SECRET = process.env.JWT_SECRET

// Validate required environment variables
if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !JWT_SECRET) {
  console.error("❌ Missing required environment variables:")
  if (!GITHUB_CLIENT_ID) console.error("  - GITHUB_CLIENT_ID")
  if (!GITHUB_CLIENT_SECRET) console.error("  - GITHUB_CLIENT_SECRET")
  if (!JWT_SECRET) console.error("  - JWT_SECRET")
  process.exit(1)
}

// GitHub OAuth - Redirect to GitHub
router.get("/github", (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo,user:email&redirect_uri=${CLIENT_URL}`
  res.redirect(githubAuthUrl)
})

// GitHub OAuth - Handle callback
router.post("/github/callback", async (req, res) => {
  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({ error: "Authorization code is required" })
    }

    console.log("🔄 Processing GitHub OAuth callback...")

    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      },
    )

    const accessToken = tokenResponse.data.access_token

    if (!accessToken) {
      console.error("❌ Failed to get access token from GitHub")
      return res.status(400).json({ error: "Failed to get access token" })
    }

    console.log("✅ Successfully obtained GitHub access token")

    // Get user information from GitHub
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
        "User-Agent": "CodePilot-AI",
      },
    })

    const githubUser = userResponse.data
    console.log(`✅ Retrieved GitHub user: ${githubUser.login}`)

    // Find or create user in database
    let user = await User.findOne({ githubId: githubUser.id.toString() })

    if (user) {
      // Update existing user
      user.login = githubUser.login
      user.name = githubUser.name
      user.email = githubUser.email
      user.avatar_url = githubUser.avatar_url
      user.html_url = githubUser.html_url
      user.accessToken = accessToken
      await user.save()
      console.log(`✅ Updated existing user: ${user.login}`)
    } else {
      // Create new user
      user = new User({
        githubId: githubUser.id.toString(),
        login: githubUser.login,
        name: githubUser.name,
        email: githubUser.email,
        avatar_url: githubUser.avatar_url,
        html_url: githubUser.html_url,
        accessToken: accessToken,
      })
      await user.save()
      console.log(`✅ Created new user: ${user.login}`)
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" })

    // Return user data and token
    res.json({
      token,
      user: {
        id: user._id,
        githubId: user.githubId,
        login: user.login,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        html_url: user.html_url,
      },
    })
  } catch (error) {
    console.error("❌ GitHub OAuth error:", error.response?.data || error.message)
    res.status(500).json({
      error: "Authentication failed",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Get current user
router.get("/me", authMiddleware, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      githubId: req.user.githubId,
      login: req.user.login,
      name: req.user.name,
      email: req.user.email,
      avatar_url: req.user.avatar_url,
      html_url: req.user.html_url,
    },
  })
})

module.exports = router
