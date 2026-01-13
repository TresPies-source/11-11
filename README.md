# 11-11: The Sustainable Intelligence OS

**Version:** 0.2.0 (Local-First Foundation)

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

### Database Setup (Automatic)

11-11 uses **PGlite** for local-first storage—a lightweight Postgres database that runs directly in your browser:

- **Zero Configuration:** Database auto-initializes on first run using IndexedDB
- **Seed Data:** 30 realistic prompts automatically loaded on first launch
- **Browser Storage:** Data persists in IndexedDB (browser local storage)
- **Full Postgres:** Real SQL queries, indexes, triggers, and JSONB support

No external services, API keys, or setup required. Just `npm run dev` and start working.

### Development Mode

By default, the application runs with **dev-mode auth bypass** enabled:

```env
NEXT_PUBLIC_DEV_MODE=true
```

This allows you to work without setting up OAuth. A mock user session is automatically injected.

### LLM Configuration (DeepSeek + OpenAI)

11-11 uses a **multi-model LLM infrastructure** with DeepSeek 3.2 as the primary provider and OpenAI as fallback:

#### DeepSeek API Setup (Primary Provider)

1. **Get your DeepSeek API key:**
   - Visit [https://platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
   - Sign up or log in
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Add to `.env.local`:**
   ```env
   DEEPSEEK_API_KEY=sk-your-deepseek-key-here
   ```

3. **Why DeepSeek?**
   - **Agent-native design:** Trained on 1,800+ agent environments
   - **Competitive performance:** Matches GPT-4o on reasoning and agentic tasks
   - **Cost savings:** 20-35% cheaper than GPT-4o-mini (see table below)
   - **Two-tier strategy:**
     - `deepseek-chat` for general agent tasks (supervisor, librarian, cost-guard)
     - `deepseek-reasoner` for complex reasoning (debugger, multi-step workflows)

#### OpenAI API Setup (Fallback Provider)

1. **Get your OpenAI API key:**
   - Visit [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Add to `.env.local`:**
   ```env
   OPENAI_API_KEY=sk-your-openai-key-here
   ```

3. **When is OpenAI used?**
   - Automatic fallback when DeepSeek is unavailable (API errors, rate limits)
   - Embeddings generation (`text-embedding-3-small`) for semantic search
   - Dev mode keyword-based routing (when no API keys configured)

#### Cost Comparison

| Provider | Model | Input ($/1M tokens) | Output ($/1M tokens) | Best For |
|----------|-------|---------------------|---------------------|----------|
| **DeepSeek** (Primary) | deepseek-chat | $0.28 ($0.028 cached*) | $0.42 | General agent tasks |
| **DeepSeek** (Primary) | deepseek-reasoner | $0.28 ($0.028 cached*) | $0.42 | Complex reasoning |
| **OpenAI** (Fallback) | gpt-4o-mini | $0.15 | $0.60 | Fallback, embeddings |

*90% cheaper with cache hits! DeepSeek's prompt caching can reduce costs to $0.028/1M tokens for cached inputs.

**Real-world savings:** 20-35% cost reduction compared to using GPT-4o-mini for all tasks.

#### Dev Mode Without API Keys

If you don't configure API keys, the application still works in **dev mode**:
- Supervisor router uses **keyword-based fallback** (no LLM calls)
- Query routing based on simple pattern matching
- Perfect for UI development and testing without API costs
- Add API keys when ready to test real agent intelligence

## 📁 Project Structure

```
11-11/
├── 00_Roadmap/          # High-level goals and task planning
├── 01_PRDs/             # Product Requirement Documents
├── 02_Specs/            # Technical specifications
├── 03_Prompts/          # Local prompt library
├── 04_System/           # AI Personas and system prompts
├── 05_Logs/             # Development traces and audit logs
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
├── AUDIT_LOG.md         # Weekly code audit log
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

## 🧩 Key Features

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

### ✅ The Librarian's Home (v0.1)
- **Seedling Section:** Work-in-progress prompts with real-time critique scores
- **Greenhouse Section:** Personal library of saved prompts with search/filtering
- **Reactive Critique Engine:** Rule-based scoring (Conciseness, Specificity, Context, Task Decomposition)
- **Status Management:** Seamless transitions between draft, active, saved, and archived states
- **PGlite Integration:** Local-first Postgres database with auto-initialization and seed data

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
| **Database** | PGlite | Local-first Postgres database (in-process) |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Animations** | Framer Motion | Smooth, performant animations |
| **Icons** | Lucide React | Clean, consistent iconography |
| **Layout** | react-resizable-panels | Resizable panel system |
| **Language** | TypeScript | Type-safe development |

### Important Dependency Note

⚠️ **Zod Version Constraint**: This project uses `zod@^3.23.8` (not v4.x) for compatibility with the OpenAI SDK.

The OpenAI SDK v4.104.0 requires Zod v3.x as a peer dependency. If you encounter an ERESOLVE error during `npm install`:

```bash
npm error Conflicting peer dependency: zod@3.x.x
```

**Solution:**
1. Ensure `package.json` specifies `"zod": "^3.23.8"` (not v4.x)
2. Perform a clean install:
   ```bash
   # Windows
   rmdir /s /q node_modules && del package-lock.json && npm install
   
   # macOS/Linux
   rm -rf node_modules package-lock.json && npm install
   ```
3. Verify: `npm run type-check && npm run build`

See [BUGS.md](./05_Logs/BUGS.md) (bug P2-006) and [JOURNAL.md](./JOURNAL.md) (Architecture Decision #9 in Supervisor Router sprint) for detailed documentation.

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
- **AUDIT_LOG.md** - Weekly code audit log (root directory)
- **01_PRDs/** - Product requirements and feature specs
- **02_Specs/** - Technical implementation specs

## 🗺️ Roadmap

### ✅ Sprint 1: UI Shell (v0.1) - **COMPLETE**
- Command Center layout with resizable panels
- Multi-agent workspace with chat interface
- Mock authentication and file tree

### ✅ The Librarian's Home (v0.1) - **COMPLETE**
- Seedling and Greenhouse sections for prompt management
- Reactive critique engine with rule-based scoring
- PGlite local database with auto-initialization and seed data
- Status transitions and search/filtering

### 📋 Sprint 2: Hybrid Storage (v0.2) - **PLANNED**
- Google Drive API integration
- GitHub API (Octokit) integration
- Real-time sync status indicators
- File CRUD operations

### 📋 Sprint 3: Markdown Editor (v0.3) - **PLANNED**
- Monaco/CodeMirror integration
- Live preview with syntax highlighting
- Auto-save to Google Drive/GitHub
- Conflict resolution UI

### 📋 Future: The Global Commons - **PLANNED**
- Global prompt gallery (Wikipedia of Prompts)
- Semantic search via pgvector
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
**Status:** Local-First Foundation (v0.2.0) Complete  
**Version:** 0.2.0  
**Last Updated:** January 12, 2026
