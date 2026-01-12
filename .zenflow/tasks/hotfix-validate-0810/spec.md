# Hotfix & Validate: Technical Specification

**Author:** Zencoder AI  
**Status:** Final  
**Date:** January 12, 2026  
**Sprint Type:** Critical Hotfix & Quality Assurance

---

## 1. Technical Context

### 1.1 Technology Stack

**Framework & Runtime:**
- Next.js 14.2.24 (App Router)
- React 18.3.1
- Node.js 18+ (development environment)
- TypeScript 5.7.2

**Authentication & Authorization:**
- NextAuth v5.0.0-beta.25 (Auth.js)
- Google OAuth provider
- JWT session strategy

**Database & Backend:**
- Supabase (PostgreSQL)
- @supabase/supabase-js 2.90.1
- Row Level Security (RLS) policies

**UI & Styling:**
- Tailwind CSS 3.4.17
- Framer Motion 11.15.0 (animations)
- Lucide React 0.469.0 (icons)
- clsx & tailwind-merge (className utilities)

**Development Tools:**
- ESLint 8.57.1 (code quality)
- TypeScript compiler (type checking)
- Monaco Editor 4.6.0 (code editing)

### 1.2 Project Structure

```
C:\Users\cruzr\.zenflow\worktrees\hotfix-validate-0810\
├── app/
│   ├── api/auth/[...nextauth]/route.ts  # NextAuth handlers
│   ├── librarian/
│   │   ├── page.tsx                     # Librarian's Home (Seedling + preview)
│   │   ├── greenhouse/page.tsx          # Greenhouse View (saved prompts)
│   │   └── commons/page.tsx             # Commons View (placeholder)
│   ├── layout.tsx                       # Root layout
│   └── page.tsx                         # Landing page
├── components/
│   └── librarian/
│       ├── LibrarianView.tsx            # Main view orchestrator
│       ├── SeedlingSection.tsx          # Active prompts section
│       ├── SeedlingCard.tsx             # Active prompt card
│       ├── GreenhouseSection.tsx        # Saved prompts preview
│       ├── GreenhouseView.tsx           # Full greenhouse page
│       ├── GreenhouseCard.tsx           # Saved prompt card
│       ├── CritiqueScore.tsx            # Score visualization
│       ├── CritiqueDetails.tsx          # Critique breakdown
│       ├── StatusTransitionButton.tsx   # Status change UI
│       ├── LibrarianErrorBoundary.tsx   # Page-level error handling
│       └── CardErrorBoundary.tsx        # Card-level error handling
├── hooks/
│   ├── useLibrarian.ts                  # Fetch active prompts
│   ├── useLibrary.ts                    # Fetch saved prompts
│   ├── usePromptStatus.ts               # Status transitions
│   ├── useCritique.ts                   # Critique calculation
│   ├── usePromptSearch.ts               # Client-side search/filter
│   ├── useDebounce.ts                   # Search debouncing
│   └── useToast.ts                      # Toast notifications
├── lib/
│   ├── auth.ts                          # NextAuth configuration
│   ├── supabase/
│   │   ├── client.ts                    # Supabase client factory
│   │   ├── prompts.ts                   # Prompt CRUD operations
│   │   ├── critiques.ts                 # Critique CRUD operations
│   │   ├── mockData.ts                  # Dev mode mock data
│   │   └── types.ts                     # Database type definitions
│   └── critique/
│       ├── engine.ts                    # Critique scoring algorithm
│       ├── engine.test.ts               # Critique engine tests
│       ├── types.ts                     # Critique type definitions
│       └── rules/                       # Scoring rule implementations
├── middleware.ts                        # Auth middleware + redirects
└── .env.example                         # Environment variable template
```

### 1.3 Current Environment Configuration

**Existing `.env.example` variables:**
- `NEXT_PUBLIC_DEV_MODE` - Bypass auth in dev mode
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth credentials
- `NEXTAUTH_SECRET` - **MISSING** (root cause of auth error)
- `NEXTAUTH_URL` - Application base URL
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase connection
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side Supabase operations

**Current `.gitignore` protection:**
- `.env*.local` - Already ignored ✅
- `.env` - Already ignored ✅

---

## 2. Implementation Approach

### 2.1 Hotfix Strategy: Authentication Secret

**Root Cause Analysis:**
- `lib/auth.ts:118` references `process.env.NEXTAUTH_SECRET`
- NextAuth v5 (beta.25) requires this secret for JWT encryption
- Missing secret causes `[auth][error] MissingSecret` error
- `.env.local` file does not exist (confirmed by Read tool error)

**Solution:**
1. Create `.env.local` from `.env.example` template
2. Generate cryptographically secure secret using `openssl rand -base64 32`
3. Add `NEXTAUTH_SECRET` to `.env.local`
4. Copy Supabase credentials from user (if not in dev mode)
5. Verify NextAuth initializes without errors

**Implementation Pattern:**
- Use existing `.env.example` as template (already documents this variable at line 55)
- Follow existing convention: `NEXTAUTH_SECRET=<generated-value>`
- No code changes required (auth.ts already references the variable correctly)

**Dev Mode Bypass:**
- `middleware.ts:17-19` already implements dev mode bypass
- When `NEXT_PUBLIC_DEV_MODE=true`, auth middleware returns early
- No changes needed to dev mode logic

### 2.2 Validation Strategy: Comprehensive Testing

**Testing Approach:**
- **Manual exploratory testing** - Primary approach for UI/UX validation
- **Automated checks** - Lint and type-check for code quality
- **Browser DevTools** - Performance profiling and network inspection
- **No unit tests** - package.json does not define `npm test` script

**Test Plan Structure:**
1. **Functional Tests** - Feature-by-feature validation
2. **Integration Tests** - End-to-end user flow validation
3. **Non-Functional Tests** - Performance, responsiveness, accessibility
4. **Edge Case Tests** - Error states, empty states, boundary conditions

**Test Execution Strategy:**
1. Start dev server: `npm run dev`
2. Test in dev mode first (with `NEXT_PUBLIC_DEV_MODE=true`)
3. Test in production mode (with `NEXT_PUBLIC_DEV_MODE=false`)
4. Document bugs in `05_Logs/BUGS.md` as discovered
5. Fix P0/P1 bugs immediately
6. Run `npm run lint` and `npm run type-check` before completion

### 2.3 Bug Documentation Strategy

**Bug Log Format:**
```markdown
## Bug #001: [Short Title]

**Severity:** P0 | P1 | P2 | P3  
**Status:** Open | In Progress | Resolved | Won't Fix  
**Discovered:** YYYY-MM-DD HH:MM  
**Resolved:** YYYY-MM-DD HH:MM (if applicable)

**Description:**
Brief description of the issue.

**Reproduction Steps:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen.

**Actual Behavior:**
What actually happens.

**Fix:**
Description of the fix (if resolved).
```

**Severity Definitions:**
- **P0 (Critical)**: Blocks core functionality, must fix immediately
- **P1 (High)**: Major feature broken, must fix before completion
- **P2 (Medium)**: Minor feature issue, can defer to next sprint
- **P3 (Low)**: Cosmetic or edge case, can defer indefinitely

---

## 3. Source Code Structure Changes

### 3.1 File Additions

**New Files:**
1. `.env.local` (environment variables, gitignored)
2. `05_Logs/BUGS.md` (bug tracking log)

**No Code Changes Required:**
- All existing code is correct
- Auth configuration already references `NEXTAUTH_SECRET`
- All features are already implemented
- Only configuration and validation needed

### 3.2 Existing Code Patterns

**Authentication Pattern (lib/auth.ts):**
```typescript
export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [GoogleProvider({ ... })],
  secret: process.env.NEXTAUTH_SECRET, // Line 118
  // ...
});
```

**Middleware Pattern (middleware.ts):**
```typescript
export default auth((req) => {
  // 301 redirects for /library and /gallery
  if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
    return; // Bypass auth in dev mode
  }
});
```

**Supabase Client Pattern (lib/supabase/client.ts):**
```typescript
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Status Transition Pattern (hooks/usePromptStatus.ts):**
```typescript
const { saveToGreenhouse, archivePrompt } = usePromptStatus();
// Optimistic UI updates with rollback on error
```

**Critique Calculation Pattern (hooks/useCritique.ts):**
```typescript
const { critique, loading, error } = useCritique(prompt);
// Real-time scoring with caching
```

---

## 4. Data Model & API Changes

### 4.1 Supabase Schema (No Changes)

**Existing Tables:**
- `prompts` - User prompts with content and metadata
- `prompt_metadata` - Additional metadata (tags, categories)
- `critiques` - Critique scores and breakdowns

**Existing RLS Policies:**
- User-scoped access control
- Already implemented and functional

### 4.2 Environment Variables (Changes)

**New Variables (to be added to `.env.local`):**
- `NEXTAUTH_SECRET` - **REQUIRED** for production mode
  - Generation: `openssl rand -base64 32`
  - Example: `NEXTAUTH_SECRET=Xj8sK9fL3mN5pQ7rT2vW4yZ6aB8dE0gH1iJ3kL5mN7p=`

**Optional Variables (for production testing):**
- `NEXT_PUBLIC_DEV_MODE=false` - Test with real auth
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

**Dev Mode Variables (minimal config):**
- `NEXT_PUBLIC_DEV_MODE=true` - Bypass auth, use mock data
- `NEXTAUTH_SECRET=<any-value>` - Still required even in dev mode
- `NEXTAUTH_URL=http://localhost:3000` - Local development URL

---

## 5. Delivery Phases

### Phase 1: Hotfix - Authentication Resolution
**Objective:** Restore platform accessibility

**Tasks:**
1. Create `.env.local` file from `.env.example` template
2. Generate `NEXTAUTH_SECRET` using `openssl rand -base64 32`
3. Add `NEXTAUTH_SECRET` to `.env.local`
4. Add `NEXTAUTH_URL=http://localhost:3000` to `.env.local`
5. Add `NEXT_PUBLIC_DEV_MODE=true` for development testing
6. Start dev server: `npm run dev`
7. Verify `/librarian` page loads without auth errors
8. Check browser console for `[auth][error] MissingSecret` errors (should be absent)

**Success Criteria:**
- ✅ No authentication errors in console
- ✅ `/librarian` page renders successfully
- ✅ Dev mode bypasses Google OAuth correctly

**Estimated Duration:** 5 minutes

---

### Phase 2: Validation - Core Feature Testing
**Objective:** Verify all v0.1 features work correctly

**Test Categories:**

#### 2.1 Seedling Section Tests
- [ ] Active prompts display correctly
- [ ] Critique scores calculate in <1 second
- [ ] "Save to Greenhouse" action works
- [ ] Optimistic UI updates correctly
- [ ] Click on card opens prompt in editor
- [ ] Card animations run at 60fps
- [ ] Hover states work correctly
- [ ] Empty state displays when no active prompts

#### 2.2 Greenhouse Section Tests
- [ ] Saved prompts display correctly
- [ ] Search functionality works (300ms debounce)
- [ ] Quick copy action works
- [ ] "Run in chat" action works
- [ ] Edit action works
- [ ] Tag display shows correct colors
- [ ] Empty state displays when no saved prompts
- [ ] Filter by tags works

#### 2.3 Critique Engine Tests
- [ ] 4-dimension scoring works (Conciseness, Specificity, Context, Task Decomposition)
- [ ] Score range is 0-100
- [ ] Visual indicators display correct colors
- [ ] Detailed breakdown displays all dimensions
- [ ] Calculation completes in <1 second

#### 2.4 Status Management Tests
- [ ] Draft → Active transition works
- [ ] Active → Saved transition works
- [ ] Saved → Archived transition works
- [ ] Optimistic UI updates correctly
- [ ] Rollback works on error
- [ ] Toast notifications display
- [ ] Supabase persistence works

#### 2.5 Navigation & Routing Tests
- [ ] `/librarian` loads correctly
- [ ] `/librarian/greenhouse` loads correctly
- [ ] `/librarian/commons` loads correctly
- [ ] `/library` redirects to `/librarian/greenhouse` (301)
- [ ] `/gallery` redirects to `/librarian/commons` (301)

#### 2.6 Responsive Design Tests
- [ ] Mobile (320px - 767px) layout works
- [ ] Tablet (768px - 1023px) layout works
- [ ] Desktop (1024px - 2560px) layout works
- [ ] Touch targets are min 44×44px

#### 2.7 Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Focus management is correct
- [ ] ARIA labels are present
- [ ] Semantic HTML is used
- [ ] Screen reader compatibility (basic test)

#### 2.8 Performance Tests
- [ ] Page load <2 seconds (50 prompts)
- [ ] Critique calculation <1 second
- [ ] Search response <300ms
- [ ] Animations run at 60fps

**Success Criteria:**
- ✅ All critical user flows tested
- ✅ All edge cases validated
- ✅ Performance benchmarks met
- ✅ Accessibility compliance verified

**Estimated Duration:** 45-60 minutes

---

### Phase 3: Bug Documentation & Tracking
**Objective:** Document all identified issues systematically

**Tasks:**
1. Create `05_Logs/BUGS.md` file
2. Document each bug with severity, reproduction steps, expected/actual behavior
3. Prioritize bugs by severity (P0 > P1 > P2 > P3)
4. Track bug status (Open, In Progress, Resolved)

**Bug Documentation Template:**
```markdown
# The Librarian's Home v0.1 - Bug Log

**Last Updated:** YYYY-MM-DD HH:MM  
**Total Bugs:** X  
**Resolved:** X | **Open:** X

---

## P0 - Critical Bugs

## P1 - High Priority Bugs

## P2 - Medium Priority Bugs

## P3 - Low Priority Bugs

---

## Bug History

### Bug #001: [Title]
[Bug details as per format above]
```

**Success Criteria:**
- ✅ `05_Logs/BUGS.md` created
- ✅ All discovered bugs documented
- ✅ Severity levels assigned correctly
- ✅ Reproduction steps are clear

**Estimated Duration:** 10-15 minutes

---

### Phase 4: Bug Resolution & Fixes
**Objective:** Fix all critical bugs before sprint completion

**Priority Order:**
1. **P0 (Critical)** - Must fix immediately
2. **P1 (High)** - Must fix before sprint completion
3. **P2 (Medium)** - Can defer to next sprint
4. **P3 (Low)** - Can defer indefinitely

**Fix Workflow:**
1. Mark bug as "In Progress" in BUGS.md
2. Implement fix following existing code patterns
3. Test fix thoroughly
4. Update bug status to "Resolved" with fix description
5. Commit changes (if applicable)

**Success Criteria:**
- ✅ All P0 bugs resolved
- ✅ All P1 bugs resolved
- ✅ P2/P3 bugs documented for future sprints
- ✅ All fixes verified through re-testing

**Estimated Duration:** Variable (depends on bug count/complexity)

---

### Phase 5: Quality Assurance & Cleanup
**Objective:** Ensure code quality and completeness

**Tasks:**
1. Run `npm run lint` - Verify no ESLint errors
2. Run `npm run type-check` - Verify no TypeScript errors
3. Verify all P0/P1 bugs are resolved
4. Verify `plan.md` reflects completed steps (all [x])
5. Update `05_Logs/BUGS.md` with final status

**Success Criteria:**
- ✅ `npm run lint` passes (0 errors)
- ✅ `npm run type-check` passes (0 errors)
- ✅ All P0/P1 bugs resolved
- ✅ `plan.md` updated with [x] for all completed steps
- ✅ `BUGS.md` reflects final bug status

**Estimated Duration:** 10 minutes

---

## 6. Verification Approach

### 6.1 Environment Verification

**Pre-Flight Checks:**
```bash
# Verify Node.js version
node --version  # Should be 18+

# Verify .env.local exists
ls -la .env.local

# Verify NEXTAUTH_SECRET is set
grep NEXTAUTH_SECRET .env.local

# Install dependencies
npm install
```

**Dev Server Start:**
```bash
npm run dev
# Should start on http://localhost:3000
# No auth errors in console
```

### 6.2 Functional Verification

**Manual Testing Checklist:**
1. Open `http://localhost:3000/librarian`
2. Verify page loads without errors
3. Verify Seedling section displays (or empty state)
4. Verify Greenhouse preview displays
5. Test "Save to Greenhouse" action
6. Navigate to `/librarian/greenhouse`
7. Test search functionality
8. Test quick actions (copy, run, edit)
9. Verify redirects: `/library` → `/librarian/greenhouse`
10. Verify redirects: `/gallery` → `/librarian/commons`

**Performance Verification:**
1. Open Chrome DevTools → Performance tab
2. Record page load for `/librarian`
3. Verify load time <2 seconds
4. Verify animations run at 60fps
5. Test critique calculation time (<1 second)

**Accessibility Verification:**
1. Tab through all interactive elements
2. Verify focus indicators are visible
3. Test with screen reader (NVDA/JAWS on Windows, VoiceOver on Mac)
4. Verify ARIA labels are present
5. Verify semantic HTML structure

### 6.3 Code Quality Verification

**Automated Checks:**
```bash
# ESLint (code quality)
npm run lint
# Expected: ✓ No ESLint errors

# TypeScript (type safety)
npm run type-check
# Expected: ✓ No TypeScript errors
```

**Manual Code Review:**
- [ ] No hardcoded secrets in code
- [ ] `.env.local` is in `.gitignore`
- [ ] Error handling is present
- [ ] Loading states are implemented
- [ ] Empty states are implemented

### 6.4 Bug Verification

**Bug Fix Verification:**
1. Re-test original reproduction steps
2. Verify expected behavior is now observed
3. Check for regression (other features still work)
4. Update BUGS.md status to "Resolved"

**Bug Log Verification:**
- [ ] All bugs have severity assigned
- [ ] All bugs have reproduction steps
- [ ] All P0/P1 bugs are resolved
- [ ] Bug status is accurate (Open/In Progress/Resolved)

---

## 7. Testing Commands Reference

```bash
# Development
npm install           # Install dependencies
npm run dev          # Start dev server (http://localhost:3000)

# Quality Checks
npm run lint         # ESLint - code quality
npm run type-check   # TypeScript - type safety

# Production Build (optional)
npm run build        # Build production bundle
npm start            # Start production server

# Generate NEXTAUTH_SECRET
openssl rand -base64 32
# Or online: https://generate-secret.vercel.app/32
```

---

## 8. Risk Mitigation

### 8.1 Technical Risks

**Risk: Additional critical bugs discovered during validation**
- **Likelihood:** Medium
- **Impact:** High (extends sprint timeline)
- **Mitigation:** Prioritize ruthlessly, fix P0/P1 only, defer P2/P3
- **Contingency:** Extend sprint timeline, create sub-tasks in plan.md

**Risk: Supabase connection issues during testing**
- **Likelihood:** Low
- **Impact:** High (blocks data-dependent tests)
- **Mitigation:** Use dev mode (`NEXT_PUBLIC_DEV_MODE=true`) with mock data
- **Contingency:** Test all UI/UX flows, defer data persistence tests

**Risk: Environment configuration errors**
- **Likelihood:** Low
- **Impact:** Medium (hotfix doesn't resolve issue)
- **Mitigation:** Validate `.env.local` against `.env.example` line-by-line
- **Contingency:** Investigate NextAuth v5 migration issues, check for version conflicts

### 8.2 Process Risks

**Risk: Test plan is too comprehensive, testing takes too long**
- **Likelihood:** Medium
- **Impact:** Low (extends timeline but improves quality)
- **Mitigation:** Focus on critical user flows first, defer edge cases
- **Contingency:** Complete critical tests, document untested areas

**Risk: Bug count is higher than expected**
- **Likelihood:** Medium
- **Impact:** Medium (requires more fix time)
- **Mitigation:** Document all bugs, prioritize by severity, defer P2/P3
- **Contingency:** Create follow-up tasks for deferred bugs

---

## 9. Success Criteria

### 9.1 Hotfix Success
- [x] `.env.local` file created from template
- [ ] `NEXTAUTH_SECRET` generated and added
- [ ] `/librarian` page loads without auth errors
- [ ] Zero `[auth][error] MissingSecret` errors in console
- [ ] Dev mode and production mode both work correctly

### 9.2 Validation Success
- [ ] Comprehensive test plan executed
- [ ] All critical user flows tested (Seedling, Greenhouse, Status, Search)
- [ ] All edge cases validated (empty states, error states)
- [ ] Performance benchmarks met (load <2s, critique <1s, search <300ms)
- [ ] Responsive design validated across breakpoints
- [ ] Accessibility compliance verified (keyboard, screen reader)

### 9.3 Bug Documentation Success
- [ ] `05_Logs/BUGS.md` created
- [ ] All bugs documented with severity and reproduction steps
- [ ] Bug status tracked (Open/In Progress/Resolved)
- [ ] P0/P1 bugs resolved (100% resolution rate)
- [ ] P2/P3 bugs documented for future sprints

### 9.4 Quality Assurance Success
- [ ] `npm run lint` passes (0 errors)
- [ ] `npm run type-check` passes (0 errors)
- [ ] All fixes verified through re-testing
- [ ] `plan.md` updated with all completed steps marked [x]

---

## 10. Appendix: Key Files Reference

### Authentication
- `lib/auth.ts:118` - NEXTAUTH_SECRET reference
- `middleware.ts:17-19` - Dev mode bypass
- `.env.example:55` - Environment variable template

### Librarian Features
- `app/librarian/page.tsx` - Librarian's Home
- `app/librarian/greenhouse/page.tsx` - Greenhouse View
- `components/librarian/LibrarianView.tsx` - Main orchestrator
- `components/librarian/SeedlingSection.tsx` - Active prompts
- `components/librarian/GreenhouseSection.tsx` - Saved prompts preview

### Hooks
- `hooks/useLibrarian.ts` - Fetch active prompts (status-filtered)
- `hooks/useLibrary.ts` - Fetch saved prompts
- `hooks/usePromptStatus.ts` - Status transition logic
- `hooks/useCritique.ts` - Critique calculation with caching

### Supabase
- `lib/supabase/prompts.ts` - Prompt CRUD operations
- `lib/supabase/critiques.ts` - Critique CRUD operations
- `lib/supabase/client.ts` - Supabase client factory
- `lib/supabase/mockData.ts` - Dev mode mock data

### Critique Engine
- `lib/critique/engine.ts` - Scoring algorithm
- `lib/critique/engine.test.ts` - Unit tests
- `lib/critique/rules/` - Individual scoring rules

---

**End of Technical Specification**
