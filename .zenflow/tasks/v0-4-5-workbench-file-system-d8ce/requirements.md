# Product Requirements Document: Workbench File System

**Feature:** Workbench File System Explorer  
**Author:** Manus AI (Dojo)  
**Date:** January 15, 2026  
**Version:** 1.0  
**Status:** Requirements Definition

---

## 1. Executive Summary

This PRD defines the requirements for implementing a full-featured file system explorer within the 11-11 Workbench. This feature addresses **Gap #2** from the v0.4.2 system audit: "The Empty Workbench" - the inability for users to see, create, or manage files in their projects.

The file system explorer will transform the Workbench from a single-file editor into a true Integrated Development Environment (IDE), enabling users to work on complex, multi-file projects and fulfilling the core 11-11 philosophy of "Planning with Files."

---

## 2. Problem Statement

### Current State
- Users can open and edit files in the Workbench editor
- No visual representation of project file structure
- Cannot create new files or folders from the UI
- Cannot rename, delete, or organize files
- No way to navigate between multiple project files
- File operations require external tools or manual API calls

### User Impact
- **Cannot work on multi-file projects** - Users are limited to single-file workflows
- **No context awareness** - Users cannot see how files relate to each other
- **Friction in file management** - Basic CRUD operations require leaving the Workbench
- **Violates "Planning with Files" philosophy** - The core methodology cannot be practiced

### Business Impact
- The Workbench cannot fulfill its promise as a "Hardworking Workbench"
- Users cannot effectively manage complex projects
- The IDE vision is incomplete
- User adoption and engagement are limited

---

## 3. Product Vision

### Vision Statement
Transform the Workbench into a complete IDE experience by providing a VS Code-style file explorer that enables intuitive, visual file management and navigation within project workspaces.

### Success Criteria
1. Users can visualize their entire project file structure at a glance
2. All basic file operations (create, rename, delete) can be performed within the Workbench
3. File navigation is seamless - clicking a file opens it in a new tab
4. The interface feels familiar to developers (VS Code-like)
5. Users can effectively work on multi-file, complex projects

---

## 4. Target Users

### Primary User Persona
**"The Project Engineer"** - A user working on multi-file projects (PRDs, specs, prompts, logs) who needs to:
- Navigate between related files quickly
- Organize files into logical folder structures
- Create new files and folders as projects evolve
- Maintain a clear mental model of project organization

### Use Cases
1. **Project Navigation** - Browse files across the standard 11-11 folder structure (00_Roadmap, 01_PRDs, 02_Specs, etc.)
2. **File Creation** - Create new markdown files for prompts, PRDs, or documentation
3. **Organization** - Create folders to organize related files
4. **File Management** - Rename files as content evolves, delete obsolete files
5. **Multi-file Editing** - Work on multiple related files simultaneously using tabs

---

## 5. Functional Requirements

### 5.1 File Tree Display

#### FR-1.1: Visual File Tree
**Description:** Display a hierarchical tree view of the project file structure  
**Priority:** P0 (Critical)  
**Acceptance Criteria:**
- File tree displays all files and folders in the current project
- Folders can be expanded/collapsed
- Files show appropriate icons (by type)
- Modified files show a visual indicator
- Tree updates in real-time when files/folders are added, renamed, or deleted
- Tree respects the standard 11-11 folder hierarchy

#### FR-1.2: File Type Icons
**Description:** Display appropriate icons for different file types  
**Priority:** P1 (High)  
**Acceptance Criteria:**
- Markdown files (`.md`) show document icon
- Folders show folder icon (with open/closed states)
- Files show source indicator (Google Drive, GitHub, Local)

#### FR-1.3: File Metadata Display
**Description:** Show relevant file metadata in the tree  
**Priority:** P2 (Medium)  
**Acceptance Criteria:**
- Display file modification timestamps (on hover or in tooltip)
- Show unsaved changes indicator
- Display source badges (Google Drive, GitHub, Local)

### 5.2 File Operations

#### FR-2.1: Create New File
**Description:** Allow users to create new files in any folder  
**Priority:** P0 (Critical)  
**Acceptance Criteria:**
- Right-click on folder → "New File" option appears
- Modal/inline input prompts for file name
- File is created via `/api/drive/create` endpoint
- New file appears in tree immediately (optimistic update)
- New file opens automatically in editor tab
- Error handling if file name conflicts or creation fails

#### FR-2.2: Create New Folder
**Description:** Allow users to create new folders  
**Priority:** P0 (Critical)  
**Acceptance Criteria:**
- Right-click on folder → "New Folder" option appears
- Modal/inline input prompts for folder name
- Folder is created via `/api/drive/create` endpoint
- New folder appears in tree immediately
- Parent folder auto-expands to show new folder
- Error handling if folder name conflicts or creation fails

#### FR-2.3: Rename File/Folder
**Description:** Allow users to rename files and folders  
**Priority:** P0 (Critical)  
**Acceptance Criteria:**
- Right-click on file/folder → "Rename" option appears
- Inline editing or modal input for new name
- Rename operation uses `/api/drive/rename` endpoint
- Tree updates to reflect new name immediately
- If file is open in tab, tab title updates
- Error handling if rename fails

#### FR-2.4: Delete File/Folder
**Description:** Allow users to delete files and folders  
**Priority:** P0 (Critical)  
**Acceptance Criteria:**
- Right-click on file/folder → "Delete" option appears
- Confirmation dialog appears before deletion
- Delete operation uses `/api/drive/delete` endpoint
- Item is removed from tree immediately
- If file is open in tab, tab shows "deleted" state or closes
- Error handling if deletion fails

### 5.3 Navigation & Interaction

#### FR-3.1: File Selection
**Description:** Allow users to select files/folders in the tree  
**Priority:** P0 (Critical)  
**Acceptance Criteria:**
- Left-click on file opens it in editor
- Selected file/folder is visually highlighted
- Only one item can be selected at a time (for MVP)

#### FR-3.2: Open File in Editor
**Description:** Clicking a file opens its content in the editor  
**Priority:** P0 (Critical)  
**Acceptance Criteria:**
- Left-click on file loads its content
- If file is already open in a tab, switch to that tab
- If file is not open, create new tab with file content
- Tab title shows file name
- Tab metadata includes file path and ID
- Loading state displayed while fetching content

#### FR-3.3: Context Menu
**Description:** Right-click opens context menu with relevant actions  
**Priority:** P0 (Critical)  
**Acceptance Criteria:**
- Context menu displays on right-click
- Menu shows: "New File", "New Folder", "Rename", "Delete"
- "New File" and "New Folder" only appear when right-clicking folders
- Menu closes on click-outside or action selection
- Menu is keyboard accessible

#### FR-3.4: Expand/Collapse Folders
**Description:** Users can expand and collapse folders to navigate hierarchy  
**Priority:** P0 (Critical)  
**Acceptance Criteria:**
- Click on folder chevron/icon toggles expansion
- Expanded state persists during session
- Visual indicator (chevron) shows expansion state
- Smooth animation for expand/collapse (optional)

### 5.4 Layout & Integration

#### FR-4.1: Resizable Panel
**Description:** File tree is in a resizable left panel  
**Priority:** P0 (Critical)  
**Acceptance Criteria:**
- File tree occupies left panel of Workbench
- Panel can be resized horizontally via drag handle
- Minimum width prevents tree from being unusable
- Panel width preference persists across sessions
- Uses `react-resizable-panels` library (already installed)

#### FR-4.2: Panel Collapse/Expand
**Description:** Users can collapse the file panel to maximize editor space  
**Priority:** P2 (Medium)  
**Acceptance Criteria:**
- Collapse button/icon hides file panel
- Collapsed state shows thin strip with expand button
- Panel state persists across page refreshes

#### FR-4.3: Integration with Editor Tabs
**Description:** File tree actions integrate seamlessly with tab system  
**Priority:** P0 (Critical)  
**Acceptance Criteria:**
- Opening file from tree creates/switches to correct tab
- Tab shows file name and path
- Closing tab does not affect file in tree
- Workbench store manages file-based tabs
- Tab metadata includes `fileId` and `filePath`

---

## 6. Non-Functional Requirements

### 6.1 Performance
- File tree renders within 500ms on initial load
- Tree operations (expand/collapse) feel instantaneous (<100ms)
- File CRUD operations provide optimistic updates
- Tree handles at least 100 files without performance degradation

### 6.2 Usability
- File tree follows VS Code conventions for familiarity
- Keyboard shortcuts for common operations (optional for MVP)
- Clear visual feedback for all user actions
- Error messages are clear and actionable

### 6.3 Reliability
- Failed operations roll back optimistic updates
- Network errors are handled gracefully with retry options
- Tree state remains consistent with backend

### 6.4 Accessibility
- Tree is keyboard navigable (arrow keys, enter, etc.)
- Screen reader compatible
- Sufficient color contrast for all UI elements

---

## 7. Technical Constraints

### 7.1 Existing Infrastructure
**To Leverage:**
- `FileTreeProvider` context already exists and manages tree state
- `useFileOperations` hook already implements CRUD operations
- `/api/drive/*` endpoints already handle file operations
- `react-resizable-panels` is already installed
- File tree data structure (`FileNode`) is already defined in `lib/types.ts`

### 7.2 Integration Points
- Must integrate with existing `workbench.store.ts` for tab management
- Must use existing `FileTreeProvider` for tree state
- Must call existing Google Drive API routes
- Must work within existing Workbench layout structure

### 7.3 Dependencies
- Cannot use `react-arborist` (not currently installed) - evaluate alternatives or implement custom tree component
- Must use existing UI component patterns and design system
- Must maintain consistency with existing codebase conventions

---

## 8. Out of Scope (Future Enhancements)

The following features are explicitly out of scope for the MVP but may be considered for future iterations:

1. **Multi-select** - Selecting and operating on multiple files at once
2. **Drag and drop** - Moving files/folders via drag and drop
3. **Search/Filter** - Filtering files in the tree by name or type
4. **File preview** - Hovering to preview file content
5. **Git integration** - Showing git status in file tree
6. **Advanced context menu** - Copy, cut, paste, duplicate operations
7. **Keyboard shortcuts** - Full keyboard navigation and shortcuts
8. **Bulk operations** - Delete/move multiple files
9. **Undo/Redo** - Undo file operations

---

## 9. Open Questions & Assumptions

### Open Questions
1. **Tree Component Library:** Should we use a library or build a custom tree component?
   - **Recommendation:** Evaluate using existing components first; build custom if needed
   
2. **File Content Loading:** Should file content be loaded on tree mount or on-demand?
   - **Recommendation:** On-demand (when file is clicked) to optimize performance

3. **Default Expanded State:** Which folders should be expanded by default?
   - **Recommendation:** Expand top-level folders only (00_Roadmap, 01_PRDs, etc.)

4. **Empty State:** What should the tree show when no project is loaded?
   - **Recommendation:** Show message "No project loaded" with link to create/open project

### Assumptions
1. Users primarily work with markdown (`.md`) files
2. File operations are authenticated and authorized via existing session management
3. The standard 11-11 folder structure (00_Roadmap, 01_PRDs, etc.) will be maintained
4. Google Drive is the primary file storage backend (dev mode uses mock data)
5. Users understand basic file system concepts (files, folders, hierarchy)

---

## 10. Success Metrics

### Quantitative Metrics
- **Adoption:** 80%+ of Workbench users interact with file tree within first session
- **Usage:** 50%+ of file operations (create, rename, delete) happen via file tree
- **Performance:** File tree load time < 500ms
- **Reliability:** < 1% error rate on file operations

### Qualitative Metrics
- Users can navigate multi-file projects without confusion
- File management feels "natural" and "intuitive" (user interviews)
- No critical usability issues identified in first 2 weeks post-launch

---

## 11. Dependencies & Risks

### Dependencies
- Existing Google Drive API routes must be functional
- `FileTreeProvider` must be properly configured in app layout
- Session/authentication system must be working
- Workbench tab system must support file-based tabs

### Risks
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Google Drive API rate limits | High | Implement caching, batch operations, optimize queries |
| Tree performance with large projects | Medium | Implement virtualization, lazy loading if needed |
| File operation conflicts (concurrent edits) | Medium | Implement optimistic locking, conflict detection |
| Complex tree component implementation | Medium | Use existing library or leverage simpler custom component |

---

## 12. Implementation Notes

### Recommended Technology Stack
- **Tree Component:** Custom implementation using existing UI primitives OR evaluate lightweight alternatives to `react-arborist`
- **Layout:** `react-resizable-panels` (already installed)
- **State Management:** Existing `FileTreeProvider` + `workbench.store` integration
- **API Layer:** Existing `/api/drive/*` endpoints
- **Styling:** Existing Tailwind CSS setup

### Integration with Existing Code
1. **FileTreeProvider** (`components/providers/FileTreeProvider.tsx`) - Already manages tree state and operations
2. **useFileOperations** (`hooks/useFileOperations.ts`) - Already implements CRUD with error handling and optimistic updates
3. **workbench.store** (`lib/stores/workbench.store.ts`) - Needs extension to support file-based tabs with `fileId` and `filePath`
4. **WorkbenchView** (`components/workbench/WorkbenchView.tsx`) - Needs layout update to include file tree panel

### Development Phases
**Phase 1:** Build basic file tree component with expand/collapse  
**Phase 2:** Implement file operations (create, rename, delete)  
**Phase 3:** Integrate with editor tabs and workbench store  
**Phase 4:** Add context menu and polish UI/UX  

---

## 13. Appendix

### A. User Stories

**US-1:** As a user, I want to see all files in my project so I can understand the project structure  
**US-2:** As a user, I want to click on a file to open it in the editor so I can edit it  
**US-3:** As a user, I want to create new files so I can add content to my project  
**US-4:** As a user, I want to create new folders so I can organize my files  
**US-5:** As a user, I want to rename files so I can keep my project organized  
**US-6:** As a user, I want to delete files so I can remove obsolete content  
**US-7:** As a user, I want to resize the file panel so I can optimize my workspace layout  
**US-8:** As a user, I want the file tree to update automatically so I always see the current state  

### B. Wireframe Description

```
┌─────────────────────────────────────────────────────────────┐
│ [Sidebar Nav]  [Tab Bar: File.md | File2.md | +]      [RHS] │
│                                                               │
│ ┌───────────┐ ┌─────────────────────────────────┐ ┌───────┐│
│ │           │ │                                 │ │ Agent ││
│ │ 📁 00_... │ │                                 │ │ Panel ││
│ │ 📁 01_PRD │ │                                 │ │       ││
│ │   └ 📄 ... │ │      Editor Content            │ │       ││
│ │ 📁 02_... │ │                                 │ │       ││
│ │ 📁 03_... │ │                                 │ │       ││
│ │ 📁 04_... │ │                                 │ │       ││
│ │ 📁 05_... │ │                                 │ │       ││
│ │           │ │                                 │ │       ││
│ └───────────┘ └─────────────────────────────────┘ └───────┘│
│ [File Tree]    [Editor + Tabs]                   [Activity] │
│                                                               │
│                [Action Bar: Run | Save | Export]             │
└─────────────────────────────────────────────────────────────┘
```

### C. References
- **System Audit:** `02_Specs/11-11-sprint-3-analysis.md`
- **Design Spec:** `02_Specs/11-11-sprint-3-design-spec.md` (empty)
- **Existing File Tree Provider:** `components/providers/FileTreeProvider.tsx`
- **Existing File Operations Hook:** `hooks/useFileOperations.ts`
- **Workbench Store:** `lib/stores/workbench.store.ts`

---

**Document Status:** ✅ Complete  
**Next Step:** Technical Specification
