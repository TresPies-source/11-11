# Librarian Agent Handler

The Librarian Agent is a specialized search and retrieval agent within the Dojo Genesis multi-agent system. It handles semantic search queries, provides proactive suggestions, and integrates with the Supervisor Router for intelligent query routing.

## Architecture

### Core Components

1. **Handler Module** (`librarian-handler.ts`)
   - Main entry point for Librarian agent
   - Processes search queries
   - Tracks costs via Cost Guard
   - Generates proactive suggestions

2. **API Endpoint** (`/api/agents/librarian`)
   - RESTful interface for direct invocation
   - Authentication and validation
   - JSON and text response formats

3. **Integration Points**
   - **Supervisor Router**: Routes "search" queries to Librarian
   - **Handoff System**: Supports handoffs to/from other agents
   - **Cost Guard**: Tracks embedding and search costs
   - **Semantic Search**: Uses vector embeddings for similarity matching

## Key Functions

### `handleLibrarianQuery(query: LibrarianQuery): Promise<LibrarianResponse>`

Main handler function that processes search queries.

**Input:**
```typescript
{
  query: string;              // User search query
  conversationContext: ChatMessage[];  // Chat history
  sessionId: string;          // Session identifier
  userId?: string;            // User identifier (optional)
  filters?: SearchFilters;    // Search filters (optional)
}
```

**Output:**
```typescript
{
  results: SearchResult[];    // Search results with similarity scores
  query: string;              // Cleaned search query
  count: number;              // Number of results
  filters: SearchFilters;     // Applied filters
  duration_ms: number;        // Search duration
  suggestion?: ProactiveSuggestion;  // Optional suggestion
  cost?: {                    // Optional cost tracking
    tokens_used: number;
    cost_usd: number;
  };
}
```

**Example:**
```typescript
const response = await handleLibrarianQuery({
  query: 'search for budget planning prompts',
  conversationContext: [],
  sessionId: 'session-123',
  userId: 'user-456',
});

console.log(`Found ${response.count} results in ${response.duration_ms}ms`);
```

### `extractSearchQuery(userQuery: string): string`

Extracts clean search query from user input by removing common prefixes.

**Examples:**
- `"search for budget planning"` → `"budget planning"`
- `"find financial goals"` → `"financial goals"`
- `"show me recent prompts"` → `"recent prompts"`

### `generateProactiveSuggestion(results, sessionId): Promise<ProactiveSuggestion | undefined>`

Generates contextual suggestions based on search results.

**Suggestion Types:**
- **similar_prompt**: High-quality match (>85% similarity)
- **recent_work**: Moderate results suggest recent activity
- **related_seed**: No suggestion if low-quality results

### `formatLibrarianResponse(response): string`

Formats search results for human-readable display in chat.

**Example Output:**
```
Found 3 results for "budget planning":

1. **Monthly Budget Planning** (92% match)
   Complete guide to monthly budget planning

2. **Budget Tracking Template** (85% match)
   Track your budget over time

3. **Financial Goals Setting** (78% match)
   Set and achieve financial goals

💡 Suggestion: 92% match - highly relevant - "Monthly Budget Planning"
```

## Integration with Supervisor Router

### Routing Logic

The Supervisor Router automatically routes queries to the Librarian when:

1. **Search Keywords**: Query contains "search", "find", "lookup", "retrieve", "discover", "similar"
2. **User Intent**: User asks "what did I build before?" or "show me X"
3. **Explicit Request**: User explicitly mentions searching or finding

**Example Routing:**
```typescript
// Query: "search for budget prompts"
const routingDecision = await routeWithFallback({
  query: 'search for budget prompts',
  conversation_context: [],
  session_id: 'session-123',
  available_agents: getAvailableAgents(),
});

// routingDecision.agent_id === 'librarian'
```

### Handoff Flow

#### From Dojo to Librarian

When a user starts with general conversation (Dojo) and then requests search:

```typescript
const handoffContext: HandoffContext = {
  session_id: 'session-123',
  from_agent: 'dojo',
  to_agent: 'librarian',
  reason: 'User requested search functionality',
  conversation_history: messages,
  user_intent: 'search for budget prompts',
  harness_trace_id: 'trace-456',
};

await executeHandoff(handoffContext);
// Librarian agent is invoked with preserved context
```

#### From Librarian to Dojo

When search is complete and user wants thinking partnership:

```typescript
const handoffContext: HandoffContext = {
  session_id: 'session-123',
  from_agent: 'librarian',
  to_agent: 'dojo',
  reason: 'User needs thinking partnership',
  conversation_history: messages,
  user_intent: 'explore perspectives on budget planning',
  harness_trace_id: 'trace-789',
};

await executeHandoff(handoffContext);
// Dojo agent is invoked with search context preserved
```

## Cost Tracking

The Librarian integrates with Cost Guard to track:

1. **Embedding Generation**: Costs for generating query embeddings
2. **Token Usage**: Text-embedding-3-small model tokens
3. **Session Costs**: Aggregated costs per session

**Cost Breakdown:**
```typescript
{
  tokens_used: 150,        // Tokens for query embedding
  cost_usd: 0.000003,      // $0.02/1M tokens for text-embedding-3-small
}
```

## API Endpoint

### POST `/api/agents/librarian`

Execute a search query.

**Request:**
```json
{
  "query": "search for budget planning prompts",
  "session_id": "session-123",
  "conversation_context": [
    {
      "role": "user",
      "content": "I need help with budgeting",
      "agent_id": "dojo"
    }
  ],
  "filters": {
    "status": "active",
    "tags": ["finance"],
    "threshold": 0.8,
    "limit": 10
  },
  "format": "json"
}
```

**Response (JSON format):**
```json
{
  "results": [
    {
      "id": "prompt-123",
      "title": "Monthly Budget Planning",
      "content": "How to plan a monthly budget...",
      "similarity": 0.92,
      "status": "active",
      "metadata": {
        "description": "Budget planning guide",
        "tags": ["finance", "planning"],
        "author": "user-456",
        "created_at": "2026-01-10T12:00:00Z",
        "updated_at": "2026-01-13T10:30:00Z"
      }
    }
  ],
  "query": "budget planning prompts",
  "count": 1,
  "filters": {
    "status": "active",
    "tags": ["finance"],
    "threshold": 0.8,
    "limit": 10
  },
  "duration_ms": 150,
  "suggestion": {
    "type": "similar_prompt",
    "title": "Monthly Budget Planning",
    "description": "92% match - highly relevant",
    "action": "View",
    "target_id": "prompt-123"
  },
  "cost": {
    "tokens_used": 150,
    "cost_usd": 0.000003
  }
}
```

**Response (Text format):**
```json
{
  "message": "Found 1 result for \"budget planning prompts\":\n\n1. **Monthly Budget Planning** (92% match)\n   Budget planning guide\n\n💡 Suggestion: 92% match - highly relevant - \"Monthly Budget Planning\"",
  "metadata": {
    "count": 1,
    "duration_ms": 150,
    "cost": {
      "tokens_used": 150,
      "cost_usd": 0.000003
    }
  }
}
```

### GET `/api/agents/librarian`

Get agent information and capabilities.

**Response:**
```json
{
  "agent": "librarian",
  "version": "1.0.0",
  "description": "Semantic search and retrieval agent",
  "capabilities": [
    "Semantic search across prompts",
    "Proactive suggestions",
    "Conversation context integration",
    "Cost tracking"
  ],
  "endpoints": {
    "POST": {
      "description": "Execute a search query",
      "parameters": {
        "query": "string (required) - Search query",
        "session_id": "string (required) - Session identifier",
        "conversation_context": "array (optional) - Chat history",
        "filters": "object (optional) - Search filters",
        "format": "string (optional) - Response format: json|text"
      }
    }
  }
}
```

## Testing

### Unit Tests

Run Librarian handler tests:
```bash
npm run test:librarian-handler
```

**Test Coverage:**
- ✓ Query extraction
- ✓ Conversation context extraction
- ✓ Search execution (requires OpenAI key)
- ✓ Response formatting
- ✓ Empty query handling
- ✓ Filter application
- ✓ Agent invocation

### Integration Tests

Run routing integration tests:
```bash
npm run test:librarian-routing
```

**Test Coverage:**
- ✓ Routing "search" queries to Librarian
- ✓ Routing "find" queries to Librarian
- ✓ Routing general queries to Dojo
- ✓ Handoff from Dojo to Librarian
- ✓ Handoff from Librarian to Dojo
- ✓ Context preservation
- ✓ Cost tracking

## Error Handling

### LibrarianError

Custom error class for Librarian-specific errors:

```typescript
class LibrarianError extends Error {
  constructor(
    message: string,
    code?: string,
    details?: unknown
  );
}
```

**Error Codes:**
- `EMPTY_QUERY`: Search query is empty after cleaning
- `SEARCH_FAILED`: Semantic search execution failed

**Example:**
```typescript
try {
  await handleLibrarianQuery({ query: '   ', ... });
} catch (error) {
  if (error instanceof LibrarianError && error.code === 'EMPTY_QUERY') {
    console.error('Query is empty');
  }
}
```

## Performance Targets

- **Search Response**: <300ms (p95)
- **Embedding Generation**: <500ms per query
- **API Response**: <400ms total (embedding + search + formatting)

## Future Enhancements

- [ ] Advanced filters (date range, author)
- [ ] Full-text search (in addition to semantic)
- [ ] Search analytics dashboard
- [ ] Collaborative filtering (user behavior)
- [ ] Cross-project search
- [ ] Search history autocomplete
- [ ] Saved searches

## Examples

### Example 1: Basic Search

```typescript
import { handleLibrarianQuery } from '@/lib/agents/librarian-handler';

const response = await handleLibrarianQuery({
  query: 'find budget planning prompts',
  conversationContext: [],
  sessionId: 'session-123',
});

console.log(`Found ${response.count} results`);
response.results.forEach((result) => {
  console.log(`- ${result.title} (${(result.similarity * 100).toFixed(0)}% match)`);
});
```

### Example 2: Search with Filters

```typescript
const response = await handleLibrarianQuery({
  query: 'financial prompts',
  conversationContext: [],
  sessionId: 'session-123',
  filters: {
    status: 'active',
    tags: ['finance', 'planning'],
    threshold: 0.8,
    limit: 5,
  },
});
```

### Example 3: Handoff Integration

```typescript
import { executeHandoff } from '@/lib/agents/handoff';

await executeHandoff({
  session_id: 'session-123',
  from_agent: 'dojo',
  to_agent: 'librarian',
  reason: 'User requested search',
  conversation_history: messages,
  user_intent: 'search for budget prompts',
  harness_trace_id: 'trace-123',
});
```

## Troubleshooting

### No Results Found

**Problem**: Search returns 0 results despite relevant prompts existing.

**Solutions:**
1. Check if prompts have embeddings: `SELECT COUNT(*) FROM prompts WHERE embedding IS NOT NULL`
2. Lower similarity threshold: `filters: { threshold: 0.6 }`
3. Verify embedding generation is working: Check OpenAI API key
4. Try broader search terms

### Slow Search Performance

**Problem**: Search takes >500ms consistently.

**Solutions:**
1. Check database query performance
2. Ensure IVFFlat index exists (not used in PGlite, but in production)
3. Reduce result limit: `filters: { limit: 5 }`
4. Profile embedding generation time

### Cost Tracking Not Working

**Problem**: Cost data not recorded in database.

**Solutions:**
1. Verify `userId` is provided in `LibrarianQuery`
2. Check Cost Guard configuration
3. Verify database schema includes cost tables
4. Check console logs for cost tracking errors

---

**Version**: 1.0.0  
**Last Updated**: January 13, 2026  
**Author**: Manus AI (Dojo)
