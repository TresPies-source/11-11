# Harness Trace System

**Nested JSON logging for Dojo Genesis multi-agent workflows**

Harness Trace implements [Dataiku's Harness Trace pattern](https://www.dataiku.com/) for capturing every significant event in a Dojo session. It provides an inspectable record of agent reasoning, routing decisions, cost tracking, and user interactions.

## Features

- **Nested Span-Based Logging**: Hierarchical event structure with parent-child relationships
- **Automatic Summary Metrics**: Tracks tokens, costs, duration, agents used, and errors
- **Zero-Overhead Design**: <10ms logging overhead per event
- **PGlite Persistence**: Stores traces in local database with JSONB columns
- **Three Visualization Views**: Tree, timeline, and summary views for debugging
- **Integration-First**: Works seamlessly with Supervisor Router, Cost Guard, and Librarian Agent

## Quick Start

```typescript
import { startTrace, logEvent, startSpan, endSpan, endTrace } from '@/lib/harness/trace';

// Start a new trace
const trace = startTrace('sess_123', 'user_456');

// Log a simple event
logEvent('USER_INPUT', 
  { message: 'Help me plan my budget' }, 
  { received: true },
  { duration_ms: 5 }
);

// Log a nested span (hierarchical operation)
const routingSpan = startSpan('AGENT_ROUTING', { query: 'Help me plan my budget' });
// ... routing logic ...
endSpan(routingSpan, { agent_id: 'dojo', confidence: 0.95 }, { duration_ms: 150 });

// End the trace and persist to database
const finalTrace = await endTrace();
console.log(finalTrace.summary.total_events); // 2
```

## Architecture

### Core Concepts

**Trace**: A complete record of a Dojo session, containing all events and summary metrics.

**Event**: A single logged occurrence (user input, agent routing, cost tracking, etc.).

**Span**: A nested event representing a hierarchical operation (e.g., agent routing → tool invocation → search).

**Summary**: Aggregated metrics computed from all events (total tokens, cost, duration, agents used, errors).

### Event Types

| Event Type | Description | Example |
|-----------|-------------|---------|
| `SESSION_START` | User session begins | Session initialization |
| `SESSION_END` | User session ends | Session cleanup |
| `MODE_TRANSITION` | Dojo mode change | Mirror → Scout |
| `AGENT_ROUTING` | Supervisor routing decision | Route query to Dojo agent |
| `AGENT_HANDOFF` | Handoff between agents | Dojo → Librarian |
| `TOOL_INVOCATION` | External tool call | Semantic search API |
| `PERSPECTIVE_INTEGRATION` | User perspective added | User clarifies intent |
| `COST_TRACKED` | Cost Guard event | Token usage logged |
| `ERROR` | Error occurred | Routing failure |
| `USER_INPUT` | User message | "Help me budget" |
| `AGENT_RESPONSE` | Agent response | "Here's a budget plan..." |

### Trace Schema

```typescript
interface HarnessTrace {
  trace_id: string;              // "trace_1234567890_abc123def"
  session_id: string;            // "sess_xyz789"
  user_id: string;               // "user_456"
  started_at: string;            // ISO 8601 timestamp
  ended_at: string | null;       // ISO 8601 timestamp (null if ongoing)
  events: HarnessEvent[];        // Root-level events (may contain nested children)
  summary: HarnessSummary;       // Computed summary metrics
}

interface HarnessEvent {
  span_id: string;               // "span_1234567890_abc123def"
  parent_id: string | null;      // Parent span_id (null for root)
  event_type: HarnessEventType;  // "AGENT_ROUTING", "COST_TRACKED", etc.
  timestamp: string;             // ISO 8601 timestamp
  inputs: Record<string, any>;   // Input data
  outputs: Record<string, any>;  // Output data
  metadata: HarnessMetadata;     // Performance and contextual metadata
  children?: HarnessEvent[];     // Nested child events
}
```

## Usage Examples

### Example 1: Simple Event Logging

```typescript
import { startTrace, logEvent, endTrace } from '@/lib/harness/trace';

const trace = startTrace('sess_123', 'user_456');

logEvent('USER_INPUT', 
  { message: 'What is my budget?' }, 
  { received: true }
);

logEvent('AGENT_RESPONSE', 
  { agent_id: 'dojo' }, 
  { message: 'Your budget is $1,000.' },
  { token_count: 150, cost_usd: 0.0015 }
);

await endTrace();
```

### Example 2: Nested Spans (Hierarchical Operations)

```typescript
import { startTrace, startSpan, endSpan, logEvent, endTrace } from '@/lib/harness/trace';

const trace = startTrace('sess_123', 'user_456');

// Top-level span: Agent routing
const routingSpan = startSpan('AGENT_ROUTING', { query: 'Help me budget' });

  // Nested span: Tool invocation
  const searchSpan = startSpan('TOOL_INVOCATION', { tool: 'semantic_search', query: 'budget' });
  const results = await semanticSearch('budget', 5, 0.7);
  endSpan(searchSpan, { results_count: results.length }, { duration_ms: 250 });

  // Another nested event
  logEvent('PERSPECTIVE_INTEGRATION', 
    { user_clarification: 'Monthly budget' }, 
    { integrated: true }
  );

endSpan(routingSpan, { agent_id: 'dojo', confidence: 0.95 }, { duration_ms: 400 });

await endTrace();
```

**Result**: The trace will have a tree structure:
```
AGENT_ROUTING (400ms)
├── TOOL_INVOCATION (250ms)
└── PERSPECTIVE_INTEGRATION
```

### Example 3: Error Handling

```typescript
import { startTrace, startSpan, endSpan, logEvent, endTrace } from '@/lib/harness/trace';

const trace = startTrace('sess_123', 'user_456');

const routingSpan = startSpan('AGENT_ROUTING', { query: 'Complex query' });

try {
  const decision = await routeQueryInternal(query);
  endSpan(routingSpan, { agent_id: decision.agent_id }, { duration_ms: 150 });
} catch (error) {
  logEvent('ERROR', 
    { query: 'Complex query' }, 
    { error: error.message },
    { error_message: error.message }
  );
  endSpan(routingSpan, { error: true }, { duration_ms: 0 });
}

await endTrace();
```

### Example 4: Cost Tracking Integration

```typescript
import { startTrace, logEvent, endTrace } from '@/lib/harness/trace';
import { trackCost } from '@/lib/cost/tracking';

const trace = startTrace('sess_123', 'user_456');

const costRecord = {
  operation_type: 'chat',
  total_tokens: 500,
  cost_usd: 0.005,
};

// Track cost in Cost Guard
await trackCost(costRecord);

// Log to Harness Trace
logEvent('COST_TRACKED', 
  { operation: 'chat' }, 
  { tokens: 500, cost: 0.005 },
  { token_count: 500, cost_usd: 0.005 }
);

await endTrace();
```

## Retrieval API

```typescript
import { getTrace, getSessionTraces, getUserTraces } from '@/lib/harness/retrieval';

// Get a single trace by ID
const trace = await getTrace('trace_1234567890_abc123def');
console.log(trace.summary.total_events);

// Get all traces for a session
const sessionTraces = await getSessionTraces('sess_xyz789');
console.log(`Session has ${sessionTraces.length} traces`);

// Get recent traces for a user (default: 10, max: 100)
const userTraces = await getUserTraces('user_456', 20);
console.log(`User has ${userTraces.length} recent traces`);
```

## Visualization

Harness Trace provides three complementary views for inspecting traces:

### 1. Tree View (Nested Structure)

Shows parent-child relationships with expandable/collapsible nodes.

```
📊 Trace: trace_1234567890_abc123def
├─ SESSION_START (5ms)
├─ USER_INPUT (10ms)
├─ AGENT_ROUTING (400ms)
│  ├─ TOOL_INVOCATION (250ms)
│  │  └─ Semantic Search: 5 results
│  └─ PERSPECTIVE_INTEGRATION (50ms)
├─ AGENT_RESPONSE (200ms)
└─ SESSION_END (5ms)
```

### 2. Timeline View (Chronological)

Shows events in time order with duration bars.

```
10:00:00 ████████████████ SESSION_START (5ms)
10:00:01 ████████████████████ USER_INPUT (10ms)
10:00:02 ████████████████████████████████████████████ AGENT_ROUTING (400ms)
10:00:03   ████████████████████████████████ TOOL_INVOCATION (250ms)
10:00:04   ████████████ PERSPECTIVE_INTEGRATION (50ms)
10:00:05 ████████████████████████████ AGENT_RESPONSE (200ms)
10:00:06 ████████████████ SESSION_END (5ms)
```

### 3. Summary View (Metrics)

Shows aggregated metrics and cost breakdown.

```
📊 Trace Summary
─────────────────────────────
Total Events:    6
Total Duration:  670ms
Total Tokens:    2,500
Total Cost:      $0.025
Agents Used:     dojo, librarian
Modes Used:      Mirror, Scout
Errors:          0

💰 Cost Breakdown
─────────────────────────────
Chat:            $0.015 (60%)
Search:          $0.008 (32%)
Routing:         $0.002 (8%)
```

Access visualization at: `/traces/[traceId]`

## Integration with Wave 1 & 2 Features

### Supervisor Router

All routing decisions are automatically logged:

```typescript
// /lib/agents/supervisor.ts
export async function routeQuery(userQuery: string): Promise<RoutingDecision> {
  const spanId = startSpan('AGENT_ROUTING', { query: userQuery });
  const decision = await routeQueryInternal(userQuery);
  endSpan(spanId, { agent_id: decision.agent_id, confidence: decision.confidence });
  return decision;
}
```

### Cost Guard

All cost tracking events are automatically logged:

```typescript
// /lib/cost/tracking.ts
export async function trackCost(record: CostRecord): Promise<void> {
  logEvent('COST_TRACKED', 
    { operation: record.operation_type }, 
    { tokens: record.total_tokens, cost: record.cost_usd },
    { token_count: record.total_tokens, cost_usd: record.cost_usd }
  );
  // ... existing tracking logic ...
}
```

### Librarian Agent

All search queries are automatically logged:

```typescript
// /lib/librarian/search.ts
export async function semanticSearch(query: string): Promise<SearchResult[]> {
  const spanId = startSpan('TOOL_INVOCATION', { tool: 'semantic_search', query });
  const results = await semanticSearchInternal(query);
  endSpan(spanId, { results_count: results.length }, { duration_ms: 250 });
  return results;
}
```

## Performance

- **Logging Overhead**: <10ms per event
- **Trace Retrieval**: <500ms for 100-event trace
- **Visualization Rendering**: <1s for tree view
- **Database Storage**: JSONB columns with indexes on `session_id`, `user_id`, `started_at`

## Graceful Degradation

If the database is unavailable, Harness Trace logs to console instead of failing:

```typescript
export async function endTrace(): Promise<HarnessTrace> {
  // ... finalize trace ...
  
  try {
    await insertTrace(trace);
  } catch (error) {
    console.warn('[HARNESS_TRACE] Database unavailable. Logging to console:', trace);
  }
  
  return trace;
}
```

## Troubleshooting

### "No active trace" warning

**Problem**: `logEvent()` or `endSpan()` called without an active trace.

**Solution**: Call `startTrace()` before logging events:

```typescript
const trace = startTrace('sess_123', 'user_456');
logEvent('USER_INPUT', { message: 'Hello' }, { received: true });
```

### Span mismatch warning

**Problem**: `endSpan()` called with wrong span_id (span stack mismatch).

**Solution**: Always call `endSpan()` with the span_id returned by `startSpan()`:

```typescript
const spanId = startSpan('AGENT_ROUTING', { query: 'Test' });
// ... logic ...
endSpan(spanId, { result: 'success' }); // Use the same spanId
```

### Trace not persisted to database

**Problem**: Trace logged but not appearing in database.

**Solution**: Ensure `endTrace()` is awaited:

```typescript
await endTrace(); // Must await for database insertion
```

## API Reference

See JSDoc comments in:
- `/lib/harness/types.ts` - Type definitions
- `/lib/harness/trace.ts` - Core tracing API
- `/lib/harness/retrieval.ts` - Query functions
- `/lib/harness/utils.ts` - Helper functions

## Research Foundation

Harness Trace is based on Dataiku's enterprise agent patterns:

- **Harness Trace Pattern**: Nested span-based logging for multi-agent workflows
- **Traceability**: Full execution tree for debugging and compliance
- **Inspection**: Real-time visibility into agent reasoning and decisions

Learn more: [Dataiku Agent Patterns](https://www.dataiku.com/)

## License

MIT License - See `/LICENSE` for details

---

**Built with ❤️ by the Dojo Genesis Team**
