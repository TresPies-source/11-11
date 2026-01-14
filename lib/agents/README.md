# Agent Registry System

## Overview

The Agent Registry is the central system for managing multi-agent routing in 11-11. It provides:

- **Agent Metadata**: Store and retrieve agent descriptions, capabilities, and use cases
- **Dynamic Status Detection**: Automatically detect which agents are implemented
- **Usage Analytics**: Track query counts, costs, and performance metrics per agent
- **Test Interface**: Validate routing logic before production use

---

## Architecture

### Core Components

```
┌────────────────────────────────────────────────────────┐
│                  registry.json                         │
│  Source of truth for all agent metadata               │
└───────────────────┬────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  supervisor.ts       │
         │  loadAgentRegistry() │
         └──────────┬───────────┘
                    │
                    ├───► GET /api/agents/registry
                    ├───► GET /api/agents/[agentId]
                    └───► POST /api/agents/test-route
```

### Files

- **`registry.json`**: Agent metadata (id, name, icon, description, capabilities)
- **`supervisor.ts`**: Core routing logic and registry loading
- **`types.ts`**: TypeScript interfaces for agents and routing
- **`status.ts`**: Agent status detection (online/offline/deprecated)
- **`usage-stats.ts`**: Usage analytics aggregation from database
- **`cost-tracking.ts`**: LLM cost calculation and tracking

---

## Adding a New Agent

### Step 1: Add to `registry.json`

```json
{
  "agents": [
    {
      "id": "my-agent",
      "name": "My Agent",
      "icon": "🤖",
      "tagline": "One-sentence description",
      "description": "Detailed description of what this agent does (2-3 sentences).",
      "when_to_use": [
        "Use case 1",
        "Use case 2"
      ],
      "when_not_to_use": [
        "Anti-pattern 1",
        "Anti-pattern 2"
      ],
      "default": false
    }
  ]
}
```

**Field Descriptions:**

- **id**: Unique identifier (lowercase, hyphenated)
- **name**: Display name (Title Case)
- **icon**: Emoji representing the agent
- **tagline**: One-sentence description for cards
- **description**: 2-3 sentence explanation of purpose
- **when_to_use**: Array of use cases (bulleted in UI)
- **when_not_to_use**: Array of anti-patterns (bulleted in UI)
- **default**: Whether this is the default agent (only one should be `true`)

### Step 2: Implement Agent Handler

Create a handler file (e.g., `my-agent-handler.ts`):

```typescript
import { AgentHandler } from './types';

export const myAgentHandler: AgentHandler = {
  id: 'my-agent',
  name: 'My Agent',
  
  async handle({ query, context, session_id }) {
    // Your agent logic here
    return {
      response: 'Agent response',
      metadata: { /* ... */ }
    };
  },
};
```

### Step 3: Register Handler in `supervisor.ts`

Import and add to the handler registry:

```typescript
import { myAgentHandler } from './my-agent-handler';

const AGENT_HANDLERS: Record<string, AgentHandler> = {
  dojo: dojoHandler,
  librarian: librarianHandler,
  'my-agent': myAgentHandler, // Add your handler
};
```

### Step 4: Update Routing Logic (if needed)

If your agent requires specific routing keywords, update the keyword detection in `routeQuery()`:

```typescript
const keywords = {
  librarian: ['search', 'find', 'look up'],
  'my-agent': ['my', 'custom', 'keywords'], // Add keywords
};
```

### Step 5: Test Your Agent

Use the test interface at `/agents` or via API:

```bash
curl -X POST http://localhost:3000/api/agents/test-route \
  -H "Content-Type: application/json" \
  -d '{"query": "Test query for my agent"}'
```

---

## Updating Agent Descriptions

### Option 1: Edit `registry.json` Directly

1. Open `lib/agents/registry.json`
2. Find your agent by `id`
3. Update fields: `description`, `when_to_use`, `when_not_to_use`, `tagline`, `icon`
4. Restart dev server: `npm run dev`

### Option 2: Programmatic Update (Future)

Admin UI for editing descriptions is planned for v0.4.0+.

---

## API Documentation

### GET `/api/agents/registry`

Returns all agents with computed status.

**Response:**
```json
{
  "agents": [
    {
      "id": "dojo",
      "name": "Dojo",
      "icon": "🧘",
      "tagline": "Your thinking partner",
      "description": "...",
      "when_to_use": ["..."],
      "when_not_to_use": ["..."],
      "status": "online"
    }
  ]
}
```

**Status Values:**
- `online`: Agent is implemented and available
- `offline`: Agent is not yet implemented
- `deprecated`: Agent is being phased out

### GET `/api/agents/[agentId]`

Returns detailed information for a specific agent, including usage statistics.

**Response:**
```json
{
  "id": "dojo",
  "name": "Dojo",
  "icon": "🧘",
  "tagline": "Your thinking partner",
  "description": "...",
  "when_to_use": ["..."],
  "when_not_to_use": ["..."],
  "status": "online",
  "usage_stats": {
    "query_count": 42,
    "total_cost_usd": 0.0234,
    "avg_tokens_used": 1250,
    "last_used_at": "2026-01-13T12:34:56Z"
  }
}
```

**Usage Stats:** Returns `null` if agent has never been used.

### POST `/api/agents/test-route`

Test routing logic without saving to database.

**Request:**
```json
{
  "query": "Help me debug a conflict in my code",
  "conversation_context": [] // Optional
}
```

**Response:**
```json
{
  "agent_id": "debugger",
  "agent_name": "Debugger",
  "confidence": 0.95,
  "reasoning": "Query contains conflict resolution keywords",
  "fallback": false,
  "cost_breakdown": {
    "input_tokens": 45,
    "output_tokens": 12,
    "total_tokens": 57,
    "total_cost_usd": 0.000034
  }
}
```

**Fallback:** If `fallback: true`, routing used keyword matching (no LLM call), and `cost_breakdown` will be `null`.

---

## Usage Analytics

### Database Schema

**`routing_decisions` Table:**
```sql
CREATE TABLE routing_decisions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  query TEXT NOT NULL,
  agent_selected TEXT NOT NULL,
  confidence REAL,
  reasoning TEXT,
  fallback BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**`routing_costs` Table:**
```sql
CREATE TABLE routing_costs (
  id TEXT PRIMARY KEY,
  routing_decision_id TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  tokens_used INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  FOREIGN KEY (routing_decision_id) REFERENCES routing_decisions(id)
);
```

### Querying Usage Stats

```typescript
import { getAgentUsageStats } from '@/lib/agents/usage-stats';

const stats = await getAgentUsageStats('dojo');

if (stats) {
  console.log(`Dojo has handled ${stats.query_count} queries`);
  console.log(`Total cost: $${stats.total_cost_usd.toFixed(4)}`);
  console.log(`Avg tokens: ${stats.avg_tokens_used}`);
  console.log(`Last used: ${stats.last_used_at}`);
}
```

### All Agents Stats

```typescript
import { getAllAgentsUsageStats } from '@/lib/agents/usage-stats';

const allStats = await getAllAgentsUsageStats();

Object.entries(allStats).forEach(([agentId, stats]) => {
  console.log(`${agentId}: ${stats.query_count} queries, $${stats.total_cost_usd}`);
});
```

---

## Testing

### Unit Tests

Located in `lib/agents/*.test.ts`

```bash
npm run test
```

**Coverage:**
- Registry loading and validation
- Routing logic (LLM + fallback)
- Cost calculation
- Usage stats aggregation
- API endpoints

### Integration Tests

Located in `__tests__/integration/agents/`

```bash
npm run test:integration
```

**Coverage:**
- End-to-end routing flow
- Database persistence
- API contract validation
- UI component behavior

### Manual Testing

Use the Agent Registry UI at `/agents`:

1. Click an agent card
2. View agent details and usage stats
3. Click "Test Agent" button
4. Enter a test query
5. Verify routing decision

---

## Performance Optimization

### Caching

Agent registry is cached in memory after first load:

```typescript
let cachedRegistry: AgentRegistry | null = null;

export function loadAgentRegistry(): AgentRegistry {
  if (cachedRegistry) return cachedRegistry;
  // Load and validate registry.json
  cachedRegistry = validatedRegistry;
  return cachedRegistry;
}
```

**Cache Invalidation:** Restart server to reload `registry.json`.

### Query Optimization

Usage stats queries use `LEFT JOIN` to avoid missing `routing_costs` entries:

```sql
SELECT 
  COUNT(DISTINCT rd.id) as query_count,
  COALESCE(SUM(rc.cost_usd), 0) as total_cost_usd
FROM routing_decisions rd
LEFT JOIN routing_costs rc ON rc.routing_decision_id = rd.id
WHERE rd.agent_selected = $1
```

### Component Optimization

- **AgentCard**: Wrapped in `React.memo` to prevent unnecessary re-renders
- **Event Handlers**: Use `useCallback` for stable function references

---

## Error Handling

### Agent Not Found

```typescript
import { AgentNotFoundError } from '@/lib/agents/types';

try {
  const agent = getAgentById('invalid-id');
} catch (error) {
  if (error instanceof AgentNotFoundError) {
    // Handle 404
  }
}
```

### Routing Errors

```typescript
import { RoutingError } from '@/lib/agents/types';

try {
  const decision = await routeQuery({ query: '...' });
} catch (error) {
  if (error instanceof RoutingError) {
    // Handle routing failure (LLM error, network issue)
  }
}
```

### Database Errors

Usage stats queries fail gracefully:

```typescript
const stats = await getAgentUsageStats('dojo');
// Returns null if query fails (logs warning, doesn't throw)
```

---

## Best Practices

### Agent Descriptions

✅ **Do:**
- Use clear, concise language
- List 3-5 specific use cases
- Explain what the agent **doesn't** do
- Keep descriptions under 3 sentences

❌ **Don't:**
- Use vague terms like "helps with stuff"
- Overlap capabilities with other agents
- Make promises the agent can't keep

### Routing Keywords

✅ **Do:**
- Use specific, unambiguous keywords
- Test with real user queries
- Fallback to LLM when keywords fail

❌ **Don't:**
- Add too many generic keywords (e.g., "help")
- Rely solely on keywords (LLM is more accurate)

### Cost Tracking

✅ **Do:**
- Track costs for all LLM calls
- Log token usage for debugging
- Monitor cost trends over time

❌ **Don't:**
- Skip cost tracking for "small" queries
- Ignore failed routing costs

---

## Future Enhancements

### v0.4.0+

- **Admin UI**: Edit agent descriptions without touching JSON
- **Search & Filter**: Find agents by name, description, or capability
- **Performance Charts**: Visualize cost and usage trends over time
- **Real-Time Stats**: WebSocket updates for live usage data
- **Registry Export**: Download `registry.json` for backup
- **Agent Reordering**: Drag-and-drop to prioritize agents

---

## Support

For questions or issues:

1. Check existing agent implementations (`dojo-handler.ts`, `librarian-handler.ts`)
2. Review test files for usage examples
3. Consult `JOURNAL.md` for architecture decisions
4. Open an issue in the repository

---

**Last Updated:** January 13, 2026  
**Version:** v0.3.11  
**Maintainer:** 11-11 Team
