# Product Requirements Document: v0.2.0 "Local-First Foundation"

**Version:** 0.2.0  
**Date:** January 12, 2026  
**Status:** Complete  
**Sprint Duration:** 1 day (Phase 0 only)

---

## Executive Summary

### Vision

Version 0.2.0 Phase 0 represents a strategic pivot in the 11-11 Sustainable Intelligence OS development. This release removes external dependencies by migrating to a local-first database (PGlite), enabling truly autonomous development with zero setup required.

### Scope Adjustment

**Original Plan:** 7 phases (Phase 0: PGlite migration + Phases 1-6: Feature additions)

**Revised Scope:** Phase 0 only (PGlite migration)

**Rationale:** Phase 0 represents a complex, high-risk database migration requiring full validation before adding new features. Breaking remaining phases into separate, focused releases (v0.2.1-v0.2.6) enables better quality control and aligns with "Sustainable Innovation" principles.

### Strategic Goals

1. **Autonomous Development:** Replace Supabase with PGlite to enable development without external API dependencies
2. **Zero Setup Required:** Eliminate all external service dependencies (no API keys, no cloud setup)
3. **Quality Maintenance:** Zero regressions, comprehensive testing, complete documentation
4. **100% Feature Parity:** All existing functionality preserved with new database backend

### Success Metrics

- ✅ PGlite migration complete with 100% data preservation
- ✅ Zero regressions in existing functionality
- ✅ Zero P0/P1 bugs introduced
- ✅ Performance maintained (<2s page load)
- ✅ All documentation updated (JOURNAL.md, AUDIT_LOG.md, task_plan.md, README.md)
- ✅ Code quality: 0 lint errors, 0 TypeScript errors

---

## Current State Analysis

### Existing Infrastructure (v0.1.1)

**Database Layer:**
- Supabase PostgreSQL with 3 tables: `prompts`, `prompt_metadata`, `critiques`
- Row Level Security (RLS) policies for user isolation
- Development mode with mock data fallback
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Features Delivered:**
- Seedling Section: Active prompts with critique scores
- Greenhouse Section: Saved prompts library with search/filtering
- Critique Engine: 4-dimension rule-based scoring (0-100 scale)
- Status Management: Basic transitions (active → saved)
- Responsive design: 320px - 2560px
- Performance: <2s page load (cached), ~4.6s initial load

**Known Limitations (from BUGS.md):**
- [P2-003] Limited status transitions in UI (only active → saved implemented)
- [P2-005] Initial page load time ~4.6s (exceeds 2s target)
- No multi-file tab support in editor
- No dark mode theme
- No public sharing capability
- No file operations (create/rename/delete) in UI

### User Pain Points

1. **External Dependency:** Supabase setup required for development (API keys, manual schema migration)
2. **Single File Editing:** Cannot work on multiple prompts simultaneously
3. **Incomplete Status Workflow:** Cannot archive, restore, or bulk manage prompts
4. **No File Management:** Must use Google Drive directly to create/rename/delete files
5. **Theme Limitation:** Light mode only, no accessibility for dark mode preference
6. **No Sharing:** Cannot make prompts public for community use
7. **Slow Initial Load:** First page load takes 4.6 seconds

---

## Phase 0: Real Data Foundation (PGlite Migration)

### Objective

Replace Supabase with PGlite to enable local-first, autonomous development with zero external dependencies.

### Background

**Why Migrate from Supabase?**
- Requires manual setup (API keys, dashboard, schema migration)
- External service dependency blocks autonomous agent development
- Cost considerations for future scaling
- Network latency for database operations
- Conflicts with "Planning with Files" philosophy

**Why PGlite?**
- **Local-First:** Database stored as file in `/data/11-11.db`
- **Zero Setup:** No API keys, no cloud accounts, works immediately
- **Real PostgreSQL:** Full SQL support, pgvector extension for future semantic search
- **Autonomous:** AI agents can develop without environment configuration
- **Cost:** $0 (runs in Node.js/browser via WebAssembly)
- **Migration Path:** Easy sync to Turso/Supabase later for multi-user features
- **Philosophy Alignment:** Database is just another file in the repository

### User Stories

**As a developer:**
- I want to clone the repo and run `npm install && npm run dev` without any additional setup
- I want the database to work immediately without API keys or cloud services
- I want to see real data (not just mock data) in development

**As an AI agent:**
- I need to develop features autonomously without requiring user to configure external services
- I need to seed realistic data for testing and validation
- I need a database that "just works" out of the box

### Functional Requirements

#### FR-0.1: Install and Configure PGlite

**Description:** Add PGlite as a dependency and configure database file location.

**Acceptance Criteria:**
- PGlite package `@electric-sql/pglite` installed via npm
- Database file configured at `/data/11-11.db`
- `/data/` directory added to `.gitignore` (database is local-only)
- Environment variable flag for PGlite (e.g., `USE_PGLITE=true`, default true)

#### FR-0.2: Schema Migration

**Description:** Port existing Supabase schema to PGlite with identical structure.

**Acceptance Criteria:**
- Tables created: `prompts`, `prompt_metadata`, `critiques`
- All columns, types, and constraints match Supabase schema
- Indexes created: user_id, status, updated_at, tags (GIN), etc.
- UUID generation support (uuid_generate_v4 or equivalent)
- Timestamp triggers for automatic `updated_at` column
- Schema initialization runs on first app launch (if database doesn't exist)

**Schema Details:**

```sql
-- prompts table
id UUID PRIMARY KEY
user_id TEXT NOT NULL
title TEXT NOT NULL
content TEXT NOT NULL
status TEXT CHECK (status IN ('draft', 'active', 'saved', 'archived'))
drive_file_id TEXT
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()

-- prompt_metadata table
id UUID PRIMARY KEY
prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE
description TEXT
tags TEXT[]
is_public BOOLEAN DEFAULT false
author TEXT
version TEXT
created_at TIMESTAMPTZ DEFAULT NOW()

-- critiques table
id UUID PRIMARY KEY
prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE
score INTEGER CHECK (0-100)
conciseness_score INTEGER CHECK (0-25)
specificity_score INTEGER CHECK (0-25)
context_score INTEGER CHECK (0-25)
task_decomposition_score INTEGER CHECK (0-25)
feedback JSONB
created_at TIMESTAMPTZ DEFAULT NOW()
```

#### FR-0.3: Data Access Layer Refactoring

**Description:** Replace Supabase client with PGlite client while maintaining identical API surface.

**Critical Constraint:** Components MUST NOT change. Only the data access layer changes.

**Acceptance Criteria:**
- Replace `lib/supabase/client.ts` with `lib/pglite/client.ts`
- Update `lib/supabase/prompts.ts` → `lib/pglite/prompts.ts` (same API, different implementation)
- Update `lib/supabase/critiques.ts` → `lib/pglite/critiques.ts` (same API, different implementation)
- All existing hooks continue to work without modification (`useLibrarian`, `useCritique`, `usePromptStatus`, etc.)
- Async API maintained (return Promises even though PGlite is synchronous)
- Error handling matches Supabase patterns (same error types)

**API Surface (Must Remain Unchanged):**

```typescript
// lib/pglite/prompts.ts exports (same as Supabase version)
export async function getPrompts(userId: string, filters?: PromptFilters): Promise<Prompt[]>
export async function getPromptById(id: string): Promise<Prompt | null>
export async function createPrompt(prompt: CreatePromptInput): Promise<Prompt>
export async function updatePrompt(id: string, updates: UpdatePromptInput): Promise<Prompt>
export async function updatePromptStatus(id: string, status: PromptStatus): Promise<Prompt>
export async function deletePrompt(id: string): Promise<void>

// lib/pglite/critiques.ts exports (same as Supabase version)
export async function getCritique(promptId: string): Promise<Critique | null>
export async function saveCritique(critique: CreateCritiqueInput): Promise<Critique>
```

#### FR-0.4: Seed Data Generation

**Description:** Auto-populate database with realistic prompts on first run.

**Acceptance Criteria:**
- Seed script creates 20-30 diverse prompts covering multiple categories
- Prompts have varied critique scores (range: 20-95)
- All statuses represented: draft (3-5), active (8-12), saved (10-15), archived (2-3)
- Realistic content: actual prompt engineering examples (not Lorem ipsum)
- Tags cover common categories: coding, writing, analysis, creative, debug, etc.
- Seed runs automatically if database is empty (0 prompts)
- Seed can be manually triggered via npm script: `npm run seed`

**Seed Data Categories:**
- Code generation prompts
- Writing/content creation prompts
- Data analysis prompts
- Creative/brainstorming prompts
- Debugging/troubleshooting prompts
- System prompts for AI agents

#### FR-0.5: Remove Supabase Dependencies

**Description:** Clean up all Supabase-related code, packages, and configuration.

**Acceptance Criteria:**
- Uninstall `@supabase/supabase-js` package
- Remove Supabase environment variables from `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Delete `lib/supabase/` directory (keep migration file for reference in `/05_Logs/migrations/`)
- Remove dev mode mock data fallback (use real PGlite instead)
- Update README.md: replace Supabase setup instructions with PGlite setup (should be "no setup needed")
- Remove Supabase dashboard references from documentation

#### FR-0.6: Migration Testing & Validation

**Description:** Comprehensive testing to ensure zero regressions.

**Acceptance Criteria:**
- All existing features work with PGlite (Seedling, Greenhouse, status transitions)
- CRUD operations verified: Create, Read, Update, Delete prompts
- Search and filtering work correctly
- Critique engine integration verified
- Status transitions persist to database
- Data survives app restart (file persistence)
- Performance: operations complete in <100ms (local database)
- No console errors related to database operations
- Lint check passes: `npm run lint`
- Type check passes: `npm run build`

### Non-Functional Requirements

#### NFR-0.1: Performance

- Database initialization: <500ms on first launch
- Query operations: <50ms for typical queries (local file access)
- Write operations: <100ms including persistence
- Database file size: <10MB with seed data

#### NFR-0.2: Data Integrity

- No data loss during migration
- Foreign key constraints enforced
- Unique constraints enforced (e.g., one metadata record per prompt)
- CASCADE deletes work correctly
- Timestamps update automatically

#### NFR-0.3: Developer Experience

- Zero configuration required after `npm install`
- Clear error messages if database initialization fails
- Database file location documented in README
- Manual reset instructions documented (`rm -rf data/`)

### Out of Scope for Phase 0

- Multi-user support (single-user only in v0.2.0)
- Real-time sync between devices (local-only)
- Cloud backup/export (can be added in v0.3+)
- Migration tool from Supabase to PGlite (manual migration only)
- pgvector extension for semantic search (deferred to v0.3+)

### Open Questions

1. **Data Export:** Should we provide JSON export functionality for backup? (Answer: Not required for v0.2.0, can defer)
2. **Multi-Device:** How will users sync data across devices? (Answer: Manual export/import in v0.2.0, Turso sync in v0.6+)
3. **Database Size Limits:** What happens if database grows to 100MB+? (Answer: Monitor in production, not a concern for v0.2.0)

### Dependencies

- Phase 0 MUST be completed before Phases 1-6 (foundational change)
- All subsequent phases depend on PGlite data layer

---

## Phase 1: Multi-File Tabs (Workbench Enhancement)

### Objective

Enable users to open and work on multiple prompts simultaneously with a tabbed interface above the Monaco editor.

### Background

**Current State:**
- Users can only view/edit one prompt at a time in the Workbench
- Switching between prompts requires navigating back to Librarian/File Tree
- No indication of which files are currently open
- Unsaved changes not visually tracked across multiple files
- Common IDE feature missing from the workbench experience

**User Pain:**
- Cannot compare two prompts side-by-side
- Frequent context switching between prompts is tedious
- Risk of losing unsaved work when switching files
- No quick navigation between recently opened prompts

### User Stories

**As a prompt engineer:**
- I want to open multiple prompts in tabs so I can quickly switch between them
- I want to see which files have unsaved changes (dirty state indicator)
- I want to close tabs I'm no longer working on to reduce clutter
- I want my open tabs to persist across page reloads so I don't lose my workspace

**As a developer:**
- I want keyboard shortcuts (Cmd/Ctrl+W, Cmd/Ctrl+Tab) to navigate tabs efficiently
- I want a confirmation dialog if I try to close a tab with unsaved changes
- I want a limit on open tabs (10 max) to prevent performance degradation

### Functional Requirements

#### FR-1.1: Tab Bar Component

**Description:** Display open files as tabs above the Monaco editor.

**Acceptance Criteria:**
- Tab bar renders horizontally above Monaco editor in EditorView
- Each tab shows: file name, unsaved indicator (orange dot if dirty), close button (X)
- Active tab visually distinct (bold text, different background color)
- Clicking tab switches to that file in editor
- Tabs are scrollable horizontally if they exceed viewport width
- Tab bar has fixed height (40-48px) to maintain layout stability

**Visual Design:**
- Active tab: Blue background, white text
- Inactive tab: Gray background, dark text
- Hover state: Slightly lighter background
- Unsaved indicator: Orange dot (8px diameter) before file name
- Close button: X icon, appears on hover or always visible (mobile)

#### FR-1.2: Tab State Management

**Description:** Track open files, active file, and dirty states in application state.

**Acceptance Criteria:**
- State tracks: list of open file IDs, active file ID, dirty state per file
- Opening a file adds it to tabs (if not already open)
- Opening an already-open file switches to that tab
- Maximum 10 tabs enforced (oldest tab closed if limit exceeded, with confirmation if unsaved)
- Dirty state updated when editor content changes
- Dirty state cleared when file is saved

**State Structure:**
```typescript
interface TabState {
  openTabs: Array<{ id: string; title: string; isDirty: boolean }>;
  activeTabId: string | null;
}
```

#### FR-1.3: Tab Actions

**Description:** Support tab operations (close, close all, close others).

**Acceptance Criteria:**
- **Close Tab:** X button on tab closes that tab
- **Close Tab Confirmation:** If tab is dirty (unsaved), show modal: "You have unsaved changes. Close anyway?"
- **Close All:** Context menu option or keyboard shortcut (Cmd/Ctrl+Shift+W) closes all tabs
- **Close Others:** Context menu option closes all tabs except the active one
- Closing the last tab shows empty editor state (placeholder or welcome screen)

**Confirmation Modal:**
- Title: "Unsaved Changes"
- Body: "'{filename}' has unsaved changes. Do you want to close it anyway?"
- Actions: "Close Anyway" (destructive), "Cancel" (default)

#### FR-1.4: Keyboard Shortcuts

**Description:** Efficient keyboard navigation for power users.

**Acceptance Criteria:**
- **Cmd/Ctrl+W:** Close active tab (with confirmation if unsaved)
- **Cmd/Ctrl+Tab:** Switch to next tab (circular navigation)
- **Cmd/Ctrl+Shift+Tab:** Switch to previous tab
- **Cmd/Ctrl+1 through Cmd/Ctrl+9:** Jump to tab by position (1 = first tab, 9 = ninth tab)
- **Cmd/Ctrl+Shift+W:** Close all tabs (with confirmation if any unsaved)
- Shortcuts work when editor has focus
- Shortcuts documented in help/settings

#### FR-1.5: Tab Persistence

**Description:** Restore open tabs when user returns to the app.

**Acceptance Criteria:**
- Open tabs saved to localStorage on every tab operation (open, close, switch)
- Restore tabs from localStorage on app mount
- Active tab restored correctly
- If a saved tab's file no longer exists, remove it from tabs silently
- localStorage key: `workbench:tabs` (namespace to avoid conflicts)

**LocalStorage Format:**
```json
{
  "openTabs": [
    { "id": "prompt-uuid-1", "title": "Code Review Prompt" },
    { "id": "prompt-uuid-2", "title": "API Design Guide" }
  ],
  "activeTabId": "prompt-uuid-1"
}
```

Note: Dirty state is NOT persisted (lost on reload, user must save)

#### FR-1.6: Responsive Design

**Description:** Tab bar adapts to mobile and tablet viewports.

**Acceptance Criteria:**
- **Desktop (≥1024px):** Full tab bar with all tabs visible (scrollable if needed)
- **Tablet (768-1023px):** Tab bar with abbreviated file names (truncate with ellipsis)
- **Mobile (320-767px):** Dropdown selector instead of tab bar (select element showing active file + list of open files)
- Close button always visible on mobile (no hover required)
- Unsaved indicator visible on all viewports

### Non-Functional Requirements

#### NFR-1.1: Performance

- Tab switching: <50ms (instant visual feedback)
- Opening new tab: <100ms (add to state + render)
- Scrolling tabs: 60fps smooth scroll
- localStorage write: debounced 500ms to avoid excessive writes

#### NFR-1.2: Accessibility

- Tab bar uses ARIA tabs pattern (`role="tablist"`, `role="tab"`, `role="tabpanel"`)
- Keyboard navigation: Arrow keys move between tabs, Enter activates
- Screen reader announces: "Tab {N} of {M}: {filename}, {saved|unsaved}"
- Close button has aria-label: "Close {filename}"
- Focus management: Closing a tab moves focus to adjacent tab

#### NFR-1.3: Visual Consistency

- Tab bar follows "Hardworking Workbench" design aesthetic (calm, clean)
- Animations: 200ms transitions for tab switching, no jarring movements
- Color palette: Matches existing theme (grays, blue accent)
- Icons: Lucide React icons consistent with app

### Out of Scope for Phase 1

- **Tab Reordering:** Drag-and-drop to reorder tabs (deferred to v0.3+)
- **Tab Grouping:** Group related tabs (deferred)
- **Split View:** View two tabs side-by-side (deferred)
- **Tab Preview:** Hover to preview tab content (deferred)
- **Recent Files:** Separate "recently closed" list (deferred)

### Open Questions

1. **Tab Limit:** Is 10 tabs the right limit? (Answer: Yes, prevents performance issues and clutter)
2. **Unsaved Warning:** Should we warn on page refresh if tabs are dirty? (Answer: Yes, use browser's `beforeunload` event)
3. **Tab Order:** Should most recently used tab appear first or last? (Answer: Append new tabs to the end, preserve order)

### Dependencies

- Requires Monaco editor to be integrated (already exists in EditorView)
- Requires prompt state management (already exists in useLibrarian)
- Can be developed independently of Phase 0 (PGlite migration)

---

## Phase 2: Full Status Lifecycle UI (Librarian Enhancement)

### Objective

Complete the status management vision by implementing all status transitions in the UI. This resolves bug [P2-003].

### Background

**Current State (v0.1.1):**
- Status system exists with 4 states: draft, active, saved, archived
- Only ONE transition implemented in UI: active → saved ("Save to Greenhouse" button)
- Other transitions (saved → active, saved → archived, archived → active) have no UI controls
- `usePromptStatus` hook supports all transitions but is underutilized
- `StatusTransitionButton` component exists but only used for one transition
- No archive view exists (archived prompts are hidden)

**Bug [P2-003] Description:**
"Limited status transitions available in UI - infrastructure exists but only active → saved is accessible"

**User Impact:**
- Cannot archive old prompts (clutter in Greenhouse)
- Cannot restore archived prompts (permanent removal without UI)
- Cannot move saved prompts back to active (for iteration)
- Cannot bulk manage prompts (archive many at once)
- No visibility into archived prompts

### User Stories

**As a prompt engineer:**
- I want to archive prompts I'm no longer using so my Greenhouse stays organized
- I want to restore archived prompts so I can iterate on old ideas
- I want to move saved prompts back to active (Seedlings) to continue refining them
- I want to bulk archive multiple prompts at once to clean up my library quickly
- I want to view my archived prompts to search for old work

**As a power user:**
- I want a complete status history for each prompt to understand its lifecycle
- I want to filter by status (draft, active, saved, archived) in the Greenhouse
- I want to see when a prompt was last transitioned and by whom

### Functional Requirements

#### FR-2.1: Complete Status Transition Buttons

**Description:** Add UI controls for all missing status transitions.

**Acceptance Criteria:**
- **Draft → Active:** "Activate" button in draft prompt cards
- **Active → Saved:** "Save to Greenhouse" button (already exists) ✅
- **Saved → Active:** "Move to Seedlings" button in Greenhouse cards
- **Saved → Archived:** "Archive" button in Greenhouse cards
- **Archived → Active:** "Restore" button in Archive view cards
- All buttons use existing `StatusTransitionButton` component
- Buttons show loading state during transition ("Archiving...", "Restoring...")
- Success toast notifications ("🗄️ Archived successfully", "🌱 Restored to Seedlings")
- Optimistic UI updates (card moves immediately, rollback on error)

**Button Placement:**
- Seedling cards: "Save to Greenhouse" (existing)
- Greenhouse cards: "Move to Seedlings", "Archive" (new)
- Archive cards: "Restore", "Delete Permanently" (new)
- Draft cards: "Activate" (if draft support added)

#### FR-2.2: Archive View

**Description:** New route `/librarian/archive` showing archived prompts.

**Acceptance Criteria:**
- New page route: `/librarian/archive` with title "🗄️ Archived Prompts"
- Grid layout matching Greenhouse (responsive: 1-3 columns)
- Archive cards display: title, excerpt, archived date, tags, critique score
- Empty state: "No archived prompts. Archive old prompts to clean up your Greenhouse."
- Navigation link in Header: "Archive" (appears in dropdown or navigation)
- Search and filtering work in Archive view (same as Greenhouse)
- Archived count badge in navigation (e.g., "Archive (12)")

**Archive Card Actions:**
- "Restore" button: Moves back to active status (appears in Seedlings)
- "Delete Permanently" button: Shows confirmation dialog, then deletes from database
- View/Edit: Opens in read-only mode (or editable if restored first)

#### FR-2.3: Status History Tracking

**Description:** Track all status transitions with timestamps in the database.

**Acceptance Criteria:**
- Add `status_history` column to `prompts` table (type: JSONB array)
- Each transition appends entry: `{ from: 'active', to: 'saved', timestamp: '2026-01-12T10:30:00Z', user_id: 'user123' }`
- Migration script updates existing prompts with initial history entry
- History preserved across all transitions
- API returns history with prompt data (optional field)

**Schema Change:**
```sql
ALTER TABLE prompts ADD COLUMN status_history JSONB DEFAULT '[]'::jsonb;
```

**History Entry Format:**
```json
[
  {
    "from": null,
    "to": "draft",
    "timestamp": "2026-01-10T14:20:00Z",
    "user_id": "dev-user"
  },
  {
    "from": "draft",
    "to": "active",
    "timestamp": "2026-01-10T15:00:00Z",
    "user_id": "dev-user"
  },
  {
    "from": "active",
    "to": "saved",
    "timestamp": "2026-01-12T09:15:00Z",
    "user_id": "dev-user"
  }
]
```

#### FR-2.4: Bulk Operations

**Description:** Select multiple prompts and perform bulk actions.

**Acceptance Criteria:**
- **Selection Mode:** Checkbox appears on hover over prompt cards
- **Select All:** Checkbox in section header selects all visible prompts
- **Bulk Actions Bar:** Appears at bottom when ≥1 prompt selected, shows count: "3 prompts selected"
- **Bulk Archive:** Button in bulk actions bar, confirmation dialog: "Archive 3 prompts?"
- **Bulk Restore:** In Archive view, button to restore multiple prompts
- **Bulk Delete:** In Archive view, confirmation dialog: "Permanently delete 3 prompts? This cannot be undone."
- **Deselect:** Clicking "Cancel" or anywhere outside bulk bar deselects all
- Optimistic UI: Selected cards fade out, appear in new location (or disappear if deleted)

**Bulk Actions Bar:**
- Fixed position at bottom of viewport
- Shows: selection count, "Archive", "Delete", "Cancel" buttons
- Keyboard: Escape key cancels selection
- Mobile: Swipe down to cancel selection

#### FR-2.5: Status Filters

**Description:** Filter prompts by status in Greenhouse and Archive views.

**Acceptance Criteria:**
- Filter dropdown in Greenhouse header: "All", "Active", "Saved", "Archived"
- Filter dropdown in Archive view: "Recently Archived", "Older than 30 days", "All Time"
- Filter persists in URL query params: `/librarian?status=archived`
- Filter state persists in localStorage
- Combine with existing search (filter + search both apply)
- Clear filters button appears when filters active

**Filter Options (Greenhouse):**
- "All Statuses" - shows active + saved
- "Active Only" - shows only active (Seedlings)
- "Saved Only" - shows only saved (Greenhouse proper)
- "Archived Only" - redirects to `/librarian/archive`

#### FR-2.6: Confirmation Dialogs

**Description:** Prevent accidental data loss with confirmation modals.

**Acceptance Criteria:**
- **Archive Confirmation:** "Archive '{prompt title}'? You can restore it later from the Archive."
- **Delete Confirmation:** "Permanently delete '{prompt title}'? This cannot be undone."
- **Bulk Archive Confirmation:** "Archive {N} prompts? You can restore them later from the Archive."
- **Bulk Delete Confirmation:** "Permanently delete {N} prompts? This cannot be undone."
- Modal actions: Destructive action (red), Cancel (gray, default focus)
- Keyboard: Enter confirms, Escape cancels
- Accessible: ARIA dialog role, focus trap, screen reader announcements

### Non-Functional Requirements

#### NFR-2.1: Performance

- Status transitions: <200ms database update + UI update
- Bulk operations: <500ms for up to 50 prompts
- Archive view load: <1 second (even with 500+ archived prompts)
- Status history query: <100ms (indexed on prompt_id)

#### NFR-2.2: Data Integrity

- Status transitions atomic (database update + history append in single transaction)
- CASCADE deletes still work (metadata, critiques deleted when prompt deleted)
- Status history immutable (append-only, never modify past entries)
- Archived prompts excluded from active prompt queries by default

#### NFR-2.3: Accessibility

- All buttons have descriptive aria-labels: "Archive {prompt title}"
- Confirmation dialogs use ARIA dialog role
- Selection checkboxes labeled: "Select {prompt title}"
- Status filter dropdown keyboard accessible (Arrow keys, Enter)
- Screen reader announces bulk selection count

### Out of Scope for Phase 2

- **Status History Display:** UI to view full history timeline (deferred to v0.3+)
- **Automated Archival:** Auto-archive prompts after 90 days (deferred)
- **Batch Status Rules:** Apply status based on criteria (deferred)
- **Undo Transitions:** Revert to previous status (deferred)

### Open Questions

1. **Delete vs Archive:** Should we allow permanent delete from Greenhouse or only from Archive? (Answer: Only from Archive, prevent accidental data loss)
2. **Auto-Archive:** Should prompts auto-archive after inactivity? (Answer: Not in v0.2.0, manual only)
3. **Selection Persistence:** Should selected items persist across page navigation? (Answer: No, clear selection on navigation)

### Dependencies

- Requires PGlite migration (Phase 0) for schema changes
- Uses existing `StatusTransitionButton` and `usePromptStatus`
- Independent of other phases (1, 3, 4, 5, 6)

---

## Phase 3: Real-Time File Operations (Storage Enhancement)

### Objective

Enable users to create, rename, and delete files directly from the 11-11 UI via Google Drive API.

### Background

**Current State:**
- File tree displays Google Drive files (read-only)
- Users must go to Google Drive web interface to create/rename/delete files
- No context menu in file tree
- File operations are manual and disrupt workflow
- Sync is one-directional (Drive → 11-11)

**User Pain:**
- Context switching between 11-11 and Google Drive web UI
- Cannot create new prompt files without leaving the app
- Cannot organize files (rename, delete) from within 11-11
- Workflow friction reduces productivity

### User Stories

**As a prompt engineer:**
- I want to create new prompt files from within 11-11 without opening Google Drive
- I want to rename files to keep my library organized
- I want to delete old files I no longer need
- I want a context menu (right-click) to access file operations quickly

**As a power user:**
- I want to create folders to organize my prompts by category
- I want to move files between folders (drag-and-drop in future, context menu for now)
- I want file operations to sync immediately to Google Drive
- I want graceful error handling if operations fail (network issues, permissions)

### Functional Requirements

#### FR-3.1: Create File/Folder

**Description:** Create new files and folders from the file tree.

**Acceptance Criteria:**
- **Context Menu:** Right-click on folder shows "New File", "New Folder" options
- **New File Modal:** Prompts for file name, validates extension (.md), creates in Drive + local DB
- **New Folder Modal:** Prompts for folder name, validates (no special chars), creates in Drive
- **Default Behavior:** File created with template content (empty or starter template)
- **UI Update:** New file appears in file tree immediately (optimistic UI)
- **Error Handling:** If Drive API fails, show error toast + rollback optimistic UI
- **Success Feedback:** Toast notification "✅ Created '{filename}'"

**File Creation Flow:**
1. User right-clicks folder in file tree
2. Clicks "New File" in context menu
3. Modal appears: "Create New File" with input field
4. User types filename (e.g., "Code Review Guide")
5. System appends .md if not provided
6. Click "Create" → API call to Google Drive API
7. On success: File appears in tree, user can click to open in editor
8. On failure: Error toast, no file added to tree

**Template Content (New Files):**
```markdown
# [Filename]

## Purpose
[Describe what this prompt does]

## Prompt
[Your prompt content here]

## Expected Output
[Describe the ideal response]
```

#### FR-3.2: Rename File/Folder

**Description:** Rename files and folders inline or via context menu.

**Acceptance Criteria:**
- **Inline Editing:** Double-click file name in tree to enter edit mode
- **Context Menu:** Right-click file shows "Rename" option
- **Edit Mode:** Input field replaces file name, pre-filled with current name
- **Validation:** Prevent empty names, special characters, duplicate names
- **Save:** Enter key or blur confirms, Escape cancels
- **API Call:** Update Google Drive file name via Drive API
- **DB Update:** Update local database `prompts` table (drive_file_id mapping)
- **Optimistic UI:** Name updates immediately, rollback on error
- **Success Feedback:** Toast "✅ Renamed to '{new name}'"

**Rename Flow:**
1. User double-clicks file name "old-name.md" in tree
2. Input field appears with text selected
3. User types new name "new-name"
4. Presses Enter
5. API call to Drive API: `files.update(fileId, {name: 'new-name.md'})`
6. On success: Tree updates, database updated
7. If file is open in editor, tab name updates
8. On failure: Revert to old name, show error toast

#### FR-3.3: Delete File/Folder

**Description:** Move files to Google Drive Trash (soft delete, recoverable).

**Acceptance Criteria:**
- **Context Menu:** Right-click file shows "Delete" option (red, destructive)
- **Confirmation Dialog:** "Move '{filename}' to Trash? You can restore it from Google Drive Trash."
- **Soft Delete:** File moved to Google Drive Trash (not permanently deleted)
- **API Call:** `files.update(fileId, {trashed: true})`
- **UI Update:** File removed from tree immediately
- **DB Update:** Do NOT delete from local database (keep record, mark as trashed?)
- **Success Feedback:** Toast "🗑️ Moved to Trash. Restore via Google Drive if needed."
- **Undo Option:** Toast shows "Undo" button (5 second window to restore)

**Delete Flow:**
1. User right-clicks file in tree
2. Clicks "Delete" (red option at bottom of context menu)
3. Confirmation modal appears
4. User clicks "Move to Trash"
5. API call to Drive API: `files.update(fileId, {trashed: true})`
6. On success: File removed from tree, database marked trashed
7. Toast with undo button appears
8. If undo clicked within 5 seconds: Restore file from trash

**Important:** This is NOT permanent deletion. Files can be recovered from Google Drive Trash web UI.

#### FR-3.4: Context Menu Component

**Description:** Reusable, accessible context menu for file tree and other components.

**Acceptance Criteria:**
- **Trigger:** Right-click (desktop), long-press (mobile) shows menu
- **Position:** Menu appears near cursor, adjusts if near viewport edge
- **Options:** Dynamic based on target (file vs folder)
- **Icons:** Each option has icon (File: FileIcon, Folder: FolderIcon, Rename: EditIcon, Delete: TrashIcon)
- **Keyboard:** Arrow keys navigate, Enter selects, Escape closes
- **Accessibility:** role="menu", aria-label, focus management
- **Mobile:** Long-press (500ms) shows context menu
- **Close:** Click outside, Escape key, or select option closes menu

**Context Menu Options (File):**
- "Open" - Open in editor (default on click)
- "Rename" - Enter inline edit mode
- "Delete" - Move to trash with confirmation
- "Copy Drive Link" - Copy Google Drive URL to clipboard

**Context Menu Options (Folder):**
- "New File" - Create file in this folder
- "New Folder" - Create subfolder
- "Rename" - Rename folder
- "Delete" - Move folder to trash (with confirmation if not empty)

#### FR-3.5: Error Handling & Retry

**Description:** Graceful failure handling with user-friendly error messages and retry options.

**Acceptance Criteria:**
- **Network Errors:** "Network error. Check your connection and try again." + Retry button
- **Permission Errors:** "Permission denied. Check Google Drive sharing settings."
- **Rate Limit Errors:** "Too many requests. Please wait a moment and try again."
- **Validation Errors:** "Invalid file name. Avoid special characters: / \\ : * ? \" < > |"
- **Generic Errors:** "Operation failed. Please try again or contact support."
- **Retry Logic:** Exponential backoff for transient errors (1s, 2s, 4s delays)
- **Rollback:** Optimistic UI reverts to previous state on failure
- **Error Toast:** Red toast with error message + "Retry" button (for transient errors)

**Error Toast Example:**
- Icon: AlertCircle (red)
- Message: "Failed to create file: Network error"
- Actions: "Retry", "Dismiss"
- Duration: Stays until dismissed (for errors requiring action)

#### FR-3.6: Optimistic UI with Rollback

**Description:** Immediate UI feedback with graceful rollback on API failure.

**Acceptance Criteria:**
- **Create:** File appears in tree immediately, grayed out with loading spinner until confirmed
- **Rename:** Name updates immediately, reverts on error
- **Delete:** File fades out and disappears, reappears on error
- **Loading States:** Subtle spinner or pulse animation during API call
- **Success Confirmation:** Remove loading state, full color/opacity
- **Failure Rollback:** Revert to previous state, show error toast
- **No Flicker:** Smooth transitions (200ms fade), avoid jarring state changes

### Non-Functional Requirements

#### NFR-3.1: Performance

- Create operation: <1 second (Drive API call + DB update)
- Rename operation: <500ms (Drive API update)
- Delete operation: <500ms (move to trash)
- Context menu open: <50ms (instant feedback)
- Retry with backoff: 1s → 2s → 4s (max 3 retries)

#### NFR-3.2: Reliability

- Idempotent operations (safe to retry)
- Atomic updates (DB and Drive in sync, or both fail)
- Queue operations if offline (deferred to v0.3+)
- Conflict detection for renames (prevent overwrites)

#### NFR-3.3: Accessibility

- Context menu: ARIA menu pattern, keyboard navigation
- Confirmation dialogs: ARIA dialog role, focus management
- Error messages: Announced to screen readers
- Keyboard shortcuts: Document in help (e.g., F2 for rename, Delete key for delete)

### Out of Scope for Phase 3

- **Drag-and-Drop:** Move files via drag-and-drop (deferred to v0.3+)
- **Multi-Select:** Select multiple files for bulk delete/move (deferred)
- **Folder Tree Collapse:** Persist folder expand/collapse state (deferred)
- **File Preview:** Preview file content on hover (deferred)
- **Offline Mode:** Queue operations when offline (deferred)

### Open Questions

1. **Permanent Delete:** Should we offer permanent delete or only trash? (Answer: Trash only in v0.2.0, safety first)
2. **Undo Window:** Is 5 seconds enough for undo? (Answer: Yes, standard for destructive actions)
3. **Folder Delete:** What if folder has files? (Answer: Require confirmation, delete folder and contents to trash)

### Dependencies

- Requires Google Drive API integration (already exists in v0.1.1)
- Independent of Phase 0 (PGlite) - Drive operations separate from DB
- May interact with Phase 1 (tabs) if renamed file is open in editor

---

## Phase 4: Dark Mode / Light Mode Toggle (UI/UX Enhancement)

### Objective

Implement theme switching to improve accessibility and support user preference for dark/light themes.

### Background

**Current State:**
- Light mode only
- No theme toggle in UI
- Hardcoded color values in Tailwind classes
- No system preference detection

**User Impact:**
- Poor accessibility for users who prefer dark mode
- Eye strain in low-light environments
- No accommodation for `prefers-color-scheme` media query
- Inconsistent with modern UI/UX standards (most apps offer dark mode)

### User Stories

**As a user:**
- I want to switch between dark and light themes so I can reduce eye strain
- I want the theme to persist across sessions so I don't have to toggle it every time
- I want the app to respect my system preference (dark mode enabled at OS level)
- I want smooth theme transitions without jarring flashes

**As a developer:**
- I want all components to work in both themes without additional code
- I want WCAG AA contrast compliance in both themes
- I want Monaco editor theme to match the app theme

### Functional Requirements

#### FR-4.1: Theme System

**Description:** Define dark and light color palettes in Tailwind configuration.

**Acceptance Criteria:**
- CSS variables for theme colors: `--background`, `--foreground`, `--primary`, `--secondary`, etc.
- Tailwind config extended with theme-aware color palette
- All colors meet WCAG 2.1 Level AA contrast requirements (4.5:1 for text, 3:1 for UI components)
- Two theme classes: `.light-theme` and `.dark-theme` applied to `<html>` element
- Graceful fallback to light theme if no preference set

**Color Palette (Dark Theme):**
- Background: `#0f1419` (very dark blue-gray)
- Surface: `#1a1f2e` (dark gray)
- Primary: `#3b82f6` (blue-500)
- Foreground: `#e5e7eb` (gray-200)
- Muted: `#6b7280` (gray-500)
- Border: `#374151` (gray-700)

**Color Palette (Light Theme):**
- Background: `#ffffff` (white)
- Surface: `#f9fafb` (gray-50)
- Primary: `#2563eb` (blue-600)
- Foreground: `#111827` (gray-900)
- Muted: `#6b7280` (gray-500)
- Border: `#e5e7eb` (gray-200)

#### FR-4.2: Theme Toggle Component

**Description:** Sun/Moon icon toggle button in Header to switch themes.

**Acceptance Criteria:**
- Toggle button in Header (top-right, near user profile or settings)
- Sun icon (☀️) when dark mode is active, Moon icon (🌙) when light mode is active
- Clicking toggle switches theme immediately
- Smooth 200ms transition animation for background and text colors
- Button has tooltip: "Switch to dark mode" / "Switch to light mode"
- Keyboard accessible: Tab to focus, Enter/Space to toggle
- ARIA attributes: `role="switch"`, `aria-checked="true|false"`, `aria-label="Theme toggle"`

**Visual Design:**
- Icon size: 20px × 20px
- Button size: 40px × 40px (meets 44px touch target with padding)
- Hover state: Slight scale (1.05) + background highlight
- Active state: Scale down (0.95)
- Transition: All properties 200ms ease-in-out

#### FR-4.3: Theme Application

**Description:** Apply theme to all components throughout the application.

**Acceptance Criteria:**
- All components use theme-aware Tailwind classes: `bg-background`, `text-foreground`, etc.
- Monaco editor theme switches: `vs-dark` (dark mode), `vs` (light mode)
- Framer Motion animations respect theme (colors transition smoothly)
- File tree, Librarian cards, multi-agent panels all themed correctly
- No hardcoded color values (all use CSS variables or Tailwind theme)
- Charts/graphs use theme-aware color palettes (if applicable)

**Components to Update:**
- Header, Sidebar, MainContent (layout)
- FileTree (file icons, hover states)
- EditorView, Monaco editor
- LibrarianView (Seedling, Greenhouse, Archive cards)
- MultiAgentView (chat panels, message bubbles)
- Modals, toasts, confirmation dialogs
- Context menus, dropdowns

#### FR-4.4: System Preference Detection

**Description:** Detect and apply user's OS-level theme preference on first load.

**Acceptance Criteria:**
- Use `window.matchMedia('(prefers-color-scheme: dark)')` to detect system preference
- Apply detected theme on first visit (if no localStorage preference exists)
- Listen for system preference changes and update theme automatically
- User's manual selection overrides system preference (stored in localStorage)

**Detection Logic:**
```typescript
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const storedTheme = localStorage.getItem('app-theme');

if (storedTheme) {
  applyTheme(storedTheme); // User's manual choice takes precedence
} else {
  applyTheme(systemPrefersDark ? 'dark' : 'light'); // Use system preference
}
```

#### FR-4.5: Theme Persistence

**Description:** Store user's theme preference in localStorage.

**Acceptance Criteria:**
- Save theme to localStorage on every toggle: `localStorage.setItem('app-theme', 'dark')`
- Retrieve theme on app mount: `localStorage.getItem('app-theme')`
- localStorage key: `app-theme` with values `'light'` or `'dark'`
- Theme persists across sessions, page reloads, and browser restarts
- Clear theme preference option (revert to system default) in settings

#### FR-4.6: Smooth Transitions

**Description:** Avoid jarring theme switches with smooth color transitions.

**Acceptance Criteria:**
- CSS transitions for theme-aware properties: `transition: background-color 200ms, color 200ms, border-color 200ms`
- No Flash of Unstyled Content (FOUC) on page load (apply theme before render)
- Inline critical CSS in `<head>` to set theme before React hydration
- Disable transitions during initial page load (avoid animation on mount)

**Critical CSS (Inline in `<head>`):**
```html
<script>
  // Apply theme immediately to prevent FOUC
  const theme = localStorage.getItem('app-theme') || 
                (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.classList.add(theme + '-theme');
</script>
```

### Non-Functional Requirements

#### NFR-4.1: Performance

- Theme toggle: <50ms (instant visual feedback)
- Theme persistence: localStorage write <10ms
- No layout shift or reflow on theme change (only color changes)
- Monaco editor theme switch: <100ms

#### NFR-4.2: Accessibility

- WCAG 2.1 Level AA contrast compliance in both themes
- Contrast checker validated for all text/background combinations
- Theme toggle keyboard accessible (Tab, Enter)
- Screen reader announces theme change: "Switched to dark mode"
- Focus indicators visible in both themes

#### NFR-4.3: Browser Compatibility

- Works in all modern browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- `prefers-color-scheme` media query supported (degrades to light theme in older browsers)
- CSS variables supported (fallback to light theme if not supported)

### Out of Scope for Phase 4

- **Custom Theme Colors:** User-defined color palettes (deferred)
- **Auto Theme Schedule:** Switch theme based on time of day (deferred)
- **High Contrast Mode:** Separate high contrast theme (deferred)
- **Grayscale Mode:** Accessibility mode for colorblind users (deferred)

### Open Questions

1. **Theme Transition Duration:** Is 200ms the right speed? (Answer: Yes, matches "Hardworking" aesthetic)
2. **System Preference Sync:** Should we auto-update when system preference changes? (Answer: Yes, but user's manual choice takes precedence)
3. **Print Styles:** Should prints default to light theme? (Answer: Yes, light theme for print media)

### Dependencies

- Independent of all other phases
- Can be developed in parallel with Phases 0-3, 5-6
- Monaco editor integration required (already exists)

---

## Phase 5: One-Click Publish (Global Commons Foundation)

### Objective

Enable users to make prompts public with a single toggle, laying the foundation for the Global Commons.

### Background

**Current State:**
- All prompts are private (user-only visibility)
- No public sharing mechanism
- `/librarian/commons` route exists but shows empty state
- `is_public` column exists in `prompt_metadata` table but unused

**Vision:**
- Global Commons: A "Wikipedia of Prompts" where users share high-quality prompts
- Community-driven prompt library
- Discovery and remixing of public prompts

### User Stories

**As a prompt engineer:**
- I want to share my best prompts with the community so others can benefit from my work
- I want to make a prompt public with a single toggle (no complex publishing flow)
- I want to see which of my prompts are public vs private
- I want to unpublish a prompt if I change my mind

**As a community member:**
- I want to browse public prompts to learn from others
- I want to copy public prompts to my library to use and modify
- I want to filter public prompts by category, score, or recency
- I want to see who authored each public prompt

### Functional Requirements

#### FR-5.1: Public Toggle UI

**Description:** "Make Public" toggle in prompt cards to publish/unpublish prompts.

**Acceptance Criteria:**
- Toggle switch in Greenhouse prompt cards (top-right corner or card footer)
- Labels: "Private" (default), "Public"
- First publish shows confirmation modal: "Make '{prompt title}' public? Anyone can view and copy this prompt."
- Subsequent toggles work without confirmation (user already opted in)
- Public badge appears on public prompt cards: "🌍 Public" (green badge)
- Optimistic UI: Badge appears immediately, rollback on error
- Success toast: "✅ Published to Global Commons" / "🔒 Made private"

**Toggle Visual Design:**
- Switch component (sliding toggle, not checkbox)
- Colors: Gray (private), Green (public)
- Size: 44px × 24px (meets touch target minimum)
- ARIA: `role="switch"`, `aria-checked="true|false"`, `aria-label="Make public"`

#### FR-5.2: Database Schema Update

**Description:** Add `published_at` timestamp and `visibility` enum to track publication state.

**Acceptance Criteria:**
- Add `published_at` column to `prompt_metadata` table (type: TIMESTAMPTZ, nullable)
- Add `visibility` column (type: TEXT with CHECK constraint, values: 'private', 'unlisted', 'public')
- Default values: `published_at = NULL`, `visibility = 'private'`
- When toggled public: Set `published_at = NOW()`, `visibility = 'public'`
- When toggled private: Keep `published_at` (historical record), set `visibility = 'private'`
- Migration script updates existing prompts: `visibility = 'private'`

**Schema Change:**
```sql
ALTER TABLE prompt_metadata 
  ADD COLUMN published_at TIMESTAMPTZ,
  ADD COLUMN visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted', 'public'));
```

**Visibility Values:**
- `'private'`: Only visible to author (default)
- `'unlisted'`: Accessible via direct link, not listed in Commons
- `'public'`: Visible in Global Commons, discoverable by all

#### FR-5.3: Public Prompts View

**Description:** Display public prompts in `/librarian/commons` (Global Commons).

**Acceptance Criteria:**
- Route `/librarian/commons` shows grid of all public prompts (visibility = 'public')
- Public prompt cards display: title, excerpt, author, published date, critique score, tags
- Empty state (no public prompts): "No public prompts yet. Publish your first prompt to share with the community!"
- Navigation link in Header: "Commons" or "Global Commons"
- Search bar: Search public prompts by title, content, tags
- Sort options: "Recent", "Popular" (most copied), "Highest Score" (critique score)
- Filter by tags: Show tag cloud or dropdown

**Public Prompt Card Fields:**
- Title (clickable, opens in read-only modal)
- Excerpt (first 150 characters)
- Author: Display name or "Anonymous" if not set
- Published date: "Published 2 days ago"
- Critique score: Color-coded badge (red <50, yellow 50-75, green 75+)
- Tags: Up to 3 tags displayed
- "Copy to My Library" button (primary action)

#### FR-5.4: Privacy Rules

**Description:** Enforce access control - only owner can toggle visibility, public prompts read-only for others.

**Acceptance Criteria:**
- **Owner-Only Toggle:** Public toggle only appears in prompt cards for prompts owned by current user
- **Read-Only for Others:** Public prompts viewed by non-owners are read-only (no edit, no toggle)
- **Database Validation:** Server-side check that user_id matches current user before allowing toggle
- **API Endpoint:** `/api/prompts/:id/publish` (POST) - toggle visibility (requires authentication)
- **Error Handling:** If non-owner tries to publish, return 403 Forbidden

**Access Control Logic:**
```typescript
// In PublicToggle component
const canToggle = currentUserId === prompt.user_id;

if (!canToggle) {
  return null; // Don't render toggle if user doesn't own prompt
}
```

#### FR-5.5: Copy to My Library

**Description:** Clone public prompts to user's private library.

**Acceptance Criteria:**
- "Copy to My Library" button on public prompt cards
- Creates a new prompt in user's library (status: 'draft')
- Copies: title (with " (Copy)" suffix), content, tags, metadata
- Does NOT copy: prompt ID, user_id, published_at, visibility (new prompt is private)
- Success toast: "✅ Copied to your library as '{title} (Copy)'"
- Copied prompt appears in Seedlings (draft) or Greenhouse (saved), user's choice via modal
- Attribution: Optional "Forked from @{author}" note in copied prompt metadata

**Copy Flow:**
1. User clicks "Copy to My Library" on public prompt
2. Modal appears: "Copy '{title}' to your library?"
3. Options: Save as "Draft" (Seedlings) or "Saved" (Greenhouse)
4. Click "Copy" → API call creates new prompt
5. Success toast + redirect to copied prompt in editor

#### FR-5.6: Filters and Sorting

**Description:** Filter and sort public prompts in Commons view.

**Acceptance Criteria:**
- **Filter by Tag:** Dropdown or tag cloud, filter prompts by selected tag
- **My Public Prompts:** Toggle to show only current user's public prompts
- **All Public Prompts:** Default view, shows all public prompts
- **Sort by Recent:** Published date descending (most recent first)
- **Sort by Popular:** Copy count descending (most copied first)
- **Sort by Highest Score:** Critique score descending (highest quality first)
- Filters combine: Tag filter + sort + search all apply simultaneously
- URL params reflect state: `/librarian/commons?tag=coding&sort=score`

**Sort Options:**
- "Recent" - `ORDER BY published_at DESC`
- "Popular" - `ORDER BY copy_count DESC` (requires copy count tracking)
- "Highest Score" - `ORDER BY score DESC` (from critiques table)

### Non-Functional Requirements

#### NFR-5.1: Performance

- Public toggle: <200ms (database update + UI update)
- Commons view load: <1 second (even with 1000+ public prompts)
- Search/filter: <300ms (indexed queries)
- Copy to library: <500ms (create new prompt)

#### NFR-5.2: Privacy & Security

- Server-side validation of ownership before allowing publish/unpublish
- Public prompts do NOT expose user email or sensitive metadata
- Author field can be pseudonymous (display name, not real name)
- SQL injection prevention (parameterized queries)

#### NFR-5.3: Scalability

- Public prompts query indexed on `visibility` column
- Pagination for large result sets (load 20-50 prompts per page)
- Virtual scrolling for long lists (if needed)

### Out of Scope for Phase 5

- **Report/Moderation:** Flag inappropriate content (deferred to v0.3+)
- **License Selection:** Choose license (CC0, MIT, etc.) for public prompts (deferred)
- **View Count Tracking:** Track how many times prompt viewed (deferred)
- **Likes/Favorites:** Community engagement features (deferred)
- **Comments/Reviews:** Feedback on public prompts (deferred)

### Open Questions

1. **Attribution:** Should copied prompts include attribution link? (Answer: Yes, optional "Forked from @{author}" in metadata)
2. **Unlisted Visibility:** Is "unlisted" needed for v0.2.0? (Answer: Nice to have, but can defer if time-constrained)
3. **Copy Count:** Should we track how many times a prompt is copied? (Answer: Yes, add `copy_count` column to metadata)

### Dependencies

- Requires PGlite migration (Phase 0) for schema changes
- Independent of Phases 1, 3, 4, 6
- May integrate with Phase 2 (status management) if published prompts have special status

---

## Phase 6: Optimize Initial Page Load (Performance Enhancement)

### Objective

Reduce initial page load time from 4.6 seconds to <2 seconds through code splitting, lazy loading, and asset optimization.

### Background

**Current Performance (from BUGS.md [P2-005]):**
- Initial page load: ~4.6 seconds (First Contentful Paint)
- Cached page load: ~1.1 seconds (meets target)
- Bundle size: ~3.6MB (unoptimized)
- Main bundle includes: Monaco editor, Framer Motion, entire multi-agent system

**Root Causes:**
- Monaco editor (~2MB) loaded upfront even if not used immediately
- Framer Motion included for all animations, even on static pages
- Multi-agent workspace code loaded on every page
- No code splitting for routes or heavy components
- Images not optimized (PNG instead of WebP)
- No lazy loading for below-the-fold content

### User Stories

**As a user:**
- I want the app to load quickly (<2 seconds) so I can start working immediately
- I want smooth performance even on slower connections
- I want a responsive UI that doesn't freeze during initial load

**As a developer:**
- I need to understand where bundle size is coming from (bundle analyzer)
- I want to implement code splitting without breaking functionality
- I want to measure and validate performance improvements

### Functional Requirements

#### FR-6.1: Code Splitting

**Description:** Split large dependencies into separate chunks loaded on demand.

**Acceptance Criteria:**
- **Monaco Editor:** Lazy load with React.lazy, only load when EditorView is rendered
- **Framer Motion:** Dynamic import for animation-heavy components
- **Multi-Agent Workspace:** Code split MultiAgentView into separate chunk
- **Route-Level Splitting:** Separate chunks for `/`, `/librarian`, `/librarian/commons`, `/librarian/archive`
- **Vendor Splitting:** Next.js automatically splits node_modules into vendor chunk
- **Critical Path:** Only load code required for first render, defer everything else

**Code Splitting Implementation:**
```typescript
// Lazy load Monaco editor
const MonacoEditor = React.lazy(() => import('@monaco-editor/react'));

// Lazy load multi-agent workspace
const MultiAgentView = React.lazy(() => import('@/components/multi-agent/MultiAgentView'));

// Route-level splitting (Next.js automatic via App Router)
```

#### FR-6.2: Lazy Loading Strategy

**Description:** Load non-critical resources after initial render.

**Acceptance Criteria:**
- **Monaco Editor:** Load when user navigates to EditorView tab (not on page load)
- **Librarian Data:** Prefetch on hover over "Librarian" nav link, load on navigate
- **Multi-Agent Panels:** Load on first spawn (not on app mount)
- **Images:** Lazy load below-the-fold images with `loading="lazy"` attribute
- **Fonts:** Preload critical fonts (`preload`), lazy load supplementary fonts
- **Icons:** Use SVG sprites instead of individual imports (if applicable)

**Loading Priority:**
1. **Critical (Immediate):** Layout shell, header, navigation
2. **High (< 500ms):** Current route content, above-the-fold
3. **Medium (< 2s):** Below-the-fold content, prefetch next route
4. **Low (On Demand):** Monaco, multi-agent, archived prompts

#### FR-6.3: Bundle Analysis

**Description:** Identify and eliminate bundle bloat.

**Acceptance Criteria:**
- Run `next build` with `ANALYZE=true` to generate bundle analysis
- Identify largest chunks (Monaco, Framer Motion, etc.)
- Tree-shake unused imports (verify with bundle analyzer)
- Remove duplicate dependencies (check for multiple versions)
- Externalize large libraries if possible (CDN, deferred)

**Bundle Analysis Steps:**
1. Install `@next/bundle-analyzer`
2. Run: `ANALYZE=true npm run build`
3. Review sunburst chart in browser
4. Identify largest chunks (>500KB)
5. Implement code splitting for large chunks
6. Re-run analysis, validate size reduction

**Target Bundle Sizes:**
- Main bundle: <500KB (gzipped)
- Monaco chunk: ~1.5MB (lazy loaded)
- Route chunks: <200KB each
- Vendor chunk: <300KB (gzipped)

#### FR-6.4: Asset Optimization

**Description:** Optimize images, fonts, and static assets.

**Acceptance Criteria:**
- **Images:** Convert PNG to WebP (smaller size, same quality)
- **Image Lazy Loading:** Use Next.js `<Image>` component with `loading="lazy"`
- **Fonts:** Preload critical fonts (`font-display: swap`), subset fonts to reduce size
- **SVG Optimization:** Minify SVGs with SVGO (remove metadata, comments)
- **Compression:** Enable gzip/brotli compression in production (Next.js default)
- **Caching:** Set cache headers for static assets (1 year for immutable resources)

**Image Optimization:**
```typescript
// Before: <img src="/screenshot.png" />
// After:
<Image 
  src="/screenshot.webp" 
  width={1200} 
  height={800} 
  loading="lazy" 
  alt="Screenshot"
/>
```

#### FR-6.5: Performance Measurement

**Description:** Measure and document performance metrics before and after optimization.

**Acceptance Criteria:**
- **Lighthouse Audit:** Run before and after, document scores
- **FCP (First Contentful Paint):** <1 second (target met)
- **TTI (Time to Interactive):** <2 seconds (target met)
- **LCP (Largest Contentful Paint):** <2.5 seconds (WCAG AAA target)
- **CLS (Cumulative Layout Shift):** 0 (no unexpected shifts)
- **Bundle Size Reduction:** 30%+ reduction from baseline
- Document metrics in JOURNAL.md with before/after comparison

**Metrics Tracking:**
```markdown
## Performance Metrics (v0.2.0)

### Before Optimization (v0.1.1)
- Initial Page Load: 4.6s
- First Contentful Paint: 4.2s
- Time to Interactive: 4.2s
- Bundle Size: 3.6MB

### After Optimization (v0.2.0)
- Initial Page Load: 1.8s (61% improvement) ✅
- First Contentful Paint: 0.9s (79% improvement) ✅
- Time to Interactive: 1.9s (55% improvement) ✅
- Bundle Size: 2.4MB (33% reduction) ✅
```

#### FR-6.6: Progressive Enhancement

**Description:** Ensure core functionality works while heavy resources load.

**Acceptance Criteria:**
- **Loading States:** Show skeleton screens while Monaco/multi-agent load
- **Fallback UI:** Basic markdown textarea if Monaco fails to load
- **Error Boundaries:** Graceful degradation if chunk loading fails
- **Retry Logic:** Auto-retry failed chunk loads (exponential backoff)
- **No Broken States:** User can still navigate and interact while resources load

### Non-Functional Requirements

#### NFR-6.1: Performance Targets

- **Initial Page Load:** <2 seconds (target met)
- **First Contentful Paint:** <1 second
- **Time to Interactive:** <2 seconds
- **Largest Contentful Paint:** <2.5 seconds
- **Bundle Size Reduction:** ≥30% from baseline

#### NFR-6.2: No Regressions

- All existing features work correctly after optimization
- No visual regressions (components render identically)
- No functional regressions (features behave the same)
- Lint and type-check still pass
- Production build succeeds

#### NFR-6.3: Browser Compatibility

- Optimizations work in all supported browsers (Chrome, Firefox, Safari, Edge)
- Lazy loading supported (fallback to eager load in old browsers)
- Code splitting supported (fallback to single bundle if needed)

### Out of Scope for Phase 6

- **Service Worker:** Offline caching with service worker (deferred to v0.3+)
- **HTTP/2 Server Push:** Preload resources via server push (deferred)
- **CDN Integration:** Serve static assets from CDN (deferred)
- **Edge Caching:** Cache pages at edge (Vercel Edge, Cloudflare Workers) (deferred)

### Open Questions

1. **Monaco Bundle:** Can we lazy load Monaco more aggressively? (Answer: Yes, only load when editor tab active)
2. **Framer Motion:** Should we replace with CSS animations for critical path? (Answer: No, keep Framer Motion but lazy load)
3. **Measurement Frequency:** How often should we run Lighthouse audits? (Answer: After every major feature, document in JOURNAL.md)

### Dependencies

- Independent of all other phases
- Can be developed in parallel
- Should be tested AFTER all other phases complete (validate no regressions)

---

## Cross-Cutting Concerns

### Testing Requirements (All Phases)

**Per-Phase Testing:**
- Lint check: `npm run lint` (zero errors/warnings)
- Type check: `npm run build` (zero TypeScript errors)
- Visual validation: Capture localhost screenshots of new features
- Manual testing: Verify all acceptance criteria
- Regression testing: Verify related features still work

**End-to-End Testing (After All Phases):**
- Full user flow: Create → Edit → Save → Publish
- Cross-browser: Chrome, Firefox, Safari
- Responsive: Mobile (320px), Tablet (768px), Desktop (1024px+)
- Accessibility audit: WCAG 2.1 AA compliance
- Performance benchmark: Document metrics in JOURNAL.md

### Bug Tracking

- Update `05_Logs/BUGS.md` with any new issues
- Fix all P0/P1 bugs before sprint completion
- Document P2/P3 bugs for future sprints

### Documentation Requirements

**Required Updates (Committed to Repo):**
- **JOURNAL.md**: Architectural decisions, component changes, build log
- **AUDIT_LOG.md**: Sprint summary, technical decisions, dependencies, limitations
- **task_plan.md**: Update roadmap to reflect v0.2.0 completion
- **README.md**: Update setup instructions (PGlite instead of Supabase)
- **`.env.example`**: Remove Supabase variables, add any new variables

**Sandbox Documentation (Not Committed):**
- PRD (this document) - Guides implementation
- Tech Spec - Will be generated in next step
- Implementation plan - Task breakdown
- Internal task tracking - Progress monitoring

### Accessibility Standards (All Phases)

**WCAG 2.1 Level AA Compliance:**
- Keyboard navigation (Tab, Enter, Space, Arrow keys)
- Focus indicators visible (focus-visible:ring-2)
- ARIA labels, roles, and states
- Semantic HTML structure (main, nav, article, button)
- Touch targets ≥44×44px
- Screen reader support (sr-only class, aria-busy states)
- Color contrast: 4.5:1 for text, 3:1 for UI components

### Performance Standards (All Phases)

**Targets:**
- Page load: <2 seconds (50 prompts)
- Database operations: <100ms (PGlite local)
- API operations: <500ms (Google Drive)
- Search response: <300ms (debounced filtering)
- Animations: 60fps (Framer Motion)
- Cumulative Layout Shift: 0 (no unexpected shifts)

### Security Considerations (All Phases)

- No secrets committed to repository (`.env.local` in `.gitignore`)
- Server-side validation for all destructive operations
- SQL injection prevention (parameterized queries)
- XSS prevention (React auto-escapes, sanitize user input)
- CSRF protection (NextAuth handles this)
- Rate limiting for API endpoints (prevent abuse)

---

## Sprint Execution Plan

### Phase Order

**Phase 0 (PGlite Migration) MUST BE COMPLETED FIRST:**
- All other phases depend on the new database layer
- Estimated duration: 1-2 days
- Critical path item

**Phases 1-6 can be developed in parallel after Phase 0:**
- Recommended order: 1 → 2 → 3 → 4 → 5 → 6
- But any order works (phases are independent)
- Team parallelization possible

### Development Workflow

1. **Generate Tech Spec** (next step after this PRD)
2. **Implement Phase 0** (PGlite migration)
3. **Test Phase 0** (comprehensive regression testing)
4. **Implement Phases 1-6** (parallel or sequential)
5. **Test Each Phase** (per-phase testing checklist)
6. **End-to-End Testing** (full user flows)
7. **Documentation Updates** (JOURNAL, AUDIT_LOG, task_plan, README)
8. **Final Validation** (lint, type-check, performance audit)

### Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| **Phase 0: PGlite Migration** | 1-2 days | None (foundational) |
| **Phase 1: Multi-File Tabs** | 1 day | Phase 0 complete |
| **Phase 2: Full Status Lifecycle** | 1-2 days | Phase 0 complete |
| **Phase 3: File Operations** | 1-2 days | None (Drive API) |
| **Phase 4: Dark Mode** | 1 day | None (UI/UX) |
| **Phase 5: One-Click Publish** | 1-2 days | Phase 0 complete |
| **Phase 6: Performance Optimization** | 1 day | All phases complete (testing) |
| **Total** | **7-10 days** | Sequential: 10 days, Parallel: 7 days |

### Daily Standup Questions

1. **What did you complete yesterday?** (mark phases as done)
2. **What are you working on today?** (current phase)
3. **Any blockers?** (technical issues, unclear requirements)
4. **On track for 7-10 day delivery?** (adjust scope if needed)

---

## Success Metrics

### Must Have (Sprint Cannot Ship Without These)

- ✅ PGlite migration complete with zero data loss
- ✅ All 6 features delivered and functional
- ✅ No new P0/P1 bugs introduced
- ✅ All existing features work correctly (zero regressions)
- ✅ Documentation updated (JOURNAL, AUDIT_LOG, task_plan, README)

### Should Have (High Priority, Can Defer if Needed)

- ✅ Performance target met (<2s page load)
- ✅ All acceptance criteria met for each phase
- ✅ Visual validation screenshots captured
- ✅ Accessibility compliance maintained (WCAG 2.1 AA)

### Nice to Have (Can Defer to v0.2.1)

- Tab reordering via drag-and-drop (Phase 1)
- Status history display in UI (Phase 2)
- Report/moderation for public prompts (Phase 5)
- License selection for public prompts (Phase 5)
- View count tracking (Phase 5)

---

## Risk Assessment

### High Risk

**Risk:** PGlite migration breaks existing features  
**Mitigation:** Maintain identical API surface, comprehensive regression testing  
**Contingency:** Keep Supabase code in git history for quick rollback

**Risk:** Six features in one sprint creates scope creep  
**Mitigation:** Strict acceptance criteria, phase-by-phase delivery, defer non-critical features  
**Contingency:** Ship phases incrementally (v0.2.0, v0.2.1, v0.2.2, etc.)

### Medium Risk

**Risk:** Performance optimization doesn't hit 2s target  
**Mitigation:** Profile before optimizing, focus on biggest wins first  
**Contingency:** Ship incremental improvements, defer to v0.2.1

**Risk:** Real-time file operations have API rate limits  
**Mitigation:** Implement request throttling, batch operations  
**Contingency:** Add offline queue, retry logic

### Low Risk

**Risk:** Dark mode has contrast issues  
**Mitigation:** Use WCAG AA compliant color palette, automated contrast checking  
**Contingency:** Quick CSS fixes, user feedback loop

---

## Appendix A: Glossary

- **PGlite**: Local-first PostgreSQL database running in WebAssembly
- **Supabase**: Cloud-hosted PostgreSQL with real-time features (being replaced by PGlite)
- **Seedlings**: Active prompts section in The Librarian's Home
- **Greenhouse**: Saved prompts library in The Librarian's Home
- **Global Commons**: Public prompt gallery (Wikipedia of Prompts)
- **Critique Engine**: Rule-based prompt scoring system (0-100 scale, 4 dimensions)
- **Status Lifecycle**: Draft → Active → Saved → Archived
- **Optimistic UI**: Update UI immediately, rollback on error
- **WCAG AA**: Web Content Accessibility Guidelines Level AA (4.5:1 contrast)

---

## Appendix B: Related Documents

### Existing Documentation
- `00_Roadmap/task_plan.md` - Master roadmap
- `05_Logs/AUDIT_LOG.md` - Technical audit log
- `JOURNAL.md` - Development journal
- `05_Logs/BUGS.md` - Bug tracking
- `README.md` - Setup instructions
- `lib/supabase/migrations/001_initial_schema.sql` - Current database schema

### Future Documents (To Be Generated)
- `.zenflow/tasks/{task_id}/spec.md` - Technical specification (next step)
- `.zenflow/tasks/{task_id}/plan.md` - Implementation plan (after spec)

---

## Appendix C: Acceptance Criteria Checklist

### Phase 0: PGlite Migration
- [ ] PGlite installed and configured at `/data/11-11.db`
- [ ] Database schema migrated with seed data
- [ ] All data access layers updated (no component changes needed)
- [ ] Supabase dependencies removed
- [ ] All existing features work with PGlite
- [ ] Zero regressions in functionality

### Phase 1: Multi-File Tabs
- [ ] Tab bar displays above editor
- [ ] Multiple files can be opened (up to 10 tabs)
- [ ] Unsaved indicators work correctly
- [ ] Tab close with unsaved changes shows confirmation
- [ ] Keyboard shortcuts functional
- [ ] Tab state persists across reloads
- [ ] Responsive design (mobile collapses to dropdown)

### Phase 2: Full Status Lifecycle
- [ ] All status transitions available in UI
- [ ] Archive view functional at `/librarian/archive`
- [ ] Status history tracked in database
- [ ] Bulk operations work correctly
- [ ] Status filters functional
- [ ] Bug [P2-003] resolved
- [ ] Zero regressions in existing status transitions

### Phase 3: File Operations
- [ ] Create file/folder works via UI
- [ ] Rename works via inline editing and context menu
- [ ] Delete moves to Google Drive Trash
- [ ] Context menu functional and accessible
- [ ] Error handling robust with retry option
- [ ] Optimistic UI with rollback on failure
- [ ] All operations sync to Google Drive

### Phase 4: Dark Mode
- [ ] Dark and light themes defined with WCAG AA contrast
- [ ] Theme toggle works in Header
- [ ] Theme persists across reloads
- [ ] System preference detected on first load
- [ ] Monaco editor theme switches correctly
- [ ] All components work in both themes
- [ ] Smooth transition animations (200ms)

### Phase 5: One-Click Publish
- [ ] Public toggle works with confirmation on first publish
- [ ] Database schema updated (published_at, visibility)
- [ ] Public prompts display in Commons view
- [ ] Privacy rules enforced (owner-only toggle)
- [ ] "Copy to My Library" works
- [ ] Filter: "My Public Prompts" vs "All Public Prompts"
- [ ] Sort by: Recent, Popular, Highest Score

### Phase 6: Performance Optimization
- [ ] Initial page load <2s (target met)
- [ ] First Contentful Paint <1s
- [ ] Time to Interactive <2s
- [ ] Largest Contentful Paint <2.5s
- [ ] Bundle size reduced by 30%+
- [ ] Monaco editor loads on demand
- [ ] No regressions in functionality
- [ ] Performance metrics documented in JOURNAL.md

---

## Appendix D: Environment Variables

### Current (v0.1.1 - Supabase)
```bash
NEXT_PUBLIC_DEV_MODE=true
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000
```

### Proposed (v0.2.0 - PGlite)
```bash
NEXT_PUBLIC_DEV_MODE=true
# Supabase variables REMOVED
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000
# PGlite requires NO environment variables (works out of the box)
```

---

## Appendix E: Deferred Features (Future Releases)

The following phases were originally planned for v0.2.0 but have been deferred to separate, focused releases:

### v0.2.1: Multi-File Tabs (Workbench Enhancement)
- Tab bar component above Monaco editor
- Unsaved indicators (orange dot)
- Tab actions (close, close all, close others)
- State persistence in localStorage
- Keyboard shortcuts (Cmd/Ctrl+W, Cmd/Ctrl+Tab, Cmd/Ctrl+1-9)

### v0.2.2: Full Status Lifecycle UI (Librarian Enhancement)
- All status transition buttons (draft→active, active→saved, saved→active, saved→archived, archived→active)
- Archive view at `/librarian/archive`
- Status history tracking (`status_history` JSONB column)
- Bulk operations (select multiple, bulk archive/restore/delete)
- Status filters in Greenhouse

### v0.2.3: Real-Time File Operations (Storage Enhancement)
- Create file/folder via context menu
- Rename files (inline editing)
- Delete files (move to Google Drive Trash)
- Context menu component (reusable, keyboard accessible)
- Error handling with retry

### v0.2.4: Dark Mode / Light Mode Toggle (UI/UX Enhancement)
- Theme system (dark/light color palettes)
- Theme toggle in Header (sun/moon icon)
- Theme persistence in localStorage
- System preference detection (`prefers-color-scheme`)
- Monaco editor theme switch

### v0.2.5: One-Click Publish (Global Commons Foundation)
- Public toggle UI in prompt cards
- Database schema updates (`published_at`, `visibility` enum)
- Public prompts view at `/librarian/commons`
- Privacy rules (owner-only toggle)
- "Copy to My Library" action

### v0.2.6: Optimize Initial Page Load (Performance Enhancement)
- Code splitting (Monaco, Framer Motion, multi-agent)
- Lazy loading (defer non-critical components)
- Bundle analysis and tree-shaking
- Asset optimization (WebP images, lazy load below fold)
- Performance measurement (FCP, TTI, LCP)

**Rationale for Deferral:**
Breaking the original v0.2.0 scope into smaller releases enables:
- Better quality control per feature
- Reduced cognitive load during development
- Faster iteration cycles
- Easier testing and validation
- Lower risk of regressions

---

**Document Status:** ✅ Complete (Phase 0 Only)  
**Scope Change:** Phases 1-6 deferred to v0.2.1-v0.2.6  
**Next Step:** Technical Specification (spec.md) updated to reflect Phase 0 scope  
**Author:** AI Agent (Zenflow)  
**Date:** January 12, 2026  
**Version:** v0.2.0 PRD Final (Phase 0)

