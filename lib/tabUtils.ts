import { EditorTab, TabsPersistenceState, FileNode } from './types';
import { MAX_EDITOR_TABS } from './constants';

const TAB_STORAGE_KEY = 'editor-tabs-state';
const STATE_VERSION = 1;
const MAX_STATE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function serializeTabState(
  tabs: EditorTab[],
  activeTabId: string | null
): string {
  const state: TabsPersistenceState = {
    tabs: tabs.map(tab => ({
      id: tab.id,
      fileId: tab.fileId,
      fileName: tab.fileName,
      filePath: tab.filePath,
      content: tab.content,
      isDirty: tab.isDirty,
      lastModified: tab.lastModified.toISOString(),
    })),
    activeTabId,
    timestamp: Date.now(),
  };

  return JSON.stringify(state);
}

export function deserializeTabState(
  serialized: string
): { tabs: EditorTab[]; activeTabId: string | null } | null {
  try {
    const parsed = JSON.parse(serialized) as TabsPersistenceState;

    if (!validateTabState(parsed)) {
      return null;
    }

    const tabs: EditorTab[] = parsed.tabs.map(tab => ({
      ...tab,
      lastModified: new Date(tab.lastModified),
    }));

    return {
      tabs,
      activeTabId: parsed.activeTabId,
    };
  } catch (error) {
    console.error('Failed to deserialize tab state:', error);
    return null;
  }
}

export function validateTabState(state: unknown): state is TabsPersistenceState {
  if (!state || typeof state !== 'object') {
    return false;
  }

  const s = state as Partial<TabsPersistenceState>;

  if (!Array.isArray(s.tabs)) {
    return false;
  }

  if (s.tabs.length > MAX_EDITOR_TABS) {
    return false;
  }

  if (typeof s.timestamp !== 'number') {
    return false;
  }

  const age = Date.now() - s.timestamp;
  if (age > MAX_STATE_AGE_MS) {
    return false;
  }

  for (const tab of s.tabs) {
    if (
      typeof tab.id !== 'string' ||
      typeof tab.fileId !== 'string' ||
      typeof tab.fileName !== 'string' ||
      typeof tab.filePath !== 'string' ||
      typeof tab.content !== 'string' ||
      typeof tab.isDirty !== 'boolean' ||
      typeof tab.lastModified !== 'string'
    ) {
      return false;
    }
  }

  if (s.activeTabId !== null && typeof s.activeTabId !== 'string') {
    return false;
  }

  return true;
}

export function saveTabStateToStorage(
  tabs: EditorTab[],
  activeTabId: string | null
): void {
  try {
    const serialized = serializeTabState(tabs, activeTabId);
    localStorage.setItem(TAB_STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save tab state to localStorage:', error);
  }
}

export function loadTabStateFromStorage(): {
  tabs: EditorTab[];
  activeTabId: string | null;
} | null {
  try {
    const serialized = localStorage.getItem(TAB_STORAGE_KEY);
    if (!serialized) {
      return null;
    }

    return deserializeTabState(serialized);
  } catch (error) {
    console.error('Failed to load tab state from localStorage:', error);
    return null;
  }
}

export function clearTabStateFromStorage(): void {
  try {
    localStorage.removeItem(TAB_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear tab state from localStorage:', error);
  }
}

export function createTabFromFile(file: FileNode, content: string = ''): EditorTab {
  return {
    id: generateTabId(),
    fileId: file.id,
    fileName: file.name,
    filePath: file.path,
    content,
    isDirty: false,
    lastModified: new Date(),
  };
}

export function findTabByFileId(tabs: EditorTab[], fileId: string): EditorTab | undefined {
  return tabs.find(tab => tab.fileId === fileId);
}

export function updateTabContent(
  tab: EditorTab,
  content: string,
  savedContent?: string
): EditorTab {
  const isDirty = savedContent !== undefined ? content !== savedContent : tab.isDirty;
  
  return {
    ...tab,
    content,
    isDirty,
    lastModified: new Date(),
  };
}

export function markTabAsSaved(tab: EditorTab): EditorTab {
  return {
    ...tab,
    isDirty: false,
    lastModified: new Date(),
  };
}

export function getTabDisplayName(tab: EditorTab, maxLength: number = 20): string {
  if (tab.fileName.length <= maxLength) {
    return tab.fileName;
  }

  const ext = tab.fileName.split('.').pop() || '';
  const nameWithoutExt = tab.fileName.slice(0, -(ext.length + 1));
  const truncateLength = maxLength - ext.length - 4;

  if (truncateLength <= 0) {
    return tab.fileName.slice(0, maxLength - 3) + '...';
  }

  return `${nameWithoutExt.slice(0, truncateLength)}...${ext}`;
}

export function canOpenMoreTabs(currentTabCount: number): boolean {
  return currentTabCount < MAX_EDITOR_TABS;
}

export function getNextTabId(tabs: EditorTab[], currentTabId: string): string | null {
  const currentIndex = tabs.findIndex(tab => tab.id === currentTabId);
  if (currentIndex === -1) {
    return tabs[0]?.id || null;
  }

  const nextIndex = currentIndex + 1;
  if (nextIndex >= tabs.length) {
    return tabs[0]?.id || null;
  }

  return tabs[nextIndex].id;
}

export function getPreviousTabId(tabs: EditorTab[], currentTabId: string): string | null {
  const currentIndex = tabs.findIndex(tab => tab.id === currentTabId);
  if (currentIndex === -1) {
    return tabs[tabs.length - 1]?.id || null;
  }

  const previousIndex = currentIndex - 1;
  if (previousIndex < 0) {
    return tabs[tabs.length - 1]?.id || null;
  }

  return tabs[previousIndex].id;
}

export function getTabByIndex(tabs: EditorTab[], index: number): EditorTab | null {
  if (index < 0 || index >= tabs.length) {
    return null;
  }
  return tabs[index];
}

export function getDirtyTabs(tabs: EditorTab[]): EditorTab[] {
  return tabs.filter(tab => tab.isDirty);
}

export function hasDirtyTabs(tabs: EditorTab[]): boolean {
  return tabs.some(tab => tab.isDirty);
}
