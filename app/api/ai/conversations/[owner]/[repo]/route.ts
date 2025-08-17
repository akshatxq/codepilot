import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../auth/[...nextauth]/route"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { owner: string; repo: string } }) {
  try {
    const session = await getServerSession(authOptions)

    console.log("Conversations - Session:", session)

    if (!session?.user) {
      console.log("Conversations - No session or user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { owner, repo } = params
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log("Conversations - Fetching for repository:", `${owner}/${repo}`)

    const { db } = await connectToDatabase()

    // Fetch conversations for this repository and user
    const conversations = await db
      .collection("conversations")
      .find({
        $or: [
          { userEmail: session.user.email },
          { userId: session.user.id }
        ],
        repository: `${owner}/${repo}`,
      })
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .toArray()

    console.log("Conversations - Found:", conversations.length)

    // Format conversations for response
    const formattedConversations = conversations.map((conv) => ({
      id: conv._id.toString(),
      message: conv.message,
      response: conv.response,
      suggestedFiles: conv.suggestedFiles || [],
      timestamp: conv.timestamp,
    }))

    return NextResponse.json(formattedConversations)
  } catch (error) {
    console.error("Conversations - Error fetching conversations:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { owner: string; repo: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { owner, repo } = params

    console.log("Conversations - Deleting for repository:", `${owner}/${repo}`)

    const { db } = await connectToDatabase()

    // Delete all conversations for this repository and user
    const result = await db.collection("conversations").deleteMany({
      $or: [
        { userEmail: session.user.email },
        { userId: session.user.id }
      ],
      repository: `${owner}/${repo}`,
    })

    console.log("Conversations - Deleted:", result.deletedCount)

    return NextResponse.json({
      message: `Deleted ${result.deletedCount} conversations`,
      deletedCount: result.deletedCount,
    })
  } catch (error) {
    console.error("Conversations - Error deleting conversations:", error)
    return NextResponse.json({ error: "Failed to delete conversations" }, { status: 500 })
  }
}
