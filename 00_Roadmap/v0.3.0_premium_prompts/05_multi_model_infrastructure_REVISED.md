# Feature 5: Multi-Model LLM Infrastructure (DeepSeek 3.2 Primary)

**Version:** v0.3.5 (Revised - "All In" on DeepSeek 3.2)  
**Branch:** `feature/multi-model-llm`  
**Duration:** 1-2 weeks  
**Dependencies:** Features 1, 2, 3, 4 (Wave 1 & 2 must be complete)  
**Excellence Focus:** Stability (10/10), Depth (10/10), Agent Optimization (10/10)

---

## Context: You Have Full Repo Access

**Before starting, review these files (read from BOTH ends - tail first, then head):**

### Foundation Documents
- `/00_Roadmap/task_plan.md` - Current roadmap and completed features
- `/JOURNAL.md` - Recent architectural decisions and build log
- `/05_Logs/BUGS.md` - Known issues and workarounds
- `/05_Logs/AUDIT_LOG.md` - Sprint summaries and technical decisions

### Architecture & Patterns
- `/04_System/EXCELLENCE_CRITERIA_FRAMEWORK.md` - The 8 dimensions of excellence
- `/04_System/V0.3.0_FEATURE_SEEDS.md` - Feature knowledge seeds
- `/04_System/AGENT_BEST_PRACTICES.md` - Development standards
- `/04_System/REPO_AWARE_PROMPTS_MEMORY.md` - Integration-first approach
- `/04_System/WINDOWS_BASH_MEMORY.md` - Windows bash compatibility

### Current Codebase (Integration Points)
- `/lib/` - Existing utilities and helpers
- `/components/` - UI components
- `/app/` - Next.js App Router structure
- `/app/api/` - API routes (check for existing LLM calls)
- `/db/` - PGlite database schema

### Wave 1 & 2 Features (Dependencies)
- Feature 1: Supervisor Router (`/app/api/supervisor/` or `/lib/supervisor/`)
- Feature 2: Cost Guard (`/lib/cost-guard/` or `/db/schema/cost-tracking.ts`)
- Feature 3: Librarian Agent (`/app/api/librarian/` or `/lib/librarian/`)
- Feature 4: Harness Trace (`/lib/harness-trace/` or `/db/schema/traces.ts`)

---

## Feature Overview

**"All In" on DeepSeek 3.2: Agent-Optimized LLM Infrastructure**

Build a multi-model LLM infrastructure that uses **DeepSeek 3.2 as the primary LLM provider** for all agents, with GPT-4o-mini as a fallback. DeepSeek 3.2 is a "reasoning-first model built for agents" with competitive performance, 20-35% cost savings, and agent-native design.

**Key Decision:** DeepSeek 3.2 is NOT a "budget option"—it's the **first-class choice** for 11-11's agent architecture.

---

## Why DeepSeek 3.2?

### 1. Agent-Native Design
- Trained on 1,800+ agent environments
- 85K+ complex agent instructions
- Tool calling built-in
- Thinking mode for complex reasoning

### 2. Competitive Performance
Benchmarks show parity with GPT-4o, Claude-3.5-Sonnet, Gemini-2.0-Pro on:
- Reasoning capabilities (MMLU, AIME, Codeforces)
- Agentic capabilities (SWE-Bench, Nexus)

### 3. Cost Optimization
- **Input (cache miss):** $0.28/1M tokens
- **Input (cache hit):** $0.028/1M tokens (90% cheaper!)
- **Output:** $0.42/1M tokens
- **Real-world savings:** 20-35% vs GPT-4o-mini

### 4. Two-Tier Strategy
- **deepseek-chat:** General agent tasks (Supervisor, Librarian, Cost Guard)
- **deepseek-reasoner:** Complex reasoning (Debugger, multi-step workflows)

---

## Implementation Requirements

### 1. Model Registry

Create `/lib/llm/registry.ts`:

```typescript
export interface ModelConfig {
  provider: 'deepseek' | 'openai';
  baseURL: string;
  model: string;
  contextWindow: number;
  maxOutput: number;
  cost: {
    input: number;
    inputCached?: number;
    output: number;
  };
  capabilities: string[];
  recommendedFor: string[];
}

export const MODEL_REGISTRY: Record<string, ModelConfig> = {
  // PRIMARY MODELS (DeepSeek 3.2)
  'deepseek-chat': {
    provider: 'deepseek',
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    contextWindow: 128000,
    maxOutput: 8000,
    cost: { input: 0.28, inputCached: 0.028, output: 0.42 },
    capabilities: ['json', 'tools', 'chat-prefix'],
    recommendedFor: ['supervisor', 'librarian', 'cost-guard', 'dojo', 'general'],
  },
  'deepseek-reasoner': {
    provider: 'deepseek',
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-reasoner',
    contextWindow: 128000,
    maxOutput: 64000,
    cost: { input: 0.28, inputCached: 0.028, output: 0.42 },
    capabilities: ['json', 'tools', 'chat-prefix', 'thinking'],
    recommendedFor: ['debugger', 'complex-reasoning', 'multi-step'],
  },
  
  // FALLBACK MODEL (GPT-4o-mini)
  'gpt-4o-mini': {
    provider: 'openai',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    contextWindow: 128000,
    maxOutput: 16000,
    cost: { input: 0.15, output: 0.6 },
    capabilities: ['json', 'tools', 'vision'],
    recommendedFor: ['fallback'],
  },
};

export function getModelForAgent(agentName: string): string {
  const agentModelMap: Record<string, string> = {
    supervisor: 'deepseek-chat',
    librarian: 'deepseek-chat',
    'cost-guard': 'deepseek-chat',
    dojo: 'deepseek-chat',
    debugger: 'deepseek-reasoner',
  };
  
  return agentModelMap[agentName] || 'deepseek-chat';
}
```

**Integration Notes:**
- Review existing LLM configuration in `/lib/` or `/app/api/`
- Ensure model registry is easily extensible (add new models without code changes)
- Document cost structure clearly (cache hit vs cache miss)

---

### 2. Unified LLM Client

Create `/lib/llm/client.ts`:

```typescript
import OpenAI from 'openai';
import { MODEL_REGISTRY, getModelForAgent } from './registry';
import { trackCost } from '../cost-guard'; // Feature 2
import { logHarnessEvent } from '../harness-trace'; // Feature 4

export class LLMClient {
  private clients: Map<string, OpenAI> = new Map();
  
  constructor() {
    // Initialize DeepSeek client
    this.clients.set('deepseek', new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
    }));
    
    // Initialize OpenAI client (fallback)
    this.clients.set('openai', new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }));
  }
  
  async call(
    modelName: string,
    messages: any[],
    options?: { temperature?: number; maxTokens?: number; tools?: any[] }
  ): Promise<any> {
    const modelConfig = MODEL_REGISTRY[modelName];
    if (!modelConfig) {
      throw new Error(`Model ${modelName} not found in registry`);
    }
    
    const client = this.clients.get(modelConfig.provider);
    if (!client) {
      throw new Error(`Client for provider ${modelConfig.provider} not initialized`);
    }
    
    const startTime = Date.now();
    
    try {
      // Log to Harness Trace (Feature 4)
      await logHarnessEvent({
        type: 'LLM_CALL_START',
        model: modelName,
        provider: modelConfig.provider,
        messageCount: messages.length,
      }).catch(() => console.log('[LLM_CALL_START]', { model: modelName }));
      
      // Make LLM call
      const response = await client.chat.completions.create({
        model: modelConfig.model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? modelConfig.maxOutput,
        tools: options?.tools,
      });
      
      const duration = Date.now() - startTime;
      const usage = response.usage;
      
      // Track cost (Feature 2)
      await trackCost({
        model: modelName,
        inputTokens: usage?.prompt_tokens ?? 0,
        outputTokens: usage?.completion_tokens ?? 0,
        cost: calculateCost(modelConfig, usage),
      }).catch(() => console.log('[COST_TRACKING]', { model: modelName, cost: calculateCost(modelConfig, usage) }));
      
      // Log to Harness Trace (Feature 4)
      await logHarnessEvent({
        type: 'LLM_CALL_END',
        model: modelName,
        duration,
        inputTokens: usage?.prompt_tokens,
        outputTokens: usage?.completion_tokens,
        cost: calculateCost(modelConfig, usage),
      }).catch(() => console.log('[LLM_CALL_END]', { model: modelName, duration }));
      
      return response;
    } catch (error) {
      // Log error to Harness Trace
      await logHarnessEvent({
        type: 'LLM_CALL_ERROR',
        model: modelName,
        error: error.message,
      }).catch(() => console.log('[LLM_CALL_ERROR]', { model: modelName, error: error.message }));
      
      throw error;
    }
  }
  
  async callWithFallback(
    agentName: string,
    messages: any[],
    options?: any
  ): Promise<any> {
    const primaryModel = getModelForAgent(agentName);
    
    try {
      // Try primary model (DeepSeek)
      return await this.call(primaryModel, messages, options);
    } catch (error) {
      // Log fallback to Harness Trace
      await logHarnessEvent({
        type: 'MODEL_FALLBACK',
        from: primaryModel,
        to: 'gpt-4o-mini',
        reason: error.message,
      }).catch(() => console.log('[MODEL_FALLBACK]', { from: primaryModel, to: 'gpt-4o-mini' }));
      
      // Fallback to GPT-4o-mini
      return await this.call('gpt-4o-mini', messages, options);
    }
  }
}

function calculateCost(modelConfig: ModelConfig, usage: any): number {
  if (!usage) return 0;
  
  const inputCost = (usage.prompt_tokens / 1_000_000) * modelConfig.cost.input;
  const outputCost = (usage.completion_tokens / 1_000_000) * modelConfig.cost.output;
  
  return inputCost + outputCost;
}

// Singleton instance
export const llmClient = new LLMClient();
```

**Integration Notes:**
- Review existing OpenAI client initialization in `/lib/` or `/app/api/`
- Ensure graceful degradation if Feature 2 (Cost Guard) or Feature 4 (Harness Trace) not available
- Use `.catch(() => console.log(...))` pattern for non-critical integrations

---

### 3. Refactor Existing Agents

**Update Feature 1 (Supervisor Router):**

```typescript
// Before
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: query }],
});

// After
import { llmClient } from '@/lib/llm/client';
const response = await llmClient.callWithFallback('supervisor', [
  { role: 'user', content: query },
]);
```

**Update Feature 3 (Librarian Agent):**

```typescript
// Before
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: searchQuery }],
});

// After
const response = await llmClient.callWithFallback('librarian', [
  { role: 'user', content: searchQuery },
]);
```

**Integration Notes:**
- Search for all `openai.chat.completions.create` calls in the codebase
- Replace with `llmClient.callWithFallback(agentName, messages)`
- Test each agent after refactoring to ensure no regressions
- Keep old OpenAI client code commented out for easy rollback

---

### 4. Environment Variables

Update `.env.local`:

```bash
# Primary LLM Provider (DeepSeek 3.2)
DEEPSEEK_API_KEY=sk-...

# Fallback LLM Provider (OpenAI)
OPENAI_API_KEY=sk-...

# Model Selection (optional overrides)
DEFAULT_MODEL=deepseek-chat
REASONING_MODEL=deepseek-reasoner
FALLBACK_MODEL=gpt-4o-mini
```

**Integration Notes:**
- Add to `.env.example` with placeholder values
- Document in README.md how to obtain DeepSeek API key (https://platform.deepseek.com/api_keys)
- Ensure graceful degradation if DEEPSEEK_API_KEY not set (fallback to GPT-4o-mini)

---

### 5. Model Performance Dashboard (Optional, Nice to Have)

Create `/app/models/page.tsx`:

```typescript
export default function ModelsPage() {
  // Fetch model usage stats from Cost Guard (Feature 2)
  const stats = useCostStats();
  
  return (
    <div>
      <h1>Model Performance Dashboard</h1>
      
      {/* Model comparison table */}
      <table>
        <thead>
          <tr>
            <th>Model</th>
            <th>Calls</th>
            <th>Avg Latency</th>
            <th>Total Cost</th>
            <th>Fallback Rate</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>deepseek-chat</td>
            <td>{stats.deepseekChat.calls}</td>
            <td>{stats.deepseekChat.avgLatency}ms</td>
            <td>${stats.deepseekChat.totalCost}</td>
            <td>{stats.deepseekChat.fallbackRate}%</td>
          </tr>
          <tr>
            <td>deepseek-reasoner</td>
            <td>{stats.deepseekReasoner.calls}</td>
            <td>{stats.deepseekReasoner.avgLatency}ms</td>
            <td>${stats.deepseekReasoner.totalCost}</td>
            <td>{stats.deepseekReasoner.fallbackRate}%</td>
          </tr>
          <tr>
            <td>gpt-4o-mini (fallback)</td>
            <td>{stats.gpt4oMini.calls}</td>
            <td>{stats.gpt4oMini.avgLatency}ms</td>
            <td>${stats.gpt4oMini.totalCost}</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
      
      {/* Cost savings chart */}
      <div>
        <h2>Cost Savings vs GPT-4o-mini Baseline</h2>
        <p>Total Savings: ${stats.totalSavings} ({stats.savingsPercentage}%)</p>
      </div>
    </div>
  );
}
```

**Integration Notes:**
- This is optional (nice to have, not must have)
- Integrates with Feature 2 (Cost Guard) for usage stats
- Provides visibility into model performance and cost savings
- Can be deferred to v0.4.0 if time is limited

---

## Testing Requirements

### Unit Tests

```typescript
// /lib/llm/client.test.ts
describe('LLMClient', () => {
  it('should call deepseek-chat for supervisor agent', async () => {
    const response = await llmClient.callWithFallback('supervisor', [
      { role: 'user', content: 'Test query' },
    ]);
    expect(response).toBeDefined();
  });
  
  it('should fallback to gpt-4o-mini on DeepSeek error', async () => {
    // Mock DeepSeek API failure
    jest.spyOn(llmClient, 'call').mockRejectedValueOnce(new Error('API error'));
    
    const response = await llmClient.callWithFallback('supervisor', [
      { role: 'user', content: 'Test query' },
    ]);
    
    expect(response).toBeDefined();
    // Verify fallback was logged to Harness Trace
  });
  
  it('should calculate cost correctly', () => {
    const cost = calculateCost(MODEL_REGISTRY['deepseek-chat'], {
      prompt_tokens: 1000,
      completion_tokens: 500,
    });
    expect(cost).toBeCloseTo(0.00049); // (1000/1M * 0.28) + (500/1M * 0.42)
  });
});
```

### Integration Tests

1. **Test each agent with DeepSeek:**
   - Supervisor routing accuracy
   - Librarian search relevance
   - Cost Guard calculations
   - Debugger reasoning depth

2. **Test fallback logic:**
   - Simulate DeepSeek API failure
   - Verify GPT-4o-mini fallback works
   - Verify fallback is logged to Harness Trace

3. **Test cost tracking:**
   - Verify costs are tracked correctly in Cost Guard
   - Verify cache hit/miss rates are logged
   - Verify total cost savings are calculated

### Performance Tests

- **Latency:** p95 < 500ms (same as GPT-4o-mini)
- **Throughput:** Handle 100 concurrent requests
- **Fallback rate:** < 5% under normal conditions

---

## Documentation Requirements

### 1. JOURNAL.md Updates

Document:
- Why DeepSeek 3.2 was chosen (agent-native, competitive performance, cost savings)
- Model registry architecture
- Agent model selection strategy
- Fallback logic
- Cost savings projections

### 2. Code Documentation

- Add JSDoc comments to all exported functions
- Document model registry schema
- Document LLM client API
- Document agent model selection logic

### 3. User Documentation

Update README.md:
- How to obtain DeepSeek API key
- How to configure environment variables
- How to monitor model performance
- How to roll back to GPT-4o-mini if needed

---

## Excellence Rubric

### Must Be Excellent (10/10):
- **Stability:** Zero LLM call failures, graceful fallbacks
- **Depth:** Complete multi-model system with cost tracking
- **Agent Optimization:** DeepSeek 3.2 is primary for all agents

### Must Be Very Good (9/10):
- **Performance:** No added latency from abstraction
- **Usability:** Simple API, easy setup
- **Parallelization:** Easy to add new models

### Should Be Good (8/10):
- **Research Integration:** Leverages DeepSeek's agent-native design
- **Creativity:** Model performance dashboard (optional)
- **Beauty:** Clean, well-documented code

---

## Deferred to Future Releases

- **Kimi K2 integration** (v0.4.0+)
- **A/B testing framework** (v0.4.0+)
- **Model performance analytics** (v0.4.0+)
- **Automatic model selection based on query complexity** (v0.5.0+)

---

## Notes for Zenflow

1. **Read Existing Codebase First:** Review all files in Context section before writing code
2. **Review Existing LLM Calls:** Search for `openai.chat.completions.create` to find all LLM calls
3. **Follow Existing Patterns:** Match code style, error handling, and logging patterns
4. **Graceful Degradation:** Use `.catch(() => console.log(...))` for non-critical integrations
5. **Test After Each Refactor:** Ensure no regressions when updating agents
6. **Document Decisions:** Update JOURNAL.md with architectural decisions
7. **Take Screenshots:** Capture localhost during development for debugging
8. **Windows Bash:** Use `;` instead of `&&` for command chaining

---

## Success Criteria

### Must Have:
- ✅ Model registry with deepseek-chat, deepseek-reasoner, gpt-4o-mini
- ✅ Unified LLM client with fallback logic
- ✅ All agents refactored to use llmClient
- ✅ Cost tracking integrated with Feature 2 (Cost Guard)
- ✅ Event logging integrated with Feature 4 (Harness Trace)
- ✅ Environment variables documented
- ✅ Zero regressions (all existing features work)
- ✅ JOURNAL.md updated with decisions

### Should Have:
- ✅ Unit tests for LLM client
- ✅ Integration tests for each agent
- ✅ Performance tests (latency, throughput)
- ✅ README.md updated with setup instructions

### Nice to Have:
- ✅ Model performance dashboard
- ✅ Cost savings visualization
- ✅ A/B testing results documented

---

**Ready for Zenflow execution after Wave 2 (Features 3 & 4) is complete!**
