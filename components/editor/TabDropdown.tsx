"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { EditorTab } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TabDropdownProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onSwitch: (tabId: string) => void;
  onClose: (tabId: string) => void;
  className?: string;
}

export function TabDropdown({
  tabs,
  activeTabId,
  onSwitch,
  onClose,
  className,
}: TabDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const tabCount = tabs.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleTabSwitch = (tabId: string) => {
    onSwitch(tabId);
    setIsOpen(false);
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onClose(tabId);
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-4 py-3",
          "bg-white border-b border-gray-200",
          "hover:bg-gray-50 active:bg-gray-100",
          "transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Open files dropdown. ${tabCount} file${tabCount > 1 ? "s" : ""} open`}
        style={{ minHeight: "44px" }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {activeTab?.isDirty && (
            <div
              className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"
              title="Unsaved changes"
              aria-label="Unsaved changes"
            />
          )}
          <span className="text-sm font-medium text-gray-900 truncate">
            {activeTab?.fileName || "No file selected"}
          </span>
          <span className="text-xs text-gray-500 flex-shrink-0">
            ({tabCount} file{tabCount > 1 ? "s" : ""})
          </span>
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-600 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute top-full left-0 right-0 z-50",
              "bg-white border border-gray-200 shadow-lg",
              "max-h-[50vh] overflow-y-auto"
            )}
            role="listbox"
            aria-label="Open files"
          >
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
                    "cursor-pointer select-none group",
                    "border-b border-gray-100 last:border-b-0",
                    "transition-colors duration-150",
                    isActive
                      ? "bg-blue-50 border-l-4 border-l-blue-600"
                      : "hover:bg-gray-50 active:bg-gray-100"
                  )}
                  role="option"
                  aria-selected={isActive}
                  style={{ minHeight: "44px" }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {tab.isDirty && (
                      <div
                        className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"
                        title="Unsaved changes"
                        aria-label="Unsaved changes"
                      />
                    )}
                    <div className="flex flex-col flex-1 min-w-0">
                      <span
                        className={cn(
                          "text-sm font-medium truncate",
                          isActive ? "text-blue-900" : "text-gray-900"
                        )}
                        title={tab.filePath}
                      >
                        {tab.fileName}
                      </span>
                      <span className="text-xs text-gray-500 truncate">
                        {tab.filePath}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleTabClose(e, tab.id)}
                    className={cn(
                      "flex-shrink-0 p-2 rounded-md",
                      "transition-all duration-150",
                      "hover:bg-gray-200 active:scale-95",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500"
                    )}
                    title="Close tab"
                    aria-label={`Close ${tab.fileName}`}
                    style={{ minWidth: "36px", minHeight: "36px" }}
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
