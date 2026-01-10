# Product Requirements Document: The Workbench & Hybrid Sync (Sprint 2)

**Version:** 1.0  
**Date:** January 10, 2026  
**Sprint:** Sprint 2 - Smart Build  
**Status:** Requirements Phase  

## Executive Summary

Sprint 2 transforms the 11-11 UI Shell into a functional workbench by implementing three core capabilities:

1. **Professional Markdown Editor** - Monaco-based editor with auto-save and optimistic UI
2. **Google Drive Hybrid Sync v0.1** - Read/write integration with Google Drive API
3. **Shared Context Bus** - Event-driven state synchronization across the Multi-Agent grid

This sprint establishes the foundation for "Planning with Files" by connecting the editor to real cloud storage and enabling agents to react to document changes.

## Goals & Success Criteria

### Primary Goals
1. Users can edit Markdown files with professional syntax highlighting
2. Changes auto-save to Google Drive with optimistic UI feedback
3. Agents in the Multi-Agent grid receive real-time notifications when `task_plan.md` is updated
4. Sync status accurately reflects Google Drive connection state with error handling

### Success Criteria
✅ Monaco Editor displays selected file content from FileTree  
✅ Editor auto-saves with 500ms debounce after typing stops  
✅ "Dirty state" indicator appears when file has unsaved changes  
✅ Google Drive API successfully lists files from `/03_Prompts` and `/01_PRDs` folders  
✅ File content fetched and updated via Google Drive API endpoints  
✅ ContextBus emits `PLAN_UPDATED` event when `task_plan.md` changes  
✅ ChatPanel components log context updates to browser console  
✅ Console shows `[ContextBus] Plan update received for Agent: [AgentName]`  
✅ SyncStatus component displays "Error" state with retry button on sync failure  
✅ Production build succeeds with zero TypeScript/ESLint errors  
✅ Screenshot verification shows Editor + Multi-Agent grid + Console logs  

## User Stories

### US-1: Edit Markdown Files
**As a** user  
**I want to** select a file from the FileTree and edit it in a professional editor  
**So that** I can maintain my prompt library and PRDs with proper syntax highlighting  

**Acceptance Criteria:**
- Clicking a file in FileTree loads content in Monaco Editor
- Markdown syntax highlighting is enabled
- YAML frontmatter is highlighted correctly
- Editor is responsive and renders at full height/width

### US-2: Auto-Save with Optimistic UI
**As a** user  
**I want** my changes to save automatically after I stop typing  
**So that** I don't lose work and see immediate feedback  

**Acceptance Criteria:**
- Editor debounces saves by 500ms after last keystroke
- "Dirty state" indicator (dot or icon) appears immediately on edit
- Indicator clears after successful save
- Local state updates immediately (optimistic UI)
- API call happens in background

### US-3: Google Drive File Listing
**As a** user  
**I want to** see my Google Drive files in the FileTree  
**So that** I can access my prompts and PRDs from the cloud  

**Acceptance Criteria:**
- `GET /api/drive/files` endpoint returns files from configured folders
- FileTree displays Google Drive files with cloud icon badge
- Folders `/03_Prompts` and `/01_PRDs` are queryable
- File metadata includes: id, name, modified date

### US-4: Google Drive Content Sync
**As a** user  
**I want** to read and write file content to Google Drive  
**So that** my work is backed up and accessible from anywhere  

**Acceptance Criteria:**
- `GET /api/drive/content/[fileId]` fetches file content
- `PATCH /api/drive/content/[fileId]` updates file content
- Sync errors display in SyncStatus component
- Retry button appears on error state

### US-5: Agent Context Awareness
**As a** multi-agent system  
**I want** agents to be notified when `task_plan.md` is updated  
**So that** they can incorporate the latest plan into their responses  

**Acceptance Criteria:**
- ContextBus emits `PLAN_UPDATED` event on file save
- ChatPanel components subscribe to the event via `useContextBus` hook
- Console logs `[ContextBus] Plan update received for Agent: [AgentName]`
- Agents display "Context Refreshed" toast or badge
- System Context in ChatPanel updates with new plan content

### US-6: Sync Status Management
**As a** user  
**I want** to see the status of my last sync operations  
**So that** I know if my changes are safely stored  

**Acceptance Criteria:**
- `useSyncStatus` hook tracks last 5 API calls
- SyncStatus component shows "Synced" (green) when successful
- SyncStatus shows "Syncing..." (yellow) during active sync
- SyncStatus shows "Error" (red) with retry button on failure
- Retry button re-attempts failed sync operation

## Feature Requirements

### 1. Markdown Editor Component

#### 1.1 Monaco Integration
- **Component:** `MarkdownEditor` in `components/editor/MarkdownEditor.tsx`
- **Library:** `@monaco-editor/react` (to be installed)
- **Configuration:**
  - Language: `markdown`
  - Theme: `vs-light` (matches "Hardworking" aesthetic)
  - Options: minimap enabled, line numbers, word wrap
  - Height: 100% of parent container

#### 1.2 Controlled Component
- Editor value controlled by `activeFile` state in repository context
- Context: `useRepository` hook to be created
- State shape:
  ```typescript
  interface RepositoryContext {
    activeFile: FileNode | null;
    fileContent: string;
    setFileContent: (content: string) => void;
    isDirty: boolean;
    saveFile: () => Promise<void>;
  }
  ```

#### 1.3 Auto-Save Logic
- **Debounce:** 500ms after last keystroke
- **Implementation:** Use `useDebounce` custom hook or `lodash.debounce`
- **Optimistic UI:** Update local state immediately, then call API
- **Error Handling:** Display toast notification on save failure

#### 1.4 Dirty State Indicator
- **Visual:** Orange dot or pencil icon next to filename
- **Location:** EditorView header or FileTree item
- **Logic:** `isDirty = fileContent !== savedContent`
- **Clear:** On successful save response

#### 1.5 Syntax Highlighting
- **Markdown:** Standard markdown syntax
- **Frontmatter:** YAML frontmatter between `---` delimiters
- **Code Blocks:** Syntax highlighting for common languages (js, ts, python, bash)

### 2. Google Drive Hybrid Sync v0.1

#### 2.1 DriveClient Wrapper
- **File:** `lib/google/drive.ts`
- **Library:** `googleapis` (to be installed)
- **Methods:**
  ```typescript
  class DriveClient {
    listFiles(folderId: string): Promise<DriveFile[]>;
    getFileContent(fileId: string): Promise<string>;
    updateFileContent(fileId: string, content: string): Promise<void>;
    searchFiles(query: string): Promise<DriveFile[]>;
  }
  ```

#### 2.2 Authentication
- **Strategy:** Google OAuth 2.0 with NextAuth.js (or similar)
- **Dev Mode:** Mock credentials when `NEXT_PUBLIC_DEV_MODE=true`
- **Scopes Required:**
  - `https://www.googleapis.com/auth/drive.file`
  - `https://www.googleapis.com/auth/drive.readonly`
- **Token Storage:** Encrypted session cookie or localStorage
- **Token Refresh:** Handle 401 responses by refreshing access token

#### 2.3 API Endpoints

##### GET /api/drive/files
- **Purpose:** List files from specific folders
- **Query Params:**
  - `folder`: "prompts" | "prds" (maps to folder IDs)
- **Response:**
  ```typescript
  {
    files: Array<{
      id: string;
      name: string;
      mimeType: string;
      modifiedTime: string;
      path: string;
    }>;
  }
  ```
- **Error Handling:** Return 401 on auth failure, 500 on API error

##### GET /api/drive/content/[fileId]
- **Purpose:** Fetch file content by ID
- **Response:**
  ```typescript
  {
    fileId: string;
    content: string;
    modifiedTime: string;
  }
  ```
- **Cache:** No caching (always fetch fresh)

##### PATCH /api/drive/content/[fileId]
- **Purpose:** Update file content
- **Body:**
  ```typescript
  {
    content: string;
  }
  ```
- **Response:**
  ```typescript
  {
    success: boolean;
    modifiedTime: string;
  }
  ```
- **Conflict Handling:** Return 409 if file modified since last fetch

#### 2.4 Folder Configuration
- **Environment Variables:**
  ```env
  GOOGLE_DRIVE_PROMPTS_FOLDER_ID=<folder-id>
  GOOGLE_DRIVE_PRDS_FOLDER_ID=<folder-id>
  GOOGLE_CLIENT_ID=<client-id>
  GOOGLE_CLIENT_SECRET=<client-secret>
  ```
- **Fallback:** Use mock folder IDs in dev mode

#### 2.5 Error Handling Strategy
- **Network Errors:** Retry up to 3 times with exponential backoff
- **Auth Errors:** Trigger re-authentication flow
- **Rate Limiting:** Queue requests and display "Syncing..." status
- **Quota Exceeded:** Display error message with link to Google Drive quota page
- **File Not Found:** Display toast and remove from FileTree

### 3. Shared Context Bus

#### 3.1 ContextBusProvider
- **File:** `components/providers/ContextBusProvider.tsx`
- **Implementation:** React Context + EventEmitter
- **Library:** `mitt` (lightweight event emitter, to be installed)
- **Provider Structure:**
  ```typescript
  interface ContextBusState {
    emit: (event: string, data: any) => void;
    on: (event: string, handler: (data: any) => void) => void;
    off: (event: string, handler: (data: any) => void) => void;
  }
  ```

#### 3.2 Event Types
```typescript
type ContextBusEvent =
  | { type: 'PLAN_UPDATED'; payload: { content: string; timestamp: Date } }
  | { type: 'FILE_SAVED'; payload: { fileId: string; fileName: string } }
  | { type: 'AGENT_SPAWNED'; payload: { agentId: string; persona: string } }
  | { type: 'SYNC_STATUS_CHANGED'; payload: { status: 'synced' | 'syncing' | 'error' } };
```

#### 3.3 Broadcast Logic
- **Trigger:** When `task_plan.md` is saved via auto-save
- **Event:** `contextBus.emit('PLAN_UPDATED', { content: newContent, timestamp: new Date() })`
- **Location:** In `saveFile` function of `useRepository` hook
- **Conditional:** Only emit if filename matches `task_plan.md`

#### 3.4 useContextBus Hook
- **File:** `hooks/useContextBus.ts`
- **Interface:**
  ```typescript
  function useContextBus() {
    return {
      emit: (event: string, data: any) => void;
      subscribe: (event: string, handler: (data: any) => void) => void;
    };
  }
  ```
- **Cleanup:** Automatically unsubscribe on component unmount

#### 3.5 ChatPanel Integration
- **Subscription:** Subscribe to `PLAN_UPDATED` event in `useEffect`
- **Handler:**
  1. Log to console: `[ContextBus] Plan update received for Agent: ${persona?.name}`
  2. Update internal state: `systemContext` state variable
  3. Display toast: "Context Refreshed" with checkmark icon
  4. Auto-dismiss toast after 3 seconds
- **Performance:** Use `React.memo` to prevent unnecessary re-renders

#### 3.6 Console Verification
- **Format:** `[ContextBus] Plan update received for Agent: Manus`
- **Level:** `console.log` (not error or warn)
- **Timestamp:** Include ISO timestamp for debugging
- **Data:** Include first 100 characters of new content (truncated with "...")

### 4. Sync Status Management

#### 4.1 useSyncStatus Hook
- **File:** `hooks/useSyncStatus.ts`
- **State:**
  ```typescript
  interface SyncOperation {
    id: string;
    type: 'read' | 'write';
    status: 'pending' | 'success' | 'error';
    timestamp: Date;
    error?: string;
  }
  
  interface SyncStatusState {
    operations: SyncOperation[]; // Last 5 operations
    lastSync: Date | null;
    isError: boolean;
    retrySyncOperation: (operationId: string) => Promise<void>;
  }
  ```

#### 4.2 SyncStatus Component Update
- **Current:** Displays mock "Synced" status
- **Enhancement:**
  - Connect to `useSyncStatus` hook
  - Display "Error" state when `isError === true`
  - Add retry button (circular arrow icon) next to "Error" text
  - Click handler calls `retrySyncOperation` for last failed operation
  - Show loading spinner during retry

#### 4.3 Error States
- **Synced:** Green dot + "Synced" text
- **Syncing:** Yellow dot (animated pulse) + "Syncing..." text
- **Error:** Red dot + "Error" text + retry button
- **Retrying:** Yellow dot (animated spinner) + "Retrying..." text

### 5. Visual Trace & Documentation

#### 5.1 Screenshot Requirements
- **Viewport:** Full browser window (minimum 1280x800)
- **Layout:** Resizable panels showing Editor + Multi-Agent grid
- **Console:** Browser DevTools console visible with `[ContextBus]` logs
- **Interaction:** At least 2 ChatPanel components open
- **Evidence:** Console must show `PLAN_UPDATED` event logs
- **File Name:** `05_Logs/screenshots/sprint-2-context-bus-verification.png`

#### 5.2 Journal Update
- **File:** `JOURNAL.md`
- **Section:** Add "Sprint 2: Smart Build" section
- **Content:**
  - ContextBus architecture diagram (ASCII or Markdown)
  - DriveClient error-handling flowchart
  - Performance optimizations (React.memo usage)
  - Token refresh strategy
  - Known limitations and future enhancements

#### 5.3 AUDIT_LOG.md
- **Update:** Add Sprint 2 completion entry
- **Include:**
  - Files added/modified
  - Dependencies added
  - Test results (lint, type-check, manual verification)
  - Console log verification timestamp

## Technical Requirements

### 6.1 Dependencies to Add
```json
{
  "dependencies": {
    "@monaco-editor/react": "^4.6.0",
    "googleapis": "^131.0.0",
    "mitt": "^3.0.1",
    "next-auth": "^4.24.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.5"
  }
}
```

### 6.2 New Files to Create
- `components/editor/MarkdownEditor.tsx` - Monaco editor component
- `components/providers/ContextBusProvider.tsx` - Event bus provider
- `components/providers/RepositoryProvider.tsx` - File state management
- `lib/google/drive.ts` - Google Drive client wrapper
- `lib/google/auth.ts` - Google OAuth helpers
- `hooks/useRepository.ts` - Repository context hook
- `hooks/useContextBus.ts` - Context bus hook
- `hooks/useSyncStatus.ts` - Sync status management hook
- `hooks/useDebounce.ts` - Debounce utility hook
- `app/api/drive/files/route.ts` - List files endpoint
- `app/api/drive/content/[fileId]/route.ts` - Get/update content endpoint
- `app/api/auth/[...nextauth]/route.ts` - NextAuth.js configuration

### 6.3 Files to Modify
- `components/editor/EditorView.tsx` - Replace placeholder with MarkdownEditor
- `components/multi-agent/ChatPanel.tsx` - Add ContextBus subscription
- `components/shared/SyncStatus.tsx` - Connect to useSyncStatus hook
- `components/shared/FileTree.tsx` - Connect to Google Drive API
- `app/layout.tsx` - Add ContextBusProvider and RepositoryProvider
- `lib/types.ts` - Add new type definitions
- `lib/constants.ts` - Add Google Drive folder configurations
- `JOURNAL.md` - Add Sprint 2 documentation
- `05_Logs/AUDIT_LOG.md` - Add completion entry

### 6.4 Environment Variables
```env
# Existing
NEXT_PUBLIC_DEV_MODE=true

# New for Sprint 2
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_DRIVE_PROMPTS_FOLDER_ID=<folder-id>
GOOGLE_DRIVE_PRDS_FOLDER_ID=<folder-id>
NEXTAUTH_SECRET=<random-secret>
NEXTAUTH_URL=http://localhost:3000
```

### 6.5 Type Definitions
```typescript
// lib/types.ts additions

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  path: string;
}

export interface SyncOperation {
  id: string;
  type: 'read' | 'write';
  status: 'pending' | 'success' | 'error';
  timestamp: Date;
  error?: string;
}

export interface ContextBusEvent {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface RepositoryState {
  activeFile: FileNode | null;
  fileContent: string;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
}
```

## Performance Requirements

### 7.1 Rendering Performance
- **React.memo:** Apply to ChatPanel components to prevent re-renders
- **useMemo:** Memoize file tree transformations
- **useCallback:** Wrap event handlers in ChatPanel and MarkdownEditor
- **Code Splitting:** Lazy load Monaco Editor to reduce initial bundle size

### 7.2 API Performance
- **Debouncing:** 500ms debounce for auto-save
- **Request Caching:** Cache file listings for 30 seconds
- **Batch Operations:** Queue multiple file updates and send as batch
- **Lazy Loading:** Only fetch file content when file is opened

### 7.3 Animation Performance
- **60fps Target:** All animations must maintain 60fps
- **GPU Acceleration:** Use CSS transforms for animations
- **Framer Motion:** Continue using existing animation system

## Security Requirements

### 8.1 Authentication
- **OAuth 2.0:** Use Google OAuth for Drive access
- **Token Storage:** Store tokens securely in httpOnly cookies
- **CSRF Protection:** Enable CSRF protection in NextAuth.js
- **Dev Mode:** Clearly indicate when in dev mode (bypass real auth)

### 8.2 API Security
- **Rate Limiting:** Implement rate limiting on API routes
- **Input Validation:** Validate all user inputs and file content
- **Error Messages:** Don't expose sensitive information in error messages
- **CORS:** Restrict API access to same origin

### 8.3 Data Privacy
- **Minimal Scopes:** Request only necessary Google Drive scopes
- **No Logging:** Don't log file content or user data
- **Encryption:** Use HTTPS in production

## Testing Requirements

### 9.1 Manual Testing Checklist
- [ ] Monaco Editor loads with sample Markdown file
- [ ] Syntax highlighting works for Markdown and YAML frontmatter
- [ ] Auto-save triggers 500ms after typing stops
- [ ] Dirty state indicator appears/disappears correctly
- [ ] Google Drive files appear in FileTree
- [ ] File content loads when clicking Drive file
- [ ] File updates successfully save to Drive
- [ ] SyncStatus shows "Synced" on success
- [ ] SyncStatus shows "Error" on failure
- [ ] Retry button re-attempts failed sync
- [ ] Console logs `[ContextBus]` messages when plan updates
- [ ] ChatPanel displays "Context Refreshed" toast
- [ ] Multi-Agent grid doesn't re-render unnecessarily
- [ ] Production build succeeds
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint warnings (`npm run lint`)

### 9.2 Verification Scripts
```bash
# Setup
npm install

# Development
npm run dev

# Quality Checks
npm run lint
npm run type-check
npm run build
```

### 9.3 Console Log Verification
Must see logs matching this pattern:
```
[ContextBus] Plan update received for Agent: Manus
[ContextBus] Plan update received for Agent: Supervisor
```

## Open Questions & Assumptions

### Questions for Clarification
1. **Google Drive Setup:** Should we create a setup wizard for configuring folder IDs, or provide them manually in `.env.local`?
2. **Conflict Resolution:** How should we handle conflicts when a file is modified externally while editing?
3. **Testing Strategy:** Do we need automated tests for this sprint, or is manual verification sufficient?
4. **Monaco Theme:** Should we create a custom theme to match the "Hardworking" aesthetic, or use default `vs-light`?
5. **Context Bus Persistence:** Should context events be persisted to localStorage for page reloads?

### Assumptions Made
1. **Dev Mode Priority:** Google Drive integration will work with mock data when `NEXT_PUBLIC_DEV_MODE=true`
2. **Single User:** This sprint assumes single-user usage; multi-user collaboration is future work
3. **File Types:** Only Markdown (`.md`) files are editable; other file types display as read-only
4. **Folder Structure:** User has pre-existing `/03_Prompts` and `/01_PRDs` folders in their Google Drive root
5. **Context Bus Scope:** ContextBus is client-side only; server-side agents are future work
6. **Error Recovery:** Failed syncs can be retried manually; automatic retry is future enhancement
7. **Performance:** React.memo is sufficient; more advanced optimization (e.g., virtualization) is future work
8. **Testing:** Manual testing with screenshot verification is acceptable; automated tests are Sprint 3+

## Out of Scope for Sprint 2

The following features are explicitly **NOT** included in this sprint:

- ❌ Real-time collaboration (multiple users editing same file)
- ❌ Conflict resolution UI (merge conflicts, version history)
- ❌ GitHub integration (GitHub Octokit API)
- ❌ Automated unit/E2E tests
- ❌ File upload/download UI
- ❌ Markdown preview pane (split view)
- ❌ Search within files
- ❌ Folder creation/deletion
- ❌ File rename/move operations
- ❌ Advanced Monaco features (IntelliSense, snippets)
- ❌ Mobile-responsive editor (desktop-first for this sprint)
- ❌ Offline mode with sync queue
- ❌ Version history / time travel
- ❌ Context Bus server-side integration

These features are deferred to future sprints to maintain focus on the core "Smart Build" objectives.

## Success Metrics

### Primary Metrics
- ✅ User can edit and save a Markdown file end-to-end
- ✅ Console logs show context updates when plan file changes
- ✅ Screenshot verification includes all required elements
- ✅ Production build completes without errors
- ✅ Code quality: 0 TypeScript errors, 0 ESLint warnings

### Secondary Metrics
- 📈 Editor loads in < 1 second
- 📈 Auto-save completes in < 2 seconds
- 📈 ContextBus event propagation < 100ms
- 📈 File tree loads < 500ms

### Quality Metrics
- 📊 Code coverage: Not measured this sprint (manual testing only)
- 📊 Bundle size: Monitor but no hard limit
- 📊 Lighthouse score: Not measured this sprint

## Timeline & Milestones

**Sprint Duration:** 5-7 days (estimated)

### Milestone 1: Editor Integration (Day 1-2)
- Install Monaco dependencies
- Create MarkdownEditor component
- Implement RepositoryProvider
- Replace EditorView placeholder

### Milestone 2: Google Drive Sync (Day 2-4)
- Install googleapis and NextAuth
- Create DriveClient wrapper
- Implement API routes
- Update FileTree to load Drive files
- Implement auto-save logic

### Milestone 3: Context Bus (Day 4-5)
- Install mitt
- Create ContextBusProvider
- Implement useContextBus hook
- Update ChatPanel with subscription
- Test console logging

### Milestone 4: Sync Status & Polish (Day 5-6)
- Implement useSyncStatus hook
- Update SyncStatus component
- Add error handling and retry logic
- Apply React.memo optimizations
- Update JOURNAL.md

### Milestone 5: Verification (Day 6-7)
- Run lint and type-check
- Manual testing checklist
- Capture screenshot with console logs
- Update AUDIT_LOG.md
- Final production build test

## Approval & Sign-Off

**Prepared by:** AI Agent (Requirements Phase)  
**Date:** January 10, 2026  
**Status:** Ready for Technical Specification  

**Next Steps:**
1. Review PRD with stakeholders
2. Address open questions
3. Proceed to Technical Specification (Step 2)
4. Begin implementation planning

---

*This PRD follows the "Sustainable Innovation" philosophy: paced development that prioritizes creator well-being and clear requirements before implementation.*
