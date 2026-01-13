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
<!-- chat-id: 55d73342-f4d8-4e88-a286-e484c8f721af -->

**Complexity Assessment:** Hard

Created comprehensive technical specification at `spec.md` with:
- Technical context and dependencies
- Implementation approach and architecture
- Source code structure (new files and modifications)
- Database schema changes (3 new tables)
- API specifications
- Verification approach (unit, integration, manual testing)
- Excellence criteria self-assessment
- Risk assessment and success metrics

**Key Decisions:**
- Use GPT-4o-mini for cost-effective routing
- Implement dev mode fallback (keyword-based routing)
- Add 3 new database tables for routing decisions, costs, and handoffs
- Create isolated agent registry system in `lib/agents/`
- Prepare integration points for Cost Guard (Feature 2)

---

### [x] Step 1: Environment & Dependencies Setup
<!-- chat-id: 6df12a95-74ce-41dd-bdd8-9228c5806201 -->

**Goal:** Install required dependencies and configure environment

**Tasks:**
- [x] Add `openai` package to dependencies
- [x] Add `zod` package for schema validation
- [x] Update `.env.example` with `OPENAI_API_KEY`
- [x] Create `.env.local` if needed (dev mode works without API key)
- [x] Run `npm install`

**Verification:**
- [x] `npm run build` succeeds
- [x] No TypeScript errors

---

### [x] Step 2: Database Schema & Migration
<!-- chat-id: cdc7b106-b3c7-4749-b382-f18049950f10 -->

**Goal:** Add database tables for routing decisions, costs, and handoffs

**Tasks:**
- [x] Create migration SQL in `lib/pglite/migrations/003_add_supervisor_tables.ts`
- [x] Add `routing_decisions` table
- [x] Add `routing_costs` table
- [x] Add `agent_handoffs` table
- [x] Update `lib/pglite/client.ts` to run migration
- [x] Test migration runs successfully

**Verification:**
- [x] Migration runs without errors
- [x] Tables exist in PGlite database
- [x] Indexes are created

---

### [x] Step 3: OpenAI Client & Agent Types
<!-- chat-id: bfc91d06-50ba-4722-a32e-f3ae4f8c1e98 -->

**Goal:** Set up OpenAI client and TypeScript types

**Tasks:**
- [x] Create `lib/openai/client.ts` with singleton pattern
- [x] Create `lib/openai/types.ts` for OpenAI-specific types
- [x] Create `lib/agents/types.ts` for agent-related types
- [x] Add dev mode detection for graceful degradation

**Verification:**
- [x] TypeScript compilation succeeds
- [x] OpenAI client initializes correctly
- [x] Dev mode fallback works without API key

---

### [ ] Step 4: Agent Registry
<!-- chat-id: 24ede612-7094-4d7e-a824-d0c975ad06d3 -->

**Goal:** Create static agent registry with Dojo, Librarian, Debugger agents

**Tasks:**
- [ ] Create `lib/agents/registry.json` with 3 agents
- [ ] Create `lib/agents/supervisor.ts` with registry loading logic
- [ ] Add registry validation with Zod schema
- [ ] Add hot-reload support for dev mode
- [ ] Test registry loads correctly

**Verification:**
- Registry validates against schema
- All 3 agents load successfully
- Default agent (Dojo) is properly marked

---

### [ ] Step 5: Routing Logic

**Goal:** Implement LLM-based routing with GPT-4o-mini

**Tasks:**
- [ ] Implement `routeQuery()` in `lib/agents/supervisor.ts`
- [ ] Build routing prompt with agent descriptions
- [ ] Call OpenAI API with JSON response format
- [ ] Parse and validate routing response
- [ ] Implement timeout logic (5s)
- [ ] Implement confidence threshold (0.6)
- [ ] Create dev mode fallback (keyword-based routing)

**Verification:**
- Test with 10 diverse queries
- Routing completes in <200ms (p95)
- Timeout works correctly
- Dev mode fallback works without API key

---

### [ ] Step 6: Fallback Logic

**Goal:** Implement comprehensive fallback handling

**Tasks:**
- [ ] Create `lib/agents/fallback.ts`
- [ ] Implement `routeWithFallback()` wrapper
- [ ] Handle low confidence (<0.6)
- [ ] Handle API failures
- [ ] Handle timeout (5s)
- [ ] Handle unavailable agents
- [ ] Always return valid agent ID (never throw)

**Verification:**
- All fallback scenarios tested
- Never throws errors
- Always returns Dojo as fallback

---

### [ ] Step 7: Cost Tracking

**Goal:** Track routing costs in PGlite database

**Tasks:**
- [ ] Create `lib/agents/cost-tracking.ts`
- [ ] Implement `trackRoutingCost()` function
- [ ] Calculate cost from tokens (GPT-4o-mini pricing)
- [ ] Store in `routing_costs` table
- [ ] Link to routing decision via foreign key

**Verification:**
- Costs are accurately calculated
- Data persists to database
- Foreign key relationship works

---

### [ ] Step 8: Handoff System

**Goal:** Enable agent-to-agent handoffs with context preservation

**Tasks:**
- [ ] Create `lib/agents/handoff.ts`
- [ ] Implement `executeHandoff()` function
- [ ] Preserve full conversation history
- [ ] Store handoff events in database
- [ ] Prepare Harness Trace integration (stub for now)

**Verification:**
- Handoff preserves all context
- Handoff events logged to database
- Graceful degradation if Harness Trace unavailable

---

### [ ] Step 9: API Endpoints

**Goal:** Create REST API for routing and agent listing

**Tasks:**
- [ ] Create `app/api/supervisor/route/route.ts` (POST)
- [ ] Create `app/api/supervisor/agents/route.ts` (GET)
- [ ] Implement request validation
- [ ] Implement error handling
- [ ] Add dev mode support
- [ ] Test with sample requests

**Verification:**
- API returns correct response format
- Error handling works
- Dev mode returns mock data

---

### [ ] Step 10: UI Components

**Goal:** Create UI components for agent selection and routing feedback

**Tasks:**
- [ ] Create `components/agents/AgentSelector.tsx`
- [ ] Create `components/agents/RoutingIndicator.tsx`
- [ ] Create `components/agents/AgentStatusBadge.tsx`
- [ ] Integrate with existing ChatPanel
- [ ] Add manual override functionality
- [ ] Add routing visibility settings

**Verification:**
- Components render correctly
- Agent selection works
- Routing indicator shows during routing
- Manual override works

---

### [ ] Step 11: Integration with Multi-Agent UI

**Goal:** Integrate routing into existing multi-agent chat interface

**Tasks:**
- [ ] Update `components/multi-agent/ChatPanel.tsx`
- [ ] Add agent routing on message send
- [ ] Show routing indicator
- [ ] Update agent badge on routing
- [ ] Add manual override button
- [ ] Update `lib/constants.ts` with agent constants

**Verification:**
- Routing triggers on message send
- UI updates reflect routing decision
- Manual override works
- No regressions in existing chat functionality

---

### [ ] Step 12: Unit Tests

**Goal:** Write comprehensive unit tests for all routing logic

**Tasks:**
- [ ] Create `__tests__/agents/supervisor.test.ts`
- [ ] Create `__tests__/agents/handoff.test.ts`
- [ ] Create `__tests__/agents/fallback.test.ts`
- [ ] Test routing accuracy (20+ test cases)
- [ ] Test fallback scenarios
- [ ] Test cost tracking
- [ ] Test handoff preservation

**Verification:**
- All tests pass
- Test coverage >80%
- Edge cases covered

---

### [ ] Step 13: Integration & Manual Testing

**Goal:** End-to-end testing and manual validation

**Tasks:**
- [ ] Test full routing flow (user query → agent selection)
- [ ] Test handoffs between agents
- [ ] Verify cost tracking in database
- [ ] Test routing accuracy with 20 diverse queries
- [ ] Test performance (latency <200ms)
- [ ] Test dev mode without API key
- [ ] Test with API key in production mode

**Verification:**
- All integration tests pass
- Manual testing confirms expected behavior
- Performance targets met
- Dev mode and production mode both work

---

### [ ] Step 14: Lint, Type Check & Documentation

**Goal:** Final code quality checks and documentation

**Tasks:**
- [ ] Run `npm run lint` (fix all issues)
- [ ] Run `npm run type-check` (fix all errors)
- [ ] Update JOURNAL.md with architectural decisions
- [ ] Document routing accuracy results
- [ ] Self-assess against Excellence Criteria
- [ ] Update BUGS.md if any bugs found
- [ ] Create report.md in artifacts folder

**Verification:**
- Zero lint errors
- Zero type errors
- JOURNAL.md updated
- All documentation complete

---

### [ ] Step 15: Final Testing & Completion Report

**Goal:** Final validation and completion documentation

**Tasks:**
- [ ] Run full test suite
- [ ] Manual regression testing
- [ ] Performance benchmarking
- [ ] Create completion report in `report.md`
- [ ] Document challenges and solutions
- [ ] List any known limitations or deferred features

**Verification:**
- All acceptance criteria met
- Completion report written
- Ready for code review
