# Product Requirements Document: Sprint 2 Smart Recovery & Auth.js v5 Migration

**Version:** 1.0  
**Date:** January 10, 2026  
**Status:** Requirements Complete

## 1. Executive Summary

This sprint resolves the Next.js version conflict by migrating from NextAuth v4 to Auth.js v5, while validating and documenting the existing SyncStatusProvider shared state implementation. The migration will maintain compatibility with Next.js 14.2.x and prepare the codebase for future Next.js 15/16 upgrades.

## 2. Background & Context

### Current State
- **Authentication:** NextAuth v4.24.0 with custom JWT callbacks
- **Auth Configuration:** `app/api/auth/[...nextauth]/route.ts` using `NextAuthOptions` pattern
- **Session Management:** `MockSessionProvider` for dev mode bypass
- **Sync State:** `SyncStatusProvider` with shared context (already implemented)
- **Next.js Version:** 14.2.24
- **Dev Mode:** Supports mock authentication via `NEXT_PUBLIC_DEV_MODE=true`

### Observations from Codebase Audit
1. **SyncStatusProvider is already implemented correctly:**
   - Located at `components/providers/SyncStatusProvider.tsx`
   - Wraps `useSyncStatus` hook in a context
   - Already consumed by `RepositoryProvider` and `SyncStatus.tsx`
   - Properly positioned in layout hierarchy

2. **Retry logic is functional:**
   - `SyncStatus.tsx:63-67` implements retry button with `retrySave()` from `useRepository`
   - `RepositoryProvider.tsx:178-182` implements `retrySave()` that triggers `saveFile()`
   - Error state is properly tracked in shared context

3. **Auth.js v4 limitations:**
   - Using deprecated NextAuthOptions pattern
   - No middleware protection
   - Version conflicts with newer Next.js features
   - Manual session handling on client

## 3. Problem Statement

**Primary Issue:** NextAuth v4 is causing peer dependency warnings and blocking future Next.js upgrades.

**Secondary Issue:** Need to verify and document that the SyncStatusProvider shared state is working as designed (preliminary review shows it is).

## 4. Goals & Success Criteria

### Primary Goals
1. **Migrate to Auth.js v5** (next-auth@beta)
   - Update package.json dependency
   - Refactor auth configuration to v5 syntax
   - Implement v5 middleware pattern
   - Maintain dev mode compatibility
   - Zero regression in authentication flow

2. **Validate SyncStatusProvider Implementation**
   - Verify shared state working across components
   - Confirm retry logic functionality
   - Document architecture in JOURNAL.md

### Success Criteria
- [ ] Auth.js v5 installed without peer dependency warnings
- [ ] `npm install --legacy-peer-deps` runs successfully
- [ ] Dev server starts on localhost:3000
- [ ] Authentication works in both dev and production modes
- [ ] SyncStatus shows real-time updates
- [ ] Retry button triggers save operation
- [ ] Console logs verify context initialization
- [ ] JOURNAL.md documents migration details
- [ ] All type checks pass (`npm run type-check`)
- [ ] All lint checks pass (`npm run lint`)

## 5. Functional Requirements

### FR1: Auth.js v5 Migration

#### FR1.1: Dependency Update
- Update `package.json` to use `next-auth@beta` (v5)
- Install with `npm install --legacy-peer-deps` during transition
- No version conflicts with Next.js 14.2.x

#### FR1.2: Auth Configuration Refactor
**Current Pattern (v4):**
```typescript
// app/api/auth/[...nextauth]/route.ts
const authOptions: NextAuthOptions = { ... }
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

**Target Pattern (v5):**
```typescript
// lib/auth.ts (or auth.ts at root)
export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [...],
  callbacks: {...},
  ...
})

// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth"
export const { GET, POST } = handlers
```

**Requirements:**
- Move auth configuration to `lib/auth.ts`
- Export `auth`, `handlers`, `signIn`, `signOut`
- Maintain Google OAuth provider with Drive scopes
- Preserve token refresh logic
- Keep JWT session strategy
- Support dev mode bypass

#### FR1.3: Middleware Implementation
**Create:** `middleware.ts` at project root

**Requirements:**
- Use Auth.js v5 middleware pattern
- Protect authenticated routes
- Allow public access to sign-in page
- Support dev mode bypass
- Export `config` with matcher patterns

**Pattern:**
```typescript
export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
```

#### FR1.4: Session Provider Update
**Current:** `MockSessionProvider` provides dev mode session

**Requirements:**
- Continue supporting dev mode bypass
- Integrate with Auth.js v5 SessionProvider for production
- Wrap app in `app/layout.tsx`
- Maintain existing session interface

### FR2: SyncStatusProvider Validation

#### FR2.1: Verify Shared State
- Confirm `SyncStatusProvider` correctly wraps app
- Verify `useSyncStatusContext()` accessible in:
  - `RepositoryProvider.tsx`
  - `SyncStatus.tsx`
- Test real-time status updates during save operations

#### FR2.2: Verify Retry Logic
- Confirm retry button appears on error state
- Verify `retrySave()` calls `saveFile()`
- Test error → retry → success flow
- Validate UI animations during retry

#### FR2.3: Console Verification Logs
Add console logs to prove functionality:
```typescript
// SyncStatusProvider initialization
console.log('[SyncStatus] Shared context initialized')

// Auth migration success
console.log('[Auth] Migration to v5 successful')

// Context bus event verification
console.log('[ContextBus] Round-trip event verified')
```

### FR3: Documentation & Visual Trace

#### FR3.1: JOURNAL.md Update
Document in new Sprint 2 section:
- Auth.js v5 migration approach
- Configuration changes and rationale
- Middleware implementation
- SyncStatus architecture validation
- Breaking changes and migration notes

#### FR3.2: Visual Trace Requirements
Provide screenshots showing:
- Successful `npm install --legacy-peer-deps` output
- localhost:3000 dashboard loading
- SyncStatus component showing states:
  - Synced (green)
  - Syncing (yellow)
  - Error with retry button (red)
- Console logs with verification messages

## 6. Non-Functional Requirements

### NFR1: Compatibility
- Maintain Next.js 14.2.x support
- No breaking changes to existing UI components
- Preserve dev mode workflow
- Keep existing file structure conventions

### NFR2: Performance
- No degradation in authentication speed
- Maintain <200ms auth check overhead
- Preserve calm UI animations (200-300ms transitions)

### NFR3: Developer Experience
- Clear migration path from v4 to v5
- Comprehensive console logging
- Type safety maintained
- Zero TypeScript errors

### NFR4: Testing
- All existing functionality must work
- Manual testing of:
  - Sign-in flow
  - Token refresh
  - Session persistence
  - Dev mode bypass
  - Sync status updates
  - Retry functionality

## 7. Technical Constraints

### Constraints
- **Next.js Version:** Must stay on 14.2.x (not 15/16 yet)
- **Package Manager:** npm with `--legacy-peer-deps` flag
- **TypeScript:** Strict mode enabled
- **Node Version:** Compatible with Next.js 14.2.x requirements

### Dependencies to Update
```json
{
  "next-auth": "^5.0.0-beta.x" // from ^4.24.0
}
```

### Files to Modify
1. `package.json` - Update next-auth version
2. `lib/auth.ts` - **NEW** - Auth.js v5 configuration
3. `app/api/auth/[...nextauth]/route.ts` - Simplify to export handlers
4. `middleware.ts` - **NEW** - Auth.js v5 middleware
5. `app/layout.tsx` - Update SessionProvider (if needed)
6. `JOURNAL.md` - Add Sprint 2 section

### Files to Verify (No Changes Expected)
- `components/providers/SyncStatusProvider.tsx` ✓ Already correct
- `components/shared/SyncStatus.tsx` ✓ Already using context
- `components/providers/RepositoryProvider.tsx` ✓ Already using context

## 8. Out of Scope

### Explicitly NOT Included
- Next.js 15/16 upgrade (future sprint)
- GitHub sync implementation (future sprint)
- Additional OAuth providers
- Database session storage
- Multi-tenant authentication
- Role-based access control (RBAC)

## 9. Assumptions & Dependencies

### Assumptions
1. Google OAuth credentials are configured (or dev mode enabled)
2. `.env.local` exists with required variables
3. NEXTAUTH_SECRET is generated
4. SyncStatusProvider is already working (verified)

### Dependencies
- Auth.js v5 beta stability
- Next.js 14.2.x compatibility with Auth.js v5
- Google OAuth API availability
- npm registry access

## 10. Risks & Mitigation

### Risk 1: Auth.js v5 Beta Instability
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:** 
- Pin to specific beta version
- Test thoroughly before deployment
- Keep v4 rollback option documented

### Risk 2: Breaking Changes in API
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- Follow official migration guide
- Test all auth flows manually
- Document breaking changes

### Risk 3: Middleware Performance
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**
- Configure matcher to exclude static assets
- Monitor auth check latency
- Optimize middleware logic

## 11. Verification Approach

### Manual Testing Checklist
- [ ] Install dependencies successfully
- [ ] Start dev server without errors
- [ ] Load dashboard at localhost:3000
- [ ] Sign in with Google (production mode)
- [ ] Bypass auth in dev mode
- [ ] Edit file and trigger save
- [ ] Observe sync status change to yellow
- [ ] Trigger error condition
- [ ] Click retry button
- [ ] Verify successful retry
- [ ] Check console logs for verification messages
- [ ] Run `npm run lint`
- [ ] Run `npm run type-check`

### Console Log Verification
Expected console output:
```
[Auth] Migration to v5 successful
[SyncStatus] Shared context initialized
[ContextBus] Round-trip event verified
[RepositoryProvider] Using shared SyncStatus context
```

## 12. Definition of Done

### Code Complete When:
- [ ] Auth.js v5 installed and configured
- [ ] `lib/auth.ts` created with v5 pattern
- [ ] `middleware.ts` created and functional
- [ ] `app/api/auth/[...nextauth]/route.ts` updated
- [ ] All TypeScript errors resolved
- [ ] All ESLint errors resolved
- [ ] Dev mode still works
- [ ] Production auth flow works

### Documentation Complete When:
- [ ] JOURNAL.md updated with Sprint 2 section
- [ ] Migration notes documented
- [ ] Breaking changes listed
- [ ] Console logs added for verification
- [ ] Screenshots captured and referenced

### Sprint Complete When:
- [ ] All acceptance criteria met
- [ ] Manual testing passed
- [ ] Visual trace provided
- [ ] Code pushed to repository
- [ ] JOURNAL.md reflects current state

## 13. Open Questions

### Questions for User
None at this time. The requirements are clear based on the task description and codebase analysis.

### Clarifications Made
1. **SyncStatusProvider:** Already implemented correctly - just needs validation
2. **Retry Logic:** Already functional - just needs testing
3. **Migration Priority:** Auth.js v5 is the main technical task
4. **Next.js Version:** Staying on 14.2.x (not upgrading to 15/16)

## 14. Appendix

### References
- [Auth.js v5 Migration Guide](https://authjs.dev/guides/upgrade-to-v5)
- [Next.js 14 App Router Documentation](https://nextjs.org/docs/app)
- [Google OAuth Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)

### Current Auth Flow
1. User loads app → middleware checks auth
2. If dev mode → bypass with mock session
3. If production → check JWT session
4. If no session → redirect to sign-in
5. Sign-in → Google OAuth flow
6. Callback → create JWT with tokens
7. Store accessToken, refreshToken, expiryDate in session
8. On token expiry → auto-refresh using refreshToken

### Existing SyncStatus Architecture
```
ContextBusProvider
└── MockSessionProvider
    └── SyncStatusProvider (useSyncStatus hook)
        └── RepositoryProvider (useSyncStatusContext)
            └── App Components
                └── SyncStatus.tsx (useSyncStatusContext)
```

**This architecture is correct and functional.**
