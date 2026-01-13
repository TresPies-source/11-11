import OpenAI from 'openai';
import type { ModelConfig, LLMCallOptions, LLMResponse, LLMProvider, TokenUsage } from './types';
import { LLMError, LLMAuthError, LLMRateLimitError, LLMTimeoutError } from './types';
import { getModelConfig, getModelForAgent, getFallbackModel, calculateCost } from './registry';
import { logEvent, isTraceActive } from '../harness/trace';

const DEFAULT_TIMEOUT = 30000;

/**
 * Checks if the application is running in dev mode.
 * @returns true if NEXT_PUBLIC_DEV_MODE is set to 'true'
 */
export function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true';
}

/**
 * Checks if a valid API key is configured for the given provider.
 * @param provider - LLM provider to check ('deepseek' or 'openai')
 * @returns true if API key exists and is valid (starts with 'sk-')
 */
export function hasValidAPIKey(provider: LLMProvider): boolean {
  if (provider === 'deepseek') {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    return !!(apiKey && apiKey !== 'your-deepseek-api-key-here' && apiKey.startsWith('sk-'));
  } else if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    return !!(apiKey && apiKey !== 'your-openai-api-key-here' && apiKey.startsWith('sk-'));
  }
  return false;
}

/**
 * Checks if a provider can be used (has valid API key).
 * In dev mode, warns if API key is missing but allows operation.
 * @param provider - LLM provider to check
 * @returns true if provider has valid API key
 */
export function canUseProvider(provider: LLMProvider): boolean {
  if (isDevMode()) {
    if (!hasValidAPIKey(provider)) {
      console.warn(`[LLM] Running in dev mode without ${provider} API key`);
      return false;
    }
  }
  return hasValidAPIKey(provider);
}

/**
 * Unified LLM client supporting multiple providers (DeepSeek, OpenAI).
 * Singleton instance handles:
 * - Multi-provider API calls
 * - Automatic fallback (DeepSeek → GPT-4o-mini)
 * - Cost tracking (integration with Cost Guard)
 * - Event logging (integration with Harness Trace)
 */
export class LLMClient {
  private clients: Map<LLMProvider, OpenAI> = new Map();

  constructor() {
    this.initializeClients();
  }

  private initializeClients(): void {
    if (hasValidAPIKey('deepseek')) {
      this.clients.set('deepseek', new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com',
        timeout: DEFAULT_TIMEOUT,
        maxRetries: 2,
      }));
    }

    if (hasValidAPIKey('openai')) {
      this.clients.set('openai', new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: 'https://api.openai.com/v1',
        timeout: DEFAULT_TIMEOUT,
        maxRetries: 2,
      }));
    }
  }

  private getClient(provider: LLMProvider): OpenAI {
    const client = this.clients.get(provider);
    if (!client) {
      throw new LLMAuthError(`${provider} client not initialized. Check API key configuration.`);
    }
    return client;
  }

  /**
   * Makes an LLM API call to the specified model.
   * Automatically tracks cost and logs events to Harness Trace.
   * @param modelName - Name of the model to call
   * @param messages - Chat messages
   * @param options - Call options (temperature, maxTokens, tools, etc.)
   * @returns LLM response with content and usage
   * @throws LLMAuthError if API key is invalid
   * @throws LLMRateLimitError if rate limit exceeded
   * @throws LLMTimeoutError if request times out
   */
  async call(
    modelName: string,
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options: LLMCallOptions = {}
  ): Promise<LLMResponse> {
    const modelConfig = getModelConfig(modelName);
    const client = this.getClient(modelConfig.provider);

    const startTime = Date.now();

    try {
      if (isTraceActive()) {
        logEvent('TOOL_INVOCATION', {
          tool: 'llm',
          model: modelName,
          provider: modelConfig.provider,
          message_count: messages.length,
        }, {}, {});
      }

      const completionParams: OpenAI.Chat.ChatCompletionCreateParams = {
        model: modelConfig.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? modelConfig.maxOutput,
      };

      if (options.tools && options.tools.length > 0) {
        completionParams.tools = options.tools;
      }

      if (options.responseFormat) {
        completionParams.response_format = options.responseFormat;
      }

      const timeout = options.timeout || DEFAULT_TIMEOUT;
      const completionPromise = client.chat.completions.create(completionParams);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new LLMTimeoutError(`Request timed out after ${timeout}ms`)), timeout);
      });

      const completion = await Promise.race([completionPromise, timeoutPromise]);

      const duration = Date.now() - startTime;
      const usage: TokenUsage = {
        prompt_tokens: completion.usage?.prompt_tokens ?? 0,
        completion_tokens: completion.usage?.completion_tokens ?? 0,
        total_tokens: completion.usage?.total_tokens ?? 0,
      };

      const cost = calculateCost(modelName, usage);

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
          token_count: usage.total_tokens,
          cost_usd: cost,
        });
      }

      const content = completion.choices[0]?.message?.content ?? '';
      const toolCalls = completion.choices[0]?.message?.tool_calls;

      return {
        content,
        usage,
        finishReason: completion.choices[0]?.finish_reason,
        toolCalls,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      if (isTraceActive()) {
        logEvent('ERROR', {
          tool: 'llm',
          model: modelName,
          provider: modelConfig.provider,
        }, {
          error: true,
        }, {
          duration_ms: duration,
          error_message: error?.message || String(error),
        });
      }

      if (error instanceof LLMTimeoutError) {
        throw error;
      }

      if (error?.status === 401 || error?.code === 'invalid_api_key') {
        throw new LLMAuthError(`${modelConfig.provider} API key is invalid`);
      }

      if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
        throw new LLMRateLimitError(`${modelConfig.provider} rate limit exceeded. Please try again later.`);
      }

      if (error?.status === 408 || error?.code === 'ETIMEDOUT') {
        throw new LLMTimeoutError(`${modelConfig.provider} request timed out`);
      }

      throw new LLMError(
        error?.message || 'Unknown LLM error',
        error?.code,
        error?.status,
        error
      );
    }
  }

  /**
   * Makes an LLM API call with automatic fallback to GPT-4o-mini on error.
   * Determines the optimal model for the agent and tries primary model first.
   * Optionally uses hierarchical context management when userId is provided.
   * @param agentName - Name of the agent (e.g., 'supervisor', 'debugger')
   * @param messages - Chat messages
   * @param options - Call options (including userId for context management)
   * @returns LLM response
   * @throws Error if both primary and fallback models fail
   */
  async callWithFallback(
    agentName: string,
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options: LLMCallOptions = {}
  ): Promise<LLMResponse> {
    const primaryModel = getModelForAgent(agentName);
    const fallbackModel = getFallbackModel();

    let processedMessages = messages;
    let contextResult: any = null;

    if (options.userId && options.enableContextBuilder !== false) {
      try {
        const { buildContext } = await import('../context/builder');
        
        contextResult = await buildContext({
          agent: agentName,
          messages,
          userId: options.userId,
          sessionId: options.sessionId,
        });
        
        processedMessages = contextResult.messages;
        
        if (isTraceActive()) {
          logEvent('CONTEXT_BUILD', {
            agent: agentName,
            original_message_count: messages.length,
            context_message_count: contextResult.messages.length,
          }, {
            success: true,
            token_savings: messages.length > 0 ? 
              Math.round((1 - contextResult.totalTokens / (messages.length * 500)) * 100) : 0,
          }, {
            total_tokens: contextResult.totalTokens,
            tier_breakdown: contextResult.tierBreakdown,
            budget_percent: contextResult.budgetPercent,
            pruning_strategy: contextResult.pruningStrategy.budgetRange,
          });
        }
      } catch (error) {
        console.warn('[LLM] Context builder failed, using original messages:', error);
        
        if (isTraceActive()) {
          logEvent('ERROR', {
            tool: 'context_builder',
            agent: agentName,
          }, {
            error: true,
          }, {
            error_message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    try {
      return await this.call(primaryModel, processedMessages, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`[LLM] Primary model ${primaryModel} failed: ${errorMessage}`);

      if (isTraceActive()) {
        logEvent('AGENT_HANDOFF', {
          from_agent: agentName,
          to_agent: 'fallback',
          from_model: primaryModel,
          to_model: fallbackModel,
        }, {
          fallback: true,
        }, {
          error_message: errorMessage,
        });
      }

      try {
        return await this.call(fallbackModel, processedMessages, options);
      } catch (fallbackError) {
        const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        console.error(`[LLM] Fallback model ${fallbackModel} also failed: ${fallbackErrorMessage}`);
        throw fallbackError;
      }
    }
  }

  /**
   * Makes an LLM API call that returns JSON-formatted output.
   * @param modelName - Name of the model to call
   * @param messages - Chat messages
   * @param options - Call options
   * @returns Parsed JSON data and token usage
   * @throws LLMError if JSON parsing fails
   */
  async createJSONCompletion<T = any>(
    modelName: string,
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options: LLMCallOptions = {}
  ): Promise<{ data: T; usage: TokenUsage }> {
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

  /**
   * Resets and re-initializes all provider clients.
   * Useful for testing or when API keys are updated.
   */
  resetClients(): void {
    this.clients.clear();
    this.initializeClients();
  }
}

/**
 * Singleton instance of LLMClient for use across the application.
 * Import and use this instance rather than creating new clients.
 */
export const llmClient = new LLMClient();
