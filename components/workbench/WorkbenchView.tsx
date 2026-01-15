"use client";

import { useEffect, useRef } from "react";
import { useWorkbenchStore } from "@/lib/stores/workbench.store";
import { useToast } from "@/hooks/useToast";
import { TabBar } from "./TabBar";
import { Editor } from "./Editor";
import { ActionBar } from "./ActionBar";

export function WorkbenchView() {
  const { tabs, addTab, setActiveTab, activeTabId } = useWorkbenchStore();
  const initialized = useRef(false);
  const toast = useToast();

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

  const handleTest = () => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (!activeTab) {
      toast.error("No active prompt to test");
      return;
    }

    if (!activeTab.content.trim()) {
      toast.error("Cannot test an empty prompt");
      return;
    }

    toast.success("Test run initiated for: " + activeTab.title);
    console.log("[Test] Prompt:", activeTab);
  };

  const handleSave = () => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (!activeTab) {
      toast.error("No active prompt to save");
      return;
    }

    try {
      const savedPrompts = JSON.parse(localStorage.getItem("saved-prompts") || "[]");
      const timestamp = new Date().toISOString();
      const savedPrompt = {
        ...activeTab,
        savedAt: timestamp,
      };

      const existingIndex = savedPrompts.findIndex((p: any) => p.id === activeTab.id);
      if (existingIndex >= 0) {
        savedPrompts[existingIndex] = savedPrompt;
      } else {
        savedPrompts.push(savedPrompt);
      }

      localStorage.setItem("saved-prompts", JSON.stringify(savedPrompts));
      toast.success("Prompt saved successfully");
    } catch (error) {
      console.error("[Save] Error:", error);
      toast.error("Failed to save prompt");
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
    <div className="flex flex-col h-full bg-bg-primary">
      <TabBar />
      <div className="flex-1 overflow-hidden">
        <Editor />
      </div>
      <ActionBar onTest={handleTest} onSave={handleSave} onExport={handleExport} />
    </div>
  );
}
