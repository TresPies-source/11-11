# Hotfix & Validate: Product Requirements Document (PRD)

**Author:** Zencoder AI  
**Status:** Final  
**Date:** January 12, 2026  
**Sprint Type:** Critical Hotfix & Quality Assurance  

---

## 1. Executive Summary

The Librarian's Home (v0.1) represents a major milestone for the 11-11 Sustainable Intelligence OS. However, a critical authentication issue (`[auth][error] MissingSecret`) is preventing users from accessing the platform. This sprint addresses this blocker and conducts comprehensive validation of all delivered features to ensure a high-quality, production-ready user experience.

**Primary Objectives:**
1. **Hotfix**: Resolve authentication error preventing platform access
2. **Validate**: Test all v0.1 features comprehensively
3. **Document**: Track and fix all identified bugs

---

## 2. Problem Statement

### 2.1 Critical Authentication Issue

**Symptom:** `/librarian` page fails to load with `[auth][error] MissingSecret`  
**Impact:** Complete platform inaccessibility for non-dev-mode users  
**Root Cause:** Missing `NEXTAUTH_SECRET` environment variable required by NextAuth v5  

**Evidence:**
- `lib/auth.ts:118` expects `process.env.NEXTAUTH_SECRET`
- `.env.example:55` documents the requirement
- NextAuth v5 (beta.25) strictly enforces secret presence

### 2.2 Validation Gap

**Problem:** The Librarian's Home (v0.1) was delivered with comprehensive features but has not undergone systematic end-to-end validation across all user flows and edge cases.

**Risk:** Undetected bugs could degrade user experience and require costly post-release patches.

---

## 3. User Stories

### 3.1 Authentication Resolution

**As a** user attempting to access The Librarian's Home  
**I want** the page to load without authentication errors  
**So that** I can begin using the prompt engineering features

**Acceptance Criteria:**
- ✅ `/librarian` page loads successfully
- ✅ No `[auth][error] MissingSecret` errors in console
- ✅ Supabase data fetches correctly
- ✅ User session persists across page refreshes

### 3.2 Comprehensive Feature Validation

**As a** quality assurance engineer  
**I want** a comprehensive test plan for all v0.1 features  
**So that** I can verify the platform meets quality standards before release

**Acceptance Criteria:**
- ✅ Test plan covers all delivered features
- ✅ All critical user flows are tested
- ✅ Edge cases and error states are validated
- ✅ Responsive design works across breakpoints
- ✅ Accessibility compliance is verified

### 3.3 Bug Tracking & Resolution

**As a** developer  
**I want** all identified bugs documented in a centralized log  
**So that** I can prioritize and fix issues systematically

**Acceptance Criteria:**
- ✅ `05_Logs/BUGS.md` file created
- ✅ All bugs documented with severity, reproduction steps, and expected behavior
- ✅ Critical bugs (P0/P1) are fixed before sprint completion
- ✅ Bug status is tracked (open, in-progress, resolved)

---

## 4. Functional Requirements

### 4.1 Hotfix: Authentication Secret

**FR-1.1: Environment Variable Configuration**
- **Description:** Add `NEXTAUTH_SECRET` to `.env.local`
- **Implementation:** Generate cryptographically secure random string using `openssl rand -base64 32`
- **Validation:** NextAuth initialization succeeds without errors

**FR-1.2: Development vs Production Modes**
- **Description:** Ensure dev mode (`NEXT_PUBLIC_DEV_MODE=true`) bypasses auth correctly
- **Implementation:** Middleware already implements this check (middleware.ts:17-19)
- **Validation:** Both dev and production modes work correctly

### 4.2 Validation: Core Feature Testing

**FR-2.1: Seedling Section**
- Display active prompts with critique scores
- Real-time critique calculation (<1 second)
- "Save to Greenhouse" action with optimistic UI
- Card animations (60fps) and hover states
- Click to open prompt in editor

**FR-2.2: Greenhouse Section**
- Display saved prompts with filtering/search
- Search debouncing (300ms)
- Quick copy, run in chat, and edit actions
- Tag display with color coding
- Empty state when no prompts exist

**FR-2.3: Critique Engine**
- 4-dimension scoring: Conciseness, Specificity, Context, Task Decomposition
- Score range: 0-100
- Visual score indicators (color-coded)
- Detailed critique breakdown display
- Performance: <1 second calculation time

**FR-2.4: Status Management**
- Status transitions: draft → active → saved → archived
- Optimistic UI updates with rollback on error
- Toast notifications for status changes
- Supabase RLS enforcement

**FR-2.5: Navigation & Routing**
- `/librarian` → Librarian's Home
- `/librarian/greenhouse` → Greenhouse View
- `/librarian/commons` → Commons View
- `/library` → 301 redirect to `/librarian/greenhouse`
- `/gallery` → 301 redirect to `/librarian/commons`

**FR-2.6: Responsive Design**
- Mobile (320px - 767px)
- Tablet (768px - 1023px)
- Desktop (1024px - 2560px)
- Touch-friendly targets (min 44×44px)

**FR-2.7: Accessibility**
- WCAG 2.1 AA compliance
- Keyboard navigation support
- ARIA labels and semantic HTML
- Focus management
- Screen reader compatibility

**FR-2.8: Performance**
- Page load: <2 seconds (50 prompts)
- Critique calculation: <1 second
- Search response: <300ms
- Animation frame rate: 60fps

### 4.3 Bug Documentation

**FR-3.1: Bug Log Structure**
- Severity levels: P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
- Required fields: Title, Severity, Reproduction Steps, Expected Behavior, Actual Behavior, Status
- Status values: Open, In Progress, Resolved, Won't Fix
- Timestamps for creation and resolution

**FR-3.2: Bug Tracking Workflow**
- Discover → Document → Prioritize → Fix → Verify → Close
- P0/P1 bugs must be fixed before sprint completion
- P2/P3 bugs may be deferred to future sprints with justification

---

## 5. Non-Functional Requirements

### 5.1 Security
- No exposure of `NEXTAUTH_SECRET` in client-side code
- Proper `.env.local` exclusion from version control
- Supabase RLS policies enforced

### 5.2 Maintainability
- Bug log maintained in Markdown for easy editing
- Test plan reusable for regression testing
- Clear documentation of validation process

### 5.3 Compatibility
- Modern browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Node.js 18+ for development environment

---

## 6. Test Plan Overview

### 6.1 Test Categories

**Functional Tests:**
- Feature functionality (Seedling, Greenhouse, Critique, Status, Search)
- User flows (end-to-end scenarios)
- Edge cases (empty states, error states, boundary conditions)

**Non-Functional Tests:**
- Performance (load times, calculation speed, animation smoothness)
- Responsive design (breakpoints, touch targets)
- Accessibility (keyboard, screen readers, ARIA)
- Security (environment variables, RLS)

**Integration Tests:**
- Supabase data fetching
- NextAuth authentication flow
- Status transition persistence
- Search and filtering

### 6.2 Test Execution Strategy

**Manual Testing:**
- Exploratory testing of user flows
- Visual validation of UI components
- Responsive design testing across devices
- Accessibility testing with keyboard and screen readers

**Automated Validation:**
- Run `npm run lint` for code quality
- Run `npm test` (if tests exist) for unit/integration coverage
- Performance profiling with browser DevTools

---

## 7. Success Metrics

### 7.1 Hotfix Success
- ✅ Zero authentication errors in production mode
- ✅ `/librarian` page loads successfully
- ✅ All Supabase data fetches complete

### 7.2 Validation Success
- ✅ 100% of critical user flows tested
- ✅ Zero P0/P1 bugs remaining
- ✅ All performance benchmarks met
- ✅ Accessibility compliance verified

### 7.3 Quality Metrics
- Bug density: <5 bugs per feature area
- P0/P1 resolution rate: 100%
- Test coverage: All delivered features validated

---

## 8. Out of Scope

The following items are explicitly excluded from this sprint:

- ❌ New feature development
- ❌ Performance optimization (unless critical performance bugs identified)
- ❌ Refactoring or code cleanup (unless blocking bugs)
- ❌ Documentation updates (except BUGS.md)
- ❌ Semantic search implementation
- ❌ Global Commons 2D map UI
- ❌ GitHub integration
- ❌ Automated tagging/categorization

---

## 9. Dependencies

### 9.1 Technical Dependencies
- `.env.local` file with valid Supabase credentials (already present)
- `openssl` or online secret generator for `NEXTAUTH_SECRET`
- Next.js dev server (`npm run dev`)

### 9.2 Data Dependencies
- Supabase database with existing prompts (or mock data in dev mode)
- Valid Google OAuth credentials (or dev mode bypass)

### 9.3 External Dependencies
- None (all work can be completed autonomously)

---

## 10. Assumptions & Constraints

### 10.1 Assumptions
- `.env.local` exists and contains valid Supabase credentials
- Supabase database schema matches type definitions
- Dev mode (`NEXT_PUBLIC_DEV_MODE=true`) is functional
- Mock data is available for autonomous testing

### 10.2 Constraints
- Sprint must complete before new feature development
- Only critical bugs (P0/P1) block sprint completion
- No breaking changes to existing APIs or data models
- Must maintain backward compatibility with existing prompts

---

## 11. Risks & Mitigation

### 11.1 Risks

**Risk 1: Additional critical bugs discovered**
- **Impact:** Sprint timeline extension
- **Mitigation:** Prioritize ruthlessly; defer non-critical issues

**Risk 2: Supabase connection issues**
- **Impact:** Validation testing blocked
- **Mitigation:** Use dev mode with mock data for testing

**Risk 3: Environment configuration errors**
- **Impact:** Hotfix doesn't resolve issue
- **Mitigation:** Validate `.env.local` against `.env.example` thoroughly

### 11.2 Contingency Plans

- If auth hotfix fails: Investigate NextAuth v5 migration issues, check for version conflicts
- If critical bugs found: Create sub-tasks in implementation plan, extend sprint if necessary
- If Supabase unavailable: Complete all tests that can run with mock data, defer data-dependent tests

---

## 12. Deliverables

### 12.1 Hotfix Deliverables
1. ✅ Updated `.env.local` with `NEXTAUTH_SECRET`
2. ✅ Verified `/librarian` page loads without errors
3. ✅ Authentication flow tested in both dev and production modes

### 12.2 Validation Deliverables
1. ✅ Comprehensive test plan (documented in spec.md)
2. ✅ Test execution results (documented in plan.md)
3. ✅ `05_Logs/BUGS.md` with all identified issues

### 12.3 Bug Fix Deliverables
1. ✅ All P0/P1 bugs resolved
2. ✅ Code changes linted (`npm run lint`)
3. ✅ Fixes verified through re-testing

---

## 13. Acceptance Criteria (Sprint Completion)

This sprint is considered **COMPLETE** when:

1. ✅ `NEXTAUTH_SECRET` is added to `.env.local`
2. ✅ `/librarian` page loads without authentication errors
3. ✅ Comprehensive test plan created and documented
4. ✅ All critical user flows tested and validated
5. ✅ `05_Logs/BUGS.md` created with all identified bugs
6. ✅ All P0/P1 bugs fixed and verified
7. ✅ `npm run lint` passes with zero errors
8. ✅ `plan.md` updated with all completed steps marked `[x]`

---

## Appendix A: Feature Inventory (v0.1)

The following features were delivered in The Librarian's Home (v0.1) and must be validated:

### Core Features
1. **Supabase Integration**
   - Database schema: `prompts`, `prompt_metadata`, `critiques`
   - Row Level Security (RLS) policies
   - Type-safe data access with `lib/supabase/prompts.ts`
   - Mock data fallback in dev mode

2. **The Librarian's Home (`/librarian`)**
   - Seedling Section (active prompts)
   - Greenhouse preview with saved prompt count
   - Navigation cards to Greenhouse and Commons
   - Animated layout with Framer Motion

3. **Seedling Section**
   - Display active prompts with critique scores
   - "Save to Greenhouse" action
   - Optimistic UI with rollback on error
   - Click to load prompt in editor

4. **Greenhouse Section**
   - Display saved prompts
   - Search and filtering (300ms debounce)
   - Quick copy, run in chat, edit actions
   - Tag display with color coding

5. **Critique Engine**
   - 4-dimension scoring algorithm
   - Real-time calculation (<1 second)
   - Visual score display with color coding
   - Detailed breakdown component

6. **Status Management**
   - Lifecycle: draft → active → saved → archived
   - `usePromptStatus` hook for transitions
   - Supabase persistence
   - Toast notifications

7. **UI/UX Features**
   - Responsive design (320px - 2560px)
   - 60fps animations
   - WCAG 2.1 AA accessibility
   - Error boundaries
   - Loading states
   - Empty states

### Technical Features
1. **Hooks**
   - `useLibrarian` (status-filtered prompts)
   - `useLibrary` (saved prompts)
   - `usePromptStatus` (status transitions)
   - `usePromptSearch` (client-side filtering)
   - `useCritique` (score calculation)
   - `useDebounce` (search optimization)
   - `useToast` (notifications)

2. **Components**
   - `LibrarianView` (main page)
   - `GreenhouseView` (dedicated page)
   - `SeedlingSection` / `SeedlingCard`
   - `GreenhouseSection` / `GreenhouseCard`
   - `CritiqueScore` / `CritiqueDetails`
   - `StatusTransitionButton`
   - `LibrarianErrorBoundary`
   - `CardErrorBoundary`

3. **Routing**
   - `/librarian` (Librarian's Home)
   - `/librarian/greenhouse` (Greenhouse View)
   - `/librarian/commons` (Commons View)
   - Redirects: `/library` → `/librarian/greenhouse`, `/gallery` → `/librarian/commons`

---

## Appendix B: Environment Variables Reference

Required in `.env.local` for production mode:

```bash
# Authentication
NEXTAUTH_SECRET=<generated-with-openssl-rand-base64-32>
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-key>

# Development Mode (set to false for production testing)
NEXT_PUBLIC_DEV_MODE=false
```

---

**End of Requirements Document**
