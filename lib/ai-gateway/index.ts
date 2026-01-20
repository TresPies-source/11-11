import type { GatewayRequest, GatewayResponse } from './types';
import { LLMError, LLMAuthError, LLMRateLimitError, LLMTimeoutError } from './types';
import type { IRouter } from './router';
import { router } from './router';
import type { GatewayConfig } from '@/config/ai-gateway.config';
import { aiGatewayConfig } from '@/config/ai-gateway.config';
import { logGatewayRequest, generateRequestId } from './logger';
import { calculateCost, getModelConfig } from '@/lib/llm/registry';
import { logEvent, isTraceActive, startSpan, endSpan } from '@/lib/harness/trace';
import { 
  getSafetyStatus, 
  activateSafetySwitch, 
  shouldActivateSafetySwitch, 
  getErrorReason 
} from '@/lib/safety/switch';
import { applyConservativeMode, getConservativeModel } from '@/lib/safety/conservative-mode';
import { trackSuccessfulOperation } from '@/lib/safety/recovery';
import type OpenAI from 'openai';

const ESTIMATED_TOKENS_PER_MESSAGE = 500;

/**
 * AI Gateway - Intelligent multi-provider LLM routing system.
 * 
 * Routes requests to the optimal provider and model based on task type,
 * with automatic fallback, health tracking, and comprehensive observability.
 * 
 * **Features:**
 * - Task-based intelligent routing (code generation, reasoning, chat, etc.)
 * - Automatic fallback chain execution on provider failures
 * - Health-aware routing (skips degraded providers)
 * - Integration with existing platform features:
 *   - Context Builder (hierarchical message management)
 *   - Safety Switch (conservative mode on errors)
 *   - Harness Trace (nested span logging)
 *   - Cost Guard (per-request cost tracking)
 * - Database logging of all requests/responses
 * - Backward compatible with LLMClient API
 * 
 * **Architecture:**
 * ```
 * AIGateway
 *   ├── Router (task classification → provider selection)
 *   ├── Adapters (provider-specific API calls)
 *   │   ├── DeepSeek
 *   │   ├── OpenAI
 *   │   ├── Anthropic
 *   │   └── Google
 *   └── Logger (request/response persistence)
 * ```
 * 
 * @example
 * ```typescript
 * // Direct call with task type
 * const response = await aiGateway.call(messages, {
 *   taskType: 'code_generation',
 *   temperature: 0.3,
 *   userId: 'user-123',
 * });
 * 
 * // LLMClient-compatible call
 * const response = await aiGateway.call('deepseek-chat', messages, {
 *   temperature: 0.7,
 * });
 * 
 * // Agent integration (backward compatible)
 * const response = await aiGateway.callWithFallback('dojo', messages, {
 *   sessionId: 'sess-456',
 *   userId: 'user-123',
 * });
 * ```
 */
export class AIGateway {
  private router: IRouter;
  private config: GatewayConfig;

  constructor(router: IRouter, config: GatewayConfig) {
    this.router = router;
    this.config = config;
  }

  /**
   * Makes an LLM API call with intelligent routing and automatic fallback.
   * 
   * **Supports two call patterns:**
   * 
   * 1. **Gateway pattern** (recommended for new code):
   *    ```typescript
   *    call(messages, options)
   *    ```
   *    Routes based on `options.taskType`, uses intelligent provider selection.
   * 
   * 2. **LLMClient pattern** (backward compatibility):
   *    ```typescript
   *    call(modelName, messages, options)
   *    ```
   *    Routes to specific model, still uses fallback chain.
   * 
   * **Request Flow:**
   * 1. Check safety switch status → apply conservative mode if active
   * 2. Apply context builder (if userId provided) → optimize message history
   * 3. Route request → select primary provider + fallback chain
   * 4. Try primary provider → on success: log + return
   * 5. On failure → try next provider in fallback chain
   * 6. Track health → update consecutive failure count
   * 7. Log all requests to database (async, non-blocking)
   * 8. Update harness trace spans (if active)
   * 
   * @param modelOrMessages - Either model name (string) or messages array
   * @param messagesOrOptions - Either messages array or options object
   * @param optionsParam - Options object (only if using 3-param signature)
   * @returns LLM response with content, usage, and metadata
   * 
   * @throws {LLMAuthError} if API key is invalid for all providers
   * @throws {LLMRateLimitError} if rate limit exceeded on all providers
   * @throws {LLMTimeoutError} if request times out on all providers
   * @throws {LLMError} if all providers fail
   * 
   * @example
   * ```typescript
   * // Gateway pattern - intelligent routing
   * const response = await aiGateway.call(
   *   [{ role: 'user', content: 'Write a function to sort an array' }],
   *   {
   *     taskType: 'code_generation',  // Routes to DeepSeek
   *     temperature: 0.3,
   *     userId: 'user-123',
   *     sessionId: 'sess-456',
   *   }
   * );
   * 
   * // LLMClient pattern - specific model
   * const response = await aiGateway.call(
   *   'gpt-4o-mini',
   *   [{ role: 'user', content: 'Hello!' }],
   *   { temperature: 0.7 }
   * );
   * ```
   */
  async call(
    modelOrMessages: string | OpenAI.Chat.ChatCompletionMessageParam[],
    messagesOrOptions?: OpenAI.Chat.ChatCompletionMessageParam[] | GatewayRequest,
    optionsParam?: GatewayRequest
  ): Promise<GatewayResponse> {
    // Resolve overloaded parameters (gateway pattern vs LLMClient pattern)
    let messages: OpenAI.Chat.ChatCompletionMessageParam[];
    let options: GatewayRequest;

    if (typeof modelOrMessages === 'string') {
      // LLMClient pattern: call(modelName, messages, options)
      messages = messagesOrOptions as OpenAI.Chat.ChatCompletionMessageParam[];
      options = optionsParam || {};
    } else {
      // Gateway pattern: call(messages, options)
      messages = modelOrMessages;
      options = (messagesOrOptions as GatewayRequest) || {};
    }

    const requestId = generateRequestId();
    const startTime = Date.now();
    
    // INTEGRATION 1: Safety Switch - Apply conservative mode if active
    // Conservative mode reduces temperature, limits tokens, uses simpler models
    const safetyStatus = getSafetyStatus(options.sessionId);
    let request: GatewayRequest = {
      ...options,
      messages,
    };

    if (safetyStatus.active) {
      request = {
        ...applyConservativeMode(request),
        messages,
      };

      if (isTraceActive()) {
        logEvent('SAFETY_SWITCH', {
          action: 'conservative_mode_applied',
          agent: request.agentName,
          sessionId: options.sessionId,
        }, {
          status: 'active',
        }, {
          reason: safetyStatus.reason,
        });
      }
    }

    // INTEGRATION 2: Context Builder - Optimize message history with tiered storage
    // This reduces token usage by intelligently pruning old messages
    let processedMessages = messages;
    let contextResult: any = null;

    if (options.userId && options.enableContextBuilder !== false) {
      try {
        const { buildContext } = await import('../context/builder');
        
        contextResult = await buildContext({
          agent: options.agentName || 'unknown',
          messages,
          userId: options.userId,
          sessionId: options.sessionId,
        });
        
        processedMessages = contextResult.messages;
        
        if (isTraceActive()) {
          logEvent('CONTEXT_BUILD', {
            agent: options.agentName || 'unknown',
            original_message_count: messages.length,
            context_message_count: contextResult.messages.length,
          }, {
            success: true,
            token_savings: messages.length > 0 ? 
              Math.round((1 - contextResult.totalTokens / (messages.length * ESTIMATED_TOKENS_PER_MESSAGE)) * 100) : 0,
          }, {
            total_tokens: contextResult.totalTokens,
            tier_breakdown: contextResult.tierBreakdown,
            budget_percent: contextResult.budgetPercent,
            pruning_strategy: contextResult.pruningStrategy.budgetRange,
          });
        }
      } catch (error) {
        // Context builder failure is non-fatal - fall back to original messages
        console.warn('[AIGateway] Context builder failed, using original messages:', error);
        
        if (isTraceActive()) {
          logEvent('ERROR', {
            tool: 'context_builder',
            agent: options.agentName || 'unknown',
          }, {
            error: true,
          }, {
            error_message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    request.messages = processedMessages;

    // INTEGRATION 3: Harness Trace - Start span for observability
    let spanId: string | null = null;
    if (isTraceActive()) {
      spanId = startSpan('TOOL_INVOCATION', {
        tool: 'ai_gateway',
        taskType: request.taskType || this.config.defaultTaskType,
        agent: request.agentName,
        message_count: processedMessages.length,
      });
    }

    try {
      // CORE LOGIC: Route request to best provider + build fallback chain
      const route = await this.router.route(request);
      
      if (isTraceActive()) {
        logEvent('AI_GATEWAY_ROUTE', {
          taskType: request.taskType || this.config.defaultTaskType,
          provider: route.adapter.id,
          model: route.model,
        }, {
          success: true,
        }, {
          fallback_count: route.fallbackChain.length,
        });
      }

      // Build ordered list of adapters to try (primary first, then fallbacks)
      let lastError: Error | null = null;
      const adaptersToTry = [
        { adapter: route.adapter, model: route.model },
        ...route.fallbackChain,
      ];

      // FALLBACK CHAIN EXECUTION: Try each adapter until one succeeds
      for (let i = 0; i < adaptersToTry.length; i++) {
        const { adapter, model } = adaptersToTry[i];
        const isFallback = i > 0;
        let adapterStartTime = Date.now();

        try {
          // Attempt API call to provider
          const response = await adapter.call(request, model);
          const adapterLatency = Date.now() - adapterStartTime;

          // SUCCESS: Reset health tracking for this adapter
          adapter.resetHealth();

          // INTEGRATION 4: Cost Guard - Calculate cost for this request
          let cost = 0;
          try {
            const modelConfig = getModelConfig(model);
            cost = calculateCost(model, response.usage);
          } catch (error) {
            console.warn(`[AIGateway] Could not calculate cost for model ${model}:`, error);
          }

          const totalLatency = Date.now() - startTime;

          // INTEGRATION 5: Database Logger - Persist request/response (async, non-blocking)
          logGatewayRequest({
            requestId,
            request,
            response,
            providerId: adapter.id,
            modelId: model,
            latencyMs: adapterLatency,
            costUsd: cost,
            userId: options.userId,
            sessionId: options.sessionId,
          }).catch(err => {
            console.warn('[AIGateway] Failed to log request:', err);
          });

          // INTEGRATION 6: Harness Trace - End span with success metrics
          if (isTraceActive() && spanId) {
            endSpan(spanId, {
              success: true,
              provider: adapter.id,
              model: model,
              tokens: response.usage.total_tokens,
              cost_usd: cost,
              fallback: isFallback,
            }, {
              duration_ms: totalLatency,
              token_count: response.usage.total_tokens,
              cost_usd: cost,
            });
          }

          // INTEGRATION 7: Safety Switch - Track successful operation for recovery
          trackSuccessfulOperation(options.sessionId);

          return response;
        } catch (error) {
          // FAILURE: Record error and try next provider in chain
          lastError = error instanceof Error ? error : new Error(String(error));
          const errorMessage = lastError.message;

          console.warn(`[AIGateway] Provider ${adapter.id} (${model}) failed: ${errorMessage}`);

          // Log failed request to database
          const adapterLatency = Date.now() - adapterStartTime;
          logGatewayRequest({
            requestId,
            request,
            providerId: adapter.id,
            modelId: model,
            latencyMs: adapterLatency,
            error: lastError,
            userId: options.userId,
            sessionId: options.sessionId,
          }).catch(err => {
            console.warn('[AIGateway] Failed to log error:', err);
          });

          // Check if error should activate safety switch
          if (shouldActivateSafetySwitch(lastError)) {
            const reason = getErrorReason(lastError);
            await activateSafetySwitch(reason, {
              sessionId: options.sessionId,
              userId: options.userId,
              error: lastError,
            });
          }

          // Log fallback failure to trace
          if (isFallback && isTraceActive()) {
            logEvent('ERROR', {
              tool: 'ai_gateway',
              provider: adapter.id,
              model: model,
            }, {
              error: true,
              fallback_failed: true,
            }, {
              error_message: errorMessage,
            });
          }

          // If this was the last adapter in chain, throw the error
          if (i === adaptersToTry.length - 1) {
            throw lastError;
          }

          // Log handoff to next provider in fallback chain
          if (isTraceActive()) {
            logEvent('AGENT_HANDOFF', {
              from_provider: adapter.id,
              from_model: model,
              to_provider: adaptersToTry[i + 1].adapter.id,
              to_model: adaptersToTry[i + 1].model,
            }, {
              fallback: true,
            }, {
              error_message: errorMessage,
            });
          }

          // Continue to next adapter in chain
          continue;
        }
      }

      // All providers failed
      throw lastError || new LLMError('All providers failed');
    } catch (error) {
      // Top-level error handling: close span and re-throw
      const totalLatency = Date.now() - startTime;
      
      if (isTraceActive() && spanId) {
        endSpan(spanId, {
          error: true,
        }, {
          duration_ms: totalLatency,
          error_message: error instanceof Error ? error.message : String(error),
        });
      }

      throw error;
    }
  }

  /**
   * Makes an LLM API call with automatic fallback (LLMClient compatibility method).
   * 
   * This method maintains backward compatibility with the existing LLMClient API
   * while leveraging the new intelligent routing system.
   * 
   * **Behavior:**
   * - Uses agent name to determine task type (defaults to 'general_chat')
   * - Respects safety switch (switches to conservative mode if active)
   * - Automatically routes to best provider for the task
   * - Supports all existing LLMClient options
   * 
   * @param agentName - Name of the calling agent (e.g., 'supervisor', 'dojo')
   * @param messages - Chat messages to send
   * @param options - Request options (temperature, maxTokens, userId, etc.)
   * @returns LLM response
   * @throws {LLMError} if all providers fail
   * 
   * @example
   * ```typescript
   * // Supervisor agent call
   * const response = await aiGateway.callWithFallback(
   *   'supervisor',
   *   [{ role: 'user', content: 'Route this request' }],
   *   {
   *     temperature: 0.7,
   *     sessionId: 'sess-123',
   *     userId: 'user-456',
   *   }
   * );
   * 
   * // Dojo agent call with task type override
   * const response = await aiGateway.callWithFallback(
   *   'dojo',
   *   messages,
   *   {
   *     taskType: 'code_generation',
   *     temperature: 0.3,
   *   }
   * );
   * ```
   */
  async callWithFallback(
    agentName: string,
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options: GatewayRequest = {}
  ): Promise<GatewayResponse> {
    const safetyStatus = getSafetyStatus(options.sessionId);
    let taskType = options.taskType;

    // If safety switch is active, use conservative task type (general_chat)
    if (safetyStatus.active) {
      taskType = 'general_chat';
      
      if (isTraceActive()) {
        logEvent('SAFETY_SWITCH', {
          action: 'conservative_mode_applied',
          agent: agentName,
          sessionId: options.sessionId,
        }, {
          status: 'active',
          taskType: taskType,
        }, {
          reason: safetyStatus.reason,
        });
      }
    }

    const request: GatewayRequest = {
      ...options,
      messages,
      taskType: taskType || this.config.defaultTaskType,
      agentName,
    };

    return this.call(messages, request);
  }

  /**
   * Makes an LLM API call that returns JSON-formatted output.
   * 
   * Automatically sets `response_format: { type: 'json_object' }` and parses
   * the response as JSON. Useful for structured data extraction and tool calls.
   * 
   * @param modelName - Name of the model to call (e.g., 'deepseek-chat')
   * @param messages - Chat messages (should include instruction to output JSON)
   * @param options - Request options
   * @returns Parsed JSON data and token usage
   * @throws {LLMError} if JSON parsing fails or no content returned
   * 
   * @example
   * ```typescript
   * interface CodeAnalysis {
   *   language: string;
   *   complexity: number;
   *   suggestions: string[];
   * }
   * 
   * const { data, usage } = await aiGateway.createJSONCompletion<CodeAnalysis>(
   *   'deepseek-chat',
   *   [
   *     { role: 'system', content: 'Analyze code and return JSON' },
   *     { role: 'user', content: 'function foo() { return 42; }' },
   *   ],
   *   { temperature: 0.3 }
   * );
   * 
   * console.log(data.language);      // "javascript"
   * console.log(data.complexity);    // 1
   * console.log(usage.total_tokens); // 234
   * ```
   */
  async createJSONCompletion<T = any>(
    modelName: string,
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options: GatewayRequest = {}
  ): Promise<{ data: T; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
    const response = await this.call(modelName, messages, {
      ...options,
      responseFormat: { type: 'json_object' },
    });

    if (!response.content) {
      throw new LLMError('No content in LLM response');
    }

    try {
      const data = JSON.parse(response.content) as T;
      return { data, usage: response.usage };
    } catch (error) {
      throw new LLMError('Failed to parse JSON response from LLM', 'JSON_PARSE_ERROR');
    }
  }
}

/**
 * Singleton AI Gateway instance.
 * 
 * Configured with all provider adapters (DeepSeek, OpenAI, Anthropic, Google)
 * and routing rules defined in `config/ai-gateway.config.ts`.
 * 
 * **Usage:**
 * ```typescript
 * import { aiGateway } from '@/lib/ai-gateway';
 * 
 * const response = await aiGateway.call(messages, {
 *   taskType: 'code_generation',
 *   userId: 'user-123',
 * });
 * ```
 */
export const aiGateway = new AIGateway(router, aiGatewayConfig);
