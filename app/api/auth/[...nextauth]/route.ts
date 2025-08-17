import NextAuth, { type NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { MongoClient } from "mongodb"

const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017/codepilot-ai")
const clientPromise = Promise.resolve(client)

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      console.log("JWT callback - token:", token)
      console.log("JWT callback - account:", account)

      // Persist the OAuth access_token to the token right after signin
      if (account) {
        console.log("Setting access token from account:", account.access_token?.substring(0, 10) + "...")
        token.accessToken = account.access_token
        token.userId = user?.id
      }
      return token
    },
    async session({ session, token }) {
      console.log("Session callback - session:", session)
      console.log("Session callback - token:", token)

      // Send properties to the client
      if (token?.accessToken) {
        session.accessToken = token.accessToken as string
        console.log("Added access token to session:", session.accessToken?.substring(0, 10) + "...")
      }

      if (token?.userId && session.user) {
        (session.user as any).id = token.userId as string
      }
      

      return session
    },
  },
  session: {
    strategy: "jwt", // Use JWT instead of database sessions
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug mode
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
