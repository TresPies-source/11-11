export type TaskType = 
  | 'code_generation'
  | 'architectural_design'
  | 'general_chat'
  | 'content_synthesis'
  | 'complex_reasoning'
  | 'default';

export interface ProviderConfig {
  id: string;
  name: string;
  baseURL: string;
  models: string[];
}

export interface RoutingRule {
  taskType: TaskType;
  primary: {
    provider: string;
    model: string;
  };
  fallback: {
    provider: string;
    model: string;
  };
}

export interface MonitoringConfig {
  healthyThreshold: number;
  degradedThreshold: number;
}

export interface GatewayConfig {
  providers: ProviderConfig[];
  routingRules: RoutingRule[];
  defaultTaskType: TaskType;
  maxRetries: number;
  retryDelayMs: number;
  maxConsecutiveFailures: number;
  monitoring: MonitoringConfig;
}

export const aiGatewayConfig: GatewayConfig = {
  providers: [
    {
      id: 'deepseek',
      name: 'DeepSeek',
      baseURL: 'https://api.deepseek.com',
      models: ['deepseek-chat', 'deepseek-reasoner'],
    },
    {
      id: 'openai',
      name: 'OpenAI',
      baseURL: 'https://api.openai.com/v1',
      models: ['gpt-4o-mini', 'gpt-4o'],
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      baseURL: 'https://api.anthropic.com',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    },
    {
      id: 'google',
      name: 'Google',
      baseURL: 'https://generativelanguage.googleapis.com',
      models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    },
  ],
  
  routingRules: [
    {
      taskType: 'code_generation',
      primary: { provider: 'deepseek', model: 'deepseek-chat' },
      fallback: { provider: 'openai', model: 'gpt-4o-mini' },
    },
    {
      taskType: 'complex_reasoning',
      primary: { provider: 'deepseek', model: 'deepseek-reasoner' },
      fallback: { provider: 'openai', model: 'gpt-4o-mini' },
    },
    {
      taskType: 'general_chat',
      primary: { provider: 'deepseek', model: 'deepseek-chat' },
      fallback: { provider: 'openai', model: 'gpt-4o-mini' },
    },
    {
      taskType: 'content_synthesis',
      primary: { provider: 'deepseek', model: 'deepseek-chat' },
      fallback: { provider: 'openai', model: 'gpt-4o-mini' },
    },
    {
      taskType: 'architectural_design',
      primary: { provider: 'deepseek', model: 'deepseek-chat' },
      fallback: { provider: 'openai', model: 'gpt-4o-mini' },
    },
    {
      taskType: 'default',
      primary: { provider: 'deepseek', model: 'deepseek-chat' },
      fallback: { provider: 'openai', model: 'gpt-4o-mini' },
    },
  ],
  
  defaultTaskType: 'general_chat',
  maxRetries: 3,
  retryDelayMs: 1000,
  maxConsecutiveFailures: 3,
  
  monitoring: {
    healthyThreshold: 95,
    degradedThreshold: 80,
  },
};
