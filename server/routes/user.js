const express = require("express")
const User = require("../models/User")
const Conversation = require("../models/Conversation")

const router = express.Router()

// Get user settings
router.get("/settings", async (req, res) => {
  try {
    res.json(req.user.settings)
  } catch (error) {
    console.error("Failed to fetch user settings:", error)
    res.status(500).json({ error: "Failed to fetch settings" })
  }
})

// Update user settings
router.put("/settings", async (req, res) => {
  try {
    const { aiProvider, maxTokens, temperature, notifications } = req.body

    // Validate settings
    const validProviders = ["gemini", "openai"]
    if (aiProvider && !validProviders.includes(aiProvider)) {
      return res.status(400).json({ error: "Invalid AI provider" })
    }

    if (maxTokens && (maxTokens < 500 || maxTokens > 4000)) {
      return res.status(400).json({ error: "Max tokens must be between 500 and 4000" })
    }

    if (temperature && (temperature < 0 || temperature > 1)) {
      return res.status(400).json({ error: "Temperature must be between 0 and 1" })
    }

    // Update settings
    const updateData = {}
    if (aiProvider !== undefined) updateData["settings.aiProvider"] = aiProvider
    if (maxTokens !== undefined) updateData["settings.maxTokens"] = maxTokens
    if (temperature !== undefined) updateData["settings.temperature"] = temperature
    if (notifications !== undefined) updateData["settings.notifications"] = notifications

    await User.findByIdAndUpdate(req.user._id, updateData)

    res.json({ message: "Settings updated successfully" })
  } catch (error) {
    console.error("Failed to update user settings:", error)
    res.status(500).json({ error: "Failed to update settings" })
  }
})

// Clear all user data
router.delete("/data", async (req, res) => {
  try {
    // Delete all conversations for this user
    await Conversation.deleteMany({ userId: req.user._id })

    // Reset user settings to defaults
    await User.findByIdAndUpdate(req.user._id, {
      "settings.aiProvider": "gemini",
      "settings.maxTokens": 2000,
      "settings.temperature": 0.7,
      "settings.notifications": true,
    })

    res.json({ message: "All user data cleared successfully" })
  } catch (error) {
    console.error("Failed to clear user data:", error)
    res.status(500).json({ error: "Failed to clear user data" })
  }
})

module.exports = router
