import type { GatewayRequest, TaskType } from './types';
import type { IProviderAdapter } from './adapters/base';
import type { GatewayConfig, RoutingRule } from '@/config/ai-gateway.config';
import { aiGatewayConfig } from '@/config/ai-gateway.config';
import { deepseekAdapter } from './adapters/deepseek';
import { openaiAdapter } from './adapters/openai';
import { anthropicAdapter } from './adapters/anthropic';
import { googleAdapter } from './adapters/google';

/**
 * Selected route containing the adapter to use and fallback options.
 */
export interface SelectedRoute {
  /** Primary adapter to use for the request */
  adapter: IProviderAdapter;
  
  /** Model name to use with the adapter */
  model: string;
  
  /** Fallback adapters and models to try if primary fails */
  fallbackChain: Array<{ adapter: IProviderAdapter; model: string }>;
}

/**
 * Router interface for selecting the best provider and model for a request.
 */
export interface IRouter {
  /**
   * Routes a request to the appropriate provider and model.
   * @param request - Gateway request with task type and options
   * @returns Selected route with adapter, model, and fallback chain
   */
  route(request: GatewayRequest): Promise<SelectedRoute>;
}

/**
 * Router implementation that selects providers and models based on task type.
 * Implements health-aware routing with automatic fallback to alternative providers.
 */
export class Router implements IRouter {
  private adapters: Map<string, IProviderAdapter> = new Map();
  private config: GatewayConfig;

  constructor(config: GatewayConfig, adapters: IProviderAdapter[]) {
    this.config = config;
    
    for (const adapter of adapters) {
      this.adapters.set(adapter.id, adapter);
    }
  }

  private classifyTask(request: GatewayRequest): TaskType {
    return request.taskType ?? this.config.defaultTaskType;
  }

  private selectModel(taskType: TaskType): { primary: { provider: string; model: string }; fallback: { provider: string; model: string } } {
    const rule = this.config.routingRules.find(r => r.taskType === taskType);
    
    if (!rule) {
      const defaultRule = this.config.routingRules.find(r => r.taskType === 'default');
      if (!defaultRule) {
        throw new Error(`No routing rule found for task type: ${taskType}`);
      }
      return { primary: defaultRule.primary, fallback: defaultRule.fallback };
    }

    return { primary: rule.primary, fallback: rule.fallback };
  }

  /**
   * Routes a request to the best available provider and model.
   * Automatically selects fallback if primary provider is unhealthy.
   * @param request - Gateway request with optional task type
   * @returns Selected route with primary adapter and fallback chain
   */
  async route(request: GatewayRequest): Promise<SelectedRoute> {
    const taskType = this.classifyTask(request);
    const { primary, fallback } = this.selectModel(taskType);

    const primaryAdapter = this.adapters.get(primary.provider);
    const fallbackAdapter = this.adapters.get(fallback.provider);

    if (!primaryAdapter) {
      throw new Error(`Adapter not found for provider: ${primary.provider}`);
    }

    if (!fallbackAdapter) {
      throw new Error(`Fallback adapter not found for provider: ${fallback.provider}`);
    }

    let selectedAdapter = primaryAdapter;
    let selectedModel = primary.model;
    const fallbackChain: Array<{ adapter: IProviderAdapter; model: string }> = [];

    if (!primaryAdapter.isAvailable()) {
      console.warn(`[Router] Primary provider ${primary.provider} is unavailable (${primaryAdapter.getConsecutiveFailures()} consecutive failures). Using fallback.`);
      selectedAdapter = fallbackAdapter;
      selectedModel = fallback.model;
    } else {
      fallbackChain.push({ adapter: fallbackAdapter, model: fallback.model });
    }

    return {
      adapter: selectedAdapter,
      model: selectedModel,
      fallbackChain,
    };
  }
}

export const router = new Router(aiGatewayConfig, [deepseekAdapter, openaiAdapter, anthropicAdapter, googleAdapter]);
