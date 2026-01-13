"use client";

import { useState, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";
import { cn } from "@/lib/utils";
import { SIDEBAR_DEFAULT_WIDTH } from "@/lib/constants";

const STORAGE_KEY = "11-11-panel-layout";

export function CommandCenter() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLayout = (sizes: number[]) => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes));
    }
  };

  const getDefaultLayout = (): number[] => {
    if (typeof window === "undefined") {
      return [20, 80];
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [20, 80];
      }
    }
    return [20, 80];
  };

  if (!mounted) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-muted/30 flex flex-col">
      <Header />
      <div className="flex-1 overflow-hidden">
        <PanelGroup
          direction="horizontal"
          onLayout={handleLayout}
          className="h-full"
        >
          <Panel
            defaultSize={getDefaultLayout()[0]}
            minSize={sidebarCollapsed ? 3 : 15}
            maxSize={35}
            collapsible={true}
            onCollapse={() => setSidebarCollapsed(true)}
            onExpand={() => setSidebarCollapsed(false)}
            className={cn(
              "transition-all duration-200",
              sidebarCollapsed && "min-w-[48px]"
            )}
          >
            <Sidebar collapsed={sidebarCollapsed} />
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors" />

          <Panel defaultSize={getDefaultLayout()[1]} minSize={50}>
            <MainContent />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
