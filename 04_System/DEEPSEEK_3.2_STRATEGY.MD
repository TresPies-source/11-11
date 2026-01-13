# v0.3.5 Revised Strategy: "All In" on DeepSeek 3.2

**Date:** January 13, 2026  
**Context:** DeepSeek 3.2 & 3.2-Speciale released December 1, 2025  
**Decision:** Go "all in" on DeepSeek 3.2 as the primary LLM provider for 11-11

---

## Why "All In" on DeepSeek 3.2?

### 1. Agent-Native Design
**"Reasoning-first models built for agents!"**

DeepSeek 3.2 is explicitly optimized for agent workflows:
- Trained on 1,800+ agent environments
- 85K+ complex agent instructions
- Tool calling built-in
- Thinking mode for complex reasoning

**This is a perfect match for 11-11's agent architecture** (Supervisor, Librarian, Debugger, Builder).

### 2. Competitive Performance
Benchmarks show DeepSeek V3.2 competing with:
- GPT-4o
- Claude-3.5-Sonnet
- Gemini-2.0-Pro

Across reasoning and agentic capabilities (MMLU, SWE-Bench, Nexus, etc.).

### 3. Cost Optimization
- **7-40% cheaper** than GPT-4o-mini (depending on cache hit rate)
- **Real-world savings:** 20-35% with typical cache patterns
- **Annual savings:** $100-150/year for 100K queries/month

### 4. Two-Tier Strategy
- **deepseek-chat:** General agent tasks (Librarian, Cost Guard)
- **deepseek-reasoner:** Complex reasoning (Supervisor routing, Debugger analysis)

### 5. 128K Context Window
Same as GPT-4o-mini, sufficient for most agent tasks.

### 6. OpenAI-Compatible API
Easy integration, minimal code changes.

---

## Revised v0.3.5 Strategy

### Old Strategy (GPT-4o-mini + DeepSeek)
- GPT-4o-mini: High-quality tasks (Supervisor, Dojo)
- DeepSeek V3: Cost-sensitive tasks (Librarian, Cost Guard)
- Fallback: GPT-4o-mini if DeepSeek fails

**Problem:** This treats DeepSeek as a "budget option" rather than a first-class choice.

### New Strategy (DeepSeek 3.2 First)
- **deepseek-chat:** Default for all agents (Supervisor, Librarian, Cost Guard)
- **deepseek-reasoner:** Complex reasoning tasks (Debugger, multi-step workflows)
- **GPT-4o-mini:** Fallback only (if DeepSeek API unavailable)

**Why this works:**
1. DeepSeek 3.2 is **agent-optimized** (not a compromise)
2. Performance is **competitive** with GPT-4o (not inferior)
3. Cost savings are **meaningful** (20-35%)
4. Fallback ensures **reliability** (no single point of failure)

---

## Implementation Changes for v0.3.5

### 1. Model Registry (Revised)

```typescript
export const MODEL_REGISTRY = {
  // PRIMARY MODELS (DeepSeek 3.2)
  'deepseek-chat': {
    provider: 'deepseek',
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    contextWindow: 128000,
    maxOutput: 8000,
    cost: { input: 0.28, inputCached: 0.028, output: 0.42 },
    capabilities: ['json', 'tools', 'chat-prefix'],
    recommendedFor: ['supervisor', 'librarian', 'cost-guard', 'general'],
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
```

### 2. Agent Model Selection (Revised)

| Agent | Primary Model | Fallback | Rationale |
|-------|--------------|----------|-----------|
| **Supervisor** | deepseek-chat | gpt-4o-mini | Agent-optimized routing |
| **Librarian** | deepseek-chat | gpt-4o-mini | Fast, cost-effective search |
| **Cost Guard** | deepseek-chat | gpt-4o-mini | Simple calculations |
| **Debugger** | deepseek-reasoner | gpt-4o-mini | Complex reasoning, thinking mode |
| **Dojo** | deepseek-chat | gpt-4o-mini | General thinking partnership |

### 3. Fallback Logic (Revised)

```typescript
async function callLLM(agentName: string, prompt: string) {
  const primaryModel = getModelForAgent(agentName); // deepseek-chat or deepseek-reasoner
  
  try {
    // Try primary model (DeepSeek)
    return await llmClient.call(primaryModel, prompt);
  } catch (error) {
    // Log to Harness Trace
    await logHarnessEvent({
      type: 'MODEL_FALLBACK',
      from: primaryModel,
      to: 'gpt-4o-mini',
      reason: error.message,
    });
    
    // Fallback to GPT-4o-mini
    return await llmClient.call('gpt-4o-mini', prompt);
  }
}
```

### 4. Environment Variables (Revised)

```bash
# Primary LLM Provider (DeepSeek)
DEEPSEEK_API_KEY=sk-...

# Fallback LLM Provider (OpenAI)
OPENAI_API_KEY=sk-...

# Model Selection (optional override)
DEFAULT_MODEL=deepseek-chat
REASONING_MODEL=deepseek-reasoner
FALLBACK_MODEL=gpt-4o-mini
```

---

## Cost Projection (Revised)

**Assuming 100K queries/month with 50% cache hit rate:**

| Scenario | Monthly Cost | Annual Cost | vs GPT-4o-mini |
|----------|--------------|-------------|----------------|
| **All GPT-4o-mini** | $37.50 | $450 | Baseline |
| **All DeepSeek (50% cache)** | $28 | $336 | **-25% ($114/year)** |
| **All DeepSeek (80% cache)** | $24 | $288 | **-36% ($162/year)** |

**With agent-optimized performance and competitive quality.**

---

## Testing Strategy

### Phase 1: A/B Testing (Week 1)
- Run 1,000 test queries through both DeepSeek and GPT-4o-mini
- Measure: quality, latency, cost, failure rate
- Compare: routing accuracy, search relevance, reasoning depth

### Phase 2: Gradual Rollout (Week 2)
- 25% traffic to DeepSeek (75% GPT-4o-mini)
- Monitor: user satisfaction, bug reports, cost savings
- Adjust: model selection, fallback logic, cache strategy

### Phase 3: Full Deployment (Week 2+)
- 100% traffic to DeepSeek (GPT-4o-mini as fallback only)
- Document: cost savings, performance metrics, lessons learned
- Optimize: cache hit rate, prompt engineering, context management

---

## Success Criteria

### Must Have:
- ✅ DeepSeek 3.2 is primary model for all agents
- ✅ GPT-4o-mini fallback works reliably
- ✅ Cost savings: 20-35% vs baseline
- ✅ Quality: No degradation vs GPT-4o-mini
- ✅ Latency: <500ms p95 (same as GPT-4o-mini)

### Should Have:
- ✅ Cache hit rate: >50%
- ✅ Fallback rate: <5%
- ✅ User satisfaction: No complaints about quality
- ✅ Documentation: Complete setup guide

---

## Risks & Mitigation

### Risk 1: DeepSeek API Reliability
**Mitigation:** Automatic fallback to GPT-4o-mini, monitor uptime

### Risk 2: Quality Degradation
**Mitigation:** A/B testing, user feedback, rollback plan

### Risk 3: Cache Miss Rate Higher Than Expected
**Mitigation:** Optimize prompt caching, monitor cache hit rate

### Risk 4: Fallback Cost Spike
**Mitigation:** Set budget alerts, monitor fallback rate

---

## Next Steps

1. ✅ Research complete (DeepSeek 3.2 capabilities, pricing, benchmarks)
2. ⏳ Update v0.3.5 prompt (prioritize DeepSeek, add deepseek-reasoner)
3. ⏳ Update v0.3.0 release plan (reflect new strategy)
4. ⏳ Execute v0.3.5 via Zenflow (after Wave 2 complete)
5. ⏳ A/B test and gradual rollout
6. ⏳ Document cost savings and lessons learned

---

**Decision: Go "all in" on DeepSeek 3.2 as the primary LLM provider for 11-11.**
