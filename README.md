# 11-11: The Sustainable Intelligence OS

**Version:** 0.1.0 (Sprint 1 - UI Shell Complete)

11-11 is a "Hardworking Workbench" for prompt engineering and a "Global Commons" for collective intelligence. It's a sustainable platform built for calm, patient work—designed to be orchestrated by AI agents and used by humans.

## 🎯 Core Philosophy

- **Planning with Files:** The filesystem is the source of truth
- **Hybrid Storage:** Google Drive (personal) + GitHub (collaboration)
- **Sustainable Innovation:** Paced development that prioritizes creator well-being
- **Agent-Native:** Built from the ground up for AI agent orchestration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn
- Modern browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd 11-11

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the UI Shell.

### Development Mode

By default, the application runs with **dev-mode auth bypass** enabled:

```env
NEXT_PUBLIC_DEV_MODE=true
```

This allows you to work without setting up OAuth. A mock user session is automatically injected.

## 📁 Project Structure

```
11-11/
├── 00_Roadmap/          # High-level goals and task planning
├── 01_PRDs/             # Product Requirement Documents
├── 02_Specs/            # Technical specifications
├── 03_Prompts/          # Local prompt library
├── 04_System/           # AI Personas and system prompts
├── 05_Logs/             # Development traces and audit logs
│   ├── AUDIT_LOG.md
│   └── screenshots/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   ├── editor/          # Markdown editor components
│   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   ├── multi-agent/     # Multi-agent workspace components
│   ├── providers/       # Context providers
│   └── shared/          # Shared/reusable components
├── data/                # Mock data and fixtures
├── lib/                 # Utilities, types, and constants
├── public/              # Static assets
├── JOURNAL.md           # Development journal and architectural decisions
└── README.md            # This file
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server (localhost:3000)

# Production
npm run build        # Build production bundle
npm start            # Start production server

# Quality Checks
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler (no emit)
```

## 🧩 Key Features (Sprint 1)

### ✅ Command Center UI Shell
- **Resizable Panels:** Drag-to-resize layout with localStorage persistence
- **Collapsible Sidebar:** Smooth animations, min 200px / max 500px
- **File Tree:** Mock file structure with Google Drive + GitHub source badges
- **Tabbed Interface:** Switch between Markdown Editor and Multi-Agent views

### ✅ Multi-Agent Workspace
- **Chat Panels:** Spawn up to 6 concurrent agent chat sessions
- **Agent Personas:** Manus, Supervisor, Librarian, Scribe, Navigator, Thinker
- **Responsive Grid:** 1-3 columns based on viewport width
- **Panel Controls:** Minimize, maximize, close with smooth animations

### ✅ Header & Navigation
- **Workspace Selector:** Switch between workspaces (mock)
- **Sync Status:** Google Drive + GitHub sync indicators
- **Mock Auth:** Dev-mode bypass for rapid iteration

### ✅ Quality Standards
- Zero ESLint warnings/errors
- Zero TypeScript type errors
- Production build succeeds
- Fully responsive (320px - 2560px)
- 60fps animations via Framer Motion

## 🎨 Design System

### Colors
- **Background:** Neutral grays (50-950)
- **Primary:** Blue (600-700)
- **Success:** Green (500-600) - synced status
- **Warning:** Yellow (500) - syncing status
- **Error:** Red (500-600) - error states

### Animations
All transitions follow the "Hardworking" calm aesthetic:
- **Duration:** 200-300ms (never exceeds 300ms)
- **Easing:** Smooth cubic-bezier curves
- **Purpose:** Reinforce actions, not distract

### Typography
- **Font Family:** Inter (via `next/font/google`)
- **Sizes:** Tailwind scale (text-xs to text-2xl)
- **Weight:** Regular (400), Medium (500), Semibold (600), Bold (700)

## 📚 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 14 (App Router) | Modern React framework with SSR |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Animations** | Framer Motion | Smooth, performant animations |
| **Icons** | Lucide React | Clean, consistent iconography |
| **Layout** | react-resizable-panels | Resizable panel system |
| **Language** | TypeScript | Type-safe development |

## 🧪 Testing

Currently, the application uses manual testing and type checking. Future sprints will add:
- Unit tests (Jest + React Testing Library)
- E2E tests (Playwright)
- Visual regression tests

### Manual Testing Checklist
- [ ] Sidebar resizes from 200px to 500px
- [ ] Sidebar collapses to icon-only mode
- [ ] Panel sizes persist after page reload
- [ ] Layout is responsive at 320px, 768px, 1280px
- [ ] All 6 planning folders display in file tree
- [ ] Google Drive/GitHub icons show on relevant files
- [ ] New Session button spawns chat panels
- [ ] Chat panels display in responsive grid
- [ ] Max 6 panels enforced
- [ ] All animations complete in 200-300ms

## 📖 Documentation

- **JOURNAL.md** - Detailed development log and architectural decisions
- **05_Logs/AUDIT_LOG.md** - Weekly code audit log
- **01_PRDs/** - Product requirements and feature specs
- **02_Specs/** - Technical implementation specs

## 🗺️ Roadmap

### ✅ Sprint 1: UI Shell (v0.1) - **COMPLETE**
- Command Center layout with resizable panels
- Multi-agent workspace with chat interface
- Mock authentication and file tree

### 🚧 Sprint 2: Hybrid Storage (v0.2) - **PLANNED**
- Google Drive API integration
- GitHub API (Octokit) integration
- Real-time sync status indicators
- File CRUD operations

### 📋 Sprint 3: Markdown Editor (v0.3) - **PLANNED**
- Monaco/CodeMirror integration
- Live preview with syntax highlighting
- Auto-save to Google Drive/GitHub
- Conflict resolution UI

### 📋 Sprint 4: The Librarian (v0.4) - **PLANNED**
- Semantic search via Supabase pgvector
- Proactive prompt suggestions
- Tag-based filtering and organization

### 📋 Sprint 5: The Commons (v0.5) - **PLANNED**
- Global prompt gallery (Wikipedia of Prompts)
- One-click publish with public flag
- Collaborative forking and remixing

## 🤝 Contributing

11-11 is designed to be open source and community-driven. Contribution guidelines will be published in future sprints.

For now, follow the **Preflight Checklist** before submitting changes:
1. **Security:** No new auth/data exposure risks
2. **Context:** Only necessary files included
3. **Sustainability:** Code is clean, documented, and "calm"
4. **Audit Alignment:** Addresses items in `AUDIT_LOG.md`

## 📄 License

TBD (Expected: MIT or Apache 2.0)

## 🙏 Acknowledgments

Built with the philosophy of "Planning with Files" and the vision of a **Sustainable Intelligence Platform**.

**Author:** Manus AI (Dojo)  
**Status:** Sprint 1 Complete  
**Version:** 0.1.0  
**Last Updated:** January 10, 2026
