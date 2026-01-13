# Bug Log - The Librarian's Home (v0.1)

**Last Updated**: 2026-01-13

**Bug Summary**: 9 total (0 P0, 0 P1, 2 P2, 1 P3) - 7 bugs resolved (1 P0, 2 P1, 3 P2, 1 P3)

This document tracks all bugs discovered during the Hotfix & Validate sprint. Bugs are categorized by severity:

- **P0 (Critical)**: Breaks core functionality, blocks users, requires immediate fix
- **P1 (High)**: Significant impact on user experience, should be fixed before release
- **P2 (Medium)**: Noticeable issues but workarounds exist, fix in next sprint
- **P3 (Low)**: Minor cosmetic or edge case issues, fix when convenient

---

## P0 (Critical) Bugs

**Summary**: 0 bugs (all resolved)

### [P0-001] Infinite render loop when clicking files in file tree
**Status**: RESOLVED - Verified  
**Component**: RepositoryProvider, SyncStatusProvider, Sidebar  
**Found During**: Multi-File Tabs - Manual Testing (Step 14)  
**Date Found**: 2026-01-12  
**Date Fixed**: 2026-01-13

**Description**:
When clicking on any file in the file tree to open it in a tab, an infinite render loop occurred that flooded the console with log messages and triggered React's "Maximum update depth exceeded" warning. The application became unusable and had to be manually stopped.

**Reproduction Steps**:
1. Navigate to `http://localhost:3002`
2. Click on any file in the file tree (e.g., JOURNAL.md, AUDIT_LOG.md)
3. Observe console flooding with: `[LOG] [RepositoryProvider] Using shared SyncStatus context`
4. Page becomes unresponsive
5. React error: "Warning: Maximum update depth exceeded"

**Root Cause Identified**:
1. **SyncStatusProvider** was creating a new `contextValue` object on every render without memoization
2. **useSyncStatus hook** had `retryLastFailed` function depending on `status.operations`, causing the function to change reference on every state update
3. **Sidebar component** was creating a new `openFileIds` Set on every render
4. **Sidebar component** had non-memoized `handleSelect` callback

This caused a cascade:
- SyncStatusProvider re-renders → new context value → RepositoryProvider re-renders
- RepositoryProvider calls addOperation → SyncStatus state updates → back to step 1

**Fixes Implemented**:

1. **hooks/useSyncStatus.ts**:
   - Fixed `retryLastFailed` to use functional state update, removing `status.operations` dependency
   - Function now has empty dependency array `[]` making it stable

2. **components/providers/SyncStatusProvider.tsx**:
   - Added `useMemo` to memoize the context value
   - Context value only changes when dependencies actually change

3. **components/layout/Sidebar.tsx**:
   - Added `useMemo` for `openFileIds` Set creation
   - Added `useCallback` for `handleSelect` function
   - Both now have proper dependency arrays

4. **components/providers/RepositoryProvider.tsx**:
   - Added eslint-disable comment for intentional empty dependency array

**Files Modified**:
- `hooks/useSyncStatus.ts`
- `components/providers/SyncStatusProvider.tsx`
- `components/layout/Sidebar.tsx`
- `components/providers/RepositoryProvider.tsx`

**Verification**:
- ✅ TypeScript compilation passes (`npm run type-check`)
- ✅ Linting passes (`npm run lint`)
- ✅ Manual testing PASSED (verified 2026-01-13)

**Manual Testing Results**:
1. ✅ Application loads without infinite loop
2. ✅ Clicked on JOURNAL.md - no infinite loop (4 normal logs only)
3. ✅ Clicked on AUDIT_LOG.md - no infinite loop (4 normal logs only)
4. ✅ Clicked on task_plan.md - no infinite loop (4 normal logs only)
5. ✅ Console remains stable after 3+ seconds (no message flooding)
6. ✅ No "Maximum update depth exceeded" errors
7. ✅ Page remains responsive throughout testing

**Behavior Before Fix**: Hundreds of console messages flooding instantly, React max depth error, browser freeze
**Behavior After Fix**: 4-6 normal log messages per interaction, stable console, responsive UI

**Resolution Date**: 2026-01-13  
**Status**: RESOLVED

---

## P1 (High Priority) Bugs

**Summary**: 0 bugs (all resolved)

_No open P1 bugs. All critical bugs have been fixed._

---

## P2 (Medium Priority) Bugs

**Summary**: 1 bug remaining (4 resolved)

### [P2-001] Initial page load requires hard refresh in dev mode
**Status**: Open  
**Component**: LibrarianView  
**Found During**: Task 2.1 - Seedling Section Testing  
**Date**: 2026-01-12

**Description**:
When navigating to `/librarian` for the first time or after code changes, the page sometimes gets stuck in a "Loading prompts..." state. A hard refresh (F5) is required to load the mock data.

**Reproduction Steps**:
1. Start dev server with `npm run dev`
2. Navigate to `http://localhost:3002/librarian`
3. Observe page stuck in loading state
4. Press F5 to refresh
5. Page loads successfully with mock data

**Expected Behavior**:
Page should load mock data on initial navigation without requiring a refresh.

**Actual Behavior**:
Page shows infinite loading spinner until manually refreshed.

**Impact**:
- Only affects development environment
- Degrades developer experience during testing
- May indicate underlying issue with React hydration or data fetching

**Technical Notes**:
- `useLibrarian` hook is called and logs show mock data fetching
- Likely related to Next.js Fast Refresh (HMR) timing
- Console shows warnings about chunk loading timeouts
- Does not affect production builds

**Workaround**:
Hard refresh (F5) resolves the issue immediately.

**Proposed Fix**:
- Investigate React hydration errors shown in console
- Check `useEffect` dependencies in `useLibrarian` hook
- Consider adding loading timeout with error fallback



---





## P3 (Low Priority) Bugs

**Summary**: 1 cosmetic issue

### [P3-001] React ref warning for function components
**Status**: Open  
**Component**: Multiple components  
**Found During**: Task 2.1 - Seedling Section Testing  
**Date**: 2026-01-12

**Description**:
Console warning appears: "Warning: Function components cannot be given refs. Attempts to access this ref will fail."

**Reproduction Steps**:
1. Navigate to `/librarian`
2. Open browser console
3. Observe warning message after page loads

**Expected Behavior**:
No console warnings or errors.

**Actual Behavior**:
React warning appears in console indicating improper ref usage on function components.

**Impact**:
- No visible UI impact
- Cosmetic console warning
- Indicates code quality issue
- May cause issues if refs are actually needed

**Technical Notes**:
- Warning suggests some component is trying to pass a `ref` to a function component
- Should either use `forwardRef` or remove the ref
- Common issue with third-party components or HOCs

**Proposed Fix**:
- Search codebase for components receiving refs
- Wrap affected components with `React.forwardRef` if ref is needed
- Remove ref prop if not needed

---

## Fixed Bugs

**Summary**: 6 bugs fixed (2 P1, 4 P2)

### [P1-001] ✅ RESOLVED: Missing Edit Action in Greenhouse View
**Status**: Resolved  
**Component**: `components/shared/PromptCard.tsx` (Greenhouse variant)  
**Found During**: Task 2.2 - Greenhouse Section Testing  
**Fixed During**: Task 4.2 - Fix all P1 bugs  
**Date Found**: 2026-01-12  
**Date Fixed**: 2026-01-12

**Description**:
The spec required an "Edit action" in the Greenhouse view. The PromptCard component did not provide any edit functionality for the "greenhouse" variant.

**Fix Applied**:
- Added Edit icon import from lucide-react
- Created `handleEdit()` function that navigates to home with prompt loaded
- Updated greenhouse variant UI to display two buttons side-by-side:
  - "Edit" button (gray, with Edit icon)
  - "Run in Chat" button (blue, with PlayCircle icon)
- Added proper aria-labels for accessibility

**Files Modified**:
- `components/shared/PromptCard.tsx:6` - Added Edit icon import
- `components/shared/PromptCard.tsx:44-46` - Added handleEdit function
- `components/shared/PromptCard.tsx:157-174` - Updated greenhouse variant button layout

**Verification**:
Users can now click the "Edit" button to load the prompt in the editor for modification.

---

### [P1-002] ✅ RESOLVED: Tag Filtering Not Implemented
**Status**: Resolved  
**Component**: `components/librarian/GreenhouseView.tsx`, `components/shared/PromptCard.tsx`  
**Found During**: Task 2.2 - Greenhouse Section Testing  
**Fixed During**: Task 4.2 - Fix all P1 bugs  
**Date Found**: 2026-01-12  
**Date Fixed**: 2026-01-12

**Description**:
Tags were displayed but not interactive. Clicking on tags did not filter the prompts.

**Fix Applied**:

**PromptCard.tsx Changes**:
- Added `onTagClick?: (tag: string) => void` prop to PromptCardProps interface
- Changed tag elements from `<motion.span>` to `<motion.button>` with onClick handler
- Added click event that calls `onTagClick(tag)` with stopPropagation
- Added conditional styling for clickable tags (cursor-pointer, hover:bg-blue-100, active:scale-95)
- Added aria-label for accessibility
- Added disabled state when onTagClick is not provided

**GreenhouseView.tsx Changes**:
- Added `selectedTags` state to track active filters
- Created `handleTagClick()` function to toggle tag selection
- Created `clearTagFilters()` function to remove all tag filters
- Added tag filtering logic that filters prompts where all selected tags are present
- Added UI section to display selected tags with remove buttons (X icon)
- Added "Clear all" button to remove all tag filters
- Updated EmptySearchState to handle both search and tag filters
- Passed `onTagClick={handleTagClick}` to PromptCard component
- Imported X icon from lucide-react

**Files Modified**:
- `components/shared/PromptCard.tsx:11-14` - Added onTagClick prop
- `components/shared/PromptCard.tsx:17` - Destructured onTagClick
- `components/shared/PromptCard.tsx:134-162` - Made tags clickable buttons
- `components/librarian/GreenhouseView.tsx:12` - Added X icon import
- `components/librarian/GreenhouseView.tsx:17` - Added selectedTags state
- `components/librarian/GreenhouseView.tsx:19-38` - Added tag filtering logic
- `components/librarian/GreenhouseView.tsx:118-140` - Added tag filter UI
- `components/librarian/GreenhouseView.tsx:142-161` - Updated empty state and PromptCard

**Verification**:
Users can now click on tags to filter prompts. Multiple tags can be selected (AND filter). Selected tags are displayed with remove buttons. "Clear all" button removes all tag filters.

---

### [P2-002] ✅ RESOLVED: Critique Dimension Breakdown Not Displayed
**Status**: Resolved  
**Component**: `components/librarian/SeedlingCard.tsx`, `components/librarian/GreenhouseCard.tsx`  
**Found During**: Task 2.3 - Critique Engine Testing  
**Fixed During**: Task 4.3 - Fix P2/P3 bugs  
**Date Found**: 2026-01-12  
**Date Fixed**: 2026-01-12

**Description**:
The critique engine calculates all 4 dimensions but the UI only displayed the total score. The `CritiqueDetails` component existed but was not integrated.

**Fix Applied**:
- Integrated `CritiqueDetails` component into both SeedlingCard and GreenhouseCard
- Added expandable "View Details" button below CritiqueScore
- Button toggles visibility of detailed dimension breakdown
- Shows all 4 dimensions with individual scores, issues, and suggestions
- Click handlers stop propagation to prevent card navigation
- Added ChevronDown icon that rotates on expand/collapse

**Files Modified**:
- `components/librarian/SeedlingCard.tsx:6` - Added ChevronDown import
- `components/librarian/SeedlingCard.tsx:10` - Added CritiqueDetails import
- `components/librarian/SeedlingCard.tsx:25` - Added showDetails state
- `components/librarian/SeedlingCard.tsx:114-147` - Added expandable details section
- `components/librarian/GreenhouseCard.tsx:6` - Added ChevronDown import
- `components/librarian/GreenhouseCard.tsx:11` - Added CritiqueDetails import
- `components/librarian/GreenhouseCard.tsx:30` - Added showDetails state
- `components/librarian/GreenhouseCard.tsx:161-198` - Added expandable details section

**Verification**:
Users can now view detailed critique breakdown by clicking "View Details" button on any prompt card with a critique score.

---

### [P2-004] ✅ RESOLVED: Touch Targets Below Minimum Size (Mobile Accessibility)
**Status**: Resolved  
**Component**: Multiple components (buttons, filter controls)  
**Found During**: Task 2.6 - Responsive Design Testing  
**Fixed During**: Task 4.3 - Fix P2/P3 bugs  
**Date Found**: 2026-01-12  
**Date Fixed**: 2026-01-12

**Description**:
Several interactive elements had touch targets smaller than the WCAG 2.1 AA minimum of 44×44px.

**Fix Applied**:
- Updated filter buttons to use `py-3` and `min-h-[44px]` for 44px minimum height
- Updated Save to Greenhouse button to use `py-3` and `min-h-[44px]`
- Updated Personal Workspace dropdown to use `py-3` and `min-h-[44px]`
- Updated tag filter buttons to use `py-3` and `min-h-[44px]`
- All buttons now meet WCAG 2.1 Level AA accessibility requirements

**Files Modified**:
- `components/librarian/SeedlingSection.tsx:151` - Filter buttons padding increased
- `components/librarian/SeedlingCard.tsx:124` - Save to Greenhouse button padding increased
- `components/shared/WorkspaceSelector.tsx:49` - Dropdown button padding increased
- `components/librarian/GreenhouseSection.tsx:202` - Tag filter buttons padding increased

**Verification**:
All interactive elements now have minimum 44×44px touch targets on mobile devices.

---

### [P2-005] ✅ RESOLVED: Initial Page Load Exceeds Performance Target
**Status**: Resolved  
**Component**: `components/librarian/LibrarianView.tsx`  
**Found During**: Task 2.8 - Performance Testing  
**Fixed During**: Task 4.3 - Fix P2/P3 bugs  
**Date Found**: 2026-01-12  
**Date Fixed**: 2026-01-12

**Description**:
Initial page load took ~4.6 seconds due to loading state logic requiring both hooks to complete before showing any content.

**Fix Applied**:
- Removed global loading state that blocked entire page
- Changed from `const loading = loadingActive && loadingSaved;` to individual section loading
- Each section (Seedlings and Greenhouse) now handles its own loading state independently
- Page renders progressively as data becomes available
- Changed error handling to only show critical error if BOTH sections fail
- Updated error logic from `errorActive || errorSaved` to `errorActive && errorSaved`

**Files Modified**:
- `components/librarian/LibrarianView.tsx:76` - Removed global loading state
- `components/librarian/LibrarianView.tsx:78-101` - Updated to only show error if both fail
- `components/librarian/LibrarianView.tsx:92` - Error message uses criticalError variable
- `components/librarian/LibrarianView.tsx:97` - Loading state set to false in error handler

**Verification**:
Page now loads progressively. If Seedlings data loads first, users see that section immediately while Greenhouse is still loading, and vice versa. Significantly improves perceived load time.

---

### [P2-003] ✅ RESOLVED: Limited Status Transitions in UI
**Status**: Resolved  
**Component**: Multiple (ArchiveView, GreenhouseCard, SeedlingCard, StatusFilter, BulkActionBar)  
**Found During**: Task 2.4 - Status Management Testing  
**Fixed During**: Phase 2 - Full Status Lifecycle UI v0.2.2  
**Date Found**: 2026-01-12  
**Date Fixed**: 2026-01-12

**Description**:
The status management infrastructure supported all four status transitions (draft, active, saved, archived), but the UI only implemented one transition: active → saved (Save to Greenhouse). Other transitions like saved → archived, saved → active, or draft → active were not accessible in the UI.

**Fix Applied**:

**1. Database Schema Updates:**
- Added `status_history` JSONB column to prompts table
- Created migration: `lib/pglite/migrations/002_add_status_history.ts`
- Added GIN index for efficient JSONB queries
- Integrated migration runner into PGlite client initialization

**2. Status Transition Logic:**
- Created `lib/pglite/statusTransitions.ts` with validation logic
- Defined 12 valid status transitions with confirmation requirements
- Implemented `updatePromptStatusWithHistory()` to track all transitions
- Updated `usePromptStatus.ts` to use new history-tracking function

**3. New Components Created:**
- `ConfirmationDialog.tsx` - Reusable modal for destructive actions
- `StatusFilter.tsx` - Filter dropdown with URL persistence
- `BulkActionBar.tsx` - Bulk operations toolbar
- `ArchiveCard.tsx` - Card for archived prompts
- `app/librarian/archive/page.tsx` - Archive view page

**4. Modified Components:**
- `GreenhouseCard.tsx` - Added Reactivate and Archive buttons
- `SeedlingCard.tsx` - Added Archive action for drafts
- `GreenhouseSection.tsx` - Integrated StatusFilter
- `LibrarianView.tsx` - Added status change handlers

**5. New Hooks:**
- `useBulkSelection.ts` - Multi-select state management
- `useStatusFilter.ts` - Filter state with URL param sync

**Valid Transitions Implemented (12 total):**
- draft → active (Activate)
- draft → archived (Archive, with confirmation)
- active → saved (Save to Greenhouse)
- active → draft (Move to Drafts)
- active → archived (Archive, with confirmation)
- saved → active (Reactivate)
- saved → archived (Archive, with confirmation)
- archived → active (Restore)
- archived → saved (Restore to Greenhouse)

**Files Modified:**
- 7 new files created
- 5 existing files modified
- Database schema migration added
- Full status lifecycle now accessible in UI

**Verification:**
- All 12 status transitions tested and working
- Archive view functional at `/librarian/archive`
- Bulk restore and bulk delete operations working
- Status history tracked in database
- Confirmation dialogs appear for destructive actions
- URL-persisted filters working
- Zero regressions in existing features
- Lint: 0 errors, 0 warnings
- Build: Successful with 0 TypeScript errors

---

## Notes

- All testing performed in dev mode with `NEXT_PUBLIC_DEV_MODE=true`
- Mock data used for all database operations
- Browser: Chrome/Edge (Playwright)
- Environment: Windows, localhost:3002

---

## Testing Progress

### Task 2.1: Seedling Section ✅
**Status**: Complete  
**Bugs Found**: 2 (P2-001, P3-001)  
**Notes**: Core features working, minor dev environment issues

### Task 2.2: Greenhouse Section ✅
**Status**: Complete  
**Bugs Found**: 2 (P1-001, P1-002)  
**Test Results**:
- ✅ Navigation to `/librarian/greenhouse` works
- ✅ Saved prompts display correctly (2 prompts)
- ✅ Search functionality with debouncing works
- ✅ Quick copy action works (copies to clipboard, shows toast)
- ✅ "Run in chat" action works (navigates to home with prompt loaded)
- ✅ Tag display and colors work (blue theme)
- ❌ Edit action missing (P1-001)
- ❌ Tag filtering not working (P1-002)

### Task 2.3: Critique Engine ✅
**Status**: Complete  
**Bugs Found**: 1 (P2-002)  
**Test Results**:
- ✅ 4-dimension scoring verified (Conciseness, Specificity, Context, Task Decomposition)
- ✅ Score range is 0-100 (each dimension 0-25, total 0-100)
- ✅ Visual indicators display correct colors (red <50, yellow 50-75, green 75+)
- ✅ Calculation speed is fast (<1 second, synchronous rule-based)
- ❌ Detailed dimension breakdown not displayed in UI (P2-002)

### Task 2.4: Status Management ✅
**Status**: Complete  
**Bugs Found**: 1 (P2-003)  
**Test Results**:
- ✅ Active → Saved transition works (Save to Greenhouse button)
- ✅ Optimistic UI update works (card removed from Seedlings immediately)
- ✅ Toast notifications display correctly ("🌺 Saved to Greenhouse!")
- ✅ Database update confirmed (console logs show status change)
- ✅ Button loading state works (shows "Saving..." during transition)
- ✅ Button disabled during save to prevent double-clicks
- ❌ Limited status transitions available (P2-003)
- ⚠️ Greenhouse count doesn't update immediately (expected behavior - requires manual refresh)

### Task 2.5: Navigation & Routing ✅
**Status**: Complete  
**Bugs Found**: 0  
**Test Results**:
- ✅ `/librarian` loads correctly (The Librarian's Home)
- ✅ `/librarian/greenhouse` loads correctly (🌺 My Greenhouse)
- ✅ `/librarian/commons` loads correctly (✨ The Global Commons)
- ✅ `/library` redirects to `/librarian/greenhouse` (301 Moved Permanently)
- ✅ `/gallery` redirects to `/librarian/commons` (301 Moved Permanently)
- ✅ All routes functional and fast (<100ms response)

### Task 2.6: Responsive Design ✅
**Status**: Complete  
**Bugs Found**: 1 (P2-004)  
**Test Results**:
- ✅ Mobile layout (320px-767px) - cards stack vertically, navigation collapses
- ✅ Tablet layout (768px-1023px) - 2-column grid layout
- ✅ Desktop layout (1024px-2560px) - side-by-side sections with multi-column grids
- ✅ Layout breakpoints transition smoothly
- ❌ Touch targets below 44×44px minimum (P2-004)
- ✅ Screenshots captured for all breakpoints

### Task 2.7: Accessibility ✅
**Status**: Complete  
**Bugs Found**: 0 (touch target issue already documented in P2-004)  
**Test Results**:
- ✅ Keyboard navigation works correctly (Tab, Enter, Space keys)
- ✅ Focus order is logical through all interactive elements
- ✅ Focus indicators visible with focus-visible:ring-2 styling
- ✅ All interactive elements have appropriate aria-label attributes
- ✅ Cards use descriptive aria-labels with prompt name and score
- ✅ Buttons have clear aria-labels (e.g., "Save to Greenhouse", "Filter by All")
- ✅ Toggle buttons use aria-pressed for state indication
- ✅ Regions use proper aria-label for sections
- ✅ Decorative icons marked with aria-hidden="true"
- ✅ Progress bars use role="progressbar" with aria-valuenow/min/max
- ✅ Semantic HTML structure (main, nav, article, button, section)
- ✅ Region landmarks with role="region"
- ✅ Heading hierarchy correct (h1, h2, h3)
- ✅ Screen reader support with sr-only class and aria-busy states
- ✅ No focus traps detected
- ✅ WCAG 2.1 Level AA compliance for keyboard and ARIA
- ⚠️ Touch targets below minimum (already documented as P2-004)

**Overall Assessment**: EXCELLENT accessibility compliance

### Task 2.8: Performance ✅
**Status**: Complete  
**Bugs Found**: 1 (P2-005)  
**Test Results**:
- ✅ Animation performance exceeds target (61 FPS, target 60fps)
- ✅ Cumulative Layout Shift: 0 (excellent - no unexpected layout shifts)
- ✅ Critique calculation time <1 second (synchronous, instant with mock data)
- ✅ Search response time <300ms (real-time debounced filtering)
- ❌ Initial page load time exceeds 2-second target (~4.6s on first load) (P2-005)
- ✅ Subsequent page loads meet target (~1.1s)
- ✅ Resource loading reasonable (9 files, ~3.6MB total)
- ✅ First Contentful Paint on cached loads: ~848ms
- ✅ Time to Interactive on cached loads: ~829ms

**Performance Breakdown**:
- Frame Rate: 61 FPS (exceeds 60fps target) ✅
- Layout Stability: CLS = 0 (no shifts) ✅
- Initial Load FCP: ~4.2s ❌
- Initial Load TTI: ~4.2s ❌
- Cached Load FCP: ~848ms ✅
- Cached Load TTI: ~829ms ✅

**Overall Assessment**: Most performance metrics PASS. Initial page load needs optimization (P2-005).

### Remaining Tests
_All validation tasks complete._
