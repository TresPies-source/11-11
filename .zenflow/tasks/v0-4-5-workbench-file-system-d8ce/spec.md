# Technical Specification: Workbench File System

**Feature:** Workbench File System Explorer  
**Author:** Manus AI (Dojo)  
**Date:** January 15, 2026  
**Version:** 1.0  
**Status:** Technical Specification

---

## 1. Executive Summary

This document provides the technical specification for implementing a file system explorer panel in the Workbench (`/workbench`). The implementation will leverage existing infrastructure (FileTreeProvider, useFileOperations hook, Google Drive API routes) and integrate with the current workbench tab system to enable multi-file editing workflows.

### Key Technical Goals
1. Integrate existing `FileTree` component into Workbench layout
2. Add resizable panel layout using `react-resizable-panels` (already installed)
3. Connect file tree to workbench tab system for file-based editing
4. Enable file CRUD operations via existing API routes
5. Maintain consistency with existing codebase patterns and conventions

---

## 2. Technical Context

### 2.1 Existing Infrastructure

**Already Implemented and Available:**
- ✅ `FileTreeProvider` - Context provider for file tree state management (`components/providers/FileTreeProvider.tsx`)
- ✅ `useFileOperations` hook - Complete CRUD operations with error handling and optimistic updates (`hooks/useFileOperations.ts`)
- ✅ `FileTree` component - Full-featured tree component with context menus, drag handlers, and rename/delete (`components/shared/FileTree.tsx`)
- ✅ Google Drive API routes:
  - `GET /api/drive/files` - List files
  - `POST /api/drive/create` - Create file/folder
  - `PATCH /api/drive/rename` - Rename file/folder
  - `DELETE /api/drive/delete` - Delete file/folder
  - `GET /api/drive/content/[fileId]` - Get file content
- ✅ `FileNode` type definition in `lib/types.ts`
- ✅ `react-resizable-panels` library installed (`package.json:81`)
- ✅ `workbench.store.ts` - Zustand store for tab management

**Current Workbench Architecture:**
```
WorkbenchView (components/workbench/WorkbenchView.tsx)
├── TabBar (tabs display)
├── Editor (Monaco editor)
└── ActionBar (Run, Save, Export buttons)
└── AgentActivityPanel (right sidebar, 320px fixed)
```

### 2.2 Technology Stack

| Component | Technology | Status |
|-----------|-----------|--------|
| **Frontend Framework** | Next.js 14 (App Router) | ✅ Installed |
| **UI Components** | React 18, TypeScript 5.7 | ✅ Installed |
| **State Management** | Zustand 5.0 | ✅ Installed |
| **Styling** | Tailwind CSS 3.4 | ✅ Installed |
| **Layout** | react-resizable-panels 2.1.7 | ✅ Installed |
| **Editor** | Monaco Editor (via @monaco-editor/react) | ✅ Installed |
| **Icons** | lucide-react | ✅ Installed |
| **Animations** | framer-motion | ✅ Installed |
| **Backend** | Next.js API Routes | ✅ Installed |
| **Storage** | Google Drive API | ✅ Integrated |

### 2.3 File System & Data Model

#### FileNode Interface (from `lib/types.ts`)
```typescript
export interface FileNode {
  id: string;                          // Unique identifier (Google Drive file ID or temp ID)
  name: string;                        // File or folder name
  type: "file" | "folder";             // Node type
  path: string;                        // Full path (e.g., "/03_Prompts/task.md")
  source: "google-drive" | "github" | "local";  // Storage source
  modified?: Date;                     // Last modification timestamp
  isModified?: boolean;                // Unsaved changes indicator
  children?: FileNode[];               // Child nodes (for folders)
  expanded?: boolean;                  // Expansion state (for folders)
}
```

#### Standard 11-11 Folder Structure
```
/
├── journal (file)
├── 00_Roadmap/
├── 01_PRDs/
├── 02_Specs/
├── 03_Prompts/
├── 04_System/
└── 05_Logs/
```

---

## 3. Implementation Approach

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Workbench Page                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   WorkbenchView Component                 │  │
│  │  ┌──────────────┬──────────────────┬─────────────────┐   │  │
│  │  │ FileTreePanel│   EditorPanel    │ AgentActivity   │   │  │
│  │  │ (resizable)  │   (flexible)     │ Panel (fixed)   │   │  │
│  │  │              │                  │                 │   │  │
│  │  │  FileTree    │   TabBar         │  Agent Status   │   │  │
│  │  │  Component   │   Editor         │  & Messages     │   │  │
│  │  │              │   ActionBar      │                 │   │  │
│  │  │              │                  │                 │   │  │
│  │  └──────────────┴──────────────────┴─────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Architecture

#### New Components to Create:
1. **`WorkbenchFileTreePanel`** (`components/workbench/WorkbenchFileTreePanel.tsx`)
   - Wrapper component for FileTree in Workbench context
   - Handles file selection → tab opening logic
   - Manages file tree visibility and state

#### Components to Modify:
1. **`WorkbenchView`** (`components/workbench/WorkbenchView.tsx`)
   - Add resizable panel layout with `react-resizable-panels`
   - Integrate `WorkbenchFileTreePanel` as left panel
   - Update existing editor/tabs/action bar to be in center panel

2. **`workbench.store.ts`** (`lib/stores/workbench.store.ts`)
   - Extend `PromptTab` interface to support file-based tabs
   - Add methods for opening files, checking if file tab exists

### 3.3 Data Flow

```
User clicks file in FileTree
         ↓
WorkbenchFileTreePanel.onSelectFile(node)
         ↓
Check if tab for node.id exists in workbench.store
         ↓
    ┌────┴────┐
    │         │
   Yes       No
    │         │
    │         └→ Fetch file content via GET /api/drive/content/[fileId]
    │            ↓
    │            Create new tab with file content
    │            ↓
    └──────────→ Switch to tab (setActiveTab)
```

---

## 4. Technical Implementation Details

### 4.1 Phase 1: Layout & Integration

#### Step 1.1: Update WorkbenchView with Resizable Panels

**File:** `components/workbench/WorkbenchView.tsx`

**Changes:**
```typescript
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "react-resizable-panels";
import { WorkbenchFileTreePanel } from "./WorkbenchFileTreePanel";

export function WorkbenchView() {
  // ... existing state and handlers ...

  return (
    <div className="flex h-full bg-bg-primary">
      <ResizablePanelGroup direction="horizontal">
        {/* Left Panel: File Tree */}
        <ResizablePanel 
          defaultSize={20} 
          minSize={15} 
          maxSize={35}
          className="min-w-[200px]"
        >
          <WorkbenchFileTreePanel onOpenFile={handleOpenFile} />
        </ResizablePanel>

        <ResizableHandle className="w-1 bg-border-primary hover:bg-blue-500 transition-colors" />

        {/* Center Panel: Editor */}
        <ResizablePanel defaultSize={60}>
          <div className="flex flex-col h-full">
            <TabBar />
            <div className="flex-1 overflow-hidden">
              <Editor />
            </div>
            <ActionBar 
              onRun={handleRun} 
              onSave={handleSave} 
              onExport={handleExport} 
              isRunning={supervisor.isLoading} 
            />
          </div>
        </ResizablePanel>

        {/* Right Panel: Agent Activity (fixed) */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <AgentActivityPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
```

**Key Points:**
- Use `ResizablePanelGroup` with `direction="horizontal"` for 3-column layout
- File tree: 20% default, 15-35% range, min-width 200px
- Editor: 60% default (flexible)
- Agent panel: 20% default, 15-30% range
- `ResizableHandle` for drag-to-resize with hover feedback

#### Step 1.2: Create WorkbenchFileTreePanel Component

**File:** `components/workbench/WorkbenchFileTreePanel.tsx` (NEW)

```typescript
"use client";

import { useContext, useCallback } from "react";
import { FileTreeContext } from "@/components/providers/FileTreeProvider";
import { FileTree } from "@/components/shared/FileTree";
import { FileNode } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface WorkbenchFileTreePanelProps {
  onOpenFile: (fileNode: FileNode) => void;
}

export function WorkbenchFileTreePanel({ onOpenFile }: WorkbenchFileTreePanelProps) {
  const context = useContext(FileTreeContext);

  if (!context) {
    throw new Error("WorkbenchFileTreePanel must be used within FileTreeProvider");
  }

  const {
    fileTree,
    expandedIds,
    selectedId,
    isLoading,
    error,
    setSelectedId,
    toggleExpand,
    operationsInProgress,
  } = context;

  const handleSelect = useCallback((node: FileNode) => {
    if (node.type === "file") {
      setSelectedId(node.id);
      onOpenFile(node);
    }
  }, [onOpenFile, setSelectedId]);

  if (isLoading && fileTree.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bg-secondary border-r border-border-primary">
      <div className="px-3 py-2 border-b border-border-primary">
        <h2 className="text-sm font-semibold text-text-primary">Files</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <FileTree
          nodes={fileTree}
          selectedId={selectedId}
          onSelect={handleSelect}
          expandedIds={expandedIds}
          onToggleExpand={toggleExpand}
          operationsInProgress={operationsInProgress}
        />
      </div>
    </div>
  );
}
```

**Key Points:**
- Receives `onOpenFile` callback from parent (WorkbenchView)
- Uses existing `FileTreeContext` for state
- Leverages existing `FileTree` component (no modifications needed)
- Handles loading and error states
- Only calls `onOpenFile` for files, not folders

### 4.2 Phase 2: File-Based Tab System

#### Step 2.1: Extend Workbench Store for File-Based Tabs

**File:** `lib/stores/workbench.store.ts`

**Changes:**
```typescript
export interface PromptTab {
  id: string;
  title: string;
  content: string;
  // NEW: File-based tab support
  fileId?: string;           // Google Drive file ID (if file-based tab)
  filePath?: string;         // Full file path (for display)
  isFileBased?: boolean;     // Flag to distinguish file tabs from scratch tabs
}

interface WorkbenchState {
  tabs: PromptTab[];
  activeTabId: string | null;
  isRunning: boolean;
  activeTabError: string | null;
  
  addTab: (tab: PromptTab) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  updateTabTitle: (id: string, title: string) => void;
  setRunning: (isRunning: boolean) => void;
  setActiveTabError: (error: string | null) => void;
  updateTabId: (oldId: string, newId: string) => void;
  
  // NEW: File-based tab methods
  openFileTab: (fileId: string, fileName: string, filePath: string, content: string) => void;
  getTabByFileId: (fileId: string) => PromptTab | undefined;
}

export const useWorkbenchStore = create<WorkbenchState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  isRunning: false,
  activeTabError: null,
  
  // ... existing methods (unchanged) ...
  
  // NEW: Open or switch to file-based tab
  openFileTab: (fileId, fileName, filePath, content) => {
    const existingTab = get().tabs.find(tab => tab.fileId === fileId);
    
    if (existingTab) {
      // File already open - just switch to it
      set({ activeTabId: existingTab.id });
    } else {
      // Create new file-based tab
      const newTab: PromptTab = {
        id: `file-${fileId}`,
        title: fileName,
        content,
        fileId,
        filePath,
        isFileBased: true,
      };
      set(state => ({ 
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      }));
    }
  },
  
  // NEW: Find tab by file ID
  getTabByFileId: (fileId) => {
    return get().tabs.find(tab => tab.fileId === fileId);
  },
}));
```

**Key Points:**
- Extend `PromptTab` to support file metadata (fileId, filePath)
- Add `openFileTab` method that checks for existing tabs before creating new ones
- Add `getTabByFileId` helper for looking up file-based tabs
- Maintain backward compatibility with non-file-based tabs (welcome tab, scratch tabs)

#### Step 2.2: Implement File Opening Logic in WorkbenchView

**File:** `components/workbench/WorkbenchView.tsx`

**Add new handler:**
```typescript
import { useToast } from "@/hooks/useToast";

export function WorkbenchView() {
  const { 
    tabs, 
    addTab, 
    setActiveTab, 
    activeTabId, 
    updateTabId, 
    setActiveTabError,
    openFileTab,  // NEW
  } = useWorkbenchStore();
  const toast = useToast();
  
  // ... existing state and handlers ...
  
  // NEW: Handle file opening from file tree
  const handleOpenFile = useCallback(async (fileNode: FileNode) => {
    try {
      // Show loading state
      toast.info(`Opening ${fileNode.name}...`);
      
      // Fetch file content from API
      const response = await fetch(`/api/drive/content/${fileNode.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`);
      }
      
      const data = await response.json();
      const content = data.content || "";
      
      // Open file tab (will switch to existing tab if already open)
      openFileTab(fileNode.id, fileNode.name, fileNode.path, content);
      
      toast.success(`Opened ${fileNode.name}`);
    } catch (error) {
      console.error("[Workbench] Error opening file:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to open file";
      toast.error(errorMessage);
    }
  }, [openFileTab, toast]);

  return (
    // ... updated JSX with ResizablePanelGroup (see Phase 1) ...
    <WorkbenchFileTreePanel onOpenFile={handleOpenFile} />
  );
}
```

**Key Points:**
- Fetch file content via existing `/api/drive/content/[fileId]` endpoint
- Use `openFileTab` from store (automatically handles duplicate tabs)
- Provide user feedback with toast notifications
- Handle errors gracefully

### 4.3 Phase 3: File Save Integration

#### Step 3.1: Update Save Handler to Support File-Based Tabs

**File:** `components/workbench/WorkbenchView.tsx`

**Modify `handleSave`:**
```typescript
const handleSave = async () => {
  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  if (!activeTab) {
    toast.error("No active file to save");
    return;
  }

  try {
    // NEW: Handle file-based tabs differently
    if (activeTab.isFileBased && activeTab.fileId) {
      console.log("[Save] Saving file-based tab:", activeTab.fileId);
      
      // Save to Google Drive via existing endpoint
      const response = await fetch(`/api/drive/content/${activeTab.fileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: activeTab.content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save file");
      }

      toast.success(`Saved ${activeTab.title}`);
      return;
    }

    // Existing seed-based save logic (unchanged)
    const isNewSeed = !activeTab.id.startsWith("seed-");
    
    if (isNewSeed) {
      // ... existing new seed creation logic ...
    } else {
      // ... existing seed update logic ...
    }
  } catch (error) {
    console.error("[Save] Error:", error);
    toast.error(error instanceof Error ? error.message : "Failed to save");
  }
};
```

**Note:** The `/api/drive/content/[fileId]` PUT endpoint may need to be created if it doesn't exist. Check during implementation.

---

## 5. Source Code Structure Changes

### New Files
```
components/
└── workbench/
    └── WorkbenchFileTreePanel.tsx  (NEW - ~100 lines)
```

### Modified Files
```
components/
└── workbench/
    └── WorkbenchView.tsx           (MODIFIED - add resizable panels, file opening)

lib/
└── stores/
    └── workbench.store.ts          (MODIFIED - extend for file-based tabs)
```

### No Changes Required
```
components/
├── providers/
│   └── FileTreeProvider.tsx        (UNCHANGED - already complete)
└── shared/
    └── FileTree.tsx                (UNCHANGED - already complete)

hooks/
└── useFileOperations.ts            (UNCHANGED - already complete)

app/
└── api/
    └── drive/
        ├── files/route.ts          (UNCHANGED)
        ├── create/route.ts         (UNCHANGED)
        ├── rename/route.ts         (UNCHANGED)
        ├── delete/route.ts         (UNCHANGED)
        └── content/[fileId]/route.ts  (MAY NEED PUT endpoint - verify)
```

---

## 6. API & Interface Changes

### 6.1 API Endpoints

**All existing endpoints remain unchanged:**
- ✅ `GET /api/drive/files` - List files
- ✅ `POST /api/drive/create` - Create file/folder
- ✅ `PATCH /api/drive/rename` - Rename file/folder
- ✅ `DELETE /api/drive/delete` - Delete file/folder
- ✅ `GET /api/drive/content/[fileId]` - Get file content
- ⚠️ `PUT /api/drive/content/[fileId]` - **Verify if exists; may need to implement**

**If PUT endpoint doesn't exist, implement:**
```typescript
// app/api/drive/content/[fileId]/route.ts

export async function PUT(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const body = await request.json();
    const { content } = body;

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Invalid request - 'content' must be a string" },
        { status: 400 }
      );
    }

    if (isDevMode()) {
      console.warn(`[Content API] Dev mode - simulating save for ${params.fileId}`);
      return NextResponse.json({ success: true });
    }

    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const driveClient = await createDriveClient(session.accessToken);
    await driveClient.updateFileContent(params.fileId, content);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Content API] Error updating file:", error);
    return NextResponse.json(
      { error: "Failed to update file content" },
      { status: 500 }
    );
  }
}
```

### 6.2 Type Definitions

**Modified:**
- `PromptTab` interface in `lib/stores/workbench.store.ts` (see Phase 2.1)

**No changes needed:**
- `FileNode` interface (already complete in `lib/types.ts`)
- Other type definitions remain unchanged

---

## 7. Data Model Changes

### 7.1 Workbench Tab State

**Before:**
```typescript
{
  id: "welcome-tab",
  title: "Welcome",
  content: "# Welcome..."
}
```

**After (File-Based Tab):**
```typescript
{
  id: "file-mock_file_1",
  title: "task_plan.md",
  content: "# Task Plan...",
  fileId: "mock_file_1",
  filePath: "/03_Prompts/task_plan.md",
  isFileBased: true
}
```

**After (Scratch Tab - unchanged):**
```typescript
{
  id: "seed-123",
  title: "My Prompt",
  content: "# Custom content...",
  // No fileId/filePath
}
```

### 7.2 File Tree State (No Changes)

File tree state managed by `FileTreeProvider` remains unchanged:
- Tree structure from Google Drive API
- Expansion state (`expandedIds: Set<string>`)
- Selection state (`selectedId: string`)
- Operations in progress tracking

---

## 8. Delivery Phases

### Phase 1: Layout & Integration (P0 - Critical)
**Goal:** Add resizable file tree panel to Workbench

**Tasks:**
1. ✅ Install `react-resizable-panels` (already done)
2. Update `WorkbenchView` with 3-panel resizable layout
3. Create `WorkbenchFileTreePanel` component
4. Integrate existing `FileTree` component
5. Test panel resizing and persistence

**Acceptance Criteria:**
- File tree visible on left side of Workbench
- Panels are resizable via drag handle
- Layout doesn't break on different screen sizes
- File tree shows correct project structure

**Estimated Effort:** 4 hours

---

### Phase 2: File-Based Tabs (P0 - Critical)
**Goal:** Enable opening files from tree into editor tabs

**Tasks:**
1. Extend `workbench.store.ts` for file-based tabs
2. Implement `handleOpenFile` in `WorkbenchView`
3. Fetch file content via `/api/drive/content/[fileId]`
4. Create or switch to file tab
5. Test opening multiple files, switching between tabs

**Acceptance Criteria:**
- Clicking file in tree opens it in new tab
- If file already open, switches to existing tab
- Tab shows correct file name and content
- Multiple files can be open simultaneously

**Estimated Effort:** 4 hours

---

### Phase 3: File Save Integration (P0 - Critical)
**Goal:** Save file changes back to Google Drive

**Tasks:**
1. Verify `PUT /api/drive/content/[fileId]` endpoint exists (or implement)
2. Update `handleSave` to detect file-based tabs
3. Save file content to Google Drive
4. Test save, refresh, verify content persists

**Acceptance Criteria:**
- File-based tabs save to Google Drive
- Content persists after page reload
- Non-file tabs (seeds) continue to work as before

**Estimated Effort:** 3 hours

---

### Phase 4: Polish & Testing (P1 - High)
**Goal:** Ensure robust, polished experience

**Tasks:**
1. Add keyboard shortcuts (Ctrl+S for save)
2. Visual indicators for unsaved files
3. Handle edge cases (deleted files, network errors)
4. Cross-browser testing
5. Performance testing with large file trees

**Acceptance Criteria:**
- Keyboard shortcuts work consistently
- Clear visual feedback for all states
- Graceful error handling
- No performance degradation

**Estimated Effort:** 3 hours

---

**Total Estimated Effort:** 14 hours (~2 working days)

---

## 9. Verification Approach

### 9.1 Manual Testing Checklist

**Layout & Integration:**
- [ ] File tree panel appears on left side
- [ ] Panels can be resized via drag handle
- [ ] Minimum/maximum panel sizes enforced
- [ ] Layout responsive on different screen sizes
- [ ] File tree shows correct folder structure

**File Operations:**
- [ ] Left-click file opens it in new tab
- [ ] Re-clicking open file switches to existing tab
- [ ] Right-click shows context menu
- [ ] "New File" creates file in correct folder
- [ ] "New Folder" creates folder
- [ ] "Rename" updates file name
- [ ] "Delete" removes file (with confirmation)

**File-Based Tabs:**
- [ ] Tab title shows file name
- [ ] Tab content shows file content
- [ ] Multiple files can be open simultaneously
- [ ] Switching tabs preserves content
- [ ] Closing tab doesn't delete file

**File Saving:**
- [ ] Ctrl+S or Save button saves file-based tab
- [ ] Changes persist after page reload
- [ ] Non-file tabs (seeds) still save correctly
- [ ] Error handling for save failures

### 9.2 Automated Testing

**Unit Tests (Optional for MVP):**
- Test `openFileTab` store method
- Test `getTabByFileId` store method
- Test file opening logic with mocked API

**Integration Tests (Optional for MVP):**
- Test full file open → edit → save flow
- Test file tree refresh after CRUD operations

### 9.3 Lint & Type Check

**Commands to Run:**
```bash
npm run lint
npm run type-check
```

**Expected:** No errors or warnings

### 9.4 Performance Metrics

**Target Metrics:**
- File tree initial load: < 500ms
- File open (click → content displayed): < 1000ms
- Panel resize: smooth, no jank
- Tab switching: < 100ms

---

## 10. Risk Assessment & Mitigation

### Risk 1: `react-resizable-panels` Learning Curve
**Impact:** Medium  
**Probability:** Low  
**Mitigation:**
- Library is already installed and well-documented
- Use simple 3-column layout (straightforward use case)
- Refer to official examples if issues arise

### Risk 2: File Content API Endpoint Missing
**Impact:** Medium  
**Probability:** Medium (need to verify PUT endpoint exists)  
**Mitigation:**
- Check existing `/api/drive/content/[fileId]/route.ts` for PUT handler
- If missing, implement using existing patterns (already have POST, PATCH, DELETE examples)
- Dev mode mock ensures frontend can be tested independently

### Risk 3: Tab State Conflicts
**Impact:** Medium  
**Probability:** Low  
**Mitigation:**
- Use `fileId` as unique identifier for file-based tabs
- `openFileTab` checks for existing tabs before creating
- Maintain clear separation between file-based and scratch tabs via `isFileBased` flag

### Risk 4: Google Drive API Rate Limits
**Impact:** High  
**Probability:** Low (for development/testing)  
**Mitigation:**
- FileTreeProvider already handles caching
- Dev mode bypasses API calls
- Production: implement request debouncing and caching strategies

### Risk 5: Layout Breaks on Small Screens
**Impact:** Medium  
**Probability:** Medium  
**Mitigation:**
- Set minimum panel sizes (200px for file tree)
- Test on multiple screen sizes during Phase 4
- Consider collapsible file tree for mobile (future enhancement)

---

## 11. Dependencies & Prerequisites

### Code Dependencies
- ✅ `FileTreeProvider` must be in app layout (verify in `app/layout.tsx`)
- ✅ All Google Drive API routes functional
- ✅ Authentication system working (session management)
- ✅ `react-resizable-panels` installed

### External Dependencies
- ✅ Google Drive API access (dev mode for testing)
- ✅ Browser support for ResizeObserver API (modern browsers)

### Developer Prerequisites
- Familiarity with Zustand state management
- Understanding of Next.js App Router
- Experience with TypeScript and React hooks

---

## 12. Open Questions & Decisions

### Q1: Should file tree state (expanded folders) persist across sessions?
**Decision:** Not for MVP. Use default expansion (top-level folders only).  
**Future Enhancement:** Store expansion state in localStorage or user preferences.

### Q2: How to handle file conflicts (concurrent edits)?
**Decision:** Not for MVP. Implement optimistic locking in future.  
**Current Behavior:** Last save wins (Google Drive default).

### Q3: Should deleted files close their tabs automatically?
**Decision:** Yes, but with user notification.  
**Implementation:** Listen for file deletion events, close corresponding tabs, show toast.

### Q4: Should file tree auto-refresh when files change externally?
**Decision:** Not for MVP. Manual refresh only (via refresh button or page reload).  
**Future Enhancement:** Implement polling or webhooks for real-time sync.

---

## 13. Acceptance Criteria Summary

### Must Have (MVP)
- ✅ Resizable file tree panel on left side of Workbench
- ✅ Click file in tree → opens in new tab
- ✅ Re-click file → switches to existing tab
- ✅ Save button saves file-based tab to Google Drive
- ✅ All file CRUD operations work via context menu
- ✅ Layout doesn't break on resize

### Should Have (Post-MVP)
- Keyboard shortcuts (Ctrl+S, Ctrl+W)
- Visual indicator for unsaved files
- File tree search/filter
- Drag-and-drop file reorganization

### Nice to Have (Future)
- File preview on hover
- Git integration (file status indicators)
- Multi-select for bulk operations
- File history/version control

---

## 14. Migration & Rollback Strategy

### Migration Plan
**No data migration required** - this is a new feature addition.

**Steps:**
1. Deploy code changes
2. Existing users see new file tree panel on next Workbench visit
3. Existing tabs (seeds, welcome) continue to work unchanged

**Backward Compatibility:**
- Non-file-based tabs unaffected
- Existing save logic remains functional
- No breaking changes to API

### Rollback Plan
If critical issues arise, rollback involves:
1. Revert `WorkbenchView.tsx` to single-panel layout
2. Remove `WorkbenchFileTreePanel.tsx`
3. Revert `workbench.store.ts` changes
4. Deploy previous version

**Data Impact:** None (no data stored exclusively in this feature)

---

## 15. Documentation Requirements

### Code Documentation
- JSDoc comments for new public methods in `workbench.store.ts`
- Component prop documentation for `WorkbenchFileTreePanel`
- README update (if applicable)

### User Documentation
- ❌ Not required for MVP (feature is self-explanatory via UI)
- Future: Add to user guide or help section

---

## 16. Conclusion

This technical specification outlines a phased, low-risk implementation of the Workbench File System feature by leveraging existing infrastructure. The approach minimizes new code while delivering maximum value through strategic integration of existing components.

**Key Success Factors:**
1. Reuse existing `FileTree`, `FileTreeProvider`, and `useFileOperations`
2. Extend (not replace) current workbench tab system
3. Maintain backward compatibility with non-file tabs
4. Use installed libraries (`react-resizable-panels`)
5. Follow existing codebase patterns and conventions

**Next Steps:**
1. Review and approve this specification
2. Proceed to Planning phase (break down into detailed implementation tasks)
3. Begin Phase 1 implementation

---

**Document Version:** 1.0  
**Last Updated:** January 15, 2026  
**Status:** Ready for Planning Phase
