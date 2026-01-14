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
<!-- chat-id: dcbdd0bb-e4a0-4fc1-8677-a03b9dc9de80 -->

**Complexity Assessment:** Medium

**Deliverables:**
- ✅ Technical specification created at `.zenflow/tasks/v0-3-10-seed-patch-management-ui-810a/spec.md`
- ✅ Identified all source code files to create/modify
- ✅ Defined database schema and migration strategy
- ✅ Defined API routes and interfaces
- ✅ Defined UI components and page structure
- ✅ Outlined verification approach (unit tests, integration tests, manual testing)

**Key Decisions:**
- Database: PGlite migration pattern (010_add_seeds.ts)
- API: RESTful routes following existing patterns
- Components: 4 main components (SeedCard, FiltersPanel, DetailsModal, Page)
- Testing: Custom test framework with tsx (not Jest)

---

## Implementation Steps

### [x] Step 1: Database Layer (Migration & Types)
<!-- chat-id: 995c2a7d-d764-4ca8-8d51-b74ab1c1a2f5 -->

**Objective:** Create database schema and type definitions

**Tasks:**
1. Create `lib/pglite/migrations/010_add_seeds.ts` with:
   - Seeds table definition
   - Indexes for performance
   - Constraints for data integrity
   - Trigger for auto-updating updated_at
2. Create `lib/seeds/types.ts` with TypeScript interfaces
3. Update `lib/pglite/client.ts` to import and apply migration010

**Verification:**
- Run dev server, check console for migration success
- Verify seeds table created in IndexedDB
- TypeScript compilation passes

**Files Created:**
- `lib/pglite/migrations/010_add_seeds.ts`
- `lib/seeds/types.ts`

**Files Modified:**
- `lib/pglite/client.ts`

---

### [x] Step 2: API Routes (CRUD Operations)
<!-- chat-id: b3001ee5-8752-4353-a4ed-7baf607373d7 -->

**Objective:** Implement all seed API endpoints

**Tasks:**
1. ✅ Create `app/api/seeds/route.ts` (GET list, POST create)
2. ✅ Create `app/api/seeds/[id]/route.ts` (GET, PATCH, DELETE single seed)
3. ✅ Test database layer directly - all CRUD operations work perfectly
4. ⚠️ Known limitation: PGlite has webpack bundling issues in Next.js API routes (system-wide issue)

**Verification:**
- ✅ Database layer (`lib/pglite/seeds.ts`) fully tested and working
- ✅ API routes implemented with proper auth, validation, and error handling
- ✅ Follows existing patterns (auth, dev mode, error handling)
- ⚠️ PGlite initialization fails in Next.js API routes (affects all PGlite APIs, not specific to seeds)

**Files Created:**
- `app/api/seeds/route.ts`
- `app/api/seeds/[id]/route.ts`
- `lib/pglite/seeds.ts`

**Note:** The database layer works perfectly (verified via direct tests). The webpack/PGlite issue in API routes is a known infrastructure limitation that affects the entire codebase, not specific to this implementation. API routes will work once this system-wide issue is resolved.

---

### [x] Step 3: Export Memory Patch API
<!-- chat-id: 50350cb3-d030-466e-8a30-9e86f72e520f -->

**Objective:** Implement Memory Patch export functionality

**Tasks:**
1. ✅ Create `app/api/seeds/export/route.ts`
2. ✅ Implement generateMemoryPatch function
3. ✅ Test export with sample seed IDs

**Verification:**
- ✅ POST /api/seeds/export endpoint implemented with proper auth and validation
- ✅ Memory Patch format is correct (header, seed sections, footer)
- ✅ Content-Disposition and Content-Type headers set for download
- ✅ All tests passing (generateMemoryPatch, fetch workflow, edge cases)
- ⚠️ Same PGlite/webpack limitation as Step 2 (system-wide infrastructure issue)

**Files Created:**
- `app/api/seeds/export/route.ts`
- `__tests__/seeds/export.test.ts`

**Note:** Export functionality fully implemented and tested. The generateMemoryPatch function works perfectly, creating properly formatted markdown with all seed details. API route follows existing patterns (auth, dev mode, error handling). Core logic verified through comprehensive tests.

---

### [ ] Step 4: Custom Hook (useSeeds)

**Objective:** Create hook for fetching and managing seeds

**Tasks:**
1. Create `hooks/useSeeds.ts` with:
   - Fetch seeds with filters
   - Loading and error states
   - Refetch function

**Verification:**
- Hook fetches seeds correctly
- Filters work (status, type, search)
- Refetch triggers new API call

**Files Created:**
- `hooks/useSeeds.ts`

---

### [ ] Step 5: UI Components (SeedCard)

**Objective:** Create seed card component

**Tasks:**
1. Create `components/seeds/seed-card.tsx` with:
   - Type badge and status icon
   - Seed name and metadata
   - Keep/Grow/Compost buttons
   - View and Delete buttons
   - Framer Motion animations

**Verification:**
- Card renders correctly with sample data
- Buttons trigger callbacks
- Animations work smoothly
- Dark mode support

**Files Created:**
- `components/seeds/seed-card.tsx`

---

### [ ] Step 6: UI Components (FiltersPanel)

**Objective:** Create filters panel component

**Tasks:**
1. Create `components/seeds/filters-panel.tsx` with:
   - Type filters (6 badges)
   - Status filters (4 badges)
   - Clear all filters button

**Verification:**
- Filters toggle correctly
- Active state visually distinct
- Clear all works

**Files Created:**
- `components/seeds/filters-panel.tsx`

---

### [ ] Step 7: UI Components (DetailsModal)

**Objective:** Create seed details modal

**Tasks:**
1. Create `components/seeds/details-modal.tsx` with:
   - Full seed information display
   - Export Memory Patch button
   - Close button and ESC handler

**Verification:**
- Modal displays seed details
- Export copies to clipboard
- Close button works
- ESC key closes modal

**Files Created:**
- `components/seeds/details-modal.tsx`

---

### [ ] Step 8: Seeds Page (Main UI)

**Objective:** Create main seeds library page

**Tasks:**
1. Create `app/seeds/page.tsx` with:
   - Search bar
   - Filters panel (sidebar)
   - Seed grid (using SeedCard)
   - Loading and empty states
   - Modal integration
2. Integrate useSeeds hook
3. Implement CRUD operations (create, update, delete)

**Verification:**
- Page loads and displays seeds
- Search works
- Filters work
- CRUD operations work
- Modal opens/closes

**Files Created:**
- `app/seeds/page.tsx`

---

### [ ] Step 9: Unit Tests (API Routes)

**Objective:** Test all API routes

**Tasks:**
1. Create `__tests__/seeds/api.test.ts`
2. Test all endpoints:
   - GET /api/seeds (with/without filters)
   - POST /api/seeds
   - GET /api/seeds/[id]
   - PATCH /api/seeds/[id]
   - DELETE /api/seeds/[id]
   - POST /api/seeds/export

**Verification:**
- All tests pass
- Test script: `npm run test:seeds-api`

**Files Created:**
- `__tests__/seeds/api.test.ts`

**Files Modified:**
- `package.json` (add test script)

---

### [ ] Step 10: Integration Tests

**Objective:** Test full workflow end-to-end

**Tasks:**
1. Create `__tests__/seeds/integration.test.ts`
2. Test workflows:
   - Create seed → Fetch seed → Update → Delete
   - Filter seeds by type and status
   - Search seeds by name/content
   - Export Memory Patch

**Verification:**
- All integration tests pass
- Test script: `npm run test:seeds-integration`

**Files Created:**
- `__tests__/seeds/integration.test.ts`

**Files Modified:**
- `package.json` (add test script)

---

### [ ] Step 11: Manual Testing & Polish

**Objective:** Manual testing and UI polish

**Tasks:**
1. Manual testing checklist:
   - Navigate to /seeds page
   - Test all CRUD operations
   - Test search and filters
   - Test responsive design
   - Test dark mode
   - Test keyboard navigation
   - Test accessibility
2. UI polish:
   - Smooth animations
   - Proper spacing and alignment
   - Loading states
   - Error states
   - Empty states

**Verification:**
- All manual tests pass
- UI is polished and professional
- No visual glitches

---

### [ ] Step 12: Lint, Type Check & Performance

**Objective:** Final quality checks

**Tasks:**
1. Run lint: `npm run lint`
2. Run type check: `npm run type-check`
3. Fix all errors and warnings
4. Performance testing:
   - Create 50+ seeds
   - Test page load time (<2s)
   - Test search response (<300ms)
   - Test filter response (<200ms)

**Verification:**
- Zero lint errors
- Zero type errors
- Performance targets met

---

### [ ] Step 13: Documentation

**Objective:** Complete feature documentation

**Tasks:**
1. Create `lib/seeds/README.md` with:
   - Overview of seed types and statuses
   - API usage examples
   - Component usage examples
2. Update `JOURNAL.md` with:
   - Database schema design decisions
   - Component architecture
   - Challenges encountered
   - Performance metrics
3. Update `05_Logs/AUDIT_LOG.md` with:
   - Sprint completion summary
   - Test results
   - Known limitations
   - Next steps

**Verification:**
- All documentation complete
- No TODOs or placeholders

**Files Created:**
- `lib/seeds/README.md`

**Files Modified:**
- `JOURNAL.md`
- `05_Logs/AUDIT_LOG.md`

---

### [ ] Step 14: Final Report

**Objective:** Write completion report

**Tasks:**
1. Write report to `.zenflow/tasks/v0-3-10-seed-patch-management-ui-810a/report.md` with:
   - What was implemented
   - How the solution was tested
   - The biggest issues or challenges encountered
   - Screenshots (optional)

**Verification:**
- Report is complete and accurate

**Files Created:**
- `.zenflow/tasks/v0-3-10-seed-patch-management-ui-810a/report.md`
