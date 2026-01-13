import type { 
  SafetySwitchReason, 
  SafetySwitchContext, 
  SafetyStatus 
} from './types';
import type { BudgetCheckResult } from '../cost/types';
import { 
  setSafetyStatus, 
  getSafetyStatusFromState, 
  clearSafetyStatus 
} from './state';
import { logEvent, isTraceActive } from '../harness/trace';
import { LLMAuthError, LLMRateLimitError, LLMTimeoutError } from '../llm/types';

export async function activateSafetySwitch(
  reason: SafetySwitchReason,
  context: SafetySwitchContext
): Promise<void> {
  const sessionId = context.sessionId || 'unknown';
  const userId = context.userId || 'unknown';

  try {
    const status: SafetyStatus = {
      active: true,
      reason,
      activatedAt: new Date(),
      recoveryPath: getRecoveryPath(reason),
      attemptedRecoveries: 0,
      successfulOperations: 0,
    };

    setSafetyStatus(sessionId, status);

    if (isTraceActive()) {
      logEvent(
        'SAFETY_SWITCH',
        {
          action: 'activated',
          reason,
          sessionId,
          userId,
        },
        {
          status: 'active',
          recoveryPath: status.recoveryPath,
        },
        {
          error: context.error?.message,
        }
      );
    }

    console.log(`[SafetySwitch] Activated for session ${sessionId}: ${reason}`);
  } catch (error) {
    console.error('[SafetySwitch] Error during activation:', error);
  }
}

export async function deactivateSafetySwitch(sessionId?: string, recoveryType?: string): Promise<void> {
  if (!sessionId) {
    console.warn('[SafetySwitch] Cannot deactivate: No session ID provided');
    return;
  }

  try {
    clearSafetyStatus(sessionId);

    if (isTraceActive()) {
      logEvent(
        'SAFETY_SWITCH',
        {
          action: 'deactivated',
          sessionId,
          recoveryType: recoveryType || 'unknown',
        },
        {
          status: 'inactive',
        }
      );
    }

    console.log(`[SafetySwitch] Deactivated for session ${sessionId} (${recoveryType || 'unknown'})`);
  } catch (error) {
    console.error('[SafetySwitch] Error during deactivation:', error);
  }
}

export function shouldActivateSafetySwitch(
  error?: Error,
  budgetStatus?: BudgetCheckResult,
  recentErrors?: number
): boolean {
  if (budgetStatus && !budgetStatus.allowed) {
    return true;
  }

  if (recentErrors && recentErrors >= 3) {
    return true;
  }

  if (error) {
    if (error instanceof LLMAuthError) {
      return true;
    }
    if (error instanceof LLMRateLimitError) {
      return true;
    }
    if (error instanceof LLMTimeoutError) {
      return true;
    }
    
    const errorMessage = error.message.toLowerCase();
    if (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('429') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('auth') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('401')
    ) {
      return true;
    }
  }

  return false;
}

export function getSafetyStatus(sessionId?: string): SafetyStatus {
  return getSafetyStatusFromState(sessionId);
}

export function isSafetyActive(sessionId?: string): boolean {
  const status = getSafetyStatusFromState(sessionId);
  return status.active;
}

export function getErrorReason(error: Error): SafetySwitchReason {
  if (error instanceof LLMAuthError) {
    return 'auth_error';
  }
  if (error instanceof LLMRateLimitError) {
    return 'rate_limit';
  }
  if (error instanceof LLMTimeoutError) {
    return 'timeout';
  }

  const errorMessage = error.message.toLowerCase();
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return 'rate_limit';
  }
  if (errorMessage.includes('timeout')) {
    return 'timeout';
  }
  if (errorMessage.includes('auth') || errorMessage.includes('401')) {
    return 'auth_error';
  }
  if (errorMessage.includes('parse') || errorMessage.includes('json')) {
    return 'parsing_error';
  }
  if (errorMessage.includes('api')) {
    return 'api_failure';
  }

  return 'llm_error';
}

function getRecoveryPath(reason: SafetySwitchReason): string {
  switch (reason) {
    case 'budget_exhausted':
      return 'Wait for budget reset or increase limit';
    case 'rate_limit':
      return 'Wait a few minutes and try again';
    case 'timeout':
      return 'Try again with a simpler query';
    case 'auth_error':
      return 'Check API credentials';
    case 'parsing_error':
      return 'System will retry automatically';
    case 'api_failure':
      return 'Check network connection and retry';
    default:
      return 'Try again or contact support';
  }
}
