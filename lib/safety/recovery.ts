import type { BudgetCheckResult } from '../cost/types';
import type { RecoveryResult } from './types';
import { getSafetyStatus, deactivateSafetySwitch } from './switch';
import { getSafetyStatusFromState, setSafetyStatus } from './state';
import { logEvent } from '../harness/trace';

const MIN_BUDGET_PERCENTAGE = 0.2;
const ERROR_COOLDOWN_MS = 5 * 60 * 1000;
const REQUIRED_SUCCESSFUL_OPS = 1;

export function trackSuccessfulOperation(sessionId?: string): void {
  if (!sessionId) return;

  const status = getSafetyStatusFromState(sessionId);
  if (!status.active) return;

  const updated = {
    ...status,
    successfulOperations: (status.successfulOperations || 0) + 1,
  };

  setSafetyStatus(sessionId, updated);
}

export function isRecoverySafe(
  sessionId: string,
  budgetStatus?: BudgetCheckResult,
  recentErrors?: number
): boolean {
  const status = getSafetyStatusFromState(sessionId);

  if (!status.active) {
    return false;
  }

  if (budgetStatus && !budgetStatus.allowed) {
    if (budgetStatus.limit && budgetStatus.current) {
      const budgetRemaining = budgetStatus.limit - budgetStatus.current;
      const budgetPercentage = budgetRemaining / budgetStatus.limit;
      if (budgetPercentage < MIN_BUDGET_PERCENTAGE) {
        return false;
      }
    }
  }

  if (recentErrors && recentErrors > 0) {
    return false;
  }

  if (status.lastRecoveryAttempt) {
    const timeSinceLastAttempt = Date.now() - status.lastRecoveryAttempt.getTime();
    if (timeSinceLastAttempt < ERROR_COOLDOWN_MS) {
      return false;
    }
  }

  return true;
}

export async function attemptAutoRecovery(sessionId?: string): Promise<RecoveryResult> {
  if (!sessionId) {
    return {
      success: false,
      reason: 'No session ID provided',
      newStatus: { active: false },
    };
  }

  const status = getSafetyStatusFromState(sessionId);

  if (!status.active) {
    return {
      success: false,
      reason: 'Safety Switch not active',
      newStatus: status,
    };
  }

  const successfulOps = status.successfulOperations || 0;
  if (successfulOps < REQUIRED_SUCCESSFUL_OPS) {
    return {
      success: false,
      reason: `Need ${REQUIRED_SUCCESSFUL_OPS} successful operation(s), have ${successfulOps}`,
      newStatus: status,
    };
  }

  if (!isRecoverySafe(sessionId)) {
    const updated = {
      ...status,
      attemptedRecoveries: (status.attemptedRecoveries || 0) + 1,
      lastRecoveryAttempt: new Date(),
    };
    setSafetyStatus(sessionId, updated);

    await logEvent(
      'SAFETY_SWITCH',
      {
        action: 'recovery_failed',
        sessionId,
      },
      {
        success: false,
      },
      {
        reason: 'recovery_conditions_not_met',
      }
    );

    return {
      success: false,
      reason: 'Recovery conditions not met',
      newStatus: updated,
    };
  }

  await deactivateSafetySwitch(sessionId, 'auto_recovery');

  await logEvent(
    'SAFETY_SWITCH',
    {
      action: 'recovered',
      sessionId,
    },
    {
      success: true,
      recoveryType: 'automatic',
    },
    {
      successfulOperations: successfulOps,
    }
  );

  return {
    success: true,
    reason: 'Auto-recovery successful',
    newStatus: { active: false },
  };
}

export async function attemptManualRecovery(sessionId?: string): Promise<RecoveryResult> {
  if (!sessionId) {
    return {
      success: false,
      reason: 'No session ID provided',
      newStatus: { active: false },
    };
  }

  const status = getSafetyStatusFromState(sessionId);

  if (!status.active) {
    return {
      success: false,
      reason: 'Safety Switch not active',
      newStatus: status,
    };
  }

  const updated = {
    ...status,
    attemptedRecoveries: (status.attemptedRecoveries || 0) + 1,
    lastRecoveryAttempt: new Date(),
  };
  setSafetyStatus(sessionId, updated);

  await deactivateSafetySwitch(sessionId, 'manual_override');

  await logEvent(
    'SAFETY_SWITCH',
    {
      action: 'recovered',
      sessionId,
    },
    {
      success: true,
      recoveryType: 'manual',
    }
  );

  return {
    success: true,
    reason: 'Manual recovery successful',
    newStatus: { active: false },
  };
}
