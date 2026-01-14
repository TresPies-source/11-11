# Technical Specification: v0.4.1 Workbench Redesign

**Task ID:** v0-4-1-workbench-redesign-158f  
**Complexity:** Medium  
**Date:** January 14, 2026  
**Status:** Ready for Implementation

---

## 1. Overview

This specification defines the implementation of the Workbench UI for Dojo Genesis v0.4.1. The Workbench is a prompt engineering environment featuring:
- Multi-tab interface for managing multiple prompts
- Monaco Editor integration for rich text editing
- Action bar for testing, saving, and exporting prompts
- State management using Zustand

This builds upon the foundational UI components established in Wave 1 and follows the design specifications from `V0.4.0_MOCKUPS_REFINED.md` (Mockup 3: Workbench).

---

## 2. Technical Context

### 2.1. Technology Stack
- **Framework:** Next.js 14.2.24 (App Router)
- **Language:** TypeScript 5.7.2
- **Styling:** Tailwind CSS 3.4.17
- **State Management:** Zustand (to be installed)
- **Editor:** @monaco-editor/react 4.6.0 (already installed)
- **Animation:** Framer Motion 11.15.0 (already installed)
- **UI Icons:** lucide-react 0.469.0

### 2.2. Existing Infrastructure
- **Design System:** Fully implemented in `tailwind.config.ts` with Dojo Genesis brand colors
- **Button Component:** Already exists at `components/ui/Button.tsx` with `primary` and `secondary` variants
- **Utility Functions:** `cn()` utility available at `lib/utils.ts` for className merging
- **Base Page:** Placeholder page exists at `app/workbench/page.tsx`

### 2.3. Design Constraints
- Must match Mockup 3 from `00_Roadmap/V0.4.0_MOCKUPS_REFINED.md`
- Colors must strictly use the Dojo Genesis palette:
  - Background: `bg-primary` (#0a1e2e), `bg-secondary` (#0f2838), `bg-tertiary` (#1a3a4f)
  - Text: `text-primary` (#ffffff), `text-secondary` (#c5d1dd), `text-tertiary` (#8a9dad)
  - Accent: `text-accent` (#f5a623) - amber color for active states
- Font: JetBrains Mono for editor content
- Animation timing: Use Tailwind's custom durations (`instant`, `fast`, `normal`)

---

## 3. Implementation Approach

### 3.1. State Management Architecture

**Rationale for Zustand:**
- Lightweight (3KB) compared to Redux or Context API boilerplate
- No provider wrapping needed - can be imported anywhere
- Built-in TypeScript support
- Simple API that's easy to test and maintain

**Store Structure:**
```typescript
interface PromptTab {
  id: string;           // Unique identifier (UUID)
  title: string;        // Tab display name
  content: string;      // Markdown/text content for Monaco Editor
}

interface WorkbenchState {
  tabs: PromptTab[];                              // Array of open tabs
  activeTabId: string | null;                      // ID of currently active tab
  addTab: (tab: PromptTab) => void;               // Add a new tab
  removeTab: (id: string) => void;                // Close a tab
  setActiveTab: (id: string) => void;             // Switch to a tab
  updateTabContent: (id: string, content: string) => void; // Update tab content
  updateTabTitle: (id: string, title: string) => void;     // Update tab title
}
```

**Smart Tab Removal Logic:**
When a tab is removed:
1. If it's not the active tab → no active tab change
2. If it's the active tab AND there are other tabs:
   - Select the tab to the right if available
   - Otherwise select the tab to the left
3. If it's the last tab → set activeTabId to null

### 3.2. Component Architecture

```
app/workbench/page.tsx
├── components/workbench/TabBar.tsx
│   └── components/workbench/Tab.tsx
├── components/workbench/Editor.tsx
└── components/workbench/ActionBar.tsx
```

**Component Responsibilities:**

1. **WorkbenchPage** (`app/workbench/page.tsx`)
   - Main container and layout
   - Initialize store with default welcome tab on mount
   - Orchestrate child components

2. **TabBar** (`components/workbench/TabBar.tsx`)
   - Render list of tabs
   - Render [+] button to add new tabs
   - Container layout with horizontal scrolling for many tabs

3. **Tab** (`components/workbench/Tab.tsx`)
   - Display individual tab (title + close button)
   - Handle click events for activation and closure
   - Visual states: active (amber border), inactive, hover

4. **Editor** (`components/workbench/Editor.tsx`)
   - Wrap Monaco Editor component
   - Sync with active tab content
   - Handle content changes
   - Configure custom theme

5. **ActionBar** (`components/workbench/ActionBar.tsx`)
   - Render action buttons (Test, Save, Export)
   - Button event handlers (console.log for now)

### 3.3. Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ TabBar (bg-secondary)                                   │
│ [Tab 1*] [Tab 2] [+]                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Monaco Editor (bg-primary)                              │
│ - Full height (flex-1)                                  │
│ - Custom theme: "dojo-genesis"                          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ ActionBar (bg-secondary)                                │
│ [Test with Dojo] [Save] [Export]                        │
└─────────────────────────────────────────────────────────┘

* Active tab has amber bottom border (border-b-2 border-text-accent)
```

### 3.4. Monaco Editor Integration

**Theme Configuration:**
Create a custom Monaco theme named `"dojo-genesis"` matching the brand:

```typescript
const monacoTheme = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#0a1e2e',           // bg-primary
    'editor.foreground': '#ffffff',           // text-primary
    'editorLineNumber.foreground': '#6b7f91', // text-muted
    'editorCursor.foreground': '#f5a623',     // text-accent
    'editor.selectionBackground': '#1a3a4f',  // bg-tertiary
    'editor.lineHighlightBackground': '#0f2838', // bg-secondary
  }
};
```

**Editor Options:**
- Language: `markdown` (default, can be changed later)
- Line numbers: enabled
- Word wrap: enabled
- Font family: `'JetBrains Mono', monospace`
- Font size: `15px`
- Tab size: `2`

---

## 4. Source Code Structure Changes

### 4.1. New Dependencies
```json
{
  "dependencies": {
    "zustand": "^4.5.0"  // Latest stable version
  }
}
```

### 4.2. New Files to Create

1. **`lib/stores/workbench.store.ts`**
   - Zustand store for workbench state
   - Tab management logic
   - ~80 lines

2. **`components/workbench/TabBar.tsx`**
   - Tab bar container component
   - Renders tabs and add button
   - ~60 lines

3. **`components/workbench/Tab.tsx`**
   - Individual tab component
   - Active/inactive states
   - Close button
   - ~50 lines

4. **`components/workbench/Editor.tsx`**
   - Monaco Editor wrapper
   - Theme configuration
   - Content sync with store
   - ~100 lines

5. **`components/workbench/ActionBar.tsx`**
   - Action buttons container
   - Button event handlers
   - ~40 lines

### 4.3. Files to Modify

1. **`app/workbench/page.tsx`**
   - Replace placeholder with full workbench layout
   - Initialize store on mount
   - Compose all workbench components
   - ~80 lines (after modification)

---

## 5. Data Model & Interfaces

### 5.1. Type Definitions

```typescript
// lib/stores/workbench.store.ts
export interface PromptTab {
  id: string;
  title: string;
  content: string;
}

interface WorkbenchState {
  tabs: PromptTab[];
  activeTabId: string | null;
  addTab: (tab: PromptTab) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  updateTabTitle: (id: string, title: string) => void;
}
```

### 5.2. Initial State

```typescript
const initialTab: PromptTab = {
  id: crypto.randomUUID(),
  title: "Welcome to Workbench",
  content: "# Welcome to the Workbench\n\nStart crafting your prompts here..."
};
```

---

## 6. Implementation Details

### 6.1. Tab Management

**Adding a Tab:**
```typescript
addTab: (tab) => set((state) => ({
  tabs: [...state.tabs, tab],
  activeTabId: tab.id  // Auto-activate new tab
}))
```

**Removing a Tab:**
```typescript
removeTab: (id) => set((state) => {
  const newTabs = state.tabs.filter(tab => tab.id !== id);
  let newActiveId = state.activeTabId;
  
  // If we're removing the active tab
  if (state.activeTabId === id && newTabs.length > 0) {
    const currentIndex = state.tabs.findIndex(tab => tab.id === id);
    // Try next tab, otherwise previous tab
    newActiveId = newTabs[currentIndex]?.id || newTabs[currentIndex - 1]?.id;
  } else if (newTabs.length === 0) {
    newActiveId = null;
  }
  
  return { tabs: newTabs, activeTabId: newActiveId };
})
```

**Adding New Untitled Tab:**
```typescript
const handleAddTab = () => {
  const newTab: PromptTab = {
    id: crypto.randomUUID(),
    title: `Untitled ${tabs.length + 1}`,
    content: ''
  };
  addTab(newTab);
};
```

### 6.2. Monaco Editor Integration

**Component Structure:**
```typescript
'use client';

import Editor from '@monaco-editor/react';
import { useWorkbenchStore } from '@/lib/stores/workbench.store';

export function WorkbenchEditor() {
  const { tabs, activeTabId, updateTabContent } = useWorkbenchStore();
  const activeTab = tabs.find(tab => tab.id === activeTabId);
  
  const handleEditorChange = (value: string | undefined) => {
    if (activeTabId && value !== undefined) {
      updateTabContent(activeTabId, value);
    }
  };
  
  const handleEditorMount = (editor: any, monaco: any) => {
    monaco.editor.defineTheme('dojo-genesis', {
      // theme definition
    });
    monaco.editor.setTheme('dojo-genesis');
  };
  
  if (!activeTab) {
    return <EmptyState />;
  }
  
  return (
    <Editor
      value={activeTab.content}
      onChange={handleEditorChange}
      onMount={handleEditorMount}
      language="markdown"
      options={{...}}
    />
  );
}
```

### 6.3. Styling Details

**Tab Bar:**
- Background: `bg-secondary`
- Height: `48px`
- Border bottom: `1px solid bg-tertiary`
- Horizontal layout with gap: `gap-1`
- Padding: `px-4`

**Tab (Inactive):**
- Background: `transparent`
- Text: `text-secondary`
- Padding: `px-4 py-2`
- Hover: `text-primary`, `bg-tertiary`
- Border radius: `rounded-t-lg`

**Tab (Active):**
- Background: `bg-primary`
- Text: `text-primary`
- Border bottom: `border-b-2 border-text-accent`
- No hover effect (already active)

**Close Button:**
- Size: `16px`
- Color: `text-tertiary`
- Hover: `text-primary`, `scale(1.1)`
- Icon: `X` from lucide-react

**Add Tab Button [+]:**
- Size: `32px × 32px`
- Background: `transparent`
- Text: `text-accent`
- Hover: `bg-tertiary`, `scale(1.1)`
- Border: `1px solid bg-tertiary`
- Border radius: `rounded`

**Action Bar:**
- Background: `bg-secondary`
- Height: `64px`
- Padding: `px-6 py-3`
- Border top: `1px solid bg-tertiary`
- Layout: Horizontal flex with `gap-4`
- Justify: `flex-start`

**Action Buttons:**
- Use existing `Button` component from `components/ui/Button.tsx`
- "Test with Dojo": `variant="primary"`
- "Save": `variant="secondary"`
- "Export": `variant="secondary"`

---

## 7. Verification Approach

### 7.1. Manual Testing Checklist

**Tab Management:**
- [ ] Default welcome tab is created on first load
- [ ] Clicking [+] button creates a new untitled tab
- [ ] New tab is automatically selected/activated
- [ ] Clicking a tab makes it active (amber border appears)
- [ ] Clicking X closes the tab
- [ ] Closing active tab selects the next appropriate tab
- [ ] Closing the last tab shows empty state (or keeps at least one tab)

**Editor Functionality:**
- [ ] Editor displays content of active tab
- [ ] Typing in editor updates the store content
- [ ] Switching tabs preserves content for each tab
- [ ] Editor theme matches Dojo Genesis colors
- [ ] Line numbers are visible
- [ ] Cursor is amber color

**Visual Design:**
- [ ] Tab bar matches mockup (bg-secondary, proper spacing)
- [ ] Active tab has amber bottom border
- [ ] Inactive tabs show hover state
- [ ] Editor fills available space (flex-1)
- [ ] Action bar is fixed at bottom
- [ ] All spacing matches mockup specifications

**Action Bar:**
- [ ] Three buttons are rendered
- [ ] Clicking buttons logs to console
- [ ] Button variants match specification

### 7.2. Build & Lint Commands

```bash
# Install dependencies
npm install

# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build

# Development server
npm run dev
```

### 7.3. Edge Cases to Test

1. **Many tabs:** Create 10+ tabs to test horizontal scrolling
2. **Long tab names:** Test with very long titles
3. **Empty content:** Switch between tabs with and without content
4. **Rapid tab switching:** Click tabs quickly to test state sync
5. **Close all tabs:** Verify graceful handling of empty state

### 7.4. Acceptance Criteria

- ✅ Zustand is installed and workbench store is created
- ✅ Workbench page displays tab bar, editor, and action bar
- ✅ Users can open multiple tabs, switch between them, and close them
- ✅ Monaco Editor displays the content of the active tab
- ✅ Text typed in editor is saved to the store in real-time
- ✅ Action bar has three buttons with correct variants
- ✅ Layout and styling match Mockup 3 pixel-perfectly
- ✅ No TypeScript errors (`npm run type-check` passes)
- ✅ No linting errors (`npm run lint` passes)
- ✅ Build succeeds (`npm run build` passes)

---

## 8. Future Enhancements (Out of Scope)

These are NOT part of this task but should be considered in future iterations:

1. **Persistence:** Save tabs to localStorage or database
2. **Drag-to-reorder:** Allow users to reorder tabs
3. **Tab context menu:** Right-click options (rename, duplicate, etc.)
4. **Keyboard shortcuts:** Ctrl+T for new tab, Ctrl+W to close, etc.
5. **Split view:** Side-by-side editor for comparing prompts
6. **Syntax highlighting:** Different languages beyond markdown
7. **AI-powered features:** Auto-complete, suggestions from Librarian
8. **Export functionality:** Actually implement export to various formats
9. **Test integration:** Connect "Test with Dojo" button to agent system
10. **Save to Seeds:** Integrate "Save" button with Seeds system

---

## 9. Risk Assessment

### Low Risks
- **Zustand integration:** Well-documented library, low complexity
- **Monaco Editor:** Already installed, just needs configuration
- **UI Components:** Design system already established

### Medium Risks
- **State synchronization:** Need to ensure editor content stays in sync with store
  - **Mitigation:** Use controlled component pattern, test edge cases
- **Tab removal logic:** Complex conditional logic for selecting new active tab
  - **Mitigation:** Write clear algorithm, test thoroughly with unit tests if needed

### No High Risks Identified

---

## 10. Development Estimate

**Total Effort:** 4-6 hours for an experienced developer

**Breakdown:**
1. Install Zustand and create store: 30 minutes
2. Create Tab and TabBar components: 1 hour
3. Integrate Monaco Editor: 1.5 hours (theme configuration + testing)
4. Create ActionBar component: 30 minutes
5. Modify workbench page: 30 minutes
6. Testing and refinement: 1-2 hours
7. Documentation and verification: 30 minutes

---

## 11. Implementation Notes

### Order of Implementation

1. **Foundation First:**
   - Install Zustand
   - Create workbench store with full state management
   - Test store in isolation (console.log tests)

2. **UI Components (Bottom-Up):**
   - Create Tab component (simple, reusable)
   - Create TabBar component (uses Tab)
   - Create ActionBar component (uses existing Button)
   - Create Editor component (Monaco wrapper)

3. **Integration:**
   - Modify workbench page to compose all components
   - Add initialization logic for default tab
   - Wire up all event handlers

4. **Refinement:**
   - Apply final styling adjustments
   - Test all user interactions
   - Verify against mockup

### Code Quality Standards

- Use TypeScript strict mode (already configured)
- Add JSDoc comments for complex functions
- Use meaningful variable names
- Keep components under 150 lines when possible
- Use `'use client'` directive for client components
- Follow existing code conventions in the project
- Use the `cn()` utility for conditional classNames

---

## 12. Success Metrics

This implementation will be considered successful when:

1. All acceptance criteria are met ✅
2. Visual design matches Mockup 3 exactly
3. All TypeScript errors are resolved
4. Build and lint checks pass
5. Manual testing checklist is 100% complete
6. Code follows project conventions and is maintainable

---

**End of Specification**
