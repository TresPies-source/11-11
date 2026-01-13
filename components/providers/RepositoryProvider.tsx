"use client";

import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from "react";
import { FileNode, SyncStatusState, EditorTab } from "@/lib/types";
import { useContextBus } from "@/hooks/useContextBus";
import { useSyncStatusContext } from "@/components/providers/SyncStatusProvider";
import {
  generateTabId,
  saveTabStateToStorage,
  loadTabStateFromStorage,
  createTabFromFile,
  findTabByFileId,
  updateTabContent,
  markTabAsSaved,
  canOpenMoreTabs,
  getDirtyTabs,
} from "@/lib/tabUtils";
import { MAX_EDITOR_TABS } from "@/lib/constants";

export interface RepositoryContextValue {
  tabs: EditorTab[];
  activeTabId: string | null;
  activeTab: EditorTab | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  syncStatus: SyncStatusState;
  
  openTab: (file: FileNode) => Promise<void>;
  closeTab: (tabId: string, force?: boolean) => Promise<boolean>;
  switchTab: (tabId: string) => void;
  closeAllTabs: (force?: boolean) => Promise<void>;
  closeOtherTabs: (tabId: string, force?: boolean) => Promise<void>;
  updateTabContent: (tabId: string, content: string) => void;
  saveTab: (tabId: string) => Promise<void>;
  saveAllTabs: () => Promise<void>;
  discardChanges: (tabId?: string) => void;
  retrySave: (tabId?: string) => Promise<void>;
  
  activeFile: FileNode | null;
  setActiveFile: (file: FileNode | null) => void;
  fileContent: string;
  isDirty: boolean;
  lastSaved: Date | null;
  setFileContent: (content: string) => void;
  saveFile: () => Promise<void>;
}

export const RepositoryContext = createContext<RepositoryContextValue | undefined>(undefined);

interface RepositoryProviderProps {
  children: ReactNode;
}

export function RepositoryProvider({ children }: RepositoryProviderProps) {
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [savedContents, setSavedContents] = useState<Map<string, string>>(new Map());
  const [fileNodeMap, setFileNodeMap] = useState<Map<string, FileNode>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { emit } = useContextBus();
  const { status: syncStatus, addOperation } = useSyncStatusContext();

  const activeTab = tabs.find(tab => tab.id === activeTabId) || null;
  const activeFile = activeTab ? fileNodeMap.get(activeTab.fileId) || null : null;

  console.log('[RepositoryProvider] Using shared SyncStatus context');

  const validateRestoredTabs = useCallback(async (restoredTabs: EditorTab[]) => {
    const validationPromises = restoredTabs.map(async (tab) => {
      try {
        const response = await fetch(`/api/drive/content/${tab.fileId}`, {
          method: 'HEAD',
        });
        
        return {
          tabId: tab.id,
          valid: response.ok,
          status: response.status,
        };
      } catch (error) {
        return {
          tabId: tab.id,
          valid: false,
          status: 0,
        };
      }
    });

    const results = await Promise.all(validationPromises);
    
    const invalidTabIds = results
      .filter(r => !r.valid)
      .map(r => r.tabId);

    if (invalidTabIds.length > 0) {
      setTabs(prev => {
        const filtered = prev.filter(t => !invalidTabIds.includes(t.id));
        
        if (invalidTabIds.includes(activeTabId || '')) {
          setActiveTabId(filtered.length > 0 ? filtered[0].id : null);
        }
        
        return filtered;
      });

      setSavedContents(prev => {
        const next = new Map(prev);
        invalidTabIds.forEach(id => next.delete(id));
        return next;
      });

      setFileNodeMap(prev => {
        const next = new Map(prev);
        restoredTabs.forEach(tab => {
          if (invalidTabIds.includes(tab.id)) {
            next.delete(tab.fileId);
          }
        });
        return next;
      });
    }
  }, [activeTabId]);

  useEffect(() => {
    const savedState = loadTabStateFromStorage();
    if (savedState && savedState.tabs.length > 0) {
      setTabs(savedState.tabs);
      setActiveTabId(savedState.activeTabId);
      
      const contents = new Map<string, string>();
      const nodeMap = new Map<string, FileNode>();
      savedState.tabs.forEach(tab => {
        contents.set(tab.id, tab.content);
        nodeMap.set(tab.fileId, {
          id: tab.fileId,
          name: tab.fileName,
          path: tab.filePath,
          type: 'file',
          source: 'local',
          children: [],
        });
      });
      setSavedContents(contents);
      setFileNodeMap(nodeMap);
      
      validateRestoredTabs(savedState.tabs);
    }
  }, [validateRestoredTabs]);

  useEffect(() => {
    if (tabs.length > 0) {
      saveTabStateToStorage(tabs, activeTabId);
    } else {
      localStorage.removeItem('editor-tabs-state');
    }
  }, [tabs, activeTabId]);

  const openTab = useCallback(async (file: FileNode) => {
    if (file.type !== "file") {
      return;
    }

    const existingTab = findTabByFileId(tabs, file.id);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    if (!canOpenMoreTabs(tabs.length)) {
      setError(`Maximum ${MAX_EDITOR_TABS} tabs allowed`);
      return;
    }

    setIsLoading(true);
    setError(null);

    addOperation({
      type: 'fetch',
      status: 'pending',
      fileId: file.id,
      fileName: file.name,
    });

    try {
      const response = await fetch(`/api/drive/content/${file.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content || "";
      
      const newTab = createTabFromFile(file, content);
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
      setSavedContents(prev => new Map(prev).set(newTab.id, content));
      setFileNodeMap(prev => new Map(prev).set(file.id, file));

      addOperation({
        type: 'fetch',
        status: 'success',
        fileId: file.id,
        fileName: file.name,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load file";
      setError(errorMessage);

      addOperation({
        type: 'fetch',
        status: 'error',
        fileId: file.id,
        fileName: file.name,
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [tabs, addOperation]);

  const closeTab = useCallback(async (tabId: string, force: boolean = false): Promise<boolean> => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) {
      return true;
    }

    if (tab.isDirty && !force) {
      return false;
    }

    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId);
      
      if (activeTabId === tabId && filtered.length > 0) {
        const tabIndex = prev.findIndex(t => t.id === tabId);
        const nextTab = filtered[Math.min(tabIndex, filtered.length - 1)];
        setActiveTabId(nextTab.id);
      } else if (filtered.length === 0) {
        setActiveTabId(null);
      }
      
      return filtered;
    });

    setSavedContents(prev => {
      const next = new Map(prev);
      next.delete(tabId);
      return next;
    });

    return true;
  }, [tabs, activeTabId]);

  const switchTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setActiveTabId(tabId);
    }
  }, [tabs]);

  const closeAllTabs = useCallback(async (force: boolean = false) => {
    if (!force && getDirtyTabs(tabs).length > 0) {
      return;
    }

    setTabs([]);
    setActiveTabId(null);
    setSavedContents(new Map());
  }, [tabs]);

  const closeOtherTabs = useCallback(async (tabId: string, force: boolean = false) => {
    const keepTab = tabs.find(t => t.id === tabId);
    if (!keepTab) {
      return;
    }

    const otherTabs = tabs.filter(t => t.id !== tabId);
    if (!force && otherTabs.some(t => t.isDirty)) {
      return;
    }

    setTabs([keepTab]);
    setActiveTabId(tabId);
    setSavedContents(prev => {
      const next = new Map();
      const content = prev.get(tabId);
      if (content !== undefined) {
        next.set(tabId, content);
      }
      return next;
    });
  }, [tabs]);

  const updateTabContentFn = useCallback((tabId: string, content: string) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id !== tabId) return tab;
      
      const savedContent = savedContents.get(tabId) || '';
      return updateTabContent(tab, content, savedContent);
    }));
  }, [savedContents]);

  const saveTab = useCallback(async (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || !tab.isDirty) {
      return;
    }

    setIsSaving(true);
    setError(null);

    addOperation({
      type: 'save',
      status: 'pending',
      fileId: tab.fileId,
      fileName: tab.fileName,
    });

    try {
      const response = await fetch(`/api/drive/content/${tab.fileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: tab.content }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save file: ${response.statusText}`);
      }
      
      setTabs(prev => prev.map(t => 
        t.id === tabId ? markTabAsSaved(t) : t
      ));
      
      setSavedContents(prev => new Map(prev).set(tabId, tab.content));

      addOperation({
        type: 'save',
        status: 'success',
        fileId: tab.fileId,
        fileName: tab.fileName,
      });

      if (tab.fileName === "task_plan.md") {
        const now = new Date();
        console.log(`[ContextBus] Emitting PLAN_UPDATED event for ${tab.fileName} at ${now.toISOString()}`);
        emit('PLAN_UPDATED', {
          content: tab.content,
          timestamp: now
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save file";
      setError(errorMessage);

      addOperation({
        type: 'save',
        status: 'error',
        fileId: tab.fileId,
        fileName: tab.fileName,
        error: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  }, [tabs, emit, addOperation]);

  const saveAllTabsFn = useCallback(async () => {
    const dirtyTabs = getDirtyTabs(tabs);
    
    for (const tab of dirtyTabs) {
      await saveTab(tab.id);
    }
  }, [tabs, saveTab]);

  const discardChangesFn = useCallback((tabId?: string) => {
    const targetTabId = tabId || activeTabId;
    if (!targetTabId) return;
    
    const savedContent = savedContents.get(targetTabId);
    if (savedContent === undefined) return;

    setTabs(prev => prev.map(tab => {
      if (tab.id !== targetTabId) return tab;
      return updateTabContent(tab, savedContent, savedContent);
    }));
    setError(null);
  }, [savedContents, activeTabId]);

  const retrySaveFn = useCallback(async (tabId?: string) => {
    if (!error) return;
    const targetTabId = tabId || activeTabId;
    if (!targetTabId) return;
    
    setError(null);
    await saveTab(targetTabId);
  }, [error, saveTab, activeTabId]);

  const setActiveFile = useCallback(async (file: FileNode | null) => {
    if (file) {
      await openTab(file);
    }
  }, [openTab]);

  const setFileContent = useCallback((content: string) => {
    if (activeTabId) {
      updateTabContentFn(activeTabId, content);
    }
  }, [activeTabId, updateTabContentFn]);

  const saveFile = useCallback(async () => {
    if (activeTabId) {
      await saveTab(activeTabId);
    }
  }, [activeTabId, saveTab]);

  const value: RepositoryContextValue = {
    tabs,
    activeTabId,
    activeTab,
    isLoading,
    isSaving,
    error,
    syncStatus,
    
    openTab,
    closeTab,
    switchTab,
    closeAllTabs,
    closeOtherTabs,
    updateTabContent: updateTabContentFn,
    saveTab,
    saveAllTabs: saveAllTabsFn,
    discardChanges: discardChangesFn,
    retrySave: retrySaveFn,
    
    activeFile,
    setActiveFile,
    fileContent: activeTab?.content || '',
    isDirty: activeTab?.isDirty || false,
    lastSaved: activeTab?.lastModified || null,
    setFileContent,
    saveFile,
  };

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepository() {
  const context = useContext(RepositoryContext);
  if (context === undefined) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return context;
}
