const mongoose = require("mongoose")

const repositorySchema = new mongoose.Schema(
  {
    githubId: {
      type: Number,
      required: true,
    },
    owner: {
      login: String,
      avatar_url: String,
    },
    name: {
      type: String,
      required: true,
    },
    full_name: {
      type: String,
      required: true,
    },
    description: String,
    html_url: String,
    clone_url: String,
    language: String,
    stargazers_count: Number,
    forks_count: Number,
    watchers_count: Number,
    size: Number,
    default_branch: String,
    topics: [String],
    created_at: Date,
    updated_at: Date,
    pushed_at: Date,
    // Cached file tree for faster access
    fileTree: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    fileTreeLastUpdated: Date,
    // User who cached this repo
    cachedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for efficient queries
repositorySchema.index({ githubId: 1 })
repositorySchema.index({ full_name: 1 })
repositorySchema.index({ "owner.login": 1, name: 1 })
repositorySchema.index({ cachedBy: 1, updated_at: -1 })

module.exports = mongoose.model("Repository", repositorySchema)
