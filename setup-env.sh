#!/bin/bash

# Setup script to create environment files
echo "🔧 Setting up CodePilot AI environment files..."

# Create server .env file
echo "📁 Creating server/.env file..."
cat > server/.env << 'EOF'
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codepilot-ai

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=Ov23liAoQkJhJGJhJGJh
GITHUB_CLIENT_SECRET=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t

# AI API Keys
GEMINI_API_KEY=AIzaSyBpQkJhJGJhJGJhJGJhJGJhJGJhJGJhJGJh
OPENAI_API_KEY=sk-proj-1234567890abcdef1234567890abcdef1234567890abcdef

# Application URLs
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5000

# Environment
NODE_ENV=development

# Port Configuration
PORT=5000
EOF

# Create client .env file
echo "📁 Creating client/.env file..."
cat > client/.env << 'EOF'
# API Configuration
REACT_APP_API_URL=http://localhost:5000

# Environment
REACT_APP_ENV=development

# GitHub OAuth (for frontend reference)
REACT_APP_GITHUB_CLIENT_ID=Ov23liAoQkJhJGJhJGJh

# Client URL
REACT_APP_CLIENT_URL=http://localhost:3000

# OpenAI API Key (for frontend if needed)
REACT_APP_OPENAI_API_KEY=sk-proj-1234567890abcdef1234567890abcdef1234567890abcdef

# Gemini API Key (for frontend if needed)
REACT_APP_GEMINI_API_KEY=AIzaSyBpQkJhJGJhJGJhJGJhJGJhJGJhJGJhJGJh
EOF

echo "✅ Environment files created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update MONGODB_URI with your actual MongoDB connection string"
echo "2. Generate a secure JWT_SECRET for production"
echo "3. Verify your GitHub OAuth app settings"
echo "4. Test your API keys"
echo ""
echo "🚀 Run 'npm run dev' to start the application!"
