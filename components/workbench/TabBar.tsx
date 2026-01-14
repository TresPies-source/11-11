"use client";

import React from "react";
import { Plus } from "lucide-react";
import { useWorkbenchStore } from "@/lib/stores/workbench.store";
import { Tab } from "./Tab";
import { cn } from "@/lib/utils";

export const TabBar = React.memo(function TabBar() {
  const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useWorkbenchStore();

  const handleAddTab = () => {
    const newTab = {
      id: `tab-${Date.now()}`,
      title: `Untitled ${tabs.length + 1}`,
      content: "",
    };
    addTab(newTab);
  };

  return (
    <div className="flex items-center bg-bg-primary border-b border-bg-tertiary overflow-x-auto scrollbar-thin scrollbar-thumb-bg-tertiary scrollbar-track-transparent">
      <button
        onClick={handleAddTab}
        className={cn(
          "flex items-center justify-center gap-2 px-4 h-10 flex-shrink-0 text-text-accent hover:text-text-primary hover:bg-bg-tertiary transition-colors font-medium border-r border-bg-tertiary"
        )}
        aria-label="Add new tab"
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm">New Tab</span>
      </button>
      <div className="flex items-center flex-1 min-w-0">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onActivate={() => setActiveTab(tab.id)}
            onClose={() => removeTab(tab.id)}
          />
        ))}
      </div>
    </div>
  );
});
