# Technical Specification: v0.3.6 Hierarchical Context Management

**Date:** January 13, 2026  
**Complexity:** Hard  
**Risk Level:** Medium  
**Dependencies:** Cost Guard (v0.3.2), Harness Trace, LLM Client

---

## Executive Summary

Implement a 4-tier hierarchical context management system based on Dataiku's Context Iceberg research to reduce token usage by 30-50% while preserving critical context. This system will intelligently manage what context is sent with each LLM call based on budget availability and context importance.

---

## Difficulty Assessment: HARD

**Rationale:**
- **Architectural Complexity:** Requires deep integration with 3 existing systems (Cost Guard, Harness Trace, LLM Client)
- **High-Risk Changes:** Affects all LLM calls across the entire application
- **Algorithm Design:** Complex pruning logic with budget-aware decision making
- **Edge Cases:** Must handle 0-budget scenarios, context overflow, concurrent requests
- **Testing Complexity:** Requires comprehensive unit, integration, and performance tests
- **State Management:** Must manage context state across multiple sessions and agents

---

## Technical Context

### Language & Framework
- **Language:** TypeScript 5.7.2
- **Framework:** Next.js 14 (App Router)
- **Database:** PGlite (local-first PostgreSQL)
- **LLM Client:** OpenAI SDK (multi-provider support)
- **State Management:** React Context + PGlite

### Dependencies
- **Cost Guard:** Budget checking and tracking (`lib/cost/budgets.ts`)
- **Harness Trace:** Event logging (`lib/harness/trace.ts`)
- **LLM Client:** Multi-provider LLM calls (`lib/llm/client.ts`)
- **Tiktoken:** Token counting (`tiktoken` npm package)

### Existing Patterns to Follow
1. **Error Handling:** Use custom error classes (see `lib/llm/types.ts`)
2. **Module Documentation:** JSDoc comments with examples (see `lib/cost/budgets.ts`)
3. **Type Safety:** Full TypeScript typing with Zod validation where needed
4. **Testing:** Comprehensive unit tests with edge cases (see `lib/cost/budgets.test.ts`)
5. **Logging:** Harness Trace integration for all operations (see `lib/agents/supervisor.ts`)

---

## Implementation Approach

### Phase 1: Core Context Types & Schema (Foundation)

**Goal:** Define type system and database schema for context management.

**Files to Create:**
- `lib/context/types.ts`
- `lib/pglite/migrations/007_add_context_tracking.ts`

**Type Definitions:**
```typescript
// lib/context/types.ts

export type ContextTier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

export interface ContextTierConfig {
  tier: ContextTier;
  name: string;
  priority: number;
  alwaysInclude: boolean;
  description: string;
}

export interface TierContent {
  tier: ContextTier;
  content: string;
  tokenCount: number;
  source: string;
}

export interface ContextBuildOptions {
  agent: string;
  messages: any[];
  sessionId?: string;
  userId: string;
  budgetPercent?: number;
  forceIncludeTiers?: ContextTier[];
}

export interface ContextResult {
  messages: any[];
  tiers: TierContent[];
  totalTokens: number;
  tierBreakdown: Record<ContextTier, number>;
  pruningStrategy: PruningStrategy;
  budgetPercent: number;
}

export interface PruningStrategy {
  budgetRange: string;
  tier1Messages: number;
  tier2Items: number | 'all';
  tier3Mode: 'full' | 'summary' | 'none';
  tier4Messages: number;
}

export interface TierBreakdown {
  tier1: { tokens: number; items: number };
  tier2: { tokens: number; items: number };
  tier3: { tokens: number; items: number };
  tier4: { tokens: number; items: number };
  total: number;
}

export interface ContextStatus {
  sessionId: string;
  currentContext: ContextResult;
  tierBreakdown: TierBreakdown;
  budgetPercent: number;
  lastUpdated: string;
}
```

**Database Migration:**
```sql
-- lib/pglite/migrations/007_add_context_tracking.ts

CREATE TABLE IF NOT EXISTS context_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tier_breakdown JSONB NOT NULL,
  total_tokens INTEGER NOT NULL,
  budget_percent NUMERIC NOT NULL,
  pruning_strategy JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_context_snapshots_session ON context_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_context_snapshots_user ON context_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_context_snapshots_created ON context_snapshots(created_at DESC);
```

---

### Phase 2: Context Builder Service (Core Logic)

**Goal:** Implement the main context building engine with 4-tier logic.

**Files to Create:**
- `lib/context/builder.ts`
- `lib/context/tiers.ts`
- `lib/context/tokens.ts`

**Key Functions:**

```typescript
// lib/context/builder.ts

import { encoding_for_model } from 'tiktoken';
import { getBudgetStatus } from '../cost/budgets';
import { getPruningStrategy } from './pruning';
import { buildTier1, buildTier2, buildTier3, buildTier4 } from './tiers';
import { countTokens } from './tokens';

export async function buildContext(
  options: ContextBuildOptions
): Promise<ContextResult> {
  // 1. Get budget status
  const budgetPercent = options.budgetPercent ?? 
    await calculateBudgetPercent(options.userId, options.sessionId);
  
  // 2. Determine pruning strategy
  const strategy = getPruningStrategy(budgetPercent);
  
  // 3. Build each tier
  const tier1 = buildTier1(options);
  const tier2 = await buildTier2(options, strategy);
  const tier3 = await buildTier3(options, strategy);
  const tier4 = buildTier4(options, strategy);
  
  // 4. Combine tiers
  const allTiers = [tier1, tier2, tier3, tier4].filter(t => t.tokenCount > 0);
  const totalTokens = allTiers.reduce((sum, t) => sum + t.tokenCount, 0);
  
  // 5. Convert to messages format
  const messages = convertTiersToMessages(allTiers, options.messages);
  
  // 6. Calculate tier breakdown
  const tierBreakdown = calculateTierBreakdown(allTiers);
  
  return {
    messages,
    tiers: allTiers,
    totalTokens,
    tierBreakdown,
    pruningStrategy: strategy,
    budgetPercent,
  };
}

// Helper to calculate budget percentage
async function calculateBudgetPercent(
  userId: string, 
  sessionId?: string
): Promise<number> {
  const sessionUsage = sessionId ? await getSessionTokenUsage(sessionId) : 0;
  const userUsage = await getUserMonthlyTokenUsage(userId);
  
  const sessionLimit = DEFAULT_BUDGET.session_limit;
  const userLimit = DEFAULT_BUDGET.user_monthly_limit;
  
  const sessionPercent = sessionId ? (sessionUsage / sessionLimit) * 100 : 0;
  const userPercent = (userUsage / userLimit) * 100;
  
  // Return the most restrictive (highest) percentage
  return Math.max(sessionPercent, userPercent);
}
```

**Tier Implementation:**
```typescript
// lib/context/tiers.ts

export function buildTier1(options: ContextBuildOptions): TierContent {
  // Tier 1: Always on - Core system prompt + current query
  const systemPrompt = getSystemPromptForAgent(options.agent);
  const currentQuery = options.messages[options.messages.length - 1]?.content || '';
  
  const content = `${systemPrompt}\n\nCurrent Query: ${currentQuery}`;
  const tokenCount = countTokens(content);
  
  return {
    tier: 'tier1',
    content,
    tokenCount,
    source: 'system_prompt+query',
  };
}

export async function buildTier2(
  options: ContextBuildOptions,
  strategy: PruningStrategy
): Promise<TierContent> {
  // Tier 2: On demand - Active seeds + relevant project memory
  let seeds: string[] = [];
  
  if (strategy.tier2Items === 'all') {
    seeds = await getAllActiveSeeds(options.userId);
  } else if (typeof strategy.tier2Items === 'number') {
    seeds = await getTopNSeeds(options.userId, strategy.tier2Items);
  }
  
  const content = seeds.join('\n\n---\n\n');
  const tokenCount = countTokens(content);
  
  return {
    tier: 'tier2',
    content,
    tokenCount,
    source: 'seeds',
  };
}

export async function buildTier3(
  options: ContextBuildOptions,
  strategy: PruningStrategy
): Promise<TierContent> {
  // Tier 3: When referenced - Full text or summaries of specific files
  if (strategy.tier3Mode === 'none') {
    return { tier: 'tier3', content: '', tokenCount: 0, source: 'files' };
  }
  
  const referencedFiles = extractFileReferences(options.messages);
  
  if (strategy.tier3Mode === 'summary') {
    const summaries = await summarizeFiles(referencedFiles);
    const content = summaries.join('\n\n');
    return {
      tier: 'tier3',
      content,
      tokenCount: countTokens(content),
      source: 'file_summaries',
    };
  }
  
  // Full mode
  const fileContents = await loadFiles(referencedFiles);
  const content = fileContents.join('\n\n---\n\n');
  return {
    tier: 'tier3',
    content,
    tokenCount: countTokens(content),
    source: 'files',
  };
}

export function buildTier4(
  options: ContextBuildOptions,
  strategy: PruningStrategy
): TierContent {
  // Tier 4: Pruned aggressively - Conversation history
  const maxMessages = strategy.tier4Messages;
  
  if (maxMessages === 0) {
    return { tier: 'tier4', content: '', tokenCount: 0, source: 'history' };
  }
  
  const recentMessages = options.messages.slice(-maxMessages - 1, -1);
  const content = recentMessages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n\n');
  
  return {
    tier: 'tier4',
    content,
    tokenCount: countTokens(content),
    source: 'history',
  };
}
```

**Token Counting:**
```typescript
// lib/context/tokens.ts

import { encoding_for_model } from 'tiktoken';

let encoder: any = null;

export function countTokens(text: string, model: string = 'gpt-4o'): number {
  if (!encoder) {
    encoder = encoding_for_model(model);
  }
  
  try {
    const tokens = encoder.encode(text);
    return tokens.length;
  } catch (error) {
    // Fallback: estimate ~4 chars per token
    return Math.ceil(text.length / 4);
  }
}

export function countMessageTokens(messages: any[], model: string = 'gpt-4o'): number {
  const text = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
  return countTokens(text, model);
}
```

---

### Phase 3: Budget-Aware Pruning Logic

**Goal:** Implement pruning strategies based on budget levels.

**Files to Create:**
- `lib/context/pruning.ts`

**Pruning Strategy Implementation:**
```typescript
// lib/context/pruning.ts

export function getPruningStrategy(budgetPercent: number): PruningStrategy {
  if (budgetPercent < 40) {
    // Critical: Minimal context
    return {
      budgetRange: '<40%',
      tier1Messages: 1,
      tier2Items: 1,
      tier3Mode: 'none',
      tier4Messages: 0,
    };
  } else if (budgetPercent < 60) {
    // Warning: Reduced context
    return {
      budgetRange: '40-60%',
      tier1Messages: 1,
      tier2Items: 3,
      tier3Mode: 'summary',
      tier4Messages: 2,
    };
  } else if (budgetPercent < 80) {
    // Caution: Moderate pruning
    return {
      budgetRange: '60-80%',
      tier1Messages: 1,
      tier2Items: 'all',
      tier3Mode: 'full',
      tier4Messages: 5,
    };
  } else {
    // Healthy: All tiers included
    return {
      budgetRange: '>80%',
      tier1Messages: 1,
      tier2Items: 'all',
      tier3Mode: 'full',
      tier4Messages: 10,
    };
  }
}

export function applyPruning(
  context: ContextResult,
  strategy: PruningStrategy
): ContextResult {
  // Apply pruning to existing context
  const prunedTiers = context.tiers.map(tier => {
    switch (tier.tier) {
      case 'tier1':
        return tier; // Never prune tier 1
      case 'tier2':
        return pruneTier2(tier, strategy);
      case 'tier3':
        return pruneTier3(tier, strategy);
      case 'tier4':
        return pruneTier4(tier, strategy);
      default:
        return tier;
    }
  });
  
  const totalTokens = prunedTiers.reduce((sum, t) => sum + t.tokenCount, 0);
  
  return {
    ...context,
    tiers: prunedTiers,
    totalTokens,
    pruningStrategy: strategy,
  };
}
```

---

### Phase 4: LLM Client Integration

**Goal:** Integrate context builder into existing LLM client.

**Files to Modify:**
- `lib/llm/client.ts`

**Integration Approach:**
```typescript
// Modify lib/llm/client.ts

import { buildContext } from '../context/builder';
import { logEvent, startSpan, endSpan } from '../harness/trace';

export class LLMClient {
  // ... existing code ...

  async callWithFallback(
    agentName: string,
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options: LLMCallOptions & { userId?: string; sessionId?: string } = {}
  ): Promise<LLMResponse> {
    const { userId, sessionId, ...llmOptions } = options;
    
    // Build context if userId provided
    let contextualMessages = messages;
    let contextMetadata: any = null;
    
    if (userId) {
      const spanId = startSpan('CONTEXT_BUILD', {
        agent: agentName,
        messageCount: messages.length,
      });
      
      try {
        const context = await buildContext({
          agent: agentName,
          messages,
          userId,
          sessionId,
        });
        
        contextualMessages = context.messages;
        contextMetadata = {
          tierBreakdown: context.tierBreakdown,
          totalTokens: context.totalTokens,
          pruningStrategy: context.pruningStrategy,
          budgetPercent: context.budgetPercent,
        };
        
        endSpan(spanId, {
          contextBuilt: true,
          totalTokens: context.totalTokens,
          tiersIncluded: context.tiers.length,
        }, {
          duration_ms: Date.now() - startTime,
        });
        
        // Log context usage to Harness Trace
        logEvent('CONTEXT_USAGE', {
          agent: agentName,
          sessionId,
        }, contextMetadata, {});
        
      } catch (error) {
        // Fall back to original messages on error
        console.warn('[LLM] Context building failed, using original messages:', error);
        endSpan(spanId, { contextBuilt: false, error: true }, {});
      }
    }
    
    // Continue with existing callWithFallback logic
    const primaryModel = getModelForAgent(agentName);
    const fallbackModel = getFallbackModel();

    try {
      return await this.call(primaryModel, contextualMessages, llmOptions);
    } catch (error) {
      // ... existing fallback logic ...
    }
  }
}
```

---

### Phase 5: Context Status API

**Goal:** Create API endpoints for context status monitoring.

**Files to Create:**
- `lib/context/status.ts`
- `app/api/context/status/route.ts`

**Status Service:**
```typescript
// lib/context/status.ts

export async function getContextStatus(sessionId: string): Promise<ContextStatus> {
  const snapshot = await getLatestContextSnapshot(sessionId);
  
  if (!snapshot) {
    throw new Error(`No context snapshot found for session ${sessionId}`);
  }
  
  return {
    sessionId,
    currentContext: snapshot.context,
    tierBreakdown: snapshot.tier_breakdown,
    budgetPercent: snapshot.budget_percent,
    lastUpdated: snapshot.created_at,
  };
}

export function calculateTierBreakdown(tiers: TierContent[]): TierBreakdown {
  const breakdown: TierBreakdown = {
    tier1: { tokens: 0, items: 0 },
    tier2: { tokens: 0, items: 0 },
    tier3: { tokens: 0, items: 0 },
    tier4: { tokens: 0, items: 0 },
    total: 0,
  };
  
  for (const tier of tiers) {
    const key = tier.tier as keyof typeof breakdown;
    if (key !== 'total') {
      breakdown[key].tokens = tier.tokenCount;
      breakdown[key].items = 1;
    }
  }
  
  breakdown.total = tiers.reduce((sum, t) => sum + t.tokenCount, 0);
  
  return breakdown;
}
```

**API Route:**
```typescript
// app/api/context/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getContextStatus } from '@/lib/context/status';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }
    
    const status = await getContextStatus(sessionId);
    return NextResponse.json(status);
    
  } catch (error) {
    console.error('[API] Context status error:', error);
    return NextResponse.json(
      { error: 'Failed to get context status' },
      { status: 500 }
    );
  }
}
```

---

### Phase 6: Context Dashboard UI

**Goal:** Build React component for visualizing context status.

**Files to Create:**
- `components/context/ContextDashboard.tsx`
- `components/context/TierBreakdownChart.tsx`
- `hooks/useContextStatus.ts`

**Dashboard Component:**
```typescript
// components/context/ContextDashboard.tsx

import { motion } from 'framer-motion';
import { TierBreakdownChart } from './TierBreakdownChart';
import { useContextStatus } from '@/hooks/useContextStatus';

export function ContextDashboard({ sessionId }: { sessionId: string }) {
  const { status, loading, error, refresh } = useContextStatus(sessionId);
  
  if (loading) return <div>Loading context status...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!status) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-card rounded-lg shadow-lg"
    >
      <h2 className="text-2xl font-bold mb-4">Context Status</h2>
      
      {/* Budget indicator */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span>Budget Used</span>
          <span className="font-mono">{status.budgetPercent.toFixed(1)}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              status.budgetPercent < 60 ? 'bg-green-500' :
              status.budgetPercent < 80 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${status.budgetPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
      
      {/* Tier breakdown */}
      <TierBreakdownChart breakdown={status.tierBreakdown} />
      
      {/* Pruning strategy */}
      <div className="mt-6 p-4 bg-muted rounded">
        <h3 className="font-semibold mb-2">Current Strategy</h3>
        <div className="text-sm space-y-1">
          <div>Budget Range: {status.currentContext.pruningStrategy.budgetRange}</div>
          <div>Tier 2 Items: {status.currentContext.pruningStrategy.tier2Items}</div>
          <div>Tier 3 Mode: {status.currentContext.pruningStrategy.tier3Mode}</div>
          <div>Tier 4 Messages: {status.currentContext.pruningStrategy.tier4Messages}</div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={refresh}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Refresh
        </button>
      </div>
    </motion.div>
  );
}
```

---

## Source Code Structure Changes

### New Directories
```
lib/context/
├── builder.ts        # Core context building logic
├── pruning.ts        # Budget-aware pruning strategies
├── status.ts         # Context status queries
├── tiers.ts          # Tier-specific builders
├── tokens.ts         # Token counting utilities
└── types.ts          # TypeScript types

components/context/
├── ContextDashboard.tsx       # Main dashboard UI
└── TierBreakdownChart.tsx     # Visual tier breakdown

hooks/
└── useContextStatus.ts        # React hook for context status

app/api/context/
└── status/
    └── route.ts               # Context status API endpoint
```

### Modified Files
```
lib/llm/client.ts              # Integrate context builder
lib/pglite/migrations/         # Add 007_add_context_tracking.ts
```

---

## Data Model / API / Interface Changes

### Database Schema
- **New Table:** `context_snapshots` - Stores context snapshots per session

### API Endpoints
- **GET /api/context/status?sessionId=xxx** - Get current context status

### LLM Client Interface
- **Modified:** `callWithFallback` now accepts `userId` and `sessionId` options
- **Behavior:** Automatically builds hierarchical context when `userId` provided

---

## Verification Approach

### Unit Tests

**File:** `lib/context/builder.test.ts`
```typescript
describe('Context Builder', () => {
  it('builds tier 1 context (always on)', () => {
    // Test core prompt + current query
  });
  
  it('includes all tiers when budget >80%', () => {
    // Test full context building
  });
  
  it('prunes tier 4 when budget 60-80%', () => {
    // Test conversation history pruning
  });
  
  it('drops tier 3 when budget <40%', () => {
    // Test aggressive pruning
  });
  
  it('never loses tier 1 context', () => {
    // Test critical context preservation
  });
  
  it('handles missing userId gracefully', () => {
    // Test fallback behavior
  });
  
  it('counts tokens accurately', () => {
    // Test token counting
  });
});
```

**File:** `lib/context/pruning.test.ts`
```typescript
describe('Pruning Logic', () => {
  it('selects correct strategy for each budget range', () => {
    // Test strategy selection
  });
  
  it('applies pruning correctly to each tier', () => {
    // Test pruning application
  });
  
  it('preserves tier 1 always', () => {
    // Test tier 1 protection
  });
});
```

### Integration Tests

**File:** `__tests__/context/integration.test.ts`
```typescript
describe('Context Integration', () => {
  it('integrates with Cost Guard for budget checks', async () => {
    // Test budget integration
  });
  
  it('logs context changes to Harness Trace', async () => {
    // Test trace logging
  });
  
  it('reduces token usage by 30-50%', async () => {
    // Test token reduction
  });
  
  it('works with all agents', async () => {
    // Test agent compatibility
  });
  
  it('handles LLM client fallback', async () => {
    // Test error recovery
  });
});
```

### Performance Tests

**File:** `__tests__/context/performance.test.ts`
```typescript
describe('Context Performance', () => {
  it('builds context in <100ms', async () => {
    // Test context building speed
  });
  
  it('counts tokens in <50ms', async () => {
    // Test token counting speed
  });
  
  it('reduces token usage by target amount', async () => {
    // Measure token savings: 30-50% reduction
  });
});
```

### Manual Verification
1. Run dev server: `npm run dev`
2. Open Context Dashboard: `http://localhost:3000/context-dashboard`
3. Verify tier breakdown visualization
4. Make LLM calls and observe context changes
5. Test budget-aware pruning by simulating different budget levels
6. Verify Harness Trace logging

### Lint & Build Commands
```bash
npm run lint          # ESLint check (must pass with 0 errors)
npm run type-check    # TypeScript check (must pass with 0 errors)
npm run build         # Production build (must succeed)
```

---

## Key Risks & Mitigation

### Risk 1: Token Counting Accuracy
**Impact:** Incorrect token counts could cause budget overruns  
**Mitigation:** Use official tiktoken library, add fallback estimation, test extensively

### Risk 2: Context Loss
**Impact:** Critical information pruned too aggressively  
**Mitigation:** Tier 1 never pruned, comprehensive edge case testing

### Risk 3: Performance Degradation
**Impact:** Context building adds latency to every LLM call  
**Mitigation:** Optimize token counting, cache results, measure performance

### Risk 4: Breaking Existing Agents
**Impact:** Changes to LLM client could break existing functionality  
**Mitigation:** Make context building opt-in via userId parameter, comprehensive regression tests

### Risk 5: Database Performance
**Impact:** Context snapshot inserts could slow down LLM calls  
**Mitigation:** Make snapshot insertion async, add database indexes

---

## Success Criteria

### Functional
- [ ] Context builder successfully builds 4-tier context
- [ ] Budget-aware pruning works correctly for all budget levels
- [ ] Tier 1 never pruned (critical context preserved)
- [ ] LLM client integration works without breaking existing calls
- [ ] Context dashboard displays accurate real-time data

### Performance
- [ ] Context building: <100ms
- [ ] Token counting: <50ms
- [ ] Token reduction: 30-50% validated
- [ ] No performance regression in existing LLM calls

### Quality
- [ ] Type check: 0 errors
- [ ] Lint: 0 errors, 0 warnings
- [ ] Build: Success
- [ ] Unit tests: 100% pass rate (20+ tests)
- [ ] Integration tests: 100% pass rate (10+ tests)
- [ ] Performance tests: All targets met

### Integration
- [ ] Cost Guard integration working
- [ ] Harness Trace integration working
- [ ] All agents benefit automatically
- [ ] Zero regressions in existing features

---

## Deferred to Future Releases

**v0.4.0+:**
- User-customizable tier rules
- A/B testing of pruning strategies
- Context caching (beyond LLM provider caching)
- Predictive context loading
- Real-time context optimization
- Machine learning-based relevance scoring

---

## Excellence Criteria Self-Assessment

### Must Be Excellent (10/10)

**Stability:**
- Zero context loss (Tier 1 always preserved)
- Graceful degradation (never hard failures)
- Comprehensive error handling
- All edge cases covered

**Research Integration:**
- Pure Dataiku Context Iceberg pattern
- 4-tier system as specified
- Budget-aware pruning as specified

**Depth:**
- Complete implementation (not MVP)
- Context dashboard UI
- Budget-aware pruning
- Integration with all agents

### Must Be Very Good (9/10)

**Performance:**
- Context building <100ms
- Pruning <50ms
- Token reduction 30-50%

**Usability:**
- Clear context dashboard
- Transparent pruning decisions
- Easy manual override

**Parallelization:**
- Zero conflicts with other features
- Clean integration with Cost Guard
- Clean integration with Harness Trace

---

## Estimated Timeline

**Phase 1 (Types & Schema):** 2-3 hours  
**Phase 2 (Context Builder):** 8-10 hours  
**Phase 3 (Pruning Logic):** 4-6 hours  
**Phase 4 (LLM Integration):** 4-6 hours  
**Phase 5 (Status API):** 2-3 hours  
**Phase 6 (Dashboard UI):** 6-8 hours  
**Testing & Documentation:** 8-10 hours  

**Total:** 34-46 hours (5-7 working days)

---

## References

- Dataiku Context Iceberg Research (see Seed 5)
- Cost Guard Implementation (`lib/cost/budgets.ts`)
- Harness Trace Implementation (`lib/harness/trace.ts`)
- LLM Client Implementation (`lib/llm/client.ts`)
- Excellence Criteria Framework (`04_System/EXCELLENCE_CRITERIA_FRAMEWORK.md`)
