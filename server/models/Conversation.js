const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  suggestedFiles: [
    {
      path: String,
      lines: String,
      relevance: Number,
    },
  ],
  timestamp: {
    type: Date,
    default: Date.now,
  },
})

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    repositoryOwner: {
      type: String,
      required: true,
    },
    repositoryName: {
      type: String,
      required: true,
    },
    messages: [messageSchema],
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Compound index for efficient queries
conversationSchema.index({ userId: 1, repositoryOwner: 1, repositoryName: 1 })
conversationSchema.index({ lastActivity: -1 })

// Update lastActivity on save
conversationSchema.pre("save", function (next) {
  this.lastActivity = new Date()
  next()
})

module.exports = mongoose.model("Conversation", conversationSchema)
