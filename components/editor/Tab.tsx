"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { EditorTab } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TabProps {
  tab: EditorTab;
  isActive: boolean;
  onSwitch: (tabId: string) => void;
  onClose: (tabId: string) => void;
}

export function Tab({ tab, isActive, onSwitch, onClose }: TabProps) {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(tab.id);
  };

  return (
    <motion.div
      className={cn(
        "relative flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px] cursor-pointer select-none group",
        "border-r border-gray-200 transition-colors duration-150",
        isActive
          ? "bg-white border-b-2 border-b-blue-600"
          : "bg-gray-50 hover:bg-gray-100"
      )}
      onClick={() => onSwitch(tab.id)}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      role="tab"
      aria-selected={isActive}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSwitch(tab.id);
        }
      }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {tab.isDirty && (
          <div
            className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"
            title="Unsaved changes"
            aria-label="Unsaved changes"
          />
        )}
        <span
          className={cn(
            "text-sm font-medium truncate",
            isActive ? "text-gray-900" : "text-gray-600"
          )}
          title={tab.filePath}
        >
          {tab.fileName}
        </span>
      </div>

      <button
        onClick={handleClose}
        className={cn(
          "flex-shrink-0 p-1 rounded-md transition-all duration-150",
          "hover:bg-gray-200 active:scale-95",
          "opacity-0 group-hover:opacity-100",
          "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        )}
        title="Close tab"
        aria-label={`Close ${tab.fileName}`}
        style={{ minWidth: "24px", minHeight: "24px" }}
      >
        <X className="h-3.5 w-3.5 text-gray-600" />
      </button>
    </motion.div>
  );
}
