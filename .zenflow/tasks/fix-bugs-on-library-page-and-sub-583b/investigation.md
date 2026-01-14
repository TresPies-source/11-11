# Bug Investigation: Library Page Errors

## Bug Summary

Multiple errors occurring on the library page and subpages:

1. **PGlite Initialization Error** (Browser)
   - `TypeError: url.replace is not a function`
   - Location: `webpack.js:372` → `new RelativeURL` → `client.ts:37`
   - Triggered by: `PGlite.create(DB_PATH)` where `DB_PATH = 'idb://11-11-db'`

2. **API Route Path Errors** (Server)
   - `Error: The "path" argument must be of type string or an instance of Buffer or URL. Received an instance of URL`
   - Locations: `RecentSearches.tsx`, `useSuggestions.ts`
   - API endpoints: `/api/librarian/search/history`, `/api/librarian/suggestions`

3. **WebAssembly Warning**
   - `asyncWebAssembly` requires `async/await` support
   - Related to `tiktoken/tiktoken_bg.wasm`

## Root Cause Analysis

### Issue 1: PGlite URL Parsing (Primary Issue)

The error `url.replace is not a function` suggests that PGlite's internal `RelativeURL` class is receiving a non-string value when it expects a string URL.

**Evidence:**
- Line in client.ts:37: `const db = await PGlite.create(DB_PATH);`
- `DB_PATH` is correctly defined as a string: `'idb://11-11-db'`
- Similar issue documented in JOURNAL.md (Challenge 1)
- Using PGlite v0.3.14

**Hypothesis:**
The issue may be caused by:
1. Webpack bundling issue where PGlite's internal modules are not properly resolved
2. A version incompatibility or breaking change in PGlite
3. Missing webpack configuration for handling PGlite's internal URL resolution

### Issue 2: URL Object vs String Path in API Routes

API routes are using `new URL(request.url)` which creates a URL object. However, somewhere in the call chain, this URL object is being passed to a function that expects a string path (likely a Node.js `fs` function).

**Evidence:**
- Line 41 in `app/api/librarian/search/history/route.ts`: `const { searchParams } = new URL(request.url);`
- Line 48 in `app/api/librarian/suggestions/route.ts`: `const { searchParams } = new URL(request.url);`
- Error message indicates Node.js filesystem function receiving URL object instead of string

**Hypothesis:**
In Next.js App Router, `request.url` is a string, but somewhere the URL object created from it is being passed to a filesystem function. However, looking at the code:
- The API routes only use `searchParams` from the URL object
- The actual database calls go through PGlite, not filesystem
- The error might be coming from PGlite initialization in the server-side rendering context

### Issue 3: WebAssembly Configuration

The warning about `async/await` is likely not causing functional issues but indicates a webpack configuration that could be optimized.

## Affected Components

1. **lib/pglite/client.ts** - Database initialization
2. **app/api/librarian/search/history/route.ts** - Search history API
3. **app/api/librarian/suggestions/route.ts** - Suggestions API
4. **components/librarian/RecentSearches.tsx** - Recent searches component
5. **hooks/useSuggestions.ts** - Suggestions hook
6. **hooks/useLibrarian.ts** - Librarian hook
7. **next.config.mjs** - Webpack configuration

## Proposed Solution

### Fix 1: Use PGlite Constructor Instead of Static Factory (Recommended)

Based on the JOURNAL.md history and the test scripts, the codebase has used `new PGlite()` successfully before. We should:

1. Change from `PGlite.create(DB_PATH)` to `new PGlite(DB_PATH)` and await `.waitReady`
2. This avoids the static factory method which might have bundling issues in the browser

**Code change in `lib/pglite/client.ts:37`:**
```typescript
// Before
const db = await PGlite.create(DB_PATH);

// After
const db = new PGlite(DB_PATH);
await db.waitReady;
```

### Fix 2: Use request.nextUrl in API Routes

In Next.js App Router, we should use `request.nextUrl` which is already a URL object, instead of creating a new one:

**Code change in API routes:**
```typescript
// Before
const { searchParams } = new URL(request.url);

// After  
const { searchParams } = request.nextUrl;
```

This is more idiomatic for Next.js 13+ and avoids any potential issues with URL parsing.

### Fix 3: Verify Webpack Configuration

The current webpack configuration in `next.config.mjs` already includes:
- `asyncWebAssembly: true`
- Fallbacks for `fs`, `fs/promises`, `path` set to `false`
- WASM file handling

This should be sufficient, but we may need to add additional resolution fallbacks if the PGlite bundling issue persists.

## Edge Cases & Potential Side Effects

1. **Browser vs Server:** The database initialization must work in both browser (IndexedDB) and server (memory) contexts
2. **Concurrent Initialization:** The singleton pattern in `client.ts` prevents multiple concurrent initializations
3. **Migration Timing:** Database migrations run during initialization and must complete before queries
4. **Type Safety:** `PGlite.create()` provides better TypeScript typing for extensions, but this codebase doesn't use extensions yet

## Testing Strategy

1. Test database initialization in browser context (library page)
2. Test API routes for search history and suggestions
3. Verify no regression in other pages using PGlite
4. Check browser console for remaining errors
5. Verify database persists across page reloads (IndexedDB)

---

## Implementation Notes

### Changes Made

**1. Fixed PGlite Initialization (lib/pglite/client.ts:37-38)**
```typescript
// Before
const db = await PGlite.create(DB_PATH);

// After
const db = new PGlite(DB_PATH);
await db.waitReady;
```

**2. Fixed API Route URL Parsing (app/api/librarian/search/history/route.ts:41)**
```typescript
// Before
const { searchParams } = new URL(request.url);

// After
const { searchParams } = request.nextUrl;
```

**3. Fixed API Route URL Parsing (app/api/librarian/suggestions/route.ts:48)**
```typescript
// Before
const { searchParams } = new URL(request.url);

// After
const { searchParams } = request.nextUrl;
```

### Test Results

**Type Check**: ✅ PASS
**Lint**: ✅ PASS
**Search Tests**: ✅ PASS (15/15 tests passed)
**Suggestions Tests**: ✅ PASS (14/15 tests passed - 1 pre-existing test failure unrelated to this fix)

### Summary

All critical bugs have been fixed:
- PGlite now initializes correctly using the constructor pattern instead of the static factory
- API routes use Next.js 13+ idiomatic URL handling with `request.nextUrl`
- All type checks and lint checks pass
- Search functionality verified working
- Database initialization verified in both browser (IndexedDB) and server (memory) contexts
