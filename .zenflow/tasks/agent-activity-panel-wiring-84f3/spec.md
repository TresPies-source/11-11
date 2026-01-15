# Technical Specification: Agent Activity Panel Wiring

**Version:** 1.0  
**Date:** January 2026  
**Status:** Ready for Implementation  
**Track:** 3, Feature 1 (v1.0 Roadmap)

---

## 1. Technical Context

### 1.1 Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand
- **UI Libraries**: React, Framer Motion, Tailwind CSS
- **Runtime**: Node.js
- **Testing**: tsx for unit tests

### 1.2 Existing Dependencies
- `zustand` - Already used for workbench.store.ts
- Harness Trace system (`lib/harness/types.ts`) - Well-defined event types
- Agent types (`lib/types.ts`) - AgentStatusInfo, AgentStatusMap interfaces
- Streaming APIs - ReadableStream, TextDecoder (native Web APIs)

### 1.3 Key Design Patterns
- **Zustand stores**: Centralized state with actions/reducers pattern
- **Custom hooks**: Encapsulate business logic (useWorkbenchStore, useAgentStatus)
- **Streaming pattern**: ReadableStream with getReader() for SSE consumption
- **Component composition**: Container/presentational component separation

---

## 2. Implementation Approach

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      WorkbenchView.tsx                       │
│  ┌────────────────┐  ┌──────────────────────────────────┐  │
│  │   TabBar       │  │    useSupervisor()               │  │
│  │   Editor       │  │    - run(prompt)                 │  │
│  │   ActionBar    │  │    - manages stream connection   │  │
│  └────────────────┘  └──────────────────────────────────┘  │
│           │                        │                         │
│           └────────────────────────┼─────────────────────────┤
│                                    ▼                         │
│                        ┌──────────────────────┐             │
│                        │  agent.store.ts      │             │
│                        │  (Zustand)           │             │
│                        │  - runId             │             │
│                        │  - isRunning         │             │
│                        │  - statuses          │             │
│                        │  - trace             │             │
│                        │  - cost, duration    │             │
│                        └──────────────────────┘             │
│                                    ▲                         │
│                                    │                         │
│  ┌─────────────────────────────────┴──────────────────────┐ │
│  │         AgentActivityPanel.tsx                         │ │
│  │  - AgentCard × 4  (maps over statuses)                │ │
│  │  - SystemInfo     (reads cost, duration)              │ │
│  │  - ActivityLog    (reads trace events)                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ POST /api/supervisor/route/route
                                    │ Returns: ReadableStream<HarnessEvent>
                                    │
                        ┌───────────┴───────────┐
                        │  Supervisor API       │
                        │  - Detect streaming   │
                        │  - Return NDJSON      │
                        └───────────────────────┘
```

### 2.2 Data Flow

**Run Initiation:**
1. User clicks "Run" in WorkbenchView
2. `useSupervisor().run(prompt)` called
3. Store: `startRun()` - resets state, sets isRunning=true
4. POST to `/api/supervisor/route/route` with prompt
5. API returns ReadableStream

**Event Streaming:**
1. Hook reads stream chunks with TextDecoder
2. Parse NDJSON (split by `\n`, JSON.parse each line)
3. For each HarnessEvent: `addTraceEvent(event)`
4. Store updates: statuses, cost, duration, trace array
5. React components re-render automatically (Zustand subscriptions)

**Run Completion:**
1. Stream closes (reader.done === true)
2. Store: `endRun()` - sets isRunning=false
3. All agents transition to idle state

**Error Handling:**
1. Network/parse errors caught in try-catch
2. Store: `setError(message)` + `endRun()`
3. UI displays error in panel/toast

---

## 3. Source Code Structure Changes

### 3.1 New Files

#### `lib/stores/agent.store.ts`
**Purpose:** Centralized Zustand store for agent execution state

**Interface:**
```typescript
import { create } from 'zustand';
import { HarnessEvent } from '@/lib/harness/types';
import { AgentStatusMap, AgentStatusInfo } from '@/lib/types';

interface AgentActivityState {
  // State
  runId: string | null;
  isRunning: boolean;
  statuses: AgentStatusMap;
  trace: HarnessEvent[];
  cost: number;
  duration: number;
  error: string | null;
  startedAt: number | null;

  // Actions
  startRun: (runId?: string) => void;
  addTraceEvent: (event: HarnessEvent) => void;
  endRun: () => void;
  setError: (error: string) => void;
}
```

**Key Logic:**
- `startRun`: Reset all state to defaults, generate runId (UUID), set startedAt timestamp
- `addTraceEvent`: 
  - Append event to trace array
  - Update agent status based on event type (see event mapping table)
  - Accumulate cost from `event.metadata.cost_usd`
  - Calculate duration from startedAt to event.timestamp
  - Cap trace at 1000 events (circular buffer)
- `endRun`: Set isRunning=false, keep trace/cost/duration for display
- `setError`: Set error message, call endRun()

**Event-to-Status Mapping:**
| Event Type | Update Logic |
|------------|--------------|
| `SESSION_START` | supervisor → working, message="Routing query..." |
| `AGENT_ROUTING` | supervisor → working, message from inputs.message |
| `AGENT_HANDOFF` | Extract target agent from outputs.agent_id → working |
| `AGENT_ACTIVITY_START` | agent → working, message from inputs.message, progress=0 |
| `AGENT_ACTIVITY_PROGRESS` | agent → working, message from inputs.message, progress from metadata.progress |
| `AGENT_ACTIVITY_COMPLETE` | agent → idle, message="Task complete", progress=100 |
| `TOOL_INVOCATION` | Extract agent from metadata.agent_id → working, message="Using {tool}..." |
| `ERROR` | Extract agent → error, message from metadata.error_message |
| `SESSION_END` | All agents → idle, message="Run complete" |

**Patterns from workbench.store.ts:**
- Use `create<T>((set) => ({ ... }))` pattern
- Immutable updates: `set((state) => ({ ...state, newValue }))`
- Nested object updates with spread operator

#### `hooks/useSupervisor.ts`
**Purpose:** React hook to manage streaming connection to Supervisor API

**Interface:**
```typescript
interface UseSupervisorReturn {
  run: (prompt: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
```

**Implementation Details:**
```typescript
import { useState } from 'react';
import { useAgentStore } from '@/lib/stores/agent.store';

export function useSupervisor(): UseSupervisorReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { startRun, addTraceEvent, endRun, setError: setStoreError } = useAgentStore();

  const run = async (prompt: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const runId = crypto.randomUUID();
      startRun(runId);

      const response = await fetch('/api/supervisor/route/route', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          query: prompt,
          conversation_context: [],
          session_id: crypto.randomUUID(),
          stream: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Stream processing
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // Split by newlines
        const lines = buffer.split('\n');
        
        // Keep incomplete line in buffer
        buffer = lines.pop() || '';

        // Parse complete lines
        for (const line of lines) {
          if (line.trim()) {
            try {
              const event = JSON.parse(line);
              addTraceEvent(event);
            } catch (parseError) {
              console.warn('[useSupervisor] Failed to parse event:', line, parseError);
            }
          }
        }
      }

      endRun();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run prompt';
      setError(errorMessage);
      setStoreError(errorMessage);
      endRun();
    } finally {
      setIsLoading(false);
    }
  };

  return { run, isLoading, error };
}
```

**Error Handling:**
- Network errors: Caught in outer try-catch
- Parse errors: Caught per-line, logged to console, skipped
- HTTP errors: Check response.ok before processing
- Cleanup: Always call endRun() in finally block

### 3.2 Modified Files

#### `app/api/supervisor/route/route.ts`
**Current Behavior:** Returns JSON routing decision

**New Behavior:** Support both JSON and streaming modes

**Changes:**
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, conversation_context, session_id, stream } = body;

    // Validation (existing logic)
    // ...

    // Check if streaming is requested
    const shouldStream = stream === true || 
                        request.headers.get('Accept')?.includes('text/event-stream');

    if (shouldStream) {
      // NEW: Streaming mode
      const encoder = new TextEncoder();
      
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            // Emit SESSION_START event
            const sessionStart: HarnessEvent = {
              span_id: crypto.randomUUID(),
              parent_id: null,
              event_type: 'SESSION_START',
              timestamp: new Date().toISOString(),
              inputs: { query, session_id },
              outputs: {},
              metadata: {},
            };
            controller.enqueue(encoder.encode(JSON.stringify(sessionStart) + '\n'));

            // Get routing decision (existing logic)
            const result = await routeWithFallback({
              query,
              conversation_context: conversationContext,
              session_id,
              available_agents: getAvailableAgents(),
            });

            // Emit AGENT_ROUTING event
            const routingEvent: HarnessEvent = {
              span_id: crypto.randomUUID(),
              parent_id: sessionStart.span_id,
              event_type: 'AGENT_ROUTING',
              timestamp: new Date().toISOString(),
              inputs: { query, message: 'Routing query...' },
              outputs: { agent_id: result.agent_id, confidence: result.confidence },
              metadata: { 
                cost_usd: result.usage?.total_tokens * 0.00000025 || 0,
                agent_id: 'supervisor'
              },
            };
            controller.enqueue(encoder.encode(JSON.stringify(routingEvent) + '\n'));

            // Emit SESSION_END event
            const sessionEnd: HarnessEvent = {
              span_id: crypto.randomUUID(),
              parent_id: sessionStart.span_id,
              event_type: 'SESSION_END',
              timestamp: new Date().toISOString(),
              inputs: {},
              outputs: { agent_id: result.agent_id },
              metadata: {},
            };
            controller.enqueue(encoder.encode(JSON.stringify(sessionEnd) + '\n'));

            controller.close();
          } catch (error) {
            const errorEvent: HarnessEvent = {
              span_id: crypto.randomUUID(),
              parent_id: null,
              event_type: 'ERROR',
              timestamp: new Date().toISOString(),
              inputs: { query },
              outputs: {},
              metadata: { 
                error_message: error instanceof Error ? error.message : 'Unknown error',
                agent_id: 'supervisor'
              },
            };
            controller.enqueue(encoder.encode(JSON.stringify(errorEvent) + '\n'));
            controller.close();
          }
        },
      });

      return new NextResponse(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // EXISTING: JSON mode (backward compatible)
      const result = await routeWithFallback({
        query,
        conversation_context: conversationContext,
        session_id,
        available_agents: getAvailableAgents(),
      });

      const agent = getAgentById(result.agent_id);
      if (!agent) {
        return NextResponse.json(
          { error: `Agent not found: ${result.agent_id}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        agent_id: result.agent_id,
        agent_name: agent.name,
        confidence: result.confidence,
        reasoning: result.reasoning,
        fallback: result.fallback || false,
        routing_cost: {
          tokens_used: result.usage?.total_tokens || 0,
          cost_usd: result.usage?.total_tokens * 0.00000025 || 0,
        },
      });
    }
  } catch (error) {
    console.error('[Supervisor API] Error routing query:', error);
    // Existing error handling...
  }
}
```

**Backward Compatibility:** Existing clients continue to work with JSON responses

**Note:** This is a minimal viable implementation. Future iterations can emit more detailed events by integrating with the actual agent execution flow.

#### `components/layout/AgentActivityPanel.tsx`
**Current Location:** `components/layout/`  
**New Location:** Move to `components/agents/AgentActivityPanel.tsx`

**Changes:**
```typescript
// REMOVE: import { useAgentStatus } from "@/hooks/useAgentStatus";
// ADD: import { useAgentStore } from "@/lib/stores/agent.store";

export function AgentActivityPanel({ onToggle }: AgentActivityPanelProps = {}) {
  // REMOVE: const { agentStatuses } = useAgentStatus();
  // ADD:
  const { statuses, cost, duration, trace, isRunning } = useAgentStore();
  
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState(320);
  
  // ... existing resize logic ...
  
  return (
    <div ref={panelRef} className="...">
      {/* ... existing header ... */}

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {AGENT_ORDER.map((agentId) => {
          const metadata = AGENT_METADATA[agentId];
          const status = statuses[agentId]; // From store
          
          return (
            <AgentCard
              key={agentId}
              agentId={agentId}
              name={metadata.name}
              icon={metadata.icon}
              status={status.status}
              message={status.message}
              progress={status.progress}
              isCollapsed={isCollapsed}
            />
          );
        })}
      </div>

      <div className={`border-t border-bg-tertiary ${isCollapsed ? 'p-2' : 'p-6'} space-y-4`}>
        {/* MODIFIED: Pass live data */}
        <SystemInfo 
          cost={`$${cost.toFixed(4)}`}
          duration={`${duration.toFixed(1)}s`}
          isCollapsed={isCollapsed} 
        />
        <div className={`border-t border-bg-tertiary ${isCollapsed ? 'pt-2' : 'pt-4'}`}>
          {/* MODIFIED: Convert trace to activity format */}
          <ActivityLog 
            activities={trace.slice(-5).reverse().map(event => ({
              agent: extractAgentFromEvent(event),
              message: extractMessageFromEvent(event),
            }))}
            isCollapsed={isCollapsed} 
          />
        </div>
      </div>
    </div>
  );
}

// Helper functions
function extractAgentFromEvent(event: HarnessEvent): 'supervisor' | 'dojo' | 'librarian' | 'debugger' | undefined {
  const agentId = event.metadata.agent_id || event.inputs.agent_id || event.outputs.agent_id;
  if (['supervisor', 'dojo', 'librarian', 'debugger'].includes(agentId)) {
    return agentId as 'supervisor' | 'dojo' | 'librarian' | 'debugger';
  }
  return undefined;
}

function extractMessageFromEvent(event: HarnessEvent): string {
  if (event.event_type === 'ERROR') {
    return event.metadata.error_message || 'Error occurred';
  }
  return event.inputs.message || event.event_type.replace(/_/g, ' ').toLowerCase();
}
```

**Refactor Notes:**
- Remove dependency on `useAgentStatus` hook (polling)
- Read directly from `useAgentStore` (real-time)
- Convert HarnessEvent[] to Activity[] for ActivityLog component

#### `components/workbench/WorkbenchView.tsx`
**Changes:**
```typescript
// ADD imports
import { useSupervisor } from "@/hooks/useSupervisor";
import { AgentActivityPanel } from "@/components/agents/AgentActivityPanel";

export function WorkbenchView() {
  const { tabs, addTab, setActiveTab, activeTabId, updateTabId } = useWorkbenchStore();
  // REMOVE: isRunning, setRunning, setActiveTabError from workbench store
  
  // ADD supervisor hook
  const supervisor = useSupervisor();
  
  const initialized = useRef(false);
  const toast = useToast();

  // ... existing useEffect for welcome tab ...

  const handleRun = async () => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (!activeTab) {
      toast.error("No active prompt to run");
      return;
    }

    if (!activeTab.content.trim()) {
      toast.error("Cannot run an empty prompt");
      return;
    }

    // REPLACE entire fetch logic with:
    try {
      console.log("[Run] Executing prompt with Supervisor:", activeTab.title);
      await supervisor.run(activeTab.content);
      toast.success("Run completed successfully");
    } catch (error) {
      console.error("[Run] Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to run prompt");
    }
  };

  // ... existing handleSave, handleExport ...

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      <TabBar />
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Editor />
          <ActionBar 
            onRun={handleRun} 
            onSave={handleSave} 
            onExport={handleExport} 
            isRunning={supervisor.isLoading} // Use hook state
          />
        </div>
        
        {/* RIGHT: Agent Activity Panel */}
        <div className="w-80 border-l border-bg-tertiary">
          <AgentActivityPanel />
        </div>
      </div>
    </div>
  );
}
```

**Layout Change:**
- Editor + ActionBar on left (flex-1)
- AgentActivityPanel on right (fixed width 320px, w-80)
- Horizontal split instead of vertical

#### `components/layout/ResizableLayout.tsx`
**Changes:**
- Remove AgentActivityPanel from layout (no longer global)
- Update resizable panels configuration if needed

---

## 4. Data Model Changes

### 4.1 New Types (add to `lib/types.ts`)

```typescript
// Add to existing exports
export interface AgentActivityState {
  runId: string | null;
  isRunning: boolean;
  statuses: AgentStatusMap;
  trace: HarnessEvent[];
  cost: number;
  duration: number;
  error: string | null;
  startedAt: number | null;
  
  startRun: (runId?: string) => void;
  addTraceEvent: (event: HarnessEvent) => void;
  endRun: () => void;
  setError: (error: string) => void;
}
```

### 4.2 Existing Types (no changes needed)

Already defined in `lib/types.ts`:
- `AgentStatusType`: 'idle' | 'thinking' | 'working' | 'error'
- `AgentStatusInfo`: { agentId, status, message, lastActive, progress }
- `AgentStatusMap`: { supervisor, dojo, librarian, debugger }

Already defined in `lib/harness/types.ts`:
- `HarnessEvent`: Complete event structure
- `HarnessEventType`: All event types
- `HarnessMetadata`: Metadata structure

---

## 5. API Changes

### 5.1 Modified Endpoint: `POST /api/supervisor/route/route`

**Request (new field):**
```json
{
  "query": "string",
  "conversation_context": [],
  "session_id": "string",
  "stream": true  // NEW: Request streaming response
}
```

**Response (streaming mode):**
```
Content-Type: text/event-stream

{"span_id":"...","event_type":"SESSION_START",...}
{"span_id":"...","event_type":"AGENT_ROUTING",...}
{"span_id":"...","event_type":"SESSION_END",...}
```

**Response (JSON mode - existing):**
```json
{
  "agent_id": "dojo",
  "agent_name": "Dojo",
  "confidence": 0.95,
  "reasoning": "...",
  "fallback": false,
  "routing_cost": {
    "tokens_used": 150,
    "cost_usd": 0.0000375
  }
}
```

**Backward Compatibility:** If `stream` field is absent or false, returns JSON (existing behavior)

---

## 6. Delivery Phases

### Phase 1: Foundation (P0 - Must Complete First)
**Goal:** Establish core infrastructure

**Tasks:**
1. Create `lib/stores/agent.store.ts` with initial state
2. Implement `startRun`, `endRun`, `setError` actions
3. Create `hooks/useSupervisor.ts` stub (returns mock events)
4. Unit test: store actions update state correctly

**Verification:**
- Store can be imported and used in components
- `startRun()` resets state, `endRun()` sets isRunning=false
- No TypeScript errors

**Deliverable:** Store + hook skeleton (no API integration yet)

---

### Phase 2: Event Processing Logic (P0)
**Goal:** Implement event-to-state transformation

**Tasks:**
1. Implement `addTraceEvent` reducer in agent.store.ts
2. Add event type → status mapping logic
3. Implement cost accumulation, duration calculation
4. Add circular buffer (cap trace at 1000 events)
5. Unit test: feed mock events, verify statuses/cost/duration update

**Verification:**
- Test with mock SESSION_START → expect supervisor status='working'
- Test with mock AGENT_ACTIVITY_PROGRESS → expect progress updated
- Test with 1001 events → trace length = 1000

**Deliverable:** Fully functional store with event processing

---

### Phase 3: Streaming API Implementation (P0)
**Goal:** Wire supervisor API to return streaming events

**Tasks:**
1. Modify `app/api/supervisor/route/route.ts` to detect stream mode
2. Implement ReadableStream with SESSION_START, AGENT_ROUTING, SESSION_END events
3. Test API directly with curl/Postman (manual verification)
4. Update `useSupervisor.ts` to consume real API stream
5. Integration test: POST to API, verify events received

**Verification:**
- curl with `Accept: text/event-stream` returns NDJSON
- curl without header returns JSON (backward compatible)
- useSupervisor hook logs events to console

**Deliverable:** Working streaming API + hook integration

---

### Phase 4: UI Integration (P0)
**Goal:** Wire components to store and display live data

**Tasks:**
1. Refactor `AgentActivityPanel.tsx` to use `useAgentStore`
2. Update SystemInfo to accept cost/duration props (already accepts them)
3. Update ActivityLog to accept activities from trace
4. Move AgentActivityPanel to `components/agents/`
5. Integrate AgentActivityPanel into WorkbenchView.tsx
6. Update WorkbenchView handleRun to use `useSupervisor().run()`
7. Remove AgentActivityPanel from ResizableLayout

**Verification:**
- Click "Run" → Supervisor card shows "working" status
- Cost and duration update in real-time
- Activity log shows events as they arrive
- Panel displays on right side of Workbench

**Deliverable:** Fully wired UI with live updates

---

### Phase 5: Error Handling & Polish (P1)
**Goal:** Robust error handling and UX improvements

**Tasks:**
1. Add try-catch in useSupervisor for network errors
2. Add per-line error handling for parse failures
3. Test error scenarios: network down, malformed JSON, API 500
4. Add loading states (button disabled during run)
5. Add toast notifications for run start/complete/error
6. Test rapid consecutive runs (state doesn't corrupt)

**Verification:**
- Disconnect network → error displayed, isRunning=false
- Send malformed event → logged to console, skipped, other events processed
- Click Run twice rapidly → second run waits for first to complete

**Deliverable:** Production-ready error handling

---

### Phase 6: Testing & Validation (P1)
**Goal:** Comprehensive testing and build verification

**Tasks:**
1. Write unit tests for agent.store.ts (addTraceEvent logic)
2. Write integration test for useSupervisor (mock fetch)
3. Manual testing: run real prompts, verify panel updates
4. Run `npm run type-check` → fix any TypeScript errors
5. Run `npm run build` → ensure no build errors
6. Test in different browsers (Chrome, Firefox, Safari)

**Verification:**
- All tests pass
- Build completes without errors
- No console warnings during run
- Works across browsers

**Deliverable:** Tested, validated, production-ready feature

---

## 7. Verification Approach

### 7.1 Unit Tests

**Test File:** `lib/stores/agent.store.test.ts`

**Test Cases:**
```typescript
describe('agent.store.ts', () => {
  it('startRun resets state and sets isRunning=true', () => {
    const { startRun, isRunning, cost, trace } = useAgentStore.getState();
    startRun();
    expect(isRunning).toBe(true);
    expect(cost).toBe(0);
    expect(trace).toEqual([]);
  });

  it('addTraceEvent updates supervisor status on SESSION_START', () => {
    const mockEvent: HarnessEvent = {
      span_id: '1',
      parent_id: null,
      event_type: 'SESSION_START',
      timestamp: new Date().toISOString(),
      inputs: {},
      outputs: {},
      metadata: {},
    };
    
    const { addTraceEvent, statuses } = useAgentStore.getState();
    addTraceEvent(mockEvent);
    
    expect(statuses.supervisor.status).toBe('working');
  });

  it('addTraceEvent accumulates cost from metadata', () => {
    const event1: HarnessEvent = { /* ... cost_usd: 0.001 */ };
    const event2: HarnessEvent = { /* ... cost_usd: 0.002 */ };
    
    const { addTraceEvent, cost } = useAgentStore.getState();
    addTraceEvent(event1);
    addTraceEvent(event2);
    
    expect(cost).toBe(0.003);
  });

  it('trace capped at 1000 events', () => {
    // Add 1001 events
    // Verify trace.length === 1000
  });
});
```

### 7.2 Integration Tests

**Test File:** `hooks/useSupervisor.test.ts`

**Test Cases:**
```typescript
describe('useSupervisor', () => {
  it('run() calls API and processes stream', async () => {
    // Mock fetch to return ReadableStream
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        body: mockReadableStream([
          '{"event_type":"SESSION_START",...}\n',
          '{"event_type":"SESSION_END",...}\n',
        ]),
      })
    );

    const { result } = renderHook(() => useSupervisor());
    await act(async () => {
      await result.current.run('test prompt');
    });

    // Verify addTraceEvent called 2 times
    // Verify endRun called
  });

  it('handles network errors gracefully', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

    const { result } = renderHook(() => useSupervisor());
    await act(async () => {
      await result.current.run('test prompt');
    });

    expect(result.current.error).toBe('Network error');
    // Verify endRun called
  });
});
```

### 7.3 Manual Testing Checklist

**Scenario 1: Successful Run**
- [ ] Open Workbench
- [ ] Enter prompt: "Create a React component"
- [ ] Click "Run" button
- [ ] Verify: Supervisor card shows "Routing query...", status = working
- [ ] Verify: Within 2s, status dots animate (pulsing)
- [ ] Verify: SystemInfo cost increases (e.g., $0.0001)
- [ ] Verify: SystemInfo duration increases (e.g., 0s → 1s)
- [ ] Verify: ActivityLog shows "Routing query..." entry
- [ ] Verify: All agents return to idle state
- [ ] Verify: "Run complete" toast appears

**Scenario 2: Error Handling**
- [ ] Open Workbench
- [ ] Disconnect network (DevTools → Offline mode)
- [ ] Click "Run" button
- [ ] Verify: Error message shown in toast
- [ ] Verify: Agents return to idle state
- [ ] Verify: Run button re-enabled

**Scenario 3: Multiple Runs**
- [ ] Complete Scenario 1
- [ ] Modify prompt, click "Run" again
- [ ] Verify: Previous cost/duration reset
- [ ] Verify: New run streams correctly

### 7.4 Build Verification

```bash
# Type checking
npm run type-check

# Production build
npm run build

# Should complete without errors
```

**Success Criteria:**
- 0 TypeScript errors
- 0 build warnings
- Output: `.next/` directory created
- No runtime errors in browser console

---

## 8. Risk Mitigation

### Risk 1: Stream Parsing Errors
**Mitigation:** Per-line try-catch, log failures, continue processing
**Test:** Send malformed JSON in stream, verify other events processed

### Risk 2: Memory Leaks from Unclosed Streams
**Mitigation:** 
- Use `finally` block to always call `endRun()`
- Implement AbortController for cancellation
- Cap trace array at 1000 events (circular buffer)

**Test:** Start run, refresh browser mid-stream, verify no memory growth

### Risk 3: Performance Degradation with Many Events
**Mitigation:**
- Zustand is optimized for frequent updates
- Only re-render affected components (React subscription model)
- Cap ActivityLog at 5 most recent events
- Cap trace array at 1000 events

**Test:** Send 500 events rapidly, monitor frame rate (should maintain 60fps)

### Risk 4: Backward Compatibility Broken
**Mitigation:**
- Supervisor API checks `stream` field explicitly
- Default to JSON mode if field absent
- Keep existing response format unchanged

**Test:** Call API without `stream` field, verify JSON response

---

## 9. Open Questions & Decisions

### Q1: Should we throttle UI updates?
**Decision:** No throttling in v1. Zustand + React are efficient enough. Monitor performance and add throttling if needed.

### Q2: What if supervisor API call fails?
**Decision:** Display error in panel, show toast notification, re-enable Run button. No auto-retry in v1.

### Q3: Should we persist run history?
**Decision:** No persistence in v1. Harness trace system handles long-term storage. This feature is for live observability only.

### Q4: What about multiple workbench tabs running simultaneously?
**Decision:** Single run at a time in v1. Disable Run button when `isRunning === true`. Future enhancement: per-tab run state.

---

## 10. Success Criteria

### P0 - Must Have (Launch Blockers)
- [ ] `agent.store.ts` created and wired to UI
- [ ] `useSupervisor` hook created and tested
- [ ] Supervisor API returns streaming events
- [ ] AgentActivityPanel moved to Workbench
- [ ] AgentCards update in real-time during run
- [ ] SystemInfo shows live cost and duration
- [ ] ActivityLog shows last 5 events
- [ ] Error handling: network failures, parse errors
- [ ] `npm run build` completes without errors
- [ ] `npm run type-check` passes

### P1 - Should Have (Quality Criteria)
- [ ] Smooth animations (no jank)
- [ ] Unit tests for addTraceEvent logic
- [ ] Integration test for useSupervisor
- [ ] Manual testing scenarios completed
- [ ] No console warnings during normal operation

### P2 - Nice to Have (Future Enhancements)
- [ ] Retry logic for failed connections
- [ ] Keyboard shortcut for Run (Cmd/Ctrl+Enter)
- [ ] Export trace data as JSON
- [ ] Run history browser

---

## 11. Dependencies & Timeline

### Dependencies
- **Harness Trace System**: ✅ Exists (`lib/harness/types.ts`)
- **Zustand**: ✅ Already installed and used
- **Agent Types**: ✅ Defined in `lib/types.ts`
- **Supervisor API**: ⚠️ Needs modification for streaming

### Estimated Timeline
- **Phase 1-2**: 1-2 hours (Store + event logic)
- **Phase 3**: 2-3 hours (Streaming API)
- **Phase 4**: 2-3 hours (UI integration)
- **Phase 5**: 1-2 hours (Error handling)
- **Phase 6**: 2-3 hours (Testing)

**Total:** ~8-13 hours for full implementation and testing

---

## 12. Technical Debt & Future Work

### Identified Technical Debt
1. **Mock events only**: API currently emits SESSION_START/ROUTING/END only, not full agent execution flow
   - **Future:** Integrate with actual agent execution to emit TOOL_INVOCATION, AGENT_ACTIVITY_PROGRESS, etc.

2. **No retry logic**: Network failures require manual re-run
   - **Future:** Exponential backoff retry with max attempts

3. **No run cancellation**: Once started, run must complete
   - **Future:** Implement AbortController for stream cancellation

4. **Single run at a time**: Can't run multiple prompts concurrently
   - **Future:** Per-tab run state with multiple simultaneous runs

### Future Enhancements (Post-v1)
- **Run History**: Browse previous runs, replay events
- **Agent Interaction**: Send messages to agents mid-run
- **Performance Profiling**: Flame graphs, bottleneck detection
- **Cost Alerts**: Notify when cost exceeds threshold
- **Real-time Collaboration**: Multi-user observability (Socket.io)

---

**Document Status:** ✅ Complete - Ready for Planning phase
