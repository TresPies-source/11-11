"use client";

import { useEffect, useRef } from "react";
import { useWorkbenchStore } from "@/lib/stores/workbench.store";
import { useToast } from "@/hooks/useToast";
import { useSupervisor } from "@/hooks/useSupervisor";
import { TabBar } from "./TabBar";
import { Editor } from "./Editor";
import { ActionBar } from "./ActionBar";
import { AgentActivityPanel } from "@/components/agents/AgentActivityPanel";
import { WorkbenchFileTreePanel } from "./WorkbenchFileTreePanel";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "react-resizable-panels";

export function WorkbenchView() {
  const { tabs, addTab, setActiveTab, activeTabId, updateTabId, setActiveTabError } = useWorkbenchStore();
  const initialized = useRef(false);
  const toast = useToast();
  const supervisor = useSupervisor();

  useEffect(() => {
    if (!initialized.current && tabs.length === 0) {
      initialized.current = true;
      const welcomeTab = {
        id: "welcome-tab",
        title: "Welcome",
        content: "# Welcome to Dojo Genesis Workbench\n\nStart crafting your prompts here...",
      };
      addTab(welcomeTab);
      setActiveTab(welcomeTab.id);
    }
  }, [tabs.length, addTab, setActiveTab]);

  const handleRun = async () => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (!activeTab) {
      toast.error("No active prompt to run");
      return;
    }

    if (!activeTab.content.trim()) {
      toast.error("Cannot run an empty prompt");
      return;
    }

    if (supervisor.isLoading) {
      toast.error("A run is already in progress");
      return;
    }

    setActiveTabError(null);

    try {
      console.log("[Run] Executing prompt with Supervisor:", activeTab.title);
      toast.info("Running prompt...");
      
      await supervisor.run(activeTab.content);
      
      if (!supervisor.error) {
        toast.success("Run completed successfully");
      }
    } catch (error) {
      console.error("[Run] Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to run prompt";
      setActiveTabError(errorMessage);
      toast.error(errorMessage);
    }
    
    if (supervisor.error) {
      setActiveTabError(supervisor.error);
      toast.error(supervisor.error);
    }
  };

  const handleSave = async () => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (!activeTab) {
      toast.error("No active prompt to save");
      return;
    }

    try {
      const isNewSeed = !activeTab.id.startsWith("seed-");
      
      if (isNewSeed) {
        console.log("[Save] Creating new seed:", activeTab.title);
        
        const response = await fetch("/api/seeds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: activeTab.title,
            type: "artifact",
            content: activeTab.content,
            status: "new",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to save prompt");
        }

        const newSeed = await response.json();
        console.log("[Save] Seed created with ID:", newSeed.id);
        
        updateTabId(activeTab.id, `seed-${newSeed.id}`);
        toast.success("Prompt saved successfully");
      } else {
        const seedId = activeTab.id.replace("seed-", "");
        console.log("[Save] Updating existing seed:", seedId);
        
        const response = await fetch(`/api/seeds/${seedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: activeTab.title,
            content: activeTab.content,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to save prompt");
        }

        console.log("[Save] Seed updated successfully");
        toast.success("Prompt saved successfully");
      }
    } catch (error) {
      console.error("[Save] Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save prompt");
    }
  };

  const handleExport = () => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (!activeTab) {
      toast.error("No active prompt to export");
      return;
    }

    const exportData = {
      id: activeTab.id,
      title: activeTab.title,
      content: activeTab.content,
      exportedAt: new Date().toISOString(),
    };

    const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement("a");
    jsonLink.href = jsonUrl;
    jsonLink.download = `${activeTab.title.replace(/\s+/g, "-").toLowerCase()}.json`;
    jsonLink.click();
    URL.revokeObjectURL(jsonUrl);

    const markdownContent = `# ${activeTab.title}\n\n${activeTab.content}\n\n---\nExported: ${exportData.exportedAt}`;
    const mdBlob = new Blob([markdownContent], { type: "text/markdown" });
    const mdUrl = URL.createObjectURL(mdBlob);
    const mdLink = document.createElement("a");
    mdLink.href = mdUrl;
    mdLink.download = `${activeTab.title.replace(/\s+/g, "-").toLowerCase()}.md`;
    mdLink.click();
    URL.revokeObjectURL(mdUrl);

    toast.success("Prompt exported as JSON and Markdown");
  };

  return (
    <div className="h-full bg-bg-primary">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
          <WorkbenchFileTreePanel onOpenFile={() => {}} />
        </ResizablePanel>
        
        <ResizableHandle className="w-1 bg-border hover:bg-border-hover transition-colors" />
        
        <ResizablePanel defaultSize={60}>
          <div className="flex flex-col h-full">
            <TabBar />
            <div className="flex-1 overflow-hidden">
              <Editor />
            </div>
            <ActionBar onRun={handleRun} onSave={handleSave} onExport={handleExport} isRunning={supervisor.isLoading} />
          </div>
        </ResizablePanel>
        
        <ResizableHandle className="w-1 bg-border hover:bg-border-hover transition-colors" />
        
        <ResizablePanel defaultSize={20}>
          <AgentActivityPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
