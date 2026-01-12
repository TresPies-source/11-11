# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: def40de5-0ab1-45fb-a1d6-0c03d08d2bd9 -->

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: 181d989a-5ad9-4698-861d-e2c902f9622d -->

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
<!-- chat-id: 995730db-def1-402c-89b8-0ffbab69f376 -->

Create a detailed implementation plan based on `{@artifacts_path}/spec.md`.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps
3. Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function) or too broad (entire feature).

If the feature is trivial and doesn't warrant full specification, update this workflow to remove unnecessary steps and explain the reasoning to the user.

Save to `{@artifacts_path}/plan.md`.

---

## Implementation Plan

### Phase 1: Infrastructure Setup

### [x] Step: Install Supabase dependency and configure environment
<!-- chat-id: 127dc8a5-75e4-4e93-95e6-1185ee8351df -->

**Tasks**:
- Install `@supabase/supabase-js` package
- Update `.env.example` with Supabase environment variables
- Ensure `.gitignore` includes `.env.local`

**Contract Reference**: spec.md § 1.2, § 1.3

**Verification**:
- [x] Package appears in package.json
- [x] `.env.example` has NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- [x] `.env.local` is in .gitignore

---

### [x] Step: Create Supabase database schema
<!-- chat-id: 8049c754-bc74-43f9-a2e5-eb4f6dfe2f16 -->

**Tasks**:
- Create migration file `lib/supabase/migrations/001_initial_schema.sql`
- Include prompts, prompt_metadata, and critiques tables
- Add indexes, RLS policies, and triggers as specified
- Document manual steps for running migration in Supabase dashboard

**Contract Reference**: spec.md § 4.2

**Verification**:
- [x] Migration file exists with complete schema
- [x] All tables, indexes, and policies defined
- [x] RLS policies enforce user isolation
- [x] Trigger for updated_at is included

---

### [x] Step: Implement Supabase client and types
<!-- chat-id: 36046417-5b59-4aac-94f0-46ba0f8a5398 -->

**Tasks**:
- Create `lib/supabase/client.ts` with Supabase client initialization
- Create `lib/supabase/types.ts` with database type definitions
- Add dev mode detection and mock data fallback
- Handle missing environment variables gracefully

**Contract Reference**: spec.md § 2.4, § 4.1

**Verification**:
- [x] Client initializes successfully in dev mode
- [x] TypeScript types match database schema
- [x] Clear error message when env vars missing
- [x] No TypeScript errors

---

### [x] Step: Implement prompt data layer
<!-- chat-id: 150a244a-66cf-44e2-8362-04c5906c0c4d -->

**Tasks**:
- Create `lib/supabase/prompts.ts`
- Implement functions: `getPromptsByStatus`, `updatePromptStatus`, `syncPromptFromDrive`, `searchPrompts`
- Add error handling and retry logic
- Support dev mode with mock data

**Contract Reference**: spec.md § 2.4

**Verification**:
- [ ] CRUD operations work with proper error handling
- [ ] Mock data works in dev mode
- [ ] TypeScript types are correct
- [ ] No TypeScript errors

---

### [x] Step: Implement critique data layer
<!-- chat-id: 7fd9451c-ff37-41bd-b06e-cf1294fdf6c6 -->

**Tasks**:
- Create `lib/supabase/critiques.ts`
- Implement functions: `saveCritique`, `getLatestCritique`, `getCritiqueHistory`
- Add error handling
- Support dev mode with mock critiques

**Contract Reference**: spec.md § 2.4

**Verification**:
- [x] Can save and retrieve critiques
- [x] Critiques link to prompts correctly
- [x] Mock data works in dev mode
- [x] No TypeScript errors

---

### [x] Step: Update type definitions
<!-- chat-id: 150a244a-66cf-44e2-8362-04c5906c0c4d -->

**Tasks**:
- Update `lib/types.ts` with new types: `PromptStatus`, `Prompt`, `CritiqueResult`, `CritiqueFeedback`, `PromptFilters`, `PromptSortOptions`
- Extend `PromptFile` with critique properties
- Ensure backward compatibility

**Contract Reference**: spec.md § 4.1

**Verification**:
- [ ] All new types defined
- [ ] No breaking changes to existing types
- [ ] No TypeScript errors in existing code

---

### [x] Step: Create mock data generators
<!-- chat-id: 507581bb-5824-4824-8823-8726f0c32f57 -->

**Tasks**:
- Create `lib/supabase/mockData.ts`
- Generate 10-15 prompts with varied scores (20-95)
- Include all statuses: draft, active, saved, archived
- Add realistic content and metadata

**Contract Reference**: spec.md § 10.2

**Verification**:
- [x] Mock data includes diverse scenarios
- [x] All critique score ranges covered
- [x] Mock data loads in dev mode
- [x] No runtime errors

---

### Phase 2: Critique Engine

### [x] Step: Define critique types and rules structure
<!-- chat-id: f57280b0-fd75-4953-990b-54aaf21cf1c2 -->

**Tasks**:
- Create `lib/critique/types.ts` with critique-related types
- Define rule interfaces and contracts
- Create folder structure for rules

**Contract Reference**: spec.md § 2.2, § 4.1

**Verification**:
- [x] Types match CritiqueResult interface
- [x] Rule interface is extensible
- [x] No TypeScript errors

---

### [x] Step: Implement conciseness rule
<!-- chat-id: dc6b6374-dc39-4f4f-b894-512600b7a521 -->

**Tasks**:
- Create `lib/critique/rules/conciseness.ts`
- Detect filler words (very, really, just, basically, etc.)
- Measure word efficiency and information density
- Penalize redundancy and repetition
- Return score (0-25) with detailed feedback

**Contract Reference**: spec.md § 2.2

**Verification**:
- [x] Rule completes in < 100ms for 2000 chars
- [x] Scores are deterministic
- [x] Feedback is actionable
- [x] Edge cases handled (empty input, very long input)

---

### [x] Step: Implement specificity rule
<!-- chat-id: b4ce9cf7-1f0c-4ee2-9a7a-eb5cd2cd3a87 -->

**Tasks**:
- Create `lib/critique/rules/specificity.ts`
- Flag vague terms (good, nice, better, optimal)
- Reward concrete examples, numbers, constraints
- Check for clear success criteria
- Return score (0-25) with detailed feedback

**Contract Reference**: spec.md § 2.2

**Verification**:
- [x] Rule completes in < 100ms for 2000 chars
- [x] Scores are deterministic
- [x] Feedback is actionable
- [x] Edge cases handled

---

### [x] Step: Implement context rule
<!-- chat-id: 40049bd5-591a-4823-9cde-a008447d6a21 -->

**Tasks**:
- Create `lib/critique/rules/context.ts`
- Verify audience is defined
- Check for input/output specifications
- Assess background information sufficiency
- Return score (0-25) with detailed feedback

**Contract Reference**: spec.md § 2.2

**Verification**:
- [x] Rule completes in < 100ms for 2000 chars
- [x] Scores are deterministic
- [x] Feedback is actionable
- [x] Edge cases handled

---

### [x] Step: Implement task decomposition rule
<!-- chat-id: 0576712c-29fc-4edc-980a-48645daa2289 -->

**Tasks**:
- Create `lib/critique/rules/taskDecomposition.ts`
- Identify if multiple tasks exist
- Reward numbered steps and clear structure
- Penalize ambiguous scope
- Return score (0-25) with detailed feedback

**Contract Reference**: spec.md § 2.2

**Verification**:
- [x] Rule completes in < 100ms for 2000 chars
- [x] Scores are deterministic
- [x] Feedback is actionable
- [x] Edge cases handled

---

### [x] Step: Implement critique engine orchestrator
<!-- chat-id: b40c2091-25f9-490e-8e90-c66892500038 -->

**Tasks**:
- Create `lib/critique/engine.ts`
- Orchestrate all four rules
- Calculate total score (0-100)
- Aggregate feedback from all dimensions
- Ensure execution completes in < 1 second for 2000 chars

**Contract Reference**: spec.md § 2.2

**Verification**:
- [x] Total score equals sum of dimension scores
- [x] Engine completes in < 1 second
- [x] All dimensions are evaluated
- [x] Results are deterministic

---

### [x] Step: Create useCritique hook
<!-- chat-id: 55ec5520-297c-41d1-aae9-b2c3624b0e3b -->

**Tasks**:
- Create `hooks/useCritique.ts`
- Implement debounced critique calculation (500ms)
- Cache results in Supabase
- Provide loading and error states
- Support both immediate and debounced modes

**Contract Reference**: spec.md § 2.5

**Verification**:
- [x] Debouncing works correctly
- [x] Results cached in Supabase
- [x] Loading states exposed
- [x] No TypeScript errors

---

### Phase 3: Core UI Components

### [x] Step: Create CritiqueScore component
<!-- chat-id: 5aaf8403-e620-4aa5-9ae2-c1af5735427f -->

**Tasks**:
- Create `components/librarian/CritiqueScore.tsx`
- Display score with color coding (red/yellow/green)
- Animated progress bar using Framer Motion
- Responsive sizing

**Contract Reference**: spec.md § 2.3, requirements.md § 4.4

**Verification**:
- [x] Colors match score ranges in spec
- [x] Animation runs at 60fps
- [x] Renders without errors
- [x] Responsive on all viewports

---

### [x] Step: Create CritiqueDetails component
<!-- chat-id: b8f9ce9c-4c37-46de-8700-a488e062866d -->

**Tasks**:
- Create `components/librarian/CritiqueDetails.tsx`
- Expandable/collapsible sections for each dimension
- Display issues and suggestions lists
- Smooth expand/collapse animation

**Contract Reference**: spec.md § 2.3, requirements.md § 4.4

**Verification**:
- [x] Expand/collapse works smoothly
- [x] All dimensions displayed
- [x] Feedback is readable and formatted
- [x] Renders without errors

---

### [x] Step: Create SeedlingCard component
<!-- chat-id: 01ae0584-f841-4433-9f6c-07a14c94eded -->

**Tasks**:
- Create `components/librarian/SeedlingCard.tsx`
- Extend existing PromptCard pattern
- Display prompt title, snippet, critique score
- Include seedling icon (🌱)
- Add "Save to Greenhouse" button
- Make card clickable to navigate to editor

**Contract Reference**: spec.md § 2.3, requirements.md § 4.2

**Verification**:
- [x] Follows existing PromptCard conventions
- [x] Critique score integrated with CritiqueScore component
- [x] Click navigation works
- [x] Responsive design
- [x] No TypeScript errors

---

### [x] Step: Create GreenhouseCard component
<!-- chat-id: 148b37b0-2a94-4a47-90cc-6fdbdf2bda0d -->

**Tasks**:
- Create `components/librarian/GreenhouseCard.tsx`
- Display prompt title, description/snippet, tags
- Include flower icon (🌺)
- Show critique score badge
- Add action buttons (Run, Copy, Edit)
- Support search highlighting

**Contract Reference**: spec.md § 2.3, requirements.md § 4.3

**Verification**:
- [x] Visual design matches garden theme
- [x] Tags display with colors
- [x] Action buttons work
- [x] Search highlighting works
- [x] Responsive design

---

### [x] Step: Create StatusTransitionButton component
<!-- chat-id: 7032a714-4b5c-454c-9b5b-c56caa3551b6 -->

**Tasks**:
- Create `components/librarian/StatusTransitionButton.tsx`
- Handle "Save to Greenhouse" action
- Show loading state during transition
- Provide success/error feedback
- Optimistic UI update

**Contract Reference**: spec.md § 2.3

**Verification**:
- [ ] Button triggers status transition
- [ ] Loading state displays
- [ ] Optimistic update feels responsive
- [ ] Error handling works

---

### Phase 4: Section Components

### [x] Step: Create SeedlingSection component
<!-- chat-id: ab163059-14ca-4aa4-93e8-95de64d1ceb4 -->

**Tasks**:
- Create `components/librarian/SeedlingSection.tsx`
- Implement responsive grid layout (2-3 columns)
- Add sort controls (Recent, Score low-to-high, Score high-to-low)
- Add filter controls (Score range)
- Implement loading, error, and empty states
- Render SeedlingCard components

**Contract Reference**: spec.md § 2.3, requirements.md § 4.2

**Verification**:
- [ ] Grid layout responsive
- [ ] Sorting works correctly
- [ ] Filtering works correctly
- [ ] Empty state displays appropriately
- [ ] Loading state smooth

---

### [x] Step: Create GreenhouseSection component
<!-- chat-id: 0f34ef61-18af-4f67-9f9d-0e79d0bed69e -->

**Tasks**:
- Create `components/librarian/GreenhouseSection.tsx`
- Implement responsive grid layout (2-3 columns)
- Integrate SearchInput component
- Add tag filters (multi-select)
- Add sort controls (Recent, Title A-Z, Score high-to-low)
- Implement loading, error, and empty states with encouragement message
- Render GreenhouseCard components

**Contract Reference**: spec.md § 2.3, requirements.md § 4.3

**Verification**:
- [ ] Grid layout responsive
- [ ] Search integration works
- [ ] Tag filtering works (multi-select)
- [ ] Sorting works correctly
- [ ] Empty state displays with encouragement

---

### [x] Step: Create usePromptStatus hook
<!-- chat-id: f6c56f08-7ff5-4692-8bba-b15df0e3765e -->

**Tasks**:
- Create `hooks/usePromptStatus.ts`
- Implement status transition logic
- Update both Supabase and Drive metadata
- Optimistic UI updates
- Rollback on failure

**Contract Reference**: spec.md § 2.5

**Verification**:
- [x] Status transitions work reliably
- [x] Optimistic updates feel responsive
- [x] Rollback works on failure
- [x] Both Supabase and Drive updated

---

### [x] Step: Create useLibrarian hook
<!-- chat-id: 79dc2abc-f4be-4ae4-bc61-5285b58a0618 -->

**Tasks**:
- Create `hooks/useLibrarian.ts`
- Fetch prompts from Supabase (with Drive fallback)
- Filter by status (active/saved)
- Handle loading/error states
- Integrate with existing useLibrary where possible

**Contract Reference**: spec.md § 2.5

**Verification**:
- [x] Fetches prompts correctly
- [x] Filters by status work
- [x] Loading/error states exposed
- [x] No TypeScript errors

---

### Phase 5: Main View and Routing

### [x] Step: Create LibrarianView component
<!-- chat-id: 02e6e409-319f-40a7-bdc1-f033d07d2f63 -->

**Tasks**:
- Create `components/librarian/LibrarianView.tsx`
- Implement two-column layout (Seedling left, Greenhouse right)
- Coordinate SeedlingSection and GreenhouseSection
- Handle global loading/error states
- Add page header with garden metaphor messaging
- Make responsive (stacked on mobile)

**Contract Reference**: spec.md § 2.3, requirements.md § 6.1

**Verification**:
- [x] Two-column layout on desktop
- [x] Stacked layout on mobile
- [x] Both sections render correctly
- [x] Loading/error states work
- [x] Visual consistency with existing pages

---

### [x] Step: Create librarian page route
<!-- chat-id: aab73d58-f8eb-4cf4-9a4b-7f84fe95348d -->

**Tasks**:
- Create `app/librarian/page.tsx`
- Import and render LibrarianView
- Set up metadata and SEO
- Handle authentication if needed

**Contract Reference**: spec.md § 3.1

**Verification**:
- [x] Page accessible at `/librarian`
- [x] Renders without console errors
- [x] Metadata set correctly
- [x] Authentication handled

---

### [x] Step: Add navigation links to Header/Sidebar
<!-- chat-id: 6c047824-40a4-4766-bc29-f2abce14b294 -->

**Tasks**:
- Update `components/layout/Header.tsx` with `/librarian` link
- Update `components/layout/Sidebar.tsx` if applicable
- Use appropriate icon and label
- Maintain visual consistency

**Contract Reference**: spec.md § 3.2

**Verification**:
- [x] Navigation link visible in header
- [x] Link navigates to `/librarian`
- [x] Icon and label appropriate
- [x] Visual consistency maintained

---

### [x] Step: Create useSupabaseSync hook
<!-- chat-id: 6c8d1daf-0ead-446a-8852-0a0898fe2d19 -->

**Tasks**:
- Create `hooks/useSupabaseSync.ts`
- Implement Drive → Supabase sync logic
- Support manual trigger and auto-sync (5 min interval)
- Handle sync conflicts (Drive is source of truth)
- Provide sync status and progress

**Contract Reference**: spec.md § 2.1, § 2.5

**Verification**:
- [x] Sync works on page load (if needed)
- [x] Manual trigger works
- [x] Auto-sync every 5 minutes
- [x] Conflicts resolved correctly
- [x] Progress indicators work

---

### [x] Step: Create sync API endpoint
<!-- chat-id: 851d09dd-670d-447e-aad1-63c9ab167f4a -->

**Tasks**:
- Create `app/api/librarian/sync/route.ts`
- Implement POST endpoint for manual sync
- Fetch prompts from Google Drive
- Sync to Supabase
- Return sync results (count, errors)

**Contract Reference**: spec.md § 4.3

**Verification**:
- [x] Endpoint responds to POST requests
- [x] Syncs Drive → Supabase
- [x] Returns correct response format
- [x] Error handling works

---

### [x] Step: Create critique API endpoint
<!-- chat-id: 851d09dd-670d-447e-aad1-63c9ab167f4a -->

**Tasks**:
- Create `app/api/librarian/critique/route.ts`
- Implement POST endpoint for server-side critique
- Use critique engine to calculate score
- Store result in Supabase
- Return critique result

**Contract Reference**: spec.md § 4.3

**Verification**:
- [x] Endpoint responds to POST requests
- [x] Critique calculated correctly
- [x] Result stored in Supabase
- [x] Returns correct response format

---

### Phase 6: Polish and Edge Cases

### [x] Step: Add status transition animations
<!-- chat-id: 6355aeb1-891e-4700-92a4-f84e0927a158 -->

**Tasks**:
- Implement smooth animations when cards move between sections
- Use Framer Motion layout animations
- Add exit animations for cards
- Ensure 60fps performance

**Contract Reference**: spec.md § 5 Phase 6

**Verification**:
- [x] Animations smooth at 60fps
- [x] Cards animate when status changes
- [x] No visual glitches
- [x] Performance acceptable

---

### [x] Step: Improve accessibility
<!-- chat-id: f94478fd-8341-471b-b981-f5325e646573 -->

**Tasks**:
- Add ARIA labels to all interactive elements
- Implement keyboard navigation (Tab, Enter, Escape)
- Add focus indicators
- Ensure color contrast meets WCAG 2.1 AA
- Test with screen reader

**Contract Reference**: spec.md § 5 Phase 6

**Verification**:
- [x] ARIA labels present
- [x] Keyboard navigation works
- [x] Focus indicators visible
- [x] Color contrast acceptable
- [x] Screen reader compatible

---

### [x] Step: Add error boundaries
<!-- chat-id: 17c61ab3-9f15-4c3e-b65f-95a8cd3a60c2 -->

**Tasks**:
- Create error boundary components for sections
- Graceful degradation on component errors
- User-friendly error messages
- Retry mechanisms

**Contract Reference**: spec.md § 5 Phase 6

**Verification**:
- [x] Errors don't crash entire page
- [x] Error messages user-friendly
- [x] Retry works
- [x] Error logged for debugging

---

### [x] Step: Implement optimistic UI updates
<!-- chat-id: f26d4bdb-47a5-435e-9f6e-5e9f603bc69d -->

**Tasks**:
- Add optimistic updates for status transitions
- Immediate UI feedback for user actions
- Rollback mechanism on failure
- Loading states for async operations

**Contract Reference**: spec.md § 5 Phase 6

**Verification**:
- [x] UI updates immediately
- [x] Rollback works on failure
- [x] User feedback clear
- [x] No visual glitches

---

### [x] Step: Performance optimization
<!-- chat-id: 0c85ab42-9110-44b5-bcb0-2a4542761283 -->

**Tasks**:
- Add React.memo for expensive components
- Implement useMemo/useCallback where appropriate
- Lazy load components if needed
- Profile and optimize slow paths

**Contract Reference**: spec.md § 5 Phase 6

**Verification**:
- [x] Page loads in < 2 seconds with 50 prompts
- [x] Critique < 1 second
- [x] Search < 300ms
- [x] No performance regressions

---

### [x] Step: Responsive design testing
<!-- chat-id: 266b53a1-19ca-4bd3-afa9-243cf9b4a52e -->

**Tasks**:
- Test on mobile (320px - 767px)
- Test on tablet (768px - 1023px)
- Test on desktop (1024px+)
- Test on ultra-wide (1920px+)
- Fix any layout issues

**Contract Reference**: spec.md § 6.2

**Verification**:
- [x] Mobile layout works (stacked)
- [x] Tablet layout works (adjusted spacing)
- [x] Desktop layout works (full two-column)
- [x] Ultra-wide constrained properly

---

### Phase 7: Testing and Verification

### [x] Step: Run linting and type checking
<!-- chat-id: 6ee7cabf-b1df-48e3-a1d6-8eee22b2088d -->

**Tasks**:
- Run `npm run lint` and fix all errors
- Run type checking (tsc or equivalent)
- Fix all TypeScript errors
- Ensure no warnings remain

**Contract Reference**: spec.md § 6.1

**Verification**:
- [x] `npm run lint` passes with no errors
- [x] Type checking passes
- [x] No warnings in console

---

### [x] Step: Build and verify no regressions
<!-- chat-id: 34fa34b4-2f81-4b7d-ab91-73926e1b12a7 -->

**Tasks**:
- Run `npm run build`
- Test existing `/library` page
- Test existing `/gallery` page
- Verify Google Drive integration still works
- Verify authentication still works

**Contract Reference**: spec.md § 6.2

**Verification**:
- [x] Build succeeds
- [x] `/library` page works
- [x] `/gallery` page works
- [x] Drive integration unchanged
- [x] Auth flow unchanged

---

### [x] Step: Manual testing of all features
<!-- chat-id: 7509220b-c59a-434d-9203-97bc76e5897e -->

**Tasks**:
- Test Seedling section (display, sort, filter)
- Test Greenhouse section (display, search, filter)
- Test status transitions
- Test critique engine
- Test sync operations
- Test responsive design
- Test performance (load times, animations)

**Contract Reference**: spec.md § 6.2

**Verification**:
- [x] All manual tests pass (see spec.md § 6.2 checklist)
- [x] No critical bugs found
- [x] Performance meets targets

---

### [x] Step: Update documentation (if needed)
<!-- chat-id: 78c641d3-8b20-4538-a1b6-e8c1fc76890d -->

**Tasks**:
- Document Supabase setup process
- Add environment variable instructions to README (if appropriate)
- Document critique engine rules (if needed for developers)

**Contract Reference**: spec.md § 5 Phase 7

**Note**: Only create documentation if explicitly needed for setup or if user requests it.

**Verification**:
- [x] Setup instructions clear
- [x] Environment variables documented

---

## Final Verification

**Before marking complete**:
- [ ] All tests pass (`npm run lint && npm run type-check && npm run build`)
- [ ] `/librarian` page accessible and functional
- [ ] Seedlings display active prompts with critique scores
- [ ] Greenhouse displays saved prompts with search/filter
- [ ] Status transitions work reliably
- [ ] Critique engine provides accurate feedback
- [ ] Supabase integration persists data correctly
- [ ] Zero regressions in existing features
- [ ] Performance meets targets (< 2s load, < 1s critique, 60fps animations)
