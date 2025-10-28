# SketchMate

## Overview

SketchMate is a real-time collaborative drawing and design tool that allows users to create, share, and collaborate on whiteboard projects. The application features an intuitive interface combined with powerful AI capabilities that enable users to control the whiteboard through natural language commands.

## Technology Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - UI library with concurrent features
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Backend & Infrastructure

- **Supabase** - Backend-as-a-Service (Database, Authentication, Real-time)
- **PostgreSQL** - Primary database via Supabase
- **Next.js API Routes** - Server-side API endpoints

### AI Integration

- **Google Gemini AI** - Natural language processing for whiteboard control
- **Generative AI SDK** - Google AI integration

### Additional Libraries

- **Zustand** - State management
- **Perfect Freehand** - Smooth drawing algorithms
- **Sonner** - Toast notifications
- **React Colorful** - Color picker components
- **Maileroo** - Email service for invitations

## Features

### Core Functionality

- **Real-time Collaboration** - Multiple users can work on the same whiteboard simultaneously
- **Layer-based Drawing** - Support for rectangles, ellipses, freehand paths, text, and sticky notes
- **User Authentication** - Secure login with email magic links and OAuth providers
- **Organization Management** - Create and manage teams with role-based access
- **Board Organization** - Create, share, and organize multiple whiteboard projects

### AI-Powered Features

- **Natural Language Commands** - Control the whiteboard using conversational English
- **Intelligent Layer Creation** - AI understands and creates appropriate visual elements
- **Smart Color Recognition** - Automatic color mapping from natural language descriptions
- **Context-Aware Operations** - AI considers existing board state for intelligent suggestions

### User Experience

- **Responsive Design** - Works seamlessly across desktop and mobile devices
- **Dark/Light Theme** - Automatic theme switching based on system preferences
- **Intuitive Toolbar** - Easy access to drawing tools and features
- **Real-time Cursors** - See where other collaborators are working
- **Undo/Redo** - Full history management for all operations

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Google AI Studio account with Gemini API access
- Maileroo account (optional, for email invitations)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/ragav2005/SketchMate.git
cd SketchMate
```

2. Install dependencies:

```bash
npm install
```

3. Create environment variables file:

```bash
cp .env.example .env.local
```

4. Configure environment variables in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI
GEMINI_API_KEY=your_google_gemini_api_key

# Email Service (Optional)
MAILEROO_API_KEY=your_maileroo_api_key
```

### Database Setup

1. Create a new Supabase project
2. Run the SQL migrations in `supabase/migrations/` to set up the database schema
3. Configure authentication providers in Supabase dashboard

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production

```bash
npm run build
npm start
```

## Usage

### Creating a Board

1. Sign in to your account
2. Create or join an organization
3. Click "New Board" to create a whiteboard project
4. Share the board URL with collaborators

### Drawing Tools

- **Select Tool** - Click and drag to select layers
- **Rectangle Tool** - Click and drag to create rectangles
- **Ellipse Tool** - Click and drag to create circles/ellipses
- **Pen Tool** - Freehand drawing with smooth curves
- **Text Tool** - Click to add editable text
- **Note Tool** - Click to add sticky notes

### AI Commands

Use the AI chat interface at the bottom of the whiteboard to control it with natural language:

**Creating Elements:**

- "Add a blue rectangle in the center"
- "Draw a red circle on the right side"
- "Create a yellow sticky note saying 'Important'"

**Modifying Elements:**

- "Make all rectangles green"
- "Move the blue circle to the top left"
- "Change the text to 'Hello World'"

**Complex Operations:**

- "Create a flowchart with 3 connected boxes"
- "Draw a house with a door and windows"
- "Make a color palette with 5 different colors"

### Collaboration

- Real-time cursors show where collaborators are working
- All changes sync instantly across all connected users
- Layer locking prevents accidental modifications
- User presence indicators show who's online

## Architecture

### Project Structure

```
app/
├── (Dashboard)/          # Main application routes
├── api/                  # API endpoints
├── auth/                 # Authentication pages
└── board/[boardId]/      # Whiteboard pages

components/
├── ui/                   # Reusable UI components
└── ...                   # Feature-specific components

lib/
├── supabase/            # Database client configurations
├── utils.ts             # Utility functions
└── layer-utils.ts       # Canvas layer utilities

types/
└── canvas.ts            # TypeScript type definitions
```

### Database Schema

- **users** - User accounts and profiles
- **organizations** - Team/organization management
- **boards** - Whiteboard projects
- **layers** - Individual drawing elements
- **invites** - Organization invitations

### AI Integration

The AI system uses Google Gemini to:

1. Parse natural language commands
2. Generate structured action plans
3. Execute database operations
4. Provide intelligent responses

### Real-time Features

- Supabase real-time subscriptions for live collaboration
- Optimistic updates for responsive UI
- Conflict resolution for concurrent edits
- Presence tracking for user awareness

## API Reference

### AI Generation Endpoint

```
POST /api/ai/generate
```

Processes natural language commands and executes whiteboard operations.

**Request Body:**

```json
{
  "prompt": "Add a blue rectangle",
  "boardId": "board-uuid"
}
```

**Response:**

```json
{
  "success": true,
  "message": "AI actions completed: 1 inserted, 0 updated, 0 deleted",
  "actionsPerformed": 1,
  "details": {
    "inserted": 1,
    "updated": 0,
    "deleted": 0,
    "errors": []
  }
}
```

## Acknowledgments

- Google AI Studio for Gemini API access
- Supabase for backend infrastructure
- Vercel for hosting and deployment
- The open source community for the libraries and tools used
