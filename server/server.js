const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")

// Load environment variables first
dotenv.config()

// Validate critical environment variables
const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"]

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:")
  missingEnvVars.forEach((envVar) => console.error(`  - ${envVar}`))
  console.error("\nPlease check your .env file and ensure all required variables are set.")
  process.exit(1)
}

// Import routes
const authRoutes = require("./routes/auth")
const githubRoutes = require("./routes/github")
const aiRoutes = require("./routes/ai")
const userRoutes = require("./routes/user")

// Import middleware
const authMiddleware = require("./middleware/auth")

const app = express()

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// MongoDB Connection with better error handling
console.log("🔄 Connecting to MongoDB...")
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB successfully")
    console.log(`📍 Database: ${mongoose.connection.name}`)
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message)
    console.error("Please check your MONGODB_URI in the .env file")
    process.exit(1)
  })

// Handle MongoDB connection events
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB error:", err)
})

mongoose.connection.on("disconnected", () => {
  console.log("⚠️  MongoDB disconnected")
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/github", authMiddleware, githubRoutes)
app.use("/api/ai", authMiddleware, aiRoutes)
app.use("/api/user", authMiddleware, userRoutes)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    github_oauth: process.env.GITHUB_CLIENT_ID ? "configured" : "missing",
    ai_services: {
      gemini:
        process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY" ? "configured" : "missing",
      openai:
        process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "YOUR_OPENAI_API_KEY" ? "configured" : "missing",
    },
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err)
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    timestamp: new Date().toISOString(),
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log("\n🚀 CodePilot AI Server Started Successfully!")
  console.log("=".repeat(50))
  console.log(`📡 Server running on port ${PORT}`)
  console.log(`🌐 API URL: http://localhost:${PORT}`)
  console.log(`📱 Client URL: ${process.env.CLIENT_URL || "http://localhost:3000"}`)
  console.log(`🔑 GitHub OAuth: ${process.env.GITHUB_CLIENT_ID ? "✅ Configured" : "❌ Missing"}`)
  console.log(`🤖 AI Services:`)
  console.log(
    `   - Gemini: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY" ? "✅ Ready" : "❌ Not configured"}`,
  )
  console.log(
    `   - OpenAI: ${process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "YOUR_OPENAI_API_KEY" ? "✅ Ready" : "❌ Not configured"}`,
  )
  console.log("=".repeat(50))
  console.log("Ready to accept requests! 🎉\n")
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🔄 SIGTERM received, shutting down gracefully...")
  mongoose.connection.close(() => {
    console.log("✅ MongoDB connection closed")
    process.exit(0)
  })
})

process.on("SIGINT", () => {
  console.log("🔄 SIGINT received, shutting down gracefully...")
  mongoose.connection.close(() => {
    console.log("✅ MongoDB connection closed")
    process.exit(0)
  })
})

module.exports = app
