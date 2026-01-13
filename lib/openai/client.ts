/**
 * @deprecated This client is being phased out in favor of the unified LLM client (lib/llm/client.ts)
 * 
 * Migration Guide:
 * - Use `llmClient.callWithFallback(agentName, messages)` instead of `createChatCompletion()`
 * - New client supports DeepSeek (primary) + OpenAI (fallback) with automatic routing
 * - Cost tracking and Harness Trace integration built-in
 * 
 * Kept for backward compatibility during v0.3.5 migration.
 * Will be removed in v0.4.0 after all agents are migrated.
 */

import OpenAI from 'openai';
import {
  OpenAIConfig,
  OpenAIAuthError,
  OpenAIRateLimitError,
  OpenAITimeoutError,
  OpenAIError,
  DEFAULT_ROUTING_TIMEOUT,
} from './types';

let openaiClientInstance: OpenAI | null = null;

export function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true';
}

export function hasValidAPIKey(): boolean {
  const apiKey = process.env.OPENAI_API_KEY;
  return !!(apiKey && apiKey !== 'your-openai-api-key-here' && apiKey.startsWith('sk-'));
}

export function canUseOpenAI(): boolean {
  if (isDevMode()) {
    if (!hasValidAPIKey()) {
      console.warn('[OpenAI] Running in dev mode without API key - routing will use keyword fallback');
      return false;
    }
  }
  return hasValidAPIKey();
}

export function getOpenAIClient(config?: OpenAIConfig): OpenAI {
  if (openaiClientInstance) {
    return openaiClientInstance;
  }

  const apiKey = config?.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your-openai-api-key-here') {
    throw new OpenAIAuthError('OpenAI API key is not configured');
  }

  openaiClientInstance = new OpenAI({
    apiKey,
    organization: config?.organization,
    baseURL: config?.baseURL,
    timeout: config?.timeout || DEFAULT_ROUTING_TIMEOUT,
    maxRetries: 2,
  });

  return openaiClientInstance;
}

export function resetOpenAIClient(): void {
  openaiClientInstance = null;
}

export async function createChatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: 'json_object' | 'text' };
    timeout?: number;
  } = {}
): Promise<OpenAI.Chat.ChatCompletion> {
  if (!canUseOpenAI()) {
    throw new OpenAIAuthError('OpenAI API is not available in dev mode without valid API key');
  }

  const client = getOpenAIClient();
  const timeout = options.timeout || DEFAULT_ROUTING_TIMEOUT;

  try {
    const completionPromise = client.chat.completions.create({
      model: options.model || 'gpt-4o-mini',
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens,
      response_format: options.response_format,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new OpenAITimeoutError(`Request timed out after ${timeout}ms`)), timeout);
    });

    const completion = await Promise.race([completionPromise, timeoutPromise]);
    return completion;
  } catch (error: any) {
    if (error instanceof OpenAITimeoutError) {
      throw error;
    }

    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      throw new OpenAIAuthError('OpenAI API key is invalid');
    }

    if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
      throw new OpenAIRateLimitError('OpenAI rate limit exceeded. Please try again later.');
    }

    if (error?.status === 408 || error?.code === 'ETIMEDOUT') {
      throw new OpenAITimeoutError('OpenAI request timed out');
    }

    throw new OpenAIError(
      error?.message || 'Unknown OpenAI error',
      error?.code,
      error?.status,
      error
    );
  }
}

export async function createJSONCompletion<T = any>(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    timeout?: number;
  } = {}
): Promise<{ data: T; usage: OpenAI.Completions.CompletionUsage }> {
  const completion = await createChatCompletion(messages, {
    ...options,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new OpenAIError('No content in OpenAI response');
  }

  try {
    const data = JSON.parse(content) as T;
    return {
      data,
      usage: completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  } catch (error) {
    throw new OpenAIError('Failed to parse JSON response from OpenAI', 'JSON_PARSE_ERROR');
  }
}
