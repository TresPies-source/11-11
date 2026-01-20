import type { GatewayRequest, GatewayResponse } from '../types';

/**
 * Interface for AI provider adapters.
 * Each adapter handles communication with a specific LLM provider (e.g., DeepSeek, OpenAI).
 */
export interface IProviderAdapter {
  /** Unique identifier for the provider (e.g., 'deepseek', 'openai') */
  readonly id: string;
  
  /** Human-readable name of the provider */
  readonly name: string;
  
  /**
   * Makes an API call to the provider.
   * @param request - Gateway request with messages and options
   * @param model - Model name to use
   * @returns Response with content, usage, and metadata
   */
  call(request: GatewayRequest, model: string): Promise<GatewayResponse>;
  
  /**
   * Checks if the adapter is available for use.
   * Returns false if health checks fail or consecutive failures exceed threshold.
   */
  isAvailable(): boolean;
  
  /**
   * Gets the current count of consecutive failures.
   */
  getConsecutiveFailures(): number;
  
  /**
   * Resets the health tracking state.
   */
  resetHealth(): void;
}
