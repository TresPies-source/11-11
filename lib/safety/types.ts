import type { BudgetCheckResult } from '../cost/types';

export type SafetySwitchReason =
  | 'llm_error'
  | 'api_failure'
  | 'parsing_error'
  | 'budget_exhausted'
  | 'rate_limit'
  | 'timeout'
  | 'auth_error'
  | 'conflicting_perspectives'
  | 'unknown_error';

export interface SafetySwitchContext {
  sessionId?: string;
  userId?: string;
  error?: Error;
  budgetStatus?: BudgetCheckResult;
  recentErrors?: number;
  timestamp?: string;
}

export interface SafetyStatus {
  active: boolean;
  reason?: SafetySwitchReason;
  activatedAt?: Date;
  recoveryPath?: string;
  attemptedRecoveries?: number;
  lastRecoveryAttempt?: Date;
  successfulOperations?: number;
}

export interface RecoveryResult {
  success: boolean;
  reason?: string;
  newStatus: SafetyStatus;
}

export interface SafetySwitchEvent {
  id: string;
  session_id: string;
  user_id: string;
  event_type: 'activated' | 'recovered' | 'failed_recovery';
  reason: SafetySwitchReason;
  error_message?: string;
  context: SafetySwitchContext;
  created_at: string;
}
