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
      <button
        onClick={handleAddTab}
        className={cn(
          "flex items-center justify-center w-10 h-10 flex-shrink-0 text-text-secondary hover:text-text-accent hover:bg-bg-secondary transition-colors"
        )}
        aria-label="Add new tab"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
});
