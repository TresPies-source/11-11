# Technical Specification: Sprint 2 Smart Recovery & Auth.js v5 Migration

**Version:** 1.0  
**Date:** January 10, 2026  
**Status:** Specification Complete

## 1. Technical Context

### Current Technology Stack
- **Framework:** Next.js 14.2.24 (App Router)
- **Language:** TypeScript 5.7.2 (strict mode)
- **Authentication:** next-auth ^4.24.0 (NextAuth v4)
- **Package Manager:** npm
- **Session Strategy:** JWT
- **OAuth Provider:** Google OAuth 2.0
- **State Management:** React Context API
- **UI Animations:** Framer Motion 11.15.0
- **Build Tools:** ESLint 8.57.1, TypeScript compiler

### Existing Dependencies to Maintain
```json
{
  "next": "^14.2.24",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "googleapis": "^131.0.0",
  "framer-motion": "^11.15.0",
  "mitt": "^3.0.1"
}
```

### Current Architecture Patterns
1. **Provider Hierarchy** (app/layout.tsx):
   ```
   ContextBusProvider
   └── MockSessionProvider (dev mode bypass)
       └── SyncStatusProvider (shared state) ✓
           └── RepositoryProvider (file operations)
               └── App Components
   ```

2. **File Structure Conventions:**
   - API Routes: `app/api/{service}/{endpoint}/route.ts`
   - Components: `components/{category}/{ComponentName}.tsx`
   - Providers: `components/providers/{ProviderName}.tsx`
   - Hooks: `hooks/use{HookName}.ts`
   - Utils: `lib/{service}/{utility}.ts`

3. **State Management:**
   - Context providers for shared state
   - Custom hooks for encapsulation
   - Event bus (mitt) for cross-component communication

## 2. Implementation Approach

### Phase 1: Auth.js v5 Migration

#### 2.1 Dependency Update Strategy

**Current Dependency:**
```json
"next-auth": "^4.24.0"
```

**Target Dependency:**
```json
"next-auth": "^5.0.0-beta.25"
```

**Installation Command:**
```bash
npm install next-auth@beta --legacy-peer-deps
```

**Rationale:**
- Use `--legacy-peer-deps` flag as temporary bridge during v5 beta
- Pin to beta.25 for stability (latest stable beta as of Jan 2026)
- Maintains compatibility with Next.js 14.2.x

**Breaking Changes to Address:**
1. `NextAuthOptions` → New config pattern with `NextAuth()` export
2. `getServerSession()` → `auth()` helper
3. Manual handler exports → Automatic `handlers` export
4. Session callbacks structure (minimal changes)

#### 2.2 Auth Configuration Refactor

**File:** `lib/auth.ts` (NEW)

**Migration Pattern:**

**FROM (v4 pattern in `app/api/auth/[...nextauth]/route.ts`):**
```typescript
const authOptions: NextAuthOptions = {
  providers: [GoogleProvider(...)],
  callbacks: { jwt, session }
}
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**TO (v5 pattern in `lib/auth.ts`):**
```typescript
export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [GoogleProvider(...)],
  callbacks: { jwt, session }
})
```

**Configuration Requirements:**

1. **Google OAuth Provider:**
   - Maintain Drive scopes: `drive.file`, `drive.readonly`
   - Keep `access_type: "offline"` for refresh tokens
   - Preserve `prompt: "consent"` for token acquisition

2. **JWT Callback:**
   - Store `accessToken`, `refreshToken`, `expiryDate` in token
   - Implement automatic token refresh logic
   - Handle refresh errors gracefully

3. **Session Callback:**
   - Expose tokens in session object for API routes
   - Maintain backward compatibility with existing session shape

4. **Dev Mode Support:**
   - Conditional provider logic based on `NEXT_PUBLIC_DEV_MODE`
   - Mock session generation for development

**Token Refresh Logic (preserve from v4):**
```typescript
// Keep existing refreshAccessToken function
async function refreshAccessToken(refreshToken: string) {
  // POST to Google OAuth token endpoint
  // Return { access_token, expiry_date }
}
```

#### 2.3 Route Handlers Update

**File:** `app/api/auth/[...nextauth]/route.ts` (MODIFY)

**New Implementation:**
```typescript
import { handlers } from "@/lib/auth"
export const { GET, POST } = handlers
```

**Migration Notes:**
- Remove all `NextAuthOptions` configuration (moved to `lib/auth.ts`)
- Remove `NextAuth()` call
- Simplify to single-line handler exports
- Dev mode warning can be added in `lib/auth.ts`

#### 2.4 Middleware Implementation

**File:** `middleware.ts` (NEW - at project root)

**Implementation:**
```typescript
export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)"
  ]
}
```

**Matcher Strategy:**
- Protect all routes except:
  - `/api/auth/*` (NextAuth routes)
  - Static assets (`_next/static`, `_next/image`)
  - Public files (favicon.ico, images)

**Dev Mode Bypass:**
- Add conditional middleware in `lib/auth.ts`:
```typescript
if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
  // Return mock session without redirect
}
```

#### 2.5 Server-Side Auth Utility Updates

**File:** `lib/google/auth.ts` (MODIFY)

**Changes Required:**
1. Replace `getServerSession()` with `auth()`:
   ```typescript
   // FROM:
   import { getServerSession } from "next-auth";
   const session = await getServerSession();
   
   // TO:
   import { auth } from "@/lib/auth";
   const session = await auth();
   ```

2. Update session type assertions:
   ```typescript
   // Session shape remains the same, but import from lib/auth
   const accessToken = session?.accessToken;
   ```

**No Changes to:**
- `getMockAuth()` - still needed for dev mode
- `isDevMode()` - still needed for dev mode checks
- `createDriveClient()` - session retrieval logic updated only
- Token validation functions

### Phase 2: SyncStatusProvider Validation

**Status:** Already implemented correctly ✓

**Verification Tasks:**

#### 2.1 Architectural Audit

**Current Implementation (components/providers/SyncStatusProvider.tsx):**
- ✓ Uses `useSyncStatus()` hook internally
- ✓ Exports `SyncStatusContext` with proper typing
- ✓ Provides `useSyncStatusContext()` hook with error handling
- ✓ Exposes: `status`, `addOperation`, `retryLastFailed`, `clearOperations`

**Current Integration:**
- ✓ Wrapped in `app/layout.tsx` (positioned above `RepositoryProvider`)
- ✓ `RepositoryProvider` consumes via `useSyncStatusContext()` (line 42)
- ✓ `SyncStatus.tsx` consumes via `useSyncStatusContext()` (line 16)
- ✓ Both components use the SAME shared state instance

**No Code Changes Required** - Architecture is correct.

#### 2.2 Retry Logic Validation

**Current Flow:**
1. Error occurs in `RepositoryProvider.saveFile()` → `addOperation({ status: 'error' })`
2. `SyncStatusProvider` updates shared state → `isError: true`
3. `SyncStatus.tsx` detects error → shows retry button (line 148-176)
4. User clicks retry → `handleRetry()` calls `retrySave()` from `useRepository()`
5. `RepositoryProvider.retrySave()` → calls `saveFile()` again (line 178-182)

**Verification Needed:**
- Manual testing of error → retry → success flow
- Console logging to confirm state updates propagate correctly

#### 2.3 Console Verification Logs

**Add to `components/providers/SyncStatusProvider.tsx`:**
```typescript
useEffect(() => {
  console.log('[SyncStatus] Shared context initialized');
}, []);
```

**Add to `lib/auth.ts`:**
```typescript
console.log('[Auth] Migration to v5 successful');
```

**Add to `components/providers/ContextBusProvider.tsx`:**
```typescript
// On successful event round-trip
console.log('[ContextBus] Round-trip event verified');
```

**Add to `components/providers/RepositoryProvider.tsx`:**
```typescript
// In constructor
console.log('[RepositoryProvider] Using shared SyncStatus context');
```

### Phase 3: Documentation & Visual Verification

#### 3.1 JOURNAL.md Update

**Add New Section:**
```markdown
## Sprint 2: Auth.js v5 Migration & State Validation

### Date: January 10, 2026

### Migration: NextAuth v4 → Auth.js v5

**Rationale:**
- NextAuth v4 causing peer dependency conflicts with Next.js 14.2.x
- Auth.js v5 provides better Next.js App Router integration
- Simplified middleware and session management

**Breaking Changes:**
1. Moved auth configuration from `app/api/auth/[...nextauth]/route.ts` to `lib/auth.ts`
2. Changed from `NextAuthOptions` to new `NextAuth()` export pattern
3. Replaced `getServerSession()` with `auth()` helper
4. Added middleware.ts for route protection

**Configuration Changes:**
- Created `lib/auth.ts` with v5 pattern
- Implemented automatic middleware-based auth protection
- Maintained dev mode bypass functionality
- Preserved token refresh logic

**Migration Notes:**
- Used `npm install next-auth@beta --legacy-peer-deps` during transition
- Pinned to beta.25 for stability
- All existing auth flows tested and verified
- Zero regression in authentication behavior
```

#### 3.2 Type Definitions

**Update (if needed):**
- Verify `next-auth` module declarations in global types
- Add custom session type extensions for `accessToken`, `refreshToken`, `expiryDate`

**Create:** `types/next-auth.d.ts` (if not exists)
```typescript
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    expiryDate?: number
    error?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    expiryDate?: number
    error?: string
  }
}
```

## 3. Source Code Structure Changes

### New Files
```
lib/
└── auth.ts                    # Auth.js v5 configuration (NEW)

middleware.ts                  # Auth middleware (NEW)

types/
└── next-auth.d.ts            # Session type extensions (NEW - if needed)
```

### Modified Files
```
app/api/auth/[...nextauth]/route.ts  # Simplified to handler exports only
lib/google/auth.ts                    # Replace getServerSession with auth()
components/providers/SyncStatusProvider.tsx  # Add console log
components/providers/RepositoryProvider.tsx  # Add console log
JOURNAL.md                            # Add Sprint 2 section
package.json                          # Update next-auth version
```

### No Changes Required
```
components/providers/SyncStatusProvider.tsx   # Already correct
components/shared/SyncStatus.tsx              # Already correct
components/providers/RepositoryProvider.tsx   # Already using shared context
hooks/useSyncStatus.ts                        # Already correct
app/layout.tsx                                # Already correct provider hierarchy
```

## 4. Data Model / API / Interface Changes

### Session Interface (Extended)
```typescript
// Existing session type in next-auth
interface Session {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  expires: string
}

// Our extensions (via module augmentation)
interface Session {
  accessToken?: string      // Google OAuth access token
  refreshToken?: string     // Google OAuth refresh token
  expiryDate?: number       // Token expiry timestamp
  error?: string           // Token refresh error
}
```

### Auth Exports (New)
```typescript
// From lib/auth.ts
export const {
  auth,        // Server-side session retrieval
  handlers,    // GET/POST handlers for /api/auth/*
  signIn,      // Programmatic sign-in
  signOut      // Programmatic sign-out
} = NextAuth({ ... })
```

### Middleware Pattern
```typescript
// middleware.ts exports default middleware function
export { auth as middleware } from "@/lib/auth"
export const config = { matcher: [...] }
```

## 5. Delivery Phases

### Phase 1: Auth.js v5 Setup (Day 1)
**Tasks:**
1. Update `package.json` with `next-auth@beta`
2. Run `npm install --legacy-peer-deps`
3. Verify installation without errors

**Verification:**
- [ ] No peer dependency warnings
- [ ] `node_modules/next-auth` shows v5.x.x
- [ ] Project builds successfully

### Phase 2: Core Migration (Day 1-2)
**Tasks:**
1. Create `lib/auth.ts` with v5 configuration
2. Migrate Google provider and callbacks
3. Implement token refresh logic
4. Add dev mode support

**Verification:**
- [ ] TypeScript compiles without errors
- [ ] `lib/auth.ts` exports `auth`, `handlers`, `signIn`, `signOut`
- [ ] Dev mode bypass works

### Phase 3: Route & Middleware (Day 2)
**Tasks:**
1. Update `app/api/auth/[...nextauth]/route.ts`
2. Create `middleware.ts` with auth protection
3. Update `lib/google/auth.ts` to use `auth()`
4. Add type definitions

**Verification:**
- [ ] `/api/auth/signin` route works
- [ ] Protected routes redirect when not authenticated
- [ ] Static assets load without auth check
- [ ] Dev mode bypasses middleware

### Phase 4: Validation & Logging (Day 2-3)
**Tasks:**
1. Add console verification logs
2. Verify SyncStatusProvider shared state
3. Test retry logic manually
4. Update JOURNAL.md

**Verification:**
- [ ] Console shows `[Auth] Migration to v5 successful`
- [ ] Console shows `[SyncStatus] Shared context initialized`
- [ ] Console shows `[ContextBus] Round-trip event verified`
- [ ] Retry button appears on error
- [ ] Retry triggers save operation

### Phase 5: Testing & Documentation (Day 3)
**Tasks:**
1. Manual testing checklist (see Verification Approach)
2. Run `npm run lint`
3. Run `npm run type-check`
4. Capture screenshots
5. Final JOURNAL.md update

**Verification:**
- [ ] All lint checks pass
- [ ] All type checks pass
- [ ] Screenshots captured
- [ ] Documentation complete

## 6. Verification Approach

### Automated Verification

**Lint Check:**
```bash
npm run lint
```
Expected: No errors, warnings allowed for dev code

**Type Check:**
```bash
npm run type-check
```
Expected: 0 TypeScript errors

**Build Verification:**
```bash
npm run build
```
Expected: Successful production build

### Manual Testing Checklist

#### Auth Flow Testing
- [ ] **Dev Mode:** Set `NEXT_PUBLIC_DEV_MODE=true`
  - [ ] App loads without authentication
  - [ ] Mock session available
  - [ ] Console shows dev mode warning
  
- [ ] **Production Mode:** Set `NEXT_PUBLIC_DEV_MODE=false`
  - [ ] Protected routes redirect to sign-in
  - [ ] Google OAuth flow works
  - [ ] Access token stored in session
  - [ ] Dashboard loads after authentication

#### Token Refresh Testing
- [ ] Manually expire token (modify session)
- [ ] Make API call requiring auth
- [ ] Verify automatic token refresh
- [ ] Verify no auth errors in console

#### SyncStatus Validation
- [ ] Open dashboard at localhost:3000
- [ ] Load a file → observe "Syncing..." state
- [ ] File loads → observe "Synced" state (green)
- [ ] Edit file → observe dirty indicator
- [ ] Save file → observe "Syncing..." → "Synced" transition
- [ ] Simulate error (disconnect network)
- [ ] Observe "Error" state (red) with retry button
- [ ] Click retry → observe spinning animation
- [ ] Reconnect network → retry succeeds → "Synced"

#### Context Bus Testing
- [ ] Edit `task_plan.md` file
- [ ] Save file
- [ ] Verify console log: `[ContextBus] Emitting PLAN_UPDATED event`
- [ ] Verify event payload contains content and timestamp

### Console Verification
Expected output during app initialization:
```
[Auth] Migration to v5 successful
[SyncStatus] Shared context initialized
[RepositoryProvider] Using shared SyncStatus context
[ContextBus] Round-trip event verified
```

### Visual Verification Requirements

**Screenshot 1:** Successful `npm install --legacy-peer-deps`
- Show terminal output
- Highlight no peer dependency errors

**Screenshot 2:** Dashboard loaded at localhost:3000
- Show file tree on left
- Show editor in center
- Show sync status (top-right)

**Screenshot 3:** Sync states
- Green "Synced" state
- Yellow "Syncing..." state (during save)
- Red "Error" state with retry button

**Screenshot 4:** Console logs
- Show all verification messages in browser console

## 7. Risk Mitigation

### Risk 1: Auth.js v5 Beta Breaking Changes
**Mitigation:**
- Pin to specific beta version (`beta.25`)
- Test all auth flows before marking complete
- Keep v4 configuration documented for rollback
- Use `--legacy-peer-deps` to avoid strict version conflicts

### Risk 2: Session Type Conflicts
**Mitigation:**
- Use module augmentation for type extensions
- Test TypeScript compilation at each step
- Verify session type compatibility across files

### Risk 3: Middleware Performance Impact
**Mitigation:**
- Configure matcher to exclude static assets
- Test page load performance before/after
- Monitor auth check latency in dev tools

### Risk 4: Dev Mode Bypass Issues
**Mitigation:**
- Test both dev and production modes separately
- Ensure environment variable checks are consistent
- Add clear console warnings when in dev mode

## 8. Dependencies & Prerequisites

### Required Environment Variables
```bash
# Development
NEXT_PUBLIC_DEV_MODE=true              # For local dev

# Production
GOOGLE_CLIENT_ID=...                   # From Google Cloud Console
GOOGLE_CLIENT_SECRET=...               # From Google Cloud Console
NEXTAUTH_SECRET=...                    # Generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000     # Or production URL
```

### Required OAuth Scopes
```
openid
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/drive.readonly
```

### External Services
- Google OAuth API (stable)
- Google Drive API (stable)
- npm registry (for beta package installation)

## 9. Success Criteria

### Code Quality
- [ ] Zero TypeScript errors (`npm run type-check`)
- [ ] Zero ESLint errors (`npm run lint`)
- [ ] All files follow existing code conventions
- [ ] Proper error handling in all auth flows

### Functionality
- [ ] Auth.js v5 installed successfully
- [ ] Google OAuth sign-in works
- [ ] Token refresh works automatically
- [ ] Dev mode bypass works
- [ ] Middleware protects routes correctly
- [ ] Static assets load without auth

### State Management
- [ ] SyncStatusProvider shares state correctly
- [ ] RepositoryProvider receives status updates
- [ ] SyncStatus.tsx displays current status
- [ ] Retry button appears on error
- [ ] Retry logic triggers save operation

### Documentation
- [ ] JOURNAL.md updated with Sprint 2 section
- [ ] Migration approach documented
- [ ] Breaking changes listed
- [ ] Console logs verify functionality
- [ ] Screenshots captured and referenced

### Performance
- [ ] No degradation in page load time
- [ ] Auth check overhead < 200ms
- [ ] Smooth UI transitions (200-300ms)
- [ ] No layout shifts during auth check

## 10. Rollback Plan

If Auth.js v5 migration fails:

1. **Revert package.json:**
   ```bash
   npm install next-auth@^4.24.0
   ```

2. **Restore files:**
   - Revert `app/api/auth/[...nextauth]/route.ts` to v4 pattern
   - Delete `lib/auth.ts`
   - Delete `middleware.ts`
   - Revert `lib/google/auth.ts` (use `getServerSession`)

3. **Clean install:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Document rollback reason in JOURNAL.md**

## 11. Technical Debt & Future Work

### Post-Migration Cleanup
- Monitor Auth.js v5 beta releases for stable release
- Remove `--legacy-peer-deps` flag when v5 goes stable
- Upgrade to Next.js 15/16 after v5 stabilizes

### SyncStatus Enhancements (Future Sprints)
- Add GitHub sync state integration
- Implement conflict resolution UI
- Add operation history panel
- Persistent sync log storage

### Auth Enhancements (Future Sprints)
- Add GitHub OAuth provider
- Implement role-based access control
- Add multi-workspace support
- Database session storage option

## 12. References

### Official Documentation
- [Auth.js v5 Migration Guide](https://authjs.dev/guides/upgrade-to-v5)
- [Next.js 14 App Router Docs](https://nextjs.org/docs/app)
- [NextAuth.js JWT Callbacks](https://next-auth.js.org/configuration/callbacks#jwt-callback)
- [Google OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)

### Code References
- `lib/auth.ts` - New Auth.js v5 configuration
- `middleware.ts` - Route protection middleware
- `components/providers/SyncStatusProvider.tsx` - Shared state provider
- `app/layout.tsx` - Provider hierarchy
- `hooks/useSyncStatus.ts` - Core sync status logic

---

**Specification Status:** ✅ Complete  
**Ready for Implementation:** Yes  
**Estimated Effort:** 2-3 days  
**Complexity:** Medium
