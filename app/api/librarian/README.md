# Librarian API Endpoints

API routes for the Librarian Agent semantic search and embedding functionality.

## Overview

The Librarian API provides two main endpoints:
1. **Search** - Semantic search across prompts using vector embeddings
2. **Embed** - Generate embeddings for prompts

Both endpoints support:
- Dev mode authentication bypass (when `NEXT_PUBLIC_DEV_MODE=true`)
- NextAuth v5 session-based authentication (production)
- Request validation with Zod schemas
- Comprehensive error handling

---

## POST /api/librarian/search

Perform semantic search across prompts using vector similarity.

### Request

```json
{
  "query": "budget planning prompts",
  "filters": {
    "status": "active",
    "tags": ["finance", "planning"],
    "threshold": 0.7,
    "limit": 10
  }
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | ✅ | Search query (min 1 character) |
| `filters` | object | ❌ | Search filters (optional) |
| `filters.status` | string or array | ❌ | Filter by status: `"draft"`, `"active"`, `"archived"` or array of these |
| `filters.tags` | string[] | ❌ | Filter by tags (exact match) |
| `filters.threshold` | number | ❌ | Similarity threshold (0-1, default: 0.7) |
| `filters.limit` | number | ❌ | Max results (1-100, default: 10) |

### Response (200 OK)

```json
{
  "results": [
    {
      "id": "prompt_123",
      "title": "Monthly Budget Planning",
      "content": "...",
      "similarity": 0.92,
      "status": "active",
      "metadata": {
        "description": "Budget planning template",
        "tags": ["finance", "planning"],
        "author": "user@example.com",
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-13T12:00:00.000Z"
      }
    }
  ],
  "query": "budget planning prompts",
  "count": 5,
  "filters": {
    "status": "active",
    "tags": ["finance", "planning"],
    "threshold": 0.7,
    "limit": 10
  },
  "duration_ms": 245
}
```

### Error Responses

**400 Bad Request** - Invalid request body
```json
{
  "error": "Invalid request body",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "path": ["query"],
      "message": "Query cannot be empty"
    }
  ]
}
```

**401 Unauthorized** - No valid session (production only)
```json
{
  "error": "Unauthorized - no valid session"
}
```

**429 Too Many Requests** - Rate limit exceeded
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

**500 Internal Server Error** - Server error
```json
{
  "error": "Failed to execute search"
}
```

**503 Service Unavailable** - OpenAI API error
```json
{
  "error": "Failed to generate search embedding",
  "details": "OpenAI API connection failed"
}
```

---

## POST /api/librarian/embed

Generate embedding vector for a prompt.

### Request

```json
{
  "prompt_id": "prompt_123",
  "content": "This is my prompt content...",
  "session_id": "session_abc"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt_id` | string | ✅ | Unique prompt identifier (min 1 character) |
| `content` | string | ✅ | Prompt content to embed (min 1 character) |
| `session_id` | string | ❌ | Session ID for cost tracking |

### Response (200 OK)

```json
{
  "success": true,
  "prompt_id": "prompt_123",
  "embedding_generated": true,
  "tokens_used": 42,
  "cost_usd": 0.00000084,
  "model": "text-embedding-3-small"
}
```

### Error Responses

**400 Bad Request** - Invalid request
```json
{
  "error": "Invalid request body",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "path": ["content"],
      "message": "Content cannot be empty"
    }
  ]
}
```

Or:
```json
{
  "error": "Content cannot be empty"
}
```

**401 Unauthorized** - No valid session (production only)
```json
{
  "error": "Unauthorized - no valid session"
}
```

**404 Not Found** - Prompt not found
```json
{
  "error": "Prompt not found"
}
```

**429 Too Many Requests** - Rate limit exceeded
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

**500 Internal Server Error** - Server error
```json
{
  "error": "Failed to generate embedding"
}
```

**503 Service Unavailable** - OpenAI API error
```json
{
  "error": "Failed to generate embedding",
  "details": "OpenAI API key is not configured"
}
```

---

## Authentication

### Development Mode

When `NEXT_PUBLIC_DEV_MODE=true` in `.env.local`:
- Authentication is bypassed
- Uses mock user: `dev@11-11.dev`
- No session validation required

**Dev Mode Warning:**
```
[Librarian Search API] Running in dev mode with mock authentication
```

### Production Mode

When `NEXT_PUBLIC_DEV_MODE=false` or not set:
- Requires valid NextAuth v5 session
- User must be authenticated via Google OAuth
- Session email is used as `userId`

**Authentication Check:**
```typescript
const session = await auth();
if (!session || !session.user?.email) {
  return NextResponse.json(
    { error: 'Unauthorized - no valid session' },
    { status: 401 }
  );
}
```

---

## Testing

### Manual Testing with curl

**Search Endpoint:**
```bash
curl -X POST http://localhost:3000/api/librarian/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "budget planning",
    "filters": {
      "limit": 5,
      "threshold": 0.7
    }
  }'
```

**Embed Endpoint:**
```bash
curl -X POST http://localhost:3000/api/librarian/embed \
  -H "Content-Type: application/json" \
  -d '{
    "prompt_id": "test-001",
    "content": "This is a test prompt for embedding."
  }'
```

### Automated Testing

Run the API test suite:
```bash
# Start dev server in one terminal
npm run dev

# Run API tests in another terminal
npm run test:api
```

The test suite verifies:
- ✅ Valid requests return 200 OK
- ✅ Invalid requests return appropriate error codes
- ✅ Response format matches schema
- ✅ Dev mode authentication bypass works
- ✅ Error handling for edge cases

---

## Dependencies

**Required Environment Variables:**
- `OPENAI_API_KEY` - OpenAI API key (for embedding generation)
- `NEXT_PUBLIC_DEV_MODE` - Dev mode flag (optional, default: false)
- `NEXTAUTH_SECRET` - NextAuth secret (production only)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (production only)
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret (production only)

**Required Services:**
- PGlite database (for storing prompts and embeddings)
- OpenAI API (text-embedding-3-small model)
- NextAuth v5 (for authentication)

---

## Cost Tracking

Both endpoints integrate with the Cost Guard system:

**Search Cost:**
- Embedding generation: ~40 tokens @ $0.02/1M tokens
- Search query: <1ms database operation
- Total: ~$0.0000008 per search

**Embed Cost:**
- Embedding generation: Variable based on content length
- Average: 50-200 tokens @ $0.02/1M tokens
- Total: ~$0.000001-$0.000004 per prompt

Costs are automatically tracked in:
- `cost_records` table (individual operations)
- Cost Guard dashboard (aggregated metrics)
- User monthly budgets (budget enforcement)

---

## Related Files

- `/lib/librarian/search.ts` - Search implementation
- `/lib/librarian/embeddings.ts` - Embedding generation
- `/lib/librarian/vector.ts` - Vector operations
- `/lib/cost/tracking.ts` - Cost tracking
- `/lib/auth.ts` - NextAuth v5 configuration

---

## Error Handling

All endpoints follow consistent error handling patterns:

1. **Validation Errors (400)** - Invalid request format or parameters
2. **Authentication Errors (401)** - No valid session (production)
3. **Not Found Errors (404)** - Resource doesn't exist
4. **Rate Limit Errors (429)** - OpenAI rate limit exceeded
5. **Server Errors (500)** - Unexpected server errors
6. **Service Errors (503)** - External service (OpenAI) unavailable

Error responses always include:
- `error` field with human-readable message
- Optional `details` field with additional context
- Appropriate HTTP status code

---

## Version History

- **v0.3.3** - Initial Librarian API release
  - Search endpoint with semantic similarity
  - Embed endpoint with cost tracking
  - Dev mode authentication bypass
  - Comprehensive error handling
