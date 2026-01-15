"use client";

import { useRef } from "react";
import { PanelGroup, Panel, PanelResizeHandle, ImperativePanelHandle } from "react-resizable-panels";
import { NavigationSidebar } from "@/components/layout/NavigationSidebar";
import { AgentActivityPanel } from "@/components/layout/AgentActivityPanel";

interface ResizableLayoutProps {
  children: React.ReactNode;
}

export function ResizableLayout({ children }: ResizableLayoutProps) {
  const agentPanelRef = useRef<ImperativePanelHandle>(null);

  const handleToggleAgentPanel = () => {
    if (agentPanelRef.current) {
      if (agentPanelRef.current.isCollapsed()) {
        agentPanelRef.current.expand();
      } else {
        agentPanelRef.current.collapse();
      }
    }
  };

  return (
    <PanelGroup direction="horizontal" className="h-screen">
      <Panel defaultSize={75} minSize={50}>
        <div className="flex h-full">
          <NavigationSidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </Panel>
      <PanelResizeHandle className="w-px bg-brand-dojo-primary/20 hover:bg-brand-dojo-primary/40 transition-colors data-[resize-handle-state=drag]:bg-brand-dojo-primary" />
      <Panel 
        ref={agentPanelRef}
        defaultSize={25} 
        minSize={8} 
        maxSize={32}
        collapsible={true}
      >
        <AgentActivityPanel onToggle={handleToggleAgentPanel} />
      </Panel>
    </PanelGroup>
  );
}
