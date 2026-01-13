# Technical Specification: Safety Switch (v0.3.7)

## Task Complexity Assessment

**Complexity Level:** HARD

**Rationale:**
- Multi-system integration (LLM client, Cost Guard, Harness Trace, UI)
- New infrastructure layer (Safety Switch service)
- Complex state management (session-level Safety Switch state)
- Sophisticated recovery logic (automatic + manual)
- Error handling across multiple failure modes
- Comprehensive testing requirements (unit, integration, E2E)
- High stability requirement (must never cause additional failures)

---

## Technical Context

### Tech Stack
- **Language:** TypeScript 5.7.2
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Framer Motion
- **Database:** PGlite (embedded PostgreSQL)
- **LLM Providers:** DeepSeek (primary), OpenAI (fallback)
- **Testing:** tsx for TypeScript test execution

### Key Dependencies
- `openai@^4.77.0` - LLM API client
- `@electric-sql/pglite@^0.3.14` - Database
- `framer-motion@^11.15.0` - UI animations
- `lucide-react@^0.469.0` - Icons
- `zod@^3.23.8` - Schema validation

### Build & Test Commands
- `npm run dev` - Start dev server
- `npm run build` - Build production
- `npm run lint` - Lint code
- `npm run type-check` - TypeScript validation
- `npm run test:safety` - (New) Run Safety Switch tests

---

## Implementation Approach

### Design Principles

1. **Non-intrusive Integration:** Safety Switch should be a layer on top of existing systems, not a replacement
2. **Fail-Safe by Default:** If Safety Switch itself fails, application should continue (log error but don't crash)
3. **Clear User Communication:** User must always understand why Safety Switch activated and how to recover
4. **Automatic Recovery:** System should self-heal when conditions improve
5. **Comprehensive Logging:** All Safety Switch events logged to Harness Trace

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Safety Switch Layer                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │  1. shouldActivateSafetySwitch(error, budget)     │ │
│  │  2. activateSafetySwitch(reason, context)         │ │
│  │  3. applyConservativeMode(options)                │ │
│  │  4. attemptAutoRecovery(sessionId)                │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  LLM Client  │   │  Cost Guard  │   │    UI Layer  │
│  (Modified)  │   │ (Integration)│   │(New Banner)  │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                   ┌──────────────┐
                   │Harness Trace │
                   │  (Logging)   │
                   └──────────────┘
```

### Key Design Decisions

1. **State Storage:** Safety Switch state stored in-memory (Map) by sessionId, with fallback to localStorage for persistence across refreshes
2. **Trigger Detection:** Multiple trigger points (LLM client, Cost Guard, manual activation)
3. **Conservative Mode:** Applied at LLM call time by modifying options object
4. **Recovery Logic:** Automatic after 1 successful operation + budget check, or manual override
5. **UI Integration:** Banner component rendered conditionally at top of MainContent

---

## Source Code Structure

### New Files

#### 1. Safety Switch Core Service
**Path:** `/lib/safety/switch.ts`
- `activateSafetySwitch()` - Activate Safety Switch
- `deactivateSafetySwitch()` - Deactivate Safety Switch
- `shouldActivateSafetySwitch()` - Check if activation needed
- `getSafetyStatus()` - Get current status
- `isSafetyActive()` - Boolean check for active state

#### 2. Safety Switch Types
**Path:** `/lib/safety/types.ts`
- `SafetySwitchReason` type
- `SafetySwitchContext` interface
- `SafetyStatus` interface
- `RecoveryResult` interface

#### 3. Conservative Mode Logic
**Path:** `/lib/safety/conservative-mode.ts`
- `applyConservativeMode()` - Modify LLM options for conservative mode
- `isAllowedInConservativeMode()` - Check if operation allowed
- `getConservativeModel()` - Get cheaper model for conservative mode

#### 4. Recovery Logic
**Path:** `/lib/safety/recovery.ts`
- `attemptAutoRecovery()` - Automatic recovery after success
- `attemptManualRecovery()` - Manual recovery (user override)
- `isRecoverySafe()` - Check if recovery conditions met
- `trackSuccessfulOperation()` - Track successes for auto-recovery

#### 5. Safety Switch State Management
**Path:** `/lib/safety/state.ts`
- In-memory Map for session state
- localStorage persistence utilities
- State initialization and cleanup

#### 6. Safety Switch UI Banner
**Path:** `/components/safety/SafetySwitchBanner.tsx`
- Banner component with warning/error states
- "Try Again" and "Switch Back" buttons
- Dismissible with reappear logic
- Framer Motion animations

#### 7. Database Schema Migration
**Path:** `/lib/pglite/migrations/008_add_safety_switch.ts`
- Create `safety_switch_events` table
- Track activations, recoveries, and failures

### Modified Files

#### 1. LLM Client Integration
**Path:** `/lib/llm/client.ts`

**Changes:**
- Import Safety Switch functions
- Add Safety Switch check in `callWithFallback()` before LLM call
- Check if conservative mode active, apply restrictions
- Catch errors and check if Safety Switch should activate
- Track successful operations for auto-recovery

**Specific Modifications:**
```typescript
// At top of callWithFallback()
const safetyStatus = getSafetyStatus(options?.sessionId);
if (safetyStatus.active) {
  options = applyConservativeMode(options);
  processedMessages = applyConservativeContext(processedMessages);
}

// In catch block
if (shouldActivateSafetySwitch(error, budgetStatus, recentErrors)) {
  await activateSafetySwitch(getErrorReason(error), {
    sessionId: options?.sessionId,
    error,
    budgetStatus,
  });
}

// After successful call
if (safetyStatus.active) {
  trackSuccessfulOperation(options?.sessionId);
  await attemptAutoRecovery(options?.sessionId);
}
```

#### 2. Cost Guard Integration
**Path:** `/lib/cost/budgets.ts`

**Changes:**
- Import Safety Switch functions
- Check for budget exhaustion in `checkBudget()`
- Activate Safety Switch when budget exhausted

**Specific Modifications:**
```typescript
// In checkBudget(), after budget exceeded detection
if (!result.allowed && result.reason === 'user_limit_exceeded') {
  await activateSafetySwitch('budget_exhausted', {
    sessionId,
    budgetStatus: result,
  });
}
```

#### 3. Main Content Layout
**Path:** `/components/layout/MainContent.tsx`

**Changes:**
- Import SafetySwitchBanner
- Add banner at top of content area
- Pass sessionId and recovery handlers

**Specific Modifications:**
```typescript
<div className="flex-1 flex flex-col">
  <SafetySwitchBanner sessionId={currentSessionId} />
  {/* existing content */}
</div>
```

#### 4. Harness Trace Event Types
**Path:** `/lib/harness/types.ts`

**Changes:**
- Add new event type: `'SAFETY_SWITCH'`

---

## Data Model Changes

### New Database Table: `safety_switch_events`

```sql
CREATE TABLE IF NOT EXISTS safety_switch_events (
  id TEXT PRIMARY KEY DEFAULT ('evt_' || lower(hex(randomblob(16)))),
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'activated' | 'recovered' | 'failed_recovery'
  reason TEXT NOT NULL, -- SafetySwitchReason
  error_message TEXT,
  context JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_safety_switch_session ON safety_switch_events(session_id);
CREATE INDEX idx_safety_switch_user ON safety_switch_events(user_id);
CREATE INDEX idx_safety_switch_created ON safety_switch_events(created_at);
```

### Types Additions

#### Safety Switch Types (`/lib/safety/types.ts`)

```typescript
export type SafetySwitchReason =
  | 'llm_error'           // Generic LLM API error
  | 'api_failure'         // Network/connectivity failure
  | 'parsing_error'       // JSON parsing or response format error
  | 'budget_exhausted'    // Cost Guard budget limit reached
  | 'rate_limit'          // 429 rate limit error
  | 'timeout'             // Request timeout
  | 'auth_error'          // Authentication failure
  | 'conflicting_perspectives' // Debugger detected contradictions
  | 'unknown_error';      // Catch-all for unexpected errors

export interface SafetySwitchContext {
  sessionId?: string;
  userId?: string;
  error?: Error;
  budgetStatus?: BudgetCheckResult;
  recentErrors?: number;
  timestamp?: string;
}

export interface SafetyStatus {
  active: boolean;
  reason?: SafetySwitchReason;
  activatedAt?: Date;
  recoveryPath?: string;
  attemptedRecoveries?: number;
  lastRecoveryAttempt?: Date;
}

export interface RecoveryResult {
  success: boolean;
  reason?: string;
  newStatus: SafetyStatus;
}

export interface SafetySwitchEvent {
  id: string;
  session_id: string;
  user_id: string;
  event_type: 'activated' | 'recovered' | 'failed_recovery';
  reason: SafetySwitchReason;
  error_message?: string;
  context: SafetySwitchContext;
  created_at: string;
}
```

---

## API Changes

No new HTTP endpoints required. Safety Switch is a client-side/server-side utility layer.

---

## Verification Approach

### Testing Strategy

#### Unit Tests (12 tests)

**File:** `__tests__/safety/switch.test.ts`
- ✅ `shouldActivateSafetySwitch()` detects LLM errors
- ✅ `shouldActivateSafetySwitch()` detects budget exhaustion
- ✅ `shouldActivateSafetySwitch()` detects rate limits
- ✅ `shouldActivateSafetySwitch()` detects timeouts
- ✅ `activateSafetySwitch()` updates state correctly
- ✅ `activateSafetySwitch()` logs to Harness Trace
- ✅ `deactivateSafetySwitch()` clears state correctly
- ✅ `getSafetyStatus()` returns correct status
- ✅ State persists to localStorage
- ✅ State rehydrates from localStorage

**File:** `__tests__/safety/conservative-mode.test.ts`
- ✅ `applyConservativeMode()` forces cheaper model
- ✅ `applyConservativeMode()` reduces max tokens
- ✅ `applyConservativeMode()` disables streaming
- ✅ `isAllowedInConservativeMode()` blocks expensive operations
- ✅ Conservative mode uses correct model (deepseek-chat)

**File:** `__tests__/safety/recovery.test.ts`
- ✅ `attemptAutoRecovery()` recovers after 1 success
- ✅ `attemptAutoRecovery()` checks budget before recovery
- ✅ `attemptAutoRecovery()` prevents recovery if recent errors
- ✅ `attemptManualRecovery()` allows user override
- ✅ `isRecoverySafe()` validates recovery conditions
- ✅ Recovery fails if budget <20%

#### Integration Tests (8 tests)

**File:** `__tests__/safety/integration.test.ts`
- ✅ LLM client activates Safety Switch on error
- ✅ LLM client applies conservative mode when active
- ✅ Cost Guard activates Safety Switch on budget exhaustion
- ✅ Successful LLM call triggers auto-recovery
- ✅ Harness Trace logs all Safety Switch events
- ✅ Multiple failures increment error count
- ✅ Recovery blocked if errors continue
- ✅ Manual override works even if auto-recovery blocked

#### E2E Tests (6 tests)

**File:** `__tests__/safety/e2e.test.ts`
- ✅ Safety Switch activates on LLM error
- ✅ Banner appears when Safety Switch active
- ✅ "Try Again" button attempts recovery
- ✅ "Switch Back" button manually overrides
- ✅ Banner dismisses but reappears on next error
- ✅ Auto-recovery happens after successful operation

### Manual Verification Steps

1. **LLM Error Activation:**
   - Simulate API error (invalid key)
   - Verify Safety Switch activates
   - Verify banner appears
   - Verify Harness Trace logs event

2. **Budget Exhaustion Activation:**
   - Exhaust user budget
   - Verify Safety Switch activates
   - Verify "budget_exhausted" reason
   - Verify conservative mode applied

3. **Conservative Mode Behavior:**
   - Verify cheaper model used (deepseek-chat)
   - Verify reduced context
   - Verify no agent handoffs

4. **Auto-Recovery:**
   - Activate Safety Switch
   - Make successful LLM call
   - Verify Safety Switch deactivates
   - Verify banner disappears

5. **Manual Recovery:**
   - Activate Safety Switch
   - Click "Switch Back" button
   - Verify Safety Switch deactivates
   - Verify banner disappears

6. **Persistence:**
   - Activate Safety Switch
   - Refresh page
   - Verify Safety Switch still active
   - Verify banner still visible

### Success Criteria

- [ ] All unit tests pass (26/26)
- [ ] All integration tests pass (8/8)
- [ ] All E2E tests pass (6/6)
- [ ] Zero regressions in existing tests
- [ ] `npm run type-check` - 0 errors
- [ ] `npm run lint` - 0 errors, 0 warnings
- [ ] `npm run build` - Success
- [ ] Manual verification complete
- [ ] Documentation updated (README, JOURNAL, AUDIT_LOG)

---

## Implementation Plan

### Phase 1: Core Infrastructure (2-3 days)
1. Create Safety Switch types (`/lib/safety/types.ts`)
2. Create Safety Switch state management (`/lib/safety/state.ts`)
3. Create Safety Switch service (`/lib/safety/switch.ts`)
4. Create database migration (`/lib/pglite/migrations/008_add_safety_switch.ts`)
5. Write unit tests for core service
6. **Checkpoint:** Unit tests pass

### Phase 2: Conservative Mode (1-2 days)
1. Create conservative mode logic (`/lib/safety/conservative-mode.ts`)
2. Create recovery logic (`/lib/safety/recovery.ts`)
3. Write unit tests for conservative mode and recovery
4. **Checkpoint:** Unit tests pass

### Phase 3: LLM Client Integration (1-2 days)
1. Modify LLM client (`/lib/llm/client.ts`)
2. Add Safety Switch checks before/after LLM calls
3. Add error handling and activation logic
4. Write integration tests
5. **Checkpoint:** Integration tests pass

### Phase 4: Cost Guard Integration (1 day)
1. Modify Cost Guard (`/lib/cost/budgets.ts`)
2. Add Safety Switch activation on budget exhaustion
3. Write integration tests
4. **Checkpoint:** Integration tests pass

### Phase 5: UI Implementation (1-2 days)
1. Create SafetySwitchBanner component (`/components/safety/SafetySwitchBanner.tsx`)
2. Integrate banner into MainContent (`/components/layout/MainContent.tsx`)
3. Add recovery handlers
4. Write E2E tests
5. **Checkpoint:** E2E tests pass

### Phase 6: Documentation & Cleanup (1 day)
1. Create README (`/lib/safety/README.md`)
2. Update JOURNAL.md with architectural decisions
3. Update AUDIT_LOG.md with test results
4. Run full test suite
5. Run lint and type-check
6. Build production
7. **Checkpoint:** All verification complete

---

## Risk Assessment

### High-Risk Areas

1. **State Management:** Safety Switch state must be consistent across refreshes
   - **Mitigation:** localStorage persistence + in-memory fallback

2. **Circular Dependencies:** Safety Switch depends on Cost Guard, which might depend on Safety Switch
   - **Mitigation:** Careful import management, separate concerns

3. **Performance Impact:** Safety Switch checks on every LLM call
   - **Mitigation:** Lightweight checks, early returns, no async operations in hot path

4. **False Positives:** Safety Switch activating unnecessarily
   - **Mitigation:** Multiple trigger conditions, error counting, conservative thresholds

### Medium-Risk Areas

1. **UI Flickering:** Banner appearing/disappearing rapidly
   - **Mitigation:** Framer Motion animations, debouncing, stable key

2. **Recovery Timing:** Auto-recovery happening too quickly or too slowly
   - **Mitigation:** Clear recovery conditions, manual override always available

3. **Error Categorization:** Mapping errors to SafetySwitchReason
   - **Mitigation:** Comprehensive error type checking, catch-all "unknown_error"

---

## Deferred Features

These features are explicitly deferred to future releases (v0.4.0+):

- User-customizable Safety Switch rules
- Predictive Safety Switch (activate before errors)
- A/B testing of conservative mode strategies
- Safety Switch analytics dashboard
- Configurable conservative mode behavior
- Per-agent Safety Switch settings

---

## Dependencies & Prerequisites

### External Dependencies
- None (uses existing infrastructure)

### Internal Dependencies
- Feature 2: Cost Guard (for budget checking)
- Feature 4: Harness Trace (for logging)
- LLM Client (for error handling integration)

### Prerequisites
- Database migration must run before Safety Switch can log events
- localStorage must be available (fallback to in-memory if not)

---

## Rollback Plan

If critical issues arise:

1. **Disable Safety Switch checks in LLM client:**
   - Comment out Safety Switch activation logic
   - System falls back to existing error handling

2. **Hide UI banner:**
   - Conditional render based on feature flag
   - `NEXT_PUBLIC_ENABLE_SAFETY_SWITCH=false`

3. **Revert database migration:**
   - Drop `safety_switch_events` table
   - No impact on existing functionality

---

## Success Metrics

1. **Stability:** Zero additional crashes introduced by Safety Switch
2. **Coverage:** All error types detected and handled
3. **User Experience:** Clear communication, easy recovery
4. **Performance:** <5ms overhead per LLM call
5. **Testing:** 100% pass rate on all tests

---

## Notes for Implementation

1. **Follow Existing Patterns:**
   - Match error handling style in `/lib/llm/client.ts`
   - Match UI component style in `/components/cost/BudgetAlert.tsx`
   - Match testing patterns in `__tests__/`

2. **Logging:**
   - Log ALL Safety Switch events to Harness Trace
   - Use `SAFETY_SWITCH` event type
   - Include full context in metadata

3. **Error Messages:**
   - User-friendly language (avoid technical jargon)
   - Actionable next steps
   - Clear recovery path

4. **Conservative Mode:**
   - Never more expensive than normal mode
   - Always cheaper model (deepseek-chat)
   - Always reduced context
   - Always disabled expensive features

5. **Recovery Logic:**
   - Auto-recovery after 1 success (not immediate)
   - Manual override always works (no blocking)
   - Budget check before recovery (prevent re-activation)
   - Recent error check (prevent flapping)

---

## Conclusion

This specification provides a complete blueprint for implementing the Safety Switch feature. The design follows existing architectural patterns, integrates cleanly with current systems, and provides comprehensive error handling with clear user communication.

The estimated timeline is **6-10 days** of focused development, with the complexity justified by multi-system integration, sophisticated recovery logic, and high stability requirements.
