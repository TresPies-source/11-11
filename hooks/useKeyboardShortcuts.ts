import { useEffect } from "react";
import { EditorTab } from "@/lib/types";

interface UseKeyboardShortcutsProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onCloseTab: (tabId: string) => void;
  onSwitchTab: (tabId: string) => void;
}

export function useKeyboardShortcuts({
  tabs,
  activeTabId,
  onCloseTab,
  onSwitchTab,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      if (!modKey) return;

      if (event.key === 'w' || event.key === 'W') {
        if (activeTabId) {
          event.preventDefault();
          onCloseTab(activeTabId);
        }
        return;
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        
        if (tabs.length === 0) return;

        const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
        
        if (event.shiftKey) {
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
          onSwitchTab(tabs[prevIndex].id);
        } else {
          const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
          onSwitchTab(tabs[nextIndex].id);
        }
        return;
      }

      const num = parseInt(event.key);
      if (num >= 1 && num <= 9) {
        const tabIndex = num - 1;
        if (tabIndex < tabs.length) {
          event.preventDefault();
          onSwitchTab(tabs[tabIndex].id);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId, onCloseTab, onSwitchTab]);
}
