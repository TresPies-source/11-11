# Technical Specification: Workbench Enhancement

## Technical Context

### Technology Stack
- **Framework**: Next.js 14.2.24 (App Router)
- **Language**: TypeScript 5.7.2
- **Styling**: Tailwind CSS 3.4.17
- **Animation**: Framer Motion 11.15.0
- **Icons**: Lucide React 0.469.0
- **Utilities**: clsx, tailwind-merge (cn helper)
- **Markdown**: gray-matter (frontmatter parsing)

### Build & Verification Commands
- **Dev Server**: `npm run dev`
- **Lint**: `npm run lint` (ESLint)
- **Type Check**: `npm run type-check` (TypeScript compiler)
- **Production Build**: `npm run build`

### Current Architecture

#### Component Hierarchy
```
app/library/page.tsx → LibraryView
app/gallery/page.tsx → GalleryView
  ↓
components/library/LibraryView.tsx (uses useLibrary hook)
components/gallery/GalleryView.tsx (uses useGallery hook)
  ↓
components/shared/PromptCard.tsx (variant: "library" | "gallery")
```

#### Data Flow
```
useLibrary hook:
  → Fetch /api/drive/files?folder=prompts
  → For each file, fetch /api/drive/content/{id}
  → Parse markdown with gray-matter
  → Return PromptFile[] with metadata and rawContent

useGallery hook:
  → Calls useLibrary
  → Filters prompts where metadata.public === true
  → Returns filtered PromptFile[]
```

#### Existing Features
- **PromptCard**: Framer Motion animations, Quick Copy (clipboard), Run in Chat (library), Fork to Library (gallery)
- **LibraryView/GalleryView**: Loading skeleton (6 cards), Error display (red box), Empty state, Responsive grid (1-3 columns)
- **Hooks**: useLibrary (data fetching), useGallery (filtering), useDebounce (300ms), useToast (notifications)

## Implementation Approach

### Phase 1: Search & Filter Foundation
Create reusable search infrastructure that both Library and Gallery can use.

#### 1.1 Create SearchInput Component
**File**: `components/shared/SearchInput.tsx`

**Rationale**: Reusable component reduces duplication between Library and Gallery pages.

**Implementation**:
- Accept props: `value`, `onChange`, `placeholder`
- Lucide Search icon (left, 20px, gray-400)
- Lucide X icon (right, 16px, gray-500, conditional on value)
- Tailwind classes: `h-10`, `border-gray-300`, `focus:border-blue-500`, `pl-10 pr-10`
- Clear button resets search to empty string

**Dependencies**: Existing `cn` utility, Lucide icons

#### 1.2 Create usePromptSearch Hook
**File**: `hooks/usePromptSearch.ts`

**Rationale**: Encapsulates search logic for reusability and testability.

**Implementation**:
```typescript
interface UsePromptSearchParams {
  prompts: PromptFile[];
  searchTerm: string;
}

interface UsePromptSearchReturn {
  filteredPrompts: PromptFile[];
}
```

**Logic**:
- Accept prompts array and search term
- Use `useMemo` to memoize filtered results (dependency: prompts, searchTerm)
- Case-insensitive search across:
  - `prompt.metadata?.title`
  - `prompt.metadata?.description`
  - `prompt.metadata?.tags` (array - check if any tag includes search term)
  - Fallback to `prompt.name` if no metadata.title
- Return empty array if no matches

**Dependencies**: React useMemo, PromptFile type

#### 1.3 Integrate Search into LibraryView
**File**: `components/library/LibraryView.tsx` (modify)

**Changes**:
- Add state: `const [searchTerm, setSearchTerm] = useState('')`
- Add debounced search: `const debouncedSearch = useDebounce(searchTerm, 300)`
- Use `usePromptSearch({ prompts, searchTerm: debouncedSearch })`
- Render `SearchInput` between header and grid
- Display `filteredPrompts` instead of `prompts`
- Show empty search state when `filteredPrompts.length === 0 && searchTerm`

**Backwards Compatibility**: All existing functionality preserved, search is additive.

#### 1.4 Integrate Search into GalleryView
**File**: `components/gallery/GalleryView.tsx` (modify)

**Implementation**: Identical to LibraryView approach.

### Phase 2: Enhanced Loading States
Improve skeleton loaders with shimmer effects and better visual feedback.

#### 2.1 Create PromptCardSkeleton Component
**File**: `components/shared/PromptCardSkeleton.tsx`

**Rationale**: DRY principle - reuse skeleton across Library/Gallery, maintain consistency with PromptCard structure.

**Implementation**:
- Match PromptCard layout: title area, description lines (3), tag placeholders (2-3), button
- Use rounded rectangles with varying widths: `w-3/4`, `w-full`, `w-5/6`, `w-4/6`
- Background gradient: `bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100`
- Shimmer animation using `@keyframes shimmer` in Tailwind
- Height: `h-64` to prevent layout shift
- Framer Motion stagger: Accept `index` prop, delay by `index * 0.05s`

**Shimmer CSS** (add to global CSS or inline):
```css
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
.animate-shimmer {
  animation: shimmer 1.5s infinite;
  background-size: 1000px 100%;
}
```

#### 2.2 Create LoadingState Component
**File**: `components/shared/LoadingState.tsx`

**Rationale**: Centralized loading UI with consistent spinner and skeleton grid.

**Implementation**:
- Accept props: `count` (number of skeletons, default 6)
- Display centered section with:
  - Lucide Loader2 icon (48px, blue-600) with spin animation
  - Text: "Loading prompts..." (gray-600, mt-2)
- Grid of `PromptCardSkeleton` components (count prop)
- Grid classes: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8`

**Dependencies**: PromptCardSkeleton, Framer Motion

#### 2.3 Update LibraryView & GalleryView Loading
**Files**: `components/library/LibraryView.tsx`, `components/gallery/GalleryView.tsx`

**Changes**:
- Replace inline skeleton grid with `<LoadingState count={6} />`
- Keep page header visible during loading (don't replace entire view)

### Phase 3: Enhanced Error States
Improve error messaging, add retry functionality, provide troubleshooting guidance.

#### 3.1 Add Retry Mechanism to useLibrary
**File**: `hooks/useLibrary.ts` (modify)

**Changes**:
- Add `retryCount` state variable
- Return `retry` function that increments `retryCount`
- Update `useEffect` dependency array to include `retryCount`
- This triggers re-fetch when retry is called

**Updated Interface**:
```typescript
interface UseLibraryReturn {
  prompts: PromptFile[];
  loading: boolean;
  error: string | null;
  retry: () => void;  // NEW
}
```

**Rationale**: No breaking changes, additive enhancement. Gallery inherits retry via useLibrary.

#### 3.2 Create ErrorState Component
**File**: `components/shared/ErrorState.tsx`

**Rationale**: Reusable error UI with consistent messaging and retry capability.

**Implementation**:
- Accept props: `title`, `message`, `onRetry`, `loading` (retry in progress)
- Layout:
  - Container: `bg-red-50`, `border-red-200`, `rounded-lg`, `p-8`, centered
  - AlertCircle icon (Lucide, 48px, red-400)
  - Title (red-800, font-medium, text-lg)
  - Message (red-600, text-sm, mt-2)
  - Troubleshooting tips (gray-700, text-sm, mt-4, bulleted list)
  - Retry button (blue-600, hover:blue-700, disabled:opacity-50)
- Show spinner on button when `loading` prop is true

**Error Type Detection**:
```typescript
function getErrorGuidance(error: string): string[] {
  if (error.includes('network') || error.includes('fetch')) {
    return ['Check your internet connection', 'Try refreshing the page'];
  }
  if (error.includes('auth') || error.includes('401') || error.includes('403')) {
    return ['Try signing out and back in', 'Check your Google Drive permissions'];
  }
  return ['Our servers might be experiencing issues', 'Please try again in a moment'];
}
```

#### 3.3 Update LibraryView & GalleryView Error Handling
**Files**: `components/library/LibraryView.tsx`, `components/gallery/GalleryView.tsx`

**Changes**:
- Destructure `retry` from hooks: `const { prompts, loading, error, retry } = useLibrary()`
- Replace inline error box with:
```tsx
<ErrorState
  title="Unable to load prompts"
  message={error}
  onRetry={retry}
  loading={loading}
/>
```

### Phase 4: PromptCard UI Polish
Enhance hover effects, action button feedback, and animations.

#### 4.1 Enhanced Hover Effects
**File**: `components/shared/PromptCard.tsx` (modify)

**Changes**:
- Enhance shadow transition: Add `shadow-md` to base state, `shadow-2xl` to hover (currently only `shadow-lg`)
- Add tag hover effect: When card is hovered, tags scale slightly (1.05) and background brightens
- Implement using CSS or Framer Motion hover variants

**Implementation**:
```tsx
// Update cardVariants
hover: {
  scale: 1.02,
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', // shadow-2xl
  transition: { duration: 0.2 },
}

// Add tag hover variant
const tagHoverVariants = {
  hover: { scale: 1.05, backgroundColor: 'rgb(219 234 254)' } // blue-100
}
```

#### 4.2 Action Button Feedback
**File**: `components/shared/PromptCard.tsx` (modify)

**Changes**:
- Add active state to all buttons: `active:scale-95` (press animation)
- "Run in Chat": Add loading state with spinner before navigation (use `router.prefetch` + delay)
- "Fork to Library": Already has loading state (maintain)
- Quick Copy: Already has feedback (maintain)
- Add `disabled` opacity and cursor styles consistently

**Implementation**:
```tsx
// Add to button classes
className={cn(
  "...",
  "active:scale-95 transition-transform duration-100",
  disabled && "opacity-50 cursor-not-allowed"
)}
```

#### 4.3 Reduced Motion Support
**File**: `components/shared/PromptCard.tsx` (modify)

**Changes**:
- Wrap animations in `prefers-reduced-motion` check
- Framer Motion respects this automatically, but ensure no custom CSS animations ignore it

**Implementation**:
```tsx
// Framer Motion automatically respects prefers-reduced-motion
// For custom CSS, add:
@media (prefers-reduced-motion: reduce) {
  .animate-shimmer { animation: none; }
}
```

### Phase 5: Empty Search State
Handle case when search returns no results.

#### 5.1 Create EmptySearchState Component
**File**: `components/shared/EmptySearchState.tsx`

**Rationale**: Reusable component for "no results" messaging.

**Implementation**:
- Accept props: `searchTerm`, `onClear`
- Layout:
  - Container: `bg-gray-50`, `border-gray-200`, `rounded-lg`, `p-12`, centered
  - Search icon (Lucide, 64px, gray-400)
  - Title: "No prompts match your search" (gray-700, font-medium, text-lg)
  - Search term display: `"${searchTerm}"` (gray-500, text-sm, italic)
  - Clear button: "Clear search" (blue-600, hover:blue-700)

#### 5.2 Integrate into Views
**Files**: `components/library/LibraryView.tsx`, `components/gallery/GalleryView.tsx`

**Logic**:
```tsx
// After loading and error checks
if (filteredPrompts.length === 0 && searchTerm) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Header />
      <SearchInput value={searchTerm} onChange={setSearchTerm} />
      <EmptySearchState searchTerm={searchTerm} onClear={() => setSearchTerm('')} />
    </div>
  );
}

// Existing empty state (no prompts at all)
if (filteredPrompts.length === 0 && !searchTerm) {
  // ... existing empty state
}
```

## Source Code Structure Changes

### New Files
```
components/
  shared/
    SearchInput.tsx              (NEW - search input component)
    PromptCardSkeleton.tsx       (NEW - skeleton loader)
    LoadingState.tsx             (NEW - loading UI with spinner)
    ErrorState.tsx               (NEW - error UI with retry)
    EmptySearchState.tsx         (NEW - no search results UI)

hooks/
  usePromptSearch.ts             (NEW - search/filter logic)
```

### Modified Files
```
components/
  shared/
    PromptCard.tsx               (MODIFIED - enhanced hover, button feedback)
  library/
    LibraryView.tsx              (MODIFIED - integrate search, new loading/error states)
  gallery/
    GalleryView.tsx              (MODIFIED - integrate search, new loading/error states)

hooks/
  useLibrary.ts                  (MODIFIED - add retry mechanism)
```

### No Changes
- `hooks/useGallery.ts` - No changes needed (inherits retry from useLibrary)
- `hooks/useDebounce.ts` - Already exists, no changes needed
- All API routes - No changes needed (client-side only)
- Data models - No changes needed

## Data Model / API / Interface Changes

### Hook Interface Changes

#### useLibrary (Modified)
```typescript
// BEFORE
interface UseLibraryReturn {
  prompts: PromptFile[];
  loading: boolean;
  error: string | null;
}

// AFTER
interface UseLibraryReturn {
  prompts: PromptFile[];
  loading: boolean;
  error: string | null;
  retry: () => void;  // ADDED
}
```

#### usePromptSearch (New)
```typescript
interface UsePromptSearchParams {
  prompts: PromptFile[];
  searchTerm: string;
}

interface UsePromptSearchReturn {
  filteredPrompts: PromptFile[];
}

export function usePromptSearch(params: UsePromptSearchParams): UsePromptSearchReturn;
```

### Component Props

#### SearchInput (New)
```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
```

#### LoadingState (New)
```typescript
interface LoadingStateProps {
  count?: number;  // Default: 6
}
```

#### ErrorState (New)
```typescript
interface ErrorStateProps {
  title: string;
  message: string;
  onRetry: () => void;
  loading?: boolean;  // Retry in progress
}
```

#### EmptySearchState (New)
```typescript
interface EmptySearchStateProps {
  searchTerm: string;
  onClear: () => void;
}
```

#### PromptCardSkeleton (New)
```typescript
interface PromptCardSkeletonProps {
  index?: number;  // For stagger animation
}
```

### No API Changes
All changes are client-side. No modifications to:
- `/api/drive/files`
- `/api/drive/content/{id}`
- `/api/drive/fork`

## Delivery Phases

### Phase 1: Search & Filter (Incremental Milestone)
**Goal**: Users can search/filter prompts by title, description, or tags.

**Deliverables**:
- `SearchInput.tsx` component
- `usePromptSearch.ts` hook
- Integration in `LibraryView.tsx`
- Integration in `GalleryView.tsx`
- `EmptySearchState.tsx` component

**Verification**:
- Search input appears on both pages
- Typing filters prompts in real-time (debounced 300ms)
- Clear button works
- Empty state shows when no matches
- No TypeScript errors
- No ESLint warnings

**Testing**:
1. Type "test" - should filter prompts containing "test" in title/description/tags
2. Clear search - should show all prompts
3. Type nonsense - should show empty search state
4. Verify debouncing (shouldn't filter on every keystroke immediately)

### Phase 2: Enhanced Loading States (Incremental Milestone)
**Goal**: Loading states are visually engaging with shimmer effects.

**Deliverables**:
- `PromptCardSkeleton.tsx` component
- `LoadingState.tsx` component
- Updated `LibraryView.tsx` loading state
- Updated `GalleryView.tsx` loading state

**Verification**:
- Skeleton cards have shimmer animation
- Spinner appears centered above skeletons
- Skeletons match PromptCard layout
- Stagger animation works (50ms delay between cards)
- No TypeScript errors
- No ESLint warnings

**Testing**:
1. Simulate slow network (Chrome DevTools) and verify loading state
2. Check shimmer animation is smooth (60fps)
3. Verify layout doesn't shift when data loads
4. Test on mobile viewport

### Phase 3: Enhanced Error States (Incremental Milestone)
**Goal**: Error states provide clear feedback and retry capability.

**Deliverables**:
- Updated `useLibrary.ts` with retry
- `ErrorState.tsx` component
- Updated `LibraryView.tsx` error state
- Updated `GalleryView.tsx` error state

**Verification**:
- Error state shows icon, title, message, guidance, and retry button
- Retry button triggers re-fetch
- Loading spinner appears on retry button during fetch
- Guidance text is contextual to error type
- No TypeScript errors
- No ESLint warnings

**Testing**:
1. Simulate network error (offline mode) and verify error state
2. Click retry while online - should load prompts
3. Verify retry button shows loading state
4. Test different error types (network, auth, server)

### Phase 4: UI Polish (Incremental Milestone)
**Goal**: PromptCard has enhanced hover effects and action feedback.

**Deliverables**:
- Updated `PromptCard.tsx` with enhanced hover
- Active state on action buttons
- Tag hover effects
- Reduced motion support

**Verification**:
- Hover on card: shadow increases, tags brighten
- Click button: brief scale down (active state)
- Animations respect `prefers-reduced-motion`
- No TypeScript errors
- No ESLint warnings

**Testing**:
1. Hover over card - verify smooth shadow/scale transition
2. Click "Run in Chat" - verify active state
3. Click "Fork to Library" - verify active state and loading
4. Test with `prefers-reduced-motion: reduce` in OS settings

### Phase 5: Final Integration & Testing (Complete)
**Goal**: All features work together seamlessly, zero regressions.

**Deliverables**:
- All phases integrated
- Manual QA complete
- Lint/type-check passing
- Production build successful

**Verification**:
- Run `npm run lint` - zero warnings/errors
- Run `npm run type-check` - zero errors
- Run `npm run build` - successful build
- Manual testing checklist complete

**Testing Checklist**:
- [ ] Search filters prompts correctly
- [ ] Debouncing works (300ms delay)
- [ ] Loading state shows shimmer skeletons
- [ ] Error state shows retry button
- [ ] Retry re-fetches data
- [ ] Empty search state shows when no results
- [ ] PromptCard hover effects work
- [ ] Action buttons have feedback
- [ ] Quick Copy works
- [ ] Run in Chat navigates
- [ ] Fork to Library works (gallery only)
- [ ] Responsive on mobile (320px+)
- [ ] Responsive on tablet (768px+)
- [ ] Responsive on desktop (1024px+)
- [ ] Accessibility: keyboard navigation
- [ ] Accessibility: screen reader announcements
- [ ] Reduced motion respected

## Verification Approach

### Pre-Implementation
1. **Dependency Check**: Verify all required dependencies in package.json (Framer Motion, Lucide, Tailwind)
2. **Baseline Test**: Run `npm run dev` and verify current functionality works

### During Implementation
1. **Incremental Testing**: Test each phase before moving to next
2. **Type Safety**: Use TypeScript strict mode, check types after each file
3. **Lint**: Run `npm run lint` after each component
4. **Hot Reload**: Verify changes in dev server after each file

### Post-Implementation
1. **Type Check**: `npm run type-check` - must pass with zero errors
2. **Lint**: `npm run lint` - must pass with zero warnings
3. **Build**: `npm run build` - must complete successfully
4. **Manual QA**: Complete testing checklist above
5. **Cross-Browser**: Test in Chrome, Firefox, Safari (if available)
6. **Accessibility**: Test with keyboard only, test with screen reader

### Performance Verification
1. **Search Performance**: Type rapidly in search input - should remain responsive
2. **Animation Performance**: Open DevTools Performance tab - animations should be 60fps
3. **Large Datasets**: Test with 100+ prompts - should render without lag
4. **Network Conditions**: Test on slow 3G, fast 3G, offline

### Regression Testing
1. **Quick Copy**: Still works on PromptCard
2. **Run in Chat**: Still navigates correctly
3. **Fork to Library**: Still forks and shows toast
4. **Empty States**: Original empty states still work when no prompts exist
5. **Responsive Grid**: Still responsive at all breakpoints

## Risk Mitigation

### Potential Issues
1. **Search Performance**: Large prompt collections (100+ items) could cause lag
   - **Mitigation**: Use `useMemo` for filtered results, debounce search input
   
2. **Animation Performance**: Too many simultaneous animations could drop frames
   - **Mitigation**: Leverage Framer Motion's optimizations, stagger animations, use GPU-accelerated properties (transform, opacity)
   
3. **Retry Loop**: Infinite retry attempts could overwhelm API
   - **Mitigation**: No auto-retry, only manual retry on button click
   
4. **Breaking Changes**: Modifying hooks could break existing consumers
   - **Mitigation**: Only additive changes (add `retry` function), no removal of existing properties

### Rollback Strategy
If critical issues arise:
1. All new components are isolated - can be removed without affecting existing code
2. Hook changes are additive - can revert `useLibrary` to original interface
3. View changes can be reverted commit-by-commit due to incremental phases

## Future Enhancements (Out of Scope)
- Server-side search/filter
- URL query parameter persistence
- Advanced filters (multi-select tags, date range)
- Sorting options (by date, name, etc.)
- Pagination or infinite scroll
- Tag click to filter
- Automated testing (unit, integration, E2E)
- Bulk operations (delete, export multiple prompts)
