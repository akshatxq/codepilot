const express = require("express")
const axios = require("axios")
const { GoogleGenerativeAI } = require("@google/generative-ai")
const OpenAI = require("openai")
const Conversation = require("../models/Conversation")

const router = express.Router()

// Use actual environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// Initialize AI clients with error handling
let genAI = null
let openai = null

if (GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY") {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    console.log("✅ Gemini AI client initialized")
  } catch (error) {
    console.error("❌ Failed to initialize Gemini AI:", error.message)
  }
}

if (OPENAI_API_KEY && OPENAI_API_KEY !== "YOUR_OPENAI_API_KEY") {
  try {
    openai = new OpenAI({ apiKey: OPENAI_API_KEY })
    console.log("✅ OpenAI client initialized")
  } catch (error) {
    console.error("❌ Failed to initialize OpenAI:", error.message)
  }
}

// GitHub API helper
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

// Get conversation history
router.get("/conversations/:owner/:repo", async (req, res) => {
  try {
    const { owner, repo } = req.params

    const conversation = await Conversation.findOne({
      userId: req.user._id,
      repositoryOwner: owner,
      repositoryName: repo,
    })

    res.json(conversation || { messages: [] })
  } catch (error) {
    console.error("Failed to fetch conversation:", error)
    res.status(500).json({ error: "Failed to fetch conversation" })
  }
})

// Send message to AI
router.post("/chat/:owner/:repo", async (req, res) => {
  try {
    const { owner, repo } = req.params
    const { message, history = [] } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" })
    }

    console.log(`🤖 Processing AI chat for ${owner}/${repo}`)

    // Check if AI is available
    const aiProvider = req.user.settings?.aiProvider || "gemini"

    if (aiProvider === "gemini" && !genAI) {
      return res.status(503).json({
        error: "Gemini AI is not available. Please check your API key or switch to OpenAI in settings.",
      })
    }

    if (aiProvider === "openai" && !openai) {
      return res.status(503).json({
        error: "OpenAI is not available. Please check your API key or switch to Gemini in settings.",
      })
    }

    // Get repository context
    const repoContext = await getRepositoryContext(req.user.accessToken, owner, repo, message)

    // Generate AI response
    const aiResponse = await generateAIResponse(aiProvider, message, repoContext, history, req.user.settings)

    // Save conversation
    await saveConversation(req.user._id, owner, repo, message, aiResponse)

    res.json({
      response: aiResponse.content,
      suggestedFiles: aiResponse.suggestedFiles || [],
    })
  } catch (error) {
    console.error("❌ AI chat error:", error)
    res.status(500).json({
      error: "Failed to process AI request",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Clear conversation history
router.delete("/conversations/:owner/:repo", async (req, res) => {
  try {
    const { owner, repo } = req.params

    await Conversation.findOneAndDelete({
      userId: req.user._id,
      repositoryOwner: owner,
      repositoryName: repo,
    })

    res.json({ message: "Conversation cleared successfully" })
  } catch (error) {
    console.error("Failed to clear conversation:", error)
    res.status(500).json({ error: "Failed to clear conversation" })
  }
})

// Helper function to get repository context
async function getRepositoryContext(accessToken, owner, repo, userMessage) {
  try {
    const github = createGitHubAPI(accessToken)

    console.log(`📁 Fetching repository context for ${owner}/${repo}`)

    // Get repository information
    const repoResponse = await github.get(`/repos/${owner}/${repo}`)
    const repository = repoResponse.data

    // Get file tree (limited to avoid token limits)
    const treeResponse = await github.get(`/repos/${owner}/${repo}/git/trees/HEAD`, {
      params: { recursive: 1 },
    })

    const files = treeResponse.data.tree
      .filter((item) => item.type === "blob")
      .slice(0, 100) // Limit files to avoid token limits
      .map((file) => ({
        path: file.path,
        size: file.size,
      }))

    console.log(`📄 Found ${files.length} files in repository`)

    // Try to get relevant files based on user message
    const relevantFiles = await getRelevantFiles(github, owner, repo, userMessage, files)

    console.log(`🎯 Found ${relevantFiles.length} relevant files`)

    return {
      repository: {
        name: repository.name,
        description: repository.description,
        language: repository.language,
        topics: repository.topics || [],
      },
      files: files,
      relevantFiles: relevantFiles,
    }
  } catch (error) {
    console.error("❌ Failed to get repository context:", error)
    return {
      repository: { name: repo },
      files: [],
      relevantFiles: [],
    }
  }
}

// Helper function to get relevant files based on user message
async function getRelevantFiles(github, owner, repo, userMessage, files) {
  const relevantFiles = []
  const keywords = extractKeywords(userMessage.toLowerCase())

  // Score files based on relevance to user message
  const scoredFiles = files.map((file) => {
    let score = 0
    const filePath = file.path.toLowerCase()
    const fileName = file.path.split("/").pop().toLowerCase()

    // Check for keyword matches in file path
    keywords.forEach((keyword) => {
      if (filePath.includes(keyword)) score += 3
      if (fileName.includes(keyword)) score += 5
    })

    // Boost score for common important files
    const importantPatterns = [
      /package\.json$/,
      /readme\.md$/i,
      /index\.(js|ts|jsx|tsx)$/,
      /app\.(js|ts|jsx|tsx)$/,
      /main\.(js|ts|jsx|tsx)$/,
      /server\.(js|ts)$/,
      /config\.(js|ts|json)$/,
      /\.env/,
      /docker/i,
      /makefile$/i,
    ]

    importantPatterns.forEach((pattern) => {
      if (pattern.test(filePath)) score += 2
    })

    return { ...file, score }
  })

  // Get top 5 relevant files
  const topFiles = scoredFiles
    .filter((file) => file.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  // Fetch content for top relevant files
  for (const file of topFiles) {
    try {
      if (file.size < 50000) {
        // Only fetch files smaller than 50KB
        const response = await github.get(`/repos/${owner}/${repo}/contents/${file.path}`)
        const content = Buffer.from(response.data.content, "base64").toString("utf-8")

        relevantFiles.push({
          path: file.path,
          content: content.substring(0, 2000), // Limit content to avoid token limits
          score: file.score,
        })
      }
    } catch (error) {
      console.error(`❌ Failed to fetch file ${file.path}:`, error.message)
    }
  }

  return relevantFiles
}

// Helper function to extract keywords from user message
function extractKeywords(message) {
  const commonWords = [
    "the",
    "is",
    "at",
    "which",
    "on",
    "and",
    "a",
    "to",
    "are",
    "as",
    "was",
    "with",
    "for",
    "this",
    "that",
    "it",
    "in",
    "or",
    "be",
    "an",
    "have",
    "i",
    "you",
    "he",
    "she",
    "we",
    "they",
    "where",
    "how",
    "what",
    "when",
    "why",
    "can",
    "could",
    "would",
    "should",
    "do",
    "does",
    "did",
  ]

  return message
    .split(/\s+/)
    .filter((word) => word.length > 2 && !commonWords.includes(word))
    .slice(0, 10) // Limit to 10 keywords
}

// Helper function to generate AI response
async function generateAIResponse(provider, userMessage, context, history, settings) {
  const systemPrompt = `You are CodePilot AI, an intelligent code assistant. You help developers understand and navigate codebases.

Repository Context:
- Name: ${context.repository.name}
- Description: ${context.repository.description || "No description"}
- Primary Language: ${context.repository.language || "Unknown"}
- Topics: ${context.repository.topics.join(", ") || "None"}

Available Files (${context.files.length} total):
${context.files
  .slice(0, 20)
  .map((f) => `- ${f.path}`)
  .join("\n")}

Relevant File Contents:
${context.relevantFiles
  .map(
    (f) => `
File: ${f.path}
Content Preview:
${f.content}
---`,
  )
  .join("\n")}

Instructions:
1. Provide helpful, accurate answers about the codebase
2. Reference specific files and line numbers when possible
3. Suggest relevant files for the user to explore
4. Be concise but informative
5. If you're not sure about something, say so

User Question: ${userMessage}`

  try {
    if (provider === "gemini" && genAI) {
      console.log("🤖 Using Gemini AI")
      const model = genAI.getGenerativeModel({ model: "gemini-pro" })
      const result = await model.generateContent(systemPrompt)
      const response = await result.response

      return {
        content: response.text(),
        suggestedFiles: extractSuggestedFiles(response.text(), context.files),
      }
    } else if (provider === "openai" && openai) {
      console.log("🤖 Using OpenAI")
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          ...history.slice(-10).map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
        max_tokens: settings?.maxTokens || 2000,
        temperature: settings?.temperature || 0.7,
      })

      return {
        content: completion.choices[0].message.content,
        suggestedFiles: extractSuggestedFiles(completion.choices[0].message.content, context.files),
      }
    } else {
      // Fallback response when AI is not available
      return {
        content: `I'm sorry, but the AI service (${provider}) is currently not available. This could be due to:

1. Missing or invalid API key
2. API service is down
3. Rate limits exceeded

Please check your API configuration in the settings or try again later.

In the meantime, I can see you're asking about the ${context.repository.name} repository. Here are some files that might be relevant:

${context.files
  .slice(0, 10)
  .map((f) => `- ${f.path}`)
  .join("\n")}`,
        suggestedFiles: context.files.slice(0, 5).map((f) => ({ path: f.path, relevance: 1 })),
      }
    }
  } catch (error) {
    console.error(`❌ ${provider} API error:`, error)

    // Return a helpful error message
    return {
      content: `I encountered an error while processing your request with ${provider}:

${error.message}

This might be due to:
1. API rate limits
2. Invalid API key
3. Network connectivity issues
4. Service temporarily unavailable

Please try again in a moment, or switch to a different AI provider in your settings.`,
      suggestedFiles: [],
    }
  }
}

// Helper function to extract suggested files from AI response
function extractSuggestedFiles(responseText, availableFiles) {
  const suggestedFiles = []
  const filePathRegex =
    /([a-zA-Z0-9_\-/.]+\.(js|ts|jsx|tsx|py|java|cpp|c|php|rb|go|rs|swift|kt|html|css|scss|json|xml|yaml|yml|md|txt))/g

  const matches = responseText.match(filePathRegex) || []

  matches.forEach((match) => {
    const file = availableFiles.find((f) => f.path.includes(match) || match.includes(f.path))
    if (file && !suggestedFiles.find((sf) => sf.path === file.path)) {
      suggestedFiles.push({
        path: file.path,
        relevance: 1,
      })
    }
  })

  return suggestedFiles.slice(0, 5) // Limit to 5 suggestions
}

// Helper function to save conversation
async function saveConversation(userId, owner, repo, userMessage, aiResponse) {
  try {
    let conversation = await Conversation.findOne({
      userId,
      repositoryOwner: owner,
      repositoryName: repo,
    })

    if (!conversation) {
      conversation = new Conversation({
        userId,
        repositoryOwner: owner,
        repositoryName: repo,
        messages: [],
      })
    }

    // Add user message
    conversation.messages.push({
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    })

    // Add AI response
    conversation.messages.push({
      role: "assistant",
      content: aiResponse.content,
      suggestedFiles: aiResponse.suggestedFiles,
      timestamp: new Date(),
    })

    // Keep only last 50 messages to avoid document size limits
    if (conversation.messages.length > 50) {
      conversation.messages = conversation.messages.slice(-50)
    }

    await conversation.save()
    console.log("💾 Conversation saved successfully")
  } catch (error) {
    console.error("❌ Failed to save conversation:", error)
  }
}

module.exports = router
