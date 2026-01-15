# Dojo Agent - Product Requirements Document (PRD)

**Feature:** Dojo Agent Implementation  
**Track:** Track 2, Feature 1 (v1.0 Roadmap)  
**Author:** Zencoder AI  
**Status:** Draft  
**Date:** January 15, 2026  
**Priority:** CRITICAL - Heart of the user experience

---

## 1. Executive Summary

The Dojo Agent is the primary thinking partner in the Dojo Genesis system, embodying the brand promise of "Think *with* AI, not *for* you." This agent operates in four distinct modes (Mirror, Scout, Gardener, Implementation) to provide nuanced, context-aware guidance that adapts to where the user is in their thinking journey.

**Success Criteria:** A flawless, 11/10 implementation that demonstrates sophisticated agentic reasoning, seamless mode transitions, and deep integration with the DojoPacket protocol.

---

## 2. Background & Context

### 2.1 Current State

The Dojo Genesis system currently has:
- ✅ A working Supervisor Router that routes queries to agents
- ✅ A Librarian Agent for semantic search and retrieval
- ✅ A Debugger Agent entry in the registry (not yet implemented)
- ✅ DojoPacket schema for session state management
- ✅ Harness Trace infrastructure for observability
- ✅ Multi-model LLM infrastructure with cost tracking

However, the **Dojo Agent itself is not implemented**. The registry has an entry for it, but there is no handler logic.

### 2.2 Why This Matters

The Dojo Agent is the **default agent** and the one users will interact with most frequently. It must:
- Handle general conversation and thinking partnership
- Adapt to different thinking modes based on context
- Process and update the DojoPacket throughout a session
- Generate actionable "Next Moves" for users
- Maintain the brand's focus on empowering, not replacing, human thinking

### 2.3 Dependencies

**Established Systems:**
- `lib/agents/types.ts` - Core agent interfaces
- `lib/agents/supervisor.ts` - Agent routing and registration
- `lib/agents/librarian-handler.ts` - Reference implementation pattern
- `lib/packet/schema.ts` - DojoPacket data structure
- `lib/harness/trace.ts` - Observability system
- `lib/llm/client.ts` - LLM API abstraction
- `lib/agents/registry.json` - Agent configuration

---

## 3. User Stories

### 3.1 As a User Exploring Ideas (Mirror Mode)

**User Story:**  
As a user with many scattered perspectives, I want the Dojo Agent to help me see the patterns and tensions in my thinking, so I can gain clarity on what matters most.

**Acceptance Criteria:**
- Agent summarizes the overarching pattern across 3+ perspectives
- Agent identifies 1-3 key assumptions or tensions
- Agent offers 1-2 reframes to shift perspective
- Output is concise (2-4 paragraphs max)
- User feels "heard" and "understood"

**Example Interaction:**
```
User: "I'm torn between building a SaaS product or a consultancy. I want freedom, but I also want scale. I'm worried about burnout either way."

Dojo (Mirror): "I notice a tension between your desire for freedom and scale - these often pull in opposite directions. Your concern about burnout suggests both paths feel demanding, but in different ways.

Key assumption: That you must choose one *or* the other, rather than a hybrid model.

Reframe: What if the real choice isn't SaaS vs. consultancy, but rather: which lets you test your assumptions about freedom, scale, and energy management faster?"
```

### 3.2 As a User Mapping Options (Scout Mode)

**User Story:**  
As a user facing multiple possible paths, I want the Dojo Agent to show me 2-4 clear routes with honest tradeoffs and suggest a small first step, so I can move forward without committing prematurely.

**Acceptance Criteria:**
- Agent presents 2-4 distinct routes (not 10+ options)
- Each route includes clear tradeoffs (not just pros)
- Agent recommends ONE "smallest test" to learn quickly
- Routes are actionable, not abstract
- User feels empowered to choose, not paralyzed by options

**Example Interaction:**
```
User: "I want to learn AI, but I don't know if I should take a course, build projects, or read papers."

Dojo (Scout): "Three routes to consider:

1. **Course-first:** Deep structure, slow start (tradeoff: takes 3-6 months before you build)
2. **Project-first:** Fast learning, messy gaps (tradeoff: you'll learn *around* the gaps, not through them)
3. **Paper-first:** Strong foundations, steep curve (tradeoff: high cognitive load, delayed application)

Smallest test: Spend 2 hours building a tiny AI project (e.g., sentiment analyzer). If you hit a wall and enjoy debugging it, go project-first. If you crave structure, take the course."
```

### 3.3 As a User with Too Many Ideas (Gardener Mode)

**User Story:**  
As a user with 5+ competing perspectives, I want the Dojo Agent to help me prune what's not working and highlight what's strong, so I can focus my energy on what matters.

**Acceptance Criteria:**
- Agent highlights 2-3 strongest ideas with reasons
- Agent identifies 1-2 ideas that need growth or should be composted
- Output is direct and clear (not vague or over-diplomatic)
- User feels clarity, not guilt about pruning
- Pruning is based on coherence with stated goals/stakes

**Example Interaction:**
```
User: "I've got 7 different product ideas: A) AI writing tool, B) No-code builder, C) Consultant marketplace, D) Learning platform, E) Productivity app, F) Community forum, G) API service."

Dojo (Gardener): "Strongest ideas:
- **A) AI writing tool** - Aligns with your AI expertise and market timing
- **E) Productivity app** - Clear user pain, low complexity
- **G) API service** - Leverages your backend skills, recurring revenue

Ideas to compost:
- **C) Consultant marketplace** - Crowded space, network effects hard to bootstrap
- **F) Community forum** - High moderation overhead, unclear monetization

Keep A, E, or G. Compost C and F. Let B, D simmer—revisit in 3 months."
```

### 3.4 As a User Ready to Build (Implementation Mode)

**User Story:**  
As a user who has decided on a direction, I want the Dojo Agent to give me a concrete 1-5 step plan, so I can start immediately without analysis paralysis.

**Acceptance Criteria:**
- Agent provides 1-5 concrete, sequenced steps (not 20+)
- Steps are actionable (not abstract like "research options")
- Plan reflects decisions already made in the DojoPacket
- User can start step 1 within 5 minutes
- Plan is scoped to a "smallest test" where possible

**Example Interaction:**
```
User: "Okay, I'm building the AI writing tool. Let's do it."

Dojo (Implementation): "Here's your 3-step plan:

1. **Build the MVP interface** (2 hours)  
   - Single text input, single output display  
   - No auth, no DB, just API call to OpenAI

2. **Test with 3 real users** (1 day)  
   - Share the link, watch them use it  
   - Note: where do they get stuck?

3. **Ship feedback loop** (1 day)  
   - Add a thumbs-up/down button  
   - Log to console (don't build a DB yet)

Start with step 1. Build it ugly. Ship it fast."
```

---

## 4. Functional Requirements

### 4.1 Core Handler (`dojo-handler.ts`)

**Must Have:**

1. **Interface Definitions**
   - `DojoAgentQuery` - Input structure (packet, conversation_history)
   - `DojoAgentResponse` - Output structure (next_move, updated_packet, summary)

2. **Main Entry Point**
   - `handleDojoQuery(query: DojoAgentQuery): Promise<DojoAgentResponse>`
   - Routes to appropriate mode handler
   - Falls back to Mirror mode if mode selection is unclear

3. **Mode Selection Logic**
   - `selectDojoMode(packet, conversation_history): DojoMode`
   - Analyzes user's latest message for cues
   - Considers DojoPacket state (number of perspectives, decisions, etc.)
   - Returns one of: 'Mirror', 'Scout', 'Gardener', 'Implementation'

4. **Mode Handlers**
   - `handleMirrorMode(packet): Promise<DojoAgentResponse>`
   - `handleScoutMode(packet): Promise<DojoAgentResponse>`
   - `handleGardenerMode(packet): Promise<DojoAgentResponse>`
   - `handleImplementationMode(packet): Promise<DojoAgentResponse>`

5. **Supervisor Integration**
   - `invokeDojoAgent(context: AgentInvocationContext): Promise<DojoAgentResponse>`
   - Constructs DojoPacket from conversation context
   - Entry point when Supervisor hands off to Dojo

### 4.2 Mode Selection Rules

**Implementation Mode Triggers:**
- User says: "let's do it", "I'm ready", "what's the plan?", "let's build", "how do I start?"
- DojoPacket has 1+ decisions made
- User explicitly asks for steps or a plan

**Scout Mode Triggers:**
- User says: "what are my options?", "what should I do?", "I don't know which way to go"
- DojoPacket has multiple perspectives but no decisions
- User explicitly asks for routes or tradeoffs

**Gardener Mode Triggers:**
- DojoPacket has 5+ perspectives
- User says: "I have too many ideas", "help me focus", "what should I drop?"
- Perspectives feel scattered or conflicting

**Mirror Mode Triggers (Default):**
- New situation (user provides context but no clear ask)
- User is thinking aloud
- User asks for feedback or reflection
- No strong signal for other modes

### 4.3 LLM Integration

**All mode handlers MUST:**
- Use `llmClient.createJSONCompletion()` for structured output
- Use the model configured for the 'dojo' agent (via `getModelForAgent('dojo')`)
- Include temperature, timeout, and retries in options
- Parse and validate LLM output with Zod schemas
- Handle LLM errors gracefully (fallback to conservative responses)

**Cost Tracking:**
- All LLM calls automatically tracked via `llmClient`
- No manual cost calculation required (handled by LLM client)

### 4.4 Harness Trace Integration

**All agent operations MUST:**
- Log `AGENT_ACTIVITY_START` event at the beginning
- Log `AGENT_ACTIVITY_PROGRESS` events at key milestones (e.g., "Selecting mode...", "Generating response...")
- Log `AGENT_ACTIVITY_COMPLETE` event at the end (with result count/summary)
- Use `isTraceActive()` to check if tracing is enabled
- Include metadata (mode, packet state, etc.)

**Example:**
```typescript
if (isTraceActive()) {
  logEvent('AGENT_ACTIVITY_START', 
    {
      agent_id: 'dojo',
      message: 'Processing query in Mirror mode...',
      progress: 0,
    },
    {
      parent_type: 'agent_operation',
      metadata: { mode: 'Mirror', perspectives_count: packet.perspectives.length },
    }
  );
}
```

### 4.5 DojoPacket Updates

**Each mode handler MUST:**
- Return an `updated_packet` in the response
- Add new perspectives if the agent generates insights
- Update `next_move` with concrete action, why, and smallest_test
- Add assumptions if the agent identifies them (Mirror mode)
- Add decisions if the user makes them (Implementation mode)
- Preserve existing packet data (don't overwrite unnecessarily)

### 4.6 Error Handling

**The handler MUST:**
- Catch LLM errors and provide graceful fallback responses
- Validate all user inputs (check for empty queries, malformed packets)
- Log errors to Harness Trace with full context
- Return user-friendly error messages (not raw error dumps)
- Never crash the agent or the Supervisor

---

## 5. Non-Functional Requirements

### 5.1 Performance

- **Response Time:** Mode selection should complete in <500ms
- **LLM Call:** Each mode handler should complete in <10 seconds (typical)
- **Timeout:** All LLM calls must have a timeout (30s default)
- **Retries:** LLM calls should retry on transient errors (max 2 retries)

### 5.2 Quality Standards

- **Code Style:** Follow existing patterns in `librarian-handler.ts`
- **Type Safety:** 100% TypeScript with no `any` types
- **Documentation:** Every function must have TSDoc comments
- **Naming:** Use clear, descriptive names (no cryptic abbreviations)
- **Tests:** All critical paths must have unit tests (next phase)

### 5.3 Observability

- **Logging:** Every agent operation logged to Harness Trace
- **Cost Tracking:** Every LLM call tracked with token usage and cost
- **Mode Visibility:** Users should see which mode the agent is in
- **Debugging:** All inputs/outputs logged for later analysis

### 5.4 Maintainability

- **Modularity:** Each mode handler should be independent (can be modified without breaking others)
- **Extensibility:** Easy to add new modes in the future
- **Configuration:** Mode selection rules should be easy to tune
- **Testing:** Handlers should be testable in isolation

---

## 6. Technical Constraints

### 6.1 Architecture Constraints

- **MUST** follow the existing agent handler pattern (see `librarian-handler.ts`)
- **MUST** integrate with Supervisor via `AgentInvocationContext`
- **MUST** use the `DojoPacket` schema (no modifications to schema in this feature)
- **MUST** use Harness Trace for all observability
- **MUST** use `llmClient` for all LLM calls (no direct OpenAI SDK usage)

### 6.2 Technology Stack

- **Language:** TypeScript
- **LLM Client:** `lib/llm/client.ts` (supports DeepSeek and OpenAI)
- **Schema Validation:** Zod
- **Database:** PGlite (for future persistence, not required in v1)
- **Tracing:** Harness Trace (`lib/harness/trace.ts`)

### 6.3 Environment

- **Node.js:** v18+
- **Next.js:** v14+
- **API Keys:** Requires DEEPSEEK_API_KEY or OPENAI_API_KEY
- **Dev Mode:** Must work in dev mode (with keyword fallback if no API key)

---

## 7. Out of Scope (v1.0)

**The following are explicitly NOT part of this implementation:**

- ❌ UI components for displaying Dojo Agent responses (future)
- ❌ Persistence of DojoPackets to database (future)
- ❌ Real-time collaboration on DojoPackets (future)
- ❌ Advanced mode blending (e.g., Mirror + Scout simultaneously)
- ❌ Custom mode configurations per user
- ❌ Integration with external knowledge bases (e.g., Google Drive)
- ❌ Voice input/output for Dojo Agent
- ❌ Dojo Agent proactive suggestions (future)
- ❌ Packet export/import (exists separately, not agent responsibility)

---

## 8. Open Questions & Decisions Needed

### 8.1 Resolved Assumptions

**Q:** Should mode selection be fully automatic or user-controlled?  
**A:** Fully automatic in v1.0. Mode selection is based on heuristics (user cues + packet state). Users don't manually select modes.

**Q:** Should the Dojo Agent search for information?  
**A:** No. If the user needs search, the Dojo Agent should recommend a handoff to the Librarian Agent.

**Q:** Should the agent modify the DojoPacket in place or return a copy?  
**A:** Return an `updated_packet` copy. The caller (Supervisor or session manager) will decide when to persist it.

### 8.2 Open Questions (for Clarification)

**Q:** Should the agent recommend handoffs to other agents (e.g., "This looks like a search query, handing off to Librarian")?  
**Decision:** Not in v1.0. The Supervisor is responsible for routing. The Dojo Agent should stay in its lane.

**Q:** How should the agent handle empty DojoPackets (new sessions)?  
**Decision:** If the packet has no situation or perspectives, the agent should prompt the user to share context first (Mirror mode response).

**Q:** Should mode selection be logged to Harness Trace?  
**Decision:** Yes. Mode selection should be a `AGENT_ACTIVITY_PROGRESS` event with metadata showing the selected mode and reasoning.

---

## 9. Success Metrics

### 9.1 Functional Success

- ✅ All 4 modes implemented and working
- ✅ Mode selection correctly routes to the right handler
- ✅ DojoPacket is correctly updated after each interaction
- ✅ NextMove is generated for every response
- ✅ All Harness Trace events logged correctly
- ✅ Agent integrates seamlessly with Supervisor

### 9.2 Quality Success

- ✅ Code passes `npm run build` without errors
- ✅ Code passes `npm run lint` without warnings
- ✅ Code passes `npm run type-check` without errors
- ✅ All functions have TSDoc comments
- ✅ Follows existing code patterns (matches `librarian-handler.ts` style)

### 9.3 User Experience Success

- ✅ Responses feel like thinking partnership, not dictation
- ✅ Mode transitions feel natural (user doesn't notice the switch)
- ✅ Suggestions are actionable (not vague or abstract)
- ✅ User feels empowered, not dependent on the agent

---

## 10. Implementation Phases

This PRD defines the **core implementation** of the Dojo Agent. The implementation will proceed in phases:

### Phase 1: Foundation (This Task)
- Core handler structure (`dojo-handler.ts`)
- Mode selection logic
- All 4 mode handlers (Mirror, Scout, Gardener, Implementation)
- Supervisor integration (`invokeDojoAgent`)
- Harness Trace integration
- Registry update

### Phase 2: Refinement (Future Task)
- Unit tests for each mode handler
- Integration tests with Supervisor
- LLM prompt tuning based on real usage
- Performance optimization

### Phase 3: Enhancement (Future Task)
- UI components for Dojo Agent responses
- Persistent DojoPacket sessions
- Advanced mode selection heuristics
- User feedback integration

---

## 11. References

**Architecture Documents:**
- `lib/agents/types.ts` - Agent interfaces
- `lib/agents/supervisor.ts` - Routing patterns
- `lib/agents/librarian-handler.ts` - Reference implementation
- `lib/packet/schema.ts` - DojoPacket schema

**Brand Guidelines:**
- `00_Roadmap/DOJO_GENESIS_AGENT_IDENTITIES.md` - Agent visual identity
- Agent Icon: 🧘 (Dojo meditation pose) or 🧠 (Brain)
- Agent Color: Sunset Orange (#f39c5a)

**Testing:**
- Build: `npm run build`
- Lint: `npm run lint`
- Type Check: `npm run type-check`

---

## 12. Acceptance Criteria Summary

**The Dojo Agent implementation is complete when:**

1. ✅ `lib/agents/dojo-handler.ts` exists with all required interfaces and functions
2. ✅ `handleDojoQuery` correctly routes to the 4 mode handlers
3. ✅ Each mode handler (Mirror, Scout, Gardener, Implementation) is implemented with targeted LLM prompts
4. ✅ Mode selection logic (`selectDojoMode`) uses heuristics to choose the right mode
5. ✅ `invokeDojoAgent` serves as the entry point from the Supervisor
6. ✅ All agent operations are instrumented with Harness Trace spans
7. ✅ DojoPacket is correctly updated and returned in every response
8. ✅ NextMove is generated for every response
9. ✅ `lib/agents/registry.json` is updated (if needed)
10. ✅ Code passes `npm run build`, `npm run lint`, and `npm run type-check`
11. ✅ Code follows existing patterns (matches `librarian-handler.ts` style)
12. ✅ All functions have TSDoc comments

**Quality Bar: 11/10 - This is the heart of the product.**

---

**END OF PRD**
