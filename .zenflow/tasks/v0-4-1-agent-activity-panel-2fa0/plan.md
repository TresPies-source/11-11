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
<!-- chat-id: 35242e63-08dc-4d32-939d-e40f5155d0a2 -->

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

### [x] Step: Create SystemInfo Component
<!-- chat-id: c7cafe40-df63-4ff2-94da-8b4dcd26e04a -->

Create the `components/agents/SystemInfo.tsx` component to display cost and duration metrics.

**Implementation:**
- Create new file with TypeScript interface for props
- Display cost and duration with mock data
- Apply styling: `text-sm text-text-tertiary`
- Use flex layout for horizontal display

**Verification:**
- Component renders with mock data
- Styling matches mockup specification
- No TypeScript errors

---

### [x] Step: Create ActivityLog Component
<!-- chat-id: 998975f9-c80b-40af-a2df-82c2c8cb9a0d -->

Create the `components/agents/ActivityLog.tsx` component to display recent agent events.

**Implementation:**
- Create new file with TypeScript interface for props
- Display list of activity events (mock data array)
- Apply styling: `text-xs text-text-tertiary`
- Limit to max 5 items

**Verification:**
- Component renders activity list correctly
- Text truncation works for long messages
- Styling matches mockup specification
- No TypeScript errors

---

### [x] Step: Create AgentActivityCard Component
<!-- chat-id: a90590d8-3e82-406a-88c0-ed21971c7e82 -->

Create the `components/agents/AgentActivityCard.tsx` component for individual agent status display.

**Implementation:**
- Create new file (distinct from existing AgentCard.tsx)
- Define TypeScript props interface
- Implement expanded view (icon, name, status, task)
- Implement collapsed view (icon + StatusDot only)
- Add tooltip for collapsed mode (title attribute)
- Import and use existing StatusDot component

**Verification:**
- Expanded view shows all agent information
- Collapsed view shows only icon and StatusDot
- StatusDot colors match agent status
- Tooltip appears on hover in collapsed mode
- No TypeScript errors

---

### [x] Step: Create AgentActivityPanel Component
<!-- chat-id: 5b1966c8-bfd1-4afc-aa2b-44cfe7680ab7 -->

Create the main `components/layout/AgentActivityPanel.tsx` container component.

**Implementation:**
- Create new file with collapse state management (useState)
- Implement header with title and collapse/expand button
- Create scrollable section for agent cards
- Add footer section for SystemInfo and ActivityLog
- Define mock agent data array
- Apply styling according to mockup specification

**Verification:**
- Collapse/expand button toggles state
- Header, content, and footer sections render correctly
- Scrollable area works when content overflows
- Styling matches mockup (bg-secondary, border-left, padding)
- No TypeScript errors

---

### [x] Step: Integrate PanelGroup in Workbench Page
<!-- chat-id: 15a053cd-f2de-4f56-9e10-cdafe8e9a03c -->

Update `app/workbench/page.tsx` to use react-resizable-panels and integrate AgentActivityPanel.

**Implementation:**
- Import PanelGroup, Panel, PanelResizeHandle from react-resizable-panels
- Restructure layout to wrap Editor and AgentActivityPanel
- Configure Panel sizes (defaultSize, minSize, maxSize)
- Style PanelResizeHandle with hover effects
- Keep TabBar and ActionBar outside PanelGroup

**Verification:**
- Workbench page renders without errors
- Panel resize drag handle works smoothly
- Min/max size constraints are enforced
- Editor functionality remains intact
- AgentActivityPanel displays correctly
- No TypeScript errors

---

### [x] Step: Polish and Pixel-Perfect Styling
<!-- chat-id: 161fed82-706e-430e-9974-c7a44da35d01 -->

Fine-tune all components to match the mockup specification exactly.

**Implementation:**
- Review mockup lines 398-415 in V0.4.0_MOCKUPS_REFINED.md
- Adjust spacing, padding, font sizes, colors
- Ensure collapsed panel width is exactly 80px
- Verify status dot size is 8px with pulse animation
- Test responsive behavior at different screen sizes

**Verification:**
- Visual comparison with mockup
- All spacing values match specification
- Colors match design system
- Transitions are smooth
- Works on different screen sizes

---

### [x] Step: Run Tests and Build Verification
<!-- chat-id: 4a5eb866-99a0-488e-b6fa-897879ebfe04 -->

Run project linting, type checking, and build commands to ensure no regressions.

**Implementation:**
- Run `npm run lint` to check for linting errors
- Run `npm run type-check` to verify TypeScript types
- Run `npm run build` to ensure production build succeeds
- Fix any errors or warnings that appear

**Verification:**
- All commands pass without errors
- No new TypeScript type errors
- Production build completes successfully
- No console warnings in development mode

---

### [x] Step: Create Implementation Report
<!-- chat-id: ce19a2cb-fddb-4d8b-bd6c-902b2c7deade -->

Document the implementation for future reference.

**Implementation:**
- Create `{@artifacts_path}/report.md`
- Document what was implemented
- Describe testing approach and results
- Note any challenges or issues encountered
- Include screenshots or visual references if needed

**Verification:**
- Report is complete and accurate
- All acceptance criteria from task description are met
