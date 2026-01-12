# Product Requirements Document: Unified Librarian Home

**Feature:** Unified `/librarian` Namespace
**Author:** AI Assistant
**Date:** January 12, 2026
**Status:** Requirements Defined

---

## 1. Executive Summary

Consolidate the fragmented prompt management experience (`/library`, `/gallery`, `/librarian`) into a unified `/librarian` namespace that provides a cohesive, intuitive interface for all prompt-related activities.

---

## 2. Problem Statement

### Current Issues
- **Fragmented Experience:** Users must navigate between three separate pages (`/library`, `/gallery`, `/librarian`) for related prompt management tasks
- **Confusing Information Architecture:** The relationship between "Library", "Gallery", and "Librarian" is unclear
- **Inconsistent Naming:** "Library" vs "Greenhouse" terminology creates conceptual confusion
- **Navigation Complexity:** Three top-level nav items for what should be a single cohesive feature area

### User Impact
Users struggle to understand:
- Where to find their personal prompts
- Where to discover community prompts  
- How the Librarian's Home relates to Library/Gallery
- The difference between "active" prompts (Seedlings), "saved" prompts (Greenhouse), and "library" prompts

---

## 3. Goals & Success Criteria

### Primary Goals
1. **Unified Navigation:** Single `/librarian` entry point for all prompt management
2. **Clear Hierarchy:** Logical sub-navigation between personal and community spaces
3. **Preserved Functionality:** All existing features continue to work seamlessly
4. **Improved Discoverability:** Users intuitively understand the prompt lifecycle

### Success Metrics
- ✅ All internal links updated to new URL structure
- ✅ Zero broken links or 404 errors
- ✅ Existing functionality (search, filtering, status transitions) preserved
- ✅ Navigation structure reflects new hierarchy in Header component
- ✅ Lint and type-check pass with zero errors

### Non-Goals (Out of Scope)
- AI-generated imagery for Greenhouse
- 2D map UI for Global Commons
- Proactive suggestions (semantic search)
- Automated tagging and categorization
- Changes to existing UI/UX design (layout, styling, animations)

---

## 4. User Stories

### US-1: Unified Navigation
**As a** prompt engineer  
**I want** a single "Librarian" nav item with sub-navigation  
**So that** I can easily access all prompt management features from one place

**Acceptance Criteria:**
- Header shows single "Librarian" nav item (not separate Library/Gallery links)
- Sub-navigation within `/librarian` provides access to Greenhouse and Commons
- Active state highlighting works correctly for all routes

---

### US-2: Personal Prompt Library (Greenhouse)
**As a** prompt engineer  
**I want** to access my personal prompts at `/librarian/greenhouse`  
**So that** I can view, search, and manage my mature prompts

**Acceptance Criteria:**
- `/librarian/greenhouse` shows the same content as current `/library`
- All search, filtering, and card interactions work identically
- "Fork to Library" actions from Commons direct to Greenhouse
- Direct navigation to `/library` redirects to `/librarian/greenhouse`

---

### US-3: Community Prompt Discovery (Commons)
**As a** prompt engineer  
**I want** to discover public prompts at `/librarian/commons`  
**So that** I can explore and fork community-contributed prompts

**Acceptance Criteria:**
- `/librarian/commons` shows the same content as current `/gallery`
- All search, filtering, and fork functionality works identically
- Public prompts (with `public: true` frontmatter) display correctly
- Direct navigation to `/gallery` redirects to `/librarian/commons`

---

### US-4: Librarian Landing Page
**As a** prompt engineer  
**I want** the `/librarian` page to show an overview of my prompt garden  
**So that** I can quickly see my active work and access detailed views

**Acceptance Criteria:**
- Seedlings section shows active prompts (status: "active")
- Greenhouse preview shows count/summary of saved prompts
- Clear navigation links/buttons to `/librarian/greenhouse` and `/librarian/commons`
- Existing functionality (save to greenhouse, critique scores) preserved

---

## 5. Technical Requirements

### 5.1 URL Structure

| Current Route | New Route | Behavior |
|---------------|-----------|----------|
| `/library` | `/librarian/greenhouse` | Redirect or move |
| `/gallery` | `/librarian/commons` | Redirect or move |
| `/librarian` | `/librarian` | Enhanced landing page |

### 5.2 File Structure Changes

**Pages to Create/Modify:**
```
app/
  librarian/
    page.tsx              # Enhanced landing page
    greenhouse/
      page.tsx            # New - migrated from library/page.tsx
    commons/
      page.tsx            # New - migrated from gallery/page.tsx
```

**Components to Create/Modify:**
```
components/
  librarian/
    LibrarianView.tsx     # Modify - enhanced with navigation
    GreenhouseView.tsx    # New - migrated from library/LibraryView.tsx
    CommonsView.tsx       # New - migrated from gallery/GalleryView.tsx
```

**Navigation Updates:**
- `components/layout/Header.tsx` - Update navLinks array

### 5.3 Component Contracts

**GreenhouseView (formerly LibraryView)**
- **Purpose:** Display personal prompt library with search/filter
- **Data Source:** `useLibrary()` hook (unchanged)
- **Variants:** PromptCard with `variant="library"` (rename to "greenhouse")

**CommonsView (formerly GalleryView)**
- **Purpose:** Display public community prompts
- **Data Source:** `useGallery()` hook (unchanged)
- **Variants:** PromptCard with `variant="gallery"` (rename to "commons")

**LibrarianView (current)**
- **Purpose:** Landing page with Seedlings + Greenhouse preview
- **Enhancements:** Add navigation buttons/links to Greenhouse and Commons
- **Data Source:** `useLibrarian()` hook (unchanged)

### 5.4 Data Model

No changes to data model required. All existing hooks and API routes remain functional.

### 5.5 Redirects (Optional Enhancement)

For backward compatibility, consider implementing redirects:
- `/library` → `/librarian/greenhouse`
- `/gallery` → `/librarian/commons`

Implementation options:
- Next.js middleware
- `next.config.mjs` redirects
- Client-side redirect components

**Decision:** Implement via Next.js middleware for clean server-side redirects.

---

## 6. Design Requirements

### 6.1 Navigation Structure

**Header (Primary Nav):**
```
[Home] [Librarian] [User Menu]
```

**Librarian Sub-Navigation:**
```
The Librarian's Home
[Overview] [Greenhouse] [Commons]
```

### 6.2 Visual Consistency

- Maintain existing design system (colors, typography, animations)
- Preserve all Framer Motion animations
- Keep existing icons and visual metaphors:
  - 🌱 Seedlings (active prompts)
  - 🌺 Greenhouse (saved/mature prompts)
  - ✨ Commons (public/community prompts)

### 6.3 Responsive Behavior

All pages must maintain responsive behavior:
- Mobile: 320px - 767px (single column)
- Tablet: 768px - 1279px (2 columns)
- Desktop: 1280px+ (3 columns)

---

## 7. Edge Cases & Considerations

### 7.1 Direct URL Access
**Scenario:** User has bookmarked `/library` or `/gallery`  
**Solution:** Server-side redirect to new URLs (301 Permanent Redirect)

### 7.2 Active State Highlighting
**Scenario:** Sub-routes like `/librarian/greenhouse` need active state in nav  
**Solution:** Use `pathname.startsWith('/librarian')` for main nav, nested tabs for sub-nav

### 7.3 PromptCard Variants
**Scenario:** PromptCard uses `variant="library" | "gallery"`  
**Solution:** Update to `variant="greenhouse" | "commons"` for clarity

### 7.4 Fork/Copy Actions
**Scenario:** "Fork to Library" button text may be confusing  
**Solution:** Update to "Fork to Greenhouse" for consistency

---

## 8. Migration Strategy

### Phase 1: Create New Routes
1. Create `/librarian/greenhouse` and `/librarian/commons` pages
2. Migrate components (LibraryView → GreenhouseView, GalleryView → CommonsView)
3. Update imports and references

### Phase 2: Update Navigation
1. Modify Header component navigation array
2. Add sub-navigation to Librarian pages
3. Update active state logic

### Phase 3: Enhance Landing Page
1. Add navigation buttons to Greenhouse and Commons on `/librarian`
2. Update metadata and descriptions
3. Add Greenhouse preview section (optional)

### Phase 4: Cleanup & Redirects
1. Remove `/library` and `/gallery` page files
2. Implement redirects in middleware
3. Update all internal links

### Phase 5: Documentation
1. Update `README.md` with new URL structure
2. Update `JOURNAL.md` with architectural changes
3. Update `AUDIT_LOG.md` with completed work

---

## 9. Testing Requirements

### Manual Testing Checklist
- [ ] Navigate to `/librarian` - shows enhanced landing page
- [ ] Navigate to `/librarian/greenhouse` - shows personal prompts
- [ ] Navigate to `/librarian/commons` - shows public prompts
- [ ] Direct access to `/library` redirects to `/librarian/greenhouse`
- [ ] Direct access to `/gallery` redirects to `/librarian/commons`
- [ ] Header nav highlights active "Librarian" item on all sub-routes
- [ ] Search and filtering work on Greenhouse and Commons pages
- [ ] "Save to Greenhouse" button works from Seedlings
- [ ] "Fork to Greenhouse" button works from Commons
- [ ] All animations preserve 200-300ms timing
- [ ] Responsive layout works at 320px, 768px, 1280px
- [ ] Zero console errors or warnings
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run build` succeeds

---

## 10. Open Questions & Assumptions

### Assumptions Made
1. **Sub-Navigation Pattern:** Sub-navigation will be implemented as horizontal tabs within Librarian pages (not dropdown in Header)
2. **Redirect Type:** 301 Permanent Redirect for old URLs (SEO-friendly, indicates permanent move)
3. **Component Naming:** "Greenhouse" and "Commons" are preferred over "Library" and "Gallery" for clarity
4. **Landing Page Content:** Existing `/librarian` landing page already shows Seedlings + Greenhouse - minimal changes needed

### Questions for Clarification
_(None - all necessary decisions have been made based on context)_

---

## 11. Dependencies & Constraints

### Technical Dependencies
- Next.js 14 App Router (existing)
- TypeScript (existing)
- Framer Motion (existing)
- Supabase (existing - no changes)

### Constraints
- **No Backend Changes:** All database schemas, API routes, and hooks remain unchanged
- **Backward Compatibility:** Old URLs must redirect cleanly (no broken bookmarks)
- **Zero Downtime:** Migration should be seamless for active users
- **Preserve Performance:** No degradation in load times or animation smoothness

---

## 12. Acceptance Criteria Summary

### Must Have (P0)
- ✅ `/librarian/greenhouse` replaces `/library` with identical functionality
- ✅ `/librarian/commons` replaces `/gallery` with identical functionality
- ✅ Header navigation updated with single "Librarian" entry
- ✅ All internal links updated to new URL structure
- ✅ Zero TypeScript errors, zero ESLint warnings
- ✅ All existing tests pass (if applicable)

### Should Have (P1)
- ✅ Server-side redirects for `/library` and `/gallery`
- ✅ Sub-navigation within Librarian pages
- ✅ Enhanced `/librarian` landing page with navigation to sub-pages

### Could Have (P2)
- ⏸️ Update PromptCard variant names ("greenhouse", "commons")
- ⏸️ Breadcrumb navigation for sub-pages
- ⏸️ Animated transitions between sub-pages

### Won't Have (Out of Scope)
- ❌ AI-generated Greenhouse imagery
- ❌ 2D map UI for Commons
- ❌ Semantic search / proactive suggestions
- ❌ Automated tagging

---

## Appendix: Current vs. Target State

### Current Navigation
```
Header:
[Library] [Gallery] [Librarian]

Routes:
/library      → LibraryView (personal prompts)
/gallery      → GalleryView (public prompts)
/librarian    → LibrarianView (seedlings + greenhouse preview)
```

### Target Navigation
```
Header:
[Librarian]

Routes:
/librarian               → LibrarianView (landing: seedlings + greenhouse preview + nav to sub-pages)
/librarian/greenhouse    → GreenhouseView (personal prompts, formerly /library)
/librarian/commons       → CommonsView (public prompts, formerly /gallery)

Redirects:
/library    → 301 → /librarian/greenhouse
/gallery    → 301 → /librarian/commons
```

---

**End of PRD**
