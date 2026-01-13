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

### [x] Step 2: Create Theme Provider & Hook
<!-- chat-id: e9bb521e-c7d1-4447-b004-6fa5bbc86dfc -->

**Objective:** Implement theme state management with system preference detection and localStorage persistence

**Files to Create:**
- `hooks/useTheme.ts` - Theme hook with system preference detection, localStorage sync
- `components/providers/ThemeProvider.tsx` - Theme context provider

**Files to Modify:**
- `lib/types.ts` - Add `Theme` and `ThemeContextValue` types

**Verification:**
- ✅ Hook detects system preference correctly
- ✅ localStorage persistence works (save/load)
- ✅ Theme class applied to `<html>` element
- ✅ `npm run build` passes
- ✅ No TypeScript errors

---

### [x] Step 3: Implement FOUC Prevention & Integrate Provider
<!-- chat-id: 1377d13d-f338-47b5-b890-12a148ca2c1d -->

**Objective:** Prevent flash of unstyled content and wire up theme provider

**Files to Modify:**
- `app/layout.tsx` - Add inline script for FOUC prevention, integrate ThemeProvider

**Verification:**
- ✅ No theme flash on page load
- ✅ Theme loads before React hydration
- ✅ ThemeProvider wraps application correctly
- ✅ `npm run build` passes

---

### [x] Step 4: Create Theme Toggle Component
<!-- chat-id: 82f8f104-08a5-4a9d-bc87-3c3750015f94 -->

**Objective:** Build theme toggle UI with Sun/Moon icon

**Files to Create:**
- `components/shared/ThemeToggle.tsx` - Theme toggle button with icon animation

**Files to Modify:**
- `components/layout/Header.tsx` - Add ThemeToggle before SyncStatus

**Verification:**
- ✅ Toggle appears in Header
- ✅ Icon changes on click (Sun ↔ Moon)
- ✅ Smooth animation (200ms)
- ✅ Keyboard accessible (Tab + Enter)
- ✅ aria-label present
- ✅ Manual test: Click toggle switches theme
- ✅ `npm run build` passes

---

### [x] Step 5: Update Priority 1 Components (Layout & Core)
<!-- chat-id: 13863de2-3ba0-4111-9f71-122cbf0a731c -->

**Objective:** Migrate core layout components to theme-aware classes

**Files to Modify:**
- `components/layout/Header.tsx` - Replace hardcoded classes
- `components/layout/Sidebar.tsx` - Replace hardcoded classes
- `components/layout/MainContent.tsx` - Replace hardcoded classes
- `components/layout/CommandCenter.tsx` - Replace hardcoded classes

**Verification:**
- ✅ All layout components render correctly in light mode
- ✅ All layout components render correctly in dark mode
- ✅ No hardcoded `bg-white`, `text-gray-900`, etc. remain
- ✅ `npm run build` passes
- Manual test: Toggle theme, verify all layout components update

---

### [x] Step 6: Update Monaco Editor Theme
<!-- chat-id: 64d41c03-8cf6-4a00-a89d-cca340e9290e -->

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

### [x] Step 7: Update Priority 2 Components (Librarian)
<!-- chat-id: 3169fed1-2df9-4c90-970f-0233453a8f63 -->

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

### [x] Step 8: Update Priority 3 Components (Multi-Agent)
<!-- chat-id: c70520d0-b706-4660-9ec9-2fbd7384f4e8 -->

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

### [x] Step 9: Update Priority 4 Components (Shared Components)
<!-- chat-id: 156bca14-4604-40a7-a5d7-26facbf8d6dc -->

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

### [x] Step 10: WCAG Contrast Validation
<!-- chat-id: e4566220-fa2d-46c5-a1cf-8ab83d862afa -->

**Objective:** Verify all colors meet WCAG 2.1 AA contrast requirements

**Tools:**
- Automated script: `scripts/contrast-check.js`
- WCAG 2.1 relative luminance calculation

**Verification:**
- [x] Normal text meets 4.5:1 contrast in light mode
- [x] Normal text meets 4.5:1 contrast in dark mode
- [x] Large text meets 3:1 contrast in both modes
- [x] Focus indicators meet 3:1 contrast
- [x] Interactive elements (buttons, links) meet contrast requirements
- [x] All 18 contrast tests passed - full WCAG 2.1 AA compliance

**Completed:** All colors adjusted and validated. Report: `.zenflow/tasks/dark-mode-f-g-sprint-v0-2-4-ee11/wcag-validation-report.md`

---

### [x] Step 11: Comprehensive Manual Testing
<!-- chat-id: a024db87-41ba-4af7-8950-0e33c8304ea1 -->

**Objective:** Execute full manual testing checklist

**Test Cases:**
- [x] Theme toggle works (click switches theme)
- [x] Icon changes correctly (Sun ↔ Moon)
- [x] Smooth transition (200ms, no jarring flash)
- [x] Theme persists on reload (localStorage)
- [x] System preference detected (theme saved to localStorage as "theme-preference")
- [x] Monaco editor theme switches correctly (vs / vs-dark)
- [x] All components work in both themes (Header, Sidebar, Librarian, Multi-Agent, Editor)
- [x] No console errors (only unrelated avatar image 400 error from external API)
- [x] No layout shifts when switching themes
- [x] Keyboard navigation works (Tab + Enter to toggle theme)
- [x] Focus indicators visible in both themes

**Regression Testing:**
- [x] File tree expand/collapse works
- [x] Monaco editor auto-save works
- [x] Multi-Agent panels spawn/close works
- [x] Librarian critique scoring works (visible in both themes)
- [x] Status transitions work (buttons functional)
- [x] Search functionality works (not extensively tested but UI visible)

**Completed:** All manual tests passed. Screenshots captured:
- `dark-mode-test.png` - Home view in dark mode
- `light-mode-test.png` - Home view in light mode
- `editor-dark-mode.png` - Editor with Monaco in dark mode
- `editor-light-mode.png` - Editor with Monaco in light mode
- `librarian-dark-mode.png` - Librarian view in dark mode
- `librarian-light-mode.png` - Librarian view in light mode

---

### [x] Step 12: Performance Validation
<!-- chat-id: 856252ee-703f-4e31-9b4a-99197b7b2074 -->

**Objective:** Verify theme switching performance meets requirements

**Completed:** All performance requirements exceeded

**Metrics:**
- [x] Theme switch completes in <100ms (Average: 28.72ms, 72% faster than requirement)
- [x] No frame drops during transition (0.50ms synchronous execution, 97% frame budget available)
- [x] No layout reflows (0 layout shifts detected)
- [x] Bundle size increase acceptable (<5KB) (~2KB estimated, 60% under limit)

**Tools:**
- Browser DevTools Performance tab
- PerformanceObserver API
- Performance.mark() / Performance.measure()

**Report:** `.zenflow/tasks/dark-mode-f-g-sprint-v0-2-4-ee11/performance-validation-report.md`

---

### [x] Step 13: Visual Validation & Screenshots
<!-- chat-id: 6e8dbaac-18e1-4047-9081-e46ef1db6873 -->

**Objective:** Capture screenshots of all major views in both themes

**Screenshots Required:**
- Light mode: Header, Sidebar, Librarian, Editor, Multi-Agent
- Dark mode: Header, Sidebar, Librarian, Editor, Multi-Agent

**Save to:** `05_Logs/screenshots/phase4-dark-mode/`

**Verification:**
- [x] All screenshots captured (8 total: home, editor, librarian, multi-agent in both themes)
- [x] Visual consistency verified (themes switch correctly across all views)
- [x] No rendering issues in either theme

**Completed:** All 8 screenshots successfully captured and saved to `05_Logs/screenshots/phase4-dark-mode/`:
- 01-home-light.png (38.5 KB)
- 02-home-dark.png (40.3 KB)
- 03-editor-dark.png (38.8 KB)
- 04-editor-light.png (39.8 KB)
- 05-librarian-light.png (371.5 KB)
- 06-librarian-dark.png (384.7 KB)
- 07-multi-agent-dark.png (39.0 KB)
- 08-multi-agent-light.png (39.5 KB)

---

### [x] Step 14: Run Lint & Build
<!-- chat-id: 374cb672-9b9d-4348-820a-4faf496b42f3 -->

**Objective:** Verify all automated checks pass

**Commands:**
```bash
npm run lint
npm run build
```

**Verification:**
- [x] `npm run lint` passes with zero errors
- [x] `npm run build` completes successfully
- [x] No TypeScript errors
- [x] No ESLint warnings (or acceptable warnings documented)

**Completed:** All automated checks passed successfully. Build completed in 21.5s with no errors or warnings.

---

### [x] Step 15: Documentation & Completion
<!-- chat-id: 26aaed63-c173-4e4e-a23a-fc8ce382a230 -->

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
- [x] JOURNAL.md updated with all architecture decisions
- [x] BUGS.md updated (or confirmed no new bugs)
- [x] task_plan.md marked complete
- [x] report.md written with comprehensive summary

**Completed:** All documentation updated successfully

**Documentation Files:**
- ✅ JOURNAL.md: Comprehensive Phase 4 entry added (293 lines) documenting theme architecture, color palette, WCAG compliance, system preference detection, Monaco integration, FOUC prevention, component migration strategy, performance optimization, and technical achievements
- ✅ task_plan.md: Phase 4 completion entry added to roadmap with delivered features, performance metrics, quality validation, and deferred features
- ✅ BUGS.md: Reviewed - no new bugs discovered during Phase 4 implementation
- ✅ report.md: Complete 280-line completion report created covering implementation details, testing methodology, performance metrics, WCAG validation, known limitations, and biggest challenges encountered
