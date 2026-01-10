# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: a771d24a-a3c4-4142-8ae1-e87d5cfd2acc -->

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: 5caf9d53-e331-4408-a047-e94c8300e32f -->

Create a technical specification based on the PRD in `{@artifacts_path}/requirements.md`.

1. Review existing codebase architecture and identify reusable components
2. Define the implementation approach

Save to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach referencing existing code patterns
- Source code structure changes
- Data model / API / interface changes
- Delivery phases (incremental, testable milestones)
- Verification approach using project lint/test commands

### [x] Step: Planning
<!-- chat-id: fd4bdd1d-c51d-4a86-ab8d-dfac0a29aa80 -->

Create a detailed implementation plan based on `{@artifacts_path}/spec.md`.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps
3. Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function) or too broad (entire feature).

If the feature is trivial and doesn't warrant full specification, update this workflow to remove unnecessary steps and explain the reasoning to the user.

Save to `{@artifacts_path}/plan.md`.

### [x] Step: Phase 1 - Project Initialization
<!-- chat-id: ab5cc901-6d34-45bf-a0f9-ad6aac7b3040 -->

Initialize Next.js application and create planning directory structure.

**Tasks**:
1. Initialize Next.js 14 with TypeScript and App Router
2. Install and configure dependencies (Tailwind, Framer Motion, lucide-react, react-resizable-panels, clsx, tailwind-merge)
3. Create planning directory structure (`00_Roadmap`, `01_PRDs`, `02_Specs`, `03_Prompts`, `04_System`, `05_Logs`)
4. Initialize `JOURNAL.md` in project root with Sprint 1 header
5. Initialize `AUDIT_LOG.md` in `05_Logs/` with template
6. Create placeholder README files in all planning directories
7. Configure `.gitignore` for Next.js + Node.js (ensure node_modules, .next, .env.local are excluded)
8. Set up Next.js config (`next.config.mjs`), TypeScript config, Tailwind config, PostCSS config
9. Create `.env.local` with `NEXT_PUBLIC_DEV_MODE=true`

**Verification**:
```bash
npm run dev  # Should start on http://localhost:3000
```

### [x] Step: Phase 2 - Layout Foundation
<!-- chat-id: 7089f4a5-73a0-403a-ad79-2b2a66e25208 -->

Implement resizable panel layout with persistence.

**Tasks**:
1. Create `lib/utils.ts` with `cn()` utility function
2. Create `lib/types.ts` with core TypeScript interfaces (FileNode, User, Session, ChatMessage, etc.)
3. Create `lib/constants.ts` with app constants (AGENT_PERSONAS, MAX_CHAT_PANELS, sidebar widths)
4. Implement `components/layout/CommandCenter.tsx` with `react-resizable-panels`
5. Create `components/layout/Sidebar.tsx` with collapse/expand animation
6. Create `components/layout/MainContent.tsx` with tab switching logic
7. Update `app/page.tsx` to render CommandCenter
8. Implement localStorage persistence for panel sizes
9. Add basic Tailwind styling and ensure responsive layout

**Verification**:
- Panels resize smoothly via drag handles
- Sidebar collapses/expands with animation
- State persists after page reload (check localStorage)

### [x] Step: Phase 3 - Header & Navigation
<!-- chat-id: d4d2ae11-9ce3-4ad4-bd47-f9e19a5f1e56 -->

Build functional header with workspace selector, sync status, and mock auth.

**Tasks**:
1. Create `components/layout/Header.tsx` with logo, workspace selector, sync status, sign-in button
2. Create `components/shared/WorkspaceSelector.tsx` dropdown component
3. Create `components/shared/SyncStatus.tsx` with mock status indicators (Google Drive + GitHub)
4. Create `components/providers/MockSessionProvider.tsx` for dev-mode auth bypass
5. Update `app/layout.tsx` to wrap application with MockSessionProvider
6. Add Lucide icons throughout (Brain, GitBranch, Cloud, User, etc.)
7. Style header with Tailwind CSS

**Verification**:
- Header displays 11-11 branding
- Workspace selector shows "Personal Workspace"
- Sync status icons display (green = synced)
- Mock user avatar appears when `NEXT_PUBLIC_DEV_MODE=true`

### [x] Step: Phase 4 - File Tree Sidebar
<!-- chat-id: 79231012-f019-421e-8e4d-76909541a629 -->

Build interactive file tree with mock data.

**Tasks**:
1. Create `data/mockFileTree.ts` with mock file structure (00_Roadmap through 05_Logs + JOURNAL.md)
2. Create `components/shared/FileTree.tsx` recursive component
3. Implement expand/collapse logic for folders
4. Add source badges (Google Drive and GitHub icons)
5. Add modified indicator (dot badge for modified files)
6. Add hover and selection states with Tailwind
7. Integrate FileTree into Sidebar component

**Verification**:
- Folders expand/collapse on click
- Google Drive/GitHub badges display correctly
- Modified files show dot indicator
- Selected file is highlighted
- All 6 planning folders + JOURNAL.md display

### [x] Step: Phase 5 - Tabbed Interface
<!-- chat-id: 42969b81-3242-4bce-8c4e-4796af3b1da5 -->

Implement smooth tab switching between Editor and Multi-Agent views.

**Tasks**:
1. Implement tab state management in `components/layout/MainContent.tsx`
2. Add Framer Motion transitions for tab switching (AnimatePresence)
3. Create placeholder component for Markdown Editor tab
4. Create `components/multi-agent/MultiAgentView.tsx` grid container
5. Style tabs with active/inactive states
6. Ensure smooth transitions (200-300ms duration)

**Verification**:
- Tabs switch smoothly without flickering
- Transition completes in 200-300ms
- Active tab is visually distinct
- Each tab maintains its own state

### [x] Step: Phase 6 - Multi-Agent Workspace
<!-- chat-id: 4ab53f69-0af7-4cef-83d5-482d649aaa70 -->

Build functional multi-agent chat interface.

**Tasks**:
1. Create `components/multi-agent/ChatPanel.tsx` with header, messages area, and input
2. Implement panel minimize/maximize/close logic
3. Create `components/multi-agent/NewSessionButton.tsx` FAB (Floating Action Button)
4. Add mock chat messages and responses (simulate AI response with setTimeout)
5. Implement responsive grid layout (1-3 columns based on viewport)
6. Enforce max panel limit (6 panels) - disable button when limit reached
7. Add Framer Motion animations for panel spawn/close
8. Style panels with Tailwind (clean, calm aesthetic)

**Verification**:
- Click "New Session" to spawn new chat panels
- Type messages and see mock responses appear
- Minimize/maximize/close panels
- Grid reflows responsively when panels are added/removed
- Max 6 panels enforced (button disabled after 6)

### [x] Step: Phase 7 - Polish & Documentation
<!-- chat-id: e500c806-fa48-49ac-a46f-ee1aef3e3942 -->

Production-ready deliverable with documentation and quality checks.

**Tasks**:
1. Update `JOURNAL.md` with Sprint 1 entry documenting layout logic and component structure
2. Create `README.md` with setup instructions, run commands, and project overview
3. Create `05_Logs/screenshots/sprint1/` directory
4. Capture screenshots of:
   - Full layout with sidebar expanded
   - Multi-agent view with 3+ chat panels
   - Header showing sync status and workspace selector
5. Run and fix all ESLint warnings
6. Run and fix all TypeScript type errors
7. Test responsive breakpoints (320px, 768px, 1280px)
8. Verify all acceptance criteria from requirements.md are met
9. Test production build

**Verification**:
```bash
npm run lint       # Should pass with no errors
npm run type-check # TypeScript should compile successfully
npm run build      # Production build should succeed
```

**Manual Testing Checklist**:
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
