# Librarian Agent - Semantic Search System

**Version:** v0.3.3  
**Author:** Dojo AI  
**Status:** Implementation Complete

---

## Overview

The Librarian Agent provides semantic search and retrieval capabilities across prompts using vector embeddings and cosine similarity. This implements the specialized agent pattern from Dataiku research, where agents have narrow, well-defined responsibilities.

**Key Features:**
- Vector-based semantic search using OpenAI embeddings
- Filtering by status, tags, and similarity threshold
- Search history tracking and analytics
- Performance optimized for <300ms search response time
- Proactive suggestion system for related content

---

## Architecture

### Components

```
lib/librarian/
├── search.ts          # Semantic search implementation
├── embeddings.ts      # OpenAI embedding generation
├── vector.ts          # Cosine similarity calculations
├── search.test.ts     # Comprehensive test suite
├── embeddings.test.ts # Embedding tests
└── vector.test.ts     # Vector operation tests
```

### Data Flow

```
User Query
    ↓
Generate Query Embedding (OpenAI)
    ↓
Fetch Prompts with Embeddings (PGlite)
    ↓
Calculate Cosine Similarity (JavaScript)
    ↓
Filter by Threshold & Tags
    ↓
Sort by Similarity (Descending)
    ↓
Track Search History
    ↓
Return Results
```

---

## Usage Examples

### Basic Semantic Search

```typescript
import { semanticSearch } from '@/lib/librarian/search';

const results = await semanticSearch(
  'budget planning prompts',
  'user_123',
  {
    threshold: 0.7,  // Minimum similarity score (0-1)
    limit: 10,       // Maximum results
  }
);

console.log(`Found ${results.count} results in ${results.duration_ms}ms`);
results.results.forEach(result => {
  console.log(`${result.title} (${(result.similarity * 100).toFixed(0)}% match)`);
});
```

### Search with Filters

```typescript
const results = await semanticSearch(
  'design system',
  'user_123',
  {
    status: 'active',           // Filter by status
    tags: ['design', 'ui'],     // Filter by tags
    threshold: 0.75,            // Higher threshold for better matches
    limit: 5,
  }
);
```

### Find Similar Prompts

```typescript
import { findSimilarPrompts } from '@/lib/librarian/search';

const similar = await findSimilarPrompts(
  'prompt_abc123',  // Source prompt ID
  'user_123',       // User ID
  5,                // Limit
  0.8               // Threshold
);

similar.forEach(prompt => {
  console.log(`${prompt.title} (${(prompt.similarity * 100).toFixed(0)}% similar)`);
});
```

### Recent Searches

```typescript
import { getRecentSearches } from '@/lib/librarian/search';

const recentSearches = await getRecentSearches('user_123', 10);
recentSearches.forEach(search => {
  console.log(`"${search.query}" - ${search.results_count} results`);
});
```

### Search Analytics

```typescript
import { getSearchAnalytics } from '@/lib/librarian/search';

const analytics = await getSearchAnalytics('user_123');
console.log(`Total searches: ${analytics.total_searches}`);
console.log(`Avg results per search: ${analytics.avg_results_per_search.toFixed(1)}`);
console.log(`Most common queries:`, analytics.most_common_queries);
```

---

## Embedding Generation

### Generate Embedding for New Prompt

```typescript
import { embedPrompt } from '@/lib/librarian/embeddings';

const result = await embedPrompt(
  'prompt_123',
  'Prompt content to embed',
  'user_123',
  'session_abc' // Optional session ID for cost tracking
);

console.log(`Embedding generated: ${result.tokens_used} tokens, $${result.cost_usd.toFixed(6)}`);
```

### Batch Embed Existing Prompts

```typescript
import { embedAllPrompts } from '@/lib/librarian/embeddings';

const result = await embedAllPrompts('user_123', 10); // Batch size: 10
console.log(`Embedded ${result.total_processed} prompts`);
console.log(`Total cost: $${result.total_cost_usd.toFixed(4)}`);
console.log(`Duration: ${(result.duration_ms / 1000).toFixed(1)}s`);
```

### Check if Prompt Has Embedding

```typescript
import { hasEmbedding } from '@/lib/librarian/embeddings';

const hasEmbed = await hasEmbedding('prompt_123');
if (!hasEmbed) {
  console.log('Prompt needs embedding');
}
```

### Refresh Embedding

```typescript
import { refreshEmbedding } from '@/lib/librarian/embeddings';

const result = await refreshEmbedding(
  'prompt_123',
  'Updated prompt content',
  'user_123'
);
```

---

## Performance Optimization

### Design Decisions

**1. JavaScript-based Cosine Similarity**
- PGlite doesn't support pgvector extension
- JavaScript calculation is faster for small datasets (<10K prompts)
- Reduces database query complexity

**2. In-Memory Filtering**
- Fetch all relevant prompts with embeddings
- Filter and rank in JavaScript
- Faster than complex SQL queries for local PGlite

**3. Embedding Storage**
- Embeddings stored as JSONB arrays
- GIN index for fast retrieval
- No external vector database needed

### Performance Targets

- **Search Response:** <300ms (p95)
- **Embedding Generation:** <500ms per prompt
- **Batch Embedding:** <2 minutes for 100 prompts

### Optimization Tips

```typescript
// Use higher thresholds to reduce results
const results = await semanticSearch('query', userId, { threshold: 0.85 });

// Limit results for faster processing
const results = await semanticSearch('query', userId, { limit: 5 });

// Pre-filter by status/tags to reduce dataset
const results = await semanticSearch('query', userId, {
  status: 'active',
  tags: ['specific-tag']
});
```

---

## Testing

### Run All Tests

```bash
npm run test:vector      # Vector operation tests
npm run test:embeddings  # Embedding generation tests
npm run test:search      # Semantic search tests
```

### Test Coverage

- **Vector Operations:** 16 tests (cosine similarity, ranking, validation)
- **Embeddings:** Embedding generation, batch processing, error handling
- **Search:** Semantic search, filtering, history, analytics

### Mock OpenAI (No API Key)

Tests automatically skip embedding generation if OpenAI is not available. Core search logic is still tested with pre-embedded data.

---

## Error Handling

### OpenAI API Errors

```typescript
try {
  const result = await embedPrompt(promptId, content, userId);
} catch (error) {
  if (error instanceof OpenAIAuthError) {
    console.error('Invalid API key');
  } else if (error instanceof OpenAIRateLimitError) {
    console.error('Rate limit exceeded - retry later');
  } else if (error instanceof OpenAITimeoutError) {
    console.error('Request timed out');
  }
}
```

### Search Errors

```typescript
try {
  const results = await semanticSearch(query, userId);
} catch (error) {
  console.error('Search failed:', error.message);
  // Return empty results
  return { results: [], count: 0 };
}
```

---

## Cost Tracking Integration

All embedding operations are automatically tracked in Cost Guard:

```typescript
// Embeddings are tracked as 'search' operations
await embedPrompt(promptId, content, userId, sessionId);

// Check costs in Cost Guard dashboard
// Model: text-embedding-3-small
// Price: $0.02 per 1M tokens
```

---

## Database Schema

### Prompts Table

```sql
ALTER TABLE prompts ADD COLUMN embedding JSONB DEFAULT NULL;
CREATE INDEX idx_prompts_embedding ON prompts USING GIN(embedding);
```

### Search History Table

```sql
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  filters JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## API Reference

### `semanticSearch(query, userId, filters?)`

Perform semantic search across prompts.

**Parameters:**
- `query` (string): Search query
- `userId` (string): User ID (search scoped to user)
- `filters` (object, optional):
  - `status` (PromptStatus | PromptStatus[]): Filter by status
  - `tags` (string[]): Filter by tags
  - `threshold` (number): Minimum similarity (0-1, default: 0.7)
  - `limit` (number): Maximum results (default: 10)

**Returns:** `Promise<SearchResponse>`

### `findSimilarPrompts(promptId, userId, limit?, threshold?)`

Find prompts similar to a given prompt.

**Parameters:**
- `promptId` (string): Source prompt ID
- `userId` (string): User ID
- `limit` (number, optional): Maximum results (default: 5)
- `threshold` (number, optional): Minimum similarity (default: 0.75)

**Returns:** `Promise<SearchResult[]>`

### `getRecentSearches(userId, limit?)`

Get recent search queries.

**Parameters:**
- `userId` (string): User ID
- `limit` (number, optional): Maximum searches (default: 10)

**Returns:** `Promise<SearchHistoryRow[]>`

### `getSearchAnalytics(userId)`

Get search analytics.

**Parameters:**
- `userId` (string): User ID

**Returns:** `Promise<{ total_searches, avg_results_per_search, most_common_queries }>`

---

## Future Enhancements

- **Advanced Filters:** Date range, author, version
- **Full-Text Search:** Combine with vector search for hybrid results
- **Search Analytics Dashboard:** Visualize search patterns
- **Collaborative Filtering:** Use behavior to improve relevance
- **Cross-Project Search:** Search across multiple projects

---

## References

- **Dataiku Research:** Specialized Agent Pattern
- **OpenAI Embeddings:** text-embedding-3-small model
- **PGlite:** Local PostgreSQL with JSONB support
- **Excellence Criteria:** v0.3.0 Framework (Stability, Research Integration, Depth)

---

**Last Updated:** January 13, 2026  
**Next Steps:** Integrate with Supervisor Router, Build Librarian UI
