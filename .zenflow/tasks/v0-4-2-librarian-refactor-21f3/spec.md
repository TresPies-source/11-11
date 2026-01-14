# Technical Specification: v0.4.2 Librarian Refactor

**Date:** January 14, 2026
**Version:** 1.0
**Complexity:** **HARD**

---

## 1. Executive Summary

This is a comprehensive **visual refactoring task** to align the entire Librarian feature with the Dojo Genesis design system. The existing implementation is **highly advanced** with 27 components and sophisticated features including semantic search, AI suggestions, prompt critiques, and status lifecycle management.

**Critical Constraint:** This is a **refactor, not a rebuild**. All existing functionality must be preserved with zero regressions.

### 1.1 Difficulty Assessment: HARD

This task is rated as **HARD** due to:

1. **Scale**: 27 components require refactoring
2. **Complexity**: Advanced features with intricate state management and async operations
3. **Risk**: High potential for functional regressions during visual updates
4. **Precision**: Must preserve exact behavior while changing presentation layer
5. **Integration**: Deep integration with hooks, API routes, and database operations
6. **Testing**: Limited automated tests require manual verification
7. **Accessibility**: Must add comprehensive ARIA attributes throughout

---

## 2. Technical Context

### 2.1 Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.7
- **UI Library**: React 18.3 with Framer Motion 11.15
- **Styling**: Tailwind CSS 3.4
- **Icons**: Lucide React 0.469
- **Database**: PGLite (PostgreSQL in-browser)
- **AI Services**: OpenAI API (embeddings, critiques)
- **State Management**: Zustand + Custom React hooks
- **Auth**: NextAuth v5

### 2.2 Design System (Dojo Genesis)

**Color Palette** (from `tailwind.config.ts`):
```typescript
bg: {
  primary: '#0a1e2e',    // Deep navy background
  secondary: '#0f2838',  // Card/panel background
  tertiary: '#1a3a4f',   // Elevated elements
  elevated: '#2a4d63',   // Hover states
}
text: {
  primary: '#ffffff',    // Headings
  secondary: '#c5d1dd',  // Body text
  tertiary: '#8a9dad',   // Muted text
  muted: '#6b7f91',      // Disabled text
  accent: '#f5a623',     // Accent/CTA color
}
// Agent colors
supervisor: '#f5a623',   // Amber/gold
dojo: '#f39c5a',        // Coral orange
librarian: '#ffd699',   // Light amber
debugger: '#6b7f91',    // Slate gray

// Status colors
success: '#4ade80',
warning: '#f39c5a',
error: '#ef4444',
info: '#3d6380',
```

**Typography**:
- Primary font: `var(--font-sans)` (Inter)
- Monospace: `var(--font-mono)`

**Spacing Scale**: 4px base (1, 2, 3, 4, 5, 6, 8, 10, 12, 16)

**Animation Timings**:
- `instant`: 100ms
- `fast`: 200ms
- `normal`: 300ms
- `slow`: 500ms
- `patient`: 1000ms

**Base Components** (Wave 1):
- `<Card>` and `<Card glow={true}>` - Standardized card container
- `<Button variant="primary|secondary" size="sm|md|lg">` - Standardized button
- `<StatusDot status="idle|working|error|success|default">` - Status indicator

---

## 3. Current Implementation Inventory

### 3.1 Component Structure

**27 Components** in `/components/librarian/`:

| Type | Component | Lines | Features |
|------|-----------|-------|----------|
| **Pages** | LibrarianView | 379 | Main landing, search, suggestions, nav |
| | GreenhouseView | ~300 | Personal library of saved prompts |
| | CommonsView | ~250 | Public community prompts |
| **Cards** | SeedlingCard | 288 | Active prompts with critiques, transitions |
| | GreenhouseCard | ~400 | Saved prompts with edit/publish/archive |
| | SearchResultCard | 200 | Search results with similarity scores |
| | CommonsPromptCard | ~200 | Public prompts with copy-to-library |
| | ArchiveCard | ~250 | Archived prompts with restore |
| **Features** | SearchBar | ~150 | Semantic search input |
| | SearchResults | ~100 | Grid display of results |
| | SuggestionsPanel | ~200 | AI-powered suggestions |
| | RecentSearches | ~100 | Search history |
| | CritiqueDetails | ~150 | Detailed critique breakdown |
| | CritiqueScore | ~100 | Visual score display |
| **UI Elements** | StatusFilter | ~80 | Filter by status |
| | BulkActionBar | ~150 | Multi-select operations |
| | PublicToggle | ~120 | Toggle prompt visibility |
| | PublicBadge | ~50 | Public indicator |
| | ConfirmationDialog | ~100 | Reusable modal |
| **Infrastructure** | LibrarianErrorBoundary | ~80 | Error handling |
| | LibrarianSkeleton | ~100 | Loading states |
| | CardErrorBoundary | ~60 | Card-level errors |

### 3.2 Advanced Features (MUST PRESERVE)

1. **Semantic Search** (`useSemanticSearch` hook)
   - Vector embeddings via OpenAI
   - Supabase pgvector integration
   - Similarity scores (0-100%)
   - Search duration tracking
   - Real-time as-you-type search

2. **Proactive Suggestions** (`useSuggestions` hook)
   - AI-powered recommendations
   - Trigger: page load
   - Dismissible suggestions
   - Refresh functionality
   - 6 suggestions at a time

3. **Prompt Critiques** (`useCritique` hook)
   - AI analysis of prompt quality
   - 4 dimensions: Conciseness, Specificity, Context, Task Decomposition
   - Overall score (0-100)
   - Color-coded feedback
   - Expandable details

4. **Status Lifecycle** (`usePromptStatus` hook)
   - States: draft → active → saved → archived
   - Optimistic UI updates
   - Google Drive sync
   - Toast notifications
   - Valid transition enforcement

5. **Public/Private Sharing** (`usePublicToggle` hook)
   - Toggle prompt visibility
   - Publish confirmation
   - Copy public prompts to library
   - Fork count tracking

6. **Optimistic Updates**
   - Immediate UI feedback
   - Rollback on failure
   - Background sync

7. **Error Boundaries**
   - Component-level error handling
   - Graceful degradation
   - Retry mechanisms

### 3.3 Data Flow

**Hooks** (must remain unchanged):
```
useLibrarian({ status }) → Fetch prompts by status
useSemanticSearch() → Vector search
useSuggestions() → AI suggestions
usePromptStatus() → Status transitions
useCritique() → Prompt analysis
useToast() → Notifications
```

**API Routes** (external dependencies):
```
/api/librarian/search → Semantic search
/api/librarian/suggestions → AI suggestions
/api/librarian/critique → Prompt analysis
/api/agents/librarian → Agent handler
```

---

## 4. Implementation Approach

### 4.1 Refactoring Strategy

**Phase 1: Foundation**
1. Create new `Tag.tsx` component
2. Update design system tokens in all components
3. Replace color classes globally

**Phase 2: Base Components**
4. Replace all custom cards with `<Card>` component
5. Replace all buttons with `<Button>` component
6. Replace status indicators with `<StatusDot>` component

**Phase 3: Component-Specific Refactoring**
7. Refactor each component per spec (Section 5)
8. Verify functionality after each component
9. Add ARIA labels progressively

**Phase 4: Polish & Testing**
10. Break down large components into sub-components
11. Standardize animations
12. Update user-facing text ("Seedlings" → "Active Prompts")
13. Comprehensive manual testing
14. Run lint and type-check

### 4.2 Safe Refactoring Principles

1. **Preserve Logic**: Never modify hooks, state management, or event handlers
2. **Change Presentation Only**: Update JSX structure, classes, and visual elements
3. **Test Incrementally**: Verify each component works after refactoring
4. **Use Git**: Commit after each successful component refactor
5. **Maintain Props**: Keep all component interfaces unchanged
6. **Preserve Accessibility**: Add ARIA labels, don't remove existing ones

---

## 5. Source Code Changes

### 5.1 New Files

#### Create: `/components/ui/Tag.tsx`
**Purpose**: Reusable tag component for displaying metadata

**Interface**:
```typescript
interface TagProps {
  label: string;
  className?: string;
}
```

**Styling**:
- `bg-bg-tertiary`
- `rounded-full`
- `px-3 py-1`
- `text-xs`
- `text-text-secondary`

### 5.2 Files to Modify (27 components)

#### **Priority 1: Core Components**

**1. `LibrarianView.tsx` (379 lines)**
- **Keep**: All hooks, state, event handlers
- **Refactor**:
  - Replace header with simple `<h1>` for "The Librarian's Home"
  - Remove large navigation cards (handled by sidebar now)
  - Wrap Semantic Search section in `<Card>`
  - Update icons to design system colors (`text-librarian`)
  - Add `aria-label` to main sections
- **Colors to Replace**:
  - Remove gradient classes
  - Apply `bg-bg-primary`, `bg-bg-secondary`, `text-text-primary`

**2. `SearchBar.tsx` (~150 lines)**
- **Keep**: All props and logic
- **Refactor**:
  - Restyle input: `bg-bg-secondary`, `border-border-tertiary`
  - Search icon: `text-librarian`
  - Update loading spinner animation
  - Add `aria-label` to input

**3. `SearchResults.tsx` (~100 lines)**
- **Keep**: Loading/error states, list rendering
- **Refactor**:
  - Change layout to responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - Update spacing with design system scale

**4. `SearchResultCard.tsx` (200 lines)**
- **Keep**: Click handlers, routing logic
- **Refactor**:
  - Replace root `div` with `<Card glow={true}>`
  - Similarity score badge: `bg-supervisor text-white`
  - Use new `<Tag>` component for tags
  - Replace action buttons with `<Button size="sm">`
  - Remove custom gradient colors (lines 30-33)
  - Update animation timings to design system

**5. `SeedlingCard.tsx` (288 lines)**
- **Keep**: All state, transitions, event handlers
- **Refactor**:
  - UI text: "Seedling" → "Active Prompt"
  - Replace root `div` with `<Card>`
  - Critique score: simple badge with `bg-supervisor`
  - Replace buttons with `<Button size="sm">`
  - Update icons to `text-librarian`
  - Add `aria-label` to all buttons

**6. `SeedlingSection.tsx**
- **Keep**: Data fetching, filtering logic
- **Refactor**:
  - Section heading: "Active Prompts"
  - Update grid layout classes
  - Apply design system spacing

**7. `GreenhouseCard.tsx` (~400 lines)**
- **Keep**: All state, transitions, event handlers
- **Refactor**:
  - UI text: "Greenhouse" → "Saved Prompts"
  - Replace root `div` with `<Card>`
  - Replace all buttons with `<Button>`
  - Update icons to design system colors
  - Add `aria-label` to all actions

**8. `GreenhouseSection.tsx**
- **Keep**: Data fetching, filtering logic
- **Refactor**:
  - Section heading: "Saved Prompts"
  - Update grid layout classes
  - Apply design system spacing

**9. `SuggestionsPanel.tsx` (~200 lines)**
- **Keep**: Suggestion fetching and dismissing logic
- **Refactor**:
  - Wrap panel in `<Card>`
  - Restyle suggestion items with design system typography
  - Update spacing to be more compact
  - Replace dismiss button with `<Button size="sm" variant="secondary">`

#### **Priority 2: Supporting Components**

**10-15. Remaining Card Components**
- `CommonsPromptCard.tsx`
- `ArchiveCard.tsx`
- Apply same refactoring pattern as above

**16-20. Feature Components**
- `RecentSearches.tsx`
- `CritiqueDetails.tsx`
- `CritiqueScore.tsx`
- `BulkActionBar.tsx`
- `StatusFilter.tsx`
- Replace custom styling with design system
- Use base components where applicable

**21-27. UI & Infrastructure Components**
- `PublicToggle.tsx`
- `PublicBadge.tsx`
- `ConfirmationDialog.tsx`
- `LibrarianErrorBoundary.tsx`
- `LibrarianSkeleton.tsx`
- `CardErrorBoundary.tsx`
- `StatusTransitionButton.tsx`
- Update colors and spacing
- Preserve all functionality

### 5.3 Global Find & Replace Patterns

**Color Classes to Replace**:
```
Old Pattern → New Pattern
------------------------
from-green-50, to-green-100 → bg-bg-secondary
from-pink-50, to-purple-100 → bg-bg-tertiary
text-pink-600 → text-supervisor
text-purple-600 → text-librarian
text-green-600 → text-success
bg-gradient-to-br → bg-bg-secondary (remove gradients)
border-purple-200 → border-bg-tertiary
hover:border-purple-300 → hover:border-supervisor
```

**Text Content Updates**:
```
"Seedlings" → "Active Prompts"
"Seedling" → "Active Prompt"
"Greenhouse" → "Saved Prompts"
"My Greenhouse" → "My Saved Prompts"
```

**Animation Updates**:
```
duration: 0.3 → transition={{ duration: 0.2 }}
whileHover={{ scale: 1.02 }} → whileHover={{ scale: 1.05 }}
```

---

## 6. Data Model / API / Interface Changes

**NO CHANGES REQUIRED**

All existing interfaces, types, hooks, and API routes remain unchanged. This is purely a presentation layer refactor.

---

## 7. Bug Fixes & Improvements

### 7.1 Component Splitting

**Large Components to Break Down**:

1. **LibrarianView.tsx (379 lines)**
   - Extract header into `LibrarianHeader.tsx`
   - Extract navigation into `LibrarianNav.tsx` (if kept)
   - Extract search section into `SemanticSearchSection.tsx`

2. **SeedlingCard.tsx (288 lines)**
   - Extract critique display into `CritiqueDisplay.tsx`
   - Extract action buttons into `PromptActions.tsx`

3. **GreenhouseCard.tsx (~400 lines)**
   - Extract metadata section into `PromptMetadata.tsx`
   - Extract action buttons into `PromptActions.tsx`

### 7.2 Accessibility Improvements

**Add ARIA Labels to**:
- All buttons (specific action description)
- All sections (`<main>`, `<section>`)
- All interactive cards (role="article" or role="button")
- All form inputs
- All status indicators

**Example**:
```tsx
<button aria-label="Save prompt to Saved Prompts">
  Save
</button>

<section aria-label="Active Prompts">
  {/* content */}
</section>
```

### 7.3 Naming Standardization

**Code** (minimal changes to avoid breaking):
- Keep internal names (SeedlingCard, GreenhouseSection, etc.)
- Update only user-facing strings

**UI Text** (all instances):
- "Seedlings" → "Active Prompts"
- "Greenhouse" → "Saved Prompts"
- "Commons" → "Global Commons" (keep)

---

## 8. Verification Approach

### 8.1 Automated Checks

**Commands to Run**:
```bash
npm run lint           # ESLint
npm run type-check     # TypeScript compiler
npm run build          # Production build
```

**Note**: Limited unit tests exist. Manual verification is primary approach.

### 8.2 Manual Testing Checklist

#### Core Features
- [ ] Semantic search returns results
- [ ] Search shows similarity scores
- [ ] Suggestions panel loads and displays
- [ ] Dismiss suggestion works
- [ ] Refresh suggestions works

#### Status Lifecycle
- [ ] Active prompts display correctly
- [ ] "Save to Saved Prompts" button works
- [ ] Saved prompts display correctly
- [ ] Archive prompt works
- [ ] Restore archived prompt works
- [ ] Status transitions trigger Drive sync

#### Critique System
- [ ] Critique scores display
- [ ] Expand/collapse critique details works
- [ ] Score colors match thresholds

#### Public/Private Sharing
- [ ] Toggle prompt visibility works
- [ ] Publish confirmation shows
- [ ] Copy to library works for public prompts
- [ ] Public badge displays

#### UI/UX
- [ ] All cards use `<Card>` component
- [ ] All buttons use `<Button>` component
- [ ] All colors match design system
- [ ] Animations are smooth (200ms)
- [ ] Responsive grid works on mobile/tablet/desktop
- [ ] Loading states show skeletons
- [ ] Error states show error boundaries

#### Accessibility
- [ ] All buttons have aria-labels
- [ ] All sections have aria-labels
- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] Screen reader announces content correctly

### 8.3 Visual QA

**Compare with**:
- Dojo Genesis design system documentation
- Wave 1 components (as reference)
- Existing app pages (Seeds, Dashboard) for consistency

**Check**:
- Color palette matches exactly
- Typography scales consistently
- Spacing follows 4px grid
- Card styles are uniform
- Button styles are uniform

---

## 9. Risk Assessment

### 9.1 High Risk Areas

1. **Status Transitions** (SeedlingCard, GreenhouseCard)
   - Complex state management
   - Google Drive sync integration
   - **Mitigation**: Don't touch event handlers or state logic

2. **Semantic Search** (SearchBar, SearchResults, SearchResultCard)
   - API integration with OpenAI
   - Vector embeddings
   - **Mitigation**: Only change JSX and classes, preserve all hooks

3. **Suggestions System** (SuggestionsPanel)
   - AI service integration
   - Dismissal state management
   - **Mitigation**: Test dismiss and refresh after refactor

4. **Optimistic Updates** (All card components)
   - Complex rollback logic
   - **Mitigation**: Test all CRUD operations thoroughly

### 9.2 Breaking Change Prevention

**DO NOT MODIFY**:
- Hook implementations (`useLibrarian`, `useSemanticSearch`, etc.)
- API routes
- Database queries
- Event handler logic
- State management logic
- Component prop interfaces
- Type definitions

**ONLY MODIFY**:
- JSX structure
- Tailwind classes
- Component imports (to use new base components)
- User-facing text strings
- Animation parameters

---

## 10. Acceptance Criteria

**Functional Requirements** (Zero Regressions):
- [ ] All 27 components render without errors
- [ ] Semantic search works end-to-end
- [ ] Suggestions load and can be dismissed
- [ ] Critiques display with correct scores
- [ ] Status transitions work (draft → active → saved → archived)
- [ ] Public/private toggle works
- [ ] Copy to library works
- [ ] Archive and restore work
- [ ] All optimistic updates work
- [ ] Error boundaries catch and display errors
- [ ] Loading states show correctly

**Visual Requirements** (Design System Compliance):
- [ ] All components use Dojo Genesis color palette
- [ ] All custom cards replaced with `<Card>` component
- [ ] All custom buttons replaced with `<Button>` component
- [ ] All status indicators use `<StatusDot>` component
- [ ] New `<Tag>` component created and used
- [ ] Typography uses design system fonts and sizes
- [ ] Spacing uses design system scale
- [ ] Animations use design system timings (200ms)
- [ ] No hardcoded colors or gradients remain

**Code Quality Requirements**:
- [ ] Large components split into smaller sub-components
- [ ] All interactive elements have ARIA labels
- [ ] User-facing text uses new naming ("Active Prompts", "Saved Prompts")
- [ ] Code passes `npm run lint`
- [ ] Code passes `npm run type-check`
- [ ] Code builds successfully (`npm run build`)

**Documentation Requirements**:
- [ ] Report written to `{@artifacts_path}/report.md`
- [ ] Report documents what was implemented
- [ ] Report documents how solution was tested
- [ ] Report documents challenges encountered

---

## 11. Estimated Effort

**Total Estimated Time**: 8-12 hours

**Breakdown**:
- Phase 1 (Foundation): 1-2 hours
- Phase 2 (Base Components): 2-3 hours
- Phase 3 (Component Refactoring): 4-6 hours
- Phase 4 (Polish & Testing): 1-2 hours

**Critical Path**:
1. Create Tag.tsx
2. Refactor SearchResultCard (template for others)
3. Refactor SeedlingCard (most complex)
4. Refactor GreenhouseCard (most complex)
5. Refactor remaining 23 components
6. Test all features manually
7. Run lint and type-check
8. Fix any issues
9. Final verification

---

## 12. Success Metrics

**Technical Metrics**:
- 0 TypeScript errors
- 0 ESLint errors
- 0 console errors on page load
- 0 functional regressions
- 27 components refactored

**Design System Metrics**:
- 100% color palette compliance
- 100% base component usage
- 100% typography compliance
- 100% spacing scale compliance
- 100% animation timing compliance

**Accessibility Metrics**:
- 100% interactive elements have ARIA labels
- 100% sections have proper landmarks
- Keyboard navigation works for all features

---

## 13. Conclusion

This is a **high-impact, high-risk refactoring task** that requires meticulous attention to detail. The key to success is:

1. **Preserve all functionality** - Don't modify logic
2. **Change presentation only** - Update JSX and classes
3. **Test incrementally** - Verify after each component
4. **Use design system strictly** - No custom colors or styles
5. **Improve accessibility** - Add ARIA labels throughout

The result will be a visually stunning, brand-consistent Librarian feature that maintains all its advanced functionality while being more maintainable and accessible.
