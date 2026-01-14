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
<!-- chat-id: 76806a59-d241-4b7c-aaad-eebce069882f -->

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

### [x] Step 1: Update Seed Card Colors and Typography
<!-- chat-id: 8833c5b6-0352-4a2c-bb7a-b2ad8b0ba071 -->

Update `components/seeds/seed-card.tsx` to use Dojo Genesis design system:
- Replace hardcoded colors in `TYPE_COLORS` with semantic Tailwind classes
- Update `STATUS_CONFIG` colors to use Dojo Genesis palette
- Replace all hardcoded gray colors with `bg-bg-*` and `text-text-*` classes
- Ensure typography uses Inter font with correct weights
- Verify status button colors use semantic colors
- Test component rendering

**Verification:** Run `npm run test:seeds-card` and visually verify colors match design system

---

### [x] Step 2: Update Filters Panel Colors
<!-- chat-id: fa2a5bb6-72c2-4d65-9380-d03a9f815971 -->

Update `components/seeds/filters-panel.tsx` to use Dojo Genesis design system:
- Replace hardcoded colors in `TYPE_COLORS` mapping
- Replace hardcoded colors in `STATUS_COLORS` mapping
- Update button states to use semantic accent colors
- Ensure consistent spacing using 4px base unit

**Verification:** Run `npm run test:seeds-filters` and verify filter functionality

---

### [x] Step 3: Update Details Modal Colors
<!-- chat-id: 1a8b3296-269b-4ef8-a8fa-11c0593afc6d -->

Update `components/seeds/details-modal.tsx` for visual consistency:
- Update `TYPE_COLORS` to match seed card implementation
- Update `STATUS_CONFIG` colors to use Dojo Genesis palette
- Replace hardcoded backgrounds and borders with semantic classes
- Ensure typography consistency

**Verification:** Run `npm run test:seeds-modal` and verify modal displays correctly

---

### [x] Step 4: Update Seeds View Colors and Typography
<!-- chat-id: dc0fae94-655c-4437-8c50-4b148fdbbfd6 -->

Update `components/seeds/seeds-view.tsx`:
- Update header icon colors to use `text-success` or `text-accent`
- Replace hardcoded grays in loading/error states with semantic classes
- Update search input styling to use semantic borders and backgrounds
- Ensure consistent typography (headings, body text)
- Improve spacing consistency using 4px base unit

**Verification:** Run `npm run test:seeds-view` and verify page renders correctly

---

### [x] Step 5: Create Plant Seed Modal Component
<!-- chat-id: fb3a14ef-0542-4302-8b1c-45a797e52f80 -->

Create `components/seeds/plant-seed-modal.tsx`:
- Implement modal structure following pattern from `details-modal.tsx`
- Add form fields: name, type, content, why_matters, revisit_when
- Use Dojo Genesis colors and typography
- Implement form validation
- Integrate with `insertSeed` function
- Add submit and cancel handlers
- Use Framer Motion for animations
- Ensure accessibility (keyboard navigation, ARIA labels)

**Verification:** Create basic test file and verify modal opens/closes

---

### [x] Step 6: Add Plant New Seed Button to Seeds View
<!-- chat-id: 83e53106-8a0e-4feb-83dc-8a63d6027a62 -->

Update `components/seeds/seeds-view.tsx`:
- Import `Button` component from `components/ui/Button.tsx`
- Import `PlantSeedModal` component
- Add "Plant New Seed" button in header area (near title)
- Add state for modal open/close
- Add callback to refetch seeds after creation
- Position button prominently using Dojo Genesis styling

**Verification:** Manually verify button appears and opens modal

---

### [x] Step 7: Integration Testing and Refinement
<!-- chat-id: 6095f2b7-1d59-40e7-a239-4583993950b3 -->

Full integration testing:
- Run full seeds test suite: `npm run test:seeds`
- Test complete user flow: filter → view → create → update → delete
- Verify all colors match Dojo Genesis brand guide
- Verify typography is consistent across all components
- Verify spacing uses 4px base unit throughout
- Test dark mode support
- Test responsive layouts
- Check accessibility (keyboard navigation, screen readers)

**Verification:** All tests pass, no console errors, visual consistency confirmed

---

### [x] Step 8: Build and Type Check

Final verification:
- Run `npm run build` - must succeed with no errors
- Run `npm run type-check` - must pass with no TypeScript errors
- Manual smoke test of Seeds page functionality
- Verify no console warnings or errors

**Verification:** Clean build, clean type check, working application

---

### [x] Step 9: Create Implementation Report

Write completion report to `{@artifacts_path}/report.md`:
- Summarize what was implemented
- Document how the solution was tested
- Note any challenges encountered
- Provide screenshots or observations of visual improvements
- Document any deviations from the spec
