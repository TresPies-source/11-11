# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: a627ea1e-b670-4aca-9bdd-e0ff4a963f5c -->

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: c22c0085-94a5-4b2a-bc36-8893ad52e79f -->

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
<!-- chat-id: 5f03b207-8d7a-4d1b-8f9b-bde94538e53f -->

Created detailed implementation plan with 6 phases and 28 concrete tasks. Each phase is incremental and testable, following the migration strategy defined in spec.md.

---

## Implementation Tasks

### [x] Phase 1: Route & Component Creation
<!-- chat-id: cffbd2ac-b141-4205-ab9b-c3be6c894099 -->
**Goal:** Create new routes without breaking existing functionality

#### [x] Task 1.1: Create Greenhouse Page Route
- Create `app/librarian/greenhouse/page.tsx`
- Import and render `GreenhouseView` component
- Add metadata (title: "Greenhouse", description)
- **Verify:** Navigate to `/librarian/greenhouse` works (404 expected until component exists)

#### [x] Task 1.2: Create Commons Page Route
- Create `app/librarian/commons/page.tsx`
- Import and render `CommonsView` component
- Add metadata (title: "Commons", description)
- **Verify:** Navigate to `/librarian/commons` works (404 expected until component exists)

#### [x] Task 1.3: Create GreenhouseView Component
- Copy `components/library/LibraryView.tsx` to `components/librarian/GreenhouseView.tsx`
- Update title to "🌺 My Greenhouse"
- Update description to "Your cultivated prompts ready to bloom"
- Update empty state message
- Keep all existing functionality (useLibrary hook, search, filtering)
- **Verify:** Component renders, search/filter work, no TypeScript errors

#### [x] Task 1.4: Create CommonsView Component
- Copy `components/gallery/GalleryView.tsx` to `components/librarian/CommonsView.tsx`
- Update title to "✨ The Global Commons"
- Update description to "Discover prompts shared by the community"
- Update empty state message
- Keep all existing functionality (useGallery hook, search, filtering)
- **Verify:** Component renders, search/filter work, no TypeScript errors

#### [x] Task 1.5: Update PromptCard Variants (Optional)
- Extend `PromptCardProps.variant` type to include "greenhouse" | "commons"
- Add backward compatibility mapping (library → greenhouse, gallery → commons)
- **Verify:** PromptCard accepts all four variants without errors

#### [x] Task 1.6: Phase 1 Verification
- Run `npm run type-check` (expected: 0 errors)
- Run `npm run lint` (expected: 0 warnings)
- Test new routes via direct URL access
- Verify old routes (`/library`, `/gallery`) still work
- **Result:** Phase 1 complete ✅

---

### [x] Phase 2: Redirect Implementation
<!-- chat-id: dd1cc9bf-ee8c-4e16-aff5-269585400dab -->
**Goal:** Seamlessly redirect old URLs to new URLs

#### [x] Task 2.1: Update Middleware with Redirects
- Open `middleware.ts`
- Add redirect logic for `/library` → `/librarian/greenhouse` (301)
- Add redirect logic for `/gallery` → `/librarian/commons` (301)
- Place redirects BEFORE auth check to handle unauthenticated users
- **Verify:** Middleware compiles without TypeScript errors

#### [x] Task 2.2: Test Redirects in Dev
- Start dev server (`npm run dev`)
- Navigate to `/library` → should redirect to `/librarian/greenhouse`
- Navigate to `/gallery` → should redirect to `/librarian/commons`
- Test with query params: `/library?search=test`
- Verify browser URL updates (301 permanent redirect)
- **Verify:** All redirects work, query params preserved

#### [x] Task 2.3: Phase 2 Verification
- Run `npm run type-check` (expected: 0 errors)
- Run `npm run lint` (expected: 0 warnings)
- Test browser back button (should not create redirect loop)
- **Result:** Phase 2 complete ✅

---

### [x] Phase 3: Navigation Updates
<!-- chat-id: e49ef3f2-2230-41f1-8ba3-f95a430f04fe -->
**Goal:** Update primary navigation to reflect new structure

#### [x] Task 3.1: Update Header Navigation
- Open `components/layout/Header.tsx`
- Update `navLinks` array: remove `/library` and `/gallery`, keep single `/librarian`
- Update active state logic to use `pathname.startsWith(link.href + '/')` for sub-routes
- **Verify:** Header compiles, shows single "Librarian" link

#### [x] Task 3.2: Test Header Active States
- Navigate to `/librarian` → "Librarian" should be highlighted
- Navigate to `/librarian/greenhouse` → "Librarian" should be highlighted
- Navigate to `/librarian/commons` → "Librarian" should be highlighted
- **Verify:** Active state works on all routes

#### [x] Task 3.3: Enhance Librarian Landing Page
- Open `app/librarian/page.tsx` and `components/librarian/LibrarianView.tsx`
- Add navigation buttons/links to Greenhouse and Commons
- Add Greenhouse preview (optional: show count of saved prompts)
- Created `app/librarian/layout.tsx` to include Header on all librarian pages
- **Verify:** Navigation buttons work, links navigate correctly

#### [x] Task 3.4: Phase 3 Verification
- Run `npm run type-check` (expected: 0 errors)
- Run `npm run lint` (expected: 0 warnings)
- Manually test all navigation flows
- Verify responsive behavior on mobile/tablet/desktop
- **Result:** Phase 3 complete ✅

---

### [x] Phase 4: Internal Link Updates
<!-- chat-id: dd1f22a1-22de-4ed1-b457-6e5db40c1d0b -->
**Goal:** Update all internal links to use new URLs

#### [x] Task 4.1: Search for Old Library References
- Use Grep to find all `/library` references in codebase
- Update all `<Link href="/library">` to `<Link href="/librarian/greenhouse">`
- Update any hardcoded strings or comments
- **Verify:** Grep shows no remaining `/library` refs in source code

#### [x] Task 4.2: Search for Old Gallery References
- Use Grep to find all `/gallery` references in codebase
- Update all `<Link href="/gallery">` to `<Link href="/librarian/commons">`
- Update any hardcoded strings or comments
- **Verify:** Grep shows no remaining `/gallery` refs in source code

#### [x] Task 4.3: Update Button Text (Optional)
- Search for "Fork to Library" → update to "Fork to Greenhouse"
- Search for any "Library" or "Gallery" UI text → update for consistency
- **Verify:** User-facing text uses consistent terminology

#### [x] Task 4.4: Phase 4 Verification
- Run `npm run type-check` (expected: 0 errors)
- Run `npm run lint` (expected: 0 warnings)
- Grep for `/library` and `/gallery` (should only appear in middleware redirects)
- **Result:** Phase 4 complete ✅

---

### [x] Phase 5: Cleanup & Optimization
<!-- chat-id: 05306b71-1a8c-42b7-8a1f-16e197d7a310 -->
**Goal:** Remove deprecated code and verify final state

#### [x] Task 5.1: Delete Old Route Files
- Delete `app/library/page.tsx`
- Delete `app/gallery/page.tsx`
- **Verify:** Old routes return 404, redirects still work

#### [x] Task 5.2: Delete Old Component Files
- Delete `components/library/LibraryView.tsx`
- Delete `components/gallery/GalleryView.tsx`
- **Verify:** No import errors, new components used everywhere

#### [x] Task 5.3: Run Final Type Check & Lint
- Run `npm run type-check`
- Run `npm run lint`
- Fix any errors or warnings
- **Result:** Type-check passed (0 errors), Lint passed (0 warnings) ✅

#### [x] Task 5.4: Run Build Verification
- Run `npm run build`
- Verify successful production build
- Check bundle size (should not increase > 2 KB)
- **Result:** Build successful (~48s), routes optimized ✅

#### [x] Task 5.5: Phase 5 Verification
- All automated checks passing
- No unused files in codebase
- **Result:** Phase 5 complete ✅

---

### [x] Phase 6: Final Testing & Documentation
<!-- chat-id: 48530f53-f786-4caa-ad18-d7bfe3c56eb1 -->
**Goal:** Comprehensive testing and documentation updates

#### [x] Task 6.1: Manual Functionality Testing
Test all critical user flows:
- [x] Navigate to `/librarian` → shows landing page ✅
- [x] Navigate to `/librarian/greenhouse` → shows personal prompts ✅
- [x] Navigate to `/librarian/commons` → shows public prompts ✅
- [x] Direct access to `/library` → redirects to greenhouse ✅
- [x] Direct access to `/gallery` → redirects to commons ✅
- [x] Search in Greenhouse works ✅ (query params preserved in URL)
- [x] Search in Commons works ✅
- [x] Save to Greenhouse from Seedlings works ✅
- [x] Fork from Commons works ✅
- [x] All animations smooth (200-300ms) ✅
- [x] Responsive layout works (mobile/tablet/desktop) ✅
- [x] Zero console errors ✅ (only expected Supabase/Auth warnings)
**Result:** All critical flows tested and working correctly

#### [x] Task 6.2: Run Full Cleanup Command
- Run `npm run lint` ✅ (0 warnings)
- Run `npm run type-check` ✅ (0 errors)
- No test script configured (verified)
- **Result:** All checks passing ✅

#### [x] Task 6.3: Update Documentation (If Required)
- Documentation updates marked as "Out of Scope" in PRD
- No user request for documentation updates
- **Result:** Skipped per requirements

#### [x] Task 6.4: Final Verification Checklist
- [x] All phases 1-5 complete ✅
- [x] `npm run type-check` passes ✅ (0 errors)
- [x] `npm run lint` passes ✅ (0 warnings)
- [x] `npm run build` succeeds ✅ (19.6s, optimized routes)
- [x] All manual tests passing ✅
- [x] No regression in existing functionality ✅
- [x] Navigation simplified (3 links → 1 link) ✅
- [x] URLs follow new structure ✅
- [x] Redirects working (301 permanent) ✅
- [x] Query params preserved in redirects ✅
- [x] Old route files deleted ✅
- [x] Old component files deleted ✅
- [x] Only middleware contains /library and /gallery references ✅
**Result:** Phase 6 complete ✅

---

## Notes

**Critical Path:** Tasks must be executed sequentially by phase (Phase 1 → 2 → 3 → 4 → 5 → 6)

**Rollback Points:**
- After Phase 1: Can delete new routes, no impact
- After Phase 2: Can remove redirects, keep new routes
- After Phase 3: Can revert Header, keep new routes as "hidden"
- After Phase 4+: Full rollback required (restore from git)

**Estimated Time:** 3-4 hours total

**Success Criteria:**
- Zero TypeScript errors
- Zero ESLint warnings
- All existing functionality preserved
- Redirects working correctly
- Navigation updated and simplified
