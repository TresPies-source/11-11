# Technical Specification: Seed Detail View Component

## Difficulty Assessment: Medium

**Rationale:**
- Moderate complexity: Creating a new dedicated view component with state management
- Integration challenge: Updating existing SeedsView to support routing between list and detail views
- Design considerations: Translating modal layout to full-page view while maintaining brand consistency
- Testing requirements: New component tests and integration tests needed
- Edge cases: Handling navigation, back button, seed updates, and seed deletion

## Technical Context

### Language & Framework
- **Language:** TypeScript
- **Framework:** React 18.3.1 with Next.js 14.2.24
- **Styling:** Tailwind CSS with custom design system
- **Animation:** Framer Motion 11.15.0
- **Icons:** Lucide React 0.469.0

### Dependencies
- `@/lib/seeds/types`: SeedRow, SeedStatus, SeedType
- `@/lib/pglite/seeds`: updateSeed, deleteSeed
- `@/hooks/useSeeds`: For refetching data
- `@/components/ui/Button`: Existing button component
- `@/lib/utils`: cn utility for classNames
- `framer-motion`: AnimatePresence, motion
- `lucide-react`: Icons

### Design System
Reference: `/00_Roadmap/DOJO_GENESIS_BRAND_GUIDE.md`
- **Typography:** Inter for UI, JetBrains Mono for code
- **Color Palette:** Deep navy backgrounds, sunset amber accents
- **Animation Principles:** Subtle, purposeful, premium (100ms, 200ms, 300ms timing)
- **Voice & Tone:** Calm, confident, guiding

## Implementation Approach

### 1. Create SeedDetailView Component

**File:** `components/seeds/seed-detail-view.tsx`

**Component Structure:**
```
SeedDetailView
├── Header Section
│   ├── Back button
│   ├── Type badge
│   ├── Status badge with icon
│   └── Seed name (title)
├── Content Section (scrollable)
│   ├── Why it matters section
│   ├── Revisit when section
│   ├── Content display (code-formatted)
│   └── Metadata grid (created, updated, replanted info)
└── Footer Section (sticky)
    ├── Lifecycle action buttons (Keep, Grow, Compost, Replant)
    ├── Delete button
    └── Export Memory Patch button
```

**Key Features:**
1. **Full-page layout** (not a modal)
2. **Navigation support** with back button to return to seeds list
3. **Lifecycle actions** inline (Keep, Grow, Compost, Replant)
4. **Export functionality** (Memory Patch)
5. **Delete confirmation** with proper error handling
6. **Loading states** during updates
7. **Error display** for failed operations
8. **Responsive design** for various screen sizes

**Props Interface:**
```typescript
interface SeedDetailViewProps {
  seed: SeedRow;
  onBack: () => void;
  onUpdate: (status: SeedStatus) => Promise<void>;
  onDelete: () => Promise<void>;
}
```

**Reusable Code from details-modal.tsx:**
- `TYPE_COLORS` configuration
- `STATUS_CONFIG` configuration
- `generateMemoryPatch` function
- Layout structure for displaying seed information

### 2. Update SeedsView Component

**File:** `components/seeds/seeds-view.tsx`

**Changes Required:**
1. Add state for selected seed in "view mode" vs "modal mode"
2. Replace SeedDetailsModal with conditional rendering:
   - Show SeedDetailView when a seed is selected for full view
   - Keep SeedDetailsModal for quick previews (or remove it entirely)
3. Update handleViewSeed to navigate to detail view
4. Add handleBackToList callback for returning from detail view
5. Implement smooth transitions using AnimatePresence

**New State:**
```typescript
const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
const [selectedSeedForView, setSelectedSeedForView] = useState<SeedRow | null>(null);
```

**Conditional Rendering:**
```typescript
{viewMode === 'list' ? (
  <SeedsList ... />
) : (
  <SeedDetailView 
    seed={selectedSeedForView} 
    onBack={handleBackToList}
    onUpdate={handleUpdateStatus}
    onDelete={handleDeleteSeed}
  />
)}
```

### 3. Animation Strategy

Use Framer Motion for smooth transitions:
- **List to Detail:** Slide in from right with fade (300ms, ease-out)
- **Detail to List:** Slide out to right with fade (300ms, ease-out)
- **Button interactions:** Scale 0.98 on active, hover lift
- **Status updates:** Brief pulse animation on success

### 4. Error Handling

- Display error messages at top of detail view
- Auto-dismiss after 5 seconds
- Retry capability for failed operations
- Graceful handling of missing seed data

## Source Code Structure Changes

### New Files
1. `components/seeds/seed-detail-view.tsx` - Main detail view component
2. `__tests__/seeds/seed-detail-view.test.tsx` - Component tests

### Modified Files
1. `components/seeds/seeds-view.tsx` - Add view mode state and conditional rendering
2. `__tests__/seeds/seeds-view.test.tsx` - Update tests for new navigation behavior

### Potentially Deprecated
- Consider keeping `details-modal.tsx` for quick previews, or remove if full view is preferred

## Data Model / API / Interface Changes

No changes to existing data models or APIs. Uses existing:
- `SeedRow` type from `@/lib/seeds/types`
- `updateSeed` function from `@/lib/pglite/seeds`
- `deleteSeed` function from `@/lib/pglite/seeds`
- `useSeeds` hook for data fetching

## Verification Approach

### 1. Component Testing
Create `__tests__/seeds/seed-detail-view.test.tsx`:
- Test component renders with seed data
- Test back button navigation
- Test lifecycle action buttons
- Test delete confirmation flow
- Test export memory patch functionality
- Test error states
- Test loading states

### 2. Integration Testing
Update `__tests__/seeds/integration.test.ts`:
- Test navigation from list to detail view
- Test navigation from detail back to list
- Test seed updates from detail view reflect in list
- Test seed deletion from detail view returns to list

### 3. Manual Verification
1. Start dev server: `npm run dev`
2. Navigate to `/seeds` page
3. Click on a seed card to open detail view
4. Verify all sections display correctly
5. Test all lifecycle actions (Keep, Grow, Compost)
6. Test delete functionality with confirmation
7. Test export memory patch
8. Test back button navigation
9. Test responsive behavior on different screen sizes
10. Verify no console errors

### 4. Build & Type Check
- Run `npm run build` - Should complete successfully
- Run `npm run type-check` - Should pass with no errors
- Run `npm test` - All tests should pass

### 5. Accessibility
- Verify keyboard navigation works
- Check screen reader compatibility (aria labels)
- Ensure focus management on navigation
- Verify color contrast meets WCAG standards

## Success Criteria

1. ✅ `SeedDetailView.tsx` component created with all required sections
2. ✅ `SeedsView.tsx` updated to show detail view on seed selection
3. ✅ Navigation between list and detail view works smoothly
4. ✅ All lifecycle actions work from detail view
5. ✅ Delete functionality works with proper confirmation
6. ✅ Export Memory Patch functionality works
7. ✅ No console errors on Seeds page
8. ✅ `npm run build` succeeds
9. ✅ `npm test` passes (all existing and new tests)
10. ✅ Follows Dojo Genesis brand guide for styling and animations

## Additional Considerations

### Performance
- Use React.memo for SeedDetailView to prevent unnecessary re-renders
- Debounce rapid status updates
- Optimize animations for 60fps

### User Experience
- Show loading indicator during updates
- Provide clear feedback on action success/failure
- Smooth animations that don't feel jarring
- Intuitive back button placement

### Future Enhancements (Out of Scope)
- URL-based routing (e.g., `/seeds/:id`)
- Edit mode for seed content
- Seed versioning history
- Related seeds suggestions
- Share seed functionality
