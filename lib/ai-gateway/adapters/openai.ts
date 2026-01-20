import OpenAI from 'openai';
import type { IProviderAdapter } from './base';
import type { GatewayRequest, GatewayResponse } from '../types';
import { LLMError, LLMAuthError, LLMRateLimitError, LLMTimeoutError } from '../types';
import { aiGatewayConfig } from '@/config/ai-gateway.config';

const DEFAULT_TIMEOUT = 30000;

/**
 * OpenAI provider adapter for AI Gateway.
 * Handles communication with OpenAI API, including request formatting,
 * error handling, and health tracking.
 */
export class OpenAIAdapter implements IProviderAdapter {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  
  private client: OpenAI | null = null;
  private consecutiveFailures = 0;
  private isConfigured = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'your-openai-api-key-here') {
      this.client = new OpenAI({
        apiKey,
        baseURL: 'https://api.openai.com/v1',
        timeout: DEFAULT_TIMEOUT,
        maxRetries: 2,
      });
      this.isConfigured = true;
    }
  }

  /**
   * Makes an API call to OpenAI with the given request.
   * @param request - Gateway request with messages and options
   * @param model - Model name to use (e.g., 'gpt-4o-mini', 'gpt-4o')
   * @returns Response with content, usage, and metadata
   * @throws LLMAuthError if API key is invalid
   * @throws LLMRateLimitError if rate limit is exceeded
   * @throws LLMTimeoutError if request times out
   */
  async call(request: GatewayRequest, model: string): Promise<GatewayResponse> {
    if (!this.client || !this.isConfigured) {
      throw new LLMAuthError('OpenAI API key is invalid or not configured');
    }

    try {
      const messages = request.messages || [];
      const completionParams: OpenAI.Chat.ChatCompletionCreateParams = {
        model,
        messages,
        stream: false,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
      };

      if (request.tools && request.tools.length > 0) {
        completionParams.tools = request.tools;
      }

      if (request.responseFormat) {
        completionParams.response_format = request.responseFormat;
      }

      const timeout = request.timeout || DEFAULT_TIMEOUT;
      const completionPromise = this.client.chat.completions.create(completionParams);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new LLMTimeoutError(`Request timed out after ${timeout}ms`)), timeout);
      });

      const completion = await Promise.race([completionPromise, timeoutPromise]) as OpenAI.Chat.ChatCompletion;

      const usage = {
        prompt_tokens: completion.usage?.prompt_tokens ?? 0,
        completion_tokens: completion.usage?.completion_tokens ?? 0,
        total_tokens: completion.usage?.total_tokens ?? 0,
      };

      const content = completion.choices[0]?.message?.content ?? '';
      const toolCalls = completion.choices[0]?.message?.tool_calls;

      this.consecutiveFailures = 0;

      return {
        content,
        usage,
        finishReason: completion.choices[0]?.finish_reason,
        toolCalls,
      };
    } catch (error: any) {
      this.consecutiveFailures++;

      if (error instanceof LLMTimeoutError) {
        throw error;
      }

      if (error?.status === 401 || error?.code === 'invalid_api_key') {
        throw new LLMAuthError('OpenAI API key is invalid');
      }

      if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
        throw new LLMRateLimitError('OpenAI rate limit exceeded. Please try again later.');
      }

      if (error?.status === 408 || error?.code === 'ETIMEDOUT') {
        throw new LLMTimeoutError('OpenAI request timed out');
      }

      throw new LLMError(
        error?.message || 'Unknown OpenAI error',
        error?.code,
        error?.status,
        error
      );
    }
  }

  /**
   * Checks if the adapter is available for use.
   * Returns false if consecutive failures exceed threshold.
   */
  isAvailable(): boolean {
    return this.isConfigured && this.consecutiveFailures < aiGatewayConfig.maxConsecutiveFailures;
  }

  /**
   * Gets the current count of consecutive failures.
   */
  getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  /**
   * Resets the health tracking state.
   * Called after successful requests to clear failure count.
   */
  resetHealth(): void {
    this.consecutiveFailures = 0;
  }
}

export const openaiAdapter = new OpenAIAdapter();
