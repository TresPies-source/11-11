# Feature 1: Supervisor Router (Agent Connect Pattern)

**Release:** v0.3.0 Premium "Intelligence & Foundation"  
**Branch:** `feature/supervisor-router`  
**Wave:** 1 (Foundation)  
**Zenflow Instance:** #1  
**Duration:** 2-3 weeks (flexible until excellence achieved)  
**Dependencies:** None

---

## Context: You Have Full Repo Access

You are working in the **11-11 repository** with complete access to all documentation. Before starting, review these key files:

**Foundation Documents (Read from tail first, then head):**
- `/00_Roadmap/task_plan.md` - Current roadmap and sprint status
- `/JOURNAL.md` - Development log and architectural decisions
- `/05_Logs/BUGS.md` - Known issues and bug tracking
- `/05_Logs/AUDIT_LOG.md` - Sprint summaries and technical decisions

**Architecture & Patterns:**
- `/04_System/EXCELLENCE_CRITERIA_FRAMEWORK.md` - 8 dimensions of excellence
- `/04_System/V0.3.0_FEATURE_SEEDS.md` - Seed 1 (Supervisor Router pattern)
- `/04_System/AGENT_BEST_PRACTICES.md` - Development standards
- `/04_System/WINDOWS_BASH_MEMORY.md` - Environment notes

**Dojo Genesis Ecosystem:**
- Review the Master Blueprint v3.0 in project instructions
- Understand the Dojo Agent Protocol v1.0
- Study the Agent Connect pattern from Dataiku research

**Current Codebase:**
- `/lib/` - Existing utilities and helpers
- `/components/` - UI components and patterns
- `/app/` - Next.js app router structure
- `/db/` - Database schema and migrations (PGlite)

---

## Feature Overview

Deploy the Supervisor as the single conversational entry point that routes queries to specialized agents using description-based routing. This implements Dataiku's Agent Connect pattern and establishes the foundation for the multi-agent Dojo Genesis ecosystem.

**Research Foundation:** This feature is grounded in Dataiku's enterprise agent patterns, specifically the "Agent Connect" pattern that uses a single entry point (Supervisor) to route to specialized agents, preventing agent sprawl and maintaining clear boundaries.

---

## Excellence Criteria (v0.3.0 Priorities)

**Must Be Excellent (9-10/10):**
- **Stability:** Zero routing failures, comprehensive error handling
- **Research Integration:** Pure Agent Connect implementation from Dataiku patterns
- **Depth:** Complete, extensible, fully documented

**Must Be Very Good (7-8/10):**
- **Performance:** Routing adds <200ms latency
- **Parallelization:** Zero dependencies, isolated implementation

**Can Be Good (6-7/10):**
- **Beauty:** Clean UI, not necessarily stunning
- **Creativity:** Solid implementation, not necessarily novel

---

## Core Requirements

### 1. Agent Registry (JSON-Based)

**Purpose:** Central registry of all agents with descriptions that enable routing decisions.

**File Location:** `/lib/agents/registry.json`

**Schema:**
```json
{
  "agents": [
    {
      "id": "dojo",
      "name": "Dojo Agent",
      "description": "Core thinking partnership. Use when the user wants to explore perspectives, map routes, prune ideas, or generate a Next Move. Does NOT search for information or resolve conflicts.",
      "when_to_use": [
        "User wants to explore multiple perspectives",
        "User needs help mapping routes or tradeoffs",
        "User wants to prune ideas (Keep/Grow/Compost/Replant)",
        "User needs a concrete Next Move"
      ],
      "when_not_to_use": [
        "User needs to search for information",
        "User has conflicting perspectives that need resolution",
        "User wants to generate code or artifacts"
      ],
      "default": true
    },
    {
      "id": "librarian",
      "name": "Librarian Agent",
      "description": "Semantic search and retrieval. Use when the user wants to find seed patches, search project memory, or discover similar prompts. Does NOT provide thinking partnership or generate new ideas.",
      "when_to_use": [
        "User wants to search for seed patches",
        "User needs to find information in project memory",
        "User wants to discover similar prompts",
        "User asks 'what did I build before?' or 'find X'"
      ],
      "when_not_to_use": [
        "User wants thinking partnership",
        "User wants to explore perspectives",
        "User needs conflict resolution"
      ],
      "default": false
    },
    {
      "id": "debugger",
      "name": "Debugger Agent",
      "description": "Conflict resolution and reasoning validation. Use when the user has conflicting perspectives, logical errors, or needs assumption analysis. Does NOT search or provide general thinking partnership.",
      "when_to_use": [
        "User has conflicting perspectives",
        "User's reasoning has logical errors",
        "User needs assumption analysis",
        "User asks 'what's wrong with my thinking?'"
      ],
      "when_not_to_use": [
        "User wants general thinking partnership",
        "User wants to search for information",
        "User wants to generate artifacts"
      ],
      "default": false
    }
  ]
}
```

**Implementation Notes:**
- Check existing `/lib/` structure for similar registry patterns
- Follow existing code style and conventions in the repo
- Use TypeScript types from existing codebase where applicable
- Integrate with existing error handling patterns

**Requirements:**
- [ ] Registry is loaded at application startup
- [ ] Registry is validated against schema (use Zod if already in use)
- [ ] Registry supports hot-reloading (no server restart needed)
- [ ] Registry is extensible (easy to add new agents)
- [ ] Registry follows existing 11-11 code patterns

---

### 2. Description-Based Routing Logic

**Purpose:** Use an LLM to read agent descriptions and select the best-fit agent for the user's query.

**Integration Points:**
- Review existing LLM call patterns in `/lib/` or `/app/api/`
- Use existing OpenAI client configuration if available
- Follow existing error handling and logging patterns
- Integrate with existing session management

**Implementation:**
```typescript
// /lib/agents/supervisor.ts

export async function routeQuery(
  userQuery: string,
  conversationContext: string[],
  availableAgents: Agent[]
): Promise<RoutingDecision> {
  // Use GPT-4o-mini for cost-effective routing
  const routingPrompt = `
You are the Supervisor Router for the Dojo Genesis system.

Your job is to read the user's query and conversation context, then select the best agent to handle it.

Available agents:
${availableAgents.map(agent => `
- ${agent.name}: ${agent.description}
  When to use: ${agent.when_to_use.join(', ')}
  When NOT to use: ${agent.when_not_to_use.join(', ')}
`).join('\n')}

User query: "${userQuery}"

Conversation context (last 3 messages):
${conversationContext.join('\n')}

Select the best agent and explain why in 1-2 sentences.

Respond in JSON:
{
  "agent_id": "dojo|librarian|debugger",
  "confidence": 0.0-1.0,
  "reasoning": "1-2 sentence explanation"
}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: routingPrompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3, // Low temperature for consistent routing
  });

  const decision = JSON.parse(response.choices[0].message.content);

  // Fallback to default agent if confidence is low
  if (decision.confidence < 0.6) {
    const defaultAgent = availableAgents.find(a => a.default);
    return {
      agent_id: defaultAgent.id,
      confidence: decision.confidence,
      reasoning: `Low confidence (${decision.confidence}). Falling back to ${defaultAgent.name}.`,
      fallback: true,
    };
  }

  return decision;
}
```

**Requirements:**
- [ ] Routing uses GPT-4o-mini for cost efficiency
- [ ] Routing considers last 3 messages of conversation context
- [ ] Routing returns confidence score (0.0-1.0)
- [ ] Routing falls back to default agent (Dojo) if confidence <0.6
- [ ] Routing decision is logged to Harness Trace (implement basic logging if Harness Trace not yet built)
- [ ] Follows existing LLM call patterns in the codebase

---

### 3. Handoff Patterns

**Purpose:** Enable seamless handoffs between agents while preserving full context.

**Handoff Types:**
1. **Dojo → Librarian:** User asks to search for information
2. **Dojo → Debugger:** User has conflicting perspectives
3. **Librarian → Dojo:** Search complete, return to thinking partnership
4. **Debugger → Dojo:** Conflict resolved, return to thinking partnership

**Implementation:**
```typescript
// /lib/agents/handoff.ts

export interface HandoffContext {
  from_agent: string;
  to_agent: string;
  reason: string;
  conversation_history: Message[];
  harness_trace: HarnessTrace | null; // null if Harness Trace not yet implemented
  user_intent: string;
}

export async function executeHandoff(context: HandoffContext): Promise<void> {
  // Log handoff (to Harness Trace if available, otherwise to console/db)
  if (context.harness_trace) {
    await logHarnessEvent({
      event_type: 'AGENT_HANDOFF',
      from_agent: context.from_agent,
      to_agent: context.to_agent,
      reason: context.reason,
      timestamp: new Date().toISOString(),
    });
  } else {
    console.log('[AGENT_HANDOFF]', {
      from: context.from_agent,
      to: context.to_agent,
      reason: context.reason,
    });
  }

  // Pass full context to target agent
  await invokeAgent(context.to_agent, {
    conversation_history: context.conversation_history,
    harness_trace: context.harness_trace,
    user_intent: context.user_intent,
  });
}
```

**Requirements:**
- [ ] Handoffs preserve full conversation history
- [ ] Handoffs pass complete Harness Trace (or prepare for future integration)
- [ ] Handoffs are logged as events
- [ ] Handoffs are transparent to user (status indicator shows agent change)
- [ ] Graceful degradation if Harness Trace not yet implemented

---

### 4. Cost Tracking for Routing

**Purpose:** Track the cost of routing decisions separately from agent execution.

**Integration:**
- This will integrate with Feature 2 (Cost Guard) once both are merged
- For now, implement basic tracking that Cost Guard can consume later
- Store routing costs in PGlite database

**Implementation:**
```typescript
// /lib/agents/cost-tracking.ts

export async function trackRoutingCost(
  routingDecision: RoutingDecision,
  tokensUsed: number
): Promise<void> {
  // Store in PGlite (check existing db schema in /db/)
  await db.insert(routing_costs).values({
    session_id: getCurrentSessionId(),
    agent_selected: routingDecision.agent_id,
    confidence: routingDecision.confidence,
    tokens_used: tokensUsed,
    cost_usd: tokensUsed * COST_PER_TOKEN_GPT4O_MINI,
    timestamp: new Date(),
  });
}
```

**Requirements:**
- [ ] Routing costs are tracked separately from agent costs
- [ ] Routing costs are stored in PGlite database
- [ ] Schema is compatible with Cost Guard integration (Feature 2)
- [ ] Routing costs are included in per-query budget (once Cost Guard is merged)
- [ ] Follows existing database patterns in `/db/`

---

### 5. Fallback Logic

**Purpose:** Gracefully handle routing failures and ambiguous queries.

**Fallback Rules:**
1. If routing confidence <0.6, fall back to Dojo Agent
2. If routing LLM call fails, fall back to Dojo Agent
3. If selected agent is unavailable, fall back to Dojo Agent
4. If routing takes >5 seconds, timeout and fall back to Dojo Agent

**Implementation:**
```typescript
// /lib/agents/fallback.ts

export async function routeWithFallback(
  userQuery: string,
  conversationContext: string[]
): Promise<string> {
  try {
    const decision = await Promise.race([
      routeQuery(userQuery, conversationContext, getAvailableAgents()),
      timeout(5000, 'Routing timeout'),
    ]);

    if (decision.confidence < 0.6 || decision.fallback) {
      return 'dojo'; // Default agent
    }

    return decision.agent_id;
  } catch (error) {
    console.error('Routing failed:', error);
    // Log to Harness Trace if available, otherwise console
    await logHarnessEvent({
      event_type: 'ROUTING_FAILURE',
      error: error.message,
      fallback_agent: 'dojo',
    }).catch(() => console.log('[ROUTING_FAILURE]', error.message));
    return 'dojo'; // Default agent
  }
}
```

**Requirements:**
- [ ] Fallback logic never throws errors
- [ ] Fallback always returns a valid agent ID
- [ ] Fallback is logged (Harness Trace or console)
- [ ] Fallback is transparent to user (status message explains why)
- [ ] Follows existing error handling patterns in the codebase

---

## API Specification

### POST /api/supervisor/route

**Purpose:** Route a user query to the appropriate agent.

**Integration:**
- Check existing API route structure in `/app/api/`
- Follow existing authentication patterns
- Use existing error response formats
- Integrate with existing middleware

**Request:**
```json
{
  "query": "Find prompts similar to my budget planning prompt",
  "conversation_context": [
    "User: I want to plan my budget",
    "Dojo: Let's explore perspectives on budgeting",
    "User: Actually, I want to find similar prompts first"
  ],
  "session_id": "sess_abc123"
}
```

**Response:**
```json
{
  "agent_id": "librarian",
  "agent_name": "Librarian Agent",
  "confidence": 0.92,
  "reasoning": "User explicitly wants to search for similar prompts, which is the Librarian's primary function.",
  "fallback": false,
  "routing_cost": {
    "tokens_used": 450,
    "cost_usd": 0.000225
  }
}
```

---

## Testing Requirements

### Unit Tests
- [ ] Agent registry loads and validates correctly
- [ ] Routing logic selects correct agent for 20 test queries
- [ ] Fallback logic activates when confidence <0.6
- [ ] Cost tracking records routing costs accurately
- [ ] Follow existing test patterns in `/tests/` or `__tests__/`

### Integration Tests
- [ ] End-to-end routing from user query to agent invocation
- [ ] Handoffs preserve full context
- [ ] Routing failures fall back gracefully
- [ ] Routing costs are stored in database
- [ ] Use existing test infrastructure

### Performance Tests
- [ ] Routing adds <200ms latency (p95)
- [ ] Routing handles 100 concurrent requests
- [ ] Routing timeout works correctly (5s limit)

---

## Documentation Requirements

### JOURNAL.md Updates
Document the following architectural decisions:
- [ ] Why description-based routing over keyword matching
- [ ] Why GPT-4o-mini for routing (cost vs. accuracy tradeoff)
- [ ] Why 0.6 confidence threshold for fallback
- [ ] How agent registry is structured and why
- [ ] Integration points with Cost Guard (Feature 2)
- [ ] Self-assessment against Excellence Criteria (score each dimension)

### Code Documentation
- [ ] JSDoc comments for all public functions
- [ ] README in `/lib/agents/` explaining the routing system
- [ ] Examples of adding new agents to the registry
- [ ] Troubleshooting guide for common routing issues

### Architecture Documentation
- [ ] Diagram showing Supervisor Router in the agent ecosystem
- [ ] Explanation of handoff patterns and context preservation
- [ ] Fallback logic and error handling flow

---

## Acceptance Criteria

### Stability (10/10)
- [ ] Zero routing failures in 100 test queries
- [ ] Comprehensive error handling (all failure modes covered)
- [ ] Fallback logic prevents catastrophic failures
- [ ] All edge cases handled (empty query, long context, unavailable agents)
- [ ] No regressions in existing features

### Research Integration (10/10)
- [ ] Implements Dataiku's Agent Connect pattern exactly
- [ ] Description-based routing (not keyword matching)
- [ ] Single entry point prevents agent sprawl
- [ ] Documentation cites Dataiku research
- [ ] Seed 1 patterns are followed

### Depth (10/10)
- [ ] Complete implementation (no MVP compromises)
- [ ] Extensible registry (easy to add new agents)
- [ ] Comprehensive documentation (architecture, API, usage, JOURNAL updates)
- [ ] All edge cases handled gracefully
- [ ] Code is clean, readable, and follows existing patterns

### Performance (8/10)
- [ ] Routing adds <200ms latency (p95)
- [ ] Routing uses cost-effective model (GPT-4o-mini)
- [ ] Routing timeout prevents hangs (5s limit)
- [ ] No performance regressions

### Parallelization (10/10)
- [ ] Zero dependencies on other features
- [ ] Can be developed on isolated branch
- [ ] Can be merged without breaking other features
- [ ] Clean integration points for Cost Guard (Feature 2)

---

## Integration with Feature 2 (Cost Guard)

Once both features are merged, ensure:
- [ ] Supervisor Router calls Cost Guard's budget check before routing
- [ ] Routing costs are tracked via Cost Guard's tracking system
- [ ] Budget exceeded prevents routing (falls back to Dojo)
- [ ] Routing costs appear in Cost Guard dashboard

**Note:** Implement basic cost tracking now, refactor to use Cost Guard after merge.

---

## Deferred to Future Releases

- Multi-agent collaboration (agent-to-agent communication)
- Dynamic agent registration (agents can register themselves)
- Routing model fine-tuning (custom model for routing)
- Routing analytics dashboard (routing accuracy, confidence distribution)
- A/B testing different routing strategies

---

## Zenflow Automation Protocol

**Setup Script:**
```
npm install
```

**Dev Server Script:**
```
npm run dev
```

**Cleanup Script:**
```
npm run lint; npm run build
```

**Copy Files:**
```
.env.local
```

---

## Notes for Zenflow

1. **Read Documentation from Both Ends:** Start with JOURNAL.md (tail), then BUGS.md (tail), then this prompt (head to tail).

2. **Review Existing Codebase:** Before writing any code, review:
   - `/lib/` for existing utilities and patterns
   - `/db/` for database schema and PGlite usage
   - `/app/api/` for API route patterns
   - `/components/` for UI component patterns

3. **Follow Existing Patterns:** Match the code style, error handling, and architecture patterns already in the repo.

4. **Generate PRD + Tech Spec in Sandbox:** Create detailed PRD and tech spec in your sandbox before coding. Do NOT commit these to the repo.

5. **Commit Only Implementation:** Commit code, tests, and documentation updates. Do NOT commit PRD/spec.

6. **Update JOURNAL.md:** Log architectural decisions, implementation notes, and self-assessment against Excellence Criteria.

7. **Update BUGS.md:** Log any bugs discovered during development. Fix all P0 and P1 bugs before finishing your testing. After completing your testing, complete a premium micro sprint solving any P2/P3 bugs for the user.

8. **Self-Assess:** Use the Excellence Rubric to score your implementation before marking complete.

9. **Windows Bash Compatible:** Use `;` instead of `&&` for command chaining.

10. **Integration Readiness:** Design with Feature 2 (Cost Guard) integration in mind, but don't block on it.

---

**Author:** Manus AI (Dojo)  
**Status:** v0.3.0 Premium Feature Prompt (Improved)  
**Date:** January 12, 2026
