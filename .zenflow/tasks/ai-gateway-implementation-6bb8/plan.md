# AI Gateway Implementation Plan

## Configuration
- **Artifacts Path**: `.zenflow/tasks/ai-gateway-implementation-6bb8`
- **Spec Files**: spec.md, requirements.md, 11-11-ai-gateway-spec.md, 11-11-ai-gateway-design.md

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: f911c36b-b029-4f8c-b724-fb5b038cfe6c -->

Create a Product Requirements Document (PRD) based on the feature description.

**Status**: ✅ Complete - requirements.md created

---

### [x] Step: Technical Specification
<!-- chat-id: 576a2839-c18e-46c5-ae1f-b4e3cd20bba7 -->

Create a technical specification based on the PRD.

**Status**: ✅ Complete - spec.md created

---

### [x] Step: Planning

Create a detailed implementation plan based on the technical specifications.

**Status**: ✅ Complete - This document

---


### [x] Step: Phase 1
<!-- chat-id: 5c699f7b-8c04-44e1-8ac3-ce0a74229c35 -->
<!-- agent: ZEN_CLI -->

### [x] Step: Phase 2
<!-- chat-id: 6900b579-2f67-418a-8de1-58324bfb97e2 -->
<!-- agent: ZEN_CLI -->

### [x] Step: Phase 3
<!-- chat-id: 312d2c53-3bf5-4ff5-907e-658cbbe2501d -->
<!-- agent: ZEN_CLI -->

### [x] Step: Phase 4
<!-- chat-id: 20356a9f-327c-4414-abe4-15f073762560 -->
<!-- agent: ZEN_CLI -->

### [x] Step: Phase 5
<!-- chat-id: 89cc21c9-671a-4210-abb3-8f213041bc39 -->
<!-- agent: ZEN_CLI -->

### [x] Step: Phase 6
<!-- chat-id: ecc8c2ce-379e-4b5c-83b7-36cd1e86be81 -->
<!-- agent: ZEN_CLI -->

### [x] Step: Phase 7
<!-- chat-id: b733a96a-43f1-424b-9906-a2034f94e3a1 -->
<!-- agent: ZEN_CLI -->

### [x] Step: Phase 8
<!-- chat-id: 33800fb7-3712-43d1-91ec-b4a59ecbc3ed -->
<!-- agent: ZEN_CLI -->

### [x] Step: Phase 9
<!-- agent: ZEN_CLI -->

### [x] Step: Phase 10
<!-- agent: ZEN_CLI -->
## Implementation Tasks

### **Phase 1: Foundation - Database & Configuration**

#### [ ] Task 1.1: Create Database Migration File
**File**: `lib/pglite/migrations/012_add_ai_gateway.ts`

**Actions**:
- Create migration file following pattern from `011_add_knowledge_hub.ts`
- Add SQL for `ai_providers` table (id, name, api_base_url, is_active, created_at)
- Add SQL for `ai_gateway_logs` table (id, request_id, user_id, session_id, task_type, provider_id, model_id, request_payload, response_payload, latency_ms, cost_usd, status_code, error_message, created_at)
- Create indexes for performance (user_id, session_id, provider_id, task_type, created_at)
- Add seed data for DeepSeek and OpenAI providers
- Export `migration012` SQL string and `applyMigration012` function

**Verification**:
- Migration follows same pattern as migration011
- SQL includes IF NOT EXISTS checks for idempotency
- All required columns present with correct types
- Indexes created for common query patterns

**References**:
- Pattern: `lib/pglite/migrations/011_add_knowledge_hub.ts:1-78`
- Spec: `spec.md:273-340`

---

#### [ ] Task 1.2: Integrate Migration into PGlite Client
**File**: `lib/pglite/client.ts`

**Actions**:
- Import `applyMigration012` at top of file (after migration011 import)
- Add `await applyMigration012(db);` in both migration blocks:
  - After line 62 (first run migrations)
  - After line 81 (existing database migrations)

**Verification**:
- Migration runs on fresh database initialization
- Migration runs on existing database (idempotent)
- Console logs show successful migration application
- No TypeScript errors

**References**:
- Pattern: `lib/pglite/client.ts:1-103`
- Import location: `lib/pglite/client.ts:13`
- First run: `lib/pglite/client.ts:62`
- Existing DB: `lib/pglite/client.ts:81`

---

#### [ ] Task 1.3: Create AI Gateway Configuration
**File**: `config/ai-gateway.config.ts`

**Actions**:
- Create `/config` directory if it doesn't exist
- Define `TaskType` type (code_generation, architectural_design, general_chat, content_synthesis, complex_reasoning, default)
- Define `ProviderConfig` interface (id, name, baseURL, models[])
- Define `RoutingRule` interface (taskType, primary {provider, model}, fallback {provider, model})
- Define `GatewayConfig` interface (providers[], routingRules[], defaultTaskType, maxRetries, retryDelayMs)
- Export `aiGatewayConfig` object with:
  - DeepSeek provider (deepseek-chat, deepseek-reasoner)
  - OpenAI provider (gpt-4o-mini, gpt-4o)
  - Routing rules for all 6 task types
  - Default config: general_chat, 3 retries, 1000ms delay

**Verification**:
- Configuration file imports without errors
- All TypeScript types are properly defined
- All 6 task types have routing rules
- Providers match existing LLM client providers

**References**:
- Spec: `spec.md:426-447`, `spec.md:717-774`
- Existing providers: `lib/llm/client.ts:68-84`

---

### **Phase 2: Core Types & Interfaces**

#### [ ] Task 2.1: Create Gateway Types
**File**: `lib/ai-gateway/types.ts`

**Actions**:
- Import LLM types from `@/lib/llm/types` (LLMCallOptions, LLMResponse, LLMError classes)
- Import OpenAI types for messages
- Re-export TaskType from config
- Define `GatewayRequest` interface extending LLMCallOptions:
  - messages: OpenAI.Chat.ChatCompletionMessageParam[]
  - taskType?: TaskType
  - agentName?: string
  - All existing LLMCallOptions properties
- Define `GatewayResponse` as type alias to LLMResponse
- Define `SelectedRoute` interface (adapter: IProviderAdapter, model: string, fallbackChain)
- Re-export LLM error classes for external use

**Verification**:
- Types compile without errors
- GatewayRequest properly extends LLMCallOptions
- All types are exported

**References**:
- Spec: `spec.md:346-400`
- LLM types: `lib/llm/types.ts`

---

#### [ ] Task 2.2: Create Base Provider Adapter Interface
**File**: `lib/ai-gateway/adapters/base.ts`

**Actions**:
- Import GatewayRequest and GatewayResponse from types
- Define `IProviderAdapter` interface:
  - id: string (readonly)
  - name: string (readonly)
  - call(request: GatewayRequest, model: string): Promise&lt;GatewayResponse&gt;
  - isAvailable(): boolean
  - getConsecutiveFailures(): number
  - resetHealth(): void

**Verification**:
- Interface compiles without errors
- All methods have correct signatures
- Interface is exported

**References**:
- Spec: `spec.md:376-386`

---

#### [ ] Task 2.3: Create Router Interface
**File**: `lib/ai-gateway/router.ts` (interfaces only)

**Actions**:
- Import types from `./types` and `./adapters/base`
- Define `IRouter` interface:
  - route(request: GatewayRequest): Promise&lt;SelectedRoute&gt;
- Define `SelectedRoute` interface (if not already in types.ts):
  - adapter: IProviderAdapter
  - model: string
  - fallbackChain: Array&lt;{ adapter: IProviderAdapter; model: string }&gt;

**Verification**:
- Interfaces compile without errors
- All types properly imported

**References**:
- Spec: `spec.md:389-400`, `spec.md:135-158`

---

### **Phase 3: Provider Adapters**

#### [ ] Task 3.1: Implement DeepSeek Adapter
**File**: `lib/ai-gateway/adapters/deepseek.ts`

**Actions**:
- Import OpenAI SDK, types, and base interface
- Create `DeepSeekAdapter` class implementing `IProviderAdapter`
- Add private properties: client (OpenAI), consecutiveFailures (number)
- Implement constructor:
  - Initialize OpenAI client with DeepSeek baseURL
  - Use DEEPSEEK_API_KEY from env
  - Set timeout to 30000ms, maxRetries to 2
- Implement `call()` method:
  - Format request for OpenAI-compatible API
  - Make API call with retry logic
  - Parse response to GatewayResponse format
  - Track success/failure for health
  - Normalize errors to LLM error classes
- Implement health tracking methods (isAvailable, getConsecutiveFailures, resetHealth)
- Export singleton instance

**Verification**:
- Adapter implements IProviderAdapter interface
- Can make successful API calls
- Error handling normalizes provider errors
- Health tracking works correctly
- Test with: `DEEPSEEK_API_KEY` must be set

**References**:
- Spec: `spec.md:120-130`
- Existing pattern: `lib/llm/client.ts:68-74`
- Error handling: `spec.md:649-701`

---

#### [ ] Task 3.2: Implement OpenAI Adapter
**File**: `lib/ai-gateway/adapters/openai.ts`

**Actions**:
- Import OpenAI SDK, types, and base interface
- Create `OpenAIAdapter` class implementing `IProviderAdapter`
- Add private properties: client (OpenAI), consecutiveFailures (number)
- Implement constructor:
  - Initialize OpenAI client with official baseURL
  - Use OPENAI_API_KEY from env
  - Set timeout to 30000ms, maxRetries to 2
- Implement `call()` method:
  - Format request for OpenAI API
  - Make API call with retry logic
  - Parse response to GatewayResponse format
  - Track success/failure for health
  - Normalize errors to LLM error classes
- Implement health tracking methods (isAvailable, getConsecutiveFailures, resetHealth)
- Export singleton instance

**Verification**:
- Adapter implements IProviderAdapter interface
- Can make successful API calls
- Error handling normalizes provider errors
- Health tracking works correctly
- Test with: `OPENAI_API_KEY` must be set

**References**:
- Spec: `spec.md:120-130`
- Existing pattern: `lib/llm/client.ts:77-84`
- Error handling: `spec.md:649-701`

---

#### [x] Task 3.3: Implement Anthropic Adapter
**File**: `lib/ai-gateway/adapters/anthropic.ts`

**Actions**:
- Install @anthropic-ai/sdk package
- Import Anthropic SDK, types, and base interface
- Create `AnthropicAdapter` class implementing `IProviderAdapter`
- Add private properties: client (Anthropic), consecutiveFailures (number)
- Implement constructor:
  - Initialize Anthropic client
  - Use ANTHROPIC_API_KEY from env
  - Set timeout to 30000ms, maxRetries to 2
- Implement `call()` method:
  - Convert OpenAI-style messages to Anthropic format (system messages, tool calls)
  - Make API call with retry logic
  - Parse response to GatewayResponse format
  - Track success/failure for health
  - Normalize errors to LLM error classes
- Implement helper methods (convertMessages, convertTools)
- Implement health tracking methods
- Export singleton instance

**Verification**:
- ✅ Adapter implements IProviderAdapter interface
- ✅ Compiles without TypeScript errors
- ✅ Message conversion handles system messages and tool calls
- ✅ Error handling normalizes provider errors

**Status**: ✅ Complete

---

#### [x] Task 3.4: Implement Google Adapter
**File**: `lib/ai-gateway/adapters/google.ts`

**Actions**:
- Install @google/generative-ai package
- Import Google SDK, types, and base interface
- Create `GoogleAdapter` class implementing `IProviderAdapter`
- Add private properties: client (GoogleGenerativeAI), consecutiveFailures (number)
- Implement constructor:
  - Initialize Google client
  - Use GOOGLE_API_KEY from env
- Implement `call()` method:
  - Convert OpenAI-style messages to Google format (history + lastMessage)
  - Configure safety settings to BLOCK_NONE for all categories
  - Make API call with retry logic
  - Parse response to GatewayResponse format
  - Track success/failure for health
  - Normalize errors to LLM error classes
- Implement helper method (convertMessages)
- Implement health tracking methods
- Export singleton instance

**Verification**:
- ✅ Adapter implements IProviderAdapter interface
- ✅ Compiles without TypeScript errors
- ✅ Message conversion handles system messages and chat history
- ✅ Error handling normalizes provider errors

**Status**: ✅ Complete

---

#### [x] Task 3.5: Update Configuration and Router
**Files**: `config/ai-gateway.config.ts`, `lib/ai-gateway/router.ts`

**Actions**:
- Add Anthropic provider config (claude-3-5-sonnet-20241022, claude-3-opus-20240229, claude-3-haiku-20240307)
- Add Google provider config (gemini-1.5-pro, gemini-1.5-flash)
- Import new adapters in router.ts
- Add new adapters to router initialization

**Verification**:
- ✅ Configuration includes all 4 providers
- ✅ Router initializes with all 4 adapters
- ✅ TypeScript compiles without errors

**Status**: ✅ Complete

---

### **Phase 4: Routing Engine**

#### [ ] Task 4.1: Implement Router Class
**File**: `lib/ai-gateway/router.ts`

**Actions**:
- Import config, types, adapters
- Create `Router` class implementing `IRouter`
- Add private property: adapters (Map&lt;string, IProviderAdapter&gt;)
- Implement constructor:
  - Accept GatewayConfig and adapter instances
  - Build adapter map from config
- Implement `classifyTask()` method:
  - Extract taskType from request (default to config.defaultTaskType)
  - Return TaskType
- Implement `selectModel()` method:
  - Find routing rule for task type
  - Return primary and fallback provider+model
- Implement `route()` method:
  - Classify task type
  - Select primary model
  - Get adapter for primary provider
  - Check adapter availability with isAvailable()
  - If unavailable, select fallback adapter
  - Build fallback chain
  - Return SelectedRoute
- Export singleton instance with DeepSeek and OpenAI adapters

**Verification**:
- Router correctly classifies all task types
- Router selects correct models based on routing rules
- Router checks provider health
- Fallback logic works when primary unavailable
- All 6 task types route correctly

**References**:
- Spec: `spec.md:135-158`, `spec.md:580-644`
- Task types: `config/ai-gateway.config.ts`

---

### **Phase 5: Gateway Logger**

#### [ ] Task 5.1: Create Gateway Logger
**File**: `lib/ai-gateway/logger.ts`

**Actions**:
- Import PGlite getDB function
- Import types for GatewayRequest, GatewayResponse
- Define `logGatewayRequest()` async function:
  - Accept: requestId, request, response, providerId, modelId, latency, cost, error
  - Get database instance
  - Insert into ai_gateway_logs table
  - Handle errors gracefully (log warning, don't throw)
  - Make async/non-blocking
- Define helper function `generateRequestId()`:
  - Return UUID or timestamp-based unique ID
- Export both functions

**Verification**:
- Logger successfully writes to database
- Async logging doesn't block gateway calls
- Errors in logging don't crash gateway
- Test: Verify data written to ai_gateway_logs table

**References**:
- Spec: `spec.md:270-315`
- Database: `lib/pglite/client.ts:93-98`

---

### **Phase 6: AI Gateway Core**

#### [ ] Task 6.1: Implement AIGateway Class
**File**: `lib/ai-gateway/index.ts`

**Actions**:
- Import all dependencies (router, logger, types, config, cost, context, safety)
- Create `AIGateway` class:
  - Private properties: router, config
  - Constructor: Accept router and config
- Implement `call()` method:
  - Generate unique requestId
  - Apply context builder if enabled (preserve existing integration)
  - Check safety switch status (preserve existing integration)
  - Call router.route() to get selected route
  - Start trace span if active (preserve harness integration)
  - Try primary adapter call
  - On success: calculate cost, log to DB, reset health, return response
  - On failure: record failure, try fallback from chain
  - Log all requests to database asynchronously
  - Track routing cost (preserve cost tracking integration)
  - Log trace events (preserve harness integration)
- Implement `callWithFallback()` method:
  - Wrapper around call() for backward compatibility
  - Same signature as LLMClient.callWithFallback()
- Create singleton instance with router and config
- Export both class and singleton

**Verification**:
- Gateway successfully routes requests
- Fallback logic works correctly
- Context builder integration preserved
- Safety switch integration preserved
- Harness trace logging works
- Cost tracking works
- Database logging works
- No breaking changes to existing integrations

**References**:
- Spec: `spec.md:402-422`, `spec.md:580-644`
- Context integration: `spec.md:609-629`
- Safety integration: `spec.md:632-642`
- Harness integration: `spec.md:577-595`
- Cost integration: `spec.md:596-608`

---

### **Phase 7: Agent Integration**

#### [ ] Task 7.1: Migrate Supervisor Agent
**File**: `lib/agents/supervisor.ts`

**Actions**:
- Replace import of `llmClient` with `aiGateway`
- Update all `llmClient.call()` calls to `aiGateway.call()`
- Add `taskType: 'general_chat'` to all gateway calls
- Preserve all existing options (temperature, tools, etc.)
- Keep all integrations (harness, cost, context, safety)

**Verification**:
- Supervisor routes correctly
- No TypeScript errors
- All existing tests pass
- Manual test: Verify supervisor conversation works

**References**:
- Current: `lib/agents/supervisor.ts:15`
- Pattern: `spec.md:169-190`

---

#### [ ] Task 7.2: Migrate Dojo Handler
**File**: `lib/agents/dojo-handler.ts`

**Actions**:
- Replace `new LLMClient()` with `aiGateway` import
- Update all LLM calls to use `aiGateway.call()`
- Add `taskType: 'general_chat'` to all gateway calls
- Preserve all existing functionality

**Verification**:
- Dojo modes work correctly (Mirror, Scout, Gardener)
- No TypeScript errors
- Manual test: Verify all Dojo modes work

**References**:
- Pattern: `spec.md:169-190`

---

#### [ ] Task 7.3: Migrate Builder Handler
**File**: `lib/agents/builder-handler.ts`

**Actions**:
- Replace `new LLMClient()` with `aiGateway` import
- Update all LLM calls to use `aiGateway.call()`
- Add `taskType: 'code_generation'` to all gateway calls
- Preserve all existing functionality

**Verification**:
- Builder code generation works
- No TypeScript errors
- Manual test: Verify code generation works

**References**:
- Pattern: `spec.md:169-190`
- Task type: `spec.md:182-190`

---

#### [ ] Task 7.4: Migrate Debugger Handler
**File**: `lib/agents/debugger-handler.ts`

**Actions**:
- Replace `new LLMClient()` with `aiGateway` import
- Update all LLM calls to use `aiGateway.call()`
- Add `taskType: 'complex_reasoning'` to all gateway calls
- Preserve all existing functionality

**Verification**:
- Debugger analysis works
- Uses deepseek-reasoner for reasoning tasks
- No TypeScript errors
- Manual test: Verify debugger works

**References**:
- Pattern: `spec.md:169-190`
- Task type: `spec.md:182-190`

---

#### [ ] Task 7.5: Migrate Librarian Handler
**File**: `lib/agents/librarian-handler.ts`

**Actions**:
- Replace `llmClient` import with `aiGateway`
- Update all `callWithFallback()` calls to use `aiGateway.callWithFallback()`
- Add `taskType: 'content_synthesis'` to all gateway calls
- Preserve all existing functionality

**Verification**:
- Librarian critique generation works
- No TypeScript errors
- Manual test: Verify librarian works

**References**:
- Pattern: `spec.md:169-190`
- Task type: `spec.md:182-190`

---

### **Phase 8: Monitoring Dashboard**

#### [ ] Task 8.1: Create Gateway Log Query Utilities
**File**: `lib/pglite/ai-gateway-logs.ts`

**Actions**:
- Import getDB from client
- Create `getGatewayLogs()` function:
  - Accept: limit, offset, filters (provider, taskType, userId, sessionId)
  - Query ai_gateway_logs table with filters
  - Return paginated results ordered by created_at DESC
- Create `getAggregatedMetrics()` function:
  - Accept: timeRange (e.g., '24h', '7d', '30d')
  - Aggregate: total requests, avg latency, total cost, error rate
  - Group by: provider, task_type, hour/day
- Create `getProviderStats()` function:
  - Return: request count, success rate, avg latency per provider
  - Include health status indicators
- Export all query functions

**Verification**:
- Query functions return correct data
- Filters work correctly
- Aggregations calculate properly
- No database errors

**References**:
- Spec: `spec.md:198-208`
- Database schema: `lib/pglite/migrations/012_add_ai_gateway.ts`

---

#### [ ] Task 8.2: Create Dashboard Components
**Files**: 
- `components/ai-gateway/LogsTable.tsx`
- `components/ai-gateway/MetricsCharts.tsx`
- `components/ai-gateway/ProviderStatus.tsx`

**Actions - LogsTable.tsx**:
- Create table component displaying recent requests
- Columns: timestamp, task_type, provider, model, latency, cost, status
- Support filtering by provider, task type, status
- Support pagination

**Actions - MetricsCharts.tsx**:
- Create chart components for performance metrics
- Charts: latency over time, requests by provider, cost by task type
- Use existing chart patterns from cost dashboard
- Real-time updates with SWR

**Actions - ProviderStatus.tsx**:
- Create status indicator component
- Show: provider name, health status, success rate, avg latency
- Color-coded: green (healthy), yellow (degraded), red (down)

**Verification**:
- Components render without errors
- Data displays correctly
- Charts update in real-time
- UI is responsive

**References**:
- Spec: `spec.md:198-250`

---

#### [ ] Task 8.3: Create Dashboard Page
**File**: `app/admin/ai-gateway/page.tsx`

**Actions**:
- Create admin page at `/admin/ai-gateway`
- Import dashboard components
- Use SWR for data fetching (poll every 5 seconds)
- Layout sections:
  - Provider status indicators (top)
  - Performance metrics charts (middle)
  - Recent logs table (bottom)
- Add filters for time range, provider, task type
- Add export functionality for logs
- Style with existing Tailwind patterns

**Verification**:
- Page loads without errors
- All sections render correctly
- Real-time updates work (5s polling)
- Filters work correctly
- Export functionality works
- Screenshot verification ✅

**References**:
- Spec: `spec.md:236-250`
- Pattern: Existing admin pages in `app/admin/`

---

### **Phase 9: Testing & Validation**

#### [ ] Task 9.1: Test Database Migration
**Actions**:
- Clear browser IndexedDB
- Reload app and verify migration runs
- Check console for migration logs
- Verify tables created in IndexedDB
- Verify seed data inserted

**Verification**:
- Migration runs without errors
- Both tables exist with correct schema
- Indexes created
- Seed data present

---

#### [ ] Task 9.2: Test Provider Adapters
**Actions**:
- Create simple test script or use browser console
- Test DeepSeek adapter with sample request
- Test OpenAI adapter with sample request
- Test error handling (invalid API key, timeout)
- Test health tracking (consecutive failures)

**Verification**:
- Both adapters make successful calls
- Responses properly normalized
- Errors properly handled
- Health tracking updates correctly

---

#### [ ] Task 9.3: Test Routing Logic
**Actions**:
- Test all 6 task types route to correct models
- Test fallback when primary provider unavailable
- Test default task type when none specified
- Test router with degraded provider

**Verification**:
- All task types route correctly
- Fallback logic works
- Default task type works
- Router skips degraded providers

---

#### [ ] Task 9.4: Test Agent Integration
**Actions**:
- Test each migrated agent manually:
  - Supervisor: Route a test request
  - Dojo: Test Mirror, Scout, Gardener modes
  - Builder: Generate sample code
  - Debugger: Analyze sample error
  - Librarian: Generate critique
- Verify no regressions in functionality
- Check console for errors
- Verify requests logged to database

**Verification**:
- All agents work correctly
- No console errors
- Requests appear in ai_gateway_logs
- Context builder still works
- Safety switch still works
- Cost tracking still works
- Screenshot verification for each agent ✅

---

#### [ ] Task 9.5: Test Monitoring Dashboard
**Actions**:
- Navigate to `/admin/ai-gateway`
- Verify all sections render
- Make several agent requests
- Verify logs appear in dashboard
- Verify charts update
- Test filters and pagination
- Test export functionality
- Wait 5 seconds and verify real-time update

**Verification**:
- Dashboard loads without errors
- Logs display correctly
- Charts show data
- Provider status accurate
- Real-time updates work
- Screenshot verification ✅

---

#### [ ] Task 9.6: Run Lint and Type Check
**Actions**:
- Run `npm run lint`
- Fix any linting errors
- Run `npm run type-check`
- Fix any type errors

**Verification**:
- `npm run lint` passes with 0 warnings
- `npm run type-check` passes with 0 errors

**Commands**:
```bash
npm run lint
npm run type-check
```

---

#### [ ] Task 9.7: Run Build
**Actions**:
- Run `npm run build`
- Fix any build errors
- Verify production build succeeds

**Verification**:
- Build completes successfully
- No build errors or warnings

**Commands**:
```bash
npm run build
```

---

#### [ ] Task 9.8: Run Existing Test Suites
**Actions**:
- Run `npm run test:llm`
- Run `npm run test:context`
- Run `npm run test:safety`
- Run `npm run test:harness`
- Fix any test failures

**Verification**:
- All existing test suites pass
- No regressions in existing features

**Commands**:
```bash
npm run test:llm
npm run test:context
npm run test:safety
npm run test:harness
```

---

### **Phase 10: Documentation & Cleanup**

#### [ ] Task 10.1: Update CLAUDE.md (if exists)
**Actions**:
- Check if CLAUDE.md exists in project root
- If exists, add section about AI Gateway
- Document: how to use aiGateway, task types, monitoring dashboard
- Add commands for testing and verification

**Verification**:
- Documentation is clear and accurate
- Examples are correct

---

#### [ ] Task 10.2: Final Verification Checklist
**Actions**:
- ✅ All migrations run successfully
- ✅ Configuration file created and valid
- ✅ All provider adapters functional
- ✅ Routing logic works correctly
- ✅ All 5 agents migrated and working
- ✅ Monitoring dashboard operational
- ✅ Database logging works
- ✅ Cost tracking preserved
- ✅ Context builder preserved
- ✅ Safety switch preserved
- ✅ Harness trace preserved
- ✅ Lint passes
- ✅ Type check passes
- ✅ Build succeeds
- ✅ All existing tests pass
- ✅ Screenshots captured for verification

**Verification**:
- All checklist items complete
- No outstanding errors or warnings
- System ready for use

---

## Success Criteria

### Functional Requirements
- ✅ AI Gateway routes requests to correct providers based on task type
- ✅ Automatic fallback works when primary provider fails
- ✅ All 5 agents successfully migrated without regressions
- ✅ Database logging captures all requests
- ✅ Monitoring dashboard displays real-time metrics

### Non-Functional Requirements
- ✅ Gateway overhead < 10ms per request
- ✅ No breaking changes to existing features
- ✅ Backward compatible with LLMClient interface
- ✅ TypeScript compilation with 0 errors
- ✅ Production build succeeds

### Integration Requirements
- ✅ Context Builder integration preserved
- ✅ Safety Switch integration preserved
- ✅ Harness Trace logging preserved
- ✅ Cost Guard tracking preserved

---

## Testing Strategy

### Unit Testing
- Provider adapters (call, error handling, health tracking)
- Router (task classification, model selection, fallback logic)
- Logger (database writes, error handling)

### Integration Testing
- Gateway end-to-end (request → route → call → log → response)
- Agent integration (all 5 agents)
- Dashboard data flow (logs → query → display)

### Manual Testing
- Each agent tested in browser with screenshots
- Dashboard tested with real data and screenshots
- Error scenarios tested (API failures, timeouts)

### Performance Testing
- Gateway overhead measurement
- Database logging non-blocking verification
- Dashboard load time measurement

---

## Rollback Plan

If critical issues arise during implementation:

1. **Phase 1-3**: No rollback needed (new code only)
2. **Phase 4-6**: No rollback needed (gateway not yet used)
3. **Phase 7**: Revert agent file changes (keep old LLMClient usage)
4. **Phase 8-10**: Disable dashboard route, keep gateway for future use

**Critical**: LLMClient remains functional throughout migration for safe rollback.

---

## Notes

- **Browser-Only Database**: PGlite runs only in browser (IndexedDB), not in API routes
- **API Keys Required**: DEEPSEEK_API_KEY and OPENAI_API_KEY must be set
- **Backward Compatibility**: LLMClient preserved until all agents migrated
- **No Breaking Changes**: Existing features (context, safety, harness, cost) must continue working
- **Screenshot Verification**: Required for agent testing and dashboard validation
