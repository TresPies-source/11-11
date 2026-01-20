import type { LLMCallOptions, LLMResponse } from '@/lib/llm/types';
import { LLMError, LLMAuthError, LLMRateLimitError, LLMTimeoutError } from '@/lib/llm/types';
import type OpenAI from 'openai';
import type { TaskType } from '@/config/ai-gateway.config';

export type { TaskType };

export interface GatewayRequest extends LLMCallOptions {
  messages?: OpenAI.Chat.ChatCompletionMessageParam[];
  taskType?: TaskType;
  agentName?: string;
}

export type GatewayResponse = LLMResponse;

export {
  LLMError,
  LLMAuthError,
  LLMRateLimitError,
  LLMTimeoutError,
};
