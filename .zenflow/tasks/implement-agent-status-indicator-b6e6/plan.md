# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

---

## Workflow Steps

### [x] Step: Technical Specification
<!-- chat-id: 7dba0790-95ba-49a1-bfa2-ea0ac55b2395 -->

**Complexity Assessment**: Medium

Technical specification completed and saved to `.zenflow/tasks/implement-agent-status-indicator-b6e6/spec.md`

---

## Implementation Steps

### [x] Step 1: Add Type Definitions
<!-- chat-id: 707feacc-6a37-47d9-81d6-20ab13ade71f -->

Add agent status types to `lib/types.ts`:
- `AgentStatusType` type
- `AgentStatusInfo` interface
- `AgentStatusMap` interface

**Verification**: Run `npm run type-check` to ensure no TypeScript errors

---

### [x] Step 2: Implement `useAgentStatus` Hook
<!-- chat-id: 1767bf87-7530-458f-aa1b-26ef188deaea -->

Create `hooks/useAgentStatus.ts`:
- Integrate with existing `useActivity` hook
- Implement polling mechanism (2-3 second interval)
- Derive agent statuses from ActivityProvider state
- Handle loading and error states
- Cleanup interval on unmount

**Verification**: 
- Type-check passes
- Hook can be imported without errors
- Test with `app/test-activity/page.tsx`

---

### [x] Step 3: Create `AgentStatusIndicator` Component
<!-- chat-id: c47bd129-356e-4586-8410-be08181720b0 -->

Create `components/dashboard/AgentStatusIndicator.tsx`:
- Display single agent with icon, name, and status
- Apply agent-specific colors from brand guide
- Implement Framer Motion animations (hover, pulse)
- Add accessibility attributes (ARIA labels)
- Use existing UI patterns from `ActivityItem.tsx`

**Verification**:
- Component renders correctly in isolation
- Animations are smooth
- Colors match brand guide specifications
- Lint passes

---

### [x] Step 4: Create `AgentStatus` Container Component
<!-- chat-id: eb728dfc-ff14-44f6-b9c8-833e8345e57a -->

Create `components/dashboard/AgentStatus.tsx`:
- Layout all four agent indicators horizontally
- Use `useAgentStatus` hook for state
- Implement responsive design (grid on mobile/tablet)
- Wrap in Card component
- Add section heading

**Verification**:
- All four agents display correctly
- Responsive layout works on different screen sizes
- No console errors
- Status updates propagate correctly

---

### [x] Step 5: Integration and Testing
<!-- chat-id: dd5f1eff-584a-4473-8ffe-2d3f193a449a -->

Integrate with Dashboard:
- Add `<AgentStatus />` to main dashboard page
- Test alongside `RecentActivityFeed`
- Verify real-time updates work
- Test error states and edge cases
- Check memory leaks (DevTools)

**Verification**:
- Dashboard loads without errors
- Status indicators update in real-time
- Performance is acceptable
- No memory leaks

---

### [x] Step 6: Build and Final Verification
<!-- chat-id: 6691cfda-abbc-4f84-a85e-3c1cd151aea6 -->

Run all verification commands:
- `npm run build` - Ensure production build succeeds
- `npm run lint` - Ensure code quality standards met
- `npm run type-check` - Verify TypeScript correctness
- Manual testing checklist from spec.md

Write completion report to `.zenflow/tasks/implement-agent-status-indicator-b6e6/report.md`
