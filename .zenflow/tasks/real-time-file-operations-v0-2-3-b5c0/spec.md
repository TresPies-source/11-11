# Technical Specification: Real-Time File Operations v0.2.3

**Date:** January 12, 2026  
**Complexity:** Hard  
**Estimated Duration:** 2-3 days

---

## 1. Executive Summary

This specification outlines the implementation of real-time file operations (create, rename, delete) in the 11-11 Sustainable Intelligence OS. Users will be able to manage files and folders directly from the UI via Google Drive API integration, eliminating the need to switch to external file managers.

### Complexity Assessment: **Hard**

**Rationale:**
- **API Integration Complexity:** Requires extending Google Drive API client with new operations
- **State Management:** Complex optimistic UI updates with rollback across multiple components
- **UI/UX Complexity:** Context menu system with keyboard accessibility and proper positioning
- **Error Handling:** Multiple failure modes (network, API limits, validation, conflicts)
- **Edge Cases:** File references in open tabs, recent files, file tree state
- **Architectural Impact:** Affects RepositoryProvider, FileTree, and sync status systems

---

## 2. Technical Context

### 2.1 Current Architecture

**Technology Stack:**
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript 5.7
- **Styling:** Tailwind CSS 3.4, Framer Motion 11.15
- **Storage:** Google Drive API v3 (via googleapis 131.0)
- **Database:** PGlite (local IndexedDB)
- **Auth:** NextAuth 5.0 (Google OAuth)

**Existing Components:**
- `DriveClient` (`lib/google/drive.ts`) - Google Drive API wrapper with retry logic
- `RepositoryProvider` - File state management with optimistic updates
- `FileTree` - Recursive file tree display with expand/collapse
- `SyncStatusProvider` - Operation tracking and error handling
- `ContextBus` - Event-driven state synchronization

**Current API Routes:**
- `GET /api/drive/files` - List files in folders
- `GET /api/drive/content/[fileId]` - Fetch file content
- `PATCH /api/drive/content/[fileId]` - Update file content

---

## 3. Implementation Approach

### 3.1 Google Drive API Extensions

**New DriveClient Methods:**

1. **`createFile(params: DriveCreateFileParams)`**
   - Already exists in `lib/google/drive.ts:108-134`
   - Creates text/markdown files
   - ✅ Ready to use

2. **`createFolder(params: DriveCreateFolderParams)` - NEW**
   - Create folder via `files.create` with `mimeType: 'application/vnd.google-apps.folder'`
   - Return folder metadata (id, name, modifiedTime)

3. **`renameFile(fileId: string, newName: string)` - NEW**
   - Update file/folder via `files.update` with `requestBody: { name: newName }`
   - Validate name format (no special characters, no duplicates)
   - Return updated metadata

4. **`deleteFile(fileId: string)` - NEW**
   - Move to trash via `files.update` with `requestBody: { trashed: true }`
   - **NOT permanent delete** (soft delete only)
   - Return success response

**Type Definitions (`lib/google/types.ts`):**

```typescript
export interface DriveCreateFolderParams {
  folderId: string;
  name: string;
}

export interface DriveCreateFolderResponse {
  success: boolean;
  folderId: string;
  folderName: string;
  modifiedTime: string;
}

export interface DriveRenameParams {
  fileId: string;
  newName: string;
}

export interface DriveRenameResponse {
  success: boolean;
  fileId: string;
  newName: string;
  modifiedTime: string;
}

export interface DriveDeleteResponse {
  success: boolean;
  fileId: string;
}
```

### 3.2 New API Routes

**1. `POST /api/drive/create` - Create File/Folder**

```typescript
// Request body
{
  type: 'file' | 'folder',
  name: string,
  folderId: string,
  content?: string // Only for files
}

// Response
{
  success: boolean,
  id: string,
  name: string,
  type: 'file' | 'folder',
  modifiedTime: string
}
```

**Implementation:**
- Validate name (no `/`, `\`, `*`, `?`, `"`, `<`, `>`, `|`, `:`)
- Check for duplicate names in same folder
- Create file/folder via DriveClient
- Return metadata for file tree update

**2. `PATCH /api/drive/rename` - Rename File/Folder**

```typescript
// Request body
{
  fileId: string,
  newName: string,
  currentName: string, // For validation
  parentId: string
}

// Response
{
  success: boolean,
  fileId: string,
  newName: string,
  modifiedTime: string
}
```

**Implementation:**
- Validate new name format
- Check for duplicate names in same folder
- Rename via DriveClient
- Update all references (open tabs, recent files)

**3. `DELETE /api/drive/delete` - Delete File/Folder**

```typescript
// Request body
{
  fileId: string,
  fileName: string // For logging/confirmation
}

// Response
{
  success: boolean,
  fileId: string
}
```

**Implementation:**
- Soft delete (move to trash) via DriveClient
- Close file if open in editor
- Remove from file tree
- Update sync status

### 3.3 UI Components

**1. ContextMenu Component (`components/shared/ContextMenu.tsx`)**

```typescript
interface ContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  items: ContextMenuItem[];
}

interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean; // Red color for delete
  separator?: boolean; // Divider line
}
```

**Features:**
- Portal rendering (React Portal for z-index independence)
- Auto-positioning (avoid screen edges)
- Keyboard navigation (Tab, Arrow keys, Enter, Escape)
- Click outside to close
- Focus trap for accessibility
- Framer Motion animations (fade + scale)

**2. CreateFileModal Component (`components/shared/CreateFileModal.tsx`)**

```typescript
interface CreateFileModalProps {
  isOpen: boolean;
  type: 'file' | 'folder';
  parentNode: FileNode;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
}
```

**Features:**
- Controlled input with validation
- Real-time error display (duplicate name, invalid characters)
- Loading state during creation
- Auto-focus input on open
- Submit on Enter key
- Cancel on Escape key
- Accessible form with ARIA labels

**3. DeleteConfirmDialog Component (`components/shared/DeleteConfirmDialog.tsx`)**

```typescript
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  fileName: string;
  fileType: 'file' | 'folder';
  onClose: () => void;
  onConfirm: () => Promise<void>;
}
```

**Features:**
- Danger warning (red accent)
- File/folder name display
- Soft delete explanation
- Loading state during deletion
- Keyboard shortcuts (Enter to confirm, Escape to cancel)

**4. Enhanced FileTree (`components/shared/FileTree.tsx`)**

**New Features:**
- Right-click context menu trigger
- Inline rename mode (double-click on name)
- Keyboard shortcut support (F2 to rename, Delete key)
- Loading indicators during operations
- Optimistic UI updates with rollback

**Modified Props:**
```typescript
interface FileTreeProps {
  nodes: FileNode[];
  level?: number;
  selectedId?: string;
  onSelect?: (node: FileNode) => void;
  expandedIds?: Set<string>;
  onToggleExpand?: (id: string) => void;
  
  // NEW
  onCreateFile?: (parentNode: FileNode) => void;
  onCreateFolder?: (parentNode: FileNode) => void;
  onRename?: (node: FileNode, newName: string) => Promise<void>;
  onDelete?: (node: FileNode) => Promise<void>;
  operationInProgress?: Set<string>; // File IDs with pending operations
}
```

### 3.4 Custom Hooks

**1. `useFileOperations` Hook**

```typescript
interface UseFileOperationsReturn {
  createFile: (parentNode: FileNode, name: string) => Promise<void>;
  createFolder: (parentNode: FileNode, name: string) => Promise<void>;
  renameFile: (node: FileNode, newName: string) => Promise<void>;
  deleteFile: (node: FileNode) => Promise<void>;
  
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}
```

**Implementation:**
- Optimistic file tree updates
- API calls to new routes
- Error handling with rollback
- Sync status integration
- Context bus event emission

**2. `useContextMenu` Hook**

```typescript
interface UseContextMenuReturn {
  isOpen: boolean;
  x: number;
  y: number;
  targetNode: FileNode | null;
  
  openContextMenu: (event: React.MouseEvent, node: FileNode) => void;
  closeContextMenu: () => void;
}
```

**Implementation:**
- Position calculation (avoid screen edges)
- Auto-close on click outside
- Track target node for operations

---

## 4. State Management Strategy

### 4.1 Optimistic UI Updates

**Pattern:**
```typescript
// 1. Save current state
const previousFileTree = [...fileTreeState];

// 2. Update UI immediately
updateFileTreeOptimistically(newState);

// 3. Make API call
try {
  await apiCall();
  // 4. Success: Refresh to get server state
  await refreshFileTree();
} catch (error) {
  // 5. Rollback on failure
  setFileTreeState(previousFileTree);
  showErrorToast('Failed to create file', { retry: () => createFile() });
}
```

**Benefits:**
- Instant user feedback
- Perceived performance improvement
- Clear error recovery path

### 4.2 File Tree State Management

**Location:** New `FileTreeProvider` context

```typescript
interface FileTreeContextValue {
  fileTree: FileNode[];
  setFileTree: (tree: FileNode[]) => void;
  refreshFileTree: () => Promise<void>;
  
  // Optimistic operations
  addNode: (parentId: string, node: FileNode) => void;
  updateNode: (nodeId: string, updates: Partial<FileNode>) => void;
  removeNode: (nodeId: string) => void;
  
  isRefreshing: boolean;
}
```

**Integration Points:**
- `RepositoryProvider` - Update activeFile on rename/delete
- `SyncStatusProvider` - Track file operation status
- `ContextBus` - Emit FILE_CREATED, FILE_RENAMED, FILE_DELETED events

### 4.3 Reference Updates

**When file is renamed:**
1. Update file tree node name
2. If file is open in editor:
   - Update `activeFile.name` in RepositoryProvider
   - Update tab title (if multi-tab system exists)
3. Update recent files list (if exists)
4. Emit `FILE_RENAMED` event to ContextBus

**When file is deleted:**
1. Remove from file tree
2. If file is open in editor:
   - Close file and clear editor content
   - Show toast: "File deleted - editor closed"
3. Remove from recent files list
4. Emit `FILE_DELETED` event to ContextBus

---

## 5. Error Handling

### 5.1 Validation Errors

**Client-Side Validation:**
- Empty name: "Name cannot be empty"
- Invalid characters: "Name contains invalid characters: `/`, `\`, `*`, etc."
- Name too long: "Name must be less than 255 characters"
- Duplicate name: "A file/folder with this name already exists"

**UI Feedback:**
- Real-time validation in CreateFileModal
- Red border + error message below input
- Disable submit button until valid

### 5.2 API Errors

**Error Types:**
1. **AuthError (401):** "Session expired - please refresh the page"
2. **NotFoundError (404):** "File not found - it may have been deleted"
3. **RateLimitError (429):** "Too many requests - please try again in a moment"
4. **ConflictError (409):** "A file with this name already exists"
5. **NetworkError:** "Network error - check your connection"
6. **DriveError (500):** "Google Drive error - please try again"

**Recovery Actions:**
1. Show error toast with retry button
2. Rollback optimistic UI changes
3. Log error to console with context
4. Update sync status to error state

### 5.3 Edge Cases

**Renaming open file:**
- Update editor state without closing file
- Preserve dirty state (unsaved changes)
- Update save target to new name

**Deleting open file:**
- Show confirmation: "This file is currently open. Are you sure you want to delete it?"
- On confirm: Save unsaved changes, then delete, then close editor

**Renaming folder with open files:**
- Track all open files in folder
- Update all file paths after rename
- Maintain editor state for all open files

**Network offline:**
- Disable file operation buttons
- Show "Offline" indicator in sync status
- Queue operations for when connection restored (future enhancement)

---

## 6. Accessibility Requirements

**WCAG 2.1 Level AA Compliance:**

1. **Keyboard Navigation:**
   - Context menu: Tab (next item), Shift+Tab (previous), Enter (select), Escape (close)
   - Create modal: Tab (focus elements), Enter (submit), Escape (cancel)
   - File tree: F2 (rename), Delete (delete file), Space (expand folder)

2. **Screen Reader Support:**
   - ARIA labels on all interactive elements
   - ARIA role="menu" for context menu
   - ARIA role="dialog" for modals
   - Announce loading states: "Creating file...", "Deleting..."
   - Announce errors: "Error: Failed to create file"

3. **Focus Management:**
   - Auto-focus first input in modals
   - Return focus to trigger element on close
   - Focus trap in modals and context menu
   - Visible focus indicators (ring-2 ring-blue-500)

4. **Touch Targets:**
   - Minimum 44×44px for all buttons
   - Adequate spacing between menu items (py-3)

---

## 7. Performance Considerations

**Performance Targets:**
- File creation: <2 seconds (including API call)
- Rename operation: <1 second (including API call)
- Delete operation: <1 second (including API call)
- Context menu open: <100ms
- File tree refresh: <500ms (50 files)

**Optimizations:**
1. **Debounced validation:** 300ms delay for duplicate name checks
2. **Memoized components:** React.memo for FileTreeNode
3. **Virtual scrolling:** If file tree exceeds 100 items (future)
4. **Batch operations:** Queue multiple operations (future)

---

## 8. Testing Strategy

### 8.1 Manual Testing Scenarios

**Create File:**
1. Right-click on folder in file tree
2. Select "New File"
3. Enter name "test-prompt.md"
4. Verify file appears in file tree
5. Verify file exists in Google Drive
6. Verify sync status shows success

**Create Folder:**
1. Right-click on parent folder
2. Select "New Folder"
3. Enter name "test-folder"
4. Verify folder appears in file tree
5. Verify folder is expandable
6. Verify folder exists in Google Drive

**Rename File:**
1. Right-click on file → "Rename"
2. Change name to "renamed-prompt.md"
3. Verify file tree updates
4. Verify Google Drive updates
5. If file is open in tab, verify tab name updates

**Rename File (Inline):**
1. Double-click on file name
2. Edit inline
3. Press Enter
4. Verify same behavior as context menu rename

**Delete File:**
1. Right-click on file → "Delete"
2. Confirm deletion
3. Verify file removed from file tree
4. Verify file in Google Drive Trash (not permanently deleted)
5. If file is open in tab, verify tab closes

**Error Handling:**
1. Disconnect network, try to create file
2. Verify error toast appears with retry button
3. Verify optimistic UI rollback
4. Reconnect network, click retry
5. Verify operation succeeds

### 8.2 Regression Testing

- [ ] Existing file tree loading still works
- [ ] File selection and opening still works
- [ ] Google Drive sync still works
- [ ] Editor auto-save still works
- [ ] Context bus events still propagate
- [ ] Sync status indicators still work

---

## 9. Source Code Changes

### 9.1 New Files

1. `lib/google/drive.ts` - Add methods: `createFolder`, `renameFile`, `deleteFile`
2. `app/api/drive/create/route.ts` - Create file/folder endpoint
3. `app/api/drive/rename/route.ts` - Rename endpoint
4. `app/api/drive/delete/route.ts` - Delete endpoint
5. `components/shared/ContextMenu.tsx` - Reusable context menu
6. `components/shared/CreateFileModal.tsx` - File/folder creation modal
7. `components/shared/DeleteConfirmDialog.tsx` - Delete confirmation
8. `hooks/useFileOperations.ts` - File operations hook
9. `hooks/useContextMenu.ts` - Context menu hook
10. `components/providers/FileTreeProvider.tsx` - File tree state management

### 9.2 Modified Files

1. `lib/google/types.ts` - Add new type definitions
2. `lib/types.ts` - Add FileTreeContext types
3. `components/shared/FileTree.tsx` - Add context menu trigger, inline rename
4. `components/providers/RepositoryProvider.tsx` - Handle file rename/delete
5. `app/layout.tsx` - Add FileTreeProvider
6. `components/layout/Sidebar.tsx` - Integrate file operations

### 9.3 Type Definitions

**New types in `lib/types.ts`:**

```typescript
export interface FileOperationEvent {
  type: 'create' | 'rename' | 'delete';
  nodeId: string;
  nodeName: string;
  timestamp: Date;
}

export interface FileTreeState {
  nodes: FileNode[];
  expandedIds: Set<string>;
  selectedId: string | null;
  operationsInProgress: Set<string>;
}
```

**Extended ContextBusEvent:**

```typescript
export type ContextBusEvent =
  | { type: 'PLAN_UPDATED'; payload: { content: string; timestamp: Date } }
  | { type: 'FILE_SAVED'; payload: { fileId: string; fileName: string } }
  | { type: 'FILE_CREATED'; payload: { fileId: string; fileName: string; type: 'file' | 'folder' } }
  | { type: 'FILE_RENAMED'; payload: { fileId: string; oldName: string; newName: string } }
  | { type: 'FILE_DELETED'; payload: { fileId: string; fileName: string } }
  | { type: 'AGENT_SPAWNED'; payload: { agentId: string; persona: string } }
  | { type: 'SYNC_STATUS_CHANGED'; payload: { status: 'synced' | 'syncing' | 'error' } };
```

---

## 10. Deferred Features

**Out of Scope for v0.2.3:**

1. ❌ Drag-and-drop file moving
2. ❌ Copy/paste files
3. ❌ File upload from local filesystem
4. ❌ Restore from Google Drive Trash
5. ❌ File permissions management
6. ❌ Multi-select operations
7. ❌ Keyboard shortcuts (Ctrl+N for new file)
8. ❌ File templates (e.g., "New Prompt from Template")
9. ❌ Undo toast notification after delete

---

## 11. Verification Approach

### 11.1 Lint & Type Check

```bash
npm run lint
npm run type-check
npm run build
```

**Acceptance Criteria:**
- Zero ESLint errors/warnings
- Zero TypeScript type errors
- Production build succeeds

### 11.2 Visual Validation

**Screenshots Required:**
1. Context menu display (right-click on folder)
2. Create File modal (with validation error)
3. Create Folder modal (success state)
4. Inline rename mode (double-click)
5. Delete confirmation dialog
6. Error toast with retry button
7. File tree with new file/folder created

### 11.3 Performance Testing

**Metrics to Measure:**
1. Context menu open time (<100ms)
2. File creation time (<2s)
3. Rename operation time (<1s)
4. Delete operation time (<1s)
5. File tree refresh time (<500ms)

**Tools:**
- Chrome DevTools Performance tab
- Network tab (API call latency)
- React DevTools Profiler (component re-renders)

---

## 12. Documentation Updates

### 12.1 JOURNAL.md

Document:
1. Google Drive API integration (createFolder, rename, delete methods)
2. Context menu implementation (accessibility, positioning)
3. Optimistic UI strategy (rollback pattern)
4. Error handling approach (validation, API errors, network errors)
5. File tree state management (FileTreeProvider)

### 12.2 BUGS.md

Document any bugs discovered during implementation:
- Context menu positioning issues
- Inline rename edge cases
- Race conditions in optimistic updates
- API rate limiting scenarios

---

## 13. Success Criteria

**Must Have (All required):**
- ✅ Create file/folder works via right-click context menu
- ✅ Rename works via inline editing and context menu
- ✅ Delete moves to Google Drive Trash (not permanent delete)
- ✅ Context menu functional and keyboard accessible
- ✅ Error handling robust with retry option
- ✅ Optimistic UI with rollback on API failure
- ✅ All operations sync to Google Drive
- ✅ File tree refreshes after operations
- ✅ Open tabs update correctly on rename/delete
- ✅ Zero regressions in existing features
- ✅ Lint check passes (`npm run lint`)
- ✅ Type check passes (`npm run build`)
- ✅ Visual validation via localhost screenshots
- ✅ Documentation updated (JOURNAL.md)

**Nice to Have (Optional):**
- Undo toast notification after delete
- Keyboard shortcut for new file (Cmd/Ctrl+N)
- File templates (e.g., "New Prompt from Template")

---

## 14. Risk Assessment

### High Risk

1. **API Rate Limiting:** Google Drive API has quotas (10,000 requests/100 seconds)
   - **Mitigation:** Implement request throttling, show user-friendly error

2. **Concurrent Edits:** User edits file while rename/delete in progress
   - **Mitigation:** Disable file operations while file is dirty (unsaved)

3. **Network Failures:** Loss of connection during operation
   - **Mitigation:** Robust retry logic, clear error messages, rollback

### Medium Risk

1. **Context Menu Positioning:** Menu may clip off screen edges
   - **Mitigation:** Auto-reposition to stay within viewport

2. **Focus Management:** Complex modal/menu interactions
   - **Mitigation:** Thorough keyboard navigation testing

### Low Risk

1. **Performance Degradation:** Large file trees (100+ files)
   - **Mitigation:** Memoization, future virtual scrolling

---

**Author:** AI Assistant (Zencoder)  
**Status:** Technical Specification Complete  
**Next Step:** Implementation Planning
