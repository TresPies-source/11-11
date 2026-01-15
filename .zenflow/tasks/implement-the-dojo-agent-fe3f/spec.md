# Dojo Agent - Technical Specification

**Feature:** Dojo Agent Implementation  
**Track:** Track 2, Feature 1 (v1.0 Roadmap)  
**Author:** Zencoder AI  
**Status:** Draft  
**Date:** January 15, 2026

---

## 1. Technical Context

### 1.1 Technology Stack

- **Language:** TypeScript 5.7.2
- **Runtime:** Node.js 18+
- **Framework:** Next.js 14.2.24
- **Schema Validation:** Zod 3.23.8
- **LLM Integration:** OpenAI SDK 4.77.0
- **Database:** @electric-sql/pglite 0.3.14
- **Testing:** tsx 4.21.0

### 1.2 Key Dependencies

**Internal Systems:**
- `lib/llm/client.ts` - Unified LLM client with multi-provider support
- `lib/llm/registry.ts` - Model configuration and routing
- `lib/harness/trace.ts` - Span-based observability system
- `lib/packet/schema.ts` - DojoPacket data structure (v1.0)
- `lib/agents/types.ts` - Core agent interfaces
- `lib/agents/supervisor.ts` - Agent routing and invocation

**External APIs:**
- DeepSeek API (primary): `deepseek-chat` model
- OpenAI API (fallback): `gpt-4o-mini` model

### 1.3 Design Principles

1. **Follow Established Patterns:** Mirror the architecture in `librarian-handler.ts`
2. **Type Safety First:** No `any` types, strict TypeScript throughout
3. **Observability by Default:** All operations traced via Harness
4. **Graceful Degradation:** Handle LLM errors without crashing
5. **Stateless Operations:** Return updated packet copies, don't mutate

---

## 2. Implementation Approach

### 2.1 Core Architecture

The Dojo Agent follows a **mode-based routing pattern** with four distinct handlers:

```
User Input
    ↓
invokeDojoAgent() ← Entry point from Supervisor
    ↓
handleDojoQuery() ← Main orchestrator
    ↓
selectDojoMode() ← Mode selection logic
    ↓
    ├─→ handleMirrorMode()
    ├─→ handleScoutMode()
    ├─→ handleGardenerMode()
    └─→ handleImplementationMode()
    ↓
DojoAgentResponse (next_move, updated_packet, summary)
```

### 2.2 File Structure

**New File:**
- `lib/agents/dojo-handler.ts` - Complete Dojo Agent implementation

**Modified Files:**
- None (registry.json already has Dojo entry)

**No Database Schema Changes:**
- Uses existing `DojoPacket` schema
- No new tables required

---

## 3. Source Code Structure

### 3.1 Type Definitions

```typescript
// lib/agents/dojo-handler.ts

import { DojoPacket, NextMove } from '../packet/schema';
import { AgentInvocationContext } from './types';

/**
 * Input for Dojo Agent query
 */
export interface DojoAgentQuery {
  packet: DojoPacket;
  conversation_history: AgentInvocationContext['conversation_history'];
}

/**
 * Output from Dojo Agent
 */
export interface DojoAgentResponse {
  next_move: NextMove;
  updated_packet: DojoPacket;
  summary: string;
}

/**
 * Dojo Agent operating mode
 */
export type DojoMode = 'Mirror' | 'Scout' | 'Gardener' | 'Implementation';

/**
 * Error class for Dojo Agent failures
 */
export class DojoAgentError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DojoAgentError';
  }
}
```

### 3.2 Mode Selection Logic

**Function:** `selectDojoMode(packet: DojoPacket, conversation_history: ChatMessage[]): DojoMode`

**Implementation Strategy:**

1. **Extract Latest User Message**
   - Get the most recent user message from conversation_history
   - Normalize text (lowercase, trim)

2. **Check for Convergence Signals (Implementation Mode)**
   - Keywords: "let's do it", "I'm ready", "what's the plan", "let's build", "how do I start"
   - Has decisions in packet: `packet.decisions.length > 0`
   - Explicitly asks for steps or plan

3. **Check for Route Mapping Signals (Scout Mode)**
   - Keywords: "what are my options", "what should I do", "which way", "routes", "tradeoffs"
   - Has perspectives but no decisions: `packet.perspectives.length > 0 && packet.decisions.length === 0`

4. **Check for Pruning Signals (Gardener Mode)**
   - Keywords: "too many ideas", "help me focus", "what should I drop", "prune", "keep/grow/compost"
   - Has many perspectives: `packet.perspectives.length >= 5`

5. **Default to Mirror Mode**
   - New situation (no perspectives)
   - General thinking/reflection
   - No strong signal for other modes

**Heuristic Order:**
1. Implementation (highest priority if convergence detected)
2. Gardener (if overwhelmed)
3. Scout (if exploring options)
4. Mirror (default)

### 3.3 Mode Handler Implementations

Each mode handler follows this pattern:

```typescript
async function handleXMode(packet: DojoPacket): Promise<DojoAgentResponse> {
  const startTime = Date.now();
  
  try {
    // 1. Log activity start
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_START', ...);
    }
    
    // 2. Build mode-specific prompt
    const prompt = buildXModePrompt(packet);
    
    // 3. Call LLM with JSON mode
    const model = getModelForAgent('dojo');
    const { data, usage } = await llmClient.createJSONCompletion(
      model,
      [{ role: 'user', content: prompt }],
      {
        temperature: 0.7,
        timeout: 30000,
      }
    );
    
    // 4. Validate and parse response
    const validated = XModeResponseSchema.parse(data);
    
    // 5. Update packet
    const updated_packet = {
      ...packet,
      // mode-specific updates
    };
    
    // 6. Log completion
    if (isTraceActive()) {
      logEvent('AGENT_ACTIVITY_COMPLETE', ...);
    }
    
    // 7. Return response
    return {
      next_move: validated.next_move,
      updated_packet,
      summary: validated.summary,
    };
  } catch (error) {
    // Error handling with fallback
  }
}
```

#### 3.3.1 Mirror Mode

**Purpose:** Reflect patterns, identify tensions, offer reframes

**LLM Input:**
- `packet.situation`
- `packet.stake`
- `packet.perspectives` (all)

**LLM Output Schema:**
```typescript
const MirrorModeResponseSchema = z.object({
  summary: z.string(),
  pattern: z.string(),
  assumptions: z.array(z.string()),
  tensions: z.array(z.string()),
  reframes: z.array(z.string()),
});
```

**Prompt Template:**
```
You are the Dojo Agent in Mirror Mode. Your role is to reflect the user's thinking back to them with clarity.

Situation: {situation}
Stake: {stake}
Perspectives: {perspectives}

Provide:
1. A brief summary (2-3 sentences) of the pattern you see across these perspectives
2. 1-3 key assumptions underlying their thinking
3. 1-2 tensions or contradictions (if any)
4. 1-2 reframes to shift their perspective

Respond in JSON format.
```

**Packet Updates:**
- Add identified assumptions to `packet.assumptions`
- Generate `next_move` suggesting next reflection or exploration step

#### 3.3.2 Scout Mode

**Purpose:** Map routes with tradeoffs, recommend smallest test

**LLM Input:**
- `packet.situation`
- `packet.perspectives`

**LLM Output Schema:**
```typescript
const ScoutModeResponseSchema = z.object({
  summary: z.string(),
  routes: z.array(z.object({
    name: z.string(),
    description: z.string(),
    tradeoffs: z.string(),
  })),
  smallest_test: z.string(),
});
```

**Prompt Template:**
```
You are the Dojo Agent in Scout Mode. Your role is to map clear routes with honest tradeoffs.

Situation: {situation}
Perspectives: {perspectives}

Provide:
1. 2-4 distinct routes the user could take
2. For each route: name, brief description, and key tradeoffs (not just pros)
3. ONE "smallest test" - a concrete action to learn fast without full commitment

Keep routes actionable and tradeoffs honest.

Respond in JSON format.
```

**Packet Updates:**
- Add routes as new perspectives (source: 'agent')
- Set `next_move.action` to the smallest test
- Set `next_move.smallest_test` to the recommended action

#### 3.3.3 Gardener Mode

**Purpose:** Prune ideas, highlight strengths, identify what needs growth

**LLM Input:**
- `packet.perspectives` (all)
- `packet.situation` (for context)
- `packet.stake` (for coherence check)

**LLM Output Schema:**
```typescript
const GardenerModeResponseSchema = z.object({
  summary: z.string(),
  strong_ideas: z.array(z.object({
    idea: z.string(),
    reason: z.string(),
  })),
  ideas_to_grow: z.array(z.object({
    idea: z.string(),
    suggestion: z.string(),
  })),
  ideas_to_compost: z.array(z.string()),
});
```

**Prompt Template:**
```
You are the Dojo Agent in Gardener Mode. Your role is to help prune and focus.

Situation: {situation}
Stake: {stake}
Ideas/Perspectives: {perspectives}

Provide:
1. Highlight 2-3 strongest ideas with reasons
2. Identify 1-2 ideas that need growth (with suggestions)
3. Suggest 1-2 ideas to compost (let go)

Be direct and clear. Pruning is kind, not cruel.

Respond in JSON format.
```

**Packet Updates:**
- Generate `next_move` focusing on strongest ideas
- Add pruning insights as agent perspectives

#### 3.3.4 Implementation Mode

**Purpose:** Provide concrete 1-5 step plan

**LLM Input:**
- `packet.situation`
- `packet.decisions` (what's already decided)
- Latest user message (convergence cue)

**LLM Output Schema:**
```typescript
const ImplementationModeResponseSchema = z.object({
  summary: z.string(),
  plan: z.array(z.object({
    step: z.number(),
    action: z.string(),
    duration_estimate: z.string(),
    deliverable: z.string(),
  })),
  first_step: z.string(),
});
```

**Prompt Template:**
```
You are the Dojo Agent in Implementation Mode. Your role is to provide a concrete, actionable plan.

Situation: {situation}
Decisions Made: {decisions}

Provide:
1. A concise summary of what we're building
2. A 1-5 step plan (NOT 20+ steps)
3. Each step should be:
   - Concrete and actionable
   - Sequenced logically
   - Scoped to "smallest test" where possible
   - Have a clear deliverable

The user should be able to start step 1 within 5 minutes.

Respond in JSON format.
```

**Packet Updates:**
- Set `next_move.action` to first step
- Set `next_move.smallest_test` to the first deliverable
- Update session mode to 'Implementation'

### 3.4 Main Entry Points

#### 3.4.1 `handleDojoQuery()`

```typescript
export async function handleDojoQuery(
  query: DojoAgentQuery
): Promise<DojoAgentResponse> {
  const mode = selectDojoMode(query.packet, query.conversation_history);
  
  // Log mode selection
  if (isTraceActive()) {
    logEvent('AGENT_ACTIVITY_PROGRESS', {
      agent_id: 'dojo',
      message: `Operating in ${mode} mode`,
    }, {
      mode,
    }, {});
  }
  
  switch (mode) {
    case 'Mirror':
      return await handleMirrorMode(query.packet);
    case 'Scout':
      return await handleScoutMode(query.packet);
    case 'Gardener':
      return await handleGardenerMode(query.packet);
    case 'Implementation':
      return await handleImplementationMode(query.packet);
    default:
      return await handleMirrorMode(query.packet);
  }
}
```

#### 3.4.2 `invokeDojoAgent()`

```typescript
export async function invokeDojoAgent(
  context: AgentInvocationContext
): Promise<DojoAgentResponse> {
  // Build or retrieve DojoPacket from context
  const packet = await buildDojoPacketFromContext(context);
  
  const query: DojoAgentQuery = {
    packet,
    conversation_history: context.conversation_history,
  };
  
  return await handleDojoQuery(query);
}
```

#### 3.4.3 `buildDojoPacketFromContext()`

This helper function creates a DojoPacket from conversation context:

```typescript
async function buildDojoPacketFromContext(
  context: AgentInvocationContext
): Promise<DojoPacket> {
  // Try to load existing packet from session
  // If none exists, create a new one from user_intent
  
  // Placeholder implementation:
  return {
    version: '1.0',
    session: {
      id: context.session_id,
      title: 'New Session',
      mode: 'Mirror',
      duration: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      agent_path: ['dojo'],
    },
    situation: context.user_intent,
    stake: null,
    perspectives: [],
    assumptions: [],
    decisions: [],
    next_move: {
      action: '',
      why: '',
      smallest_test: null,
    },
    artifacts: [],
    trace_summary: {
      total_events: 0,
      agent_transitions: 0,
      cost_total: 0,
      tokens_total: 0,
    },
    metadata: {
      exported_at: new Date().toISOString(),
      exported_by: null,
      format: 'json',
    },
  };
}
```

---

## 4. Data Model / API / Interface Changes

### 4.1 Data Model

**No changes to DojoPacket schema required.**

The existing schema in `lib/packet/schema.ts` already supports all required fields:
- ✅ `session.mode` enum includes all four modes
- ✅ `perspectives`, `assumptions`, `decisions` arrays
- ✅ `next_move` with `action`, `why`, `smallest_test`

### 4.2 Agent Registry

**No changes required.**

The existing entry in `lib/agents/registry.json` is already complete:
- ✅ Marked as default agent
- ✅ Has comprehensive when_to_use/when_not_to_use
- ✅ Proper icon and tagline

### 4.3 Public API

**No new API routes required for v1.0.**

The Dojo Agent is invoked internally by the Supervisor. Future versions may add:
- `/api/dojo/query` - Direct Dojo Agent endpoint
- `/api/dojo/modes` - List available modes

### 4.4 Type Exports

`lib/agents/dojo-handler.ts` will export:

```typescript
export {
  DojoAgentQuery,
  DojoAgentResponse,
  DojoMode,
  DojoAgentError,
  handleDojoQuery,
  invokeDojoAgent,
  selectDojoMode,
};
```

---

## 5. Delivery Phases

### Phase 1: Core Infrastructure (Estimated: 2-3 hours)

**Goal:** Implement basic handler structure and mode selection

**Tasks:**
1. Create `lib/agents/dojo-handler.ts` with type definitions
2. Implement `selectDojoMode()` with heuristic logic
3. Implement `buildDojoPacketFromContext()` helper
4. Implement `handleDojoQuery()` orchestrator
5. Implement `invokeDojoAgent()` entry point

**Verification:**
- TypeScript compiles without errors (`npm run type-check`)
- All types properly exported
- Mode selection logic handles edge cases (empty messages, etc.)

### Phase 2: Mode Handlers (Estimated: 4-5 hours)

**Goal:** Implement all four mode handlers with LLM integration

**Tasks:**
1. Implement `handleMirrorMode()` with prompt and schema
2. Implement `handleScoutMode()` with prompt and schema
3. Implement `handleGardenerMode()` with prompt and schema
4. Implement `handleImplementationMode()` with prompt and schema
5. Add Harness Trace logging to all handlers
6. Implement error handling with fallback responses

**Verification:**
- Each mode handler can be called independently
- LLM responses are validated with Zod schemas
- Harness Trace events logged correctly
- Errors handled gracefully (no crashes)

### Phase 3: Integration & Testing (Estimated: 2-3 hours)

**Goal:** Integrate with Supervisor and verify end-to-end

**Tasks:**
1. Test Supervisor → Dojo Agent routing
2. Verify DojoPacket updates are correct
3. Verify NextMove generation is actionable
4. Test all four modes with real queries
5. Check cost tracking (via Harness Trace)
6. Run linter and type checker

**Verification:**
- `npm run build` completes successfully
- `npm run lint` passes without warnings
- `npm run type-check` passes
- Manual testing with Supervisor shows correct routing
- All Harness Trace events visible in logs

### Phase 4: Documentation & Polish (Estimated: 1 hour)

**Goal:** Add TSDoc comments and ensure code quality

**Tasks:**
1. Add TSDoc comments to all public functions
2. Add inline comments for complex logic
3. Ensure consistent naming conventions
4. Remove any console.log debugging statements
5. Final code review against requirements

**Verification:**
- All exported functions have TSDoc comments
- Code follows existing patterns in `librarian-handler.ts`
- No `any` types remain
- No unused imports or variables

---

## 6. Verification Approach

### 6.1 Type Safety

**Command:** `npm run type-check`

**Expected:**
- Zero TypeScript errors
- No `any` types in new code
- All imports resolved correctly

### 6.2 Code Quality

**Command:** `npm run lint`

**Expected:**
- Zero ESLint warnings/errors
- Code follows Next.js conventions
- Consistent formatting

### 6.3 Build Verification

**Command:** `npm run build`

**Expected:**
- Build completes without errors
- No runtime warnings about missing modules
- Tree-shaking works correctly

### 6.4 Manual Testing

**Test Cases:**

1. **Mirror Mode Trigger**
   - Input: "I'm torn between building a SaaS or a consultancy"
   - Expected: Dojo selects Mirror mode, identifies tension

2. **Scout Mode Trigger**
   - Input: "What are my options for learning AI?"
   - Expected: Dojo selects Scout mode, provides 2-4 routes

3. **Gardener Mode Trigger**
   - Input: "I have 7 product ideas, help me focus"
   - Expected: Dojo selects Gardener mode, prunes ideas

4. **Implementation Mode Trigger**
   - Input: "Okay, let's build the AI writing tool"
   - Expected: Dojo selects Implementation mode, provides 1-5 step plan

5. **Default Fallback**
   - Input: "Hello, I need help thinking"
   - Expected: Dojo selects Mirror mode (default)

### 6.5 Integration Testing

**Test Supervisor Routing:**

```typescript
// Pseudo-test code
const context: AgentInvocationContext = {
  user_intent: "What are my options?",
  conversation_history: [],
  session_id: "test_123",
};

const response = await invokeDojoAgent(context);

assert(response.next_move.action !== '');
assert(response.updated_packet.version === '1.0');
assert(response.summary.length > 0);
```

### 6.6 Observability Testing

**Verify Harness Trace Events:**

1. Start trace: `startTrace(sessionId, userId)`
2. Invoke Dojo Agent
3. Check logged events:
   - `AGENT_ACTIVITY_START` (with agent_id: 'dojo')
   - `AGENT_ACTIVITY_PROGRESS` (with selected mode)
   - `TOOL_INVOCATION` (LLM call)
   - `AGENT_ACTIVITY_COMPLETE` (with summary)

### 6.7 Cost Tracking

**Verify LLM Usage:**

- Each mode handler call should log token usage
- Cost should be calculated automatically by `llmClient`
- No manual cost tracking needed (handled by LLM client)

---

## 7. Risk Analysis & Mitigation

### 7.1 Risk: LLM Returns Invalid JSON

**Mitigation:**
- Use `llmClient.createJSONCompletion()` which enforces JSON mode
- Validate with Zod schemas
- Wrap in try/catch with fallback responses

### 7.2 Risk: Mode Selection is Ambiguous

**Mitigation:**
- Default to Mirror mode when uncertain
- Use clear keyword matching as primary heuristic
- Log mode selection reasoning to Harness Trace

### 7.3 Risk: DojoPacket State is Inconsistent

**Mitigation:**
- Always return a copy of the packet (never mutate)
- Validate packet structure with Zod before returning
- Preserve existing fields when updating

### 7.4 Risk: Performance Issues with Large Packets

**Mitigation:**
- Limit perspectives to most recent 10 for LLM context
- Summarize old perspectives rather than sending all
- Future: Implement packet pruning strategy

### 7.5 Risk: API Key Failures

**Mitigation:**
- LLM client already handles fallback (DeepSeek → OpenAI)
- Graceful error messages to user
- Dev mode allows testing without API keys (keyword fallback)

---

## 8. Open Questions & Decisions

### 8.1 Resolved

**Q:** Should the agent persist DojoPacket to database?  
**A:** No, not in v1.0. The agent returns an `updated_packet` and the caller decides when to persist.

**Q:** Should mode selection use an LLM call?  
**A:** No, use heuristic/keyword matching for v1.0. Mode selection should be fast (<500ms).

**Q:** How to handle empty DojoPackets (new sessions)?  
**A:** Create a minimal packet with `situation = user_intent` and empty arrays. Let Mirror mode handle initial reflection.

### 8.2 Open (for Implementation)

**Q:** Should we limit the number of perspectives sent to LLM?  
**A:** Start with all perspectives. If token limits are hit, implement "top 10 most recent" in Phase 2.

**Q:** Should each mode have different temperature settings?  
**A:** Start with 0.7 for all modes. Can tune per-mode if needed.

**Q:** Should we cache mode selection results?  
**A:** Not in v1.0. Each query should re-evaluate mode based on latest context.

---

## 9. Success Criteria

### 9.1 Functional Completeness

- [ ] All 4 mode handlers implemented and working
- [ ] Mode selection correctly routes to appropriate handler
- [ ] DojoPacket correctly updated after each interaction
- [ ] NextMove generated for every response
- [ ] Supervisor integration works end-to-end

### 9.2 Code Quality

- [ ] `npm run build` passes without errors
- [ ] `npm run lint` passes without warnings
- [ ] `npm run type-check` passes
- [ ] All functions have TSDoc comments
- [ ] No `any` types in new code

### 9.3 Observability

- [ ] All Harness Trace events logged correctly
- [ ] LLM usage tracked automatically
- [ ] Mode selection logged with reasoning
- [ ] Errors logged with full context

### 9.4 Performance

- [ ] Mode selection completes in <500ms
- [ ] Each mode handler completes in <10 seconds (typical)
- [ ] No memory leaks or resource exhaustion

### 9.5 Integration

- [ ] Works with Supervisor routing
- [ ] Uses existing DojoPacket schema (no modifications)
- [ ] Follows patterns from `librarian-handler.ts`
- [ ] Compatible with existing LLM client and Harness Trace

---

## 10. Future Enhancements (Out of Scope for v1.0)

- **Advanced Mode Blending:** Combine multiple modes (e.g., Mirror + Scout)
- **User-Controlled Mode Selection:** Allow users to explicitly choose mode
- **Packet Persistence:** Auto-save DojoPacket to database after each interaction
- **Context Summarization:** Compress old perspectives to save tokens
- **Mode-Specific Temperature:** Tune LLM temperature per mode
- **Proactive Suggestions:** Agent recommends when to switch modes
- **Multi-Turn Planning:** Implementation mode can execute multiple turns
- **UI Components:** Display mode badges and transitions in UI

---

## 11. References

**Source Files:**
- `lib/agents/librarian-handler.ts` - Reference implementation pattern
- `lib/agents/types.ts` - Core agent interfaces
- `lib/packet/schema.ts` - DojoPacket schema
- `lib/llm/client.ts` - LLM client API
- `lib/harness/trace.ts` - Observability API

**Documentation:**
- `.zenflow/tasks/implement-the-dojo-agent-fe3f/requirements.md` - Product requirements
- `lib/llm/registry.ts` - Model configuration and pricing

**External References:**
- [Zod Documentation](https://zod.dev/) - Schema validation
- [OpenAI SDK](https://github.com/openai/openai-node) - API client
- [DeepSeek API](https://api.deepseek.com/) - Primary LLM provider
