export interface BudgetConfig {
  query_limit: number;
  session_limit: number;
  user_monthly_limit: number;
  warn_threshold: number;
  stop_threshold: number;
}

export interface BudgetCheckResult {
  allowed: boolean;
  reason?: 'query_limit_exceeded' | 'session_limit_exceeded' | 'user_limit_exceeded';
  limit?: number;
  current?: number;
  estimated?: number;
  warnings?: string[];
}

export interface TokenEstimate {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  model: string;
}

export interface CostRecord {
  id: string;
  user_id: string;
  session_id: string | null;
  query_id: string | null;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  operation_type: 'routing' | 'agent_execution' | 'search' | 'critique' | 'other';
  created_at: string;
}

export interface ModeSelection {
  mode: 'Mirror' | 'Scout' | 'Gardener' | 'Implementation';
  model: string;
  reason: string;
  downgraded: boolean;
}

export interface Message {
  role: string;
  content: string;
}
