# DeepSeek 3.2 Key Findings

**Source:** https://x.com/deepseek_ai/status/1995452641430651132  
**Date:** December 1, 2025

## Two New Models

### 1. DeepSeek-V3.2
- **Official successor to V3.2-Exp**
- **Availability:** App, Web, and API
- **Focus:** Reasoning-first model built for agents

### 2. DeepSeek-V3.2-Speciale
- **Advanced reasoning capabilities**
- **Availability:** API-only (for now)
- **Focus:** Pushing the boundaries of reasoning

## Key Highlights

**"Reasoning-first models built for agents!"**

This is a game-changer for 11-11:
- DeepSeek is explicitly optimized for **agent workflows**
- Reasoning-first approach aligns with Dojo's "perspectives before answers" philosophy
- Two tiers allow for cost/quality tradeoffs

## Performance Benchmarks (from screenshot)

The benchmark chart shows DeepSeek-V3.2 competing with:
- GPT-4o
- Claude-3.5-Sonnet
- Gemini-2.0-Pro

Across multiple categories:
- **Reasoning Capabilities** (MMLU 2025, MMMU 2025, AIME, Codeforces, etc.)
- **Agentic Capabilities** (SWE-Bench, Nexus, etc.)

## Strategic Implications for 11-11

1. **Agent-Native Design:** DeepSeek 3.2 is built specifically for agent workflows (Supervisor, Librarian, Debugger)
2. **Cost Optimization:** Maintain 82% cost savings while getting agent-optimized reasoning
3. **Two-Tier Strategy:**
   - DeepSeek-V3.2: General agent tasks (Librarian, Cost Guard)
   - DeepSeek-V3.2-Speciale: Complex reasoning (Supervisor routing, Debugger analysis)
4. **Competitive Performance:** Benchmarks show DeepSeek competing with GPT-4o and Claude

## Next Steps

1. Access tech report: https://huggingface.co/deepseek-ai/DeepSeek-V3.2/resolve/main/assets/paper.pdf
2. Test DeepSeek-V3.2 API for agent workflows
3. Evaluate DeepSeek-V3.2-Speciale for complex reasoning tasks
4. Revise v0.3.5 to "go all in" on DeepSeek 3.2


## Official Pricing (from DeepSeek API Docs)

### DeepSeek-V3.2 (Both Models)

| Pricing Tier | Cost per 1M Tokens |
|--------------|-------------------|
| **Input (Cache Hit)** | $0.028 |
| **Input (Cache Miss)** | $0.28 |
| **Output** | $0.42 |

### Model Comparison

| Model | Type | Context | Max Output | Features |
|-------|------|---------|------------|----------|
| **deepseek-chat** | DeepSeek-V3.2 (Non-thinking Mode) | 128K | 4K (default), 8K (max) | JSON, Tool Calls, Chat Prefix, FIM |
| **deepseek-reasoner** | DeepSeek-V3.2 (Thinking Mode) | 128K | 32K (default), 64K (max) | JSON, Tool Calls, Chat Prefix |

### Key Features

**Both models support:**
- ✓ JSON Output
- ✓ Tool Calls (perfect for agents!)
- ✓ Chat Prefix Completion (Beta)

**deepseek-chat only:**
- ✓ FIM Completion (Beta)

### Cost Comparison: DeepSeek vs GPT-4o-mini

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Total (avg) |
|-------|----------------------|------------------------|-------------|
| **GPT-4o-mini** | $0.150 | $0.600 | $0.375 |
| **DeepSeek V3.2 (cache miss)** | $0.28 | $0.42 | $0.35 |
| **DeepSeek V3.2 (cache hit)** | $0.028 | $0.42 | $0.224 |

**Cost Savings:**
- **Cache miss:** 7% cheaper than GPT-4o-mini
- **Cache hit:** 40% cheaper than GPT-4o-mini
- **With 50% cache hit rate:** ~25% cheaper than GPT-4o-mini

### Strategic Insight

**DeepSeek V3.2 is NOT 82% cheaper than GPT-4o-mini** (previous calculation was based on old DeepSeek V3 pricing).

**However:**
1. **Still cheaper** (7-40% depending on cache hit rate)
2. **Agent-optimized** (reasoning-first, tool calls, thinking mode)
3. **128K context** (vs GPT-4o-mini's 128K)
4. **Thinking mode** (deepseek-reasoner) for complex reasoning
5. **Competitive performance** (benchmarks show parity with GPT-4o)

### Revised Cost Projection for 11-11

**Assuming 100K queries/month:**

| Scenario | Monthly Cost | Annual Cost | Savings |
|----------|--------------|-------------|---------|
| **All GPT-4o-mini** | $37.50 | $450 | Baseline |
| **All DeepSeek (cache miss)** | $35 | $420 | **$30/year (7%)** |
| **All DeepSeek (50% cache hit)** | $28 | $336 | **$114/year (25%)** |
| **All DeepSeek (80% cache hit)** | $24 | $288 | **$162/year (36%)** |

**Real-world estimate:** 20-35% cost reduction while getting agent-optimized reasoning.
