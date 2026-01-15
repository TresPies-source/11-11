# Product Requirements Document: Workbench Integration Sprint

**Version:** 1.0  
**Date:** January 15, 2026  
**Feature Track:** Track 1, Feature 1 (v1.0 Roadmap)  
**Priority:** Critical (11/10)

---

## 1. Executive Summary

Transform the Workbench from a static prompt editor with placeholder functionality into a fully integrated, AI-powered prompt engineering environment. This sprint connects the polished UI to production-ready backend APIs (Supervisor, Packet System, Harness), enabling users to run prompts through the Dojo agent system, save/load prompts to persistent storage, and receive real-time execution feedback.

**Success Metric:** Users can write a prompt, execute it through the Dojo system, see live agent activity, and save/load their work—all within a responsive, error-free interface.

---

## 2. Current State Analysis

### 2.1 Existing Workbench Components

**`lib/stores/workbench.store.ts`**
- Zustand store managing prompt tabs
- State: `tabs`, `activeTabId`
- Operations: `addTab`, `removeTab`, `setActiveTab`, `updateTabContent`, `updateTabTitle`
- **Limitation:** No execution state tracking (`isRunning`, `activeTabError`)

**`components/workbench/WorkbenchView.tsx`**
- Main container orchestrating tab bar, editor, and action bar
- `handleTest()`: Placeholder - shows toast, logs to console
- `handleSave()`: Saves to localStorage only
- `handleExport()`: Client-side JSON/Markdown download
- **Limitation:** No API integration, no error handling for remote operations

**`components/workbench/ActionBar.tsx`**
- Three buttons: "Test", "Save", "Export"
- No disabled states, no loading indicators
- **Limitation:** No visual feedback during async operations

**`components/workbench/Editor.tsx`**
- Monaco editor with custom Dojo Genesis theme
- Always editable, no read-only mode during execution
- No error display mechanism
- **Limitation:** No execution state awareness

### 2.2 Available Backend APIs

**Packet System (Import/Export)**
- `POST /api/packet/import` - Imports a complete `DojoPacket` (session with perspectives, decisions, etc.)
- `POST /api/packet/export` - Exports session as JSON/Markdown/PDF

**Seeds System (CRUD for Prompts)**
- `GET /api/seeds` - List all seeds/prompts with filters
- `POST /api/seeds` - Create new seed (name, type, content, status)
- `GET /api/seeds/[id]` - Get single seed
- `PATCH /api/seeds/[id]` - Update seed
- `DELETE /api/seeds/[id]` - Delete seed

**Supervisor Routing API**
- `POST /api/supervisor/route` - Routes a query to appropriate agent
- **Input:** `{ query: string, conversation_context: array, session_id: string }`
- **Output:** `{ agent_id, agent_name, confidence, reasoning, routing_cost }`
- **Limitation:** Only returns routing decision, does not execute the prompt

**Harness Trace System**
- Types defined in `lib/harness/types.ts`
- Event types: `SESSION_START`, `AGENT_ROUTING`, `AGENT_RESPONSE`, etc.
- Supports streaming trace events

### 2.3 Key Observations & Design Decisions

**Decision 1: Prompt Storage Strategy**
- **Issue:** Task description references `/api/packet/[packetId]` endpoint which doesn't exist
- **Options:**
  1. Use Seeds API (`/api/seeds`) for simple prompt CRUD
  2. Create new `/api/packet/[packetId]` endpoint for rich session data
  3. Use localStorage with future migration path
- **Decision:** **Use Seeds API** - It's production-ready, supports required fields (name, content, status), and aligns with the "plant seed → grow knowledge" metaphor

**Decision 2: Prompt Execution Strategy**
- **Issue:** Task says to POST to `/api/supervisor/route` with a `DojoPacket`, but:
  - Supervisor API expects `query` string, not `DojoPacket`
  - Supervisor only routes, doesn't execute
  - No streaming endpoint found for full execution
- **Options:**
  1. Send prompt content as `query` to Supervisor (gets routing decision only)
  2. Create new execution endpoint that handles full flow
  3. Assume Supervisor will be extended to support execution
- **Decision:** **Send prompt as `query` to Supervisor** - Start with routing-only implementation. Log routing result. This unblocks the sprint while full execution API is built in parallel. UI will show "Dojo run initiated successfully" and log the agent selection.

**Decision 3: Error Handling**
- Display API errors in dismissible banner at top of editor
- Use design system colors: `bg-error/10`, `border-error/25`, `text-error`
- Errors persist until user dismisses or new run succeeds

**Decision 4: Button Labels**
- Rename "Test" → "Run with Dojo" (aligns with task requirements and brand voice)
- Keep "Save" and "Export" as-is

---

## 3. User Stories

### 3.1 Core User Stories

**US-1: Run Prompt Through Dojo**
- **As a** prompt engineer
- **I want to** execute my prompt through the Dojo agent system
- **So that** I can see which agent will handle my query and validate my prompt logic

**Acceptance Criteria:**
- Clicking "Run with Dojo" sends prompt content to `/api/supervisor/route`
- Button shows "Running..." with pulse animation during execution
- All buttons disabled and editor read-only during execution
- Success toast shows "Dojo run initiated successfully"
- Agent routing result logged to console
- Error banner displays if API fails

**US-2: Save Prompt to Backend**
- **As a** prompt engineer
- **I want to** save my prompt to persistent storage
- **So that** I can access it across sessions and devices

**Acceptance Criteria:**
- Clicking "Save" sends prompt to `/api/seeds` (POST or PATCH)
- Success toast shows "Prompt saved successfully"
- Prompt receives unique ID from backend
- Subsequent saves update existing seed (PATCH)
- Error toast displays if save fails

**US-3: Visual Feedback During Execution**
- **As a** user
- **I want to** see clear visual feedback when my prompt is running
- **So that** I understand the system is working and don't accidentally interrupt the process

**Acceptance Criteria:**
- Editor becomes read-only (gray background, cursor changes)
- "Run with Dojo" button shows "Running..." with `animate-pulse`
- All action buttons disabled
- Loading state clears when execution completes or errors

**US-4: Error Recovery**
- **As a** user
- **I want to** see clear error messages when something fails
- **So that** I can understand what went wrong and try again

**Acceptance Criteria:**
- API errors display in banner at top of editor
- Banner is dismissible (X button)
- Banner uses error styling from design system
- Error clears on successful retry or manual dismiss

---

## 4. Technical Requirements

### 4.1 State Management Updates

**`lib/stores/workbench.store.ts`**

Add to `WorkbenchState` interface:
```typescript
isRunning: boolean;
activeTabError: string | null;
setRunning: (isRunning: boolean) => void;
setActiveTabError: (error: string | null) => void;
```

Initialize new state:
```typescript
isRunning: false,
activeTabError: null,
```

Implement setters:
```typescript
setRunning: (isRunning) => set({ isRunning }),
setActiveTabError: (error) => set({ activeTabError: error }),
```

### 4.2 API Integration

**Save Functionality (`WorkbenchView.tsx`)**

```typescript
const handleSave = async () => {
  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  if (!activeTab) {
    toast.error("No active prompt to save");
    return;
  }

  try {
    // Determine if new seed or update
    const isNewSeed = !activeTab.id.startsWith('seed-');
    
    if (isNewSeed) {
      // POST /api/seeds
      const response = await fetch('/api/seeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: activeTab.title,
          type: 'prompt',
          content: activeTab.content,
          status: 'new'
        })
      });
      
      if (!response.ok) throw new Error('Failed to save prompt');
      
      const newSeed = await response.json();
      // Update tab ID to reflect backend ID
      updateTabId(activeTab.id, `seed-${newSeed.id}`);
    } else {
      // PATCH /api/seeds/[id]
      const seedId = activeTab.id.replace('seed-', '');
      const response = await fetch(`/api/seeds/${seedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: activeTab.title,
          content: activeTab.content
        })
      });
      
      if (!response.ok) throw new Error('Failed to update prompt');
    }
    
    toast.success("Prompt saved successfully");
  } catch (error) {
    console.error('[Save] Error:', error);
    toast.error("Failed to save prompt");
  }
};
```

**Run Functionality (`WorkbenchView.tsx`)**

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
    const response = await fetch('/api/supervisor/route', {
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

### 4.3 UI Component Updates

**`ActionBar.tsx`**

```typescript
interface ActionBarProps {
  onRun: () => void;  // Renamed from onTest
  onSave: () => void;
  onExport: () => void;
  isRunning: boolean;  // New prop
}

export function ActionBar({ onRun, onSave, onExport, isRunning }: ActionBarProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-4 bg-bg-secondary border-t border-bg-tertiary px-3 sm:px-6 py-3 sm:py-4">
      <Button 
        variant="primary" 
        onClick={onRun} 
        disabled={isRunning}
        className={`text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 ${isRunning ? 'animate-pulse' : ''}`}
      >
        {isRunning ? 'Running...' : 'Run with Dojo'}
      </Button>
      <Button 
        variant="secondary" 
        onClick={onSave} 
        disabled={isRunning}
        className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
      >
        Save
      </Button>
      <Button 
        variant="secondary" 
        onClick={onExport} 
        disabled={isRunning}
        className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
      >
        Export
      </Button>
    </div>
  );
}
```

**`Editor.tsx`**

Add error banner above Monaco editor:

```typescript
export function Editor() {
  const { tabs, activeTabId, updateTabContent, isRunning, activeTabError, setActiveTabError } = useWorkbenchStore();
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  // ... existing code ...

  return (
    <div className="flex flex-col h-full">
      {activeTabError && (
        <div className="bg-error/10 border-b border-error/25 text-error px-4 py-3 flex items-center justify-between">
          <span className="text-sm">{activeTabError}</span>
          <button 
            onClick={() => setActiveTabError(null)}
            className="text-error hover:text-error/80"
          >
            ×
          </button>
        </div>
      )}
      <MonacoEditor
        height="100%"
        language="markdown"
        value={activeTab.content}
        onChange={(value) => {
          if (value !== undefined && !isRunning) {
            updateTabContent(activeTab.id, value);
          }
        }}
        onMount={handleEditorMount}
        theme="dojo-genesis"
        options={{
          readOnly: isRunning,
          // ... existing options ...
        }}
      />
    </div>
  );
}
```

### 4.4 Missing Store Method

Add to `workbench.store.ts`:

```typescript
updateTabId: (oldId: string, newId: string) => set((state) => ({
  tabs: state.tabs.map((tab) => 
    tab.id === oldId ? { ...tab, id: newId } : tab
  ),
  activeTabId: state.activeTabId === oldId ? newId : state.activeTabId
})),
```

---

## 5. Design System Compliance

### 5.1 Colors

All components must use design system variables:

- **Backgrounds:** `bg-bg-primary`, `bg-bg-secondary`, `bg-bg-tertiary`
- **Text:** `text-text-primary`, `text-text-secondary`, `text-text-tertiary`
- **Accent:** `text-accent` (#f5a623 amber)
- **Error:** `bg-error/10`, `border-error/25`, `text-error` (#ef4444)
- **Success:** `text-success` (#4ade80)

### 5.2 Animation

- **Button pulse:** `animate-pulse` (Tailwind built-in)
- **Timing:** 300ms transitions for state changes
- **Easing:** Default Tailwind easing (ease-in-out)

### 5.3 Typography

- **Buttons:** 14px (sm screens: 12px), medium weight
- **Error text:** 14px, regular weight
- **Editor:** JetBrains Mono, 15px

---

## 6. Non-Functional Requirements

### 6.1 Performance

- API calls must have timeouts (30s max)
- Loading states must appear within 100ms of user action
- UI must remain responsive during async operations

### 6.2 Error Handling

- Network errors must be caught and displayed
- API errors must include actionable messages
- Console errors must include context (timestamp, operation, data)

### 6.3 Accessibility

- Disabled buttons must have `disabled` attribute
- Error banner must be dismissible with keyboard (Escape key)
- Loading states must be announced to screen readers

### 6.4 Browser Compatibility

- Support Chrome, Firefox, Safari, Edge (latest 2 versions)
- Graceful degradation for older browsers

---

## 7. Testing Requirements

### 7.1 Manual Testing Checklist

- [ ] Run prompt with valid content → Success toast + console log
- [ ] Run empty prompt → Error toast "Cannot run an empty prompt"
- [ ] Run prompt while offline → Error banner appears
- [ ] Save new prompt → POST to /api/seeds → Success toast
- [ ] Save existing prompt → PATCH to /api/seeds → Success toast
- [ ] Click Save while running → Button disabled
- [ ] Click Export → JSON/MD files download
- [ ] Error banner dismiss (X button) → Banner disappears
- [ ] Error banner auto-clear on successful retry → Banner disappears

### 7.2 Automated Testing

- Run `npm run lint` → 0 errors
- Run `npm run type-check` → 0 errors
- Run `npm run build` → Successful build
- No console errors on page load
- No console errors during normal operation

---

## 8. Out of Scope (Future Work)

The following are explicitly **not** part of this sprint:

1. **Streaming execution results** - Current implementation logs routing decision only
2. **Agent Activity Panel integration** - Will wire up in separate sprint
3. **DojoPacket export from Workbench** - Current export is simple JSON/MD, not full session packet
4. **Prompt versioning** - Seeds API supports basic CRUD, not version history
5. **Collaborative editing** - Single-user only
6. **Undo/Redo** - Monaco provides this out of box, no custom implementation needed
7. **Prompt templates library** - Loading pre-built prompts from Librarian
8. **Cost tracking display** - Cost Guard integration deferred

---

## 9. Success Criteria

**This sprint is complete when:**

1. ✅ User can click "Run with Dojo" and see routing decision logged
2. ✅ User can click "Save" and prompt persists to Seeds API
3. ✅ All buttons disable and editor becomes read-only during execution
4. ✅ Error banner displays API failures with dismiss button
5. ✅ Success toasts appear for save/run operations
6. ✅ `npm run lint` passes with 0 errors
7. ✅ `npm run type-check` passes with 0 errors
8. ✅ `npm run build` succeeds
9. ✅ No console errors during normal operation
10. ✅ UI matches mockup styling (colors, spacing, animations)

---

## 10. Open Questions / Assumptions

### Questions for Product/Engineering Team:

1. **Execution API:** Should we build a full execution endpoint (`/api/execute`) or is routing-only sufficient for v1.0?
2. **Session Management:** How should we generate/manage `session_id`? Currently using `crypto.randomUUID()` per run.
3. **Authentication:** Seeds API requires auth. Is dev mode (`NEXT_PUBLIC_DEV_MODE=true`) acceptable for this sprint?
4. **Seed Type:** Should prompts use `type: 'prompt'` or existing types like `'route'`, `'pattern'`, etc.?

### Assumptions Made:

1. **Seeds API is correct storage mechanism** - Using `/api/seeds` instead of non-existent `/api/packet/[packetId]`
2. **Routing-only execution is acceptable** - Full execution with streaming will come later
3. **Dev mode authentication is acceptable** - No user login flow required for sprint
4. **Tab ID mapping** - New tabs have generated IDs, saved tabs use `seed-{id}` format
5. **Error messages can be generic** - No need for specific error codes/messages per failure type

---

## 11. Implementation Notes

### 11.1 Development Environment

- **Node version:** As specified in project (likely 18+)
- **Dev mode:** Set `NEXT_PUBLIC_DEV_MODE=true` in `.env.local`
- **Database:** PGLite (in-process PostgreSQL)

### 11.2 Code Style

- Follow existing patterns in codebase
- Use TypeScript strict mode
- Async functions must have try/catch/finally
- Use `useWorkbenchStore` for all state access
- Use `useToast` for user notifications

### 11.3 Git Workflow

- **Do NOT commit unless explicitly asked by user**
- Work in feature branch if requested
- Run linting/type-check before considering work complete

---

## 12. References

- **Mockup:** `/00_Roadmap/V0.4.0_MOCKUPS_REFINED.md` (Section: Mockup 3)
- **Brand Guide:** `/00_Roadmap/DOJO_GENESIS_BRAND_GUIDE.md`
- **Existing Components:** `/components/workbench/*`
- **State Management:** `/lib/stores/workbench.store.ts`
- **APIs:** `/app/api/supervisor/route/route.ts`, `/app/api/seeds/*`
- **Type Definitions:** `/lib/packet/schema.ts`, `/lib/harness/types.ts`

---

**Document Status:** ✅ Ready for Technical Specification

**Next Step:** Create technical specification in `spec.md` based on this PRD.
