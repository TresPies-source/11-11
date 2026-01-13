# LLM System Documentation

Developer documentation for 11-11's multi-model LLM infrastructure.

---

## Overview

The LLM system provides a unified interface for interacting with multiple AI providers (DeepSeek, OpenAI) with automatic model selection, cost tracking, and fallback handling.

### Key Features

- **Multi-provider support:** DeepSeek (primary), OpenAI (fallback)
- **Automatic model selection:** Agent-specific model routing
- **Cost optimization:** Prompt caching, intelligent model selection
- **Graceful degradation:** Automatic fallback to GPT-4o-mini on errors
- **Full observability:** Integrated with Harness Trace and Cost Guard

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Application Layer                  │
│              (Agents, API Routes, Hooks)             │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                    LLM Client Layer                  │
│  - Multi-provider client management                  │
│  - Automatic fallback handling                       │
│  - Cost tracking integration                         │
│  - Trace logging integration                         │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                  Model Registry Layer                │
│  - Model configurations                              │
│  - Agent-to-model mapping                            │
│  - Pricing information                               │
│  - Capability metadata                               │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                   Provider APIs                      │
│        DeepSeek API   │   OpenAI API                │
└─────────────────────────────────────────────────────┘
```

---

## DeepSeek Models

11-11 uses a **two-tier DeepSeek strategy** optimized for different task complexities.

### deepseek-chat (Default)

**Best for:** General agent tasks, routing, search, Q&A

**Specifications:**
- Context window: 128,000 tokens
- Max output: 8,000 tokens
- Latency: <500ms (p95)
- Pricing:
  - Input: $0.28/1M tokens
  - Input (cached): $0.028/1M tokens (90% cheaper!)
  - Output: $0.42/1M tokens

**Capabilities:**
- JSON mode
- Function calling / tool use
- Chat prefix support
- Streaming

**When to use:**
- Supervisor routing decisions
- Librarian search intent extraction
- Cost Guard budget calculations
- Dojo hint generation
- General chat and Q&A

**Example use case:**
```typescript
import { llmClient } from '@/lib/llm/client';
import { getModelForAgent } from '@/lib/llm/registry';

const model = getModelForAgent('supervisor');
const response = await llmClient.call(model, [
  { role: 'system', content: 'You are a routing agent.' },
  { role: 'user', content: 'Find prompts about React hooks' }
]);
```

---

### deepseek-reasoner (Complex Tasks)

**Best for:** Complex reasoning, debugging, mathematical proofs

**Specifications:**
- Context window: 128,000 tokens
- Max output: 64,000 tokens (8x larger than chat)
- Latency: ~3000ms (p95) - includes reasoning time
- Pricing: Same as deepseek-chat, but uses more output tokens

**Capabilities:**
- All deepseek-chat capabilities
- **Extended thinking:** Built-in chain-of-thought reasoning
- Longer output sequences

**When to use:**
- Debugger Agent tasks (analyzing complex bugs)
- Multi-step reasoning workflows
- Mathematical proofs or complex calculations
- Deep code analysis

**When NOT to use:**
- Simple routing decisions (use deepseek-chat)
- Fast response requirements (use deepseek-chat)
- Budget-constrained queries (use deepseek-chat)

**Example use case:**
```typescript
import { llmClient } from '@/lib/llm/client';
import { getModelForAgent } from '@/lib/llm/registry';

const model = getModelForAgent('debugger');
const response = await llmClient.call(model, [
  { role: 'system', content: 'You are a debugging agent.' },
  { role: 'user', content: 'Analyze this React rendering bug...' }
]);
```

---

## Model Selection

The system automatically selects the optimal model based on the agent type.

### Agent-to-Model Mapping

```typescript
export function getModelForAgent(agentName: string): string {
  const agentModelMap: Record<string, string> = {
    supervisor: 'deepseek-chat',      // Fast routing
    librarian: 'deepseek-chat',       // Search intent extraction
    'cost-guard': 'deepseek-chat',    // Budget calculations
    dojo: 'deepseek-chat',            // Hint generation
    debugger: 'deepseek-reasoner',    // Deep analysis
  };
  
  return agentModelMap[agentName] || 'deepseek-chat';
}
```

### Usage Examples

#### Basic Usage (Manual Model Selection)

```typescript
import { llmClient } from '@/lib/llm/client';

const response = await llmClient.call(
  'deepseek-chat',
  [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the weather?' }
  ]
);

console.log(response.content);
console.log(`Cost: $${calculateCost('deepseek-chat', response.usage)}`);
```

#### Agent-Based Selection (Recommended)

```typescript
import { llmClient } from '@/lib/llm/client';
import { getModelForAgent } from '@/lib/llm/registry';

const agentName = 'supervisor';
const model = getModelForAgent(agentName);

const response = await llmClient.call(model, messages);
```

#### Automatic Fallback

```typescript
import { llmClient } from '@/lib/llm/client';

const response = await llmClient.callWithFallback(
  'supervisor',
  messages
);
```

This will:
1. Try `deepseek-chat` (optimal model for supervisor)
2. Fall back to `gpt-4o-mini` on error
3. Log handoff events to Harness Trace
4. Track costs in Cost Guard

#### JSON Mode

```typescript
import { llmClient } from '@/lib/llm/client';

interface RoutingDecision {
  agent: string;
  confidence: number;
  reasoning: string;
}

const { data, usage } = await llmClient.createJSONCompletion<RoutingDecision>(
  'deepseek-chat',
  [
    {
      role: 'system',
      content: 'Return a JSON object with agent, confidence, and reasoning.'
    },
    { role: 'user', content: query }
  ]
);

console.log(data.agent);
console.log(data.confidence);
```

---

## Cost Optimization

### Prompt Caching

DeepSeek models support aggressive prompt caching that reduces input costs by **90%** for cached tokens.

**How it works:**
- First request: $0.28/1M input tokens
- Subsequent requests with same prefix: $0.028/1M cached tokens
- Cache TTL: ~5 minutes

**Best practices:**
1. **Reuse system prompts:** Keep system messages consistent across calls
2. **Batch similar requests:** Group queries to maximize cache hits
3. **Use chat prefix capability:** DeepSeek optimizes for conversation continuity

### Cost Comparison

| Scenario | GPT-4o-mini | DeepSeek-Chat | Savings |
|----------|-------------|---------------|---------|
| **No caching** | $0.113/1K | $0.196/1K | -73% ❌ |
| **50% cache hit** | $0.113/1K | $0.046/1K | **+59%** ✅ |
| **90% cache hit** | $0.113/1K | $0.018/1K | **+84%** ✅ |

**Real-world cache hit rates:** 60-80% for repeated agent tasks

### When DeepSeek is Cheaper

DeepSeek becomes cost-effective at approximately **40% cache hit rate**:

```
Break-even point:
0.28 * (1 - cache_rate) + 0.028 * cache_rate < 0.15 (GPT-4o-mini)
cache_rate > 0.38 (38%)
```

**Recommendation:** Use DeepSeek for:
- Agents with consistent system prompts (supervisor, librarian)
- Repeated tasks with similar context
- Long-running sessions with conversation history

---

## Error Handling

The LLM system provides structured error handling with automatic retries and fallback.

### Error Types

```typescript
import { 
  LLMError,           // Base error
  LLMAuthError,       // 401 Unauthorized
  LLMRateLimitError,  // 429 Too Many Requests
  LLMTimeoutError     // 408 Request Timeout
} from '@/lib/llm/types';
```

### Example Error Handling

```typescript
import { llmClient } from '@/lib/llm/client';
import { LLMAuthError, LLMRateLimitError } from '@/lib/llm/types';

try {
  const response = await llmClient.call('deepseek-chat', messages);
} catch (error) {
  if (error instanceof LLMAuthError) {
    console.error('Invalid API key. Check DEEPSEEK_API_KEY.');
  } else if (error instanceof LLMRateLimitError) {
    console.error('Rate limit exceeded. Retry with exponential backoff.');
  } else {
    console.error('Unknown LLM error:', error);
  }
}
```

### Automatic Fallback Strategy

1. **Primary model fails:** Try fallback model (`gpt-4o-mini`)
2. **Log handoff event:** Record in Harness Trace
3. **Track costs:** Both attempts logged to Cost Guard
4. **Preserve context:** Original messages forwarded to fallback

```typescript
const response = await llmClient.callWithFallback('supervisor', messages);
```

---

## Dev Mode

When running without API keys, the system operates in **dev mode**.

### Detection

```typescript
import { isDevMode, hasValidAPIKey, canUseProvider } from '@/lib/llm/client';

if (isDevMode()) {
  console.log('Running in dev mode - some features disabled');
}

if (!hasValidAPIKey('deepseek')) {
  console.warn('DeepSeek API key not configured');
}

if (canUseProvider('openai')) {
  console.log('OpenAI provider available');
}
```

### Dev Mode Behavior

- **Supervisor:** Falls back to keyword-based routing (no LLM calls)
- **Librarian:** Uses keyword search instead of semantic search
- **Cost Guard:** Disabled (no cost tracking)
- **Harness Trace:** Still active (logs keyword routing decisions)

---

## Testing

### Unit Tests

```bash
# Run all LLM tests (32 tests)
npm run test:llm

# Run registry tests only (17 tests)
npm run test:llm-registry

# Run client tests only (15 tests)
npm run test:llm-client
```

### Manual Testing

```bash
# Test supervisor routing with DeepSeek
npm run dev
# Navigate to http://localhost:3000
# Create new chat session
# Check browser console for model selection logs

# Test cost tracking
# Navigate to cost dashboard
# Verify deepseek-chat costs appear
```

### Integration Testing

```bash
# Test DeepSeek API integration
npx tsx scripts/test-supervisor-deepseek.ts

# Test fallback behavior
npx tsx scripts/test-dev-mode-fallback.ts

# Performance benchmarks
npx tsx scripts/test-llm-performance.ts
```

---

## Configuration

### Environment Variables

```env
# DeepSeek API (Primary Provider)
DEEPSEEK_API_KEY=sk-your-deepseek-key-here

# OpenAI API (Fallback Provider + Embeddings)
OPENAI_API_KEY=sk-your-openai-key-here

# Dev Mode (optional)
NEXT_PUBLIC_DEV_MODE=true  # Enables keyword fallback
```

### Model Registry

To add a new model, update `lib/llm/registry.ts`:

```typescript
export const MODEL_REGISTRY: Record<string, ModelConfig> = {
  'new-model': {
    provider: 'deepseek',
    baseURL: 'https://api.deepseek.com',
    model: 'new-model',
    contextWindow: 128000,
    maxOutput: 8000,
    cost: {
      input: 0.28,
      inputCached: 0.028,
      output: 0.42,
    },
    capabilities: {
      json: true,
      tools: true,
    },
    recommendedFor: ['agent-name'],
  },
};
```

---

## Observability

### Harness Trace Integration

All LLM calls are automatically logged to Harness Trace:

```typescript
// Automatically logged events:
// 1. TOOL_INVOCATION (start)
// 2. TOOL_INVOCATION (success) or ERROR (failure)
// 3. AGENT_HANDOFF (on fallback)

import { logEvent, isTraceActive } from '@/lib/harness/trace';

if (isTraceActive()) {
  logEvent('TOOL_INVOCATION', {
    tool: 'llm',
    model: modelName,
    provider: modelConfig.provider,
  }, {
    success: true,
    tokens: usage.total_tokens,
    cost_usd: cost,
  }, {
    duration_ms: duration,
  });
}
```

### Cost Guard Integration

Token usage and costs are automatically tracked:

```typescript
import { calculateCost } from '@/lib/llm/registry';

const cost = calculateCost('deepseek-chat', {
  prompt_tokens: 1000,
  completion_tokens: 500,
});

console.log(`Total cost: $${cost.toFixed(6)}`);
```

---

## API Reference

### Functions

#### `getModelConfig(modelName: string): ModelConfig`
Retrieves configuration for a specific model.

**Parameters:**
- `modelName` - Model name (e.g., 'deepseek-chat', 'gpt-4o-mini')

**Returns:** `ModelConfig` object

**Throws:** `Error` if model not found

---

#### `getModelForAgent(agentName: string): string`
Determines optimal model for an agent.

**Parameters:**
- `agentName` - Agent name (e.g., 'supervisor', 'debugger')

**Returns:** Model name string

**Default:** Returns 'deepseek-chat' for unknown agents

---

#### `getFallbackModel(): string`
Returns the fallback model name.

**Returns:** `'gpt-4o-mini'`

---

#### `listAvailableModels(): string[]`
Lists all available models.

**Returns:** Array of model names

---

#### `getModelsByProvider(provider: LLMProvider): string[]`
Lists models for a specific provider.

**Parameters:**
- `provider` - Provider name ('deepseek' or 'openai')

**Returns:** Array of model names

---

#### `calculateCost(modelName: string, usage: TokenUsage): number`
Calculates cost of an LLM call.

**Parameters:**
- `modelName` - Model used
- `usage` - Token usage object

**Returns:** Cost in USD

---

### LLMClient Methods

#### `call(modelName, messages, options): Promise<LLMResponse>`
Makes an LLM API call.

**Parameters:**
- `modelName` - Model to use
- `messages` - Chat messages array
- `options` - Optional call options

**Returns:** Response with content and usage

---

#### `callWithFallback(agentName, messages, options): Promise<LLMResponse>`
Makes an LLM call with automatic fallback.

**Parameters:**
- `agentName` - Agent making the call
- `messages` - Chat messages array
- `options` - Optional call options

**Returns:** Response from primary or fallback model

---

#### `createJSONCompletion<T>(modelName, messages, options): Promise<{data: T, usage: TokenUsage}>`
Makes an LLM call that returns JSON.

**Parameters:**
- `modelName` - Model to use
- `messages` - Chat messages array
- `options` - Optional call options

**Returns:** Parsed JSON data and usage

---

## Troubleshooting

### "Model not found in registry"

**Cause:** Invalid model name passed to `getModelConfig()`

**Solution:** Check available models with `listAvailableModels()`

---

### "Client not initialized. Check API key configuration."

**Cause:** Missing or invalid API key for the provider

**Solution:**
1. Check `.env.local` has `DEEPSEEK_API_KEY` or `OPENAI_API_KEY`
2. Ensure key starts with `sk-`
3. Restart dev server after adding keys

---

### High costs with DeepSeek

**Cause:** Low cache hit rate (<40%)

**Solution:**
1. Reuse system prompts across calls
2. Batch similar requests together
3. Check if using chat prefix capability
4. Monitor cache hit rate in Cost Guard

---

### Slow response times

**Cause:** Using `deepseek-reasoner` for simple tasks

**Solution:** Use `getModelForAgent()` to ensure correct model selection

---

## Best Practices

### 1. Always Use `getModelForAgent()`

```typescript
const model = getModelForAgent('supervisor');
const response = await llmClient.call(model, messages);
```

### 2. Prefer `callWithFallback()` for Production

```typescript
const response = await llmClient.callWithFallback('supervisor', messages);
```

### 3. Reuse System Prompts

```typescript
const SYSTEM_PROMPT = 'You are a routing agent.';

const response1 = await llmClient.call('deepseek-chat', [
  { role: 'system', content: SYSTEM_PROMPT },
  { role: 'user', content: query1 }
]);

const response2 = await llmClient.call('deepseek-chat', [
  { role: 'system', content: SYSTEM_PROMPT },
  { role: 'user', content: query2 }
]);
```

### 4. Handle Errors Gracefully

```typescript
try {
  const response = await llmClient.call(model, messages);
} catch (error) {
  if (error instanceof LLMRateLimitError) {
    await sleep(1000);
    return retry();
  }
  throw error;
}
```

### 5. Track Costs

```typescript
const response = await llmClient.call(model, messages);
const cost = calculateCost(model, response.usage);
console.log(`Cost: $${cost.toFixed(6)}`);
```

---

## Changelog

### v0.3.5.1 (Current)
- Added comprehensive LLM system documentation
- Verified `deepseek-chat` and `deepseek-reasoner` implementations
- Documented cost optimization strategies
- Added error handling best practices

### v0.3.5
- Implemented `deepseek-chat` model
- Implemented `deepseek-reasoner` model
- Added `getModelForAgent()` for automatic model selection
- Integrated with Harness Trace and Cost Guard

---

## Additional Resources

- [DeepSeek API Documentation](https://api-docs.deepseek.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [11-11 Main README](../../README.md)
- [Harness Trace Documentation](../harness/README.md)
