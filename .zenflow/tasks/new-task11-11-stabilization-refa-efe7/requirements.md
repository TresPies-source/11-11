# Product Requirements Document: 11-11 Stabilization & Refactoring

**Version:** 1.0  
**Date:** January 16, 2026  
**Status:** Draft

---

## 1. Executive Summary

This refactoring initiative consolidates three fragmented knowledge management interfaces (Seeds, Greenhouse, Commons) into a unified experience powered by reusable components. The goal is to reduce code duplication, improve maintainability, and align the platform architecture with the two-pillar strategy: **Chat (Dojo)** and **Knowledge Hub**.

---

## 2. Background & Context

### 2.1 Current Architecture

The codebase currently has three separate views for managing knowledge artifacts:

1. **Seeds Page** (`/seeds`)
   - Uses `SeedCard` component
   - Displays seed artifacts with type/status badges
   - Includes status transitions (new → growing → mature → compost)
   - Features "Discuss in Dojo" and "Open in Workbench" actions
   - Integrated `TrailOfThoughtPanel`

2. **Greenhouse Page** (`/librarian/greenhouse`)
   - Uses `GreenhouseCard` component
   - Displays saved prompts with critique scores
   - Shows public/private visibility toggles
   - Different layout and interaction patterns

3. **Commons Page** (`/librarian/commons`)
   - Uses `CommonsPromptCard` component
   - Displays public prompts from all users
   - Shows author information and publication date
   - Copy-to-library functionality

4. **Librarian Page** (`/librarian`)
   - Hub for semantic search and prompt management
   - Will be deprecated and redirected to `/hub`

### 2.2 Problems with Current Approach

- **Inconsistent UX**: Each page has different card layouts, making the platform feel fragmented
- **Code Duplication**: Three separate card components with overlapping functionality
- **Maintenance Burden**: Changes must be propagated across multiple files
- **Cognitive Overhead**: Users must learn different interaction patterns for each page

### 2.3 Strategic Direction

The platform is moving toward a **two-pillar strategy**:

1. **Dojo (Chat)**: Free-flowing conversational interface for thinking with AI
2. **Hub (Knowledge)**: Structured interface for exploring and managing the knowledge graph

This refactoring aligns the codebase with this vision.

---

## 3. Goals & Objectives

### 3.1 Primary Goals

1. **Unified Component Architecture**: Create universal `ArtifactCard` and `ArtifactGridView` components
2. **Consistent User Experience**: Same layout and interaction patterns across all artifact types
3. **Reduced Codebase**: Eliminate redundant components
4. **Future-Proof**: Extensible architecture for new artifact types
5. **Navigation Simplification**: Streamline to Dojo and Hub as primary navigation items

### 3.2 Success Metrics

- All three pages refactored to use new components
- Zero functionality regression
- Navigation reduced to two primary items (Dojo, Hub)
- All deprecated components removed
- Application builds without errors

---

## 4. Functional Requirements

### 4.1 ArtifactCard Component

**Location**: `components/artifacts/ArtifactCard.tsx`

**Purpose**: Universal card component that can render any artifact type (Session, Prompt, Seed, File)

**Requirements**:

#### R1.1: Type-Specific Headers
- Display distinct icons and colors for each artifact type:
  - **Session**: 💬 Dojo colors (`text-dojo`)
  - **Prompt**: 🌺 Librarian colors (`text-librarian`)
  - **Seed**: 🌱 Success colors (`text-success`)
  - **File**: 📄 Supervisor colors (`text-supervisor`)

#### R1.2: Consistent Layout Structure
- **Header Section**:
  - Artifact type badge
  - Status indicator (if applicable)
  - Action buttons (view, delete, etc.)
- **Content Section**:
  - Title (bold, prominent)
  - Description/preview (2-3 line clamp)
  - Tags (if applicable)
  - Metadata (dates, author, scores)
- **Action Bar**:
  - Type-specific primary actions
  - Secondary actions (conditional based on type)
- **Trail of Thought Panel**:
  - Integrated `TrailOfThoughtPanel` component
  - Shows artifact lineage and connections

#### R1.3: Type-Specific Actions

**Seed Actions**:
- Status transitions (Keep, Grow, Compost)
- "Open in Workbench" button
- "Discuss in Dojo" button
- Delete button

**Prompt Actions**:
- Public/Private toggle
- "View Details" button
- Status transition buttons (based on greenhouse/commons context)
- Critique score display

**Session Actions**:
- "Resume Session" button
- "View Details" button
- Delete button

**File Actions**:
- "Open in Workbench" button
- "View Details" button
- Delete button

#### R1.4: Accessibility & Animation
- Use Framer Motion for smooth transitions
- Keyboard navigation support
- ARIA labels for screen readers
- Hover states and focus indicators

---

### 4.2 ArtifactGridView Component

**Location**: `components/artifacts/ArtifactGridView.tsx`

**Purpose**: Reusable grid container that fetches, filters, and displays artifacts

**Requirements**:

#### R2.1: Data Fetching
- Accept filter configuration as props
- Fetch data from `/api/hub/feed` endpoint
- Support filtering by:
  - `artifactType: ArtifactType[]`
  - `status: string[]` (for prompts and seeds)
  - `visibility: PromptVisibility[]` (for prompts)
  - `dateFrom: string | null`
  - `dateTo: string | null`
  - `search: string`

#### R2.2: Pagination
- Implement infinite scroll
- Load more artifacts when user reaches bottom
- Show loading state during fetch
- Display "No more results" when exhausted

#### R2.3: Grid Layout
- Responsive grid:
  - 1 column on mobile
  - 2 columns on tablet
  - 3 columns on desktop
- Consistent gap spacing (4-6 spacing units)
- Render `ArtifactCard` for each item

#### R2.4: Empty States
- Show appropriate message when no results:
  - "Your seed library is empty"
  - "No prompts in greenhouse yet"
  - "No public prompts available"
- Offer actions (e.g., "Plant New Seed", "Create Prompt")

#### R2.5: Error Handling
- Display error message if fetch fails
- Provide "Retry" button
- Graceful degradation

---

### 4.3 API Enhancements

**File**: `lib/hub/feed-queries.ts`

**Requirements**:

#### R3.1: Enhanced Filtering
Currently, `getFeedArtifacts` supports:
- `types: ArtifactType[]`
- `search: string`
- `dateFrom/dateTo: string | null`

**Add support for**:
- `status: string[]` - Filter prompts/seeds by status
- `visibility: PromptVisibility[]` - Filter prompts by visibility

#### R3.2: Query Optimization
- Ensure efficient SQL queries for combined filters
- Add database indexes if needed (document in migration files)
- Return appropriate metadata for rendering

---

### 4.4 Page Refactoring

#### R4.1: Seeds Page (`/seeds`)
- Replace `SeedsView` with `ArtifactGridView`
- Configure filter: `{ types: ['seed'] }`
- Preserve existing functionality:
  - Search bar
  - Type and status filters (sidebar)
  - "Plant New Seed" button
  - Detail view modal

#### R4.2: Greenhouse Page (`/librarian/greenhouse`)
- Replace `GreenhouseView` with `ArtifactGridView`
- Configure filter: `{ types: ['prompt'], status: ['saved'] }`
- Preserve existing functionality:
  - Critique scores
  - Public/private toggles
  - Status transitions
  - Search and filters

#### R4.3: Commons Page (`/librarian/commons`)
- Replace `CommonsView` with `ArtifactGridView`
- Configure filter: `{ types: ['prompt'], visibility: ['public'] }`
- Preserve existing functionality:
  - Author information
  - "Copy to Library" button
  - Search by author/title/content
  - Filter (All Public vs. My Public)

---

### 4.5 Navigation Updates

**File**: `components/layout/NavigationSidebar.tsx`

#### R5.1: Remove Links
- Remove "Librarian" nav item (line 118-123)
- Remove "Seeds" nav item (line 124-130)

#### R5.2: Keep Links
- "Dashboard" (`/dashboard`)
- "Workbench" (`/workbench`)
- "Hub" (`/hub`)
- "Dojo" link (if exists, verify path)

---

### 4.6 Component Deprecation

Remove the following files:
- `components/seeds/seed-card.tsx`
- `components/librarian/GreenhouseCard.tsx`
- `components/librarian/CommonsPromptCard.tsx`
- `components/seeds/seeds-view.tsx`
- `components/librarian/GreenhouseView.tsx`
- `components/librarian/CommonsView.tsx`

**Keep** the following (reusable components):
- `components/seeds/filters-panel.tsx`
- `components/seeds/seed-detail-view.tsx`
- `components/seeds/plant-seed-modal.tsx`
- `components/librarian/CritiqueScore.tsx`
- `components/librarian/PublicToggle.tsx`
- `components/librarian/CopyToLibraryButton.tsx`

---

### 4.7 Librarian Page Deprecation

#### R7.1: Delete Page
- Remove `app/librarian/page.tsx`

#### R7.2: Add Redirect
- Add redirect in `next.config.mjs`:
  ```javascript
  redirects: async () => [
    {
      source: '/librarian',
      destination: '/hub',
      permanent: false,
    },
  ],
  ```

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Components should render in < 200ms
- Infinite scroll should be smooth (no jank)
- Lazy load images and heavy content

### 5.2 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Focus management

### 5.3 Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive (iOS Safari, Chrome Mobile)

### 5.4 Code Quality
- TypeScript strict mode
- ESLint compliance
- Reusable patterns
- Comprehensive error handling

---

## 6. Technical Constraints

### 6.1 Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: PGlite (client-side)
- **UI**: React 18, Framer Motion, TailwindCSS
- **State**: Custom hooks (no external state management)

### 6.2 Existing Patterns
- Follow existing component patterns (Card, Button, Tag)
- Use existing utility functions (`cn`, `formatRelativeTime`)
- Maintain PGlite data access pattern
- Keep `TrailOfThoughtPanel` integration

---

## 7. Open Questions & Assumptions

### 7.1 Questions for Clarification

**Q1**: Should the unified `ArtifactCard` support all action types from all three cards, or should we simplify?
- **Assumption**: Support all actions, conditionally rendered based on artifact type

**Q2**: Should the `/hub` page also be refactored to use `ArtifactGridView`?
- **Assumption**: No, `/hub` already has its own implementation using `ActivityFeed` component. Keep as is.

**Q3**: What should happen to existing links to `/librarian` from external sources?
- **Assumption**: Use a temporary (302) redirect to `/hub` for now

**Q4**: Should we add a "Dojo" nav item if it doesn't exist?
- **Assumption**: Verify current navigation structure. If `/dojo` exists but not in nav, add it.

**Q5**: Should status filtering for seeds include all statuses (new, growing, mature, compost)?
- **Assumption**: Yes, support all seed statuses

### 7.2 Design Decisions

**D1**: Use Framer Motion for consistent animations across all cards
**D2**: Maintain existing color schemes for artifact types
**D3**: Keep TrailOfThoughtPanel as an integrated component
**D4**: Use the existing Card UI component as base
**D5**: Implement infinite scroll for better UX on mobile

---

## 8. Out of Scope

The following are explicitly **out of scope** for this refactoring:

1. **New Features**: No new functionality beyond consolidation
2. **Database Schema Changes**: No changes to PGlite schema
3. **Hub Page Refactoring**: `/hub` page remains unchanged
4. **Workbench Integration**: No changes to workbench workflows
5. **Authentication**: No changes to user authentication
6. **API Routes**: No new API routes (only enhance existing `feed-queries.ts`)

---

## 9. Dependencies & Risks

### 9.1 Dependencies
- `TrailOfThoughtPanel` component must remain stable
- PGlite database queries must be backward compatible
- Existing hooks (`useSeeds`, `useLibrarian`, `useFeed`) may need updates

### 9.2 Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing functionality | High | Comprehensive testing, feature parity checklist |
| Performance degradation | Medium | Benchmark before/after, optimize queries |
| User confusion from navigation changes | Medium | Clear communication, consider onboarding hints |
| Data fetching edge cases | Medium | Robust error handling, fallback states |

---

## 10. Success Criteria

This refactoring is considered successful when:

1. ✅ All three pages (Seeds, Greenhouse, Commons) use `ArtifactCard` and `ArtifactGridView`
2. ✅ No functionality regression (all features preserved)
3. ✅ Navigation sidebar updated (Librarian and Seeds removed)
4. ✅ All deprecated components deleted
5. ✅ `/librarian` redirects to `/hub`
6. ✅ Application builds without errors
7. ✅ All existing tests pass
8. ✅ Code follows existing patterns and conventions

---

## 11. Future Enhancements

Post-refactoring opportunities (not in this scope):

1. **Bulk Actions**: Select multiple artifacts and perform batch operations
2. **Advanced Filtering**: More granular filters (tags, date ranges, scores)
3. **Sort Options**: Sort by date, score, connections, etc.
4. **Export/Import**: Export artifacts to JSON/CSV
5. **Artifact Templates**: Predefined templates for common artifact types
6. **Unified Search**: Single search across all artifact types

---

## Appendix A: Data Models

### Artifact Types

```typescript
type ArtifactType = 'session' | 'prompt' | 'seed' | 'file';

interface SeedRow {
  id: string;
  name: string;
  type: SeedType; // 'principle' | 'pattern' | 'question' | 'route' | 'artifact' | 'constraint'
  status: SeedStatus; // 'new' | 'growing' | 'mature' | 'compost'
  content: string;
  why_matters: string | null;
  revisit_when: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  session_id: string | null;
  replanted: boolean;
  replant_count: number;
}

interface PromptRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  status: PromptStatus; // 'draft' | 'active' | 'saved' | 'archived'
  visibility: PromptVisibility; // 'private' | 'unlisted' | 'public'
  author_name: string | null;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SessionRow {
  id: string;
  user_id: string;
  title: string | null;
  situation: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## Appendix B: Component Interface Specifications

### ArtifactCard Props

```typescript
interface ArtifactCardProps {
  artifact: SeedRow | PromptWithCritique | SessionRow;
  variant?: 'default' | 'compact';
  onAction?: (action: string, artifact: any) => void;
  showTrail?: boolean;
}
```

### ArtifactGridView Props

```typescript
interface ArtifactGridViewProps {
  filters: {
    types?: ArtifactType[];
    status?: string[];
    visibility?: PromptVisibility[];
    dateFrom?: string | null;
    dateTo?: string | null;
    search?: string;
  };
  emptyState?: {
    title: string;
    message: string;
    action?: React.ReactNode;
  };
  header?: React.ReactNode;
  className?: string;
}
```

---

**Document Prepared By**: AI Assistant (Dojo Genesis)  
**Review Status**: Pending User Approval  
**Next Step**: Create Technical Specification Document
