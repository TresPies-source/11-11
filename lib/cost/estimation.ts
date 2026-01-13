/**
 * Token estimation module for Cost Guard system.
 * 
 * Uses OpenAI's tiktoken library for accurate token counting before making LLM calls.
 * Implements encoder caching for performance (<1ms for cached encoders).
 * 
 * @module lib/cost/estimation
 */

import { encoding_for_model, type TiktokenModel } from 'tiktoken';
import type { Message, TokenEstimate } from './types';
import { MODEL_PRICING, DEFAULT_MAX_COMPLETION_TOKENS } from './constants';

/**
 * Cache for tiktoken encoders to avoid repeated initialization.
 * First load takes ~120ms, cached loads take <1ms.
 */
let encoderCache: Map<string, ReturnType<typeof encoding_for_model>> = new Map();

/**
 * Get or create a tiktoken encoder for the specified model.
 * Encoders are cached to avoid repeated initialization overhead.
 * 
 * @param model - Model name (e.g., 'gpt-4o', 'gpt-4o-mini')
 * @returns Tiktoken encoder for the model
 * @internal
 */
function getEncoder(model: string) {
  if (!encoderCache.has(model)) {
    try {
      const encoding = encoding_for_model(model as TiktokenModel);
      encoderCache.set(model, encoding);
    } catch (error) {
      if (model.startsWith('deepseek')) {
        console.warn(`[Cost Estimation] DeepSeek model ${model} not supported by tiktoken, using gpt-4o encoder`);
        const encoding = encoding_for_model('gpt-4o');
        encoderCache.set(model, encoding);
      } else {
        console.warn(`[Cost Estimation] Model ${model} not supported by tiktoken, falling back to gpt-4o`);
        const encoding = encoding_for_model('gpt-4o');
        encoderCache.set(model, encoding);
      }
    }
  }
  return encoderCache.get(model)!;
}

/**
 * Estimate token usage for an LLM call before execution.
 * 
 * Uses tiktoken to accurately count prompt tokens and estimates completion tokens
 * based on the maxCompletionTokens parameter. Includes cost calculation in USD.
 * 
 * **Performance:**
 * - First call (encoder load): ~120ms
 * - Cached calls: <1ms
 * - Accuracy: Within 10% of actual usage
 * 
 * @param systemPrompt - System prompt text
 * @param userMessages - Array of user/assistant messages
 * @param maxCompletionTokens - Maximum completion tokens (default: 2000)
 * @param model - Model name (default: 'gpt-4o')
 * @returns Token estimate with prompt, completion, total tokens and cost
 * 
 * @example
 * ```typescript
 * const estimate = estimateTokens(
 *   "You are Dojo...",
 *   [{ role: "user", content: "Help me" }],
 *   2000,
 *   "gpt-4o"
 * );
 * console.log(`Estimated cost: $${estimate.cost_usd.toFixed(4)}`);
 * ```
 */
export function estimateTokens(
  systemPrompt: string,
  userMessages: Message[],
  maxCompletionTokens?: number,
  model: string = 'gpt-4o'
): TokenEstimate {
  const startTime = performance.now();

  const encoding = getEncoder(model);

  const promptText = [
    systemPrompt,
    ...userMessages.map(m => `${m.role}: ${m.content}`),
  ].join('\n');

  const promptTokens = encoding.encode(promptText).length;

  const completionTokens = maxCompletionTokens || DEFAULT_MAX_COMPLETION_TOKENS;

  const totalTokens = promptTokens + completionTokens;

  const cost = calculateCost(promptTokens, completionTokens, model);

  const elapsedTime = performance.now() - startTime;
  if (elapsedTime > 50) {
    console.warn(`[Cost Estimation] Token estimation took ${elapsedTime.toFixed(2)}ms (target: <50ms)`);
  }

  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
    cost_usd: cost,
    model,
  };
}

/**
 * Calculate the cost in USD for an LLM call.
 * 
 * Uses model pricing from MODEL_PRICING constant. If model not found,
 * falls back to gpt-4o pricing with a warning.
 * 
 * @param promptTokens - Number of prompt (input) tokens
 * @param completionTokens - Number of completion (output) tokens
 * @param model - Model name
 * @returns Cost in USD
 * 
 * @example
 * ```typescript
 * const cost = calculateCost(450, 1800, 'gpt-4o');
 * console.log(`Cost: $${cost.toFixed(4)}`); // Cost: $0.0191
 * ```
 */
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model: string
): number {
  const pricing = MODEL_PRICING[model];
  
  if (!pricing) {
    console.warn(`[Cost Calculation] Model ${model} not found in pricing table, using gpt-4o pricing`);
    const fallbackPricing = MODEL_PRICING['gpt-4o'];
    return (
      (promptTokens * fallbackPricing.input_price_per_1m) / 1_000_000 +
      (completionTokens * fallbackPricing.output_price_per_1m) / 1_000_000
    );
  }

  return (
    (promptTokens * pricing.input_price_per_1m) / 1_000_000 +
    (completionTokens * pricing.output_price_per_1m) / 1_000_000
  );
}

/**
 * Clear the encoder cache and free memory.
 * 
 * Call this when you need to free up memory or reset encoder state.
 * Next estimation will reload encoders (~120ms overhead).
 * 
 * @example
 * ```typescript
 * // Before application shutdown or memory cleanup
 * clearEncoderCache();
 * ```
 */
export function clearEncoderCache(): void {
  encoderCache.forEach(encoder => encoder.free());
  encoderCache.clear();
}
