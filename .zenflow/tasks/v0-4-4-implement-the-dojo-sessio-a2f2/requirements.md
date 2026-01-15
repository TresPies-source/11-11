# Product Requirements Document: Dojo Session Page

**Version:** 1.0  
**Date:** January 15, 2026  
**Status:** Draft

---

## 1. Executive Summary

This document defines the requirements for implementing a dedicated, full-page chat interface for Dojo sessions at `/dojo/{sessionId}`. The Dojo Session Page will serve as the primary user-facing interface for the 11-11 platform's core thinking partnership experience. This implementation addresses a critical gap identified in the v0.4.2 system audit: the complete absence of a user-facing chat interface for Dojo sessions.

## 2. Background & Context

### 2.1 Problem Statement
- The Dashboard's "New Dojo Session" button currently opens a generic "New Project" modal, creating a disjointed user experience
- Users have no dedicated interface to engage with the Dojo agent's thinking partnership capabilities
- The platform lacks a focused, distraction-free environment for deep AI collaboration

### 2.2 Design Philosophy
The Dojo Session Page embodies a **"Thinking Room"** concept:
- Clean, focused interface inspired by platforms like Zenflow
- Minimal distractions to support deep thinking and collaboration
- Progressive enhancement: start simple, add complexity as needed
- Clear visual feedback on AI modes and agent status

### 2.3 Reference Documents
- Design Specification: `/home/ubuntu/11-11-sprint-3-design-spec.md`
- System Audit: `/home/ubuntu/11-11-sprint-3-analysis.md`

---

## 3. User Stories

### 3.1 Primary User Stories

**US-1: Start New Dojo Session**
```
As a user
I want to click "New Dojo Session" on the Dashboard
So that I can begin a new thinking partnership session with the Dojo agent
```
**Acceptance Criteria:**
- Clicking "New Dojo Session" navigates to `/dojo/new`
- Page displays immediately with input form ready
- No loading states or delays in initial render

**US-2: Submit Initial Thinking Situation**
```
As a user
I want to describe my situation and provide multiple perspectives
So that the Dojo agent can help me explore and synthesize my thinking
```
**Acceptance Criteria:**
- Input form includes a large textarea for the main situation
- User can add multiple perspective inputs dynamically
- User can remove perspectives they've added
- Submit button is disabled until at least a situation is provided
- Form shows loading state while request is processing

**US-3: Receive Dojo Agent Response**
```
As a user
I want to see the Dojo agent's response streamed into the chat
So that I can understand the AI's thinking process and which mode it's using
```
**Acceptance Criteria:**
- Response appears in chat history as it streams
- Agent message clearly indicates which mode was used (Mirror/Scout/Gardener/Implementation)
- Response supports markdown and code block rendering
- Chat auto-scrolls to show new content

**US-4: Continue Conversation**
```
As a user
I want to send follow-up messages in the same session
So that I can continue refining my thinking with the agent
```
**Acceptance Criteria:**
- After initial submission, input form transitions to simpler text input
- User can send multiple messages in sequence
- Message history is preserved and scrollable
- Each agent response shows the mode used for that turn

**US-5: Monitor Agent Status**
```
As a user
I want to see which agents are active and their current status
So that I understand what's happening in the system
```
**Acceptance Criteria:**
- Agent Status panel on Dashboard shows all 4 agents: Supervisor, Dojo, Librarian, Debugger, Builder
- Builder agent is visible with appropriate icon and status
- Status updates reflect real-time agent activity

---

## 4. Functional Requirements

### 4.1 Routing & Navigation

**REQ-1.1: Dynamic Route**
- Implement dynamic route at `app/dojo/[sessionId]/page.tsx`
- Support special route `/dojo/new` for new session creation
- Handle invalid session IDs gracefully with 404 or redirect

**REQ-1.2: Dashboard Integration**
- Update "New Dojo Session" button to navigate to `/dojo/new`
- Remove or modify existing "New Project" modal trigger

### 4.2 Input Components

**REQ-2.1: DojoInput Component**
- **Location:** `components/dojo/DojoInput.tsx`
- **Fields:**
  - Situation (textarea, required, 3-5 rows minimum)
  - Perspectives (dynamic list of text inputs, optional)
  - Add Perspective button (adds new input field)
  - Remove button for each perspective (except if only one exists)
  - Submit button
- **State Management:** Use React `useState` (no react-hook-form dependency)
- **Validation:**
  - Situation field cannot be empty
  - Perspectives can be empty
  - Show inline validation errors
- **Styling:** Follow existing design system (dark theme, accent colors, responsive)

**REQ-2.2: Simplified Input (Post-Initial Submit)**
- After first message is sent, replace DojoInput with a simple text input + submit button
- Similar to ChatPanel pattern seen in `components/multi-agent/ChatPanel.tsx`
- Maintain focus on input after each message sent

### 4.3 Message Display Components

**REQ-3.1: ChatMessage Component**
- **Location:** `components/dojo/ChatMessage.tsx`
- **Props:**
  - `role`: 'user' | 'assistant'
  - `content`: string (markdown)
  - `mode`: DojoMode | null (for assistant messages)
  - `timestamp`: optional string
- **Rendering:**
  - User messages: right-aligned, accent background
  - Agent messages: left-aligned, secondary background
  - Agent messages display mode badge at top (e.g., "🪞 MIRROR" or "🔭 SCOUT")
  - Support markdown rendering (bold, italic, lists, code blocks)
- **Styling:** Consistent with existing ChatPanel patterns

**REQ-3.2: SessionHistory Component**
- **Location:** `components/dojo/SessionHistory.tsx`
- **Behavior:**
  - Scrollable container for all messages
  - Auto-scroll to bottom when new message arrives
  - Use `useRef` and `scrollIntoView` pattern from ChatPanel
  - Show empty state when no messages exist
- **Empty State:**
  - Display Dojo icon/logo
  - Show message like "Describe your situation to begin..."

### 4.4 State Management

**REQ-4.1: Dojo Store**
- **Location:** `lib/stores/dojo.store.ts`
- **State Shape:**
```typescript
interface DojoSessionState {
  sessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  currentMode: DojoMode | null;
  error: string | null;
  
  // Actions
  setSessionId: (id: string) => void;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setMode: (mode: DojoMode | null) => void;
  setError: (error: string | null) => void;
  clearSession: () => void;
}
```
- Use Zustand pattern from existing stores

### 4.5 API Integration

**REQ-5.1: Supervisor API Communication**
- **Endpoint:** `/api/supervisor/route` (existing)
- **Request Format:**
```json
{
  "query": "situation + perspectives concatenated",
  "conversation_context": ["previous messages"],
  "session_id": "session-uuid",
  "stream": true
}
```
- **Response:** SSE stream of HarnessEvents
- Handle AGENT_ROUTING, AGENT_ACTIVITY_START, AGENT_ACTIVITY_COMPLETE events

**REQ-5.2: Streaming Integration**
- Use `useSupervisor` hook pattern (or create similar)
- Parse SSE events line-by-line
- Update message content as chunks arrive
- Handle errors and connection failures gracefully

### 4.6 Session Management (Placeholder)

**REQ-6.1: Session Title (UI Only)**
- Add text input in page header for session title
- Label: "Session Title"
- Default placeholder: "Untitled Dojo Session"
- **Note:** No backend persistence in this version

**REQ-6.2: Save Button (UI Only)**
- Add "Save Session" button in header
- Shows toast message: "Session saving not yet implemented"
- **Note:** Full implementation deferred to Prompt Bridge track

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Initial page load < 1 second
- SSE connection establishes within 500ms
- Smooth scrolling and animations (60fps)
- No UI blocking during message streaming

### 5.2 Accessibility
- Keyboard navigation for all inputs and buttons
- Proper ARIA labels for screen readers
- Focus management (auto-focus on input after submit)
- Sufficient color contrast (WCAG AA)

### 5.3 Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Stack perspectives vertically on mobile
- Full-width layout on mobile, max-width container on desktop

### 5.4 Error Handling
- Network errors: Show user-friendly message with retry option
- Invalid session IDs: Redirect to `/dojo/new`
- API errors: Display error in chat with error message
- Form validation errors: Inline validation messages

---

## 6. Technical Constraints & Assumptions

### 6.1 Technology Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS with existing design tokens
- **State:** Zustand
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **TypeScript:** Strict mode

### 6.2 Dependencies
- No new dependencies required
- No `react-hook-form` (not in package.json)
- Use existing UI components (Button, Card)
- Follow existing patterns from ChatPanel, NewProjectModal

### 6.3 API Assumptions
- Supervisor API already handles Dojo routing
- Dojo agent handler (`lib/agents/dojo-handler.ts`) is fully functional
- SSE streaming format matches existing HarnessEvent structure
- Agent mode is extractable from response metadata

### 6.4 Design Decisions

**Decision 1: Progressive Input Enhancement**
- **Rationale:** Start with structured input (situation + perspectives) for initial message, then simplify to text input for follow-ups. This balances the Dojo agent's need for structured thinking with conversation flow.

**Decision 2: No Session Persistence Yet**
- **Rationale:** Per task description, session persistence is part of the Prompt Bridge track. This implementation focuses on the chat interface only.

**Decision 3: Mode Indicator Placement**
- **Rationale:** Place mode badge at the top of agent messages (not bottom) to immediately signal the thinking approach being used. This helps users understand the response context before reading.

**Decision 4: Single-Column Layout**
- **Rationale:** Unlike multi-panel workbench interfaces, Dojo sessions benefit from a focused, single-column chat layout that minimizes cognitive overhead.

---

## 7. User Interface Specifications

### 7.1 Page Layout Structure
```
┌─────────────────────────────────────────┐
│  Header (Session Title + Save Button)   │
├─────────────────────────────────────────┤
│                                         │
│  Chat History (scrollable)              │
│  ┌───────────────────────────────┐     │
│  │ Agent Message (mode badge)    │     │
│  └───────────────────────────────┘     │
│                                         │
│          ┌───────────────────┐         │
│          │ User Message      │         │
│          └───────────────────┘         │
│                                         │
├─────────────────────────────────────────┤
│  Input Form / Text Input                │
└─────────────────────────────────────────┘
```

### 7.2 Component Hierarchy
```
DojoSessionPage
├── SessionHeader
│   ├── TitleInput (placeholder)
│   └── SaveButton (placeholder)
├── SessionHistory
│   └── ChatMessage[] (mapped)
└── MessageInput
    ├── DojoInput (initial) OR
    └── SimpleTextInput (subsequent)
```

### 7.3 Mode Badge Design
- **Mirror:** 🪞 MIRROR (blue accent)
- **Scout:** 🔭 SCOUT (purple accent)
- **Gardener:** 🌱 GARDENER (green accent)
- **Implementation:** 🛠️ IMPLEMENTATION (amber accent)

### 7.4 Empty State
- Icon: Dojo brain emoji (🧠) or Zenflow-style minimal icon
- Text: "Describe your situation and perspectives to begin your thinking session"
- Subtext: "The Dojo agent will help you explore, synthesize, and converge your ideas"

---

## 8. Agent Status Panel Update

### 8.1 Builder Agent Addition
- **Requirement:** Add Builder agent to the Dashboard's Agent Status panel
- **Location:** `components/dashboard/AgentStatus.tsx`
- **Changes:**
  - Update `AGENT_ORDER` array to include 'builder'
  - Grid layout adjusts to accommodate 5 agents (or wraps responsively)
  - Builder agent shows icon "🛠️" and appropriate status
- **Rationale:** Ensures all agents in the registry are visible in the UI

---

## 9. Out of Scope (Explicitly Deferred)

The following features are **not included** in this implementation:

1. **Session Persistence:** Saving/loading sessions from database
2. **Session History List:** Browsing past sessions
3. **Packet Export:** Exporting Dojo sessions as DojoPacket JSON
4. **Multi-Agent Handoffs:** Transitioning from Dojo to Librarian/Debugger/Builder
5. **Collaborative Sessions:** Multi-user sessions
6. **Rich Media:** Image uploads, file attachments
7. **Voice Input:** Speech-to-text integration
8. **Session Analytics:** Usage metrics, conversation insights

---

## 10. Success Metrics

### 10.1 Functional Completeness
- [ ] All acceptance criteria for user stories met
- [ ] All REQ items implemented and tested
- [ ] No TypeScript errors
- [ ] No ESLint warnings

### 10.2 User Experience
- [ ] Smooth transitions and animations
- [ ] Responsive across mobile, tablet, desktop
- [ ] Accessible keyboard navigation
- [ ] Clear loading states and error messages

### 10.3 Code Quality
- [ ] Follows existing codebase patterns
- [ ] Components are reusable and well-typed
- [ ] Zustand store follows conventions
- [ ] No code duplication

---

## 11. Open Questions & Clarifications

### 11.1 Resolved (Design Decisions)
- **Q:** Should perspectives be required?  
  **A:** No, only situation is required. Perspectives are optional enhancements.

- **Q:** How do we construct the query for the Supervisor API?  
  **A:** Concatenate situation + perspectives into a single query string for first message. For follow-ups, use message content directly.

- **Q:** Should we show agent routing decisions?  
  **A:** Not in this version. Focus on the Dojo agent only. Routing is implicit.

### 11.2 For Future Consideration
- **Q:** Should we support editing previous messages?  
  **A:** Deferred to future iteration. Current version is append-only.

- **Q:** Should we show cost/token usage in the UI?  
  **A:** Deferred. This would be a nice-to-have in the session header.

- **Q:** How do we handle very long conversations (context limits)?  
  **A:** Rely on existing context pruning logic. No special handling in UI for now.

---

## 12. Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| SSE stream failures | High | Medium | Implement reconnection logic, show error UI with retry button |
| Mode detection fails | Medium | Low | Default to Mirror mode if mode cannot be determined |
| Markdown rendering breaks | Medium | Low | Use well-tested markdown library, escape user input |
| Mobile UX issues | Medium | Medium | Test on real devices, use responsive design patterns |
| Performance with long history | Low | Low | Implement virtual scrolling if needed (future) |

---

## 13. Dependencies & Sequencing

### 13.1 Prerequisites (Already Complete)
- ✅ Dojo agent handler implementation
- ✅ Supervisor routing API
- ✅ Zustand store pattern established
- ✅ UI component library (Button, Card)
- ✅ Design system tokens

### 13.2 Parallel Work Possible
- Dojo store creation can happen alongside component work
- UI components can be built and tested independently
- API integration can be tested with mock data first

### 13.3 Critical Path
1. Create page route and basic layout
2. Implement DojoInput component
3. Create ChatMessage and SessionHistory components
4. Implement Dojo store
5. Integrate with Supervisor API
6. Update Dashboard navigation
7. Add Builder to Agent Status panel
8. Testing and refinement

---

## 14. Appendix

### 14.1 Key Types
```typescript
// From lib/agents/types.ts
interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent_id?: string;
  timestamp?: string;
}

// From lib/agents/dojo-handler.ts
type DojoMode = 'Mirror' | 'Scout' | 'Gardener' | 'Implementation';

// From lib/pglite/types.ts
type DojoMode = 'Mirror' | 'Scout' | 'Gardener' | 'Implementation';
```

### 14.2 Example User Flow
1. User clicks "New Dojo Session" on Dashboard
2. Navigates to `/dojo/new`
3. Sees DojoInput form with Situation textarea
4. Types situation: "I'm trying to decide between two job offers"
5. Clicks "Add Perspective" button
6. Adds perspective: "Company A offers better pay"
7. Adds perspective: "Company B offers better culture"
8. Clicks "Submit"
9. Loading spinner appears on submit button
10. Chat history shows user's input as a message
11. Agent response streams in with "🪞 MIRROR" badge
12. Agent provides reflection and reframes
13. Input form switches to simple text input
14. User continues conversation with follow-up questions

---

**Document Version History:**
- v1.0 (2026-01-15): Initial PRD created based on task description and codebase analysis
