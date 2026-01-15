# Technical Specification: Agent Activity Panel Collapse + Fixes

## Task Complexity Assessment: **Medium**

This task involves multiple UI changes across different components with some state management considerations. While not architecturally complex, it requires careful attention to consistent styling and ensuring proper collapsible UI controls.

---

## Technical Context

**Framework**: Next.js 14 (React 18)  
**Language**: TypeScript  
**UI Libraries**: 
- `react-resizable-panels` (v2.1.7) - for panel management
- `framer-motion` (v11.15.0) - for animations
- `lucide-react` (v0.469.0) - for icons

**Styling**: Tailwind CSS with custom color system  
**State Management**: Zustand (v5.0.10)

**Color System (Navy Theme)**:
- Primary Background: `bg-bg-primary` (#0a1e2e)
- Secondary Background: `bg-bg-secondary` (#0f2838)  
- Tertiary Background: `bg-bg-tertiary` (#1a3a4f)
- Borders: `border-bg-tertiary`
- Card styling: `bg-background` with `border-border`

---

## Implementation Approach

### 1. Make Agent Activity Panel Collapsible

**Current State**: 
- The AgentActivityPanel is in a collapsible Panel in `ResizableLayout.tsx` but has no explicit UI control
- Users can drag the resize handle to collapse it, but there's no toggle button

**Changes Required**:
- Add a collapse/expand toggle button to the AgentActivityPanel header
- Store collapse state in localStorage or a zustand store for persistence across page loads
- Add proper animations when toggling

**Files to Modify**:
- `components/layout/AgentActivityPanel.tsx` - Add toggle button UI
- Create/update store for panel state (optional, can use React state + localStorage)

### 2. Make Navigation Sidebar Collapsible

**Current State**:
- NavigationSidebar has fixed width of 240px
- No collapse functionality exists

**Changes Required**:
- Convert NavigationSidebar to support collapsed state (icon-only mode)
- Add toggle button (hamburger menu icon)
- When collapsed, show only icons without labels
- Store collapse state in localStorage for persistence
- Adjust ResizableLayout to accommodate collapsible sidebar

**Files to Modify**:
- `components/layout/NavigationSidebar.tsx` - Add collapse state and UI changes
- `components/layout/ResizableLayout.tsx` - Update layout structure if needed
- `components/layout/NavItem.tsx` - Support icon-only display mode

### 3. Remove Duplicate Agent Activity Panel on Workbench Page

**Current State**:
- `ResizableLayout.tsx` includes AgentActivityPanel globally
- `WorkbenchView.tsx` also includes its own AgentActivityPanel in a separate PanelGroup
- This creates duplicate panels on the workbench page

**Changes Required**:
- Remove the duplicate AgentActivityPanel from WorkbenchView
- Use the global panel from ResizableLayout instead
- Keep workbench-specific toggle control via workbench store

**Files to Modify**:
- `components/workbench/WorkbenchView.tsx` - Remove duplicate panel
- Ensure workbench store's `isAgentPanelOpen` state works with global panel

### 4. Update Seeds Page Styling to Match Design Guidelines

**Current State**:
- Filters panel uses generic `background`, `border`, `secondary` colors
- Search bar uses generic `background`, `border`, `muted-foreground` colors
- Seed cards use generic `card` and `border` colors
- Seed detail view uses generic backgrounds with some dark mode conditionals
- Loading/error states have grey backgrounds

**Design Issues**:
- Not using navy color palette (bg-primary, bg-secondary, bg-tertiary)
- Has black/grey backgrounds with white outlines instead of navy theme
- Inconsistent with other pages like Dashboard and Librarian

**Changes Required**:

#### Filters Panel (`components/seeds/filters-panel.tsx`):
- Replace `bg-background border-border` → `bg-bg-secondary border-bg-tertiary`
- Replace `text-foreground` → `text-text-primary`
- Replace `text-muted-foreground` → `text-text-secondary`
- Replace `bg-secondary text-secondary-foreground` → `bg-bg-tertiary/50 text-text-secondary`

#### Search Bar (`components/seeds/seeds-view.tsx`):
- Replace `bg-background text-foreground` → `bg-bg-secondary text-text-primary`
- Replace `border-border focus:border-accent` → `border-bg-tertiary focus:border-text-accent`
- Replace `placeholder:text-muted-foreground` → `placeholder:text-text-muted`

#### Seed Cards (`components/seeds/seed-card.tsx`):
- Replace `bg-card` → `bg-bg-secondary`
- Keep type-specific border colors (they're already good)
- Replace button backgrounds to use navy variants

#### Seed Detail View (`components/seeds/seed-detail-view.tsx`):
- Replace `bg-background border-border` → `bg-bg-secondary border-bg-tertiary`
- Remove dark mode conditionals where navy theme applies universally
- Update error states to use consistent styling

#### General Seed View Updates (`components/seeds/seeds-view.tsx`):
- Loading state skeletons: Replace `bg-muted` → `bg-bg-tertiary/30`
- Error states: Update red backgrounds to work with navy theme
- Empty state: Replace `bg-secondary/50` → `bg-bg-tertiary/30`

**Files to Modify**:
- `components/seeds/seeds-view.tsx`
- `components/seeds/seed-card.tsx`
- `components/seeds/seed-detail-view.tsx`
- `components/seeds/filters-panel.tsx`

---

## Data Model / API / Interface Changes

### New/Updated State Interfaces

```typescript
// For sidebar collapse state (can be in a new store or component state)
interface SidebarState {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

// For agent panel collapse (can extend existing or add new)
interface AgentPanelState {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}
```

### LocalStorage Keys

- `sidebar-collapsed`: boolean for navigation sidebar state
- `agent-panel-collapsed`: boolean for agent activity panel state

---

## Source Code Structure Changes

### New Files (Optional)
- `lib/stores/sidebar.store.ts` - If using Zustand for sidebar state
- `lib/stores/agent-panel.store.ts` - If using Zustand for panel state

### Modified Files

1. **Layout Components**:
   - `components/layout/AgentActivityPanel.tsx` - Add toggle button
   - `components/layout/NavigationSidebar.tsx` - Add collapse functionality
   - `components/layout/NavItem.tsx` - Support icon-only mode
   - `components/layout/ResizableLayout.tsx` - Coordinate panel states

2. **Workbench**:
   - `components/workbench/WorkbenchView.tsx` - Remove duplicate panel

3. **Seeds Components**:
   - `components/seeds/seeds-view.tsx` - Update colors to navy theme
   - `components/seeds/seed-card.tsx` - Update colors to navy theme
   - `components/seeds/seed-detail-view.tsx` - Update colors to navy theme
   - `components/seeds/filters-panel.tsx` - Update colors to navy theme

---

## Verification Approach

### Manual Testing

1. **Agent Activity Panel**:
   - [ ] Toggle button visible and functional
   - [ ] Panel collapses/expands smoothly
   - [ ] State persists across page refreshes
   - [ ] Works on all pages (dashboard, workbench, librarian, seeds)

2. **Navigation Sidebar**:
   - [ ] Toggle button visible and functional
   - [ ] Sidebar collapses to icon-only mode
   - [ ] Icons remain visible when collapsed
   - [ ] State persists across page refreshes
   - [ ] Content area expands when sidebar collapsed

3. **Workbench Duplicate**:
   - [ ] Only one agent activity panel visible on workbench page
   - [ ] Panel controls work correctly on workbench
   - [ ] No layout issues or overlap

4. **Seeds Styling**:
   - [ ] Filters panel uses navy colors
   - [ ] Search bar uses navy colors
   - [ ] Seed cards use navy colors consistently
   - [ ] Seed detail view uses navy colors
   - [ ] No black/grey backgrounds with white outlines
   - [ ] Consistent with Dashboard and Librarian pages
   - [ ] Loading states use navy theme
   - [ ] Error states work with navy theme

### Automated Testing

Run existing test commands:
```bash
npm run lint
npm run type-check
npm run test:seeds  # If seeds tests exist
```

### Browser Testing

Test in:
- Chrome/Edge (primary)
- Firefox
- Safari (if available)

Test responsive behavior:
- Desktop (1920x1080)
- Laptop (1366x768)
- Tablet (768px width)

---

## Implementation Notes

### Animation Guidelines
- Use framer-motion for smooth transitions
- Duration: 200-300ms for panel toggles
- Easing: `ease-out` for collapsing, `ease-in-out` for expanding

### Accessibility Considerations
- Toggle buttons must have proper `aria-label`
- Collapsed state should have `aria-expanded` attribute
- Icon-only buttons need descriptive labels
- Focus states must remain visible

### Performance
- Use CSS transforms for animations (better performance)
- Debounce resize operations if needed
- Lazy load collapsed content

### Browser Compatibility
- Ensure localStorage is available (fallback to session state)
- Test panel resize on different browsers
- Verify touch interactions on mobile devices
