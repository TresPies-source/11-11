# Technical Specification: Supervisor Router (v0.3.1)

**Task ID:** v0-3-1-supervisor-router-0-3-1-f323  
**Complexity:** Hard  
**Date:** January 12, 2026  
**Status:** Draft

---

## 1. Technical Context

### 1.1 Language & Framework
- **Runtime:** Node.js 22+ (Next.js 14 App Router)
- **Language:** TypeScript 5.7+
- **UI Framework:** React 18
- **Styling:** Tailwind CSS + Framer Motion
- **Database:** PGlite (IndexedDB-based Postgres)
- **LLM Provider:** OpenAI (GPT-4o-mini for routing)

### 1.2 Key Dependencies
- `@electric-sql/pglite` - Client-side Postgres database
- `next` - Next.js framework
- `framer-motion` - UI animations
- `lucide-react` - Icons
- **NEW:** `openai` - OpenAI SDK (to be added)
- **NEW:** `zod` - Runtime type validation (to be added)

### 1.3 Existing Architecture Patterns
- **API Routes:** Next.js App Router pattern (`app/api/*/route.ts`)
- **Database Access:** PGlite client singleton pattern (`lib/pglite/client.ts`)
- **Error Handling:** Try-catch with NextResponse error objects
- **Dev Mode:** `NEXT_PUBLIC_DEV_MODE=true` bypasses auth and external APIs
- **Auth:** NextAuth v5 with Google OAuth
- **Multi-Agent UI:** ChatPanel components with persona selection

---

## 2. Implementation Approach

### 2.1 High-Level Architecture

```
User Query
    ↓
Supervisor Router (GPT-4o-mini)
    ↓
    ├─→ Dojo Agent (default)
    ├─→ Librarian Agent
    └─→ Debugger Agent
         ↓
    Agent Execution
         ↓
    (Optional Handoff)
         ↓
    Return to Dojo
```

### 2.2 Core Components

1. **Agent Registry** (`lib/agents/registry.json`)
   - Static JSON file defining available agents
   - Loaded at startup, hot-reloadable in dev mode

2. **Routing Logic** (`lib/agents/supervisor.ts`)
   - LLM-based routing using GPT-4o-mini
   - Description-based selection (not keyword matching)
   - Confidence scoring and fallback logic

3. **Handoff System** (`lib/agents/handoff.ts`)
   - Context preservation across agent transitions
   - Harness Trace integration (with graceful degradation)
   - Event logging

4. **Cost Tracking** (`lib/agents/cost-tracking.ts`)
   - Separate tracking for routing costs
   - Integration with PGlite for persistence
   - Prepared for Cost Guard integration (Feature 2)

5. **API Endpoints** (`app/api/supervisor/route/route.ts`)
   - POST `/api/supervisor/route` - Route user queries
   - GET `/api/supervisor/agents` - List available agents

6. **Database Schema** (PGlite migration)
   - `routing_decisions` table
   - `routing_costs` table
   - `agent_handoffs` table

7. **UI Components** (`components/agents/`)
   - AgentSelector - Agent selection dropdown
   - RoutingIndicator - Visual routing feedback
   - AgentStatusBadge - Current active agent display

---

## 3. Source Code Structure Changes

### 3.1 New Files

```
lib/agents/
├── registry.json              # Agent registry
├── supervisor.ts              # Routing logic
├── handoff.ts                 # Handoff management
├── cost-tracking.ts           # Cost tracking
├── fallback.ts                # Fallback logic
└── types.ts                   # TypeScript types

lib/openai/
├── client.ts                  # OpenAI client singleton
└── types.ts                   # OpenAI-specific types

app/api/supervisor/
├── route/
│   └── route.ts               # POST /api/supervisor/route
└── agents/
    └── route.ts               # GET /api/supervisor/agents

components/agents/
├── AgentSelector.tsx          # Agent selection UI
├── RoutingIndicator.tsx       # Routing status display
└── AgentStatusBadge.tsx       # Active agent badge

lib/pglite/migrations/
└── 003_add_supervisor_tables.ts  # Database migration

__tests__/agents/
├── supervisor.test.ts         # Unit tests for routing
├── handoff.test.ts            # Unit tests for handoffs
└── fallback.test.ts           # Unit tests for fallback logic
```

### 3.2 Modified Files

```
lib/constants.ts               # Add agent constants
lib/types.ts                   # Add agent-related types
lib/pglite/schema.ts           # Add new tables to schema
lib/pglite/client.ts           # Run new migration
.env.example                   # Add OPENAI_API_KEY
package.json                   # Add openai, zod dependencies
components/multi-agent/ChatPanel.tsx  # Integrate routing
```

---

## 4. Data Model / API / Interface Changes

### 4.1 Database Schema (PGlite)

#### New Table: `routing_decisions`
```sql
CREATE TABLE IF NOT EXISTS routing_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_query TEXT NOT NULL,
  agent_selected TEXT NOT NULL,
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT NOT NULL,
  is_fallback BOOLEAN DEFAULT false,
  conversation_context JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routing_decisions_session_id 
  ON routing_decisions(session_id);
CREATE INDEX IF NOT EXISTS idx_routing_decisions_agent_selected 
  ON routing_decisions(agent_selected);
```

#### New Table: `routing_costs`
```sql
CREATE TABLE IF NOT EXISTS routing_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routing_decision_id UUID REFERENCES routing_decisions(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routing_costs_session_id 
  ON routing_costs(session_id);
CREATE INDEX IF NOT EXISTS idx_routing_costs_routing_decision_id 
  ON routing_costs(routing_decision_id);
```

#### New Table: `agent_handoffs`
```sql
CREATE TABLE IF NOT EXISTS agent_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  from_agent TEXT NOT NULL,
  to_agent TEXT NOT NULL,
  reason TEXT NOT NULL,
  conversation_history JSONB DEFAULT '[]'::jsonb,
  harness_trace_id TEXT,
  user_intent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_handoffs_session_id 
  ON agent_handoffs(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_handoffs_from_to 
  ON agent_handoffs(from_agent, to_agent);
```

### 4.2 TypeScript Types

```typescript
// lib/agents/types.ts

export interface Agent {
  id: string;
  name: string;
  description: string;
  when_to_use: string[];
  when_not_to_use: string[];
  default: boolean;
}

export interface AgentRegistry {
  agents: Agent[];
}

export interface RoutingDecision {
  agent_id: string;
  confidence: number;
  reasoning: string;
  fallback: boolean;
}

export interface HandoffContext {
  from_agent: string;
  to_agent: string;
  reason: string;
  conversation_history: ChatMessage[];
  harness_trace_id?: string | null;
  user_intent: string;
}

export interface RoutingCost {
  routing_decision_id: string;
  session_id: string;
  tokens_used: number;
  cost_usd: number;
  model: string;
}
```

### 4.3 API Specification

#### POST `/api/supervisor/route`

**Request:**
```typescript
{
  query: string;                    // User's current query
  conversation_context: string[];   // Last 3 messages
  session_id: string;               // Session identifier
}
```

**Response (Success):**
```typescript
{
  agent_id: string;           // Selected agent ID
  agent_name: string;         // Agent display name
  confidence: number;         // 0.0-1.0
  reasoning: string;          // 1-2 sentence explanation
  fallback: boolean;          // True if fallback activated
  routing_cost: {
    tokens_used: number;
    cost_usd: number;
  };
}
```

**Response (Error):**
```typescript
{
  error: string;              // Error message
  fallback_agent: string;     // Agent ID used as fallback
}
```

#### GET `/api/supervisor/agents`

**Response:**
```typescript
{
  agents: Agent[];            // Array of available agents
}
```

---

## 5. Implementation Details

### 5.1 Agent Registry Structure

The registry will be a static JSON file that can be hot-reloaded in development:

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

### 5.2 OpenAI Client Setup

```typescript
// lib/openai/client.ts

import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (openaiInstance) {
    return openaiInstance;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  openaiInstance = new OpenAI({ apiKey });
  return openaiInstance;
}

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
```

### 5.3 Routing Logic Implementation

The core routing logic uses GPT-4o-mini with structured JSON output:

```typescript
// lib/agents/supervisor.ts

import { getOpenAIClient, isOpenAIConfigured } from '@/lib/openai/client';
import type { Agent, RoutingDecision } from './types';

const ROUTING_TIMEOUT_MS = 5000;
const CONFIDENCE_THRESHOLD = 0.6;

export async function routeQuery(
  userQuery: string,
  conversationContext: string[],
  availableAgents: Agent[]
): Promise<RoutingDecision> {
  // Build routing prompt
  const routingPrompt = buildRoutingPrompt(userQuery, conversationContext, availableAgents);
  
  // Call OpenAI with timeout
  const openai = getOpenAIClient();
  const response = await Promise.race([
    openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: routingPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
    timeout(ROUTING_TIMEOUT_MS)
  ]);

  // Parse and validate response
  const decision = parseRoutingResponse(response);
  
  // Apply fallback logic if confidence is low
  if (decision.confidence < CONFIDENCE_THRESHOLD) {
    return applyFallback(decision, availableAgents);
  }

  return decision;
}

function buildRoutingPrompt(
  userQuery: string,
  conversationContext: string[],
  availableAgents: Agent[]
): string {
  return `You are the Supervisor Router for the Dojo Genesis system.

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
}`;
}
```

### 5.4 Dev Mode Support

In dev mode (no OpenAI API key), routing will use a simple fallback:

```typescript
// lib/agents/supervisor.ts

export async function routeQueryDevMode(
  userQuery: string,
  availableAgents: Agent[]
): Promise<RoutingDecision> {
  // Simple keyword-based routing for dev mode
  const queryLower = userQuery.toLowerCase();
  
  if (queryLower.includes('search') || queryLower.includes('find')) {
    return {
      agent_id: 'librarian',
      confidence: 0.8,
      reasoning: 'Dev mode: Query contains search/find keywords',
      fallback: false,
    };
  }
  
  if (queryLower.includes('conflict') || queryLower.includes('wrong')) {
    return {
      agent_id: 'debugger',
      confidence: 0.8,
      reasoning: 'Dev mode: Query contains conflict/error keywords',
      fallback: false,
    };
  }
  
  // Default to Dojo
  const defaultAgent = availableAgents.find(a => a.default)!;
  return {
    agent_id: defaultAgent.id,
    confidence: 0.7,
    reasoning: 'Dev mode: Default agent selection',
    fallback: true,
  };
}
```

### 5.5 Cost Tracking

Cost tracking integrates with PGlite:

```typescript
// lib/agents/cost-tracking.ts

import { getDB } from '@/lib/pglite/client';

const GPT4O_MINI_INPUT_PRICE = 0.00015 / 1000;   // $0.15 per 1M tokens
const GPT4O_MINI_OUTPUT_PRICE = 0.0006 / 1000;   // $0.60 per 1M tokens

export async function trackRoutingCost(
  routingDecisionId: string,
  sessionId: string,
  promptTokens: number,
  completionTokens: number
): Promise<void> {
  const totalTokens = promptTokens + completionTokens;
  const costUsd = 
    (promptTokens * GPT4O_MINI_INPUT_PRICE) +
    (completionTokens * GPT4O_MINI_OUTPUT_PRICE);

  const db = await getDB();
  
  await db.query(`
    INSERT INTO routing_costs (
      routing_decision_id,
      session_id,
      tokens_used,
      cost_usd,
      model
    ) VALUES ($1, $2, $3, $4, $5)
  `, [routingDecisionId, sessionId, totalTokens, costUsd, 'gpt-4o-mini']);
}
```

---

## 6. Verification Approach

### 6.1 Unit Tests

**Test File:** `__tests__/agents/supervisor.test.ts`

```typescript
describe('Supervisor Router', () => {
  describe('routeQuery', () => {
    it('should route search queries to Librarian', async () => {
      const decision = await routeQuery(
        'Find prompts similar to my budget planning prompt',
        [],
        mockAgents
      );
      expect(decision.agent_id).toBe('librarian');
      expect(decision.confidence).toBeGreaterThan(0.8);
    });

    it('should route thinking queries to Dojo', async () => {
      const decision = await routeQuery(
        'Help me explore different perspectives on my career decision',
        [],
        mockAgents
      );
      expect(decision.agent_id).toBe('dojo');
    });

    it('should fallback to Dojo when confidence < 0.6', async () => {
      // Mock low confidence response
      const decision = await routeQuery(
        'vague query',
        [],
        mockAgents
      );
      expect(decision.fallback).toBe(true);
      expect(decision.agent_id).toBe('dojo');
    });

    it('should timeout after 5 seconds', async () => {
      // Mock slow API response
      await expect(
        routeQuery('test', [], mockAgents)
      ).rejects.toThrow('Routing timeout');
    });
  });
});
```

### 6.2 Integration Tests

**Test Scenarios:**
1. End-to-end routing from API endpoint to agent selection
2. Handoff preserves full conversation history
3. Routing costs are persisted to database
4. Fallback activates on API failures
5. Dev mode routing works without OpenAI API key

### 6.3 Manual Testing

**Test Plan:**
1. **Routing Accuracy:**
   - Test 20 diverse queries
   - Verify agent selection matches expected agent
   - Check confidence scores are reasonable

2. **Fallback Logic:**
   - Disconnect internet → verify fallback to Dojo
   - Send ambiguous query → verify confidence < 0.6 triggers fallback
   - Verify timeout after 5 seconds

3. **Cost Tracking:**
   - Query database after routing
   - Verify routing costs are recorded
   - Verify cost calculation is accurate

4. **UI Integration:**
   - Verify routing indicator shows during routing
   - Verify agent badge updates after routing
   - Verify manual override works

### 6.4 Performance Testing

**Targets:**
- Routing latency: <200ms (p95)
- API endpoint response: <300ms total
- Database write: <50ms
- No memory leaks during 100 consecutive routings

### 6.5 Lint & Type Check

```bash
npm run lint
npm run type-check
```

Both must pass with zero errors before completion.

---

## 7. Excellence Criteria Self-Assessment

This feature targets **Route C Premium** standards:

### Must Be Excellent (9-10/10):

**Stability:**
- Comprehensive error handling (all failure modes)
- Graceful fallback to Dojo (never throws errors)
- Zero regressions in existing multi-agent UI
- All edge cases handled (empty query, long context, missing API key)

**Research Integration:**
- Pure implementation of Dataiku's Agent Connect pattern
- Description-based routing (not keyword matching)
- Single entry point prevents agent sprawl
- Documentation cites research sources

**Depth:**
- Complete implementation (no MVP compromises)
- Extensible registry (easy to add new agents)
- Comprehensive documentation (architecture, API, usage)
- JOURNAL.md updated with architectural decisions

### Must Be Very Good (7-8/10):

**Performance:**
- Routing adds <200ms latency (p95)
- Uses cost-effective model (GPT-4o-mini)
- Timeout prevents hangs (5s limit)

**Parallelization:**
- Zero dependencies on Feature 2 (Cost Guard)
- Can be developed in isolation
- Clean integration points prepared

### Can Be Good (6-7/10):

**Beauty:**
- Clean UI components
- Basic animations
- Follows existing design patterns

**Creativity:**
- Solid implementation
- Not necessarily novel

---

## 8. Integration Points

### 8.1 Future Integration: Cost Guard (Feature 2)

Prepared integration points:
- Cost tracking uses compatible schema
- Budget check hook points in routing logic
- Routing costs stored separately for aggregation

**Integration Checklist (for Feature 2):**
- [ ] Supervisor calls Cost Guard's `checkBudget()` before routing
- [ ] Routing costs flow into Cost Guard's tracking system
- [ ] Budget exceeded prevents routing (falls back to Dojo)
- [ ] Routing costs appear in Cost Guard dashboard

### 8.2 Future Integration: Harness Trace (Feature 4)

Prepared integration points:
- Handoff context includes `harness_trace_id`
- Event logging uses try-catch pattern for graceful degradation
- Span structure ready for Harness Trace spans

---

## 9. Known Limitations & Deferred Features

**Deferred to Future Releases:**
- Multi-agent collaboration (agent-to-agent communication)
- Dynamic agent registration (agents can register themselves)
- Routing model fine-tuning (custom routing model)
- Routing analytics dashboard (accuracy tracking)
- A/B testing different routing strategies

**Technical Debt:**
- Dev mode uses keyword matching (not LLM-based)
- Harness Trace integration is stubbed
- No routing accuracy feedback loop

---

## 10. Migration & Deployment

### 10.1 Database Migration

Migration will run automatically on first load:

```typescript
// lib/pglite/migrations/003_add_supervisor_tables.ts

export async function applyMigration003(db: any): Promise<void> {
  console.log('[Migration 003] Adding supervisor tables...');
  
  // Check if already applied
  const exists = await db.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'routing_decisions'
    );
  `);
  
  if (exists.rows[0]?.exists) {
    console.log('[Migration 003] Already applied, skipping');
    return;
  }
  
  // Apply migration
  await db.exec(MIGRATION_003_SQL);
  console.log('[Migration 003] Complete');
}
```

### 10.2 Environment Variables

New required environment variable:

```bash
# .env.local
OPENAI_API_KEY=sk-...
```

**Fallback Behavior:**
- If not set: routing uses dev mode (keyword-based)
- Console warning displayed: "OpenAI API key not configured, using dev mode routing"

### 10.3 Deployment Checklist

- [ ] Add `openai` and `zod` to package.json
- [ ] Update .env.example with OPENAI_API_KEY
- [ ] Run database migration (automatic)
- [ ] Verify routing works in dev mode
- [ ] Verify routing works with OpenAI API key
- [ ] Run all tests
- [ ] Update JOURNAL.md
- [ ] Update BUGS.md (if bugs found)

---

## 11. Risk Assessment

### High Risk
- **OpenAI API failures:** Mitigated by robust fallback logic and timeout
- **Cost overruns:** Mitigated by using cheapest model (GPT-4o-mini) and caching decisions

### Medium Risk
- **Routing accuracy:** Mitigated by confidence threshold and manual override
- **Integration complexity:** Mitigated by isolated development and clean interfaces

### Low Risk
- **Performance:** GPT-4o-mini is fast (<500ms typical)
- **Database migration:** PGlite migrations are well-tested

---

## 12. Success Metrics

**Quantitative:**
- Routing accuracy >85% (validated by manual testing of 20 queries)
- Routing latency <200ms (p95)
- Zero routing failures in 100 consecutive queries
- Cost per routing decision <$0.0003

**Qualitative:**
- Code is clean, readable, and follows existing patterns
- Documentation is comprehensive and helpful
- UI is clear and transparent
- Developer experience is smooth (easy to add new agents)

---

## Appendix A: File Structure Reference

```
lib/
├── agents/
│   ├── registry.json
│   ├── supervisor.ts
│   ├── handoff.ts
│   ├── cost-tracking.ts
│   ├── fallback.ts
│   └── types.ts
├── openai/
│   ├── client.ts
│   └── types.ts
└── pglite/
    └── migrations/
        └── 003_add_supervisor_tables.ts

app/api/supervisor/
├── route/
│   └── route.ts
└── agents/
    └── route.ts

components/agents/
├── AgentSelector.tsx
├── RoutingIndicator.tsx
└── AgentStatusBadge.tsx

__tests__/agents/
├── supervisor.test.ts
├── handoff.test.ts
└── fallback.test.ts
```

---

**End of Technical Specification**
