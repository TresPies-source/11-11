# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: 5c40bbf8-218d-4538-bc57-c73e9732ac11 -->

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: a210c6dc-3808-445a-88ec-9e6f218f17d0 -->

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
<!-- chat-id: 3f2ddd43-d313-419f-a834-b947d0381ea4 -->

Create a detailed implementation plan based on `{@artifacts_path}/spec.md`.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps
3. Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function) or too broad (entire feature).

If the feature is trivial and doesn't warrant full specification, update this workflow to remove unnecessary steps and explain the reasoning to the user.

Save to `{@artifacts_path}/plan.md`.

---

## Implementation Tasks

### [x] Task 1: Create Agent Store Foundation
<!-- chat-id: 434786e3-4af4-4d12-8a99-ad8fc6f20af4 -->

Create the Zustand store at `lib/stores/agent.store.ts` with core state management.

**Contract Reference:** `spec.md` Section 3.1 - agent.store.ts interface  
**Requirements:** `requirements.md` Section 3.1 F2 - Centralized Agent State Store

**Implementation:**
- Create `lib/stores/agent.store.ts`
- Define `AgentActivityState` interface with:
  - State: runId, isRunning, statuses, trace, cost, duration, error, startedAt
  - Actions: startRun, addTraceEvent, endRun, setError
- Implement `startRun()`: reset state, generate runId, set isRunning=true
- Implement `endRun()`: set isRunning=false
- Implement `setError(error)`: set error message, call endRun()
- Implement initial `addTraceEvent()`: append to trace array (full logic in Task 2)
- Initialize default statuses for all 4 agents (supervisor, dojo, librarian, debugger)

**Verification:**
- [ ] Import store in test file without errors
- [ ] `startRun()` resets state, sets isRunning=true
- [ ] `endRun()` sets isRunning=false
- [ ] `setError()` sets error and calls endRun()
- [ ] No TypeScript compilation errors

---

### [x] Task 2: Implement Event Processing Logic
<!-- chat-id: cda96a72-bbf3-4288-93c8-167a37b62d7a -->

Add event-to-state transformation logic to `addTraceEvent()`.

**Contract Reference:** `spec.md` Section 3.1 - Event-to-Status Mapping table  
**Requirements:** `requirements.md` Section 3.1 F3 - Event-to-State Transformation

**Implementation:**
- Update `addTraceEvent()` in `agent.store.ts`:
  - Append event to trace array
  - Extract agent ID from event (inputs.agent_id, outputs.agent_id, metadata.agent_id)
  - Map event_type to status update:
    - SESSION_START → supervisor: working, "Routing query..."
    - AGENT_ROUTING → supervisor: working, message from inputs
    - AGENT_HANDOFF → target agent: working, "Receiving handoff..."
    - AGENT_ACTIVITY_START → agent: working, message from inputs, progress=0
    - AGENT_ACTIVITY_PROGRESS → agent: working, update progress from metadata
    - AGENT_ACTIVITY_COMPLETE → agent: idle, "Task complete", progress=100
    - TOOL_INVOCATION → agent: working, "Using {tool}..."
    - ERROR → agent: error, message from metadata.error_message
    - SESSION_END → all agents: idle, "Run complete"
  - Accumulate cost from metadata.cost_usd
  - Calculate duration from startedAt to event.timestamp
  - Implement circular buffer: cap trace at 1000 events

**Verification:**
- [ ] Test SESSION_START event → supervisor status='working'
- [ ] Test AGENT_ROUTING event → cost accumulates
- [ ] Test AGENT_ACTIVITY_PROGRESS → progress updates
- [ ] Test with 1001 events → trace length = 1000
- [ ] No TypeScript errors

---

### [x] Task 3: Create useSupervisor Hook
<!-- chat-id: 64bb4220-23d7-406e-9ea6-8b799c86fab0 -->

Create `hooks/useSupervisor.ts` for streaming connection management.

**Contract Reference:** `spec.md` Section 3.1 - useSupervisor interface  
**Requirements:** `requirements.md` Section 3.1 F4 - Supervisor Consumption Hook

**Implementation:**
- Create `hooks/useSupervisor.ts`
- Define `UseSupervisorReturn` interface: { run, isLoading, error }
- Implement `run(prompt)` function:
  1. Set isLoading=true, error=null
  2. Call startRun() from agent store
  3. POST to `/api/supervisor/route/route` with:
     - headers: Content-Type: application/json, Accept: text/event-stream
     - body: { query: prompt, conversation_context: [], session_id: UUID, stream: true }
  4. Get response.body ReadableStream
  5. Use TextDecoder + getReader() to read chunks
  6. Buffer incomplete lines, split by '\n'
  7. Parse each complete line as JSON (HarnessEvent)
  8. Call addTraceEvent() for each valid event
  9. On stream done, call endRun()
  10. Wrap in try-catch-finally: setError() on error, endRun() in finally
- Handle parse errors per-line (log and skip)
- Handle network errors (setError and endRun)

**Verification:**
- [ ] Hook can be imported without errors
- [ ] run() logs events to console (manual test with mock API)
- [ ] Network error → error state set, endRun() called
- [ ] Malformed JSON → logged to console, other events processed
- [ ] No TypeScript errors

---

### [x] Task 4: Modify Supervisor API for Streaming
<!-- chat-id: b4df7cae-01fa-463d-9d1d-08eee9dea10a -->

Update `/app/api/supervisor/route/route.ts` to support streaming mode.

**Contract Reference:** `spec.md` Section 3.2 - Modified API route.ts  
**Requirements:** `requirements.md` Section 3.1 F1 - Real-time Event Streaming

**Implementation:**
- Modify `POST /api/supervisor/route/route`:
  1. Parse request body: extract `stream` field
  2. Detect streaming mode: `stream === true || Accept header includes 'text/event-stream'`
  3. If streaming mode:
     - Create ReadableStream with TextEncoder
     - Emit SESSION_START event (span_id, event_type, timestamp, inputs, outputs, metadata)
     - Call existing routeWithFallback()
     - Emit AGENT_ROUTING event (include cost from usage)
     - Emit SESSION_END event
     - Return NextResponse with ReadableStream, headers: Content-Type: text/event-stream
  4. If JSON mode: keep existing behavior (backward compatible)
  5. Add error handling: emit ERROR event on failures
- Format: newline-delimited JSON (NDJSON)

**Verification:**
- [ ] cURL with `Accept: text/event-stream` returns NDJSON stream
- [ ] cURL without header returns JSON (backward compatible)
- [ ] Events include required fields: span_id, event_type, timestamp, metadata.cost_usd
- [ ] No TypeScript errors

---

### [x] Task 5: Refactor AgentActivityPanel Component
<!-- chat-id: d4256fa0-e325-48f4-9aac-de41516417bd -->

Update `components/layout/AgentActivityPanel.tsx` to use agent store.

**Contract Reference:** `spec.md` Section 3.2 - AgentActivityPanel.tsx changes  
**Requirements:** `requirements.md` Section 3.1 F5 - Workbench Integration

**Implementation:**
- Remove import of `useAgentStatus`
- Add import of `useAgentStore` from `lib/stores/agent.store`
- Replace state consumption:
  - Remove: `const { agentStatuses } = useAgentStatus();`
  - Add: `const { statuses, cost, duration, trace, isRunning } = useAgentStore();`
- Map over statuses object to render AgentCards:
  - Use AGENT_ORDER constant for consistent ordering
  - Pass status.status, status.message, status.progress to AgentCard
- Update SystemInfo props:
  - cost: `$${cost.toFixed(4)}`
  - duration: `${duration.toFixed(1)}s`
- Update ActivityLog props:
  - Convert trace to activities: `trace.slice(-5).reverse().map(event => ...)`
  - Extract agent from event (metadata.agent_id || inputs.agent_id || outputs.agent_id)
  - Extract message from event (inputs.message || event_type)
- Add helper functions: `extractAgentFromEvent()`, `extractMessageFromEvent()`

**Verification:**
- [ ] Component renders without errors
- [ ] AgentCards display correct status from store
- [ ] SystemInfo shows cost and duration from store
- [ ] ActivityLog shows converted trace events
- [ ] No TypeScript errors

---

### [x] Task 6: Move AgentActivityPanel to Workbench
<!-- chat-id: 008888ae-bb07-4bcf-a847-8edbdd4cba23 -->

Integrate the panel into WorkbenchView and remove from layout.

**Contract Reference:** `spec.md` Section 3.2 - WorkbenchView.tsx, ResizableLayout.tsx  
**Requirements:** `requirements.md` Section 3.1 F5 - Workbench Integration

**Implementation:**
- Move file from `components/layout/AgentActivityPanel.tsx` to `components/agents/AgentActivityPanel.tsx`
- Update imports in files that reference it
- Modify `components/workbench/WorkbenchView.tsx`:
  - Import AgentActivityPanel from new location
  - Import useSupervisor hook
  - Add supervisor hook: `const supervisor = useSupervisor();`
  - Update handleRun():
    - Remove existing fetch logic
    - Replace with: `await supervisor.run(activeTab.content)`
    - Add toast notifications for success/error
  - Update ActionBar: pass `isRunning={supervisor.isLoading}`
  - Add AgentActivityPanel to layout:
    - Left side: Editor + ActionBar (flex-1)
    - Right side: AgentActivityPanel (w-80, fixed 320px)
- Modify `components/layout/ResizableLayout.tsx`:
  - Remove AgentActivityPanel from layout (no longer global)
  - Update resizable panels configuration if needed

**Verification:**
- [x] AgentActivityPanel appears on right side of Workbench
- [x] Panel does not appear in other pages/layouts
- [x] Layout is horizontal split (editor left, panel right)
- [x] No TypeScript errors
- [x] No runtime errors in console

---

### [x] Task 7: Implement Error Handling
<!-- chat-id: 76a0355b-ef4f-41d6-9c8b-4a209867b555 -->

Add comprehensive error handling to hook and UI.

**Contract Reference:** `spec.md` Section 2.2 - Error Handling flow  
**Requirements:** `requirements.md` Section 3.2 UX4 - Error Handling

**Implementation:**
- Update `useSupervisor.ts`:
  - Wrap entire run() in try-catch-finally
  - Catch network errors: set error state, call setStoreError(), endRun()
  - Catch parse errors per-line: log to console, skip event, continue
  - Finally block: always call endRun(), setIsLoading(false)
  - Check response.ok before processing stream
  - Handle null response.body
- Update `WorkbenchView.tsx`:
  - Add error toast notifications
  - Display supervisor.error in UI if present
  - Disable Run button when supervisor.isLoading === true
- Test error scenarios:
  - Network down (offline mode)
  - Malformed JSON in stream
  - API returns 500 error
  - Stream closes unexpectedly

**Verification:**
- [ ] Offline mode → error toast shown, Run button re-enabled
- [ ] Malformed event → logged, other events processed
- [ ] HTTP 500 → error message shown
- [ ] Rapid consecutive runs → second waits for first
- [ ] No memory leaks (cleanup in finally block)

---

### [x] Task 8: Add UI Polish and Loading States
<!-- chat-id: 780484e3-74c0-4170-aeec-f7616f00f194 -->

Improve UX with loading states and toast notifications.

**Contract Reference:** `spec.md` Section 5 - Phase 5 Polish  
**Requirements:** `requirements.md` Section 3.2 UX1-UX3

**Implementation:**
- Update ActionBar button states:
  - Disable Run button when isRunning === true
  - Show loading spinner on Run button during execution
- Add toast notifications:
  - On run start: "Running prompt..."
  - On run success: "Run completed successfully"
  - On run error: "Error: {message}"
- Ensure smooth animations:
  - Status dot pulsing for working state
  - Progress bar smooth transitions
  - Cost/duration updates without flicker
- Test rapid interactions:
  - Click Run multiple times → only one run at a time
  - Switch tabs during run → state persists
  - Refresh page during run → clean state

**Verification:**
- [ ] Run button disabled during execution
- [ ] Toast appears for run start, success, error
- [ ] Animations smooth (60fps maintained)
- [ ] No console warnings
- [ ] UI responsive during streaming

---

### [x] Task 9: Testing and Build Verification
<!-- chat-id: 5464048a-e97f-4a93-9166-4d5cba35aaf9 -->

Run tests, type checking, and build to ensure production readiness.

**Contract Reference:** `spec.md` Section 7 - Verification Approach  
**Requirements:** `requirements.md` Section 6 - Success Metrics

**Implementation:**
- Manual testing scenarios:
  1. Successful run: Enter prompt → Run → Verify panel updates → Check cost/duration
  2. Error handling: Offline mode → Run → Verify error handling
  3. Multiple runs: Run → Run again → Verify state resets correctly
  4. Empty prompt: Try to run → Verify validation
- Code quality checks:
  - Run type checking (if npm script exists)
  - Run linting (if npm script exists)
  - Run build: `npm run build`
  - Check for console warnings/errors
- Verify acceptance criteria from requirements.md:
  - [x] agent.store.ts created and integrated
  - [x] useSupervisor hook created and tested
  - [x] Supervisor API returns streaming events
  - [x] AgentActivityPanel in Workbench (not layout)
  - [ ] AgentCards update in real-time (requires manual testing)
  - [ ] SystemInfo shows live cost and duration (requires manual testing)
  - [ ] ActivityLog shows events (requires manual testing)
  - [ ] Error handling works (requires manual testing)
  - [x] Build completes without errors

**Verification:**
- [ ] All manual test scenarios pass (requires manual testing in browser)
- [x] `npm run build` completes successfully
- [x] Type checking passes (if available)
- [x] Linting passes without errors or warnings
- [ ] No console errors during normal operation (requires manual testing)
- [ ] All acceptance criteria met (requires manual testing)

---

## Test Results

### Build Output
```
✅ Build completed successfully
Exit Code: 0
Execution Time: 27.8s

✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (53/53)
✓ Finalizing page optimization

All routes built successfully. Production build ready.
```

### Type Check Output
```
✅ Type checking passed
Exit Code: 0
Execution Time: 6.8s

> tsc --noEmit

No TypeScript compilation errors found.
```

### Lint Output
```
✅ Linting passed
Exit Code: 0
Execution Time: 2.7s

> next lint

✔ No ESLint warnings or errors
```

### Manual Testing Results
- [ ] Scenario 1: Successful Run - PASS/FAIL
- [ ] Scenario 2: Error Handling - PASS/FAIL
- [ ] Scenario 3: Multiple Runs - PASS/FAIL
- [ ] Scenario 4: Empty Prompt - PASS/FAIL
