# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: 7530ca21-ace5-48e3-aaac-2d897c703870 -->

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: c2b65f01-8343-4cf2-b520-305937d23948 -->

Create a technical specification based on the PRD in `{@artifacts_path}/requirements.md`.

1. Review existing codebase architecture and identify reusable components
2. Define the implementation approach

Save to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach referencing existing code patterns
- Source code structure changes
- Data model / API / interface changes
- Delivery phases (incremental, testable milestones)
- Verification approach using project lint/test commands

### [x] Step: Planning
<!-- chat-id: 1698ed1c-7f4b-4344-9477-a16dfccdc013 -->

Create a detailed implementation plan based on `{@artifacts_path}/spec.md`.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps
3. Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function) or too broad (entire feature).

If the feature is trivial and doesn't warrant full specification, update this workflow to remove unnecessary steps and explain the reasoning to the user.

Save to `{@artifacts_path}/plan.md`.

### [x] Step 1: Create Zustand Store and Type Definitions
<!-- chat-id: 9837b84f-1088-4711-b33d-54439db3a6f8 -->

**Files to Create:**
- `lib/stores/dojo.store.ts`

**Tasks:**
1. Define `DojoMessage` interface with id, role, content, mode, timestamp
2. Define `DojoMode` type ('Mirror' | 'Scout' | 'Gardener' | 'Implementation')
3. Define `DojoSessionState` interface with state and actions
4. Implement Zustand store with:
   - State: sessionId, messages, isLoading, currentMode, error
   - Actions: setSessionId, addMessage, appendToLastMessage, setLoading, setMode, setError, clearSession
5. Export `useDojoStore` hook

**Verification:**
- TypeScript compiles without errors
- Store follows existing Zustand pattern from codebase

---

### [x] Step 2: Create UI Components - ModeBadge
<!-- chat-id: d1ff6535-2ed4-4fa4-847a-b73ce61a8974 -->

**Files to Create:**
- `components/dojo/ModeBadge.tsx`

**Tasks:**
1. Create `ModeBadgeProps` interface with mode property
2. Define `BADGE_CONFIG` with emoji, color, and background for each mode
3. Render badge with appropriate styling (inline-flex, rounded-full, with emoji and text)

**Verification:**
- Component renders all 4 modes correctly
- TypeScript compiles without errors

---

### [x] Step 3: Create UI Components - ChatMessage
<!-- chat-id: 7d292204-659d-4e96-8025-4b6832733313 -->

**Files to Create:**
- `components/dojo/ChatMessage.tsx`

**Tasks:**
1. Create `ChatMessageProps` interface (role, content, mode, timestamp)
2. Implement layout logic:
   - User messages: right-aligned, accent background
   - Agent messages: left-aligned, secondary background with ModeBadge
3. Render content with `whitespace-pre-wrap` for formatting
4. Add responsive styling

**Verification:**
- Both user and agent messages render correctly
- Mode badge appears only on agent messages
- TypeScript compiles without errors

---

### [x] Step 4: Create UI Components - SessionHistory
<!-- chat-id: e5b705e3-cb11-4fd8-b1c6-bef1ea728b89 -->

**Files to Create:**
- `components/dojo/SessionHistory.tsx`

**Tasks:**
1. Create `SessionHistoryProps` interface with messages array
2. Implement auto-scroll using useRef and useEffect
3. Map messages to ChatMessage components
4. Create empty state with Dojo icon and instructional text
5. Style as scrollable container

**Verification:**
- Empty state displays when no messages
- Auto-scroll works when messages update
- Scrollable container renders correctly

---

### [x] Step 5: Create UI Components - DojoInput
<!-- chat-id: 31a016e7-3ea6-44f3-a869-8b75989a8e51 -->

**Files to Create:**
- `components/dojo/DojoInput.tsx`

**Tasks:**
1. Create `DojoInputProps` interface (onSubmit, isLoading, disabled)
2. Implement useState for situation and perspectives array
3. Create textarea for situation input (required, 4 rows)
4. Create dynamic perspective inputs with Add/Remove buttons
5. Add form validation (situation cannot be empty)
6. Implement submit handler that filters empty perspectives
7. Add loading state handling

**Verification:**
- Can add/remove perspective inputs
- Submit disabled when situation is empty
- Form data submitted correctly to callback
- TypeScript compiles without errors

---

### [x] Step 6: Create SimpleTextInput Component
<!-- chat-id: b78a6aff-a04d-4074-ae0e-b9672c67705d -->

**Files to Create:**
- `components/dojo/SimpleTextInput.tsx`

**Tasks:**
1. Create `SimpleTextInputProps` interface (onSubmit, isLoading)
2. Implement text input with submit button
3. Handle Enter key to submit
4. Clear input after submission
5. Maintain focus on input after submit
6. Add loading state handling

**Verification:**
- Input clears after submit
- Enter key submits message
- Loading state disables input
- TypeScript compiles without errors

---

### [x] Step 7: Create useDojo Hook
<!-- chat-id: 7f65d3f9-88af-4fe1-9f6c-c036dd594ba6 -->

**Files to Create:**
- `hooks/useDojo.ts`

**Tasks:**
1. Define hook return type with sendMessage, messages, isLoading, error
2. Connect to useDojoStore
3. Set sessionId on mount
4. Implement sendMessage function:
   - Add user message to store
   - Make POST request to /api/dojo with SSE streaming
   - Parse SSE events line-by-line
   - Handle MODE_TRANSITION events
   - Handle AGENT_RESPONSE_CHUNK events
   - Update store with streaming content
5. Implement error handling and cleanup

**Verification:**
- Hook compiles without TypeScript errors
- Follows SSE pattern from useSupervisor
- Proper cleanup on unmount

---

### [x] Step 8: Create Dojo API Route
<!-- chat-id: 9f4fc046-160b-4bef-8859-819cb86ed3e4 -->

**Files to Create:**
- `app/api/dojo/route.ts`

**Tasks:**
1. Create POST handler for /api/dojo
2. Validate request body (situation required)
3. Import and invoke handleDojoQuery from lib/agents/dojo-handler.ts
4. Implement ReadableStream for SSE response
5. Emit HarnessEvents:
   - SESSION_START
   - MODE_TRANSITION
   - AGENT_ACTIVITY_START
   - AGENT_RESPONSE_CHUNK (stream response)
   - AGENT_ACTIVITY_COMPLETE
   - SESSION_END
6. Handle errors with ERROR events
7. Set appropriate headers (Content-Type: text/event-stream)

**Verification:**
- API route compiles without errors
- Request validation works
- SSE streaming format matches spec
- Error handling returns appropriate status codes

---

### [x] Step 9: Create Dojo Session Page
<!-- chat-id: 4680c46b-0e51-4c7c-8b0b-8b774e23b443 -->

**Files to Create:**
- `app/dojo/[sessionId]/page.tsx`

**Tasks:**
1. Mark component as 'use client'
2. Extract sessionId from params
3. Connect to useDojo hook
4. Implement page layout:
   - Header with session title input and save button (placeholder UI)
   - SessionHistory component
   - Conditional input: DojoInput for first message, SimpleTextInput for follow-ups
5. Handle save button click with placeholder alert
6. Add responsive styling (flex column, full height)

**Verification:**
- Page renders without errors
- Dynamic routing works (/dojo/new, /dojo/:sessionId)
- Components integrate correctly
- TypeScript compiles without errors

---

### [x] Step 10: Update Dashboard Navigation
<!-- chat-id: 02bbb023-39d7-4cb5-b9c9-631c2bcb0841 -->

**Files to Modify:**
- `app/dashboard/page.tsx`

**Tasks:**
1. Find "New Dojo Session" button onClick handler
2. Update to use `router.push('/dojo/new')`
3. Remove or comment out old "New Project" modal logic

**Verification:**
- Clicking button navigates to /dojo/new
- No console errors
- Navigation is smooth

---

### [x] Step 11: Add Builder Agent to Agent Status
<!-- chat-id: 7fc3ce6c-2388-4b4b-bf0f-5a5ea0959df8 -->

**Files to Modify:**
- `components/dashboard/AgentStatus.tsx`

**Tasks:**
1. Locate `AGENT_ORDER` array
2. Add 'builder' to the array
3. Verify grid layout accommodates 5 agents
4. Ensure Builder shows icon "🛠️" and appropriate status

**Verification:**
- All 5 agents display in Agent Status panel
- Builder agent has correct icon
- Layout remains responsive

---

### [x] Step 12: Integration Testing and Polish
<!-- chat-id: c22da378-f795-4868-8b40-55772e6e8ad5 -->

**Tasks:**
1. Test end-to-end flow:
   - ✅ Navigate from Dashboard to /dojo/new
   - ✅ Submit situation with perspectives
   - ✅ Verify streaming response appears
   - ✅ Check mode badge displays (Mirror mode badge working)
   - ✅ Send follow-up message
   - ✅ Verify chat history persists
2. Test error cases:
   - ✅ Empty situation submission (Submit button disabled)
   - Network failure (not tested - requires mock)
   - Invalid API response (not tested - requires mock)
3. Test responsive design:
   - ✅ Mobile (375x667) - sidebar collapses, chat layout works
   - ✅ Desktop (1920x1080) - full layout displays correctly
4. Test keyboard navigation:
   - ✅ Enter key submits message
5. Test other features:
   - ✅ Auto-scroll behavior (messages added to bottom)
   - ✅ Add/remove perspectives works
   - ✅ Save Session button shows placeholder alert

**Verification:**
- ✅ All core user stories from requirements.md satisfied
- ✅ No console errors related to Dojo implementation (only expected 404s for /api/agents/status)
- ✅ Smooth user experience across devices
- ✅ API streaming working correctly (3 POST requests to /api/dojo all returned 200 OK)
- ✅ pnpm lint passes with no warnings

---

### [x] Step 13: Run Linting and Type Checking

**Commands:**
```bash
pnpm type-check
pnpm lint
```

**Tasks:**
1. Run type-check and fix any TypeScript errors
2. Run lint and fix any ESLint warnings
3. Document any remaining issues in plan.md

**Verification:**
- ✅ `pnpm lint` passes with no warnings or errors
- ⚠️ `pnpm type-check` has pre-existing errors in test files (test-builder-agent.ts, test-debugger-agent.ts)
- ✅ All Dojo implementation code has no TypeScript errors
- ✅ All code follows project conventions

**Notes:**
- TypeScript errors in test files are pre-existing and not related to this implementation
- All new Dojo-related files (components, hooks, API routes, store) compile without errors
- ESLint passed with no warnings, confirming code quality
