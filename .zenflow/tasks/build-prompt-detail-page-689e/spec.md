# Technical Specification: Prompt Detail Page

**Task ID:** build-prompt-detail-page-689e  
**Complexity:** Medium  
**Version:** 1.0  
**Date:** January 14, 2026

---

## 1. Technical Context

### 1.1. Technology Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with Dojo Genesis design system
- **UI Components:** Framer Motion for animations
- **Database:** PGLite (local PostgreSQL via @electric-sql/pglite)
- **Testing:** tsx test runner
- **Build:** Next.js build system (`npm run build`)

### 1.2. Dependencies
- **Existing Data Functions:** `getPromptById()` in `lib/pglite/prompts.ts`
- **UI Components:** `Card`, `Tag`, `Button` from `components/ui/`
- **Icons:** lucide-react
- **Type Definitions:** `PromptRow`, `PromptWithCritique`, `StatusHistoryEntry` from `lib/pglite/types.ts`

---

## 2. Implementation Approach

### 2.1. Architecture Pattern
This implementation follows the established Librarian architecture pattern:
- **Page Component:** Simple wrapper in `app/librarian/[id]/page.tsx`
- **View Component:** Main logic in `components/librarian/PromptDetailView.tsx`
- **Data Fetching:** Client-side using existing `getPromptById()` function
- **Design System:** Strict adherence to Dojo Genesis brand guide

### 2.2. User Flow
1. User clicks on a prompt card from any Librarian page
2. Navigation to `/librarian/[id]` where `id` is the prompt ID
3. Page loads with skeleton/loading state
4. Display prompt content, metadata, critique score, and status history
5. User can navigate back to the previous page

### 2.3. Data Model
The page will consume the `PromptWithCritique` type which includes:

```typescript
interface PromptWithCritique extends PromptRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  status: PromptStatus; // 'draft' | 'active' | 'saved' | 'archived'
  status_history: StatusHistoryEntry[]; // History of status transitions
  created_at: string;
  updated_at: string;
  visibility: PromptVisibility; // 'private' | 'unlisted' | 'public'
  author_name: string | null;
  latestCritique?: {
    score: number;
    conciseness_score: number;
    specificity_score: number;
    context_score: number;
    task_decomposition_score: number;
  } | null;
  metadata?: {
    description: string | null;
    tags: string[] | null;
    is_public: boolean;
    author: string | null;
    version: string | null;
  } | null;
}

interface StatusHistoryEntry {
  from: PromptStatus;
  to: PromptStatus;
  timestamp: string;
  user_id: string;
}
```

---

## 3. Source Code Structure

### 3.1. Files to Create

#### File 1: `app/librarian/[id]/page.tsx`
**Purpose:** Next.js dynamic route page  
**Responsibility:** Minimal wrapper that renders `PromptDetailView`  
**Pattern:** Follows existing page structure (see `app/librarian/page.tsx`)

#### File 2: `components/librarian/PromptDetailView.tsx`
**Purpose:** Main view component for displaying prompt details  
**Responsibility:**
- Fetch prompt data using `getPromptById()`
- Display loading, error, and success states
- Render prompt content, metadata, and history
- Handle navigation back to the list

### 3.2. Component Structure for `PromptDetailView.tsx`

```
PromptDetailView
├── Loading State (skeleton)
├── Error State (404 or error message)
└── Success State
    ├── Header Section
    │   ├── Back button
    │   ├── Title
    │   ├── Status badge
    │   └── Public/Private badge
    ├── Metadata Section (Card)
    │   ├── Author
    │   ├── Created/Updated dates
    │   ├── Tags
    │   └── Critique score (if available)
    ├── Content Section (Card)
    │   └── Full prompt content (formatted)
    └── History Section (Card)
        └── Status transition timeline
```

---

## 4. Data Model / API / Interface Changes

### 4.1. No Database Changes Required
The existing database schema already supports all required data:
- `prompts` table has all necessary fields
- `status_history` is already stored as JSONB array
- `getPromptById()` function already exists and returns the correct data

### 4.2. New Hook (Optional Enhancement)
While not strictly required, a custom hook could be created for reusability:

```typescript
// hooks/usePromptDetail.ts
interface UsePromptDetailReturn {
  prompt: PromptWithCritique | null;
  loading: boolean;
  error: string | null;
}

export function usePromptDetail(promptId: string): UsePromptDetailReturn
```

**Decision:** Implement inline in the component first. Extract to hook if reused.

---

## 5. Design System Compliance

### 5.1. Color Palette
- **Background:** `bg-bg-primary` (#0a1e2e)
- **Cards:** `bg-bg-secondary` (#0f2838) with `border-bg-tertiary`
- **Text Primary:** `text-text-primary` (#ffffff)
- **Text Secondary:** `text-text-secondary` (#c5d1dd)
- **Accent (links, highlights):** `text-librarian` (#ffd699)
- **Status badges:** Use appropriate semantic colors

### 5.2. Typography
- **Page Title:** `text-3xl font-bold text-text-primary`
- **Section Headings:** `text-xl font-semibold text-text-primary`
- **Body Text:** `text-base text-text-secondary`
- **Metadata Labels:** `text-sm text-text-tertiary`
- **Prompt Content:** `font-mono text-sm` (code font for prompts)

### 5.3. Components to Use
- `<Card>` for all sections (metadata, content, history)
- `<Card glow={true}>` for interactive elements
- `<Tag>` for displaying tags
- `<Button>` for back navigation
- `<PageHeader>` if available (check `components/shared/`)

### 5.4. Spacing
- **Container:** `max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8`
- **Section gaps:** `space-y-6`
- **Card padding:** `p-6` (default in Card component)

### 5.5. Animations
- **Page entrance:** `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`
- **Transition duration:** `duration: 0.2` (200ms - "fast" in design system)
- **Easing:** `ease-in-out`

---

## 6. Accessibility Requirements

### 6.1. Semantic HTML
- Use `<main>` for main content area
- Use `<section>` for distinct content sections
- Use `<article>` for the prompt content itself
- Use `<time>` for displaying dates with `dateTime` attribute

### 6.2. ARIA Labels
- Main region: `aria-label="Prompt Detail"`
- Back button: `aria-label="Back to Librarian"`
- Status history: `aria-label="Status change history"`

### 6.3. Keyboard Navigation
- Back button must be keyboard accessible
- Focus states must be visible on all interactive elements

---

## 7. Verification Approach

### 7.1. Manual Testing
1. **Navigation Test:** Click on a prompt card from any Librarian view, verify navigation to detail page
2. **Data Display Test:** Verify all prompt data is correctly displayed (title, content, metadata, history)
3. **Error Handling Test:** Test with invalid ID, verify 404/error handling
4. **Responsive Test:** Verify layout works on mobile, tablet, and desktop
5. **Accessibility Test:** Tab through all interactive elements, verify focus states

### 7.2. Build Verification
```bash
npm run build
```
- Verify no TypeScript errors
- Verify no build warnings related to new files

### 7.3. Type Check
```bash
npm run type-check
```
- Verify all types are correctly defined
- Verify no type errors in new components

### 7.4. Lint Check
```bash
npm run lint
```
- Verify code follows ESLint rules
- Fix any linting issues

### 7.5. Console Errors
- Load page in browser
- Open DevTools console
- Verify no errors or warnings

---

## 8. Edge Cases & Error Handling

### 8.1. Edge Cases
1. **Prompt Not Found:** Display friendly 404 message with link back to Librarian
2. **Missing Metadata:** Gracefully handle null/undefined metadata fields
3. **Empty Status History:** Handle prompts with no status transitions
4. **Long Content:** Ensure long prompt content is properly scrollable
5. **Empty Tags:** Don't show tags section if no tags exist
6. **No Critique:** Handle prompts that haven't been critiqued

### 8.2. Loading States
- Show skeleton loaders while fetching data
- Prevent layout shift during loading

### 8.3. Error Boundaries
- Consider wrapping in existing `LibrarianErrorBoundary` component
- Display user-friendly error messages

---

## 9. Implementation Plan

### Phase 1: Basic Structure
1. Create `app/librarian/[id]/page.tsx` with basic route setup
2. Create `components/librarian/PromptDetailView.tsx` skeleton
3. Implement data fetching with `getPromptById()`
4. Add loading and error states

### Phase 2: Content Display
1. Implement header section (title, back button, badges)
2. Implement metadata section (author, dates, tags, critique)
3. Implement content section (formatted prompt content)

### Phase 3: History Display
1. Implement status history timeline
2. Format timestamps
3. Add visual indicators for transitions

### Phase 4: Polish & Verification
1. Apply design system styling
2. Add animations
3. Implement accessibility features
4. Run all verification steps
5. Manual testing

---

## 10. Success Criteria

- ✅ Route `/librarian/[id]` successfully created and accessible
- ✅ Prompt data (title, content, metadata) displayed correctly
- ✅ Status history displayed in chronological order
- ✅ Design matches Dojo Genesis brand guide
- ✅ No console errors when loading the page
- ✅ `npm run build` succeeds without errors
- ✅ `npm run type-check` passes
- ✅ `npm run lint` passes (or issues are acceptable)
- ✅ Page is responsive on all screen sizes
- ✅ Accessibility requirements met (ARIA labels, keyboard navigation)
- ✅ Error handling works for invalid IDs
- ✅ Loading states are smooth and non-jarring

---

## 11. Additional Notes

### 11.1. Future Enhancements (Out of Scope)
- Edit functionality from detail page
- Delete/Archive actions from detail page
- Share/Copy buttons
- Version comparison view
- Comments/annotations

### 11.2. Integration Points
- Update existing prompt cards to link to detail page
- Consider adding "View Details" action to card menus

### 11.3. Performance Considerations
- Data fetching is client-side (acceptable for MVP)
- Consider server-side rendering in future iterations
- Status history array is expected to be small (< 20 entries)

---

**End of Technical Specification**
