# Technical Specification: Seed Related Component Styling Overhaul

## Complexity Assessment

**Difficulty**: **Easy**

This is a straightforward styling task that involves updating CSS class names to match the internal brand guide used across other pages in the application. The changes are cosmetic and don't involve logic modifications, making this a low-risk, low-complexity task.

---

## Technical Context

### Language & Framework
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS 3.4
- **UI Library**: Custom components with Tailwind utilities
- **Animation**: Framer Motion 11

### Dependencies
- `lucide-react` (icons)
- `tailwind-merge` (className utility)
- `clsx` (conditional classes)

---

## Problem Analysis

### Current State
The `/seeds` page (Seed Library) uses a different color token system compared to other dashboard pages:

**Seed components use**:
- `text-foreground` / `text-muted-foreground`
- `bg-background` / `bg-card`
- `border-border`
- `text-text-primary` / `text-text-secondary` / `text-text-tertiary`

**Other dashboards use** (Cost, Context, Agent Registry):
- `text-gray-900 dark:text-gray-100`
- `text-gray-600 dark:text-gray-400`
- `bg-white dark:bg-gray-900`
- `border-gray-200 dark:border-gray-700`

### Brand Guide Pattern

Based on analysis of existing dashboards (`CostDashboard.tsx`, `ContextDashboard.tsx`, `AgentRegistryView.tsx`):

1. **Page container**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`

2. **Page header**:
   - Title: `text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3`
   - Subtitle: `text-gray-600 dark:text-gray-400 mt-2`
   - Icon color: `text-[color]-600 dark:text-[color]-500` (contextual)

3. **Card/Section styling**:
   - Background: `bg-white dark:bg-gray-900`
   - Border: `border border-gray-200 dark:border-gray-700`
   - Shadow: `shadow-sm`
   - Radius: `rounded-lg`
   - Padding: `p-6` (or `p-4` for smaller elements)

4. **Section headers**:
   - Style: `text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-6`

5. **Body text**:
   - Primary: `text-gray-900 dark:text-gray-100`
   - Secondary: `text-gray-600 dark:text-gray-400`
   - Muted: `text-gray-500 dark:text-gray-400`

6. **Loading states**:
   - Spinner: `text-blue-600 dark:text-blue-400`
   - Skeleton: `bg-gray-200 dark:bg-gray-800`

7. **Empty states**:
   - Background: `bg-secondary/50` or similar light overlay
   - Uses semantic component tokens for empty state styling

8. **Error/Alert patterns**:
   - Red alerts: `bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800`
   - Blue info: `bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800`
   - Icon: `text-[color]-600 dark:text-[color]-400`

9. **Input fields**:
   - Background: `bg-background`
   - Text: `text-foreground`
   - Border: `border-border focus:border-accent`
   - Placeholder: `placeholder:text-muted-foreground`

10. **Special considerations**:
    - Emoji in title (🌱 Seed Library) should be removed or repositioned
    - Retain custom color tokens for seed-specific UI (type badges, status colors)
    - Maintain functional components like filters, cards, modals with semantic colors
    - Keep animation patterns consistent with framer-motion usage

---

## Implementation Approach

### Files to Modify

1. **`components/seeds/seeds-view.tsx`** (375 lines)
   - Update page header styling
   - Update loading state skeleton styling
   - Update error state styling
   - Update empty state styling
   - Update main content card styling
   - Update search input styling (keep functional tokens where appropriate)
   - Update aside/sidebar styling

2. **`components/seeds/seed-detail-view.tsx`** (394 lines)
   - Update header section styling
   - Update content card styling
   - Update section header styling
   - Update body text styling
   - Update error banner styling
   - Maintain seed-specific color tokens for badges and actions

### Specific Changes Required

#### `seeds-view.tsx`
- **Line 130-133**: Header title - change from `text-foreground` to `text-gray-900 dark:text-gray-100`, remove emoji
- **Line 134-136**: Subtitle - change from `text-muted-foreground` to `text-gray-600 dark:text-gray-400`
- **Line 150**: Sidebar skeleton - change from `bg-background border-border` to `bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700`
- **Line 156**: Loading skeleton - change from `bg-bg-secondary` to `bg-gray-200 dark:bg-gray-800`
- **Line 159**: Card skeleton - change from `bg-bg-secondary` to `bg-gray-200 dark:bg-gray-800`
- **Line 174-177**: Error header - same as main header
- **Line 243-246**: List view header - same as main header
- **Line 247-249**: List view subtitle - same as subtitle pattern
- **Line 298-300**: Search icon - change from `text-text-muted` to `text-gray-500 dark:text-gray-400`
- **Line 316**: Empty state background - keep `bg-secondary/50` but update text classes
- **Line 318**: Empty state title - change to `text-gray-900 dark:text-gray-100`
- **Line 322**: Empty state description - change to `text-gray-600 dark:text-gray-400`
- **Line 329**: Results count - change from `text-muted-foreground` to `text-gray-600 dark:text-gray-400`

#### `seed-detail-view.tsx`
- **Line 177**: Back button text - change from `text-text-secondary hover:text-text-primary` to `text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100`
- **Line 209**: Card background - change from `bg-card border-border` to `bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700`
- **Line 210**: Header background - change from `bg-bg-primary border-border` to `bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700`
- **Line 232**: Title - change from `text-text-primary` to `text-gray-900 dark:text-gray-100`
- **Line 238-241**: Section headers - change from `text-text-secondary` to `text-gray-700 dark:text-gray-300`
- **Line 242-244**: Body text - change from `text-text-primary` to `text-gray-900 dark:text-gray-100`
- **Line 254-256**: Section content - same text updates
- **Line 261-267**: Content block - change `bg-bg-tertiary` to `bg-gray-50 dark:bg-gray-800`, text stays semantic
- **Line 273**: Metadata labels - change from `text-text-muted` to `text-gray-500 dark:text-gray-400`
- **Line 275**: Metadata values - change from `text-text-primary` to `text-gray-900 dark:text-gray-100`
- **Line 304**: Footer background - change from `bg-bg-primary border-border` to `bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700`
- **Line 307**: Footer section title - change from `text-text-secondary` to `text-gray-700 dark:text-gray-300`
- **Line 318**: Button text updates - change from `text-text-secondary` to `text-gray-700 dark:text-gray-300`

### Tokens to Keep (Functional/Semantic)
These should NOT be changed as they provide semantic meaning:
- Seed type colors: `text-info`, `text-success`, `text-librarian`, `text-dojo`, `text-supervisor`, `text-error`
- Status colors: `text-success`, `text-error`, `text-muted`
- Background overlays: `bg-info/10`, `bg-success/30`, etc.
- Accent colors: `bg-accent`, `text-accent`, `border-accent`
- Action button states and hover colors
- Badge and pill styling with semantic colors

---

## Data Model Changes

**None required** - This is purely a styling update with no data model or API changes.

---

## Verification Approach

### 1. Visual Inspection
- Navigate to `/seeds` page
- Compare header styling with `/cost`, `/context`, `/agents` pages
- Verify consistent card styling across all sections
- Check dark mode toggle for proper color transitions
- Verify all interactive states (hover, focus, active)

### 2. Component Verification
- Test loading states (seeds list)
- Test error states (disconnect network, retry)
- Test empty states (clear database, apply filters with no results)
- Test detail view (click on seed card)
- Test all interactive elements (buttons, inputs, filters)

### 3. Accessibility Check
- Verify color contrast ratios meet WCAG AA standards
- Test keyboard navigation
- Verify screen reader labels remain intact
- Check focus states are visible

### 4. Responsive Testing
- Test mobile viewport (320px - 768px)
- Test tablet viewport (768px - 1024px)
- Test desktop viewport (1024px+)
- Verify sidebar/filter panel behavior
- Check card grid layouts at different breakpoints

### 5. Lint and Type Check
```bash
npm run lint
npm run type-check
```

### 6. Test Suite (if available)
```bash
npm run test:seeds-view
npm run test:seeds-card
npm run test:seeds-filters
npm run test:seeds-modal
```

---

## Risk Assessment

### Low Risk Areas
- Color token replacements (easily reversible)
- Loading state styling
- Empty state styling
- Static text styling

### Medium Risk Areas
- Interactive element styling (buttons, inputs) - need to verify hover/focus states
- Animation interactions - ensure framer-motion animations still work
- Dark mode transitions - verify smooth color changes

### Mitigation
- Test in both light and dark modes before committing
- Use browser dev tools to test different viewport sizes
- Verify all interactive states manually
- Check console for any styling warnings or errors

---

## Success Criteria

1. ✅ Seeds page header matches Cost/Context/Agent dashboards
2. ✅ Card styling consistent across all dashboard pages
3. ✅ Text colors use gray scale with dark mode variants
4. ✅ Seed-specific semantic colors preserved (type badges, status indicators)
5. ✅ All interactive states working (hover, focus, active, disabled)
6. ✅ Dark mode fully functional
7. ✅ No lint or type errors
8. ✅ No console warnings or errors
9. ✅ Responsive design intact
10. ✅ Accessibility maintained

---

## Timeline Estimate

- **File modifications**: 30-45 minutes
- **Visual testing**: 15-20 minutes
- **Responsive testing**: 10-15 minutes
- **Verification**: 10 minutes
- **Total**: ~1-1.5 hours
