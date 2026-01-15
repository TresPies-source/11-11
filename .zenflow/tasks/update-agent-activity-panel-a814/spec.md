# Technical Specification: Update Agent Activity Panel

**Task ID**: update-agent-activity-panel-a814  
**Complexity**: Medium  
**Version**: 1.0  
**Date**: January 14, 2026

---

## 1. Technical Context

### 1.1 Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.7
- **UI Library**: React 18.3
- **Styling**: Tailwind CSS 3.4 with custom brand colors
- **Animation**: Framer Motion 11.15
- **State Management**: Zustand 5.0
- **Layout Library**: react-resizable-panels 2.1.7 (already installed)

### 1.2 Key Dependencies
```json
{
  "react-resizable-panels": "^2.1.7",
  "framer-motion": "^11.15.0",
  "zustand": "^5.0.10",
  "lucide-react": "^0.469.0"
}
```

### 1.3 Design System
- **Brand Guide**: `00_Roadmap/DOJO_GENESIS_BRAND_GUIDE.md`
- **Color Palette**: `00_Roadmap/DOJO_GENESIS_BRAND_COLORS.md`
- **Agent Identities**: `00_Roadmap/DOJO_GENESIS_AGENT_IDENTITIES.md`
- **Tailwind Config**: `tailwind.config.ts` (semantic colors already defined)

### 1.4 Agent Colors (from Tailwind Config)
```css
supervisor: #f5a623  (Amber)
dojo: #f39c5a        (Sunset Orange)
librarian: #ffd699   (Sunrise Yellow)
debugger: #6b7f91    (Mountain Blue-Gray)
```

---

## 2. Current State Analysis

### 2.1 Existing Components
- ✅ `components/layout/AgentActivityPanel.tsx` - Basic panel (needs update)
- ✅ `components/agents/AgentCard.tsx` - Registry card (different use case)
- ✅ `components/agents/AgentActivityCard.tsx` - Activity card component
- ✅ `components/agents/SystemInfo.tsx` - System metrics display
- ✅ `components/agents/ActivityLog.tsx` - Activity log component
- ✅ `components/ui/StatusDot.tsx` - Status indicator with animations
- ✅ `components/ui/Button.tsx` - Base button component
- ✅ `components/ui/Card.tsx` - Base card component

### 2.2 Existing Hooks
- ✅ `hooks/useAgentStatus.ts` - Fetches and derives agent status from activity
- ✅ `hooks/useActivity.ts` - Provides current activity and history

### 2.3 Existing State Management
- ✅ `lib/stores/workbench.store.ts` - Workbench state with `isAgentPanelOpen`
- ✅ `lib/types.ts` - TypeScript types for agents and activities

### 2.4 Current Layout Structure
```tsx
// app/layout.tsx
<div className="flex h-screen">
  <NavigationSidebar />
  <main className="flex-1 overflow-y-auto">
    {children}
  </main>
</div>
<ActivityStatus />
```

### 2.5 Gap Analysis
| Requirement | Current State | Action Needed |
|-------------|---------------|---------------|
| Resizable panel | ❌ Not implemented | Add react-resizable-panels |
| Collapsible UI | ❌ Static layout | Implement collapsed/expanded states |
| 80px-320px range | ❌ Fixed width | Configure panel constraints |
| Integration in layout | ❌ Not in root layout | Add to layout.tsx |
| Real-time status | ✅ useAgentStatus exists | Connect to panel |
| Agent handoff visualization | ❌ Not implemented | Add HandoffVisualization component |

---

## 3. Implementation Approach

### 3.1 Architecture Pattern
**Pattern**: Resizable side panel with responsive components

**Layout Hierarchy**:
```
RootLayout
├── NavigationSidebar (left, fixed 64px)
└── ResizablePanelGroup (horizontal)
    ├── ResizablePanel (main content, flex)
    ├── ResizableHandle (draggable)
    └── ResizablePanel (agent panel, 80-320px)
        └── AgentActivityPanel
            ├── Header (with collapse button)
            ├── Agent Cards (scrollable)
            ├── Footer
            │   ├── SystemInfo
            │   └── ActivityLog
```

### 3.2 Component Responsibilities

**1. AgentActivityPanel (Update Existing)**
- Display all four agents with real-time status
- Support collapsed (icon-only) and expanded (full details) states
- Use `useAgentStatus()` hook for data
- Manage collapsed state internally or via store
- Show system info and activity log

**2. AgentCard (New Component)**
- Purpose-built for activity panel (different from registry AgentCard)
- Two rendering modes based on panel width
- Display agent icon, name, status, and current task
- Use agent-specific colors from tailwind config
- Support for "thinking", "working", "idle", "error" states

**3. SystemInfo (Update Existing)**
- Display token count, cost, and duration
- Use mock data for now (real integration in future)
- Responsive layout for collapsed state

**4. ActivityLog (Update Existing)**
- Display last 5 agent activities with timestamps
- Show agent icon and color-coded entries
- Truncate text in collapsed state

### 3.3 State Management Strategy

**Option A: Panel State in Workbench Store (Recommended)**
```typescript
// lib/stores/workbench.store.ts
interface WorkbenchState {
  // ... existing
  isAgentPanelOpen: boolean;
  agentPanelWidth: number;
  toggleAgentPanel: () => void;
  setAgentPanelWidth: (width: number) => void;
}
```

**Option B: Local State in ResizablePanel**
- Use react-resizable-panels' built-in state management
- Store panel size in localStorage via `onLayout` callback

**Decision**: Use Option B for panel sizing (native to library) + Option A for collapse toggle (existing pattern)

### 3.4 Responsive Behavior

**Panel Width Breakpoints**:
- **Collapsed**: 80px (icon-only mode)
- **Transitioning**: 81px - 149px (show icons + status dots)
- **Expanded**: 150px - 320px (full details mode)
- **Default**: 320px (initial state)

**Component Behavior by Width**:
```typescript
const isCollapsed = width < 150;
const isFullyExpanded = width >= 240;
```

---

## 4. Source Code Structure Changes

### 4.1 Files to Create
```
components/agent/
├── AgentCard.tsx              # NEW: Activity panel-specific agent card
```

### 4.2 Files to Modify
```
app/layout.tsx                 # Update: Add ResizablePanelGroup
components/layout/AgentActivityPanel.tsx  # Update: Use real data, responsive layout
components/agents/SystemInfo.tsx          # Update: Add responsive layout
components/agents/ActivityLog.tsx         # Update: Add agent colors, responsive layout
lib/stores/workbench.store.ts            # Optional: Add panel width state
```

### 4.3 Files to Reference (No Changes)
```
hooks/useAgentStatus.ts        # Use for agent data
hooks/useActivity.ts           # Use for activity history
components/ui/StatusDot.tsx    # Use for status indicators
components/ui/Button.tsx       # Use for toggle button
components/ui/Card.tsx         # Use for card styling
00_Roadmap/DOJO_GENESIS_AGENT_IDENTITIES.md  # Reference for agent metadata
```

---

## 5. Data Model & Interface Changes

### 5.1 New Interfaces

**AgentCardProps** (for new AgentCard component):
```typescript
interface AgentCardProps {
  agentId: 'supervisor' | 'dojo' | 'librarian' | 'debugger';
  name: string;
  icon: string;
  status: 'idle' | 'thinking' | 'working' | 'error';
  message?: string;
  progress?: number;
  isCollapsed: boolean;
}
```

**AgentMetadata** (constant data):
```typescript
const AGENT_METADATA = {
  supervisor: { name: 'Supervisor', icon: '🎯', color: 'supervisor' },
  dojo: { name: 'Dojo', icon: '🧠', color: 'dojo' },
  librarian: { name: 'Librarian', icon: '📚', color: 'librarian' },
  debugger: { name: 'Debugger', icon: '🔍', color: 'debugger' },
} as const;
```

### 5.2 Existing Interfaces (No Changes Needed)
- ✅ `AgentStatusInfo` (lib/types.ts)
- ✅ `AgentStatusMap` (lib/types.ts)
- ✅ `AgentActivity` (lib/types.ts)

---

## 6. Implementation Details

### 6.1 Layout Integration (app/layout.tsx)

**Approach**: Wrap main content with ResizablePanelGroup

```typescript
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "react-resizable-panels";

// Inside body, replace current flex container:
<div className="flex h-screen">
  <NavigationSidebar />
  <ResizablePanelGroup direction="horizontal" className="flex-1">
    <ResizablePanel defaultSize={75} minSize={30}>
      <main className="h-full overflow-y-auto">
        {children}
      </main>
    </ResizablePanel>
    
    <ResizableHandle className="w-1 bg-bg-tertiary hover:bg-text-accent transition-colors" />
    
    <ResizablePanel 
      defaultSize={25} 
      minSize={8}  // 80px / 1000px viewport ≈ 8%
      maxSize={32} // 320px / 1000px viewport ≈ 32%
      collapsible={true}
      collapsedSize={8}
    >
      <AgentActivityPanel />
    </ResizablePanel>
  </ResizablePanelGroup>
</div>
```

**Note**: The `size` props are percentages, so we'll need to calculate based on viewport width or use pixel-based approach with custom logic.

### 6.2 AgentActivityPanel Component

**Key Changes**:
1. Remove `toggleAgentPanel` button (use panel collapse instead)
2. Use `useAgentStatus()` hook for real data
3. Pass panel width to child components
4. Use consistent agent ordering: Supervisor → Dojo → Librarian → Debugger

```typescript
"use client";

import { useAgentStatus } from "@/hooks/useAgentStatus";
import { AgentCard } from "@/components/agent/AgentCard";
import { SystemInfo } from "@/components/agents/SystemInfo";
import { ActivityLog } from "@/components/agents/ActivityLog";

const AGENT_ORDER = ['supervisor', 'dojo', 'librarian', 'debugger'] as const;

const AGENT_METADATA = {
  supervisor: { name: 'Supervisor', icon: '🎯' },
  dojo: { name: 'Dojo', icon: '🧠' },
  librarian: { name: 'Librarian', icon: '📚' },
  debugger: { name: 'Debugger', icon: '🔍' },
} as const;

export function AgentActivityPanel() {
  const { agentStatuses } = useAgentStatus();
  const [panelWidth, setPanelWidth] = useState(320);
  const isCollapsed = panelWidth < 150;
  
  // ... implementation
}
```

### 6.3 New AgentCard Component

**Location**: `components/agent/AgentCard.tsx`

**Features**:
- Agent-specific background colors (8% opacity)
- StatusDot with agent-specific color
- Collapsed mode: icon + status dot only
- Expanded mode: icon + name + status + task + progress

```typescript
"use client";

import { StatusDot } from "@/components/ui/StatusDot";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  agentId: 'supervisor' | 'dojo' | 'librarian' | 'debugger';
  name: string;
  icon: string;
  status: 'idle' | 'thinking' | 'working' | 'error';
  message?: string;
  progress?: number;
  isCollapsed: boolean;
}

const AGENT_COLORS = {
  supervisor: 'bg-supervisor/10 border-supervisor/25',
  dojo: 'bg-dojo/10 border-dojo/25',
  librarian: 'bg-librarian/10 border-librarian/25',
  debugger: 'bg-debugger/10 border-debugger/25',
} as const;

export function AgentCard({ 
  agentId, 
  name, 
  icon, 
  status, 
  message, 
  progress, 
  isCollapsed 
}: AgentCardProps) {
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2 p-2">
        <div className="relative">
          <span className="text-2xl">{icon}</span>
          <div className="absolute -bottom-1 -right-1">
            <StatusDot status={status} size="md" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "p-3 rounded-lg border",
      AGENT_COLORS[agentId]
    )}>
      {/* Full card implementation */}
    </div>
  );
}
```

### 6.4 Responsive SystemInfo & ActivityLog

**SystemInfo Changes**:
- Collapsed: Hide or show icons only
- Expanded: Show "Cost: $X" and "Duration: Xs"

**ActivityLog Changes**:
- Collapsed: Hide completely or show dot indicators
- Expanded: Show last 5 activities with agent icons

---

## 7. Verification Approach

### 7.1 Manual Testing Checklist
- [ ] Panel is visible on all pages (test /, /workbench, /librarian, etc.)
- [ ] Panel can be resized by dragging handle
- [ ] Panel collapses to 80px when dragged below threshold
- [ ] Panel can be expanded back to 320px
- [ ] Agent cards show correct icons and colors
- [ ] Agent status dots update in real-time (test with activity changes)
- [ ] System info displays correctly in both states
- [ ] Activity log displays correctly in both states
- [ ] Panel state persists across page navigation
- [ ] No console errors on load or resize

### 7.2 Build Verification
```bash
npm run build
```
**Expected**: Build completes successfully with no TypeScript errors

### 7.3 Type Checking
```bash
npm run type-check
```
**Expected**: No type errors

### 7.4 Linting
```bash
npm run lint
```
**Expected**: No linting errors (or only existing issues)

### 7.5 Accessibility Testing
- [ ] Panel can be collapsed/expanded via keyboard
- [ ] Status dots have proper ARIA labels
- [ ] Agent cards have proper semantic HTML
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader announces status changes

### 7.6 Visual Regression Testing
- [ ] Compare against mockups in `00_Roadmap/V0.4.0_MOCKUPS_REFINED.md`
- [ ] Verify brand colors match `DOJO_GENESIS_BRAND_COLORS.md`
- [ ] Verify agent icons match `DOJO_GENESIS_AGENT_IDENTITIES.md`

---

## 8. Risk Assessment & Mitigation

### 8.1 Potential Risks

**Risk 1: Panel sizing issues on different screen sizes**
- **Impact**: Medium
- **Mitigation**: Use percentage-based sizing with min/max constraints
- **Fallback**: Default to 320px if calculations fail

**Risk 2: Performance issues with real-time polling**
- **Impact**: Low
- **Mitigation**: useAgentStatus already implements 2.5s polling interval
- **Fallback**: Increase polling interval if needed

**Risk 3: Layout conflicts with existing pages**
- **Impact**: Medium
- **Mitigation**: Test on all major pages (/workbench, /librarian, /dashboard)
- **Fallback**: Make panel opt-in per page if needed

**Risk 4: State persistence across navigation**
- **Impact**: Low
- **Mitigation**: Use Zustand store or localStorage
- **Fallback**: Panel resets to default state on navigation

### 8.2 Browser Compatibility
- **Target**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **CSS Features**: Tailwind utilities (widely supported)
- **JS Features**: React 18 hooks, ES2020 features
- **Fallback**: None required (modern app)

---

## 9. Success Criteria

### 9.1 Functional Requirements
- ✅ Panel is resizable between 80px and 320px
- ✅ Panel is collapsible via drag or button
- ✅ Panel displays all 4 agents with correct metadata
- ✅ Agent status updates in real-time
- ✅ Agent cards adapt to collapsed/expanded states
- ✅ System info and activity log display correctly
- ✅ Panel is visible on all pages

### 9.2 Non-Functional Requirements
- ✅ Application builds successfully
- ✅ No TypeScript errors
- ✅ No console errors or warnings
- ✅ Meets WCAG AA accessibility standards
- ✅ Follows brand guide design system
- ✅ Smooth animations (300ms transitions)

### 9.3 Quality Requirements
- ✅ Code follows existing patterns in codebase
- ✅ Components are properly typed with TypeScript
- ✅ CSS uses semantic Tailwind classes (no hardcoded colors)
- ✅ Responsive design works on desktop sizes (1280px - 2560px)

---

## 10. Open Questions & Decisions Needed

### 10.1 Questions for User
1. ❓ Should the panel be visible on ALL pages, or only specific ones (e.g., /workbench)?
2. ❓ Should panel state (width, collapsed) persist in localStorage?
3. ❓ Should there be a keyboard shortcut to toggle the panel?
4. ❓ Should the panel show a "handoff visualization" between agents, or just status?

### 10.2 Technical Decisions
1. ✅ **Decision**: Use react-resizable-panels for layout (already installed)
2. ✅ **Decision**: Create new AgentCard component (different from existing one)
3. ✅ **Decision**: Use useAgentStatus hook for real-time data
4. ⏳ **Decision**: Panel persistence - localStorage vs Zustand (recommend localStorage)
5. ⏳ **Decision**: Panel visibility - all pages vs specific pages (recommend all pages per spec)

---

## 11. Implementation Plan

### Phase 1: Core Panel Structure (2-3 hours)
1. Update `app/layout.tsx` to add ResizablePanelGroup
2. Configure panel constraints (80px - 320px)
3. Test basic resizing and collapsing behavior

### Phase 2: Agent Cards (2-3 hours)
1. Create new `components/agent/AgentCard.tsx`
2. Implement collapsed and expanded states
3. Add agent-specific colors and styling
4. Integrate with useAgentStatus hook

### Phase 3: Panel Components (1-2 hours)
1. Update AgentActivityPanel to use real data
2. Update SystemInfo for responsive layout
3. Update ActivityLog with agent colors and responsive layout
4. Test all components together

### Phase 4: Polish & Testing (1-2 hours)
1. Add smooth animations and transitions
2. Test on all pages
3. Verify accessibility
4. Run build and type-check
5. Fix any issues

**Total Estimated Time**: 6-10 hours

---

## 12. Next Steps

After completing this specification:
1. ✅ Save this spec to `.zenflow/tasks/update-agent-activity-panel-a814/spec.md`
2. ✅ Create detailed implementation plan in `plan.md`
3. ⏭️ Begin Phase 1 implementation
4. ⏭️ Test and iterate
5. ⏭️ Write completion report in `report.md`

---

**End of Technical Specification**
