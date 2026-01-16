# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: 9024bf74-6cae-4df5-ae08-d0ab2d6d8d9e -->

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: 1e419e2d-da3d-4267-ac8c-6ba31acf5c31 -->

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
<!-- chat-id: efe322ad-c6de-4ecc-8dcc-50c9cf4d11a6 -->

Create a detailed implementation plan based on `{@artifacts_path}/spec.md`.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps
3. Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function) or too broad (entire feature).

If the feature is trivial and doesn't warrant full specification, update this workflow to remove unnecessary steps and explain the reasoning to the user.

Save to `{@artifacts_path}/plan.md`.

---


### [x] Step: Phase 1
<!-- chat-id: 3bbd4d9a-022d-406b-ac4a-32bd48572cbe -->
<!-- agent: ZEN_CLI -->

### [x] Step: Phase 2
<!-- chat-id: 8d67dc9f-6a47-412c-afc0-304bbe69173c -->
<!-- agent: ZEN_CLI -->

### [x] Step: Phase 3
<!-- chat-id: d5e57ca4-6361-45f3-91f4-a28b6dd7db52 -->
<!-- agent: ZEN_CLI -->

### [x] Step: Final Verification
<!-- chat-id: fd0d3b4c-e985-4b0e-ba57-d5ee6ffdaeab -->
<!-- agent: ZEN_CLI -->
## Implementation Plan

### PHASE 1: FOUNDATION - Core Components & Backend

#### [ ] Step 1.1: Examine Existing Components
**Objective:** Understand existing component patterns and data structures

**Tasks:**
- Read existing card components: `SeedCard`, `GreenhouseCard`, `CommonsPromptCard`
- Read existing view components: `SeedsView`, `GreenhouseView`, `CommonsView`
- Review data types: `lib/seeds/types.ts`, `lib/pglite/prompts.ts`, `lib/pglite/types.ts`
- Identify common patterns and reusable subcomponents
- Document color schemes, icons, and animations used

**Verification:**
- List of common patterns documented
- Understanding of type guards needed for artifact detection

---

#### [ ] Step 1.2: Enhance Feed Queries API
**Objective:** Add status and visibility filtering to feed-queries.ts

**File:** `lib/hub/feed-queries.ts`

**Tasks:**
- Read current `getFeedArtifacts` implementation
- Add `status?: string[]` to `FeedFilters` interface
- Add `visibility?: PromptVisibility[]` to `FeedFilters` interface
- Update prompts WHERE clause to filter by status (if provided)
- Update prompts WHERE clause to filter by visibility (if provided)
- Update seeds WHERE clause to filter by status (if provided)
- Maintain proper SQL parameter indexing

**Verification:**
```bash
npm run type-check  # Must pass
```
- Query supports filtering prompts by status: ['draft', 'active', 'saved', 'archived']
- Query supports filtering prompts by visibility: ['private', 'unlisted', 'public']
- Query supports filtering seeds by status: ['new', 'growing', 'mature', 'compost']

---

#### [ ] Step 1.3: Create ArtifactCard Component
**Objective:** Build universal card component for all artifact types

**File:** `components/artifacts/ArtifactCard.tsx`

**Tasks:**
- Create file structure and imports
- Define `CardArtifact` union type (SeedRow | PromptWithCritique | SessionRow)
- Implement type guard functions (isSeed, isPrompt, isSession)
- Create artifact type detection function
- Implement type-specific header rendering (icons, colors, badges)
- Implement content rendering (title, description, tags, metadata)
- Implement type-specific action rendering:
  - Seed: Keep/Grow/Compost, Workbench, Dojo, Delete
  - Prompt: Public toggle, View Details, Status transitions, Critique score
  - Session: Resume, View Details, Delete
- Integrate `TrailOfThoughtPanel` component
- Add Framer Motion animations (layoutId, whileHover)
- Add accessibility attributes (ARIA labels, keyboard navigation)
- Add search highlighting for title/description

**Reuse:**
- `components/ui/Card.tsx` as base
- `components/ui/Tag.tsx` for tags
- `components/ui/Button.tsx` for actions
- `components/hub/TrailOfThoughtPanel.tsx`
- `components/librarian/CritiqueScore.tsx`
- `components/librarian/PublicToggle.tsx`
- `components/librarian/PublicBadge.tsx`
- `components/librarian/GreenhouseCardActions.tsx`

**Verification:**
```bash
npm run type-check  # Must pass
npm run lint        # Must pass
```
- Component renders all artifact types without errors
- Actions are conditionally displayed based on artifact type
- Animations are smooth
- Keyboard navigation works

---

#### [ ] Step 1.4: Create ArtifactGridView Component
**Objective:** Build reusable grid container with data fetching and pagination

**File:** `components/artifacts/ArtifactGridView.tsx`

**Tasks:**
- Create file structure and imports
- Define `ArtifactGridViewProps` interface:
  - `filters: FeedFilters`
  - `emptyState?: { title, message, action }`
  - `header?: React.ReactNode`
  - `className?: string`
- Implement data fetching with `getFeedArtifacts`
- Implement pagination state management
- Implement infinite scroll logic (load more button)
- Create loading state component
- Create error state component with retry button
- Create empty state component
- Implement responsive grid layout (1/2/3 columns)
- Map artifacts to `ArtifactCard` components
- Add refresh callback for status changes

**Verification:**
```bash
npm run type-check  # Must pass
npm run lint        # Must pass
```
- Grid fetches data correctly
- Pagination loads more items
- Error handling works (retry button)
- Empty state displays when no results
- Loading state shows during fetch
- Responsive layout works on mobile/tablet/desktop

---

### PHASE 2: PAGE REFACTORING

#### [ ] Step 2.1: Refactor Seeds Page
**Objective:** Replace SeedsView with ArtifactGridView

**File:** `app/seeds/page.tsx`

**Tasks:**
- Read current Seeds page implementation
- Replace `SeedsView` with `ArtifactGridView`
- Configure filters: `{ types: ['seed'] }`
- Add empty state configuration
- Preserve existing header/filters panel
- Test all functionality:
  - Seed cards display correctly
  - Status transitions work (Keep, Grow, Compost)
  - "Open in Workbench" button works
  - "Discuss in Dojo" button works
  - Delete button works
  - Search/filter works
  - TrailOfThoughtPanel displays

**Verification:**
```bash
npm run dev  # Start dev server
```
- Manual test: Navigate to `/seeds`
- Take screenshot for comparison
- All seed functionality works
- Layout matches existing design
- No console errors

---

#### [ ] Step 2.2: Refactor Greenhouse Page
**Objective:** Replace GreenhouseView with ArtifactGridView

**File:** `app/librarian/greenhouse/page.tsx`

**Tasks:**
- Read current Greenhouse page implementation
- Replace `GreenhouseView` with `ArtifactGridView`
- Configure filters: `{ types: ['prompt'], status: ['saved'] }`
- Add empty state configuration
- Preserve existing header/filters
- Test all functionality:
  - Prompt cards display correctly
  - Critique scores display
  - Public toggle works
  - Status transitions work
  - Action buttons work
  - Search/filter works
  - TrailOfThoughtPanel displays

**Verification:**
```bash
npm run dev  # Start dev server
```
- Manual test: Navigate to `/librarian/greenhouse`
- Take screenshot for comparison
- All greenhouse functionality works
- Layout matches existing design
- No console errors

---

#### [ ] Step 2.3: Refactor Commons Page
**Objective:** Replace CommonsView with ArtifactGridView

**File:** `app/librarian/commons/page.tsx`

**Tasks:**
- Read current Commons page implementation
- Replace `CommonsView` with `ArtifactGridView`
- Configure filters: `{ types: ['prompt'], visibility: ['public'] }`
- Add empty state configuration
- Preserve existing header/filters
- Test all functionality:
  - Public prompts display correctly
  - Author information shows
  - Public badge displays
  - "Copy to Library" button works
  - "View Details" works
  - Search/filter works
  - Expand/collapse works

**Verification:**
```bash
npm run dev  # Start dev server
```
- Manual test: Navigate to `/librarian/commons`
- Take screenshot for comparison
- All commons functionality works
- Layout matches existing design
- No console errors

---

### PHASE 3: NAVIGATION & CLEANUP

#### [ ] Step 3.1: Update Navigation Sidebar
**Objective:** Remove Librarian and Seeds links from navigation

**File:** `components/layout/NavigationSidebar.tsx`

**Tasks:**
- Read current NavigationSidebar implementation
- Remove "Librarian" nav item
- Remove "Seeds" nav item
- Keep: Dashboard, Workbench, Hub nav items
- Test navigation flow

**Verification:**
```bash
npm run dev  # Start dev server
```
- Manual test: Check sidebar navigation
- Librarian link removed
- Seeds link removed
- Other links still work
- No broken UI

---

#### [ ] Step 3.2: Add Librarian Redirect
**Objective:** Redirect /librarian to /hub

**File:** `next.config.mjs`

**Tasks:**
- Read current next.config.mjs
- Add redirects configuration
- Add redirect: `/librarian` → `/hub` (302 temporary)
- Test redirect works

**Verification:**
```bash
npm run build  # Ensure build succeeds
npm run dev    # Test redirect
```
- Navigate to `/librarian` redirects to `/hub`
- No errors in console

---

#### [ ] Step 3.3: Delete Deprecated Card Components
**Objective:** Remove old card components

**Files to Delete:**
- `components/seeds/seed-card.tsx`
- `components/librarian/GreenhouseCard.tsx`
- `components/librarian/CommonsPromptCard.tsx`

**Tasks:**
- Delete `components/seeds/seed-card.tsx`
- Delete `components/librarian/GreenhouseCard.tsx`
- Delete `components/librarian/CommonsPromptCard.tsx`
- Ensure no remaining imports reference these files

**Verification:**
```bash
npm run type-check  # Must pass (no import errors)
npm run build       # Must pass
```

---

#### [ ] Step 3.4: Delete Deprecated View Components
**Objective:** Remove old view components

**Files to Delete:**
- `components/seeds/seeds-view.tsx`
- `components/librarian/GreenhouseView.tsx`
- `components/librarian/CommonsView.tsx`

**Tasks:**
- Delete `components/seeds/seeds-view.tsx`
- Delete `components/librarian/GreenhouseView.tsx`
- Delete `components/librarian/CommonsView.tsx`
- Ensure no remaining imports reference these files

**Verification:**
```bash
npm run type-check  # Must pass (no import errors)
npm run build       # Must pass
```

---

#### [ ] Step 3.5: Delete Librarian Page
**Objective:** Remove deprecated /librarian page

**File to Delete:**
- `app/librarian/page.tsx`

**Tasks:**
- Delete `app/librarian/page.tsx`
- Verify redirect still works
- Test no broken links

**Verification:**
```bash
npm run type-check  # Must pass
npm run build       # Must pass
npm run dev         # Test redirect
```
- `/librarian` redirects to `/hub`
- No 404 errors

---

### FINAL VERIFICATION

#### [ ] Step 4.1: Full Type Check and Lint
**Objective:** Ensure code quality and no TypeScript errors

**Tasks:**
- Run type checking
- Run linting
- Fix any errors

**Commands:**
```bash
npm run type-check  # Must pass with no errors
npm run lint        # Must pass with no warnings
```

**Success Criteria:**
- ✓ TypeScript compilation successful
- ✓ No ESLint warnings

---

#### [ ] Step 4.2: Production Build Test
**Objective:** Ensure application builds successfully for production

**Tasks:**
- Run production build
- Check for any build errors
- Verify all pages compile

**Commands:**
```bash
npm run build  # Must complete successfully
```

**Success Criteria:**
- ✓ Compiled successfully
- ✓ Static page generation complete
- ✓ No runtime errors

---

#### [ ] Step 4.3: Manual Regression Testing
**Objective:** Comprehensive manual testing of all refactored pages

**Test Cases:**

**Seeds Page (`/seeds`):**
- [ ] Seeds display in grid
- [ ] Status badges show correctly
- [ ] Status transitions work (Keep, Grow, Compost)
- [ ] "Open in Workbench" button works
- [ ] "Discuss in Dojo" button works
- [ ] Delete button works
- [ ] TrailOfThoughtPanel displays
- [ ] Search filters seeds
- [ ] Animations are smooth

**Greenhouse Page (`/librarian/greenhouse`):**
- [ ] Prompts display in grid
- [ ] Critique scores display
- [ ] Public toggle works
- [ ] Status transitions work
- [ ] Actions menu works
- [ ] TrailOfThoughtPanel displays
- [ ] Search filters prompts
- [ ] Animations are smooth

**Commons Page (`/librarian/commons`):**
- [ ] Public prompts display
- [ ] Author information shows
- [ ] "View Details" works
- [ ] "Copy to Library" works
- [ ] Public badge displays
- [ ] Expand/collapse works
- [ ] Search filters prompts

**Navigation:**
- [ ] Dashboard link works
- [ ] Workbench link works
- [ ] Hub link works
- [ ] Librarian link removed from sidebar
- [ ] Seeds link removed from sidebar
- [ ] `/librarian` redirects to `/hub`

**Screenshot Documentation:**
- Take before/after screenshots of all three pages
- Document any visual differences
- Confirm acceptable changes

---

#### [ ] Step 4.4: Commit Changes
**Objective:** Create clean, conventional commit

**Tasks:**
- Review all changes
- Stage all modified/new/deleted files
- Create commit with message:
  ```
  feat: unify artifact cards and refactor knowledge pages
  
  - Create universal ArtifactCard component
  - Create ArtifactGridView with pagination
  - Refactor Seeds, Greenhouse, Commons pages
  - Remove deprecated card/view components
  - Update navigation to two-pillar model
  - Add /librarian redirect to /hub
  
  BREAKING CHANGE: Removes Librarian and Seeds navigation items
  ```

**Verification:**
- All tests pass
- Build succeeds
- Git status clean after commit
