# Technical Specification: Agent Activity Panel

## Task Complexity Assessment
**Difficulty Level:** Medium

**Rationale:**
- Requires integration with existing workbench layout
- Multiple new components with interdependencies
- State management for collapse/expand behavior
- Pixel-perfect adherence to mockup specifications
- Integration with `react-resizable-panels` (already installed in package.json)
- Low architectural risk since it's primarily UI work

---

## Technical Context

### Language & Framework
- **Framework:** Next.js 14.2.24 with App Router
- **Language:** TypeScript 5.7.2
- **UI Library:** React 18.3.1
- **Styling:** Tailwind CSS 3.4.17
- **State Management:** Zustand 5.0.10

### Key Dependencies
- **react-resizable-panels:** 2.1.7 (already installed)
- **lucide-react:** 0.469.0 (for icons)
- **framer-motion:** 11.15.0 (optional for animations)
- **clsx/tailwind-merge:** For conditional styling

### Design System
Defined in `tailwind.config.ts`:
```css
Colors:
  bg-primary: #0a1e2e
  bg-secondary: #0f2838
  bg-tertiary: #1a3a4f
  text-primary: #ffffff
  text-secondary: #c5d1dd
  text-tertiary: #8a9dad
  text-accent: #f5a623
  supervisor: #f5a623
  dojo: #f39c5a
  librarian: #ffd699
  debugger: #6b7f91
```

---

## Implementation Approach

### 1. Layout Restructuring
**File:** `app/workbench/page.tsx`

**Current Structure:**
```tsx
<div className="flex flex-col h-screen">
  <TabBar />
  <Editor />
  <ActionBar />
</div>
```

**New Structure:**
```tsx
<div className="flex flex-col h-screen">
  <TabBar />
  <PanelGroup direction="horizontal">
    <Panel defaultSize={70} minSize={50}>
      <Editor />
    </Panel>
    <PanelResizeHandle />
    <Panel defaultSize={30} minSize={10} maxSize={40}>
      <AgentActivityPanel />
    </Panel>
  </PanelGroup>
  <ActionBar />
</div>
```

### 2. Component Architecture

#### 2.1 AgentActivityPanel (Main Container)
**Location:** `components/layout/AgentActivityPanel.tsx`

**Responsibilities:**
- Manage collapsed/expanded state
- Render header with title and collapse/expand button
- Render scrollable agent cards section
- Render footer with system info and activity log

**State:**
```typescript
interface AgentActivityPanelState {
  isCollapsed: boolean;
}
```

**Layout:**
```
┌──────────────────────┐
│ Header (with toggle) │
├──────────────────────┤
│                      │
│  Agent Cards         │
│  (scrollable)        │
│                      │
├──────────────────────┤
│ System Info          │
│ Activity Log         │
└──────────────────────┘
```

#### 2.2 AgentCard Component
**Location:** `components/agents/AgentCard.tsx`

**Note:** This file already exists but serves a different purpose (for the agent registry). We'll create a new component called `AgentActivityCard.tsx` to avoid conflicts.

**New Location:** `components/agents/AgentActivityCard.tsx`

**Props:**
```typescript
interface AgentActivityCardProps {
  agent: {
    id: string;
    name: string;
    icon: string;
    status: 'idle' | 'working' | 'error' | 'success';
    task?: string;
  };
  isCollapsed: boolean;
}
```

**Rendering Modes:**
- **Expanded:** Icon + Name + StatusDot + Status text + Current task
- **Collapsed:** Icon + StatusDot (with tooltip)

#### 2.3 SystemInfo Component
**Location:** `components/agents/SystemInfo.tsx`

**Data to Display:**
- Cost: Mock data (`$0.0012`)
- Duration: Mock data (`2s`)

**Styling:**
- `text-sm text-text-tertiary`

#### 2.4 ActivityLog Component
**Location:** `components/agents/ActivityLog.tsx`

**Data to Display:**
- Array of recent agent events (mock data)
- Max 5 items, reverse chronological

**Styling:**
- `text-xs text-text-tertiary`

---

## Source Code Structure Changes

### Files to Create
1. `components/layout/AgentActivityPanel.tsx` - Main panel container
2. `components/agents/AgentActivityCard.tsx` - Individual agent status card
3. `components/agents/SystemInfo.tsx` - Cost and duration display
4. `components/agents/ActivityLog.tsx` - Recent activity log

### Files to Modify
1. `app/workbench/page.tsx` - Integrate PanelGroup and AgentActivityPanel

### Files to Reference
1. `components/ui/StatusDot.tsx` - Already exists, will be reused
2. `tailwind.config.ts` - Design system reference
3. `00_Roadmap/V0.4.0_MOCKUPS_REFINED.md` - Lines 335-415 (Mockup 3)

---

## Data Model / Interface Changes

### Mock Data Structure
```typescript
// Mock agent data
interface Agent {
  id: string;
  name: string;
  icon: string;
  status: 'idle' | 'working' | 'error' | 'success';
  task?: string;
}

const MOCK_AGENTS: Agent[] = [
  {
    id: 'supervisor',
    name: 'Supervisor',
    icon: '🎯',
    status: 'working',
    task: 'Routing query...'
  },
  {
    id: 'dojo',
    name: 'Dojo',
    icon: '🧠',
    status: 'idle'
  },
  {
    id: 'librarian',
    name: 'Librarian',
    icon: '📚',
    status: 'idle'
  },
  {
    id: 'debugger',
    name: 'Debugger',
    icon: '🔍',
    status: 'idle'
  }
];

// Mock activity log
const MOCK_ACTIVITY: string[] = [
  'Routing query... (0s ago)',
  'Librarian search completed (2m ago)',
  'Dojo session started (5m ago)',
];

// Mock system metrics
const MOCK_METRICS = {
  cost: '$0.0012',
  duration: '2s'
};
```

### Future State Management
For Wave 2+, consider creating a Zustand store:
```typescript
// lib/stores/agent-activity.store.ts (future)
interface AgentActivityState {
  agents: Agent[];
  activityLog: ActivityEvent[];
  metrics: SystemMetrics;
  isCollapsed: boolean;
  toggleCollapsed: () => void;
}
```

---

## Styling Specifications

### Panel Sizing
- **Expanded:** 320px (30% default size)
- **Collapsed:** 80px (10% min size)
- **Max:** 40% of screen width

### Resize Handle
```tsx
<PanelResizeHandle 
  className="w-2 bg-bg-tertiary hover:bg-text-accent transition-colors" 
/>
```

### AgentActivityPanel Container
```css
bg-bg-secondary
border-l border-bg-tertiary
flex flex-col h-full
```

### Header
```css
padding: 16px (px-4 py-4)
border-b border-bg-tertiary
flex items-center justify-between
```

### Agent Cards Section
```css
flex-1
overflow-y-auto
padding: 16px
gap: 12px (space-y-3)
```

### Footer
```css
border-t border-bg-tertiary
padding: 16px
```

### AgentActivityCard (Expanded)
```css
padding: 12px
rounded-lg
bg-bg-primary
border border-bg-tertiary
```

### AgentActivityCard (Collapsed)
```css
display: flex
justify-content: center
padding: 8px
hover: bg-bg-tertiary
```

---

## Verification Approach

### Manual Testing
1. **Panel Resizing**
   - Verify drag handle works smoothly
   - Test min/max size constraints
   - Check responsive behavior

2. **Collapse/Expand Toggle**
   - Test button click toggles state
   - Verify expanded view shows all content
   - Verify collapsed view shows only icons
   - Test tooltip on hover in collapsed mode

3. **Component Rendering**
   - Verify all 4 agents render correctly
   - Check StatusDot colors match agent status
   - Validate system metrics display
   - Confirm activity log shows events

4. **Design System Adherence**
   - Compare with Mockup 3 (lines 335-415)
   - Verify colors match design system
   - Check spacing and typography
   - Validate border and padding values

### Automated Testing (via test commands)
```bash
npm run lint        # Check for linting errors
npm run type-check  # Ensure TypeScript types are correct
npm run build       # Verify production build succeeds
```

### Accessibility
- Collapse/expand button has aria-label
- StatusDots have aria-label (already implemented)
- Keyboard navigation works for interactive elements
- Focus states are visible

### Browser Testing
- Test in Chrome, Firefox, Safari
- Verify drag handle works on all browsers
- Check responsive behavior at different screen sizes

---

## Implementation Notes

### Phase 1: Setup Panel Layout
1. Import PanelGroup components in workbench page
2. Restructure layout to use horizontal panels
3. Add resize handle with styling
4. Verify basic layout works

### Phase 2: Create AgentActivityPanel Shell
1. Create main panel component
2. Add collapse/expand state
3. Implement header with toggle button
4. Add basic layout sections (header, content, footer)

### Phase 3: Build AgentActivityCard
1. Create new component (avoid conflict with existing AgentCard)
2. Implement expanded view
3. Implement collapsed view with tooltip
4. Add StatusDot integration

### Phase 4: Add SystemInfo and ActivityLog
1. Create SystemInfo with mock metrics
2. Create ActivityLog with mock events
3. Style according to mockup

### Phase 5: Integration and Polish
1. Assemble all components in AgentActivityPanel
2. Test collapse/expand behavior
3. Fine-tune styling to match mockup
4. Add smooth transitions

---

## Pixel-Perfect Mockup Reference

From `00_Roadmap/V0.4.0_MOCKUPS_REFINED.md` (lines 398-415):

```
Agent Panel (Expanded):
- Background: bg-secondary (#0f2838)
- Border-left: 1px solid bg-tertiary (#1a3a4f)
- Padding: 24px
- Agent cards: Stacked vertically
  - Icon: 24px
  - Name: 16px medium, white
  - Status: 14px, text-secondary
  - Task: 14px, text-tertiary
  - Status dot: 8px, pulsing if working
- Cost/Duration: 14px, text-tertiary
- Activity log: 12px, text-tertiary, max 5 items

Agent Panel (Collapsed):
- Width: 80px
- Show only icons (24px) + status dots (8px)
- Hover: Show tooltip with agent name
```

---

## Risk Assessment

### Low Risk
- react-resizable-panels is already installed ✅
- Design system is well-defined ✅
- StatusDot component exists and is reusable ✅
- No backend/API changes required ✅

### Moderate Risk
- Existing AgentCard.tsx has different purpose - mitigated by creating AgentActivityCard.tsx
- Panel resizing performance - mitigated by using well-tested library

### Mitigation Strategies
- Use distinct component names to avoid conflicts
- Test panel resizing on different screen sizes
- Keep mock data simple and hardcoded for v0.4.1
- Follow existing component patterns (StatusDot, Button, etc.)

---

## Success Criteria

✅ Panel can be resized between 10% and 40% of screen width  
✅ Collapse/expand button toggles panel state correctly  
✅ All 4 agents display with correct icons, names, and status  
✅ StatusDot component shows correct colors for each status  
✅ System metrics (cost, duration) display in footer  
✅ Activity log shows recent events  
✅ Collapsed view shows only icons with tooltips  
✅ Styling matches mockup pixel-perfect  
✅ No regressions in existing workbench functionality  
✅ Passes `npm run lint` and `npm run type-check`  
✅ Production build succeeds (`npm run build`)

---

## Future Enhancements (Not in Scope for v0.4.1)

1. **Real-time agent data** - Connect to actual agent orchestration system
2. **Agent control buttons** - Pause, resume, stop agents
3. **Detailed agent logs** - Click to expand full trace
4. **WebSocket integration** - Live updates from backend
5. **Persistent panel size** - Remember user's preferred size
6. **Animations** - Smooth transitions with Framer Motion
7. **Cost tracking graph** - Visual representation of cost over time
