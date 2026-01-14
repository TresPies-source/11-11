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
<!-- chat-id: 645c5792-5e1d-4f9d-82d3-085f3317a65d -->

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

### [x] Step: Phase 1 - Enhance Agent Types & Registry Data
<!-- chat-id: 9f200df9-115a-436e-82e9-485dceb82c25 -->

**Goal:** Update agent registry with UI metadata (icons, taglines)

**Tasks:**
1. Update `/lib/agents/registry.json`:
   - Add `icon` field (emoji) for each agent
   - Add `tagline` field (one-liner) for each agent
   - Use existing `description`, `when_to_use`, `when_not_to_use` fields
2. Update `/lib/agents/types.ts`:
   - Add optional `icon?: string` to `Agent` interface
   - Add optional `tagline?: string` to `Agent` interface
3. Create `/lib/agents/status.ts`:
   - Implement `getAgentStatus(agentId: string)` function
   - Return 'online' | 'offline' based on implementation status

**Verification:**
- TypeScript compilation: 0 errors
- Existing supervisor tests still pass
- `loadAgentRegistry()` loads without errors

---

### [x] Step: Phase 2 - Create API Endpoints
<!-- chat-id: b46df057-edb4-4d8b-9f4e-6716e6a465a5 -->

**Goal:** Expose agent registry data via REST APIs

**Tasks:**
1. Create `/app/api/agents/registry/route.ts`:
   - GET endpoint to list all agents
   - Include computed `status` field
   - Support dev mode (no auth)
2. Create `/app/api/agents/[agentId]/route.ts`:
   - GET endpoint for agent details
   - Query `routing_decisions` and `routing_costs` tables for usage stats
   - Handle missing data gracefully
   - Return 404 if agent not found
3. Create `/app/api/agents/test-route/route.ts`:
   - POST endpoint to test routing logic
   - Call `routeQuery()` from supervisor
   - Return routing decision + cost estimate
   - Do NOT save to database (test-only)

**Verification:**
- Test all endpoints with Thunder Client/Postman
- Verify response schemas match spec
- Test error cases (invalid agent ID, empty query)
- Verify dev mode works (no API keys required)

---

### [x] Step: Phase 3A - Build AgentCard Component
<!-- chat-id: 96812d17-5da3-4390-ab40-38c14636aeb1 -->

**Goal:** Create reusable agent card component

**Tasks:**
1. Create `/components/agents/AgentCard.tsx`:
   - Props: id, name, icon, tagline, status, onClick
   - Use Framer Motion for animations (following existing patterns)
   - Status indicator (green/gray dot)
   - Hover effects (scale 1.02, shadow)
   - Responsive design
2. Add ARIA labels for accessibility
3. Match existing card styling patterns (see `seed-card.tsx`)

**Verification:**
- Component renders without errors
- Hover animations work smoothly
- Click handler fires correctly
- Accessible via keyboard navigation
- Responsive on mobile/tablet/desktop

---

### [x] Step: Phase 3B - Build AgentDetailsModal Component
<!-- chat-id: f29d3b11-b401-442b-b920-e801c826eb0b -->

**Goal:** Create modal for displaying agent details

**Tasks:**
1. Create `/components/agents/AgentDetailsModal.tsx`:
   - Props: agent (with usage_stats), isOpen, onClose, onTestAgent
   - Portal-based rendering (createPortal)
   - AnimatePresence for enter/exit animations
   - Sections: Header, Purpose, When to Use, What It Doesn't Do, Usage Stats
   - Sticky footer with "Close" and "Test Agent" buttons
2. Add keyboard shortcuts (ESC to close)
3. Click outside to close
4. Focus management (focus trap)
5. Handle missing usage stats gracefully

**Verification:**
- Modal opens/closes smoothly
- ESC key closes modal
- Click outside closes modal
- All sections display correctly
- Usage stats show or "No data" message
- Accessible (role="dialog", aria-modal)

---

### [x] Step: Phase 3C - Build TestAgentInterface Component
<!-- chat-id: 2c61ce96-bc77-4316-bcd1-89b088878af4 -->

**Goal:** Create test routing interface within modal

**Tasks:**
1. Create `/components/agents/TestAgentInterface.tsx`:
   - Props: agentId, agentName
   - Textarea for query input
   - "Route Query" button
   - Loading state (spinner)
   - Result display: selected agent, confidence, reasoning, cost
   - Error handling (validation, API errors)
2. Call `/api/agents/test-route` endpoint
3. Display fallback indicator if keyword routing used

**Verification:**
- Query submission works
- Loading state displays during API call
- Result displays all fields correctly
- Error messages show for invalid input
- Cost breakdown visible (tokens + USD)

---

### [x] Step: Phase 3D - Build Agent Registry Page
<!-- chat-id: cd667325-f191-43ce-adf7-0e3cc36d9048 -->

**Goal:** Create main registry page with grid layout

**Tasks:**
1. Create `/app/agents/page.tsx`:
   - Page metadata (title, description)
   - Header: "Agent Registry" + subtitle
   - Fetch agents from `/api/agents/registry`
   - Grid layout (responsive: 1-2 columns)
   - Render `AgentCard` for each agent
   - State management (selected agent, modal open/close)
   - Integrate `AgentDetailsModal` and `TestAgentInterface`
2. Add loading skeletons while fetching
3. Add error state with retry button

**Verification:**
- Page loads successfully
- All agents display in grid
- Loading skeletons show while fetching
- Clicking card opens modal with correct agent
- Modal integrates test interface
- Responsive design works on all screen sizes

---

### [x] Step: Phase 4 - Integration & Usage Stats
<!-- chat-id: 02d00e59-7f64-4a9f-a28e-c9a2fd3fa68c -->

**Goal:** Integrate usage stats from Cost Guard

**Tasks:**
1. Create usage stats query function in `/lib/agents/usage-stats.ts`:
   - Query `routing_decisions` and `routing_costs` tables
   - Aggregate by agent_id
   - Return query count, total cost, avg response time, last used
2. Integrate query into `/app/api/agents/[agentId]/route.ts`
3. Handle missing data (new agents with no usage)
4. Test with various agents (dojo, librarian, debugger)

**Verification:**
- ✅ Usage stats display correctly in modal
- ✅ "No usage" message shows for unused agents (returns null)
- ✅ Query performance <100ms
- ✅ Dev mode works correctly
- ✅ All tests pass (20/20 usage-stats tests, 24/24 API integration tests)
- ✅ No regressions (supervisor tests pass, cost tracking tests pass)
- ✅ Lint: 0 errors, 0 warnings
- ✅ Type check: 0 errors

---

### [x] Step: Phase 5 - Testing & Quality Assurance
<!-- chat-id: 7542fdc2-8342-4385-afce-8c9f3b87bb99 -->

**Goal:** Comprehensive testing of all features

**Tasks:**
1. Write unit tests:
   - `/api/agents/registry` endpoint
   - `/api/agents/[agentId]` endpoint
   - `/api/agents/test-route` endpoint
   - `AgentCard` component
   - `AgentDetailsModal` component
   - `TestAgentInterface` component
2. Write integration tests:
   - Load registry page → click card → modal opens
   - View agent details → see usage stats
   - Test routing → get valid result
3. Manual testing checklist (all items from spec)
4. Accessibility audit (keyboard nav, screen reader)
5. Performance testing (page load <500ms, modal <200ms)

**Verification:**
- ✅ All unit tests pass (101/101 tests passing)
- ✅ All integration tests pass (25/25 tests passing)
- ✅ Manual testing checklist created (`MANUAL_TESTING_CHECKLIST.md`)
- ✅ Test summary documented (`TEST_SUMMARY.md`)
- ✅ Type check: 0 errors (`npm run type-check`)
- ✅ Lint: 0 errors, 0 warnings (`npm run lint`)
- ⚠️ Accessibility audit: To be performed in browser (Lighthouse)
- ⚠️ Performance benchmarks: To be measured in browser (manual testing required)

---

### [x] Step: Phase 6 - Documentation & Polish
<!-- chat-id: 67898046-5f3f-4f96-8e4b-b82bd536daba -->

**Goal:** Complete documentation and final polish

**Tasks:**
1. Update `/JOURNAL.md`:
   - Document agent registry UI architecture
   - Note any challenges or trade-offs
   - Record performance metrics
2. Add JSDoc comments to all components
3. Add inline code comments for complex logic
4. Create `/lib/agents/README.md`:
   - Overview of agent registry
   - How to add new agents
   - How to update descriptions
   - API documentation
5. Take screenshots of key UI states
6. Run final verification:
   - `npm run type-check` (0 errors)
   - `npm run lint` (0 errors)
   - `npm run build` (success)

**Verification:**
- ✅ All documentation updated (JOURNAL.md + comprehensive Sprint 11 entry)
- ✅ JSDoc comments added to all components (AgentCard, AgentDetailsModal, TestAgentInterface)
- ✅ JSDoc comments added to all API endpoints (registry, [agentId], test-route)
- ✅ JSDoc comments added to usage-stats module
- ✅ Created `/lib/agents/README.md` with comprehensive documentation
- ✅ Type check passes: `npm run type-check` (0 errors)
- ✅ Lint passes: `npm run lint` (0 errors, 0 warnings)
- ✅ Build succeeds: `npm run build` (production build complete)
- ✅ Zero regressions (all existing features work)

---

### [x] Step: Final Report
<!-- chat-id: c4483054-0b04-4815-8026-6886b82d2669 -->

Write a report to `{@artifacts_path}/report.md` describing:
- What was implemented
- How the solution was tested
- The biggest issues or challenges encountered
- Screenshots of key UI states
- Performance metrics achieved
