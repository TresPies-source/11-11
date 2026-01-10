# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Workflow Steps

### [x] Step: Requirements

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: db715544-3e1a-4867-b639-21fbaa68a6a4 -->

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
<!-- chat-id: 1f9a7653-a276-4888-a9c3-dcb42949092c -->

Create a detailed implementation plan based on `{@artifacts_path}/spec.md`.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps
3. Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function) or too broad (entire feature).

If the feature is trivial and doesn't warrant full specification, update this workflow to remove unnecessary steps and explain the reasoning to the user.

Save to `{@artifacts_path}/plan.md`.

### [x] Step: Repository Hygiene & Dependencies
<!-- chat-id: 104ddec4-41b0-45f2-a0ec-de29049fe21d -->

**Files**: `.gitignore`, `package.json`

**Tasks**:
1. Check if `.gitignore` exists, create or update to add `05_Logs/AUDIT_LOG.md`
2. Run `git status` to verify AUDIT_LOG.md is untracked
3. Install `gray-matter` dependency: `npm install gray-matter`

**Verification**:
```bash
git status | findstr AUDIT_LOG  # Should show as untracked
npm list gray-matter             # Should show installed version
```

---

### [x] Step: Type Definitions
<!-- chat-id: 48e11acd-76f6-428e-b0d6-c8dc0bcdf519 -->

**Files**: `lib/types.ts`

**Tasks**:
1. Add `PromptMetadata` interface for frontmatter fields
2. Add `PromptFile` interface extending `DriveFile`

**Reference**: See spec.md Section 2.2.1

**Verification**:
```bash
npm run type-check  # Should pass with 0 errors
```

---

### [x] Step: Custom Hooks - useLibrary
<!-- chat-id: 656b7e85-90de-4201-b382-d7bc23bb1588 -->

**Files**: `hooks/useLibrary.ts` (new)

**Tasks**:
1. Create `useLibrary.ts` hook
2. Fetch prompts from `/api/drive/files?folder=prompts`
3. For each file, fetch content from `/api/drive/content/[fileId]`
4. Parse frontmatter using `gray-matter`
5. Return prompts array with metadata, loading state, and error state

**Dependencies**: gray-matter, lib/types.ts

**Verification**:
- Hook compiles without TypeScript errors
- Console log output shows parsed frontmatter

---

### [ ] Step: Custom Hooks - useGallery

**Files**: `hooks/useGallery.ts` (new)

**Tasks**:
1. Create `useGallery.ts` hook
2. Use `useLibrary()` internally
3. Filter prompts where `metadata?.public === true`
4. Return filtered prompts with same state structure

**Dependencies**: hooks/useLibrary.ts

**Verification**:
- Hook compiles without TypeScript errors
- Only public prompts are returned

---

### [ ] Step: Shared PromptCard Component

**Files**: `components/shared/PromptCard.tsx` (new)

**Tasks**:
1. Create PromptCard component with variant prop: "library" | "gallery"
2. Display title (from metadata or filename)
3. Display description (from metadata or first few lines)
4. Display tags as pill badges
5. Implement "Quick Copy" button (copies raw content to clipboard)
6. Implement variant-specific action button:
   - Library: "Run in Chat" (navigates with URL param)
   - Gallery: "Fork to Library" (shows toast for MVP)
7. Add hover effects and Tailwind styling

**Reference**: spec.md Section 2.2.4

**Verification**:
- Component renders in dev environment
- Quick Copy works (test with browser console)
- Buttons trigger correct actions

---

### [ ] Step: Library Page - Route and View

**Files**: `app/library/page.tsx` (new), `components/library/LibraryView.tsx` (new)

**Tasks**:
1. Create `app/library/page.tsx` as Server Component
2. Create `components/library/LibraryView.tsx` as Client Component
3. Use `useLibrary()` hook to fetch prompts
4. Render grid of PromptCard components (variant="library")
5. Implement responsive grid layout (1/2/3 columns)
6. Add loading state with skeleton cards
7. Add empty state message
8. Add error state handling

**Dependencies**: hooks/useLibrary.ts, components/shared/PromptCard.tsx

**Verification**:
```bash
npm run dev
# Navigate to http://localhost:3000/library
# Verify prompts display correctly
# Test responsive layout (resize browser)
```

---

### [ ] Step: Gallery Page - Route and View

**Files**: `app/gallery/page.tsx` (new), `components/gallery/GalleryView.tsx` (new)

**Tasks**:
1. Create `app/gallery/page.tsx` as Server Component
2. Create `components/gallery/GalleryView.tsx` as Client Component
3. Use `useGallery()` hook to fetch public prompts
4. Render grid of PromptCard components (variant="gallery")
5. Use same layout/loading/error/empty states as Library
6. Customize empty state message for Gallery

**Dependencies**: hooks/useGallery.ts, components/shared/PromptCard.tsx

**Verification**:
```bash
# Navigate to http://localhost:3000/gallery
# Verify only public prompts display
# Test Fork button shows placeholder toast
```

---

### [ ] Step: Header Navigation Update

**Files**: `components/layout/Header.tsx`

**Tasks**:
1. Add Library and Gallery navigation links
2. Use `usePathname()` for active state detection
3. Apply active styling (blue accent) to current page link
4. Position links between logo and WorkspaceSelector
5. Ensure responsive layout on mobile

**Reference**: spec.md Section 2.3

**Verification**:
- Links appear in header
- Clicking navigates to correct pages
- Active link is highlighted
- Mobile layout works correctly

---

### [ ] Step: Final Verification & Screenshots

**Tasks**:
1. Run `npm run lint` and fix any ESLint warnings
2. Run `npm run type-check` and fix any TypeScript errors
3. Run `npm run dev` and test all functionality
4. Capture screenshots:
   - `git status` showing AUDIT_LOG.md untracked
   - `/library` page with prompt cards
   - `/gallery` page with public prompt cards
5. Update JOURNAL.md if exists (document implementation)

**Verification Checklist**:
- [ ] `git status` shows AUDIT_LOG.md as untracked
- [ ] `/library` page loads and displays prompts
- [ ] `/gallery` page loads and displays public prompts
- [ ] Quick Copy button works
- [ ] Run in Chat button works
- [ ] Fork button shows placeholder message
- [ ] Header navigation links work
- [ ] Active nav link is highlighted
- [ ] Zero TypeScript errors
- [ ] Zero ESLint warnings
- [ ] All screenshots captured

**Commands**:
```bash
npm run lint
npm run type-check
npm run dev
git status
```
