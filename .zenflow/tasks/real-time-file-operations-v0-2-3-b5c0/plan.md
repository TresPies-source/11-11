# Real-Time File Operations v0.2.3 - Implementation Plan

## Configuration
- **Artifacts Path**: .zenflow/tasks/real-time-file-operations-v0-2-3-b5c0
- **Complexity**: Hard
- **Estimated Duration**: 2-3 days

---

## Workflow Steps

### [x] Step: Technical Specification

✅ **Complete**

Assessed task difficulty as **hard** due to:
- Complex API integration with Google Drive
- Optimistic UI updates with rollback logic
- State management across multiple components
- Accessibility requirements for context menu and modals
- Multiple edge cases and error scenarios

Created comprehensive technical specification at `spec.md` covering:
- Google Drive API extensions (createFolder, rename, delete)
- New API routes for file operations
- UI components (ContextMenu, CreateFileModal, DeleteConfirmDialog)
- State management strategy with optimistic updates
- Error handling and validation
- Accessibility requirements (WCAG 2.1 AA)
- Performance targets and testing strategy

---

### [x] Step 1: Google Drive API Extensions
<!-- chat-id: 98c3eb1e-b938-497b-bc5f-55e3a1a90ff1 -->

**Objective:** Extend DriveClient with folder creation, rename, and delete methods

**Tasks:**
1.1. Add type definitions to `lib/google/types.ts`:
   - `DriveCreateFolderParams`
   - `DriveCreateFolderResponse`
   - `DriveRenameParams`
   - `DriveRenameResponse`
   - `DriveDeleteResponse`

1.2. Implement `createFolder()` method in `lib/google/drive.ts`:
   - Use `files.create` with mimeType `application/vnd.google-apps.folder`
   - Include retry logic (already exists in `withRetry`)
   - Return folder metadata

1.3. Implement `renameFile()` method in `lib/google/drive.ts`:
   - Use `files.update` with `requestBody: { name: newName }`
   - Support both files and folders
   - Return updated metadata

1.4. Implement `deleteFile()` method in `lib/google/drive.ts`:
   - Use `files.update` with `requestBody: { trashed: true }`
   - Soft delete only (move to trash, not permanent)
   - Return success response

**Verification:**
- [x] Type check passes: `npm run type-check`
- [x] All methods have proper error handling
- [x] Methods use existing retry logic

---

### [ ] Step 2: API Routes Implementation

**Objective:** Create server-side API routes for file operations

**Tasks:**
2.1. Create `app/api/drive/create/route.ts`:
   - Handle POST requests for file and folder creation
   - Validate request body (name, type, folderId)
   - Validate name format (no special characters)
   - Call DriveClient.createFile() or createFolder()
   - Return metadata for file tree update
   - Include dev mode mock response

2.2. Create `app/api/drive/rename/route.ts`:
   - Handle PATCH requests for rename
   - Validate new name format
   - Call DriveClient.renameFile()
   - Return updated metadata
   - Include dev mode mock response

2.3. Create `app/api/drive/delete/route.ts`:
   - Handle DELETE requests
   - Call DriveClient.deleteFile()
   - Return success response
   - Include dev mode mock response

2.4. Add validation utilities:
   - Name format validation (no `/`, `\`, `*`, `?`, etc.)
   - Duplicate name checking
   - Name length validation (<255 chars)

**Verification:**
- [ ] All routes handle dev mode correctly
- [ ] All routes have proper error responses (401, 404, 429, 500)
- [ ] All routes validate input
- [ ] Type check passes

---

### [ ] Step 3: Context Menu Component

**Objective:** Create reusable context menu with accessibility

**Tasks:**
3.1. Create `components/shared/ContextMenu.tsx`:
   - Portal rendering for z-index independence
   - Position calculation (avoid screen edges)
   - Keyboard navigation (Tab, Arrow keys, Enter, Escape)
   - Click outside to close
   - Focus trap implementation
   - Framer Motion animations (fade + scale)

3.2. Create `hooks/useContextMenu.ts`:
   - Track open/close state
   - Track menu position (x, y)
   - Track target node
   - `openContextMenu(event, node)` function
   - `closeContextMenu()` function
   - Auto-close on outside click

3.3. Define menu item types in `lib/types.ts`:
   - `ContextMenuItem` interface
   - Support icons, separators, danger styling

**Verification:**
- [ ] Context menu appears at cursor position
- [ ] Menu stays within viewport bounds
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Clicking outside closes menu
- [ ] Accessible with screen reader
- [ ] Visual validation screenshot

---

### [ ] Step 4: File Creation Modal

**Objective:** Create modal for file and folder creation with validation

**Tasks:**
4.1. Create `components/shared/CreateFileModal.tsx`:
   - Controlled input with validation
   - Real-time error display
   - Loading state during creation
   - Auto-focus input on open
   - Submit on Enter key
   - Cancel on Escape key
   - ARIA labels for accessibility

4.2. Implement validation logic:
   - Empty name check
   - Invalid character detection
   - Name length validation
   - Duplicate name checking (client-side)

4.3. Add error messages:
   - "Name cannot be empty"
   - "Name contains invalid characters: ..."
   - "Name must be less than 255 characters"
   - "A file/folder with this name already exists"

**Verification:**
- [ ] Modal appears centered on screen
- [ ] Input auto-focuses on open
- [ ] Real-time validation works
- [ ] Submit disabled when invalid
- [ ] Enter key submits form
- [ ] Escape key closes modal
- [ ] Accessible with screen reader
- [ ] Visual validation screenshot

---

### [ ] Step 5: Delete Confirmation Dialog

**Objective:** Create confirmation dialog for delete operations

**Tasks:**
5.1. Create `components/shared/DeleteConfirmDialog.tsx`:
   - Display file/folder name
   - Danger styling (red accents)
   - Soft delete explanation text
   - Loading state during deletion
   - Keyboard shortcuts (Enter, Escape)
   - ARIA labels for accessibility

5.2. Add warning messages:
   - "Are you sure you want to delete [name]?"
   - "This will move the file to Google Drive Trash. You can restore it from Google Drive."
   - Additional warning if file is open: "This file is currently open."

**Verification:**
- [ ] Dialog shows correct file/folder name
- [ ] Danger styling is clear
- [ ] Enter confirms, Escape cancels
- [ ] Loading state displays during operation
- [ ] Accessible with screen reader
- [ ] Visual validation screenshot

---

### [ ] Step 6: File Tree Provider

**Objective:** Create centralized file tree state management

**Tasks:**
6.1. Create `components/providers/FileTreeProvider.tsx`:
   - File tree state (nodes array)
   - Expanded IDs set
   - Selected ID
   - Operations in progress set
   - Refresh file tree function
   - Optimistic update functions (add, update, remove node)

6.2. Implement helper functions:
   - `findNodeById(tree, id)` - Find node in tree
   - `updateNodeInTree(tree, id, updates)` - Immutable update
   - `addNodeToTree(tree, parentId, node)` - Add child node
   - `removeNodeFromTree(tree, id)` - Remove node

6.3. Integrate with existing components:
   - Add FileTreeProvider to `app/layout.tsx`
   - Update Sidebar to use FileTreeProvider
   - Connect to RepositoryProvider

**Verification:**
- [ ] File tree loads correctly
- [ ] Expand/collapse still works
- [ ] File selection still works
- [ ] No regressions in existing functionality

---

### [ ] Step 7: File Operations Hook

**Objective:** Create hook for file operations with optimistic UI

**Tasks:**
7.1. Create `hooks/useFileOperations.ts`:
   - `createFile(parentNode, name)` function
   - `createFolder(parentNode, name)` function
   - `renameFile(node, newName)` function
   - `deleteFile(node)` function
   - Loading state tracking
   - Error state tracking

7.2. Implement optimistic update pattern:
   - Save previous state before update
   - Update UI immediately
   - Make API call
   - On success: Refresh file tree from server
   - On error: Rollback to previous state, show error

7.3. Integrate with providers:
   - Use FileTreeProvider for state updates
   - Use SyncStatusProvider for operation tracking
   - Use ContextBus for event emission
   - Use RepositoryProvider for open file handling

**Verification:**
- [ ] Optimistic updates appear instant
- [ ] Rollback works on API failure
- [ ] Error messages display correctly
- [ ] Sync status updates correctly

---

### [ ] Step 8: Enhanced File Tree with Context Menu

**Objective:** Add context menu and inline rename to FileTree

**Tasks:**
8.1. Update `components/shared/FileTree.tsx`:
   - Add right-click event handler
   - Integrate ContextMenu component
   - Add double-click for inline rename
   - Add keyboard shortcuts (F2, Delete)
   - Add loading indicators for operations in progress
   - Prevent context menu on root folders

8.2. Define context menu items:
   - For folders: "New File", "New Folder", "Rename", "Delete"
   - For files: "Rename", "Delete"
   - Separator between groups
   - Danger styling for "Delete"

8.3. Add inline rename mode:
   - Double-click triggers rename
   - Input appears in place of name
   - Enter saves, Escape cancels
   - Blur saves changes

8.4. Add loading indicators:
   - Spinner icon for nodes with operations in progress
   - Disable context menu during operation
   - Disable selection during operation

**Verification:**
- [ ] Right-click opens context menu
- [ ] Double-click enables inline rename
- [ ] F2 key triggers rename
- [ ] Delete key triggers delete confirmation
- [ ] Loading indicators appear during operations
- [ ] All operations work correctly
- [ ] Visual validation screenshot

---

### [ ] Step 9: Repository Provider Updates

**Objective:** Handle file rename/delete in RepositoryProvider

**Tasks:**
9.1. Add file operation event handlers:
   - Listen to FILE_RENAMED events from ContextBus
   - Listen to FILE_DELETED events from ContextBus
   - Update activeFile when current file is renamed
   - Close activeFile when current file is deleted

9.2. Update activeFile on rename:
   - Check if activeFile.id matches renamed file
   - Update activeFile.name to newName
   - Preserve content and dirty state
   - Show toast: "File renamed to [newName]"

9.3. Handle file deletion:
   - Check if activeFile.id matches deleted file
   - If dirty (unsaved changes): Show warning before delete
   - On delete: Clear activeFile, clear content
   - Show toast: "File deleted - editor closed"

**Verification:**
- [ ] Renaming open file updates editor
- [ ] Deleting open file closes editor
- [ ] Unsaved changes are preserved on rename
- [ ] Warning shown when deleting file with unsaved changes
- [ ] Toast notifications display correctly

---

### [ ] Step 10: Integration and Testing

**Objective:** Integrate all components and perform comprehensive testing

**Tasks:**
10.1. Integration:
   - Wire up all components in Sidebar
   - Connect FileTree to useFileOperations
   - Add modals to app layout
   - Test dev mode fallbacks

10.2. Manual testing (all scenarios from spec):
   - Create file via context menu
   - Create folder via context menu
   - Rename file via context menu
   - Rename file via inline editing (double-click)
   - Rename file via F2 key
   - Delete file via context menu
   - Delete file via Delete key
   - Delete open file (with unsaved changes)
   - Rename open file
   - Error scenarios (network offline, duplicate name, invalid characters)

10.3. Regression testing:
   - File tree loading
   - File selection and opening
   - Editor auto-save
   - Google Drive sync
   - Context bus events
   - Sync status indicators

10.4. Accessibility testing:
   - Keyboard navigation (Tab, Arrow keys, Enter, Escape)
   - Screen reader announcements
   - Focus management
   - ARIA labels
   - Touch target sizes (44×44px minimum)

**Verification:**
- [ ] All manual test scenarios pass
- [ ] All regression tests pass
- [ ] All accessibility requirements met
- [ ] Screenshots captured for all operations

---

### [ ] Step 11: Error Handling and Edge Cases

**Objective:** Implement robust error handling for all edge cases

**Tasks:**
11.1. Validation error handling:
   - Empty name validation
   - Invalid character validation
   - Duplicate name detection
   - Name length validation
   - Display errors in modals/inline

11.2. API error handling:
   - AuthError (401): "Session expired - please refresh"
   - NotFoundError (404): "File not found"
   - RateLimitError (429): "Too many requests"
   - NetworkError: "Network error - check connection"
   - DriveError (500): "Google Drive error"
   - Show error toast with retry button

11.3. Edge case handling:
   - Rename open file with unsaved changes
   - Delete open file with unsaved changes
   - Concurrent operations on same file
   - Network offline during operation
   - Folder contains open files when renamed/deleted
   - Rapid successive operations

**Verification:**
- [ ] All validation errors display correctly
- [ ] All API errors handled gracefully
- [ ] Retry button works for failed operations
- [ ] Optimistic UI rollback works
- [ ] Edge cases handled without crashes

---

### [ ] Step 12: Performance Optimization

**Objective:** Ensure performance targets are met

**Tasks:**
12.1. Component optimization:
   - Add React.memo to FileTreeNode
   - Use useCallback for event handlers
   - Implement proper dependency arrays
   - Avoid unnecessary re-renders

12.2. Measure performance:
   - Context menu open time (<100ms)
   - File creation time (<2s)
   - Rename operation time (<1s)
   - Delete operation time (<1s)
   - File tree refresh time (<500ms)

12.3. Optimize if needed:
   - Debounce validation (300ms)
   - Throttle API calls
   - Optimize tree update algorithm

**Verification:**
- [ ] All performance targets met
- [ ] Chrome DevTools Performance profiling
- [ ] Network tab shows reasonable API call times
- [ ] React DevTools shows minimal re-renders

---

### [ ] Step 13: Visual Validation and Screenshots

**Objective:** Capture screenshots for documentation

**Tasks:**
13.1. Capture screenshots:
   - Context menu (right-click on folder)
   - Create File modal (with validation error)
   - Create Folder modal (success state)
   - Inline rename mode (double-click)
   - Delete confirmation dialog
   - Error toast with retry button
   - File tree with new file/folder created
   - Loading indicators during operations

13.2. Save screenshots:
   - Location: `05_Logs/screenshots/v0-2-3-file-operations/`
   - Naming: `[feature]-[state].png`
   - Examples: `context-menu-folder.png`, `create-file-error.png`

**Verification:**
- [ ] All screenshots captured
- [ ] Screenshots saved to correct location
- [ ] Screenshots referenced in documentation

---

### [ ] Step 14: Documentation and Cleanup

**Objective:** Update documentation and run final checks

**Tasks:**
14.1. Update JOURNAL.md:
   - Document Google Drive API integration
   - Document context menu implementation
   - Document optimistic UI strategy
   - Document error handling approach
   - Document state management

14.2. Update BUGS.md (if any bugs found):
   - Document any discovered issues
   - Categorize by priority (P0-P3)
   - Note workarounds or resolutions

14.3. Update task_plan.md:
   - Mark v0.2.3 as complete
   - Add completion date
   - Note any deferred features

14.4. Run final checks:
   - `npm run lint` (0 errors, 0 warnings)
   - `npm run type-check` (0 type errors)
   - `npm run build` (production build succeeds)

14.5. Create implementation report:
   - Save to `.zenflow/tasks/real-time-file-operations-v0-2-3-b5c0/report.md`
   - Document what was implemented
   - Document testing results
   - Document challenges and solutions

**Verification:**
- [ ] All documentation updated
- [ ] All checks pass
- [ ] Report created
- [ ] Task marked complete in plan.md

---

## Implementation Summary

**Total Steps:** 14  
**Completed:** 1 (Technical Specification)  
**Remaining:** 13

**Estimated Time per Step:**
- Steps 1-2: 4-6 hours (API extensions and routes)
- Steps 3-5: 6-8 hours (UI components)
- Steps 6-7: 4-6 hours (State management)
- Steps 8-9: 4-6 hours (FileTree integration)
- Steps 10-12: 6-8 hours (Testing and optimization)
- Steps 13-14: 2-3 hours (Documentation)

**Total Estimated Time:** 26-37 hours (2-3 days with full focus)

---

## Critical Success Factors

1. **Optimistic UI Pattern:** Must be implemented correctly to avoid state inconsistencies
2. **Error Handling:** Must be robust with clear user feedback and rollback
3. **Accessibility:** Must meet WCAG 2.1 AA standards for keyboard and screen readers
4. **Testing:** Must test all edge cases and regression scenarios
5. **Documentation:** Must document all architectural decisions

---

**Author:** AI Assistant (Zencoder)  
**Status:** Implementation Plan Complete  
**Date:** January 12, 2026
