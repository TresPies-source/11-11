# Technical Specification: Multi-File Tabs

**Feature:** Multi-File Tabs (Workbench Enhancement)  
**Sprint:** Foundation & Growth v0.2.1  
**Date:** January 12, 2026  
**Complexity:** Medium

---

## 1. Technical Context

### 1.1 Current Architecture

**Technologies:**
- **Framework:** Next.js 14 (App Router), React 18.3, TypeScript 5.7
- **Editor:** Monaco Editor (via `@monaco-editor/react` v4.6)
- **State Management:** React Context API (RepositoryProvider)
- **Styling:** Tailwind CSS 3.4
- **Animations:** Framer Motion 11.15
- **Icons:** Lucide React 0.469
- **Storage:** PGlite (local IndexedDB), localStorage (UI state)
- **Layout:** react-resizable-panels 2.1

**Current State Management:**
```typescript
// RepositoryProvider currently manages a single active file
interface RepositoryContextValue {
  activeFile: FileNode | null;         // Single file
  fileContent: string;                  // Content of active file
  isDirty: boolean;                     // Unsaved changes flag
  setActiveFile: (file: FileNode | null) => void;
  setFileContent: (content: string) => void;
  saveFile: () => Promise<void>;
  // ...
}
```

**Current Editor Layout:**
```
┌────────────────────────────────────────┐
│ Header: "filename.md"  [●]             │ ← Single file header
├────────────────────────────────────────┤
│                                        │
│         Monaco Editor                  │
│         (Single file only)             │
│                                        │
└────────────────────────────────────────┘
```

### 1.2 Design Constraints

- **Max Tabs:** 10 tabs open simultaneously (performance constraint)
- **Animations:** ≤300ms transitions (Hardworking aesthetic)
- **Touch Targets:** ≥44×44px for WCAG 2.1 AA compliance
- **Performance:** Tab switching <100ms, no editor re-initialization
- **Browser Support:** Chrome, Firefox, Safari (latest 2 versions)
- **Responsive:** 320px (mobile) → 2560px (desktop)

---

## 2. Implementation Approach

### 2.1 State Management Changes

**Upgrade RepositoryProvider from single-file to multi-tab:**

```typescript
// NEW: Tab data structure
interface EditorTab {
  id: string;                    // Unique tab identifier
  fileNode: FileNode;            // Reference to file
  content: string;               // Current content
  savedContent: string;          // Last saved content
  isDirty: boolean;              // Unsaved changes flag
  lastModified: Date;            // Last edit timestamp
  scrollPosition?: number;       // Preserve scroll position
}

// UPDATED: RepositoryProvider context
interface RepositoryContextValue {
  tabs: EditorTab[];                      // Array of open tabs
  activeTabId: string | null;             // ID of currently active tab
  activeTab: EditorTab | null;            // Computed: tabs.find(t => t.id === activeTabId)
  
  // Tab management
  openTab: (file: FileNode) => Promise<void>;           // Open file in new tab
  closeTab: (tabId: string) => Promise<boolean>;         // Close tab, returns false if canceled
  closeAllTabs: () => Promise<void>;                    // Close all tabs
  closeOtherTabs: (tabId: string) => Promise<void>;     // Close all except specified
  switchTab: (tabId: string) => void;                   // Switch active tab
  
  // Content management (operates on active tab)
  setFileContent: (content: string) => void;
  saveFile: (tabId?: string) => Promise<void>;          // Save specific tab or active
  saveAllFiles: () => Promise<void>;                    // Save all dirty tabs
  
  // Utilities
  getTab: (tabId: string) => EditorTab | undefined;
  hasUnsavedChanges: (tabId: string) => boolean;
  getUnsavedTabsCount: () => number;
}
```

**State Persistence Strategy:**
```typescript
// localStorage schema
interface TabsPersistenceState {
  openTabIds: string[];           // File IDs of open tabs
  activeTabId: string | null;     // Active tab ID
  tabOrder: string[];             // Order of tabs for restoration
}

// Persist on every change
useEffect(() => {
  localStorage.setItem('editor-tabs', JSON.stringify({
    openTabIds: tabs.map(t => t.fileNode.id),
    activeTabId,
    tabOrder: tabs.map(t => t.id),
  }));
}, [tabs, activeTabId]);

// Restore on mount
useEffect(() => {
  const saved = localStorage.getItem('editor-tabs');
  if (saved) {
    const { openTabIds, activeTabId } = JSON.parse(saved);
    // Re-fetch file contents and reconstruct tabs
    // Handle edge cases: file deleted, permissions changed
  }
}, []);
```

### 2.2 Component Architecture

**New Components:**

1. **`TabBar`** (`components/editor/TabBar.tsx`)
   - Container for all tabs
   - Horizontal scroll for overflow
   - Drag-to-reorder (deferred to v0.3+)
   
2. **`Tab`** (`components/editor/Tab.tsx`)
   - Individual tab component
   - Props: `{ tab: EditorTab, isActive: boolean, onClose, onClick }`
   - Unsaved indicator (orange dot)
   - Close button (X icon)
   - Hover states and animations
   
3. **`TabContextMenu`** (`components/editor/TabContextMenu.tsx`)
   - Right-click menu
   - Actions: Close, Close Others, Close All, Copy Path
   
4. **`TabDropdown`** (`components/editor/TabDropdown.tsx`)
   - Mobile-only dropdown selector
   - Shows on screens <768px width
   - Replaces horizontal tab bar

**Modified Components:**

1. **`EditorView`** (`components/editor/EditorView.tsx`)
   ```typescript
   // BEFORE
   export function EditorView() {
     const { activeFile, isDirty } = useRepository();
     return (
       <div>
         <div className="h-12">
           {activeFile?.name} {isDirty && <dot />}
         </div>
         <MarkdownEditor />
       </div>
     );
   }
   
   // AFTER
   export function EditorView() {
     const { tabs, activeTab } = useRepository();
     return (
       <div>
         <TabBar tabs={tabs} activeTabId={activeTab?.id} />
         <MarkdownEditor key={activeTab?.id} />  // Key forces remount on tab switch
       </div>
     );
   }
   ```

2. **`RepositoryProvider`** (`components/providers/RepositoryProvider.tsx`)
   - Replace `activeFile` state with `tabs: EditorTab[]`
   - Add tab management functions
   - Add confirmation dialog for unsaved changes

3. **`FileTree`** (`components/shared/FileTree.tsx`)
   - Update `onSelect` to call `openTab()` instead of `setActiveFile()`
   - Show indicator if file is already open in a tab

### 2.3 Tab Management Logic

**Opening a Tab:**
```typescript
const openTab = useCallback(async (file: FileNode) => {
  // 1. Check if already open
  const existingTab = tabs.find(t => t.fileNode.id === file.id);
  if (existingTab) {
    switchTab(existingTab.id);
    return;
  }
  
  // 2. Check max tabs limit (10)
  if (tabs.length >= 10) {
    toast.error('Maximum 10 tabs open. Please close a tab first.');
    return;
  }
  
  // 3. Fetch file content
  setIsLoading(true);
  const response = await fetch(`/api/drive/content/${file.id}`);
  const { content } = await response.json();
  
  // 4. Create new tab
  const newTab: EditorTab = {
    id: generateId(),
    fileNode: file,
    content,
    savedContent: content,
    isDirty: false,
    lastModified: new Date(),
  };
  
  // 5. Add to tabs array and set as active
  setTabs(prev => [...prev, newTab]);
  setActiveTabId(newTab.id);
}, [tabs]);
```

**Closing a Tab:**
```typescript
const closeTab = useCallback(async (tabId: string): Promise<boolean> => {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return true;
  
  // 1. Check for unsaved changes
  if (tab.isDirty) {
    const confirmed = await showConfirmDialog({
      title: 'Unsaved changes',
      message: `Save changes to ${tab.fileNode.name}?`,
      buttons: ['Save', 'Discard', 'Cancel'],
    });
    
    if (confirmed === 'Save') {
      await saveFile(tabId);
    } else if (confirmed === 'Cancel') {
      return false; // User canceled
    }
  }
  
  // 2. Remove tab
  const newTabs = tabs.filter(t => t.id !== tabId);
  setTabs(newTabs);
  
  // 3. Switch to adjacent tab if closing active tab
  if (activeTabId === tabId) {
    const closedIndex = tabs.findIndex(t => t.id === tabId);
    const nextTab = newTabs[closedIndex] || newTabs[closedIndex - 1] || null;
    setActiveTabId(nextTab?.id || null);
  }
  
  return true;
}, [tabs, activeTabId, saveFile]);
```

**Switching Tabs:**
```typescript
const switchTab = useCallback((tabId: string) => {
  // Instant switch (no async operations)
  setActiveTabId(tabId);
  
  // Preserve scroll position of previous tab
  if (activeTabId) {
    const prevTab = tabs.find(t => t.id === activeTabId);
    if (prevTab && editorRef.current) {
      prevTab.scrollPosition = editorRef.current.getScrollTop();
    }
  }
  
  // Restore scroll position of new tab
  const newTab = tabs.find(t => t.id === tabId);
  if (newTab?.scrollPosition && editorRef.current) {
    editorRef.current.setScrollTop(newTab.scrollPosition);
  }
}, [tabs, activeTabId]);
```

### 2.4 Keyboard Shortcuts

**Implementation using global keyboard event listener:**

```typescript
// In EditorView.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const mod = isMac ? e.metaKey : e.ctrlKey;
    
    if (!mod) return;
    
    switch (e.key) {
      case 'w':
        e.preventDefault();
        if (activeTab) closeTab(activeTab.id);
        break;
      
      case 'Tab':
        e.preventDefault();
        const direction = e.shiftKey ? -1 : 1;
        const currentIndex = tabs.findIndex(t => t.id === activeTabId);
        const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
        switchTab(tabs[nextIndex].id);
        break;
      
      case '1': case '2': case '3': case '4': case '5':
      case '6': case '7': case '8': case '9':
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (tabs[index]) switchTab(tabs[index].id);
        break;
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [tabs, activeTabId, closeTab, switchTab]);
```

**Shortcuts:**
- `Cmd/Ctrl+W` → Close active tab
- `Cmd/Ctrl+Tab` → Next tab
- `Cmd/Ctrl+Shift+Tab` → Previous tab
- `Cmd/Ctrl+1` through `Cmd/Ctrl+9` → Jump to tab 1-9

### 2.5 UI/UX Design

**Desktop Tab Bar (≥768px):**
```
┌──────────────────────────────────────────────────────────┐
│ [file1.md ●] [file2.md] [file3.md ●] ... [+]            │
│   Active       Inactive    Unsaved                       │
└──────────────────────────────────────────────────────────┘
```

**Tab Component Styling:**
```typescript
<div className={cn(
  "flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px]",
  "border-r border-gray-200 cursor-pointer group",
  "hover:bg-gray-50 transition-colors",
  isActive && "bg-white border-b-2 border-b-blue-600",
  !isActive && "bg-gray-100 text-gray-600"
)}>
  <span className="truncate">{tab.fileNode.name}</span>
  {tab.isDirty && (
    <div className="w-2 h-2 rounded-full bg-orange-500" />
  )}
  <button
    onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
  >
    <X className="w-3 h-3" />
  </button>
</div>
```

**Mobile Dropdown (<768px):**
```
┌──────────────────────────────────────┐
│ [▼ file2.md (3 files)]               │
└──────────────────────────────────────┘
     │
     ├─ file1.md ●
     ├─ file2.md (active)
     └─ file3.md ●
```

**Horizontal Scroll for Overflow:**
```typescript
<div className="flex overflow-x-auto scrollbar-thin">
  {tabs.map(tab => <Tab key={tab.id} ... />)}
</div>
```

### 2.6 Responsive Behavior

**Breakpoints:**
- **Mobile (<768px):** Dropdown selector instead of tabs
- **Tablet (768px-1279px):** Horizontal tabs with scroll
- **Desktop (≥1280px):** Full horizontal tabs

**Implementation:**
```typescript
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768);
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);

return isMobile ? <TabDropdown /> : <TabBar />;
```

---

## 3. Source Code Structure Changes

### 3.1 New Files

```
components/
  editor/
    TabBar.tsx              (180 lines) - Tab bar container
    Tab.tsx                 (120 lines) - Individual tab component
    TabContextMenu.tsx      (100 lines) - Right-click context menu
    TabDropdown.tsx         (150 lines) - Mobile dropdown selector
    ConfirmDialog.tsx       (80 lines)  - Unsaved changes dialog

hooks/
  useTabManager.ts          (250 lines) - Tab state management hook
  useKeyboardShortcuts.ts   (100 lines) - Keyboard shortcut handling

lib/
  tabUtils.ts               (80 lines)  - Tab utility functions
```

### 3.2 Modified Files

```
components/
  editor/
    EditorView.tsx          (50 → 120 lines) - Add TabBar integration
    MarkdownEditor.tsx      (48 → 80 lines)  - Add key prop, scroll position handling
  
  providers/
    RepositoryProvider.tsx  (208 → 400 lines) - Multi-tab state management
  
  shared/
    FileTree.tsx            (169 → 190 lines) - Update onSelect to openTab

lib/
  types.ts                  (+30 lines) - Add EditorTab, TabsPersistenceState types
  constants.ts              (+5 lines)  - Add MAX_EDITOR_TABS = 10
```

### 3.3 Data Model Changes

**New Types:**
```typescript
// lib/types.ts

export interface EditorTab {
  id: string;
  fileNode: FileNode;
  content: string;
  savedContent: string;
  isDirty: boolean;
  lastModified: Date;
  scrollPosition?: number;
}

export interface TabsPersistenceState {
  openTabIds: string[];
  activeTabId: string | null;
  tabOrder: string[];
  timestamp: string;
}

export interface TabContextMenuAction {
  label: string;
  icon?: React.ComponentType;
  onClick: () => void;
  disabled?: boolean;
  separator?: boolean;
}
```

**Updated Types:**
```typescript
// RepositoryContextValue gains new methods
export interface RepositoryContextValue {
  // ... existing fields
  tabs: EditorTab[];
  activeTabId: string | null;
  activeTab: EditorTab | null;
  
  openTab: (file: FileNode) => Promise<void>;
  closeTab: (tabId: string) => Promise<boolean>;
  closeAllTabs: () => Promise<void>;
  closeOtherTabs: (tabId: string) => Promise<void>;
  switchTab: (tabId: string) => void;
  saveAllFiles: () => Promise<void>;
  getUnsavedTabsCount: () => number;
}
```

---

## 4. Verification Approach

### 4.1 Manual Testing Checklist

**Basic Functionality:**
- [ ] Open 3-5 files in tabs via FileTree
- [ ] Switch tabs using mouse clicks
- [ ] Switch tabs using Cmd/Ctrl+Tab
- [ ] Close tab with X button
- [ ] Close tab with Cmd/Ctrl+W
- [ ] Edit content in tab → orange dot appears
- [ ] Save content → orange dot disappears
- [ ] Close tab with unsaved changes → confirmation dialog appears

**State Persistence:**
- [ ] Open 3 tabs, reload page → tabs restore correctly
- [ ] Close browser, reopen → tabs persist
- [ ] Active tab is preserved across reload
- [ ] Tab order is preserved

**Edge Cases:**
- [ ] Open 10 tabs → 11th tab shows error toast
- [ ] Close all tabs → editor shows "No file selected" state
- [ ] Open same file twice → switches to existing tab
- [ ] Delete a file that's open → tab shows error state
- [ ] Network error during file load → error handling works

**Responsive Design:**
- [ ] Test on 320px width → dropdown selector appears
- [ ] Test on 768px width → horizontal tabs with scroll
- [ ] Test on 1920px width → full tabs without scroll
- [ ] Resize window → layout adapts smoothly

### 4.2 Regression Testing

- [ ] Single file editing still works
- [ ] File tree selection still works
- [ ] Monaco editor features (syntax highlighting, autocomplete) still work
- [ ] Auto-save functionality still works
- [ ] Context bus integration still works
- [ ] Multi-agent view unaffected

### 4.3 Performance Testing

- [ ] Tab switching <100ms (Chrome DevTools Performance)
- [ ] Opening 10 tabs <5 seconds
- [ ] No memory leaks after opening/closing 50 tabs
- [ ] Smooth 60fps animations

### 4.4 Accessibility Testing

- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Focus indicators visible on all interactive elements
- [ ] ARIA labels on tabs and buttons
- [ ] Screen reader announces tab changes
- [ ] Touch targets ≥44×44px on mobile

### 4.5 Commands to Run

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build (catches TypeScript errors)
npm run build

# Dev server
npm run dev
```

**Visual Validation:**
- Capture screenshots of tab bar states (empty, single, multiple, mobile)
- Save to `05_Logs/screenshots/multi-file-tabs-*.png`

---

## 5. Deferred Features (Out of Scope)

The following features are explicitly **out of scope** for v0.2.1:

- ❌ **Tab Reordering:** Drag-and-drop to reorder tabs (defer to v0.3+)
- ❌ **Tab Pinning:** Pin tabs to prevent accidental closure (defer to v0.3+)
- ❌ **Tab Groups:** Group related tabs (defer to v0.3+)
- ❌ **Tab History:** Recently closed tabs list (defer to v0.3+)
- ❌ **Split View:** Side-by-side editor panes (defer to v0.4+)
- ❌ **Tab Icons:** File type icons in tabs (nice-to-have)
- ❌ **Tab Close Animation:** Smooth fade-out (nice-to-have)

---

## 6. Risk Assessment

### 6.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **State complexity:** Managing multiple tabs may introduce bugs | High | Comprehensive testing, clear state management patterns |
| **Performance:** 10 open tabs with large files | Medium | Lazy load content, virtualize tab bar if needed |
| **Browser storage limits:** localStorage quota exceeded | Low | Limit tabs to 10, compress persistence data |
| **Monaco editor re-initialization:** Lag on tab switch | Medium | Reuse single editor instance, swap models only |

### 6.2 User Experience Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Confusion:** Users lose track of open tabs | Medium | Clear active tab indicator, limit to 10 tabs |
| **Data loss:** Accidental tab closure loses work | High | Confirmation dialog for unsaved changes |
| **Mobile UX:** Tabs cramped on small screens | Medium | Dropdown selector on mobile (<768px) |

---

## 7. Success Criteria

### 7.1 Must Have

- ✅ Tab bar displays above Monaco editor
- ✅ Multiple files can be opened (up to 10 tabs)
- ✅ Active tab visually distinct
- ✅ Unsaved indicators (orange dot) work
- ✅ Tab close confirmation for unsaved changes
- ✅ Keyboard shortcuts functional (Cmd/Ctrl+W, Cmd/Ctrl+Tab, Cmd/Ctrl+1-9)
- ✅ State persists across page reloads
- ✅ Responsive design (mobile dropdown, tablet/desktop tabs)
- ✅ Zero regressions in existing features
- ✅ Lint and type-check pass
- ✅ Visual validation screenshots captured

### 7.2 Nice to Have

- Tab close animation (smooth fade-out)
- Tab hover preview (tooltip with full path)
- Tab file type icons (e.g., markdown icon)

---

## 8. Documentation Requirements

### 8.1 JOURNAL.md Updates

Document the following architectural decisions:

1. **State Management Choice:** Why we upgraded RepositoryProvider to manage tabs array instead of single activeFile
2. **Tab Persistence Strategy:** How localStorage sync works and edge cases handled (file deleted, permissions changed)
3. **Performance Optimizations:** Single Monaco editor instance with model swapping, scroll position preservation
4. **Keyboard Shortcuts:** How shortcuts are registered without conflicts with Monaco's built-in shortcuts
5. **Responsive Strategy:** Why dropdown on mobile vs. tabs on desktop

### 8.2 BUGS.md Updates

Document any bugs discovered during implementation with:
- Priority (P0/P1/P2/P3)
- Description
- Steps to reproduce
- Workaround (if any)

---

**Author:** Zencoder AI  
**Approved By:** (Pending)  
**Implementation Start:** January 12, 2026  
**Target Completion:** January 14, 2026
