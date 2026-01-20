# Technical Specification: AI Gateway Implementation

**Project:** 11-11 Platform  
**Feature:** AI Gateway - Multi-Provider Intelligent Routing System  
**Version:** 1.0  
**Date:** January 19, 2026  
**Status:** Technical Design

---

## 1. Technical Context

### Technology Stack
- **Language:** TypeScript 5.7+
- **Framework:** Next.js 14.2+
- **Database:** PGlite v0.3.14+ (Browser-based PostgreSQL via IndexedDB)
- **AI Providers:** OpenAI SDK v4.77.0+, DeepSeek API
- **Dependencies:** Zod for validation, Zustand for state (if needed)

### Key Constraints
1. **Client-Side Database:** All PGlite database operations run in browser only, not in API routes
2. **Browser-First:** Gateway must work entirely client-side (no backend required)
3. **Backward Compatibility:** Existing LLMClient interface must be preserved
4. **Zero Breaking Changes:** All agents must continue working without modifications initially
5. **Existing Integrations:** Must preserve Harness Trace, Cost Guard, Context Builder, Safety Switch integrations

---

## 2. Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Agent Layer                               │
│  (Supervisor, Dojo, Builder, Debugger, Librarian)               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AIGateway                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Request    │→ │    Router    │→ │   Adapter    │          │
│  │  Validation  │  │  (Routing    │  │   (Provider  │          │
│  │              │  │   Engine)    │  │    Calls)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                              │                   │
│                                              ▼                   │
│                                     ┌────────────────┐           │
│                                     │  Logger        │           │
│                                     │  (PGlite DB)   │           │
│                                     └────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Provider Adapters                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   DeepSeek   │  │    OpenAI    │  │   Anthropic  │          │
│  │   Adapter    │  │   Adapter    │  │   Adapter    │          │
│  │              │  │              │  │   (Future)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Agent calls aiGateway.call(modelName, messages, { taskType, userId, ... })
2. Gateway validates request and enriches with metadata
3. Router classifies task type and selects provider + model
4. Router checks provider health and determines fallback chain
5. Adapter translates request to provider-specific format
6. Adapter makes HTTP call to provider API
7. Adapter normalizes response to standard format
8. Logger writes request/response to PGlite (async, non-blocking)
9. Gateway returns standardized response to agent
```

---

## 3. Implementation Approach

### Phase 1: Foundation (Database + Configuration)

**Files to Create:**
- `lib/pglite/migrations/012_add_ai_gateway.ts` - Database migration
- `config/ai-gateway.config.ts` - Provider and routing configuration

**Files to Modify:**
- `lib/pglite/client.ts` - Add migration012 import and execution

**Implementation:**
1. Create migration SQL with `ai_providers` and `ai_gateway_logs` tables
2. Create migration function following pattern from `011_add_knowledge_hub.ts`
3. Add migration to client.ts initialization sequence
4. Create config file with provider registry and routing rules
5. Export types for ProviderConfig, RoutingRule, and GatewayConfig

### Phase 2: Core Interfaces & Types

**Files to Create:**
- `lib/ai-gateway/types.ts` - Gateway request/response types
- `lib/ai-gateway/index.ts` - Main AIGateway class
- `lib/ai-gateway/router.ts` - Routing engine
- `lib/ai-gateway/adapters/base.ts` - Base adapter interface
- `lib/ai-gateway/logger.ts` - Database logging utility

**Design Decisions:**
1. **Reuse existing LLM types:** Extend `LLMCallOptions` and `LLMResponse` from `lib/llm/types.ts`
2. **New Gateway-specific types:** Add `taskType`, `requestId`, provider selection metadata
3. **Singleton pattern:** Export singleton `aiGateway` instance like `llmClient`
4. **Error classes:** Reuse existing `LLMError`, `LLMAuthError`, `LLMRateLimitError`, `LLMTimeoutError`

### Phase 3: Provider Adapters

**Files to Create:**
- `lib/ai-gateway/adapters/deepseek.ts`
- `lib/ai-gateway/adapters/openai.ts`

**Implementation Strategy:**
1. **Reuse OpenAI SDK:** Both adapters use OpenAI SDK (DeepSeek is OpenAI-compatible)
2. **Migrate from LLMClient:** Extract client initialization logic from `lib/llm/client.ts`
3. **Adapter responsibilities:**
   - Initialize provider client (OpenAI instance)
   - Translate GatewayRequest → provider API call
   - Parse provider response → GatewayResponse
   - Handle provider-specific errors and retry logic
   - Track consecutive failures for health checking

### Phase 4: Routing Engine

**Implementation in `router.ts`:**

```typescript
interface IRouter {
  route(request: GatewayRequest): Promise<SelectedRoute>;
}

interface SelectedRoute {
  adapter: IProviderAdapter;
  model: string;
  fallbackChain: Array<{ adapter: IProviderAdapter; model: string }>;
}
```

**Routing Logic:**
1. Extract `taskType` from request (default to 'general_chat')
2. Look up routing rule in configuration
3. Get primary adapter and check `isAvailable()`
4. If unavailable, select fallback adapter
5. Return SelectedRoute with fallback chain

**Task Classification:**
- No AI-based classification in Phase 1
- Use explicit `taskType` parameter from agent calls
- Support 6 task types: code_generation, architectural_design, general_chat, content_synthesis, complex_reasoning, default

### Phase 5: Agent Integration

**Files to Modify:**
- `lib/agents/supervisor.ts` - Replace `llmClient` with `aiGateway`
- `lib/agents/dojo-handler.ts` - Replace `new LLMClient()` with `aiGateway`
- `lib/agents/builder-handler.ts` - Replace `new LLMClient()` with `aiGateway`
- `lib/agents/debugger-handler.ts` - Replace `new LLMClient()` with `aiGateway`
- `lib/agents/librarian-handler.ts` - Replace `llmClient` calls with `aiGateway`

**Migration Pattern:**
```typescript
// Before
const llmClient = new LLMClient();
const response = await llmClient.callWithFallback('supervisor', messages, options);

// After
import { aiGateway } from '@/lib/ai-gateway';
const response = await aiGateway.call('supervisor', messages, { 
  ...options, 
  taskType: 'general_chat' 
});
```

**Task Type Mapping:**
| Agent | Current Model | Task Type | Rationale |
|-------|--------------|-----------|-----------|
| Supervisor | deepseek-chat | general_chat | Conversational routing |
| Dojo | deepseek-chat | general_chat | Multi-mode partnership |
| Builder | deepseek-chat | code_generation | Code writing and refactoring |
| Debugger | deepseek-reasoner | complex_reasoning | Error analysis |
| Librarian | deepseek-chat | content_synthesis | Prompt analysis |

### Phase 6: Monitoring Dashboard

**Files to Create:**
- `app/admin/ai-gateway/page.tsx` - Dashboard UI
- `components/ai-gateway/LogsTable.tsx` - Request logs table
- `components/ai-gateway/MetricsCharts.tsx` - Performance charts
- `components/ai-gateway/ProviderStatus.tsx` - Provider health indicators
- `lib/pglite/ai-gateway-logs.ts` - Database query utilities

**Implementation:**
1. Create query utilities in `lib/pglite/ai-gateway-logs.ts`
   - `getGatewayLogs(limit, offset, filters)`
   - `getAggregatedMetrics(timeRange)`
   - `getProviderStats()`
2. Build dashboard page with charts (use existing chart patterns from cost-dashboard)
3. Use SWR for real-time updates (poll every 5 seconds)
4. No API route needed - direct PGlite queries from client component

---

## 4. Source Code Structure

### New Directory: `/lib/ai-gateway`

```
lib/ai-gateway/
├── index.ts                    # AIGateway class + singleton export
├── types.ts                    # GatewayRequest, GatewayResponse, TaskType
├── router.ts                   # Routing engine (IRouter implementation)
├── logger.ts                   # Database logging utility
├── health.ts                   # Provider health tracking
└── adapters/
    ├── base.ts                 # IProviderAdapter interface
    ├── deepseek.ts             # DeepSeek adapter
    └── openai.ts               # OpenAI adapter
```

### New Directory: `/config`

```
config/
└── ai-gateway.config.ts        # Provider registry + routing rules
```

### New Directory: `/app/admin/ai-gateway`

```
app/admin/ai-gateway/
└── page.tsx                    # Monitoring dashboard
```

### New Directory: `/components/ai-gateway`

```
components/ai-gateway/
├── LogsTable.tsx               # Request logs table
├── MetricsCharts.tsx           # Performance charts
└── ProviderStatus.tsx          # Provider health indicators
```

### Modified Files

```
lib/pglite/
├── client.ts                   # Add migration012
├── migrations/
│   └── 012_add_ai_gateway.ts   # New migration
└── ai-gateway-logs.ts          # New query utilities

lib/agents/
├── supervisor.ts               # Replace llmClient
├── dojo-handler.ts             # Replace llmClient
├── builder-handler.ts          # Replace llmClient
├── debugger-handler.ts         # Replace llmClient
└── librarian-handler.ts        # Replace llmClient
```

---

## 5. Data Model

### Table: `ai_providers`

```sql
CREATE TABLE IF NOT EXISTS ai_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    api_base_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO ai_providers (id, name, api_base_url, is_active) VALUES
  ('deepseek', 'DeepSeek', 'https://api.deepseek.com', true),
  ('openai', 'OpenAI', 'https://api.openai.com/v1', true)
ON CONFLICT (id) DO NOTHING;
```

### Table: `ai_gateway_logs`

```sql
CREATE TABLE IF NOT EXISTS ai_gateway_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    request_id TEXT NOT NULL,
    user_id TEXT,
    session_id TEXT,
    task_type TEXT,
    provider_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    request_payload JSONB,
    response_payload JSONB,
    latency_ms INTEGER,
    cost_usd DECIMAL(10, 6),
    status_code INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_gateway_logs_user_id ON ai_gateway_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_gateway_logs_session_id ON ai_gateway_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_gateway_logs_provider_id ON ai_gateway_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_gateway_logs_task_type ON ai_gateway_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_ai_gateway_logs_created_at ON ai_gateway_logs(created_at DESC);
```

### Migration File Pattern

Following `lib/pglite/migrations/011_add_knowledge_hub.ts`:

```typescript
export const migration012 = `
-- Migration 012: Add AI Gateway Schema
-- Date: 2026-01-19
-- Purpose: Add ai_providers and ai_gateway_logs tables

-- [SQL DDL statements]
`;

export async function applyMigration012(db: any): Promise<void> {
  try {
    console.log('[Migration 012] Adding AI Gateway schema...');
    await db.exec(migration012);
    console.log('[Migration 012] Successfully added ai_providers and ai_gateway_logs tables');
  } catch (error) {
    console.error('[Migration 012] Error applying migration:', error);
    throw error;
  }
}
```

---

## 6. Interface Contracts

### GatewayRequest (extends LLMCallOptions)

```typescript
import type { LLMCallOptions } from '@/lib/llm/types';
import type OpenAI from 'openai';

export type TaskType = 
  | 'code_generation'
  | 'architectural_design'
  | 'general_chat'
  | 'content_synthesis'
  | 'complex_reasoning'
  | 'default';

export interface GatewayRequest extends LLMCallOptions {
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  taskType?: TaskType;
  agentName?: string;
}
```

### GatewayResponse (reuse LLMResponse)

```typescript
import type { LLMResponse } from '@/lib/llm/types';

export type GatewayResponse = LLMResponse;
```

### IProviderAdapter

```typescript
export interface IProviderAdapter {
  id: string;
  name: string;
  call(request: GatewayRequest, model: string): Promise<GatewayResponse>;
  isAvailable(): boolean;
  getConsecutiveFailures(): number;
  resetHealth(): void;
}
```

### IRouter

```typescript
export interface IRouter {
  route(request: GatewayRequest): Promise<SelectedRoute>;
}

export interface SelectedRoute {
  adapter: IProviderAdapter;
  model: string;
  fallbackChain: Array<{ adapter: IProviderAdapter; model: string }>;
}
```

### AIGateway (main interface)

```typescript
export class AIGateway {
  constructor(config: GatewayConfig, router: IRouter);
  
  async call(
    agentName: string,
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options: GatewayRequest = {}
  ): Promise<GatewayResponse>;
  
  async callWithFallback(
    agentName: string,
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options: GatewayRequest = {}
  ): Promise<GatewayResponse>;
}

export const aiGateway: AIGateway;
```

### Configuration Schema

```typescript
export interface ProviderConfig {
  id: string;
  name: string;
  baseURL: string;
  models: string[];
}

export interface RoutingRule {
  taskType: TaskType;
  primary: { provider: string; model: string };
  fallback: { provider: string; model: string };
}

export interface GatewayConfig {
  providers: ProviderConfig[];
  routingRules: RoutingRule[];
  defaultTaskType: TaskType;
  maxRetries: number;
  retryDelayMs: number;
}
```

---

## 7. Delivery Phases

### Phase 1: Foundation (Migration 012 complete)
**Acceptance:**
- [ ] `lib/pglite/migrations/012_add_ai_gateway.ts` created
- [ ] Migration runs successfully and creates tables
- [ ] Migration integrated into `lib/pglite/client.ts`
- [ ] Tables visible in browser IndexedDB
- [ ] `config/ai-gateway.config.ts` created with provider and routing configurations
- [ ] Configuration exports valid TypeScript types

### Phase 2: Core Gateway (AIGateway operational)
**Acceptance:**
- [ ] `lib/ai-gateway/types.ts` with all interfaces
- [ ] `lib/ai-gateway/index.ts` with AIGateway class
- [ ] `lib/ai-gateway/router.ts` with routing logic
- [ ] `lib/ai-gateway/logger.ts` with PGlite integration
- [ ] `lib/ai-gateway/health.ts` with provider health tracking
- [ ] Unit tests pass (if time permits)

### Phase 3: Provider Adapters (DeepSeek + OpenAI working)
**Acceptance:**
- [ ] `lib/ai-gateway/adapters/base.ts` with IProviderAdapter interface
- [ ] `lib/ai-gateway/adapters/deepseek.ts` functional
- [ ] `lib/ai-gateway/adapters/openai.ts` functional
- [ ] Both adapters can make successful API calls
- [ ] Error handling and retry logic working
- [ ] Health tracking updates correctly

### Phase 4: Agent Integration (Zero regressions)
**Acceptance:**
- [ ] All 5 agents migrated to use `aiGateway`
- [ ] Existing agent tests pass (no regressions)
- [ ] Context Builder integration preserved
- [ ] Safety Switch integration preserved
- [ ] Harness Trace logging works
- [ ] Cost tracking still functional
- [ ] Manual testing of each agent successful

### Phase 5: Monitoring Dashboard (Observability complete)
**Acceptance:**
- [ ] `lib/pglite/ai-gateway-logs.ts` query utilities created
- [ ] `app/admin/ai-gateway/page.tsx` dashboard page created
- [ ] Dashboard displays last 100 requests
- [ ] Performance charts show latency and success rate
- [ ] Cost breakdown by provider and task type
- [ ] Provider health indicators visible
- [ ] Real-time updates work (SWR polling)

### Phase 6: Final Validation
**Acceptance:**
- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run build` succeeds
- [ ] All existing test scripts still pass
- [ ] Manual end-to-end testing complete
- [ ] Migration guide documented (if needed)

---

## 8. Verification Approach

### Lint & Type Checking
```bash
npm run lint
npm run type-check
```

### Build Verification
```bash
npm run build
```

### Existing Test Suites
```bash
npm run test:llm
npm run test:context
npm run test:safety
npm run test:harness
```

### Manual Testing Checklist
1. **Agent Calls:**
   - [ ] Supervisor routes to correct model
   - [ ] Dojo conversation works end-to-end
   - [ ] Builder code generation works
   - [ ] Debugger error analysis works
   - [ ] Librarian critique generation works

2. **Routing:**
   - [ ] `taskType: 'code_generation'` routes to deepseek-chat
   - [ ] `taskType: 'complex_reasoning'` routes to deepseek-reasoner
   - [ ] Default task type used when not specified

3. **Fallback:**
   - [ ] Primary provider failure triggers fallback
   - [ ] Fallback completes within 5 seconds
   - [ ] Consecutive failures mark provider degraded

4. **Logging:**
   - [ ] Requests logged to `ai_gateway_logs` table
   - [ ] Logs include all required fields (request_id, provider, model, latency, cost)
   - [ ] Logs queryable from dashboard

5. **Dashboard:**
   - [ ] Dashboard loads without errors
   - [ ] Recent requests display correctly
   - [ ] Charts render performance metrics
   - [ ] Cost breakdown accurate
   - [ ] Real-time updates work

### Performance Benchmarks
```bash
npm run test:llm-performance
```

**Targets:**
- Gateway overhead < 10ms
- Database logging non-blocking (async)
- Dashboard load time < 2s
- No regression in agent response times

---

## 9. Integration Points

### Harness Trace Integration
**Preserve existing patterns from `lib/llm/client.ts`:**

```typescript
if (isTraceActive()) {
  logEvent('TOOL_INVOCATION', {
    tool: 'ai-gateway',
    model: selectedRoute.model,
    provider: selectedRoute.adapter.id,
    task_type: request.taskType,
  }, {}, {});
}
```

**Add new gateway-specific events:**
- `GATEWAY_ROUTE_SELECTED` - When router selects a route
- `GATEWAY_FALLBACK` - When fallback is triggered
- `GATEWAY_PROVIDER_DEGRADED` - When provider marked degraded

### Cost Guard Integration
**Reuse existing cost calculation from `lib/llm/registry.ts`:**

```typescript
import { calculateCost } from '@/lib/llm/registry';

const cost = calculateCost(model, response.usage);
```

**Log cost to both:**
1. `ai_gateway_logs` table (cost_usd column)
2. Existing harness trace cost tracking

### Context Builder Integration
**Gateway calls Context Builder before routing:**

```typescript
async call(agentName: string, messages: Message[], options: GatewayRequest) {
  let processedMessages = messages;
  
  if (options.userId && options.enableContextBuilder !== false) {
    const { buildContext } = await import('@/lib/context/builder');
    const contextResult = await buildContext({
      agent: agentName,
      messages,
      userId: options.userId,
      sessionId: options.sessionId,
    });
    processedMessages = contextResult.messages;
  }
  
  // Continue with routing...
}
```

### Safety Switch Integration
**Gateway checks safety status before routing:**

```typescript
import { getSafetyStatus, getConservativeModel } from '@/lib/safety';

const safetyStatus = getSafetyStatus(options.sessionId);
if (safetyStatus.active) {
  // Override routing to use conservative model
  selectedRoute.model = getConservativeModel();
}
```

---

## 10. Error Handling Strategy

### Error Categories

1. **Provider Errors (retryable):**
   - 429 Rate Limit → Exponential backoff (1s, 2s, 4s)
   - 503 Service Unavailable → Retry 3 times
   - 408 Timeout → Retry with increased timeout

2. **Provider Errors (non-retryable):**
   - 401 Auth Error → Log and failover to fallback
   - 400 Bad Request → Log and throw to agent
   - 404 Model Not Found → Log and failover

3. **Gateway Errors:**
   - Invalid taskType → Default to 'general_chat'
   - No available providers → Throw LLMError
   - Database logging failure → Log warning but continue

### Error Flow

```typescript
try {
  const response = await primaryAdapter.call(request, model);
  return response;
} catch (error) {
  if (isRetryable(error)) {
    await exponentialBackoff();
    return retry();
  } else {
    const fallbackRoute = await router.getFallback();
    return fallbackRoute.adapter.call(request, fallbackRoute.model);
  }
}
```

### Health Tracking

```typescript
class ProviderAdapter {
  private consecutiveFailures = 0;
  private readonly MAX_FAILURES = 3;
  
  isAvailable(): boolean {
    return this.consecutiveFailures < this.MAX_FAILURES;
  }
  
  resetHealth(): void {
    this.consecutiveFailures = 0;
  }
  
  recordFailure(): void {
    this.consecutiveFailures++;
  }
}
```

---

## 11. Configuration Management

### Environment Variables

```bash
# .env.local
DEEPSEEK_API_KEY=sk-...
OPENAI_API_KEY=sk-...
```

### Configuration File

```typescript
// config/ai-gateway.config.ts
import type { GatewayConfig } from '@/lib/ai-gateway/types';

export const aiGatewayConfig: GatewayConfig = {
  providers: [
    {
      id: 'deepseek',
      name: 'DeepSeek',
      baseURL: 'https://api.deepseek.com',
      models: ['deepseek-chat', 'deepseek-reasoner'],
    },
    {
      id: 'openai',
      name: 'OpenAI',
      baseURL: 'https://api.openai.com/v1',
      models: ['gpt-4o-mini', 'gpt-4o'],
    },
  ],
  
  routingRules: [
    {
      taskType: 'code_generation',
      primary: { provider: 'deepseek', model: 'deepseek-chat' },
      fallback: { provider: 'openai', model: 'gpt-4o-mini' },
    },
    {
      taskType: 'complex_reasoning',
      primary: { provider: 'deepseek', model: 'deepseek-reasoner' },
      fallback: { provider: 'openai', model: 'gpt-4o-mini' },
    },
    {
      taskType: 'general_chat',
      primary: { provider: 'deepseek', model: 'deepseek-chat' },
      fallback: { provider: 'openai', model: 'gpt-4o-mini' },
    },
    {
      taskType: 'content_synthesis',
      primary: { provider: 'deepseek', model: 'deepseek-chat' },
      fallback: { provider: 'openai', model: 'gpt-4o-mini' },
    },
    {
      taskType: 'architectural_design',
      primary: { provider: 'deepseek', model: 'deepseek-chat' },
      fallback: { provider: 'openai', model: 'gpt-4o-mini' },
    },
    {
      taskType: 'default',
      primary: { provider: 'deepseek', model: 'deepseek-chat' },
      fallback: { provider: 'openai', model: 'gpt-4o-mini' },
    },
  ],
  
  defaultTaskType: 'general_chat',
  maxRetries: 3,
  retryDelayMs: 1000,
};
```

---

## 12. Backward Compatibility

### LLMClient Preservation

**Keep `lib/llm/client.ts` unchanged until all agents migrated.**

**Export both:**
```typescript
// lib/llm/client.ts
export { LLMClient };

// lib/ai-gateway/index.ts
export { AIGateway, aiGateway };
```

### Migration Strategy

1. **Phase 1-3:** Build gateway without touching agents
2. **Phase 4:** Migrate one agent at a time
3. **Validation:** Test each agent after migration
4. **Rollback plan:** Keep LLMClient as fallback

### API Compatibility

Gateway supports both call signatures:

```typescript
// Old LLMClient signature (deprecated but supported)
aiGateway.call('deepseek-chat', messages, options);

// New Gateway signature (preferred)
aiGateway.call('supervisor', messages, { ...options, taskType: 'general_chat' });
```

---

## 13. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| PGlite migration fails in production | High | Low | Test migration in clean browser profile |
| Agent regressions during integration | High | Medium | Migrate one agent at a time, test thoroughly |
| Provider API changes break adapters | Medium | Low | Version adapters, add integration tests |
| Database logging blocks requests | High | Low | Make logging async and non-blocking |
| Cost tracking diverges from actual | Medium | Medium | Validate against provider billing, add reconciliation |
| Router selects wrong model | Medium | Medium | Add logging for all routing decisions |

---

## 14. Future Enhancements

### Phase 2 (Anthropic + Google)
- Add `lib/ai-gateway/adapters/anthropic.ts`
- Add `lib/ai-gateway/adapters/google.ts`
- Update configuration with new providers
- Add Claude-4 and Gemini-1.5-Pro to routing rules

### Phase 3 (Streaming)
- Add streaming support to IProviderAdapter
- Implement SSE response handling
- Update dashboard to show streaming metrics

### Phase 4 (Advanced Routing)
- AI-based task classification (use LLM to detect task type)
- A/B testing framework (split traffic between models)
- Cost-based routing (choose cheapest model for task)

### Phase 5 (Multi-Modal)
- Add image input support
- Add vision model routing
- Update adapters for vision API calls

---

## 15. Dependencies & Prerequisites

### Technical Dependencies
- PGlite 0.3.14+ ✅ (already installed)
- OpenAI SDK 4.77.0+ ✅ (already installed)
- TypeScript 5.7+ ✅ (already installed)
- Next.js 14.2+ ✅ (already installed)

### Environment Dependencies
- DEEPSEEK_API_KEY configured ⚠️ (verify in .env.local)
- OPENAI_API_KEY configured ⚠️ (verify in .env.local)
- Browser with IndexedDB support ✅ (all modern browsers)

### No Blocking Dependencies
- This is a self-contained feature
- Can be developed in isolation
- No team coordination required

---

## 16. Success Metrics

### Performance Targets
- Gateway overhead: < 10ms per request
- Database write latency: < 50ms (non-blocking)
- Dashboard load time: < 2 seconds
- Agent response time: no regression (within 5%)

### Cost Targets
- Overall LLM costs reduced by 15-25%
- Cost per 1M tokens: $0.25-0.30 (down from $0.35)
- Zero unexpected API charges

### Reliability Targets
- Uptime: 99.9% (with at least one provider available)
- Fallback latency: < 5 seconds
- Error rate: < 5% (with automatic retry)

### Code Quality Targets
- Zero TypeScript errors
- Zero ESLint warnings
- All existing tests passing
- Build succeeds without errors

---

## 17. Implementation Checklist

### Pre-Implementation
- [x] Requirements reviewed and approved
- [x] Technical specification created
- [ ] Environment variables verified (.env.local)
- [ ] Database migration strategy confirmed

### Implementation
- [ ] Phase 1: Database migration complete
- [ ] Phase 2: Core gateway interfaces complete
- [ ] Phase 3: Provider adapters working
- [ ] Phase 4: Agent integration complete
- [ ] Phase 5: Dashboard operational
- [ ] Phase 6: Final validation passed

### Post-Implementation
- [ ] Documentation updated
- [ ] Migration guide written (if needed)
- [ ] Performance benchmarks recorded
- [ ] Cost analysis completed
- [ ] Rollback plan documented

---

**Document Status:** ✅ Final  
**Next Step:** Proceed to Planning (break down into implementation tasks)
