# 11-11 AI Gateway: Technical Specification

**Author:** Manus AI (Dojo)
**Status:** v1.0 - Final
**Date:** 2025-01-16

---

## 1. Database Schema

To support the AI Gateway, we will introduce two new tables to the PGlite database:

### `ai_providers`
This table stores the configuration for each AI provider, including their name, API base URL, and any other relevant metadata.

```sql
CREATE TABLE ai_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    api_base_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `ai_gateway_logs`
This table logs every request that passes through the AI Gateway. This is critical for monitoring, debugging, and analytics.

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
```

## 2. API Signatures

The AI Gateway will expose a single public method, `call()`, and a set of internal interfaces for the router and adapters.

### Public Interface (`/lib/ai-gateway/index.ts`)

```typescript
interface GatewayRequest {
    taskType: string;
    messages: { role: 'user' | 'assistant'; content: string }[];
    userId?: string;
    sessionId?: string;
    // ... other metadata
}

interface GatewayResponse {
    content: string;
    usage: { input_tokens: number; output_tokens: number };
    finishReason: string;
    // ... other metadata
}

class AIGateway {
    async call(request: GatewayRequest): Promise<GatewayResponse>;
}
```

### Internal Interfaces

#### Router (`/lib/ai-gateway/router.ts`)

```typescript
interface IRouter {
    route(request: GatewayRequest): Promise<SelectedRoute>;
}

interface SelectedRoute {
    provider: IProviderAdapter;
    model: string;
}
```

#### Provider Adapter (`/lib/ai-gateway/adapters/base.ts`)

```typescript
interface IProviderAdapter {
    call(request: GatewayRequest, model: string): Promise<GatewayResponse>;
}
```

## 3. Configuration

The AI Gateway will be configured via a new `ai-gateway.config.ts` file in the `/config` directory. This file will define the provider registry, routing rules, and fallback chains.

```typescript
// /config/ai-gateway.config.ts

export const aiGatewayConfig = {
    providers: [
        { id: 'anthropic', name: 'Anthropic', ... },
        { id: 'deepseek', name: 'DeepSeek', ... },
        { id: 'google', name: 'Google', ... },
        { id: 'openai', name: 'OpenAI', ... },
    ],
    routingRules: [
        { taskType: 'architecting', primary: 'anthropic/claude-4', fallback: 'openai/gpt-4' },
        { taskType: 'code_generation', primary: 'deepseek/deepseek-coder', fallback: 'openai/gpt-4' },
        // ... other rules
    ],
};
```

## 4. Integration with Agents

To integrate the AI Gateway with the existing agent architecture, we will refactor the `dojo-handler.ts`, `builder-handler.ts`, and other agent files to use the new gateway instead of the old `LLMClient`.

### Example: Refactoring `dojo-handler.ts`

**Before:**

```typescript
// lib/agents/dojo-handler.ts

const llmClient = new LLMClient();

// ...

const response = await llmClient.call({
    model: 'deepseek-chat',
    messages: [...],
});
```

**After:**

```typescript
// lib/agents/dojo-handler.ts

import { aiGateway } from '~/lib/ai-gateway';

// ...

const response = await aiGateway.call({
    taskType: 'general_chat',
    messages: [...],
});
```

This simple change will automatically route the request to the best available model for general chat, with built-in fallback and monitoring.

## 5. Monitoring & Analytics

The `ai_gateway_logs` table will be the foundation for a new **AI Gateway Dashboard** in the 11-11 application. This dashboard will provide real-time insights into the performance, cost, and usage of the AI Gateway.

### Dashboard Features

- **Real-Time Log Stream:** A live view of all requests passing through the gateway.
- **Performance Metrics:** Charts showing latency, error rates, and token usage per provider and model.
- **Cost Analysis:** A breakdown of costs by user, session, and task type.
- **Usage Patterns:** Insights into which models are being used most frequently and for which tasks.
- **Alerting:** Automatic alerts for high error rates, latency spikes, or budget overruns.

### Implementation

The dashboard will be built as a new page at `/admin/ai-gateway` and will use a combination of server-side rendering and client-side fetching to display the data from the `ai_gateway_logs` table.
