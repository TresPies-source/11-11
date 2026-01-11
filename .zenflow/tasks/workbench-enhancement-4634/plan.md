# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: dcecfb9f-f8d3-41a5-83bb-2b71095fc4b0 -->

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: e13763a5-1b19-4e90-b722-2e19e137c53d -->

Create a technical specification based on the PRD in `{@artifacts_path}/requirements.md`.

1. Review existing codebase architecture and identify reusable components
2. Define the implementation approach

Save to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach referencing existing code patterns
- Source code structure changes
- Data model / API / interface changes
- Delivery phases (incremental, testable milestones)
- Verification approach using project lint/test commands

### [x] Step: Planning
<!-- chat-id: 9fe3b351-797b-4db9-9c1b-e05ba5076aa5 -->

Create a detailed implementation plan based on `{@artifacts_path}/spec.md`.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps
3. Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function) or too broad (entire feature).

If the feature is trivial and doesn't warrant full specification, update this workflow to remove unnecessary steps and explain the reasoning to the user.

Save to `{@artifacts_path}/plan.md`.

---


### [x] Step: Implementation
<!-- chat-id: 3c73e3fe-1f32-40ee-a440-ae864d6601fd -->
<!-- agent: ZEN_CLI -->
## Implementation Plan

### Phase 1: Search & Filter Foundation

#### [ ] Task 1.1: Create SearchInput Component
**File**: `components/shared/SearchInput.tsx`

**Objective**: Build reusable search input with icon and clear button

**Implementation Steps**:
- Create component accepting `value`, `onChange`, `placeholder` props
- Add Search icon (Lucide) on the left (20px, gray-400)
- Add conditional X icon on the right (16px, gray-500) when value is not empty
- Implement clear button that resets value to empty string
- Apply Tailwind classes: `h-10`, `border-gray-300`, `focus:border-blue-500`, `pl-10 pr-10`
- Add proper ARIA labels for accessibility

**Verification**:
- Component renders with search icon
- Clear button appears only when there's text
- Clear button empties the input
- Focus states work correctly
- Run `npm run lint` - no warnings
- Run `npm run type-check` - no errors

**References**: spec.md Phase 1.1, requirements.md R2.1.x

#### [ ] Task 1.2: Create usePromptSearch Hook
**File**: `hooks/usePromptSearch.ts`

**Objective**: Implement client-side search/filter logic

**Implementation Steps**:
- Define `UsePromptSearchParams` and `UsePromptSearchReturn` interfaces
- Accept `prompts: PromptFile[]` and `searchTerm: string`
- Use `useMemo` to filter prompts (dependencies: prompts, searchTerm)
- Implement case-insensitive search across:
  - `prompt.metadata?.title`
  - `prompt.metadata?.description`
  - `prompt.metadata?.tags` (check if any tag includes search term)
  - Fallback to `prompt.name` if no metadata.title
- Return `{ filteredPrompts: PromptFile[] }`

**Verification**:
- Hook returns all prompts when searchTerm is empty
- Hook filters correctly by title
- Hook filters correctly by description
- Hook filters correctly by tags
- Case-insensitive search works
- Run `npm run type-check` - no errors

**References**: spec.md Phase 1.2, requirements.md R2.2.x

#### [ ] Task 1.3: Create EmptySearchState Component
**File**: `components/shared/EmptySearchState.tsx`

**Objective**: Display "no results" message when search returns empty

**Implementation Steps**:
- Accept props: `searchTerm: string`, `onClear: () => void`
- Layout with `bg-gray-50`, `border-gray-200`, `rounded-lg`, `p-12`
- Add Search icon (Lucide, 64px, gray-400)
- Display title: "No prompts match your search" (gray-700, font-medium, text-lg)
- Display search term in quotes (gray-500, text-sm, italic)
- Add "Clear search" button (blue-600, hover:blue-700)
- Button calls `onClear` on click

**Verification**:
- Component displays search term correctly
- Clear button calls onClear handler
- Styling matches design spec
- Run `npm run lint` - no warnings

**References**: spec.md Phase 5.1, requirements.md R2.3.x

#### [ ] Task 1.4: Integrate Search into LibraryView
**File**: `components/library/LibraryView.tsx` (modify)

**Objective**: Add search functionality to Library page

**Implementation Steps**:
- Import `SearchInput`, `usePromptSearch`, `EmptySearchState`, `useDebounce`
- Add state: `const [searchTerm, setSearchTerm] = useState('')`
- Add debounced search: `const debouncedSearch = useDebounce(searchTerm, 300)`
- Use hook: `const { filteredPrompts } = usePromptSearch({ prompts, searchTerm: debouncedSearch })`
- Render `SearchInput` between header and grid
- Display `filteredPrompts` instead of `prompts` in grid
- Add empty search state when `filteredPrompts.length === 0 && searchTerm`
- Preserve existing empty state when `filteredPrompts.length === 0 && !searchTerm`

**Verification**:
- Search input appears on page
- Typing filters prompts in real-time (with 300ms debounce)
- Clear button works
- Empty search state shows when no matches
- Existing empty state still works when no prompts at all
- Run `npm run dev` and test manually
- Run `npm run type-check` - no errors

**References**: spec.md Phase 1.3, requirements.md R2.x

#### [ ] Task 1.5: Integrate Search into GalleryView
**File**: `components/gallery/GalleryView.tsx` (modify)

**Objective**: Add search functionality to Gallery page

**Implementation Steps**:
- Same implementation as LibraryView (Task 1.4)
- Only difference: header icon (Sparkles) and empty state message

**Verification**:
- Same verification as Task 1.4
- Gallery-specific header and empty state preserved

**References**: spec.md Phase 1.4, requirements.md R2.x

---

### Phase 2: Enhanced Loading States

#### [ ] Task 2.1: Create PromptCardSkeleton Component
**File**: `components/shared/PromptCardSkeleton.tsx`

**Objective**: Build skeleton loader matching PromptCard structure

**Implementation Steps**:
- Accept prop: `index?: number` (for stagger animation)
- Match PromptCard layout:
  - Title area (rounded rectangle, `w-3/4`, `h-6`)
  - Description lines (3 lines, varying widths: `w-full`, `w-5/6`, `w-4/6`)
  - Tag placeholders (2-3 rounded rectangles)
  - Button placeholder
- Background gradient: `bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100`
- Add shimmer animation class: `animate-shimmer`
- Container height: `h-64` (prevent layout shift)
- Framer Motion: Stagger by `index * 0.05s`

**CSS for Shimmer** (add to globals.css):
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

**Verification**:
- Skeleton matches PromptCard dimensions
- Shimmer animation is smooth
- Stagger animation works
- Run `npm run lint` - no warnings

**References**: spec.md Phase 2.1, requirements.md R3.2.x

#### [ ] Task 2.2: Create LoadingState Component
**File**: `components/shared/LoadingState.tsx`

**Objective**: Centralized loading UI with spinner and skeleton grid

**Implementation Steps**:
- Accept prop: `count?: number` (default 6)
- Display centered section with:
  - Loader2 icon (Lucide, 48px, blue-600) with spin animation
  - Text: "Loading prompts..." (gray-600, mt-2)
- Grid of `PromptCardSkeleton` components (count prop)
- Grid classes: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8`
- Pass index to each skeleton for stagger

**Verification**:
- Spinner is centered and spinning
- Skeleton grid displays correct number of cards
- Grid is responsive (1-3 columns)
- Run `npm run type-check` - no errors

**References**: spec.md Phase 2.2, requirements.md R3.1.x

#### [ ] Task 2.3: Update LibraryView Loading State
**File**: `components/library/LibraryView.tsx` (modify)

**Objective**: Replace inline skeleton with LoadingState component

**Implementation Steps**:
- Import `LoadingState`
- Replace existing loading skeleton grid with `<LoadingState count={6} />`
- Keep page header visible during loading

**Verification**:
- Loading state uses new component
- Header remains visible
- Smooth transition from loading to loaded state
- Run `npm run dev` and test with slow network

**References**: spec.md Phase 2.3

#### [ ] Task 2.4: Update GalleryView Loading State
**File**: `components/gallery/GalleryView.tsx` (modify)

**Objective**: Replace inline skeleton with LoadingState component

**Implementation Steps**:
- Same as Task 2.3

**Verification**:
- Same as Task 2.3

**References**: spec.md Phase 2.3

---

### Phase 3: Enhanced Error States

#### [ ] Task 3.1: Add Retry Mechanism to useLibrary Hook
**File**: `hooks/useLibrary.ts` (modify)

**Objective**: Enable retry functionality for failed loads

**Implementation Steps**:
- Add state: `const [retryCount, setRetryCount] = useState(0)`
- Create retry function: `const retry = () => setRetryCount(prev => prev + 1)`
- Add `retryCount` to useEffect dependency array
- Update return type to include `retry: () => void`

**Verification**:
- Hook still works without calling retry (backwards compatible)
- Calling retry triggers re-fetch
- Run `npm run type-check` - no errors

**References**: spec.md Phase 3.1, requirements.md R4.2.x

#### [ ] Task 3.2: Create ErrorState Component
**File**: `components/shared/ErrorState.tsx`

**Objective**: Reusable error UI with retry capability

**Implementation Steps**:
- Accept props: `title: string`, `message: string`, `onRetry: () => void`, `loading?: boolean`
- Create `getErrorGuidance(error: string): string[]` helper:
  - Network errors: "Check your internet connection", "Try refreshing the page"
  - Auth errors: "Try signing out and back in", "Check your Google Drive permissions"
  - Default: "Our servers might be experiencing issues", "Please try again in a moment"
- Layout:
  - Container: `bg-red-50`, `border-red-200`, `rounded-lg`, `p-8`
  - AlertCircle icon (Lucide, 48px, red-400)
  - Title (red-800, font-medium, text-lg)
  - Message (red-600, text-sm, mt-2)
  - Troubleshooting tips (gray-700, text-sm, mt-4, bulleted)
  - Retry button (blue-600, hover:blue-700, disabled:opacity-50)
- Show spinner on button when `loading` is true

**Verification**:
- Error guidance changes based on error message
- Retry button calls onRetry
- Loading state shows spinner on button
- Styling matches spec
- Run `npm run lint` - no warnings

**References**: spec.md Phase 3.2, requirements.md R4.x

#### [ ] Task 3.3: Update LibraryView Error Handling
**File**: `components/library/LibraryView.tsx` (modify)

**Objective**: Use ErrorState component with retry

**Implementation Steps**:
- Destructure `retry` from useLibrary: `const { prompts, loading, error, retry } = useLibrary()`
- Replace inline error box with:
```tsx
<ErrorState
  title="Unable to load prompts"
  message={error}
  onRetry={retry}
  loading={loading}
/>
```

**Verification**:
- Error state displays correctly
- Retry button works
- Loading spinner shows during retry
- Test by simulating network error

**References**: spec.md Phase 3.3

#### [ ] Task 3.4: Update GalleryView Error Handling
**File**: `components/gallery/GalleryView.tsx` (modify)

**Objective**: Use ErrorState component with retry

**Implementation Steps**:
- Same as Task 3.3
- Note: useGallery uses useLibrary, so retry is inherited

**Verification**:
- Same as Task 3.3

**References**: spec.md Phase 3.3

---

### Phase 4: PromptCard UI Polish

#### [ ] Task 4.1: Enhance PromptCard Hover Effects
**File**: `components/shared/PromptCard.tsx` (modify)

**Objective**: Improve hover animations and visual feedback

**Implementation Steps**:
- Update `cardVariants.hover`:
  - Change shadow to `shadow-2xl` (0 25px 50px -12px rgba(0, 0, 0, 0.25))
  - Keep scale: 1.02
  - Keep transition duration: 0.2s
- Add tag hover variant:
  - Scale: 1.05
  - Background brightens to blue-100 (rgb(219 234 254))
- Implement using Framer Motion whileHover on tags

**Verification**:
- Card hover shadow increases smoothly
- Tags scale and brighten on card hover
- Animations are smooth (60fps)
- Run `npm run dev` and test hover states

**References**: spec.md Phase 4.1, requirements.md R1.1.x

#### [ ] Task 4.2: Add Action Button Feedback
**File**: `components/shared/PromptCard.tsx` (modify)

**Objective**: Improve button press and disabled states

**Implementation Steps**:
- Add to all button classes:
  - `active:scale-95` (press animation)
  - `transition-transform duration-100`
  - `disabled:opacity-50 disabled:cursor-not-allowed` (when applicable)
- Maintain existing functionality:
  - Quick Copy: Keep existing check feedback
  - Fork to Library: Keep existing "Forking..." state
  - Run in Chat: Maintain existing behavior

**Verification**:
- Buttons scale down on click
- Disabled states are visually clear
- Existing button behaviors preserved
- Transitions are smooth
- Run `npm run lint` - no warnings

**References**: spec.md Phase 4.2, requirements.md R1.2.x

#### [ ] Task 4.3: Add Reduced Motion Support
**File**: `components/shared/PromptCard.tsx` (modify)

**Objective**: Respect prefers-reduced-motion preferences

**Implementation Steps**:
- Add to globals.css (if not already present):
```css
@media (prefers-reduced-motion: reduce) {
  .animate-shimmer { animation: none; }
}
```
- Note: Framer Motion automatically respects prefers-reduced-motion
- Verify no custom CSS animations ignore this setting

**Verification**:
- Test with OS setting: prefers-reduced-motion: reduce
- Animations should be minimal or disabled
- Functionality still works without animations

**References**: spec.md Phase 4.3, requirements.md R1.3.3, R5.2.5

---

### Phase 5: Final Integration & Testing

#### [ ] Task 5.1: Run Lint and Type Check
**Objective**: Ensure code quality standards

**Steps**:
- Run `npm run lint`
- Run `npm run type-check`
- Fix any warnings or errors

**Success Criteria**:
- Zero ESLint warnings
- Zero TypeScript errors

**References**: requirements.md Non-Functional Requirements

#### [ ] Task 5.2: Run Production Build
**Objective**: Verify production build succeeds

**Steps**:
- Run `npm run build`
- Fix any build errors

**Success Criteria**:
- Build completes successfully
- No build warnings or errors

**References**: spec.md Verification Approach

#### [ ] Task 5.3: Manual QA Testing
**Objective**: Comprehensive testing of all features

**Testing Checklist**:
- [ ] Search filters prompts correctly by title
- [ ] Search filters prompts correctly by description
- [ ] Search filters prompts correctly by tags
- [ ] Debouncing works (300ms delay observed)
- [ ] Clear search button works
- [ ] Empty search state displays when no results
- [ ] Loading state shows shimmer skeletons
- [ ] Loading spinner is centered and spinning
- [ ] Error state shows when data fetch fails
- [ ] Retry button re-fetches data
- [ ] Retry button shows loading spinner during retry
- [ ] PromptCard hover effects work (shadow, tags)
- [ ] Action buttons have active state (scale down)
- [ ] Quick Copy works and shows feedback
- [ ] Run in Chat navigates correctly
- [ ] Fork to Library works (gallery only)
- [ ] Responsive on mobile (320px width)
- [ ] Responsive on tablet (768px width)
- [ ] Responsive on desktop (1024px+ width)
- [ ] Keyboard navigation works
- [ ] Reduced motion setting is respected

**References**: spec.md Phase 5 Testing Checklist

#### [ ] Task 5.4: Performance Testing
**Objective**: Verify performance standards

**Steps**:
- Test search with rapid typing - should remain responsive
- Use Chrome DevTools Performance tab - verify 60fps animations
- Test with 100+ prompts (if available) - should render without lag
- Test on slow network (Chrome DevTools) - loading states work

**Success Criteria**:
- No UI lag during search
- Animations maintain 60fps
- Large datasets render smoothly

**References**: spec.md Performance Verification

#### [ ] Task 5.5: Accessibility Testing
**Objective**: Ensure accessibility standards

**Steps**:
- Navigate with keyboard only (Tab, Enter, Escape)
- Test with screen reader (if available)
- Verify ARIA labels on SearchInput
- Check loading/error state announcements

**Success Criteria**:
- All interactive elements keyboard accessible
- Proper ARIA labels present
- Screen reader friendly

**References**: requirements.md R5.2.x

---

## Test Results

### Lint Results
```
(Will be filled in after Task 5.1)
```

### Type Check Results
```
(Will be filled in after Task 5.1)
```

### Build Results
```
(Will be filled in after Task 5.2)
```

### Manual QA Results
```
(Will be filled in after Task 5.3)
```
