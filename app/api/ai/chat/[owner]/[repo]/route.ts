import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../auth/[...nextauth]/route"
import { GoogleGenerativeAI } from "@google/generative-ai"
import OpenAI from "openai"
import { connectToDatabase } from "@/lib/mongodb"

// Initialize AI clients with better error handling
let genAI = null
let openai = null

// Initialize Gemini
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    console.log("✅ Gemini AI client initialized successfully")
  } catch (error) {
    console.error("❌ Failed to initialize Gemini AI:", error)
  }
} else {
  console.log("⚠️ GEMINI_API_KEY not found or empty")
}

// Initialize OpenAI
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '') {
  try {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    console.log("✅ OpenAI client initialized successfully")
  } catch (error) {
    console.error("❌ Failed to initialize OpenAI:", error)
  }
} else {
  console.log("⚠️ OPENAI_API_KEY not found or empty")
}

// Helper function to fetch file content
async function fetchFileContent(accessToken: string, owner: string, repo: string, path: string) {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CodePilot-AI",
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (data.type !== "file" || data.size > 100000) { // Skip files larger than 100KB
      return null
    }

    const content = Buffer.from(data.content, "base64").toString("utf-8")
    return {
      path: data.path,
      name: data.name,
      content: content,
      size: data.size
    }
  } catch (error) {
    console.error(`Error fetching file ${path}:`, error)
    return null
  }
}

// Helper function to get repository structure and analyze files
async function analyzeRepository(accessToken: string, owner: string, repo: string, userMessage: string) {
  try {
    console.log("🔍 Analyzing repository structure...")

    // 1. Get complete file tree
    const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CodePilot-AI",
      },
    })

    if (!treeResponse.ok) {
      throw new Error(`Failed to fetch repository tree: ${treeResponse.status}`)
    }

    const treeData = await treeResponse.json()
    const allFiles = treeData.tree.filter((item: any) => item.type === "blob")

    console.log(`📁 Found ${allFiles.length} files in repository`)

    // 2. Identify important files based on user query and common patterns
    const importantFilePatterns = [
      /package\.json$/,
      /README\.md$/i,
      /index\.(js|ts|jsx|tsx)$/,
      /app\.(js|ts|jsx|tsx)$/,
      /main\.(js|ts|jsx|tsx)$/,
      /server\.(js|ts)$/,
      /config\.(js|ts|json)$/,
      /\.env/,
      /controller/i,
      /route/i,
      /api/i,
      /model/i,
      /service/i,
    ]

    // 3. Extract keywords from user message for targeted file search
    const messageKeywords = extractKeywords(userMessage.toLowerCase())
    console.log("🔑 Extracted keywords:", messageKeywords)

    // 4. Score and select relevant files
    const scoredFiles = allFiles.map((file: any) => {
      let score = 0
      const filePath = file.path.toLowerCase()
      const fileName = file.path.split("/").pop()?.toLowerCase() || ""

      // Score based on important patterns
      importantFilePatterns.forEach(pattern => {
        if (pattern.test(filePath)) score += 5
      })

      // Score based on user query keywords
      messageKeywords.forEach(keyword => {
        if (filePath.includes(keyword)) score += 10
        if (fileName.includes(keyword)) score += 15
        
        // Special scoring for specific functionality
        if (keyword === "like" && (filePath.includes("like") || filePath.includes("reaction"))) score += 20
        if (keyword === "comment" && filePath.includes("comment")) score += 20
        if (keyword === "controller" && filePath.includes("controller")) score += 20
        if (keyword === "api" && (filePath.includes("api") || filePath.includes("route"))) score += 15
      })

      // Boost score for common important files
      if (fileName === "package.json") score += 8
      if (fileName.includes("readme")) score += 6
      if (filePath.includes("src/") || filePath.includes("app/")) score += 3
      if (filePath.includes("controller")) score += 12
      if (filePath.includes("model")) score += 8
      if (filePath.includes("route")) score += 10
      if (filePath.includes("service")) score += 8

      return { ...file, score, fileName }
    })

    // 5. Select top relevant files (limit to prevent token overflow)
    const relevantFiles = scoredFiles
      .filter(file => file.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15) // Limit to top 15 files

    console.log(`🎯 Selected ${relevantFiles.length} relevant files for analysis`)

    // 6. Fetch content of relevant files
    const fileContents = await Promise.all(
      relevantFiles.map(async (file) => {
        const content = await fetchFileContent(accessToken, owner, repo, file.path)
        return content ? { ...content, score: file.score } : null
      })
    )

    const validFileContents = fileContents.filter(Boolean)
    console.log(`📄 Successfully fetched ${validFileContents.length} file contents`)

    // 7. Create comprehensive repository analysis
    const repositoryAnalysis = {
      totalFiles: allFiles.length,
      analyzedFiles: validFileContents.length,
      fileStructure: allFiles.slice(0, 50).map(f => f.path), // First 50 files for structure overview
      relevantFiles: validFileContents.map(f => ({
        path: f.path,
        name: f.name,
        size: f.size,
        score: f.score,
        preview: f.content.substring(0, 500) + (f.content.length > 500 ? "..." : "")
      })),
      fullFileContents: validFileContents.filter(f => f.size < 10000) // Only include full content for smaller files
    }

    return repositoryAnalysis
  } catch (error) {
    console.error("❌ Error analyzing repository:", error)
    return {
      totalFiles: 0,
      analyzedFiles: 0,
      fileStructure: [],
      relevantFiles: [],
      fullFileContents: [],
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

// Helper function to extract keywords from user message
function extractKeywords(message: string): string[] {
  const commonWords = [
    "the", "is", "at", "which", "on", "and", "a", "to", "are", "as", "was", "with", "for", 
    "this", "that", "it", "in", "or", "be", "an", "have", "i", "you", "he", "she", "we", 
    "they", "where", "how", "what", "when", "why", "can", "could", "would", "should", 
    "do", "does", "did", "tell", "me", "about", "find", "show", "get", "my", "your"
  ]

  return message
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .slice(0, 10) // Limit to 10 keywords
}

export async function POST(request: NextRequest, { params }: { params: { owner: string; repo: string } }) {
  try {
    const session = await getServerSession(authOptions)

    console.log("🔐 AI Chat - Session check:", !!session)
    console.log("👤 AI Chat - User:", session?.user?.email || 'No user')

    if (!session?.user || !session?.accessToken) {
      console.log("❌ AI Chat - No session, user, or access token found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { owner, repo } = params
    const { message, context } = await request.json()

    console.log("💬 AI Chat - Processing message for:", `${owner}/${repo}`)
    console.log("🔧 AI Chat - Message:", message?.substring(0, 100) + "...")

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Check AI service availability
    console.log("🤖 AI Services Status:")
    console.log("   - Gemini:", genAI ? "✅ Available" : "❌ Not available")
    console.log("   - OpenAI:", openai ? "✅ Available" : "❌ Not available")

    if (!genAI && !openai) {
      console.log("❌ No AI services available")
      return NextResponse.json({
        response: "No AI services are currently configured. Please ensure either GEMINI_API_KEY or OPENAI_API_KEY is properly set in your environment variables.",
        suggestedFiles: [],
        timestamp: new Date().toISOString(),
      })
    }

    // Analyze repository to get actual file contents and structure
    const repositoryAnalysis = await analyzeRepository(session.accessToken, owner, repo, message)

    // Prepare enhanced prompt with actual repository analysis
    const systemPrompt = `You are CodePilot AI, an intelligent code assistant with deep access to the repository "${owner}/${repo}".

REPOSITORY ANALYSIS:
- Total Files: ${repositoryAnalysis.totalFiles}
- Analyzed Files: ${repositoryAnalysis.analyzedFiles}
- Repository Structure (first 50 files):
${repositoryAnalysis.fileStructure.slice(0, 50).map(path => `  - ${path}`).join('\n')}

RELEVANT FILES FOUND:
${repositoryAnalysis.relevantFiles.map(file => `
File: ${file.path} (Score: ${file.score}, Size: ${file.size} bytes)
Preview:
${file.preview}
---`).join('\n')}

FULL FILE CONTENTS:
${repositoryAnalysis.fullFileContents.map(file => `
=== ${file.path} ===
${file.content}
===END ${file.path}===
`).join('\n')}

INSTRUCTIONS:
- You have access to the actual repository files and their contents
- When asked about specific functionality (like "like controller", "comment system", etc.), search through the file contents
- Provide specific file paths, function names, and line references when possible
- If you find the requested functionality, explain exactly where it is and how it works
- If you don't find it, clearly state that it doesn't exist in the analyzed files
- Be specific about file locations and implementation details

USER QUESTION: ${message}

Please provide a detailed answer based on the actual repository contents above.`

    let aiResponse = ""
    let suggestedFiles: string[] = []

    try {
      // Try Gemini first
      if (genAI) {
        console.log("🚀 Using Gemini AI with enhanced repository analysis...")
        try {
          const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
              temperature: 0.3, // Lower temperature for more factual responses
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048, // Increased for detailed responses
            }
          })
          
          const result = await model.generateContent(systemPrompt)
          const response = await result.response
          aiResponse = response.text()
          console.log("✅ Gemini response received, length:", aiResponse.length)
        } catch (geminiError) {
          console.error("❌ Gemini API Error:", geminiError)
          
          // Try OpenAI as fallback
          if (openai) {
            console.log("🔄 Falling back to OpenAI...")
            aiResponse = "" // Reset response to trigger OpenAI
          } else {
            throw geminiError
          }
        }
      } 

      // Use OpenAI if Gemini failed or isn't available
      if ((!aiResponse || aiResponse.trim() === '') && openai) {
        console.log("🚀 Using OpenAI with enhanced repository analysis...")
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-16k", // Use 16k model for larger context
            messages: [
              {
                role: "system",
                content: "You are CodePilot AI, an intelligent code assistant with access to repository files and their contents. Provide specific, detailed answers based on the actual code you can see.",
              },
              {
                role: "user",
                content: systemPrompt,
              },
            ],
            max_tokens: 2000,
            temperature: 0.3, // Lower temperature for more factual responses
          })

          aiResponse = completion.choices[0]?.message?.content || "No response generated"
          console.log("✅ OpenAI response received, length:", aiResponse.length)
        } catch (openaiError) {
          console.error("❌ OpenAI API Error:", openaiError)
          throw openaiError
        }
      }

      // Extract suggested files from the analysis (prioritize files that were actually analyzed)
      suggestedFiles = repositoryAnalysis.relevantFiles
        .slice(0, 5)
        .map(file => file.path)

      // Also extract any additional files mentioned in the AI response
      const additionalFiles = aiResponse.match(
        /[\w\-./]+\.(js|ts|jsx|tsx|py|java|cpp|c|h|css|html|md|json|yml|yaml|xml|php|rb|go|rs|swift|kt)/gi,
      )
      
      if (additionalFiles) {
        const uniqueAdditionalFiles = [...new Set(additionalFiles)]
          .filter(file => !suggestedFiles.includes(file))
          .slice(0, 3)
        
        suggestedFiles = [...suggestedFiles, ...uniqueAdditionalFiles].slice(0, 5)
      }

      console.log("📁 Final suggested files:", suggestedFiles.length)

    } catch (aiError) {
      console.error("❌ AI Service Error Details:", {
        error: aiError,
        message: aiError instanceof Error ? aiError.message : 'Unknown error',
      })
      
      // Provide more specific error messages
      let errorMessage = "I encountered an error while analyzing your repository. "
      
      if (aiError instanceof Error) {
        if (aiError.message.includes('API_KEY')) {
          errorMessage += "This appears to be an API key issue. Please verify your API keys are correct and have sufficient quota."
        } else if (aiError.message.includes('quota') || aiError.message.includes('rate')) {
          errorMessage += "This appears to be a rate limit or quota issue. Please try again in a few moments."
        } else if (aiError.message.includes('network') || aiError.message.includes('timeout')) {
          errorMessage += "This appears to be a network connectivity issue. Please try again."
        } else {
          errorMessage += `Error details: ${aiError.message}`
        }
      } else {
        errorMessage += "Please check your API configuration and try again."
      }
      
      // Still provide repository analysis even if AI fails
      if (repositoryAnalysis.relevantFiles.length > 0) {
        errorMessage += `\n\nHowever, I was able to analyze your repository and found these relevant files:\n${repositoryAnalysis.relevantFiles.map(f => `- ${f.path}`).join('\n')}`
        suggestedFiles = repositoryAnalysis.relevantFiles.slice(0, 5).map(f => f.path)
      }
      
      aiResponse = errorMessage
    }

    // Save conversation to database with enhanced context
    try {
      const { db } = await connectToDatabase()

      await db.collection("conversations").insertOne({
        userEmail: session.user.email,
        userId: session.user.id,
        repository: `${owner}/${repo}`,
        message: message,
        response: aiResponse,
        suggestedFiles: suggestedFiles,
        context: {
          ...context,
          repositoryAnalysis: {
            totalFiles: repositoryAnalysis.totalFiles,
            analyzedFiles: repositoryAnalysis.analyzedFiles,
            relevantFilesCount: repositoryAnalysis.relevantFiles.length
          }
        },
        timestamp: new Date(),
      })
      console.log("💾 Enhanced conversation saved to database")
    } catch (dbError) {
      console.error("❌ Database save error:", dbError)
      // Continue even if database save fails
    }

    return NextResponse.json({
      response: aiResponse,
      suggestedFiles: suggestedFiles,
      repositoryAnalysis: {
        totalFiles: repositoryAnalysis.totalFiles,
        analyzedFiles: repositoryAnalysis.analyzedFiles,
        relevantFiles: repositoryAnalysis.relevantFiles.length
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ AI Chat - Critical error:", error)
    return NextResponse.json({ 
      error: "Failed to process AI request",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
