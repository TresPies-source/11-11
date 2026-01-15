# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: 8c26c787-c994-44b1-9d72-37d6758db21d -->

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: f36ac0ed-cc32-4f55-b422-2bcb244f9d9a -->

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
<!-- chat-id: 1409e054-b271-4b25-8b8e-e55ed6f53939 -->

Create a detailed implementation plan based on `{@artifacts_path}/spec.md`.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps
3. Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function) or too broad (entire feature).

If the feature is trivial and doesn't warrant full specification, update this workflow to remove unnecessary steps and explain the reasoning to the user.

Save to `{@artifacts_path}/plan.md`.

### [x] Step: Create Core Infrastructure
<!-- chat-id: e576ac10-27d1-4f23-9ac0-8bbcc28edae1 -->

Create `lib/agents/dojo-handler.ts` with foundational types and helper functions.

**Tasks:**
1. Create file with core type definitions (DojoAgentQuery, DojoAgentResponse, DojoMode, DojoAgentError)
2. Implement `buildDojoPacketFromContext()` helper function to construct DojoPacket from AgentInvocationContext
3. Implement `selectDojoMode()` function with heuristic logic based on user cues and packet state
4. Implement `handleDojoQuery()` orchestrator that routes to mode handlers
5. Implement `invokeDojoAgent()` entry point for Supervisor integration

**Verification:**
- Run `npm run type-check` - should compile without errors
- All types properly exported
- Mode selection handles edge cases (empty messages, no perspectives, etc.)

**References:**
- Type interfaces: `lib/agents/types.ts`
- Pattern reference: `lib/agents/librarian-handler.ts`
- Schema: `lib/packet/schema.ts`

---

### [x] Step: Implement Mirror Mode Handler
<!-- chat-id: 390e60d3-1537-4f60-9e6c-f323b69b3917 -->

Implement `handleMirrorMode()` with LLM integration for reflection and reframing.

**Tasks:**
1. Define Zod schema for Mirror mode LLM response (MirrorModeResponseSchema)
2. Build prompt template for Mirror mode (pattern, assumptions, tensions, reframes)
3. Implement `handleMirrorMode()` function with:
   - Harness Trace logging (AGENT_ACTIVITY_START, PROGRESS, COMPLETE)
   - LLM call using `llmClient.createJSONCompletion()`
   - Response validation with Zod
   - DojoPacket update logic (add assumptions, generate next_move)
   - Error handling with graceful fallback
4. Test with sample packet containing situation and perspectives

**Verification:**
- Function processes packet and returns DojoAgentResponse
- Harness Trace events logged correctly
- LLM response validated with schema
- Packet updates preserve existing data

**References:**
- LLM client: `lib/llm/client.ts`
- Trace system: `lib/harness/trace.ts`
- Pattern: `librarian-handler.ts:159-322` (handleLibrarianQuery)

---

### [x] Step: Implement Scout Mode Handler
<!-- chat-id: a286e464-9a54-4860-9760-7d312ef0db1d -->

Implement `handleScoutMode()` for route mapping with tradeoffs.

**Tasks:**
1. Define Zod schema for Scout mode LLM response (ScoutModeResponseSchema with routes array)
2. Build prompt template for Scout mode (routes with tradeoffs, smallest test)
3. Implement `handleScoutMode()` function with:
   - Harness Trace logging
   - LLM call with appropriate context (situation + perspectives)
   - Response validation
   - DojoPacket update (add routes as perspectives, set next_move.smallest_test)
   - Error handling
4. Test with sample packet asking for options/routes

**Verification:**
- Returns 2-4 routes with honest tradeoffs
- Smallest test is concrete and actionable
- Packet updated with new perspectives from agent

**References:**
- Spec section 3.3.2 for prompt template and schema
- Same LLM client and trace patterns as Mirror mode

---

### [x] Step: Implement Gardener Mode Handler
<!-- chat-id: c9f6c56b-2af2-4384-aff2-50f38091c1d4 -->

Implement `handleGardenerMode()` for idea pruning and focus.

**Tasks:**
1. Define Zod schema for Gardener mode LLM response (strong_ideas, ideas_to_grow, ideas_to_compost)
2. Build prompt template for Gardener mode (highlight strengths, suggest pruning)
3. Implement `handleGardenerMode()` function with:
   - Harness Trace logging
   - LLM call with full perspectives list and stake
   - Response validation
   - DojoPacket update (generate focused next_move)
   - Error handling
4. Test with packet containing 5+ perspectives

**Verification:**
- Returns clear pruning guidance
- Direct language (not overly diplomatic)
- Summary helps user focus energy

**References:**
- Spec section 3.3.3 for requirements
- Follow same handler pattern as Mirror/Scout modes

---

### [x] Step: Implement Implementation Mode Handler
<!-- chat-id: 5a729474-ab04-4b73-ae80-0d62f09f0874 -->

Implement `handleImplementationMode()` for concrete action plans.

**Tasks:**
1. Define Zod schema for Implementation mode LLM response (plan array with steps, first_step)
2. Build prompt template for Implementation mode (1-5 concrete steps)
3. Implement `handleImplementationMode()` function with:
   - Harness Trace logging
   - LLM call with situation, decisions, and convergence cue
   - Response validation
   - DojoPacket update (set next_move.action to first step, update session.mode)
   - Error handling
4. Test with packet that has decisions and convergence signal

**Verification:**
- Returns 1-5 steps (not 20+)
- Steps are actionable and sequenced
- User can start step 1 within 5 minutes
- Plan reflects existing decisions

**References:**
- Spec section 3.3.4 for plan structure
- Follow handler pattern from other modes

---

### [x] Step: Integration Testing and Build Verification
<!-- chat-id: 05fec314-9d3a-4182-938b-e34a915faa0a -->

Test end-to-end integration with Supervisor and verify all build commands pass.

**Tasks:**
1. Test Supervisor → Dojo Agent routing with various queries
2. Verify mode selection triggers correctly for each mode:
   - Mirror: "I'm torn between..." → Mirror mode
   - Scout: "What are my options?" → Scout mode
   - Gardener: "I have 7 ideas, help me focus" → Gardener mode
   - Implementation: "Let's build this" → Implementation mode
3. Verify DojoPacket updates are correct after each mode
4. Verify NextMove is actionable in each response
5. Check Harness Trace events are logged correctly
6. Run `npm run build` and verify success
7. Run `npm run lint` and fix any warnings
8. Run `npm run type-check` and verify zero errors

**Verification:**
- All build commands pass without errors
- Manual testing shows correct routing and responses
- Trace events visible in logs
- DojoPacket structure maintained correctly

**Test Scenarios:**
- Empty packet (new session) → creates minimal packet
- Packet with perspectives but no decisions → appropriate mode selected
- Packet with decisions → Implementation mode preferred
- Invalid/empty user messages → graceful fallback

---

### [x] Step: Documentation and Code Quality
<!-- chat-id: f3be8be3-1364-43ab-87c0-8830063e5792 -->

Add comprehensive TSDoc comments and ensure code quality standards.

**Tasks:**
1. Add TSDoc comments to all exported functions (handleDojoQuery, invokeDojoAgent, selectDojoMode, all mode handlers)
2. Add inline comments for complex logic (mode selection heuristics, packet construction)
3. Review naming conventions for consistency with codebase
4. Remove any debugging console.log statements
5. Verify no `any` types remain in code
6. Verify all imports are used (no unused imports)
7. Final code review against requirements checklist

**Verification:**
- All public functions have TSDoc headers
- Code follows patterns in `librarian-handler.ts`
- No TypeScript `any` types
- Clean linter output
- Meets all acceptance criteria from task description

**Acceptance Criteria Checklist:**
- [x] New `dojo-handler.ts` file created with required interfaces
- [x] `handleDojoQuery` correctly routes to four mode handlers
- [x] Each mode handler (Mirror, Scout, Gardener, Implementation) implemented with targeted LLM prompts
- [x] Agent processes DojoPacket and returns DojoAgentResponse with NextMove and summary
- [x] All operations instrumented with Harness Trace spans
- [x] `invokeDojoAgent` function created as entry point for Supervisor
- [x] Code is clean, well-documented, follows existing patterns
- [x] Application builds successfully (`npm run build`)
- [x] No linter warnings (`npm run lint`)
- [x] No type errors (`npm run type-check`)
