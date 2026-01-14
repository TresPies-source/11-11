# Technical Specification: Agent Status Indicators

## Task Complexity
**Medium** - Moderate complexity with integration into existing activity system, multiple components to create, real-time updates, and brand-specific styling requirements.

## Technical Context

### Language & Framework
- **Next.js**: 14.2.24 (App Router)
- **React**: 18.3.1 with TypeScript 5.7.2
- **Styling**: Tailwind CSS 3.4.17 with custom Dojo Genesis brand colors
- **Animation**: Framer Motion 11.15.0
- **Icons**: lucide-react 0.469.0

### Key Dependencies
- `zustand` (5.0.10) - Optional for additional state management
- `clsx` / `tailwind-merge` - For conditional class composition

### Existing Infrastructure
- **ActivityProvider**: Already provides real-time agent activity tracking via Context API
- **useActivity hook**: Exposes current activity, history, and update methods
- **AgentActivity type**: Defined in `lib/types.ts` with status, message, progress fields
- **Brand system**: Complete color palette and agent identities in `tailwind.config.ts`
- **UI Components**: Card, StatusDot already exist in `components/ui/`

## Implementation Approach

### 1. Agent Status Management (`useAgentStatus.ts`)

**Purpose**: Manage and fetch real-time status for all agents (Supervisor, Dojo, Librarian, Debugger)

**Approach**:
- Build on top of existing `useActivity` hook rather than duplicating state
- Derive agent statuses from the ActivityProvider's current activity and history
- Implement polling mechanism (using `setInterval`) to fetch agent statuses from an API endpoint
- Support both real-time updates via polling and state-derived statuses

**Data Structure**:
```typescript
interface AgentStatusInfo {
  agentId: 'supervisor' | 'dojo' | 'librarian' | 'debugger';
  status: 'idle' | 'thinking' | 'working' | 'error';
  message?: string;
  lastActive?: string;
  progress?: number;
}

interface UseAgentStatusReturn {
  agentStatuses: Record<string, AgentStatusInfo>;
  fetchAgentStatus: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
```

**Implementation Details**:
- Poll every 2-3 seconds when component is mounted
- Clean up interval on unmount
- Merge data from ActivityProvider with API-fetched status (if API is available)
- Fallback to derived statuses from activity history if API not available

### 2. Agent Status Indicator Component (`AgentStatusIndicator.tsx`)

**Purpose**: Display a single agent's status with icon, name, and current state

**Layout**:
```
[Agent Icon] Agent Name
             Status Text
[Status Dot]
```

**Visual Specifications** (per Dojo Genesis Brand Guide):
- Agent-specific colors from tailwind config
- Icons: Use lucide-react icons matching `ActivityItem.tsx` pattern
  - Supervisor: `GitBranch` 
  - Dojo: `Brain`
  - Librarian: `Search`
  - Debugger: `Bug`
- Background: Agent color at 8% opacity (`${agentColor}1a`)
- Border: Agent color at 25% opacity on hover
- Animations:
  - Pulse effect when status is "thinking" or "working"
  - Subtle hover lift (translateY: -2px) with duration 200ms
  - Scale down slightly on click (scale: 0.98)

**Props**:
```typescript
interface AgentStatusIndicatorProps {
  agentId: 'supervisor' | 'dojo' | 'librarian' | 'debugger';
  status: 'idle' | 'thinking' | 'working' | 'error';
  message?: string;
  lastActive?: string;
  progress?: number;
}
```

**Component Structure**:
- Use `framer-motion` for animations (whileHover, transition)
- Use existing `StatusDot` component or create status-specific indicator
- Display truncated message if provided
- Show relative timestamp for lastActive

### 3. Agent Status Container Component (`AgentStatus.tsx`)

**Purpose**: Horizontal layout displaying all four agent status indicators

**Layout**:
```
[Supervisor] [Dojo] [Librarian] [Debugger]
```

**Responsive Design**:
- Desktop (≥1024px): 4 columns in single row
- Tablet (768px-1023px): 2x2 grid
- Mobile (<768px): Vertical stack

**Component Structure**:
- Fetch status using `useAgentStatus` hook
- Map over agents array to render `AgentStatusIndicator` for each
- Wrap in `Card` component (from `components/ui/Card.tsx`)
- Add section heading: "Agent Status" with appropriate styling

**Agent Order**:
```typescript
const AGENTS = [
  { id: 'supervisor', name: 'Supervisor', icon: GitBranch, color: '#f5a623' },
  { id: 'dojo', name: 'Dojo', icon: Brain, color: '#f39c5a' },
  { id: 'librarian', name: 'Librarian', icon: Search, color: '#ffd699' },
  { id: 'debugger', name: 'Debugger', icon: Bug, color: '#6b7f91' },
] as const;
```

### 4. API Integration (Optional Enhancement)

**Endpoint**: `/api/agents/status` (GET)

**Response Structure**:
```typescript
{
  "agents": [
    {
      "agent_id": "supervisor",
      "status": "idle",
      "message": null,
      "last_active": "2026-01-14T17:30:00Z"
    },
    // ... other agents
  ]
}
```

**Fallback Behavior**: If API doesn't exist, derive statuses from ActivityProvider

## Source Code Structure Changes

### New Files
```
hooks/
  └── useAgentStatus.ts          (New hook for agent status management)

components/dashboard/
  ├── AgentStatus.tsx             (Container component)
  └── AgentStatusIndicator.tsx    (Individual indicator component)
```

### Modified Files
None - All new components integrate with existing infrastructure

### Integration Points
- Dashboard page (`app/page.tsx` or dashboard route) will import and render `<AgentStatus />`
- Hook leverages existing `useActivity` from `hooks/useActivity.ts`
- Components use existing UI primitives from `components/ui/`

## Data Model / API / Interface Changes

### Type Additions to `lib/types.ts`
```typescript
export type AgentStatusType = 'idle' | 'thinking' | 'working' | 'error';

export interface AgentStatusInfo {
  agentId: 'supervisor' | 'dojo' | 'librarian' | 'debugger';
  status: AgentStatusType;
  message?: string;
  lastActive?: string;
  progress?: number;
}

export interface AgentStatusMap {
  supervisor: AgentStatusInfo;
  dojo: AgentStatusInfo;
  librarian: AgentStatusInfo;
  debugger: AgentStatusInfo;
}
```

### No Database Changes Required
All state is derived from:
1. ActivityProvider's in-memory state
2. Optional API polling (if endpoint exists)
3. LocalStorage for history (already implemented in ActivityProvider)

## Styling Guidelines

### Colors (from `tailwind.config.ts`)
- **Supervisor**: `#f5a623` (amber)
- **Dojo**: `#f39c5a` (sunset orange)
- **Librarian**: `#ffd699` (sunrise yellow)
- **Debugger**: `#6b7f91` (mountain blue-gray)
- **Success**: `#4ade80` (green)
- **Error**: `#ef4444` (red)

### Typography
- **Agent Name**: `text-sm font-medium text-text-primary`
- **Status Message**: `text-xs text-text-secondary truncate`
- **Heading**: `text-2xl font-semibold mb-6`

### Animations (per Brand Guide)
- **Duration**: 200ms (fast), 300ms (normal)
- **Easing**: `ease-out`, `ease-in-out`
- **Properties**: Animate `transform` and `opacity` for performance
- **Hover**: `translateY(-2px)` with subtle shadow
- **Active**: `scale(0.98)`
- **Working State**: Gentle pulse animation

## Verification Approach

### 1. Build Verification
```bash
npm run build
```
Expected: Clean build with no TypeScript errors

### 2. Type Checking
```bash
npm run type-check
```
Expected: No type errors in new components and hook

### 3. Linting
```bash
npm run lint
```
Expected: All files pass ESLint rules

### 4. Manual Testing Checklist
- [ ] All four agents displayed in correct order
- [ ] Agent-specific colors match brand guide
- [ ] Icons render correctly for each agent
- [ ] Status updates reflect changes in ActivityProvider
- [ ] Hover animations work smoothly (200ms duration)
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] No console errors on Dashboard load
- [ ] Status polling starts and stops correctly
- [ ] Memory leaks prevented (cleanup on unmount)
- [ ] Accessibility: proper ARIA labels and roles

### 5. Integration Testing
- [ ] Test with `RecentActivityFeed` component side-by-side
- [ ] Verify status updates when using test activity page (`/test-activity`)
- [ ] Simulate agent activities and confirm status indicators update
- [ ] Test with no activity (all agents idle)
- [ ] Test with error states

### 6. Performance Verification
- [ ] No unnecessary re-renders (use React DevTools)
- [ ] Polling interval doesn't cause performance issues
- [ ] Animations are smooth (60fps)
- [ ] Component memoization works correctly

## Implementation Plan

Given the moderate complexity, the implementation will be broken down as follows:

1. **Create Type Definitions** - Add agent status types to `lib/types.ts`
2. **Implement `useAgentStatus` Hook** - Core state management and polling logic
3. **Build `AgentStatusIndicator`** - Single agent display component
4. **Build `AgentStatus` Container** - Layout and integration
5. **Integration Testing** - Test with existing ActivityProvider
6. **Build & Verify** - Run build, lint, type-check

Each step is incrementable and testable independently.

## Risk Mitigation

### Potential Issues
1. **Polling Performance**: Frequent polling could impact performance
   - **Mitigation**: Use 2-3 second intervals, cleanup on unmount
   
2. **API Endpoint Missing**: `/api/agents/status` might not exist
   - **Mitigation**: Fallback to deriving status from ActivityProvider
   
3. **State Synchronization**: Keeping hook state in sync with ActivityProvider
   - **Mitigation**: Subscribe to ActivityContext updates directly

4. **Animation Performance**: Multiple pulsing animations could lag
   - **Mitigation**: Use CSS animations, limit to only active agents

## Success Criteria

- ✅ Real-time agent status indicators visible on Dashboard
- ✅ Each indicator shows agent name, icon, and current status
- ✅ Brand guide colors and styling applied correctly
- ✅ `useAgentStatus` hook manages state and polling
- ✅ Application builds successfully (`npm run build`)
- ✅ All tests pass (if applicable)
- ✅ Dashboard loads without console errors
- ✅ Responsive design works across breakpoints
- ✅ Smooth animations matching brand guide specifications
