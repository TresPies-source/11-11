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
<!-- chat-id: 76e9d506-6667-4fb2-a8b0-c5274f8074e0 -->

**Complexity Assessment:** Medium

Technical specification created at `.zenflow/tasks/v0-4-1-workbench-redesign-158f/spec.md`

**Key Findings:**
- Monaco Editor already installed (@monaco-editor/react v4.6.0)
- Zustand needs to be installed for state management
- Existing Button component can be reused
- Design system colors already configured in Tailwind
- 5 new components + 1 store file to create
- 1 existing file to modify

---

### [x] Step: Install Dependencies and Create Store
<!-- chat-id: a199bdd9-33eb-46aa-8ba7-6970f881c277 -->

**Objective:** Set up Zustand and create the workbench state management store.

**Tasks:**
1. Install Zustand via npm
2. Create `lib/stores/workbench.store.ts`
   - Define `PromptTab` interface
   - Define `WorkbenchState` interface
   - Implement state actions: addTab, removeTab, setActiveTab, updateTabContent, updateTabTitle
   - Implement smart tab removal logic (select next/previous tab when active tab closes)
3. Test store logic in browser console

**Verification:**
- [ ] Zustand installed in package.json
- [ ] Store file created with all required interfaces
- [ ] Store can be imported without errors
- [ ] TypeScript types are correct

---

### [x] Step: Create Tab Components
<!-- chat-id: f8a759ac-2917-4166-b124-a1b4e53a5915 -->

**Objective:** Build the Tab and TabBar components for managing multiple prompts.

**Tasks:**
1. Create `components/workbench/Tab.tsx`
   - Props: tab (PromptTab), isActive (boolean), onActivate, onClose
   - Styling: inactive/active/hover states, amber border for active
   - Close button with X icon from lucide-react
2. Create `components/workbench/TabBar.tsx`
   - Render all tabs from store
   - Render [+] button to add new tabs
   - Handle tab activation and removal
   - Horizontal scrolling for many tabs

**Verification:**
- [ ] Tab component renders correctly
- [ ] Active tab shows amber bottom border
- [ ] Close button works
- [ ] TabBar renders list of tabs
- [ ] [+] button creates new untitled tabs
- [ ] No TypeScript errors

---

### [x] Step: Create Monaco Editor Component
<!-- chat-id: bae2a2c8-d061-4aff-aa6b-5517238d6fa5 -->

**Objective:** Integrate Monaco Editor with custom Dojo Genesis theme.

**Tasks:**
1. Create `components/workbench/Editor.tsx`
   - Import Editor from @monaco-editor/react
   - Connect to workbench store (get active tab)
   - Handle onChange to update store
   - Implement onMount handler
   - Define custom "dojo-genesis" theme with brand colors
   - Configure editor options (markdown, line numbers, word wrap, font)
   - Handle empty state when no tab is active

**Verification:**
- [ ] Editor displays content from active tab
- [ ] Typing updates store content in real-time
- [ ] Theme matches Dojo Genesis colors
- [ ] Editor uses JetBrains Mono font
- [ ] Line numbers visible
- [ ] Cursor is amber color
- [ ] Switching tabs preserves content

---

### [x] Step: Create Action Bar Component
<!-- chat-id: 19aa23f5-d062-4958-b6ed-573255ec5ed0 -->

**Objective:** Build the action bar with Test, Save, and Export buttons.

**Tasks:**
1. Create `components/workbench/ActionBar.tsx`
   - Import Button component from `@/components/ui/Button`
   - Create three buttons: "Test with Dojo" (primary), "Save" (secondary), "Export" (secondary)
   - Add onClick handlers that log to console
   - Layout: horizontal flex with proper spacing
   - Styling: bg-secondary, border-top, padding

**Verification:**
- [ ] Three buttons render with correct variants
- [ ] Buttons log to console on click
- [ ] Layout matches mockup
- [ ] No TypeScript errors

---

### [x] Step: Integrate Components in Workbench Page
<!-- chat-id: b595cd7a-72a6-4d0a-9eed-ee77d9d3ce69 -->

**Objective:** Compose all components into the main workbench page.

**Tasks:**
1. Modify `app/workbench/page.tsx`
   - Add 'use client' directive
   - Import all workbench components
   - Import workbench store
   - Add useEffect to initialize default welcome tab on mount
   - Layout: flex column with TabBar, Editor (flex-1), ActionBar
   - Set proper heights and flex properties

**Verification:**
- [ ] Page renders all components
- [ ] Default welcome tab appears on first load
- [ ] Layout fills viewport correctly
- [ ] Editor takes up available space (flex-1)
- [ ] No layout shift or overflow issues

---

### [x] Step: Testing and Refinement
<!-- chat-id: 50ed7b76-01a3-40b7-84c9-5a4376bf8d6a -->

**Objective:** Verify all functionality and match pixel-perfect design.

**Tasks:**
1. Manual testing checklist (from spec.md Section 7.1)
   - Test tab management (create, switch, close)
   - Test editor functionality (type, switch tabs, content persistence)
   - Test edge cases (many tabs, long names, rapid switching)
2. Visual design verification
   - Compare against Mockup 3
   - Verify colors match exactly
   - Check spacing and borders
   - Test hover states
3. Run build and lint commands
   - `npm run type-check`
   - `npm run lint`
   - `npm run build`
4. Fix any issues found

**Verification:**
- [ ] All manual tests pass
- [ ] Design matches mockup pixel-perfectly
- [ ] TypeScript check passes
- [ ] Lint check passes
- [ ] Build succeeds
- [ ] All acceptance criteria met

---

### [x] Step: Documentation
<!-- chat-id: 7f0ee0c9-8117-46ee-859b-f6f009a7ad7b -->

**Objective:** Create implementation report.

**Tasks:**
1. Write report to `.zenflow/tasks/v0-4-1-workbench-redesign-158f/report.md`
   - Describe what was implemented
   - Document how solution was tested
   - Note any challenges or issues encountered
   - List any deviations from spec (if any)

**Verification:**
- [x] Report.md created
- [x] All sections completed
