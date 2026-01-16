# Technical Specification: Trail of Thought Panel

**Version:** 1.0  
**Date:** 2026-01-15  
**Status:** Ready for Implementation

---

## 1. Technical Context

### 1.1 Technology Stack
- **Framework:** Next.js 14 (App Router), React 18
- **Language:** TypeScript 5.7.2 (strict mode)
- **Styling:** Tailwind CSS 3.4
- **Animations:** framer-motion 11.15
- **Icons:** lucide-react 0.469
- **State Management:** Zustand 5.0 (for Workbench state)
- **Database:** PGlite 0.3.14 (client-side)
- **No External Data Fetching Libraries:** No SWR, no React Query

### 1.2 Existing Infrastructure (Production Ready ✅)
- **API Endpoint:** `GET /api/hub/lineage/[type]/[id]`
  - Location: `app/api/hub/lineage/[type]/[id]/route.ts`
  - Returns: `{ artifact: { type, id }, lineage: LineageNode[], count: number }`
  - Auth: Dev mode (`dev@11-11.dev`) or NextAuth session
  - Performance: < 200ms average response time

- **Database Functions:**
  - `getLineage(type, id, userId)` in `lib/pglite/knowledge-links.ts`
  - Bidirectional search (source and target)
  - Returns enriched LineageNode[] with metadata

- **Types:**
  - `ArtifactType`: `'session' | 'prompt' | 'seed' | 'file'`
  - `RelationshipType`: `'extracted_from' | 'discussed_in' | 'refined_in' | 'created_from'`
  - `LineageNode`: `{ type, id, title, content_preview, created_at, relationship }`
  - Location: `lib/hub/types.ts`

---

## 2. Implementation Approach

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Integration Points                        │
│  PromptCard | SeedCard | DojoPage | WorkbenchView          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │ TrailOfThoughtPanel  │ ← Main Component
            │  (components/hub/)   │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   useLineage Hook    │ ← Data Fetching
            │    (hooks/hub/)      │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  Lineage API Route   │ ← Backend (Exists ✅)
            │ /api/hub/lineage/... │
            └──────────────────────┘
```

### 2.2 Component Design Pattern

**Component Pattern:** Controlled, stateless presentation component with custom hook for data management

**Rationale:**
- Matches existing codebase patterns (e.g., `useSeeds` + `SeedCard`)
- Separation of concerns: presentation vs. data fetching
- Easily testable and maintainable
- Reusable across all 4 integration points

---

## 3. Source Code Structure

### 3.1 New Files to Create

```
components/hub/
  └── TrailOfThoughtPanel.tsx       # Main component (300-400 LOC)

hooks/hub/
  └── useLineage.ts                 # Data fetching hook (80-100 LOC)

lib/hub/
  └── utils.ts                      # Utility functions (50-80 LOC)
      - formatRelativeTime()
      - getArtifactIcon()
      - getRelationshipLabel()
      - getArtifactNavigationPath()
```

### 3.2 Files to Modify

```
components/shared/
  └── PromptCard.tsx               # Add panel to footer

components/seeds/
  └── seed-card.tsx                # Add panel to footer

app/dojo/[sessionId]/
  └── page.tsx                     # Add panel to header

components/workbench/
  └── WorkbenchView.tsx            # Add panel to layout
  └── ActionBar.tsx                # Add toggle button (optional)
```

---

## 4. Data Model & API Contracts

### 4.1 API Request
```typescript
GET /api/hub/lineage/[type]/[id]

// Example: GET /api/hub/lineage/prompt/abc-123
```

### 4.2 API Response
```typescript
{
  artifact: {
    type: "prompt",
    id: "abc-123"
  },
  lineage: [
    {
      type: "session",
      id: "xyz-789",
      title: "UI Brainstorm",
      content_preview: "Let's discuss the new button component...",
      created_at: "2026-01-13T10:30:00Z",
      relationship: "discussed_in"
    },
    {
      type: "seed",
      id: "def-456",
      title: "Progressive Disclosure",
      content_preview: "A pattern for revealing information gradually...",
      created_at: "2026-01-12T15:45:00Z",
      relationship: "extracted_from"
    }
  ],
  count: 2
}
```

### 4.3 Component Props Interface
```typescript
interface TrailOfThoughtPanelProps {
  artifactType: ArtifactType;
  artifactId: string;
  defaultOpen?: boolean;        // Default: false
  className?: string;           // Additional Tailwind classes
  maxItems?: number;            // Default: 20
}
```

---

## 5. Implementation Details

### 5.1 Hook: `useLineage`

**Location:** `hooks/hub/useLineage.ts`

**Pattern:** Standard custom hook with fetch-on-mount

**Implementation:**
```typescript
interface UseLineageOptions {
  type: ArtifactType;
  id: string;
  enabled?: boolean;
}

interface UseLineageReturn {
  lineage: LineageNode[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  count: number;
}

export function useLineage(options: UseLineageOptions): UseLineageReturn {
  // Standard useState/useEffect pattern
  // Fetch from /api/hub/lineage/[type]/[id]
  // Handle loading, error, and empty states
}
```

**Key Features:**
- Auto-fetch on mount (if `enabled !== false`)
- Manual refetch capability
- Error handling with user-friendly messages
- Retry counter for manual refetch
- Dependency array: `[type, id, enabled, retryCount]`

### 5.2 Component: `TrailOfThoughtPanel`

**Location:** `components/hub/TrailOfThoughtPanel.tsx`

**Structure:**
```typescript
export function TrailOfThoughtPanel({
  artifactType,
  artifactId,
  defaultOpen = false,
  className,
  maxItems = 20,
}: TrailOfThoughtPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { lineage, loading, error, count } = useLineage({
    type: artifactType,
    id: artifactId,
    enabled: true,
  });

  // Render collapsible panel with timeline
  // Handle loading, error, empty states
}
```

**UI States:**
1. **Collapsed (Default):** Show header with count badge
2. **Loading:** Skeleton loaders or spinner
3. **Error:** Friendly error message with retry button
4. **Empty:** "No connections yet" message with tip
5. **Populated:** Vertical timeline with lineage nodes

### 5.3 Visual Design

**Layout:**
```
┌────────────────────────────────────────────────┐
│ ▶ Trail of Thought (3)              [Collapse] │ ← Header
├────────────────────────────────────────────────┤
│                                                 │
│  ┌─── 💬 Discussed in "UI Brainstorm"         │ ← Node
│  │    2 days ago                               │
│  │                                             │
│  ├─── 🌱 Extracted from "Progressive..."      │ ← Node
│  │    5 days ago                               │
│  │                                             │
│  └─── 💼 Refined in "button-component.tsx"    │ ← Node
│       1 week ago                               │
│                                                 │
└────────────────────────────────────────────────┘
```

**Color Scheme (Dark Mode Only):**
- Background: `bg-bg-secondary` (#0f2838)
- Border: `border-bg-tertiary` (#1a3a4f)
- Text Primary: `text-text-primary` (#ffffff)
- Text Secondary: `text-text-secondary` (#c5d1dd)
- Accent: `text-text-accent` (#f5a623)
- Hover: `hover:bg-bg-tertiary` (#1a3a4f)

**Icons (lucide-react):**
- `MessageSquare` - Session (discussions)
- `FileText` - Prompt (templates)
- `Sprout` - Seed (ideas)
- `File` - File (workbench artifacts)
- `ChevronDown` / `ChevronRight` - Collapse toggle

**Animation (framer-motion):**
```typescript
const containerVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1 },
};

const nodeVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.2 },
  }),
};
```

### 5.4 Utility Functions

**Location:** `lib/hub/utils.ts`

```typescript
// Format ISO timestamp to relative time
export function formatRelativeTime(isoString: string): string {
  // Implementation: "just now", "5m ago", "2h ago", "3d ago", "2w ago"
  // Match pattern in ActivityItem.tsx (components/dashboard/)
}

// Get icon component for artifact type
export function getArtifactIcon(type: ArtifactType): LucideIcon {
  // Return: MessageSquare, FileText, Sprout, or File
}

// Get human-readable relationship label
export function getRelationshipLabel(
  relationship: RelationshipType
): string {
  // Map: extracted_from → "Extracted from"
  //      discussed_in → "Discussed in"
  //      refined_in → "Refined in"
  //      created_from → "Created from"
}

// Get navigation path for artifact
export function getArtifactNavigationPath(
  type: ArtifactType,
  id: string
): string {
  // Map: session → `/dojo/${id}`
  //      prompt → `/library?highlight=${id}` (or prompt detail page if exists)
  //      seed → `/seeds?highlight=${id}` (or seed detail page if exists)
  //      file → `/workbench?file=${id}`
}
```

---

## 6. Integration Details

### 6.1 PromptCard Integration

**File:** `components/shared/PromptCard.tsx`

**Location:** After action buttons, before closing `</motion.div>`

**Code:**
```tsx
<div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
  {/* Existing action buttons */}
  ...
</div>

{/* NEW: Add Trail of Thought Panel */}
<TrailOfThoughtPanel
  artifactType="prompt"
  artifactId={prompt.id}
  className="mt-2"
/>
```

### 6.2 SeedCard Integration

**File:** `components/seeds/seed-card.tsx`

**Location:** After action buttons, before closing `</motion.div>`

**Code:**
```tsx
<div className="mt-auto pt-3 border-t border-bg-tertiary space-y-2">
  {/* Existing status buttons and actions */}
  ...
</div>

{/* NEW: Add Trail of Thought Panel */}
<TrailOfThoughtPanel
  artifactType="seed"
  artifactId={seed.id}
  className="mt-2"
/>
```

### 6.3 Dojo Session Integration

**File:** `app/dojo/[sessionId]/page.tsx`

**Location:** In header section, after "Save Session" button

**Code:**
```tsx
<header className="border-b border-bg-tertiary px-4 py-3 flex items-center justify-between gap-4">
  {/* Existing title input */}
  <div className="flex-1 max-w-md">...</div>
  
  <div className="flex items-center gap-2">
    <Button onClick={handleSaveSession} variant="secondary" size="sm">
      <Save className="w-4 h-4" />
      <span className="hidden sm:inline">Save Session</span>
    </Button>
    
    {/* NEW: Add Trail of Thought Panel */}
    {sessionId !== 'new' && (
      <TrailOfThoughtPanel
        artifactType="session"
        artifactId={sessionId}
        defaultOpen={false}
      />
    )}
  </div>
</header>
```

**Note:** Only show panel for existing sessions (not `sessionId === 'new'`)

### 6.4 Workbench Integration

**File:** `components/workbench/WorkbenchView.tsx`

**Location:** Option A (Recommended) - In Panel layout after Editor

**Approach:** Add a new collapsible section in the editor panel or ActionBar

**Code:**
```tsx
<Panel defaultSize={60} aria-label="Editor panel">
  <div className="flex flex-col h-full">
    <TabBar />
    <div className="flex-1 overflow-hidden">
      <Editor />
    </div>
    
    {/* NEW: Add Trail of Thought Panel (only for file-based tabs) */}
    {activeTab?.isFileBased && activeTab?.fileId && (
      <div className="border-t border-border">
        <TrailOfThoughtPanel
          artifactType="file"
          artifactId={activeTab.fileId}
          className="p-2"
        />
      </div>
    )}
    
    <ActionBar 
      onRun={handleRun} 
      onSave={handleSave} 
      onExport={handleExport} 
      onSaveToHub={handleSaveToHub}
      onDiscussWithDojo={handleDiscussWithDojo}
      isRunning={supervisor.isLoading}
      hasActiveTab={!!activeTabId && tabs.length > 0}
    />
  </div>
</Panel>
```

**Conditional Rendering:**
- Only show when `activeTab.isFileBased === true`
- Only show when `activeTab.fileId` exists
- Hide for "welcome-tab" or ephemeral tabs

---

## 7. Delivery Phases

### Phase 1: Core Component (4-5 hours)
**Goal:** Functional TrailOfThoughtPanel component

1. Create `lib/hub/utils.ts` with utility functions
2. Create `hooks/hub/useLineage.ts` with data fetching logic
3. Create `components/hub/TrailOfThoughtPanel.tsx` with:
   - Collapsible header
   - Loading state
   - Error state with retry
   - Empty state
   - Populated state with timeline
4. Test component in isolation (manual testing in Storybook or dedicated page)

**Acceptance:**
- Component renders correctly with mock data
- All UI states work (loading, error, empty, populated)
- Animations are smooth
- Accessibility: keyboard navigation, ARIA labels
- TypeScript compiles without errors

### Phase 2: Integration (2-3 hours)
**Goal:** Integrate panel into all 4 locations

1. Integrate into PromptCard
2. Integrate into seed-card
3. Integrate into Dojo session page
4. Integrate into WorkbenchView
5. Test each integration point with real data

**Acceptance:**
- Panel appears in all 4 locations
- Data loads correctly from API
- Navigation links work
- No layout conflicts or visual bugs

### Phase 3: Polish & Verification (1-2 hours)
**Goal:** Production-ready code

1. Visual polish:
   - Fine-tune spacing and colors
   - Ensure consistent with design system
   - Test responsive behavior (if applicable)
2. Performance check:
   - Verify no unnecessary re-renders
   - Check API call efficiency
3. Run `pnpm lint` and fix any issues
4. Run `pnpm type-check` and fix any issues
5. Test edge cases:
   - Empty lineage
   - Very long lineage (> 20 items)
   - Network errors
   - Authentication failures

**Acceptance:**
- `pnpm lint` passes
- `pnpm type-check` passes
- No console errors or warnings
- All edge cases handled gracefully

---

## 8. Verification Approach

### 8.1 Manual Testing Checklist

**For Each Integration Point:**
- [ ] Panel renders without errors
- [ ] Panel is collapsed by default
- [ ] Clicking header toggles expand/collapse
- [ ] Loading state shows while fetching
- [ ] Lineage data displays correctly
- [ ] Artifact icons match types
- [ ] Relationship labels are correct
- [ ] Relative timestamps are accurate
- [ ] Clicking a node navigates to correct page
- [ ] Empty state shows when no lineage exists
- [ ] Error state shows with retry button on failure
- [ ] Retry button works correctly

### 8.2 Code Quality Checks

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Build (ensures no runtime errors)
pnpm build
```

### 8.3 Browser Testing
- Test in Chrome, Firefox, Safari, Edge
- Dark mode only (no light mode required)
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader compatibility (basic ARIA labels)

---

## 9. Dependencies & Constraints

### 9.1 Dependencies
All dependencies already exist in `package.json`:
- ✅ `framer-motion@11.15.0`
- ✅ `lucide-react@0.469.0`
- ✅ `next@14.2.24`
- ✅ `react@18.3.1`
- ✅ `tailwindcss@3.4.17`

**No new dependencies required.**

### 9.2 Technical Constraints
- **Browser Support:** Modern browsers only (Chrome, Firefox, Safari, Edge)
- **Dark Mode Only:** No light mode support required
- **No External Data Libraries:** Must use custom hooks with fetch API
- **Performance Target:** Initial render < 100ms, API response < 500ms
- **Accessibility:** WCAG AA compliance (color contrast, keyboard navigation, ARIA labels)

### 9.3 Known Limitations
- **File Artifacts:** Current `getArtifactMetadata()` in `knowledge-links.ts` has placeholder implementation for `file` type (returns generic data)
  - **Impact:** File lineage nodes will show "File {id}" as title
  - **Mitigation:** Accept limitation for Phase 1, improve in Phase 2 (Hub v2)
  - **Alternative:** Add file metadata lookup via Google Drive API

---

## 10. Risk Mitigation

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|---------------------|
| **Layout conflicts in PromptCard/SeedCard** | High | Medium | Use collapsible design by default, test thoroughly, add `className` prop for custom styling |
| **Performance issues with large lineage** | Medium | Low | Implement `maxItems` prop (default: 20), add "Show more" button for pagination |
| **Empty lineage for most artifacts** | Medium | High | Design informative empty state, add tips for creating connections |
| **API authentication failures** | High | Low | Handle 401 errors gracefully, show user-friendly message with retry |
| **File metadata missing** | Low | High | Accept placeholder data for Phase 1, document limitation |

---

## 11. Future Enhancements (Out of Scope)

These features are **not** part of Phase 1 but are documented for future reference:

### Phase 2 - Hub v2 Page
- Dedicated `/hub` page with activity feed
- Each feed item uses TrailOfThoughtPanel
- Filtering by artifact type and date
- Search functionality

### Phase 3 - Graph Visualization
- "View as Graph" toggle in Hub page
- Force-directed graph with `react-force-graph` or `reactflow`
- Interactive graph exploration
- Zoom, pan, and node filtering

### Additional Features
- Real-time updates (WebSocket or polling)
- Inline editing of lineage relationships
- Bulk operations (add/remove multiple links)
- Export lineage as JSON or image
- Lineage statistics (most connected artifact, etc.)

---

## 12. Success Criteria

The implementation is **complete** when:

### Functional Requirements
- ✅ `TrailOfThoughtPanel.tsx` component exists and is reusable
- ✅ `useLineage.ts` hook fetches data from `/api/hub/lineage` endpoint
- ✅ Component displays lineage as a vertical timeline with icons and timestamps
- ✅ Component is integrated into Prompt cards
- ✅ Component is integrated into Seed cards
- ✅ Component is integrated into Dojo session page header
- ✅ Component is integrated into Workbench view for file-based tabs
- ✅ Panel is collapsible with smooth animations
- ✅ Clicking a lineage node navigates to the corresponding artifact page

### Technical Requirements
- ✅ `pnpm lint` passes without errors
- ✅ `pnpm type-check` passes without errors
- ✅ No console errors during normal operation
- ✅ Component handles loading, error, and empty states gracefully

### Design Requirements
- ✅ Visual design matches brand aesthetic (dark mode, smooth animations, consistent spacing)
- ✅ Icons match artifact types (MessageSquare, FileText, Sprout, File)
- ✅ Relative timestamps are accurate (e.g., "2 days ago")
- ✅ Hover states provide clear visual feedback

### Performance Requirements
- ✅ Initial render < 100ms
- ✅ API response < 500ms (consistent with existing backend)
- ✅ Smooth 60fps animations

### Accessibility Requirements
- ✅ Semantic HTML structure
- ✅ ARIA labels for screen readers
- ✅ Keyboard navigation support
- ✅ Sufficient color contrast (WCAG AA)

---

## 13. Appendix

### A. File Structure Summary
```
components/
  hub/
    └── TrailOfThoughtPanel.tsx      # NEW
  shared/
    └── PromptCard.tsx                # MODIFIED
  seeds/
    └── seed-card.tsx                 # MODIFIED
  workbench/
    └── WorkbenchView.tsx             # MODIFIED

hooks/
  hub/
    └── useLineage.ts                 # NEW

lib/
  hub/
    └── utils.ts                      # NEW (utility functions)

app/
  dojo/
    [sessionId]/
      └── page.tsx                    # MODIFIED
```

### B. Key References
- **API Route:** `app/api/hub/lineage/[type]/[id]/route.ts`
- **Database Functions:** `lib/pglite/knowledge-links.ts`
- **Types:** `lib/hub/types.ts`
- **Design System:** `tailwind.config.ts`
- **Example Hook Pattern:** `hooks/useSeeds.ts`
- **Example Component Pattern:** `components/seeds/seed-card.tsx`
- **Relative Time Formatting:** `components/dashboard/ActivityItem.tsx`

### C. TypeScript Interfaces

```typescript
// Hook return type
interface UseLineageReturn {
  lineage: LineageNode[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  count: number;
}

// Component props
interface TrailOfThoughtPanelProps {
  artifactType: ArtifactType;
  artifactId: string;
  defaultOpen?: boolean;
  className?: string;
  maxItems?: number;
}

// LineageNode (from lib/hub/types.ts)
interface LineageNode {
  type: ArtifactType;
  id: string;
  title: string;
  content_preview: string;
  created_at: string;
  relationship?: RelationshipType;
}
```

---

**Document Status:** Ready for Implementation  
**Estimated Implementation Time:** 6-10 hours  
**Next Step:** Create detailed implementation plan (Planning phase)
