# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification
<!-- chat-id: eab05e79-27ce-4db4-bdf7-84dbcfc19792 -->

**Complexity:** HARD  
**Status:** ✅ Complete

Created comprehensive technical specification in `spec.md` including:
- Multi-system integration architecture (LLM client, Cost Guard, Harness Trace, UI)
- 6 new files + 4 modified files
- Database schema for safety_switch_events table
- 26 unit tests, 8 integration tests, 6 E2E tests
- 6-phase implementation plan (6-10 days estimated)

---

### [x] Step: Phase 1 - Core Infrastructure
<!-- chat-id: 07e05a2e-5e88-44fe-be6e-0b18cfdd3be3 -->

**Goal:** Create Safety Switch types, state management, and core service

**Status:** ✅ Complete

**Tasks:**
1. ✅ Create `/lib/safety/types.ts` with SafetySwitchReason, SafetySwitchContext, SafetyStatus, RecoveryResult types
2. ✅ Create `/lib/safety/state.ts` with in-memory Map + localStorage persistence
3. ✅ Create `/lib/safety/switch.ts` with activateSafetySwitch(), deactivateSafetySwitch(), shouldActivateSafetySwitch(), getSafetyStatus()
4. ✅ Create `/lib/pglite/migrations/008_add_safety_switch.ts` for safety_switch_events table
5. ✅ Write unit tests in `__tests__/safety/switch.test.ts` (18 tests - exceeded requirement)

**Verification:**
- ✅ All 18 unit tests pass (100%)
- ✅ Type check passes (0 errors)
- ✅ Lint passes (0 errors, 0 warnings)

---

### [x] Step: Phase 2 - Conservative Mode & Recovery
<!-- chat-id: 6728d920-e0f9-4d61-b73b-17d618133e73 -->

**Goal:** Implement conservative mode logic and recovery mechanisms

**Status:** ✅ Complete

**Tasks:**
1. ✅ Create `/lib/safety/conservative-mode.ts` with applyConservativeMode(), isAllowedInConservativeMode(), getConservativeModel()
2. ✅ Create `/lib/safety/recovery.ts` with attemptAutoRecovery(), attemptManualRecovery(), isRecoverySafe(), trackSuccessfulOperation()
3. ✅ Write unit tests in `__tests__/safety/conservative-mode.test.ts` (9 tests - exceeded requirement)
4. ✅ Write unit tests in `__tests__/safety/recovery.test.ts` (8 tests - exceeded requirement)
5. ✅ Updated `deactivateSafetySwitch()` signature to support recovery type tracking

**Verification:**
- ✅ All 9 conservative mode tests pass (100%)
- ✅ All 8 recovery tests pass (100%)
- ✅ Type check passes (0 errors)
- ✅ Lint passes (0 errors, 0 warnings)

---

### [x] Step: Phase 3 - LLM Client Integration
<!-- chat-id: 68ef0505-2d6c-4f33-b6e5-5d415e41883d -->

**Goal:** Integrate Safety Switch into LLM client

**Status:** ✅ Complete

**Tasks:**
1. ✅ Modify `/lib/llm/client.ts`:
   - Import Safety Switch functions (getSafetyStatus, activateSafetySwitch, shouldActivateSafetySwitch, getErrorReason)
   - Import conservative mode functions (applyConservativeMode, getConservativeModel)
   - Import recovery tracking (trackSuccessfulOperation)
   - Add safety check at start of callWithFallback()
   - Apply conservative mode if active (force conservative model and options)
   - Add error handling to activate Safety Switch on primary model failure
   - Add error handling to activate Safety Switch on fallback model failure
   - Track successful operations for auto-recovery after successful calls
2. ✅ Write integration tests in `__tests__/safety/integration.test.ts` (8 tests covering LLM integration)

**Verification:**
- ✅ All 8 integration tests pass (100%)
- ✅ All 18 Safety Switch unit tests pass (100%)
- ✅ All 9 Conservative Mode tests pass (100%)
- ✅ All 8 Recovery tests pass (100%)
- ✅ Type check passes (0 errors)
- ✅ Lint passes (0 errors, 0 warnings)

---

### [x] Step: Phase 4 - Cost Guard Integration
<!-- chat-id: e56d5962-38a8-4eda-ba55-e9914efb2294 -->

**Goal:** Integrate Safety Switch with Cost Guard

**Status:** ✅ Complete

**Tasks:**
1. ✅ Modify `/lib/cost/budgets.ts`:
   - Import Safety Switch functions (activateSafetySwitch)
   - Add Safety Switch activation on query budget exhaustion
   - Add Safety Switch activation on session budget exhaustion
   - Add Safety Switch activation on user monthly budget exhaustion
2. ✅ Update integration tests in `__tests__/safety/integration.test.ts` (added 2 tests for Cost Guard)

**Verification:**
- ✅ All 10 integration tests pass (100%) - includes 2 new Cost Guard tests
- ✅ No existing Cost Guard tests (no regressions possible)
- ✅ Type check passes (0 errors)
- ✅ Lint passes (0 errors, 0 warnings)
- ✅ Budget exhaustion triggers Safety Switch correctly

---

### [x] Step: Phase 5 - UI Implementation
<!-- chat-id: 34a46a35-b02f-46fe-aa99-cadc6d819cfe -->

**Goal:** Create Safety Switch banner and integrate into UI

**Status:** ✅ Complete

**Tasks:**
1. ✅ Create `/components/safety/SafetySwitchBanner.tsx` component:
   - Banner with warning/error states (yellow theme)
   - "Try Again" button with loading state
   - Framer Motion animations
   - Dismissible with reappear logic
   - Poll for status updates every 1 second
   - 9 different reason messages
2. ✅ Create `/components/safety/index.ts` for easy imports
3. ✅ Modify `/components/layout/MainContent.tsx`:
   - Import SafetySwitchBanner and useSession
   - Add banner at top of content area (with margin)
   - Pass sessionId from user context
4. ✅ Update `/lib/harness/types.ts` to add 'SAFETY_SWITCH' event type
5. ✅ Update `/components/harness/TraceEventNode.tsx` to add SAFETY_SWITCH color (yellow)
6. ✅ Update `/components/harness/TraceTimelineView.tsx` to add SAFETY_SWITCH color (yellow)
7. ✅ Update `/lib/safety/switch.ts` to use 'SAFETY_SWITCH' event type (removed `as any`)
8. ✅ Update `/lib/safety/recovery.ts` to use 'SAFETY_SWITCH' event type and track recovery attempts
9. ✅ Write E2E tests in `__tests__/safety/e2e.test.ts` (6 tests)
10. ✅ Update `package.json` with test scripts (test:safety-e2e, test:safety)

**Verification:**
- ✅ All 6 E2E tests pass (100%)
- ✅ All 43 Safety Switch tests pass (18 unit + 9 conservative + 8 recovery + 10 integration + 6 E2E)
- ✅ Type check passes (0 errors)
- ✅ Lint passes (0 errors, 0 warnings)
- ✅ Production build succeeds (with pre-existing warnings unrelated to Safety Switch)

---

### [x] Step: Phase 6 - Documentation & Final Verification
<!-- chat-id: bd6dd408-899c-4bed-a904-7c4a1391baf6 -->

**Goal:** Complete documentation and verify production readiness

**Status:** ✅ Complete

**Tasks:**
1. ✅ Create `/lib/safety/README.md` with architecture, usage, API reference (1200+ lines)
2. ✅ Update `/JOURNAL.md` with Safety Switch architectural decisions
3. ✅ Update `/05_Logs/AUDIT_LOG.md` with test results and production readiness checklist
4. ✅ Run full test suite: `npm run test:safety` - All 43 tests pass (100%)
5. ✅ Run type check: `npm run type-check` - 0 errors
6. ✅ Run lint: `npm run lint` - 0 errors, 0 warnings
7. ✅ Build production: `npm run build` - Success (pre-existing warnings unrelated to Safety Switch)
8. ✅ Manual verification of all scenarios (LLM error, budget exhaustion, recovery)

**Verification:**
- ✅ All 43 tests pass (18 unit + 9 conservative + 8 recovery + 10 integration + 6 E2E)
- ✅ Zero TypeScript errors
- ✅ Zero lint errors/warnings
- ✅ Production build succeeds
- ✅ Documentation complete (README, JOURNAL, AUDIT_LOG)
- ✅ All verification steps completed

---

### [x] Step: Implementation Report

**Status:** ✅ Complete

Write final report to `{@artifacts_path}/report.md` describing:
- ✅ What was implemented (summary of 6 phases)
- ✅ How the solution was tested (43 tests + manual verification)
- ✅ The biggest issues or challenges encountered
- ✅ Production readiness status

**Report Created:** `.zenflow/tasks/v0-3-7-safety-switch-e4f4/report.md` (650+ lines)
