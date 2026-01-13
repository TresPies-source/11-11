import type OpenAI from 'openai';

/**
 * Supported LLM providers for multi-model infrastructure.
 * - 'deepseek': Primary provider (agent-native, cost-optimized)
 * - 'openai': Fallback provider
 */
export type LLMProvider = 'deepseek' | 'openai';

/**
 * Model capability flags indicating what features a model supports.
 */
export interface ModelCapabilities {
  json: boolean;
  tools: boolean;
  chatPrefix?: boolean;
  thinking?: boolean;
  vision?: boolean;
}

/**
 * Cost structure for a model in USD per million tokens.
 */
export interface ModelCost {
  input: number;
  inputCached?: number;
  output: number;
}

/**
 * Complete configuration for an LLM model including provider, costs, and capabilities.
 */
export interface ModelConfig {
  provider: LLMProvider;
  baseURL: string;
  model: string;
  contextWindow: number;
  maxOutput: number;
  cost: ModelCost;
  capabilities: ModelCapabilities;
  recommendedFor: string[];
}

/**
 * Options for LLM API calls (temperature, tokens, tools, etc.).
 */
export interface LLMCallOptions {
  temperature?: number;
  maxTokens?: number;
  tools?: OpenAI.Chat.ChatCompletionTool[];
  responseFormat?: { type: 'json_object' | 'text' };
  timeout?: number;
}

/**
 * Token usage statistics from an LLM API call.
 */
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * Response from an LLM API call including content, usage, and tool calls.
 */
export interface LLMResponse {
  content: string;
  usage: TokenUsage;
  finishReason?: string;
  toolCalls?: OpenAI.Chat.ChatCompletionMessageToolCall[];
}

/**
 * Base error class for LLM-related errors.
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

/**
 * Error thrown when LLM API authentication fails (401 Unauthorized).
 */
export class LLMAuthError extends LLMError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'LLMAuthError';
  }
}

/**
 * Error thrown when LLM API rate limit is exceeded (429 Too Many Requests).
 */
export class LLMRateLimitError extends LLMError {
  constructor(message: string) {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'LLMRateLimitError';
  }
}

/**
 * Error thrown when LLM API request times out (408 Request Timeout).
 */
export class LLMTimeoutError extends LLMError {
  constructor(message: string) {
    super(message, 'TIMEOUT_ERROR', 408);
    this.name = 'LLMTimeoutError';
  }
}
