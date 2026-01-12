# Technical Specification: Unified Librarian Home

**Feature:** Unified `/librarian` Namespace  
**Author:** AI Assistant  
**Date:** January 12, 2026  
**Status:** Technical Specification  
**Based On:** [requirements.md](./requirements.md)

---

## 1. Technical Context

### 1.1 Technology Stack
- **Framework:** Next.js 14.2.24 (App Router)
- **Language:** TypeScript 5.7.2
- **UI Library:** React 18.3.1
- **Animation:** Framer Motion 11.15.0
- **Styling:** Tailwind CSS 3.4.17 + clsx/tailwind-merge
- **Icons:** Lucide React 0.469.0
- **Backend:** Supabase 2.90.1 (no changes required)
- **Linting:** ESLint + Next.js config
- **Type Checking:** TypeScript strict mode

### 1.2 Current Architecture Patterns
- **Routing:** File-based routing with Next.js App Router (`app/` directory)
- **Components:** Separation between pages (`app/*/page.tsx`) and view components (`components/*/View.tsx`)
- **State Management:** React hooks + custom hooks for data fetching
- **Data Fetching:** Client-side hooks (`useLibrary`, `useGallery`, `useLibrarian`)
- **Error Handling:** Error boundaries + retry mechanisms
- **Loading States:** Skeleton components with staggered animations
- **Animations:** 200-300ms transitions using Framer Motion
- **Responsive Design:** Mobile-first with Tailwind breakpoints (md: 768px, lg: 1280px)

---

## 2. Implementation Approach

### 2.1 Migration Strategy

We will use a **phased migration approach** to minimize risk:

1. **Phase 1: Create New Routes** - Add new nested routes without touching existing ones
2. **Phase 2: Migrate Components** - Copy and adapt existing components to new locations
3. **Phase 3: Add Redirects** - Implement server-side redirects for old URLs
4. **Phase 4: Update Navigation** - Modify Header to use new route structure
5. **Phase 5: Cleanup** - Remove old routes and update internal links
6. **Phase 6: Testing & Verification** - Run lint, type-check, and manual testing

This approach ensures:
- Zero downtime during development
- Easy rollback if issues are discovered
- Incremental testing at each phase

### 2.2 File System Changes

#### New Files to Create
```
app/
  librarian/
    greenhouse/
      page.tsx              # New page for personal prompts
    commons/
      page.tsx              # New page for community prompts

components/
  librarian/
    GreenhouseView.tsx      # Migrated from library/LibraryView.tsx
    CommonsView.tsx         # Migrated from gallery/GalleryView.tsx
    LibrarianNav.tsx        # New sub-navigation component (optional)
```

#### Files to Modify
```
app/
  librarian/
    page.tsx                # Enhanced with navigation to sub-pages

components/
  layout/
    Header.tsx              # Update navLinks array

middleware.ts               # Add redirects for /library and /gallery

next.config.mjs             # Alternative location for redirects (optional)
```

#### Files to Delete (Phase 5)
```
app/
  library/
    page.tsx                # Remove after migration complete
  gallery/
    page.tsx                # Remove after migration complete

components/
  library/
    LibraryView.tsx         # Remove after migration complete
  gallery/
    GalleryView.tsx         # Remove after migration complete
```

---

## 3. Detailed Component Specifications

### 3.1 GreenhouseView Component

**Purpose:** Display personal prompt library with search/filter capabilities

**File:** `components/librarian/GreenhouseView.tsx`

**Source:** Copy from `components/library/LibraryView.tsx`

**Changes Required:**
```typescript
// Update title and icon
<h1>🌺 My Greenhouse</h1>
<p>Your cultivated prompts ready to bloom</p>

// Update PromptCard variant
<PromptCard variant="greenhouse" />

// Update empty state message
"Your greenhouse is empty. Start growing prompts in the Seedlings section!"
```

**Dependencies:**
- `useLibrary()` hook (unchanged)
- `usePromptSearch()` hook (unchanged)
- `useDebounce()` hook (unchanged)
- `PromptCard` component (requires variant update)
- Search and error/loading components (unchanged)

---

### 3.2 CommonsView Component

**Purpose:** Display public community prompts with discovery features

**File:** `components/librarian/CommonsView.tsx`

**Source:** Copy from `components/gallery/GalleryView.tsx`

**Changes Required:**
```typescript
// Update title and icon
<h1>✨ The Global Commons</h1>
<p>Discover prompts shared by the community</p>

// Update PromptCard variant
<PromptCard variant="commons" />

// Update empty state message
"The Commons awaits your contribution. Share your prompts!"
```

**Dependencies:**
- `useGallery()` hook (unchanged)
- `usePromptSearch()` hook (unchanged)
- `useDebounce()` hook (unchanged)
- `PromptCard` component (requires variant update)
- Search and error/loading components (unchanged)

---

### 3.3 Enhanced LibrarianView Component

**Purpose:** Landing page with overview and navigation to sub-pages

**File:** `components/librarian/LibrarianView.tsx` (existing)

**Changes Required:**
```typescript
// Add navigation buttons to Greenhouse and Commons
<div className="flex gap-4 mt-6">
  <Link href="/librarian/greenhouse">
    <button>🌺 Visit Greenhouse</button>
  </Link>
  <Link href="/librarian/commons">
    <button>✨ Explore Commons</button>
  </Link>
</div>

// Add Greenhouse preview (optional P2 feature)
<div className="mt-4">
  <p>Greenhouse: {savedPrompts.length} mature prompts</p>
</div>
```

**Dependencies:**
- Existing `useLibrarian()` hooks (unchanged)
- Existing `SeedlingSection` and `GreenhouseSection` (unchanged)
- `next/link` for navigation

---

### 3.4 PromptCard Component Updates

**Purpose:** Support new variant names while maintaining backward compatibility

**File:** `components/shared/PromptCard.tsx`

**Changes Required:**
```typescript
// Update variant type (breaking change - requires full migration)
interface PromptCardProps {
  prompt: PromptFile;
  variant: "library" | "gallery" | "greenhouse" | "commons";
}

// OR maintain backward compatibility during migration
interface PromptCardProps {
  prompt: PromptFile;
  variant: "library" | "gallery" | "greenhouse" | "commons";
}

// Map old variants to new variants internally
const normalizedVariant = 
  variant === "library" ? "greenhouse" :
  variant === "gallery" ? "commons" :
  variant;
```

**Decision:** Use extended type during migration, then clean up in Phase 5

---

### 3.5 Header Navigation Updates

**Purpose:** Update primary navigation to single "Librarian" entry

**File:** `components/layout/Header.tsx`

**Changes Required:**
```typescript
// Before (lines 20-24)
const navLinks = [
  { href: "/library", label: "Library" },
  { href: "/gallery", label: "Gallery" },
  { href: "/librarian", label: "Librarian" },
];

// After
const navLinks = [
  { href: "/librarian", label: "Librarian" },
];

// Update active state logic to handle sub-routes (lines 47)
const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
```

**Optional Enhancement:** Add sub-navigation within Librarian pages
```typescript
// New component: components/librarian/LibrarianNav.tsx
export function LibrarianNav() {
  const pathname = usePathname();
  
  const subLinks = [
    { href: "/librarian", label: "Overview", exact: true },
    { href: "/librarian/greenhouse", label: "Greenhouse" },
    { href: "/librarian/commons", label: "Commons" },
  ];
  
  return (
    <nav className="flex gap-2 mb-6 border-b">
      {subLinks.map(link => {
        const isActive = link.exact 
          ? pathname === link.href 
          : pathname.startsWith(link.href);
        return (
          <Link 
            key={link.href} 
            href={link.href}
            className={cn("px-4 py-2", isActive && "border-b-2")}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

---

## 4. Routing & Redirects

### 4.1 New Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/librarian` | `LibrarianView` | Landing page with overview |
| `/librarian/greenhouse` | `GreenhouseView` | Personal prompts (former `/library`) |
| `/librarian/commons` | `CommonsView` | Public prompts (former `/gallery`) |

### 4.2 Redirect Implementation

**Option A: Middleware (Recommended)**

**File:** `middleware.ts`

**Implementation:**
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
    return;
  }
  
  // Handle redirects BEFORE auth check
  const { pathname } = req.nextUrl;
  
  if (pathname === "/library") {
    return NextResponse.redirect(
      new URL("/librarian/greenhouse", req.url),
      { status: 301 }
    );
  }
  
  if (pathname === "/gallery") {
    return NextResponse.redirect(
      new URL("/librarian/commons", req.url),
      { status: 301 }
    );
  }
  
  // Existing auth logic continues...
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Rationale:**
- Server-side redirects (faster than client-side)
- 301 status code indicates permanent redirect (SEO-friendly)
- Preserves query parameters and hash fragments
- Works before React hydration

**Option B: next.config.mjs (Alternative)**

```javascript
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/library',
        destination: '/librarian/greenhouse',
        permanent: true,
      },
      {
        source: '/gallery',
        destination: '/librarian/commons',
        permanent: true,
      },
    ];
  },
  // ... existing config
};
```

**Decision:** Use **middleware.ts** for consistency with existing auth patterns

---

## 5. Data Model & API

### 5.1 Database Schema
**No changes required.** All existing tables, columns, and RLS policies remain unchanged.

### 5.2 API Routes
**No changes required.** All existing API endpoints remain functional:
- `/api/drive/*` - Google Drive sync operations
- `/api/prompts/*` - Prompt CRUD operations
- `/api/critique/*` - Critique scoring

### 5.3 Hooks
**No changes required.** All existing hooks maintain their contracts:
- `useLibrary()` - Fetches personal prompts (status: "saved")
- `useGallery()` - Fetches public prompts (public: true)
- `useLibrarian()` - Fetches prompts by status ("active" or "saved")
- `usePromptStatus()` - Transitions prompt status
- `usePromptSearch()` - Client-side search filtering

### 5.4 Types
**Potential addition** to `lib/types.ts`:
```typescript
// Add new variant types (optional - can extend existing)
export type PromptCardVariant = "library" | "gallery" | "greenhouse" | "commons";
```

---

## 6. Testing & Verification Strategy

### 6.1 Automated Checks

**Linting:**
```bash
npm run lint
```
Expected: 0 errors, 0 warnings

**Type Checking:**
```bash
npm run type-check
```
Expected: 0 TypeScript errors

**Build Verification:**
```bash
npm run build
```
Expected: Successful production build

### 6.2 Manual Testing Checklist

**Navigation Tests:**
- [ ] Header shows single "Librarian" nav item
- [ ] Clicking "Librarian" navigates to `/librarian`
- [ ] Active state highlights on all sub-routes (`/librarian/*`)
- [ ] Direct URL access to `/librarian/greenhouse` works
- [ ] Direct URL access to `/librarian/commons` works

**Redirect Tests:**
- [ ] Navigate to `/library` → redirects to `/librarian/greenhouse`
- [ ] Navigate to `/gallery` → redirects to `/librarian/commons`
- [ ] Redirect preserves query params (e.g., `/library?search=test`)
- [ ] Browser shows new URL after redirect (301 permanent)

**Functionality Tests:**
- [ ] Greenhouse: Search works
- [ ] Greenhouse: Filtering works
- [ ] Greenhouse: Empty state displays correctly
- [ ] Greenhouse: Prompt cards display with correct variant
- [ ] Commons: Search works
- [ ] Commons: Filtering works
- [ ] Commons: Fork to Greenhouse button works
- [ ] Librarian: Seedlings display
- [ ] Librarian: Save to Greenhouse button works
- [ ] Librarian: Navigation buttons to sub-pages work

**Animation Tests:**
- [ ] Page transitions smooth (200-300ms)
- [ ] Framer Motion animations preserved
- [ ] Loading skeletons animate correctly
- [ ] No animation jank or flicker

**Responsive Tests:**
- [ ] Mobile (320px): Single column layout
- [ ] Tablet (768px): 2-column grid
- [ ] Desktop (1280px): 3-column grid
- [ ] Navigation collapses correctly on mobile

**Error Handling Tests:**
- [ ] Network error: Retry button works
- [ ] Empty states: Correct messages display
- [ ] Console: Zero errors or warnings

### 6.3 Regression Testing

**Critical User Flows:**
1. Create new prompt → appears in Seedlings
2. Save to Greenhouse → moves from Seedlings to Greenhouse
3. Mark prompt as public → appears in Commons
4. Fork from Commons → creates copy in Greenhouse
5. Search in Greenhouse → filters correctly
6. Search in Commons → filters correctly

**Performance Baselines:**
- Initial page load: < 2s (no degradation from current)
- Search debounce: 300ms (unchanged)
- Animation duration: 200-300ms (unchanged)
- Greenhouse load time: < 1s for 50 prompts

---

## 7. Delivery Phases

### Phase 1: Route & Component Creation
**Goal:** Create new routes without breaking existing functionality

**Tasks:**
1. Create `app/librarian/greenhouse/page.tsx`
2. Create `app/librarian/commons/page.tsx`
3. Create `components/librarian/GreenhouseView.tsx` (copy from LibraryView)
4. Create `components/librarian/CommonsView.tsx` (copy from GalleryView)
5. Update PromptCard to support "greenhouse" and "commons" variants

**Verification:**
- New routes accessible via direct URL
- No TypeScript errors
- Existing routes still functional

---

### Phase 2: Redirect Implementation
**Goal:** Seamlessly redirect old URLs to new URLs

**Tasks:**
1. Update `middleware.ts` with redirect logic
2. Test redirects in dev environment
3. Verify 301 status codes
4. Verify query parameter preservation

**Verification:**
- `/library` → `/librarian/greenhouse` (301)
- `/gallery` → `/librarian/commons` (301)
- Query params preserved

---

### Phase 3: Navigation Updates
**Goal:** Update primary navigation to reflect new structure

**Tasks:**
1. Update `components/layout/Header.tsx` navLinks array
2. Update active state logic for sub-routes
3. (Optional) Create sub-navigation component
4. Update LibrarianView with navigation buttons

**Verification:**
- Header shows single "Librarian" link
- Active state works on all sub-routes
- Navigation buttons functional

---

### Phase 4: Internal Link Updates
**Goal:** Update all internal links to use new URLs

**Tasks:**
1. Search codebase for `/library` references
2. Search codebase for `/gallery` references
3. Update all `<Link>` components to new URLs
4. Update any hardcoded strings or comments

**Verification:**
- Grep search shows no remaining old URLs
- All internal links point to new routes

---

### Phase 5: Cleanup & Optimization
**Goal:** Remove deprecated code and optimize bundle

**Tasks:**
1. Delete `app/library/page.tsx`
2. Delete `app/gallery/page.tsx`
3. Delete `components/library/LibraryView.tsx`
4. Delete `components/gallery/GalleryView.tsx`
5. (Optional) Rename PromptCard variants to only "greenhouse" | "commons"
6. Run final lint and type-check

**Verification:**
- No unused files in codebase
- Bundle size not increased
- All tests still passing

---

### Phase 6: Documentation Updates
**Goal:** Update project documentation to reflect new architecture

**Tasks:**
1. Update `README.md` with new URL structure
2. Update `JOURNAL.md` with migration notes
3. Update `AUDIT_LOG.md` with completed work
4. (Optional) Update any PRD or spec files

**Verification:**
- Documentation accurate and up-to-date
- Examples use new URLs
- Architecture diagrams reflect new structure

---

## 8. Edge Cases & Error Handling

### 8.1 URL Preservation
**Scenario:** User has bookmarked `/library?search=test`  
**Solution:** Middleware redirects preserve query params  
**Test:** Verify `?search=test` persists after redirect

### 8.2 Active Route Highlighting
**Scenario:** On `/librarian/greenhouse`, header should highlight "Librarian"  
**Solution:** Use `pathname.startsWith('/librarian')` in Header  
**Test:** Verify active state on all sub-routes

### 8.3 Nested Route Access
**Scenario:** Direct navigation to `/librarian/greenhouse` skips landing page  
**Solution:** This is expected behavior - allow direct access  
**Test:** Verify page loads correctly without visiting `/librarian` first

### 8.4 Browser Back Button
**Scenario:** User navigates Library → redirects → clicks back  
**Solution:** 301 redirect updates browser history, back goes to previous page  
**Test:** Verify back button doesn't create redirect loop

### 8.5 Component Variant Mismatch
**Scenario:** PromptCard receives unknown variant during migration  
**Solution:** Use defensive coding with fallback  
```typescript
const variantClass = {
  library: "bg-blue-50",
  gallery: "bg-purple-50",
  greenhouse: "bg-green-50",
  commons: "bg-yellow-50",
}[variant] || "bg-gray-50"; // Fallback
```

---

## 9. Dependencies & Integration Points

### 9.1 No External Dependencies Required
All functionality uses existing dependencies:
- Next.js routing (built-in)
- Framer Motion (already installed)
- TypeScript (already configured)
- Tailwind CSS (already configured)

### 9.2 Integration Points
**Google Drive Sync:**
- No changes required to sync logic
- Prompts remain in `03_Prompts/` folder
- Metadata parsing unchanged

**Supabase:**
- No schema changes
- No RLS policy changes
- API routes unchanged

**Session/Auth:**
- No auth flow changes
- Session provider unchanged

---

## 10. Performance Considerations

### 10.1 Bundle Size Impact
**Expected:** Minimal increase (< 2 KB)
- Adding two new page routes (minimal overhead)
- Copying two view components (code duplication during migration)
- Redirect logic (< 500 bytes)

**Optimization:**
- Remove old routes in Phase 5 to eliminate duplication
- Consider code splitting if bundle size increases > 5 KB

### 10.2 Runtime Performance
**No degradation expected:**
- Same number of components rendered
- Same data fetching hooks
- Same animation patterns

**Potential improvement:**
- Cleaner navigation reduces mental model complexity
- Better route organization may improve route matching speed

### 10.3 SEO Impact
**Positive impact:**
- 301 redirects preserve link equity
- Cleaner URL structure improves crawlability
- Single navigation entry reduces sitemap complexity

---

## 11. Rollback Strategy

### 11.1 Rollback Triggers
- Type-check errors that can't be resolved quickly
- Build failures in production
- Critical functionality broken (search, filtering, save)
- Performance degradation > 20%

### 11.2 Rollback Procedure
**If caught in Phase 1-2:**
1. Delete new route folders
2. Remove redirect logic
3. Commit rollback

**If caught in Phase 3-4:**
1. Revert Header changes
2. Remove redirect logic
3. Keep new routes as "easter egg" routes
4. Commit rollback

**If caught in Phase 5:**
1. Restore old route files from git
2. Revert all changes
3. Full rollback required

### 11.3 Rollback Testing
- After rollback, verify old routes work
- Run full test suite
- Check for broken links

---

## 12. Security Considerations

### 12.1 No New Security Concerns
- No new API endpoints
- No new authentication logic
- No new database queries
- No new third-party dependencies

### 12.2 Existing Security Maintained
- RLS policies unchanged
- Auth middleware unchanged
- CSRF protection unchanged
- Input validation unchanged

---

## 13. Accessibility Considerations

### 13.1 Keyboard Navigation
- All new navigation links keyboard accessible
- Focus states visible on navigation items
- Tab order logical (header → main nav → sub nav → content)

### 13.2 Screen Readers
- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels on navigation (`aria-label="Librarian navigation"`)
- Semantic HTML (`<nav>`, `<main>`, `<section>`)

### 13.3 Existing Patterns Maintained
- Current implementation uses semantic HTML
- Framer Motion respects `prefers-reduced-motion`
- Color contrast ratios already meet WCAG 2.1 AA

---

## 14. Success Metrics

### 14.1 Technical Metrics
- ✅ Zero TypeScript errors
- ✅ Zero ESLint warnings
- ✅ Build time < 30s (no degradation)
- ✅ Bundle size increase < 2 KB
- ✅ All manual tests passing

### 14.2 Functional Metrics
- ✅ All existing features working
- ✅ Redirects functioning (301 status)
- ✅ Navigation updated
- ✅ Search/filter working on all pages
- ✅ Save/fork actions working

### 14.3 User Experience Metrics
- ✅ Navigation simplified (3 links → 1 link)
- ✅ URL structure clearer (`/librarian/greenhouse` vs `/library`)
- ✅ Consistent terminology (Greenhouse, Commons)
- ✅ No broken bookmarks (redirects working)

---

## 15. Open Questions & Decisions

### 15.1 Resolved Decisions

**Q1: Should we use middleware or next.config.mjs for redirects?**  
**A:** Use middleware.ts for consistency with existing auth patterns

**Q2: Should we rename PromptCard variants immediately?**  
**A:** Support both old and new variants during migration, clean up in Phase 5

**Q3: Should we add sub-navigation within Librarian pages?**  
**A:** Mark as optional (P2 priority), implement if time permits

**Q4: Should we update existing `/librarian` page or create new one?**  
**A:** Enhance existing page with navigation buttons (minimal changes)

### 15.2 Outstanding Questions
_(None - all decisions made based on requirements and codebase analysis)_

---

## 16. Timeline Estimate

**Total Estimated Time:** 3-4 hours

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Route & component creation | 45 min |
| Phase 2 | Redirect implementation | 20 min |
| Phase 3 | Navigation updates | 30 min |
| Phase 4 | Internal link updates | 20 min |
| Phase 5 | Cleanup & optimization | 20 min |
| Phase 6 | Documentation updates | 15 min |
| Testing | Manual testing & verification | 45 min |
| Buffer | Unexpected issues | 30 min |

**Critical Path:** Phase 1 → Phase 2 → Phase 3 (must be sequential)  
**Parallelizable:** Phase 4 and Phase 6 can be done in parallel with Phase 5

---

## Appendix A: File Reference Map

### Current → New File Mapping

| Current File | New File | Action |
|-------------|----------|--------|
| `app/library/page.tsx` | `app/librarian/greenhouse/page.tsx` | Copy → Delete |
| `app/gallery/page.tsx` | `app/librarian/commons/page.tsx` | Copy → Delete |
| `components/library/LibraryView.tsx` | `components/librarian/GreenhouseView.tsx` | Copy → Delete |
| `components/gallery/GalleryView.tsx` | `components/librarian/CommonsView.tsx` | Copy → Delete |
| `components/layout/Header.tsx` | `components/layout/Header.tsx` | Modify |
| `middleware.ts` | `middleware.ts` | Modify |
| `app/librarian/page.tsx` | `app/librarian/page.tsx` | Enhance |

---

## Appendix B: Code Change Summary

### Total Lines Changed (Estimated)
- **New files:** ~400 lines (2 pages + 2 components)
- **Modified files:** ~50 lines (Header + middleware + LibrarianView)
- **Deleted files:** ~250 lines (old pages + components)
- **Net change:** +200 lines

### TypeScript Interfaces Changed
- `PromptCardProps.variant` - extend type to include "greenhouse" | "commons"

### No Changes Required
- Database schema
- API routes
- Data fetching hooks
- Authentication logic
- Session management
- Supabase configuration

---

**End of Technical Specification**
