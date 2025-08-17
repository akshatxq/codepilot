const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
    },
    login: {
      type: String,
      required: true,
    },
    name: String,
    email: String,
    avatar_url: String,
    html_url: String,
    accessToken: {
      type: String,
      required: true,
    },
    settings: {
      aiProvider: {
        type: String,
        enum: ["gemini", "openai"],
        default: "gemini",
      },
      maxTokens: {
        type: Number,
        default: 2000,
        min: 500,
        max: 4000,
      },
      temperature: {
        type: Number,
        default: 0.7,
        min: 0,
        max: 1,
      },
      notifications: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
userSchema.index({ githubId: 1 })
userSchema.index({ login: 1 })

module.exports = mongoose.model("User", userSchema)
