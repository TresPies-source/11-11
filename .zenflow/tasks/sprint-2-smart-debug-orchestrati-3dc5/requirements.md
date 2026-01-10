# Product Requirements Document: Sprint 2 Stabilization

## 1. Overview

**Project**: 11-11 - Sustainable Intelligence OS  
**Sprint**: Sprint 2 Stabilization  
**Date**: January 10, 2026  
**Status**: Requirements Definition

### Problem Statement

The Context Bus and Google Drive Sync implementations from Sprint 2 have critical stability issues:

1. **Context Bus "Deafness"**: The `PLAN_UPDATED` event is successfully emitted by `RepositoryProvider` (confirmed via console logs) but is not being received by `ChatPanel` components, preventing multi-agent context synchronization.

2. **Google Drive Sync Fragility**: The current implementation lacks optimistic UI patterns and rollback mechanisms, leading to poor UX when network errors occur or API calls fail.

3. **Incomplete State Sync**: Multi-agent panels don't reliably update their system context when the task plan is modified, breaking the core collaboration workflow.

### Success Criteria

The sprint is complete when:
- All `ChatPanel` components reliably receive `PLAN_UPDATED` events within 100ms of emission
- Visual proof (console logs + screenshots) demonstrate successful round-trip event flow
- Google Drive sync implements optimistic UI with automatic rollback on failures
- Sync status indicators accurately reflect real-time operation states
- All changes are documented in `JOURNAL.md` with technical explanations

## 2. User Stories

### US-1: Multi-Agent Context Awareness
**As a** user working with multiple AI agents  
**I want** all agent panels to receive real-time updates when I modify the task plan  
**So that** all agents have synchronized context without manual refresh

**Acceptance Criteria**:
- When I save `task_plan.md` in the editor, all active ChatPanels show "Context Refreshed" toast within 3 seconds
- Console logs confirm event reception: `[ContextBus] Plan update received for Agent: {name}`
- Each ChatPanel's internal `systemContext` state updates with the latest plan content
- The toast auto-dismisses after 3 seconds without user interaction

### US-2: Reliable Google Drive Sync
**As a** user editing files in the workbench  
**I want** immediate visual feedback when saving, even during network delays  
**So that** I can continue working without waiting for server confirmation

**Acceptance Criteria**:
- When I save a file, the UI immediately marks it as saved (optimistic update)
- If the API call fails, the file reverts to "dirty" state with an error indicator
- The sync status icon shows: green (synced), yellow pulsing (syncing), red (error)
- A retry button appears when errors occur, allowing manual retry
- Failed saves don't lose my local changes

### US-3: Error Recovery
**As a** user experiencing network issues or API failures  
**I want** clear error feedback and easy retry mechanisms  
**So that** I can recover from failures without losing work or refreshing the page

**Acceptance Criteria**:
- Network errors display in the SyncStatus component with descriptive messages
- The retry button attempts the failed operation with exponential backoff
- After 3 failed retries, a permanent error state is shown
- I can continue local editing even when sync is failing
- Successful retry clears the error state and updates sync status to green

## 3. Functional Requirements

### FR-1: Context Bus Event Delivery
**Priority**: Critical  
**Complexity**: Medium

**Requirements**:
1. The `ContextBusProvider` must provide a stable emitter instance across all renders
2. The `useContextBus` hook must return a stable reference to prevent subscription churn
3. ChatPanel event subscriptions must be properly registered and not cleaned up prematurely
4. Event handlers must maintain stable references using `useRef` to avoid re-subscription loops
5. All event emissions must include timestamps for debugging and verification

**Technical Constraints**:
- Event propagation must complete within 100ms (measured from emit to handler execution)
- Maximum 6 ChatPanels can subscribe simultaneously (current design limit)
- Event handlers must not trigger re-renders unnecessarily (maintain React.memo optimization)

### FR-2: Optimistic UI for File Operations
**Priority**: Critical  
**Complexity**: Medium

**Requirements**:
1. When `saveFile()` is called, immediately update `savedContent` state to match `fileContent`
2. If the PATCH request fails, rollback `savedContent` to the pre-save value
3. Maintain a rollback history (last saved state) to enable recovery
4. Display optimistic success state in UI before server confirmation
5. Revert optimistic state if API returns non-200 status code

**Technical Constraints**:
- Rollback must occur within 50ms of error detection (perceived as instant)
- Local changes must never be lost, even during rollback operations
- Must work for files up to 1MB in size (current Monaco limit)

### FR-3: Enhanced Sync Status Feedback
**Priority**: High  
**Complexity**: Low

**Requirements**:
1. The `SyncStatus` component must accurately reflect the current operation state
2. Display operation type in tooltip: "Saving task_plan.md", "Loading prompts.md", etc.
3. Show operation progress for operations exceeding 500ms
4. Implement retry button with visual feedback (spinning icon during retry)
5. Display last sync timestamp in human-readable format ("2 seconds ago")

**Technical Constraints**:
- Status updates must trigger smooth animations (200-300ms transitions)
- Maximum 5 recent operations stored in `useSyncStatus` (existing limit)
- Must not cause unnecessary re-renders of parent components

### FR-4: Context Bus Diagnostics
**Priority**: High  
**Complexity**: Low

**Requirements**:
1. Add detailed console logging for all event lifecycle stages:
   - `[ContextBus] Emitting {event} at {timestamp}`
   - `[ContextBus] {AgentName} subscribed to {event}`
   - `[ContextBus] {AgentName} received {event} at {timestamp}`
   - `[ContextBus] {AgentName} unsubscribed from {event}`
2. Include content preview in logs (first 100 characters)
3. Calculate and log propagation delay (emit timestamp vs. receive timestamp)

**Technical Constraints**:
- Logs must not contain sensitive data or full file contents
- Console performance impact must be negligible (<1ms per log)

## 4. Non-Functional Requirements

### NFR-1: Performance
- Event propagation: <100ms from emit to all subscribers
- Optimistic UI update: <16ms (single frame at 60fps)
- Rollback operation: <50ms (perceived as instant)
- Zero unnecessary React re-renders (maintain current React.memo optimization)

### NFR-2: Reliability
- Event delivery success rate: 100% for same-page events
- Sync operation retry success rate: >95% after 3 attempts
- No memory leaks from event listeners (verified via React DevTools Profiler)

### NFR-3: Developer Experience
- Zero TypeScript errors in strict mode
- Zero ESLint warnings
- All components maintain existing type safety
- Console logs follow consistent format: `[ComponentName] Action: details`

### NFR-4: Code Quality
- Maintain "Calm UI" aesthetic (animations 200-300ms, smooth easing)
- Follow existing code conventions (hooks, context patterns)
- Add inline comments only for complex event handling logic
- Keep component file sizes under 300 lines

## 5. Technical Specifications Summary

### Architecture Changes
1. **ContextBusProvider**: Ensure `contextValue` object reference is stable across renders
2. **ChatPanel**: Use `useContextBusSubscription` hook pattern to prevent subscription churn
3. **RepositoryProvider**: Implement optimistic state management with rollback queue

### Data Flow
```
User Types in Editor
  ↓
Auto-save (500ms debounce)
  ↓
RepositoryProvider.saveFile()
  ↓ (optimistic)
Update savedContent = fileContent
  ↓ (parallel)
Emit PLAN_UPDATED event ←→ PATCH /api/drive/content
  ↓                          ↓
All ChatPanels receive    Success/Failure
  ↓                          ↓
Update systemContext      Confirm/Rollback
  ↓
Show "Context Refreshed" toast
```

### Event Contract
```typescript
type ContextBusEvent = 
  | { type: 'PLAN_UPDATED'; payload: { content: string; timestamp: Date } }
```

### Error States
1. **Network Error**: Display red status, enable retry, preserve local changes
2. **Auth Error (401)**: Show "Session Expired" modal, redirect to login
3. **Server Error (500)**: Display red status, enable retry with backoff
4. **Rate Limit (429)**: Show "Too many requests" message, disable retry for 60s

## 6. Out of Scope

The following are explicitly **not** included in this sprint:

1. **Token Refresh Logic**: OAuth token expiration still requires page refresh
2. **Offline Mode**: No IndexedDB caching or offline queue implementation
3. **Conflict Resolution**: Last-write-wins strategy remains (no CRDT/OT)
4. **File Creation/Deletion**: Only editing existing files is supported
5. **GitHub Integration**: Delayed to Sprint 3
6. **New Event Types**: Only `PLAN_UPDATED` event is in scope for stabilization

## 7. Dependencies

### External Dependencies
- **mitt** (v3.0.1): Event emitter library for Context Bus
- **@monaco-editor/react** (v4.6.0): Editor component
- **googleapis** (v131.0.0): Google Drive API client
- **next-auth** (v4.24.0): Authentication

### Internal Dependencies
- `ContextBusProvider` must be initialized before `RepositoryProvider`
- `ChatPanel` components must be descendants of `ContextBusProvider`
- `useSyncStatus` hook must be used within `RepositoryProvider`

## 8. Testing Requirements

### Manual Testing Checklist
1. **Round-Trip Event Test**:
   - Open 3+ ChatPanels
   - Edit and save `task_plan.md`
   - Verify console shows emission log
   - Verify console shows reception logs for all panels
   - Verify "Context Refreshed" toast appears in all panels
   - Screenshot console output

2. **Optimistic UI Test**:
   - Disconnect network (browser DevTools)
   - Edit and save a file
   - Verify UI shows "saved" state immediately
   - Verify error appears after network timeout
   - Reconnect network
   - Click retry button
   - Verify successful sync

3. **Sync Status Test**:
   - Verify green icon when idle
   - Verify yellow pulsing icon while saving
   - Verify red icon on errors
   - Verify retry button appears on errors
   - Verify tooltip shows operation details

### Verification Artifacts
- Console screenshot showing successful round-trip event flow
- Screen recording of optimistic UI + rollback scenario
- Updated `JOURNAL.md` with technical explanation of fixes

## 9. Documentation Requirements

### Code Documentation
- Add JSDoc comments to `useContextBusSubscription` hook explaining stable subscription pattern
- Document optimistic UI pattern in `RepositoryProvider` with inline comments
- Add warning comment about rollback state management

### Journal Entry
Update `JOURNAL.md` with:
- **Issue Analysis**: Why events weren't being received (root cause)
- **Solution Implemented**: Technical changes made to fix the issue
- **Verification Results**: Console log evidence of working round-trip
- **Performance Impact**: Measured event propagation times

## 10. Success Metrics

### Quantitative Metrics
- Event delivery success rate: 100% (6/6 panels receive events)
- Event propagation time: <100ms (measured via timestamp delta)
- Optimistic UI response time: <16ms (single frame)
- Zero memory leaks (verified via Chrome DevTools memory profiler)

### Qualitative Metrics
- All ChatPanels feel "responsive" and "aware" of context changes
- Sync status provides clear, actionable feedback
- Error recovery feels smooth and non-intrusive
- Console logs are readable and useful for debugging

## 11. Assumptions and Constraints

### Assumptions
1. All users have stable internet connections (>1Mbps)
2. Google Drive API is available and responsive (<2s response time)
3. Maximum 6 concurrent ChatPanels (enforced by UI)
4. Files are smaller than 1MB (Monaco editor limit)
5. Users have valid OAuth tokens (no token refresh in scope)

### Constraints
1. Must maintain backward compatibility with existing Sprint 2 code
2. Cannot modify external libraries (mitt, monaco, googleapis)
3. Must work in dev mode with mock authentication
4. Must pass TypeScript strict mode checks
5. Must not break existing animations or UI transitions

## 12. Risk Assessment

### High Risk
- **Event Subscription Stability**: If subscription cleanup is incorrect, memory leaks could occur
- **Optimistic Rollback Complexity**: Race conditions between API response and user edits

### Medium Risk
- **React.memo Compatibility**: Custom comparison function might interfere with event updates
- **Provider Re-render Cascade**: Changes to provider state might trigger excessive re-renders

### Low Risk
- **Console Log Performance**: Logging overhead is negligible for this use case
- **Sync Status Animation**: Visual updates are isolated to SyncStatus component

### Mitigation Strategies
1. Use React DevTools Profiler to verify zero memory leaks
2. Add unit tests for rollback state transitions (future work)
3. Implement debug mode toggle for verbose console logging
4. Monitor bundle size to ensure no significant increase

## 13. Rollout Plan

### Phase 1: Context Bus Fix (Priority 1)
1. Diagnose event subscription issue in ChatPanel
2. Implement stable subscription pattern
3. Verify round-trip event flow with console logs
4. Capture screenshot proof

### Phase 2: Optimistic UI (Priority 1)
1. Implement optimistic savedContent update
2. Add rollback logic for failed API calls
3. Test with network disconnect scenarios
4. Verify local changes are preserved

### Phase 3: Sync Status Enhancement (Priority 2)
1. Connect SyncStatus to useSyncStatus hook
2. Implement retry button with loading state
3. Add operation tooltips
4. Test all error scenarios

### Phase 4: Documentation (Priority 2)
1. Update JOURNAL.md with technical explanation
2. Add console log screenshots
3. Document root cause analysis
4. Update AUDIT_LOG.md with sprint completion

## 14. Acceptance Sign-Off

This sprint is complete when all of the following are verified:

- [ ] Console shows `[ContextBus] Emitting PLAN_UPDATED event...` when saving task_plan.md
- [ ] Console shows `[ContextBus] Plan update received for Agent: Manus` (and all other active agents)
- [ ] "Context Refreshed" toast appears in all active ChatPanels within 3 seconds
- [ ] Screenshot of console output is saved to `05_Logs/` directory
- [ ] Optimistic UI updates savedContent immediately upon save
- [ ] Failed API calls rollback optimistic state within 50ms
- [ ] SyncStatus shows correct states: synced (green), syncing (yellow pulse), error (red)
- [ ] Retry button appears and functions correctly on errors
- [ ] JOURNAL.md is updated with root cause analysis and solution
- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run build` succeeds
- [ ] Localhost verification confirms typing in editor triggers context refresh

---

**Document Version**: 1.0  
**Last Updated**: January 10, 2026  
**Approved By**: Pending Review
