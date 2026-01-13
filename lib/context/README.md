# Hierarchical Context Management

**Version:** v0.3.6  
**Status:** Production Ready  
**Research Basis:** Dataiku Context Iceberg Pattern

---

## Overview

The Hierarchical Context Management system implements a 4-tier architecture to reduce token usage by 30-50% while preserving critical context. This solves the "context re-feed tax" problem where every LLM query re-sends the entire conversation history, system prompts, and project memory.

### Key Benefits

- **30-50% token reduction** through intelligent context pruning
- **Budget-aware** context building based on Cost Guard integration
- **Automatic integration** with all agents (Supervisor, Librarian, Debugger, Dojo)
- **Zero context loss** - Tier 1 is always preserved
- **Performance optimized** - context builds in <100ms

---

## Architecture

### The 4-Tier System

**Tier 1 (Always On):** Core system prompt, Dojo principles, current query (~2k tokens)  
**Tier 2 (On Demand):** Active seed patches, relevant project memory (~5k tokens)  
**Tier 3 (When Referenced):** Full text of specific files or logs (~10k tokens)  
**Tier 4 (Pruned Aggressively):** General conversation history (~variable)

### Budget-Aware Pruning

| Budget Remaining | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|------------------|--------|--------|--------|--------|
| **>80%** | Full | All seeds | Full | Last 10 messages |
| **60-80%** | Full | All seeds | Full | Last 5 messages |
| **40-60%** | Full | Top 3 seeds | Summaries only | Last 2 messages |
| **<40%** | Full | Top 1 seed | None | None |

---

## API Reference

### `buildContext(options: ContextBuildOptions): Promise<ContextResult>`

Main function to build context for an LLM call with budget-aware pruning.

**Parameters:**
```typescript
interface ContextBuildOptions {
  agent: string;                    // Agent name (supervisor, librarian, etc.)
  messages: ChatMessage[];          // Conversation history
  userId: string;                   // User ID for budget calculation
  sessionId?: string;               // Session ID (optional)
  budgetPercent?: number;           // Override budget percent (0-100)
  forceIncludeTiers?: ContextTier[]; // Force include specific tiers
}
```

**Returns:**
```typescript
interface ContextResult {
  messages: ChatMessage[];          // Pruned messages ready for LLM
  totalTokens: number;              // Total token count
  tierBreakdown: TierBreakdown;     // Token breakdown by tier
  strategy: PruningStrategy;        // Applied pruning strategy
}
```

**Example:**
```typescript
import { buildContext } from '@/lib/context/builder';

const result = await buildContext({
  agent: 'supervisor',
  messages: conversationHistory,
  userId: user.id,
  sessionId: session.id,
});

// Use result.messages for LLM call
const response = await callWithFallback('supervisor', result.messages);

// Log token savings
console.log(`Token reduction: ${result.tierBreakdown.tier1 + result.tierBreakdown.tier2}/${result.totalTokens}`);
```

---

### `getPruningStrategy(budgetPercent: number): PruningStrategy`

Determines the pruning strategy based on budget level.

**Parameters:**
- `budgetPercent` (number): Budget remaining (0-100)

**Returns:**
```typescript
interface PruningStrategy {
  budgetRange: '>80%' | '60-80%' | '40-60%' | '<40%';
  tier1Messages: number;     // Always 1 (never pruned)
  tier2Items: number | 'all'; // Number of seeds or 'all'
  tier3Mode: 'full' | 'summary' | 'none';
  tier4Messages: number;     // Max conversation history messages
}
```

**Example:**
```typescript
import { getPruningStrategy } from '@/lib/context/pruning';

const strategy = getPruningStrategy(45); // 45% budget remaining
console.log(strategy);
// {
//   budgetRange: '40-60%',
//   tier1Messages: 1,
//   tier2Items: 3,
//   tier3Mode: 'summary',
//   tier4Messages: 2
// }
```

---

### `countTokens(text: string): number`

Count tokens in a text string using tiktoken (cl100k_base encoding).

**Parameters:**
- `text` (string): Text to count tokens for

**Returns:** Number of tokens

**Example:**
```typescript
import { countTokens } from '@/lib/context/tokens';

const tokens = countTokens('Hello, world!');
console.log(tokens); // ~4 tokens
```

---

### `calculateTokenSavings(originalTokens: number, contextResult: ContextResult)`

Calculate token savings from context pruning.

**Parameters:**
- `originalTokens` (number): Original token count before pruning
- `contextResult` (ContextResult): Result from buildContext

**Returns:**
```typescript
{
  savedTokens: number;      // Absolute token savings
  percentSaved: number;     // Percentage saved (0-100)
}
```

**Example:**
```typescript
import { calculateTokenSavings } from '@/lib/context/builder';

const savings = calculateTokenSavings(10000, contextResult);
console.log(`Saved ${savings.savedTokens} tokens (${savings.percentSaved.toFixed(1)}%)`);
// Output: "Saved 4500 tokens (45.0%)"
```

---

## Integration with LLM Client

The context builder is automatically integrated into the LLM client. To enable it, simply pass `userId` to any LLM call:

```typescript
import { callWithFallback } from '@/lib/llm/client';

// Without context builder (original behavior)
const response1 = await callWithFallback('supervisor', messages);

// With context builder (automatic pruning)
const response2 = await callWithFallback('supervisor', messages, {
  userId: user.id,
  sessionId: session.id,
});
```

The context builder will:
1. Calculate current budget status from Cost Guard
2. Determine appropriate pruning strategy
3. Build 4-tier context
4. Log context metadata to Harness Trace
5. Return pruned messages

If any error occurs, the system gracefully falls back to the original messages.

---

## Database Schema

Context snapshots are stored in the `context_snapshots` table:

```sql
CREATE TABLE context_snapshots (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT,
  agent_name TEXT NOT NULL,
  total_tokens INTEGER NOT NULL,
  tier1_tokens INTEGER NOT NULL,
  tier2_tokens INTEGER NOT NULL,
  tier3_tokens INTEGER NOT NULL,
  tier4_tokens INTEGER NOT NULL,
  budget_percent NUMERIC(5,2) NOT NULL,
  pruning_strategy TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Indexes:
- `idx_context_user` on `user_id`
- `idx_context_session` on `session_id`
- `idx_context_created` on `created_at`

---

## Context Status API

### `GET /api/context/status`

Query context status and snapshots.

**Query Parameters:**

- `mode=current&sessionId=<id>` - Get latest snapshot for a session
- `mode=recent&userId=<id>&limit=10` - Get N recent snapshots for a user
- `mode=session&sessionId=<id>` - Get all snapshots for a session

**Response:**
```typescript
{
  sessionId: string;
  totalTokens: number;
  tierBreakdown: {
    tier1: number;
    tier2: number;
    tier3: number;
    tier4: number;
  };
  budgetPercent: number;
  pruningStrategy: string;
  timestamp: string;
}
```

**Example:**
```bash
# Get current context status for a session
curl 'http://localhost:3000/api/context/status?mode=current&sessionId=abc-123'

# Get recent snapshots for a user
curl 'http://localhost:3000/api/context/status?mode=recent&userId=user-456&limit=5'
```

---

## Context Dashboard UI

A visual dashboard is available at `/context-dashboard` showing:

- **Real-time metrics:** Total tokens, budget remaining, last updated
- **4-tier breakdown:** Visual chart showing token distribution
- **Active pruning strategy:** Current tier limits based on budget
- **Budget indicator:** Color-coded based on budget level (green/yellow/red)

**React Hook:**
```typescript
import { useContextStatus } from '@/hooks/useContextStatus';

function MyComponent() {
  const { status, isLoading, error } = useContextStatus('session-123');
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <p>Total tokens: {status.totalTokens}</p>
      <p>Budget: {status.budgetPercent}%</p>
    </div>
  );
}
```

---

## Best Practices

### 1. Always Pass userId for Budget-Aware Context

```typescript
// ✓ Good - budget-aware pruning
await callWithFallback('supervisor', messages, {
  userId: user.id,
  sessionId: session.id,
});

// ✗ Bad - no pruning, wastes tokens
await callWithFallback('supervisor', messages);
```

### 2. Monitor Token Savings

```typescript
const result = await buildContext({
  agent: 'supervisor',
  messages,
  userId: user.id,
});

// Log savings to analytics
logMetric('token_savings', {
  saved: result.tierBreakdown.tier1 + result.tierBreakdown.tier2,
  total: result.totalTokens,
  percentage: ((result.tierBreakdown.tier1 / result.totalTokens) * 100).toFixed(1),
});
```

### 3. Use forceIncludeTiers for Critical Context

```typescript
// Force include Tier 2 (seeds) even if budget is low
const result = await buildContext({
  agent: 'supervisor',
  messages,
  userId: user.id,
  forceIncludeTiers: ['tier2'],
});
```

### 4. Handle Graceful Degradation

The system is designed to gracefully degrade:
- Tier 1 is **never** pruned (critical context always preserved)
- If database fails, defaults to 100% budget
- If context builder fails, falls back to original messages
- All errors are logged to Harness Trace

---

## Performance Benchmarks

**Test Environment:** Node.js 18, PGlite in-memory database

| Metric | Target | Actual |
|--------|--------|--------|
| Context build time | <100ms | 2-10ms |
| Pruning time | <50ms | 2-4ms |
| Token reduction (low budget) | 30-50% | 45-79% |
| Memory overhead (20 iterations) | <50MB | ~4MB |

**Token Reduction Examples:**

- **100 messages, 100% budget:** 392 tokens → 392 tokens (0% reduction)
- **100 messages, 50% budget:** 392 tokens → 196 tokens (50% reduction)
- **100 messages, 30% budget:** 392 tokens → 82 tokens (79% reduction)

---

## Testing

### Unit Tests

```bash
npm run test:context-builder   # 15 tests - tier builders, token counting
npm run test:context-pruning   # 11 tests - pruning strategies
```

### Integration Tests

```bash
npm run test:context-integration  # 6 tests - multi-agent, error handling
npm run test:context-api          # 8 tests - API endpoints
```

### Performance Tests

```bash
npm run test:context-performance  # 7 tests - speed, memory, token reduction
```

### Run All Tests

```bash
npm run test:context  # Runs all 47 context tests
```

---

## Troubleshooting

### Issue: Context not being pruned

**Solution:** Ensure `userId` is passed to LLM calls:

```typescript
// This will NOT trigger pruning
await callWithFallback('supervisor', messages);

// This WILL trigger pruning
await callWithFallback('supervisor', messages, {
  userId: user.id,
});
```

### Issue: Tier 1 has 0 tokens

**Solution:** This should never happen. If it does:
1. Check that `buildTier1` is being called
2. Check that system prompts exist in database
3. Check logs for errors in tier building
4. File a bug report

### Issue: UUID errors in logs

This is expected in tests using non-UUID session IDs. The system handles this gracefully by falling back to 100% budget. In production, use proper UUIDs for `sessionId`.

### Issue: Dashboard not updating

Check that:
1. API endpoint `/api/context/status` returns data
2. `sessionId` or `userId` is correct
3. Browser console for errors
4. Network tab shows successful API calls

---

## Migration Guide

### From v0.3.5 to v0.3.6

No breaking changes. The context builder is opt-in:

1. **Add userId to LLM calls:**
   ```typescript
   // Before
   await callWithFallback('supervisor', messages);
   
   // After
   await callWithFallback('supervisor', messages, {
     userId: user.id,
     sessionId: session.id,
   });
   ```

2. **Monitor token savings:**
   - Visit `/context-dashboard` to see real-time metrics
   - Check Harness Trace logs for `CONTEXT_BUILD` events

3. **Adjust budget thresholds if needed:**
   - Current thresholds: >80%, 60-80%, 40-60%, <40%
   - Modify `getPruningStrategy` in `lib/context/pruning.ts` if needed

---

## Future Enhancements (v0.4.0+)

- User-customizable tier rules
- A/B testing of pruning strategies
- Context caching (beyond LLM provider caching)
- Predictive context loading
- Real-time context optimization
- Machine learning-based relevance scoring

---

## References

- **Research:** Dataiku Context Iceberg Pattern
- **Implementation:** `/lib/context/builder.ts`, `/lib/context/pruning.ts`
- **Tests:** `__tests__/context/*.test.ts`
- **API:** `/app/api/context/status/route.ts`
- **Dashboard:** `/app/context-dashboard/page.tsx`

---

## License

MIT License - See project LICENSE file for details.
