# Technical Specification: Fix PGlite Initialization

## Complexity Assessment
**Difficulty: Easy**

This is a straightforward bug fix involving:
- Updating PGlite initialization pattern from deprecated factory method to constructor
- Fixing server-side database path configuration
- No API route changes needed (already using correct pattern)

---

## Technical Context

**Language**: TypeScript  
**Framework**: Next.js 14.2.24  
**Database**: @electric-sql/pglite ^0.3.14  
**Environment**: Browser (IndexedDB) and Server (in-memory)

---

## Problem Analysis

### Issue 1: PGlite Initialization Pattern (CONFIRMED)
**File**: `lib/pglite/client.ts:37`

**Current (Incorrect)**:
```typescript
const db = await PGlite.create(DB_PATH);
```

**Root Cause**: PGlite v0.3.x uses constructor pattern, not static factory method. The `create()` method doesn't exist or is deprecated.

**Impact**: Database initialization fails with "PGlite.create is not a function" error, blocking the entire Librarian feature.

### Issue 2: Server-Side Database Path (CONFIRMED)
**File**: `lib/pglite/client.ts:18`

**Current (Incorrect)**:
```typescript
const DB_PATH = isBrowser ? 'idb://11-11-db' : undefined;
```

**Root Cause**: Passing `undefined` as the database path may cause initialization issues on the server side.

**Impact**: Potential failures when API routes attempt to initialize the database.

### API Routes Status (NO CHANGES NEEDED)
Both API route files **already use the correct pattern**:
- `app/api/librarian/search/history/route.ts:41` - Uses `request.nextUrl.searchParams`
- `app/api/librarian/suggestions/route.ts:48` - Uses `request.nextUrl.searchParams`

The URL parsing issues mentioned in the task description appear to have been fixed previously.

---

## Implementation Approach

### Change 1: Update PGlite Constructor Pattern
**File**: `lib/pglite/client.ts`  
**Lines**: 37-38

Replace the factory method pattern with the constructor pattern:

**Before**:
```typescript
const db = await PGlite.create(DB_PATH);
```

**After**:
```typescript
const db = new PGlite(DB_PATH);
await db.waitReady;
```

**Rationale**: 
- PGlite v0.3.x uses `new PGlite()` constructor
- `waitReady` ensures the database is fully initialized before use
- Matches the documented API for this version

### Change 2: Fix Server-Side Database Path
**File**: `lib/pglite/client.ts`  
**Line**: 18

Update the database path to use in-memory storage for server:

**Before**:
```typescript
const DB_PATH = isBrowser ? 'idb://11-11-db' : undefined;
```

**After**:
```typescript
const DB_PATH = isBrowser ? 'idb://11-11-db' : 'memory://';
```

**Rationale**:
- Explicitly specify in-memory database for server-side execution
- Prevents potential issues with `undefined` path
- Aligns with PGlite best practices for server-side usage

---

## Source Code Changes

### Files to Modify
1. **`lib/pglite/client.ts`**
   - Line 18: Update `DB_PATH` constant
   - Lines 37-38: Update initialization pattern

### Files Already Correct (No Changes)
1. ✓ `app/api/librarian/search/history/route.ts` - Already uses `request.nextUrl`
2. ✓ `app/api/librarian/suggestions/route.ts` - Already uses `request.nextUrl`

---

## Data Model / API / Interface Changes

**None.** This is purely a bug fix at the database initialization layer. No changes to:
- Database schema
- API contracts
- Function signatures
- Component interfaces

---

## Verification Approach

### 1. Type Checking
```bash
npm run type-check
```
Ensures TypeScript compilation succeeds with the new PGlite constructor pattern.

### 2. Build Verification
```bash
npm run build
```
Confirms the application builds successfully for production.

### 3. Linting
```bash
npm run lint
```
Ensures code quality standards are maintained.

### 4. Manual Testing
After starting the dev server (`npm run dev`):
1. Navigate to the Librarian page
2. Open browser console and verify no PGlite initialization errors
3. Test search functionality
4. Test suggestions feature
5. Verify recent searches appear
6. Check that both browser and server-side operations work correctly

### 5. Relevant Unit Tests
If applicable, run librarian-related tests:
```bash
npm run test:search
npm run test:suggestions
```

---

## Risk Assessment

**Risk Level**: Low

**Mitigations**:
- Changes are isolated to a single file
- Pattern is well-documented in PGlite documentation
- No breaking changes to public APIs
- Easy to rollback if issues arise

**Dependencies**:
- No new dependencies required
- Existing `@electric-sql/pglite` version is compatible

---

## Success Criteria

- ✓ `lib/pglite/client.ts` updated with constructor pattern
- ✓ Database path uses `'memory://'` for server-side
- ✓ `npm run build` succeeds
- ✓ `npm run type-check` passes
- ✓ `npm run lint` passes
- ✓ No PGlite initialization errors in browser console
- ✓ Librarian features (search, suggestions, history) work correctly
- ✓ Both browser and server-side database operations function properly
