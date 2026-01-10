# Technical Specification: Sprint 2 Stabilization

## 1. Technical Context

### Language & Framework
- **Frontend**: React 18.3.1 with Next.js 14.2.24
- **Type System**: TypeScript 5.7.2 (strict mode enabled)
- **State Management**: React Context API with custom hooks
- **Event System**: mitt 3.0.1 (event emitter library)
- **Animation**: framer-motion 11.15.0
- **Editor**: @monaco-editor/react 4.6.0

### Project Structure
```
components/
├── providers/
│   ├── ContextBusProvider.tsx    (Event emitter context)
│   └── RepositoryProvider.tsx    (File state & sync management)
├── multi-agent/
│   └── ChatPanel.tsx             (Agent UI, event subscriber)
└── shared/
    └── SyncStatus.tsx            (Sync status indicator)
hooks/
├── useContextBus.ts              (Context bus accessor hook)
└── useSyncStatus.ts              (Sync operation tracking)
lib/
└── types.ts                      (TypeScript interfaces)
```

### Build & Test Commands
- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Linting**: `npm run lint`
- **Type Check**: `npm run type-check`

## 2. Root Cause Analysis

### Issue #1: Context Bus Event Reception Failure

**Symptoms**: 
- `PLAN_UPDATED` event emitted successfully (confirmed via console logs in RepositoryProvider.tsx:146)
- ChatPanel components don't receive the event (no logs in ChatPanel.tsx:53-58)

**Root Cause**:
The `ChatPanel.tsx:69-73` useEffect has an unstable dependency on the `contextBus` object returned from `useContextBus()`. While the `ContextBusProvider` correctly memoizes the context value (ContextBusProvider.tsx:35-56), the `useEffect` in ChatPanel re-subscribes on every render where any dependency changes, potentially missing events or creating subscription timing issues.

**Additional Issues**:
1. The event handler `handlePlanUpdate` (ChatPanel.tsx:51) is not memoized, causing new function references on each render
2. The handler is passed directly to `contextBus.on()`, but then a different reference is passed to `contextBus.off()` during cleanup, potentially failing to unsubscribe correctly
3. React.memo's custom comparison (ChatPanel.tsx:265-295) doesn't prevent internal state changes from triggering re-renders, which recreate the handler function

### Issue #2: Non-Optimistic Google Drive Sync

**Symptoms**:
- UI feels sluggish during file saves
- No visual feedback until server responds
- Network errors cause poor UX

**Root Cause**:
The `RepositoryProvider.saveFile()` method (RepositoryProvider.tsx:106-166) updates `savedContent` state **only after** successful API response (line 135). This creates a synchronous flow where:
1. User triggers save
2. UI waits for PATCH request
3. UI updates only on success
4. No rollback mechanism exists for failures

**Implementation Gap**:
- No optimistic state update before API call
- No rollback queue or previous state tracking
- Error state doesn't preserve the ability to retry with original content

### Issue #3: Incomplete Sync Status Integration

**Symptoms**:
- SyncStatus component exists but may not reflect all operation states
- Retry mechanism exists but not integrated with RepositoryProvider's retry logic

**Current State**:
- `SyncStatus.tsx` correctly displays operation states from `useSyncStatus`
- `RepositoryProvider` uses `addOperation()` to track operations
- However, retry button in SyncStatus calls `retryLastFailed()` which only re-adds the operation to the queue but doesn't actually re-invoke the save logic

## 3. Implementation Approach

### Phase 1: Fix Context Bus Subscription Stability

#### 3.1 Refactor ChatPanel Event Subscription
**File**: `components/multi-agent/ChatPanel.tsx`

**Changes**:
1. Replace direct `useEffect` subscription with the existing `useContextBusSubscription` hook (already implemented in hooks/useContextBus.ts:22-45)
2. Remove manual subscription logic from lines 50-74
3. The `useContextBusSubscription` hook already implements stable subscription pattern with `useRef` to maintain handler stability

**Technical Rationale**:
The `useContextBusSubscription` hook (hooks/useContextBus.ts) already solves this problem by:
- Using `useRef` to store handler (line 27)
- Creating a stable wrapper function (line 35)
- Only re-subscribing when the event type changes, not when handler changes
- This pattern prevents subscription churn and ensures events are always received

#### 3.2 Add Diagnostic Logging
**Files**: 
- `components/providers/ContextBusProvider.tsx`
- `components/multi-agent/ChatPanel.tsx`

**Changes**:
1. Add logging in `ContextBusProvider.emit()` to log all emissions
2. Add logging in `ContextBusProvider.on()` to track subscriptions
3. Add logging in `ContextBusProvider.off()` to track unsubscriptions
4. Include timestamps and content previews (first 100 chars) in logs

**Log Format**:
```
[ContextBus] Emitting {event} at {ISO timestamp}
[ContextBus] {AgentName} subscribed to {event}
[ContextBus] {AgentName} received {event} at {ISO timestamp} (delay: {ms}ms)
[ContextBus] {AgentName} unsubscribed from {event}
```

### Phase 2: Implement Optimistic UI Pattern

#### 3.1 Add Rollback State Management
**File**: `components/providers/RepositoryProvider.tsx`

**New State Variables**:
```typescript
const [rollbackContent, setRollbackContent] = useState<string>("");
```

**Modified `saveFile()` Logic**:
```typescript
async function saveFile() {
  if (!activeFile || !isDirty) return;
  
  // Step 1: Capture rollback point
  setRollbackContent(savedContent);
  
  // Step 2: Optimistic update (immediate UI feedback)
  setSavedContent(fileContent);
  setIsSaving(true);
  
  // Step 3: Attempt API call
  try {
    const response = await fetch(...);
    if (!response.ok) throw new Error(...);
    
    // Step 4: Confirm optimistic update
    setLastSaved(new Date());
    setRollbackContent(""); // Clear rollback
  } catch (err) {
    // Step 5: Rollback on failure
    setSavedContent(rollbackContent);
    setError(errorMessage);
  } finally {
    setIsSaving(false);
  }
}
```

**Performance Constraints**:
- Rollback must execute synchronously (single setState call)
- Target rollback time: <50ms (perceived as instant)
- Optimistic update must trigger within 16ms (single frame at 60fps)

#### 3.2 Enhance Error Recovery
**File**: `components/providers/RepositoryProvider.tsx`

**Changes to `retrySave()`**:
```typescript
const retrySave = useCallback(async () => {
  if (!activeFile || !error) return;
  
  // Clear error state before retry
  setError(null);
  
  // Re-attempt save with current content
  await saveFile();
}, [activeFile, error, saveFile]);
```

**Integration with SyncStatus**:
The existing `SyncStatus` component already displays retry button when `syncStatus.isError` is true. We need to ensure `RepositoryProvider.retrySave()` is accessible from the context and called when retry button is clicked.

### Phase 3: Enhance Sync Status Feedback

#### 3.1 Connect Retry Button to Repository
**File**: `components/shared/SyncStatus.tsx`

**Changes**:
1. Import `useRepository` hook (need to create this hook to access RepositoryContext)
2. Replace `retryLastFailed()` call with `repository.retrySave()`
3. Display operation details in tooltip (fileName, operation type)

#### 3.2 Add Operation Tooltips
**File**: `components/shared/SyncStatus.tsx`

**Changes**:
1. Add tooltip component (can use native HTML title or create custom)
2. Display current operation details: "Saving task_plan.md", "Loading prompts.md"
3. Show last sync timestamp in human-readable format ("2 seconds ago")

**Implementation**:
```typescript
const getOperationTooltip = (): string => {
  if (syncStatus.currentOperation) {
    return `${syncStatus.currentOperation.type} ${syncStatus.currentOperation.fileName}`;
  }
  if (syncStatus.lastSync) {
    const seconds = Math.floor((Date.now() - syncStatus.lastSync.getTime()) / 1000);
    return `Last synced ${seconds} seconds ago`;
  }
  return 'Not synced yet';
};
```

### Phase 4: Multi-Agent State Sync Enhancement

#### 4.1 Verify Event Flow
**Files**: 
- `components/providers/RepositoryProvider.tsx` (emitter)
- `components/multi-agent/ChatPanel.tsx` (subscriber)

**Current Flow**:
```
User saves task_plan.md
  ↓
RepositoryProvider.saveFile() (line 106)
  ↓
PATCH /api/drive/content/{fileId} (line 122)
  ↓
On success: emit('PLAN_UPDATED', ...) (line 147)
  ↓
ChatPanel receives event via useEffect (line 69)
  ↓
Update systemContext state (line 60)
  ↓
Show toast (line 61)
```

**Verification**:
After implementing Phase 1 (stable subscription), this flow should work reliably. The key is ensuring the subscription is active before the event is emitted.

#### 4.2 Toast Auto-Dismiss
**File**: `components/multi-agent/ChatPanel.tsx`

**Current Implementation**: Already correct (lines 63-66)
- Toast appears when `showContextToast` becomes true
- Auto-dismisses after 3000ms
- Uses AnimatePresence for smooth transitions

## 4. Data Model Changes

### New State in RepositoryProvider
```typescript
interface RepositoryProviderState {
  // ... existing state ...
  rollbackContent: string;  // NEW: Stores pre-save content for rollback
}
```

### No Changes to Event Contract
The existing `PLAN_UPDATED` event structure remains unchanged:
```typescript
{ 
  type: 'PLAN_UPDATED'; 
  payload: { content: string; timestamp: Date } 
}
```

## 5. API & Interface Changes

### New Hook: useRepository
**File**: `hooks/useRepository.ts` (to be created)

```typescript
export function useRepository() {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepository must be used within RepositoryProvider');
  }
  return context;
}
```

**Purpose**: Provide type-safe access to RepositoryContext, similar to existing `useContextBus` hook pattern.

### Modified Interface: None
All existing interfaces remain compatible. No breaking changes.

## 6. Delivery Phases

### Phase 1: Context Bus Fix (Critical Priority)
**Estimated Time**: 30 minutes  
**Files Changed**: 1 (ChatPanel.tsx)  
**Verification**: Console logs show round-trip event flow

**Deliverables**:
- ChatPanel uses `useContextBusSubscription` hook
- Console logs show event emission
- Console logs show event reception in all panels
- Screenshot of console output

**Tests**:
1. Open 3 ChatPanels
2. Edit and save task_plan.md
3. Verify all panels log reception within 100ms

### Phase 2: Optimistic UI (Critical Priority)
**Estimated Time**: 45 minutes  
**Files Changed**: 1 (RepositoryProvider.tsx)  
**Verification**: UI updates immediately, rollback works on errors

**Deliverables**:
- Optimistic savedContent update before API call
- Rollback mechanism on API failure
- Error state preserved for retry
- Local changes never lost

**Tests**:
1. Disconnect network
2. Save file
3. Verify UI shows "saved" immediately
4. Verify error appears after timeout
5. Verify rollback preserves content
6. Reconnect and retry

### Phase 3: Sync Status Enhancement (High Priority)
**Estimated Time**: 30 minutes  
**Files Changed**: 2 (SyncStatus.tsx, new useRepository.ts)  
**Verification**: Retry button triggers actual re-save

**Deliverables**:
- SyncStatus retry button calls RepositoryProvider.retrySave()
- Operation tooltips show current activity
- Last sync timestamp displayed

**Tests**:
1. Trigger save error
2. Click retry button
3. Verify saveFile() is called
4. Verify success clears error state

### Phase 4: Documentation (High Priority)
**Estimated Time**: 20 minutes  
**Files Changed**: 1 (JOURNAL.md)  
**Verification**: Complete technical explanation with screenshots

**Deliverables**:
- Root cause analysis documented
- Solution approach explained
- Console log screenshots included
- Performance metrics recorded

## 7. Verification Approach

### Manual Testing Checklist
- [ ] **Round-Trip Event Test**: Open 3 ChatPanels, save task_plan.md, verify console logs
- [ ] **Optimistic UI Test**: Disconnect network, save file, verify immediate UI update + rollback
- [ ] **Retry Test**: Trigger error, click retry button, verify successful save
- [ ] **Performance Test**: Measure event propagation delay (must be <100ms)
- [ ] **Memory Test**: Open/close 10 ChatPanels, verify no memory leaks in DevTools

### Automated Verification
- [ ] Run `npm run lint` → Zero warnings
- [ ] Run `npm run type-check` → Zero errors
- [ ] Run `npm run build` → Successful build

### Console Log Requirements
Must capture screenshot showing:
```
[ContextBus] Emitting PLAN_UPDATED event for task_plan.md at 2026-01-10T21:08:00.000Z
[ContextBus] Plan update received for Agent: Manus { timestamp: "2026-01-10T21:08:00.001Z", contentPreview: "..." }
[ContextBus] Plan update received for Agent: Supervisor { timestamp: "2026-01-10T21:08:00.002Z", contentPreview: "..." }
```

### Performance Metrics
- **Event Propagation**: <100ms (measure timestamp delta)
- **Optimistic Update**: <16ms (single frame)
- **Rollback**: <50ms (perceived as instant)

## 8. Risk Mitigation

### High Risk: Event Subscription Stability
**Risk**: If useContextBusSubscription has bugs, events still won't be received  
**Mitigation**: The hook already exists and follows React best practices. We've reviewed the code and it implements the stable subscription pattern correctly.

### Medium Risk: Optimistic Rollback Race Conditions
**Risk**: User edits content during API call, rollback overwrites new changes  
**Mitigation**: Rollback only updates `savedContent`, not `fileContent`. The `isDirty` flag will correctly show the file as modified if user made additional changes during save.

### Medium Risk: React.memo Interference
**Risk**: Custom arePropsEqual may prevent event-triggered re-renders  
**Mitigation**: The `systemContext` state change is internal to ChatPanel and doesn't depend on props. React.memo only controls re-renders from prop changes, not internal state updates.

### Low Risk: Bundle Size Increase
**Risk**: Additional logging code increases bundle size  
**Mitigation**: Console logs are only strings, negligible size impact (<1KB). Can be removed in production build if needed.

## 9. Code Quality Standards

### TypeScript
- Maintain strict mode compliance (no `any` types)
- Use existing type interfaces from `lib/types.ts`
- No new ESLint warnings

### React Patterns
- Follow existing hook patterns (useCallback, useMemo)
- Maintain existing context provider structure
- Preserve React.memo optimizations

### Code Style
- Follow existing naming conventions (camelCase for functions, PascalCase for components)
- Maintain consistent indentation (2 spaces)
- Add inline comments only for complex logic (optimistic update, rollback)
- Keep component files under 300 lines

### Animation & UI
- Maintain "Calm UI" aesthetic (200-300ms transitions)
- Use existing ANIMATION_EASE constant from lib/constants
- Preserve existing framer-motion patterns

## 10. Dependencies & Constraints

### Provider Initialization Order
**Constraint**: ContextBusProvider MUST wrap RepositoryProvider  
**Current State**: Needs verification in app layout  
**Impact**: If order is wrong, RepositoryProvider can't access context bus

### Concurrent Panel Limit
**Constraint**: Maximum 6 ChatPanels can be active simultaneously  
**Current State**: Enforced by UI design  
**Impact**: Event propagation testing limited to 6 subscribers

### File Size Limit
**Constraint**: Monaco editor limited to 1MB files  
**Current State**: No validation in place  
**Impact**: Optimistic update and rollback must work for files up to 1MB

### Authentication
**Constraint**: Must work with mock auth in development mode  
**Current State**: NextAuth configured for Google OAuth  
**Impact**: API calls may fail if auth is not properly configured

## 11. Rollback Plan

If implementation causes regressions:

### Immediate Rollback Actions
1. Revert ChatPanel to direct useEffect subscription
2. Revert RepositoryProvider to synchronous save (wait for API response)
3. Keep diagnostic logging (low risk, high debugging value)

### Verification After Rollback
- Confirm existing functionality still works
- Document why implementation failed
- Plan alternative approach

## 12. Success Criteria

### Functional Success
- ✅ All ChatPanels receive PLAN_UPDATED events within 100ms
- ✅ Console logs show successful round-trip event flow
- ✅ UI updates optimistically before API response
- ✅ Rollback works correctly on API failures
- ✅ Retry button successfully re-attempts failed saves

### Technical Success
- ✅ Zero TypeScript errors in strict mode
- ✅ Zero ESLint warnings
- ✅ Successful production build
- ✅ Zero memory leaks (verified via DevTools)

### Documentation Success
- ✅ JOURNAL.md updated with root cause analysis
- ✅ Console log screenshots captured
- ✅ Technical solution documented

### Performance Success
- ✅ Event propagation: <100ms
- ✅ Optimistic update: <16ms
- ✅ Rollback: <50ms

## 13. Out of Scope

This implementation does NOT include:
- Token refresh logic for expired OAuth sessions
- Offline mode with IndexedDB caching
- Conflict resolution (CRDT/OT algorithms)
- File creation/deletion operations
- GitHub integration
- New event types beyond PLAN_UPDATED
- Unit or integration test suites (manual testing only)

---

**Document Version**: 1.0  
**Created**: January 10, 2026  
**Target Completion**: Sprint 2 Stabilization  
**Next Step**: Create detailed implementation plan based on this specification
