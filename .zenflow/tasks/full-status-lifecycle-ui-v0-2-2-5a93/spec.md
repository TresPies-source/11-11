# Technical Specification: Full Status Lifecycle UI v0.2.2

**Date:** January 12, 2026  
**Complexity:** MEDIUM-HARD  
**Estimated Duration:** 1-2 days  
**Bug Resolution:** [P2-003] Limited Status Transitions in UI

---

## 1. Technical Context

### 1.1 Current State

**Framework & Tech Stack:**
- **Frontend:** Next.js 14 (App Router), React 18.3.1
- **Styling:** Tailwind CSS 3.4.17, Framer Motion 11.15.0
- **Database:** PGlite 0.3.14 (PostgreSQL in IndexedDB)
- **Icons:** Lucide React 0.469.0
- **State:** React hooks, local component state

**Existing Infrastructure:**
- ✅ Database schema with `prompts`, `prompt_metadata`, `critiques` tables
- ✅ `StatusTransitionButton` component (single transition)
- ✅ `usePromptStatus` hook for status updates
- ✅ `lib/pglite/prompts.ts` data access layer
- ✅ PGlite schema management (`lib/pglite/schema.ts`)
- ✅ Librarian page at `/librarian` with Seedlings and Greenhouse sections
- ✅ Greenhouse page at `/librarian/greenhouse`
- ✅ Commons page at `/librarian/commons`

**Current Limitation:**
Only the `active → saved` status transition is accessible in the UI via the "Save to Greenhouse" button in `SeedlingCard.tsx:151-165`.

---

## 2. Implementation Approach

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Status Lifecycle                         │
│                                                                 │
│  draft ──→ active ──→ saved ──→ archived                       │
│    ↓         ↑         ↑          ↓                             │
│    └─────────┴─────────┴──────────┘                             │
│           (bidirectional transitions)                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        Route Structure                          │
│                                                                 │
│  /librarian               → Seedlings + Greenhouse preview      │
│  /librarian/greenhouse    → Saved prompts (full view)          │
│  /librarian/archive       → Archived prompts (NEW)             │
│  /librarian/commons       → Public prompts                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Component Architecture                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ArchiveView (NEW)                                       │   │
│  │  ├─ BulkActionBar (NEW)                                 │   │
│  │  ├─ ArchiveCard (NEW - variant of GreenhouseCard)      │   │
│  │  └─ StatusFilter (NEW - reusable)                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ GreenhouseSection (MODIFIED)                            │   │
│  │  ├─ StatusFilter (NEW - integrated)                     │   │
│  │  └─ GreenhouseCard (MODIFIED - add status buttons)      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ SeedlingCard (MODIFIED)                                 │   │
│  │  └─ Add "Archive" option for drafts                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Database Schema Changes

**Migration: Add `status_history` Column**

```sql
-- File: lib/pglite/migrations/002_add_status_history.ts
ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;

-- Create index for status_history queries
CREATE INDEX IF NOT EXISTS idx_prompts_status_history 
ON prompts USING GIN(status_history);
```

**Update Schema File:**
```typescript
// lib/pglite/schema.ts - Add to SCHEMA_SQL constant
status_history JSONB DEFAULT '[]'::jsonb,
```

**Type Definition:**
```typescript
// lib/pglite/types.ts
export interface StatusHistoryEntry {
  from: PromptStatus;
  to: PromptStatus;
  timestamp: string; // ISO 8601
  user_id: string;
}

// Update PromptRow interface
export interface PromptRow {
  // ... existing fields
  status_history: StatusHistoryEntry[];
}
```

### 2.3 Status Transition Logic

**Validation Rules:**

```typescript
// lib/pglite/statusTransitions.ts (NEW FILE)
export type PromptStatus = 'draft' | 'active' | 'saved' | 'archived';

export interface StatusTransition {
  from: PromptStatus;
  to: PromptStatus;
  label: string;
  icon: LucideIcon;
  confirmationRequired: boolean;
  confirmationMessage?: string;
}

export const VALID_TRANSITIONS: StatusTransition[] = [
  // From draft
  { from: 'draft', to: 'active', label: 'Activate', icon: Sprout, confirmationRequired: false },
  { from: 'draft', to: 'archived', label: 'Archive', icon: Archive, confirmationRequired: true, confirmationMessage: 'Archive this draft?' },
  
  // From active
  { from: 'active', to: 'saved', label: 'Save to Greenhouse', icon: Flower2, confirmationRequired: false },
  { from: 'active', to: 'draft', label: 'Move to Drafts', icon: Edit3, confirmationRequired: false },
  { from: 'active', to: 'archived', label: 'Archive', icon: Archive, confirmationRequired: true, confirmationMessage: 'Archive this prompt?' },
  
  // From saved
  { from: 'saved', to: 'active', label: 'Reactivate', icon: Sprout, confirmationRequired: false },
  { from: 'saved', to: 'archived', label: 'Archive', icon: Archive, confirmationRequired: true, confirmationMessage: 'Archive this prompt? You can restore it later.' },
  
  // From archived
  { from: 'archived', to: 'active', label: 'Restore', icon: RotateCcw, confirmationRequired: false },
  { from: 'archived', to: 'saved', label: 'Restore to Greenhouse', icon: Flower2, confirmationRequired: false },
];

export function getValidTransitions(currentStatus: PromptStatus): StatusTransition[] {
  return VALID_TRANSITIONS.filter(t => t.from === currentStatus);
}

export function isValidTransition(from: PromptStatus, to: PromptStatus): boolean {
  return VALID_TRANSITIONS.some(t => t.from === from && t.to === to);
}
```

**Update `lib/pglite/prompts.ts`:**

```typescript
// Add function to update status with history tracking
export async function updatePromptStatusWithHistory(
  promptId: string,
  newStatus: PromptStatus,
  userId: string
): Promise<void> {
  const db = await getDB();
  
  // Get current status
  const currentResult = await db.query(
    'SELECT status, status_history FROM prompts WHERE id = $1',
    [promptId]
  );
  
  if (currentResult.rows.length === 0) {
    throw new Error('Prompt not found');
  }
  
  const currentStatus = currentResult.rows[0].status;
  const currentHistory = currentResult.rows[0].status_history || [];
  
  // Validate transition
  if (!isValidTransition(currentStatus, newStatus)) {
    throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
  }
  
  // Create history entry
  const historyEntry: StatusHistoryEntry = {
    from: currentStatus,
    to: newStatus,
    timestamp: new Date().toISOString(),
    user_id: userId,
  };
  
  // Update with new status and history
  await db.query(`
    UPDATE prompts 
    SET 
      status = $1, 
      status_history = status_history || $2::jsonb,
      updated_at = NOW()
    WHERE id = $3
  `, [newStatus, JSON.stringify([historyEntry]), promptId]);
}
```

---

## 3. Source Code Structure

### 3.1 New Files

```
components/
  librarian/
    ArchiveView.tsx              # Archive page component
    ArchiveCard.tsx              # Card for archived prompts
    BulkActionBar.tsx            # Bulk operations toolbar
    StatusFilter.tsx             # Reusable status filter dropdown
    ConfirmationDialog.tsx       # Modal for destructive actions

lib/
  pglite/
    migrations/
      002_add_status_history.ts  # Migration script
    statusTransitions.ts         # Transition logic and validation

hooks/
  useBulkSelection.ts            # Hook for multi-select state
  useStatusFilter.ts             # Hook for filter state + URL sync

app/
  librarian/
    archive/
      page.tsx                   # Archive route
```

### 3.2 Modified Files

```
components/
  librarian/
    GreenhouseCard.tsx           # Add Archive/Reactivate buttons
    SeedlingCard.tsx             # Add Archive option for drafts
    GreenhouseSection.tsx        # Integrate StatusFilter
    GreenhouseView.tsx           # Add filter state

lib/
  pglite/
    schema.ts                    # Add status_history column
    types.ts                     # Add StatusHistoryEntry type
    prompts.ts                   # Add updatePromptStatusWithHistory

hooks/
  usePromptStatus.ts             # Use new updatePromptStatusWithHistory
```

---

## 4. Component Specifications

### 4.1 ArchiveView Component

**File:** `app/librarian/archive/page.tsx`

**Features:**
- Grid layout matching Greenhouse view
- Search and filter within archived prompts
- Bulk restore and bulk delete actions
- Show archive date and original status
- Empty state: "No archived prompts. Your archive is empty."

**Props:** None (page component)

**State:**
- `selectedPromptIds: Set<string>` - Bulk selection
- `searchQuery: string` - Search input
- `isDeleting: boolean` - Bulk delete in progress
- `isRestoring: boolean` - Bulk restore in progress

**Layout:**
```tsx
<main>
  <header>
    <h1>📦 Archive</h1>
    <p>Prompts you've archived</p>
  </header>
  
  <BulkActionBar 
    selectedCount={selectedPromptIds.size}
    onRestore={handleBulkRestore}
    onDelete={handleBulkDelete}
    onClearSelection={() => setSelectedPromptIds(new Set())}
  />
  
  <SearchBar value={searchQuery} onChange={setSearchQuery} />
  
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {archivedPrompts.map(prompt => (
      <ArchiveCard 
        key={prompt.id}
        prompt={prompt}
        selected={selectedPromptIds.has(prompt.id)}
        onSelect={(id) => toggleSelection(id)}
        onRestore={handleRestore}
        onDelete={handleDelete}
      />
    ))}
  </div>
</main>
```

### 4.2 BulkActionBar Component

**File:** `components/librarian/BulkActionBar.tsx`

**Props:**
```typescript
interface BulkActionBarProps {
  selectedCount: number;
  onRestore: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
  isRestoring?: boolean;
  isDeleting?: boolean;
}
```

**UI:**
- Fixed position at top of archive view
- Slide-in animation when `selectedCount > 0`
- Shows count: "3 prompts selected"
- Restore button (green)
- Delete button (red, with confirmation)
- Clear selection button (X icon)

### 4.3 StatusFilter Component

**File:** `components/librarian/StatusFilter.tsx`

**Props:**
```typescript
interface StatusFilterProps {
  currentStatus?: PromptStatus;
  onChange: (status: PromptStatus | 'all') => void;
  showCounts?: boolean;
  counts?: Record<PromptStatus, number>;
}
```

**Features:**
- Dropdown using native `<select>` or custom dropdown
- Options: "All", "Draft", "Active", "Saved"
- "Show Archived" toggle → navigates to `/librarian/archive`
- Count badges: "Active (12)"
- Persists selection to URL params: `?status=active`

### 4.4 GreenhouseCard Modifications

**File:** `components/librarian/GreenhouseCard.tsx`

**Changes:**
1. Add status transition buttons below existing actions
2. Use `getValidTransitions('saved')` to show available actions
3. Add confirmation dialog for Archive action
4. Add "Reactivate" button (moves back to Seedlings)

**Updated Button Layout:**
```tsx
<div className="mt-auto pt-3 border-t border-gray-100 space-y-2">
  {/* Existing actions: Run, Copy, Edit */}
  <div className="flex gap-2">
    <button>Run</button>
    <button>Copy</button>
    <button>Edit</button>
  </div>
  
  {/* NEW: Status transition actions */}
  <div className="flex gap-2">
    <StatusTransitionButton
      promptId={prompt.id}
      currentStatus="saved"
      targetStatus="active"
      label="Reactivate"
      icon={<Sprout />}
      variant="secondary"
    />
    <StatusTransitionButton
      promptId={prompt.id}
      currentStatus="saved"
      targetStatus="archived"
      label="Archive"
      icon={<Archive />}
      variant="secondary"
      requiresConfirmation
    />
  </div>
</div>
```

### 4.5 ConfirmationDialog Component

**File:** `components/librarian/ConfirmationDialog.tsx`

**Props:**
```typescript
interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}
```

**Features:**
- Modal overlay with backdrop
- Centered dialog box
- Confirm button (variant-dependent color)
- Cancel button
- Keyboard navigation (Enter = confirm, Escape = cancel)
- Focus trap

---

## 5. Data Model Changes

### 5.1 StatusHistoryEntry

```typescript
interface StatusHistoryEntry {
  from: PromptStatus;
  to: PromptStatus;
  timestamp: string; // ISO 8601
  user_id: string;
}
```

**Storage:** JSONB array in `prompts.status_history`

**Example:**
```json
[
  {
    "from": "draft",
    "to": "active",
    "timestamp": "2026-01-12T10:00:00Z",
    "user_id": "dev-user"
  },
  {
    "from": "active",
    "to": "saved",
    "timestamp": "2026-01-12T12:30:00Z",
    "user_id": "dev-user"
  },
  {
    "from": "saved",
    "to": "archived",
    "timestamp": "2026-01-12T14:45:00Z",
    "user_id": "dev-user"
  }
]
```

### 5.2 Bulk Operations Data Flow

```typescript
// useBulkSelection.ts
interface BulkSelectionState {
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

// Bulk restore operation
async function bulkRestorePrompts(
  promptIds: string[], 
  targetStatus: PromptStatus
): Promise<{ success: number; failed: number }> {
  const results = await Promise.allSettled(
    promptIds.map(id => updatePromptStatusWithHistory(id, targetStatus, userId))
  );
  
  return {
    success: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
  };
}
```

---

## 6. Verification Approach

### 6.1 Manual Testing Scenarios

**Test 1: Status Transitions**
1. Create new prompt (starts as `draft`)
2. Click "Activate" → verify moves to Seedlings (status = `active`)
3. Click "Save to Greenhouse" → verify moves to Greenhouse (status = `saved`)
4. Click "Reactivate" → verify moves back to Seedlings
5. Click "Archive" → verify confirmation dialog appears
6. Confirm archive → verify prompt disappears from Greenhouse
7. Navigate to `/librarian/archive` → verify prompt appears
8. Click "Restore" → verify prompt returns to Seedlings

**Test 2: Archive View**
1. Navigate to `/librarian/archive`
2. Verify all archived prompts display
3. Search for a prompt by title → verify filtering works
4. Test restore action → verify prompt disappears from archive
5. Test delete action → verify confirmation and permanent deletion

**Test 3: Status History**
1. Perform multiple status transitions on a prompt
2. Open browser DevTools → Application → IndexedDB → `11-11-db` → `prompts`
3. Find the prompt record → verify `status_history` array is populated
4. Verify each entry has: `from`, `to`, `timestamp`, `user_id`

**Test 4: Bulk Operations**
1. Navigate to archive view
2. Select 5 prompts using checkboxes
3. Click "Restore" → verify confirmation shows "Restore 5 prompts?"
4. Confirm → verify progress indicator
5. Verify all 5 prompts restored and removed from archive
6. Repeat with "Delete" action → verify strong warning

**Test 5: Status Filters**
1. Navigate to Greenhouse
2. Click filter dropdown → select "Draft"
3. Verify URL changes to `/librarian/greenhouse?status=draft`
4. Verify only draft prompts display
5. Refresh page → verify filter persists from URL
6. Toggle "Show Archived" → verify navigation to archive route

### 6.2 Lint & Type Check

```bash
npm run lint      # Zero errors/warnings
npm run build     # Zero TypeScript errors
```

### 6.3 Performance Testing

**Targets:**
- Archive view load time: <2 seconds (100 archived prompts)
- Bulk restore (10 prompts): <3 seconds
- Status transition animation: 60fps
- Filter change: <100ms

**Measurement:**
- Chrome DevTools Performance tab
- Lighthouse report for archive page
- React DevTools Profiler for re-renders

---

## 7. Acceptance Criteria

### 7.1 Functional Requirements

- [ ] All status transitions available via UI buttons
- [ ] Archive view accessible at `/librarian/archive`
- [ ] Status history tracked in database for all transitions
- [ ] Bulk restore works (multi-select + restore button)
- [ ] Bulk delete works (multi-select + delete button + confirmation)
- [ ] Status filter dropdown functional in Greenhouse
- [ ] Filter state persists in URL params
- [ ] Confirmation dialogs for destructive actions
- [ ] Optimistic UI updates (immediate feedback)
- [ ] Toast notifications for all operations

### 7.2 Non-Functional Requirements

- [ ] Zero regressions in existing functionality
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] Keyboard navigation for all actions
- [ ] Touch targets ≥44×44px
- [ ] Responsive design (320px - 2560px)
- [ ] 60fps animations
- [ ] Lint check passes
- [ ] Type check passes

### 7.3 Documentation Requirements

- [ ] JOURNAL.md updated with architectural decisions
- [ ] BUGS.md: [P2-003] marked as RESOLVED
- [ ] Code comments for complex logic
- [ ] README.md updated if new env vars added

---

## 8. Risk Assessment

### 8.1 Technical Risks

**Risk:** Database migration fails in user's browser
- **Mitigation:** Test migration with existing data, add rollback script
- **Impact:** HIGH
- **Probability:** LOW

**Risk:** Bulk operations timeout on large datasets (>100 prompts)
- **Mitigation:** Implement batch processing (10 at a time), show progress
- **Impact:** MEDIUM
- **Probability:** LOW

**Risk:** Status history JSONB column grows unbounded
- **Mitigation:** Defer cleanup to future version, document in JOURNAL.md
- **Impact:** LOW
- **Probability:** MEDIUM

### 8.2 UX Risks

**Risk:** Users accidentally delete prompts via bulk action
- **Mitigation:** Strong confirmation dialog with count, "Permanently delete X prompts?"
- **Impact:** HIGH
- **Probability:** MEDIUM

**Risk:** Archive view cluttered with too many old prompts
- **Mitigation:** Implement pagination (defer to v0.2.3+), add "Auto-archive after 90 days" setting (future)
- **Impact:** MEDIUM
- **Probability:** MEDIUM

---

## 9. Deferred Features

**Out of Scope for v0.2.2:**
- ❌ Status history display in UI (defer to v0.3+)
- ❌ Status change notifications (defer to v0.3+)
- ❌ Custom status labels (defer to v0.3+)
- ❌ Status-based permissions (defer to v0.3+)
- ❌ Undo/redo for status changes (defer to v0.3+)
- ❌ Status transition animations beyond standard Framer Motion
- ❌ Pagination in archive view (defer to v0.2.3+)

---

## 10. Implementation Checklist

### Phase 1: Database & Types (2-3 hours)
- [ ] Create migration: `002_add_status_history.ts`
- [ ] Update `lib/pglite/schema.ts` with status_history column
- [ ] Update `lib/pglite/types.ts` with StatusHistoryEntry
- [ ] Create `lib/pglite/statusTransitions.ts` with validation logic
- [ ] Update `lib/pglite/prompts.ts` with `updatePromptStatusWithHistory`
- [ ] Test migration in browser console

### Phase 2: Core Components (3-4 hours)
- [ ] Create `StatusFilter.tsx` component
- [ ] Create `ConfirmationDialog.tsx` component
- [ ] Create `BulkActionBar.tsx` component
- [ ] Create `ArchiveCard.tsx` component
- [ ] Create `ArchiveView.tsx` page
- [ ] Create `useBulkSelection.ts` hook
- [ ] Create `useStatusFilter.ts` hook

### Phase 3: Integration (2-3 hours)
- [ ] Modify `GreenhouseCard.tsx` - add status buttons
- [ ] Modify `SeedlingCard.tsx` - add archive option
- [ ] Modify `GreenhouseSection.tsx` - integrate filter
- [ ] Update `usePromptStatus.ts` - use new function
- [ ] Add route: `app/librarian/archive/page.tsx`

### Phase 4: Testing & Polish (2-3 hours)
- [ ] Test all 12 status transitions manually
- [ ] Test bulk operations (restore, delete)
- [ ] Test status filters with URL persistence
- [ ] Test confirmation dialogs
- [ ] Run `npm run lint`
- [ ] Run `npm run build`
- [ ] Fix any TypeScript/lint errors
- [ ] Capture screenshots of archive view

### Phase 5: Documentation (1 hour)
- [ ] Update JOURNAL.md with architecture decisions
- [ ] Mark [P2-003] as RESOLVED in BUGS.md
- [ ] Update README.md if needed
- [ ] Write implementation report

**Total Estimated Time:** 10-14 hours (1-2 days)

---

## 11. Success Metrics

- ✅ Zero P0/P1 bugs introduced
- ✅ All acceptance criteria met
- ✅ Lint: 0 errors, 0 warnings
- ✅ Build: Success (0 TypeScript errors)
- ✅ Performance: All targets met
- ✅ Accessibility: WCAG 2.1 AA compliant
- ✅ Visual validation: Screenshots captured
- ✅ Documentation: JOURNAL.md, BUGS.md updated

---

**Author:** Zencoder AI  
**Status:** Technical Specification v1.0  
**Date:** January 12, 2026
