#!/usr/bin/env node

const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("🚀 Starting CodePilot AI...\n")

// Check if dependencies are installed
const checkDependencies = () => {
  const serverNodeModules = path.join(__dirname, "server", "node_modules")
  const clientNodeModules = path.join(__dirname, "client", "node_modules")

  if (!fs.existsSync(serverNodeModules) || !fs.existsSync(clientNodeModules)) {
    console.log("📦 Installing dependencies...")
    const install = spawn("npm", ["run", "install-deps"], { stdio: "inherit" })

    install.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Dependencies installed successfully!\n")
        startApplication()
      } else {
        console.error("❌ Failed to install dependencies")
        process.exit(1)
      }
    })
  } else {
    startApplication()
  }
}

// Start the application
const startApplication = () => {
  console.log("🔄 Starting development servers...\n")

  const dev = spawn("npm", ["run", "dev"], { stdio: "inherit" })

  dev.on("close", (code) => {
    console.log(`\n🛑 Application stopped with code ${code}`)
  })

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🔄 Shutting down gracefully...")
    dev.kill("SIGINT")
    process.exit(0)
  })
}

// Check environment variables
const checkEnvVars = () => {
  const serverEnvPath = path.join(__dirname, "server", ".env")
  const clientEnvPath = path.join(__dirname, "client", ".env")

  if (!fs.existsSync(serverEnvPath)) {
    console.error("❌ Server .env file not found!")
    console.log("Please create server/.env file with required environment variables.")
    process.exit(1)
  }

  if (!fs.existsSync(clientEnvPath)) {
    console.error("❌ Client .env file not found!")
    console.log("Please create client/.env file with required environment variables.")
    process.exit(1)
  }

  console.log("✅ Environment files found")
}

// Main execution
console.log("CodePilot AI - Intelligent Code Assistant")
console.log("=".repeat(50))

checkEnvVars()
checkDependencies()
