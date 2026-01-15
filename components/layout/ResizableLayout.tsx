"use client";

import { useRef, useState } from "react";
import { PanelGroup, Panel, PanelResizeHandle, ImperativePanelHandle } from "react-resizable-panels";
import { NavigationSidebar } from "@/components/layout/NavigationSidebar";
import { AgentActivityPanel } from "@/components/layout/AgentActivityPanel";

interface ResizableLayoutProps {
  children: React.ReactNode;
}

export function ResizableLayout({ children }: ResizableLayoutProps) {
  const agentPanelRef = useRef<ImperativePanelHandle>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

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
    <>
      {/* Mobile overlay */}
      {isMobileNavOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}
      
      <PanelGroup direction="horizontal" className="h-screen">
        <Panel defaultSize={75} minSize={50} className="hidden lg:block">
          <div className="flex h-full">
            <NavigationSidebar />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </Panel>
        
        {/* Mobile and tablet layout */}
        <div className="flex h-full w-full lg:hidden">
          <NavigationSidebar 
            isMobileOpen={isMobileNavOpen}
            onMobileToggle={setIsMobileNavOpen}
          />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
        
        <PanelResizeHandle className="w-px bg-brand-dojo-primary/20 hover:bg-brand-dojo-primary/40 transition-colors data-[resize-handle-state=drag]:bg-brand-dojo-primary hidden lg:block" />
        <Panel 
          ref={agentPanelRef}
          defaultSize={25} 
          minSize={8} 
          maxSize={32}
          collapsible={true}
          collapsedSize={8}
          className="hidden lg:block"
        >
          <AgentActivityPanel onToggle={handleToggleAgentPanel} />
        </Panel>
      </PanelGroup>
    </>
  );
}
