# Product Requirements Document: Agent Activity Panel Wiring

**Version:** 1.0  
**Date:** January 2026  
**Status:** Ready for Implementation  
**Priority:** Critical (Track 3, Feature 1 - v1.0 Roadmap)

---

## 1. Executive Summary

### 1.1 Objective
Transform the `AgentActivityPanel` from a static, mock-data display into a live, real-time observability interface that streams agent execution events from the Supervisor API. This feature is core to the "Transparent, not opaque" brand promise and provides users with unprecedented visibility into AI reasoning processes.

### 1.2 Success Criteria
- Real-time streaming of agent activity from Supervisor API to UI
- Live updates to agent status cards showing current state, progress, and messages
- Accurate cost and duration tracking displayed in real-time
- Activity log populates with events as they occur
- Seamless integration with Workbench view
- Robust error handling and recovery
- Performance: UI updates within 100ms of receiving stream events

---

## 2. Current State Analysis

### 2.1 Existing Architecture
**Component Structure:**
- `AgentActivityPanel` (`components/layout/AgentActivityPanel.tsx`) - Currently in layout, uses mock data
- `AgentCard` (`components/agent/AgentCard.tsx`) - Displays individual agent status
- `SystemInfo` (`components/agents/SystemInfo.tsx`) - Shows hardcoded cost/duration
- `ActivityLog` (`components/agents/ActivityLog.tsx`) - Shows hardcoded activity entries
- `useAgentStatus` hook - Polls `/api/agents/status` endpoint and derives status from activity context

**Data Flow:**
- `useAgentStatus` hook polls API every 2.5 seconds
- Status derived from `useActivity` context (based on `AgentActivity` interface)
- No real-time streaming or event-driven updates
- Mock data displayed in SystemInfo and ActivityLog

**Agent System:**
- 4 agents: Supervisor, Dojo, Librarian, Debugger
- Status types: idle, thinking, working, error
- Harness Trace system exists for capturing execution events
- Current supervisor API (`/app/api/supervisor/route/route.ts`) returns JSON routing decisions, not streaming events

### 2.2 Key Gaps
1. **No streaming API**: Current supervisor API returns JSON, not server-sent events (SSE)
2. **No centralized agent state**: Agent status scattered across multiple contexts
3. **Panel location**: Currently in layout, needs to be in Workbench for feature integration
4. **Mock data**: SystemInfo and ActivityLog use hardcoded values
5. **No event processing**: No logic to translate HarnessTrace events into UI state updates

---

## 3. Feature Requirements

### 3.1 Core Functionality

#### F1: Real-time Event Streaming
**Description:** Establish SSE connection to stream HarnessTrace events from Supervisor API

**Requirements:**
- Create or modify supervisor API endpoint to support streaming responses
- Stream format: newline-delimited JSON (NDJSON)
- Each line contains a single `HarnessEvent` object
- Connection persists for duration of agent run
- Graceful connection close on run completion or error

**Event Types to Stream:**
- `SESSION_START` - Run initiated
- `AGENT_ROUTING` - Supervisor routing decision
- `AGENT_HANDOFF` - Agent-to-agent handoff
- `AGENT_ACTIVITY_START` - Agent begins task
- `AGENT_ACTIVITY_PROGRESS` - Progress update (0-100)
- `AGENT_ACTIVITY_COMPLETE` - Agent completes task
- `TOOL_INVOCATION` - External tool called
- `COST_TRACKED` - Cost update
- `ERROR` - Error occurred
- `SESSION_END` - Run complete

#### F2: Centralized Agent State Store
**Description:** Single source of truth for agent system state during a run

**State Schema:**
```typescript
interface AgentActivityState {
  runId: string | null;
  isRunning: boolean;
  statuses: AgentStatusMap;  // status for each of 4 agents
  trace: HarnessEvent[];     // complete event history
  cost: number;              // accumulated cost in USD
  duration: number;          // elapsed time in seconds
  error: string | null;      // error message if failed
  
  // Actions
  startRun: () => void;
  addTraceEvent: (event: HarnessEvent) => void;
  endRun: () => void;
  setError: (error: string) => void;
}
```

**State Management:**
- Use Zustand (matches existing `workbench.store.ts` pattern)
- Reset state on `startRun` (clear previous run data)
- `addTraceEvent` updates derived state (statuses, cost, duration)
- Reactive: UI components auto-update when state changes

#### F3: Event-to-State Transformation
**Description:** Logic to interpret HarnessEvent data and update AgentStatusMap

**Event Processing Rules:**
| Event Type | Status Update | Message Update | Progress Update | Cost/Duration |
|------------|--------------|----------------|-----------------|---------------|
| `AGENT_ROUTING` | Supervisor → working | "Routing query..." | N/A | Update cost |
| `AGENT_HANDOFF` | Target agent → working | "Receiving handoff..." | 0 | Update cost |
| `AGENT_ACTIVITY_START` | Agent → working | From `inputs.message` | 0 | Start timer |
| `AGENT_ACTIVITY_PROGRESS` | Agent → working | From `inputs.message` | From `metadata.progress` | Update |
| `AGENT_ACTIVITY_COMPLETE` | Agent → idle | "Task complete" | 100 | Update all |
| `TOOL_INVOCATION` | Agent → working | "Using {tool}..." | N/A | Update cost |
| `ERROR` | Agent → error | Error message | N/A | Update |
| `SESSION_END` | All → idle | "Run complete" | N/A | Final update |

**Implementation Notes:**
- Extract agent ID from `inputs.agent_id` or `metadata.agent_id`
- Calculate duration from run start timestamp to current event timestamp
- Accumulate cost from `metadata.cost_usd` across all events
- Maintain full trace history for activity log

#### F4: Supervisor Consumption Hook
**Description:** React hook to manage streaming connection and feed store

**Interface:**
```typescript
interface UseSupervisorReturn {
  run: (prompt: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
```

**Behavior:**
- `run()` function:
  1. Call `startRun()` on store
  2. POST to `/api/supervisor` with prompt
  3. Get `response.body` ReadableStream
  4. Use `TextDecoder` and `getReader()` to read chunks
  5. Split by newlines, parse each as JSON
  6. Call `addTraceEvent()` for each valid event
  7. Call `endRun()` when stream closes
  8. Handle errors with `setError()` and `endRun()`

#### F5: Workbench Integration
**Description:** Move AgentActivityPanel into Workbench and wire to store

**Changes Required:**
1. **Remove from layout**: Currently in `components/layout/ResizableLayout.tsx`
2. **Add to Workbench**: Integrate into `components/workbench/WorkbenchView.tsx`
3. **Connect to store**: Replace `useAgentStatus` with `useAgentStore`
4. **Wire ActionBar**: Replace fetch call with `useSupervisor().run()`

**Layout:**
```
[TabBar]
[Editor (flex-1)]
  [ActionBar]
[AgentActivityPanel (resizable, right side)]
```

### 3.2 User Experience Requirements

#### UX1: Run Initiation
- User clicks "Run" button in Workbench
- AgentActivityPanel clears previous run data
- Supervisor card shows "Routing query..." with pulsing status dot
- Other agent cards show idle state

#### UX2: Real-time Updates
- As events stream in, corresponding AgentCard updates immediately
- Status dot animates (pulsing for working, static for idle/error)
- Message text updates to show current task
- Progress bar animates smoothly for progress events
- SystemInfo updates cost and duration continuously
- ActivityLog adds new entries at top, capped at 5 most recent

#### UX3: Run Completion
- Final `SESSION_END` event received
- All agents transition to idle state
- Final cost and duration displayed
- Activity log shows "Run complete" entry
- Stream connection closes gracefully

#### UX4: Error Handling
- Network errors: Display toast notification, show error in panel
- Stream parsing errors: Log to console, skip malformed events
- API errors: Display error message in AgentActivityPanel
- Connection loss: Retry logic with exponential backoff (optional for v1)

### 3.3 Non-Functional Requirements

#### Performance
- **Latency**: UI updates within 100ms of receiving event
- **Memory**: Cap trace history at 1000 events (circular buffer)
- **Responsiveness**: No frame drops during streaming (60fps maintained)

#### Reliability
- **Error recovery**: Graceful degradation if stream fails
- **State consistency**: Store always reflects accurate state
- **No memory leaks**: Proper cleanup on component unmount

#### Scalability
- Handle runs with 500+ events without performance degradation
- Support multiple rapid consecutive runs without state corruption

---

## 4. Technical Assumptions & Decisions

### 4.1 Streaming API Implementation
**Assumption**: The task description states "This API returns a `ReadableStream` of `HarnessTrace` events when called."

**Reality**: Current `/app/api/supervisor/route/route.ts` returns JSON routing decisions.

**Decision**:
- **Option A** (Preferred): Modify existing `/api/supervisor/route` endpoint to support streaming
  - Check request header for `Accept: text/event-stream`
  - If streaming requested, return `ReadableStream` of events
  - If not, return existing JSON response (backward compatible)
  
- **Option B**: Create new endpoint `/api/supervisor/stream`
  - Dedicated endpoint for streaming
  - Existing endpoint unchanged
  - Requires coordinating two APIs

**Recommendation**: Option A for simplicity and single source of truth. Will verify with implementation team.

### 4.2 Event Streaming Format
**Decision**: Use newline-delimited JSON (NDJSON) format
- Industry standard for SSE
- Simple to parse (`split('\n').map(JSON.parse)`)
- Compatible with `TextDecoder` and `ReadableStream`

**Format Example:**
```
{"span_id":"span_001","event_type":"SESSION_START","timestamp":"2026-01-15T12:00:00Z",...}
{"span_id":"span_002","event_type":"AGENT_ROUTING","timestamp":"2026-01-15T12:00:01Z",...}
```

### 4.3 Store Implementation
**Decision**: Use Zustand over Context API
- **Rationale**: Existing codebase uses Zustand (`workbench.store.ts`)
- Better performance for frequent updates
- Simpler API than Redux
- Built-in devtools support

### 4.4 Event Type Mapping
**Decision**: Stream individual `HarnessEvent` objects, not full `HarnessTrace`
- **Rationale**: 
  - `HarnessTrace` is the complete trace (all events + summary)
  - For streaming, send incremental `HarnessEvent` objects
  - Client accumulates events into trace array
  - Client computes derived state (cost, duration, statuses)

### 4.5 Agent Status Derivation
**Decision**: Maintain separate status per agent, update based on event metadata
- Extract agent ID from `inputs.agent_id`, `outputs.agent_id`, or `metadata.agent_id`
- Default to 'supervisor' if agent ID not present in routing/handoff events
- Map event types to status transitions per F3 table

---

## 5. Open Questions & Clarifications

### Q1: Supervisor API Modification (CRITICAL)
**Question**: Does the supervisor API already support streaming, or does it need to be implemented?

**Impact**: High - affects timeline and technical approach

**Decision Made**: Assume API needs modification to support streaming. Will implement Option A (modify existing endpoint to support both JSON and streaming responses).

### Q2: Event Frequency & Throttling
**Question**: How frequently will events be streamed? Should UI updates be throttled?

**Impact**: Medium - affects performance and UX

**Decision Made**: No throttling in v1. Monitor performance and add throttling if needed. Expectation: ~1-10 events per second during active run.

### Q3: Run Persistence
**Question**: Should run history be persisted to database, or only held in memory?

**Impact**: Medium - affects data architecture

**Decision Made**: Memory-only for v1 (cleared on refresh). Harness trace system already handles persistence. This feature focuses on real-time observability.

### Q4: Multiple Concurrent Runs
**Question**: Should the system support multiple workbench tabs running simultaneously?

**Impact**: Medium - affects state management

**Decision Made**: Single run at a time for v1. Disable "Run" button while `isRunning === true`. Future enhancement can support per-tab runs.

### Q5: Progress Calculation
**Question**: For events without explicit progress, should we interpolate progress based on task type?

**Impact**: Low - affects UX polish

**Decision Made**: Only show progress bar when event includes `metadata.progress`. Otherwise, show pulsing status dot without progress bar.

---

## 6. Success Metrics

### Launch Criteria (P0 - Must Have)
- [ ] `agent.store.ts` created and integrated
- [ ] `useSupervisor` hook created and tested
- [ ] Supervisor API returns streaming events
- [ ] AgentActivityPanel moved to Workbench
- [ ] AgentCards update in real-time during run
- [ ] SystemInfo shows live cost and duration
- [ ] ActivityLog shows last 5 events
- [ ] Error handling: network failures, parsing errors, API errors
- [ ] Application builds without errors (`npm run build`)
- [ ] No TypeScript errors (`npm run typecheck` if available)

### Quality Criteria (P1 - Should Have)
- [ ] Smooth animations (no jank during streaming)
- [ ] Graceful degradation on slow connections
- [ ] Console logs for debugging (can be removed post-launch)
- [ ] Unit tests for event-to-state transformation logic
- [ ] Integration test: mock stream → verify UI updates

### Delight Criteria (P2 - Nice to Have)
- [ ] Retry logic for failed connections
- [ ] Toast notifications for run start/complete
- [ ] Keyboard shortcut for "Run" (Cmd/Ctrl+Enter)
- [ ] Export trace data as JSON

---

## 7. Out of Scope (Future Enhancements)

- **Pause/Resume runs**: Requires API support
- **Run history browser**: Navigate previous runs
- **Real-time collaboration**: Multi-user observability
- **Agent interaction**: Send messages to agents mid-run
- **Performance profiling**: Flame graphs, bottleneck detection
- **Cost alerts**: Notify when cost exceeds threshold

---

## 8. Dependencies & Risks

### Dependencies
- **Harness Trace System**: Existing, well-documented (`lib/harness/`)
- **Zustand**: Already in dependencies
- **Monaco Editor**: Already integrated in Workbench
- **Supervisor Agent**: Must support streaming

### Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Supervisor API doesn't support streaming | Medium | High | Implement streaming endpoint as part of this feature |
| Event parsing errors break UI | Medium | Medium | Wrap parsing in try-catch, skip malformed events |
| Memory leaks from unclosed streams | Low | High | Test cleanup logic, use AbortController |
| Performance degradation with many events | Low | Medium | Implement circular buffer (cap at 1000 events) |

---

## 9. Design System Compliance

All UI updates must adhere to the Dojo Genesis Brand Guide:

**Colors:**
- Supervisor: `--supervisor-primary: #f5a623` (Amber)
- Dojo: `--dojo-primary: #f39c5a` (Sunset Orange)
- Librarian: `--librarian-primary: #ffd699` (Sunrise Yellow)
- Debugger: `--debugger-primary: #6b7f91` (Mountain Blue-Gray)

**Status Dot Colors:**
- Idle: `--text-tertiary: #8a9dad`
- Working: Agent-specific color (pulsing animation)
- Error: `--error-primary: #ef4444`

**Timing:**
- Status transitions: `--timing-fast: 200ms`
- Progress bar updates: `--timing-normal: 300ms`
- Status dot pulse: `--timing-patient: 1000ms`

---

## 10. Implementation Notes

### File Structure
```
lib/stores/
  agent.store.ts          [NEW] - Zustand store for agent state

hooks/
  useSupervisor.ts        [NEW] - Hook for streaming API

components/workbench/
  WorkbenchView.tsx       [MODIFY] - Add AgentActivityPanel, wire useSupervisor

components/layout/
  AgentActivityPanel.tsx  [MODIFY] - Connect to agent.store, remove from layout

app/api/supervisor/
  route/route.ts          [MODIFY] - Add streaming support
```

### Testing Strategy
1. **Unit Tests**:
   - `addTraceEvent` logic (event → state transformation)
   - Edge cases: malformed events, missing agent IDs, negative costs

2. **Integration Tests**:
   - Mock streaming endpoint, verify UI updates
   - Test error scenarios: network failure, stream close

3. **Manual Testing**:
   - Run real prompts, observe panel updates
   - Test rapid consecutive runs
   - Test browser refresh during run

---

## 11. Acceptance Test Scenarios

### Scenario 1: Successful Run
1. Open Workbench
2. Enter prompt: "Create a React component"
3. Click "Run" button
4. **Verify**: Supervisor card shows "Routing query...", status = working
5. **Verify**: Within 2s, Dojo card shows "Creating component...", status = working
6. **Verify**: Progress bar appears and animates 0 → 100%
7. **Verify**: SystemInfo cost increases (e.g., $0.0001 → $0.0025)
8. **Verify**: SystemInfo duration increases (e.g., 0s → 3s → 5s)
9. **Verify**: ActivityLog shows entries: "Routing query...", "Creating component...", "Task complete"
10. **Verify**: All agents return to idle state
11. **Verify**: "Run complete" toast appears

### Scenario 2: Error Handling
1. Open Workbench
2. Disconnect network or mock API error
3. Click "Run" button
4. **Verify**: Error message shown in panel or toast
5. **Verify**: Agents return to idle state (not stuck in "working")
6. **Verify**: isRunning = false (Run button re-enabled)

### Scenario 3: Multiple Runs
1. Complete Scenario 1
2. Modify prompt, click "Run" again
3. **Verify**: Previous run data cleared (cost resets to $0, trace cleared)
4. **Verify**: New run streams correctly
5. **Verify**: No state pollution from previous run

---

## 12. Appendix: Event Schema Reference

**HarnessEvent (from `lib/harness/types.ts`):**
```typescript
interface HarnessEvent {
  span_id: string;
  parent_id: string | null;
  event_type: HarnessEventType;
  timestamp: string;  // ISO 8601
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  metadata: HarnessMetadata;
  children?: HarnessEvent[];
}

interface HarnessMetadata {
  duration_ms?: number;
  token_count?: number;
  cost_usd?: number;
  confidence?: number;
  error_message?: string;
  agent_id?: string;
  progress?: number;  // 0-100
  [key: string]: any;
}
```

**AgentStatusMap (from `lib/types.ts`):**
```typescript
interface AgentStatusMap {
  supervisor: AgentStatusInfo;
  dojo: AgentStatusInfo;
  librarian: AgentStatusInfo;
  debugger: AgentStatusInfo;
}

interface AgentStatusInfo {
  agentId: 'supervisor' | 'dojo' | 'librarian' | 'debugger';
  status: 'idle' | 'thinking' | 'working' | 'error';
  message?: string;
  lastActive?: string;
  progress?: number;
}
```

---

**Document Status:** ✅ Complete - Ready for Technical Specification phase
