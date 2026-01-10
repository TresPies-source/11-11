# Technical Specification: 11-11 Initialization & UI Shell (Sprint 1)

## 1. Technical Context

### 1.1 Core Technologies
- **Framework**: Next.js 14.2+ (App Router with React Server Components)
- **Language**: TypeScript 5.3+ (strict mode)
- **Runtime**: Node.js 18+ LTS
- **Package Manager**: npm (lockfile: package-lock.json)

### 1.2 Key Dependencies
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.344.0",
    "react-resizable-panels": "^2.0.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.2.0",
    "prettier": "^3.2.0"
  }
}
```

### 1.3 Build Configuration
- **Bundler**: Webpack (via Next.js)
- **CSS**: Tailwind CSS with JIT compiler
- **TypeScript**: Strict mode, path aliases (`@/*`)
- **Output**: Optimized static + server bundles

## 2. Implementation Approach

### 2.1 Architecture Overview

**Pattern**: Component-Based Architecture with App Router

```
app/
├── layout.tsx           # Root layout with providers
├── page.tsx             # Main command center page
├── globals.css          # Tailwind directives
└── api/                 # Future: API routes

components/
├── layout/              # Layout components
│   ├── CommandCenter.tsx       # Main shell container
│   ├── Header.tsx              # Top header bar
│   ├── Sidebar.tsx             # File tree sidebar
│   └── MainContent.tsx         # Tabbed content area
├── multi-agent/         # Multi-agent workspace
│   ├── MultiAgentView.tsx      # Grid container
│   ├── ChatPanel.tsx           # Individual chat panel
│   └── NewSessionButton.tsx    # FAB for new sessions
├── shared/              # Shared components
│   ├── FileTree.tsx            # Hierarchical file tree
│   ├── SyncStatus.tsx          # Sync indicator
│   └── WorkspaceSelector.tsx   # Dropdown selector
└── providers/           # Context providers
    └── MockSessionProvider.tsx # Dev-mode auth

lib/
├── utils.ts             # Utility functions (cn, etc.)
├── types.ts             # Shared TypeScript types
└── constants.ts         # App constants

data/
└── mockFileTree.ts      # Static mock data for file tree
```

### 2.2 State Management Strategy

**Local State**: React `useState` for component-specific state
**Shared State**: React Context for cross-component state
**Persistence**: localStorage for panel sizes and UI preferences

**Key State Domains**:
1. **Layout State**: Panel sizes, sidebar collapsed, active tab
2. **Session State**: Mock user data (dev mode)
3. **Multi-Agent State**: Active chat panels, messages

**Implementation**:
```typescript
// No global state library needed for Sprint 1
// Use React Context sparingly, prefer prop drilling for shallow trees
```

### 2.3 Styling Approach

**Tailwind Configuration**:
```javascript
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8fafc',
          500: '#475569',
          700: '#334155',
        },
        accent: {
          500: '#14b8a6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

**Utility Pattern**:
```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 2.4 Animation Strategy

**Framer Motion Usage**:
- Sidebar collapse/expand: `AnimatePresence` + `motion.div`
- Tab transitions: `layoutId` for smooth morphing
- Panel spawning: `initial` → `animate` transitions
- Timing: 200-300ms with `ease-in-out`

**Example Pattern**:
```typescript
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -20 }}
  transition={{ duration: 0.25, ease: 'easeInOut' }}
>
```

### 2.5 Dev-Mode Auth Implementation

**Environment Variables** (`.env.local`):
```
NEXT_PUBLIC_DEV_MODE=true
```

**MockSessionProvider**:
```typescript
// components/providers/MockSessionProvider.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';

interface MockUser {
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'github';
}

const mockUser: MockUser = {
  name: 'Dev User',
  email: 'dev@11-11.local',
  avatar: '/avatar-placeholder.png',
  provider: 'google'
};

const SessionContext = createContext<{ user: MockUser | null }>({ user: null });

export function MockSessionProvider({ children }: { children: ReactNode }) {
  const devMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  
  if (devMode) {
    console.warn('🔧 Dev Mode: Authentication bypassed');
  }

  return (
    <SessionContext.Provider value={{ user: devMode ? mockUser : null }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
```

## 3. Source Code Structure

### 3.1 Project Root
```
11-11/
├── .gitignore                  # Node, Next.js, env files
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript config
├── tailwind.config.js          # Tailwind config
├── postcss.config.js           # PostCSS config
├── next.config.mjs             # Next.js config
├── .env.local                  # Local environment vars
├── JOURNAL.md                  # Build trace log
├── README.md                   # Setup instructions
│
├── 00_Roadmap/
│   └── README.md               # Roadmap overview
├── 01_PRDs/
│   └── README.md               # PRD directory
├── 02_Specs/
│   └── README.md               # Specs directory
├── 03_Prompts/
│   └── README.md               # Prompt library
├── 04_System/
│   └── README.md               # AI personas
├── 05_Logs/
│   ├── AUDIT_LOG.md            # Weekly audit log
│   └── screenshots/
│       └── sprint1/            # Sprint 1 screenshots
│
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles
│
├── components/
│   ├── layout/
│   ├── multi-agent/
│   ├── shared/
│   └── providers/
│
├── lib/
│   ├── utils.ts
│   ├── types.ts
│   └── constants.ts
│
└── data/
    └── mockFileTree.ts
```

### 3.2 Next.js Configuration

**next.config.mjs**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 4. Data Models & Interfaces

### 4.1 Core Type Definitions

**lib/types.ts**:
```typescript
// File Tree Types
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  source: 'google-drive' | 'github' | 'local';
  modified?: boolean;
  children?: FileNode[];
  path?: string;
}

// Session Types
export interface User {
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'github';
}

export interface Session {
  user: User | null;
}

// Multi-Agent Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatPanel {
  id: string;
  agentName: string;
  messages: ChatMessage[];
  isMinimized: boolean;
}

export interface AgentPersona {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// Sync Status Types
export type SyncStatus = 'synced' | 'syncing' | 'error';

export interface SyncState {
  googleDrive: SyncStatus;
  github: SyncStatus;
  lastSyncTime?: Date;
}

// Layout Types
export interface LayoutState {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  activeTab: 'editor' | 'multi-agent';
}
```

### 4.2 Mock Data Structure

**data/mockFileTree.ts**:
```typescript
import { FileNode } from '@/lib/types';

export const mockFileTree: FileNode[] = [
  {
    id: '1',
    name: '00_Roadmap',
    type: 'folder',
    source: 'local',
    children: [
      { id: '1.1', name: 'README.md', type: 'file', source: 'local', path: '/00_Roadmap/README.md' },
      { id: '1.2', name: 'task_plan.md', type: 'file', source: 'google-drive', path: '/00_Roadmap/task_plan.md' }
    ]
  },
  {
    id: '2',
    name: '01_PRDs',
    type: 'folder',
    source: 'local',
    children: [
      { id: '2.1', name: 'README.md', type: 'file', source: 'local', path: '/01_PRDs/README.md' }
    ]
  },
  {
    id: '3',
    name: '02_Specs',
    type: 'folder',
    source: 'local',
    children: [
      { id: '3.1', name: 'README.md', type: 'file', source: 'local', path: '/02_Specs/README.md' }
    ]
  },
  {
    id: '4',
    name: '03_Prompts',
    type: 'folder',
    source: 'local',
    children: [
      { id: '4.1', name: 'README.md', type: 'file', source: 'local', path: '/03_Prompts/README.md' }
    ]
  },
  {
    id: '5',
    name: '04_System',
    type: 'folder',
    source: 'local',
    children: [
      { id: '5.1', name: 'README.md', type: 'file', source: 'local', path: '/04_System/README.md' }
    ]
  },
  {
    id: '6',
    name: '05_Logs',
    type: 'folder',
    source: 'local',
    children: [
      { id: '6.1', name: 'AUDIT_LOG.md', type: 'file', source: 'local', path: '/05_Logs/AUDIT_LOG.md' }
    ]
  },
  {
    id: '7',
    name: 'JOURNAL.md',
    type: 'file',
    source: 'github',
    modified: true,
    path: '/JOURNAL.md'
  }
];
```

**lib/constants.ts**:
```typescript
export const AGENT_PERSONAS = [
  { id: 'manus', name: 'Manus', description: 'High-agency reasoning agent', icon: 'brain' },
  { id: 'supervisor', name: 'Supervisor', description: 'Orchestration and planning', icon: 'organization' },
  { id: 'librarian', name: 'Librarian', description: 'Semantic search and suggestions', icon: 'book' }
];

export const MAX_CHAT_PANELS = 6;

export const DEFAULT_SIDEBAR_WIDTH = 280;
export const MIN_SIDEBAR_WIDTH = 200;
export const MAX_SIDEBAR_WIDTH = 500;
```

## 5. Delivery Phases

### Phase 1: Project Initialization (Checkpoint 1)
**Goal**: Bootable Next.js application with structure

**Tasks**:
1. Initialize Next.js 14 with TypeScript and App Router
2. Install and configure dependencies (Tailwind, Framer Motion, etc.)
3. Create planning directory structure (`00_Roadmap` through `05_Logs`)
4. Initialize `JOURNAL.md` and `AUDIT_LOG.md` with templates
5. Configure `.gitignore` for Next.js + Node.js
6. Create placeholder README files in all planning directories
7. Verify: `npm run dev` starts successfully

**Verification**:
```bash
npm run dev
# Should start on http://localhost:3000
# Should show default Next.js page (to be replaced)
```

### Phase 2: Layout Foundation (Checkpoint 2)
**Goal**: Resizable panel layout with persistence

**Tasks**:
1. Implement `CommandCenter.tsx` with `react-resizable-panels`
2. Create `Sidebar.tsx` with collapse/expand animation
3. Create `MainContent.tsx` with tab switching logic
4. Implement localStorage persistence for panel sizes
5. Add basic styling with Tailwind
6. Verify: Panels resize smoothly, sidebar collapses, state persists

**Verification**:
- Resize panels via drag handles
- Collapse/expand sidebar
- Refresh page, verify state persists
- Check localStorage for saved state

### Phase 3: Header & Navigation (Checkpoint 3)
**Goal**: Functional header with all required elements

**Tasks**:
1. Create `Header.tsx` with logo, workspace selector, sync status, sign-in
2. Create `WorkspaceSelector.tsx` dropdown component
3. Create `SyncStatus.tsx` with mock status indicators
4. Implement `MockSessionProvider.tsx` for dev-mode auth
5. Add Lucide icons throughout
6. Verify: All header elements render and interact correctly

**Verification**:
- Header shows 11-11 branding
- Workspace selector shows "Personal Workspace"
- Sync status icons display (green = synced)
- Mock user appears when `NEXT_PUBLIC_DEV_MODE=true`

### Phase 4: File Tree Sidebar (Checkpoint 4)
**Goal**: Interactive file tree with mock data

**Tasks**:
1. Create `FileTree.tsx` recursive component
2. Implement expand/collapse logic for folders
3. Add source badges (Google Drive, GitHub icons)
4. Add modified indicator (dot badge)
5. Load `mockFileTree` data
6. Add hover and selection states
7. Verify: Tree expands/collapses, icons display correctly

**Verification**:
- Click folders to expand/collapse
- See Google Drive/GitHub badges
- Modified files show dot indicator
- Selected file is highlighted

### Phase 5: Tabbed Interface (Checkpoint 5)
**Goal**: Smooth tab switching between Editor and Multi-Agent views

**Tasks**:
1. Implement tab state management in `MainContent.tsx`
2. Add Framer Motion transitions for tab switching
3. Create placeholder for Markdown Editor tab
4. Create `MultiAgentView.tsx` grid container
5. Verify: Tabs switch smoothly without flickering

**Verification**:
- Click tabs to switch views
- Transition is smooth (200-300ms)
- Active tab is visually distinct
- Each tab maintains its own state

### Phase 6: Multi-Agent Workspace (Checkpoint 6)
**Goal**: Functional multi-agent chat interface

**Tasks**:
1. Create `ChatPanel.tsx` component with header, messages, input
2. Implement panel minimize/maximize/close logic
3. Create `NewSessionButton.tsx` FAB
4. Add mock chat messages and responses
5. Implement grid layout with responsive columns
6. Add max panel limit (6 panels)
7. Verify: Panels spawn, close, and respond to input

**Verification**:
- Click "New Session" to spawn panels
- Type messages, see mock responses
- Minimize/maximize panels
- Close panels, grid reflows
- Max 6 panels enforced

### Phase 7: Polish & Documentation (Checkpoint 7)
**Goal**: Production-ready Sprint 1 deliverable

**Tasks**:
1. Update `JOURNAL.md` with Sprint 1 entry
2. Create `README.md` with setup and run instructions
3. Add screenshots to `/05_Logs/screenshots/sprint1/`
4. Run ESLint and fix all warnings
5. Run TypeScript type checking, fix all errors
6. Test responsiveness on mobile/tablet breakpoints
7. Verify: All acceptance criteria from PRD met

**Verification**:
```bash
npm run lint       # Should pass with no errors
npm run type-check # TypeScript should compile successfully
npm run build      # Production build should succeed
```

## 6. Verification Approach

### 6.1 Development Scripts

**package.json scripts**:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,md,json}\""
  }
}
```

### 6.2 Quality Gates

**Pre-Merge Checklist**:
1. ✅ `npm run lint` passes with zero errors
2. ✅ `npm run type-check` passes with zero errors
3. ✅ `npm run build` completes successfully
4. ✅ All UI interactions tested manually in browser
5. ✅ Responsive breakpoints verified (mobile, tablet, desktop)
6. ✅ Dev-mode auth bypass works (`NEXT_PUBLIC_DEV_MODE=true`)
7. ✅ JOURNAL.md updated with build notes
8. ✅ Screenshots captured and saved

### 6.3 Manual Testing Checklist

**Layout Tests**:
- [ ] Sidebar resizes from 200px to 500px
- [ ] Sidebar collapses to icon-only mode
- [ ] Panel sizes persist after page reload
- [ ] Layout is responsive at 320px, 768px, 1280px widths

**Header Tests**:
- [ ] Workspace selector shows "Personal Workspace"
- [ ] Sync status shows green (synced) icons
- [ ] Mock user avatar displays in dev mode
- [ ] Sign-in button shows (non-functional for Sprint 1)

**File Tree Tests**:
- [ ] All 6 planning folders display
- [ ] Folders expand/collapse on click
- [ ] Google Drive icon shows on relevant files
- [ ] GitHub icon shows on relevant files
- [ ] Modified dot indicator appears on `JOURNAL.md`

**Multi-Agent Tests**:
- [ ] New Session button spawns new chat panel
- [ ] Chat panels display in responsive grid (1-3 columns)
- [ ] Messages can be typed and sent
- [ ] Mock responses appear after sending
- [ ] Panels can be minimized, maximized, closed
- [ ] Max 6 panels enforced (button disabled after 6)

**Animation Tests**:
- [ ] Sidebar collapse/expand animates smoothly
- [ ] Tab switching has fade transition
- [ ] New panel spawn has scale/fade animation
- [ ] All animations complete in 200-300ms

### 6.4 Accessibility Tests

**Keyboard Navigation**:
- [ ] Tab key navigates through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Arrow keys navigate file tree (future enhancement)

**Screen Reader**:
- [ ] All buttons have aria-labels
- [ ] Sync status has descriptive aria-live regions
- [ ] File tree has proper ARIA tree attributes

**Contrast**:
- [ ] Text contrast meets WCAG AA (4.5:1)
- [ ] Focus indicators are visible (outline or ring)

## 7. Risk Mitigation

### 7.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Panel resize performance issues | Medium | High | Use CSS transforms, debounce resize events, limit max panels |
| Animation jank on low-end devices | Medium | Medium | Use `will-change`, GPU-accelerated properties, test on low-end hardware |
| TypeScript strict mode errors | Low | Medium | Start with strict mode from day 1, use proper type definitions |
| Bundle size exceeds 500KB | Low | Medium | Use Next.js dynamic imports for heavy components, analyze bundle with `@next/bundle-analyzer` |

### 7.2 UX Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Layout state not persisting | Low | High | Test localStorage thoroughly, add error handling for quota exceeded |
| Confusing multi-agent UX with 6+ panels | Medium | Medium | Enforce max 6 panels, add tooltip explaining limit |
| Sidebar too narrow/wide | Medium | Low | Set sensible min/max widths (200px-500px), default to 280px |

## 8. Performance Budget

### 8.1 Metrics

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **JavaScript Bundle**: < 500KB (gzipped)

### 8.2 Optimization Strategies

1. **Code Splitting**: Dynamic import for `MultiAgentView` (deferred until tab active)
2. **Image Optimization**: Use Next.js `<Image>` component for avatars
3. **Font Optimization**: Use `next/font` for Inter font
4. **Tree Shaking**: Ensure only used Lucide icons are bundled
5. **Memoization**: Use `React.memo` for `ChatPanel` components

## 9. Future Considerations (Out of Scope for Sprint 1)

### 9.1 Sprint 2+ Features

- **Real Authentication**: NextAuth.js with Google + GitHub providers
- **Google Drive Integration**: File sync via Google Drive API
- **GitHub Integration**: Repository sync via Octokit
- **Markdown Editor**: Monaco Editor or CodeMirror integration
- **Real AI Chat**: Integration with Manus API and Google Gemini
- **Dark Mode**: Theme toggle with system preference detection
- **Keyboard Shortcuts**: Vim-style navigation and shortcuts
- **Right-Click Menus**: Context menus for file operations
- **Search**: Global search across prompts and files

### 9.2 Technical Debt to Address

- **State Management**: Evaluate Zustand or Jotai if Context becomes unwieldy
- **Testing**: Add unit tests with Jest and integration tests with Playwright
- **Error Boundaries**: Add React Error Boundaries for graceful failures
- **Logging**: Add structured logging for debugging
- **Analytics**: Add privacy-respecting analytics (Plausible or self-hosted)

---

**Document Version**: 1.0  
**Created**: Sprint 1, Phase 1  
**Status**: Ready for Implementation Planning  
**Next Step**: Create detailed implementation plan in `plan.md`
