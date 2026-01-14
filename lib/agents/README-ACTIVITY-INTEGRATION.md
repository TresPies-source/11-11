# Agent Activity Integration

## Overview

The activity integration system provides a clean, type-safe way to track agent operations with real-time UI updates. It bridges server-side agent operations with client-side activity state management.

## Architecture

### Components

1. **Activity Context** (`ActivityProvider`)
   - React Context-based state management
   - Tracks current activity and history
   - Persists to localStorage (max 10 items)
   - Integrates with Harness Trace system

2. **Activity Tracking Hooks** (`lib/agents/activity-integration.ts`)
   - `useActivityTracking()` - Generic HOF for any agent operation
   - `useRoutingActivity()` - Specialized for Supervisor routing
   - `useLibrarianActivity()` - Specialized for Librarian search

3. **UI Components** (`components/activity/`)
   - `ActivityStatus` - Fixed-position real-time indicator
   - `ActivityHistory` - Historical activity log
   - `HandoffVisualization` - Multi-agent handoff visualization
   - `AgentAvatar` - Reusable agent icon component

## Usage

### Generic Activity Tracking

The `useActivityTracking()` hook provides a flexible way to track any agent operation:

```tsx
import { useActivityTracking } from '@/lib/agents/activity-integration';

function MyComponent() {
  const { withActivityTracking } = useActivityTracking();

  const runAgentOperation = async () => {
    const result = await withActivityTracking(
      // Your async operation
      async () => {
        const response = await fetch('/api/agents/dojo', {
          method: 'POST',
          body: JSON.stringify({ query: '...' }),
        });
        return await response.json();
      },
      // Configuration
      {
        agent_id: 'dojo',
        initial_message: 'Reflecting on perspectives...',
        estimated_duration: 3,
        progress_updates: [
          { delay_ms: 500, progress: 30, message: 'Analyzing context...' },
          { delay_ms: 1500, progress: 70, message: 'Synthesizing insights...' },
        ],
        complete_message: (result) => `Generated ${result.insights.length} insights`,
        error_message: (error) => `Reflection failed: ${error.message}`,
        auto_clear_delay: 1000, // Optional: ms to wait before clearing (default: 1000)
      },
      // Optional callbacks
      {
        onStart: () => console.log('Started'),
        onProgress: (progress, message) => console.log(`${progress}%: ${message}`),
        onComplete: (result) => console.log('Complete:', result),
        onError: (error) => console.error('Error:', error),
      }
    );

    return result;
  };

  return (
    <button onClick={runAgentOperation}>
      Run Agent
    </button>
  );
}
```

### Supervisor Routing

The `useRoutingActivity()` hook is specialized for routing operations:

```tsx
import { useRoutingActivity } from '@/lib/agents/activity-integration';

function ChatPanel() {
  const { trackRoutingActivity } = useRoutingActivity();

  const routeQuery = async (query: string) => {
    const result = await trackRoutingActivity(async () => {
      const response = await fetch('/api/supervisor/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          conversation_context: [],
          session_id: 'session-123',
        }),
      });
      return await response.json();
    });

    console.log(`Routed to: ${result.agent_name}`);
  };

  return <button onClick={() => routeQuery('Find budgeting prompts')}>Route</button>;
}
```

### Librarian Search

The `useLibrarianActivity()` hook is specialized for search operations:

```tsx
import { useLibrarianActivity } from '@/lib/agents/activity-integration';

function SearchPanel() {
  const { trackLibrarianActivity } = useLibrarianActivity();

  const search = async (query: string) => {
    const result = await trackLibrarianActivity(async () => {
      const response = await fetch('/api/librarian/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          filters: { status: 'active', threshold: 0.7, limit: 5 },
        }),
      });
      return await response.json();
    });

    console.log(`Found ${result.count} results`);
  };

  return <button onClick={() => search('budgeting')}>Search</button>;
}
```

## Configuration Reference

### ActivityTrackingConfig

```typescript
interface ActivityTrackingConfig {
  agent_id: string;                    // Agent identifier (e.g., 'supervisor', 'dojo', 'librarian')
  initial_message: string;             // Initial status message
  estimated_duration?: number;         // Estimated duration in seconds (optional)
  progress_updates?: Array<{
    delay_ms: number;                  // Delay before this update (ms)
    progress: number;                  // Progress percentage (0-100)
    message: string;                   // Progress message
  }>;
  complete_message?: (result: any) => string;  // Dynamic completion message
  error_message?: (error: Error) => string;    // Dynamic error message
  auto_clear_delay?: number;           // Delay before clearing activity (default: 1000ms)
}
```

### ActivityTrackingCallbacks

```typescript
interface ActivityTrackingCallbacks {
  onStart?: () => void;
  onProgress?: (progress: number, message: string) => void;
  onComplete?: (result: any) => void;
  onError?: (error: Error) => void;
}
```

## Integration with Server-Side Agents

### Pattern: Client-Side Wrapper

Since Next.js API routes are server-side and can't access React Context, we use a client-side wrapper pattern:

1. **Server-Side Agent** (`lib/agents/supervisor.ts`)
   - Pure agent logic
   - No UI dependencies
   - Logs to Harness Trace (optional)

2. **Client-Side Wrapper** (`lib/agents/activity-integration.ts`)
   - Wraps API calls
   - Manages activity state
   - Provides progress updates

3. **UI Component** (`components/multi-agent/ChatPanel.tsx`)
   - Uses wrapper hooks
   - Triggers agent operations
   - Displays activity status

### Example: Supervisor Integration

**Server-Side (`lib/agents/supervisor.ts`):**

```typescript
export async function routeQuery(query: string): Promise<RoutingResult> {
  // Pure routing logic
  const result = await selectAgent(query);
  
  // Optional: Log to Harness Trace
  await logHarnessEvent({
    event_type: 'AGENT_ACTIVITY_COMPLETE',
    agent_id: 'supervisor',
    message: `Routed to ${result.agent_name}`,
  }).catch(() => {});
  
  return result;
}
```

**Client-Side (`lib/agents/activity-integration.ts`):**

```typescript
export function useRoutingActivity() {
  const { setActivity, updateActivity, clearActivity, addToHistory } = useActivity();

  const trackRoutingActivity = async <T>(
    routingFn: () => Promise<T>,
    callbacks?: RoutingActivityCallbacks
  ): Promise<T> => {
    setActivity({
      agent_id: 'supervisor',
      status: 'active',
      message: 'Analyzing query and selecting agent...',
      progress: 0,
      started_at: new Date().toISOString(),
      estimated_duration: 2,
    });

    // ... progress updates, error handling, etc.
    
    const result = await routingFn();
    
    updateActivity({
      status: 'complete',
      progress: 100,
      message: `Routed to ${result.agent_name}`,
    });

    addToHistory({ /* ... */ });
    
    return result;
  };

  return { trackRoutingActivity };
}
```

## Best Practices

### 1. Progress Updates

- Use progress updates for operations >2 seconds
- Provide meaningful progress messages
- Space updates evenly (e.g., 0%, 30%, 70%, 100%)

```typescript
progress_updates: [
  { delay_ms: 500, progress: 30, message: 'Generating embedding...' },
  { delay_ms: 1500, progress: 70, message: 'Searching database...' },
]
```

### 2. Error Handling

- Always provide custom error messages
- Include context in error messages
- Auto-clear errors after 2x normal delay

```typescript
error_message: (error) => `Search failed: ${error.message}`
```

### 3. Completion Messages

- Use dynamic completion messages based on result
- Include relevant metrics (count, duration, etc.)

```typescript
complete_message: (result) => `Found ${result.count} results`
```

### 4. Auto-Clear Behavior

- Success: Clear after 1000ms (default)
- Error: Clear after 2000ms (2x default)
- Adjust `auto_clear_delay` if needed

### 5. Harness Trace Integration

- Log activity events to Harness Trace (server-side)
- Use graceful fallback (catch errors)
- Event types: `AGENT_ACTIVITY_START`, `AGENT_ACTIVITY_PROGRESS`, `AGENT_ACTIVITY_COMPLETE`

## Testing

### Manual Testing

Visit `/test-activity` for comprehensive testing interface:

1. **Supervisor Routing** - Test real routing with activity tracking
2. **Librarian Search** - Test search with progress updates
3. **Generic Tracking** - Test `withActivityTracking()` HOF
4. **Component Tests** - Test individual UI components

### Integration Testing

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useActivityTracking } from '@/lib/agents/activity-integration';

test('tracks activity lifecycle', async () => {
  const { result } = renderHook(() => useActivityTracking());
  
  const operation = async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true };
  };

  await result.current.withActivityTracking(operation, {
    agent_id: 'test',
    initial_message: 'Testing...',
  });

  // Verify activity was tracked
  await waitFor(() => {
    expect(history).toContainEqual(
      expect.objectContaining({
        agent_id: 'test',
        status: 'complete',
      })
    );
  });
});
```

## Troubleshooting

### Activity Not Appearing

1. Verify `ActivityProvider` is in `app/layout.tsx`
2. Check browser console for errors
3. Verify `useActivity()` is called inside a component

### Progress Not Updating

1. Check `progress_updates` timing (delay_ms)
2. Verify operation duration matches estimated_duration
3. Clear browser cache and reload

### History Not Persisting

1. Check browser localStorage quota
2. Verify localStorage is enabled
3. Check for localStorage errors in console

## Performance Considerations

### State Updates

- Activity updates use React Context (efficient)
- Progress updates are debounced (setTimeout)
- History is capped at 10 items (prevents memory leaks)

### Memory Management

- Auto-clear prevents stale activities
- History pruning prevents unbounded growth
- localStorage persistence is atomic

### Optimization

- Use `React.memo` for activity components
- Use `useCallback` for event handlers
- Avoid unnecessary re-renders with `useMemo`

## Future Enhancements (v0.4.0+)

- Real-time cost tracking (per-operation cost display)
- Activity export (export history as JSON)
- Activity filters (filter by agent, status, time range)
- Activity search (search activity messages)
- Browser notifications (notify on long operations)
- Server-Sent Events (SSE) for real-time updates

## See Also

- [Activity Provider](../../components/providers/ActivityProvider.tsx)
- [Activity Components](../../components/activity/)
- [Harness Trace Integration](../../lib/harness/)
- [Test Page](/test-activity)
