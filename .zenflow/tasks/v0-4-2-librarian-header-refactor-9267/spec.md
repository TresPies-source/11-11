# Technical Specification: v0.4.2 Librarian Header Refactor

**Task ID:** v0-4-2-librarian-header-refactor-9267
**Difficulty:** Easy
**Estimated Effort:** 30-45 minutes
**Date:** January 14, 2026

---

## 1. Overview

This is a targeted follow-up task to complete the Librarian visual refactor. The previous refactor successfully updated all sub-components but **missed the main page header** in `LibrarianView.tsx`. This spec focuses on:

1. Creating a reusable `PageHeader.tsx` component
2. Updating `LibrarianView.tsx` to use the new component with correct content

---

## 2. Technical Context

### 2.1. Language & Framework
- **Language:** TypeScript
- **Framework:** Next.js 14 (React 18)
- **Styling:** Tailwind CSS with custom design tokens
- **Animation:** Framer Motion 11.15
- **Icons:** lucide-react 0.469

### 2.2. Design System
The project uses the **Dojo Genesis Design System** with standardized:
- **Colors:** CSS variables (e.g., `text-text-primary`, `bg-bg-secondary`)
- **Typography:** Inter font family with standard sizes (`text-3xl`, `text-lg`)
- **Spacing:** Standard Tailwind scale (`gap-3`, `mt-2`, `mb-8`)
- **Animations:** Framer Motion with standard durations (200ms)

### 2.3. Related Documentation
- **Source of Truth:** `02_Specs/V0.4.2_LIBRARIAN_MERGED_SPEC.md`
- **Analysis:** `05_Logs/LIBRARIAN_REFACTOR_ANALYSIS_PART2.MD`

---

## 3. Implementation Approach

### 3.1. Task Breakdown

**Task 1: Create Reusable PageHeader Component**
- Create new file: `components/shared/PageHeader.tsx`
- Implement flexible header component with:
  - Title (string)
  - Subtitle (string)
  - Icon (LucideIcon)
  - Optional icon className
- Use Framer Motion for entrance animation
- Apply Dojo Genesis design system styles

**Task 2: Refactor LibrarianView.tsx**
- Import new `PageHeader` component and `LibraryBig` icon
- Replace old `<motion.header>` block (lines 184-198)
- Use new component with correct props

### 3.2. Why This Approach?

1. **Component Reusability:** Extracting the header pattern into a shared component ensures consistency across all main pages (Librarian, Greenhouse, Commons, etc.)
2. **Design System Compliance:** Using standardized props and styles ensures adherence to the Dojo Genesis design system
3. **Maintainability:** Centralizing the header logic reduces code duplication and makes future updates easier
4. **Flexibility:** The component accepts an icon and optional className, making it adaptable for different agent pages with different brand colors

---

## 4. Source Code Changes

### 4.1. New Files

**File:** `components/shared/PageHeader.tsx`
**Purpose:** Reusable page header component for all main pages
**Key Features:**
- Animated entrance with Framer Motion
- Flexible icon and title/subtitle props
- Design system compliant styling
- Accessibility support (aria-hidden on decorative icon)

### 4.2. Modified Files

**File:** `components/librarian/LibrarianView.tsx`

**Changes:**
1. **Imports (Line 5):**
   - Add: `import { LibraryBig } from "lucide-react";`
   - Remove: `BookHeart` and `Sparkles` from imports
   - Add: `import { PageHeader } from "@/components/shared/PageHeader";`

2. **Header Section (Lines 184-198):**
   - Remove: Entire `<motion.header>` block
   - Replace with: `<PageHeader>` component using:
     - `title="Librarian"`
     - `subtitle="Search, discover, and manage your collective intelligence."`
     - `icon={LibraryBig}`
     - `iconClassName="text-librarian"`

**Before (Lines 184-198):**
```tsx
<motion.header
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
  className="mb-8"
>
  <h1 className="text-2xl font-sans font-bold text-text-primary flex items-center gap-3">
    <BookHeart className="h-8 w-8 text-librarian" aria-hidden="true" />
    The Librarian&apos;s Home
  </h1>
  <p className="text-text-secondary mt-2 flex items-center gap-2">
    <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
    Cultivate your prompts, grow your library, and watch your ideas flourish
  </p>
</motion.header>
```

**After:**
```tsx
<PageHeader
  title="Librarian"
  subtitle="Search, discover, and manage your collective intelligence."
  icon={LibraryBig}
  iconClassName="text-librarian"
/>
```

---

## 5. Data Model / API / Interface Changes

### 5.1. New Interface

```typescript
interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconClassName?: string;
}
```

**Rationale:** This interface provides the minimal required props for a flexible page header while maintaining type safety.

---

## 6. Verification Approach

### 6.1. Manual Verification

1. **Visual Inspection:**
   - Navigate to `/librarian` page
   - Verify header displays:
     - Title: "Librarian"
     - Subtitle: "Search, discover, and manage your collective intelligence."
     - Icon: LibraryBig (library/bookshelf icon)
     - Icon color: teal (from `text-librarian` class)
   - Verify entrance animation plays smoothly (200ms fade-in)

2. **Responsive Design:**
   - Test on mobile, tablet, and desktop viewports
   - Verify text wraps appropriately
   - Verify icon stays aligned with title

3. **Accessibility:**
   - Verify icon has `aria-hidden="true"` attribute
   - Test with screen reader to ensure proper heading structure

### 6.2. Functional Testing

1. **No Regressions:**
   - Verify all existing Librarian functionality works:
     - Semantic search
     - Suggestions panel
     - Recent searches
     - Active prompts (Seedlings)
     - Saved prompts (Greenhouse)
   - Verify no console errors
   - Verify no broken imports

2. **Component Isolation:**
   - Verify `PageHeader` can be imported elsewhere
   - Verify it works with different icons and colors

### 6.3. Build & Lint

Run the following commands to ensure code quality:

```bash
npm run type-check
npm run lint
npm run build
```

**Success Criteria:**
- ✅ No TypeScript errors
- ✅ No ESLint warnings/errors
- ✅ Build completes successfully
- ✅ No runtime errors in browser console

---

## 7. Edge Cases & Considerations

### 7.1. Icon Usage
- **Issue:** Other files also use `BookHeart` icon (`app/librarian/error.tsx`)
- **Decision:** Do NOT modify error.tsx - it's out of scope
- **Rationale:** This task is focused only on the main page header refactor

### 7.2. Text Content
- **Old:** "The Librarian's Home" with subtitle "Cultivate your prompts, grow your library, and watch your ideas flourish"
- **New:** "Librarian" with subtitle "Search, discover, and manage your collective intelligence."
- **Rationale:** Per the merged spec, the new text is more concise and aligns with the Dojo Genesis brand voice

### 7.3. Font Size
- **Old:** `text-2xl` (1.5rem / 24px)
- **New:** `text-3xl` (1.875rem / 30px)
- **Rationale:** Per the design system, main page titles should use `text-3xl` for better hierarchy

### 7.4. Animation Timing
- **Maintained:** 200ms entrance animation
- **Rationale:** Matches the Dojo Genesis design system animation standards

---

## 8. Risks & Mitigations

### 8.1. Import Path Issues
**Risk:** Incorrect import path for new component
**Mitigation:** Use `@/components/shared/PageHeader` alias (already configured in tsconfig.json)

### 8.2. Color Token Missing
**Risk:** `text-librarian` class might not be defined
**Mitigation:** Verify in `tailwind.config.ts` before implementation (likely already exists from previous refactor)

### 8.3. Breaking Other Pages
**Risk:** Changes to shared component might affect other pages
**Mitigation:** This is a NEW component, so no existing dependencies. Future usage is intentional.

---

## 9. Success Criteria

**Task is complete when:**
- ✅ `PageHeader.tsx` exists at `components/shared/PageHeader.tsx`
- ✅ Old header code removed from `LibrarianView.tsx` (lines 184-198)
- ✅ `LibrarianView.tsx` uses new `<PageHeader>` component
- ✅ `/librarian` page displays correct title ("Librarian"), subtitle, and icon
- ✅ Page styling matches Dojo Genesis design system
- ✅ All existing functionality remains intact
- ✅ `npm run type-check` passes
- ✅ `npm run lint` passes
- ✅ `npm run build` succeeds

---

## 10. Out of Scope

The following items are explicitly **NOT** part of this task:
- ❌ Updating other files that use `BookHeart` icon
- ❌ Refactoring other page headers (Greenhouse, Commons) - future work
- ❌ Modifying any other Librarian sub-components
- ❌ Changes to error handling or loading states
- ❌ Database or API changes
- ❌ Test file creation (no existing test files for UI components)

---

## 11. Dependencies

**No external dependencies required.** All necessary packages are already installed:
- ✅ lucide-react (0.469.0)
- ✅ framer-motion (11.15.0)
- ✅ tailwindcss (3.4.17)
- ✅ next (14.2.24)
- ✅ react (18.3.1)

---

## 12. Rollback Plan

If issues arise:
1. Revert `PageHeader.tsx` creation
2. Restore original header code in `LibrarianView.tsx` (lines 184-198)
3. Revert import changes

**Git commands:**
```bash
git checkout HEAD -- components/shared/PageHeader.tsx
git checkout HEAD -- components/librarian/LibrarianView.tsx
```
