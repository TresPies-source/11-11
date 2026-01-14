'use client';

import { useEffect, useRef } from 'react';
import { useWorkbenchStore } from '@/lib/stores/workbench.store';
import { TabBar } from '@/components/workbench/TabBar';
import { Editor } from '@/components/workbench/Editor';
import { ActionBar } from '@/components/workbench/ActionBar';

export default function WorkbenchPage() {
  const { tabs, addTab, setActiveTab } = useWorkbenchStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && tabs.length === 0) {
      initialized.current = true;
      const welcomeTab = {
        id: 'welcome-tab',
        title: 'Welcome',
        content: '# Welcome to Dojo Genesis Workbench\n\nStart crafting your prompts here...',
      };
      addTab(welcomeTab);
      setActiveTab(welcomeTab.id);
    }
  }, [tabs.length, addTab, setActiveTab]);

  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      <TabBar />
      <div className="flex-1 overflow-hidden">
        <Editor />
      </div>
      <ActionBar />
    </div>
  );
}
