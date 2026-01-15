"use client";

import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { NavigationSidebar } from "@/components/layout/NavigationSidebar";
import { AgentActivityPanel } from "@/components/layout/AgentActivityPanel";

interface ResizableLayoutProps {
  children: React.ReactNode;
}

export function ResizableLayout({ children }: ResizableLayoutProps) {
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
        defaultSize={25} 
        minSize={8} 
        maxSize={32}
        collapsible={true}
      >
        <AgentActivityPanel />
      </Panel>
    </PanelGroup>
  );
}
