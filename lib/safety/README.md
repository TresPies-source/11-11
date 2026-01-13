# Safety Switch Documentation

Developer documentation for 11-11's Safety Switch system - graceful degradation for LLM failures.

---

## Overview

The Safety Switch is a **fallback system** that automatically activates conservative mode when errors occur, preventing catastrophic failures and providing clear user communication.

### Key Features

- **Automatic activation:** Detects LLM errors, budget exhaustion, rate limits
- **Conservative mode:** Cheaper models, reduced functionality
- **Clear communication:** UI banner with reason and recovery options
- **Auto-recovery:** Deactivates after 1 successful operation
- **Full observability:** Integrated with Harness Trace and Cost Guard

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Application Layer                  │
│           (LLM Client, Cost Guard, UI)              │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                  Safety Switch Layer                 │
│  - Error detection & activation                      │
│  - Conservative mode enforcement                     │
│  - Recovery logic (auto + manual)                    │
│  - State management (in-memory + DB)                 │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                   Integration Layer                  │
│  Harness Trace  │  Cost Guard  │  Database          │
└─────────────────────────────────────────────────────┘
```

---

## Core Concepts

### Safety Switch States

**Active:** Conservative mode enforced, banner displayed
**Inactive:** Normal operation, all features available

### Trigger Conditions

1. **LLM Errors:** API failures, parsing errors, timeouts
2. **Budget Exhaustion:** Cost Guard detects budget limit reached
3. **Rate Limits:** 429 errors from LLM provider
4. **Unknown Errors:** Unexpected failures (fallback trigger)

### Conservative Mode Restrictions

When Safety Switch is active:
- ✅ Use cheaper model (`deepseek-chat` instead of `deepseek-reasoner`)
- ✅ Mirror mode only (Dojo agent limited functionality)
- ✅ Reduced max tokens (4000 instead of 8000)
- ✅ No streaming (simpler error handling)
- ❌ No Scout mode (too expensive)
- ❌ No Gardener mode (too expensive)
- ❌ No Implementation mode (too expensive)
- ❌ No agent handoffs (Librarian, Debugger disabled)

### Recovery Mechanisms

**Automatic Recovery (preferred):**
- Triggers after 1 successful LLM operation
- Requires budget available (>20% remaining)
- Requires no recent errors (last 5 minutes)

**Manual Recovery:**
- User clicks "Try Again" button in UI banner
- Bypasses automatic recovery checks
- Immediately deactivates Safety Switch

---

## API Reference

### Core Functions

#### `activateSafetySwitch()`

Activates Safety Switch (enters conservative mode).

```typescript
import { activateSafetySwitch } from '@/lib/safety/switch';

await activateSafetySwitch(
  'llm_error',  // reason
  {
    sessionId: 'user-123',
    error: new Error('API timeout'),
  }
);
```

**Parameters:**
- `reason: SafetySwitchReason` - Why Safety Switch activated
- `context: SafetySwitchContext` - Session ID, error details

**Returns:** `Promise<void>`

**Side effects:**
- Updates in-memory state (Map)
- Persists to database (`safety_switch_events` table)
- Logs to Harness Trace
- Triggers UI banner display

---

#### `deactivateSafetySwitch()`

Deactivates Safety Switch (exits conservative mode).

```typescript
import { deactivateSafetySwitch } from '@/lib/safety/switch';

await deactivateSafetySwitch(
  'user-123',
  'manual' // or 'auto'
);
```

**Parameters:**
- `sessionId: string` - User session ID
- `recoveryType: 'auto' | 'manual'` - How recovery was triggered

**Returns:** `Promise<void>`

**Side effects:**
- Clears in-memory state
- Logs recovery to database
- Logs to Harness Trace
- Hides UI banner

---

#### `shouldActivateSafetySwitch()`

Checks if Safety Switch should activate based on error conditions.

```typescript
import { shouldActivateSafetySwitch } from '@/lib/safety/switch';

const error = new Error('Rate limit exceeded');
const budgetStatus = { remaining: 0, exhausted: true };
const recentErrors = 3;

const shouldActivate = shouldActivateSafetySwitch(
  error,
  budgetStatus,
  recentErrors
);

if (shouldActivate) {
  await activateSafetySwitch('rate_limit', { sessionId, error });
}
```

**Parameters:**
- `error: Error` - Error that occurred
- `budgetStatus: BudgetStatus` - Current budget state
- `recentErrors: number` - Count of recent errors

**Returns:** `boolean` - True if Safety Switch should activate

**Activation Logic:**
- Budget exhausted → activate
- Rate limit error (429) → activate
- Timeout error (408) → activate
- Recent errors ≥ 3 → activate
- Unknown error → activate (conservative approach)

---

#### `getSafetyStatus()`

Gets current Safety Switch status for a session.

```typescript
import { getSafetyStatus } from '@/lib/safety/switch';

const status = getSafetyStatus('user-123');

if (status.active) {
  console.log(`Safety Switch active: ${status.reason}`);
  console.log(`Activated at: ${status.activatedAt}`);
  console.log(`Recovery path: ${status.recoveryPath}`);
}
```

**Parameters:**
- `sessionId: string` - User session ID

**Returns:** `SafetyStatus` - Current status object

```typescript
interface SafetyStatus {
  active: boolean;
  reason?: SafetySwitchReason;
  activatedAt?: Date;
  recoveryPath?: string;
}
```

---

### Conservative Mode Functions

#### `applyConservativeMode()`

Applies conservative mode restrictions to LLM call options.

```typescript
import { applyConservativeMode } from '@/lib/safety/conservative-mode';

const options = {
  model: 'deepseek-reasoner',
  maxTokens: 8000,
  stream: true,
};

const conservativeOptions = applyConservativeMode(options);

// Result:
// {
//   model: 'deepseek-chat',      // Forced to cheaper model
//   maxTokens: 4000,              // Reduced tokens
//   stream: false,                // Streaming disabled
//   temperature: 0.5              // Lower randomness
// }
```

**Parameters:**
- `options: LLMCallOptions` - Original LLM call options

**Returns:** `LLMCallOptions` - Modified options with restrictions

**Transformations:**
1. Force model to `deepseek-chat` (cheapest available)
2. Reduce max tokens to 4000 (50% reduction)
3. Disable streaming (simpler error handling)
4. Lower temperature to 0.5 (more deterministic)

---

#### `isAllowedInConservativeMode()`

Checks if an operation is allowed in conservative mode.

```typescript
import { isAllowedInConservativeMode } from '@/lib/safety/conservative-mode';

const allowed = isAllowedInConservativeMode('mirror');
// Returns: true (Mirror mode allowed)

const notAllowed = isAllowedInConservativeMode('scout');
// Returns: false (Scout mode too expensive)
```

**Parameters:**
- `operation: string` - Operation name

**Returns:** `boolean` - True if operation allowed

**Allowed operations:**
- `mirror` - Basic Dojo reflection
- `query` - Simple Q&A
- `search` - Librarian search (limited)

**Blocked operations:**
- `scout` - Proactive exploration
- `gardener` - Prompt maintenance
- `implementation` - Code generation
- `handoff` - Agent delegation

---

#### `getConservativeModel()`

Gets the conservative model name for a given agent.

```typescript
import { getConservativeModel } from '@/lib/safety/conservative-mode';

const model = getConservativeModel('debugger');
// Returns: 'deepseek-chat' (instead of 'deepseek-reasoner')
```

**Parameters:**
- `agentName: string` - Agent name

**Returns:** `string` - Conservative model name

**Always returns:** `deepseek-chat` (cheapest model)

---

### Recovery Functions

#### `attemptAutoRecovery()`

Attempts automatic recovery from Safety Switch.

```typescript
import { attemptAutoRecovery } from '@/lib/safety/recovery';

const recovered = await attemptAutoRecovery('user-123');

if (recovered) {
  console.log('Successfully recovered from Safety Switch');
} else {
  console.log('Recovery conditions not met');
}
```

**Parameters:**
- `sessionId: string` - User session ID

**Returns:** `Promise<boolean>` - True if recovery succeeded

**Recovery conditions:**
1. At least 1 successful operation since activation
2. Budget available (>20% remaining)
3. No errors in last 5 minutes
4. User hasn't manually dismissed banner

**Side effects:**
- If successful: calls `deactivateSafetySwitch('auto')`
- If failed: logs reason to console (dev mode only)

---

#### `attemptManualRecovery()`

Attempts manual recovery (user-initiated).

```typescript
import { attemptManualRecovery } from '@/lib/safety/recovery';

const result = await attemptManualRecovery('user-123');

if (result.success) {
  console.log('Manual recovery succeeded');
} else {
  console.error(`Recovery failed: ${result.reason}`);
}
```

**Parameters:**
- `sessionId: string` - User session ID

**Returns:** `Promise<RecoveryResult>`

```typescript
interface RecoveryResult {
  success: boolean;
  reason?: string;
}
```

**Recovery logic:**
- Checks if budget available (>20% remaining)
- If yes: deactivates Safety Switch
- If no: returns failure with reason

**Bypass:** Manual recovery bypasses "successful operation" requirement

---

#### `trackSuccessfulOperation()`

Tracks a successful LLM operation for auto-recovery.

```typescript
import { trackSuccessfulOperation } from '@/lib/safety/recovery';

// After successful LLM call
trackSuccessfulOperation('user-123');

// Increments success counter
// Triggers attemptAutoRecovery() if Safety Switch active
```

**Parameters:**
- `sessionId: string` - User session ID

**Returns:** `void`

**Behavior:**
- Increments success counter in state
- If Safety Switch active: triggers `attemptAutoRecovery()`
- If recovery succeeds: automatically exits conservative mode

**Integration:** Called by LLM client after every successful API call

---

## Types

### `SafetySwitchReason`

```typescript
export type SafetySwitchReason =
  | 'llm_error'            // Generic LLM error
  | 'api_failure'          // API request failed
  | 'parsing_error'        // Response parsing failed
  | 'budget_exhausted'     // Cost Guard budget limit
  | 'conflicting_perspectives' // Debugger contradiction
  | 'rate_limit'           // 429 Too Many Requests
  | 'timeout'              // 408 Request Timeout
  | 'unknown_error';       // Unclassified error
```

---

### `SafetySwitchContext`

```typescript
export interface SafetySwitchContext {
  sessionId: string;       // User session ID (required)
  error?: Error;           // Error that triggered activation
  budgetStatus?: BudgetStatus; // Current budget state
  recentErrors?: number;   // Count of recent errors
}
```

---

### `SafetyStatus`

```typescript
export interface SafetyStatus {
  active: boolean;         // Is Safety Switch active?
  reason?: SafetySwitchReason; // Why was it activated?
  activatedAt?: Date;      // When was it activated?
  recoveryPath?: string;   // How to recover (e.g., "Wait for budget reset")
}
```

---

### `RecoveryResult`

```typescript
export interface RecoveryResult {
  success: boolean;        // Did recovery succeed?
  reason?: string;         // If failed, why?
}
```

---

## Database Schema

### `safety_switch_events` Table

```sql
CREATE TABLE safety_switch_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- 'activate' | 'deactivate'
  reason TEXT,               -- SafetySwitchReason
  recovery_type TEXT,        -- 'auto' | 'manual' (for deactivate)
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `session_id` (for fast status lookups)
- `created_at` (for recent error queries)

**Retention:** No automatic deletion (historical analysis)

---

## Integration Guide

### LLM Client Integration

The Safety Switch automatically integrates with the LLM client via `callWithFallback()`:

```typescript
// In lib/llm/client.ts
export async function callWithFallback(
  agent: string,
  messages: ChatMessage[],
  options?: LLMCallOptions
): Promise<LLMResponse> {
  // 1. Check Safety Switch status
  const safetyStatus = getSafetyStatus(options?.sessionId);
  
  if (safetyStatus.active) {
    // 2. Apply conservative mode restrictions
    options = applyConservativeMode(options);
  }
  
  try {
    // 3. Call primary model
    const response = await call(model, messages, options);
    
    // 4. Track successful operation
    trackSuccessfulOperation(options?.sessionId);
    
    return response;
  } catch (error) {
    // 5. Check if Safety Switch should activate
    if (shouldActivateSafetySwitch(error, budgetStatus, recentErrors)) {
      await activateSafetySwitch('llm_error', {
        sessionId: options?.sessionId,
        error
      });
    }
    
    // 6. Try fallback model
    return await fallback();
  }
}
```

**Key points:**
- Safety Switch check at start (step 1)
- Conservative mode applied if active (step 2)
- Success tracked for auto-recovery (step 4)
- Activation on error (step 5)

---

### Cost Guard Integration

Cost Guard triggers Safety Switch on budget exhaustion:

```typescript
// In lib/cost/budgets.ts
export async function checkBudget(
  userId: string,
  sessionId: string,
  cost: number
): Promise<BudgetCheckResult> {
  const budget = await getBudget(userId);
  
  if (budget.remaining - cost < 0) {
    // Budget exhausted - activate Safety Switch
    await activateSafetySwitch('budget_exhausted', {
      sessionId,
      budgetStatus: budget
    });
    
    return { allowed: false, reason: 'Budget exhausted' };
  }
  
  return { allowed: true };
}
```

**Integration points:**
- Query budget check → Safety Switch on exhaustion
- Session budget check → Safety Switch on exhaustion
- Monthly budget check → Safety Switch on exhaustion

---

### UI Integration

The Safety Switch banner automatically displays when active:

```typescript
// In components/layout/MainContent.tsx
import { SafetySwitchBanner } from '@/components/safety';

export function MainContent() {
  const { user } = useSession();
  
  return (
    <div>
      {/* Banner appears at top when Safety Switch active */}
      <SafetySwitchBanner sessionId={user.sessionId} />
      
      {/* Rest of content */}
    </div>
  );
}
```

**Banner features:**
- Automatic polling (1 second intervals)
- "Try Again" button (manual recovery)
- Clear reason messaging
- Dismissible (but reappears on next error)
- Framer Motion animations

---

## Usage Examples

### Example 1: LLM Error Triggers Safety Switch

```typescript
import { callWithFallback } from '@/lib/llm/client';

try {
  const response = await callWithFallback('supervisor', messages, {
    sessionId: 'user-123'
  });
} catch (error) {
  // Safety Switch automatically activated if needed
  // User sees banner explaining what happened
}
```

**Flow:**
1. LLM call fails (API error)
2. `shouldActivateSafetySwitch()` returns true
3. `activateSafetySwitch()` called automatically
4. Banner appears with "API error" message
5. Next LLM call uses conservative mode

---

### Example 2: Budget Exhaustion

```typescript
import { checkBudget } from '@/lib/cost/budgets';

const result = await checkBudget('user-123', 'session-456', 0.05);

if (!result.allowed) {
  // Safety Switch already activated by checkBudget()
  // Banner displayed automatically
  console.log('Budget exhausted - conservative mode active');
}
```

**Flow:**
1. Cost Guard detects budget exhaustion
2. `activateSafetySwitch('budget_exhausted')` called
3. Banner appears with "Budget limit reached" message
4. All LLM calls now use cheaper model

---

### Example 3: Manual Recovery

```typescript
import { attemptManualRecovery } from '@/lib/safety/recovery';

// User clicks "Try Again" button
const result = await attemptManualRecovery('user-123');

if (result.success) {
  toast.success('Switched back to normal mode');
} else {
  toast.error(`Cannot recover: ${result.reason}`);
}
```

**Flow:**
1. User clicks "Try Again" in banner
2. Manual recovery checks budget availability
3. If budget available: Safety Switch deactivated
4. If budget exhausted: error message shown

---

### Example 4: Automatic Recovery

```typescript
// After successful LLM call
trackSuccessfulOperation('user-123');

// Internally:
// 1. Increments success counter
// 2. If Safety Switch active, calls attemptAutoRecovery()
// 3. If conditions met, deactivates Safety Switch
// 4. Banner disappears automatically
```

**Flow:**
1. LLM call succeeds
2. Success tracked
3. Auto-recovery checks conditions
4. If met: Safety Switch deactivated silently
5. Banner disappears

---

## Best Practices

### When to Check Safety Switch

**Do:**
- ✅ Check before expensive operations (agent handoffs)
- ✅ Check in LLM client (automatic)
- ✅ Check in Cost Guard (automatic)

**Don't:**
- ❌ Check in every UI component (banner handles it)
- ❌ Check for read-only operations (file viewing)
- ❌ Manually activate without good reason

---

### Error Messaging

**Do:**
- ✅ Use user-friendly reason messages
- ✅ Provide clear recovery path
- ✅ Log technical details to Harness Trace

**Don't:**
- ❌ Show raw error messages to users
- ❌ Use technical jargon in banner
- ❌ Hide errors without logging

---

### Recovery Strategy

**Do:**
- ✅ Prefer automatic recovery (transparent UX)
- ✅ Track successful operations for auto-recovery
- ✅ Allow manual recovery as escape hatch

**Don't:**
- ❌ Force manual recovery for every error
- ❌ Auto-recover without checking budget
- ❌ Retry immediately (use exponential backoff)

---

## Testing

### Unit Tests

```bash
# Run all Safety Switch tests (43 tests)
npm run test:safety

# Run specific test suites
npm run test -- __tests__/safety/switch.test.ts        # 18 tests
npm run test -- __tests__/safety/conservative-mode.test.ts  # 9 tests
npm run test -- __tests__/safety/recovery.test.ts      # 8 tests
npm run test -- __tests__/safety/integration.test.ts   # 10 tests
npm run test -- __tests__/safety/e2e.test.ts           # 6 tests
```

### Manual Testing

```bash
# 1. Start dev server
npm run dev

# 2. Trigger Safety Switch manually
# Open browser console, run:
await activateSafetySwitch('llm_error', { sessionId: 'test-123' });

# 3. Verify banner appears
# 4. Click "Try Again" button
# 5. Verify banner disappears
```

### Integration Testing

```bash
# Test LLM client integration
npx tsx scripts/test-safety-llm-integration.ts

# Test Cost Guard integration
npx tsx scripts/test-safety-cost-integration.ts

# Test UI banner
npm run test:e2e -- --grep "Safety Switch"
```

---

## Performance

### Benchmarks

| Operation | Latency (p95) | Notes |
|-----------|---------------|-------|
| `getSafetyStatus()` | <1ms | In-memory lookup |
| `activateSafetySwitch()` | <50ms | DB write + Harness Trace |
| `attemptAutoRecovery()` | <100ms | Budget check + DB write |
| Banner render | <16ms | React component |

### Memory Usage

- **In-memory state:** ~1KB per session
- **Database storage:** ~500 bytes per event
- **Total overhead:** <0.1% of application memory

---

## Troubleshooting

### Safety Switch Won't Activate

**Symptoms:** Error occurs but banner doesn't appear

**Possible causes:**
1. `shouldActivateSafetySwitch()` returns false
2. Session ID not passed to LLM client
3. Banner component not mounted

**Solutions:**
1. Check error type and budget status
2. Verify `options.sessionId` in LLM call
3. Verify `SafetySwitchBanner` in `MainContent.tsx`

---

### Safety Switch Won't Deactivate

**Symptoms:** Banner remains after successful operation

**Possible causes:**
1. Budget still exhausted (>80% used)
2. Recent errors (<5 minutes ago)
3. Success not tracked (`trackSuccessfulOperation()` not called)

**Solutions:**
1. Check budget status in Cost Guard dashboard
2. Wait 5 minutes after last error
3. Verify LLM client calls `trackSuccessfulOperation()`

---

### Banner Polling Too Frequent

**Symptoms:** High CPU usage, excessive re-renders

**Solution:**
- Default polling interval: 1 second
- Increase in `SafetySwitchBanner.tsx` if needed:

```typescript
// Change from 1000ms to 5000ms
const interval = setInterval(() => {
  checkStatus();
}, 5000);
```

---

## Future Enhancements

**v0.4.0+:**
- User-customizable Safety Switch rules
- A/B testing of conservative mode strategies
- Predictive Safety Switch (activate before errors)
- Safety Switch analytics dashboard
- Per-agent conservative mode settings
- Gradual recovery (tiered mode restoration)

---

## Resources

- [Dataiku Safety Switch Research](https://www.dataiku.com/product/key-capabilities/generative-ai/llm-mesh/safety-switch/)
- [Harness Trace Documentation](../harness/README.md)
- [Cost Guard Documentation](../cost/README.md)
- [LLM Client Documentation](../llm/README.md)

---

## Support

**Questions?** Check `JOURNAL.md` for architectural decisions

**Bugs?** Add to `/05_Logs/BUGS.md`

**Improvements?** Propose in `/00_Roadmap/future_enhancements.md`
