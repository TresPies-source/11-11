# Technical Specification: Seeds Page Rebuild

**Date:** 2026-01-14  
**Status:** Draft  
**Version:** 1.0

---

## 1. Technical Context

### Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system (Dojo Genesis)
- **UI Library**: Custom components (`@/components/ui`)
- **State Management**: React hooks (`useSeeds`, `useDebounce`)
- **Database**: PGlite (client-side)
- **Animation**: Framer Motion

### Design System
The application uses a custom design system defined in:
- `tailwind.config.ts`: Design tokens and color palette
- `app/globals.css`: CSS variable definitions
- Color tokens are prefixed with semantic names (`text-text-primary`, `bg-background`, etc.)

### Reference Implementations
- **Dashboard** (`app/dashboard/page.tsx`): Simple client component pattern
- **Workbench** (`app/workbench/page.tsx`): Minimal page delegation pattern
- **Librarian** (`app/librarian/page.tsx`): Consistent with Dashboard/Workbench

---

## 2. Implementation Approach

### 2.1 Architecture Pattern

The rebuild follows the **established pattern** across Dashboard, Workbench, and Librarian:

```
Page Component (app/*/page.tsx)
  └─> "use client" directive
  └─> Import View component
  └─> Render View component (no logic)

View Component (components/*/View.tsx)
  └─> Contains all business logic
  └─> Uses design system tokens
  └─> Manages local state
```

### 2.2 Design System Migration Strategy

Replace all hardcoded Tailwind color classes with design system tokens:

| Category | Current (Hardcoded) | Target (Design System) |
|----------|---------------------|------------------------|
| **Text** | `text-gray-900 dark:text-gray-100` | `text-text-primary` |
| **Text** | `text-gray-600 dark:text-gray-400` | `text-text-secondary` |
| **Text** | `text-gray-500 dark:text-gray-400` | `text-text-tertiary` or `text-text-muted` |
| **Background** | `bg-white dark:bg-gray-900` | `bg-background` |
| **Background** | `bg-gray-50 dark:bg-gray-800` | `bg-bg-secondary` |
| **Background** | `bg-gray-200 dark:bg-gray-800` | `bg-muted` or `bg-surface` |
| **Border** | `border-gray-200 dark:border-gray-700` | `border-border` |
| **Semantic** | `text-green-600 dark:text-green-500` | `text-success` (already used) |
| **Semantic** | `text-red-600 dark:text-red-400` | `text-error` |

### 2.3 Layout Strategy

**Decision: Maintain sidebar layout**

Rationale:
- Filters are a core feature requiring dedicated space
- Workbench also uses specialized layouts (panel-based)
- Only spacing needs updating, not structure
- Update container from `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8` to `p-12`

---

## 3. Source Code Changes

### 3.1 File Modifications

#### **Priority 1: Page Component**
**File:** `app/seeds/page.tsx`

**Changes:**
- Remove `dynamic` import
- Remove `Metadata` export
- Remove complex loading state
- Add `"use client"` directive
- Simplify to direct import pattern

**Before:**
```tsx
import dynamic from "next/dynamic";
import { Metadata } from "next";
// ... complex loading state

export const metadata: Metadata = {...};
export default function SeedsPage() { return <SeedsView />; }
```

**After:**
```tsx
"use client";
import { SeedsView } from "@/components/seeds/SeedsView";

export default function SeedsPage() {
  return <SeedsView />;
}
```

---

#### **Priority 2: SeedsView Component**
**File:** `components/seeds/seeds-view.tsx`

**Changes:**

1. **Container (Line 127, 171, 239)**
   - Replace `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8` with `p-12`

2. **Header Section (Lines 130, 134, 174, 178, 243, 247)**
   - `text-gray-900 dark:text-gray-100` → `text-text-primary`
   - `text-gray-600 dark:text-gray-400` → `text-text-secondary`

3. **Loading State Skeletons (Lines 151, 156, 159)**
   - `bg-white dark:bg-gray-900` → `bg-background`
   - `border-gray-200 dark:border-gray-700` → `border-border`
   - `bg-gray-200 dark:bg-gray-800` → `bg-muted`

4. **Error State (Line 193, background colors)**
   - Verify consistency (already appears correct with error tokens)

5. **Search Icon (Line 298)**
   - `text-gray-500 dark:text-gray-400` → `text-text-muted`

6. **Empty State (Lines 317, 318, 321)**
   - `text-gray-400` → `text-text-muted`
   - `text-gray-900 dark:text-gray-100` → `text-text-primary`
   - `text-gray-600 dark:text-gray-400` → `text-text-secondary`

7. **Results Count (Line 329)**
   - `text-gray-600 dark:text-gray-400` → `text-text-secondary`

**Estimated Changes:** ~15-20 lines

---

#### **Priority 3: SeedDetailView Component**
**File:** `components/seeds/seed-detail-view.tsx`

**Changes:**

1. **Container (Line 172)**
   - Replace `max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8` with `p-12`

2. **Back Button (Line 177)**
   - `text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100`
   - → `text-text-secondary hover:text-text-primary`

3. **Card Container (Line 209)**
   - `bg-white dark:bg-gray-900` → `bg-background`
   - `border-gray-200 dark:border-gray-700` → `border-border`

4. **Card Header (Line 210)**
   - `bg-gray-50 dark:bg-gray-800` → `bg-bg-secondary`
   - `border-gray-200 dark:border-gray-700` → `border-border`

5. **Title & Labels (Lines 232, 238, 242, 250, 254, 261)**
   - `text-gray-900 dark:text-gray-100` → `text-text-primary`
   - `text-gray-700 dark:text-gray-300` → `text-text-secondary`

6. **Content Block (Line 265)**
   - `bg-gray-50 dark:bg-gray-800` → `bg-bg-secondary`
   - `text-gray-900 dark:text-gray-100` → `text-text-primary`
   - `border-gray-200 dark:border-gray-700` → `border-border`

7. **Metadata Section (Lines 273, 274, 279, 280, 287, 294)**
   - `text-gray-500 dark:text-gray-400` → `text-text-tertiary`
   - `text-gray-900 dark:text-gray-100` → `text-text-primary`

8. **Action Footer (Line 304)**
   - `bg-gray-50 dark:bg-gray-800` → `bg-bg-secondary`
   - `border-gray-200 dark:border-gray-700` → `border-border`

9. **Button Hover States (Lines 307, 318)**
   - `text-gray-700 dark:text-gray-300` → `text-text-secondary`

**Estimated Changes:** ~25-30 lines

---

#### **Priority 4: Child Components (No Changes)**

Based on PRD analysis, the following components already use design system tokens:
- `components/seeds/seed-card.tsx` ✅
- `components/seeds/filters-panel.tsx` ✅
- `components/seeds/plant-seed-modal.tsx` ✅

---

## 4. Data Model / API Changes

**No changes required.**

This is a pure UI refactoring. All data models, database schemas, and API contracts remain unchanged.

### Unchanged Interfaces
- `SeedRow` type
- `SeedFilters` type
- `SeedStatus` type
- Database functions (`insertSeed`, `updateSeed`, `deleteSeed`)
- Hooks (`useSeeds`, `useDebounce`)

---

## 5. Delivery Phases

### Phase 1: Page Component (5 minutes)
**Goal:** Simplify page structure to match reference pages

**Tasks:**
1. Update `app/seeds/page.tsx`
2. Remove dynamic import and metadata
3. Add `"use client"` directive
4. Verify page loads correctly

**Verification:**
- Page compiles without errors
- Seeds view renders

---

### Phase 2: SeedsView Component (15 minutes)
**Goal:** Update main view component with design system tokens

**Tasks:**
1. Update container padding (`p-12`)
2. Replace header colors
3. Update loading state colors
4. Update search/empty state colors
5. Verify all states (loading, error, empty, populated)

**Verification:**
- All view states render correctly
- Dark/light mode transitions work
- No visual regressions

---

### Phase 3: SeedDetailView Component (15 minutes)
**Goal:** Update detail view with design system tokens

**Tasks:**
1. Update container padding
2. Replace all text colors
3. Replace all background colors
4. Replace all border colors
5. Test all interactions

**Verification:**
- Detail view renders correctly
- Status update actions work
- Export memory patch works
- Delete action works

---

### Phase 4: Integration Testing (10 minutes)
**Goal:** Ensure full functionality and visual consistency

**Tasks:**
1. Test all CRUD operations
2. Test search and filters
3. Test theme switching (light/dark)
4. Verify no console errors
5. Compare visual consistency with Dashboard

**Verification:**
- All features work as expected
- Visual consistency achieved
- No console errors
- Build succeeds

---

## 6. Verification Approach

### 6.1 Build Verification

**Command:**
```bash
npm run build
```

**Success Criteria:**
- No TypeScript errors
- No build warnings related to modified files
- Output: "Compiled successfully"

---

### 6.2 Runtime Testing

**Test Matrix:**

| Feature | Test Case | Expected Result |
|---------|-----------|-----------------|
| **Page Load** | Navigate to `/seeds` | Page loads without errors |
| **Search** | Type in search box | Results filter correctly |
| **Filters** | Select type/status filters | Seeds filter correctly |
| **View Details** | Click seed card | Detail view opens |
| **Update Status** | Click status button | Status updates and reflects |
| **Delete** | Click delete button | Seed removed from list |
| **Export** | Click export button | Memory patch copied |
| **Plant Seed** | Click "Plant New Seed" | Modal opens |
| **Theme Toggle** | Switch light/dark mode | Colors transition correctly |

**Console Verification:**
- Open browser DevTools
- Check Console tab for errors
- Verify no red error messages

---

### 6.3 Visual Regression Testing

**Manual Checklist:**

- [ ] Header spacing matches Dashboard (`p-12`)
- [ ] Text colors consistent with design system
- [ ] Background colors consistent with design system
- [ ] Border colors consistent with design system
- [ ] Dark mode: all colors render correctly
- [ ] Light mode: all colors render correctly
- [ ] No color flashing on theme toggle
- [ ] Animations work smoothly
- [ ] Loading states look correct
- [ ] Empty states look correct
- [ ] Error states look correct

**Comparison Reference:**
- Open Dashboard page in one browser tab
- Open Seeds page in another browser tab
- Compare visual consistency (spacing, colors, typography)

---

### 6.4 Performance Verification

**Expectations:**
- No performance degradation
- Animation frame rates remain smooth (60 FPS)
- Search debounce behavior unchanged (300ms)

**Tools:**
- Chrome DevTools > Performance tab
- Monitor for layout shifts
- Check paint times

---

## 7. Rollback Plan

If issues arise during implementation:

1. **Git Reset:**
   ```bash
   git reset --hard HEAD
   ```

2. **File-Level Rollback:**
   - Keep backup copies of original files
   - Restore from backup if needed

3. **Incremental Testing:**
   - Test after each phase
   - Commit working phases separately
   - Easy to revert to last working state

---

## 8. Success Metrics

### Functional Requirements (Must Pass)
- [ ] All CRUD operations work
- [ ] Search functionality works
- [ ] Filter functionality works
- [ ] Theme toggle works
- [ ] No console errors
- [ ] Build succeeds

### Design System Compliance (Must Pass)
- [ ] Zero hardcoded gray colors in `seeds-view.tsx`
- [ ] Zero hardcoded gray colors in `seed-detail-view.tsx`
- [ ] All colors use design system tokens
- [ ] Spacing matches design system (`p-12`, `gap-8`)

### Consistency Requirements (Must Pass)
- [ ] Page structure matches Dashboard/Workbench/Librarian
- [ ] Visual consistency with other pages
- [ ] Dark mode consistency
- [ ] Light mode consistency

---

## 9. Risk Assessment

### Low Risk
- ✅ No data model changes
- ✅ No API changes
- ✅ No new dependencies
- ✅ Well-defined color mapping
- ✅ Clear reference implementations

### Moderate Risk
- ⚠️ Potential color mapping ambiguity (e.g., `text-text-tertiary` vs `text-text-muted`)
- ⚠️ Theme transition edge cases

### Mitigation
- Use existing components as reference
- Test both themes thoroughly
- Review with stakeholder if ambiguous

---

## 10. Dependencies

### Internal Dependencies
- `@/components/ui/Button` (existing)
- `@/components/ui/Card` (existing)
- `@/hooks/useSeeds` (existing)
- `@/lib/seeds/types` (existing)

### External Dependencies
- None (no new packages required)

---

## 11. Post-Implementation

### Documentation Updates
- None required (internal refactoring)

### Knowledge Sharing
- Document color token mapping for future reference
- Add comments in code for design system usage patterns (if beneficial)

---

## 12. Timeline Estimate

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Page Component | 5 minutes |
| Phase 2: SeedsView Component | 15 minutes |
| Phase 3: SeedDetailView Component | 15 minutes |
| Phase 4: Integration Testing | 10 minutes |
| **Total** | **45 minutes** |

---

## Appendix A: Design Token Reference

### Text Colors
```typescript
'text-text-primary'     // Main text (white in dark, dark in light)
'text-text-secondary'   // Secondary text (#c5d1dd)
'text-text-tertiary'    // Tertiary text (#8a9dad)
'text-text-muted'       // Muted text (#6b7f91)
'text-foreground'       // Alias for primary
'text-muted-foreground' // Alias for muted
```

### Background Colors
```typescript
'bg-background'       // Main background
'bg-bg-primary'       // #0a1e2e
'bg-bg-secondary'     // #0f2838
'bg-bg-tertiary'      // #1a3a4f
'bg-surface'          // Surface color
'bg-muted'            // Muted background
'bg-card'             // Card background
```

### Border Colors
```typescript
'border-border'       // Standard border
'border-bg-tertiary'  // Tertiary border
```

### Semantic Colors
```typescript
'text-success'  'bg-success'    // #4ade80 (green)
'text-error'    'bg-error'      // #ef4444 (red)
'text-warning'  'bg-warning'    // #f39c5a (orange)
'text-info'     'bg-info'       // #3d6380 (blue)
'text-accent'   'bg-accent'     // #f5a623 (gold)
```

---

## Appendix B: File Structure

```
app/
  seeds/
    page.tsx                    # ← MODIFY (Priority 1)
  dashboard/
    page.tsx                    # ← REFERENCE
  workbench/
    page.tsx                    # ← REFERENCE
  librarian/
    page.tsx                    # ← REFERENCE

components/
  seeds/
    seeds-view.tsx              # ← MODIFY (Priority 2)
    seed-detail-view.tsx        # ← MODIFY (Priority 3)
    seed-card.tsx               # ← NO CHANGES
    filters-panel.tsx           # ← NO CHANGES
    plant-seed-modal.tsx        # ← NO CHANGES

tailwind.config.ts              # ← REFERENCE (design tokens)
app/globals.css                 # ← REFERENCE (CSS variables)
```

---

**End of Technical Specification**
