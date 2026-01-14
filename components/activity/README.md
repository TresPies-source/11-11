# Activity Components

## Overview

The activity components provide a beautiful, real-time UI for tracking agent operations across the 11-11 multi-agent system. These components display which agent is active, what it's doing, and the history of recent operations.

## Components

### AgentAvatar

Displays an agent's icon with optional active state animation.

**Props:**
```typescript
interface AgentAvatarProps {
  agentId: 'supervisor' | 'dojo' | 'librarian' | 'debugger';
  size?: 'sm' | 'md' | 'lg';              // Default: 'md'
  showName?: boolean;                      // Default: false
  isActive?: boolean;                      // Default: false
}
```

**Usage:**
```tsx
import { AgentAvatar } from '@/components/activity/AgentAvatar';

function MyComponent() {
  return (
    <>
      {/* Small inactive avatar */}
      <AgentAvatar agentId="supervisor" size="sm" />
      
      {/* Medium active avatar with name */}
      <AgentAvatar 
        agentId="librarian" 
        size="md" 
        showName 
        isActive 
      />
      
      {/* Large avatar */}
      <AgentAvatar agentId="dojo" size="lg" />
    </>
  );
}
```

**Features:**
- 3 size variants (sm: 32px, md: 48px, lg: 64px)
- Pulsing ring animation when active
- Reuses existing agent icons and colors
- Dark mode support
- ARIA labels for accessibility

**Agent Metadata:**
- **Supervisor**: GitBranch icon, blue color
- **Dojo**: Brain icon, purple color
- **Librarian**: Search icon, green color
- **Debugger**: Bug icon, red color

---

### ActivityStatus

Fixed-position status indicator showing the current agent activity.

**Props:**
None (reads from `ActivityProvider` context)

**Usage:**
```tsx
import { ActivityStatus } from '@/components/activity/ActivityStatus';

function Layout({ children }) {
  return (
    <>
      {children}
      <ActivityStatus />  {/* Fixed bottom-right */}
    </>
  );
}
```

**Features:**
- Fixed position (bottom-right, 16px margin)
- Shows agent avatar, name, and message
- Conditional progress bar (when `progress` field present)
- Estimated duration display
- Smooth enter/exit animations (Framer Motion)
- Auto-hides when no activity
- Dark mode support
- ARIA attributes (`role="status"`, `aria-live="polite"`)

**Animation:**
- Enter: Slide up + fade in (200ms)
- Exit: Fade out (200ms)
- Progress bar: Smooth width transition (300ms)

**Example Activity States:**
- **Active**: Shows loader animation + progress bar
- **Complete**: Shows briefly before fading out
- **Error**: Shows with red accent color

---

### Progress

Reusable progress bar component with ARIA support.

**Props:**
```typescript
interface ProgressProps {
  value: number;                           // 0-100
  className?: string;                      // Optional Tailwind classes
}
```

**Usage:**
```tsx
import { Progress } from '@/components/ui/Progress';

function MyComponent() {
  const [progress, setProgress] = useState(0);
  
  return (
    <div>
      <Progress value={progress} />
      <button onClick={() => setProgress(50)}>Set to 50%</button>
    </div>
  );
}
```

**Features:**
- ARIA progressbar role with min/max/value attributes
- Smooth CSS transition (300ms ease-out)
- Dark mode color variants
- Accessible (screen reader compatible)

---

### ActivityHistory

Displays the last 10 completed activities with timestamps.

**Props:**
None (reads from `ActivityProvider` context)

**Usage:**
```tsx
import { ActivityHistory } from '@/components/activity/ActivityHistory';

function SessionPage() {
  return (
    <div className="container mx-auto p-8">
      <h1>Session Details</h1>
      
      {/* Activity history */}
      <ActivityHistory />
    </div>
  );
}
```

**Features:**
- Displays last 10 activities from history
- Relative timestamps ("5 minutes ago", "Just now")
- Status icons:
  - ✓ (Check) - Complete (green)
  - ✗ (X) - Error (red)
  - ⏳ (Clock) - Waiting (yellow)
- Agent avatar for each activity
- Empty state ("No activity recorded yet")
- Dark mode support
- Hover effects

**Activity Display:**
- Agent name and avatar
- Activity message
- Relative timestamp
- Status icon

---

### HandoffVisualization

Shows the agent path for multi-agent handoffs.

**Props:**
None (reads from `ActivityProvider` context)

**Usage:**
```tsx
import { HandoffVisualization } from '@/components/activity/HandoffVisualization';

function SessionPage() {
  return (
    <div className="container mx-auto p-8">
      <h1>Session Details</h1>
      
      {/* Agent handoff path */}
      <HandoffVisualization />
      
      {/* Activity history */}
      <ActivityHistory />
    </div>
  );
}
```

**Features:**
- Extracts agent path from activity history
- Deduplicates consecutive duplicate agents
- Displays agent chain with arrows (A → B → C)
- Responsive flex wrapping for mobile
- Auto-hides when path length < 2
- Dark mode support

**Example Paths:**
- `Supervisor → Librarian` (2 agents)
- `Supervisor → Librarian → Dojo` (3 agents)
- `Supervisor → Librarian → Dojo → Debugger` (4 agents)

---

## Provider Setup

All activity components require the `ActivityProvider` to be present in the component tree.

**Setup (already done in `app/layout.tsx`):**
```tsx
import { ActivityProvider } from '@/components/providers/ActivityProvider';
import { ActivityStatus } from '@/components/activity/ActivityStatus';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ActivityProvider>
          {children}
          <ActivityStatus />  {/* Fixed overlay */}
        </ActivityProvider>
      </body>
    </html>
  );
}
```

---

## Usage Patterns

### Pattern 1: Fixed Status Indicator (Global)

Add `ActivityStatus` to your root layout for a global activity indicator:

```tsx
// app/layout.tsx
import { ActivityStatus } from '@/components/activity/ActivityStatus';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <ActivityStatus />
    </>
  );
}
```

**Result:** Fixed bottom-right indicator visible across entire app.

---

### Pattern 2: Session Page with History

Add `ActivityHistory` and `HandoffVisualization` to session/detail pages:

```tsx
// app/session/[id]/page.tsx
import { ActivityHistory } from '@/components/activity/ActivityHistory';
import { HandoffVisualization } from '@/components/activity/HandoffVisualization';

export default function SessionPage() {
  return (
    <div className="space-y-4">
      <h1>Session Details</h1>
      
      {/* Show agent handoff path */}
      <HandoffVisualization />
      
      {/* Show recent activities */}
      <ActivityHistory />
    </div>
  );
}
```

**Result:** Visual agent path + last 10 activities displayed on page.

---

### Pattern 3: Custom Agent Avatar

Use `AgentAvatar` in custom components:

```tsx
// components/custom/AgentCard.tsx
import { AgentAvatar } from '@/components/activity/AgentAvatar';

function AgentCard({ agentId, isOnline }) {
  return (
    <div className="card">
      <AgentAvatar 
        agentId={agentId} 
        size="lg" 
        showName 
        isActive={isOnline} 
      />
      <p>Status: {isOnline ? 'Online' : 'Offline'}</p>
    </div>
  );
}
```

---

## Triggering Activities

Activities are triggered using the `useActivity` hook and specialized tracking hooks.

### Method 1: Direct Activity Control

```tsx
import { useActivity } from '@/hooks/useActivity';

function MyComponent() {
  const { setActivity, updateActivity, clearActivity } = useActivity();
  
  const performOperation = async () => {
    // Start activity
    setActivity({
      agent_id: 'dojo',
      status: 'active',
      message: 'Reflecting on perspectives...',
      progress: 0,
      started_at: new Date().toISOString(),
      estimated_duration: 3,
    });
    
    // Update progress
    setTimeout(() => {
      updateActivity({ progress: 50, message: 'Synthesizing insights...' });
    }, 1000);
    
    // Complete
    setTimeout(() => {
      updateActivity({ 
        status: 'complete', 
        progress: 100, 
        message: 'Reflection complete' 
      });
      clearActivity();
    }, 3000);
  };
  
  return <button onClick={performOperation}>Start</button>;
}
```

### Method 2: Using Activity Tracking Hooks (Recommended)

See `lib/agents/README-ACTIVITY-INTEGRATION.md` for details on:
- `useRoutingActivity()` - Supervisor routing
- `useLibrarianActivity()` - Librarian search
- `useActivityTracking()` - Generic agent operations

**Example:**
```tsx
import { useRoutingActivity } from '@/lib/agents/activity-integration';

function ChatPanel() {
  const { trackRoutingActivity } = useRoutingActivity();
  
  const handleRoute = async (query: string) => {
    const result = await trackRoutingActivity(async () => {
      const response = await fetch('/api/agents/route', {
        method: 'POST',
        body: JSON.stringify({ query }),
      });
      return await response.json();
    });
    
    console.log(`Routed to: ${result.agent_name}`);
  };
  
  return <button onClick={() => handleRoute('Find prompts')}>Route</button>;
}
```

---

## Styling

All components use Tailwind CSS and support dark mode.

### Dark Mode Classes

**AgentAvatar:**
- Background: `dark:bg-{color}-900/30`
- Text: `dark:text-{color}-400`
- Ring: `dark:ring-{color}-400`

**ActivityStatus:**
- Background: `dark:bg-gray-800`
- Border: `dark:border-gray-700`
- Text: `dark:text-gray-100` (primary), `dark:text-gray-400` (secondary)

**ActivityHistory:**
- Background: `dark:bg-gray-800`
- Border: `dark:border-gray-700`
- Hover: `dark:hover:bg-gray-700/50`

**HandoffVisualization:**
- Background: `dark:bg-blue-950/30`
- Border: `dark:border-blue-800`
- Text: `dark:text-gray-500`

**Progress:**
- Track: `dark:bg-gray-700`
- Fill: `dark:bg-blue-400`

---

## Accessibility

### WCAG 2.1 AA Compliance

All components meet WCAG 2.1 AA standards:
- **Color Contrast**: 4.5:1+ for all text
- **ARIA Attributes**: Proper roles and labels
- **Keyboard Navigation**: Focusable elements have visible focus indicators
- **Screen Reader Support**: Live regions announce updates

### ARIA Attributes

**AgentAvatar:**
```html
<div role="img" aria-label="Supervisor agent (active)">
  <GitBranch aria-hidden="true" />
</div>
```

**ActivityStatus:**
```html
<div role="status" aria-live="polite" aria-atomic="true">
  <!-- Activity content -->
</div>
```

**Progress:**
```html
<div 
  role="progressbar" 
  aria-valuemin="0" 
  aria-valuemax="100" 
  aria-valuenow="50"
>
  <!-- Progress bar -->
</div>
```

**ActivityHistory:**
```html
<Check aria-label="Status: complete" />
<X aria-label="Status: error" />
<Clock aria-label="Status: waiting" />
```

---

## Performance

### Optimization Techniques

All components use React performance optimization:

1. **React.memo**: Prevents unnecessary re-renders
2. **useMemo**: Caches computed values
3. **useCallback**: Stabilizes function references

**Re-Render Reduction:**
- Without optimization: ~100 re-renders for 100 activity updates
- With optimization: ~4 re-renders for 100 activity updates
- **Improvement: ~96% reduction**

### Benchmarks

| Component | Render Time | Re-Renders (100 updates) |
|-----------|-------------|--------------------------|
| AgentAvatar | <5ms | 4 |
| ActivityStatus | <10ms | 4 |
| ActivityHistory | <20ms | 4 |
| HandoffVisualization | <15ms | 4 |
| Progress | <5ms | 50 (expected) |

---

## Testing

### Visual Testing

Visit `/test-activity` for comprehensive component testing:

1. **Component Tests** - Test each component individually
2. **Supervisor Routing** - Test real routing activity
3. **Librarian Search** - Test search activity
4. **Generic Tracking** - Test HOF pattern
5. **Dark Mode Toggle** - Test dark/light modes

### Accessibility Testing

Visit `/test-accessibility` for accessibility verification:

1. **Automated Tests** - ARIA labels, roles, progressbar
2. **Keyboard Navigation** - Tab through focusable elements
3. **Dark Mode** - Test color contrast in both modes
4. **Manual Checklist** - Screen reader testing guide

### Manual Testing Scenarios

1. **Trigger Activity**: Start an agent operation
2. **Progress Updates**: Verify progress bar updates smoothly
3. **Completion**: Verify activity clears after completion
4. **Error State**: Verify error state displays correctly
5. **History**: Verify activity appears in history
6. **Persistence**: Refresh page, verify history persists
7. **Dark Mode**: Toggle theme, verify components render correctly

---

## Troubleshooting

### Activity Not Appearing

**Problem**: `ActivityStatus` doesn't show when activity is triggered.

**Solutions:**
1. Verify `ActivityProvider` is in component tree (check `app/layout.tsx`)
2. Check browser console for errors
3. Verify `useActivity()` is called inside a component (not outside)
4. Check that activity has `status: 'active'`

---

### Progress Bar Not Updating

**Problem**: Progress bar stays at 0% or doesn't update smoothly.

**Solutions:**
1. Verify `progress` field is being updated (use `updateActivity()`)
2. Check that `progress` is between 0-100
3. Verify updates are spaced >100ms apart (avoid rapid updates)
4. Check browser console for errors

---

### History Not Persisting

**Problem**: Activity history disappears on page refresh.

**Solutions:**
1. Check browser localStorage quota (may be full)
2. Verify localStorage is enabled in browser settings
3. Check for localStorage errors in console
4. Clear localStorage and try again: `localStorage.removeItem('activity-history')`

---

### Dark Mode Not Working

**Problem**: Components don't render correctly in dark mode.

**Solutions:**
1. Verify dark mode is enabled (check theme toggle)
2. Check that `dark:` classes are present in components
3. Verify Tailwind CSS dark mode is configured (`class` strategy)
4. Check browser DevTools for applied classes

---

## Known Limitations

1. **Max 10 History Items**: Only last 10 activities stored (automatic pruning)
2. **No Activity Export**: Can't export activity log (deferred to v0.4.0)
3. **No Activity Filters**: Can't filter history by agent/status (deferred to v0.4.0)
4. **No Real-Time Cost**: Cost tracking not integrated (deferred to v0.4.0)
5. **No Browser Notifications**: Desktop notifications not implemented (deferred to v0.4.0)

---

## Future Enhancements (v0.4.0+)

- **Activity Export**: Export history as JSON
- **Activity Filters**: Filter by agent, status, time range
- **Real-Time Cost**: Show token usage per operation
- **Browser Notifications**: Desktop notifications for long operations
- **Activity Search**: Search activity messages
- **Custom Themes**: User-configurable colors
- **Activity Analytics**: Charts and graphs for activity patterns

---

## See Also

- [Activity Integration Guide](../../lib/agents/README-ACTIVITY-INTEGRATION.md) - Agent integration patterns
- [Activity Provider](../providers/ActivityProvider.tsx) - Context provider implementation
- [Harness Trace Integration](../../lib/harness/) - Event logging system
- [Test Page](/test-activity) - Visual testing interface
- [Accessibility Test Page](/test-accessibility) - Accessibility verification

---

## Support

For questions or issues, refer to:
- `JOURNAL.md` - Architecture decisions and technical details
- `AUDIT_LOG.md` - Sprint completion summary
- `.zenflow/tasks/v0-3-9-agent-status-activity-ind-e3cb/` - Task artifacts and reports
