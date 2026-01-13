# Auto-Embedding System

Automatic embedding generation for prompts in the Librarian Agent.

---

## Overview

The auto-embedding system automatically generates vector embeddings when prompts are created or updated. This ensures that all prompts are searchable via semantic search without manual intervention.

**Key Features:**
- ✅ Auto-generate embeddings on prompt creation
- ✅ Auto-refresh embeddings on prompt updates
- ✅ Configurable behavior (enable/disable)
- ✅ Non-blocking (async execution)
- ✅ Error resilient (failures don't break prompt operations)
- ✅ Batch embedding for existing prompts

---

## How It Works

### 1. Auto-Embedding on Create

When a new prompt is created via `createPrompt()`, the system automatically:
1. Saves the prompt to the database
2. Asynchronously generates an embedding using OpenAI API
3. Updates the prompt with the embedding
4. Tracks the cost in Cost Guard

**Code Example:**
```typescript
import { createPrompt } from '@/lib/pglite/prompts';

// Create a prompt
const prompt = await createPrompt({
  user_id: 'user_123',
  title: 'Budget Planning',
  content: 'Help me create a monthly budget plan',
  status: 'draft',
});

// Embedding is generated automatically in the background!
// No additional code needed.
```

### 2. Auto-Embedding on Update

When a prompt is updated via `updatePrompt()`, the system:
1. Checks if content was changed
2. If yes, regenerates the embedding
3. If no, skips (configurable)

**Code Example:**
```typescript
import { updatePrompt } from '@/lib/pglite/prompts';

// Update prompt content
await updatePrompt('prompt_123', {
  content: 'Help me create a quarterly budget plan',
});

// Embedding is refreshed automatically!
```

### 3. Configuration

Control auto-embedding behavior:

```typescript
import { configureAutoEmbed } from '@/lib/librarian/auto-embed';

// Disable auto-embedding on create
configureAutoEmbed({ onCreate: false });

// Disable auto-embedding on update
configureAutoEmbed({ onUpdate: false });

// Always refresh embeddings (even if content unchanged)
configureAutoEmbed({ onlyIfContentChanged: false });

// Check if auto-embedding is enabled
import { isAutoEmbedEnabled } from '@/lib/librarian/auto-embed';
console.log(isAutoEmbedEnabled('create')); // true or false
```

---

## Batch Embedding

For existing prompts without embeddings, use the batch embedding script.

### Usage

**Basic:**
```bash
npm run batch-embed user_123
```

**With Options:**
```bash
npm run batch-embed user_123 -- --batch-size=5
npm run batch-embed user_123 -- --dry-run
npm run batch-embed user_123 -- --batch-size=10 --dry-run
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--batch-size=N` | Prompts per batch | 10 |
| `--dry-run` | Show stats without executing | false |
| `--help` | Show help message | - |

### Example Output

```
╔════════════════════════════════════════════════════════════╗
║          Batch Embedding Script for Librarian Agent       ║
╚════════════════════════════════════════════════════════════╝

📋 Configuration:
   User ID:      user_123
   Batch Size:   10
   Dry Run:      No

📊 Statistics:
   Total Prompts:            150
   With Embedding:           50
   Without Embedding:        100

💰 Estimates:
   Estimated Cost:           $0.0010
   Estimated Time:           50.0s (0.8m)

🚀 Starting batch embedding...

[BATCH_EMBEDDING] Progress: 10/100 (10.0%)
[BATCH_EMBEDDING] Progress: 20/100 (20.0%)
...
[BATCH_EMBEDDING] Progress: 100/100 (100.0%)

╔════════════════════════════════════════════════════════════╗
║                    Batch Embedding Complete                ║
╚════════════════════════════════════════════════════════════╝

✅ Results:
   Processed:          100/100
   Total Tokens:       50,000
   Total Cost:         $0.0010
   Duration:           45.2s (0.8m)
   Performance:        2.2 prompts/sec

✅ Performance target met! (45.2s ≤ 120.0s)
```

---

## Performance

### Targets
- **Batch Embedding:** <2 minutes for 100 prompts
- **Individual Embedding:** <500ms per prompt
- **Search Query:** <300ms

### Optimization Tips

1. **Batch Size:** Use 5-10 prompts per batch to avoid rate limits
2. **Network:** Fast internet connection improves performance
3. **OpenAI Tier:** Higher tier = higher rate limits = faster batches

---

## Error Handling

The auto-embedding system is designed to be resilient:

### Non-Blocking
Embedding failures don't break prompt creation/update:
```typescript
// This succeeds even if embedding fails
const prompt = await createPrompt({ ... });
console.log(prompt); // Prompt exists, embedding might be null
```

### Retry Logic
Embeddings automatically retry on:
- Rate limit errors (3 attempts with exponential backoff)
- Timeout errors (3 attempts with exponential backoff)

### Logging
All errors are logged but not thrown:
```
[AUTO_EMBED] Failed to embed prompt abc123: Rate limit exceeded
[AUTO_EMBED] Failed to refresh embedding for xyz789: Timeout
```

### Manual Recovery
If auto-embedding fails, use batch script:
```bash
npm run batch-embed user_123
```

---

## API Reference

### `autoEmbedOnCreate(promptId, content, userId, sessionId?)`

Auto-generate embedding for new prompt.

**Parameters:**
- `promptId` (string) - Prompt ID
- `content` (string) - Prompt content
- `userId` (string) - User ID for cost tracking
- `sessionId` (string, optional) - Session ID for cost tracking

**Returns:** `Promise<void>`

**Example:**
```typescript
await autoEmbedOnCreate('prompt_123', 'Help me...', 'user_456');
```

---

### `autoEmbedOnUpdate(promptId, newContent, userId, sessionId?)`

Auto-refresh embedding for updated prompt.

**Parameters:**
- `promptId` (string) - Prompt ID
- `newContent` (string | undefined) - New content (undefined if unchanged)
- `userId` (string) - User ID for cost tracking
- `sessionId` (string, optional) - Session ID for cost tracking

**Returns:** `Promise<void>`

**Example:**
```typescript
await autoEmbedOnUpdate('prompt_123', 'Updated content', 'user_456');
```

---

### `configureAutoEmbed(config)`

Configure auto-embedding behavior.

**Parameters:**
- `config` (Partial<AutoEmbedConfig>) - Configuration object
  - `onCreate` (boolean) - Enable on create
  - `onUpdate` (boolean) - Enable on update
  - `onlyIfContentChanged` (boolean) - Only refresh if content changed

**Returns:** `void`

**Example:**
```typescript
configureAutoEmbed({ onCreate: false });
```

---

### `getAutoEmbedConfig()`

Get current configuration.

**Returns:** `AutoEmbedConfig`

**Example:**
```typescript
const config = getAutoEmbedConfig();
console.log(config.onCreate); // true or false
```

---

### `isAutoEmbedEnabled(operation)`

Check if auto-embedding is enabled.

**Parameters:**
- `operation` ('create' | 'update') - Operation type

**Returns:** `boolean`

**Example:**
```typescript
if (isAutoEmbedEnabled('create')) {
  console.log('Auto-embedding on create is enabled');
}
```

---

## Cost Tracking

All embedding operations are tracked in Cost Guard:

```typescript
{
  user_id: 'user_123',
  session_id: 'sess_abc',
  query_id: null,
  model: 'text-embedding-3-small',
  prompt_tokens: 500,
  completion_tokens: 0,
  total_tokens: 500,
  cost_usd: 0.00001,
  operation_type: 'search',
}
```

**Embedding Costs:**
- Model: `text-embedding-3-small`
- Rate: $0.02 per 1M tokens
- Avg prompt: ~500 tokens = $0.00001

---

## Testing

### Unit Tests
```bash
npm run test:auto-embed
```

### Integration Tests
Create and update prompts, then check embeddings:
```typescript
import { createPrompt, getPromptById } from '@/lib/pglite/prompts';

// Create prompt
const prompt = await createPrompt({ ... });

// Wait for embedding (async)
await new Promise(resolve => setTimeout(resolve, 1000));

// Check embedding
const updated = await getPromptById(prompt.id);
console.log(updated.embedding); // Should be array of 1536 numbers
```

---

## Troubleshooting

### Embeddings Not Generated

**Problem:** New prompts don't have embeddings.

**Solutions:**
1. Check OpenAI API key: `OPENAI_API_KEY` in `.env.local`
2. Check auto-embed config: `isAutoEmbedEnabled('create')`
3. Check logs for errors: `[AUTO_EMBED]` prefix
4. Run batch script manually: `npm run batch-embed user_123`

---

### Batch Embedding Fails

**Problem:** Batch script shows errors.

**Solutions:**
1. Reduce batch size: `--batch-size=5`
2. Check rate limits on OpenAI dashboard
3. Check network connection
4. Retry failed prompts (script is safe to re-run)

---

### Performance Issues

**Problem:** Batch embedding takes too long.

**Solutions:**
1. Increase batch size (if no rate limits): `--batch-size=20`
2. Check network latency
3. Upgrade OpenAI tier for higher rate limits
4. Run during off-peak hours

---

## Best Practices

### 1. Enable Auto-Embedding
Leave auto-embedding enabled for best UX:
```typescript
configureAutoEmbed({ onCreate: true, onUpdate: true });
```

### 2. Run Batch Script After Migration
After schema migration, embed existing prompts:
```bash
npm run batch-embed user_123
```

### 3. Monitor Costs
Check Cost Guard dashboard for embedding costs.

### 4. Handle Errors Gracefully
Auto-embedding failures are logged, not thrown. Check logs regularly.

### 5. Test Before Production
Run `npm run test:auto-embed` before deploying.

---

## Technical Details

### Implementation
- **Hooks:** `autoEmbedOnCreate`, `autoEmbedOnUpdate`
- **Integration:** `lib/pglite/prompts.ts` (createPrompt, updatePrompt)
- **Async:** Non-blocking Promise execution
- **Error Handling:** try-catch with logging

### Database Schema
```sql
ALTER TABLE prompts ADD COLUMN embedding TEXT;
```

Embeddings stored as JSON string:
```json
"[0.123, 0.456, ..., 0.789]"
```

### OpenAI API
- **Model:** `text-embedding-3-small`
- **Dimensions:** 1536
- **Cost:** $0.02 / 1M tokens
- **Retry:** 3 attempts with exponential backoff

---

## See Also

- [Embedding Service](./EMBEDDINGS.md) - Low-level embedding generation
- [Semantic Search](./SEARCH.md) - Search using embeddings
- [Cost Guard](../cost/COST_GUARD.md) - Cost tracking system
- [Batch Script](../../scripts/batch-embed-prompts.ts) - CLI tool source code

---

**Version:** v0.3.3  
**Author:** Librarian Agent Team  
**Last Updated:** 2026-01-13
