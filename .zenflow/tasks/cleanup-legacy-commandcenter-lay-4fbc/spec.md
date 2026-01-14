# Technical Specification: Cleanup Legacy CommandCenter Layout

## Complexity Assessment: **Medium**

**Rationale:** This task involves deleting multiple interconnected components and updating the application entry point. While the changes are straightforward, they require careful verification to ensure no references remain and that the application functions correctly with the modern layout system.

---

## Technical Context

### Technology Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI Libraries:** React 18, react-resizable-panels (to be removed)
- **Styling:** Tailwind CSS

### Current Architecture
The application currently has **two competing layout systems**:

1. **Legacy System (to be removed):**
   - `CommandCenter.tsx` - Root component using `react-resizable-panels`
   - `Header.tsx` - Legacy header component
   - `Sidebar.tsx` - Legacy sidebar with resizable panels
   - `MainContent.tsx` - Legacy main content wrapper
   - Currently rendered from `app/page.tsx`

2. **Modern System (keeping):**
   - `NavigationSidebar.tsx` - Fixed sidebar in root layout
   - Defined in `app/layout.tsx` (lines 67-70)
   - Properly integrated with Next.js App Router

### Dependencies to Remove
After cleanup, `react-resizable-panels` will only be used by `AgentActivityPanel.tsx`, which is a valid use case.

---

## Implementation Approach

### Phase 1: File Deletions
Delete the following legacy layout components:

1. `/components/layout/CommandCenter.tsx`
2. `/components/layout/Header.tsx`
3. `/components/layout/Sidebar.tsx`
4. `/components/layout/MainContent.tsx`
5. `/app/librarian/layout.tsx`

**Impact Analysis:**
- `CommandCenter` is imported only in `app/page.tsx` (verified by grep)
- `Header` is imported only in `app/librarian/layout.tsx` (verified by grep)
- `Sidebar` and `MainContent` are only imported by `CommandCenter`
- No other files reference these components

### Phase 2: Update Root Page
Replace `app/page.tsx` content with a simple placeholder:

```tsx
export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome to 11-11</h1>
      <p className="text-muted-foreground">Select a page from the sidebar to get started.</p>
    </div>
  );
}
```

**Rationale:** The root layout (`app/layout.tsx`) already provides the `NavigationSidebar` and main content area structure. The home page just needs to render content within this layout.

---

## Source Code Structure Changes

### Files to Delete (5 files)
```
components/layout/
├── CommandCenter.tsx      [DELETE]
├── Header.tsx            [DELETE]
├── Sidebar.tsx           [DELETE]
└── MainContent.tsx       [DELETE]

app/librarian/
└── layout.tsx            [DELETE]
```

### Files to Modify (1 file)
```
app/
└── page.tsx              [MODIFY - replace with new content]
```

### Files Unchanged (but relevant)
```
app/
└── layout.tsx            [Root layout with NavigationSidebar - no changes needed]

components/layout/
└── NavigationSidebar.tsx [Modern sidebar - no changes needed]
```

---

## Data Model / API / Interface Changes

**No data model, API, or interface changes required.**

This is purely a UI refactoring task that removes legacy components and standardizes on the existing modern layout system.

---

## Verification Approach

### 1. Type Check
```bash
npm run type-check
```
**Expected:** No TypeScript errors. The deletion of files and import updates should not introduce type issues.

### 2. Build Verification
```bash
npm run build
```
**Expected:** Successful production build with no errors.

### 3. Lint Check
```bash
npm run lint
```
**Expected:** No new linting errors.

### 4. Manual Verification
After implementation, verify:
- [ ] Root page (`/`) displays the welcome message
- [ ] `NavigationSidebar` is visible on the left
- [ ] Librarian pages (`/librarian`, `/librarian/greenhouse`, etc.) load correctly
- [ ] No console errors in browser
- [ ] No missing component errors

### 5. Runtime Testing
Navigate to the following pages to ensure they work:
- `/` - Should show welcome message with sidebar
- `/librarian` - Should display Librarian view with sidebar
- `/librarian/greenhouse` - Should display Greenhouse view with sidebar
- Any other routes should continue to work normally

---

## Risk Assessment

### Low Risk
- All deleted components are only used internally by each other
- Only two import statements need to be removed (`app/page.tsx` and `app/librarian/layout.tsx`)
- The modern layout system is already fully functional in `app/layout.tsx`

### Potential Issues
- None anticipated. Grep analysis confirms no other references exist.

---

## Success Criteria

1. All 5 legacy files are deleted
2. `app/page.tsx` renders the new placeholder content
3. Application builds successfully with no errors
4. Type check passes with no errors
5. All existing functionality works as before
6. No console errors in development or production mode
