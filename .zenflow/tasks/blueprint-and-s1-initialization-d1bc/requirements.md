# Product Requirements Document: 11-11 Initialization & UI Shell (Sprint 1)

## 1. Overview

### 1.1 Purpose
Initialize the 11-11 "Sustainable Intelligence Platform" repository and build the foundational "Command Center" UI Shell that serves as the primary interface for prompt engineering and multi-agent orchestration.

### 1.2 Core Philosophy
- **Planning with Files**: Filesystem as the source of truth
- **Hybrid Storage**: Google Drive (personal) + GitHub (version control)
- **Sustainable Innovation**: Clean, stable, high-signal development
- **Agent-Native**: Built for AI orchestration from the ground up

### 1.3 Target Users
- Prompt engineers working on complex AI workflows
- Developers building and testing multi-agent systems
- Teams collaborating on AI-powered projects
- Individual creators managing personal AI workspaces

## 2. Functional Requirements

### 2.1 Repository Structure
**Priority**: Critical

Initialize the "Planning with Files" directory hierarchy:

```
/
├── 00_Roadmap/          # High-level goals and task_plan.md
├── 01_PRDs/             # Product Requirement Documents
├── 02_Specs/            # Technical specifications and architecture
├── 03_Prompts/          # Local prompt library (with public metadata)
├── 04_System/           # AI Personas and system prompts
├── 05_Logs/             # Visual dev traces and audit logs
│   └── AUDIT_LOG.md     # Weekly code audit log
├── JOURNAL.md           # Persistent build trace
└── .gitignore           # Standard ignores for Next.js
```

**Acceptance Criteria**:
- All directories are created with placeholder README.md files
- JOURNAL.md initialized with project setup entry
- AUDIT_LOG.md initialized with template structure
- .gitignore includes node_modules/, .next/, dist/, build/, .env*, etc.

### 2.2 Command Center UI Shell
**Priority**: Critical

#### 2.2.1 Layout Architecture
- **Flexible Multi-Panel Layout**: Use `react-resizable-panels` for resizable sections
- **Responsive Design**: Support desktop (1280px+), tablet (768px+), mobile (320px+)
- **Persistent State**: Panel sizes and positions saved to localStorage

**Panels**:
1. **Sidebar** (left, collapsible, 20-30% width)
2. **Main Content** (center, 50-70% width)
3. **Optional Right Panel** (for future features)

**Acceptance Criteria**:
- Panels can be resized smoothly via drag handles
- Sidebar can collapse/expand with animation
- Layout state persists across page refreshes
- Minimum panel widths prevent UI breaking

#### 2.2.2 Sidebar: File Tree Navigator
**Priority**: High

- **Display**: Hierarchical tree view of the hybrid filesystem
- **Icons**: Folder/file icons using Lucide Icons
- **Interactions**:
  - Click to expand/collapse folders
  - Click to open files in main content area
  - Right-click context menu (future: create, rename, delete)
- **Mock Data**: For Sprint 1, use static mock representing the planning structure

**Visual Indicators**:
- Google Drive items: Cloud icon badge
- GitHub items: GitHub icon badge
- Modified/unsaved: Dot indicator

**Acceptance Criteria**:
- Tree renders the full planning hierarchy
- Expand/collapse animations are smooth (Framer Motion)
- Selected item is highlighted
- Icons clearly differentiate file types and sources

#### 2.2.3 Header Bar
**Priority**: High

**Left Section**:
- **11-11 Logo/Branding**: Text or icon logo
- **Workspace Selector**: Dropdown showing current workspace name (mock: "Personal Workspace")

**Center Section**:
- **Current File Path/Breadcrumb**: Shows active file location

**Right Section**:
- **Sync Status Indicator**: 
  - Google Drive icon with status (synced/syncing/error)
  - GitHub icon with status (synced/syncing/error)
  - Tooltip on hover showing last sync time
- **Sign In Button**: Google OAuth (mocked for Sprint 1)
- **User Avatar**: Placeholder for authenticated user

**Acceptance Criteria**:
- Header is fixed/sticky at top
- All icons are from Lucide Icons library
- Sync status shows visual feedback (color-coded: green=synced, blue=syncing, red=error)
- Sign In button shows mock modal or placeholder

#### 2.2.4 Main Content: Tabbed Interface
**Priority**: High

**Tab Options**:
1. **Markdown Editor**: Code editor for prompt files (future: Monaco/CodeMirror)
2. **Multi-Agent Workspace**: Grid view of agent chat panels

**Behavior**:
- Tabs rendered at top of main content area
- Active tab highlighted
- Tab switching with smooth transitions (Framer Motion)
- Each tab maintains its own state

**Acceptance Criteria**:
- Tabs switch instantly without flickering
- Active tab visually distinct
- Transitions are subtle and "calm" (200-300ms ease)

### 2.3 Multi-Agent Workspace View
**Priority**: Critical

#### 2.3.1 Grid Layout
- **Default**: 2-column grid for chat panels
- **Responsive**: 1 column on mobile, 2-3 columns on desktop
- **Dynamic**: Grid adjusts as panels are added/removed

#### 2.3.2 Chat Panels
Each `ChatPanel` component includes:
- **Header**: Agent name/persona selector
- **Message Area**: Scrollable chat history (mocked messages for Sprint 1)
- **Input Field**: Text input with send button
- **Controls**: Minimize, maximize, close buttons

**Interactions**:
- Type and send messages (mock responses for Sprint 1)
- Scroll through chat history
- Close panel removes it from grid
- Minimize collapses to header only

#### 2.3.3 New Session Button
- **Location**: Floating action button (FAB) in bottom-right of multi-agent view
- **Action**: Spawns a new chat panel in the grid
- **Limit**: Max 6 concurrent panels (prevents overwhelming UI)

**Acceptance Criteria**:
- New Session button is always visible and accessible
- Click creates new panel with default agent persona
- Grid reflows smoothly to accommodate new panel
- Disabled when max panels reached (with tooltip explanation)

### 2.4 Visual Trace Protocol
**Priority**: High

Document the build process following the "Visual Trace" philosophy:

1. **Localhost**: Provide clear instructions to run the development server
2. **Screenshot**: Capture key UI states (sidebar open/closed, multi-agent view, tabs)
3. **Journal Entry**: Update JOURNAL.md with:
   - Layout architecture decisions
   - Component structure
   - Technology choices
   - Challenges and resolutions

**Acceptance Criteria**:
- JOURNAL.md has detailed entry for Sprint 1
- README.md includes setup and run instructions
- Screenshots saved to `/05_Logs/screenshots/sprint1/`

### 2.5 Dev-Mode Auth Bypass
**Priority**: Critical

**Requirement**: Autonomous agents should not be blocked by authentication during development.

**Implementation**:
- `MockSessionProvider` component wrapping the app
- Environment variable `NEXT_PUBLIC_DEV_MODE=true` enables mock auth
- Mock user data includes: name, email, avatar, provider (Google/GitHub)
- Middleware bypass for dev mode routes

**Acceptance Criteria**:
- App runs without authentication in dev mode
- Mock user appears in header when dev mode enabled
- Production builds require real authentication
- Clear console warnings when dev mode is active

## 3. Non-Functional Requirements

### 3.1 Performance
- **Initial Load**: < 2 seconds on 4G connection
- **Panel Resize**: 60 FPS during drag operations
- **Tab Switching**: < 100ms transition time
- **Bundle Size**: < 500KB initial JavaScript (gzipped)

### 3.2 Accessibility
- **Keyboard Navigation**: Full keyboard support for all interactions
- **ARIA Labels**: Proper ARIA attributes for screen readers
- **Color Contrast**: WCAG AA compliance (4.5:1 for text)
- **Focus Indicators**: Visible focus states for all interactive elements

### 3.3 Browser Support
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **No IE11**: Modern JavaScript/CSS only

### 3.4 Code Quality
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with recommended Next.js config
- **Formatting**: Prettier for consistent code style
- **Testing**: Setup Jest + React Testing Library (tests in Sprint 2)

## 4. Technical Constraints

### 4.1 Tech Stack (Mandatory)
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS 3.4+
- **Animations**: Framer Motion 11+
- **Icons**: Lucide React
- **Panels**: react-resizable-panels
- **Language**: TypeScript 5.0+
- **Package Manager**: npm or pnpm

### 4.2 Design System
**Aesthetic**: "Hardworking" and "Calm"

**Color Palette** (Assumption):
- **Primary**: Blue-gray tones (#334155, #475569)
- **Accent**: Teal (#14b8a6) for active states
- **Background**: Near-white (#fafafa) for light mode
- **Text**: Dark gray (#1e293b) for primary text
- **Borders**: Light gray (#e2e8f0)

**Typography**:
- **Font**: System fonts (Inter or similar sans-serif)
- **Sizes**: 12px (small), 14px (body), 16px (heading), 20px+ (title)

**Spacing**: Tailwind's default spacing scale (4px base unit)

**Animations**: 
- Subtle, 200-300ms durations
- Ease-in-out timing functions
- Avoid flashy or distracting movements

## 5. Assumptions and Open Questions

### 5.1 Assumptions Made
1. **TypeScript**: Using TypeScript for type safety (not explicitly stated but implied by "enterprise-ready")
2. **Next.js Version**: Latest stable (14.x) with App Router
3. **Mock Data**: Sprint 1 uses static mocks for file tree and chat messages
4. **Authentication**: Google OAuth only for Sprint 1 (GitHub OAuth in future sprint)
5. **Deployment**: Localhost only for Sprint 1 (no production deployment)
6. **State Management**: React Context + hooks (no Redux/Zustand yet)
7. **Dark Mode**: Light mode only for Sprint 1 (dark mode in future)

### 5.2 Out of Scope for Sprint 1
- Real Google Drive/GitHub API integration
- Actual authentication flow (mocked only)
- Markdown editor implementation (placeholder only)
- Real chat functionality (mocked responses)
- Right-click context menus
- Keyboard shortcuts
- User settings/preferences
- Dark mode toggle
- Mobile optimizations (responsive layout only)

### 5.3 Questions for Stakeholder
1. **Color Preferences**: Are there specific brand colors or should we proceed with the blue-gray palette?
2. **Agent Personas**: What are the default agent personas for the multi-agent view (e.g., "Manus", "Supervisor")?
3. **File Tree Depth**: What's the maximum folder depth to display in the sidebar?
4. **Localization**: English only or plan for i18n from the start?

**Decision**: Proceeding with assumptions above unless feedback received.

## 6. Success Criteria

Sprint 1 is successful when:
1. ✅ Repository structure matches the "Planning with Files" hierarchy
2. ✅ JOURNAL.md and AUDIT_LOG.md are initialized
3. ✅ UI Shell renders with sidebar, header, and main content
4. ✅ Sidebar shows mock file tree with expand/collapse
5. ✅ Header displays workspace selector, sync status, and sign-in button
6. ✅ Tabs switch between Markdown Editor (placeholder) and Multi-Agent view
7. ✅ Multi-Agent view displays grid of chat panels
8. ✅ New Session button spawns additional chat panels
9. ✅ Dev-mode auth bypass allows running without authentication
10. ✅ All animations are smooth and "calm" (Framer Motion)
11. ✅ App runs on localhost with `npm run dev`
12. ✅ Code passes linting and type checking

## 7. Deliverables

1. **Initialized Repository**: All planning directories with README files
2. **Next.js Application**: Configured with TypeScript, Tailwind, Framer Motion
3. **UI Components**: Layout, Sidebar, Header, Tabs, ChatPanel, NewSessionButton
4. **Mock Providers**: MockSessionProvider for auth bypass
5. **Documentation**: 
   - JOURNAL.md with Sprint 1 entry
   - README.md with setup instructions
   - Component documentation in code comments
6. **Visual Trace**: Screenshots in `/05_Logs/screenshots/sprint1/`

## 8. Timeline Estimate

**Total Effort**: 8-12 hours (assumes single developer)

**Breakdown**:
- Repository setup: 1 hour
- Next.js + dependencies setup: 1 hour
- Layout and panels: 2-3 hours
- Sidebar file tree: 2 hours
- Header components: 1-2 hours
- Multi-agent view: 2-3 hours
- Polish and documentation: 1-2 hours

**Note**: Following "Sustainable Innovation" philosophy, this should be paced work, not a rush sprint.

---

**Document Version**: 1.0  
**Created**: Sprint 1, Phase 1  
**Status**: Ready for Technical Specification  
**Next Step**: Create `spec.md` based on this PRD
