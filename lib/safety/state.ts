import type { SafetyStatus } from './types';

const safetyStateMap = new Map<string, SafetyStatus>();

const STORAGE_KEY = 'zenflow_safety_switch_state';

export function initializeSafetyState(): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored) as Record<string, any>;
        Object.entries(parsedState).forEach(([sessionId, status]) => {
          safetyStateMap.set(sessionId, {
            ...status as SafetyStatus,
            activatedAt: status.activatedAt ? new Date(status.activatedAt) : undefined,
            lastRecoveryAttempt: status.lastRecoveryAttempt ? new Date(status.lastRecoveryAttempt) : undefined,
          });
        });
      }
    } catch (error) {
      console.error('[SafetyState] Failed to load from localStorage:', error);
    }
  }
}

export function setSafetyStatus(sessionId: string, status: SafetyStatus): void {
  safetyStateMap.set(sessionId, status);
  persistToStorage();
}

export function getSafetyStatusFromState(sessionId?: string): SafetyStatus {
  if (!sessionId) {
    return { active: false };
  }
  return safetyStateMap.get(sessionId) || { active: false };
}

export function clearSafetyStatus(sessionId: string): void {
  safetyStateMap.delete(sessionId);
  persistToStorage();
}

export function persistToStorage(): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const stateObj: Record<string, SafetyStatus> = {};
      safetyStateMap.forEach((status, sessionId) => {
        stateObj[sessionId] = status;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateObj));
    } catch (error) {
      console.error('[SafetyState] Failed to persist to localStorage:', error);
    }
  }
}

export function getAllSafetyStates(): Map<string, SafetyStatus> {
  return new Map(safetyStateMap);
}

initializeSafetyState();
