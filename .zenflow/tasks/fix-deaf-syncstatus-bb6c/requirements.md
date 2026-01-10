# Product Requirements Document: Fix "Deaf" SyncStatus

**Date**: January 10, 2026  
**Status**: Sprint 2 Stabilization - Critical Bug Fix  
**Priority**: P0 - Critical (Data Integrity UX)

---

## Problem Statement

The SyncStatus component is unable to display error states and retry functionality despite the RepositoryProvider correctly tracking file operation failures. This creates a critical UX gap where users receive no visual feedback when save operations fail, potentially leading to data loss.

### Root Cause

Both `RepositoryProvider` and `SyncStatus` create independent instances of the `useSyncStatus` hook, resulting in isolated state. When `RepositoryProvider` reports an error via `addOperation({ status: 'error' })`, the `SyncStatus` component never receives this update because it's observing a different state instance.

**Evidence**:
- `RepositoryProvider.tsx:42`: `const { status: syncStatus, addOperation } = useSyncStatus();`
- `SyncStatus.tsx:16`: `const { status: syncStatus } = useSyncStatus();`

---

## Current State Analysis

### What Works ✅
- Context Bus architecture is robust and functioning correctly
- RepositoryProvider properly tracks file operations, errors, and includes retry logic
- SyncStatus component correctly displays green "Synced" state
- Tooltip functionality works and shows operation details
- All UI components and animations are properly implemented
- Retry button implementation exists and is correctly wired to `useRepository().retrySave()`

### What's Broken ❌
- Error states (red icon) never display despite 300+ failed save attempts during offline testing
- Retry button never appears because `syncStatus.isError` is always false in the SyncStatus component
- Users have no visual indication when saves fail
- Yellow pulsing "syncing" animation cannot be observed (too fast, but implementation exists)

---

## User Stories

### US-1: Visual Feedback on Save Failure
**As a** user editing a document  
**I want to** see a red error icon when my save fails  
**So that** I know my changes haven't been persisted and can take action

**Acceptance Criteria**:
- When network is offline and save fails, cloud icon turns red
- Error state displays within 500ms of save failure
- Icon color returns to green when error is resolved

### US-2: Retry Failed Save Operations
**As a** user who experienced a save failure  
**I want to** see a retry button next to the error icon  
**So that** I can manually retry the save operation without needing to edit the document again

**Acceptance Criteria**:
- Retry button (RotateCw icon) appears next to cloud icon when `isError` is true
- Button is accessible with proper ARIA labels
- Clicking retry calls `retrySave()` and clears the error state
- Button animates during retry operation (360° rotation, 0.6s duration)

### US-3: Accurate Sync Status Display
**As a** user working with files  
**I want** the sync status to accurately reflect the current state of all file operations  
**So that** I can trust the application's feedback about my data

**Acceptance Criteria**:
- All sync operations (fetch, save) are tracked in a shared state
- SyncStatus component displays the same state as RepositoryProvider tracks
- State updates propagate to UI within one React render cycle

---

## Technical Requirements

### TR-1: Shared State Architecture
Create a `SyncStatusProvider` context to ensure single source of truth for sync operations.

**Implementation Details**:
- File: `components/providers/SyncStatusProvider.tsx`
- Wraps `useSyncStatus` hook in a context provider
- Exports `useSyncStatusContext()` hook for consuming components
- Throws error if used outside provider scope

**Interface**:
```typescript
interface SyncStatusContextValue {
  status: SyncStatusState;
  addOperation: (operation: Omit<SyncOperation, 'id' | 'timestamp'>) => void;
  retryLastFailed: () => Promise<void>;
  clearOperations: () => void;
}
```

### TR-2: Provider Integration
Update application layout to include `SyncStatusProvider`.

**Implementation Details**:
- File: `app/layout.tsx`
- Position: Above `RepositoryProvider` in the component tree
- Maintains existing provider order: `ContextBusProvider` → `MockSessionProvider` → **`SyncStatusProvider`** → `RepositoryProvider`

### TR-3: Component Migration
Update both `RepositoryProvider` and `SyncStatus` to consume shared context.

**Files to Modify**:
1. `components/providers/RepositoryProvider.tsx`
   - Replace `useSyncStatus()` with `useSyncStatusContext()`
   - Remove direct hook import
   - Update `syncStatus` and `addOperation` to use context values

2. `components/shared/SyncStatus.tsx`
   - Replace `useSyncStatus()` with `useSyncStatusContext()`
   - Remove direct hook import
   - Ensure retry button calls context's `retryLastFailed()` or repository's `retrySave()`

### TR-4: Retry Mechanism Connectivity
Ensure retry button functionality is properly wired.

**Decision Point**: The `SyncStatus` component currently calls `useRepository().retrySave()`. This should be preserved because:
- `retrySave()` includes file and error state validation
- It re-executes the full save operation with proper error handling
- The sync status context's `retryLastFailed()` only re-adds the operation to the queue without executing the save

---

## Non-Functional Requirements

### Performance
- State updates must not cause unnecessary re-renders
- Provider overhead should be negligible (<1ms per operation)
- No impact on existing Context Bus performance

### Reliability
- All existing sync status functionality must continue to work
- No regressions in green "synced" state or tooltips
- Context provider must handle edge cases (unmounting, rapid updates)

### Maintainability
- Clear separation of concerns between state management (hook) and state sharing (context)
- Consistent naming conventions with existing codebase
- Proper TypeScript types for all context values

---

## Testing Requirements

### Manual Testing Scenarios

#### Test 1: Offline Error State
1. Open application and load a file
2. Set browser to offline mode (DevTools → Network → Offline)
3. Edit file content to trigger auto-save
4. **Verify**: Cloud icon turns red within 500ms
5. **Verify**: "Error" text displays next to icon
6. **Verify**: Retry button appears with RotateCw icon

#### Test 2: Retry Functionality
1. Continue from Test 1 (offline with error state)
2. Set browser back to online mode
3. Click retry button
4. **Verify**: Button rotates 360° during retry
5. **Verify**: Error clears and icon turns green
6. **Verify**: Retry button disappears
7. **Verify**: File is successfully saved

#### Test 3: No Regression on Success Path
1. Load a file with network online
2. Edit content
3. Wait for auto-save
4. **Verify**: Green "Synced" state displays
5. **Verify**: No retry button appears
6. **Verify**: Tooltip shows "Last synced X seconds ago"

### Automated Testing (Future)
- Integration tests for state transitions (synced → syncing → error → synced)
- Context provider unit tests
- Mock offline scenarios in test environment

---

## Success Metrics

### Immediate (Post-Fix)
- Error state displays during offline testing
- Retry button appears and functions correctly
- All existing tests continue to pass
- No console errors or warnings

### Long-Term (Sprint 2 Completion)
- Zero user reports of "silent save failures"
- Successful completion of all Sprint 2 acceptance criteria
- Lint and type-check commands pass without errors

---

## Out of Scope

The following items are explicitly **not** part of this fix:

1. **Saving Animation Visibility**: The yellow pulsing animation exists but is too fast to observe due to 500ms debounce + fast network. This is not a bug and does not require fixing.

2. **Enhanced Error Messages**: Displaying specific error messages (e.g., "Network offline" vs. "Permission denied") is not required. The generic "Error" state is sufficient.

3. **Persistent Error Notifications**: Adding toast notifications or persistent banners for errors is outside scope. Visual icon feedback is sufficient.

4. **Retry Queue Management**: Automatic retry with exponential backoff is not required. Manual retry via button is sufficient.

5. **GitHub Sync Status**: The GitHub sync portion uses mock data and is not affected by this bug. No changes required.

---

## Dependencies

### Required Files (Existing)
- `hooks/useSyncStatus.ts` - Core sync status hook (no changes needed)
- `lib/types.ts` - Type definitions for SyncOperation and SyncStatusState
- `components/providers/RepositoryProvider.tsx` - Consumes sync status
- `components/shared/SyncStatus.tsx` - Displays sync status
- `app/layout.tsx` - Application layout

### New Files to Create
- `components/providers/SyncStatusProvider.tsx` - Shared state context

### External Dependencies
- React Context API (built-in)
- Existing hooks: `useRepository`, `useSyncStatus`
- Type definitions from `@/lib/types`

---

## Assumptions

1. **Single Instance**: Only one `SyncStatusProvider` will exist in the application tree
2. **Provider Order**: `SyncStatusProvider` must wrap `RepositoryProvider` to make context available
3. **Hook Behavior**: The `useSyncStatus` hook's internal logic does not need modification
4. **Repository Integration**: The `RepositoryProvider` will continue to be the sole source of sync operations
5. **Retry Mechanism**: The existing `retrySave()` implementation in RepositoryProvider is correct and complete

---

## Implementation Phases

### Phase 1: Create Shared State Provider ✓
- Create `SyncStatusProvider.tsx` with context and hook
- Export `useSyncStatusContext()` for consumers
- Follow pattern from existing providers (ContextBusProvider, RepositoryProvider)

### Phase 2: Integrate Provider ✓
- Add `SyncStatusProvider` to `app/layout.tsx`
- Position above `RepositoryProvider`
- Verify no layout or styling regressions

### Phase 3: Migrate Consumers ✓
- Update `RepositoryProvider` to use `useSyncStatusContext()`
- Update `SyncStatus` to use `useSyncStatusContext()`
- Remove direct `useSyncStatus` imports from both files

### Phase 4: Verification ✓
- Run all manual tests (offline error, retry, success path)
- Execute `npm run lint` and `npm run type-check`
- Verify retry button appears and functions
- Confirm error states display correctly

---

## Risk Assessment

### Low Risk ✅
- **Provider Pattern**: Well-established pattern already used in codebase (ContextBusProvider, RepositoryProvider)
- **Minimal Code Changes**: Only touching 3 files (create 1, modify 2)
- **Type Safety**: TypeScript will catch context usage errors at compile time
- **Isolated Change**: No impact on Context Bus or other systems

### Mitigations
- Follow exact pattern from sync-status-test-results.md (lines 239-274)
- Test thoroughly in offline mode before marking complete
- Keep existing functionality untouched (tooltips, green state, GitHub sync)

---

## References

- **Diagnosis Document**: `05_Logs/screenshots/sync-status-test-results.md`
- **Root Cause**: Lines 84-102 (state isolation explanation)
- **Proposed Fix**: Lines 239-274 (SyncStatusProvider implementation)
- **Test Evidence**: Screenshots sync-status-error-state.png (showing bug)
- **Network Logs**: 300+ ERR_INTERNET_DISCONNECTED during offline test
