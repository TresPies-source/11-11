# Product Requirements Document: Workbench Enhancement

## Overview

This document outlines the requirements for enhancing the Library and Gallery pages of the 11-11 Sustainable Intelligence OS workbench. The enhancements focus on improving user experience through UI polish, functional depth via search/filter capabilities, and system stability through better loading and error states.

## Project Context

### Current State
- **PromptCard Component**: Already implements Framer Motion animations with basic hover effects (scale 1.02, shadow-lg, border color change)
- **LibraryView & GalleryView**: Display prompts in responsive grids (1-3 columns) with basic loading (skeleton placeholders) and error states (red boxes)
- **Data Model**: PromptFile with metadata (title, description, tags, public flag) and rawContent
- **No Search/Filter**: Users cannot filter or search prompts
- **Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Lucide icons

### Design Philosophy
- **"Hardworking" Aesthetic**: Calm, professional design with purposeful animations (200-300ms duration)
- **Sustainable Innovation**: Paced, thoughtful development prioritizing user well-being
- **Responsive**: Support 320px - 2560px viewports

## Success Criteria

1. **UI Polish**: PromptCard exhibits improved visual appeal with subtle hover effects and clear action feedback
2. **Search/Filter**: Real-time client-side filtering by title, description, or tags on both Library and Gallery pages
3. **Loading States**: Visually engaging skeleton loaders with improved animations
4. **Error States**: Clear, informative error messages with troubleshooting guidance
5. **Zero Regressions**: No ESLint warnings, no TypeScript errors, production build succeeds

## Feature Requirements

### 1. Enhanced PromptCard UI

#### 1.1 Hover Effects
**Current State**: Card scales to 1.02, shadow increases, border changes to blue-300
**Requirements**:
- **R1.1.1**: Maintain existing hover scale (1.02) and timing (200ms)
- **R1.1.2**: Add subtle elevation through enhanced shadow transitions
- **R1.1.3**: Title color transitions to blue-600 on hover (already implemented)
- **R1.1.4**: Tags should have subtle hover interactions when card is hovered
- **R1.1.5**: All transitions must complete within 200-300ms per design philosophy

#### 1.2 Action Button Feedback
**Current State**: 
- "Quick Copy" button changes to green check for 2 seconds
- "Run in Chat" and "Fork to Library" buttons have basic hover states

**Requirements**:
- **R1.2.1**: Quick Copy feedback (already implemented) - maintain existing behavior
- **R1.2.2**: "Run in Chat" button should show loading state on click before navigation
- **R1.2.3**: "Fork to Library" button already shows "Forking..." state - maintain existing behavior
- **R1.2.4**: Add ripple effect or scale animation on primary action buttons (0.95 scale on press)
- **R1.2.5**: Disabled states should be visually clear (opacity 50%, cursor not-allowed)

#### 1.3 Visual Polish
**Requirements**:
- **R1.3.1**: Card entry animations (already implemented via Framer Motion variants) - maintain existing behavior
- **R1.3.2**: Tag stagger animations (already implemented) - maintain existing behavior
- **R1.3.3**: Ensure all animations respect reduced-motion preferences
- **R1.3.4**: Cards should have consistent spacing and alignment in grid

### 2. Search and Filter Functionality

#### 2.1 Search Input Component
**Requirements**:
- **R2.1.1**: Create a search input field with search icon (Lucide Search)
- **R2.1.2**: Position search input prominently below the page header and above the prompt grid
- **R2.1.3**: Input should be full width on mobile, constrained width (max-w-md) on desktop
- **R2.1.4**: Include clear button (X icon) when search text is present
- **R2.1.5**: Placeholder text: "Search prompts by title, description, or tags..."

#### 2.2 Filter Logic
**Requirements**:
- **R2.2.1**: Implement client-side filtering (no API changes)
- **R2.2.2**: Search should be case-insensitive
- **R2.2.3**: Filter across three fields: title, description, tags (array)
- **R2.2.4**: Search should update in real-time (no submit button needed)
- **R2.2.5**: Use debouncing (300ms) to optimize performance during typing

#### 2.3 Empty Search Results
**Requirements**:
- **R2.3.1**: Display empty state when no prompts match search criteria
- **R2.3.2**: Empty state should show search icon and helpful message: "No prompts match your search"
- **R2.3.3**: Include current search term in empty state message
- **R2.3.4**: Provide clear button to reset search

#### 2.4 Search State Persistence
**Requirements**:
- **R2.4.1**: Search term should persist in URL query parameter (optional - nice to have)
- **R2.4.2**: Clearing search should update URL (if implemented)

### 3. Enhanced Loading States

#### 3.1 Loading Animation
**Current State**: 6 skeleton cards with basic pulse animation
**Requirements**:
- **R3.1.1**: Maintain skeleton card approach (accessibility best practice)
- **R3.1.2**: Enhance pulse animation with gradient shimmer effect
- **R3.1.3**: Stagger skeleton card appearance (50ms delay between cards)
- **R3.1.4**: Add loading icon (Loader2 with spin animation) centered above skeleton grid
- **R3.1.5**: Include loading text: "Loading prompts..." below spinner

#### 3.2 Loading Skeleton Structure
**Requirements**:
- **R3.2.1**: Skeleton should match PromptCard structure (title, description lines, tag placeholders, button)
- **R3.2.2**: Use rounded rectangles with appropriate widths (3/4, full, 5/6, 4/6 for text lines)
- **R3.2.3**: Maintain consistent height (h-64 or similar) to prevent layout shift

### 4. Enhanced Error States

#### 4.1 Error Display
**Current State**: Red box with error message and generic "Failed to load" text
**Requirements**:
- **R4.1.1**: Display error icon (AlertCircle from Lucide) in error state
- **R4.1.2**: Show clear, user-friendly error title (e.g., "Unable to load prompts")
- **R4.1.3**: Display technical error message in smaller, secondary text
- **R4.1.4**: Use consistent error colors (red-50 background, red-800 title, red-600 message)

#### 4.2 Error Recovery
**Requirements**:
- **R4.2.1**: Include "Try Again" button to retry loading
- **R4.2.2**: Button should trigger re-fetch of data (hook should support retry mechanism)
- **R4.2.3**: Show loading state on retry button during re-fetch

#### 4.3 Error Guidance
**Requirements**:
- **R4.3.1**: Provide troubleshooting tips based on error type:
  - Network errors: "Check your internet connection"
  - Auth errors: "Try signing out and back in"
  - Server errors: "Our servers might be experiencing issues. Please try again in a moment."
- **R4.3.2**: Link to help documentation or support (optional - nice to have)

### 5. System Stability

#### 5.1 Performance
**Requirements**:
- **R5.1.1**: Search filtering should not cause UI lag (use useMemo for filtered results)
- **R5.1.2**: Animations should maintain 60fps (leverage Framer Motion's optimizations)
- **R5.1.3**: Large prompt collections (100+ items) should render smoothly

#### 5.2 Accessibility
**Requirements**:
- **R5.2.1**: Search input must have proper ARIA labels
- **R5.2.2**: Loading states must announce to screen readers (aria-live)
- **R5.2.3**: Error states must be keyboard accessible
- **R5.2.4**: All interactive elements must support keyboard navigation
- **R5.2.5**: Respect prefers-reduced-motion for all animations

#### 5.3 Responsive Design
**Requirements**:
- **R5.3.1**: Search input adapts to mobile (full width) and desktop (constrained)
- **R5.3.2**: Grid maintains responsive breakpoints (1 col mobile, 2 col tablet, 3 col desktop)
- **R5.3.3**: Error and loading states are readable on all viewport sizes

## Non-Functional Requirements

### Quality Standards
- **Zero ESLint warnings or errors**: Must pass `npm run lint`
- **Zero TypeScript errors**: Must pass `npm run type-check`
- **Production build succeeds**: Must pass `npm run build`

### Design Consistency
- Follow existing Tailwind CSS patterns
- Use Lucide icons for all new icons
- Maintain Framer Motion animation patterns
- Respect "Hardworking" design philosophy (200-300ms animations, calm aesthetic)

### Code Quality
- Components should follow existing patterns in codebase
- Use TypeScript for type safety
- Implement proper error boundaries if needed
- Add inline comments for complex logic
- Follow existing file structure (components/library, components/gallery, components/shared)

## Out of Scope

The following items are explicitly **not** included in this sprint:
- Server-side search or filtering
- Advanced filter options (multi-select, date ranges, etc.)
- Tag management or editing
- Prompt editing from Library/Gallery views
- Pagination or infinite scroll
- Sorting options (by date, name, etc.)
- Batch operations (delete, export multiple prompts)
- Automated testing (unit tests, E2E tests)

## Dependencies

### Required
- Existing hooks: `useLibrary`, `useGallery`
- Existing components: `PromptCard`, `LibraryView`, `GalleryView`
- Existing utilities: `cn` (classname utility)
- Existing hooks: `useToast` (for user feedback)

### Optional
- Create new custom hook for search functionality (`usePromptSearch`)
- Create shared loading skeleton component (`PromptCardSkeleton`)
- Create shared error display component (`ErrorState`)

## Implementation Assumptions

Based on the task description and codebase analysis, the following assumptions are made:

1. **Client-side only**: All filtering/search happens in the browser (no backend changes)
2. **No test script**: The cleanup script references `npm test` but package.json has no test script - will use lint and type-check only
3. **Toast notifications**: Existing `useToast` hook will handle success/error feedback for actions
4. **Motion preferences**: Framer Motion animations will respect `prefers-reduced-motion`
5. **No breaking changes**: All existing functionality must continue to work
6. **Progressive enhancement**: Features should degrade gracefully if JavaScript is disabled (Next.js server rendering)

## Visual Specifications

### Search Input
- Height: h-10 (40px)
- Border: border border-gray-300, focus:border-blue-500
- Icon: Search (Lucide), 20px, gray-400
- Clear button: X (Lucide), 16px, gray-500, hover:gray-700
- Padding: pl-10 pr-10 (for icons)

### Enhanced Loading Skeleton
- Shimmer gradient: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)
- Animation duration: 1.5s
- Background: gray-100 to gray-200 gradient

### Error State
- Icon size: 48px (h-12 w-12)
- Icon color: red-400
- Container: red-50 background, red-200 border
- Button: blue-600 background, hover:blue-700

## Success Metrics

1. **Functional completeness**: All requirements implemented
2. **Code quality**: Zero lint/type errors
3. **Performance**: No perceived lag during search/filter
4. **Visual consistency**: Matches existing design system
5. **User feedback**: Clear feedback for all actions (copy, fork, search, error)

## Timeline

This is a single sprint enhancement with estimated breakdown:
1. **Planning & Spec**: ~1-2 hours (this document + technical spec)
2. **Implementation**: ~4-6 hours
   - Search/filter: ~2 hours
   - Enhanced loading states: ~1 hour
   - Enhanced error states: ~1 hour
   - UI polish refinements: ~1-2 hours
3. **Testing & QA**: ~1 hour (manual testing, lint, type-check)

**Total estimated effort**: 6-9 hours for complete implementation

## Open Questions

1. **Search persistence**: Should search terms persist in URL query parameters? (Nice to have, not critical)
2. **Retry logic**: Should hooks be modified to support retry, or should retry re-mount components? (Recommend hook support)
3. **Empty library state**: Should empty library state also include search input? (Yes, for consistency)
4. **Tag click**: Should clicking a tag filter by that tag? (Out of scope for this sprint)
5. **Loading duration**: What's the expected max loading time before we consider it an error? (Recommend 30s timeout)

## Appendix: Current Component Structure

### LibraryView.tsx
- Uses `useLibrary()` hook
- Renders loading state (6 skeleton cards)
- Renders error state (red box)
- Renders empty state (no prompts)
- Renders prompt grid (PromptCard with variant="library")

### GalleryView.tsx
- Uses `useGallery()` hook
- Same structure as LibraryView
- Different header icon (Sparkles vs BookOpen)
- Different empty state message
- PromptCard with variant="gallery"

### PromptCard.tsx
- Accepts prompt data and variant prop
- Implements Framer Motion animations
- Quick copy, run in chat, fork actions
- Tag display with stagger animation
- Height: h-full (flexible)

### useLibrary.ts
- Fetches prompts from `/api/drive/files?folder=prompts`
- Returns: prompts[], loading, error
- No retry mechanism currently

### useGallery.ts
- Filters prompts from useLibrary where public === true
- Returns: prompts[], loading, error
- No retry mechanism currently
