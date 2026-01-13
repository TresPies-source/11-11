# Feature 2: Cost Guard (Three-Tier Budgeting)

**Release:** v0.3.0 Premium "Intelligence & Foundation"  
**Branch:** `feature/cost-guard`  
**Wave:** 1 (Foundation)  
**Zenflow Instance:** #2  
**Duration:** 2-3 weeks (flexible until excellence achieved)  
**Dependencies:** None

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
- `/04_System/V0.3.0_FEATURE_SEEDS.md` - Seed 2 (Cost Guard pattern)
- `/04_System/AGENT_BEST_PRACTICES.md` - Development standards
- `/04_System/WINDOWS_BASH_MEMORY.md` - Environment notes

**Dojo Genesis Ecosystem:**
- Review the Master Blueprint v3.0 in project instructions
- Understand the Dojo Agent Protocol v1.0
- Study the Cost Guard pattern from Dataiku research

**Current Codebase:**
- `/lib/` - Existing utilities and helpers
- `/components/` - UI components and patterns (check for existing dashboard patterns)
- `/app/` - Next.js app router structure
- `/db/` - Database schema and migrations (PGlite)

---

## Feature Overview

Implement comprehensive cost management with query, session, and user-level budgets to prevent runaway LLM costs. This implements Dataiku's Cost Guard pattern and establishes financial sustainability for the Dojo Genesis ecosystem.

**Research Foundation:** This feature is grounded in Dataiku's enterprise agent patterns, specifically the "Cost Guard" pattern that uses three-tier budgeting (query/session/user) to prevent runaway costs through proactive estimation and budget-aware decision making.

**Seed Reference:** See `/04_System/V0.3.0_FEATURE_SEEDS.md` - Seed 2

---

## Excellence Criteria (v0.3.0 Priorities)

**Must Be Excellent (9-10/10):**
- **Stability:** Never exceeds budget, accurate estimation
- **Research Integration:** Pure Cost Guard implementation from Dataiku patterns
- **Depth:** Complete budgeting system, user-friendly dashboard

**Must Be Very Good (7-8/10):**
- **Performance:** Estimation adds <50ms overhead
- **Parallelization:** Zero dependencies, isolated implementation

**Can Be Good (6-7/10):**
- **Beauty:** Clean dashboard, not necessarily stunning
- **Creativity:** Solid implementation, not necessarily novel

---

## Core Requirements

### 1. Three-Tier Budget System

**Tier 1: Per-Query Budget**
- **Purpose:** Prevent single expensive queries from consuming too many tokens
- **Default Limit:** 10,000 tokens per query
- **Behavior:**
  - Estimate tokens before LLM call
  - Warn user at 80% (8,000 tokens)
  - Hard stop at 100% (10,000 tokens)
  - Log warning/stop events to Harness Trace (or console if not yet implemented)

**Tier 2: Per-Session Budget**
- **Purpose:** Prevent long conversations from consuming excessive tokens
- **Default Limit:** 50,000 tokens per session
- **Behavior:**
  - Track cumulative tokens across all queries in session
  - Warn user at 80% (40,000 tokens)
  - Hard stop at 100% (50,000 tokens)
  - Suggest ending session or pruning context

**Tier 3: Per-User Budget**
- **Purpose:** Prevent individual users from exceeding monthly allocation
- **Default Limit:** 500,000 tokens per month
- **Behavior:**
  - Track cumulative tokens across all sessions (monthly)
  - Warn user at 80% (400,000 tokens)
  - Hard stop at 100% (500,000 tokens)
  - Reset on 1st of each month
  - Allow rollover of unused tokens (optional)

**Integration Notes:**
- Check existing database schema in `/db/` for session and user tables
- Follow existing PGlite patterns for queries and migrations
- Use existing authentication/session management
- Integrate with existing error handling and user notification systems

**Implementation:**
```typescript
// /lib/cost/budgets.ts

export interface BudgetConfig {
  query_limit: number;
  session_limit: number;
  user_monthly_limit: number;
  warn_threshold: number; // 0.8 = 80%
  stop_threshold: number; // 1.0 = 100%
}

export const DEFAULT_BUDGET: BudgetConfig = {
  query_limit: 10000,
  session_limit: 50000,
  user_monthly_limit: 500000,
  warn_threshold: 0.8,
  stop_threshold: 1.0,
};

export async function checkBudget(
  userId: string,
  sessionId: string,
  estimatedTokens: number
): Promise<BudgetCheckResult> {
  // Check query budget
  if (estimatedTokens > DEFAULT_BUDGET.query_limit * DEFAULT_BUDGET.stop_threshold) {
    return {
      allowed: false,
      reason: 'query_limit_exceeded',
      limit: DEFAULT_BUDGET.query_limit,
      estimated: estimatedTokens,
    };
  }

  // Check session budget (query existing PGlite schema)
  const sessionUsage = await getSessionTokenUsage(sessionId);
  if (sessionUsage + estimatedTokens > DEFAULT_BUDGET.session_limit * DEFAULT_BUDGET.stop_threshold) {
    return {
      allowed: false,
      reason: 'session_limit_exceeded',
      limit: DEFAULT_BUDGET.session_limit,
      current: sessionUsage,
      estimated: estimatedTokens,
    };
  }

  // Check user monthly budget
  const userUsage = await getUserMonthlyTokenUsage(userId);
  if (userUsage + estimatedTokens > DEFAULT_BUDGET.user_monthly_limit * DEFAULT_BUDGET.stop_threshold) {
    return {
      allowed: false,
      reason: 'user_limit_exceeded',
      limit: DEFAULT_BUDGET.user_monthly_limit,
      current: userUsage,
      estimated: estimatedTokens,
    };
  }

  // Check for warnings
  const warnings = [];
  if (estimatedTokens > DEFAULT_BUDGET.query_limit * DEFAULT_BUDGET.warn_threshold) {
    warnings.push('query_approaching_limit');
  }
  if (sessionUsage + estimatedTokens > DEFAULT_BUDGET.session_limit * DEFAULT_BUDGET.warn_threshold) {
    warnings.push('session_approaching_limit');
  }
  if (userUsage + estimatedTokens > DEFAULT_BUDGET.user_monthly_limit * DEFAULT_BUDGET.warn_threshold) {
    warnings.push('user_approaching_limit');
  }

  return {
    allowed: true,
    warnings,
  };
}
```

**Requirements:**
- [ ] All three budget tiers implemented
- [ ] Warn and stop thresholds configurable
- [ ] Budget checks run before every LLM call
- [ ] Budget exceeded events logged (Harness Trace or console)
- [ ] Follows existing database patterns in `/db/`
- [ ] Integrates with existing session management

---

### 2. Pre-Flight Token Estimation

**Purpose:** Accurately estimate token usage before making LLM calls to enable budget checks.

**Integration:**
- Check if tiktoken is already installed (`package.json`)
- Review existing LLM call patterns for token counting
- Use existing model pricing constants if available

**Estimation Algorithm:**
```typescript
// /lib/cost/estimation.ts

import { encodingForModel } from 'tiktoken'; // Install if not present

export function estimateTokens(
  systemPrompt: string,
  userMessages: Message[],
  maxCompletionTokens: number
): TokenEstimate {
  // Use tiktoken for accurate estimation
  const encoding = encodingForModel('gpt-4o');

  // Estimate prompt tokens
  const promptText = [
    systemPrompt,
    ...userMessages.map(m => `${m.role}: ${m.content}`),
  ].join('\n');
  
  const promptTokens = encoding.encode(promptText).length;

  // Estimate completion tokens (use max as upper bound)
  const completionTokens = maxCompletionTokens || 2000;

  // Total estimate
  const totalTokens = promptTokens + completionTokens;

  // Calculate cost
  const cost = calculateCost(promptTokens, completionTokens, 'gpt-4o');

  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
    cost_usd: cost,
    model: 'gpt-4o',
  };
}

export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model: string
): number {
  const pricing = MODEL_PRICING[model];
  return (
    (promptTokens * pricing.input_price_per_1m) / 1_000_000 +
    (completionTokens * pricing.output_price_per_1m) / 1_000_000
  );
}

const MODEL_PRICING = {
  'gpt-4o': {
    input_price_per_1m: 2.50,
    output_price_per_1m: 10.00,
  },
  'gpt-4o-mini': {
    input_price_per_1m: 0.15,
    output_price_per_1m: 0.60,
  },
  // Add other models as needed
};
```

**Accuracy Target:** Within 10% of actual token usage

**Requirements:**
- [ ] Use tiktoken for accurate token counting
- [ ] Estimate both prompt and completion tokens
- [ ] Calculate cost in USD
- [ ] Support multiple models (GPT-4o, GPT-4o-mini, others used in codebase)
- [ ] Estimation completes in <50ms
- [ ] Install tiktoken if not already present

---

### 3. Cost Tracking & Logging

**Purpose:** Track actual token usage and costs for all LLM calls.

**Integration:**
- Review existing database schema in `/db/` for appropriate tables
- Create migration if needed for `cost_records` table
- Follow existing database query patterns
- Integrate with existing logging system

**Implementation:**
```typescript
// /lib/cost/tracking.ts

export interface CostRecord {
  id: string;
  user_id: string;
  session_id: string;
  query_id: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  operation_type: 'routing' | 'agent_execution' | 'search' | 'other';
  timestamp: Date;
}

export async function trackCost(record: Omit<CostRecord, 'id' | 'timestamp'>): Promise<void> {
  // Insert into PGlite (check existing schema in /db/)
  await db.insert(cost_records).values({
    ...record,
    id: generateId(), // Use existing ID generation pattern
    timestamp: new Date(),
  });

  // Update session totals (check if sessions table has these columns)
  await db
    .update(sessions)
    .set({
      total_tokens: sql`total_tokens + ${record.total_tokens}`,
      total_cost_usd: sql`total_cost_usd + ${record.cost_usd}`,
    })
    .where(eq(sessions.id, record.session_id));

  // Update user monthly totals (create table if needed)
  await db
    .update(user_monthly_usage)
    .set({
      total_tokens: sql`total_tokens + ${record.total_tokens}`,
      total_cost_usd: sql`total_cost_usd + ${record.cost_usd}`,
    })
    .where(
      and(
        eq(user_monthly_usage.user_id, record.user_id),
        eq(user_monthly_usage.month, getCurrentMonth())
      )
    );

  // Log to Harness Trace if available, otherwise console
  await logHarnessEvent({
    event_type: 'COST_TRACKED',
    metadata: {
      tokens: record.total_tokens,
      cost: record.cost_usd,
      operation: record.operation_type,
    },
  }).catch(() => console.log('[COST_TRACKED]', record));
}
```

**Requirements:**
- [ ] Track all LLM calls (routing, agent execution, search, etc.)
- [ ] Store in PGlite with user_id, session_id, query_id
- [ ] Update session and user monthly totals
- [ ] Log to Harness Trace (or console if not yet implemented)
- [ ] Create database migration if needed
- [ ] Follow existing database patterns

---

### 4. Cost-Aware Mode Selection

**Purpose:** Automatically switch to cheaper modes or models when budget is low.

**Integration:**
- Review existing mode selection logic (if any)
- Understand existing Dojo modes (Mirror, Scout, Gardener, Implementation)
- Integrate with existing session and user management

**Mode Selection Logic:**
```typescript
// /lib/cost/mode-selection.ts

export async function selectMode(
  userId: string,
  sessionId: string,
  requestedMode: DojoMode
): Promise<ModeSelection> {
  const sessionUsage = await getSessionTokenUsage(sessionId);
  const sessionLimit = DEFAULT_BUDGET.session_limit;
  const sessionBudgetRemaining = sessionLimit - sessionUsage;

  const userUsage = await getUserMonthlyTokenUsage(userId);
  const userLimit = DEFAULT_BUDGET.user_monthly_limit;
  const userBudgetRemaining = userLimit - userUsage;

  // If budget is low, prefer cheaper modes
  if (sessionBudgetRemaining < sessionLimit * 0.2 || userBudgetRemaining < userLimit * 0.2) {
    // Budget <20%: Force Mirror mode (cheapest)
    return {
      mode: 'Mirror',
      model: 'gpt-4o-mini',
      reason: 'Budget low, using cheapest mode',
      downgraded: requestedMode !== 'Mirror',
    };
  } else if (sessionBudgetRemaining < sessionLimit * 0.4 || userBudgetRemaining < userLimit * 0.4) {
    // Budget 20-40%: Prefer Mirror or Scout, use mini model
    const allowedModes = ['Mirror', 'Scout'];
    const selectedMode = allowedModes.includes(requestedMode) ? requestedMode : 'Mirror';
    return {
      mode: selectedMode,
      model: 'gpt-4o-mini',
      reason: 'Budget moderate, using cheaper model',
      downgraded: requestedMode !== selectedMode || true, // Always downgrade model
    };
  } else {
    // Budget >40%: Allow requested mode and model
    return {
      mode: requestedMode,
      model: 'gpt-4o',
      reason: 'Budget sufficient',
      downgraded: false,
    };
  }
}
```

**Requirements:**
- [ ] Check budget before mode selection
- [ ] Downgrade to cheaper modes when budget <40%
- [ ] Force Mirror mode when budget <20%
- [ ] Use GPT-4o-mini when budget <40%
- [ ] Notify user when mode/model downgraded
- [ ] Integrate with existing mode selection logic

---

### 5. Budget Dashboard UI

**Purpose:** Provide real-time visibility into token usage and costs.

**Integration:**
- Review existing UI components in `/components/`
- Follow existing design system (Material 3, Tailwind CSS)
- Use existing chart library if available
- Match existing dashboard patterns

**Dashboard Components:**

**A) Budget Overview Card**
- Query budget: X / 10,000 tokens (progress bar)
- Session budget: X / 50,000 tokens (progress bar)
- User monthly budget: X / 500,000 tokens (progress bar)
- Total cost this month: $X.XX

**B) Cost Breakdown Table**
- Last 10 queries with: timestamp, operation, tokens, cost
- Filter by: operation type, date range
- Sort by: tokens, cost, timestamp

**C) Cost Trends Chart**
- Line chart showing daily token usage over past 30 days
- Stacked area chart showing cost by operation type

**D) Budget Alerts**
- Warning banner when approaching limits (80%)
- Error banner when limit exceeded (100%)
- Suggested actions (end session, prune context, upgrade plan)

**Implementation:**
```typescript
// /components/CostDashboard.tsx

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // Use existing components
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export function CostDashboard() {
  const { data: budgetStatus } = useBudgetStatus(); // Create hook
  const { data: costRecords } = useCostRecords({ limit: 10 });
  const { data: costTrends } = useCostTrends({ days: 30 });

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BudgetProgress
            label="Query Budget"
            current={budgetStatus.query_usage}
            limit={budgetStatus.query_limit}
            warnThreshold={0.8}
          />
          <BudgetProgress
            label="Session Budget"
            current={budgetStatus.session_usage}
            limit={budgetStatus.session_limit}
            warnThreshold={0.8}
          />
          <BudgetProgress
            label="Monthly Budget"
            current={budgetStatus.user_monthly_usage}
            limit={budgetStatus.user_monthly_limit}
            warnThreshold={0.8}
          />
          <div className="text-2xl font-bold">
            Total: ${budgetStatus.total_cost_this_month.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <CostRecordsTable records={costRecords} />
        </CardContent>
      </Card>

      {/* Cost Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Trends (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <CostTrendsChart data={costTrends} />
        </CardContent>
      </Card>

      {/* Alerts */}
      {budgetStatus.warnings.length > 0 && (
        <Alert variant="warning">
          <AlertTitle>Budget Warning</AlertTitle>
          <AlertDescription>
            {budgetStatus.warnings.map(w => (
              <div key={w}>{formatWarning(w)}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

**Requirements:**
- [ ] Real-time budget status (updates every query)
- [ ] Progress bars with color coding (green <60%, yellow 60-80%, red >80%)
- [ ] Cost breakdown table with filtering and sorting
- [ ] Cost trends chart (line or area chart)
- [ ] Budget alerts with suggested actions
- [ ] Follows existing UI component patterns
- [ ] Responsive design (mobile-friendly)
- [ ] Accessible (WCAG AA)

---

## API Specification

### POST /api/cost/estimate

**Purpose:** Estimate token usage and cost before making an LLM call.

**Integration:**
- Follow existing API route patterns in `/app/api/`
- Use existing authentication middleware
- Follow existing error response format

**Request:**
```json
{
  "system_prompt": "You are Dojo...",
  "user_messages": [
    {"role": "user", "content": "Help me plan my budget"}
  ],
  "max_completion_tokens": 2000,
  "model": "gpt-4o"
}
```

**Response:**
```json
{
  "prompt_tokens": 450,
  "completion_tokens": 2000,
  "total_tokens": 2450,
  "cost_usd": 0.02125,
  "model": "gpt-4o"
}
```

---

### GET /api/cost/budget

**Purpose:** Get current budget status for user and session.

**Response:**
```json
{
  "query_limit": 10000,
  "session_limit": 50000,
  "user_monthly_limit": 500000,
  "query_usage": 0,
  "session_usage": 12500,
  "user_monthly_usage": 125000,
  "warnings": ["session_approaching_limit"],
  "total_cost_this_month": 12.50
}
```

---

### POST /api/cost/track

**Purpose:** Log actual token usage and cost after an LLM call.

**Request:**
```json
{
  "user_id": "user_123",
  "session_id": "sess_abc",
  "query_id": "query_xyz",
  "model": "gpt-4o",
  "prompt_tokens": 450,
  "completion_tokens": 1800,
  "total_tokens": 2250,
  "cost_usd": 0.019125,
  "operation_type": "agent_execution"
}
```

**Response:**
```json
{
  "success": true,
  "session_total_tokens": 14750,
  "user_monthly_total_tokens": 127250
}
```

---

## Testing Requirements

### Unit Tests
- [ ] Budget checks work correctly for all three tiers
- [ ] Token estimation is within 10% of actual usage
- [ ] Cost calculation is accurate for all models
- [ ] Mode selection downgrades correctly when budget low
- [ ] Follow existing test patterns in `/tests/` or `__tests__/`

### Integration Tests
- [ ] End-to-end budget check before LLM call
- [ ] Cost tracking updates session and user totals
- [ ] Budget dashboard displays real-time data
- [ ] Budget exceeded prevents LLM calls
- [ ] Use existing test infrastructure

### Performance Tests
- [ ] Token estimation completes in <50ms
- [ ] Budget check completes in <100ms
- [ ] Dashboard loads in <1s

---

## Documentation Requirements

### JOURNAL.md Updates
Document the following architectural decisions:
- [ ] Why three-tier budgeting (query/session/user)
- [ ] Why tiktoken for token estimation (accuracy)
- [ ] Why 80% warn threshold and 100% stop threshold
- [ ] How cost tracking integrates with PGlite
- [ ] How mode selection adapts to budget constraints
- [ ] Integration points with Supervisor Router (Feature 1)
- [ ] Self-assessment against Excellence Criteria (score each dimension)

### Code Documentation
- [ ] JSDoc comments for all public functions
- [ ] README in `/lib/cost/` explaining the Cost Guard system
- [ ] Examples of budget configuration and customization
- [ ] Troubleshooting guide for budget issues

### User Documentation
- [ ] How to interpret budget dashboard
- [ ] What happens when budget is exceeded
- [ ] How to upgrade budget limits (future feature)

---

## Acceptance Criteria

### Stability (10/10)
- [ ] Never exceeds budget limits (hard stop at 100%)
- [ ] Token estimation within 10% accuracy
- [ ] Cost tracking never fails
- [ ] All edge cases handled (zero budget, negative usage, etc.)
- [ ] No regressions in existing features

### Research Integration (10/10)
- [ ] Implements Dataiku's Cost Guard pattern exactly
- [ ] Three-tier budgeting (query/session/user)
- [ ] Proactive cost management (not reactive)
- [ ] Documentation cites Dataiku research
- [ ] Seed 2 patterns are followed

### Depth (10/10)
- [ ] Complete budgeting system (all three tiers)
- [ ] Accurate estimation and tracking
- [ ] User-friendly dashboard
- [ ] Comprehensive documentation (architecture, API, usage, JOURNAL updates)
- [ ] Code is clean, readable, and follows existing patterns

### Performance (9/10)
- [ ] Estimation adds <50ms overhead
- [ ] Budget check adds <100ms overhead
- [ ] Dashboard loads in <1s
- [ ] No performance regressions

### Parallelization (10/10)
- [ ] Zero dependencies on other features
- [ ] Can be developed on isolated branch
- [ ] Can be merged without breaking other features
- [ ] Clean integration points for Supervisor Router (Feature 1)

---

## Integration with Feature 1 (Supervisor Router)

Once both features are merged, ensure:
- [ ] Supervisor Router calls Cost Guard's budget check before routing
- [ ] Routing costs are tracked via Cost Guard's tracking system
- [ ] Budget exceeded prevents routing (falls back to Dojo)
- [ ] Routing costs appear in Cost Guard dashboard

**Note:** Feature 1 will implement basic cost tracking; refactor to use Cost Guard after merge.

---

## Deferred to Future Releases

- Custom budget limits per user
- Budget rollover and sharing
- Cost optimization recommendations
- Budget forecasting and alerts
- Budget analytics dashboard (trends, predictions)

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

1. **Read Seed First:** Review Seed 2 in `/04_System/V0.3.0_FEATURE_SEEDS.md` before starting.

2. **Review Existing Codebase:** Before writing any code, review:
   - `/lib/` for existing utilities and patterns
   - `/db/` for database schema and PGlite usage
   - `/app/api/` for API route patterns
   - `/components/` for UI component patterns (especially dashboards)

3. **Follow Existing Patterns:** Match the code style, error handling, and architecture patterns already in the repo.

4. **Generate PRD + Tech Spec in Sandbox:** Create detailed PRD and tech spec in your sandbox before coding. Do NOT commit these to the repo.

5. **Commit Only Implementation:** Commit code, tests, and documentation updates. Do NOT commit PRD/spec.

6. **Update JOURNAL.md:** Log architectural decisions, implementation notes, and self-assessment against Excellence Criteria.

7. **Update BUGS.md:** Log any bugs discovered during development. Fix all P0 and P1 bugs before finishing your testing. After completing your testing, complete a premium micro sprint solving any P2/P3 bugs for the user.

8. **Self-Assess:** Use the Excellence Rubric to score your implementation before marking complete.

9. **Windows Bash Compatible:** Use `;` instead of `&&` for command chaining.

10. **Integration Readiness:** Design with Feature 1 (Supervisor Router) integration in mind, but don't block on it.

11. **Database Migrations:** Create PGlite migrations if new tables are needed (cost_records, user_monthly_usage).

---

**Author:** Manus AI (Dojo)  
**Status:** v0.3.0 Premium Feature Prompt (Improved)  
**Date:** January 12, 2026
