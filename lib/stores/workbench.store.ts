import { create } from 'zustand';

export interface PromptTab {
  id: string;
  title: string;
  content: string;
  fileId?: string;
  filePath?: string;
  isFileBased?: boolean;
}

interface WorkbenchState {
  tabs: PromptTab[];
  activeTabId: string | null;
  isRunning: boolean;
  activeTabError: string | null;
  addTab: (tab: PromptTab) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  updateTabTitle: (id: string, title: string) => void;
  setRunning: (isRunning: boolean) => void;
  setActiveTabError: (error: string | null) => void;
  updateTabId: (oldId: string, newId: string) => void;
  openFileTab: (fileId: string, fileName: string, filePath: string, content: string) => void;
  getTabByFileId: (fileId: string) => PromptTab | undefined;
}

export const useWorkbenchStore = create<WorkbenchState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  isRunning: false,
  activeTabError: null,
  
  addTab: (tab) => set((state) => ({ 
    tabs: [...state.tabs, tab],
    activeTabId: tab.id
  })),
  
  removeTab: (id) => set((state) => {
    const tabs = state.tabs.filter((tab) => tab.id !== id);
    let newActiveTabId = state.activeTabId;
    
    if (state.activeTabId === id) {
      if (tabs.length === 0) {
        newActiveTabId = null;
      } else {
        const removedIndex = state.tabs.findIndex((tab) => tab.id === id);
        if (removedIndex < tabs.length) {
          newActiveTabId = tabs[removedIndex].id;
        } else {
          newActiveTabId = tabs[tabs.length - 1].id;
        }
      }
    }
    
    return {
      tabs,
      activeTabId: newActiveTabId
    };
  }),
  
  setActiveTab: (id) => set({ activeTabId: id }),
  
  updateTabContent: (id, content) => set((state) => ({
    tabs: state.tabs.map((tab) => 
      tab.id === id ? { ...tab, content } : tab
    ),
  })),
  
  updateTabTitle: (id, title) => set((state) => ({
    tabs: state.tabs.map((tab) => 
      tab.id === id ? { ...tab, title } : tab
    ),
  })),
  
  setRunning: (isRunning) => set({ isRunning }),
  
  setActiveTabError: (error) => set({ activeTabError: error }),
  
  updateTabId: (oldId, newId) => set((state) => ({
    tabs: state.tabs.map((tab) =>
      tab.id === oldId ? { ...tab, id: newId } : tab
    ),
    activeTabId: state.activeTabId === oldId ? newId : state.activeTabId
  })),
  
  openFileTab: (fileId, fileName, filePath, content) => set((state) => {
    const existingTab = state.tabs.find((tab) => tab.fileId === fileId);
    
    if (existingTab) {
      return { activeTabId: existingTab.id };
    }
    
    const newTab: PromptTab = {
      id: `file-${fileId}`,
      title: fileName,
      content,
      fileId,
      filePath,
      isFileBased: true
    };
    
    return {
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id
    };
  }),
  
  getTabByFileId: (fileId) => {
    return get().tabs.find((tab) => tab.fileId === fileId);
  },
}));
