# Product Requirements Document: Seeds Page Rebuild

**Date:** 2026-01-14  
**Status:** Draft  
**Priority:** High

---

## Executive Summary

The Seeds page currently uses inconsistent styling, layout patterns, and component structure compared to other pages in the application (Dashboard, Workbench, Librarian). This rebuild will align the Seeds page with the established Dojo Genesis design system to create a cohesive user experience across the application.

---

## Problem Statement

### Current Issues

1. **Inconsistent Page Structure**
   - Uses `dynamic` import with complex loading state
   - Includes metadata export (not used in other pages)
   - Loading state duplicates header content unnecessarily

2. **Non-Standard Styling**
   - Uses hardcoded Tailwind colors instead of design system tokens
   - Custom spacing patterns (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`)
   - Sidebar layout not used in other pages

3. **Color System Inconsistency**
   - `text-gray-900 dark:text-gray-100` instead of `text-text-primary`
   - `text-gray-600 dark:text-gray-400` instead of `text-text-secondary`
   - `bg-white dark:bg-gray-900` instead of `bg-background`
   - And many more hardcoded color patterns

---

## Goals and Objectives

### Primary Goals

1. **Consistency**: Align Seeds page structure with Dashboard, Workbench, and Librarian pages
2. **Design System Compliance**: Replace all hardcoded colors with design system tokens
3. **Maintainability**: Simplify page component and reduce unnecessary complexity
4. **User Experience**: Maintain all existing functionality while improving visual consistency

### Success Metrics

- All hardcoded colors replaced with design system tokens
- Page structure matches reference pages (Dashboard, Workbench, Librarian)
- Application builds successfully without errors
- No loss of functionality
- No console errors on page load

---

## Reference Pages Analysis

### Consistent Pattern (Dashboard, Workbench, Librarian)

**Page Component Structure:**
```tsx
"use client";
import { ViewComponent } from "@/components/...";

export default function Page() {
  return <ViewComponent />;
}
```

**Styling Characteristics:**
- Uses design system colors (`text-text-primary`, `bg-background`, `text-text-secondary`)
- Simple padding (`p-12` for Dashboard, custom layouts for specialized pages like Workbench)
- Clean, uncluttered layouts
- No complex loading states in page component

---

## Detailed Requirements

### 1. Page Component (`app/seeds/page.tsx`)

**Current State:**
- Uses dynamic import with SSR disabled
- Complex loading state with duplicated header
- Metadata export

**Required Changes:**
- Remove dynamic import
- Remove metadata export
- Remove loading state
- Simplify to match Dashboard/Workbench/Librarian pattern

**Target Structure:**
```tsx
"use client";
import { SeedsView } from "@/components/seeds/SeedsView";

export default function SeedsPage() {
  return <SeedsView />;
}
```

---

### 2. SeedsView Component (`components/seeds/seeds-view.tsx`)

**Container & Layout Changes:**

| Current | Target |
|---------|--------|
| `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8` | `p-12` |
| Sidebar + main content layout | Maintain layout but update spacing |
| Custom spacing | Consistent spacing (`gap-8`, `mb-8`) |

**Color Replacements:**

| Current Pattern | Design System Token |
|----------------|-------------------|
| `text-gray-900 dark:text-gray-100` | `text-text-primary` |
| `text-gray-600 dark:text-gray-400` | `text-text-secondary` |
| `text-gray-500 dark:text-gray-500` | `text-text-tertiary` or `text-text-muted` |
| `text-green-600 dark:text-green-500` | `text-success` (already used in some places) |
| `bg-white dark:bg-gray-900` | `bg-background` |
| `bg-gray-50 dark:bg-gray-800` | `bg-surface` or `bg-bg-secondary` |
| `bg-gray-200 dark:bg-gray-800` | `bg-surface` or `bg-muted` |
| `border-gray-200 dark:border-gray-700` | `border-border` |
| `text-red-600 dark:text-red-400` | `text-error` |
| `bg-red-50 dark:bg-red-900/20` | `bg-error/10` |
| `border-red-200 dark:border-red-800` | `border-error/30` |

**Specific Elements to Update:**

1. **Header Section** (lines 241-260)
   - Title: `text-gray-900 dark:text-gray-100` → `text-text-primary`
   - Subtitle: `text-gray-600 dark:text-gray-400` → `text-text-secondary`

2. **Loading State** (lines 125-167)
   - Container: Use `p-12` instead of custom padding
   - Title/subtitle: Apply design system colors
   - Skeleton: `bg-gray-200 dark:bg-gray-800` → `bg-muted` or `bg-surface`

3. **Error State** (lines 169-212)
   - Container: Use `p-12` instead of custom padding
   - Error background: Already uses design system patterns (verify consistency)

4. **Search Input** (lines 296-312)
   - Placeholder: `text-gray-500 dark:text-gray-400` → `text-muted-foreground` (already correct)
   - Icon: `text-gray-500 dark:text-gray-400` → `text-text-muted` or `text-text-tertiary`

5. **Empty State** (lines 315-326)
   - Title: `text-gray-900 dark:text-gray-100` → `text-text-primary`
   - Description: `text-gray-600 dark:text-gray-400` → `text-text-secondary`
   - Icon: `text-gray-400` → `text-text-muted`

6. **Results Count** (lines 329-331)
   - `text-gray-600 dark:text-gray-400` → `text-text-secondary`

---

### 3. Child Components

**Components to Update:**

1. **SeedCard** (`components/seeds/seed-card.tsx`)
   - ✅ Already uses design system colors (verified)
   - No changes needed

2. **SeedFiltersPanel** (`components/seeds/filters-panel.tsx`)
   - ✅ Already uses design system colors (verified)
   - No changes needed

3. **SeedDetailView** (`components/seeds/seed-detail-view.tsx`)
   - **Container**: `max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8` → `p-12` (or appropriate padding)
   - **Back button** (line 177): `text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100` → `text-text-secondary hover:text-text-primary`
   - **Error messages** (lines 191-206): Verify consistency with design system
   - **Card backgrounds** (lines 209-390):
     - `bg-white dark:bg-gray-900` → `bg-background`
     - `border-gray-200 dark:border-gray-700` → `border-border`
     - `bg-gray-50 dark:bg-gray-800` → `bg-bg-secondary` or `bg-surface`
   - **Content sections**:
     - `text-gray-700 dark:text-gray-300` → `text-text-secondary`
     - `text-gray-900 dark:text-gray-100` → `text-text-primary`
     - `text-gray-500 dark:text-gray-400` → `text-text-tertiary` or `text-text-muted`
   - **Action buttons** (lines 310-347): Verify color consistency

4. **PlantSeedModal** (`components/seeds/plant-seed-modal.tsx`)
   - ✅ Already uses design system colors (verified)
   - Uses `bg-bg-primary`, `text-text-primary`, `border-border`, etc.
   - No changes needed

---

## Design Tokens Reference

Based on analysis of the codebase, the following design tokens are available:

### Text Colors
- `text-text-primary`: Main text color
- `text-text-secondary`: Secondary text
- `text-text-tertiary`: Tertiary text (less prominent)
- `text-text-muted`: Muted/placeholder text
- `text-foreground`: Foreground text (similar to primary)
- `text-muted-foreground`: Muted foreground text

### Background Colors
- `bg-background`: Main background
- `bg-bg-primary`: Primary background
- `bg-bg-secondary`: Secondary background
- `bg-bg-tertiary`: Tertiary background
- `bg-surface`: Surface color
- `bg-card`: Card background
- `bg-muted`: Muted background
- `bg-secondary`: Secondary surface

### Border Colors
- `border-border`: Standard border
- `border-bg-tertiary`: Tertiary border

### Semantic Colors
- `text-success`, `bg-success`: Success states (green)
- `text-error`, `bg-error`: Error states (red)
- `text-warning`, `bg-warning`: Warning states
- `text-info`, `bg-info`: Info states (blue)
- `text-accent`, `bg-accent`: Accent color

### Agent/Context Colors
- `text-dojo`, `bg-dojo`: Dojo context
- `text-librarian`, `bg-librarian`: Librarian context
- `text-supervisor`, `bg-supervisor`: Supervisor context

---

## Layout Considerations

### Current Layout
The Seeds page uses a sidebar + main content layout:
- Sidebar (left): 256px wide (`w-64`) - contains filters
- Main (right): Flex-1 - contains search and seed grid

### Decision Required
**Should we maintain the sidebar layout or convert to single-column?**

**Recommendation: Maintain sidebar layout** because:
1. Filters are a core feature of the Seeds page
2. The sidebar is functional, not just decorative
3. Other pages have specialized layouts when needed (e.g., Workbench uses panel layout)
4. **Only the spacing and colors need updating, not the structure**

---

## Functional Requirements

### Must Maintain

1. **Search Functionality**
   - Debounced search with 300ms delay
   - Search by name or content

2. **Filter System**
   - Type filters (principle, pattern, question, route, artifact, constraint)
   - Status filters (new, growing, mature, compost)
   - Clear all filters option

3. **Seed Management**
   - View seed details
   - Update seed status (Keep, Grow, Compost)
   - Delete seeds
   - Plant new seeds

4. **Detail View**
   - Full seed information display
   - Status update actions
   - Export memory patch
   - Delete functionality
   - Back to list navigation

5. **State Management**
   - Loading states
   - Error handling
   - Success feedback

---

## Non-Functional Requirements

1. **Performance**
   - No performance degradation
   - Maintain existing debounce behavior
   - Preserve animation performance

2. **Accessibility**
   - Maintain all ARIA labels
   - Preserve keyboard navigation
   - Keep focus management

3. **Responsive Design**
   - Maintain responsive breakpoints
   - Ensure mobile compatibility

---

## Acceptance Criteria

### Must Pass

- [ ] Seeds page structure matches the pattern of Dashboard/Workbench/Librarian pages
- [ ] All hardcoded gray/color values replaced with design system tokens in `seeds-view.tsx`
- [ ] All hardcoded gray/color values replaced with design system tokens in `seed-detail-view.tsx`
- [ ] Spacing is consistent with design system (`p-12`, `gap-8`, `mb-8`)
- [ ] Layout is clean and uncluttered
- [ ] All functionality is preserved:
  - [ ] Search works
  - [ ] Filters work
  - [ ] View seed details works
  - [ ] Update seed status works
  - [ ] Delete seed works
  - [ ] Plant new seed works
  - [ ] Export memory patch works
- [ ] Application builds successfully (`npm run build`)
- [ ] The Seeds page loads without console errors
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Empty states display correctly
- [ ] All animations work smoothly

### Visual Verification

- [ ] Seeds page visually consistent with Dashboard, Workbench, and Librarian
- [ ] Dark mode works correctly with new tokens
- [ ] Light mode works correctly with new tokens
- [ ] No color flashing or theme inconsistencies

---

## Out of Scope

The following are explicitly **NOT** part of this rebuild:

1. **Functional Changes**
   - Adding new features
   - Changing seed data model
   - Modifying filter logic
   - Changing search behavior

2. **Child Components Already Compliant**
   - `SeedCard` (already uses design system)
   - `SeedFiltersPanel` (already uses design system)
   - `PlantSeedModal` (already uses design system)

3. **New Components**
   - No new components will be created
   - Only existing components will be modified

---

## Implementation Notes

### Files to Modify

1. **Primary Changes:**
   - `app/seeds/page.tsx` - Complete rewrite (simple)
   - `components/seeds/seeds-view.tsx` - Color and spacing updates
   - `components/seeds/seed-detail-view.tsx` - Color and spacing updates

2. **No Changes Needed:**
   - `components/seeds/seed-card.tsx` ✅
   - `components/seeds/filters-panel.tsx` ✅
   - `components/seeds/plant-seed-modal.tsx` ✅

### Testing Strategy

1. **Build Verification**
   - Run `npm run build` to ensure no TypeScript errors
   - Check for build warnings

2. **Runtime Testing**
   - Load Seeds page and verify no console errors
   - Test all CRUD operations
   - Test search and filter functionality
   - Test state transitions (loading, error, empty, populated)
   - Test both light and dark modes

3. **Visual Testing**
   - Compare Seeds page appearance with Dashboard
   - Verify spacing consistency
   - Check color consistency across themes

---

## Questions for Stakeholder

None at this time. The requirements are clear based on the provided analysis document and codebase review. The rebuild is a straightforward refactoring to align with established patterns.

---

## Assumptions

1. **Design System is Complete**: All referenced design tokens exist and are properly configured in the Tailwind config
2. **No Breaking Changes**: The current functionality works correctly and should be preserved exactly as-is
3. **Sidebar Layout is Intentional**: The sidebar layout serves a functional purpose and should be maintained
4. **Animation Library is Stable**: Framer Motion animations will continue to work without modification
5. **Build Commands**: The project uses standard Next.js build commands

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking existing functionality | Low | High | Thorough manual testing of all features |
| Missing design tokens | Low | Medium | Verify tokens exist before implementation |
| Dark mode issues | Low | Medium | Test both themes during development |
| Layout breaks on mobile | Low | Medium | Maintain responsive classes |
| Performance regression | Very Low | Low | Keep existing debounce and optimization |

---

## Dependencies

- No new dependencies required
- Uses existing libraries: React, Next.js, Framer Motion, Tailwind CSS
- Depends on existing design system tokens being available

---

## Timeline Estimate

- Page component simplification: 5 minutes
- SeedsView color updates: 30 minutes
- SeedDetailView color updates: 20 minutes
- Testing and verification: 30 minutes
- **Total estimated time: ~90 minutes**

---

## Appendix: Color Mapping Quick Reference

```
Gray Scale (Light/Dark) → Design Token
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
text-gray-900/100      → text-text-primary
text-gray-600/400      → text-text-secondary
text-gray-500/400      → text-text-tertiary OR text-text-muted
text-gray-400          → text-text-muted

bg-white/gray-900      → bg-background OR bg-bg-primary
bg-gray-50/gray-800    → bg-bg-secondary OR bg-surface
bg-gray-200/gray-800   → bg-muted

border-gray-200/700    → border-border

Semantic Colors (Light/Dark) → Design Token
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
text-green-600/500     → text-success
text-red-600/400       → text-error
bg-red-50/red-900/20   → bg-error/10
border-red-200/800     → border-error/30
```
