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
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { FileNode } from "@/lib/types";

export function WorkbenchView() {
  const { tabs, addTab, setActiveTab, activeTabId, updateTabId, setActiveTabError, openFileTab } = useWorkbenchStore();
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (activeTab.isFileBased && activeTab.fileId) {
        console.log("[Save] Saving file-based tab:", activeTab.fileId);
        
        const response = await fetch(`/api/drive/content/${activeTab.fileId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: activeTab.content,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 404) {
            toast.error("This file no longer exists. The tab will remain open but cannot be saved.");
            return;
          }
          
          throw new Error(errorData.error || "Failed to save file");
        }

        console.log("[Save] File saved successfully");
        toast.success("File saved successfully");
        return;
      }

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

  const handleOpenFile = async (file: FileNode) => {
    if (file.type === "folder") {
      return;
    }

    toast.info("Opening file...");

    try {
      const response = await fetch(`/api/drive/content/${file.id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch file content");
      }

      const data = await response.json();
      const content = data.content || "";

      openFileTab(file.id, file.name, file.path, content);
      toast.success(`Opened ${file.name}`);
    } catch (error) {
      console.error("[OpenFile] Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to open file");
    }
  };

  return (
    <div className="h-full bg-bg-primary">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={20} minSize={15} maxSize={35} aria-label="File explorer panel">
          <WorkbenchFileTreePanel onOpenFile={handleOpenFile} />
        </Panel>
        
        <PanelResizeHandle className="w-1 bg-border hover:bg-border-hover transition-colors" aria-label="Resize file explorer" />
        
        <Panel defaultSize={60} aria-label="Editor panel">
          <div className="flex flex-col h-full">
            <TabBar />
            <div className="flex-1 overflow-hidden">
              <Editor />
            </div>
            <ActionBar onRun={handleRun} onSave={handleSave} onExport={handleExport} isRunning={supervisor.isLoading} />
          </div>
        </Panel>
        
        <PanelResizeHandle className="w-1 bg-border hover:bg-border-hover transition-colors" aria-label="Resize agent activity panel" />
        
        <Panel defaultSize={20} aria-label="Agent activity panel">
          <AgentActivityPanel />
        </Panel>
      </PanelGroup>
    </div>
  );
}
