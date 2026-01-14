# Technical Specification: Implement Recent Activity Feed

**Task ID:** implement-recent-activity-feed-ee1f  
**Difficulty:** Easy  
**Status:** In Progress  
**Date:** January 14, 2026

---

## 1. Overview

This task involves creating a dynamic "Recent Activity" feed component for the Dashboard that displays real-time agent activities. The current implementation uses hardcoded mock data and needs to be replaced with components that integrate with the existing ActivityProvider infrastructure.

### Complexity Assessment: Easy

**Rationale:**
- Existing infrastructure already in place (ActivityProvider, useActivity hook, AgentActivity types)
- Similar components already exist (ActivityHistory.tsx) providing clear patterns to follow
- No new data models or API endpoints required
- Straightforward UI component implementation following established design patterns
- No complex state management or architectural changes needed

---

## 2. Technical Context

### Technology Stack
- **Framework:** Next.js 14.2.24 (App Router with React Server Components)
- **Runtime:** React 18.3.1
- **Language:** TypeScript 5.7.2
- **Styling:** Tailwind CSS 3.4.17 with custom Dojo Genesis design tokens
- **Animation:** Framer Motion 11.15.0
- **Icons:** lucide-react 0.469.0

### Key Dependencies
- Existing `ActivityProvider` context for activity state management
- Existing `useActivity` hook for accessing activity data
- Existing `AgentActivity` type definition
- Established UI component library (Card, Button, StatusDot)

### Design System
- **Brand Guide:** `00_Roadmap/DOJO_GENESIS_BRAND_GUIDE.md`
- **Primary Colors:** 
  - Background: Deep Navy (#0a1e2e, #0f2838, #1a3a4f)
  - Accent: Sunset Amber (#f5a623)
  - Text: White (#ffffff), Mountain Gray (#c5d1dd, #8a9dad, #6b7f91)
- **Agent Colors:**
  - Supervisor: #f5a623 (Amber)
  - Dojo: #f39c5a (Sunset Orange)
  - Librarian: #ffd699 (Sunrise Yellow)
  - Debugger: #6b7f91 (Mountain Blue-Gray)
- **Typography:** Inter (UI), JetBrains Mono (code)
- **Animation Timing:** 100ms (instant), 200ms (fast), 300ms (normal)

---

## 3. Current State Analysis

### Existing Infrastructure

**ActivityProvider** (`components/providers/ActivityProvider.tsx`):
- Manages agent activity state using React Context
- Tracks current activity and history (max 10 items)
- Persists history to localStorage
- Integrates with trace logging system
- Provides: `current`, `history`, `setActivity`, `updateActivity`, `clearActivity`, `addToHistory`

**useActivity Hook** (`hooks/useActivity.ts`):
- Simple hook to access ActivityContext
- Throws error if used outside provider
- Already implements the required interface

**AgentActivity Type** (`lib/types.ts`):
```typescript
interface AgentActivity {
  agent_id: string;
  status: 'idle' | 'active' | 'waiting' | 'complete' | 'error';
  message: string;
  progress?: number;
  started_at: string;
  ended_at?: string;
  estimated_duration?: number;
  metadata?: Record<string, any>;
}
```

**Existing Activity Components** (`components/activity/`):
- `ActivityHistory.tsx`: Displays agent activity history with icons and status
- `AgentAvatar.tsx`: Renders agent avatars with colors
- `ActivityStatus.tsx`: Shows activity status indicators
- Provides clear patterns for formatting times, styling, and agent identification

**Current Dashboard** (`app/dashboard/page.tsx`):
- Contains hardcoded mock activity data (lines 31-35)
- Simple bullet-point list display (lines 95-108)
- Lacks integration with ActivityProvider
- Missing agent-specific styling and icons

---

## 4. Implementation Approach

### Component Architecture

```
Dashboard (app/dashboard/page.tsx)
  └── RecentActivityFeed (components/dashboard/RecentActivityFeed.tsx)
        └── ActivityItem (components/dashboard/ActivityItem.tsx) [multiple]
```

### Strategy

1. **Create ActivityItem Component** (`components/dashboard/ActivityItem.tsx`)
   - Reusable component for a single activity entry
   - Props: activity (AgentActivity)
   - Uses agent-specific icons from lucide-react
   - Displays: agent icon, activity message, timestamp, status indicator
   - Implements Dojo Genesis styling with agent colors
   - Similar pattern to ActivityHistory but optimized for dashboard display

2. **Create RecentActivityFeed Component** (`components/dashboard/RecentActivityFeed.tsx`)
   - Container component that fetches and displays activities
   - Uses `useActivity()` hook to access history
   - Renders list of ActivityItem components
   - Handles empty state gracefully
   - Wraps content in Card component with appropriate styling
   - Shows most recent 5-10 activities from history

3. **Update Dashboard Page** (`app/dashboard/page.tsx`)
   - Remove hardcoded mock data (lines 18-22, 31-35)
   - Remove inline Recent Activity section (lines 95-108)
   - Replace with `<RecentActivityFeed />` component
   - Maintain existing layout structure

4. **Note on useActivity Hook**
   - Hook already exists and provides required functionality
   - No modifications needed to the hook itself
   - The ActivityProvider already handles data fetching/persistence via localStorage
   - "fetchActivities" mentioned in task description is already implemented via context

### Icon Mapping

Map agent types to lucide-react icons:
- **Supervisor**: `Target` or `Shield` (represents orchestration)
- **Dojo**: `Brain` (represents thinking/learning)
- **Librarian**: `BookOpen` or `Library` (represents knowledge)
- **Debugger**: `Search` or `Bug` (represents validation)

Also use status-specific icons:
- **Complete**: `CheckCircle2`
- **Error**: `XCircle`
- **Active/Working**: `Loader2` (with animation)
- **Waiting**: `Clock`

---

## 5. Source Code Changes

### New Files

1. **`components/dashboard/ActivityItem.tsx`**
   - Single activity item component
   - TypeScript React component (~80-100 lines)
   - Props interface for AgentActivity
   - Agent icon rendering with colors
   - Status indicator integration
   - Relative time formatting
   - Hover animations using framer-motion

2. **`components/dashboard/RecentActivityFeed.tsx`**
   - Activity feed container component
   - TypeScript React component (~100-120 lines)
   - Integration with useActivity hook
   - Empty state handling
   - List rendering with ActivityItem
   - Card wrapper with Dojo Genesis styling

### Modified Files

1. **`app/dashboard/page.tsx`**
   - Remove lines 18-22 (ActivityItem interface)
   - Remove lines 31-35 (mock recentActivity data)
   - Remove lines 95-108 (inline Recent Activity section)
   - Add import: `import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed'`
   - Add component: `<RecentActivityFeed />` in place of removed section

### Files Not Modified

- `hooks/useActivity.ts` - Already implements required functionality
- `components/providers/ActivityProvider.tsx` - No changes needed
- `lib/types.ts` - AgentActivity type already defined correctly

---

## 6. Data Model / Interface Changes

**No changes required.** The existing `AgentActivity` interface and `ActivityContextValue` provide all necessary data structures.

### Utilized Interfaces

```typescript
// From lib/types.ts
interface AgentActivity {
  agent_id: string;
  status: 'idle' | 'active' | 'waiting' | 'complete' | 'error';
  message: string;
  progress?: number;
  started_at: string;
  ended_at?: string;
  estimated_duration?: number;
  metadata?: Record<string, any>;
}

interface ActivityContextValue {
  current: AgentActivity | null;
  history: AgentActivity[];
  setActivity: (activity: AgentActivity) => void;
  updateActivity: (updates: Partial<AgentActivity>) => void;
  clearActivity: () => void;
  addToHistory: (activity: AgentActivity) => void;
}
```

---

## 7. Styling Guidelines

### Component-Specific Styles

**ActivityItem:**
- Background: Transparent, hover → `bg-bg-tertiary/30`
- Transition: 200ms ease-out
- Hover: Subtle lift (translateY: -1px)
- Padding: p-3 or p-4
- Border radius: rounded-lg
- Agent icon: Circle background with agent color at 10% opacity
- Text hierarchy:
  - Message: text-text-primary, text-sm or text-base
  - Timestamp: text-text-tertiary, text-xs
- Status indicator: Agent color with appropriate opacity

**RecentActivityFeed:**
- Wrapper: Use `<Card>` component
- Title: "Recent Activity", text-2xl, font-semibold, mb-6
- Empty state: Centered, icon + message, text-text-secondary
- List spacing: gap-2 or space-y-2
- Max height: Consider overflow handling for many items

### Animation Patterns

Following brand guide animation principles:
- **Subtlety is Premium:** Gentle, purposeful animations
- **Acknowledge Instantly:** Hover feedback within 100ms
- **Guide, Don't Decorate:** Animations support understanding
- **Use Framer Motion:**
  - `whileHover={{ y: -1, backgroundColor: 'rgba(26, 58, 79, 0.3)' }}`
  - `transition={{ duration: 0.2 }}`

---

## 8. Verification Approach

### Manual Testing

1. **Visual Verification:**
   - Navigate to `/dashboard`
   - Verify Recent Activity feed renders correctly
   - Check that agent icons and colors match design system
   - Verify empty state displays when no history exists
   - Test hover animations on activity items

2. **Data Integration:**
   - Verify feed displays data from ActivityProvider history
   - Test that new activities appear in real-time
   - Confirm timestamps format correctly
   - Check agent-specific styling applies correctly

3. **Responsive Design:**
   - Test on different viewport sizes
   - Verify text truncation works properly
   - Check that layout remains consistent

### Build & Lint Commands

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Production build
npm run build
```

### Success Criteria

- ✅ Dashboard displays RecentActivityFeed component
- ✅ Activities show correct agent icons from lucide-react
- ✅ Timestamps display in relative format (e.g., "2h ago")
- ✅ Agent-specific colors applied correctly
- ✅ Hover animations work smoothly
- ✅ Empty state displays when no activities
- ✅ No TypeScript errors
- ✅ No console errors in browser
- ✅ Build succeeds without warnings
- ✅ Follows Dojo Genesis design system

### Test Strategy

**Note:** The project uses manual testing with tsx test files. Based on the package.json scripts, there is no general `npm test` command. Testing approach:

1. Run type-checking: `npm run type-check`
2. Run linting: `npm run lint`
3. Run build: `npm run build`
4. Manual browser testing in development mode: `npm run dev`
5. Verify no console errors or warnings

No new test files required for this straightforward UI feature.

---

## 9. Implementation Plan

Given the **easy** complexity of this task, a single implementation step is appropriate:

### Single Implementation Step

1. Create `ActivityItem.tsx` component with proper styling and icons
2. Create `RecentActivityFeed.tsx` component integrating with useActivity
3. Update Dashboard page to use new component
4. Run verification commands
5. Test manually in browser

Total estimated time: **30-45 minutes**

---

## 10. Potential Issues & Considerations

### Edge Cases

1. **No activity history:** Handle gracefully with empty state message
2. **Invalid agent_id:** Filter out or use fallback icon/color
3. **Malformed timestamps:** Use try-catch with fallback to "Unknown time"
4. **Very long activity messages:** Truncate with ellipsis, consider tooltip
5. **Rapid updates:** React's reconciliation should handle, but consider keys

### Performance

- History limited to 10 items (already handled by ActivityProvider)
- Use React.memo for components if needed
- Efficient re-renders with proper key usage
- No performance concerns expected for this scale

### Accessibility

- Use semantic HTML elements
- Include aria-labels for status indicators
- Ensure sufficient color contrast (already in design system)
- Keyboard navigation support through standard elements

### Future Enhancements

- Click activity item to see details
- Filter by agent or status
- "View all" link to dedicated activity page
- Real-time updates with visual notification
- Export/clear activity history

---

## 11. Dependencies & Prerequisites

### Required Before Implementation

- ✅ ActivityProvider must be in app layout (already configured)
- ✅ useActivity hook available (already exists)
- ✅ UI component library (Card, Button) available (already exists)
- ✅ Lucide-react installed (already in package.json)

### No Blocking Dependencies

All required infrastructure is already in place. Implementation can proceed immediately.

---

## 12. Success Metrics

1. **Functional:** Recent Activity feed displays real agent activities from ActivityProvider
2. **Visual:** Follows Dojo Genesis brand guidelines with correct colors and typography
3. **Performance:** No performance degradation on Dashboard page
4. **Code Quality:** Passes TypeScript type-checking and ESLint
5. **Build:** Application builds successfully without errors

---

**End of Technical Specification**
