"use client";

import React from "react";
import { X } from "lucide-react";
import { PromptTab } from "@/lib/stores/workbench.store";
import { cn } from "@/lib/utils";

interface TabProps {
  tab: PromptTab;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
}

export const Tab = React.memo(function Tab({
  tab,
  isActive,
  onActivate,
  onClose,
}: TabProps) {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      onClick={onActivate}
      className={cn(
        "relative flex items-center gap-2 px-4 py-2 cursor-pointer transition-all duration-fast border-b-2 min-w-[120px] max-w-[200px]",
        isActive
          ? "bg-bg-secondary border-text-accent text-text-primary"
          : "bg-bg-primary border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50"
      )}
    >
      <span className="flex-1 truncate text-sm font-medium">{tab.title}</span>
      <button
        onClick={handleClose}
        className={cn(
          "flex items-center justify-center w-4 h-4 rounded hover:bg-bg-tertiary transition-colors",
          isActive ? "text-text-secondary hover:text-text-primary" : "text-text-muted hover:text-text-secondary"
        )}
        aria-label={`Close ${tab.title}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
});
