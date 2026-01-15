# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: 53812410-b4e4-49b5-9420-125a86187043 -->

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: 0f7146f4-6d9b-4e69-992a-9db7f4950526 -->

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
<!-- chat-id: 0260c173-71ed-4cbc-9cba-c821c8dd17e0 -->

Create a detailed implementation plan based on `{@artifacts_path}/spec.md`.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps
3. Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function) or too broad (entire feature).

If the feature is trivial and doesn't warrant full specification, update this workflow to remove unnecessary steps and explain the reasoning to the user.

Save to `{@artifacts_path}/plan.md`.

---

## Implementation Tasks

### Phase 1: Layout & Integration

### [x] Task 1.1: Create WorkbenchFileTreePanel Component
<!-- chat-id: 3ebd89cb-4893-440a-97dd-a0f002eff3a7 -->
**Goal:** Create wrapper component for FileTree in Workbench context

**Files:**
- Create `components/workbench/WorkbenchFileTreePanel.tsx`

**Implementation:**
- Create functional component with `onOpenFile` callback prop
- Use `FileTreeContext` to access file tree state
- Render `FileTree` component with appropriate props
- Add loading and error state handling
- Style with header "Files" and appropriate layout

**Verification:**
- Component renders without errors
- TypeScript types are correct
- Component follows existing code patterns

**Reference:** spec.md Section 4.1 Step 1.2

---

### [ ] Task 1.2: Update WorkbenchView with Resizable Panel Layout
**Goal:** Add 3-panel resizable layout to Workbench

**Files:**
- Modify `components/workbench/WorkbenchView.tsx`

**Implementation:**
- Import `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle` from `react-resizable-panels`
- Import `WorkbenchFileTreePanel` component
- Replace existing layout with `ResizablePanelGroup` (horizontal direction)
- Add left panel (FileTree) with defaultSize=20%, minSize=15%, maxSize=35%
- Add center panel (Editor/Tabs) with defaultSize=60%
- Keep right panel (AgentActivityPanel) with defaultSize=20%
- Add `ResizableHandle` between panels with hover styling

**Verification:**
- Workbench loads without errors
- Three panels visible: FileTree (left), Editor (center), AgentActivity (right)
- Panels can be resized via drag handles
- File tree shows correct folder structure
- No layout breaks on window resize

**Reference:** spec.md Section 4.1 Step 1.1

---

### Phase 2: File-Based Tab System

### [ ] Task 2.1: Extend Workbench Store for File-Based Tabs
**Goal:** Add support for file-based tabs in workbench store

**Files:**
- Modify `lib/stores/workbench.store.ts`

**Implementation:**
- Extend `PromptTab` interface with optional fields:
  - `fileId?: string` - Google Drive file ID
  - `filePath?: string` - Full file path for display
  - `isFileBased?: boolean` - Flag to distinguish file tabs
- Add `openFileTab(fileId, fileName, filePath, content)` method:
  - Check if tab with fileId already exists
  - If exists, switch to that tab
  - If not, create new tab with id=`file-${fileId}`
  - Set tab as active
- Add `getTabByFileId(fileId)` helper method

**Verification:**
- TypeScript compilation succeeds
- Store methods follow Zustand patterns
- No breaking changes to existing tabs

**Reference:** spec.md Section 4.2 Step 2.1

---

### [ ] Task 2.2: Implement File Opening Logic
**Goal:** Enable opening files from tree into editor tabs

**Files:**
- Modify `components/workbench/WorkbenchView.tsx`

**Implementation:**
- Import `useToast` hook
- Import `FileNode` type
- Create `handleOpenFile` async callback:
  - Show loading toast
  - Fetch file content via `GET /api/drive/content/${fileId}`
  - Handle response errors
  - Call `openFileTab` with file data
  - Show success/error toast
- Pass `handleOpenFile` to `WorkbenchFileTreePanel` as `onOpenFile` prop

**Verification:**
- Clicking file in tree opens it in new tab
- Re-clicking same file switches to existing tab (doesn't duplicate)
- Tab shows correct file name and content
- Toast notifications appear
- Error handling works for failed requests

**Reference:** spec.md Section 4.2 Step 2.2

---

### Phase 3: File Save Integration

### [ ] Task 3.1: Verify/Implement PUT Endpoint for File Content
**Goal:** Ensure endpoint exists for saving file content

**Files:**
- Check/modify `app/api/drive/content/[fileId]/route.ts`

**Implementation:**
- Check if PUT handler exists in the route file
- If missing, implement PUT handler:
  - Parse request body to get `content`
  - Validate content is a string
  - Handle dev mode (return success without actual save)
  - Get auth session
  - Create Drive client
  - Update file content via Drive API
  - Return success response
  - Handle errors appropriately

**Verification:**
- Endpoint responds to PUT requests
- Dev mode returns success
- TypeScript compilation succeeds
- Error responses have proper status codes

**Reference:** spec.md Section 6.1, lines 566-606

---

### [ ] Task 3.2: Update Save Handler for File-Based Tabs
**Goal:** Enable saving file-based tabs back to Google Drive

**Files:**
- Modify `components/workbench/WorkbenchView.tsx`

**Implementation:**
- Update `handleSave` method:
  - Check if active tab is file-based (`activeTab.isFileBased && activeTab.fileId`)
  - If file-based:
    - Call `PUT /api/drive/content/${fileId}` with content
    - Handle response errors
    - Show success/error toast
    - Return early
  - Keep existing seed-based save logic unchanged

**Verification:**
- Saving file-based tab persists content to Google Drive
- Reloading page shows updated content
- Non-file tabs (seeds, welcome) still save correctly
- Error handling works for failed saves
- Toast notifications appear

**Reference:** spec.md Section 4.3 Step 3.1

---

### Phase 4: Polish & Testing

### [ ] Task 4.1: Add Visual Polish and Edge Case Handling
**Goal:** Improve user experience and handle edge cases

**Files:**
- Modify `components/workbench/WorkbenchFileTreePanel.tsx`
- Modify `components/workbench/WorkbenchView.tsx`

**Implementation:**
- Add min-width constraint (200px) to file tree panel
- Improve loading states with appropriate spinners
- Add keyboard shortcut for save (Ctrl+S) if not already present
- Handle edge case: deleted file that's open in tab
- Add appropriate ARIA labels for accessibility
- Ensure consistent styling with design system

**Verification:**
- File tree has minimum width of 200px
- Loading states are smooth and informative
- Keyboard shortcuts work consistently
- Deleted files don't crash the app
- Accessibility tools report no major issues

**Reference:** spec.md Section 8 Phase 4

---

### [ ] Task 4.2: Cross-Browser and Performance Testing
**Goal:** Ensure consistent behavior across browsers and good performance

**Manual Testing:**
- Test in Chrome, Firefox, Edge, Safari
- Test panel resizing on different screen sizes
- Test with large file trees (50+ files)
- Verify file operations (open, save, switch tabs)
- Test error scenarios (network failures, invalid files)

**Performance Checks:**
- File tree initial load < 500ms
- File open (click to content) < 1000ms
- Panel resize is smooth (no jank)
- Tab switching < 100ms

**Verification:**
- No browser-specific bugs
- Performance targets met
- Graceful error handling
- Responsive on different screen sizes

**Reference:** spec.md Section 9.4

---

### [ ] Task 4.3: Run Lint and Type Check
**Goal:** Ensure code quality and type safety

**Commands:**
```bash
npm run lint
npm run type-check
```

**Verification:**
- No linting errors
- No TypeScript errors
- No unused imports or variables
- Code follows project conventions

**Reference:** spec.md Section 9.3

---

## Testing Results

### Lint Results
```
[Will be filled after running lint]
```

### Type Check Results
```
[Will be filled after running type check]
```

### Manual Testing Results
```
[Will be filled during Phase 4]
```
