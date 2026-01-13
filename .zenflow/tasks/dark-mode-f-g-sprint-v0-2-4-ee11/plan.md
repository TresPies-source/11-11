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
<!-- chat-id: cbfa08af-1a89-479d-8a29-ae8de82297d6 -->

**Complexity:** Medium

**Completed:** Comprehensive technical specification created at `spec.md`

**Key Decisions:**
- Use Tailwind class-based dark mode (`darkMode: 'class'`)
- CSS variables with RGB values for alpha channel support
- Theme context provider with localStorage persistence
- FOUC prevention via inline script in layout.tsx
- Monaco editor theme synchronization (`vs` / `vs-dark`)
- Systematic component migration (37 components)

---

### [x] Step 1: Configure Tailwind & Define Color Palette
<!-- chat-id: d95d94de-d593-4a67-b4c9-3c71d5c6f1d5 -->

**Objective:** Enable Tailwind dark mode and define comprehensive color palette

**Files to Modify:**
- `tailwind.config.ts` - Enable `darkMode: 'class'`, extend color tokens
- `app/globals.css` - Define `:root` and `.dark` CSS variables with WCAG AA compliant colors

**Verification:**
- ✅ `npm run build` passes
- ✅ CSS variables defined for both light and dark themes
- ✅ Tailwind config correctly references RGB color variables

---

### [ ] Step 2: Create Theme Provider & Hook
<!-- chat-id: e9bb521e-c7d1-4447-b004-6fa5bbc86dfc -->

**Objective:** Implement theme state management with system preference detection and localStorage persistence

**Files to Create:**
- `hooks/useTheme.ts` - Theme hook with system preference detection, localStorage sync
- `components/providers/ThemeProvider.tsx` - Theme context provider

**Files to Modify:**
- `lib/types.ts` - Add `Theme` and `ThemeContextValue` types

**Verification:**
- Hook detects system preference correctly
- localStorage persistence works (save/load)
- Theme class applied to `<html>` element
- `npm run build` passes
- No TypeScript errors

---

### [ ] Step 3: Implement FOUC Prevention & Integrate Provider

**Objective:** Prevent flash of unstyled content and wire up theme provider

**Files to Modify:**
- `app/layout.tsx` - Add inline script for FOUC prevention, integrate ThemeProvider

**Verification:**
- No theme flash on page load
- Theme loads before React hydration
- ThemeProvider wraps application correctly
- `npm run build` passes

---

### [ ] Step 4: Create Theme Toggle Component

**Objective:** Build theme toggle UI with Sun/Moon icon

**Files to Create:**
- `components/shared/ThemeToggle.tsx` - Theme toggle button with icon animation

**Files to Modify:**
- `components/layout/Header.tsx` - Add ThemeToggle before SyncStatus

**Verification:**
- Toggle appears in Header
- Icon changes on click (Sun ↔ Moon)
- Smooth animation (200ms)
- Keyboard accessible (Tab + Enter)
- aria-label present
- Manual test: Click toggle switches theme

---

### [ ] Step 5: Update Priority 1 Components (Layout & Core)

**Objective:** Migrate core layout components to theme-aware classes

**Files to Modify:**
- `components/layout/Header.tsx` - Replace hardcoded classes
- `components/layout/Sidebar.tsx` - Replace hardcoded classes
- `components/layout/MainContent.tsx` - Replace hardcoded classes
- `components/layout/CommandCenter.tsx` - Replace hardcoded classes

**Verification:**
- All layout components render correctly in light mode
- All layout components render correctly in dark mode
- No hardcoded `bg-white`, `text-gray-900`, etc. remain
- `npm run build` passes
- Manual test: Toggle theme, verify all layout components update

---

### [ ] Step 6: Update Monaco Editor Theme

**Objective:** Synchronize Monaco editor theme with application theme

**Files to Modify:**
- `components/editor/MarkdownEditor.tsx` - Dynamic theme prop (`vs` / `vs-dark`)
- `components/editor/EditorView.tsx` - Update classes

**Verification:**
- Editor uses `vs` theme in light mode
- Editor uses `vs-dark` theme in dark mode
- Syntax highlighting correct in both themes
- No editor flash when switching themes
- Manual test: Open file, toggle theme, verify editor updates

---

### [ ] Step 7: Update Priority 2 Components (Librarian)

**Objective:** Migrate Librarian components to theme-aware classes

**Files to Modify:**
- `components/librarian/LibrarianView.tsx`
- `components/librarian/SeedlingSection.tsx`
- `components/librarian/GreenhouseSection.tsx`
- `components/librarian/SeedlingCard.tsx`
- `components/librarian/GreenhouseCard.tsx`
- `components/librarian/CritiqueScore.tsx`
- `components/librarian/CritiqueDetails.tsx`
- `components/librarian/StatusTransitionButton.tsx`
- `components/librarian/CommonsView.tsx`
- `components/librarian/GreenhouseView.tsx`

**Verification:**
- All Librarian components render correctly in both themes
- Critique scores visible in both themes
- Cards have proper contrast in both themes
- Manual test: Visit `/librarian`, toggle theme, verify all sections

---

### [ ] Step 8: Update Priority 3 Components (Multi-Agent)

**Objective:** Migrate Multi-Agent and remaining editor components

**Files to Modify:**
- `components/multi-agent/MultiAgentView.tsx`
- `components/multi-agent/ChatPanel.tsx`
- `components/multi-agent/NewSessionButton.tsx`

**Verification:**
- Chat panels render correctly in both themes
- FAB button visible in both themes
- Message history readable in both themes
- Manual test: Open Multi-Agent view, toggle theme, verify components

---

### [ ] Step 9: Update Priority 4 Components (Shared Components)

**Objective:** Migrate all shared/utility components

**Files to Modify:**
- `components/shared/FileTree.tsx`
- `components/shared/WorkspaceSelector.tsx`
- `components/shared/SyncStatus.tsx`
- `components/shared/SearchInput.tsx`
- `components/shared/PromptCard.tsx`
- `components/shared/LoadingState.tsx`
- `components/shared/ErrorState.tsx`
- `components/shared/EmptySearchState.tsx`
- `components/shared/Toast.tsx`
- `components/shared/PromptCardSkeleton.tsx`
- All remaining components

**Verification:**
- All shared components render correctly in both themes
- Icons visible in both themes
- Loading states visible in both themes
- Error states readable in both themes
- `npm run build` passes

---

### [ ] Step 10: WCAG Contrast Validation

**Objective:** Verify all colors meet WCAG 2.1 AA contrast requirements

**Tools:**
- Browser DevTools
- axe DevTools extension

**Verification:**
- [ ] Normal text meets 4.5:1 contrast in light mode
- [ ] Normal text meets 4.5:1 contrast in dark mode
- [ ] Large text meets 3:1 contrast in both modes
- [ ] Focus indicators meet 3:1 contrast
- [ ] Interactive elements (buttons, links) meet contrast requirements
- Document any contrast issues in BUGS.md

---

### [ ] Step 11: Comprehensive Manual Testing

**Objective:** Execute full manual testing checklist

**Test Cases:**
- [ ] Theme toggle works (click switches theme)
- [ ] Icon changes correctly (Sun ↔ Moon)
- [ ] Smooth transition (200ms, no jarring flash)
- [ ] Theme persists on reload (localStorage)
- [ ] System preference detected (clear localStorage test)
- [ ] Monaco editor theme switches correctly
- [ ] All components work in both themes (Header, Sidebar, Librarian, Multi-Agent, Editor)
- [ ] No console errors
- [ ] No layout shifts when switching themes
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Focus indicators visible in both themes

**Regression Testing:**
- [ ] File tree expand/collapse works
- [ ] Monaco editor auto-save works
- [ ] Multi-Agent panels spawn/close works
- [ ] Librarian critique scoring works
- [ ] Status transitions work
- [ ] Search functionality works

---

### [ ] Step 12: Performance Validation

**Objective:** Verify theme switching performance meets requirements

**Metrics:**
- [ ] Theme switch completes in <100ms
- [ ] No frame drops during transition
- [ ] No layout reflows
- [ ] Bundle size increase acceptable (<5KB)

**Tools:**
- Browser DevTools Performance tab
- Lighthouse

---

### [ ] Step 13: Visual Validation & Screenshots

**Objective:** Capture screenshots of all major views in both themes

**Screenshots Required:**
- Light mode: Header, Sidebar, Librarian, Editor, Multi-Agent
- Dark mode: Header, Sidebar, Librarian, Editor, Multi-Agent

**Save to:** `05_Logs/screenshots/phase4-dark-mode/`

**Verification:**
- [ ] All screenshots captured
- [ ] Visual consistency verified
- [ ] No rendering issues in either theme

---

### [ ] Step 14: Run Lint & Build

**Objective:** Verify all automated checks pass

**Commands:**
```bash
npm run lint
npm run build
```

**Verification:**
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run build` completes successfully
- [ ] No TypeScript errors
- [ ] No ESLint warnings (or acceptable warnings documented)

---

### [ ] Step 15: Documentation & Completion

**Objective:** Update project documentation and write completion report

**Files to Update:**
- `JOURNAL.md` - Document theme architecture, color palette, system preference detection, Monaco integration, FOUC prevention, component migration strategy
- `05_Logs/BUGS.md` - Document any bugs discovered during implementation
- `00_Roadmap/task_plan.md` - Mark Phase 4 (Dark Mode) as complete

**Report:**
Write completion report to `.zenflow/tasks/dark-mode-f-g-sprint-v0-2-4-ee11/report.md`:
- What was implemented
- How the solution was tested
- Performance metrics
- WCAG compliance verification
- Known limitations
- Screenshots reference
- Biggest challenges encountered

**Verification:**
- [ ] JOURNAL.md updated with all architecture decisions
- [ ] BUGS.md updated (or confirmed no new bugs)
- [ ] task_plan.md marked complete
- [ ] report.md written with comprehensive summary
