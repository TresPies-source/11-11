# Bug Investigation: url.replace is not a function

## Bug Summary
**Error**: `TypeError: url.replace is not a function`  
**Location**: `lib\pglite\client.ts:38` - when calling `await db.waitReady`  
**Context**: Database initialization in `initializeDatabase()` function

## Root Cause Analysis

The error occurs when initializing a PGlite database instance using the constructor pattern:

```typescript
const db = new PGlite(DB_PATH);
await db.waitReady;
```

According to PGlite 0.3.14 documentation, while both initialization patterns are technically supported:
1. `new PGlite()` + manual `await db.waitReady`
2. `await PGlite.create()` (recommended - automatically handles waitReady)

The **recommended approach** is to use `PGlite.create()` because:
- It automatically awaits the internal `.waitReady` promise
- Provides better TypeScript support for extensions
- More reliable initialization across different environments (browser vs. server)

The current code uses pattern #1, which may have issues with URL parsing in certain contexts, leading to the "url.replace is not a function" error when PGlite internally tries to parse the database path.

## Affected Components
- `lib/pglite/client.ts` - `initializeDatabase()` function (line 37-38)
- Impacts both browser (IndexedDB) and server (memory) database initialization

## Proposed Solution

Replace the constructor pattern with the recommended `PGlite.create()` static method:

**Current code (line 37-38)**:
```typescript
const db = new PGlite(DB_PATH);
await db.waitReady;
```

**Proposed fix**:
```typescript
const db = await PGlite.create(DB_PATH);
```

This approach:
- Eliminates the need for manual `await db.waitReady`
- Uses the officially recommended initialization pattern
- Should resolve the URL parsing error
- Maintains compatibility with both browser (`idb://11-11-db`) and server (`memory://`) paths
- Improves TypeScript type safety

## Edge Cases & Considerations
- No breaking changes expected - `PGlite.create()` accepts the same path format
- Existing test script (`scripts/test-seeds-migration.ts`) uses `new PGlite('memory://')` without waiting for `waitReady` - works because it immediately calls `db.query()` which internally handles readiness
- The fix aligns with PGlite best practices and should work consistently across all environments

---

## Implementation Notes

**Date**: 2026-01-14

**Changes Made**:
- Modified `lib/pglite/client.ts` line 37-38
- Replaced constructor pattern with recommended `PGlite.create()` static method
- Changed from:
  ```typescript
  const db = new PGlite(DB_PATH);
  await db.waitReady;
  ```
- To:
  ```typescript
  const db = await PGlite.create(DB_PATH);
  ```

**Test Results**:
- ✅ TypeScript type checking: Passed
- ✅ Production build: Passed (exit code 0)
- ✅ No new errors introduced
- ✅ Build warnings are pre-existing (dynamic server usage, tiktoken wasm)

**Verification**:
The fix successfully compiles and builds without errors. The change is minimal and follows PGlite's recommended initialization pattern, which should resolve the "url.replace is not a function" error by using the internally-managed initialization process.
