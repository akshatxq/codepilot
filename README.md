# CodePilot AI - Intelligent Code Assistant 🚀

A complete Next.js full-stack application that provides AI-powered code exploration and assistance for GitHub repositories.

## ✨ Features

- **GitHub OAuth Authentication** - Secure login with repository access
- **Repository Explorer** - Browse files with syntax highlighting
- **AI Assistant** - Chat with Gemini/OpenAI about your code
- **Smart File Suggestions** - AI recommends relevant files
- **Conversation History** - Persistent chat storage in MongoDB
- **Dark/Light Theme** - System preference support
- **Professional UI** - Clean, modern design inspired by developer tools

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with GitHub OAuth
- **Database**: MongoDB with Mongoose
- **AI Integration**: Google Gemini API (primary), OpenAI (fallback)
- **Styling**: Tailwind CSS with custom design system
- **Code Highlighting**: Prism.js with React Syntax Highlighter
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A GitHub account
- A MongoDB database (MongoDB Atlas recommended)
- AI API keys (Gemini or OpenAI)

### 1. Clone and Install

\`\`\`bash
git clone <your-repo-url>
cd codepilot-ai
npm install
\`\`\`

### 2. Environment Setup

Create `.env.local` file in the root directory:

\`\`\`env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this-in-production

# GitHub OAuth (create at: https://github.com/settings/applications/new)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# MongoDB (get from: https://cloud.mongodb.com/)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codepilot-ai

# AI API Keys
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
\`\`\`

### 3. GitHub OAuth App Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: CodePilot AI
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to your `.env.local`

### 4. Get AI API Keys

#### Option A: Google Gemini (Recommended)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to `.env.local` as `GEMINI_API_KEY`

#### Option B: OpenAI (Fallback)
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Add it to `.env.local` as `OPENAI_API_KEY`

### 5. Database Setup

#### MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster
3. Get connection string and update `MONGODB_URI` in `.env.local`

#### Local MongoDB
\`\`\`bash
# Install MongoDB locally
brew install mongodb/brew/mongodb-community
brew services start mongodb-community

# Use local connection string
MONGODB_URI=mongodb://localhost:27017/codepilot-ai
\`\`\`

### 6. Run the Application

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) to see your application!

## 📁 Project Structure

\`\`\`
codepilot-ai/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # NextAuth configuration
│   │   ├── github/               # GitHub API integration
│   │   └── ai/                   # AI chat endpoints
│   ├── components/               # React components
│   ├── chat/                     # AI chat pages
│   ├── repository/               # Repository explorer pages
│   ├── settings/                 # Settings page
│   └── globals.css               # Global styles
├── lib/                          # Utility libraries
│   └── mongodb.ts                # Database connection
├── public/                       # Static assets
├── .env.local                    # Environment variables
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── package.json                  # Dependencies
\`\`\`

## 🎯 Usage

### Basic Workflow

1. **Sign in** with your GitHub account
2. **Browse repositories** from your dashboard
3. **Explore code** using the file tree and syntax highlighter
4. **Chat with AI** about your code:
   - Ask questions like "Where is the authentication logic?"
   - Get file suggestions and explanations
   - View conversation history

### Example AI Queries

- "Where is the navbar component?"
- "How does user authentication work?"
- "What files contain the API routes?"
- "Explain the database schema"
- "Where should I add error handling?"

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to update these for production:

\`\`\`env
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=a-secure-random-string-for-production
# ... other variables remain the same
\`\`\`

## 🔍 API Endpoints

- `GET /api/github/repositories` - Fetch user repositories
- `GET /api/github/repository/[owner]/[repo]` - Get repository details
- `GET /api/github/repository/[owner]/[repo]/tree` - Get file tree
- `GET /api/github/repository/[owner]/[repo]/file` - Get file content
- `POST /api/ai/chat/[owner]/[repo]` - Send AI chat message
- `GET /api/ai/conversations/[owner]/[repo]` - Get conversation history

## 🎨 Customization

### Themes
The app supports light, dark, and system themes. Customize colors in `tailwind.config.js` and `globals.css`.

### AI Providers
Switch between Gemini and OpenAI in the settings page or by modifying the API route logic.

### UI Components
All components are built with Tailwind CSS and can be easily customized.

## 🐛 Troubleshooting

### Common Issues

1. **"Unauthorized" errors**: Check your GitHub OAuth configuration
2. **Database connection issues**: Verify your MongoDB URI
3. **AI not responding**: Ensure API keys are correctly set
4. **Build errors**: Make sure all environment variables are set

### Debug Mode

Enable debug logging by adding to `.env.local`:
\`\`\`env
NEXTAUTH_DEBUG=true
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- GitHub for the API and OAuth
- Google and OpenAI for AI capabilities
- Tailwind CSS for the styling system

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section
2. Search existing GitHub issues
3. Create a new issue with detailed information

---

**Built with ❤️ using Next.js and AI**
