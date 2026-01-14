# Technical Specification: Agent Status & Activity Indicators (v0.3.9)

**Task ID**: v0-3-9-agent-status-activity-ind-e3cb  
**Complexity**: Medium  
**Duration**: 1-2 weeks  
**Version**: 1.0  
**Date**: January 14, 2026

---

## 1. Executive Summary

Implement a real-time agent status and activity tracking system that provides transparent visibility into multi-agent operations. Users will see which agent is active, what it's doing, progress indicators for long operations, and agent handoff visualizations.

**Key Deliverables:**
- Agent activity tracking context provider
- Real-time status UI components (fixed position status indicator)
- Activity history and handoff visualization
- Integration with existing Supervisor, Librarian, and Dojo agents
- Harness Trace integration for event logging

---

## 2. Technical Context

### 2.1 Language & Framework
- **Language**: TypeScript 5.7.2
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18.3.1
- **Styling**: Tailwind CSS 3.4.17
- **Animations**: Framer Motion 11.15.0
- **Icons**: Lucide React 0.469.0

### 2.2 Existing Dependencies (No New Dependencies Required)
All required dependencies are already installed:
- `mitt@^3.0.1` - Event bus (already used for ContextBus)
- `framer-motion@^11.15.0` - Animations
- `lucide-react@^0.469.0` - Icons
- `@electric-sql/pglite@^0.3.14` - Database

### 2.3 State Management Pattern
**Critical Finding**: The project uses **React Context API**, NOT Zustand.

**Existing Context Providers:**
- `RepositoryProvider` - File/tab state management
- `ContextBusProvider` - Event bus using `mitt`
- `SyncStatusProvider` - Sync operation status
- `ThemeProvider` - Dark/light mode

**Pattern to Follow:**
```typescript
// Create context
export const ActivityContext = createContext<ActivityContextValue | undefined>(undefined);

// Provider with useMemo for context value
export function ActivityProvider({ children }: ActivityProviderProps) {
  const [state, setState] = useState(...);
  
  const contextValue = useMemo(
    () => ({ ...state, ...actions }),
    [dependencies]
  );
  
  return (
    <ActivityContext.Provider value={contextValue}>
      {children}
    </ActivityContext.Provider>
  );
}

// Custom hook
export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within ActivityProvider');
  }
  return context;
}
```

### 2.4 Animation Standards
**Existing Constants** (`lib/constants.ts`):
```typescript
export const ANIMATION_EASE = [0.4, 0.0, 0.2, 1]; // Material Design ease
```

**Duration Standards:**
- Quick transitions: 200ms
- Normal transitions: 250-300ms
- Never exceed 300ms (per "Hardworking" aesthetic)

### 2.5 Theme System
**Dark Mode Support**: All components must support light/dark mode using Tailwind's `dark:` prefix.

**Color Pattern:**
```typescript
// Light mode
className="bg-white border-gray-200 text-gray-900"

// Dark mode
className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
```

### 2.6 Agent System Architecture

**Agent Registry** (`lib/agents/registry.json`):
```json
{
  "agents": [
    {
      "id": "dojo",
      "name": "Dojo",
      "description": "Thinking partnership and synthesis",
      "when_to_use": [...],
      "when_not_to_use": [...],
      "default": true
    },
    {
      "id": "librarian",
      "name": "Librarian",
      "description": "Semantic search and retrieval",
      ...
    },
    {
      "id": "debugger",
      "name": "Debugger",
      "description": "Conflict resolution and validation",
      ...
    }
  ]
}
```

**Existing Agent Colors & Icons:**
- **Dojo**: Blue (`bg-blue-100 dark:bg-blue-900/30`), Brain icon
- **Librarian**: Green (`bg-green-100 dark:bg-green-900/30`), Search icon
- **Debugger**: Amber (`bg-amber-100 dark:bg-amber-900/30`), Bug icon

**Missing from Task Spec**: "Supervisor" agent mentioned in task but NOT in registry. Will use router/supervisor context, not a separate agent.

### 2.7 Harness Trace Integration

**Existing System** (`lib/harness/trace.ts`):
```typescript
// Start a trace
startTrace(sessionId: string, userId: string): HarnessTrace

// Log event
logEvent(
  eventType: HarnessEventType,
  inputs: Record<string, any>,
  outputs: Record<string, any>,
  metadata: HarnessMetadata
): string

// Start/end spans for nested operations
startSpan(eventType: HarnessEventType, inputs: any, metadata?: any): string
endSpan(spanId: string, outputs: any, metadata?: any): void

// Check if trace is active
isTraceActive(): boolean
```

**Event Types** (from `lib/harness/types.ts`):
- `AGENT_ROUTING` - Supervisor routing decisions
- `AGENT_RESPONSE` - Agent responses
- `TOOL_INVOCATION` - Tool/function calls
- `ERROR` - Error events
- `MODE_TRANSITION` - Mode changes

**Integration Strategy**: Activity tracking should emit Harness Trace events (graceful fallback if no active trace).

---

## 3. Implementation Approach

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    App Layout (Root)                        │
│  - ActivityProvider wraps entire app                        │
│  - ActivityStatus component (fixed position)                │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    ┌───▼───────────┐    ┌────────▼──────────┐
    │   Agents      │    │   UI Components    │
    │  (emit events)│    │  (consume state)   │
    └───────────────┘    └───────────────────┘
         │                        │
         │  setActivity()         │  useActivity()
         └────────────┬───────────┘
                      │
            ┌─────────▼──────────┐
            │  ActivityProvider  │
            │   (React Context)  │
            │                    │
            │  - current         │
            │  - history         │
            │  - setActivity     │
            │  - clearActivity   │
            │  - addToHistory    │
            └────────────────────┘
```

### 3.2 Data Models

**AgentActivity** (new type):
```typescript
// lib/types.ts (add to existing types)
export interface AgentActivity {
  agent_id: string; // 'dojo' | 'librarian' | 'debugger' | 'supervisor'
  status: 'idle' | 'active' | 'waiting' | 'complete' | 'error';
  message: string; // Human-readable status message
  progress?: number; // 0-100 for determinate progress
  started_at: string; // ISO 8601 timestamp
  ended_at?: string; // ISO 8601 timestamp (when complete)
  estimated_duration?: number; // Seconds (optional)
  metadata?: Record<string, any>; // Additional data
}

export interface ActivityContextValue {
  current: AgentActivity | null;
  history: AgentActivity[];
  setActivity: (activity: AgentActivity) => void;
  updateActivity: (updates: Partial<AgentActivity>) => void;
  clearActivity: () => void;
  addToHistory: (activity: AgentActivity) => void;
}
```

**Agent Metadata** (already exists in `lib/agents/types.ts`):
```typescript
export interface Agent {
  id: string;
  name: string;
  description: string;
  when_to_use: string[];
  when_not_to_use: string[];
  default: boolean;
}
```

### 3.3 State Management Strategy

**Context Provider** (`components/providers/ActivityProvider.tsx`):
- Manages `current` activity (single active operation)
- Maintains `history` array (last 10 activities)
- Provides actions: `setActivity`, `updateActivity`, `clearActivity`, `addToHistory`
- Persists history to `localStorage` (for session continuity)
- Emits Harness Trace events (if trace active)

**State Transitions:**
```
[null] → setActivity() → [active] → updateActivity() → [active with progress] → clearActivity() → [null]
                            ↓
                      addToHistory()
                            ↓
                       [history array]
```

### 3.4 Agent Integration Points

**1. Supervisor Router** (`lib/agents/supervisor.ts`):
- **Location**: `routeQuery()` function (line 308)
- **Integration**: Add activity tracking at routing start/end
- **Events**:
  - Start: "Analyzing query and selecting agent..."
  - Progress: "Routing to {agentName}..." (50%)
  - Complete: "Routed to {agentName}"
  - Error: "Routing failed"

**2. Librarian Agent** (`lib/agents/librarian-handler.ts`):
- **Location**: `handleLibrarianQuery()` function (line 158)
- **Integration**: Add activity tracking at search stages
- **Events**:
  - Start: "Searching library for relevant prompts..." (0%)
  - Progress: "Generating query embedding..." (20%)
  - Progress: "Searching database..." (50%)
  - Progress: "Ranking results..." (80%)
  - Complete: "Found {count} results" (100%)
  - Error: "Search failed"

**3. Dojo Agent** (not yet implemented):
- **Future Integration**: Add activity tracking when Dojo agent is implemented
- **Placeholder**: Skip Dojo integration in initial implementation

### 3.5 Harness Trace Integration

**Pattern** (add to agent functions):
```typescript
import { logEvent, isTraceActive } from '@/lib/harness/trace';

// Log activity start
if (isTraceActive()) {
  logEvent('AGENT_ACTIVITY_START', 
    { agent_id: 'librarian', message: 'Starting search' },
    {},
    { duration_ms: 0 }
  );
}

// Log activity progress
if (isTraceActive()) {
  logEvent('AGENT_ACTIVITY_PROGRESS',
    { agent_id: 'librarian', progress: 50 },
    { status: 'embedding_generated' },
    { duration_ms: Date.now() - startTime }
  );
}

// Log activity complete
if (isTraceActive()) {
  logEvent('AGENT_ACTIVITY_COMPLETE',
    { agent_id: 'librarian' },
    { results_count: results.length },
    { duration_ms: Date.now() - startTime }
  );
}
```

**Note**: Harness Trace events are **supplemental** to activity tracking. Activity state is the source of truth for UI updates.

---

## 4. Source Code Structure Changes

### 4.1 New Files

**Provider & Hook:**
```
components/providers/ActivityProvider.tsx  - Activity context provider
hooks/useActivity.ts                       - Custom hook to access activity context
```

**UI Components:**
```
components/activity/ActivityStatus.tsx      - Fixed position status indicator
components/activity/ActivityHistory.tsx     - Activity history list
components/activity/HandoffVisualization.tsx - Agent path visualization
components/activity/AgentAvatar.tsx         - Agent icon with animations
```

**Types:**
```
lib/types.ts                                - Add AgentActivity and ActivityContextValue interfaces
```

### 4.2 Modified Files

**Agent Integration:**
```
lib/agents/supervisor.ts                    - Add activity tracking to routeQuery()
lib/agents/librarian-handler.ts             - Add activity tracking to handleLibrarianQuery()
```

**Layout Integration:**
```
app/layout.tsx                              - Wrap app with ActivityProvider
                                            - Add ActivityStatus component
```

**Session Page:**
```
app/session/[id]/page.tsx                   - (Future) Add ActivityHistory and HandoffVisualization
```

**Harness Trace Types:**
```
lib/harness/types.ts                        - Add new event types:
                                              - AGENT_ACTIVITY_START
                                              - AGENT_ACTIVITY_PROGRESS
                                              - AGENT_ACTIVITY_COMPLETE
```

### 4.3 No Changes Required

**Existing Components** (reuse as-is):
- `components/agents/AgentStatusBadge.tsx` - Badge component for agent display
- `lib/agents/registry.json` - Agent metadata
- `lib/harness/trace.ts` - Trace logging system

---

## 5. Data Model & API Changes

### 5.1 Type Additions

**File**: `lib/types.ts`

Add:
```typescript
export interface AgentActivity {
  agent_id: string;
  status: 'idle' | 'active' | 'waiting' | 'complete' | 'error';
  message: string;
  progress?: number;
  started_at: string;
  ended_at?: string;
  estimated_duration?: number;
  metadata?: Record<string, any>;
}

export interface ActivityContextValue {
  current: AgentActivity | null;
  history: AgentActivity[];
  setActivity: (activity: AgentActivity) => void;
  updateActivity: (updates: Partial<AgentActivity>) => void;
  clearActivity: () => void;
  addToHistory: (activity: AgentActivity) => void;
}
```

### 5.2 Harness Trace Event Types

**File**: `lib/harness/types.ts`

Add to `HarnessEventType` union:
```typescript
export type HarnessEventType =
  | 'USER_INPUT'
  | 'AGENT_ROUTING'
  | 'AGENT_RESPONSE'
  | 'TOOL_INVOCATION'
  | 'ERROR'
  | 'MODE_TRANSITION'
  | 'AGENT_ACTIVITY_START'    // New
  | 'AGENT_ACTIVITY_PROGRESS' // New
  | 'AGENT_ACTIVITY_COMPLETE'; // New
```

### 5.3 LocalStorage Schema

**Key**: `activity-history`

**Schema**:
```json
{
  "history": [
    {
      "agent_id": "librarian",
      "status": "complete",
      "message": "Found 5 results",
      "progress": 100,
      "started_at": "2026-01-14T12:00:00Z",
      "ended_at": "2026-01-14T12:00:05Z"
    }
  ],
  "version": 1
}
```

**Max Size**: Last 10 activities (FIFO queue)

---

## 6. UI Component Specifications

### 6.1 AgentAvatar Component

**Purpose**: Display agent icon with active/inactive states

**Props**:
```typescript
interface AgentAvatarProps {
  agentId: 'supervisor' | 'dojo' | 'librarian' | 'debugger';
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  isActive?: boolean;
}
```

**Visual Design**:
- **Sizes**: sm (32px), md (48px), lg (64px)
- **Active State**: Pulsing ring animation (2s duration, infinite)
- **Icons**: Reuse existing agent icons from `AgentStatusBadge`
- **Colors**: Match existing agent color scheme

**Accessibility**:
- `role="img"`
- `aria-label="{Agent Name} - {Active/Inactive}"`

### 6.2 ActivityStatus Component

**Purpose**: Fixed position status indicator showing current agent activity

**Location**: Fixed bottom-right corner (bottom: 16px, right: 16px)

**Layout**:
```
┌─────────────────────────────────────┐
│ [Avatar]  Librarian                 │
│           Searching library...      │
│           ━━━━━━━━━━━━━━━━━ 50%    │
│           ~3s remaining             │
└─────────────────────────────────────┘
```

**States**:
- **Null**: Hidden (no current activity)
- **Active**: Visible with spinner and progress bar (if progress defined)
- **Complete**: Brief success animation (checkmark), then fade out
- **Error**: Red border, error icon, persist until dismissed

**Animations**:
- **Enter**: Slide up + fade in (250ms)
- **Exit**: Fade out (200ms)
- **Progress Bar**: Smooth width transition (300ms ease)

**Accessibility**:
- `role="status"`
- `aria-live="polite"`
- `aria-atomic="true"`

### 6.3 ActivityHistory Component

**Purpose**: List of recent agent activities

**Location**: Session page or dashboard (not fixed position)

**Layout**:
```
Activity History
┌─────────────────────────────────────┐
│ [Avatar] Librarian - 12:00 PM       │
│          Found 5 results         ✓  │
├─────────────────────────────────────┤
│ [Avatar] Supervisor - 11:59 AM      │
│          Routed to Librarian     ✓  │
└─────────────────────────────────────┘
```

**Features**:
- **Max Items**: 10 (FIFO)
- **Timestamps**: Relative time ("2 minutes ago")
- **Status Icons**: ✓ (success), ✗ (error), ⏳ (waiting)

### 6.4 HandoffVisualization Component

**Purpose**: Show agent path (Supervisor → Librarian → Dojo)

**Layout**:
```
Agent Path
┌─────────────────────────────────────┐
│ [Supervisor] → [Librarian] → [Dojo] │
└─────────────────────────────────────┘
```

**Features**:
- **Deduplicate**: Remove consecutive duplicate agent IDs
- **Min Path Length**: 2 agents (hide if < 2)
- **Arrow Animation**: Subtle flow animation (optional)

---

## 7. Verification Approach

### 7.1 Type Checking
```bash
npm run type-check
```
**Expected**: 0 TypeScript errors

### 7.2 Linting
```bash
npm run lint
```
**Expected**: 0 ESLint errors/warnings

### 7.3 Build Verification
```bash
npm run build
```
**Expected**: Successful production build

### 7.4 Manual Testing Scenarios

**Scenario 1: Supervisor Routing**
1. Navigate to multi-agent session
2. Send query: "Help me plan my budget"
3. **Verify**: ActivityStatus shows "Supervisor - Analyzing query..."
4. **Verify**: Progress updates to "Routing to Dojo..."
5. **Verify**: Status completes and fades out

**Scenario 2: Librarian Search**
1. Navigate to multi-agent session
2. Send query: "Search for budget prompts"
3. **Verify**: ActivityStatus shows "Librarian - Searching library..."
4. **Verify**: Progress bar updates (0% → 20% → 50% → 100%)
5. **Verify**: Status shows "Found N results"

**Scenario 3: Error Handling**
1. Disconnect network
2. Send query
3. **Verify**: ActivityStatus shows error state (red border)
4. **Verify**: Error message displayed
5. **Verify**: Retry button appears (optional)

**Scenario 4: Activity History**
1. Complete 3-5 operations
2. Navigate to session page
3. **Verify**: ActivityHistory shows last 10 operations
4. **Verify**: Timestamps are relative ("2 minutes ago")
5. **Verify**: Status icons are correct (✓/✗)

**Scenario 5: Handoff Visualization**
1. Trigger multi-agent handoff (Supervisor → Librarian → Dojo)
2. Navigate to session page
3. **Verify**: HandoffVisualization shows agent path
4. **Verify**: Arrows connect agents
5. **Verify**: Duplicate agents are deduplicated

### 7.5 Accessibility Testing

**Keyboard Navigation**:
- Tab through interactive elements
- Verify focus indicators
- Verify keyboard shortcuts (if applicable)

**Screen Reader**:
- Use NVDA/JAWS to verify announcements
- Verify `aria-live` regions announce status updates
- Verify `role` attributes are correct

**Color Contrast**:
- Verify WCAG 2.1 AA compliance
- Test light and dark modes
- Verify status colors are distinguishable

### 7.6 Performance Validation

**Metrics to Measure**:
- **Activity Update Latency**: <50ms from `setActivity()` to UI update
- **Animation Frame Rate**: 60fps (no frame drops)
- **Bundle Size Impact**: <5KB (uncompressed)
- **Memory Leaks**: None (test with 100+ activity updates)

**Tools**:
- React DevTools Profiler
- Chrome Performance tab
- `npm run analyze` for bundle size

---

## 8. Deferred Features (v0.4.0+)

### 8.1 Real-Time Cost Tracking
**Reason**: Cost tracking infrastructure exists but is not integrated with activity tracking yet.

**Future Work**:
- Add `cost_usd` field to `AgentActivity`
- Display cumulative cost in ActivityStatus
- Cost per operation in ActivityHistory

### 8.2 Activity Export
**Reason**: Low priority for MVP, adds complexity.

**Future Work**:
- Export activity history as JSON
- Export activity history as CSV
- Export to Notion/Linear/Jira

### 8.3 Activity Filters
**Reason**: Not needed until activity history is large.

**Future Work**:
- Filter by agent (Dojo, Librarian, etc.)
- Filter by status (success, error, etc.)
- Filter by time range (last hour, last day, etc.)

### 8.4 Browser Notifications
**Reason**: Requires permissions, adds complexity.

**Future Work**:
- Notify user when long operation completes
- Desktop notifications for errors
- Sound effects (optional, user preference)

---

## 9. Risk Assessment & Mitigation

### 9.1 Risk: State Management Complexity
**Impact**: Medium  
**Probability**: Low

**Mitigation**:
- Use simple React Context (existing pattern)
- Keep state minimal (current + history)
- No complex state transitions

### 9.2 Risk: Performance Degradation
**Impact**: Medium  
**Probability**: Low

**Mitigation**:
- Use `useMemo` for context value
- Use `useCallback` for actions
- Debounce rapid state updates (if needed)
- Monitor performance with React DevTools

### 9.3 Risk: Agent Integration Errors
**Impact**: High  
**Probability**: Low

**Mitigation**:
- Graceful error handling (try-catch all activity updates)
- Non-blocking agent operations (activity tracking never throws)
- Fallback to basic status messages if activity tracking fails
- Comprehensive testing of agent integration points

### 9.4 Risk: Harness Trace Conflicts
**Impact**: Low  
**Probability**: Low

**Mitigation**:
- Check `isTraceActive()` before emitting events
- Use separate event types (`AGENT_ACTIVITY_*`)
- Harness Trace is optional (graceful degradation)

---

## 10. Testing Strategy

### 10.1 Unit Tests (Deferred to Implementation)
- `ActivityProvider` state transitions
- `useActivity` hook error handling
- `AgentAvatar` rendering states
- `ActivityStatus` visibility logic

### 10.2 Integration Tests (Deferred to Implementation)
- Supervisor routing → activity tracking
- Librarian search → progress updates
- Harness Trace event emission
- LocalStorage persistence

### 10.3 E2E Tests (Deferred to Implementation)
- Full user flow: query → routing → search → results
- Activity history accumulation
- Error state handling
- Multi-agent handoff visualization

### 10.4 Manual Testing (Required)
- All scenarios in Section 7.4
- Accessibility testing (Section 7.5)
- Performance validation (Section 7.6)

---

## 11. Documentation Requirements

### 11.1 JOURNAL.md Update
Add section documenting:
- Activity tracking architecture
- Agent integration approach
- UI component design
- Animation and UX decisions
- Performance considerations

### 11.2 Component README
**File**: `components/activity/README.md`

Contents:
- Overview of activity tracking system
- Usage examples
- Component API reference
- Integration guide for new agents
- Troubleshooting common issues

### 11.3 AUDIT_LOG.md Update
Add entry summarizing:
- Feature completion status
- Test results (unit, integration, E2E, manual)
- UX improvements delivered
- Known limitations and deferred features

---

## 12. Acceptance Criteria

### 12.1 Must Have (Critical)

- [ ] ActivityProvider created and integrated
- [ ] ActivityStatus component working (fixed position, real-time updates)
- [ ] ActivityHistory component working
- [ ] HandoffVisualization component working
- [ ] Supervisor agent integration complete
- [ ] Librarian agent integration complete
- [ ] All TypeScript errors resolved (`npm run type-check`)
- [ ] All ESLint warnings/errors resolved (`npm run lint`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Zero regressions in existing features
- [ ] JOURNAL.md updated
- [ ] AUDIT_LOG.md updated

### 12.2 Should Have (Important)

- [ ] Smooth animations (60fps, 200-300ms durations)
- [ ] Dark mode support
- [ ] Progress bars for long operations (>2s)
- [ ] Harness Trace integration (graceful fallback)
- [ ] LocalStorage persistence
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Component README.md created

### 12.3 Nice to Have (Optional)

- [ ] Real-time cost indicator (deferred to v0.4.0)
- [ ] Activity export (deferred to v0.4.0)
- [ ] Browser notifications (deferred to v0.4.0)
- [ ] Unit tests (recommended but not blocking)
- [ ] E2E tests (recommended but not blocking)

---

## 13. Implementation Sequence

**Recommended Order** (to be detailed in `plan.md`):

1. **Phase 1: Foundation (Week 1, Days 1-3)**
   - Create type definitions
   - Implement ActivityProvider
   - Create useActivity hook
   - Add to app layout
   - Test state management

2. **Phase 2: UI Components (Week 1, Days 3-5)**
   - Create AgentAvatar component
   - Create ActivityStatus component
   - Create ActivityHistory component
   - Create HandoffVisualization component
   - Test UI rendering and animations

3. **Phase 3: Agent Integration (Week 1-2, Days 6-8)**
   - Integrate Supervisor router
   - Integrate Librarian handler
   - Add Harness Trace events
   - Test agent operations

4. **Phase 4: Polish & Testing (Week 2, Days 9-10)**
   - Accessibility testing
   - Performance testing
   - Manual testing (all scenarios)
   - Bug fixes
   - Documentation

5. **Phase 5: Verification (Week 2, Days 11-12)**
   - Final lint/type-check
   - Production build test
   - Regression testing
   - JOURNAL.md and AUDIT_LOG.md updates
   - Create implementation report

---

## 14. Success Metrics

### 14.1 Stability (Must Be Excellent: 10/10)
- Zero P0/P1 bugs
- Zero regressions
- All edge cases handled
- Graceful error handling

### 14.2 Usability (Must Be Excellent: 10/10)
- Clear, informative status messages
- Helpful progress indicators
- Accessible to all users
- No confusion about agent activity

### 14.3 Beauty (Must Be Very Good: 8-9/10)
- Smooth, polished animations
- Professional visual design
- Consistent with existing UI
- Dark mode support

### 14.4 Performance (Must Be Very Good: 8-9/10)
- Activity updates <50ms
- 60fps animations
- <5KB bundle size impact
- No memory leaks

---

## 15. Notes & Considerations

### 15.1 Windows Bash Compatibility
- Use semicolons (`;`) instead of `&&` for command chaining
- Use forward slashes (`/`) for paths
- Avoid Unix-specific commands (e.g., `grep`, `awk`)

### 15.2 Dev Mode Support
- Activity tracking should work in dev mode (no API keys required)
- Use mock data for testing when agents not available
- Graceful degradation if Harness Trace not active

### 15.3 Accessibility First
- All interactive elements have proper ARIA labels
- Keyboard navigation fully supported
- Color contrast meets WCAG 2.1 AA
- Screen reader announcements for status updates

### 15.4 Performance Monitoring
- Use React DevTools Profiler to measure render performance
- Monitor bundle size with `npm run analyze`
- Test with 100+ activity updates to check for memory leaks
- Measure activity update latency (<50ms target)

---

## 16. Open Questions & Decisions Needed

### 16.1 Supervisor Agent Naming
**Question**: Task spec mentions "Supervisor" agent but registry only has "dojo", "librarian", "debugger". Should we:
- A) Use `agent_id: 'supervisor'` for routing operations?
- B) Use `agent_id: 'dojo'` with context that it's routing?
- C) Add "Supervisor" to agent registry?

**Recommendation**: A) Use `agent_id: 'supervisor'` for routing operations, add to agent metadata (not registry).

**Decision**: Use 'supervisor' as a special agent_id for routing operations.

### 16.2 Activity Status Position
**Question**: Task spec suggests fixed bottom-right. Should it:
- A) Always be bottom-right (all pages)?
- B) Only appear on session pages?
- C) User-configurable position?

**Recommendation**: A) Always bottom-right (consistent, always visible).

**Decision**: Fixed bottom-right, always visible when activity is active.

### 16.3 Activity History Limit
**Question**: How many activities to keep in history?
- A) 10 (task spec suggestion)
- B) 50 (more comprehensive)
- C) Unlimited (with lazy loading)

**Recommendation**: A) 10 activities (keeps localStorage small, sufficient for debugging).

**Decision**: 10 activities (FIFO queue).

---

## 17. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-14 | Zenflow | Initial specification |

---

**End of Specification**
