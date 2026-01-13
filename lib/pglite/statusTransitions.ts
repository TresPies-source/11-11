import type { PromptStatus, StatusHistoryEntry } from './types';

export interface StatusTransition {
  from: PromptStatus;
  to: PromptStatus;
  label: string;
  confirmationRequired: boolean;
  confirmationMessage?: string;
}

export const VALID_TRANSITIONS: StatusTransition[] = [
  { from: 'draft', to: 'active', label: 'Activate', confirmationRequired: false },
  { from: 'draft', to: 'archived', label: 'Archive', confirmationRequired: true, confirmationMessage: 'Archive this draft?' },
  
  { from: 'active', to: 'saved', label: 'Save to Greenhouse', confirmationRequired: false },
  { from: 'active', to: 'draft', label: 'Move to Drafts', confirmationRequired: false },
  { from: 'active', to: 'archived', label: 'Archive', confirmationRequired: true, confirmationMessage: 'Archive this prompt?' },
  
  { from: 'saved', to: 'active', label: 'Reactivate', confirmationRequired: false },
  { from: 'saved', to: 'archived', label: 'Archive', confirmationRequired: true, confirmationMessage: 'Archive this prompt? You can restore it later.' },
  
  { from: 'archived', to: 'active', label: 'Restore', confirmationRequired: false },
  { from: 'archived', to: 'saved', label: 'Restore to Greenhouse', confirmationRequired: false },
];

export function getValidTransitions(currentStatus: PromptStatus): StatusTransition[] {
  return VALID_TRANSITIONS.filter(t => t.from === currentStatus);
}

export function isValidTransition(from: PromptStatus, to: PromptStatus): boolean {
  return VALID_TRANSITIONS.some(t => t.from === from && t.to === to);
}

export function getTransition(from: PromptStatus, to: PromptStatus): StatusTransition | undefined {
  return VALID_TRANSITIONS.find(t => t.from === from && t.to === to);
}
