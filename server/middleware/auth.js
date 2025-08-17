const jwt = require("jsonwebtoken")
const User = require("../models/User")

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET
    if (!JWT_SECRET) {
      console.error("❌ JWT_SECRET not configured")
      return res.status(500).json({ error: "Server configuration error" })
    }

    const decoded = jwt.verify(token, JWT_SECRET)

    // Get user from database
    const user = await User.findById(decoded.userId)
    if (!user) {
      return res.status(401).json({ error: "User not found" })
    }

    // Add user to request object
    req.user = user
    next()
  } catch (error) {
    console.error("❌ Auth middleware error:", error.message)

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" })
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" })
    }

    res.status(401).json({ error: "Authentication failed" })
  }
}

module.exports = authMiddleware
