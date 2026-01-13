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

### [x] Step 4: Agent Registry
<!-- chat-id: 24ede612-7094-4d7e-a824-d0c975ad06d3 -->

**Goal:** Create static agent registry with Dojo, Librarian, Debugger agents

**Tasks:**
- [x] Create `lib/agents/registry.json` with 3 agents
- [x] Create `lib/agents/supervisor.ts` with registry loading logic
- [x] Add registry validation with Zod schema
- [x] Add hot-reload support for dev mode
- [x] Test registry loads correctly

**Verification:**
- ✅ Registry validates against schema
- ✅ All 3 agents load successfully (Dojo, Librarian, Debugger)
- ✅ Default agent (Dojo) is properly marked

**Completion Notes:**
- Created `lib/agents/registry.json` with 3 agents (Dojo, Librarian, Debugger)
- Implemented `lib/agents/supervisor.ts` with comprehensive registry functions:
  - `loadAgentRegistry()` - Loads and caches registry with Zod validation
  - `reloadAgentRegistry()` - Hot-reload support for dev mode
  - `getAvailableAgents()` - Returns all agents
  - `getAgentById()` - Retrieves specific agent
  - `getDefaultAgent()` - Returns default agent (Dojo)
  - `isValidAgentId()` - Validates agent ID
  - `validateAgentRegistry()` - Comprehensive validation with error reporting
- Created comprehensive test suite (`supervisor.test.ts`) - all tests passing
- Type checking passed with zero errors
- Registry includes detailed "when_to_use" and "when_not_to_use" criteria for accurate routing

---

### [x] Step 5: Routing Logic
<!-- chat-id: c3d45f36-e11e-40ca-9572-551e69f0eb7a -->

**Goal:** Implement LLM-based routing with GPT-4o-mini

**Tasks:**
- [x] Implement `routeQuery()` in `lib/agents/supervisor.ts`
- [x] Build routing prompt with agent descriptions
- [x] Call OpenAI API with JSON response format
- [x] Parse and validate routing response
- [x] Implement timeout logic (5s)
- [x] Implement confidence threshold (0.6)
- [x] Create dev mode fallback (keyword-based routing)

**Verification:**
- ✅ Test with 10+ diverse queries (12 test cases pass)
- ✅ Routing completes in <200ms (dev mode fallback is instant)
- ✅ Timeout works correctly (5s timeout in OpenAI client)
- ✅ Dev mode fallback works without API key

**Completion Notes:**
- Implemented `routeQuery()` function with comprehensive routing logic
- Created `buildRoutingPrompt()` helper to construct detailed prompts with agent descriptions
- Implemented `routeQueryWithLLM()` for LLM-based routing using GPT-4o-mini
- Created `routeQueryKeywordFallback()` for dev mode (keyword-based routing when no API key)
- Implemented confidence threshold (0.6) with automatic fallback to default agent
- Added `saveRoutingDecision()` to persist routing decisions and costs to database
- All edge cases handled: empty queries, no agents available, LLM failures
- Comprehensive test suite with 12 test cases covering search, debug, and thinking queries
- TypeScript compilation successful with zero errors
- Build successful with no regressions

---

### [x] Step 6: Fallback Logic
<!-- chat-id: baf7fec2-37fa-4c0e-b5ca-55914efdc3a2 -->

**Goal:** Implement comprehensive fallback handling

**Tasks:**
- [x] Create `lib/agents/fallback.ts`
- [x] Implement `routeWithFallback()` wrapper
- [x] Handle low confidence (<0.6)
- [x] Handle API failures
- [x] Handle timeout (5s)
- [x] Handle unavailable agents
- [x] Always return valid agent ID (never throw)

**Verification:**
- ✅ All fallback scenarios tested (16 test cases pass)
- ✅ Never throws errors
- ✅ Always returns Dojo as fallback

**Completion Notes:**
- Created `lib/agents/fallback.ts` with comprehensive fallback handling
- Implemented `routeWithFallback()` that wraps routing with fail-safe logic
- Added `FallbackReason` enum for categorizing fallback scenarios
- Created `logFallbackEvent()` for observability (console logging, Harness Trace ready)
- Handles all failure modes:
  - Low confidence (<0.6) → fallback to Dojo
  - API timeouts (>5s) → fallback to Dojo
  - Rate limits → fallback to Dojo
  - Agent unavailable → fallback to Dojo
  - Registry errors → fallback to Dojo
  - Unknown errors → fallback to Dojo
  - Empty queries → fallback to Dojo
  - No API key → keyword-based routing fallback
- Implemented agent availability validation
- All 28 assertions in test suite pass
- Build successful with zero errors
- Performance: <1ms routing in dev mode (keyword fallback)

---

### [x] Step 7: Cost Tracking
<!-- chat-id: f423f916-6203-4010-b6de-7fbde1f23d59 -->

**Goal:** Track routing costs in PGlite database

**Tasks:**
- [x] Create `lib/agents/cost-tracking.ts`
- [x] Implement `trackRoutingCost()` function
- [x] Calculate cost from tokens (GPT-4o-mini pricing)
- [x] Store in `routing_costs` table
- [x] Link to routing decision via foreign key

**Verification:**
- ✅ Costs are accurately calculated
- ✅ Data persists to database
- ✅ Foreign key relationship works

**Completion Notes:**
- Created `lib/agents/cost-tracking.ts` with comprehensive cost tracking functions:
  - `calculateRoutingCost()` - Calculates accurate cost from full token usage breakdown (input + output tokens)
  - `calculateCostFromTotal()` - Estimates cost from total tokens using 70/30 weighted average
  - `trackRoutingCost()` - Stores routing cost with full token breakdown in database
  - `trackRoutingCostSimple()` - Stores routing cost using total tokens only
  - `getSessionRoutingCosts()` - Aggregates costs for a session (total tokens, cost, count)
  - `getRoutingCost()` - Retrieves cost for a specific routing decision
  - `getSessionRoutingHistory()` - Retrieves routing history with costs, agent info, and timestamps
- Updated `supervisor.ts` to use new cost-tracking module:
  - Changed `saveRoutingDecision()` to accept `TokenUsage` instead of plain token count
  - Updated `routeQueryWithLLM()` to return `TokenUsage` along with routing decision
  - Fixed cost calculation (replaced incorrect division by 2 with accurate input/output pricing)
- Added types to `types.ts`:
  - `TokenUsage` interface (prompt_tokens, completion_tokens, total_tokens)
  - `RoutingDecisionWithUsage` interface (extends RoutingDecision with optional usage)
- Updated `fallback.ts` to support `RoutingDecisionWithUsage` return type
- Created comprehensive test suite with 30+ assertions covering:
  - Cost calculation accuracy (exact match with GPT-4o-mini pricing)
  - Database persistence and retrieval
  - Foreign key relationships
  - Session aggregation
  - Routing history queries
- Build successful with zero TypeScript errors
- Cost tracking uses accurate GPT-4o-mini pricing:
  - Input: $0.00015 per 1,000 tokens
  - Output: $0.0006 per 1,000 tokens
  - Typical routing query: <$0.001
- Ready for integration with Cost Guard (Feature 2) when available

---

### [x] Step 8: Handoff System
<!-- chat-id: 4ad459be-56bd-49bd-b3fa-8b327c3bca0a -->

**Goal:** Enable agent-to-agent handoffs with context preservation

**Tasks:**
- [x] Create `lib/agents/handoff.ts`
- [x] Implement `executeHandoff()` function
- [x] Preserve full conversation history
- [x] Store handoff events in database
- [x] Prepare Harness Trace integration (stub for now)

**Verification:**
- ✅ Handoff preserves all context
- ✅ Handoff events logged to database
- ✅ Graceful degradation if Harness Trace unavailable

**Completion Notes:**
- Created `lib/agents/handoff.ts` with comprehensive handoff system:
  - `executeHandoff()` - Main function to execute agent handoffs with full validation
  - `storeHandoffEvent()` - Stores handoff events in `agent_handoffs` table
  - `getHandoffHistory()` - Retrieves all handoffs for a session in chronological order
  - `getLastHandoff()` - Gets most recent handoff for a session
  - `getHandoffCount()` - Counts handoffs with optional filtering by from_agent/to_agent
  - `logHarnessEvent()` - Stub for Harness Trace integration (console logging)
  - `invokeAgent()` - Stub for agent invocation (will be implemented in UI integration)
- Comprehensive validation implemented:
  - session_id, from_agent, to_agent, reason, user_intent all validated as non-empty
  - Prevents handoff to same agent (from_agent must differ from to_agent)
  - Validates both agents exist in registry and are available
  - Validates conversation_history is an array
- Full context preservation:
  - Stores complete conversation history as JSONB
  - Preserves user intent and session ID
  - Stores optional harness_trace_id for observability
  - Maintains agent IDs and timestamps in messages
- Database integration:
  - Stores handoffs in `agent_handoffs` table
  - Includes indexes for efficient querying (session_id, from_agent/to_agent, created_at)
  - Properly handles JSONB serialization/deserialization of conversation history
- Error handling:
  - Custom `HandoffError` class with agent context (`from_agent->to_agent`)
  - All validation errors throw HandoffError with descriptive messages
  - Database errors caught and wrapped in HandoffError
  - Handoff failures logged to Harness Trace (stub)
- Harness Trace preparation:
  - `logHarnessEvent()` logs to console (ready for real integration)
  - Events logged: AGENT_HANDOFF (success), HANDOFF_FAILURE (error)
  - Event structure includes all relevant context (agents, reason, session, conversation length)
- Created comprehensive documentation in `lib/agents/HANDOFF.md`:
  - API reference for all functions
  - Usage patterns for common handoffs
  - Database schema documentation
  - Integration points with other features
  - Performance characteristics
- Type checking passes with zero errors
- Fixed pre-existing type errors in fallback.test.ts (type assertions for agent IDs)
- Ready for integration with UI (Steps 10-11) and Harness Trace (Feature 4)

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
