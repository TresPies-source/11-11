# Product Requirements Document: Trail of Thought Panel

## 1. Executive Summary

The Trail of Thought Panel is a reusable UI component that displays the lineage of knowledge artifacts within the Dojo Genesis application. It provides users with immediate, contextual insight into how their ideas are connected by showing an artifact's source, descendants, and related discussions in a clean, vertical timeline format.

This feature is the first phase of the redesigned Knowledge Hub, focusing on delivering value directly within the user's existing workflow rather than requiring navigation to a separate page.

## 2. Background & Context

### 2.1 Current State
The Knowledge Hub backend is fully functional with:
- `/api/hub/lineage/[type]/[id]` endpoint returning lineage data
- `knowledge_links` table with full CRUD operations via PGlite
- Support for 4 artifact types: `session`, `prompt`, `seed`, `file`
- 4 relationship types: `extracted_from`, `discussed_in`, `refined_in`, `created_from`
- Session messages persisted in the database
- UI components for saving, extracting, and discussing artifacts

### 2.2 Problem Statement
Users cannot easily see how their knowledge artifacts are connected. While the backend tracks these relationships, there's no visible representation of lineage within the UI where users are already working.

### 2.3 Goals
- **Primary Goal**: Provide contextual lineage visualization where users already work (Library, Seeds, Dojo, Workbench)
- **Secondary Goal**: Create a reusable foundation for future Hub v2 page with advanced visualizations
- **User Experience Goal**: Make knowledge connections discoverable without disrupting workflow

## 3. User Stories

### US-1: Prompt Lineage in Library
**As a** user browsing prompts in my Library  
**I want to** see where a prompt came from and what was created from it  
**So that** I can understand its context and related artifacts without leaving the Library page

**Acceptance Criteria:**
- Trail of Thought panel is visible on Prompt cards
- Panel shows relationships like "Discussed in [Session]" or "Refined in [File]"
- Clicking a lineage node navigates to that artifact's page
- Panel is collapsible to reduce visual clutter

### US-2: Seed Lineage in Garden
**As a** user reviewing seeds in the Garden  
**I want to** see which sessions or prompts a seed originated from  
**So that** I can trace back the full context of my ideas

**Acceptance Criteria:**
- Trail of Thought panel is visible on Seed cards
- Panel shows source relationships like "Extracted from [Session]"
- Panel shows descendant relationships like "Planted in [Workbench File]"
- Visual design matches seed card aesthetic

### US-3: Session Context in Dojo
**As a** user in an active Dojo session  
**I want to** see what artifacts were injected into or created from this session  
**So that** I can understand the session's relationship to my broader knowledge graph

**Acceptance Criteria:**
- Trail of Thought panel is visible in the Dojo session header
- Panel shows artifacts discussed in the session
- Panel shows artifacts created from the session
- Panel updates dynamically if new artifacts are linked during the session

### US-4: Workbench File Lineage
**As a** user working on a file in the Workbench  
**I want to** see what prompted this file's creation and where it's been used  
**So that** I can maintain context while editing

**Acceptance Criteria:**
- Trail of Thought panel is visible when viewing a saved Workbench file
- Panel shows source artifacts (e.g., "Created from [Prompt]")
- Panel only displays for file-based tabs (not ephemeral welcome tabs)
- Panel integrates cleanly with existing Workbench layout

## 4. Functional Requirements

### FR-1: Component Architecture
**Priority: P0**
- Create a reusable `TrailOfThoughtPanel` React component
- Component accepts `artifactType` and `artifactId` as props
- Component fetches data from existing `/api/hub/lineage/[type]/[id]` endpoint
- Component handles loading, error, and empty states
- Component supports dark mode (application default)

### FR-2: Data Fetching
**Priority: P0**
- Use custom React hook pattern (consistent with codebase - no SWR/React Query)
- Fetch lineage data on component mount
- Cache fetched data to prevent unnecessary refetches
- Handle authentication (dev mode vs. production)
- Display appropriate error messages if fetch fails

### FR-3: Visual Design
**Priority: P0**
- Display lineage as a vertical timeline
- Use lucide-react icons for artifact types:
  - `MessageSquare` for sessions
  - `FileText` for prompts
  - `Sprout` for seeds
  - `File` for workbench files
- Use relationship-specific labels (e.g., "Discussed in", "Extracted from", "Refined in")
- Match existing design system colors and spacing
- Include relative timestamps (e.g., "2 days ago")

### FR-4: Interaction Design
**Priority: P0**
- Panel is collapsible (default state: collapsed)
- Clicking a lineage node navigates to that artifact's page
- Hover states on interactive elements
- Smooth expand/collapse animation using framer-motion

### FR-5: Integration Points
**Priority: P0**

#### a. Prompt Card Integration
- Add panel to card footer/bottom section
- Pass `type="prompt"` and `id={prompt.id}`
- Display below action buttons
- Respect existing card layout and spacing

#### b. Seed Card Integration
- Add panel to card footer/bottom section
- Pass `type="seed"` and `id={seed.id}`
- Display below status buttons
- Match seed card visual style

#### c. Dojo Session Integration
- Add panel to session header area
- Pass `type="session"` and `id={sessionId}`
- Position next to "Save Session" button or in a dedicated area
- Ensure it doesn't interfere with session title input

#### d. Workbench Integration
- Add panel to ActionBar or as a new collapsible section
- Only display when active tab has a `fileId` (saved file)
- Pass `type="file"` and `id={fileId}`
- Consider placement: action bar, right sidebar, or new panel

### FR-6: Performance Requirements
**Priority: P1**
- Initial render < 100ms
- Data fetch completion < 500ms (consistent with existing backend performance)
- Smooth 60fps animations
- No layout shift when panel expands/collapses

## 5. Non-Functional Requirements

### NFR-1: Accessibility
- Semantic HTML structure
- ARIA labels for screen readers
- Keyboard navigation support
- Sufficient color contrast (WCAG AA)

### NFR-2: Code Quality
- TypeScript with strict type checking
- Follow existing codebase patterns
- Component must be testable
- Comprehensive JSDoc comments

### NFR-3: Maintainability
- Reusable across all four integration points
- Easy to extend for future artifact types
- Clear separation of concerns (presentation vs. data fetching)

## 6. Technical Constraints

### TC-1: Technology Stack
- Must use: React 18, TypeScript, Next.js 14 App Router
- Must use: Tailwind CSS for styling
- Must use: framer-motion for animations
- Must use: lucide-react for icons
- Must NOT use: SWR, React Query (not in current stack)

### TC-2: Browser Support
- Modern browsers only (Chrome, Firefox, Safari, Edge)
- Dark mode only (no light mode required)

### TC-3: Backend Contract
- Must use existing `/api/hub/lineage/[type]/[id]` endpoint
- No backend modifications required
- Response format:
  ```typescript
  {
    artifact: { type: ArtifactType, id: string },
    lineage: LineageNode[],
    count: number
  }
  ```

## 7. Out of Scope (Future Phases)

### Phase 2 - Hub v2 Page
- Dedicated `/hub` page with activity feed
- Filtering by artifact type and date
- Bulk lineage operations

### Phase 3 - Graph Visualization
- "View as Graph" toggle
- Force-directed graph with react-force-graph or similar
- Interactive graph exploration

### Not Planned
- Editing lineage relationships in the UI (backend supports it, but UI not required yet)
- Real-time collaboration features
- Lineage export to external formats

## 8. Success Metrics

### Quantitative
- Component successfully integrated into all 4 locations
- All lineage data fetched and displayed correctly
- Zero console errors during normal operation
- Lighthouse accessibility score > 90

### Qualitative
- Visual design matches brand aesthetic
- Animations feel smooth and polished
- Component is intuitive without documentation
- Code is readable and maintainable

## 9. Dependencies & Risks

### Dependencies
- Existing `/api/hub/lineage` endpoint (COMPLETE ✅)
- `LineageNode` and `ArtifactType` types (COMPLETE ✅)
- `getLineage()` database function (COMPLETE ✅)
- Integration points: PromptCard, seed-card, Dojo page, WorkbenchView (EXIST ✅)

### Risks & Mitigations
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Lineage data is empty for most artifacts | Medium | Medium | Design empty state that encourages users to create connections |
| Performance issues with large lineage graphs | Medium | Low | Limit initial display to 10 nodes, add "Show more" option |
| Layout conflicts in integration points | High | Medium | Use collapsible design by default, test thoroughly |
| Unclear navigation paths | Medium | Medium | Add tooltips, ensure clear visual affordances |

## 10. Open Questions & Assumptions

### Assumptions Made
1. **Visual Style**: Timeline will use modern UI components (not ASCII art) consistent with the design system
2. **Default State**: Panel is collapsed by default to minimize visual clutter
3. **Navigation**: Clicking a lineage node navigates to that artifact's dedicated page (not modal)
4. **Workbench Placement**: Panel will be integrated into the ActionBar as a collapsible section
5. **Empty State**: If no lineage exists, show a friendly message like "No connections yet"
6. **Update Frequency**: Lineage data is fetched once on mount, not updated in real-time

### Questions for Clarification
1. **Workbench UX**: Should the panel be in the ActionBar, a new sidebar tab, or a floating panel?
   - **Current Assumption**: ActionBar with collapsible section
2. **Maximum Display**: Should there be a limit on lineage nodes displayed initially?
   - **Current Assumption**: Display all, add pagination if > 20 nodes
3. **Bidirectional Display**: Should we distinguish between "upstream" (sources) and "downstream" (descendants)?
   - **Current Assumption**: Yes, use visual separators or grouping
4. **Relationship Icons**: Should different relationship types have different icons/colors?
   - **Current Assumption**: Same icon per artifact type, different text labels per relationship

## 11. Timeline & Deliverables

### Estimated Effort: 6-10 hours
- **Phase 1A**: Component Development (3-4 hours)
  - Create TrailOfThoughtPanel component
  - Implement data fetching hook
  - Style and animate component
  - Handle edge cases (loading, error, empty)

- **Phase 1B**: Integration (2-3 hours)
  - Integrate into PromptCard
  - Integrate into seed-card
  - Integrate into Dojo session page
  - Integrate into WorkbenchView

- **Phase 1C**: Polish & Testing (1-2 hours)
  - Visual polish and animation refinement
  - Accessibility testing
  - Cross-component testing
  - Documentation

### Deliverables
1. `components/hub/TrailOfThoughtPanel.tsx` - Main component
2. `hooks/useLineage.ts` - Data fetching hook (if needed)
3. Updated integration files (4 files)
4. Unit tests (if required by project standards)

## 12. Acceptance Criteria Summary

The feature is **complete** when:
- ✅ `TrailOfThoughtPanel.tsx` component exists and is reusable
- ✅ Component successfully fetches lineage from `/api/hub/lineage` endpoint
- ✅ Component displays lineage as a vertical timeline with icons and timestamps
- ✅ Component is integrated into Prompt cards
- ✅ Component is integrated into Seed cards  
- ✅ Component is integrated into Dojo session page header
- ✅ Component is integrated into Workbench view for file-based tabs
- ✅ Panel is collapsible with smooth animations
- ✅ Clicking a lineage node navigates to the corresponding artifact page
- ✅ Visual design matches brand aesthetic (dark mode, smooth animations, consistent spacing)
- ✅ `pnpm lint` passes without errors
- ✅ `pnpm type-check` passes without errors
- ✅ No console errors during normal operation
- ✅ Component handles loading, error, and empty states gracefully

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-15  
**Status**: Ready for Technical Specification
