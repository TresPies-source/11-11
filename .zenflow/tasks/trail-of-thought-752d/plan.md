# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: c06c0815-44f3-4341-b5db-52754277a794 -->

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: dba32531-13fb-48fe-8058-15bb1ba2ad95 -->

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
<!-- chat-id: 8948aec9-f1da-4978-92b3-0579f9526fb1 -->

Create a detailed implementation plan based on `{@artifacts_path}/spec.md`.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps
3. Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function) or too broad (entire feature).

If the feature is trivial and doesn't warrant full specification, update this workflow to remove unnecessary steps and explain the reasoning to the user.

Save to `{@artifacts_path}/plan.md`.

---

## Implementation Tasks

### Phase 1: Core Component Development

### [x] Task 1: Create Hub Utility Functions
<!-- chat-id: 19ca3bb9-abd2-4571-84ab-d1a5e6e19a06 -->
Create `lib/hub/utils.ts` with utility functions for the Trail of Thought panel.

**Implementation:**
- Create `formatRelativeTime(isoString: string): string` - converts ISO timestamps to relative time (e.g., "2 days ago")
- Create `getArtifactIcon(type: ArtifactType): LucideIcon` - returns appropriate icon component (MessageSquare, FileText, Sprout, File)
- Create `getRelationshipLabel(relationship: RelationshipType): string` - maps relationship types to human-readable labels
- Create `getArtifactNavigationPath(type: ArtifactType, id: string): string` - generates navigation URLs for each artifact type

**Reference:**
- Spec Section 5.4 (Utility Functions)
- Example: `components/dashboard/ActivityItem.tsx` for relative time formatting
- Types: `lib/hub/types.ts` for ArtifactType and RelationshipType

**Verification:**
- TypeScript compiles without errors
- All functions return expected types
- Relative time formatting matches existing patterns

---

### [x] Task 2: Create Lineage Data Hook
<!-- chat-id: 02131b73-c91e-4a2c-b3d1-6cd0384613dd -->
Create `hooks/hub/useLineage.ts` for fetching lineage data from the API.

**Implementation:**
- Create `useLineage` custom hook with `UseLineageOptions` parameter
- Implement fetch logic using native fetch API (no SWR/React Query)
- Handle loading, error, and success states
- Provide `refetch()` function for manual retry
- Return `UseLineageReturn` interface with lineage data, loading state, error, count

**Reference:**
- Spec Section 5.1 (Hook: useLineage)
- API Endpoint: `/api/hub/lineage/[type]/[id]`
- Example Pattern: `hooks/useSeeds.ts`
- Response Format: Spec Section 4.2 (API Response)

**Verification:**
- TypeScript compiles without errors
- Hook fetches data on mount
- Error handling works correctly
- Manual refetch capability functions

---

### [x] Task 3: Create TrailOfThoughtPanel Component
<!-- chat-id: 99ba2c34-52f7-4674-9a37-88b0ff06c1e6 -->
Create `components/hub/TrailOfThoughtPanel.tsx` with full UI implementation.

**Implementation:**
- Create component with `TrailOfThoughtPanelProps` interface
- Implement collapsible header with count badge
- Add loading state (skeleton or spinner)
- Add error state with retry button
- Add empty state with friendly message
- Add populated state with vertical timeline rendering
- Use framer-motion for smooth expand/collapse animations
- Use lucide-react icons for artifact types
- Implement click handlers for navigation to artifact pages

**Reference:**
- Spec Section 5.2 (Component: TrailOfThoughtPanel)
- Spec Section 5.3 (Visual Design)
- Color Scheme: Dark mode colors from spec
- Icons: MessageSquare, FileText, Sprout, File, ChevronDown, ChevronRight

**Verification:**
- Component renders without errors
- All UI states work (loading, error, empty, populated)
- Collapse/expand animation is smooth
- Navigation links generate correct URLs
- TypeScript compiles without errors

---

### Phase 2: Integration

### [x] Task 4: Integrate into PromptCard
<!-- chat-id: 82b0cfc6-325e-463a-9875-79827e51f0e9 -->
Add TrailOfThoughtPanel to Prompt cards in the Library.

**Implementation:**
- Open `components/shared/PromptCard.tsx`
- Import TrailOfThoughtPanel component
- Add panel after action buttons, before closing div
- Pass `artifactType="prompt"` and `artifactId={prompt.id}`
- Add `className="mt-2"` for spacing

**Reference:**
- Spec Section 6.1 (PromptCard Integration)
- File: `components/shared/PromptCard.tsx`

**Verification:**
- Panel appears at bottom of prompt cards
- Data loads correctly when card is expanded
- No layout conflicts with existing elements
- Navigation works when clicking lineage nodes

---

### [x] Task 5: Integrate into SeedCard
<!-- chat-id: 161a10c3-df90-4d66-a047-92b965912efb -->
Add TrailOfThoughtPanel to Seed cards in the Seeds page.

**Implementation:**
- Open `components/seeds/seed-card.tsx`
- Import TrailOfThoughtPanel component
- Add panel after action buttons, before closing div
- Pass `artifactType="seed"` and `artifactId={seed.id}`
- Add `className="mt-2"` for spacing

**Reference:**
- Spec Section 6.2 (SeedCard Integration)
- File: `components/seeds/seed-card.tsx`

**Verification:**
- Panel appears at bottom of seed cards
- Data loads correctly when card is expanded
- Visual style matches seed card aesthetic
- No layout conflicts

---

### [x] Task 6: Integrate into Dojo Session Page
<!-- chat-id: eb9615dd-dbd4-4381-a723-1158969b3c99 -->
Add TrailOfThoughtPanel to Dojo session headers.

**Implementation:**
- Open `app/dojo/[sessionId]/page.tsx`
- Import TrailOfThoughtPanel component
- Add panel in header section, after "Save Session" button
- Pass `artifactType="session"` and `artifactId={sessionId}`
- Add conditional rendering: only show if `sessionId !== 'new'`
- Set `defaultOpen={false}`

**Reference:**
- Spec Section 6.3 (Dojo Session Integration)
- File: `app/dojo/[sessionId]/page.tsx`

**Verification:**
- Panel appears in session header for existing sessions
- Panel does NOT appear for new sessions (sessionId === 'new')
- Data loads correctly
- Panel doesn't interfere with session title input or action buttons

---

### [x] Task 7: Integrate into Workbench
<!-- chat-id: 60e4300e-ee5a-4e94-ac52-b08ab7ebc2aa -->
Add TrailOfThoughtPanel to Workbench for file-based tabs.

**Implementation:**
- Open `components/workbench/WorkbenchView.tsx`
- Import TrailOfThoughtPanel component
- Add panel in Editor Panel layout, before ActionBar
- Add conditional rendering: only show if `activeTab?.isFileBased && activeTab?.fileId`
- Pass `artifactType="file"` and `artifactId={activeTab.fileId}`
- Wrap in border-top div for visual separation

**Reference:**
- Spec Section 6.4 (Workbench Integration)
- File: `components/workbench/WorkbenchView.tsx`

**Verification:**
- Panel appears only for saved, file-based tabs
- Panel does NOT appear for welcome tab or ephemeral tabs
- Data loads correctly with file IDs
- No layout conflicts with Editor or ActionBar

---

### Phase 3: Polish & Verification

### [x] Task 8: Run Linting and Type Checking
<!-- chat-id: 8f93626d-ae0f-4e10-859c-668c26e0e30b -->
Run project linting and type checking to ensure code quality.

**Commands:**
```bash
pnpm type-check
pnpm lint
```

**Actions:**
- Fix any TypeScript errors
- Fix any linting issues
- Ensure all imports are used
- Ensure no console.log statements remain

**Verification:**
- `pnpm type-check` passes with 0 errors
- `pnpm lint` passes with 0 errors
- Code follows project conventions

---

### [x] Task 9: Manual Testing and Edge Cases
<!-- chat-id: 9968129e-61e7-4e15-8af5-61a35b3b0934 -->
Test all integration points and edge cases.

**Test Cases:**
1. **PromptCard:** Test with prompt that has lineage, empty lineage, and loading states
2. **SeedCard:** Test with seed that has lineage, empty lineage, and loading states
3. **Dojo Session:** Test with existing session, new session (should not show panel)
4. **Workbench:** Test with file-based tab, welcome tab (should not show panel), tab switching
5. **Error Handling:** Test with network errors, authentication failures
6. **Navigation:** Click lineage nodes and verify navigation to correct pages
7. **Animations:** Verify smooth expand/collapse transitions
8. **Accessibility:** Test keyboard navigation (Tab, Enter, Escape)

**Verification:**
- All integration points render correctly
- No console errors during normal operation
- Empty states show appropriate messages
- Error states show retry buttons
- Navigation links work correctly
- Animations are smooth (60fps)
- Component handles all edge cases gracefully

---

## Completion Criteria

All tasks marked [x] AND:
- ✅ `pnpm lint` passes
- ✅ `pnpm type-check` passes
- ✅ No console errors during normal operation
- ✅ All 4 integration points working correctly
- ✅ All UI states (loading, error, empty, populated) functional
- ✅ Navigation works for all artifact types
