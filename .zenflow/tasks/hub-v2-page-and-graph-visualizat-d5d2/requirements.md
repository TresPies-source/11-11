# Product Requirements Document: Hub v2 Page and Graph Visualization

**Version:** 1.0  
**Date:** January 15, 2026  
**Status:** Draft

---

## 1. Executive Summary

This PRD defines the requirements for implementing two complementary features in the Knowledge Hub: the **Hub v2 Activity Feed** page and the **Graph Visualization** page. These features will provide users with comprehensive views of their knowledge ecosystem, enabling discovery, exploration, and understanding of how their ideas (prompts, seeds, sessions, and files) connect and evolve over time.

---

## 2. Background & Context

### 2.1 Current State

The application currently has:
- **TrailOfThoughtPanel Component**: Shows lineage connections for a single artifact contextually
- **Knowledge Links System**: Database infrastructure (`knowledge_links` table) that tracks bidirectional relationships between artifacts
- **Existing API**: `/api/hub/lineage/[type]/[id]` endpoint for fetching artifact lineage
- **Four Artifact Types**: Sessions (Dojo conversations), Prompts (Library templates), Seeds (Garden ideas), and Files (Workbench documents)

### 2.2 Problem Statement

Users currently lack:
1. A **macro-level view** of all knowledge activity across their ecosystem
2. A **visual representation** of how different artifacts connect and form patterns
3. An **intuitive exploration interface** for discovering forgotten connections and serendipitous relationships
4. A **centralized hub** for browsing chronological knowledge creation and linking activity

### 2.3 User Needs

**Primary User Personas:**
- **Knowledge Workers**: Need to understand how their ideas evolve and connect
- **Researchers**: Want to discover patterns and unexpected connections in their work
- **Creative Professionals**: Seek inspiration from past work and connection discovery

**User Stories:**
1. "As a user, I want to see a chronological feed of all my knowledge activity so I can understand what I've been working on"
2. "As a user, I want to filter knowledge artifacts by type and date so I can focus on specific areas"
3. "As a user, I want to visualize my entire knowledge graph so I can spot patterns and clusters"
4. "As a user, I want to explore my knowledge graph interactively so I can discover unexpected connections"
5. "As a user, I want to see how individual artifacts connect to others in my ecosystem"

---

## 3. Product Requirements

### 3.1 Hub v2 Page (Activity Feed)

#### 3.1.1 Overview
A three-column layout page at `/hub` that provides a chronological, filterable view of all knowledge artifacts and their connections.

#### 3.1.2 Core Features

**A. Left Sidebar: Filters**
- **Artifact Type Filter**
  - Checkboxes for: Sessions, Prompts, Seeds, Files
  - Multiple selections allowed
  - "All" option to select/deselect all types
  - Default: All types selected

- **Date Range Filter**
  - Quick options: Today, Last 7 Days, Last 30 Days, All Time
  - Custom date range picker (from/to dates)
  - Default: Last 30 Days

- **Search Bar**
  - Full-text search across artifact titles and content previews
  - Real-time filtering as user types
  - Clear button to reset search
  - Placeholder: "Search knowledge..."

- **Active Filters Display**
  - Show count of active filters
  - Quick clear button to reset all filters

**B. Center Column: Activity Feed**
- **Infinite Scrolling Feed**
  - Display artifacts as `TrailOfThoughtPanel` components (reuse existing)
  - Initially load 20 items
  - Load 20 more items when user scrolls to 80% of current content
  - Show loading skeleton while fetching
  - Display "End of feed" message when no more items

- **Sorting**
  - Sort by most recent activity (creation or last connection)
  - Each panel shows the artifact and its most recent connections via Trail of Thought

- **Empty States**
  - No artifacts: "No knowledge artifacts yet. Start creating in Dojo, Library, or Seeds!"
  - No results from filters: "No artifacts match your filters. Try adjusting your search."

**C. Right Sidebar: Global Graph Preview**
- **Mini Graph Visualization**
  - Non-interactive (view-only) preview of entire knowledge graph
  - Nodes colored by artifact type:
    - Sessions: Blue (#4A90E2)
    - Prompts: Purple (#9B59B6)
    - Seeds: Green (#27AE60)
    - Files: Orange (#E67E22)
  - Maximum 100 nodes displayed (sample if more exist)
  - Highlight current artifact in view (as user scrolls feed)

- **Navigation**
  - Large "View Full Graph" button
  - Click navigates to `/hub/graph`
  - Show node count: "Viewing 234 connections"

#### 3.1.3 API Requirements

**Endpoint:** `GET /api/hub/feed`

**Query Parameters:**
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Items per page (default: 20, max: 50)
- `types` (string[]): Filter by artifact types (e.g., ['session', 'prompt'])
- `dateFrom` (ISO string): Start date for filtering
- `dateTo` (ISO string): End date for filtering
- `search` (string): Full-text search query

**Response Format:**
```typescript
{
  artifacts: Array<{
    type: ArtifactType;
    id: string;
    title: string;
    content_preview: string;
    created_at: string;
    updated_at: string;
    last_activity: string; // Most recent creation or link
    connection_count: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
```

**Performance Requirements:**
- Response time: < 500ms for typical queries
- Support for up to 10,000 total artifacts
- Efficient pagination with proper indexing

---

### 3.2 Graph Visualization Page

#### 3.2.1 Overview
A full-screen, interactive graph visualization at `/hub/graph` that displays the entire knowledge ecosystem using a force-directed layout.

#### 3.2.2 Core Features

**A. Graph Canvas**
- **Full-Screen Display**
  - Maximize canvas space (minimal chrome/UI)
  - Responsive to window resize
  - Dark theme optimized for visual clarity

- **Force-Directed Layout**
  - Use `react-force-graph` library (2D variant)
  - Automatic clustering of related nodes
  - Organic, aesthetically pleasing arrangement
  - Physics-based animations

**B. Nodes**
- **Visual Design**
  - Size based on connection count (3-12px radius)
  - Color coded by artifact type (same as preview)
  - Label shows artifact title (visible on zoom > 1.5x)
  - Glow effect on hover

- **Node Data**
  ```typescript
  {
    id: string;
    type: ArtifactType;
    title: string;
    connectionCount: number;
    x?: number; // Initial position
    y?: number;
  }
  ```

**C. Links**
- **Visual Design**
  - Thin lines (1px) connecting nodes
  - Color: Semi-transparent gray (#999999, 40% opacity)
  - Highlight on hover (thicker, brighter)
  - Animate on creation (fade in)

- **Link Data**
  ```typescript
  {
    source: string; // node id
    target: string; // node id
    relationship: RelationshipType;
  }
  ```

**D. Interactions**

- **Zoom & Pan**
  - Mouse wheel / trackpad pinch to zoom (range: 0.5x - 4x)
  - Click and drag to pan
  - Double-click to reset view
  - Zoom controls in bottom-right corner (+/- buttons)

- **Node Interactions**
  - **Hover**: Highlight node and immediate neighbors, dim others
  - **Click**: Open artifact detail modal
  - **Drag**: Reposition node (affects physics temporarily)
  - **Right-click**: Context menu (View details, Go to artifact, Hide connections)

- **Selection**
  - Single-click selects node
  - Show selection ring around node
  - Display mini toolbar: "View Details" and "Navigate to Artifact"

**E. Artifact Detail Modal**
- Triggered on node click
- Shows:
  - Artifact type icon and title
  - Content preview (first 300 characters)
  - Creation date
  - Last updated date
  - Connection count
  - List of immediate connections (with types)
- Actions:
  - "Open in [Context]" button (navigates to artifact)
  - "View Trail" button (scrolls feed to this artifact)
  - "Close" button

**F. Controls & UI Chrome**

- **Top Bar** (Minimal)
  - "← Back to Feed" button (left)
  - Graph statistics: "234 nodes • 456 connections" (center)
  - View options menu (right): Legend toggle, Layout settings

- **Legend** (Collapsible, bottom-left)
  - Color key for artifact types
  - Node size explanation
  - Connection types
  - Toggle visibility

- **Performance Indicator**
  - FPS counter (dev mode only)
  - Node count
  - Warn if graph becomes too large (> 2000 nodes)

#### 3.2.3 API Requirements

**Endpoint:** `GET /api/hub/graph`

**Query Parameters:**
- `limit` (number): Max nodes to return (optional, default: all, max: 2000)

**Response Format:**
```typescript
{
  nodes: Array<{
    id: string;
    type: ArtifactType;
    title: string;
    created_at: string;
  }>;
  links: Array<{
    source: string;
    target: string;
    relationship: RelationshipType;
    created_at: string;
  }>;
  stats: {
    totalNodes: number;
    totalLinks: number;
    nodesByType: Record<ArtifactType, number>;
  };
}
```

**Performance Requirements:**
- Response time: < 1s for graphs up to 1000 nodes
- Response time: < 3s for graphs up to 2000 nodes
- Implement caching with 5-minute TTL
- Consider pagination/streaming for very large graphs

---

## 4. Technical Requirements

### 4.1 Dependencies

**New Libraries to Install:**
- `swr`: For data fetching with caching and revalidation
- `react-infinite-scroll-component`: For infinite scrolling in feed
- `react-force-graph`: For interactive graph visualization (2d variant)
- `@types/react-force-graph`: TypeScript definitions (if available)

### 4.2 Browser Support
- Modern browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- No IE11 support required

### 4.3 Performance Targets

**Hub v2 Page:**
- Initial page load: < 2s
- Filter application: < 300ms
- Infinite scroll load: < 500ms
- Smooth scrolling at 60fps

**Graph Visualization:**
- Initial graph render: < 3s (for 500 nodes)
- Interaction responsiveness: < 100ms
- Smooth animations at 30fps minimum
- Canvas rendering at 60fps for < 1000 nodes

### 4.4 Accessibility

- Keyboard navigation support
  - Tab through filters and buttons
  - Enter/Space to activate
  - Arrow keys to navigate feed items
- ARIA labels for all interactive elements
- Screen reader support for graph statistics
- High contrast mode support
- Focus indicators clearly visible

### 4.5 Responsive Design

**Hub v2 Page:**
- Desktop (> 1024px): Three-column layout
- Tablet (768px - 1024px): Two-column (filters collapsible, no preview)
- Mobile (< 768px): Single column (filters in drawer, no preview)

**Graph Visualization:**
- Desktop: Full-screen experience
- Tablet: Full-screen with touch gestures
- Mobile: Full-screen with simplified controls

---

## 5. Non-Functional Requirements

### 5.1 Data Privacy
- All data remains client-side (PGlite local database)
- No analytics or tracking without user consent
- User data never sent to external services

### 5.2 Error Handling
- Graceful degradation on API failures
- Clear error messages to users
- Retry mechanisms for transient failures
- Offline support (show cached data with indicator)

### 5.3 Loading States
- Skeleton screens for initial loads
- Progressive loading for large datasets
- Loading indicators for user actions
- Optimistic UI updates where applicable

### 5.4 Edge Cases

**Hub v2 Page:**
- Empty database (no artifacts)
- Single artifact with no connections
- Very long artifact titles (truncate with ellipsis)
- Rapid filter changes (debounce search input)
- Network failures (show cached data)

**Graph Visualization:**
- Empty graph (show empty state with CTA)
- Single node (show centered)
- Very large graphs (> 2000 nodes) - show warning, offer filtering
- Disconnected nodes/clusters (still render)
- Circular references (graph library should handle)

---

## 6. User Experience Flow

### 6.1 Hub v2 Page Flow

1. User navigates to `/hub` from main navigation
2. Page loads with default filters (All types, Last 30 days)
3. Initial 20 artifacts load in feed
4. User can:
   - Scroll to load more
   - Apply filters (type, date, search)
   - Click artifact to view in original context
   - Expand Trail of Thought panels
   - View graph preview
   - Click "View Full Graph"

### 6.2 Graph Visualization Flow

1. User navigates to `/hub/graph` (from preview or direct)
2. Graph loads with all nodes and links
3. Force-directed layout animates into position (3-5s)
4. User can:
   - Zoom and pan to explore
   - Hover to highlight connections
   - Click node to see details
   - Drag nodes to rearrange
   - Return to feed with "Back" button

### 6.3 Integration Points

- **Navigation**: Add "Hub" menu item to main navigation
- **Dojo Integration**: After session ends, show "View in Hub" suggestion
- **Library Integration**: Link from prompt details to its position in graph
- **Seeds Integration**: Link from seed card to its connections in hub
- **Workbench Integration**: Show file connections in Hub context

---

## 7. Success Metrics

### 7.1 Adoption Metrics
- % of users who visit `/hub` within first week
- Average time spent on Hub pages
- Return visit rate (weekly/monthly)

### 7.2 Engagement Metrics
- Number of filter applications per session
- Number of artifacts explored per session
- Graph interactions per session
- Modal opens on graph page

### 7.3 Performance Metrics
- Page load times (p50, p90, p99)
- API response times
- Graph render times
- Error rates

### 7.4 Quality Metrics
- Accessibility audit score (target: 90+)
- Lighthouse performance score (target: 85+)
- User satisfaction rating (target: 4.5/5)

---

## 8. Future Enhancements (Out of Scope)

### Phase 2 Possibilities:
- Search by relationship type
- Filter graph by node type
- Save custom graph layouts
- Export graph as image/PDF
- Collaborative graph sharing
- Graph animation timeline (show evolution over time)
- AI-powered connection suggestions
- Bulk operations on artifacts
- Graph analytics (centrality, clusters, etc.)
- Advanced search with boolean operators
- Saved filter presets

### Nice-to-Haves:
- Dark/light theme toggle (if not already global)
- Customizable node colors and sizes
- Graph minimap for navigation
- Keyboard shortcuts for graph navigation
- Undo/redo for graph manipulations
- Graph diffing (compare two time periods)

---

## 9. Dependencies & Risks

### 9.1 Dependencies
- Completion of knowledge_links database migration ✅ (Already complete)
- TrailOfThoughtPanel component ✅ (Already exists)
- Existing lineage API ✅ (Already exists)

### 9.2 Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Performance with large graphs (> 2000 nodes) | High | Medium | Implement node limit, pagination, and filtering |
| Browser memory issues | High | Low | Use canvas rendering, limit animations, add memory monitoring |
| Complex state management | Medium | Medium | Use SWR for caching, keep state simple |
| Poor mobile experience | Medium | Medium | Progressive enhancement, mobile-first design |
| User confusion with graph UI | High | Low | Add onboarding tooltips, legend, and help text |

---

## 10. Open Questions

1. **Q:** Should the Hub v2 feed be the default landing page for `/hub`, or should users choose?
   **A:** Hub v2 feed will be the default at `/hub`. Graph is at `/hub/graph`.

2. **Q:** Should we persist filter preferences across sessions?
   **A:** Yes, store in localStorage for better UX.

3. **Q:** How should we handle very large graphs (> 2000 nodes)?
   **A:** Show warning message and offer filtering options to reduce node count.

4. **Q:** Should graph layout be saved/persistent per user?
   **A:** No, not in v1. Force-directed layout recalculates each time.

5. **Q:** What happens when an artifact is deleted? Should links be cleaned up?
   **A:** Out of scope for this feature. Assume database constraints handle cascading deletes.

---

## 11. Assumptions

1. Users have modern browsers with good hardware (not targeting low-end devices)
2. The `knowledge_links` table is properly indexed for performance
3. The existing `TrailOfThoughtPanel` component can be reused without modifications
4. All artifact types (session, prompt, seed, file) have consistent data structures
5. Users understand the metaphor of a "knowledge graph" and nodes/connections
6. The system will primarily be used in desktop environments (mobile is secondary)
7. Users will have fewer than 10,000 total artifacts and 50,000 links in typical usage

---

## 12. Approval & Sign-off

| Role | Name | Approval | Date |
|------|------|----------|------|
| Product Lead | TBD | Pending | |
| Engineering Lead | TBD | Pending | |
| Design Lead | TBD | Pending | |
| User Research | TBD | Pending | |

---

## Appendix A: Design References

- Hub v2 Design Document: `/02_Specs/11-11-hub-v2-design.md`
- Graph Visualization Design Document: `/02_Specs/11-11-graph-visualization-design.md`
- Knowledge Hub Redesign: `/02_Specs/11-11-knowledge-hub-redesign.md`
- Existing Component: `/components/hub/TrailOfThoughtPanel.tsx`

---

## Appendix B: API Contract Examples

See sections 3.1.3 and 3.2.3 for full API specifications.

---

**Document Version History:**
- v1.0 (2026-01-15): Initial draft based on design documents and codebase analysis
