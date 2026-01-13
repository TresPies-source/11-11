# Supervisor Router Test Suite

Comprehensive unit tests for the Supervisor Router feature (v0.3.1).

## Test Structure

```
__tests__/
├── agents/
│   ├── supervisor.test.ts      # Agent registry & routing logic
│   ├── fallback.test.ts        # Fallback handling & error scenarios  
│   ├── cost-tracking.test.ts   # Routing cost tracking (requires browser)
│   └── handoff.test.ts         # Agent handoff system (requires browser)
└── run-tests.ts                # Test runner script
```

## Running Tests

### Run All Node.js Tests (Recommended)
```bash
npx tsx __tests__/run-tests.ts --skip-db
```

### Run Specific Test Files
```bash
# Supervisor & routing tests
npx tsx __tests__/agents/supervisor.test.ts

# Fallback logic tests  
npx tsx __tests__/agents/fallback.test.ts

# Cost tracking tests (requires browser)
npx tsx __tests__/agents/cost-tracking.test.ts

# Handoff system tests (requires browser)
npx tsx __tests__/agents/handoff.test.ts
```

## Test Categories

### 1. Node.js Tests (✅ Can run anywhere)

These tests don't require a database and can run in any Node.js environment:

#### **supervisor.test.ts** - Agent Registry & Routing
- ✅ Registry loading and validation
- ✅ Agent retrieval (by ID, default agent)
- ✅ Agent ID validation
- ✅ Registry hot-reloading
- ✅ Agent structure validation
- ✅ Query routing with keyword fallback
- ✅ Empty query handling
- ✅ Conversation context support
- ✅ Error handling (no agents available)

**Coverage:** 12 test cases, all core routing logic

#### **fallback.test.ts** - Fallback Logic  
- ✅ Never throws errors (fail-safe)
- ✅ Always returns valid agent ID
- ✅ Empty query handling
- ✅ Whitespace query handling
- ✅ Missing agents (loads from registry)
- ✅ Search query routing
- ✅ Conflict query routing
- ✅ Confidence score validation (0-1 range)
- ✅ Reasoning string validation
- ✅ Agent name validation
- ✅ Very long query handling
- ✅ Long conversation context
- ✅ Special characters in query
- ✅ Performance (<1 second in dev mode)
- ✅ Invalid session_id handling
- ✅ Mixed intent query handling

**Coverage:** 28 assertions, comprehensive fallback scenarios

### 2. Browser Tests (⚠️ Require browser environment)

These tests use PGlite with IndexedDB and need a browser environment:

#### **cost-tracking.test.ts** - Routing Cost Tracking
- Cost calculation accuracy (GPT-4o-mini pricing)
- Database persistence and retrieval
- Foreign key relationships
- Session aggregation
- Routing history queries
- Token usage breakdown (input/output tokens)

**Coverage:** 30+ assertions, full cost tracking pipeline

#### **handoff.test.ts** - Agent Handoff System
- Handoff event storage
- Handoff history retrieval
- Last handoff retrieval
- Handoff count queries
- Validation: missing session_id
- Validation: missing from_agent
- Validation: missing to_agent
- Validation: same agent (prevent self-handoff)
- Validation: missing reason
- Validation: missing user_intent
- Validation: invalid conversation_history
- Validation: invalid from_agent
- Validation: invalid to_agent
- Conversation history preservation
- Harness trace ID handling
- Multiple handoff tracking

**Coverage:** 20 test cases, all handoff scenarios

## Why Database Tests Fail in Node.js

The database tests use **PGlite** with an **IndexedDB backend** (`idb://11-11-db`). IndexedDB is a browser-only API and is not available in Node.js.

**Error you'll see:**
```
TypeError: Cannot read properties of null (reading 'open')
```

**Solutions:**
1. ✅ **Skip database tests:** Use `--skip-db` flag (recommended for CI/CD)
2. Run tests in browser environment (Playwright, Puppeteer)
3. Mock PGlite/IndexedDB in tests (complex)
4. Use in-memory PGlite backend for tests (requires configuration change)

## Test Coverage Summary

| Category | Tests | Status | Environment |
|----------|-------|--------|-------------|
| Routing Logic | 12 cases | ✅ Pass | Node.js |
| Fallback Handling | 28 assertions | ✅ Pass | Node.js |
| Cost Tracking | 30+ assertions | ⚠️ Browser-only | Browser |
| Handoff System | 20 cases | ⚠️ Browser-only | Browser |
| **Total** | **90+ tests** | **40 pass in Node.js** | **Mixed** |

## Test Philosophy

### Console-Based Testing
This project uses **console-based tests** instead of a test framework like Jest or Vitest. 

**Why?**
- No additional dependencies
- Simple, readable test code
- Easy to debug (just run the file)
- Follows existing project patterns

**Pattern:**
```typescript
function assert(condition: boolean, testName: string, message?: string): void {
  testCount++;
  if (condition) {
    passedTests++;
    console.log(`✓ ${testName}`);
  } else {
    console.error(`✗ ${testName}${message ? `: ${message}` : ''}`);
    process.exit(1);
  }
}
```

### Dev Mode Testing
All routing tests work in **dev mode** (no OpenAI API key required):

- Uses **keyword-based fallback routing**
- Keywords: search, find, lookup → Librarian
- Keywords: conflict, wrong, error, debug → Debugger  
- Default: Dojo

This allows comprehensive testing without API costs.

## Continuous Integration

For CI/CD pipelines, skip database tests:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npx tsx __tests__/run-tests.ts --skip-db
```

This ensures:
- ✅ Core routing logic is verified
- ✅ Fallback handling is verified
- ✅ No browser environment needed
- ✅ Fast test execution (<5 seconds)

## Future Improvements

1. **Add browser test runner** (Playwright/Puppeteer)
2. **Add in-memory PGlite option** for testing
3. **Add integration tests** with full API flow
4. **Add performance benchmarks** (routing latency)
5. **Add test coverage reporting**

## Test Results Example

```
╔══════════════════════════════════════════════════════════════╗
║       Supervisor Router Test Suite                          ║
╚══════════════════════════════════════════════════════════════╝

======================================================================
Running: Agent Registry & Routing
File: supervisor.test.ts
======================================================================

✓ Registry loaded successfully with 3 agents
✓ Found 3 available agents
✓ Default agent: Dojo Agent (dojo)
✓ Dojo Agent: Dojo Agent
✓ Librarian Agent: Librarian Agent
✓ Debugger Agent: Debugger Agent
...
✅ All routing tests passed!

======================================================================
Running: Fallback Logic  
File: fallback.test.ts
======================================================================

✓ Should return a decision
✓ Agent ID should be defined
✓ Should be marked as fallback
...
==================================================
Tests completed: 28/28 passed
==================================================

╔══════════════════════════════════════════════════════════════╗
║                    Test Summary                              ║
╚══════════════════════════════════════════════════════════════╝

Node.js Tests (can run anywhere):
  ✅ PASS  Agent Registry & Routing
  ✅ PASS  Fallback Logic

Browser Tests (require browser environment):
  ⏭️  SKIP  Cost Tracking
  ⏭️  SKIP  Handoff System

──────────────────────────────────────────────────────────────────
Node.js Tests:  2/2 passed
Browser Tests:  0/2 passed, 2 skipped
Total:          2/4 passed
──────────────────────────────────────────────────────────────────

✅ All Node.js tests passed! Core routing logic is verified.
```
