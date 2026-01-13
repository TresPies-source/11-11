"use client";

import { AnimatePresence } from "framer-motion";
import { Tab } from "./Tab";
import { EditorTab } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TabBarProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onSwitch: (tabId: string) => void;
  onClose: (tabId: string) => void;
  className?: string;
}

export function TabBar({
  tabs,
  activeTabId,
  onSwitch,
  onClose,
  className,
}: TabBarProps) {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center border-b border-gray-200 bg-gray-50",
        "overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
        className
      )}
      role="tablist"
      aria-label="Open files"
    >
      <AnimatePresence initial={false}>
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onSwitch={onSwitch}
            onClose={onClose}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
