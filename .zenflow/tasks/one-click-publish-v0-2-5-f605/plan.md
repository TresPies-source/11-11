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
<!-- chat-id: bb484c5d-2b89-485e-841a-151eade0609c -->

Assess the task's difficulty, as underestimating it leads to poor outcomes.
- easy: Straightforward implementation, trivial bug fix or feature
- medium: Moderate complexity, some edge cases or caveats to consider
- hard: Complex logic, many caveats, architectural considerations, or high-risk changes

Create a technical specification for the task that is appropriate for the complexity level:
- Review the existing codebase architecture and identify reusable components.
- Define the implementation approach based on established patterns in the project.
- Identify all source code files that will be created or modified.
- Define any necessary data model, API, or interface changes.
- Describe verification steps using the project's test and lint commands.

Save the output to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach
- Source code structure changes
- Data model / API / interface changes
- Verification approach

If the task is complex enough, create a detailed implementation plan based on `{@artifacts_path}/spec.md`:
- Break down the work into concrete tasks (incrementable, testable milestones)
- Each task should reference relevant contracts and include verification steps
- Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function).

Save to `{@artifacts_path}/plan.md`. If the feature is trivial and doesn't warrant this breakdown, keep the Implementation step below as is.

---

### [x] Step: Database Schema Migration
<!-- chat-id: b2ee09c5-a8fe-45ce-9e50-c86d35350aef -->

Update PGlite database schema to support public prompts with visibility controls.

**Tasks**:
- Update `lib/pglite/schema.ts` with new columns (published_at, visibility, author_name, author_id)
- Add indexes for performance (visibility + published_at, author_id)
- Update `lib/pglite/types.ts` with new TypeScript interfaces
- Create migration/backfill logic for existing prompts
- Update `lib/pglite/prompts.ts` to use new columns in queries

**Verification**:
- Run dev server and check console for migration success
- Inspect PGlite database to verify columns exist
- Verify existing prompts have backfilled values
- Zero TypeScript errors

---

### [x] Step: API Routes Implementation
<!-- chat-id: 1e27da21-6826-4d79-ab69-18faa5385b20 -->

Create API endpoints for publish, unpublish, public listing, and copy operations.

**Tasks**:
- Create `app/api/librarian/publish/route.ts`
- Create `app/api/librarian/unpublish/route.ts`
- Create `app/api/librarian/public/route.ts` (with filters/sort)
- Create `app/api/librarian/copy/route.ts`
- Implement ownership verification in all routes
- Add error handling and validation

**Verification**:
- Test each endpoint with mock data
- Verify ownership rules enforced
- Check response types match TypeScript interfaces
- Test error cases (not found, unauthorized)

---

### [x] Step: Core UI Components
<!-- chat-id: 0f53cc74-52c1-4fb5-b997-10c789742f5e -->

Build reusable components for public toggle, badge, dialogs, and buttons.

**Tasks**:
- Create `components/librarian/PublicToggle.tsx`
- Create `components/librarian/PublicBadge.tsx`
- Create `components/librarian/PublishConfirmDialog.tsx`
- Create `components/librarian/CopyToLibraryButton.tsx`
- Create `hooks/usePublicToggle.ts`
- Create `hooks/useCopyPrompt.ts`

**Verification**:
- Components render without errors
- Toggle shows confirmation dialog on first use
- Badge displays correctly with proper styling
- Copy button shows loading state
- All components are keyboard accessible

---

### [x] Step: Component Integration
<!-- chat-id: a7a4a71d-9115-4f84-9df7-a795650986d8 -->

Integrate public toggle and badge into existing prompt cards and views.

**Tasks**:
- Update `components/librarian/SeedlingCard.tsx` with PublicToggle
- Update `components/librarian/GreenhouseCard.tsx` with PublicToggle
- Update `components/shared/PromptCard.tsx` for commons variant
- Update `components/librarian/CommonsView.tsx` with filters and sort
- Update `hooks/useGallery.ts` to fetch from new API endpoint

**Verification**:
- Toggle appears on all prompt cards
- Badge displays on public prompts
- Commons view shows public prompts from all users
- Filter and sort controls work correctly
- Author attribution displayed properly

---

### [ ] Step: Seed Data & Testing

Update seed data with public prompts and perform end-to-end testing.

**Tasks**:
- Update `lib/pglite/seed.ts` with 5-10 public prompts
- Add varied author names and publish dates
- Test publish → unpublish flow
- Test copy prompt to library flow
- Test filter (all vs mine) and sort
- Test privacy rules (non-owner cannot edit)

**Verification**:
- Seed data loads successfully on first run
- All user flows work end-to-end
- Privacy rules enforced correctly
- No console errors or warnings
- All prompts display correctly in UI

---

### [ ] Step: Documentation & Cleanup

Document changes and ensure code quality standards are met.

**Tasks**:
- Update `JOURNAL.md` with architecture decisions
- Document database schema changes
- Document privacy model and copy mechanism
- Run `npm run lint` and fix all errors
- Run `npm run build` and fix type errors
- Capture screenshots for verification

**Verification**:
- Zero lint errors
- Zero TypeScript errors
- Production build succeeds
- JOURNAL.md updated with Commons architecture
- Screenshots captured showing all features

---

### [ ] Step: Final Report

Write completion report summarizing implementation and testing.

**Tasks**:
- Create `{@artifacts_path}/report.md`
- Document what was implemented
- Describe testing approach and results
- List any challenges or issues encountered
- Note any deferred features or future work
