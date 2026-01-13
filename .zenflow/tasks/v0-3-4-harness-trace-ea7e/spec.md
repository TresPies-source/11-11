# Technical Specification: Harness Trace (v0.3.4)

**Feature:** Nested JSON Logging System for Agent Traceability  
**Complexity:** HARD  
**Release:** v0.3.4 Premium "Intelligence & Foundation"  
**Date:** January 13, 2026

---

## 1. Technical Context

### 1.1 Language & Runtime
- **Language:** TypeScript 5.7.2
- **Runtime:** Next.js 14.2.24 (App Router)
- **Node Version:** Compatible with current environment
- **Database:** PGlite 0.3.14 (client-side PostgreSQL)

### 1.2 Key Dependencies
- **@electric-sql/pglite:** ^0.3.14 - Client-side PostgreSQL database
- **zod:** ^3.23.8 - Schema validation
- **framer-motion:** ^11.15.0 - UI animations
- **lucide-react:** ^0.469.0 - Icons
- **next:** ^14.2.24 - Framework
- **openai:** ^4.77.0 - LLM API client

### 1.3 Existing Architecture Patterns

**Database Layer:**
- PGlite singleton pattern: `getDB()` in `/lib/pglite/client.ts`
- Migration system: Versioned files in `/lib/pglite/migrations/`
- Type definitions: TypeScript interfaces in `/lib/pglite/types.ts`
- Database operations: Module-based (e.g., `/lib/pglite/cost.ts`, `/lib/pglite/prompts.ts`)

**API Layer:**
- Next.js Route Handlers in `/app/api/[feature]/[action]/route.ts`
- Zod validation for request bodies
- NextResponse for JSON responses
- Dev mode support with mock authentication

**Business Logic Layer:**
- Feature modules in `/lib/[feature]/`
- Exported functions with TypeScript types
- Comprehensive JSDoc comments
- Error handling with try-catch and graceful degradation

**UI Layer:**
- React components in `/components/[feature]/`
- Material 3 design patterns with Tailwind CSS
- Framer Motion for animations
- Custom hooks in `/hooks/`
- Provider pattern for global state

### 1.4 Integration Points

**Feature 1: Supervisor Router**
- File: `/lib/agents/supervisor.ts`
- Integration: Log routing decisions with `AGENT_ROUTING` events
- Key Function: `routeQuery()` - Add trace logging
- Database: `routing_decisions`, `routing_costs` tables

**Feature 2: Cost Guard**
- File: `/lib/cost/tracking.ts`
- Integration: Log cost tracking with `COST_TRACKED` events
- Key Function: `trackCost()` - Add trace logging
- Database: `cost_records`, `sessions`, `user_monthly_usage` tables

**Feature 3: Librarian Agent**
- File: `/lib/librarian/` (to be checked for search functions)
- Integration: Log search queries with `TOOL_INVOCATION` events
- Key Function: Search operations - Add trace logging

**Agent Handoffs**
- File: `/lib/agents/handoff.ts`
- Integration: Log handoffs with `AGENT_HANDOFF` events
- Database: `agent_handoffs` table

---

## 2. Implementation Approach

### 2.1 Architecture Decision: Nested JSON vs. Flat Events

**Decision:** Use nested JSON structure with JSONB storage in PGlite.

**Rationale:**
1. **Inspectability:** Tree structure makes parent-child relationships explicit
2. **Dataiku Pattern:** Follows enterprise traceability pattern exactly
3. **Performance:** Single database row per trace (vs. thousands of rows for flat events)
4. **Simplicity:** Easier to serialize, transmit, and visualize
5. **Querying:** PGlite JSONB supports JSON path queries for specific events

**Trade-offs:**
- ✅ Pro: Fast retrieval, simple schema, easy to understand
- ❌ Con: Harder to query individual events across traces (mitigated by summary table)

### 2.2 Core Design Patterns

**1. Singleton Trace Context**
- Global trace state with stack-based span management
- Thread-safe for concurrent operations (JavaScript single-threaded)
- Automatic parent-child linking via event stack

**2. Start/End Span Pattern**
```typescript
const spanId = startSpan('AGENT_ROUTING', { query: '...' });
try {
  // ... operation ...
  endSpan(spanId, { agent_id: 'dojo' }, { duration_ms: 150 });
} catch (error) {
  logEvent('ERROR', {}, { error: error.message });
  endSpan(spanId, { error: true }, { duration_ms: 0 });
}
```

**3. Graceful Degradation**
- If database fails, log to console (never throw)
- If trace not started, warn and skip logging
- Summary metrics calculated in-memory, not from database queries

**4. Non-Blocking Logging**
- All logging functions are `async` but don't block caller
- Use fire-and-forget pattern for non-critical traces
- Critical traces (session start/end) await completion

### 2.3 Schema Design

**Primary Table: `harness_traces`**
```sql
CREATE TABLE IF NOT EXISTS harness_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id TEXT NOT NULL UNIQUE,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  events JSONB NOT NULL,
  summary JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast retrieval
CREATE INDEX idx_harness_traces_trace_id ON harness_traces(trace_id);
CREATE INDEX idx_harness_traces_session_id ON harness_traces(session_id);
CREATE INDEX idx_harness_traces_user_id ON harness_traces(user_id);
CREATE INDEX idx_harness_traces_started_at ON harness_traces(started_at DESC);
```

**JSONB Structure:**
- `events`: Array of nested `HarnessEvent` objects
- `summary`: Computed `HarnessSummary` object

**Rationale for JSONB:**
1. PGlite supports JSONB natively with indexing
2. Flexible schema for extensibility
3. Efficient storage (compressed JSON)
4. Fast retrieval (single row query)

---

## 3. Source Code Structure

### 3.1 New Files to Create

**Core Harness Library:**
```
/lib/harness/
├── types.ts                    # TypeScript interfaces for events, traces, metadata
├── trace.ts                    # Core tracing API (startTrace, logEvent, startSpan, endSpan)
├── retrieval.ts                # Database retrieval functions (getTrace, getSessionTraces)
└── utils.ts                    # Helper functions (generateId, addNestedEvent, updateSpan)
```

**Database Layer:**
```
/lib/pglite/
├── migrations/
│   └── 005_add_harness_traces.ts    # Migration for harness_traces table
├── harness.ts                        # Database operations (insertTrace, queryTraces)
└── types.ts                          # Add Harness types (HarnessTraceRow, etc.)
```

**API Routes:**
```
/app/api/harness/
├── trace/
│   └── route.ts                # GET /api/harness/trace?traceId=... (single trace)
├── session/
│   └── route.ts                # GET /api/harness/session?sessionId=... (session traces)
└── user/
    └── route.ts                # GET /api/harness/user?userId=...&limit=10 (user traces)
```

**UI Components:**
```
/components/harness/
├── TraceTreeView.tsx           # Tree view with expand/collapse
├── TraceTimelineView.tsx       # Timeline view with duration bars
├── TraceSummaryView.tsx        # Summary metrics and cost breakdown
├── TraceEventNode.tsx          # Recursive tree node component
├── TraceEventDetails.tsx       # Event details modal/panel
└── index.ts                    # Barrel export
```

**Trace Visualization Page:**
```
/app/traces/
└── [traceId]/
    └── page.tsx                # Main trace viewer page with tab switcher
```

**Custom Hooks:**
```
/hooks/
├── useTrace.ts                 # Fetch single trace by ID
├── useSessionTraces.ts         # Fetch traces for a session
└── useUserTraces.ts            # Fetch traces for a user
```

### 3.2 Files to Modify

**Integration with Existing Features:**
```
/lib/agents/supervisor.ts       # Add trace logging to routeQuery()
/lib/cost/tracking.ts           # Add trace logging to trackCost()
/lib/agents/handoff.ts          # Add trace logging to handoff functions
```

**Database Client:**
```
/lib/pglite/client.ts           # Add migration 005 to initialization
```

**Testing:**
```
/lib/harness/trace.test.ts      # New test file
/lib/harness/retrieval.test.ts  # New test file
```

---

## 4. Data Model Changes

### 4.1 New TypeScript Interfaces

**Core Types (`/lib/harness/types.ts`):**
```typescript
export type HarnessEventType =
  | 'SESSION_START'
  | 'SESSION_END'
  | 'MODE_TRANSITION'
  | 'AGENT_ROUTING'
  | 'AGENT_HANDOFF'
  | 'TOOL_INVOCATION'
  | 'PERSPECTIVE_INTEGRATION'
  | 'COST_TRACKED'
  | 'ERROR'
  | 'USER_INPUT'
  | 'AGENT_RESPONSE';

export interface HarnessMetadata {
  duration_ms?: number;
  token_count?: number;
  cost_usd?: number;
  confidence?: number;
  error_message?: string;
  [key: string]: any;
}

export interface HarnessEvent {
  span_id: string;
  parent_id: string | null;
  event_type: HarnessEventType;
  timestamp: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  metadata: HarnessMetadata;
  children?: HarnessEvent[];
}

export interface HarnessSummary {
  total_events: number;
  total_duration_ms: number;
  total_tokens: number;
  total_cost_usd: number;
  agents_used: string[];
  modes_used: string[];
  errors: number;
}

export interface HarnessTrace {
  trace_id: string;
  session_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  events: HarnessEvent[];
  summary: HarnessSummary;
}
```

**Database Types (`/lib/pglite/types.ts` - additions):**
```typescript
export interface HarnessTraceRow {
  id: string;
  trace_id: string;
  session_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  events: string; // JSON string
  summary: string; // JSON string
  created_at: string;
}

export interface HarnessTraceInsert {
  trace_id: string;
  session_id: string;
  user_id: string;
  started_at: string;
  ended_at?: string | null;
  events: string;
  summary: string;
}
```

### 4.2 Database Schema Changes

**Migration File:** `/lib/pglite/migrations/005_add_harness_traces.ts`

**Tables to Create:**
- `harness_traces` - Main trace storage with JSONB

**Indexes to Create:**
- `idx_harness_traces_trace_id` - Fast lookup by trace ID
- `idx_harness_traces_session_id` - Session-based queries
- `idx_harness_traces_user_id` - User-based queries
- `idx_harness_traces_started_at` - Time-based queries

**No Changes to Existing Tables**

---

## 5. API Changes

### 5.1 New API Endpoints

**GET /api/harness/trace?traceId={id}**
- **Purpose:** Retrieve a single trace by ID
- **Auth:** Required (unless dev mode)
- **Request:** Query param `traceId`
- **Response:**
  ```json
  {
    "trace": {
      "trace_id": "trace_abc123",
      "session_id": "sess_xyz789",
      "user_id": "user_456",
      "started_at": "2026-01-13T10:00:00Z",
      "ended_at": "2026-01-13T10:05:00Z",
      "events": [...],
      "summary": {...}
    }
  }
  ```
- **Errors:** 404 if not found, 401 if unauthorized

**GET /api/harness/session?sessionId={id}**
- **Purpose:** Retrieve all traces for a session
- **Auth:** Required (unless dev mode)
- **Request:** Query param `sessionId`
- **Response:**
  ```json
  {
    "traces": [
      { "trace_id": "trace_001", "summary": {...} },
      { "trace_id": "trace_002", "summary": {...} }
    ]
  }
  ```

**GET /api/harness/user?userId={id}&limit={n}**
- **Purpose:** Retrieve recent traces for a user
- **Auth:** Required (unless dev mode)
- **Request:** Query params `userId`, `limit` (default 10)
- **Response:**
  ```json
  {
    "traces": [
      { "trace_id": "trace_001", "summary": {...} },
      { "trace_id": "trace_002", "summary": {...} }
    ]
  }
  ```

### 5.2 No Breaking Changes

All new endpoints. No modifications to existing APIs.

---

## 6. Verification Approach

### 6.1 Unit Tests

**Test Files:**
- `/lib/harness/trace.test.ts` - Test tracing API
- `/lib/harness/retrieval.test.ts` - Test database retrieval

**Test Strategy:**
Use existing `tsx` test runner (following `/lib/cost/budgets.test.ts` pattern)

**Test Cases:**
```typescript
// trace.test.ts
describe('Harness Trace', () => {
  describe('startTrace', () => {
    it('should create a new trace with correct structure');
    it('should initialize empty events array');
    it('should initialize zero summary metrics');
  });

  describe('logEvent', () => {
    it('should log root-level event');
    it('should update summary metrics');
    it('should warn if no active trace');
  });

  describe('startSpan/endSpan', () => {
    it('should create nested event structure');
    it('should track parent-child relationships');
    it('should calculate duration correctly');
    it('should handle span mismatch gracefully');
  });

  describe('endTrace', () => {
    it('should set ended_at timestamp');
    it('should persist to database');
    it('should reset trace state');
  });
});
```

**Mock Strategy:**
- Mock PGlite database with in-memory implementation
- Mock `getDB()` function
- Mock `generateId()` for deterministic IDs

### 6.2 Integration Tests

**Integration Points to Test:**
1. Supervisor Router → Harness Trace integration
2. Cost Guard → Harness Trace integration
3. Full trace lifecycle (start → log events → end → retrieve)
4. Database persistence and retrieval
5. API endpoints with real database

**Test Script:** Create `/scripts/test-harness-integration.ts`

**Test Flow:**
```typescript
1. Start a trace for a mock session
2. Simulate routing query (should log AGENT_ROUTING event)
3. Simulate cost tracking (should log COST_TRACKED event)
4. Simulate agent handoff (should log AGENT_HANDOFF event)
5. End the trace
6. Retrieve trace from database
7. Verify nested structure matches expected
8. Verify summary metrics are correct
```

### 6.3 Manual Testing

**Test Plan:**
1. Run dev server: `npm run dev`
2. Navigate to Multi-Agent view
3. Send a query to trigger routing
4. Observe trace logging in browser console
5. Navigate to `/traces/{traceId}` page
6. Verify three views render correctly:
   - Tree view shows nested structure
   - Timeline view shows chronological events
   - Summary view shows metrics
7. Test expand/collapse in tree view
8. Test hover interactions in timeline view
9. Verify accessibility (keyboard navigation)

**Success Criteria:**
- Zero console errors
- Trace persists to IndexedDB (browser)
- All three views render within 1s
- No infinite loops or React errors
- Responsive on mobile viewport

### 6.4 Performance Tests

**Metrics to Measure:**
1. **Logging Overhead:** Time added by `logEvent()` call
   - Target: <10ms per event
   - Measurement: `console.time()` wrapper

2. **Trace Retrieval:** Time to fetch and parse 100-event trace
   - Target: <500ms
   - Measurement: Network tab + performance.now()

3. **Visualization Render:** Time to render tree view
   - Target: <1s for 100-event trace
   - Measurement: React DevTools Profiler

**Performance Test Script:**
```typescript
// scripts/test-harness-performance.ts
const perfTest = async () => {
  // Create 100-event trace
  const start = performance.now();
  startTrace('sess_perf', 'user_perf');
  for (let i = 0; i < 100; i++) {
    logEvent('TOOL_INVOCATION', { i }, { result: i });
  }
  endTrace();
  const end = performance.now();
  
  console.log(`Logging 100 events took ${end - start}ms`);
  // Target: <1000ms (10ms per event)
};
```

### 6.5 Lint & Type-Check Commands

**Pre-Merge Verification:**
```bash
npm run lint
npm run type-check
npm run build
```

**Must Pass:** All three commands must succeed with zero errors.

---

## 7. Implementation Plan Breakdown

### Phase 1: Core Infrastructure (2-3 days)
**Tasks:**
1. Create `/lib/harness/types.ts` with all TypeScript interfaces
2. Create `/lib/harness/utils.ts` with helper functions
3. Create `/lib/harness/trace.ts` with core tracing API
4. Write unit tests for tracing API
5. Create database migration `005_add_harness_traces.ts`
6. Create `/lib/pglite/harness.ts` with database operations
7. Update `/lib/pglite/client.ts` to run migration 005

**Verification:** Unit tests pass, migration runs successfully

### Phase 2: Retrieval & API (1-2 days)
**Tasks:**
1. Create `/lib/harness/retrieval.ts` with query functions
2. Create API routes:
   - `/app/api/harness/trace/route.ts`
   - `/app/api/harness/session/route.ts`
   - `/app/api/harness/user/route.ts`
3. Write tests for retrieval functions
4. Test API endpoints with Postman/curl

**Verification:** API endpoints return correct data

### Phase 3: Integration with Existing Features (2-3 days)
**Tasks:**
1. Integrate with Supervisor Router (`/lib/agents/supervisor.ts`)
2. Integrate with Cost Guard (`/lib/cost/tracking.ts`)
3. Integrate with Agent Handoffs (`/lib/agents/handoff.ts`)
4. Write integration tests
5. Manual testing of full trace lifecycle

**Verification:** Integration tests pass, traces contain expected events

### Phase 4: UI Components (3-4 days)
**Tasks:**
1. Create custom hooks (`useTrace`, `useSessionTraces`, `useUserTraces`)
2. Create `TraceTreeView` component with expand/collapse
3. Create `TraceTimelineView` component with duration bars
4. Create `TraceSummaryView` component with metrics
5. Create `/app/traces/[traceId]/page.tsx` with tab switcher
6. Add loading states and error boundaries
7. Style with Tailwind + Framer Motion animations

**Verification:** Manual testing of UI, accessibility check, responsive design

### Phase 5: Documentation & Testing (1-2 days)
**Tasks:**
1. Write JSDoc comments for all public functions
2. Create `/lib/harness/README.md` with usage guide
3. Update JOURNAL.md with architectural decisions
4. Run full test suite (unit + integration)
5. Run lint + type-check + build
6. Performance testing (logging overhead, retrieval speed)
7. Manual acceptance testing

**Verification:** All tests pass, documentation complete, ready for review

### Phase 6: Polish & Edge Cases (1 day)
**Tasks:**
1. Handle edge cases (empty trace, very long trace, database offline)
2. Add telemetry/analytics for trace usage
3. Optimize bundle size (lazy loading components)
4. Final accessibility audit
5. Cross-browser testing (Chrome, Firefox, Safari)

**Verification:** Zero P0/P1 bugs, meets excellence criteria

---

## 8. Excellence Criteria Self-Assessment

### 8.1 Prioritized Criteria for v0.3.0

**Must Be Excellent (9-10/10):**

1. **Stability (10/10 Target)**
   - Zero P0/P1 bugs
   - Comprehensive error handling
   - Graceful degradation if database fails
   - Never blocks or throws during logging
   - Edge cases: empty trace, long trace, offline database

2. **Research Integration (10/10 Target)**
   - Pure Dataiku Harness Trace pattern implementation
   - Nested span-based logging (as per research)
   - Full execution tree capture
   - Documentation cites Dataiku research
   - Seed 4 patterns followed exactly

3. **Depth (10/10 Target)**
   - Complete tracing system (logging, persistence, visualization)
   - Three complementary views (tree, timeline, summary)
   - Integrated with all agents (Supervisor, Cost Guard, Librarian)
   - Comprehensive documentation (JSDoc, README, JOURNAL updates)
   - Clean, readable, well-architected code

**Must Be Very Good (7-8/10):**

4. **Performance (9/10 Target)**
   - Logging adds <10ms overhead per event
   - Trace retrieval <500ms for 100-event trace
   - Visualization renders in <1s
   - No performance regressions in existing features

5. **Usability (9/10 Target)**
   - Clear trace visualization (intuitive without docs)
   - Easy to understand event types
   - Helpful for debugging (clear error messages)
   - WCAG AA compliance (keyboard nav, screen readers)

**Can Be Good (6-7/10):**

6. **Beauty (7/10 Target)**
   - Clean UI with basic animations
   - Follows existing design system (Material 3, Tailwind)
   - Not necessarily pixel-perfect, but polished

7. **Creativity (7/10 Target)**
   - Solid implementation of proven pattern
   - Not necessarily novel, but well-executed

---

## 9. Risk Assessment & Mitigation

### 9.1 Technical Risks

**Risk 1: JSONB Performance with Large Traces**
- **Impact:** High (affects core functionality)
- **Probability:** Medium (100+ event traces likely)
- **Mitigation:**
  - Implement pagination for UI (show first 50 events, load more)
  - Add trace size warning (>100 events)
  - Consider trace truncation (keep first/last N events)
  - Monitor trace sizes in production

**Risk 2: Race Conditions in Span Stack**
- **Impact:** High (corrupts trace structure)
- **Probability:** Low (JavaScript single-threaded, but async operations)
- **Mitigation:**
  - Use synchronous stack operations (push/pop)
  - Don't await during span management
  - Add stack validation in tests
  - Warn on span mismatch (don't throw)

**Risk 3: Integration Breaking Existing Features**
- **Impact:** Critical (blocks release)
- **Probability:** Medium (modifying supervisor, cost tracking)
- **Mitigation:**
  - Add trace logging as optional (try-catch wrapper)
  - Never throw errors from trace logging
  - Comprehensive regression testing
  - Feature flag for trace logging (can disable in production)

**Risk 4: Database Migration Failures**
- **Impact:** High (users can't initialize database)
- **Probability:** Low (following proven migration pattern)
- **Mitigation:**
  - Test migration on fresh database
  - Test migration on existing database
  - Add rollback script (drop table)
  - Idempotent migration (IF NOT EXISTS)

### 9.2 UX Risks

**Risk 5: Trace Visualization Overwhelming Users**
- **Impact:** Medium (users confused, don't use feature)
- **Probability:** Medium (100+ events is complex)
- **Mitigation:**
  - Default to summary view (simplest)
  - Add "expand all" / "collapse all" controls
  - Highlight critical events (errors, high costs)
  - Provide filtering (hide low-level events)

**Risk 6: Performance Perception**
- **Impact:** Medium (users think app is slow)
- **Probability:** Medium (logging overhead visible)
- **Mitigation:**
  - Log asynchronously (fire-and-forget)
  - Show loading states in UI
  - Optimize hot paths (routing, cost tracking)
  - Add performance metrics to summary

---

## 10. Deferred Features (Future Releases)

**Not in v0.3.4:**
1. Trace export (JSON, CSV) - Deferred to v0.3.5
2. Trace comparison (diff two traces) - Deferred to v0.4.0
3. Trace analytics dashboard (trends, patterns) - Deferred to v0.4.0
4. Real-time trace streaming (WebSocket) - Deferred to v0.5.0
5. Trace sampling (for high-volume production) - Deferred to v0.5.0
6. Trace search (find traces by event type, agent, etc.) - Deferred to v0.4.0

**Rationale:** Focus on core traceability first. Export, analytics, and real-time streaming are valuable but not essential for v0.3.4's "Intelligence & Foundation" theme.

---

## 11. Open Questions (To Resolve During Implementation)

1. **Q:** Should traces auto-delete after N days to prevent IndexedDB bloat?
   - **A:** Implement in v0.3.5 (not critical for initial release)

2. **Q:** Should we log traces for all sessions or only opt-in?
   - **A:** Log all sessions (tracing is core feature, not optional)

3. **Q:** How to handle very long traces (1000+ events)?
   - **A:** Implement pagination in UI, warn at 100 events

4. **Q:** Should trace IDs be human-readable or UUIDs?
   - **A:** Use `trace_{timestamp}_{random}` format for readability

5. **Q:** Should traces be accessible across sessions (persistent)?
   - **A:** Yes, stored in IndexedDB (persists across browser sessions)

6. **Q:** Should we version the trace schema for backward compatibility?
   - **A:** Add `version: "1.0"` field to HarnessTrace (for future migrations)

---

## 12. Success Criteria (Definition of Done)

**Functionality:**
- [ ] Harness Trace API implemented and tested
- [ ] Database migration runs successfully
- [ ] Integration with Supervisor, Cost Guard, Librarian complete
- [ ] Three visualization views implemented and functional
- [ ] API endpoints working and tested

**Quality:**
- [ ] Zero P0/P1 bugs
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing complete
- [ ] Performance targets met (<10ms overhead, <500ms retrieval, <1s render)

**Code Quality:**
- [ ] TypeScript compilation passes (zero errors)
- [ ] Linting passes (zero errors)
- [ ] Build succeeds (npm run build)
- [ ] JSDoc comments on all public functions
- [ ] Code follows existing patterns

**Documentation:**
- [ ] JOURNAL.md updated with architectural decisions
- [ ] README in `/lib/harness/` with usage guide
- [ ] Excellence criteria self-assessment complete
- [ ] API documentation in code comments

**Accessibility & UX:**
- [ ] WCAG AA compliance (keyboard nav, screen readers)
- [ ] Responsive design (mobile-friendly)
- [ ] Clear error messages and loading states
- [ ] Intuitive UI (understandable without docs)

**Excellence Criteria Met:**
- [ ] Stability: 10/10 (zero bugs, comprehensive error handling)
- [ ] Research Integration: 10/10 (pure Dataiku pattern)
- [ ] Depth: 10/10 (complete, documented, extensible)
- [ ] Performance: 9/10 (targets met, no regressions)
- [ ] Usability: 9/10 (clear, helpful, accessible)
- [ ] Beauty: 7/10 (clean UI, follows design system)
- [ ] Creativity: 7/10 (solid implementation)

---

**Specification Author:** Zencoder AI  
**Review Status:** Ready for Implementation  
**Estimated Duration:** 10-12 days (2 weeks)  
**Complexity Assessment:** HARD
