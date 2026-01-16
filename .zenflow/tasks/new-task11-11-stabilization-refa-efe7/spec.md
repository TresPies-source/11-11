# Technical Specification: 11-11 Stabilization & Refactoring

**Version:** 1.0  
**Date:** January 16, 2026  
**Status:** Final

---

## 1. Technical Context

### 1.1 Technology Stack

**Framework & Runtime:**
- Next.js 14 (App Router architecture)
- React 18.3.1
- TypeScript 5.7.2 (strict mode)
- Node.js (Windows environment)

**UI & Styling:**
- TailwindCSS 3.4.17
- Framer Motion 11.15.0 (animations)
- Lucide React 0.469.0 (icons)
- Custom design system (components/ui/)

**Data Layer:**
- PGlite 0.3.14 (client-side PostgreSQL)
- Direct database access pattern (no API routes for data fetching)
- Custom hooks for data management (useSeeds, useFeed, etc.)

**Build & Development:**
- npm scripts for dev, build, lint, type-check
- ESLint with Next.js config
- tsx for test execution

### 1.2 Existing Architecture Patterns

**Component Organization:**
```
components/
├── ui/              # Base UI components (Card, Button, Tag)
├── layout/          # Layout components (NavigationSidebar)
├── seeds/           # Seed-specific components
├── librarian/       # Librarian-specific components
└── hub/             # Hub components (TrailOfThoughtPanel, etc.)
```

**Data Access Pattern:**
- Custom hooks (e.g., `useSeeds`) that call PGlite directly
- No API routes for basic CRUD operations
- Queries defined in `lib/` directory (e.g., `lib/hub/feed-queries.ts`)

**Styling Pattern:**
- TailwindCSS utility classes
- `cn()` utility from `lib/utils` for conditional classes
- Theme tokens: `text-dojo`, `text-librarian`, `text-success`, etc.
- Consistent spacing: `gap-2`, `p-4`, `mb-3`, etc.

**Animation Pattern:**
- Framer Motion `motion.div` for animated components
- `layoutId` for shared element transitions
- Common variants: `whileHover`, `initial`, `animate`, `exit`
- Smooth transitions with easing functions

---

## 2. Implementation Approach

### 2.1 Core Strategy

This refactoring follows a **component consolidation** strategy:

1. **Extract Common Patterns**: Identify shared functionality across `SeedCard`, `GreenhouseCard`, and `CommonsPromptCard`
2. **Create Universal Components**: Build `ArtifactCard` and `ArtifactGridView` to replace all three card types
3. **Preserve Behavior**: Maintain exact functionality while unifying implementation
4. **Refactor Pages**: Replace page-specific views with universal grid view
5. **Clean Navigation**: Simplify navigation to two-pillar model (Chat & Hub)

### 2.2 Existing Code Reuse

**Base Components to Reuse:**
- `components/ui/Card.tsx` - Base card component with glow effect
- `components/ui/Tag.tsx` - Tag display component
- `components/ui/Button.tsx` - Button component
- `components/hub/TrailOfThoughtPanel.tsx` - Lineage visualization

**Utility Functions to Reuse:**
- `lib/utils.ts::cn()` - Class name merging
- `lib/hub/feed-queries.ts::getFeedArtifacts()` - Data fetching (to be enhanced)
- `lib/hub/feed-queries.ts::getArtifactConnectionCount()` - Connection counting

**Existing Hooks to Reuse:**
- Pattern from `hooks/useSeeds.ts` for data management
- Pattern from existing pages for state management

**Subcomponents to Reuse:**
- `components/librarian/CritiqueScore.tsx` - Score display
- `components/librarian/PublicToggle.tsx` - Visibility toggle
- `components/librarian/PublicBadge.tsx` - Public indicator
- `components/librarian/CopyToLibraryButton.tsx` - Copy functionality
- `components/librarian/GreenhouseCardActions.tsx` - Greenhouse actions

---

## 3. Source Code Structure Changes

### 3.1 New Files to Create

```
components/artifacts/
├── ArtifactCard.tsx              # Universal card component (NEW)
├── ArtifactGridView.tsx          # Universal grid view (NEW)
├── ArtifactActions.tsx           # Type-specific action handlers (NEW)
└── ArtifactTypeHeader.tsx        # Type-specific headers (NEW)
```

### 3.2 Files to Modify

**Data Layer:**
```
lib/hub/feed-queries.ts           # Add status and visibility filtering
lib/hub/types.ts                  # Add new filter types (if needed)
```

**Pages:**
```
app/seeds/page.tsx                # Replace SeedsView with ArtifactGridView
app/librarian/greenhouse/page.tsx # Replace GreenhouseView with ArtifactGridView
app/librarian/commons/page.tsx    # Replace CommonsView with ArtifactGridView
```

**Navigation:**
```
components/layout/NavigationSidebar.tsx  # Remove Librarian and Seeds links
```

**Configuration:**
```
next.config.mjs                   # Add /librarian redirect
```

### 3.3 Files to Delete (Deprecation)

**Card Components:**
```
components/seeds/seed-card.tsx
components/librarian/GreenhouseCard.tsx
components/librarian/CommonsPromptCard.tsx
```

**View Components:**
```
components/seeds/seeds-view.tsx
components/librarian/GreenhouseView.tsx
components/librarian/CommonsView.tsx
```

**Page:**
```
app/librarian/page.tsx
```

### 3.4 Files to Preserve (Reusable)

**Seed Components:**
```
components/seeds/filters-panel.tsx      # Filtering UI
components/seeds/seed-detail-view.tsx   # Detail modal
components/seeds/plant-seed-modal.tsx   # Seed creation
```

**Librarian Components:**
```
components/librarian/CritiqueScore.tsx
components/librarian/CritiqueDetails.tsx
components/librarian/PublicToggle.tsx
components/librarian/PublicBadge.tsx
components/librarian/CopyToLibraryButton.tsx
components/librarian/GreenhouseCardActions.tsx
```

---

## 4. Data Model & API Changes

### 4.1 Enhanced Filter Types

**Current Filter Interface:**
```typescript
// lib/hub/types.ts
export interface FeedFilters {
  types: ArtifactType[];
  dateFrom: string | null;
  dateTo: string | null;
  search: string;
}
```

**Enhanced Filter Interface:**
```typescript
// lib/hub/types.ts (ENHANCED)
export interface FeedFilters {
  types: ArtifactType[];
  dateFrom: string | null;
  dateTo: string | null;
  search: string;
  
  // NEW FIELDS
  status?: string[];              // For prompts: 'draft' | 'active' | 'saved' | 'archived'
                                  // For seeds: 'new' | 'growing' | 'mature' | 'compost'
  visibility?: PromptVisibility[]; // For prompts: 'private' | 'unlisted' | 'public'
}
```

### 4.2 Enhanced Feed Query Function

**Current Signature:**
```typescript
export async function getFeedArtifacts(
  userId: string,
  filters: FeedFilters,
  pagination: PaginationOptions
): Promise<FeedResponse>
```

**Implementation Changes:**
The function already supports filtering by `types`, `dateFrom`, `dateTo`, and `search`. We need to add:

1. **Status Filtering** - Add WHERE clause for prompt.status and seed.status
2. **Visibility Filtering** - Add WHERE clause for prompt.visibility

**Modification Strategy:**
- Extend each type-specific WHERE clause in `getFeedArtifacts`
- For prompts: Add `status` and `visibility` filters
- For seeds: Add `status` filter
- Maintain parameter indexing pattern

**Example Enhancement (Prompts):**
```typescript
// Current:
if (filters.types.length === 0 || filters.types.includes('prompt')) {
  let whereClause = `user_id = $1`;
  
  // NEW: Add status filter
  if (filters.status && filters.status.length > 0) {
    whereClause += ` AND status = ANY($${paramIndex})`;
    params.push(filters.status);
    paramIndex++;
  }
  
  // NEW: Add visibility filter
  if (filters.visibility && filters.visibility.length > 0) {
    whereClause += ` AND visibility = ANY($${paramIndex})`;
    params.push(filters.visibility);
    paramIndex++;
  }
  
  // ... existing date and search filters
}
```

### 4.3 Artifact Data Types

**Union Type for ArtifactCard:**
```typescript
// components/artifacts/ArtifactCard.tsx
import type { SeedRow } from '@/lib/seeds/types';
import type { PromptWithCritique } from '@/lib/pglite/prompts';
import type { SessionRow } from '@/lib/pglite/types';

type CardArtifact = SeedRow | PromptWithCritique | SessionRow;
```

**Type Guards:**
```typescript
function isSeed(artifact: CardArtifact): artifact is SeedRow {
  return 'type' in artifact && 'status' in artifact && 'why_matters' in artifact;
}

function isPrompt(artifact: CardArtifact): artifact is PromptWithCritique {
  return 'visibility' in artifact && 'latestCritique' in artifact;
}

function isSession(artifact: CardArtifact): artifact is SessionRow {
  return 'situation' in artifact;
}
```

---

## 5. Component Specifications

### 5.1 ArtifactCard Component

**File:** `components/artifacts/ArtifactCard.tsx`

**Props Interface:**
```typescript
interface ArtifactCardProps {
  artifact: SeedRow | PromptWithCritique | SessionRow;
  variant?: 'default' | 'compact';
  searchQuery?: string;           // For highlighting
  onAction?: (action: string, artifact: any) => void;
  onStatusChange?: () => void;    // Refresh callback
}
```

**Architecture:**
```typescript
export const ArtifactCard = memo(function ArtifactCard({
  artifact,
  variant = 'default',
  searchQuery,
  onAction,
  onStatusChange,
}: ArtifactCardProps) {
  // Type detection
  const artifactType = detectArtifactType(artifact);
  
  // Render type-specific header
  const header = renderHeader(artifactType, artifact);
  
  // Render type-specific content
  const content = renderContent(artifactType, artifact, searchQuery);
  
  // Render type-specific actions
  const actions = renderActions(artifactType, artifact, onAction, onStatusChange);
  
  return (
    <motion.div layoutId={`artifact-card-${artifactType}-${artifact.id}`}>
      <Card glow={true}>
        {header}
        {content}
        {actions}
        <TrailOfThoughtPanel 
          artifactType={artifactType} 
          artifactId={artifact.id} 
        />
      </Card>
    </motion.div>
  );
});
```

**Key Features:**
1. **Type Detection**: Use type guards to determine artifact type
2. **Conditional Rendering**: Render appropriate content based on type
3. **Motion Support**: Use Framer Motion for animations
4. **Accessibility**: ARIA labels, keyboard navigation
5. **Search Highlighting**: Highlight search terms in title/description

**Reused Patterns:**
- Motion animations from `SeedCard` (lines 145-157, 160-178)
- Card structure from `GreenhouseCard` (lines 80-169)
- Highlighting from `GreenhouseCard` (lines 34-47)
- Action handlers from all three cards

### 5.2 ArtifactGridView Component

**File:** `components/artifacts/ArtifactGridView.tsx`

**Props Interface:**
```typescript
interface ArtifactGridViewProps {
  filters: FeedFilters;
  emptyState?: {
    title: string;
    message: string;
    action?: React.ReactNode;
  };
  header?: React.ReactNode;
  className?: string;
}
```

**Architecture:**
```typescript
export function ArtifactGridView({
  filters,
  emptyState,
  header,
  className,
}: ArtifactGridViewProps) {
  const [artifacts, setArtifacts] = useState<FeedArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Fetch data using getFeedArtifacts
  const fetchArtifacts = async () => {
    try {
      const response = await getFeedArtifacts('dev-user', filters, { page, limit: 20 });
      setArtifacts(prev => page === 1 ? response.artifacts : [...prev, ...response.artifacts]);
      setHasMore(response.pagination.hasMore);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Load more for infinite scroll
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };
  
  // Render grid
  return (
    <div className={className}>
      {header}
      
      {loading && page === 1 && <LoadingState />}
      {error && <ErrorState error={error} onRetry={() => fetchArtifacts()} />}
      {artifacts.length === 0 && !loading && <EmptyState {...emptyState} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artifacts.map(artifact => (
          <ArtifactCard
            key={`${artifact.type}-${artifact.id}`}
            artifact={artifact}
            onStatusChange={() => fetchArtifacts()}
          />
        ))}
      </div>
      
      {hasMore && <LoadMoreButton onClick={loadMore} loading={loading} />}
    </div>
  );
}
```

**Key Features:**
1. **Data Fetching**: Call `getFeedArtifacts` with provided filters
2. **Infinite Scroll**: Load more on button click or scroll event
3. **Loading States**: Show skeletons or spinners
4. **Error Handling**: Display error message with retry button
5. **Empty States**: Custom empty state messages
6. **Responsive Grid**: 1/2/3 columns based on screen size

---

## 6. Page Implementation Details

### 6.1 Seeds Page

**File:** `app/seeds/page.tsx`

**Before:**
```typescript
export default function SeedsPage() {
  return <SeedsView />;
}
```

**After:**
```typescript
"use client";
import { ArtifactGridView } from "@/components/artifacts/ArtifactGridView";

export default function SeedsPage() {
  return (
    <ArtifactGridView
      filters={{
        types: ['seed'],
        dateFrom: null,
        dateTo: null,
        search: '',
      }}
      emptyState={{
        title: "Your seed library is empty",
        message: "Plant your first seed to start growing your knowledge garden",
        action: <PlantSeedButton />,
      }}
    />
  );
}
```

### 6.2 Greenhouse Page

**File:** `app/librarian/greenhouse/page.tsx`

**After:**
```typescript
"use client";
import { ArtifactGridView } from "@/components/artifacts/ArtifactGridView";

export default function GreenhousePage() {
  return (
    <ArtifactGridView
      filters={{
        types: ['prompt'],
        status: ['saved'],
        dateFrom: null,
        dateTo: null,
        search: '',
      }}
      emptyState={{
        title: "No prompts in greenhouse",
        message: "Saved prompts will appear here",
      }}
    />
  );
}
```

### 6.3 Commons Page

**File:** `app/librarian/commons/page.tsx`

**After:**
```typescript
"use client";
import { ArtifactGridView } from "@/components/artifacts/ArtifactGridView";

export default function CommonsPage() {
  return (
    <ArtifactGridView
      filters={{
        types: ['prompt'],
        visibility: ['public'],
        dateFrom: null,
        dateTo: null,
        search: '',
      }}
      emptyState={{
        title: "No public prompts available",
        message: "Be the first to share a prompt with the community!",
      }}
    />
  );
}
```

---

## 7. Navigation Changes

### 7.1 Sidebar Updates

**File:** `components/layout/NavigationSidebar.tsx`

**Lines to Remove:** 118-130

**Before:**
```typescript
<NavItem href="/librarian" icon="📚" label="Librarian" ... />
<NavItem href="/seeds" icon="🌱" label="Seeds" ... />
```

**After:**
```typescript
// Remove both nav items
// Keep: Dashboard, Workbench, Hub
```

### 7.2 Redirect Configuration

**File:** `next.config.mjs`

**Add to Configuration:**
```javascript
async redirects() {
  return [
    {
      source: '/librarian',
      destination: '/hub',
      permanent: false, // 302 redirect
    },
  ];
},
```

---

## 8. Delivery Phases

### Phase 1: Foundation (Days 1-2)

**Goal:** Create core components without breaking existing functionality

**Tasks:**
1. Create `ArtifactCard.tsx` component
   - Implement type detection logic
   - Implement header rendering
   - Implement content rendering
   - Implement action rendering
   - Add TrailOfThoughtPanel integration
   - Add motion animations
   - Add accessibility features

2. Create `ArtifactGridView.tsx` component
   - Implement data fetching
   - Implement pagination
   - Implement loading/error/empty states
   - Implement responsive grid layout

3. Enhance `lib/hub/feed-queries.ts`
   - Add status filtering for prompts
   - Add status filtering for seeds
   - Add visibility filtering for prompts
   - Test query performance

**Verification:**
```bash
npm run type-check  # Ensure no TypeScript errors
npm run lint        # Ensure code style compliance
```

**Testing:**
- Create test page at `/test-artifacts` to verify new components
- Test all artifact types render correctly
- Test all filters work as expected
- Verify animations and interactions

### Phase 2: Page Refactoring (Days 3-4)

**Goal:** Replace existing views with new components

**Tasks:**
1. Refactor Seeds Page
   - Update `app/seeds/page.tsx`
   - Test all seed functionality (view, status changes, delete, discuss, workbench)
   - Verify filters and search work
   - Take screenshot for comparison

2. Refactor Greenhouse Page
   - Update `app/librarian/greenhouse/page.tsx`
   - Test all greenhouse functionality (critique scores, public toggle, actions)
   - Verify status filtering works
   - Take screenshot for comparison

3. Refactor Commons Page
   - Update `app/librarian/commons/page.tsx`
   - Test public prompt display
   - Test copy-to-library functionality
   - Verify author information displays
   - Take screenshot for comparison

**Verification:**
```bash
npm run dev                    # Run development server
# Manual testing of all three pages
npm run type-check             # TypeScript check
npm run lint                   # Linting
```

**Testing:**
- Side-by-side comparison with old pages
- Test all user interactions
- Verify data accuracy
- Check mobile responsiveness

### Phase 3: Navigation & Cleanup (Day 5)

**Goal:** Update navigation and remove deprecated code

**Tasks:**
1. Update Navigation
   - Remove Librarian link from `NavigationSidebar.tsx` (lines 118-123)
   - Remove Seeds link from `NavigationSidebar.tsx` (lines 124-130)
   - Test navigation flow

2. Add Redirect
   - Update `next.config.mjs` with redirect
   - Test `/librarian` redirects to `/hub`

3. Delete Deprecated Files
   - Delete `components/seeds/seed-card.tsx`
   - Delete `components/librarian/GreenhouseCard.tsx`
   - Delete `components/librarian/CommonsPromptCard.tsx`
   - Delete `components/seeds/seeds-view.tsx`
   - Delete `components/librarian/GreenhouseView.tsx`
   - Delete `components/librarian/CommonsView.tsx`
   - Delete `app/librarian/page.tsx`

**Verification:**
```bash
npm run build                  # Ensure production build succeeds
npm run type-check             # Final TypeScript check
npm run lint                   # Final lint check
```

**Testing:**
- Test all navigation links
- Verify redirect works
- Ensure no broken imports
- Full regression test of all pages

---

## 9. Verification Approach

### 9.1 TypeScript Verification

```bash
npm run type-check
```

**Expected Output:**
```
✓ TypeScript compilation successful
```

**Checks:**
- All new components have proper types
- No implicit any types
- All imports resolve correctly
- No unused variables or imports

### 9.2 Linting Verification

```bash
npm run lint
```

**Expected Output:**
```
✓ No ESLint warnings
```

**Checks:**
- Code follows Next.js conventions
- No console.logs in production code
- Proper React hooks usage
- Accessibility attributes present

### 9.3 Build Verification

```bash
npm run build
```

**Expected Output:**
```
✓ Compiled successfully
✓ Static page generation complete
```

**Checks:**
- All pages build successfully
- No runtime errors
- Bundle size reasonable
- No missing dependencies

### 9.4 Manual Testing Checklist

**Seeds Page (`/seeds`):**
- [ ] Seeds display in grid
- [ ] Status badges show correctly
- [ ] Status transitions work (Keep, Grow, Compost)
- [ ] "Open in Workbench" button works
- [ ] "Discuss in Dojo" button works
- [ ] Delete button works
- [ ] TrailOfThoughtPanel displays
- [ ] Search filters seeds
- [ ] Animations are smooth

**Greenhouse Page (`/librarian/greenhouse`):**
- [ ] Prompts display in grid
- [ ] Critique scores display
- [ ] Public toggle works
- [ ] Status transitions work
- [ ] Actions menu works
- [ ] TrailOfThoughtPanel displays
- [ ] Search filters prompts
- [ ] Animations are smooth

**Commons Page (`/librarian/commons`):**
- [ ] Public prompts display
- [ ] Author information shows
- [ ] "View Details" works
- [ ] "Copy to Library" works
- [ ] Public badge displays
- [ ] Expand/collapse works
- [ ] Search filters prompts

**Navigation:**
- [ ] Dashboard link works
- [ ] Workbench link works
- [ ] Hub link works
- [ ] Librarian link removed
- [ ] Seeds link removed
- [ ] `/librarian` redirects to `/hub`

### 9.5 Performance Verification

**Metrics to Check:**
- Initial page load < 2s
- Time to interactive < 3s
- Card render time < 200ms
- Smooth scrolling (60fps)
- No layout shifts

**Tools:**
- Chrome DevTools Performance tab
- Lighthouse audit
- React DevTools Profiler

### 9.6 Accessibility Verification

**Checks:**
- [ ] All interactive elements keyboard accessible
- [ ] ARIA labels present
- [ ] Focus indicators visible
- [ ] Screen reader friendly
- [ ] Color contrast passes WCAG AA

**Tools:**
- Chrome DevTools Accessibility tab
- axe DevTools browser extension
- Keyboard-only navigation test

---

## 10. Risk Mitigation

### 10.1 Data Loss Prevention

**Risk:** Accidentally deleting data during refactoring

**Mitigation:**
- All changes are UI-only
- No database schema changes
- No data migration required
- PGlite data persists in browser storage

### 10.2 Functionality Regression

**Risk:** Losing functionality during consolidation

**Mitigation:**
- Create feature parity checklist
- Test all buttons and interactions
- Compare side-by-side with old implementation
- Keep old components until full verification

### 10.3 Type Safety

**Risk:** Type errors with union types

**Mitigation:**
- Use type guards for artifact detection
- Strong typing on all props
- TypeScript strict mode enabled
- Comprehensive type checking

### 10.4 Performance Degradation

**Risk:** Slower rendering with unified component

**Mitigation:**
- Use React.memo for card component
- Implement proper key props
- Lazy load images
- Profile before/after performance

---

## 11. Success Metrics

### 11.1 Code Quality Metrics

- [ ] TypeScript compilation: 0 errors
- [ ] ESLint: 0 warnings
- [ ] Build size: No significant increase
- [ ] Test coverage: Maintained or improved

### 11.2 Functional Metrics

- [ ] All pages render correctly
- [ ] All user interactions work
- [ ] All filters function properly
- [ ] All actions complete successfully

### 11.3 Performance Metrics

- [ ] Page load time: < 2s
- [ ] Card render time: < 200ms
- [ ] Smooth animations: 60fps
- [ ] No memory leaks

### 11.4 User Experience Metrics

- [ ] Consistent UI across pages
- [ ] Keyboard navigation works
- [ ] Mobile responsive
- [ ] Accessible to screen readers

---

## 12. Rollback Plan

If critical issues are discovered:

1. **Phase 1 Rollback:**
   - Delete new components
   - Revert feed-queries changes

2. **Phase 2 Rollback:**
   - Restore original page imports
   - Keep new components for future

3. **Phase 3 Rollback:**
   - Restore navigation links
   - Remove redirect
   - Restore deleted files from git history

**Git Strategy:**
- Commit after each phase
- Tag stable states
- Use descriptive commit messages
- Don't squash until fully verified

---

## 13. Future Extensibility

This architecture enables:

1. **New Artifact Types:**
   - Add type detection in `ArtifactCard`
   - Add rendering logic
   - Add action handlers

2. **Advanced Filtering:**
   - Extend `FeedFilters` interface
   - Update query logic in `feed-queries.ts`
   - Add filter UI components

3. **Bulk Operations:**
   - Add selection state to `ArtifactGridView`
   - Add bulk action handlers
   - Add multi-select UI

4. **Alternative Layouts:**
   - Add `layout` prop to `ArtifactGridView`
   - Implement list, masonry, table views
   - Preserve grid as default

---

## Appendix A: File Dependency Map

```
ArtifactCard.tsx
├── depends on: Card.tsx (ui)
├── depends on: Tag.tsx (ui)
├── depends on: TrailOfThoughtPanel.tsx (hub)
├── depends on: CritiqueScore.tsx (librarian)
├── depends on: PublicToggle.tsx (librarian)
├── depends on: GreenhouseCardActions.tsx (librarian)
├── depends on: lib/utils.ts
└── depends on: framer-motion

ArtifactGridView.tsx
├── depends on: ArtifactCard.tsx
├── depends on: lib/hub/feed-queries.ts
├── depends on: lib/hub/types.ts
└── depends on: react-infinite-scroll-component (maybe)

feed-queries.ts
├── depends on: lib/pglite/client.ts
├── depends on: lib/hub/types.ts
└── depends on: lib/pglite/types.ts
```

---

## Appendix B: Migration Checklist

- [ ] Phase 1: Foundation
  - [ ] Create ArtifactCard component
  - [ ] Create ArtifactGridView component
  - [ ] Enhance feed-queries.ts
  - [ ] Run type-check
  - [ ] Run lint
  - [ ] Create test page
  - [ ] Verify component functionality

- [ ] Phase 2: Page Refactoring
  - [ ] Refactor /seeds page
  - [ ] Test seeds functionality
  - [ ] Screenshot seeds page
  - [ ] Refactor /librarian/greenhouse page
  - [ ] Test greenhouse functionality
  - [ ] Screenshot greenhouse page
  - [ ] Refactor /librarian/commons page
  - [ ] Test commons functionality
  - [ ] Screenshot commons page
  - [ ] Run type-check
  - [ ] Run lint

- [ ] Phase 3: Navigation & Cleanup
  - [ ] Update NavigationSidebar
  - [ ] Add redirect in next.config.mjs
  - [ ] Delete seed-card.tsx
  - [ ] Delete GreenhouseCard.tsx
  - [ ] Delete CommonsPromptCard.tsx
  - [ ] Delete seeds-view.tsx
  - [ ] Delete GreenhouseView.tsx
  - [ ] Delete CommonsView.tsx
  - [ ] Delete librarian/page.tsx
  - [ ] Run build
  - [ ] Run type-check
  - [ ] Run lint
  - [ ] Full regression test

- [ ] Final Verification
  - [ ] All pages load
  - [ ] All features work
  - [ ] Navigation correct
  - [ ] Redirect works
  - [ ] No console errors
  - [ ] Performance acceptable
  - [ ] Accessibility verified

---

**Document Status:** Ready for Implementation  
**Next Step:** Proceed to Planning Phase  
**Estimated Effort:** 22-33 hours across 3 phases
