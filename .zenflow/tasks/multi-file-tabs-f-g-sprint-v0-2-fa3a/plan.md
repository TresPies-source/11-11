# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification
<!-- chat-id: 04cf8a7d-b7bd-46f6-b111-9a924b6a8005 -->

**Complexity Assessment:** Medium

**Deliverables:**
- ✅ Technical specification saved to `.zenflow/tasks/multi-file-tabs-f-g-sprint-v0-2-fa3a/spec.md`
- ✅ Detailed implementation plan created below

**Key Decisions:**
- Upgrade RepositoryProvider from single-file to multi-tab state management
- Reuse single Monaco editor instance (model swapping for performance)
- localStorage persistence for tab state
- Responsive design: dropdown on mobile (<768px), tabs on desktop
- Max 10 tabs open simultaneously

---

## Implementation Steps

### [x] Step 1: Update Types and Constants
<!-- chat-id: 5e1f078d-b7ef-4e3f-b8a8-f879ac140dde -->

**Objective:** Add type definitions and constants for multi-tab support.

**Files to Modify:**
- `lib/types.ts` - Add EditorTab, TabsPersistenceState interfaces
- `lib/constants.ts` - Add MAX_EDITOR_TABS = 10

**Verification:**
- `npm run type-check` passes

---

### [x] Step 2: Create Tab Utility Functions
<!-- chat-id: 3646192d-2521-4fd8-8f7f-6ac8dd51903d -->

**Objective:** Create helper functions for tab management.

**Files to Create:**
- `lib/tabUtils.ts` - Tab ID generation, validation, persistence helpers

**Implementation:**
- `generateTabId()` - Create unique tab IDs
- `serializeTabState()` - Convert tabs to localStorage format
- `deserializeTabState()` - Parse tabs from localStorage
- `validateTabState()` - Validate persisted state

**Verification:**
- Functions handle edge cases (invalid data, missing files)
- Type-safe implementation

---

### [x] Step 3: Update RepositoryProvider for Multi-Tab State
<!-- chat-id: 486d4363-3714-4927-8ac6-62424e87a890 -->

**Objective:** Upgrade RepositoryProvider from single-file to multi-tab management.

**Files to Modify:**
- `components/providers/RepositoryProvider.tsx`

**Implementation:**
- Replace `activeFile` state with `tabs: EditorTab[]` and `activeTabId`
- Implement `openTab()` - Open file in new tab (max 10 check)
- Implement `closeTab()` - Close tab with unsaved changes confirmation
- Implement `switchTab()` - Change active tab
- Implement `closeAllTabs()` - Close all tabs with confirmations
- Implement `closeOtherTabs()` - Close all except specified
- Implement `saveAllFiles()` - Save all dirty tabs
- Add localStorage persistence (save on every state change)
- Add state restoration on mount

**Verification:**
- Test opening multiple tabs
- Test switching between tabs
- Test closing tabs with/without unsaved changes
- Test max tabs limit (10)
- `npm run type-check` passes

---

### [x] Step 4: Create Tab Component
<!-- chat-id: 1172676e-cb3e-4645-a32c-028ab2b17849 -->

**Objective:** Build individual tab UI component.

**Files to Create:**
- `components/editor/Tab.tsx`

**Implementation:**
- Display file name (truncate if too long)
- Show unsaved indicator (orange dot) if isDirty
- Show close button (X) on hover
- Active state styling (blue border-bottom)
- Inactive state styling (gray background)
- Click handler to switch tab
- Close button handler (stopPropagation)
- Framer Motion animations

**Verification:**
- Tab renders correctly
- Hover states work
- Click and close handlers work
- WCAG 2.1 AA compliant (44px touch target)

---

### [x] Step 5: Create TabBar Component
<!-- chat-id: cc64a28f-ab5d-4b69-8bf2-15e2b1d7a12d -->

**Objective:** Build tab bar container with horizontal scroll.

**Files to Create:**
- `components/editor/TabBar.tsx`

**Implementation:**
- Horizontal flex layout with overflow-x-auto
- Map tabs array to Tab components
- Pass activeTabId, onSwitch, onClose props
- Scrollbar styling (thin scrollbar)
- Handle empty state (no tabs)

**Verification:**
- Multiple tabs render correctly
- Horizontal scroll works when tabs overflow
- Active tab is visually distinct

---

### [x] Step 6: Create TabContextMenu Component
<!-- chat-id: ec05e993-1c0b-4ffd-ba59-55eb39af6192 -->

**Objective:** Build right-click context menu for tab actions.

**Files to Create:**
- `components/editor/TabContextMenu.tsx`

**Implementation:**
- Context menu appears on right-click
- Actions: Close, Close Others, Close All, Copy Path
- Position menu at cursor position
- Close menu on outside click or Escape
- Disable actions based on state (e.g., "Close Others" disabled if only 1 tab)

**Verification:**
- Right-click shows menu
- All actions work correctly
- Menu closes on outside click

---

### [ ] Step 7: Create TabDropdown Component (Mobile)
<!-- chat-id: b15c4261-b07a-45e9-ab96-b6f8b64afbf4 -->

**Objective:** Build dropdown selector for mobile devices.

**Files to Create:**
- `components/editor/TabDropdown.tsx`

**Implementation:**
- Dropdown button shows active tab name + count (e.g., "file.md (3 files)")
- Dropdown menu shows all tabs
- Unsaved indicators visible
- Click to switch tab
- Mobile-optimized touch targets (≥44px)

**Verification:**
- Dropdown renders on mobile (<768px)
- Tab switching works
- Touch targets meet WCAG requirements

---

### [ ] Step 8: Create ConfirmDialog Component

**Objective:** Build reusable confirmation dialog for unsaved changes.

**Files to Create:**
- `components/editor/ConfirmDialog.tsx`

**Implementation:**
- Modal overlay with dialog
- Props: title, message, buttons (Save, Discard, Cancel)
- Return user choice as Promise
- Keyboard support (Enter = Save, Escape = Cancel)
- Framer Motion animations

**Verification:**
- Dialog appears when closing unsaved tab
- All buttons work correctly
- Keyboard shortcuts work
- Dialog closes on selection

---

### [ ] Step 9: Integrate TabBar into EditorView

**Objective:** Replace single-file header with TabBar.

**Files to Modify:**
- `components/editor/EditorView.tsx`

**Implementation:**
- Import TabBar and TabDropdown
- Add responsive logic (show dropdown on mobile, tabs on desktop)
- Replace single-file header with TabBar
- Pass tabs, activeTabId, handlers to TabBar

**Verification:**
- TabBar appears above Monaco editor
- Desktop shows horizontal tabs
- Mobile shows dropdown
- Layout transitions smoothly on resize

---

### [ ] Step 10: Update MarkdownEditor for Tab Switching

**Objective:** Optimize Monaco editor for tab switching.

**Files to Modify:**
- `components/editor/MarkdownEditor.tsx`

**Implementation:**
- Add `key={activeTab?.id}` to force remount on tab switch (or implement model swapping)
- Add scroll position preservation
- Update to use activeTab from context instead of activeFile

**Verification:**
- Tab switching <100ms
- Content loads correctly
- Syntax highlighting preserved
- No memory leaks

---

### [ ] Step 11: Update FileTree Integration

**Objective:** Update FileTree to open tabs instead of setting active file.

**Files to Modify:**
- `components/shared/FileTree.tsx`

**Implementation:**
- Update `onSelect` handler to call `openTab()` instead of `setActiveFile()`
- Add visual indicator if file is already open in a tab
- Handle file already open → switch to existing tab

**Verification:**
- Clicking file in tree opens new tab
- Clicking already-open file switches to that tab
- Max tabs limit enforced (toast error)

---

### [ ] Step 12: Implement Keyboard Shortcuts

**Objective:** Add keyboard shortcuts for tab navigation.

**Files to Create:**
- `hooks/useKeyboardShortcuts.ts`

**Files to Modify:**
- `components/editor/EditorView.tsx` - Use hook

**Implementation:**
- `Cmd/Ctrl+W` → Close active tab
- `Cmd/Ctrl+Tab` → Next tab
- `Cmd/Ctrl+Shift+Tab` → Previous tab
- `Cmd/Ctrl+1-9` → Jump to tab 1-9
- Prevent conflicts with Monaco's built-in shortcuts

**Verification:**
- All shortcuts work correctly
- No conflicts with Monaco editor shortcuts
- Works on both Mac (Cmd) and Windows (Ctrl)

---

### [ ] Step 13: Implement localStorage Persistence

**Objective:** Persist and restore tab state across page reloads.

**Files to Modify:**
- `components/providers/RepositoryProvider.tsx`

**Implementation:**
- Save tabs state on every change
- Restore tabs on mount
- Handle edge cases:
  - File deleted (skip tab)
  - Permissions changed (show error in tab)
  - Network offline (show cached content)
- Add timestamp to detect stale state

**Verification:**
- Open 3 tabs, reload page → tabs restore
- Close browser, reopen → tabs persist
- Active tab preserved
- Tab order preserved

---

### [ ] Step 14: Manual Testing

**Objective:** Execute comprehensive manual test suite.

**Test Scenarios:**
- Basic functionality (open, switch, close tabs)
- Unsaved changes (edit, save, close with confirmation)
- State persistence (reload, browser close/reopen)
- Edge cases (max tabs, file deleted, network error)
- Responsive design (mobile, tablet, desktop)
- Keyboard shortcuts (all combinations)
- Performance (10 tabs, large files)

**Deliverables:**
- Test results documented in implementation notes
- Screenshots captured for visual validation
- Bugs reported in BUGS.md (if any)

---

### [ ] Step 15: Regression Testing

**Objective:** Ensure no existing features broken.

**Test Scenarios:**
- Single file editing still works
- File tree selection still works
- Monaco editor features (syntax, autocomplete) still work
- Auto-save functionality still works
- Context bus integration still works
- Multi-agent view unaffected

**Verification:**
- All existing features work as before
- No console errors or warnings
- No performance degradation

---

### [ ] Step 16: Lint and Type Check

**Objective:** Ensure code quality and type safety.

**Commands:**
```bash
npm run lint
npm run type-check
npm run build
```

**Verification:**
- 0 linting errors/warnings
- 0 TypeScript errors
- Production build succeeds

---

### [ ] Step 17: Documentation

**Objective:** Update project documentation.

**Files to Modify:**
- `JOURNAL.md` - Add architectural decisions section
- `05_Logs/BUGS.md` - Document any bugs found (if any)

**JOURNAL.md Sections:**
1. State Management: Why multi-tab array instead of single activeFile
2. Performance: Single Monaco instance with model swapping
3. Persistence: localStorage strategy and edge cases
4. Keyboard Shortcuts: How registered without Monaco conflicts
5. Responsive Design: Dropdown on mobile vs tabs on desktop

**Verification:**
- Documentation complete and accurate
- Architectural decisions clearly explained

---

### [ ] Step 18: Final Verification and Report

**Objective:** Final validation and create implementation report.

**Tasks:**
1. Run full manual test suite one more time
2. Capture final screenshots (tab states, mobile, desktop)
3. Verify all acceptance criteria met
4. Create implementation report

**Deliverables:**
- Implementation report saved to `.zenflow/tasks/multi-file-tabs-f-g-sprint-v0-2-fa3a/report.md`
- Screenshots in `05_Logs/screenshots/multi-file-tabs-*.png`
- All acceptance criteria checked off
