import type { LLMCallOptions } from '../llm/types';

const CONSERVATIVE_MODEL = 'deepseek-chat';
const CONSERVATIVE_MAX_TOKENS = 2000;

const ALLOWED_OPERATIONS = new Set([
  'mirror',
  'query',
  'reflection',
  'basic_chat',
]);

export function getConservativeModel(): string {
  return CONSERVATIVE_MODEL;
}

export function applyConservativeMode(options?: LLMCallOptions): LLMCallOptions {
  const conservativeOptions: LLMCallOptions = {
    ...options,
    maxTokens: Math.min(options?.maxTokens || CONSERVATIVE_MAX_TOKENS, CONSERVATIVE_MAX_TOKENS),
    temperature: options?.temperature ?? 0.7,
    tools: undefined,
    responseFormat: undefined,
  };

  return conservativeOptions;
}

export function isAllowedInConservativeMode(operation: string): boolean {
  return ALLOWED_OPERATIONS.has(operation.toLowerCase());
}
