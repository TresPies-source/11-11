# Product Requirements Document: AI Gateway Implementation

**Project:** 11-11 Platform  
**Feature:** AI Gateway - Multi-Provider Intelligent Routing System  
**Version:** 1.0  
**Date:** January 19, 2026  
**Status:** Requirements Finalized

---

## 1. Executive Summary

Transform the 11-11 platform from a single-provider LLM system into a sophisticated multi-provider AI Gateway that intelligently routes requests to the optimal model for each task. This upgrade will improve performance, reduce costs, increase reliability through automatic failover, and establish a foundation for future AI provider integrations.

### Key Objectives

- **Intelligent Routing**: Automatically select the best AI model for each task type
- **Cost Optimization**: Reduce overall LLM costs by 15-25% through optimal model selection
- **Resilience**: Implement automatic failover to backup providers when primary providers fail
- **Observability**: Provide comprehensive monitoring and analytics for all AI requests
- **Extensibility**: Create a modular architecture that makes adding new providers trivial

---

## 2. Current State Analysis

### Existing Infrastructure

**LLM Client (`lib/llm/client.ts`)**
- Singleton `LLMClient` class managing DeepSeek and OpenAI providers
- Hard-coded fallback logic (DeepSeek → GPT-4o-mini)
- Basic retry and timeout handling
- Cost tracking integration with harness traces
- Context builder integration
- Safety switch integration

**Model Registry (`lib/llm/registry.ts`)**
- Centralized model configurations with costs and capabilities
- Agent-to-model mapping (e.g., debugger → deepseek-reasoner)
- Current models: deepseek-chat, deepseek-reasoner, gpt-4o-mini, gpt-4o

**Current Agents Using LLM Client**
- `lib/agents/dojo-handler.ts` - Creates new LLMClient instance
- `lib/agents/builder-handler.ts` - Creates new LLMClient instance
- `lib/agents/debugger-handler.ts` - Creates new LLMClient instance
- `lib/agents/supervisor.ts` - Imports shared llmClient instance
- `lib/agents/librarian-handler.ts` - Uses callWithFallback

**Existing Integrations**
- Harness Trace for event logging
- Cost Guard for budget tracking
- Context Builder for hierarchical context management
- Safety Switch for conservative mode activation

### Pain Points

1. **Limited Routing Logic**: Agent-based model selection only, no task-aware routing
2. **Hard-Coded Fallback**: Single fallback chain with no task-specific alternatives
3. **No Centralized Monitoring**: LLM calls tracked via harness but not aggregated
4. **Provider Coupling**: Direct OpenAI SDK usage limits provider flexibility
5. **Manual Provider Management**: No automatic health checks or provider status tracking

---

## 3. User Stories & Use Cases

### US-1: Developer - Transparent Migration
**As a** platform developer  
**I want** the AI Gateway to be a drop-in replacement for LLMClient  
**So that** I can migrate existing agents without breaking functionality

**Acceptance Criteria:**
- All existing `llmClient.call()` usage patterns continue to work
- `callWithFallback()` behavior is preserved with enhanced routing
- Context builder and safety switch integrations remain functional
- No changes required to harness trace or cost tracking integrations

### US-2: System Administrator - Cost Optimization
**As a** system administrator  
**I want** to see which models are being used for which tasks  
**So that** I can optimize costs by adjusting routing rules

**Acceptance Criteria:**
- Dashboard shows cost breakdown by provider, model, and task type
- Real-time cost tracking per session and user
- Ability to compare estimated vs. actual routing decisions
- Export cost reports for analysis

### US-3: Agent Developer - Task-Aware Routing
**As an** agent developer  
**I want** to specify task types when calling the AI Gateway  
**So that** my requests are routed to the most appropriate model

**Acceptance Criteria:**
- Simple taskType parameter in gateway calls
- Predefined task types: code_generation, architectural_design, general_chat, debugging, content_synthesis
- Automatic fallback to default task type if not specified
- Documentation of task type to model mappings

### US-4: Platform Operator - Resilience & Monitoring
**As a** platform operator  
**I want** automatic failover when providers are down  
**So that** the system remains available even during provider outages

**Acceptance Criteria:**
- Automatic retry with exponential backoff on rate limits
- Fallback to secondary provider on primary failure
- Error logs capture provider health status
- Dashboard shows provider availability metrics

### US-5: Future Developer - Easy Provider Integration
**As a** future developer  
**I want** to add a new AI provider (e.g., Anthropic, Google)  
**So that** the platform can leverage new AI capabilities

**Acceptance Criteria:**
- Create provider adapter in `/lib/ai-gateway/adapters/`
- Update configuration file with new provider details
- No changes to core gateway or routing logic required
- Provider-specific error handling is isolated

---

## 4. Functional Requirements

### FR-1: Database Schema

**FR-1.1: AI Providers Table**
- Store provider configurations (id, name, api_base_url, is_active)
- Support dynamic provider enable/disable
- Track provider creation timestamps

**FR-1.2: AI Gateway Logs Table**
- Log every request through the gateway
- Capture: request_id, user_id, session_id, task_type, provider_id, model_id
- Store: request_payload, response_payload (JSONB)
- Record: latency_ms, cost_usd, status_code, error_message
- Index by user_id, session_id, provider_id, created_at

### FR-2: AI Gateway Core

**FR-2.1: Public Interface**
- Single `call()` method accepting GatewayRequest
- Support for messages, taskType, userId, sessionId, temperature, maxTokens
- Return standardized GatewayResponse with content, usage, finishReason
- Backward compatible with existing LLMClient call signature

**FR-2.2: Request Lifecycle**
1. Validate incoming request
2. Route to appropriate provider/model via Router
3. Execute request through Provider Adapter
4. Log request/response to database
5. Return standardized response to caller

**FR-2.3: Error Handling**
- Preserve existing LLMError, LLMAuthError, LLMRateLimitError, LLMTimeoutError classes
- Normalize provider-specific errors to standard error types
- Automatic retry on retryable errors (429, 503, 408)
- Fallback to secondary provider on non-retryable errors

### FR-3: Routing Engine

**FR-3.1: Task Classification**
- Classify requests into predefined task types:
  - `code_generation`: Code writing, refactoring, debugging
  - `architectural_design`: High-level system design, planning
  - `general_chat`: Conversational interactions
  - `content_synthesis`: Writing, summarization, extraction
  - `complex_reasoning`: Multi-step logic, analysis
  - `default`: Fallback for unspecified tasks

**FR-3.2: Model Selection**
- Routing rules defined in configuration file
- Each task type has primary and fallback models
- Example:
  - code_generation: deepseek-coder (primary), gpt-4o-mini (fallback)
  - architectural_design: claude-4 (primary), gpt-4 (fallback)
  - complex_reasoning: deepseek-reasoner (primary), gpt-4o-mini (fallback)

**FR-3.3: Provider Health Checking**
- Track consecutive failures per provider
- Mark provider as degraded after 3+ consecutive failures
- Automatically skip to fallback when provider is degraded
- Reset degraded status after successful request

### FR-4: Provider Adapters

**FR-4.1: Base Adapter Interface**
- `call(request, model)` method returning standardized response
- Request/response normalization
- Provider-specific authentication
- Error handling and retry logic

**FR-4.2: Initial Adapters**
- **DeepSeek Adapter**: Existing integration (deepseek-chat, deepseek-reasoner)
- **OpenAI Adapter**: Existing integration (gpt-4o-mini, gpt-4o)
- **Anthropic Adapter**: New integration (claude-3-opus, claude-4) - FUTURE PHASE
- **Google Adapter**: New integration (gemini-1.5-pro) - FUTURE PHASE

**FR-4.3: Adapter Responsibilities**
- Translate standard request → provider-specific format
- Handle authentication (API keys, headers)
- Parse provider response → standard format
- Implement provider-specific retry logic
- Map provider errors → standard error types

### FR-5: Configuration Management

**FR-5.1: Configuration File Structure**
```typescript
{
  providers: [
    { id: 'deepseek', name: 'DeepSeek', baseURL: '...', models: [...] },
    { id: 'openai', name: 'OpenAI', baseURL: '...', models: [...] }
  ],
  routingRules: [
    { 
      taskType: 'code_generation',
      primary: { provider: 'deepseek', model: 'deepseek-chat' },
      fallback: { provider: 'openai', model: 'gpt-4o-mini' }
    }
  ],
  defaultTaskType: 'general_chat'
}
```

**FR-5.2: Environment Variable Support**
- API keys stored in .env.local (DEEPSEEK_API_KEY, OPENAI_API_KEY, etc.)
- Provider enable/disable via environment variables
- Override default routing rules via config

### FR-6: Agent Integration

**FR-6.1: Migration Path**
- Replace `new LLMClient()` with singleton `aiGateway` instance
- Update `llmClient.call()` → `aiGateway.call()` with taskType parameter
- Preserve `callWithFallback()` functionality via gateway routing
- Maintain context builder and safety switch integrations

**FR-6.2: Task Type Mapping**
| Agent | Task Type | Rationale |
|-------|-----------|-----------|
| Supervisor | general_chat | Route classification, user interaction |
| Librarian | content_synthesis | Prompt analysis, critique generation |
| Dojo | general_chat | Multi-mode conversational assistant |
| Builder | code_generation | Code creation and refactoring |
| Debugger | complex_reasoning | Error analysis and debugging |

**FR-6.3: Backward Compatibility**
- Support calls without taskType (default to general_chat)
- Support existing LLMCallOptions interface
- Preserve integration with harness, cost tracking, context builder, safety switch

### FR-7: Monitoring & Analytics

**FR-7.1: Dashboard Page**
- Location: `/app/admin/ai-gateway/page.tsx`
- Real-time log stream (last 100 requests)
- Performance metrics charts (latency, success rate, token usage)
- Cost analysis (total, by provider, by task type, by user)
- Provider health status indicators

**FR-7.2: API Endpoint**
- Route: `/app/api/admin/ai-gateway/logs/route.ts`
- Query parameters: limit, offset, provider, taskType, userId, sessionId
- Return: paginated logs with aggregated metrics
- Note: Server-side route for API consistency, but logs queried from PGlite client-side

**FR-7.3: Metrics Tracked**
- Request volume (total, per provider, per task type)
- Latency (p50, p95, p99)
- Error rate (by provider, by error type)
- Cost (total, per provider, per task type, per user)
- Token usage (input, output, total)
- Fallback frequency

---

## 5. Non-Functional Requirements

### NFR-1: Performance
- Gateway overhead < 10ms per request
- Database logging does not block response
- Support 100+ concurrent requests
- Dashboard loads in < 2 seconds

### NFR-2: Reliability
- 99.9% uptime when at least one provider is available
- Automatic failover within 5 seconds
- Maximum 3 retries per provider before fallback
- Graceful degradation when all providers fail

### NFR-3: Maintainability
- Clear separation between gateway, router, and adapters
- Comprehensive TypeScript types for all interfaces
- Self-documenting configuration format
- Provider adapters < 200 lines of code each

### NFR-4: Security
- API keys stored in environment variables only
- Never log API keys or sensitive auth tokens
- Sanitize request/response payloads before database storage
- Admin dashboard requires authentication (future)

### NFR-5: Cost Efficiency
- Reduce overall LLM costs by 15-25% through optimal routing
- Cache configuration to avoid repeated file reads
- Batch database inserts for high-throughput scenarios
- Lazy-load provider clients (initialize only when needed)

### NFR-6: Browser Compatibility
- PGlite database operations work in modern browsers (Chrome, Firefox, Safari, Edge)
- Dashboard charts render correctly on all screen sizes
- No server-side database access (PGlite limitation)

---

## 6. Out of Scope

### Explicitly Excluded from Initial Release

1. **Streaming Responses**: Initial version uses non-streaming completions only
2. **Multi-Modal Inputs**: Image, audio, video processing deferred to future phases
3. **Custom Model Fine-Tuning**: Only pre-trained models supported
4. **A/B Testing**: No built-in experimentation framework
5. **Rate Limit Management**: No pre-emptive rate limiting or quota tracking
6. **Provider-Specific Features**: No access to provider-specific features (e.g., Claude's thinking blocks, OpenAI's function calling) - standardized interface only
7. **Authentication & Authorization**: Admin dashboard has no access control initially
8. **Real-Time Provider Health Checks**: No active health monitoring, only reactive error tracking

### Future Enhancements

- **Phase 2**: Add Anthropic and Google adapters
- **Phase 3**: Implement streaming support
- **Phase 4**: Add A/B testing framework
- **Phase 5**: Multi-modal input support (vision, audio)
- **Phase 6**: Custom routing rules per user/organization

---

## 7. Data Architecture

### Database Tables

**ai_providers**
```sql
CREATE TABLE ai_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    api_base_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**ai_gateway_logs**
```sql
CREATE TABLE ai_gateway_logs (
    id TEXT PRIMARY KEY,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_gateway_logs_user_id ON ai_gateway_logs(user_id);
CREATE INDEX idx_ai_gateway_logs_session_id ON ai_gateway_logs(session_id);
CREATE INDEX idx_ai_gateway_logs_provider_id ON ai_gateway_logs(provider_id);
CREATE INDEX idx_ai_gateway_logs_task_type ON ai_gateway_logs(task_type);
CREATE INDEX idx_ai_gateway_logs_created_at ON ai_gateway_logs(created_at DESC);
```

### Migration Strategy

- Create migration file: `/lib/pglite/migrations/012_add_ai_gateway.ts`
- Apply migration on app initialization (added to client.ts)
- Seed ai_providers table with DeepSeek and OpenAI configurations
- No data migration required (new feature)

---

## 8. Interface Contracts

### GatewayRequest
```typescript
interface GatewayRequest {
  taskType?: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  userId?: string;
  sessionId?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: OpenAI.Chat.ChatCompletionTool[];
  responseFormat?: { type: 'json_object' | 'text' };
  timeout?: number;
  enableContextBuilder?: boolean;
}
```

### GatewayResponse
```typescript
interface GatewayResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finishReason?: string;
  toolCalls?: OpenAI.Chat.ChatCompletionMessageToolCall[];
}
```

### IRouter
```typescript
interface IRouter {
  route(request: GatewayRequest): Promise<SelectedRoute>;
}

interface SelectedRoute {
  provider: IProviderAdapter;
  model: string;
  fallbackChain: Array<{ provider: IProviderAdapter; model: string }>;
}
```

### IProviderAdapter
```typescript
interface IProviderAdapter {
  id: string;
  name: string;
  call(request: GatewayRequest, model: string): Promise<GatewayResponse>;
  isAvailable(): boolean;
}
```

---

## 9. Success Criteria

### Definition of Done

- [ ] All database migrations run successfully
- [ ] Configuration file created with provider and routing rules
- [ ] Core interfaces (AIGateway, IRouter, IProviderAdapter) defined
- [ ] DeepSeek and OpenAI adapters implemented and tested
- [ ] Router correctly classifies tasks and selects models
- [ ] All 5 agents integrated with AI Gateway
- [ ] Existing tests pass with no regressions
- [ ] Dashboard displays real-time logs and metrics
- [ ] Cost reduced by 15-25% on benchmark workload
- [ ] Automatic failover works within 5 seconds
- [ ] Zero ESLint warnings or TypeScript errors
- [ ] Production build succeeds

### Key Metrics

| Metric | Current Baseline | Target |
|--------|------------------|--------|
| Average Response Time | ~2.5s | < 3s (< 10ms gateway overhead) |
| Error Rate | ~2% | < 5% (with automatic retry) |
| Cost per 1M Tokens | $0.35 avg | $0.25-0.30 (15-25% reduction) |
| Provider Availability | 98% | 99.9% (with fallback) |
| Time to Add New Provider | N/A | < 4 hours |

### Acceptance Testing Scenarios

1. **Task Routing**: Code generation requests route to deepseek-chat
2. **Fallback**: Primary provider failure triggers fallback within 5s
3. **Cost Tracking**: Dashboard shows accurate cost per task type
4. **Error Handling**: Rate limit errors trigger exponential backoff
5. **Agent Integration**: Dojo agent works identically with gateway vs. LLMClient
6. **Backward Compatibility**: Existing agent calls work without modification

---

## 10. Open Questions & Assumptions

### Assumptions

1. **PGlite Compatibility**: AI Gateway logs are stored in PGlite (browser-side), limiting server-side analytics
2. **Provider API Keys**: DeepSeek and OpenAI API keys are already configured in `.env.local`
3. **Model Registry**: Existing MODEL_REGISTRY in `lib/llm/registry.ts` will be merged with AI Gateway config
4. **Context Builder**: Gateway will integrate with existing hierarchical context management
5. **Safety Switch**: Gateway will respect conservative mode settings when active
6. **Harness Trace**: Gateway will emit trace events compatible with existing harness infrastructure

### Resolved Decisions

**Q: Should we add Anthropic and Google adapters in Phase 1?**  
**A**: No. Focus on DeepSeek + OpenAI migration first. Add Anthropic/Google in Phase 2 after validating architecture.

**Q: How do we handle streaming responses?**  
**A**: Out of scope for Phase 1. All responses are non-streaming completions.

**Q: Should the dashboard be client-side or server-side?**  
**A**: Client-side page querying PGlite directly (consistent with architecture). API route is for future server-side integrations.

**Q: Do we need real-time provider health checks?**  
**A**: No. Use reactive error tracking (track consecutive failures) instead of active health monitoring.

**Q: How do we handle provider-specific features (e.g., Claude thinking, OpenAI function calling)?**  
**A**: Phase 1 uses standardized interface only. Provider-specific features deferred to future phases.

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Migration breaks existing agents | Medium | High | Comprehensive testing, backward compatible interface, phased rollout |
| PGlite storage limits | Low | Medium | Implement log rotation, document storage constraints |
| Provider API changes | Low | High | Version adapters, monitor provider changelogs |
| Performance degradation | Medium | Medium | Benchmark gateway overhead, optimize critical path |
| Cost tracking inaccuracy | Medium | High | Validate against provider billing, implement reconciliation |
| Fallback logic errors | Medium | High | Extensive error scenario testing, circuit breaker pattern |

---

## 12. Implementation Phases

### Phase 1: Foundation (8-12 hours)
- Database migrations
- Configuration file
- Core interfaces
- **Deliverable**: Runnable schema and type definitions

### Phase 2: Provider Adapters (12-16 hours)
- DeepSeek adapter
- OpenAI adapter
- Error handling and retry logic
- **Deliverable**: Working adapters for both providers

### Phase 3: Routing Engine (10-14 hours)
- Task classifier
- Model selector
- Fallback logic
- **Deliverable**: Intelligent routing with automatic failover

### Phase 4: Agent Integration (8-12 hours)
- Refactor all 5 agents
- Backward compatibility testing
- End-to-end validation
- **Deliverable**: All agents using AI Gateway

### Phase 5: Monitoring & Optimization (6-10 hours)
- API endpoint for logs
- Dashboard page
- Real-time updates
- **Deliverable**: Production-ready monitoring interface

**Total Estimated Effort**: 44-64 hours

---

## 13. Dependencies & Prerequisites

### Technical Dependencies
- PGlite v0.3.14+ (already installed)
- OpenAI SDK v4.77.0+ (already installed)
- TypeScript 5.7+
- Next.js 14.2+

### Environment Requirements
- DEEPSEEK_API_KEY configured
- OPENAI_API_KEY configured
- Browser with IndexedDB support

### Team Dependencies
- No blocking dependencies
- Self-contained implementation
- Can be developed in isolation from other features

---

## 14. References

- **Technical Specification**: `02_Specs/11-11-ai-gateway-spec.md`
- **Design Document**: `02_Specs/11-11-ai-gateway-design.md`
- **Architecture Guide**: `ARCHITECTURE.md`
- **Existing LLM Client**: `lib/llm/client.ts`
- **Model Registry**: `lib/llm/registry.ts`
- **Migration Pattern**: `lib/pglite/migrations/011_add_knowledge_hub.ts`

---

**Document Status**: ✅ Final  
**Approved By**: N/A  
**Next Step**: Proceed to Technical Specification
