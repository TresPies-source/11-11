export const DOJO_STORAGE_KEYS = {
  CONTEXT_PANEL_OPEN: 'dojo:contextPanel:isOpen',
  CONTEXT_PANEL_TAB: 'dojo:contextPanel:activeTab',
  ONBOARDING_COLLAPSED: 'dojo:onboarding:collapsed',
} as const;

export type ContextPanelTab = 'details' | 'trail' | 'related';

export function getContextPanelState(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(DOJO_STORAGE_KEYS.CONTEXT_PANEL_OPEN);
  return stored ? stored === 'true' : window.innerWidth >= 1024;
}

export function setContextPanelState(isOpen: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DOJO_STORAGE_KEYS.CONTEXT_PANEL_OPEN, String(isOpen));
}

export function getActiveTab(): ContextPanelTab {
  if (typeof window === 'undefined') return 'details';
  const stored = localStorage.getItem(DOJO_STORAGE_KEYS.CONTEXT_PANEL_TAB);
  if (stored === 'details' || stored === 'trail' || stored === 'related') {
    return stored;
  }
  return 'details';
}

export function setActiveTab(tab: ContextPanelTab): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DOJO_STORAGE_KEYS.CONTEXT_PANEL_TAB, tab);
}

export function getOnboardingCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(DOJO_STORAGE_KEYS.ONBOARDING_COLLAPSED);
  return stored === 'true';
}

export function setOnboardingCollapsed(isCollapsed: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DOJO_STORAGE_KEYS.ONBOARDING_COLLAPSED, String(isCollapsed));
}
