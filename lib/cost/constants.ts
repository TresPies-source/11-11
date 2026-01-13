import { BudgetConfig } from './types';

export const DEFAULT_BUDGET: BudgetConfig = {
  query_limit: 10000,
  session_limit: 50000,
  user_monthly_limit: 500000,
  warn_threshold: 0.8,
  stop_threshold: 1.0,
};

export const MODEL_PRICING: Record<string, { input_price_per_1m: number; output_price_per_1m: number }> = {
  'gpt-4o': {
    input_price_per_1m: 2.50,
    output_price_per_1m: 10.00,
  },
  'gpt-4o-mini': {
    input_price_per_1m: 0.15,
    output_price_per_1m: 0.60,
  },
  'gpt-4': {
    input_price_per_1m: 30.00,
    output_price_per_1m: 60.00,
  },
  'gpt-4-turbo': {
    input_price_per_1m: 10.00,
    output_price_per_1m: 30.00,
  },
  'gpt-3.5-turbo': {
    input_price_per_1m: 0.50,
    output_price_per_1m: 1.50,
  },
  'text-embedding-3-small': {
    input_price_per_1m: 0.02,
    output_price_per_1m: 0.00,
  },
};

export const OPERATION_TYPES = [
  'routing',
  'agent_execution',
  'search',
  'critique',
  'other',
] as const;

export const DEFAULT_MAX_COMPLETION_TOKENS = 2000;
