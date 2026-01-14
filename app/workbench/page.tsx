'use client';

import { useEffect, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelHandle } from 'react-resizable-panels';
import { useWorkbenchStore } from '@/lib/stores/workbench.store';
import { TabBar } from '@/components/workbench/TabBar';
import { Editor } from '@/components/workbench/Editor';
import { ActionBar } from '@/components/workbench/ActionBar';
import { AgentActivityPanel } from '@/components/layout/AgentActivityPanel';

export default function WorkbenchPage() {
  const { tabs, addTab, setActiveTab, isAgentPanelOpen } = useWorkbenchStore();
  const initialized = useRef(false);
  const agentPanelRef = useRef<ImperativePanelHandle>(null);

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

  useEffect(() => {
    if (agentPanelRef.current) {
      if (isAgentPanelOpen) {
        agentPanelRef.current.expand();
      } else {
        agentPanelRef.current.collapse();
      }
    }
  }, [isAgentPanelOpen]);

  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      <TabBar />
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={70} minSize={30}>
            <Editor />
          </Panel>
          <PanelResizeHandle className="w-2 bg-bg-tertiary hover:bg-text-accent transition-colors" />
          <Panel 
            ref={agentPanelRef}
            defaultSize={30} 
            minSize={10} 
            maxSize={40}
            collapsible={true}
            collapsedSize={0}
          >
            <AgentActivityPanel />
          </Panel>
        </PanelGroup>
      </div>
      <ActionBar />
    </div>
  );
}
