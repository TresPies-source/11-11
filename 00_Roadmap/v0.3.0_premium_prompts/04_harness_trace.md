# Feature 4: Harness Trace (Nested JSON Logging)

**Release:** v0.3.0 Premium "Intelligence & Foundation"  
**Branch:** `feature/harness-trace`  
**Wave:** 2 (Intelligence)  
**Zenflow Instance:** #2  
**Duration:** 2-3 weeks (flexible until excellence achieved)  
**Dependencies:** Feature 1 (Supervisor Router) should be merged first for best integration

---

## Context: You Have Full Repo Access

You are working in the **11-11 repository** with complete access to all documentation. Before starting, review these key files:

**Foundation Documents (Read from tail first, then head):**
- `/00_Roadmap/task_plan.md` - Current roadmap and sprint status
- `/JOURNAL.md` - Development log and architectural decisions
- `/05_Logs/BUGS.md` - Known issues and bug tracking
- `/05_Logs/AUDIT_LOG.md` - Sprint summaries and technical decisions

**Architecture & Patterns:**
- `/04_System/EXCELLENCE_CRITERIA_FRAMEWORK.md` - 8 dimensions of excellence
- `/04_System/V0.3.0_FEATURE_SEEDS.md` - Seed 4 (Harness Trace pattern)
- `/04_System/AGENT_BEST_PRACTICES.md` - Development standards
- `/04_System/REPO_AWARE_PROMPTS_MEMORY.md` - Integration-first guidelines
- `/04_System/WINDOWS_BASH_MEMORY.md` - Environment notes

**Dojo Genesis Ecosystem:**
- Review the Master Blueprint v3.0 in project instructions
- Understand the Dojo Agent Protocol v1.0
- Study the Harness Trace pattern from Dataiku research

**Current Codebase:**
- `/lib/` - Existing utilities and helpers (check for logging utilities)
- `/components/` - UI components and patterns (check for trace visualization)
- `/app/` - Next.js app router structure
- `/db/` - Database schema and migrations (PGlite)

**Wave 1 Features (Already Merged):**
- Feature 1: Supervisor Router (agent registry, routing logic, handoffs)
- Feature 2: Cost Guard (three-tier budgeting, estimation, tracking)

**Wave 2 Features (In Progress):**
- Feature 3: Librarian Agent (semantic search, proactive suggestions)

---

## Feature Overview

Implement the Harness Trace system: a nested JSON logging mechanism that captures every significant event in a Dojo session, providing an inspectable record of agent reasoning, routing decisions, cost tracking, and user interactions. This implements Dataiku's traceability pattern and establishes the foundation for debugging, analytics, and audit trails.

**Research Foundation:** This feature is grounded in Dataiku's enterprise agent patterns, specifically the "Harness Trace" pattern that uses nested span-based logging to capture the full execution tree of multi-agent workflows, enabling inspection, debugging, and compliance.

**Seed Reference:** See `/04_System/V0.3.0_FEATURE_SEEDS.md` - Seed 4

---

## Excellence Criteria (v0.3.0 Priorities)

**Must Be Excellent (9-10/10):**
- **Stability:** Zero trace failures, never loses events
- **Research Integration:** Pure Harness Trace implementation from Dataiku patterns
- **Depth:** Complete tracing system with visualization

**Must Be Very Good (7-8/10):**
- **Performance:** Logging adds <10ms overhead per event
- **Usability:** Clear trace visualization, easy debugging

**Can Be Good (6-7/10):**
- **Beauty:** Clean UI, not necessarily stunning
- **Creativity:** Solid implementation, not necessarily novel

---

## Core Requirements

### 1. Harness Trace Schema (Nested JSON)

**Purpose:** Define the structure for capturing all events in a Dojo session as a nested JSON tree.

**Integration Points:**
- Review existing logging patterns in `/lib/`
- Check for existing event tracking systems
- Follow existing TypeScript type patterns

**Schema Definition:**

```typescript
// /lib/harness/types.ts

export interface HarnessEvent {
  span_id: string; // Unique ID for this event (e.g., "span_001")
  parent_id: string | null; // ID of parent event (null for root)
  event_type: HarnessEventType;
  timestamp: string; // ISO 8601 format
  inputs: Record<string, any>; // Data the event started with
  outputs: Record<string, any>; // Data the event produced
  metadata: HarnessMetadata;
  children?: HarnessEvent[]; // Nested child events
}

export type HarnessEventType =
  | 'SESSION_START'
  | 'SESSION_END'
  | 'MODE_TRANSITION' // Dojo mode change (Mirror, Scout, etc.)
  | 'AGENT_ROUTING' // Supervisor routing decision
  | 'AGENT_HANDOFF' // Handoff between agents
  | 'TOOL_INVOCATION' // External tool call (search, API, etc.)
  | 'PERSPECTIVE_INTEGRATION' // User perspective added
  | 'COST_TRACKED' // Cost Guard event
  | 'ERROR' // Error occurred
  | 'USER_INPUT' // User message
  | 'AGENT_RESPONSE'; // Agent response

export interface HarnessMetadata {
  duration_ms?: number; // How long the event took
  token_count?: number; // Tokens used (if applicable)
  cost_usd?: number; // Cost incurred (if applicable)
  confidence?: number; // Confidence score (if applicable)
  error_message?: string; // Error details (if applicable)
  [key: string]: any; // Extensible metadata
}

export interface HarnessTrace {
  trace_id: string; // Unique ID for the entire trace
  session_id: string; // Session this trace belongs to
  user_id: string; // User who initiated the session
  started_at: string; // ISO 8601 timestamp
  ended_at: string | null; // ISO 8601 timestamp (null if ongoing)
  events: HarnessEvent[]; // Root-level events
  summary: HarnessSummary; // Computed summary
}

export interface HarnessSummary {
  total_events: number;
  total_duration_ms: number;
  total_tokens: number;
  total_cost_usd: number;
  agents_used: string[]; // List of agents invoked
  modes_used: string[]; // List of Dojo modes used
  errors: number; // Count of errors
}
```

**Requirements:**
- [ ] Schema supports nested events (parent-child relationships)
- [ ] Schema captures all event types (routing, handoffs, cost, errors)
- [ ] Schema is extensible (metadata can hold any data)
- [ ] Schema follows existing TypeScript type patterns
- [ ] Schema is well-documented with JSDoc comments

---

### 2. Trace Logging API

**Purpose:** Provide a simple API for logging events to the Harness Trace.

**Integration Points:**
- Review existing logging utilities in `/lib/`
- Check if there's an existing event bus (Mitt)
- Follow existing error handling patterns
- Use existing session management

**Implementation:**

```typescript
// /lib/harness/trace.ts

let currentTrace: HarnessTrace | null = null;
let eventStack: string[] = []; // Stack of parent span IDs

export function startTrace(sessionId: string, userId: string): HarnessTrace {
  currentTrace = {
    trace_id: generateId('trace'),
    session_id: sessionId,
    user_id: userId,
    started_at: new Date().toISOString(),
    ended_at: null,
    events: [],
    summary: {
      total_events: 0,
      total_duration_ms: 0,
      total_tokens: 0,
      total_cost_usd: 0,
      agents_used: [],
      modes_used: [],
      errors: 0,
    },
  };

  return currentTrace;
}

export function logEvent(
  eventType: HarnessEventType,
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  metadata: HarnessMetadata = {}
): string {
  if (!currentTrace) {
    console.warn('[HARNESS_TRACE] No active trace. Call startTrace() first.');
    return '';
  }

  const spanId = generateId('span');
  const parentId = eventStack.length > 0 ? eventStack[eventStack.length - 1] : null;

  const event: HarnessEvent = {
    span_id: spanId,
    parent_id: parentId,
    event_type: eventType,
    timestamp: new Date().toISOString(),
    inputs,
    outputs,
    metadata,
  };

  // Add event to trace (nested if has parent)
  if (parentId) {
    addNestedEvent(currentTrace.events, parentId, event);
  } else {
    currentTrace.events.push(event);
  }

  // Update summary
  currentTrace.summary.total_events++;
  if (metadata.duration_ms) currentTrace.summary.total_duration_ms += metadata.duration_ms;
  if (metadata.token_count) currentTrace.summary.total_tokens += metadata.token_count;
  if (metadata.cost_usd) currentTrace.summary.total_cost_usd += metadata.cost_usd;
  if (eventType === 'ERROR') currentTrace.summary.errors++;

  return spanId;
}

export function startSpan(eventType: HarnessEventType, inputs: Record<string, any>): string {
  const spanId = logEvent(eventType, inputs, {}, { duration_ms: 0 });
  eventStack.push(spanId);
  return spanId;
}

export function endSpan(spanId: string, outputs: Record<string, any>, metadata: HarnessMetadata = {}): void {
  if (eventStack[eventStack.length - 1] !== spanId) {
    console.warn('[HARNESS_TRACE] Span mismatch. Expected', spanId, 'but got', eventStack[eventStack.length - 1]);
  }

  eventStack.pop();

  // Update span with outputs and metadata
  updateSpan(currentTrace!.events, spanId, outputs, metadata);
}

export function endTrace(): HarnessTrace {
  if (!currentTrace) {
    throw new Error('[HARNESS_TRACE] No active trace to end.');
  }

  currentTrace.ended_at = new Date().toISOString();

  // Persist trace to database (use existing db patterns)
  persistTrace(currentTrace);

  const trace = currentTrace;
  currentTrace = null;
  eventStack = [];

  return trace;
}

// Helper functions
function addNestedEvent(events: HarnessEvent[], parentId: string, event: HarnessEvent): void {
  for (const e of events) {
    if (e.span_id === parentId) {
      if (!e.children) e.children = [];
      e.children.push(event);
      return;
    }
    if (e.children) {
      addNestedEvent(e.children, parentId, event);
    }
  }
}

function updateSpan(events: HarnessEvent[], spanId: string, outputs: Record<string, any>, metadata: HarnessMetadata): void {
  for (const e of events) {
    if (e.span_id === spanId) {
      e.outputs = { ...e.outputs, ...outputs };
      e.metadata = { ...e.metadata, ...metadata };
      return;
    }
    if (e.children) {
      updateSpan(e.children, spanId, outputs, metadata);
    }
  }
}

async function persistTrace(trace: HarnessTrace): Promise<void> {
  // Store in PGlite (check existing db schema)
  await db.insert(harness_traces).values({
    trace_id: trace.trace_id,
    session_id: trace.session_id,
    user_id: trace.user_id,
    started_at: new Date(trace.started_at),
    ended_at: trace.ended_at ? new Date(trace.ended_at) : null,
    events: JSON.stringify(trace.events),
    summary: JSON.stringify(trace.summary),
  });
}
```

**Usage Example:**
```typescript
// Start a trace
const trace = startTrace('sess_123', 'user_456');

// Log a simple event
logEvent('USER_INPUT', { message: 'Help me plan my budget' }, { received: true });

// Log a span (nested event)
const routingSpan = startSpan('AGENT_ROUTING', { query: 'Help me plan my budget' });
// ... routing logic ...
endSpan(routingSpan, { agent_id: 'dojo', confidence: 0.95 }, { duration_ms: 150 });

// End the trace
endTrace();
```

**Requirements:**
- [ ] Trace logging API is simple and intuitive
- [ ] Supports nested events (startSpan/endSpan)
- [ ] Automatically tracks summary metrics (tokens, cost, duration)
- [ ] Persists traces to PGlite database
- [ ] Graceful degradation if database unavailable (log to console)
- [ ] Follows existing logging patterns in `/lib/`
- [ ] Integrates with existing session management

---

### 3. Integration with Wave 1 & 2 Features

**Purpose:** Retrofit existing features to log events to Harness Trace.

**Integration Points:**
- Feature 1 (Supervisor Router): Log routing decisions and handoffs
- Feature 2 (Cost Guard): Log cost tracking events
- Feature 3 (Librarian Agent): Log search queries and results

**Implementation:**

**A) Supervisor Router Integration**
```typescript
// /lib/agents/supervisor.ts (update existing code)

export async function routeQuery(userQuery: string, conversationContext: string[]): Promise<RoutingDecision> {
  const spanId = startSpan('AGENT_ROUTING', { query: userQuery, context: conversationContext });

  try {
    const decision = await routeQueryInternal(userQuery, conversationContext);

    endSpan(spanId, { agent_id: decision.agent_id, confidence: decision.confidence }, { duration_ms: 150 });

    return decision;
  } catch (error) {
    logEvent('ERROR', { query: userQuery }, { error: error.message }, { error_message: error.message });
    endSpan(spanId, { error: true }, { duration_ms: 0 });
    throw error;
  }
}
```

**B) Cost Guard Integration**
```typescript
// /lib/cost/tracking.ts (update existing code)

export async function trackCost(record: CostRecord): Promise<void> {
  logEvent('COST_TRACKED', { operation: record.operation_type }, { tokens: record.total_tokens, cost: record.cost_usd }, {
    token_count: record.total_tokens,
    cost_usd: record.cost_usd,
  });

  // ... existing tracking logic ...
}
```

**C) Librarian Agent Integration**
```typescript
// /lib/librarian/search.ts (update existing code)

export async function semanticSearch(query: string, limit: number, threshold: number): Promise<SearchResult[]> {
  const spanId = startSpan('TOOL_INVOCATION', { tool: 'semantic_search', query, limit, threshold });

  const results = await semanticSearchInternal(query, limit, threshold);

  endSpan(spanId, { results_count: results.length }, { duration_ms: 250 });

  return results;
}
```

**Requirements:**
- [ ] Supervisor Router logs all routing decisions
- [ ] Cost Guard logs all cost tracking events
- [ ] Librarian Agent logs all search queries
- [ ] Dojo Agent logs mode transitions (Mirror, Scout, etc.)
- [ ] All agent handoffs are logged
- [ ] All errors are logged
- [ ] Integration is non-breaking (existing code still works)

---

### 4. Trace Persistence & Retrieval

**Purpose:** Store traces in PGlite and provide API for retrieval.

**Integration Points:**
- Review existing database schema in `/db/`
- Follow existing database query patterns
- Use existing API route structure in `/app/api/`

**Database Schema:**
```sql
-- /db/migrations/004_add_harness_traces.sql

CREATE TABLE IF NOT EXISTS harness_traces (
  trace_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  events JSONB NOT NULL, -- Nested JSON events
  summary JSONB NOT NULL, -- Computed summary
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS harness_traces_session_idx ON harness_traces(session_id);
CREATE INDEX IF NOT EXISTS harness_traces_user_idx ON harness_traces(user_id);
CREATE INDEX IF NOT EXISTS harness_traces_started_at_idx ON harness_traces(started_at DESC);
```

**Retrieval API:**
```typescript
// /lib/harness/retrieval.ts

export async function getTrace(traceId: string): Promise<HarnessTrace | null> {
  const result = await db.select().from(harness_traces).where(eq(harness_traces.trace_id, traceId)).limit(1);

  if (result.length === 0) return null;

  return {
    ...result[0],
    events: JSON.parse(result[0].events),
    summary: JSON.parse(result[0].summary),
  };
}

export async function getSessionTraces(sessionId: string): Promise<HarnessTrace[]> {
  const results = await db.select().from(harness_traces).where(eq(harness_traces.session_id, sessionId));

  return results.map(r => ({
    ...r,
    events: JSON.parse(r.events),
    summary: JSON.parse(r.summary),
  }));
}

export async function getUserTraces(userId: string, limit: number = 10): Promise<HarnessTrace[]> {
  const results = await db
    .select()
    .from(harness_traces)
    .where(eq(harness_traces.user_id, userId))
    .orderBy(desc(harness_traces.started_at))
    .limit(limit);

  return results.map(r => ({
    ...r,
    events: JSON.parse(r.events),
    summary: JSON.parse(r.summary),
  }));
}
```

**Requirements:**
- [ ] Traces stored in PGlite with JSONB columns
- [ ] Indexes for fast retrieval (session_id, user_id, started_at)
- [ ] Retrieval API for single trace, session traces, user traces
- [ ] Follows existing database patterns in `/db/`
- [ ] Follows existing API route structure in `/app/api/`

---

### 5. Trace Visualization (Three Views)

**Purpose:** Provide three complementary views for inspecting Harness Traces.

**Integration Points:**
- Review existing UI components in `/components/`
- Follow existing design system (Material 3, Tailwind CSS)
- Use existing chart library (if available)
- Create dedicated `/app/traces/` page

**Three Views:**

**A) Tree View (Nested Structure)**
- Shows parent-child relationships
- Expandable/collapsible nodes
- Color-coded by event type
- Click to see event details

**B) Timeline View (Chronological)**
- Shows events in time order
- Horizontal timeline with duration bars
- Hover to see event details
- Zoom and pan controls

**C) Summary View (Metrics)**
- Total events, duration, tokens, cost
- Agents used, modes used, errors
- Cost breakdown by operation type
- Performance metrics (p50, p95, p99)

**Implementation:**

```typescript
// /app/traces/[traceId]/page.tsx

export default function TracePage({ params }: { params: { traceId: string } }) {
  const { data: trace } = useTrace(params.traceId);
  const [view, setView] = useState<'tree' | 'timeline' | 'summary'>('tree');

  if (!trace) return <LoadingState />;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* View Selector */}
      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="tree">Tree View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="summary">Summary View</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Trace Views */}
      {view === 'tree' && <TraceTreeView trace={trace} />}
      {view === 'timeline' && <TraceTimelineView trace={trace} />}
      {view === 'summary' && <TraceSummaryView trace={trace} />}
    </div>
  );
}
```

**Tree View Component:**
```typescript
// /components/TraceTreeView.tsx

export function TraceTreeView({ trace }: { trace: HarnessTrace }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trace Tree</CardTitle>
      </CardHeader>
      <CardContent>
        {trace.events.map((event) => (
          <TraceEventNode key={event.span_id} event={event} depth={0} />
        ))}
      </CardContent>
    </Card>
  );
}

function TraceEventNode({ event, depth }: { event: HarnessEvent; depth: number }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{ marginLeft: `${depth * 20}px` }} className="border-l-2 pl-4 py-2">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        {event.children && (expanded ? <ChevronDown /> : <ChevronRight />)}
        <Badge variant={getEventColor(event.event_type)}>{event.event_type}</Badge>
        <span className="text-sm">{event.metadata.duration_ms}ms</span>
      </div>
      {expanded && event.children && event.children.map((child) => (
        <TraceEventNode key={child.span_id} event={child} depth={depth + 1} />
      ))}
    </div>
  );
}
```

**Requirements:**
- [ ] Three views implemented (tree, timeline, summary)
- [ ] Tree view shows nested structure with expand/collapse
- [ ] Timeline view shows chronological events with duration bars
- [ ] Summary view shows metrics and cost breakdown
- [ ] Dedicated `/app/traces/[traceId]` page
- [ ] Responsive design (mobile-friendly)
- [ ] Accessible (WCAG AA)
- [ ] Follows existing UI component patterns

---

## API Specification

### GET /api/traces/:traceId

**Purpose:** Retrieve a single trace by ID.

**Response:**
```json
{
  "trace_id": "trace_abc123",
  "session_id": "sess_xyz789",
  "user_id": "user_456",
  "started_at": "2026-01-13T10:00:00Z",
  "ended_at": "2026-01-13T10:05:00Z",
  "events": [...],
  "summary": {
    "total_events": 25,
    "total_duration_ms": 5000,
    "total_tokens": 2500,
    "total_cost_usd": 0.025,
    "agents_used": ["dojo", "librarian"],
    "modes_used": ["Mirror", "Scout"],
    "errors": 0
  }
}
```

---

### GET /api/traces/session/:sessionId

**Purpose:** Retrieve all traces for a session.

**Response:**
```json
{
  "traces": [
    { "trace_id": "trace_001", "summary": {...} },
    { "trace_id": "trace_002", "summary": {...} }
  ]
}
```

---

### GET /api/traces/user/:userId

**Purpose:** Retrieve recent traces for a user.

**Query Params:** `?limit=10`

**Response:**
```json
{
  "traces": [
    { "trace_id": "trace_001", "summary": {...} },
    { "trace_id": "trace_002", "summary": {...} }
  ]
}
```

---

## Testing Requirements

### Unit Tests
- [ ] Trace logging API works correctly
- [ ] Nested events are properly structured
- [ ] Summary metrics are calculated correctly
- [ ] Trace persistence works
- [ ] Follow existing test patterns in `/tests/` or `__tests__/`

### Integration Tests
- [ ] End-to-end trace from session start to end
- [ ] Supervisor Router events logged correctly
- [ ] Cost Guard events logged correctly
- [ ] Librarian Agent events logged correctly
- [ ] Use existing test infrastructure

### Performance Tests
- [ ] Logging adds <10ms overhead per event
- [ ] Trace retrieval <500ms for 100-event trace
- [ ] Visualization renders in <1s

---

## Documentation Requirements

### JOURNAL.md Updates
Document the following architectural decisions:
- [ ] Why nested JSON over flat event log (inspectability, debugging)
- [ ] Why PGlite JSONB over separate events table (simplicity, performance)
- [ ] Why three views (tree, timeline, summary) for trace visualization
- [ ] How Harness Trace integrates with all agents
- [ ] Integration points with Supervisor, Cost Guard, Librarian
- [ ] Self-assessment against Excellence Criteria (score each dimension)

### Code Documentation
- [ ] JSDoc comments for all public functions
- [ ] README in `/lib/harness/` explaining the tracing system
- [ ] Examples of logging events and spans
- [ ] Troubleshooting guide for trace issues

### User Documentation
- [ ] How to view traces
- [ ] How to interpret tree/timeline/summary views
- [ ] How traces help with debugging

---

## Acceptance Criteria

### Stability (10/10)
- [ ] Zero trace failures in 100 test sessions
- [ ] Never loses events (even if database unavailable)
- [ ] All edge cases handled (empty trace, long trace, etc.)
- [ ] No regressions in existing features

### Research Integration (10/10)
- [ ] Implements Dataiku's Harness Trace pattern exactly
- [ ] Nested span-based logging
- [ ] Captures full execution tree
- [ ] Documentation cites Dataiku research
- [ ] Seed 4 patterns are followed

### Depth (10/10)
- [ ] Complete tracing system (logging, persistence, visualization)
- [ ] Three complementary views (tree, timeline, summary)
- [ ] Integrated with all agents
- [ ] Comprehensive documentation (architecture, API, usage, JOURNAL updates)
- [ ] Code is clean, readable, and follows existing patterns

### Performance (9/10)
- [ ] Logging adds <10ms overhead per event
- [ ] Trace retrieval <500ms
- [ ] Visualization renders in <1s
- [ ] No performance regressions

### Usability (9/10)
- [ ] Clear trace visualization
- [ ] Easy to understand event types
- [ ] Helpful for debugging
- [ ] Accessible (WCAG AA)

---

## Integration with Wave 1 & 2 Features

### With Feature 1 (Supervisor Router):
- [ ] All routing decisions logged
- [ ] All handoffs logged
- [ ] Routing errors logged

### With Feature 2 (Cost Guard):
- [ ] All cost tracking events logged
- [ ] Budget warnings logged
- [ ] Budget exceeded events logged

### With Feature 3 (Librarian Agent):
- [ ] All search queries logged
- [ ] Search results logged
- [ ] Suggestion generation logged

---

## Deferred to Future Releases

- Trace export (JSON, CSV)
- Trace comparison (diff two traces)
- Trace analytics dashboard (trends, patterns)
- Real-time trace streaming (WebSocket)
- Trace sampling (for high-volume production)

---

## Zenflow Automation Protocol

**Setup Script:**
```
npm install
```

**Dev Server Script:**
```
npm run dev
```

**Cleanup Script:**
```
npm run lint; npm run build
```

**Copy Files:**
```
.env.local
```

---

## Notes for Zenflow

1. **Read Documentation from Both Ends:** Start with JOURNAL.md (tail), then BUGS.md (tail), then this prompt (head to tail).

2. **Review Existing Codebase:** Before writing any code, review:
   - `/lib/` for existing logging utilities
   - `/db/` for database schema and PGlite usage
   - `/app/api/` for API route patterns
   - `/components/` for UI component patterns
   - Feature 1 (Supervisor Router) for integration points
   - Feature 2 (Cost Guard) for integration points
   - Feature 3 (Librarian Agent) for integration points

3. **Follow Existing Patterns:** Match the code style, error handling, and architecture patterns already in the repo.

4. **Generate PRD + Tech Spec in Sandbox:** Create detailed PRD and tech spec in your sandbox before coding. Do NOT commit these to the repo.

5. **Commit Only Implementation:** Commit code, tests, and documentation updates. Do NOT commit PRD/spec.

6. **Update JOURNAL.md:** Log architectural decisions, implementation notes, and self-assessment against Excellence Criteria.

7. **Update BUGS.md:** Log any bugs discovered during development. Fix all P0 and P1 bugs before finishing your testing. After completing your testing, complete a premium micro sprint solving any P2/P3 bugs for the user.

8. **Self-Assess:** Use the Excellence Rubric to score your implementation before marking complete.

9. **Windows Bash Compatible:** Use `;` instead of `&&` for command chaining.

10. **Integration Readiness:** This feature integrates with Features 1, 2, and 3. Review their implementations before starting.

11. **Database Migrations:** Create PGlite migration for harness_traces table with JSONB columns.

12. **Graceful Degradation:** If database unavailable, log to console (don't fail).

---

**Author:** Manus AI (Dojo)  
**Status:** v0.3.0 Premium Feature Prompt  
**Date:** January 13, 2026
