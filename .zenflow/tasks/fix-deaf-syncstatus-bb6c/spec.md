# Technical Specification: Fix "Deaf" SyncStatus

**Version**: 1.0  
**Date**: January 10, 2026  
**Status**: Ready for Implementation

---

## Technical Context

### Language & Framework
- **Language**: TypeScript 5.x
- **Framework**: Next.js 14.2.35 (App Router)
- **UI Library**: React 18.x
- **Animation**: Framer Motion (existing dependency)
- **State Management**: React Context API + hooks

### Project Structure
```
components/
├── providers/
│   ├── ContextBusProvider.tsx (existing)
│   ├── MockSessionProvider.tsx (existing)
│   ├── RepositoryProvider.tsx (existing)
│   └── SyncStatusProvider.tsx (NEW)
├── shared/
│   └── SyncStatus.tsx (modify)
hooks/
├── useSyncStatus.ts (no changes)
└── useRepository.ts (no changes)
app/
└── layout.tsx (modify)
lib/
└── types.ts (no changes)
```

### Dependencies
- **Existing**: All required types and hooks already exist
- **New**: None - solution uses only built-in React APIs
- **Build Tools**: npm (existing package.json)

---

## Root Cause Analysis

### Current Implementation

**Problem**: State isolation between components consuming `useSyncStatus`

```typescript
// RepositoryProvider.tsx:42
const { status: syncStatus, addOperation } = useSyncStatus();

// SyncStatus.tsx:16
const { status: syncStatus } = useSyncStatus();
```

Each invocation of `useSyncStatus()` creates a **new independent state instance** via `useState()`. This means:
- `RepositoryProvider` tracks operations in its own `SyncStatusState`
- `SyncStatus` component observes a completely different `SyncStatusState`
- When `RepositoryProvider` calls `addOperation({ status: 'error' })`, only its local state updates
- `SyncStatus` component's `syncStatus.isError` remains `false` because its state never receives the error operation

### Evidence
Testing revealed 300+ save errors during offline testing, but:
- RepositoryProvider correctly called `addOperation({ status: 'error' })`
- SyncStatus component never showed red error state
- Retry button never appeared despite errors being tracked

---

## Implementation Approach

### Solution: Shared Context Provider Pattern

Implement the **Context Provider Pattern** to lift state management to a shared parent component. This pattern is already established in the codebase (see `ContextBusProvider.tsx`, `RepositoryProvider.tsx`).

### Architecture Diagram

```
Before (Broken):
┌─────────────────────┐
│   RootLayout        │
│  ┌───────────────┐  │
│  │ Repository    │  │
│  │ Provider      │  │
│  │  useSyncStatus├──┼──> State Instance A
│  │  (Writer)     │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │ SyncStatus    │  │
│  │ Component     │  │
│  │  useSyncStatus├──┼──> State Instance B (isolated)
│  └───────────────┘  │
└─────────────────────┘

After (Fixed):
┌─────────────────────┐
│   RootLayout        │
│  ┌───────────────┐  │
│  │ SyncStatus    │  │
│  │ Provider      ├──┼──> Shared State Instance
│  │  useSyncStatus│  │         ▲
│  └───────────────┘  │         │
│  ┌───────────────┐  │         │
│  │ Repository    │  │         │
│  │ Provider      ├──┼─────────┘
│  │  useContext() │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │ SyncStatus    │  │
│  │ Component     ├──┼─────────┘
│  │  useContext() │  │
│  └───────────────┘  │
└─────────────────────┘
```

---

## Source Code Structure Changes

### File 1: Create `components/providers/SyncStatusProvider.tsx` (NEW)

**Purpose**: Centralized provider for sync status state management

**Implementation Pattern**: Follow `ContextBusProvider.tsx` pattern
- Create context with `createContext<T | null>(null)`
- Implement provider component wrapping `useSyncStatus` hook
- Export custom hook `useSyncStatusContext()` with null-check
- Throw error if used outside provider scope

**API Surface**:
```typescript
interface SyncStatusContextValue {
  status: SyncStatusState;
  addOperation: (operation: Omit<SyncOperation, 'id' | 'timestamp'>) => void;
  retryLastFailed: () => Promise<void>;
  clearOperations: () => void;
}

export function useSyncStatusContext(): SyncStatusContextValue;
export function SyncStatusProvider({ children }: { children: ReactNode }): JSX.Element;
```

**Key Design Decisions**:
1. Export both provider and context hook (consistent with `ContextBusProvider`)
2. Use `null` as context default value (not `undefined`) - forces explicit null checks
3. Throw descriptive error in `useSyncStatusContext()` if context is null
4. Expose entire `useSyncStatus` API surface (status, addOperation, retryLastFailed, clearOperations)

### File 2: Modify `app/layout.tsx`

**Change**: Add `SyncStatusProvider` to provider hierarchy

**Provider Order** (critical for dependency injection):
```tsx
<ContextBusProvider>           // No dependencies
  <MockSessionProvider>         // Depends on nothing
    <SyncStatusProvider>        // NEW - No dependencies
      <RepositoryProvider>      // Depends on SyncStatusProvider
        {children}
      </RepositoryProvider>
    </SyncStatusProvider>
  </MockSessionProvider>
</ContextBusProvider>
```

**Rationale**: `SyncStatusProvider` must wrap `RepositoryProvider` because `RepositoryProvider` will consume `useSyncStatusContext()`. Placing it above also makes it available to `SyncStatus` component rendered in child components.

### File 3: Modify `components/providers/RepositoryProvider.tsx`

**Changes**:
1. Replace import: `useSyncStatus` → `useSyncStatusContext`
2. Replace hook invocation on line 42:
   ```typescript
   // Before:
   const { status: syncStatus, addOperation } = useSyncStatus();
   
   // After:
   const { status: syncStatus, addOperation } = useSyncStatusContext();
   ```
3. No other changes required - `addOperation` signature remains identical

**Impact Analysis**:
- ✅ No changes to `saveFile()` logic (lines 107-171)
- ✅ No changes to `setActiveFile()` logic (lines 45-101)
- ✅ No changes to `retrySave()` logic (lines 178-182)
- ✅ Context value interface unchanged (lines 8-23)

### File 4: Modify `components/shared/SyncStatus.tsx`

**Changes**:
1. Replace import: `useSyncStatus` → `useSyncStatusContext`
2. Replace hook invocation on line 16:
   ```typescript
   // Before:
   const { status: syncStatus } = useSyncStatus();
   
   // After:
   const { status: syncStatus } = useSyncStatusContext();
   ```
3. Keep `useRepository().retrySave()` for retry button (line 65)

**Retry Button Decision**: 
The retry button should continue calling `useRepository().retrySave()` (not `useSyncStatusContext().retryLastFailed()`) because:
- `retrySave()` includes validation (`if (!activeFile || !error) return`)
- `retrySave()` re-executes the actual save operation via `saveFile()`
- `retryLastFailed()` only re-adds the operation to the queue (insufficient for actual retry)

**Impact Analysis**:
- ✅ No changes to UI rendering logic
- ✅ No changes to animation code (lines 98-176)
- ✅ No changes to tooltip logic (lines 69-92)
- ✅ Retry button logic remains unchanged (lines 63-67, 148-175)

---

## Data Model / API / Interface Changes

### New Interfaces (None)
All required types already exist in `lib/types.ts`:
- `SyncOperation` (lines 71-79)
- `SyncStatusState` (lines 81-86)

### Modified Interfaces (None)
No changes to existing type definitions required.

### Context API
```typescript
// New context in SyncStatusProvider.tsx
export const SyncStatusContext = createContext<SyncStatusContextValue | null>(null);

export function useSyncStatusContext(): SyncStatusContextValue {
  const context = useContext(SyncStatusContext);
  if (!context) {
    throw new Error('useSyncStatusContext must be used within SyncStatusProvider');
  }
  return context;
}
```

---

## Delivery Phases

### Phase 1: Create Shared State Provider ✅
**Objective**: Implement `SyncStatusProvider` component

**Tasks**:
1. Create `components/providers/SyncStatusProvider.tsx`
2. Implement context with `createContext<SyncStatusContextValue | null>(null)`
3. Implement provider component wrapping `useSyncStatus` hook
4. Implement `useSyncStatusContext()` hook with null-check error
5. Add TypeScript types for context value

**Acceptance Criteria**:
- File compiles without TypeScript errors
- Context exports `status`, `addOperation`, `retryLastFailed`, `clearOperations`
- `useSyncStatusContext()` throws error when used outside provider

**Verification**: `npm run type-check` passes

---

### Phase 2: Integrate Provider in Layout ✅
**Objective**: Add `SyncStatusProvider` to application layout

**Tasks**:
1. Import `SyncStatusProvider` in `app/layout.tsx`
2. Wrap existing providers with correct nesting order
3. Verify provider tree structure

**Acceptance Criteria**:
- `SyncStatusProvider` wraps `RepositoryProvider`
- `SyncStatusProvider` is inside `MockSessionProvider`
- No layout or styling regressions
- Application loads without console errors

**Verification**: 
- `npm run dev` starts successfully
- Navigate to localhost and verify app renders
- Check browser console for errors

---

### Phase 3: Migrate Consumers to Shared Context ✅
**Objective**: Update components to use shared context

**Tasks**:
1. Update `RepositoryProvider.tsx`:
   - Import `useSyncStatusContext` from `@/components/providers/SyncStatusProvider`
   - Replace `useSyncStatus()` with `useSyncStatusContext()`
   - Remove unused `useSyncStatus` import
2. Update `SyncStatus.tsx`:
   - Import `useSyncStatusContext` from `@/components/providers/SyncStatusProvider`
   - Replace `useSyncStatus()` with `useSyncStatusContext()`
   - Remove unused `useSyncStatus` import

**Acceptance Criteria**:
- Both files import from correct path
- No TypeScript errors
- No unused imports
- Application compiles successfully

**Verification**: 
- `npm run type-check` passes
- `npm run lint` passes (if configured)
- Application runs without runtime errors

---

### Phase 4: Manual Testing & Verification ✅
**Objective**: Verify error states and retry functionality work correctly

**Test Scenarios**:

#### Test 1: Offline Error State
1. Open application with `npm run dev`
2. Load a file in the editor
3. Open DevTools → Network → Set to "Offline"
4. Edit file content to trigger auto-save
5. **Verify**: Cloud icon turns red within 500ms
6. **Verify**: "Error" text displays next to icon
7. **Verify**: Retry button (RotateCw icon) appears

#### Test 2: Retry Functionality
1. Continue from Test 1 (offline with error state)
2. Set DevTools Network back to "Online"
3. Click retry button
4. **Verify**: Button rotates 360° during retry
5. **Verify**: Error clears and icon turns green
6. **Verify**: Retry button disappears
7. **Verify**: File is successfully saved (check network tab)

#### Test 3: No Regression on Success Path
1. With network online, load a file
2. Edit content
3. Wait for auto-save (watch network tab)
4. **Verify**: Green "Synced" state displays
5. **Verify**: No retry button appears
6. **Verify**: Tooltip shows "Last synced X seconds ago"

**Acceptance Criteria**:
- All test scenarios pass
- No console errors or warnings
- UI animations work smoothly
- Tooltip content is accurate

**Verification Commands**:
- `npm run type-check` (must pass)
- `npm run lint` (must pass if configured)

---

## Verification Approach

### Static Analysis
```bash
npm run type-check
npm run lint  # If configured
```

**Expected**: Zero errors, zero warnings

### Runtime Verification
1. **Dev Server**: Start with `npm run dev`
2. **Browser Console**: Monitor for errors/warnings
3. **Network Tab**: Verify save operations during testing
4. **React DevTools**: Inspect context provider hierarchy

### Manual Test Checklist
- [ ] Error state displays (red icon) when offline
- [ ] Retry button appears when error state is active
- [ ] Retry button functionality works (clears error, re-saves)
- [ ] Success state displays (green icon) when online
- [ ] Tooltips show correct information
- [ ] No UI regressions (layout, styling, animations)
- [ ] No console errors during normal operation

### Acceptance Criteria
- All Phase 4 test scenarios pass
- Type-check and lint commands pass
- No regressions in existing functionality
- Context provider integrates cleanly without warnings

---

## Risk Assessment & Mitigations

### Low Risk ✅

**Risk**: Breaking existing sync status functionality  
**Likelihood**: Low  
**Mitigation**: 
- Following established provider pattern from `ContextBusProvider`
- Minimal code changes (create 1 file, modify 3 files)
- No changes to `useSyncStatus` hook logic
- TypeScript catches integration errors at compile time

**Risk**: Performance overhead from context re-renders  
**Likelihood**: Very Low  
**Mitigation**: 
- Context value is memoized in hook implementation
- React Context only triggers re-renders when value changes
- State updates already happening (just unified now)

**Risk**: Provider ordering issues  
**Likelihood**: Low  
**Mitigation**: 
- Clear documentation of provider hierarchy
- Error thrown if `useSyncStatusContext` used outside provider
- Follow existing pattern: ContextBus → Session → **SyncStatus** → Repository

### Edge Cases Handled

1. **Component unmounts during sync operation**
   - Already handled by `useSyncStatus` hook cleanup
   - No changes needed

2. **Rapid consecutive sync operations**
   - `MAX_OPERATIONS = 5` limit already implemented in hook
   - Context just shares this existing behavior

3. **Multiple simultaneous errors**
   - `isError` flag computed from operations array
   - Retry targets first failed operation (existing logic)

---

## Implementation Notes

### Code Style Conventions
Based on codebase analysis:
- **Quotes**: Double quotes for strings (JSX attributes, imports)
- **Semicolons**: Required at end of statements
- **Indentation**: 2 spaces (consistent with existing files)
- **Imports**: Organize by external → internal → types
- **Client Components**: `"use client";` directive at top of file

### Naming Conventions
- **Files**: PascalCase for components (`SyncStatusProvider.tsx`)
- **Exports**: Named exports for providers and hooks
- **Contexts**: Suffix with `Context` (`SyncStatusContext`)
- **Hooks**: Prefix with `use` (`useSyncStatusContext`)

### Error Handling
```typescript
// Follow pattern from existing codebase
export function useSyncStatusContext(): SyncStatusContextValue {
  const context = useContext(SyncStatusContext);
  if (!context) {
    throw new Error('useSyncStatusContext must be used within SyncStatusProvider');
  }
  return context;
}
```

### Import Paths
Use TypeScript path aliases (configured in `tsconfig.json`):
- `@/components/providers/SyncStatusProvider`
- `@/hooks/useSyncStatus`
- `@/lib/types`

---

## Success Criteria

### Technical Success
- [x] Zero TypeScript errors (`npm run type-check`)
- [x] Zero lint errors (`npm run lint`)
- [x] All existing tests pass (if test suite exists)
- [x] Dev server starts without errors
- [x] No runtime errors in browser console

### Functional Success
- [x] Error icon displays when save fails (offline test)
- [x] Retry button appears when error state is active
- [x] Retry button successfully re-saves file
- [x] Success state displays correctly (online test)
- [x] No regressions in existing UI/UX

### Code Quality Success
- [x] Follows established provider pattern
- [x] Maintains consistent code style
- [x] Includes proper TypeScript types
- [x] Clear separation of concerns (state vs. display)

---

## References

### Related Files
- `hooks/useSyncStatus.ts` - Core hook implementation (unchanged)
- `lib/types.ts` - Type definitions (lines 71-86)
- `components/providers/ContextBusProvider.tsx` - Reference pattern
- `components/providers/RepositoryProvider.tsx` - Consumer & reference

### Requirements Document
- `.zenflow/tasks/fix-deaf-syncstatus-bb6c/requirements.md`
- Root cause analysis (lines 14-20)
- Technical requirements (lines 77-126)
- Testing requirements (lines 149-181)

### External Documentation
- [React Context API](https://react.dev/reference/react/createContext)
- [Next.js App Router Providers](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#using-context-providers)
- [TypeScript Strict Null Checks](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#truthiness-narrowing)
