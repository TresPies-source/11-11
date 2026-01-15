# Technical Specification: Workbench Integration Sprint

**Version:** 1.0  
**Date:** January 15, 2026  
**Based on:** `requirements.md` v1.0  
**Priority:** Critical (11/10)

---

## 1. Technical Context

### 1.1 Technology Stack

- **Framework:** Next.js 14.2.24 (App Router)
- **Language:** TypeScript 5.7.2 (strict mode)
- **State Management:** Zustand 5.0.10
- **Editor:** Monaco Editor (via @monaco-editor/react 4.6.0)
- **UI Library:** React 18.3.1 with Tailwind CSS 3.4.17
- **Validation:** Zod 3.23.8
- **Database:** PGLite 0.3.14 (in-process PostgreSQL)
- **Auth:** NextAuth 5.0.0-beta.25
- **Toast Notifications:** Custom ToastProvider with Framer Motion

### 1.2 Development Environment

- **Node Version:** 18+ (as per package.json)
- **Dev Mode:** `NEXT_PUBLIC_DEV_MODE=true` (bypasses auth for development)
- **Build Commands:**
  - Lint: `npm run lint`
  - Type Check: `npm run type-check`
  - Build: `npm run build`

### 1.3 Existing Architecture

**State Management Pattern:**
- Zustand stores using `create()` API
- Shallow selectors for performance
- State updates via setter functions

**API Route Pattern:**
- Next.js App Router API handlers (`route.ts`)
- Authentication via `auth()` (skipped in dev mode)
- Response format: `NextResponse.json()`
- Error handling: try/catch with appropriate HTTP status codes

**Component Pattern:**
- Client components (`"use client"`)
- Functional components with TypeScript interfaces
- Hooks for state/effects
- Design system colors via Tailwind CSS variables

---

## 2. Implementation Approach

### 2.1 Architecture Overview

This implementation follows a **unidirectional data flow**:

```
User Action (Button Click)
    ↓
WorkbenchView Handler (handleRun/handleSave)
    ↓
Update Zustand Store (setRunning: true)
    ↓
API Call (fetch /api/supervisor/route or /api/seeds)
    ↓
Response Processing
    ↓
Update Zustand Store (setRunning: false, setActiveTabError)
    ↓
UI Re-renders (ActionBar, Editor)
    ↓
Toast Notification
```

**Key Design Decisions:**

1. **Seeds API for Storage** - Use existing `/api/seeds` endpoints (POST/PATCH) instead of non-existent `/api/packet/[packetId]`
2. **Routing-Only Execution** - Supervisor API returns routing decision only (not full execution stream)
3. **Tab ID Mapping** - New tabs use generated IDs; saved tabs use `seed-{id}` format
4. **Single Execution State** - One `isRunning` flag for all tabs (only one active tab at a time)
5. **Error Persistence** - Errors remain until dismissed or next successful run

### 2.2 State Management Strategy

Extend `workbench.store.ts` to track execution state:

- `isRunning: boolean` - Prevents concurrent executions, triggers UI feedback
- `activeTabError: string | null` - Displays API errors in editor
- `setRunning(boolean)` - Updates running state
- `setActiveTabError(string | null)` - Sets/clears error messages
- `updateTabId(oldId, newId)` - Maps local tab ID to backend seed ID after save

### 2.3 API Integration Contracts

**Supervisor API (`POST /api/supervisor/route/route`)**

Request:
```typescript
{
  query: string,              // Prompt content
  conversation_context: [],   // Empty for single-shot execution
  session_id: string          // crypto.randomUUID()
}
```

Response (200 OK):
```typescript
{
  agent_id: string,
  agent_name: string,
  confidence: number,
  reasoning: string,
  fallback: boolean,
  routing_cost: {
    tokens_used: number,
    cost_usd: number
  }
}
```

**Seeds API - Create (`POST /api/seeds`)**

Request:
```typescript
{
  name: string,        // Tab title
  type: SeedType,      // 'prompt' (if valid) or 'artifact'
  content: string,     // Prompt content
  status?: SeedStatus  // Default: 'new'
}
```

Response (201 Created):
```typescript
{
  id: string,
  name: string,
  type: SeedType,
  status: SeedStatus,
  content: string,
  created_at: string,
  updated_at: string,
  user_id: string | null,
  // ... other SeedRow fields
}
```

**Seeds API - Update (`PATCH /api/seeds/[id]`)**

Request:
```typescript
{
  name?: string,
  content?: string,
  status?: SeedStatus
}
```

Response (200 OK):
```typescript
SeedRow  // Full updated seed object
```

### 2.4 Error Handling Strategy

**Network Errors:**
- Catch in try/catch block
- Extract message from Error object
- Set in `activeTabError` state
- Display in error banner
- Show error toast

**API Errors (non-200 status):**
- Parse error message from response body
- Fallback to generic "Failed to {operation}" message
- Log full error to console for debugging

**User Errors:**
- Validate before API call (empty content, no active tab)
- Show error toast immediately
- Don't set `activeTabError` (not API failure)

---

## 3. Source Code Structure Changes

### 3.1 File Modifications

**Modified Files (4):**
1. `lib/stores/workbench.store.ts` - Add execution state
2. `components/workbench/WorkbenchView.tsx` - Integrate APIs
3. `components/workbench/ActionBar.tsx` - Add isRunning prop and disabled states
4. `components/workbench/Editor.tsx` - Add error banner and readOnly mode

**No New Files Required** - All changes are enhancements to existing components.

### 3.2 Dependencies

No new dependencies required. All functionality uses existing packages:
- `fetch` (built-in)
- `crypto.randomUUID()` (built-in)
- `useToast` (existing hook)
- `useWorkbenchStore` (existing store)

---

## 4. Data Model / API / Interface Changes

### 4.1 Store Interface Updates

**File:** `lib/stores/workbench.store.ts`

```typescript
interface WorkbenchState {
  // Existing fields...
  tabs: PromptTab[];
  activeTabId: string | null;
  addTab: (tab: PromptTab) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  updateTabTitle: (id: string, title: string) => void;
  
  // NEW: Execution state
  isRunning: boolean;
  activeTabError: string | null;
  setRunning: (isRunning: boolean) => void;
  setActiveTabError: (error: string | null) => void;
  updateTabId: (oldId: string, newId: string) => void;  // NEW: For save mapping
}
```

**Implementation:**
```typescript
export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  // Existing state...
  tabs: [],
  activeTabId: null,
  
  // NEW: Initialize execution state
  isRunning: false,
  activeTabError: null,
  
  // Existing actions...
  addTab: (tab) => set((state) => ({ 
    tabs: [...state.tabs, tab],
    activeTabId: tab.id
  })),
  
  // ... other existing actions ...
  
  // NEW: Execution state setters
  setRunning: (isRunning) => set({ isRunning }),
  setActiveTabError: (error) => set({ activeTabError: error }),
  
  // NEW: Tab ID mapper
  updateTabId: (oldId: string, newId: string) => set((state) => ({
    tabs: state.tabs.map((tab) => 
      tab.id === oldId ? { ...tab, id: newId } : tab
    ),
    activeTabId: state.activeTabId === oldId ? newId : state.activeTabId
  })),
}));
```

### 4.2 Component Interface Updates

**File:** `components/workbench/ActionBar.tsx`

```typescript
interface ActionBarProps {
  onRun: () => void;      // RENAMED from onTest
  onSave: () => void;
  onExport: () => void;
  isRunning: boolean;     // NEW
}
```

**File:** `components/workbench/Editor.tsx`

No interface changes (uses store directly), but adds error banner UI.

### 4.3 Type Mappings

**Seed Type Selection:**

Based on `lib/seeds/types.ts`, valid types are:
- `'principle'`
- `'pattern'`
- `'question'`
- `'route'`
- `'artifact'`
- `'constraint'`

**Decision:** Use `'artifact'` for prompts (closest semantic match to "prompt template").

**Alternative:** Request adding `'prompt'` to valid types (requires backend schema change).

---

## 5. Delivery Phases

### Phase 1: State Management Foundation (30 min)
**Objective:** Add execution tracking to Zustand store

**Tasks:**
1. Update `WorkbenchState` interface with new fields
2. Initialize new state values
3. Implement setter functions
4. Add `updateTabId` helper

**Verification:**
- TypeScript compiles without errors
- Store exports updated interface

**Deliverables:**
- Updated `lib/stores/workbench.store.ts`

---

### Phase 2: API Integration - Save Functionality (45 min)
**Objective:** Connect Save button to Seeds API

**Tasks:**
1. Make `handleSave` async in `WorkbenchView.tsx`
2. Determine if new seed (POST) or update (PATCH)
3. Construct request body with proper types
4. Handle response and update tab ID if new seed
5. Add success/error toasts
6. Add error logging

**Verification:**
- Click Save → Network tab shows POST/PATCH to `/api/seeds`
- Success toast appears
- Tab ID updates to `seed-{id}` after first save
- Subsequent saves send PATCH with correct ID

**Deliverables:**
- Updated `handleSave` function in `WorkbenchView.tsx`

---

### Phase 3: API Integration - Run Functionality (45 min)
**Objective:** Connect Run button to Supervisor API

**Tasks:**
1. Rename `handleTest` to `handleRun`
2. Make `handleRun` async
3. Add `isRunning` state management (set true → API call → finally set false)
4. Clear previous errors before run
5. Construct Supervisor API request
6. Log routing result to console
7. Add success/error handling with toasts

**Verification:**
- Click Run → Network tab shows POST to `/api/supervisor/route/route`
- Console logs routing decision
- Success toast appears
- Errors display in toast

**Deliverables:**
- Updated `handleRun` function in `WorkbenchView.tsx`
- Updated ActionBar prop from `onTest` to `onRun`

---

### Phase 4: UI Feedback - ActionBar (30 min)
**Objective:** Show loading state and disable buttons during execution

**Tasks:**
1. Update `ActionBarProps` interface
2. Accept `isRunning` prop from parent
3. Disable all buttons when `isRunning === true`
4. Show "Running..." text when running
5. Add `animate-pulse` class when running
6. Update button label from "Test" to "Run with Dojo"

**Verification:**
- Buttons disable during execution
- "Run with Dojo" changes to "Running..." with pulse animation
- Buttons re-enable after execution completes

**Deliverables:**
- Updated `components/workbench/ActionBar.tsx`

---

### Phase 5: UI Feedback - Editor (30 min)
**Objective:** Add error banner and read-only mode

**Tasks:**
1. Pull `isRunning` and `activeTabError` from store
2. Set Monaco `readOnly: isRunning` option
3. Render error banner when `activeTabError !== null`
4. Add dismiss button (X) that calls `setActiveTabError(null)`
5. Style banner with design system colors
6. Wrap editor and banner in flex container

**Verification:**
- Editor becomes read-only during execution
- Error banner appears on API failure
- Clicking X dismisses banner
- Banner auto-clears on successful retry

**Deliverables:**
- Updated `components/workbench/Editor.tsx`

---

### Phase 6: Integration & Polish (30 min)
**Objective:** Wire all pieces together and ensure consistency

**Tasks:**
1. Update `WorkbenchView` to pass `isRunning` to `ActionBar`
2. Verify all state transitions work correctly
3. Test error scenarios (network failure, empty prompt, missing tab)
4. Ensure design system compliance (colors, spacing)
5. Add console logging for debugging

**Verification:**
- Full user flow works end-to-end
- No console errors
- UI matches design system

**Deliverables:**
- Fully integrated `WorkbenchView.tsx`

---

### Phase 7: Quality Assurance (30 min)
**Objective:** Verify correctness and performance

**Tasks:**
1. Run `npm run lint` → Fix any issues
2. Run `npm run type-check` → Fix any type errors
3. Run `npm run build` → Ensure successful build
4. Manual testing of all user stories
5. Cross-browser testing (Chrome, Firefox)

**Verification:**
- All commands pass with 0 errors
- All acceptance criteria met
- No regressions in existing functionality

**Deliverables:**
- Clean lint/type-check/build output
- Tested, production-ready code

---

## 6. Verification Approach

### 6.1 Automated Verification

**Linting:**
```bash
npm run lint
# Expected: No errors, no warnings
```

**Type Checking:**
```bash
npm run type-check
# Expected: No TypeScript errors
```

**Build:**
```bash
npm run build
# Expected: Successful production build
```

### 6.2 Manual Testing Checklist

**Save Functionality:**
- [ ] Save new prompt → POST to `/api/seeds` with correct body
- [ ] Save existing prompt → PATCH to `/api/seeds/[id]`
- [ ] Success toast appears after save
- [ ] Tab ID updates to `seed-{id}` after first save
- [ ] Error toast appears if save fails

**Run Functionality:**
- [ ] Run valid prompt → POST to `/api/supervisor/route/route`
- [ ] Console logs routing result (agent_id, agent_name, confidence)
- [ ] Success toast: "Dojo run initiated successfully"
- [ ] Run empty prompt → Error toast: "Cannot run an empty prompt"
- [ ] Run while offline → Error banner appears

**UI Feedback:**
- [ ] Clicking Run disables all buttons
- [ ] Editor becomes read-only during run
- [ ] "Run with Dojo" changes to "Running..." with pulse
- [ ] Buttons re-enable after completion
- [ ] Error banner displays API errors
- [ ] Clicking X dismisses error banner
- [ ] Error clears on successful retry

**Design System Compliance:**
- [ ] Colors match brand guide (accent, error, success)
- [ ] Spacing consistent with existing components
- [ ] Animations use Tailwind classes
- [ ] Typography matches design system

### 6.3 Error Scenario Testing

**Network Errors:**
1. Disconnect network → Click Run → Verify error banner
2. Disconnect network → Click Save → Verify error toast

**API Errors:**
1. Invalid seed type → Verify 400 error handling
2. Unauthorized (if auth enabled) → Verify 401 error handling

**User Errors:**
1. No active tab → Error toast
2. Empty prompt → Error toast
3. Rapid double-click Run → Only one execution

### 6.4 Performance Validation

**Metrics:**
- Loading state appears < 100ms after click
- UI remains responsive during API calls
- No layout shifts during state transitions
- Smooth animations (60 FPS)

**Tools:**
- Chrome DevTools Performance tab
- React DevTools Profiler
- Network tab for timing

---

## 7. Technical Constraints & Considerations

### 7.1 Seed Type Limitation

**Issue:** Seeds API expects one of: `'principle'`, `'pattern'`, `'question'`, `'route'`, `'artifact'`, `'constraint'`

**Solution:** Use `'artifact'` for prompts (semantically closest)

**Alternative:** Add `'prompt'` to `SeedType` enum (requires schema migration)

### 7.2 Supervisor API Limitation

**Issue:** Supervisor only returns routing decision, not full execution with streaming

**Current Implementation:** Log routing result to console, show success toast

**Future Enhancement:** Create `/api/execute` endpoint that:
1. Calls Supervisor for routing
2. Invokes selected agent
3. Streams execution events
4. Integrates with Agent Activity Panel

### 7.3 Session ID Generation

**Current Approach:** `crypto.randomUUID()` per execution

**Consideration:** Each run creates new session (no conversation history)

**Future Enhancement:** Persist session ID per tab for multi-turn conversations

### 7.4 Authentication

**Dev Mode:** Uses mock user `'dev@11-11.dev'`

**Production:** Requires NextAuth session

**Deployment Note:** Ensure `NEXT_PUBLIC_DEV_MODE` is not set in production

### 7.5 Concurrent Execution

**Current Design:** Single `isRunning` flag prevents concurrent runs

**Rationale:** Only one tab active at a time, simplifies state management

**Future Enhancement:** Per-tab execution state for multi-tab support

---

## 8. Code Examples

### 8.1 handleSave Implementation

```typescript
const handleSave = async () => {
  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  if (!activeTab) {
    toast.error("No active prompt to save");
    return;
  }

  try {
    const isNewSeed = !activeTab.id.startsWith('seed-');
    
    if (isNewSeed) {
      const response = await fetch('/api/seeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: activeTab.title,
          type: 'artifact',  // Using 'artifact' for prompts
          content: activeTab.content,
          status: 'new'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save prompt');
      }
      
      const newSeed = await response.json();
      updateTabId(activeTab.id, `seed-${newSeed.id}`);
    } else {
      const seedId = activeTab.id.replace('seed-', '');
      const response = await fetch(`/api/seeds/${seedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: activeTab.title,
          content: activeTab.content
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update prompt');
      }
    }
    
    toast.success("Prompt saved successfully");
  } catch (error) {
    console.error('[Save] Error:', error);
    toast.error("Failed to save prompt");
  }
};
```

### 8.2 handleRun Implementation

```typescript
const handleRun = async () => {
  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  if (!activeTab) {
    toast.error("No active prompt to run");
    return;
  }

  if (!activeTab.content.trim()) {
    toast.error("Cannot run an empty prompt");
    return;
  }

  setRunning(true);
  setActiveTabError(null);

  try {
    const response = await fetch('/api/supervisor/route/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: activeTab.content,
        conversation_context: [],
        session_id: crypto.randomUUID()
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('[Run] Routing result:', result);
    
    toast.success("Dojo run initiated successfully");
  } catch (error) {
    console.error('[Run] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to run prompt';
    setActiveTabError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setRunning(false);
  }
};
```

### 8.3 Error Banner Component

```typescript
{activeTabError && (
  <div className="bg-error/10 border-b border-error/25 text-error px-4 py-3 flex items-center justify-between">
    <span className="text-sm">{activeTabError}</span>
    <button 
      onClick={() => setActiveTabError(null)}
      className="text-error hover:text-error/80 ml-4 text-xl leading-none"
      aria-label="Dismiss error"
    >
      ×
    </button>
  </div>
)}
```

---

## 9. Risk Analysis & Mitigation

### 9.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Seeds API rejects 'artifact' type | High | Low | Verify type in dev mode; fall back to 'route' if needed |
| Network timeout during long prompts | Medium | Medium | Add timeout handling (30s), show retry option |
| Monaco readOnly not preventing edits | Medium | Low | Test thoroughly; add visual overlay if needed |
| Toast notifications overlapping | Low | Low | ToastProvider handles stacking automatically |
| Concurrent save/run operations | Medium | Low | Disable buttons during operations |

### 9.2 UX Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| User doesn't see loading state | High | Medium | Ensure state updates within 100ms |
| Error messages too generic | Medium | Medium | Log detailed errors to console for debugging |
| User loses work during execution | High | Low | Only make editor read-only, don't clear content |

---

## 10. Success Metrics

**Code Quality:**
- ✅ 0 TypeScript errors
- ✅ 0 ESLint warnings/errors
- ✅ 100% of acceptance criteria met
- ✅ Successful production build

**Performance:**
- ✅ UI feedback < 100ms
- ✅ No blocking operations
- ✅ Smooth 60 FPS animations

**Functionality:**
- ✅ Save persists to Seeds API
- ✅ Run calls Supervisor API
- ✅ Error handling works correctly
- ✅ Loading states display properly

**Design:**
- ✅ Colors match brand guide
- ✅ Spacing consistent
- ✅ Animations polished

---

## 11. Future Enhancements (Out of Scope)

1. **Streaming Execution** - Process HarnessTrace events in real-time
2. **Agent Activity Panel** - Show live agent transitions and outputs
3. **Conversation History** - Persist session_id for multi-turn prompts
4. **Prompt Templates** - Load pre-built prompts from Librarian
5. **Cost Tracking** - Display execution costs from Cost Guard
6. **Collaborative Editing** - Multi-user real-time collaboration
7. **Version History** - Track prompt changes over time
8. **Keyboard Shortcuts** - Run (Cmd+Enter), Save (Cmd+S)

---

## 12. References

**Requirements:**
- `.zenflow/tasks/workbench-integration-sprint-5278/requirements.md`

**Existing Code:**
- `lib/stores/workbench.store.ts` - State management
- `components/workbench/WorkbenchView.tsx` - Main container
- `components/workbench/ActionBar.tsx` - Action buttons
- `components/workbench/Editor.tsx` - Monaco editor
- `hooks/useToast.ts` - Toast notifications
- `components/providers/ToastProvider.tsx` - Toast context

**API Routes:**
- `app/api/supervisor/route/route.ts` - Agent routing
- `app/api/seeds/route.ts` - Create seeds
- `app/api/seeds/[id]/route.ts` - Update/delete seeds

**Type Definitions:**
- `lib/seeds/types.ts` - Seed types and interfaces
- `lib/packet/schema.ts` - DojoPacket schema (for future use)

**Design System:**
- `/00_Roadmap/DOJO_GENESIS_BRAND_GUIDE.md` - Brand guidelines
- `/00_Roadmap/DOJO_GENESIS_BRAND_COLORS.md` - Color system

---

**Document Status:** ✅ Ready for Planning

**Next Step:** Create detailed implementation plan in `plan.md` with concrete tasks and verification steps.

**Total Estimated Time:** 3-4 hours (including testing and polish)
