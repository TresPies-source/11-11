# Technical Specification: Dojo Session Page

**Version:** 1.0  
**Date:** January 15, 2026  
**Status:** Final

---

## 1. Technical Context

### 1.1 Technology Stack
- **Framework**: Next.js 14.2.24 (App Router)
- **Language**: TypeScript 5.7.2 (strict mode)
- **Styling**: Tailwind CSS 3.4.17
- **State Management**: Zustand 5.0.10
- **Animations**: Framer Motion 11.15.0
- **Icons**: Lucide React 0.469.0
- **LLM**: OpenAI 4.77.0
- **Runtime**: Node.js (server-side API routes)

### 1.2 Existing Dependencies (No New Packages Required)
All required dependencies are already in `package.json`:
- `zustand` for state management
- `framer-motion` for animations
- `lucide-react` for icons
- `tailwind-merge` (via `cn` utility)
- `clsx` for conditional classes

**Note**: The project does NOT include a markdown rendering library (`react-markdown`, `marked`, etc.). For Phase 1, agent responses will be displayed as plain text with basic formatting. Markdown rendering can be added in a future iteration if needed.

### 1.3 Existing Code Patterns

#### Zustand Store Pattern
```typescript
// lib/stores/{name}.store.ts
import { create } from 'zustand';

interface StoreState {
  // State properties
  data: Type;
  
  // Actions
  setData: (data: Type) => void;
}

export const useStore = create<StoreState>((set) => ({
  data: initialValue,
  setData: (data) => set({ data }),
}));
```

#### SSE Streaming Hook Pattern
Reference: `hooks/useSupervisor.ts`
- Uses `fetch` with `Accept: text/event-stream`
- Reads response body with `getReader()` and `TextDecoder`
- Parses newline-delimited JSON events
- Updates Zustand store with `addTraceEvent()`

#### UI Component Patterns
- **Button**: `components/ui/Button.tsx` - Framer Motion button with variants (primary, secondary, ghost)
- **Card**: `components/ui/Card.tsx` - Container with optional glow effect
- **Chat Layout**: `components/multi-agent/ChatPanel.tsx` - Full chat interface with message history, input form, and auto-scroll

#### Design System
```typescript
// Colors (from tailwind.config.js)
bg-primary: '#0a0a0a'
bg-secondary: '#1a1a1a'
bg-tertiary: '#2a2a2a'
text-primary: '#ffffff'
text-secondary: '#b0b0b0'
text-accent: '#f5a623' (orange)

// Spacing: Tailwind defaults
// Typography: System fonts with bold weights
```

---

## 2. Implementation Approach

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 /dojo/[sessionId]                       │
│                  (Next.js Page)                         │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
┌─────────▼─────────┐          ┌─────────▼──────────┐
│  DojoSessionPage  │          │   dojo.store.ts    │
│   (Page Layout)   │◄─────────┤  (Zustand Store)   │
└─────────┬─────────┘          └────────────────────┘
          │                               │
   ┌──────┴──────┐                       │
   │             │                       │
┌──▼──┐   ┌─────▼──────┐         ┌──────▼──────┐
│Input│   │  History   │         │ API Client  │
│     │   │  Display   │         │  (useDojo)  │
└─────┘   └────────────┘         └──────┬──────┘
                                        │
                              ┌─────────▼─────────────┐
                              │  POST /api/dojo       │
                              │  (New API Route)      │
                              └─────────┬─────────────┘
                                        │
                              ┌─────────▼─────────────┐
                              │  handleDojoQuery()    │
                              │  (lib/agents/dojo-    │
                              │   handler.ts)         │
                              └───────────────────────┘
```

### 2.2 Why a New API Route?

The existing `app/api/supervisor/route/route.ts` only performs **routing** (decides which agent to use) but does not **invoke** agents. For the Dojo Session Page, we need a dedicated API that:
1. Accepts DojoPacket-style inputs (situation + perspectives)
2. Invokes `handleDojoQuery()` from `lib/agents/dojo-handler.ts`
3. Streams the response using SSE
4. Emits HarnessEvents for agent status tracking

**Decision**: Create `app/api/dojo/route.ts` for direct Dojo agent invocation.

---

## 3. Source Code Structure Changes

### 3.1 New Files to Create

```
app/
  dojo/
    [sessionId]/
      page.tsx                    # Main session page component

components/
  dojo/
    DojoInput.tsx                 # Multi-part input form (situation + perspectives)
    SessionHistory.tsx            # Message history container
    ChatMessage.tsx               # Individual message renderer
    ModeBadge.tsx                 # Mode indicator badge component

lib/
  stores/
    dojo.store.ts                 # Zustand store for session state

hooks/
  useDojo.ts                      # Hook for Dojo API interaction (SSE streaming)

app/
  api/
    dojo/
      route.ts                    # New API route for Dojo invocation
```

### 3.2 Files to Modify

```
app/dashboard/page.tsx            # Update "New Dojo Session" button onClick
components/dashboard/AgentStatus.tsx  # Add 'builder' to AGENT_ORDER
```

---

## 4. Data Model & Type Definitions

### 4.1 Dojo Store State Shape

```typescript
// lib/stores/dojo.store.ts
export interface DojoMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: DojoMode;
  timestamp: string;
}

export type DojoMode = 'Mirror' | 'Scout' | 'Gardener' | 'Implementation';

interface DojoSessionState {
  sessionId: string | null;
  messages: DojoMessage[];
  isLoading: boolean;
  currentMode: DojoMode | null;
  error: string | null;

  // Actions
  setSessionId: (id: string) => void;
  addMessage: (message: DojoMessage) => void;
  appendToLastMessage: (chunk: string) => void;
  setLoading: (loading: boolean) => void;
  setMode: (mode: DojoMode | null) => void;
  setError: (error: string | null) => void;
  clearSession: () => void;
}
```

### 4.2 API Request/Response Contracts

#### POST /api/dojo
**Request Body:**
```typescript
{
  situation: string;              // Main thinking situation
  perspectives?: string[];        // Array of perspective strings (optional)
  conversation_history?: DojoMessage[];  // For follow-up messages
  session_id: string;             // UUID for session tracking
  stream: boolean;                // Always true for SSE
}
```

**Response (SSE Stream):**
Newline-delimited JSON events (HarnessEvent format):
```typescript
// Event 1: Session start
{
  event_type: 'SESSION_START',
  timestamp: string,
  inputs: { situation: string },
  metadata: { agent_id: 'dojo' }
}

// Event 2: Mode selection
{
  event_type: 'MODE_TRANSITION',
  timestamp: string,
  inputs: { from_mode: string, to_mode: DojoMode },
  metadata: { mode: DojoMode }
}

// Event 3: Agent activity start
{
  event_type: 'AGENT_ACTIVITY_START',
  timestamp: string,
  inputs: { agent_id: 'dojo', message: string },
  metadata: { mode: DojoMode, progress: 0 }
}

// Event 4+: Response chunks (custom event type)
{
  event_type: 'AGENT_RESPONSE_CHUNK',
  timestamp: string,
  outputs: { content: string },
  metadata: { agent_id: 'dojo', mode: DojoMode }
}

// Final event: Activity complete
{
  event_type: 'AGENT_ACTIVITY_COMPLETE',
  timestamp: string,
  inputs: { agent_id: 'dojo' },
  metadata: { mode: DojoMode, progress: 100 }
}

// Final event: Session end
{
  event_type: 'SESSION_END',
  timestamp: string,
  metadata: { duration_ms: number }
}
```

---

## 5. API Changes

### 5.1 New API Route: `/api/dojo`

**Location:** `app/api/dojo/route.ts`

**Responsibilities:**
1. Validate incoming request (situation required, perspectives optional)
2. Build DojoPacket using `buildDojoPacketFromContext()` from `lib/agents/dojo-handler.ts`
3. Invoke `handleDojoQuery()` and stream the response
4. Emit HarnessEvents for agent activity tracking
5. Handle errors gracefully with ERROR events

**Key Implementation Details:**
- Use `ReadableStream` for SSE streaming (same pattern as `app/api/supervisor/route/route.ts`)
- Parse DojoAgentResponse and emit response content in chunks
- Extract mode from `updated_packet.session.mode` and emit MODE_TRANSITION event
- Use `TextEncoder` for streaming JSON events separated by newlines

**Error Handling:**
- 400 Bad Request: Missing or invalid `situation`
- 500 Internal Server Error: Dojo agent handler failure
- Emit ERROR HarnessEvent with error details before closing stream

---

## 6. Component Specifications

### 6.1 DojoInput Component

**Location:** `components/dojo/DojoInput.tsx`

**Props:**
```typescript
interface DojoInputProps {
  onSubmit: (data: { situation: string; perspectives: string[] }) => void;
  isLoading: boolean;
  disabled?: boolean;
}
```

**State (useState):**
- `situation: string` - Main textarea content
- `perspectives: string[]` - Array of perspective inputs (default: `['']`)

**UI Structure:**
```tsx
<div className="space-y-4">
  {/* Situation Input */}
  <div>
    <label>Situation</label>
    <textarea 
      rows={4}
      value={situation}
      onChange={...}
      className="w-full bg-bg-secondary border border-bg-tertiary rounded-lg p-3"
    />
  </div>

  {/* Perspectives */}
  <div>
    <label>Perspectives (Optional)</label>
    {perspectives.map((p, i) => (
      <div key={i} className="flex gap-2 mb-2">
        <input 
          value={p}
          onChange={...}
          className="flex-1 bg-bg-secondary border border-bg-tertiary rounded-lg p-3"
        />
        {perspectives.length > 1 && (
          <Button variant="ghost" onClick={() => removePerspective(i)}>
            <X />
          </Button>
        )}
      </div>
    ))}
    <Button variant="secondary" onClick={addPerspective}>
      <Plus /> Add Perspective
    </Button>
  </div>

  {/* Submit */}
  <Button 
    variant="primary" 
    onClick={handleSubmit}
    disabled={!situation.trim() || isLoading}
    isLoading={isLoading}
  >
    Submit
  </Button>
</div>
```

**Validation:**
- `situation` cannot be empty
- `perspectives` can be empty (filter out empty strings before submit)

---

### 6.2 ChatMessage Component

**Location:** `components/dojo/ChatMessage.tsx`

**Props:**
```typescript
interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  mode?: DojoMode;
  timestamp?: string;
}
```

**Layout:**
- **User messages**: Right-aligned, `bg-text-accent`, white text
- **Agent messages**: Left-aligned, `bg-bg-secondary`, with mode badge at top

**Mode Badge:**
```tsx
{role === 'assistant' && mode && (
  <ModeBadge mode={mode} />
)}
```

**Content Rendering:**
- Phase 1: Display as plain text with `whitespace-pre-wrap`
- Future: Add markdown rendering library (react-markdown) if needed

---

### 6.3 ModeBadge Component

**Location:** `components/dojo/ModeBadge.tsx`

**Props:**
```typescript
interface ModeBadgeProps {
  mode: DojoMode;
}
```

**Design:**
```tsx
const BADGE_CONFIG = {
  Mirror: { emoji: '🪞', color: 'text-blue-400', bg: 'bg-blue-900/20' },
  Scout: { emoji: '🔭', color: 'text-purple-400', bg: 'bg-purple-900/20' },
  Gardener: { emoji: '🌱', color: 'text-green-400', bg: 'bg-green-900/20' },
  Implementation: { emoji: '🛠️', color: 'text-amber-400', bg: 'bg-amber-900/20' },
};

<div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${config.bg} ${config.color}`}>
  <span>{config.emoji}</span>
  <span className="font-medium">{mode.toUpperCase()}</span>
</div>
```

---

### 6.4 SessionHistory Component

**Location:** `components/dojo/SessionHistory.tsx`

**Props:**
```typescript
interface SessionHistoryProps {
  messages: DojoMessage[];
}
```

**Implementation:**
```tsx
const messagesEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

return (
  <div className="flex-1 overflow-y-auto p-6 space-y-4">
    {messages.length === 0 ? (
      <EmptyState />
    ) : (
      messages.map((msg) => (
        <ChatMessage key={msg.id} {...msg} />
      ))
    )}
    <div ref={messagesEndRef} />
  </div>
);
```

**Empty State:**
```tsx
<div className="flex flex-col items-center justify-center h-full text-center">
  <div className="text-6xl mb-4">🧠</div>
  <h3 className="text-xl font-semibold text-text-primary mb-2">
    Dojo Thinking Room
  </h3>
  <p className="text-text-secondary max-w-md">
    Describe your situation and perspectives to begin your thinking session
  </p>
</div>
```

---

### 6.5 DojoSessionPage

**Location:** `app/dojo/[sessionId]/page.tsx`

**Structure:**
```tsx
'use client';

export default function DojoSessionPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  const { messages, isLoading, sendMessage } = useDojo(sessionId);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b border-bg-tertiary p-4">
        <input 
          type="text"
          placeholder="Untitled Dojo Session"
          className="bg-transparent text-lg font-medium"
        />
        <Button variant="secondary" onClick={() => alert('Not implemented')}>
          Save Session
        </Button>
      </header>

      {/* Chat History */}
      <SessionHistory messages={messages} />

      {/* Input Area */}
      {messages.length === 0 ? (
        <DojoInput onSubmit={sendMessage} isLoading={isLoading} />
      ) : (
        <SimpleTextInput onSubmit={sendMessage} isLoading={isLoading} />
      )}
    </div>
  );
}
```

---

## 7. Delivery Phases

### Phase 1: Core Page & Components (Day 1)
1. Create dynamic route `app/dojo/[sessionId]/page.tsx`
2. Create Zustand store `lib/stores/dojo.store.ts`
3. Build UI components:
   - `DojoInput.tsx`
   - `ChatMessage.tsx`
   - `ModeBadge.tsx`
   - `SessionHistory.tsx`
4. Update Dashboard button to navigate to `/dojo/new`

**Deliverable:** Functional page with input form and message display (no API yet)

---

### Phase 2: API Integration (Day 2)
1. Create `app/api/dojo/route.ts` with SSE streaming
2. Implement `hooks/useDojo.ts` for SSE consumption
3. Integrate `handleDojoQuery()` from `lib/agents/dojo-handler.ts`
4. Wire up page to API via `useDojo` hook
5. Test end-to-end: input → API → streaming response → UI update

**Deliverable:** Full working Dojo session with streaming responses

---

### Phase 3: Polish & Agent Status (Day 3)
1. Add Builder agent to `AgentStatus.tsx` (update `AGENT_ORDER`)
2. Implement SimpleTextInput for follow-up messages
3. Add loading states and error handling
4. Test responsive design (mobile, tablet, desktop)
5. Accessibility: keyboard navigation, ARIA labels
6. Run lint and type-check

**Deliverable:** Production-ready Dojo Session Page

---

## 8. Verification Approach

### 8.1 Manual Testing Checklist
- [ ] Navigate from Dashboard to `/dojo/new`
- [ ] Submit initial input with situation + perspectives
- [ ] Verify agent response streams into chat
- [ ] Check mode badge displays correctly
- [ ] Confirm chat auto-scrolls with new messages
- [ ] Test follow-up message submission
- [ ] Verify session ID remains consistent
- [ ] Check error handling (network failure, invalid input)
- [ ] Test responsive layout on mobile/tablet/desktop
- [ ] Verify keyboard navigation works

### 8.2 TypeScript Validation
```bash
pnpm type-check
```
No errors should be present.

### 8.3 Linting
```bash
pnpm lint
```
No warnings or errors.

### 8.4 Browser Testing
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

---

## 9. Risk Assessment & Mitigation

### 9.1 Risk: Streaming SSE Fails in Production
**Likelihood:** Low  
**Impact:** High  
**Mitigation:**
- Test SSE streaming thoroughly in dev mode
- Add fallback to polling if SSE connection drops
- Implement retry logic with exponential backoff
- Log all connection errors to console for debugging

### 9.2 Risk: Large Response Causes Memory Issues
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- Limit message history to last 50 messages (slice array in store)
- Implement virtual scrolling if performance issues arise
- Use `React.memo` for ChatMessage components to prevent re-renders

### 9.3 Risk: No Markdown Rendering Library
**Likelihood:** Certain  
**Impact:** Low  
**Mitigation:**
- Phase 1: Display as plain text
- Phase 2 (future): Add `react-markdown` if user feedback requires it
- Use `whitespace-pre-wrap` to preserve formatting

---

## 10. Open Questions & Decisions

### 10.1 Resolved Decisions

**Q: Should we create a new API route or modify the existing Supervisor API?**  
**A:** Create a new `/api/dojo` route. The Supervisor API is focused on routing decisions, not agent invocation. A dedicated Dojo endpoint keeps concerns separated.

**Q: How do we handle session persistence?**  
**A:** Not in scope for this version. Session state lives in Zustand store only (client-side). Persistence will be added in Prompt Bridge track.

**Q: Do we need markdown rendering?**  
**A:** Not critical for MVP. Start with plain text rendering. Add `react-markdown` in a future iteration if needed.

**Q: Should we support editing previous messages?**  
**A:** No, current version is append-only. This can be added later.

### 10.2 Future Considerations

- **Session Persistence:** Database schema for saving/loading sessions
- **Multi-Agent Handoffs:** Transition from Dojo to Librarian/Builder
- **Rich Media:** Image uploads, file attachments
- **Collaborative Sessions:** Real-time multi-user support
- **Export to DojoPacket:** JSON export for sharing sessions

---

## 11. Success Criteria

- [ ] All TypeScript compiles without errors
- [ ] ESLint shows no warnings
- [ ] Page loads in < 1 second
- [ ] SSE connection establishes within 500ms
- [ ] User can submit input and receive streamed response
- [ ] Mode badge displays correctly for each agent message
- [ ] Chat auto-scrolls smoothly with new messages
- [ ] Dashboard button navigates to `/dojo/new`
- [ ] Builder agent visible in Agent Status panel
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Keyboard navigation functional
- [ ] Error states display user-friendly messages

---

## 12. Dependencies & Prerequisites

### 12.1 Required Before Implementation
- Ensure `lib/agents/dojo-handler.ts` is fully functional
- Verify `buildDojoPacketFromContext()` works correctly
- Confirm `handleDojoQuery()` returns expected DojoAgentResponse

### 12.2 No Blocking Dependencies
All required infrastructure exists:
- Zustand store pattern established
- SSE streaming pattern proven in `useSupervisor`
- UI components (Button, Card) ready to use
- Design tokens defined in Tailwind config
- HarnessEvent types defined in `lib/harness/types.ts`

---

## Appendix A: File-by-File Implementation Guide

### A.1 lib/stores/dojo.store.ts
```typescript
import { create } from 'zustand';

export interface DojoMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: DojoMode;
  timestamp: string;
}

export type DojoMode = 'Mirror' | 'Scout' | 'Gardener' | 'Implementation';

interface DojoSessionState {
  sessionId: string | null;
  messages: DojoMessage[];
  isLoading: boolean;
  currentMode: DojoMode | null;
  error: string | null;

  setSessionId: (id: string) => void;
  addMessage: (message: DojoMessage) => void;
  appendToLastMessage: (chunk: string) => void;
  setLoading: (loading: boolean) => void;
  setMode: (mode: DojoMode | null) => void;
  setError: (error: string | null) => void;
  clearSession: () => void;
}

export const useDojoStore = create<DojoSessionState>((set) => ({
  sessionId: null,
  messages: [],
  isLoading: false,
  currentMode: null,
  error: null,

  setSessionId: (id) => set({ sessionId: id }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  appendToLastMessage: (chunk) =>
    set((state) => {
      const messages = [...state.messages];
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content += chunk;
      }
      return { messages };
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setMode: (mode) => set({ currentMode: mode }),

  setError: (error) => set({ error }),

  clearSession: () =>
    set({
      sessionId: null,
      messages: [],
      isLoading: false,
      currentMode: null,
      error: null,
    }),
}));
```

### A.2 hooks/useDojo.ts
```typescript
import { useState, useCallback, useEffect } from 'react';
import { useDojoStore } from '@/lib/stores/dojo.store';
import { HarnessEvent } from '@/lib/harness/types';

interface UseSupervisorReturn {
  sendMessage: (data: { situation: string; perspectives: string[] }) => Promise<void>;
  messages: DojoMessage[];
  isLoading: boolean;
  error: string | null;
}

export function useDojo(sessionId: string): UseSupervisorReturn {
  const {
    messages,
    isLoading,
    error,
    setSessionId,
    addMessage,
    appendToLastMessage,
    setLoading,
    setMode,
    setError,
  } = useDojoStore();

  useEffect(() => {
    setSessionId(sessionId);
  }, [sessionId, setSessionId]);

  const sendMessage = useCallback(
    async (data: { situation: string; perspectives: string[] }) => {
      if (isLoading) return;

      setLoading(true);
      setError(null);

      // Add user message to history
      const userMessage: DojoMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: `Situation: ${data.situation}\n\nPerspectives:\n${data.perspectives
          .filter((p) => p.trim())
          .map((p, i) => `${i + 1}. ${p}`)
          .join('\n')}`,
        timestamp: new Date().toISOString(),
      };
      addMessage(userMessage);

      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

      try {
        const response = await fetch('/api/dojo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({
            situation: data.situation,
            perspectives: data.perspectives.filter((p) => p.trim()),
            conversation_history: messages,
            session_id: sessionId,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // Create placeholder assistant message
        const assistantMessage: DojoMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        };
        addMessage(assistantMessage);

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const event = JSON.parse(line) as HarnessEvent;

              // Handle different event types
              if (event.event_type === 'MODE_TRANSITION') {
                setMode(event.metadata?.mode || null);
              } else if (event.event_type === 'AGENT_RESPONSE_CHUNK') {
                appendToLastMessage(event.outputs?.content || '');
              }
            } catch (parseError) {
              console.error('Failed to parse event:', parseError);
            }
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
      } finally {
        if (reader) {
          await reader.cancel();
        }
        setLoading(false);
      }
    },
    [
      isLoading,
      sessionId,
      messages,
      addMessage,
      appendToLastMessage,
      setLoading,
      setMode,
      setError,
    ]
  );

  return {
    sendMessage,
    messages,
    isLoading,
    error,
  };
}
```

---

**End of Technical Specification**
