import type { ModelConfig } from './types';

/**
 * Central registry of all available LLM models with their configurations.
 * Includes DeepSeek 3.2 models (primary) and OpenAI models (fallback).
 */
export const MODEL_REGISTRY: Record<string, ModelConfig> = {
  'deepseek-chat': {
    provider: 'deepseek',
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    contextWindow: 128000,
    maxOutput: 8000,
    cost: {
      input: 0.28,
      inputCached: 0.028,
      output: 0.42,
    },
    capabilities: {
      json: true,
      tools: true,
      chatPrefix: true,
    },
    recommendedFor: ['supervisor', 'librarian', 'cost-guard', 'dojo', 'general'],
  },
  
  'deepseek-reasoner': {
    provider: 'deepseek',
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-reasoner',
    contextWindow: 128000,
    maxOutput: 64000,
    cost: {
      input: 0.28,
      inputCached: 0.028,
      output: 0.42,
    },
    capabilities: {
      json: true,
      tools: true,
      chatPrefix: true,
      thinking: true,
    },
    recommendedFor: ['debugger', 'complex-reasoning', 'multi-step'],
  },
  
  'gpt-4o-mini': {
    provider: 'openai',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    contextWindow: 128000,
    maxOutput: 16000,
    cost: {
      input: 0.15,
      output: 0.60,
    },
    capabilities: {
      json: true,
      tools: true,
      vision: true,
    },
    recommendedFor: ['fallback'],
  },
  
  'gpt-4o': {
    provider: 'openai',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    contextWindow: 128000,
    maxOutput: 16000,
    cost: {
      input: 2.50,
      output: 10.00,
    },
    capabilities: {
      json: true,
      tools: true,
      vision: true,
    },
    recommendedFor: [],
  },
};

/**
 * Retrieves the configuration for a specific model by name.
 * @param modelName - Name of the model (e.g., 'deepseek-chat', 'gpt-4o-mini')
 * @returns Model configuration
 * @throws Error if model not found in registry
 */
export function getModelConfig(modelName: string): ModelConfig {
  const config = MODEL_REGISTRY[modelName];
  if (!config) {
    throw new Error(`Model "${modelName}" not found in registry`);
  }
  return config;
}

/**
 * Determines the optimal model for a given agent based on its reasoning requirements.
 * - Supervisor, Librarian, Cost Guard, Dojo → deepseek-chat (fast, general)
 * - Debugger → deepseek-reasoner (deep thinking)
 * @param agentName - Name of the agent (e.g., 'supervisor', 'debugger')
 * @returns Model name to use for this agent
 */
export function getModelForAgent(agentName: string): string {
  const agentModelMap: Record<string, string> = {
    supervisor: 'deepseek-chat',
    librarian: 'deepseek-chat',
    'cost-guard': 'deepseek-chat',
    dojo: 'deepseek-chat',
    debugger: 'deepseek-reasoner',
  };
  
  return agentModelMap[agentName] || 'deepseek-chat';
}

/**
 * Returns the fallback model to use when primary model fails.
 * @returns 'gpt-4o-mini' (OpenAI fallback model)
 */
export function getFallbackModel(): string {
  return 'gpt-4o-mini';
}

/**
 * Lists all available models in the registry.
 * @returns Array of model names
 */
export function listAvailableModels(): string[] {
  return Object.keys(MODEL_REGISTRY);
}

/**
 * Lists all models for a specific provider.
 * @param provider - Provider to filter by ('deepseek' or 'openai')
 * @returns Array of model names for that provider
 */
export function getModelsByProvider(provider: 'deepseek' | 'openai'): string[] {
  return Object.entries(MODEL_REGISTRY)
    .filter(([_, config]) => config.provider === provider)
    .map(([name, _]) => name);
}

/**
 * Calculates the cost of an LLM call based on token usage.
 * @param modelName - Name of the model used
 * @param usage - Token usage (prompt_tokens, completion_tokens)
 * @returns Total cost in USD
 */
export function calculateCost(
  modelName: string,
  usage: { prompt_tokens: number; completion_tokens: number }
): number {
  const config = getModelConfig(modelName);
  
  const inputCost = (usage.prompt_tokens / 1_000_000) * config.cost.input;
  const outputCost = (usage.completion_tokens / 1_000_000) * config.cost.output;
  
  return inputCost + outputCost;
}
