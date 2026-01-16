# Technical Specification: Hub v2 Page and Graph Visualization

**Version:** 1.0  
**Date:** January 15, 2026  
**Status:** Draft

---

## 1. Technical Context

### 1.1 Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.7
- **Database:** PGlite (client-side PostgreSQL)
- **Styling:** Tailwind CSS with custom design tokens
- **Data Fetching:** Native fetch API (no SWR - keep it simple)
- **Animations:** Framer Motion
- **State Management:** React useState/useEffect hooks, no external state library needed
- **Authentication:** NextAuth 5.0 with dev mode fallback

### 1.2 Existing Infrastructure

**Database Schema:**
- `knowledge_links` table (migration 011) with indexes on:
  - `(source_type, source_id)`
  - `(target_type, target_id)` 
  - `user_id`
  - `created_at DESC`

**Existing Components:**
- `TrailOfThoughtPanel.tsx` - Displays artifact lineage (reusable)
- Shared components: `LoadingState`, `ErrorState`, `EmptyState`

**Existing APIs:**
- `GET /api/hub/lineage/[type]/[id]` - Fetches lineage for single artifact

**Existing Utilities:**
- `lib/hub/utils.ts` - Helper functions for formatting and navigation
- `lib/hub/types.ts` - TypeScript types for artifacts and relationships
- `lib/pglite/knowledge-links.ts` - Database access layer

**Design System:**
- Color palette: `bg-primary/secondary/tertiary/elevated`, `text-primary/secondary/tertiary/muted/accent`
- Artifact colors: Sessions (blue), Prompts (purple), Seeds (green), Files (orange)
- Typography: Inter (sans), JetBrains Mono (mono)
- Animation timing: `instant/fast/normal/slow/patient`

---

## 2. Implementation Approach

### 2.1 New Dependencies

Install the following packages:

```bash
pnpm install react-force-graph-2d react-infinite-scroll-component
```

**Rationale:**
- `react-force-graph-2d`: Lightweight, performant 2D force-directed graph library (simpler than full 3D variant)
- `react-infinite-scroll-component`: Battle-tested infinite scroll implementation with good TypeScript support

**Note:** Do NOT install `swr` - we'll use native fetch with React hooks to keep dependencies minimal.

### 2.2 Architecture Decisions

**Data Fetching Strategy:**
- Use native `fetch()` with `useState`/`useEffect` hooks
- Implement simple in-memory caching where needed
- No external state management library required (keep it simple)

**Layout Strategy:**
- Hub v2 page: CSS Grid for three-column layout with responsive breakpoints
- Graph page: Full-screen canvas with minimal chrome
- Reuse existing `ResizableLayout` from root layout

**Performance Strategy:**
- Paginated API responses (20 items per page)
- Virtual scrolling via `react-infinite-scroll-component`
- Graph rendering limited to 2000 nodes with warning for larger datasets
- Debounced search input (300ms delay)
- Memoized components where beneficial

### 2.3 Code Organization

Follow existing patterns:
- API routes in `app/api/hub/`
- Page components in `app/hub/`
- Reusable components in `components/hub/`
- Business logic in `lib/hub/`
- Custom hooks in `hooks/hub/`
- Types in `lib/hub/types.ts`

---

## 3. Source Code Structure Changes

### 3.1 New API Routes

**File:** `app/api/hub/feed/route.ts`
- **Method:** `GET`
- **Purpose:** Fetch paginated activity feed
- **Query Parameters:**
  - `page` (number, default: 1)
  - `limit` (number, default: 20, max: 50)
  - `types` (string[], optional): Filter by artifact types
  - `dateFrom` (ISO string, optional)
  - `dateTo` (ISO string, optional)
  - `search` (string, optional)
- **Response:** Paginated list of artifacts with connection counts
- **Implementation:** Query all artifact tables (sessions, prompts, seeds, files) with UNION, join with knowledge_links for counts

**File:** `app/api/hub/graph/route.ts`
- **Method:** `GET`
- **Purpose:** Fetch entire knowledge graph
- **Query Parameters:**
  - `limit` (number, optional, max: 2000)
- **Response:** Nodes and links arrays for graph visualization
- **Implementation:** 
  1. Query all artifacts across tables
  2. Query all knowledge_links
  3. Format as graph structure with statistics

### 3.2 New Page Components

**File:** `app/hub/page.tsx`
- **Purpose:** Hub v2 activity feed page
- **Layout:** Three-column responsive grid
- **Sections:**
  - Left: `<FiltersSidebar />` (type, date, search)
  - Center: `<ActivityFeed />` (infinite scroll)
  - Right: `<GraphPreview />` (mini visualization)
- **State:** Filter state, pagination state, artifacts data
- **Data Fetching:** useEffect + fetch to `/api/hub/feed`

**File:** `app/hub/graph/page.tsx`
- **Purpose:** Full-screen interactive graph visualization
- **Layout:** Canvas with minimal chrome overlay
- **Sections:**
  - Canvas: `<ForceGraph2D />` from react-force-graph-2d
  - Overlay: Top bar, legend, zoom controls
  - Modal: `<ArtifactDetailModal />` on node click
- **State:** Graph data, selected node, zoom level
- **Data Fetching:** useEffect + fetch to `/api/hub/graph`

### 3.3 New Components

**File:** `components/hub/FiltersSidebar.tsx`
- Type checkboxes, date range picker, search input
- Props: `filters`, `onFiltersChange`
- Reuse existing `SearchInput` component pattern

**File:** `components/hub/ActivityFeed.tsx`
- Infinite scroll container with `InfiniteScroll` component
- Renders array of `TrailOfThoughtPanel` components
- Props: `artifacts`, `hasMore`, `loadMore`
- Loading states using shared `LoadingState` skeleton

**File:** `components/hub/GraphPreview.tsx`
- Simplified read-only graph preview (SVG or canvas)
- Props: `nodes`, `links`, `highlightedNode`
- Click navigates to `/hub/graph`

**File:** `components/hub/ArtifactDetailModal.tsx`
- Modal overlay showing artifact details
- Props: `artifact`, `onClose`, `onNavigate`
- Reuse existing modal patterns from codebase

**File:** `components/hub/GraphLegend.tsx`
- Collapsible legend for graph colors and symbols
- Props: `visible`, `onToggle`
- Positioned bottom-left

**File:** `components/hub/GraphControls.tsx`
- Zoom in/out buttons, reset view, back button
- Props: `onZoomIn`, `onZoomOut`, `onReset`, `onBack`
- Positioned top/bottom right

### 3.4 New Hooks

**File:** `hooks/hub/useFeed.ts`
- Manages feed data fetching and pagination
- Interface:
  ```typescript
  interface UseFeedOptions {
    filters: FeedFilters;
    enabled?: boolean;
  }
  interface UseFeedReturn {
    artifacts: FeedArtifact[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => void;
    refetch: () => void;
  }
  ```
- Implementation: Fetch with pagination, concatenate results

**File:** `hooks/hub/useGraph.ts`
- Manages graph data fetching and interactions
- Interface:
  ```typescript
  interface UseGraphReturn {
    nodes: GraphNode[];
    links: GraphLink[];
    loading: boolean;
    error: string | null;
    stats: GraphStats;
    refetch: () => void;
  }
  ```
- Implementation: Fetch once, cache in state

**File:** `hooks/hub/useFilters.ts`
- Manages filter state with localStorage persistence
- Interface:
  ```typescript
  interface UseFiltersReturn {
    filters: FeedFilters;
    updateFilter: (key: string, value: any) => void;
    resetFilters: () => void;
  }
  ```
- Implementation: useState + useEffect for localStorage sync

### 3.5 Library Functions

**File:** `lib/hub/feed-queries.ts`
- New database query functions:
  - `getFeedArtifacts(userId, filters, pagination)` - Query all artifacts with filters
  - `getArtifactConnectionCount(type, id, userId)` - Count connections for artifact
- Implementation: Use PGlite with SQL UNION for cross-table queries

**File:** `lib/hub/graph-queries.ts`
- New database query functions:
  - `getAllNodes(userId, limit?)` - Fetch all artifact nodes
  - `getAllLinks(userId)` - Fetch all knowledge links
  - `getGraphStats(userId)` - Calculate graph statistics
- Implementation: Use PGlite with efficient joins

---

## 4. Data Model Changes

### 4.1 Database Schema

**No schema changes required.** The existing `knowledge_links` table and artifact tables (sessions, prompts, seeds, files) are sufficient.

### 4.2 New TypeScript Types

**File:** `lib/hub/types.ts` (additions)

```typescript
// Feed types
export interface FeedFilters {
  types: ArtifactType[];
  dateFrom: string | null;
  dateTo: string | null;
  search: string;
}

export interface FeedArtifact {
  type: ArtifactType;
  id: string;
  title: string;
  content_preview: string;
  created_at: string;
  updated_at: string;
  last_activity: string;
  connection_count: number;
}

export interface FeedResponse {
  artifacts: FeedArtifact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Graph types
export interface GraphNode {
  id: string;
  type: ArtifactType;
  title: string;
  created_at: string;
  connectionCount?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  relationship: RelationshipType;
  created_at: string;
}

export interface GraphStats {
  totalNodes: number;
  totalLinks: number;
  nodesByType: Record<ArtifactType, number>;
}

export interface GraphResponse {
  nodes: GraphNode[];
  links: GraphLink[];
  stats: GraphStats;
}
```

---

## 5. Delivery Phases

### Phase 1: API Layer (Week 1)

**Tasks:**
1. Install dependencies (`react-force-graph-2d`, `react-infinite-scroll-component`)
2. Create `lib/hub/feed-queries.ts` with database query functions
3. Create `lib/hub/graph-queries.ts` with database query functions
4. Create `app/api/hub/feed/route.ts` with pagination and filtering
5. Create `app/api/hub/graph/route.ts` with graph data endpoint
6. Add new TypeScript types to `lib/hub/types.ts`
7. Write unit tests for query functions

**Verification:**
- Test API endpoints with curl or Postman
- Verify pagination works correctly
- Verify filters apply correctly
- Verify graph data structure is valid
- Check response times meet performance targets (< 500ms for feed, < 3s for graph)

### Phase 2: Hub v2 Activity Feed (Week 2)

**Tasks:**
1. Create `hooks/hub/useFeed.ts` for data fetching
2. Create `hooks/hub/useFilters.ts` for filter state management
3. Create `components/hub/FiltersSidebar.tsx`
4. Create `components/hub/ActivityFeed.tsx` with infinite scroll
5. Create `components/hub/GraphPreview.tsx` (simple version)
6. Create `app/hub/page.tsx` assembling all components
7. Implement responsive layout (desktop/tablet/mobile)
8. Add loading states and error handling
9. Implement localStorage filter persistence

**Verification:**
- Test infinite scroll loads correctly
- Verify filters update feed in real-time
- Test responsive layout at different breakpoints
- Verify TrailOfThoughtPanel integration works
- Check accessibility (keyboard navigation, screen readers)
- Test performance with large datasets (> 1000 artifacts)

### Phase 3: Graph Visualization (Week 3)

**Tasks:**
1. Create `hooks/hub/useGraph.ts` for graph data fetching
2. Create `components/hub/GraphLegend.tsx`
3. Create `components/hub/GraphControls.tsx`
4. Create `components/hub/ArtifactDetailModal.tsx`
5. Create `app/hub/graph/page.tsx` with ForceGraph2D integration
6. Implement graph interactions (zoom, pan, drag, click)
7. Implement node highlighting and neighbor detection
8. Add modal for artifact details on click
9. Handle large graphs (> 2000 nodes warning)

**Verification:**
- Test graph renders correctly with sample data
- Verify interactions work smoothly (zoom, pan, drag)
- Test node click opens correct modal
- Verify neighbor highlighting works
- Test performance with 500, 1000, 2000 nodes
- Check canvas memory usage doesn't leak
- Verify accessibility considerations

### Phase 4: Polish & Integration (Week 4)

**Tasks:**
1. Add navigation links from main navigation to Hub
2. Add "View in Hub" CTAs from Dojo, Library, Seeds, Workbench
3. Enhance GraphPreview on Hub page (if time allows)
4. Add empty states and onboarding hints
5. Performance optimization (memoization, debouncing)
6. Add error boundaries and fallback UI
7. Polish animations and transitions
8. Final accessibility audit
9. Browser compatibility testing

**Verification:**
- Run full regression test suite
- Test all integration points (Dojo → Hub, etc.)
- Lighthouse performance audit (target: 85+)
- Accessibility audit with screen reader
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Load testing with realistic data volumes

---

## 6. Verification Approach

### 6.1 Testing Strategy

**Manual Testing:**
- Functional testing of all user flows
- Visual regression testing for UI components
- Performance testing with various data sizes
- Accessibility testing with keyboard and screen reader
- Cross-browser compatibility testing

**Automated Testing:**
- Unit tests for database query functions
- Integration tests for API endpoints
- Component tests for key UI components (if time allows)

**Test Commands:**
```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Build verification
pnpm build

# Development server
pnpm dev
```

### 6.2 Performance Benchmarks

**Hub v2 Page:**
- Initial load: < 2s (target)
- Filter application: < 300ms
- Infinite scroll: < 500ms per page
- Smooth 60fps scrolling

**Graph Visualization:**
- Initial render (500 nodes): < 3s
- Interaction latency: < 100ms
- Animation framerate: 30fps minimum
- Memory usage: < 200MB for 1000 nodes

### 6.3 Acceptance Criteria

All criteria from PRD section 4 must be met:

- ✅ New `/hub` page exists with three-column layout
- ✅ Activity feed loads and displays `TrailOfThoughtPanel` components
- ✅ New `/hub/graph` page exists with full-screen interactive graph
- ✅ Graph loads and displays nodes/links from API
- ✅ Both pages are visually polished and integrated with design system
- ✅ Navigation integrated with main app navigation
- ✅ Performance targets met
- ✅ Accessibility standards met
- ✅ Responsive design works on mobile/tablet/desktop

---

## 7. Technical Risks & Mitigations

### 7.1 Performance Risks

**Risk:** Graph rendering with > 2000 nodes causes browser slowdown
- **Mitigation:** Hard limit at 2000 nodes with warning message
- **Mitigation:** Use canvas rendering (not SVG) for better performance
- **Mitigation:** Implement WebWorker for force simulation (if needed)

**Risk:** Feed pagination becomes slow with large datasets
- **Mitigation:** Ensure proper database indexes exist
- **Mitigation:** Add cursor-based pagination if offset pagination is slow
- **Mitigation:** Implement virtual scrolling

### 7.2 Data Quality Risks

**Risk:** Missing or inconsistent artifact metadata
- **Mitigation:** Add null checks and fallbacks in query functions
- **Mitigation:** Handle edge cases in `getArtifactMetadata` function

**Risk:** Circular or self-referencing links
- **Mitigation:** Graph library handles this automatically
- **Mitigation:** Add validation in link creation (future enhancement)

### 7.3 UX Risks

**Risk:** Users confused by graph visualization
- **Mitigation:** Add legend and onboarding tooltips
- **Mitigation:** Provide "Back to Feed" escape hatch
- **Mitigation:** Include help text and empty states

**Risk:** Poor mobile experience
- **Mitigation:** Test early on mobile devices
- **Mitigation:** Simplify mobile layout (hide preview, drawer for filters)
- **Mitigation:** Add touch gestures for graph interaction

---

## 8. Dependencies & Blockers

### 8.1 External Dependencies

- `react-force-graph-2d@^1.x` - Graph visualization library
- `react-infinite-scroll-component@^6.x` - Infinite scroll component

### 8.2 Internal Dependencies

- ✅ `knowledge_links` table exists and populated (migration 011)
- ✅ `TrailOfThoughtPanel` component exists
- ✅ `lib/pglite/knowledge-links.ts` functions exist
- ✅ Design system tokens in `tailwind.config.ts`

### 8.3 Known Blockers

**None.** All required infrastructure is in place.

---

## 9. Open Questions for Implementation

1. **Filter Persistence:** Should filter state be per-user or per-session?
   - **Answer:** Use localStorage (per-browser) for simplicity. No server-side persistence needed.

2. **Graph Layout:** Should we allow custom layouts or always use force-directed?
   - **Answer:** Always force-directed for v1. Custom layouts are future enhancement.

3. **Real-time Updates:** Should the feed update automatically when new artifacts are created?
   - **Answer:** No real-time updates for v1. User can manually refresh.

4. **Export Functionality:** Should users be able to export the graph as an image?
   - **Answer:** Out of scope for v1. Add to future enhancements.

5. **Mobile Graph Interaction:** What gestures should we support?
   - **Answer:** Pinch to zoom, drag to pan, tap to select. Use `react-force-graph-2d` built-in touch support.

---

## 10. Success Criteria

This implementation is successful when:

1. ✅ All acceptance criteria from PRD are met
2. ✅ Performance benchmarks are achieved
3. ✅ Code passes linting and type checking
4. ✅ Accessibility audit scores 90+
5. ✅ All four delivery phases are complete
6. ✅ Integration with existing app navigation works
7. ✅ No P0 or P1 bugs in production
8. ✅ Users can discover and explore their knowledge graph intuitively

---

**Document Revision History:**
- v1.0 (2026-01-15): Initial technical specification based on PRD and codebase analysis
