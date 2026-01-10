# Technical Specification: The Workbench & Hybrid Sync (Sprint 2)

**Version:** 1.0  
**Date:** January 10, 2026  
**Status:** Technical Specification Phase  
**Based on:** requirements.md (v1.0)

## 1. Technical Context

### 1.1 Technology Stack
- **Framework:** Next.js 14.2.24 (App Router)
- **Language:** TypeScript 5.7.2 (strict mode enabled)
- **UI Library:** React 18.3.1
- **Styling:** Tailwind CSS 3.4.17
- **Animations:** Framer Motion 11.15.0
- **Layout:** react-resizable-panels 2.1.7
- **Icons:** lucide-react 0.469.0
- **Build:** Next.js production build

### 1.2 New Dependencies Required
```json
{
  "dependencies": {
    "@monaco-editor/react": "^4.6.0",
    "googleapis": "^131.0.0",
    "mitt": "^3.0.1",
    "next-auth": "^4.24.0"
  }
}
```

### 1.3 Existing Architecture Patterns
- **Component Structure:** `components/` organized by domain (editor, layout, multi-agent, shared, providers)
- **Type Definitions:** Centralized in `lib/types.ts`
- **Constants:** Centralized in `lib/constants.ts`
- **Utilities:** Helper functions in `lib/utils.ts`
- **Styling:** Utility-first Tailwind with `cn()` for conditional classes
- **State Management:** React Context API with custom providers (see `MockSessionProvider.tsx`)
- **Animations:** Framer Motion with consistent easing (`ANIMATION_EASE`)
- **Client Components:** All interactive components use `"use client"` directive

## 2. Implementation Approach

### 2.1 Architecture Overview

The implementation follows a three-layer architecture:

```
┌─────────────────────────────────────────────────────────┐
│                     UI Components Layer                  │
│   (MarkdownEditor, ChatPanel, SyncStatus, FileTree)     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                  Context Providers Layer                 │
│  (RepositoryProvider, ContextBusProvider, AuthProvider) │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                  Service/API Layer                       │
│     (DriveClient, API Routes, Event Emitter)            │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Core Design Patterns

#### 2.2.1 Provider Pattern (Existing Pattern)
Reference: `components/providers/MockSessionProvider.tsx`
- Use React Context for state management
- Provide hooks for consuming context (`useRepository`, `useContextBus`)
- Wrap providers in `app/layout.tsx`

#### 2.2.2 Optimistic UI Pattern
Reference: Standard React pattern
- Update local state immediately on user input
- Debounce API calls (500ms)
- Handle rollback on API errors

#### 2.2.3 Event Bus Pattern
Implementation: `mitt` library (lightweight pub/sub)
- Decouple components via events
- Type-safe event payloads
- Automatic cleanup on unmount

#### 2.2.4 Memoization Pattern (Performance)
Reference: Existing use in component tree
- `React.memo` for ChatPanel to prevent unnecessary re-renders
- `useMemo` for expensive computations
- `useCallback` for event handlers

### 2.3 Development Mode Strategy

Following the existing pattern in the codebase:
- **Dev Mode Flag:** `NEXT_PUBLIC_DEV_MODE=true` (already used in codebase)
- **Mock Data:** Use mock file tree when Google Drive credentials unavailable
- **Graceful Degradation:** App functions without real Google Drive connection
- **Console Warnings:** Log when in dev mode with mock data

### 2.4 Error Handling Strategy

#### Google Drive API Errors
```typescript
// lib/google/drive.ts
class DriveClient {
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    // Exponential backoff retry logic
  }
  
  private handleError(error: any): never {
    if (error.code === 401) throw new AuthError();
    if (error.code === 404) throw new NotFoundError();
    if (error.code === 429) throw new RateLimitError();
    throw new DriveError(error.message);
  }
}
```

#### Error Recovery Flow
1. **Network Error:** Retry up to 3 times with exponential backoff (1s, 2s, 4s)
2. **Auth Error (401):** Clear session, trigger re-auth (future enhancement)
3. **Not Found (404):** Remove file from tree, show toast
4. **Rate Limit (429):** Queue requests, show "Syncing..." status
5. **Unknown Error:** Show generic error in SyncStatus with retry button

## 3. Source Code Structure Changes

### 3.1 New Files to Create

#### Core Components
```
components/
├── editor/
│   └── MarkdownEditor.tsx          [NEW] Monaco-based editor component
├── providers/
│   ├── RepositoryProvider.tsx      [NEW] File state management context
│   └── ContextBusProvider.tsx      [NEW] Event bus provider
```

#### Hooks
```
hooks/
├── useRepository.ts                [NEW] Repository context hook
├── useContextBus.ts                [NEW] Context bus hook
├── useSyncStatus.ts                [NEW] Sync status management
└── useDebounce.ts                  [NEW] Debounce utility hook
```

#### Google Drive Integration
```
lib/
└── google/
    ├── drive.ts                    [NEW] DriveClient wrapper class
    ├── auth.ts                     [NEW] Auth helpers
    └── types.ts                    [NEW] Google-specific types
```

#### API Routes
```
app/api/
├── drive/
│   ├── files/
│   │   └── route.ts                [NEW] GET /api/drive/files
│   └── content/
│       └── [fileId]/
│           └── route.ts            [NEW] GET/PATCH /api/drive/content/[fileId]
└── auth/
    └── [...nextauth]/
        └── route.ts                [NEW] NextAuth.js config
```

### 3.2 Files to Modify

#### Existing Components
```
components/
├── editor/
│   └── EditorView.tsx              [MODIFY] Replace placeholder with MarkdownEditor
├── multi-agent/
│   └── ChatPanel.tsx               [MODIFY] Add ContextBus subscription
├── shared/
│   ├── SyncStatus.tsx              [MODIFY] Connect to useSyncStatus hook
│   └── FileTree.tsx                [MODIFY] Connect to Google Drive API
└── layout/
    └── MainContent.tsx             [MODIFY] Potentially update for dirty state indicator
```

#### Configuration & Types
```
lib/
├── types.ts                        [MODIFY] Add new type definitions
└── constants.ts                    [MODIFY] Add Drive folder configs

app/
└── layout.tsx                      [MODIFY] Add ContextBusProvider, RepositoryProvider

JOURNAL.md                          [MODIFY] Add Sprint 2 architecture docs
05_Logs/AUDIT_LOG.md               [MODIFY] Add completion entry
```

### 3.3 Directory Structure (Final State)
```
11-11/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── drive/
│   │       ├── files/route.ts
│   │       └── content/[fileId]/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── editor/
│   │   ├── EditorView.tsx
│   │   └── MarkdownEditor.tsx
│   ├── layout/
│   ├── multi-agent/
│   ├── providers/
│   │   ├── MockSessionProvider.tsx
│   │   ├── RepositoryProvider.tsx
│   │   └── ContextBusProvider.tsx
│   └── shared/
├── hooks/
│   ├── useRepository.ts
│   ├── useContextBus.ts
│   ├── useSyncStatus.ts
│   └── useDebounce.ts
├── lib/
│   ├── google/
│   │   ├── auth.ts
│   │   ├── drive.ts
│   │   └── types.ts
│   ├── constants.ts
│   ├── types.ts
│   └── utils.ts
└── data/
    └── mockFileTree.ts
```

## 4. Data Model / API / Interface Changes

### 4.1 Type Definitions (lib/types.ts)

#### New Types
```typescript
// Google Drive Integration
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  path: string;
  webViewLink?: string;
}

// Sync Management
export interface SyncOperation {
  id: string;
  type: 'read' | 'write';
  status: 'pending' | 'success' | 'error';
  timestamp: Date;
  error?: string;
  fileId?: string;
  fileName?: string;
}

export interface SyncStatusState {
  operations: SyncOperation[];  // Last 5 operations
  lastSync: Date | null;
  isError: boolean;
  currentOperation: SyncOperation | null;
}

// Repository State
export interface RepositoryState {
  activeFile: FileNode | null;
  fileContent: string;
  savedContent: string;  // For dirty state comparison
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

// Context Bus Events
export type ContextBusEvent =
  | { type: 'PLAN_UPDATED'; payload: { content: string; timestamp: Date } }
  | { type: 'FILE_SAVED'; payload: { fileId: string; fileName: string } }
  | { type: 'AGENT_SPAWNED'; payload: { agentId: string; persona: string } }
  | { type: 'SYNC_STATUS_CHANGED'; payload: { status: 'synced' | 'syncing' | 'error' } };
```

#### Modified Types
```typescript
// Extend existing SyncStatus type
export interface SyncStatus {
  googleDrive: {
    connected: boolean;
    lastSync?: Date;
    syncing: boolean;
    error?: string;  // NEW
  };
  github: {
    connected: boolean;
    lastSync?: Date;
    syncing: boolean;
    error?: string;  // NEW
  };
}

// Extend existing FileNode (already has isModified field)
// No changes needed - already supports dirty state indicator
```

### 4.2 API Routes Specification

#### GET /api/drive/files
```typescript
// Query Parameters
interface FilesQueryParams {
  folder?: 'prompts' | 'prds';  // Optional, defaults to both
}

// Response
interface FilesResponse {
  files: DriveFile[];
  error?: string;
}

// Status Codes
// 200: Success
// 401: Unauthorized (no valid session)
// 500: Server error
```

#### GET /api/drive/content/[fileId]
```typescript
// URL Parameters
interface ContentParams {
  fileId: string;
}

// Response
interface ContentResponse {
  fileId: string;
  content: string;
  modifiedTime: string;
  error?: string;
}

// Status Codes
// 200: Success
// 401: Unauthorized
// 404: File not found
// 500: Server error
```

#### PATCH /api/drive/content/[fileId]
```typescript
// URL Parameters
interface ContentParams {
  fileId: string;
}

// Request Body
interface UpdateContentRequest {
  content: string;
  lastModifiedTime?: string;  // For conflict detection (future)
}

// Response
interface UpdateContentResponse {
  success: boolean;
  modifiedTime: string;
  error?: string;
}

// Status Codes
// 200: Success
// 401: Unauthorized
// 404: File not found
// 409: Conflict (file modified since last fetch - future)
// 500: Server error
```

### 4.3 Context Provider Interfaces

#### RepositoryContext
```typescript
interface RepositoryContextValue {
  // State
  activeFile: FileNode | null;
  fileContent: string;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  
  // Actions
  setActiveFile: (file: FileNode | null) => void;
  setFileContent: (content: string) => void;
  saveFile: () => Promise<void>;
  discardChanges: () => void;
}
```

#### ContextBusContext
```typescript
interface ContextBusContextValue {
  emit: <T extends ContextBusEvent>(event: T['type'], payload: T['payload']) => void;
  on: <T extends ContextBusEvent>(
    event: T['type'],
    handler: (payload: T['payload']) => void
  ) => void;
  off: <T extends ContextBusEvent>(
    event: T['type'],
    handler: (payload: T['payload']) => void
  ) => void;
}
```

### 4.4 DriveClient Class Interface

```typescript
class DriveClient {
  constructor(accessToken: string);
  
  // File Operations
  listFiles(folderId: string): Promise<DriveFile[]>;
  getFileContent(fileId: string): Promise<{ content: string; modifiedTime: string }>;
  updateFileContent(fileId: string, content: string): Promise<{ modifiedTime: string }>;
  searchFiles(query: string): Promise<DriveFile[]>;
  
  // Internal Helpers
  private withRetry<T>(operation: () => Promise<T>, maxRetries?: number): Promise<T>;
  private handleError(error: any): never;
}
```

### 4.5 Hook Interfaces

#### useRepository Hook
```typescript
function useRepository(): RepositoryContextValue;
```

#### useContextBus Hook
```typescript
function useContextBus(): ContextBusContextValue;
```

#### useSyncStatus Hook
```typescript
function useSyncStatus(): {
  status: SyncStatusState;
  addOperation: (operation: Omit<SyncOperation, 'id' | 'timestamp'>) => void;
  retryLastFailed: () => Promise<void>;
  clearOperations: () => void;
};
```

#### useDebounce Hook
```typescript
function useDebounce<T>(value: T, delay: number): T;
```

### 4.6 Environment Variables

```bash
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

## 5. Delivery Phases

### Phase 1: Foundation & Editor Integration (Days 1-2)
**Goal:** Monaco Editor functional with local state

**Tasks:**
1. Install dependencies (`@monaco-editor/react`, `mitt`)
2. Create `MarkdownEditor` component
3. Create `RepositoryProvider` with local state only
4. Create `useRepository` and `useDebounce` hooks
5. Replace `EditorView.tsx` placeholder with `MarkdownEditor`
6. Implement auto-save with debounce (500ms)
7. Add dirty state indicator to editor header

**Verification:**
- [ ] Monaco loads with sample content
- [ ] Syntax highlighting works for Markdown
- [ ] Auto-save updates local state after 500ms
- [ ] Dirty indicator appears/disappears correctly
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes

### Phase 2: Google Drive Integration (Days 2-4)
**Goal:** Real Google Drive read/write operations

**Tasks:**
1. Install `googleapis` and `next-auth`
2. Create `lib/google/drive.ts` (DriveClient)
3. Create `lib/google/auth.ts` (auth helpers)
4. Implement `app/api/auth/[...nextauth]/route.ts`
5. Implement `app/api/drive/files/route.ts`
6. Implement `app/api/drive/content/[fileId]/route.ts`
7. Update `RepositoryProvider` to use Drive API
8. Update `FileTree.tsx` to load from `/api/drive/files`
9. Connect editor save to `/api/drive/content/[fileId]` PATCH
10. Add error handling with retry logic

**Verification:**
- [ ] FileTree displays files from Google Drive (or mock in dev mode)
- [ ] Clicking file loads content from Drive API
- [ ] Saving updates Google Drive successfully
- [ ] Error states display correctly
- [ ] Auth flow works (or bypasses in dev mode)
- [ ] API endpoints return proper status codes
- [ ] `npm run build` succeeds

### Phase 3: Context Bus & Agent Integration (Days 4-5)
**Goal:** Agents receive context updates

**Tasks:**
1. Create `ContextBusProvider` using `mitt`
2. Create `useContextBus` hook
3. Update `app/layout.tsx` to include `ContextBusProvider`
4. Emit `PLAN_UPDATED` event in `RepositoryProvider.saveFile()`
5. Subscribe to `PLAN_UPDATED` in `ChatPanel.tsx`
6. Add console logging in ChatPanel handler
7. Add "Context Refreshed" toast/badge to ChatPanel
8. Apply `React.memo` to `ChatPanel` component

**Verification:**
- [ ] Saving `task_plan.md` triggers event emission
- [ ] Console shows `[ContextBus] Plan update received for Agent: [Name]`
- [ ] Multiple ChatPanels receive events independently
- [ ] Toast appears and auto-dismisses
- [ ] ChatPanels don't re-render unnecessarily
- [ ] Event cleanup happens on unmount

### Phase 4: Sync Status & Error Handling (Days 5-6)
**Goal:** Robust sync status with retry functionality

**Tasks:**
1. Create `useSyncStatus` hook
2. Update `SyncStatus.tsx` to use `useSyncStatus`
3. Add error state UI (red dot + "Error" + retry button)
4. Implement retry logic in `useSyncStatus`
5. Track last 5 operations in sync status
6. Add animated states (syncing spinner, pulsing dot)
7. Integrate sync status with Drive API calls

**Verification:**
- [ ] SyncStatus shows "Synced" on success
- [ ] SyncStatus shows "Syncing..." during API call
- [ ] SyncStatus shows "Error" on failure
- [ ] Retry button re-attempts failed operation
- [ ] Last 5 operations are tracked
- [ ] Animation states work correctly

### Phase 5: Documentation & Verification (Days 6-7)
**Goal:** Complete documentation and final verification

**Tasks:**
1. Update `JOURNAL.md` with architecture documentation
2. Add ASCII diagram of ContextBus flow
3. Document DriveClient error handling strategy
4. Update `05_Logs/AUDIT_LOG.md`
5. Run full test suite (`npm run lint`, `npm run type-check`, `npm run build`)
6. Manual testing checklist (from PRD section 9.1)
7. Capture screenshot with Editor + Multi-Agent + Console
8. Save screenshot to `05_Logs/screenshots/sprint-2-verification.png`
9. Final code review and cleanup

**Verification:**
- [ ] All manual tests pass (PRD section 9.1)
- [ ] Screenshot includes all required elements
- [ ] Console logs match expected format
- [ ] Production build succeeds
- [ ] 0 TypeScript errors
- [ ] 0 ESLint warnings
- [ ] JOURNAL.md documents architecture
- [ ] AUDIT_LOG.md updated

## 6. Verification Approach

### 6.1 Linting & Type Checking
```bash
# Run before committing each phase
npm run lint          # ESLint - must pass with 0 warnings
npm run type-check    # TypeScript - must pass with 0 errors
npm run build         # Production build - must succeed
```

### 6.2 Manual Testing Checklist
Per PRD section 9.1 - all items must pass:
- Monaco editor functionality
- Auto-save and dirty state
- Google Drive file operations
- Sync status states
- Context bus event propagation
- Console log verification
- Performance (no unnecessary re-renders)

### 6.3 Console Log Verification
Required output format:
```
[ContextBus] 2026-01-10T19:24:55.123Z Plan update received for Agent: Manus
  Content preview: "# Task Plan\n\n## Phase 1\n..."
[ContextBus] 2026-01-10T19:24:55.125Z Plan update received for Agent: Supervisor
  Content preview: "# Task Plan\n\n## Phase 1\n..."
```

### 6.4 Screenshot Requirements
- **Filename:** `05_Logs/screenshots/sprint-2-verification.png`
- **Resolution:** Minimum 1280x800
- **Elements:**
  - MarkdownEditor with visible Markdown content
  - FileTree with files loaded
  - Multi-Agent grid with at least 2 ChatPanels
  - Browser console with `[ContextBus]` logs visible
  - SyncStatus showing connection state

### 6.5 Performance Verification
- Open React DevTools Profiler
- Save `task_plan.md`
- Verify ChatPanel components don't re-render unless they receive the event
- Ensure auto-save debounces properly (no more than 1 API call per 500ms edit session)

## 7. Technical Constraints & Trade-offs

### 7.1 Constraints
1. **Dev Mode Required:** Google Drive integration must work without credentials
2. **Single User:** No multi-user collaboration support
3. **Client-Side Only:** ContextBus is browser-only (no server-side agents)
4. **No Offline Support:** Requires active internet for Drive operations
5. **No Conflict Resolution:** Last write wins (conflict detection is future work)

### 7.2 Trade-offs Made
1. **Monaco Lazy Loading:** Trade initial bundle size for faster subsequent loads
2. **Optimistic UI:** Trade consistency for perceived performance
3. **500ms Debounce:** Balance between responsiveness and API call frequency
4. **Last 5 Operations:** Trade memory for debugging visibility
5. **React.memo Only:** More advanced optimization (virtualization) deferred

### 7.3 Known Limitations
1. **Token Expiration:** Auth token refresh not implemented (requires manual re-auth)
2. **Large Files:** No streaming for large file content (load entire file into memory)
3. **Rate Limiting:** Basic retry logic only (no request queuing)
4. **Search:** No full-text search within files
5. **Version History:** No access to Google Drive revision history

## 8. Security Considerations

### 8.1 Authentication
- Google OAuth 2.0 with minimal scopes (`drive.file`, `drive.readonly`)
- NextAuth.js for session management
- HttpOnly cookies for token storage (when implemented)
- CSRF protection enabled by default in NextAuth.js

### 8.2 API Security
- API routes check for valid session before operations
- Input validation on all file content (sanitize before upload)
- Error messages don't expose sensitive information (file paths, IDs)
- CORS restricted to same origin (Next.js default)

### 8.3 Data Privacy
- No logging of file content to console (except first 100 chars in dev mode)
- No analytics tracking of user data
- Google Drive files never stored permanently on server

## 9. Performance Targets

### 9.1 Load Times
- Monaco Editor: < 1 second (with lazy loading)
- File tree load: < 500ms
- File content fetch: < 1 second
- Auto-save completion: < 2 seconds

### 9.2 Runtime Performance
- 60fps for all animations
- ContextBus event propagation: < 100ms
- Re-render prevention: ChatPanels only update on relevant events

### 9.3 Bundle Size
- Monitor but no hard limit for this sprint
- Monaco Editor will be the largest addition (~1.5MB)
- Consider code splitting in future sprints

## 10. Dependencies Map

```
Components Layer
├── MarkdownEditor
│   └── depends on: useRepository, @monaco-editor/react
├── ChatPanel
│   └── depends on: useContextBus, React.memo
├── SyncStatus
│   └── depends on: useSyncStatus
└── FileTree
    └── depends on: /api/drive/files

Context Layer
├── RepositoryProvider
│   └── depends on: useContextBus, /api/drive/content/[fileId]
├── ContextBusProvider
│   └── depends on: mitt
└── AuthProvider
    └── depends on: next-auth

Service Layer
├── DriveClient
│   └── depends on: googleapis
├── API Routes
│   └── depends on: DriveClient, next-auth
└── EventEmitter
    └── depends on: mitt
```

## 11. Migration Path

Since this is a new feature (not replacing existing functionality), migration is straightforward:

1. **No Breaking Changes:** All existing components continue to work
2. **Additive Only:** New providers wrap existing app structure
3. **Backward Compatible:** Dev mode allows app to run without Google Drive
4. **Graceful Degradation:** Missing env vars don't crash the app

## 12. Success Criteria

This implementation is complete when:
- ✅ All Phase 5 verification tasks pass
- ✅ Screenshot demonstrates full functionality
- ✅ Console logs match expected format
- ✅ Production build succeeds with 0 errors/warnings
- ✅ JOURNAL.md and AUDIT_LOG.md updated
- ✅ Manual testing checklist 100% complete

---

**Next Step:** Proceed to Planning phase to break down into detailed implementation tasks

**Prepared by:** AI Agent (Technical Specification Phase)  
**Date:** January 10, 2026  
**Status:** Ready for Planning
