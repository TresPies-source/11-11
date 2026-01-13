# Cost Guard (Three-Tier Budgeting) - Technical Specification

**Feature:** Cost Guard  
**Release:** v0.3.2 Premium "Intelligence & Foundation"  
**Difficulty:** **HARD**  
**Complexity Rationale:**
- Complex multi-tier budget system with accurate token estimation
- Database schema changes requiring migrations
- Multiple new API endpoints with careful error handling
- Integration with existing session/user management
- Real-time UI dashboard with charts and progress indicators
- High stability requirements (10/10 - must never exceed budgets)
- Performance constraints (<50ms estimation overhead)

---

## 1. Technical Context

### Language & Framework
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.7
- **Database:** PGlite (PostgreSQL in-browser via IndexedDB)
- **Styling:** Tailwind CSS + Framer Motion
- **Icons:** Lucide React
- **State Management:** React hooks + localStorage for persistence

### Current Dependencies (from package.json)
- `@electric-sql/pglite`: ^0.3.14 (Database)
- `next`: ^14.2.24 (Framework)
- `react`: ^18.3.1
- `framer-motion`: ^11.15.0 (Animations)
- `lucide-react`: ^0.469.0 (Icons)
- `clsx`, `tailwind-merge`: Styling utilities

### Missing Dependencies (To Install)
- **tiktoken**: For accurate token counting (OpenAI's tokenizer)
  - Latest version: `tiktoken@^1.0.15` (or latest stable)
  - Required for <10% estimation accuracy

---

## 2. Implementation Approach

### Architecture Overview

The Cost Guard feature implements Dataiku's three-tier budgeting pattern:

```
┌─────────────────────────────────────────────────────────┐
│                    Cost Guard System                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────┐│
│  │  Per-Query     │  │  Per-Session   │  │  Per-User  ││
│  │  Budget        │  │  Budget        │  │  Budget    ││
│  │  (10k tokens)  │  │  (50k tokens)  │  │  (500k/mo) ││
│  └───────┬────────┘  └───────┬────────┘  └──────┬─────┘│
│          │                   │                   │      │
│          └───────────────────┴───────────────────┘      │
│                              │                          │
│                    ┌─────────▼─────────┐               │
│                    │  Budget Check      │               │
│                    │  (Pre-flight)      │               │
│                    └─────────┬──────────┘               │
│                              │                          │
│                    ┌─────────▼─────────┐               │
│                    │  Token Estimation  │               │
│                    │  (tiktoken)        │               │
│                    └─────────┬──────────┘               │
│                              │                          │
│                    ┌─────────▼─────────┐               │
│                    │  Cost Tracking     │               │
│                    │  (PGlite)          │               │
│                    └─────────┬──────────┘               │
│                              │                          │
│                    ┌─────────▼─────────┐               │
│                    │  Dashboard UI      │               │
│                    │  (Real-time)       │               │
│                    └────────────────────┘               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Implementation Pattern
Following existing codebase patterns:

1. **Database Layer** (`/lib/pglite/`)
   - Create `cost.ts` module following patterns from `prompts.ts` and `critiques.ts`
   - Add schema migration to `schema.ts`
   - Type definitions in `types.ts`

2. **Business Logic Layer** (`/lib/cost/`)
   - NEW directory for Cost Guard logic
   - `budgets.ts` - Budget checking and enforcement
   - `estimation.ts` - Token estimation with tiktoken
   - `tracking.ts` - Cost tracking and logging
   - `mode-selection.ts` - Cost-aware mode selection
   - `constants.ts` - Budget limits and pricing

3. **API Layer** (`/app/api/cost/`)
   - NEW directory for Cost Guard endpoints
   - `estimate/route.ts` - Pre-flight token estimation
   - `budget/route.ts` - Get current budget status
   - `track/route.ts` - Log actual usage

4. **UI Layer** (`/components/cost/`)
   - NEW directory for Cost Guard components
   - `CostDashboard.tsx` - Main dashboard
   - `BudgetProgress.tsx` - Progress bar component
   - `CostRecordsTable.tsx` - Recent queries table
   - `CostTrendsChart.tsx` - 30-day trends chart
   - `BudgetAlert.tsx` - Warning/error alerts

5. **Hooks Layer** (`/hooks/`)
   - `useBudgetStatus.ts` - Real-time budget status
   - `useCostRecords.ts` - Query cost records
   - `useCostTrends.ts` - Fetch cost trends

### Design Decisions

**1. Why tiktoken for token estimation?**
- OpenAI's official tokenizer, same as GPT models use
- Accuracy within 1-2% of actual usage (far exceeds 10% requirement)
- Supports all GPT models (gpt-4o, gpt-4o-mini, etc.)
- Minimal overhead (<10ms for typical prompts)

**2. Why three-tier budgeting?**
- Follows Dataiku's proven Cost Guard pattern
- Prevents runaway costs at multiple levels:
  - Query: Prevents single expensive query
  - Session: Prevents long conversations from spiraling
  - User: Prevents monthly budget overruns
- Each tier has different warning/stop thresholds

**3. Why 80% warn / 100% stop thresholds?**
- 80% warning gives users time to adjust behavior
- 100% hard stop prevents budget overruns
- Configurable for future flexibility

**4. Why PGlite for cost tracking?**
- Already used for prompts and critiques
- Consistent with existing architecture
- No additional database setup required
- Supports JSONB for flexible metadata

**5. Why monthly user budgets (not weekly/daily)?**
- Aligns with typical billing cycles
- Allows for variable usage patterns
- Easier to communicate to users
- Future rollover feature is simpler

---

## 3. Database Schema Changes

### New Tables

**Table: `cost_records`**
Stores individual LLM call costs for audit trail.

```sql
CREATE TABLE IF NOT EXISTS cost_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT,
  query_id TEXT,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL CHECK (prompt_tokens >= 0),
  completion_tokens INTEGER NOT NULL CHECK (completion_tokens >= 0),
  total_tokens INTEGER NOT NULL CHECK (total_tokens >= 0),
  cost_usd DECIMAL(10, 6) NOT NULL CHECK (cost_usd >= 0),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('routing', 'agent_execution', 'search', 'critique', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cost_records_user_id ON cost_records(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_records_session_id ON cost_records(session_id);
CREATE INDEX IF NOT EXISTS idx_cost_records_created_at ON cost_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cost_records_user_created ON cost_records(user_id, created_at DESC);
```

**Table: `sessions`**
Add columns to existing table (create if doesn't exist yet).

```sql
-- Create table if not exists (may already exist in future)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_tokens INTEGER DEFAULT 0 CHECK (total_tokens >= 0),
  total_cost_usd DECIMAL(10, 6) DEFAULT 0 CHECK (total_cost_usd >= 0)
);

-- Add columns if table exists but columns don't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'total_tokens'
  ) THEN
    ALTER TABLE sessions ADD COLUMN total_tokens INTEGER DEFAULT 0 CHECK (total_tokens >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'total_cost_usd'
  ) THEN
    ALTER TABLE sessions ADD COLUMN total_cost_usd DECIMAL(10, 6) DEFAULT 0 CHECK (total_cost_usd >= 0);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
```

**Table: `user_monthly_usage`**
Tracks monthly token usage and costs per user.

```sql
CREATE TABLE IF NOT EXISTS user_monthly_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM
  total_tokens INTEGER DEFAULT 0 CHECK (total_tokens >= 0),
  total_cost_usd DECIMAL(10, 6) DEFAULT 0 CHECK (total_cost_usd >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_monthly_usage_unique UNIQUE (user_id, month)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_monthly_usage_user_id ON user_monthly_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_monthly_usage_month ON user_monthly_usage(month DESC);
CREATE INDEX IF NOT EXISTS idx_user_monthly_usage_user_month ON user_monthly_usage(user_id, month);
```

### Migration Strategy

**Migration File:** `/lib/pglite/migrations/003_add_cost_guard.ts`

Pattern: Follow existing migration pattern from `002_add_status_history.ts`

```typescript
export async function migrate003_addCostGuard(db: any): Promise<void> {
  console.log('[Migration 003] Adding Cost Guard tables...');
  
  // Create cost_records table
  // Create/update sessions table with cost columns
  // Create user_monthly_usage table
  
  console.log('[Migration 003] Cost Guard tables created successfully');
}
```

Update `schema.ts` to include migration runner.

---

## 4. Source Code Structure

### New Files to Create

```
/lib/cost/
├── budgets.ts           # Budget checking logic
├── estimation.ts        # Token estimation with tiktoken
├── tracking.ts          # Cost tracking and logging
├── mode-selection.ts    # Cost-aware mode selection
├── constants.ts         # Budget limits, pricing, thresholds
└── types.ts            # TypeScript interfaces

/lib/pglite/
├── cost.ts             # Database queries for cost records
└── migrations/
    └── 003_add_cost_guard.ts

/app/api/cost/
├── estimate/
│   └── route.ts        # POST /api/cost/estimate
├── budget/
│   └── route.ts        # GET /api/cost/budget
└── track/
    └── route.ts        # POST /api/cost/track

/components/cost/
├── CostDashboard.tsx           # Main dashboard component
├── BudgetProgress.tsx          # Progress bar with color coding
├── CostRecordsTable.tsx        # Recent queries table
├── CostTrendsChart.tsx         # 30-day trends chart (SVG/Canvas)
└── BudgetAlert.tsx             # Warning/error banners

/hooks/
├── useBudgetStatus.ts          # Fetch real-time budget status
├── useCostRecords.ts           # Fetch recent cost records
└── useCostTrends.ts            # Fetch 30-day trends
```

### Files to Modify

```
/lib/pglite/schema.ts           # Add Cost Guard migration
/lib/pglite/types.ts            # Add Cost Guard types
/app/layout.tsx                 # (Potentially) Add cost dashboard route
/package.json                   # Add tiktoken dependency
```

---

## 5. API Specification

### POST /api/cost/estimate

**Purpose:** Pre-flight token estimation

**Request:**
```typescript
interface EstimateRequest {
  system_prompt: string;
  user_messages: Array<{ role: string; content: string }>;
  max_completion_tokens?: number;
  model: string;
}
```

**Response:**
```typescript
interface EstimateResponse {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  model: string;
}
```

**Error Responses:**
- 400: Invalid request (missing fields)
- 401: Unauthorized (no session)
- 500: Server error

**Implementation Pattern:**
- Follow `app/api/librarian/sync/route.ts` pattern
- Use `auth()` for session validation
- Call `estimateTokens()` from `/lib/cost/estimation.ts`
- Return JSON response

---

### GET /api/cost/budget

**Purpose:** Get current budget status

**Query Parameters:**
- `session_id` (optional): Specific session ID

**Response:**
```typescript
interface BudgetStatusResponse {
  query_limit: number;
  session_limit: number;
  user_monthly_limit: number;
  query_usage: number;  // Always 0 (no query in progress)
  session_usage: number;
  user_monthly_usage: number;
  warnings: string[];  // e.g., ['session_approaching_limit']
  total_cost_this_month: number;
}
```

**Error Responses:**
- 401: Unauthorized (no session)
- 404: Session not found (if session_id provided)
- 500: Server error

**Implementation:**
- Get user from `auth()`
- Query `sessions` table for session totals
- Query `user_monthly_usage` for monthly totals
- Calculate warnings based on thresholds
- Return budget status

---

### POST /api/cost/track

**Purpose:** Log actual token usage

**Request:**
```typescript
interface TrackCostRequest {
  user_id: string;
  session_id?: string;
  query_id?: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  operation_type: 'routing' | 'agent_execution' | 'search' | 'critique' | 'other';
}
```

**Response:**
```typescript
interface TrackCostResponse {
  success: boolean;
  session_total_tokens?: number;
  user_monthly_total_tokens: number;
}
```

**Error Responses:**
- 400: Invalid request
- 401: Unauthorized
- 500: Server error

**Implementation:**
- Validate request fields
- Insert into `cost_records` table
- Update `sessions.total_tokens` and `sessions.total_cost_usd`
- Upsert `user_monthly_usage` (increment or create)
- Return updated totals

---

## 6. Type Definitions

### Core Types (`/lib/cost/types.ts`)

```typescript
export interface BudgetConfig {
  query_limit: number;
  session_limit: number;
  user_monthly_limit: number;
  warn_threshold: number;
  stop_threshold: number;
}

export interface BudgetCheckResult {
  allowed: boolean;
  reason?: 'query_limit_exceeded' | 'session_limit_exceeded' | 'user_limit_exceeded';
  limit?: number;
  current?: number;
  estimated?: number;
  warnings: string[];
}

export interface TokenEstimate {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  model: string;
}

export interface CostRecord {
  id: string;
  user_id: string;
  session_id: string | null;
  query_id: string | null;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  operation_type: 'routing' | 'agent_execution' | 'search' | 'critique' | 'other';
  created_at: string;
}

export interface ModeSelection {
  mode: 'Mirror' | 'Scout' | 'Gardener' | 'Implementation';
  model: string;
  reason: string;
  downgraded: boolean;
}
```

### Database Types (`/lib/pglite/types.ts`)

```typescript
export interface CostRecordRow {
  id: string;
  user_id: string;
  session_id: string | null;
  query_id: string | null;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: string; // DECIMAL stored as string
  operation_type: string;
  created_at: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  total_tokens: number;
  total_cost_usd: string; // DECIMAL stored as string
}

export interface UserMonthlyUsageRow {
  id: string;
  user_id: string;
  month: string; // YYYY-MM
  total_tokens: number;
  total_cost_usd: string; // DECIMAL stored as string
  created_at: string;
  updated_at: string;
}
```

---

## 7. Integration Points

### With Existing Systems

1. **Authentication (NextAuth)**
   - Use existing `auth()` from `/lib/auth.ts`
   - User ID from `session.user.email` or `session.user.id`

2. **Database (PGlite)**
   - Use existing client from `/lib/pglite/client.ts`
   - Follow patterns from `/lib/pglite/prompts.ts` and `/lib/pglite/critiques.ts`

3. **UI Components**
   - Follow card pattern from `/components/librarian/SeedlingCard.tsx`
   - Use Framer Motion for animations
   - Use Lucide icons for UI elements

4. **Error Handling**
   - Follow pattern from `/app/api/librarian/sync/route.ts`
   - Return proper HTTP status codes
   - Use NextResponse.json()

### With Future Features (Feature 1: Supervisor Router)

**Integration Plan (Post-Merge):**

Once Supervisor Router is merged:

1. Supervisor calls `checkBudget()` before routing
2. Routing costs tracked via `trackCost()` with `operation_type: 'routing'`
3. If budget exceeded, fall back to Dojo (no routing)
4. Routing costs displayed in Cost Dashboard

**API:**
```typescript
// In Supervisor Router
import { checkBudget } from '@/lib/cost/budgets';
import { trackCost } from '@/lib/cost/tracking';
import { estimateTokens } from '@/lib/cost/estimation';

// Before routing
const estimate = estimateTokens(systemPrompt, messages, 500, 'gpt-4o-mini');
const budgetCheck = await checkBudget(userId, sessionId, estimate.total_tokens);

if (!budgetCheck.allowed) {
  // Fall back to Dojo
  console.warn('Budget exceeded, falling back to Dojo');
  return dojo();
}

// After routing
await trackCost({
  user_id: userId,
  session_id: sessionId,
  model: 'gpt-4o-mini',
  ...actualTokens,
  operation_type: 'routing'
});
```

---

## 8. Performance Considerations

### Token Estimation Performance

**Target:** <50ms for typical prompts

**Optimization Strategies:**
1. **Lazy load tiktoken encoder** - Only load on first use
2. **Cache encoder instances** - Reuse across calls
3. **Estimate completion tokens conservatively** - Use max_completion_tokens as upper bound
4. **Minimal overhead** - Direct tiktoken calls, no wrapper layers

**Measurement:**
- Add `console.time()` / `console.timeEnd()` in development
- Log warnings if estimation takes >50ms
- Future: Add to Harness Trace metadata

### Budget Check Performance

**Target:** <100ms total overhead

**Optimization Strategies:**
1. **Indexed queries** - Use indexes on `user_id`, `session_id`, `created_at`
2. **Aggregation at insert** - Update session/user totals during `trackCost()`
3. **No complex calculations** - Simple sum queries only
4. **Connection pooling** - Reuse PGlite client

### Dashboard Performance

**Target:** <1s initial load

**Optimization Strategies:**
1. **Pagination** - Limit cost records to recent 10-50
2. **Date range filters** - Only query needed range
3. **Lazy load charts** - Load trends only when dashboard visible
4. **SWR/React Query** - Cache and revalidate data
5. **Incremental updates** - Real-time updates via hooks, not full refresh

---

## 9. Testing Strategy

### Unit Tests

**Create:** `/lib/cost/__tests__/` directory

**Tests:**
1. `budgets.test.ts`
   - checkBudget() returns correct warnings
   - checkBudget() blocks when limit exceeded
   - checkBudget() allows when under limit
   - Edge cases: zero budget, negative usage (should error)

2. `estimation.test.ts`
   - estimateTokens() accuracy within 10% (compare to known prompts)
   - calculateCost() returns correct USD amount
   - Support for multiple models (gpt-4o, gpt-4o-mini)
   - Edge cases: empty prompt, very long prompt

3. `mode-selection.test.ts`
   - selectMode() downgrades when budget <40%
   - selectMode() forces Mirror when budget <20%
   - selectMode() allows requested mode when budget >40%

**Test Framework:**
- Use existing test setup (check for Jest/Vitest in `package.json`)
- If no tests exist, defer comprehensive testing to manual verification
- Focus on critical path: budget checks and estimation accuracy

### Integration Tests

**Manual Testing Checklist:**

1. **Budget Check Flow**
   - [ ] Make query → budget checked before execution
   - [ ] Exceed query limit → hard stop
   - [ ] Approach session limit → warning shown
   - [ ] Exceed user monthly limit → hard stop

2. **Cost Tracking Flow**
   - [ ] Make LLM call → cost tracked
   - [ ] Check `cost_records` table → record inserted
   - [ ] Check `sessions` table → totals updated
   - [ ] Check `user_monthly_usage` table → monthly total updated

3. **Dashboard Flow**
   - [ ] Load dashboard → shows current usage
   - [ ] Make query → dashboard updates in real-time
   - [ ] View recent queries → table populated
   - [ ] View trends → chart renders (if implemented)

4. **API Endpoints**
   - [ ] POST /api/cost/estimate → returns accurate estimate
   - [ ] GET /api/cost/budget → returns current status
   - [ ] POST /api/cost/track → logs cost successfully

### Performance Tests

**Manual Verification:**

1. **Token Estimation**
   - [ ] Run estimation 100 times → average <50ms
   - [ ] Test with various prompt sizes (100, 1000, 5000 tokens)

2. **Budget Check**
   - [ ] Run budget check 100 times → average <100ms

3. **Dashboard Load**
   - [ ] Cold load (no cache) → <1s
   - [ ] Warm load (cached) → <500ms

**Tools:**
- Chrome DevTools Performance tab
- `console.time()` / `console.timeEnd()` for timing
- Network tab for API response times

---

## 10. Verification Approach

### Development Verification

**Step 1: Install Dependencies**
```bash
npm install tiktoken
```

**Step 2: Database Migration**
```bash
# Start dev server (migration runs automatically)
npm run dev

# Verify tables created (check browser IndexedDB or PGlite logs)
```

**Step 3: API Testing**
```bash
# Use curl or Postman to test endpoints
curl -X POST http://localhost:3000/api/cost/estimate \
  -H "Content-Type: application/json" \
  -d '{"system_prompt":"You are Dojo","user_messages":[{"role":"user","content":"Hello"}],"model":"gpt-4o"}'
```

**Step 4: UI Testing**
```bash
# Navigate to /cost-dashboard (or wherever dashboard is mounted)
# Verify:
# - Budget progress bars render
# - Cost records table populates
# - Alerts show for approaching limits
```

### Pre-Deployment Checklist

**Code Quality:**
- [ ] All TypeScript errors resolved (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)

**Functionality:**
- [ ] All three budget tiers work (query, session, user)
- [ ] Token estimation accurate within 10%
- [ ] Cost tracking persists across sessions
- [ ] Dashboard displays real-time data
- [ ] Alerts show at correct thresholds (80%, 100%)

**Performance:**
- [ ] Token estimation <50ms (verified in console)
- [ ] Budget check <100ms (verified in console)
- [ ] Dashboard loads <1s (verified in DevTools)

**Stability:**
- [ ] No regressions in existing features
- [ ] Error handling for all edge cases
- [ ] Graceful degradation if PGlite fails
- [ ] No console errors or warnings

---

## 11. Edge Cases & Error Handling

### Edge Cases to Handle

1. **No session_id provided**
   - Budget check uses user-level only
   - Session-level budget ignored (or default to 0)

2. **New user (no monthly usage record)**
   - Create new `user_monthly_usage` record on first query
   - Initialize with 0 tokens/cost

3. **Month rollover**
   - New month → create new usage record
   - Old month records persist (for history/analytics)

4. **Negative token counts**
   - Validation: Reject requests with negative tokens
   - Database constraint: CHECK (tokens >= 0)

5. **Model not in pricing table**
   - Fallback to gpt-4o pricing (conservative estimate)
   - Log warning for unknown model

6. **PGlite connection failure**
   - Graceful degradation: Log to console, allow LLM call
   - Show warning in UI: "Cost tracking unavailable"

7. **Estimation timeout**
   - If tiktoken takes >1s, use fallback estimation (4 chars/token)
   - Log warning

8. **Concurrent budget checks**
   - Race condition: Two queries check budget simultaneously
   - Mitigation: Use optimistic locking or accept small over-budget risk
   - Future: Implement proper transactions

### Error Responses

**API Errors:**
- 400: Bad request (validation failed)
- 401: Unauthorized (no session)
- 404: Resource not found (session, user)
- 500: Server error (database failure, etc.)

**Error Format:**
```json
{
  "error": "Budget limit exceeded",
  "code": "USER_LIMIT_EXCEEDED",
  "limit": 500000,
  "current": 498000,
  "estimated": 3000
}
```

---

## 12. Excellence Criteria Self-Assessment

### Stability (Target: 10/10)
- [ ] Never exceeds budget limits (hard stop at 100%)
- [ ] Token estimation within 10% accuracy
- [ ] Cost tracking never fails (or fails gracefully)
- [ ] All edge cases handled
- [ ] No regressions in existing features
- [ ] Comprehensive error handling
- [ ] Database constraints prevent invalid data

### Research Integration (Target: 10/10)
- [ ] Implements Dataiku's Cost Guard pattern exactly
- [ ] Three-tier budgeting (query/session/user)
- [ ] Proactive cost management (not reactive)
- [ ] Documentation cites Dataiku research
- [ ] Seed 2 patterns followed precisely
- [ ] Novel synthesis: Combines budgeting + mode selection

### Depth (Target: 10/10)
- [ ] Complete budgeting system (all three tiers)
- [ ] Accurate estimation (<10% error)
- [ ] User-friendly dashboard (real-time, charts, alerts)
- [ ] Comprehensive API (estimate, budget, track)
- [ ] Full database schema (cost_records, sessions, user_monthly_usage)
- [ ] Integration with existing systems (auth, database, UI)
- [ ] Future-ready (Supervisor Router integration planned)

### Performance (Target: 9/10)
- [ ] Token estimation <50ms overhead
- [ ] Budget check <100ms overhead
- [ ] Dashboard loads <1s
- [ ] No performance regressions
- [ ] Efficient database queries (indexed, aggregated)
- [ ] Lazy loading for charts

### Parallelization (Target: 10/10)
- [ ] Zero dependencies on other features
- [ ] Isolated implementation (new directories)
- [ ] Clean integration points (well-defined APIs)
- [ ] Can be merged without breaking existing features
- [ ] Extensible for future features (Supervisor Router)

### Beauty (Target: 6-7/10 - Good)
- [ ] Clean dashboard UI (not necessarily stunning)
- [ ] Consistent with existing design system
- [ ] Progress bars with color coding (green/yellow/red)
- [ ] Smooth animations (Framer Motion)
- [ ] Accessible (WCAG AA)
- [ ] Responsive design

---

## 13. Documentation Requirements

### Code Documentation
- [ ] JSDoc comments for all public functions
- [ ] README in `/lib/cost/` explaining system
- [ ] Examples of budget configuration
- [ ] Troubleshooting guide

### JOURNAL.md Updates
- [ ] Why three-tier budgeting
- [ ] Why tiktoken (accuracy)
- [ ] Why 80% warn / 100% stop thresholds
- [ ] PGlite integration approach
- [ ] Mode selection rationale
- [ ] Self-assessment against Excellence Criteria

### User Documentation (Future)
- [ ] How to interpret dashboard
- [ ] What happens when budget exceeded
- [ ] How to upgrade limits (deferred to v0.4.0)

---

## 14. Deferred to Future Releases

These features are explicitly out of scope for v0.3.2:

- Custom budget limits per user
- Budget rollover and sharing
- Cost optimization recommendations
- Budget forecasting and alerts
- Advanced analytics dashboard
- Export cost reports
- Budget alerts via email/notifications

---

## 15. Success Metrics

**Feature Complete When:**
1. All three budget tiers implemented and tested
2. Token estimation accurate within 10%
3. Cost tracking persists correctly in PGlite
4. Dashboard displays real-time budget status
5. Alerts trigger at correct thresholds (80%, 100%)
6. API endpoints functional and documented
7. Zero P0/P1 bugs
8. JOURNAL.md updated with architectural decisions
9. Self-assessed against Excellence Criteria (Stability 10/10, Research Integration 10/10, Depth 10/10)
10. All verification steps passed

**Quality Bar:**
- TypeScript errors: 0
- ESLint errors: 0
- Build succeeds
- Manual testing complete
- Performance targets met (<50ms estimation, <100ms budget check, <1s dashboard load)
- No regressions in existing features

---

## 16. Timeline Estimate

**Complexity:** HARD  
**Estimated Duration:** 8-12 hours (focused development time)

**Breakdown:**
- Database schema & migrations: 1-2 hours
- Token estimation & budget logic: 2-3 hours
- Cost tracking & API endpoints: 2-3 hours
- Dashboard UI & components: 2-3 hours
- Testing & debugging: 1-2 hours
- Documentation & JOURNAL updates: 1 hour

**Note:** This is a "2-3 weeks until excellence" feature. Don't rush. Iterate until it meets the Excellence Criteria.

---

## 17. Open Questions

Before implementation, clarify:

1. **Session Management:**
   - Does a `sessions` table already exist?
   - If yes, what is its schema?
   - If no, should we create it now or mock it?

2. **User Identification:**
   - Is `user_id` from `session.user.id` or `session.user.email`?
   - Should we support anonymous users (no user_id)?

3. **LLM Integration:**
   - Where are LLM calls currently made?
   - Are there existing wrappers we should integrate with?
   - Or is this a standalone system for future integration?

4. **Dashboard Location:**
   - Where should the dashboard be accessible?
   - New route `/cost` or `/dashboard`?
   - Or integrated into existing UI (sidebar, header)?

5. **Chart Library:**
   - Should we use a chart library (Recharts, Chart.js, D3)?
   - Or build simple SVG/Canvas charts manually?
   - Recommendation: Manual SVG for minimal bundle size (6-7/10 beauty target)

**Resolution:** These questions will be addressed during implementation. Use sensible defaults and document assumptions.

---

**End of Technical Specification**
