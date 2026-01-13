export interface OpenAIConfig {
  apiKey?: string;
  organization?: string;
  baseURL?: string;
  timeout?: number;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: { type: 'json_object' | 'text' };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: TokenUsage;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export class OpenAIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}

export class OpenAIAuthError extends OpenAIError {
  constructor(message = 'OpenAI API key is invalid or missing') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'OpenAIAuthError';
  }
}

export class OpenAIRateLimitError extends OpenAIError {
  constructor(message = 'OpenAI rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'OpenAIRateLimitError';
  }
}

export class OpenAITimeoutError extends OpenAIError {
  constructor(message = 'OpenAI request timed out') {
    super(message, 'TIMEOUT', 408);
    this.name = 'OpenAITimeoutError';
  }
}

export const GPT_4O_MINI_PRICING = {
  input: 0.00015 / 1000,
  output: 0.0006 / 1000,
} as const;

export const DEFAULT_ROUTING_MODEL = 'gpt-4o-mini';
export const DEFAULT_ROUTING_TIMEOUT = 5000;
export const DEFAULT_ROUTING_TEMPERATURE = 0.3;
