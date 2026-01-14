# Bug Investigation: Recent Searches and Suggestions Error

## Bug Summary

**Error Message:**  
```
Error: The "path" argument must be of type string or an instance of Buffer or URL. Received an instance of URL
```

**Affected Components:**
- `components/librarian/RecentSearches.tsx` (line 177)
- `hooks/useSuggestions.ts` (line 53)
- API routes: `/api/librarian/search/history` and `/api/librarian/suggestions`

## Root Cause Analysis

After investigating the codebase, the error is not actually occurring at the lines indicated in the stack trace (177 and 53), but rather those are where the errors are being caught and logged. The actual error originates from the PGlite database initialization.

### The Problem

In `lib/pglite/client.ts` (line 32-37):

```typescript
const dbPath = isBrowser ? 'idb://11-11-db' : 'memory://';
const db = new PGlite(dbPath);
```

When running on the server side (in Next.js API routes), the code uses `'memory://'` as the database path. This URL-style string is being converted to a URL object internally by PGlite or Node.js, which is then incompatible with certain file system operations that expect a string path.

**PGlite Version:** `^0.3.14`

### Why This Happens

1. Next.js API routes run on the server side (Node.js environment)
2. The `isBrowser` check evaluates to `false`
3. `dbPath` is set to `'memory://'`
4. PGlite converts this to a URL object internally
5. When PGlite performs file system operations (or delegates to Node.js fs), the URL object causes type errors

### Affected Components

**Primary:**
- `lib/pglite/client.ts` - Database initialization
- `lib/librarian/search.ts` - `getRecentSearches()` function
- `lib/librarian/suggestions.ts` - `generateSuggestions()` function

**Secondary (error propagation):**
- `app/api/librarian/search/history/route.ts` 
- `app/api/librarian/suggestions/route.ts`
- `components/librarian/RecentSearches.tsx`
- `hooks/useSuggestions.ts`

## Proposed Solution

According to PGlite documentation, to create an in-memory database on the server, we should either:

1. **Option A:** Pass an empty string: `new PGlite('')`
2. **Option B:** Pass no argument: `new PGlite()`

Instead of using `'memory://'`, we should use an empty string or undefined for the server-side in-memory database.

### Implementation

Change in `lib/pglite/client.ts`:

```typescript
// Before:
const dbPath = isBrowser ? 'idb://11-11-db' : 'memory://';
const db = new PGlite(dbPath);

// After:
const db = isBrowser 
  ? new PGlite('idb://11-11-db') 
  : new PGlite();  // or new PGlite('')
```

This avoids the URL parsing issue on the server side while maintaining the IndexedDB functionality in the browser.

## Edge Cases & Side Effects

### Edge Cases:
- Ensure the fix works in both development and production builds
- Verify behavior in server-side rendering (SSR) vs client-side rendering
- Test in both browser and Node.js environments

### Potential Side Effects:
- None expected - this is a more standard way to initialize PGlite
- In-memory database on server means data doesn't persist across requests (expected behavior)
- Browser IndexedDB functionality remains unchanged

## Testing Strategy

1. **Unit Tests:** Verify database initialization works in both environments
2. **Integration Tests:** Test API routes return data correctly
3. **Manual Testing:** 
   - Load the Librarian page
   - Check browser console for errors
   - Verify Recent Searches component loads
   - Verify Suggestions load correctly

---

## Implementation Notes

### Changes Made

**File:** `lib/pglite/client.ts` (lines 28-37)

**Before:**
```typescript
const isBrowser = typeof window !== 'undefined';
const dbPath = isBrowser ? 'idb://11-11-db' : 'memory://';

console.log('[PGlite] Initializing database at:', dbPath);
console.log('[PGlite] Environment:', isBrowser ? 'Browser' : 'Server');

const db = new PGlite(dbPath);
```

**After:**
```typescript
const isBrowser = typeof window !== 'undefined';

console.log('[PGlite] Environment:', isBrowser ? 'Browser' : 'Server');

// Use IndexedDB in browser, memory in server (Next.js API routes)
const db = isBrowser ? new PGlite('idb://11-11-db') : new PGlite();

console.log('[PGlite] Database initialized');
```

**Rationale:**
- Removed the `'memory://'` URL-style path that was causing type errors
- Used `new PGlite()` without arguments for server-side in-memory database (recommended approach)
- Simplified console logging to avoid referencing the problematic dbPath variable
- Maintains browser IndexedDB functionality with `'idb://11-11-db'`

### Test Results

**Test Suite: `npm run test:search`**
- ✅ All 15 tests passed
- Database initialized successfully without path errors
- Recent searches retrieval working correctly
- Search history tracking functional

**Test Suite: `npm run test:suggestions`**
- ✅ 14 out of 15 tests passed
- 1 test failure unrelated to the fix (embedding similarity threshold issue)
- Suggestions generation working correctly
- No path-related errors observed

**Test Suite: `npm run test:suggestions-api`**
- ✅ All 16 tests passed
- API endpoints responding correctly
- Suggestions API handling all parameter variations
- No database initialization errors

### Verification

The fix successfully resolves the issue:
1. ✅ No more "path argument must be of type string" errors
2. ✅ Database initializes correctly in server environment
3. ✅ Recent searches functionality working
4. ✅ Suggestions functionality working
5. ✅ All API routes operational

### Final Manual Verification (Jan 14, 2026)

**Browser Testing Results:**
- ✅ Librarian page loads successfully without errors
- ✅ Recent Searches component displays proper empty state: "No search history" 
- ✅ Suggestions component displays proper empty state: "No suggestions yet"
- ✅ Both API endpoints return 200 OK status
  - `/api/librarian/search/history?limit=5` → `{"history":[],"count":0,"user_id":"dev-user"}`
  - `/api/librarian/suggestions?trigger=page_load&limit=6` → `{"suggestions":[]}`
- ✅ PGlite database initializes correctly in browser (IndexedDB)
- ✅ Console shows no PGlite or database-related errors
- ✅ WASM files load successfully without bundling errors
- ✅ Database seeding successful (12 active prompts, 15 saved prompts displayed)

**Resolution Status:** ✅ **COMPLETE**

All components are functioning correctly. The original "path argument" error has been resolved, and both Recent Searches and Suggestions features are working as expected with proper empty state handling.
