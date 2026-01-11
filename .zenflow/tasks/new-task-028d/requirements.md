# Product Requirements Document: Core Validation & Advanced Features

**Author:** Manus AI (Dojo)  
**Status:** Proposed  
**Date:** January 11, 2026  
**Version:** 1.0

---

## Executive Summary

This sprint focuses on three critical objectives:
1. **Validate** all features delivered in Sprint 2 (Google Drive Hybrid Sync, Monaco Editor) and Sprint 3 (UI Shell, Context Bus, Library/Gallery, Multi-Agent integration) through comprehensive testing
2. **Enhance** prompt management with advanced search, filtering, and categorization capabilities
3. **Implement** deep GitHub integration for version control and collaborative prompt management

This is a **validation-first** sprint ensuring the foundation is rock-solid before building advanced features.

---

## 1. Current State Analysis

### What's Working (Validated via Code Review)
✅ **Sprint 1 Complete:**
- Resizable panel layout with localStorage persistence
- Collapsible sidebar with file tree
- Multi-agent workspace (max 6 concurrent panels)
- Mock authentication with dev-mode bypass

✅ **Sprint 2 Complete:**
- Google Drive API integration (list, read, write files)
- Monaco Editor with auto-save (500ms debounce)
- Context Bus with typed event system (sub-millisecond propagation)
- Auth.js v5 migration
- SyncStatus shared state provider
- Zero ESLint warnings, zero TypeScript errors

✅ **Sprint 3 Complete:**
- Library and Gallery pages with PromptCard components
- Toast notification system with Framer Motion
- "Quick Copy", "Run in Chat", "Fork to Library" functionality
- Basic search (title, description, tags)
- Frontmatter metadata parsing (gray-matter)

### What's Missing
❌ **GitHub Integration:** No implementation exists (no `lib/github/` directory, no Octokit dependency)
❌ **Advanced Search/Filtering:** Only basic text search implemented
❌ **Categorization System:** No category/folder organization beyond Drive folders
❌ **Comprehensive Test Coverage:** Manual testing only, no automated tests
❌ **Conflict Resolution:** Last-write-wins for concurrent edits

---

## 2. Core Feature Validation Requirements

### 2.1 Sprint 2 Validation: Google Drive & Monaco Editor

**Objective:** Verify all Google Drive sync and editor features work correctly under various conditions.

**Test Scenarios:**

#### Google Drive File Operations
1. **List Files**
   - Navigate to Library page (`/library`)
   - Verify prompts from `/03_Prompts` folder display
   - Check that file metadata (name, modified time) is accurate
   - Confirm empty state shows when no prompts exist

2. **Fetch File Content**
   - Click on a prompt card
   - Verify content loads in Monaco Editor
   - Check that frontmatter is parsed correctly
   - Confirm syntax highlighting works for Markdown

3. **Update File Content**
   - Edit a file in Monaco Editor
   - Verify dirty state indicator (orange dot) appears
   - Wait for auto-save (500ms debounce)
   - Check that content persists after page reload
   - Verify `SyncStatus` shows "Synced" after successful save

4. **Error Handling**
   - Simulate network offline mode (DevTools)
   - Edit a file while offline
   - Verify error state is visible in `SyncStatus`
   - Reconnect network
   - Click retry button and confirm save succeeds

5. **Optimistic UI**
   - Edit file and observe immediate UI feedback
   - Verify rollback works on network failure
   - Check that local changes are preserved during errors

#### Monaco Editor
1. **Loading & Performance**
   - Open editor with small file (<10KB)
   - Open editor with large file (>100KB)
   - Measure load time and typing responsiveness

2. **Auto-Save**
   - Type continuously and verify max 1 save per 500ms
   - Verify debounce resets on new keystrokes
   - Check console for save operation logs

3. **Dirty State**
   - Make edits and verify orange dot appears
   - Save and verify dot disappears
   - Reload page and verify state is accurate

**Success Criteria:**
- All 5 Google Drive operations work without errors
- Monaco Editor loads in <2 seconds for files <100KB
- Auto-save triggers correctly with 500ms debounce
- Dirty state indicator is always accurate
- Error states are visible and actionable (retry button works)

**Deliverables:**
- Test execution log in `JOURNAL.md`
- Screenshots for each major test scenario in `05_Logs/screenshots/`
- List of identified bugs (if any) with severity ratings

---

### 2.2 Sprint 3 Validation: UI Shell, Context Bus, Library/Gallery

**Objective:** Verify all UI components, event propagation, and user workflows function correctly.

**Test Scenarios:**

#### Context Bus Event Propagation
1. **PLAN_UPDATED Event**
   - Create 3 ChatPanels (Manus, Supervisor, The Librarian)
   - Edit `task_plan.md` in Monaco Editor
   - Verify all panels receive event (check console logs)
   - Confirm "Context Refreshed" toast appears in all panels
   - Measure propagation time (should be <100ms)

2. **Event Subscription Stability**
   - Create 6 panels (max capacity)
   - Minimize/maximize panels
   - Close and reopen panels
   - Verify events still propagate to all active panels

#### Library Page
1. **Prompt Display**
   - Navigate to `/library`
   - Verify all prompts from `/03_Prompts` display
   - Check frontmatter parsing (title, description, tags)
   - Verify card animations (fade-in, hover scale)

2. **Quick Copy**
   - Click "Quick Copy" button
   - Verify prompt content copied to clipboard
   - Confirm success toast appears
   - Check that copied icon (checkmark) appears for 2s

3. **Run in Chat**
   - Click "Run in Chat" button
   - Verify navigation to `/?loadPrompt=[fileId]`
   - Confirm new ChatPanel spawns with prompt content
   - Check that URL parameter is cleared after loading

4. **Search**
   - Type in search box
   - Verify real-time filtering (300ms debounce)
   - Test search by title, description, and tags
   - Confirm empty state shows for no results

#### Gallery Page
1. **Public Prompts**
   - Navigate to `/gallery`
   - Verify only prompts with `public: true` display
   - Check that styling matches Library page

2. **Fork to Library**
   - Click "Fork to Library" button
   - Verify API call to `/api/drive/fork`
   - Confirm success toast with new filename
   - Check that duplicate name handling works (`-copy`, `-copy-2`, etc.)
   - Navigate to Library and verify forked prompt appears

#### Toast Notifications
1. **Visual Appearance**
   - Trigger success toast (copy prompt)
   - Trigger error toast (fork failure)
   - Verify colors (green/red), positioning (top-center)
   - Check animations (slide-in 200ms, fade-out 200ms)

2. **Auto-Dismiss**
   - Trigger toast and measure dismiss time (should be 3s)
   - Trigger multiple toasts and verify queue management
   - Check that toasts don't overlap

#### Multi-Agent Integration
1. **Panel Management**
   - Spawn 6 panels (max capacity)
   - Verify "New Session" button disables
   - Close 2 panels
   - Verify button re-enables

2. **Responsive Grid**
   - Test at 320px width (mobile): 1 column
   - Test at 768px width (tablet): 2 columns
   - Test at 1280px width (desktop): 3 columns

**Success Criteria:**
- Context Bus propagates events in <100ms to all panels
- All Library/Gallery features work without errors
- Toast system handles multiple toasts gracefully
- Multi-Agent grid is responsive across all breakpoints
- All animations complete in 200-300ms
- Search filtering is accurate and performant

**Deliverables:**
- Test execution log in `JOURNAL.md`
- Screenshots showing:
  - Context Bus event propagation (console logs)
  - Library page with prompts
  - Gallery page with fork action
  - Toast notifications (success and error)
  - Multi-Agent grid at different breakpoints
- Performance metrics (event propagation time, search debounce timing)

---

## 3. Advanced Prompt Management Requirements

### 3.1 Enhanced Search & Filtering

**Objective:** Provide users with powerful search and filtering capabilities beyond basic text matching.

#### Filter by Tags (Multi-Select)
**User Story:** As a user, I want to filter prompts by multiple tags simultaneously so I can find relevant prompts quickly.

**Requirements:**
- Display a tag filter dropdown with checkboxes
- Show all unique tags from prompt metadata
- Support multi-tag selection (AND logic: prompt must have all selected tags)
- Display count of prompts per tag
- Clear all filters button
- Persist filter state in URL query parameters

**UI Components:**
```
┌─────────────────────────────────────┐
│ [Search Input]        [Filter Tags] │
│                                     │
│ Selected: [ai ×] [coding ×]        │
└─────────────────────────────────────┘
```

#### Filter by Author
**User Story:** As a user, I want to see prompts created by specific authors.

**Requirements:**
- Extract author from frontmatter (`author: string`)
- Display author filter dropdown
- Show author avatar/name if available
- Support single author selection
- Show prompt count per author

#### Filter by Date Range
**User Story:** As a user, I want to find recently added prompts.

**Requirements:**
- Add date filter with presets: "Last 7 days", "Last 30 days", "Last 90 days", "All time"
- Use `created` field from frontmatter (fallback to Drive `createdTime`)
- Display relative dates ("2 days ago")

#### Sort Options
**User Story:** As a user, I want to sort prompts by different criteria.

**Requirements:**
- Sort by: "Newest", "Oldest", "Name (A-Z)", "Name (Z-A)"
- Default sort: "Newest"
- Persist sort preference in localStorage
- Smooth re-ordering animation (use Framer Motion layout transitions)

**Success Criteria:**
- Tag filter supports multi-select with accurate results
- Author filter works with proper metadata parsing
- Date filter correctly categorizes prompts
- Sort animations complete in <300ms
- Filter combinations work correctly (tags AND author AND date)
- URL reflects current filters for shareability

**UI/UX Guidelines:**
- Follow "Hardworking" aesthetic (calm, stable, no flashy animations)
- Use existing color palette (blue-600 for primary, gray for neutral)
- Maintain accessibility (keyboard navigation, ARIA labels)
- Show loading skeleton while applying filters

---

### 3.2 Categorization System

**Objective:** Allow users to organize prompts into custom categories beyond Drive folders.

#### Categories in Frontmatter
**User Story:** As a user, I want to categorize my prompts by topic or use case.

**Requirements:**
- Add `category` field to `PromptMetadata` type
- Support single category per prompt (e.g., "Development", "Writing", "Research")
- Display category badge on PromptCard
- Create category filter in Library/Gallery pages

**Metadata Schema Update:**
```yaml
---
title: Code Review Assistant
description: Provides detailed code reviews
tags: [ai, coding, review]
category: Development
author: Manus AI
created: 2026-01-10
version: 1.0
public: true
---
```

#### Category Management UI
**Requirements:**
- Create `CategorySelector` component for filtering
- Display as horizontal tabs above prompt grid
- Show prompt count per category
- Special "All" category shows all prompts
- Persist selected category in URL

**UI Layout:**
```
┌─────────────────────────────────────────────────┐
│ Library                                         │
├─────────────────────────────────────────────────┤
│ [All (24)] [Development (12)] [Writing (8)]    │
│ [Research (4)]                                  │
├─────────────────────────────────────────────────┤
│ [Search] [Filter Tags ▼] [Sort: Newest ▼]     │
├─────────────────────────────────────────────────┤
│ [Prompt Cards Grid]                             │
└─────────────────────────────────────────────────┘
```

**Success Criteria:**
- Category field parsed from frontmatter
- Category filter works in combination with other filters
- Category tabs have smooth transitions (200ms)
- Uncategorized prompts show in "All" category
- Category badge displays correctly on cards

---

### 3.3 Prompt Metadata Enhancements

**Objective:** Capture and display richer metadata for better organization.

#### Extended Metadata Fields
Add to `PromptMetadata` interface:
```typescript
export interface PromptMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;           // NEW
  public?: boolean;
  author?: string;
  created?: string;
  updated?: string;            // NEW: Last modified date
  version?: string;
  model?: string;              // NEW: Recommended AI model (e.g., "gpt-4", "claude-3")
  temperature?: number;        // NEW: Recommended temperature (0-1)
  maxTokens?: number;          // NEW: Recommended max tokens
  license?: string;            // NEW: License type (e.g., "MIT", "CC-BY-4.0")
  keywords?: string[];         // NEW: Additional searchable keywords
}
```

#### Display Enhancements
**Requirements:**
- Show `updated` date on card hover (tooltip)
- Display recommended model as badge if specified
- Show license type in footer of card
- Include keywords in search algorithm (same weight as tags)

**Success Criteria:**
- All new metadata fields parsed correctly
- Fields are optional (backward compatible)
- Search includes new keywords field
- PromptCard displays new metadata elegantly

---

## 4. Deep GitHub Sync Integration

### 4.1 GitHub API Setup

**Objective:** Integrate Octokit to manage prompt files in GitHub repositories.

#### Dependencies
**Requirements:**
- Install `@octokit/rest` package: `npm install @octokit/rest`
- Install `@octokit/auth-oauth-app` for authentication
- Create `lib/github/` directory structure:
  ```
  lib/github/
  ├── auth.ts         # GitHub OAuth helpers
  ├── client.ts       # GitHubClient wrapper class
  ├── types.ts        # GitHub-specific types
  └── sync.ts         # Sync orchestration logic
  ```

#### Environment Variables
Add to `.env.example`:
```bash
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your-github-oauth-app-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-app-secret

# GitHub Repository Configuration
GITHUB_REPO_OWNER=your-username-or-org
GITHUB_REPO_NAME=your-prompts-repo
GITHUB_PROMPTS_PATH=prompts  # Path within repo
```

#### GitHubClient Implementation
**Requirements:**
- Create `GitHubClient` class similar to `DriveClient`
- Implement methods:
  - `listFiles(path: string)`: List files in repo path
  - `getFileContent(path: string)`: Get file content and SHA
  - `createFile(path: string, content: string, message: string)`: Create new file
  - `updateFile(path: string, content: string, sha: string, message: string)`: Update existing file
  - `deleteFile(path: string, sha: string, message: string)`: Delete file
- Include retry logic with exponential backoff (same as DriveClient)
- Error handling for: 401 (auth), 404 (not found), 409 (conflict), 422 (validation)

**Error Classes:**
```typescript
class GitHubAuthError extends Error {}
class GitHubNotFoundError extends Error {}
class GitHubConflictError extends Error {}
class GitHubValidationError extends Error {}
class GitHubError extends Error {}
```

**Success Criteria:**
- GitHubClient can authenticate with OAuth token
- All CRUD operations work for `.md` files
- Retry logic handles transient failures
- Error messages are user-friendly

---

### 4.2 NextAuth GitHub Provider

**Objective:** Add GitHub as an authentication provider alongside Google.

**Requirements:**
- Add GitHub provider to `lib/auth.ts`:
  ```typescript
  import GitHubProvider from "next-auth/providers/github";
  
  providers: [
    GoogleProvider({ ... }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'repo read:user user:email',
        },
      },
    }),
  ],
  ```
- Update session callback to include GitHub access token
- Add GitHub avatar to user session
- Create account linking UI (future: link both Google and GitHub to one account)

**Session Interface Update:**
```typescript
interface Session {
  user: {
    name: string;
    email: string;
    image: string;
  };
  googleAccessToken?: string;
  googleRefreshToken?: string;
  githubAccessToken?: string;  // NEW
  expiryDate: number;
}
```

**Success Criteria:**
- Users can sign in with GitHub
- GitHub access token stored in session
- Token has `repo` scope for file operations
- No conflicts with existing Google OAuth

---

### 4.3 Bidirectional Sync

**Objective:** Synchronize prompt files between Google Drive and GitHub in both directions.

#### Sync Modes
**Requirements:**
1. **Manual Sync:** User clicks "Sync Now" button
2. **Auto-Sync on Save:** Triggered after successful Drive save (optional, configurable)
3. **Pull Changes:** Fetch latest from GitHub and update Drive
4. **Push Changes:** Upload Drive changes to GitHub

#### Sync Workflow (Drive → GitHub)
```
1. User saves file in Monaco Editor
2. File saved to Google Drive (existing flow)
3. Trigger GitHub sync:
   a. Check if file exists in GitHub repo
   b. If exists: Get file SHA
   c. Create/update file with commit message: "Update [filename] via 11-11 Workbench"
   d. Update SyncStatus: "Syncing to GitHub..."
   e. On success: Update SyncStatus: "Synced"
   f. On error: Show retry button
```

#### Sync Workflow (GitHub → Drive)
```
1. User clicks "Pull from GitHub"
2. Fetch all files from GitHub repo path
3. Compare with Drive files by filename
4. For each GitHub file:
   a. If not in Drive: Create new Drive file
   b. If in Drive and modified: Show conflict resolution UI
   c. Update SyncStatus for each operation
```

#### Sync Orchestration
**Requirements:**
- Create `SyncOrchestrator` class in `lib/github/sync.ts`
- Methods:
  - `syncFileToDrive(githubPath: string, driveFileId: string)`: Pull changes
  - `syncFileToGitHub(driveFileId: string, githubPath: string)`: Push changes
  - `syncAll(direction: 'push' | 'pull' | 'both')`: Sync all files
- Emit context bus events for sync progress:
  - `SYNC_STARTED`
  - `SYNC_FILE_COMPLETED`
  - `SYNC_COMPLETED`
  - `SYNC_ERROR`

**UI Updates:**
- Add "GitHub" section to `SyncStatus` component (next to Google Drive)
- Display GitHub icon with status (synced/syncing/error)
- Show last sync timestamp
- Add "Sync Now" button (dropdown: "Push to GitHub", "Pull from GitHub", "Sync Both")

**Success Criteria:**
- Files sync successfully in both directions
- Sync status updates in real-time
- Operations are atomic (all-or-nothing for batch syncs)
- Errors are logged and reported to user
- Sync progress visible in SyncStatus component

---

### 4.4 Conflict Resolution

**Objective:** Handle concurrent edits gracefully with user-friendly conflict resolution.

#### Conflict Detection
**Requirements:**
- Detect conflicts when:
  - GitHub SHA doesn't match expected value (file modified remotely)
  - Drive modifiedTime changed during sync operation
- Store file checksums (MD5 hash) for content comparison

#### Conflict Resolution UI
**User Story:** As a user, when I encounter a sync conflict, I want to choose which version to keep.

**Requirements:**
- Create `ConflictResolutionModal` component
- Show diff view (side-by-side comparison):
  - Left panel: "Your Version (Google Drive)"
  - Right panel: "Remote Version (GitHub)"
- Action buttons:
  - "Keep Mine (Google Drive)" - Overwrite GitHub
  - "Keep Theirs (GitHub)" - Overwrite Drive
  - "Manual Merge" - Open both in separate editor tabs

**Conflict Resolution Flow:**
```
1. Sync operation detects conflict
2. Show modal with diff view
3. User selects resolution strategy
4. Apply resolution:
   a. "Keep Mine": Force push to GitHub (override SHA check)
   b. "Keep Theirs": Overwrite Drive file
   c. "Manual Merge": 
      - Open Drive version in Editor (main tab)
      - Open GitHub version in new editor tab
      - User manually merges content
      - Save triggers normal sync flow
5. Close modal
6. Update SyncStatus: "Conflict resolved"
```

**UI Design:**
```
┌─────────────────────────────────────────────────────┐
│  Sync Conflict Detected: code-review-prompt.md     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Your Version (Google Drive)  │  Remote (GitHub)   │
│  ────────────────────────────────────────────────  │
│  # Code Review                │  # Code Review     │
│  Provides detailed reviews    │  Provides reviews  │
│  ...                          │  ...               │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [Keep Mine] [Keep Theirs] [Manual Merge] [Cancel] │
└─────────────────────────────────────────────────────┘
```

**Success Criteria:**
- Conflicts detected accurately (100% detection rate)
- Diff view shows clear differences
- All three resolution strategies work correctly
- No data loss during conflict resolution
- User can cancel and retry later

**Advanced Feature (Optional):**
- Automatic merge for non-overlapping changes (three-way merge algorithm)
- Only show conflict UI for actual content conflicts

---

### 4.5 GitHub Sync UI Feedback

**Objective:** Provide clear, real-time feedback for all GitHub sync operations.

#### SyncStatus Enhancement
**Requirements:**
- Add GitHub section to existing `SyncStatus` component
- Display dual indicators side-by-side:
  ```
  [Google Drive: ● Synced] [GitHub: ● Synced]
  ```
- Status states:
  - Green dot + "Synced": Last sync succeeded
  - Yellow dot + "Syncing...": Operation in progress
  - Red dot + "Error": Operation failed
  - Gray dot + "Not connected": GitHub not authenticated

#### Sync Progress Toast
**Requirements:**
- Show toast during long sync operations:
  - "Syncing 12 files to GitHub... (3/12 complete)"
  - Auto-dismiss on completion
  - Show error details in toast if operation fails

#### Sync History (Future Enhancement)
- Display last 10 sync operations in a log panel
- Include: timestamp, direction (push/pull), status, files affected

**Success Criteria:**
- SyncStatus accurately reflects GitHub state
- Users understand current sync status at a glance
- Progress feedback provided for operations >2 seconds
- Error messages actionable (include retry button)

---

## 5. Technical Architecture

### 5.1 Type Definitions

**New Types (add to `lib/types.ts`):**
```typescript
export interface GitHubFile {
  path: string;
  content: string;
  sha: string;
  size: number;
  url: string;
  htmlUrl: string;
}

export interface SyncConflict {
  fileId: string;
  fileName: string;
  driveContent: string;
  githubContent: string;
  driveSha?: string;
  githubSha: string;
  driveModified: string;
  githubModified: string;
}

export type SyncDirection = 'push' | 'pull' | 'both';

export interface SyncOperation {
  id: string;
  type: 'push' | 'pull';
  status: 'pending' | 'in_progress' | 'completed' | 'error' | 'conflict';
  filesTotal: number;
  filesCompleted: number;
  conflicts: SyncConflict[];
  startTime: Date;
  endTime?: Date;
  error?: string;
}
```

### 5.2 API Routes

**New Routes:**
```
POST /api/github/auth          # Initiate GitHub OAuth
GET  /api/github/files         # List files in repo
GET  /api/github/content/:path # Get file content
POST /api/github/sync          # Trigger sync operation
POST /api/github/resolve       # Resolve conflict
```

### 5.3 Context Bus Events

**New Events:**
```typescript
export type ContextBusEvent =
  | ... existing events ...
  | { type: 'SYNC_STARTED'; payload: { operation: SyncOperation } }
  | { type: 'SYNC_FILE_COMPLETED'; payload: { fileName: string; status: 'success' | 'error' } }
  | { type: 'SYNC_COMPLETED'; payload: { operation: SyncOperation } }
  | { type: 'SYNC_CONFLICT'; payload: { conflict: SyncConflict } }
  | { type: 'GITHUB_AUTH_CHANGED'; payload: { connected: boolean } };
```

### 5.4 Component Updates

**Components to Create:**
- `components/github/GitHubSyncButton.tsx` - Trigger sync operations
- `components/github/ConflictResolutionModal.tsx` - Resolve conflicts
- `components/github/SyncProgressToast.tsx` - Progress feedback
- `components/library/FilterPanel.tsx` - Advanced filters (tags, author, date)
- `components/library/CategoryTabs.tsx` - Category navigation
- `components/shared/SortDropdown.tsx` - Sort options

**Components to Modify:**
- `components/shared/SyncStatus.tsx` - Add GitHub status
- `components/shared/PromptCard.tsx` - Add category badge
- `components/library/LibraryView.tsx` - Integrate filters and categories
- `components/gallery/GalleryView.tsx` - Same as Library
- `hooks/usePromptSearch.ts` - Enhance with new filters

---

## 6. Testing & Validation Strategy

### 6.1 Unit Testing (Future)
- Test filtering logic in `usePromptSearch`
- Test sync orchestration logic
- Test conflict detection algorithm
- Test metadata parsing (extended fields)

### 6.2 Integration Testing
**Manual Test Scenarios:**
1. **Full Sync Flow (Drive → GitHub)**
   - Create prompt in Drive via editor
   - Trigger GitHub sync
   - Verify file appears in GitHub repo with correct content
   - Check commit message and metadata

2. **Full Sync Flow (GitHub → Drive)**
   - Create `.md` file in GitHub repo
   - Trigger pull sync
   - Verify file appears in Library
   - Check frontmatter parsed correctly

3. **Conflict Resolution**
   - Edit file in Drive
   - Edit same file in GitHub (different content)
   - Trigger sync
   - Verify conflict modal appears
   - Test all three resolution strategies

4. **Advanced Filtering**
   - Create prompts with various tags, categories, authors
   - Test each filter independently
   - Test filter combinations
   - Verify URL reflects filters

5. **Error Scenarios**
   - Revoke GitHub OAuth token
   - Verify error state shows
   - Reconnect and verify recovery
   - Test network failure during sync
   - Verify retry mechanism works

**Success Criteria:**
- All test scenarios pass without errors
- No data loss in any scenario
- Error states are clear and actionable
- Recovery from errors is seamless

---

## 7. UI/UX Design Guidelines

### 7.1 Visual Consistency
- Follow existing "Hardworking Workbench" aesthetic
- Use established color palette:
  - Blue-600 for primary actions (sync, filter)
  - Green-500 for success states
  - Red-500 for errors
  - Yellow-500 for warnings/conflicts
  - Gray-50 to Gray-900 for neutral elements

### 7.2 Animation Timing
- All animations: 200-300ms duration
- Use `ease-out` for entrances, `ease-in` for exits
- Layout transitions: max 300ms
- No flashy or distracting effects

### 7.3 Accessibility
- All interactive elements keyboard navigable
- ARIA labels for icon-only buttons
- Focus indicators visible and clear
- Color contrast meets WCAG AA standards
- Screen reader announcements for sync status changes

### 7.4 Responsive Design
- Mobile (< 768px): Filters collapse into drawer/modal
- Tablet (768px - 1279px): Filters in sidebar
- Desktop (≥ 1280px): Filters in top panel
- Touch-friendly targets (min 44×44px)

---

## 8. Success Metrics

### 8.1 Core Validation
- ✅ Zero critical bugs found in Sprint 2/3 features
- ✅ All test scenarios documented with screenshots
- ✅ Performance benchmarks recorded (event propagation, editor load time)
- ✅ 100% feature parity validated

### 8.2 Advanced Prompt Management
- ✅ Filtering reduces result set in <100ms
- ✅ Multi-tag filter works with 100+ prompts
- ✅ Category organization is intuitive (user feedback)
- ✅ Search relevance is high (manual evaluation)

### 8.3 GitHub Integration
- ✅ Bidirectional sync works for 100+ files
- ✅ Conflict detection accuracy: 100%
- ✅ Sync operation completes in <5s for 10 files
- ✅ Zero data loss in conflict resolution
- ✅ GitHub commits have meaningful messages

### 8.4 Code Quality
- ✅ Zero ESLint warnings
- ✅ Zero TypeScript errors
- ✅ Production build succeeds
- ✅ All animations follow timing guidelines (200-300ms)

---

## 9. Out of Scope (Deferred to Future Sprints)

❌ **Not Included:**
- Automated unit/integration tests (manual testing only)
- Real-time collaborative editing (WebSockets, Yjs)
- Advanced conflict resolution (three-way merge, auto-merge)
- GitHub webhooks for automatic pull on remote changes
- Bulk operations (delete multiple prompts, batch export)
- Prompt versioning (rollback to previous versions)
- Supabase integration for semantic search
- Public prompt gallery with community contributions
- GitHub Actions integration for CI/CD

---

## 10. Risk Assessment

### 10.1 Technical Risks

**Risk:** GitHub API rate limiting (5000 requests/hour for authenticated users)
**Mitigation:** 
- Implement request caching
- Batch operations where possible
- Display rate limit status in UI
- Graceful degradation when limit reached

**Risk:** OAuth token expiration during long sync operations
**Mitigation:**
- Implement silent token refresh (already planned for Sprint 3)
- Validate token before starting sync
- Retry with fresh token on 401 errors

**Risk:** Large file sync performance (100+ files)
**Mitigation:**
- Implement pagination (sync 20 files at a time)
- Show progress indicator
- Allow cancel operation
- Queue-based sync architecture

### 10.2 UX Risks

**Risk:** Conflict resolution is too complex for non-technical users
**Mitigation:**
- Provide clear, visual diff view
- Default to safest option ("Manual Merge")
- Include help text and examples
- Beta test with real users

**Risk:** Too many filters overwhelm users
**Mitigation:**
- Start with collapsed filter panel
- Show filter count badge
- Provide "Reset Filters" button
- Save common filter combinations as presets (future)

---

## 11. Timeline Estimate

**Phase 1: Core Validation (Week 1)**
- Sprint 2 validation: 2 days
- Sprint 3 validation: 2 days
- Bug fixes from validation: 1 day

**Phase 2: Advanced Prompt Management (Week 2)**
- Enhanced filtering UI: 2 days
- Category system: 1 day
- Extended metadata: 1 day
- Testing and polish: 1 day

**Phase 3: GitHub Integration (Week 3-4)**
- GitHub API setup and auth: 2 days
- Bidirectional sync: 3 days
- Conflict resolution: 2 days
- Testing and bug fixes: 2 days

**Total Estimate:** 3-4 weeks for full completion

---

## 12. Dependencies

**External:**
- `@octokit/rest` - GitHub API client
- `@octokit/auth-oauth-app` - GitHub OAuth
- `gray-matter` - Already installed (metadata parsing)

**Internal:**
- Stable Sprint 2 Google Drive integration
- Stable Sprint 3 Library/Gallery pages
- Working Auth.js v5 with OAuth providers
- Existing Context Bus infrastructure

**Environment:**
- GitHub OAuth app created and configured
- Google Drive API credentials (existing)
- Access to Google Drive `/03_Prompts` folder
- GitHub repository for prompt storage

---

## 13. Acceptance Criteria

### Sprint Complete When:
1. ✅ All Sprint 2/3 features validated with test logs and screenshots
2. ✅ Advanced filtering (tags, author, date) works with accurate results
3. ✅ Category system implemented and intuitive
4. ✅ GitHub bidirectional sync works for all file operations
5. ✅ Conflict resolution UI tested with all resolution strategies
6. ✅ SyncStatus shows GitHub state accurately
7. ✅ Zero ESLint warnings
8. ✅ Zero TypeScript errors
9. ✅ Production build succeeds
10. ✅ All features responsive on mobile/tablet/desktop
11. ✅ JOURNAL.md updated with validation results and implementation notes
12. ✅ Screenshots captured for all major features

---

## 14. Open Questions

**For User/Stakeholder Decision:**
1. Should GitHub sync be automatic on save, or manual-only?
2. Which conflict resolution strategy should be default?
3. Should we support multiple GitHub repos per user?
4. What should default category names be? (or user-defined only?)
5. Should filters persist across sessions (localStorage)?

**Technical Questions:**
1. Should we implement a sync queue for reliability?
2. How to handle GitHub file size limits (100MB per file)?
3. Should we store GitHub SHA in Drive file metadata?
4. Implement webhook support now or defer?

---

## Appendix A: Current Prompt Metadata Schema

```yaml
---
title: Code Review Assistant
description: Provides detailed code reviews with suggestions
tags: [ai, coding, review, feedback]
public: true
author: Manus AI
created: 2026-01-10
version: 1.0
---

[Prompt content here]
```

## Appendix B: Proposed Extended Schema

```yaml
---
title: Code Review Assistant
description: Provides detailed code reviews with suggestions
tags: [ai, coding, review, feedback]
category: Development                    # NEW
public: true
author: Manus AI
created: 2026-01-10
updated: 2026-01-11                      # NEW
version: 1.0
model: gpt-4                             # NEW
temperature: 0.7                         # NEW
maxTokens: 2000                          # NEW
license: MIT                             # NEW
keywords: [code-review, static-analysis] # NEW
---

[Prompt content here]
```

---

**End of Requirements Document**
