# Technical Specification: Refactor Seeds Page

## Task Difficulty: Medium

**Rationale:**
- Multiple components need systematic color and typography updates
- Requires careful alignment with the Dojo Genesis design system
- New feature implementation (Plant New Seed button + modal)
- Layout and spacing refinement across components
- Existing codebase has Dojo Genesis colors in Tailwind config but components use hardcoded colors
- Need to maintain existing functionality while improving visual consistency

---

## Technical Context

### Technology Stack
- **Framework:** Next.js 14.2.24
- **UI Library:** React 18.3.1
- **Styling:** Tailwind CSS 3.4.17
- **Animation:** Framer Motion 11.15.0
- **State Management:** React hooks + Zustand 5.0.10
- **Database:** PGLite (@electric-sql/pglite)
- **Icons:** Lucide React 0.469.0
- **Type Safety:** TypeScript 5.7.2

### Design System Reference
- **Brand Guide:** `00_Roadmap/DOJO_GENESIS_BRAND_GUIDE.md`
- **Color System:** `00_Roadmap/DOJO_GENESIS_BRAND_COLORS.md`
- **Tailwind Config:** `tailwind.config.ts` (already configured with Dojo Genesis colors)

### Key Color Mappings
**Dojo Genesis to Tailwind Classes:**
- **Backgrounds:** `bg-bg-primary`, `bg-bg-secondary`, `bg-bg-tertiary`, `bg-bg-elevated`
- **Text:** `text-text-primary`, `text-text-secondary`, `text-text-tertiary`, `text-text-muted`, `text-text-accent`
- **Accent:** `text-accent` or `bg-text-accent` (Amber #f5a623)
- **Semantic:** `text-success`, `text-warning`, `text-error`, `text-info`
- **Agents:** `text-supervisor`, `text-dojo`, `text-librarian`, `text-debugger`

### Typography System
- **Headings:** Inter font (already via `font-sans`)
  - h1: 36px (text-4xl), Bold (font-bold)
  - h2: 28px (text-3xl), Bold (font-bold)
  - h3: 22px (text-xl), Medium (font-medium)
- **Body:** Inter 16px (text-base), Regular (font-normal)
- **Small:** 14px (text-sm), Regular
- **Code/Prompts:** JetBrains Mono 15px (font-mono)

### Spacing System (4px base unit)
Already defined in Tailwind config: `p-1` (4px), `p-2` (8px), `p-3` (12px), `p-4` (16px), etc.

---

## Implementation Approach

### Phase 1: Color Palette Updates

**Replace all hardcoded colors with Dojo Genesis semantic colors:**

1. **Seed Card (`components/seeds/seed-card.tsx`)**
   - Replace `TYPE_COLORS` object to use Dojo Genesis palette
   - Update status button colors to use semantic colors
   - Replace hardcoded grays with `bg-bg-*` and `text-text-*` classes
   - Update border colors to use `border-border` or semantic borders

2. **Seeds View (`components/seeds/seeds-view.tsx`)**
   - Update header icon colors to use `text-success` or `text-accent`
   - Replace hardcoded grays in loading/error states
   - Update search input styling to use semantic borders and backgrounds
   - Ensure consistent dark mode support

3. **Filters Panel (`components/seeds/filters-panel.tsx`)**
   - Update `TYPE_COLORS` and `STATUS_COLORS` to use Dojo Genesis palette
   - Replace filter button colors with semantic alternatives
   - Ensure active/inactive states use consistent accent colors

4. **Details Modal (`components/seeds/details-modal.tsx`)**
   - Update `TYPE_COLORS` to match seed card
   - Replace status badge colors with semantic equivalents
   - Update modal background and border colors

### Phase 2: Typography Updates

1. **Ensure consistent font usage:**
   - Headings: Use `font-sans` with appropriate weights
   - Code sections: Use `font-mono`
   - Body text: Use `font-sans` with `font-normal`

2. **Apply correct type scale:**
   - Main title: `text-3xl font-bold` (h1)
   - Section titles: `text-xl font-medium` (h3)
   - Body: `text-base` (default)
   - Labels: `text-sm`

### Phase 3: Layout & Spacing Improvements

1. **Consistent spacing using 4px base unit:**
   - Review all padding: `p-4`, `p-6`, `p-8`
   - Review all gaps: `gap-2`, `gap-4`, `gap-6`, `gap-8`
   - Review all margins: `mb-2`, `mb-4`, `mb-6`, `mb-8`

2. **Improve readability:**
   - Ensure adequate whitespace between sections
   - Consistent card padding
   - Proper line-height for text blocks

### Phase 4: Add "Plant New Seed" Button

1. **Button placement:**
   - Add prominent button in the header area of `seeds-view.tsx`
   - Position near the title or in the top-right corner
   - Use the `Button` component from `components/ui/Button.tsx`
   - Variant: `primary` (uses Dojo Genesis amber accent)

2. **Modal implementation:**
   - Create new `plant-seed-modal.tsx` component
   - Form fields:
     - Name (text input)
     - Type (select/dropdown with SeedType options)
     - Content (textarea)
     - Why it matters (optional textarea)
     - Revisit when (optional text input)
   - Use semantic colors and consistent spacing
   - Implement form validation
   - Call `insertSeed` function on submit
   - Trigger refetch after successful creation
   - Close modal and show success feedback

3. **Integration:**
   - Add state management for modal open/close
   - Add callback to refresh seeds list after creation

---

## Source Code Structure Changes

### Files to Modify:
1. `components/seeds/seed-card.tsx` - Color palette update, typography refinement
2. `components/seeds/seeds-view.tsx` - Color palette, typography, spacing, add Plant button
3. `components/seeds/filters-panel.tsx` - Color palette update
4. `components/seeds/details-modal.tsx` - Color palette update (for consistency)

### Files to Create:
1. `components/seeds/plant-seed-modal.tsx` - New modal for creating seeds

### Shared Components to Use:
- `components/ui/Button.tsx` - For the "Plant New Seed" button
- Framer Motion for modal animations (follow pattern from details-modal)

---

## Data Model / API / Interface Changes

**No changes required to:**
- `lib/seeds/types.ts` - Types remain the same
- Database schema - No modifications
- API endpoints - Use existing `insertSeed` function from `lib/pglite/seeds`

**Usage of existing functions:**
- `insertSeed(data: SeedInsert)` - For creating new seeds
- `refetch()` - From `useSeeds` hook to refresh the list

---

## Verification Approach

### Automated Testing:
1. **Build verification:**
   ```bash
   npm run build
   ```
   Expected: Clean build with no errors

2. **Type checking:**
   ```bash
   npm run type-check
   ```
   Expected: No TypeScript errors

3. **Run Seeds tests:**
   ```bash
   npm run test:seeds
   ```
   Expected: All tests pass

4. **Specific component tests:**
   - `npm run test:seeds-card` - Verify seed card still renders correctly
   - `npm run test:seeds-view` - Verify seeds view functionality
   - `npm run test:seeds-filters` - Verify filters still work
   - `npm run test:seeds-modal` - Verify details modal

### Manual Testing:
1. **Visual verification:**
   - Seeds page loads without console errors
   - All colors match Dojo Genesis design system
   - Typography is consistent (Inter for UI, JetBrains Mono for code)
   - Spacing is consistent (4px base unit)

2. **Functional verification:**
   - Filters work correctly
   - Seed cards display properly
   - Status updates work
   - Delete functionality works
   - Details modal opens/closes
   - "Plant New Seed" button opens modal
   - New seed creation works
   - Seeds list refreshes after creation

3. **Responsive testing:**
   - Test on different screen sizes
   - Verify mobile layout
   - Check dark mode support

4. **Accessibility:**
   - Keyboard navigation works
   - Screen reader labels are present
   - Focus states are visible
   - Color contrast meets WCAG AA standards

### Acceptance Criteria Verification:
- ✅ Seeds page is visually consistent with Dojo Genesis design system
- ✅ All colors, typography, and spacing match the brand guide
- ✅ "Plant New Seed" button is added and functional
- ✅ Application builds successfully (`npm run build`)
- ✅ All tests pass (`npm test`)
- ✅ Seeds page loads without console errors

---

## Risk Mitigation

### Potential Issues:
1. **Color contrast issues in dark mode** - Solution: Test thoroughly and use semantic colors from the design system
2. **Breaking existing tests** - Solution: Run tests frequently during development
3. **Modal z-index conflicts** - Solution: Follow existing modal pattern from details-modal
4. **Form validation complexity** - Solution: Start with basic validation, enhance if needed

### Rollback Plan:
- All changes are tracked in version control
- Can revert individual component changes if needed
- Existing functionality is preserved, only visual changes applied

---

## Success Metrics

1. **No regression in functionality** - All existing features work as before
2. **Visual consistency** - 100% alignment with Dojo Genesis color palette and typography
3. **Clean build** - No TypeScript or build errors
4. **Test coverage** - All existing tests pass, new modal has basic tests
5. **Accessibility** - Meets WCAG AA standards
6. **Performance** - No degradation in page load or interaction speed

---

## Next Steps (Implementation Tasks)

See `plan.md` for detailed implementation breakdown.
