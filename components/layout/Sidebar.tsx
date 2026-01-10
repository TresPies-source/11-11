"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PANEL_TRANSITION_DURATION, ANIMATION_EASE } from "@/lib/constants";
import { FileTree } from "@/components/shared/FileTree";
import { mockFileTree } from "@/data/mockFileTree";
import { FileNode } from "@/lib/types";

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(["00_roadmap", "05_logs"])
  );

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelect = (node: FileNode) => {
    setSelectedId(node.id);
  };
  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              key="sidebar-title"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: PANEL_TRANSITION_DURATION, ease: ANIMATION_EASE }}
              className="flex items-center gap-2"
            >
              <FolderOpen className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Files</span>
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center w-full"
          >
            <FolderOpen className="w-5 h-5 text-blue-600" />
          </motion.div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="file-tree"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: PANEL_TRANSITION_DURATION }}
            >
              <FileTree
                nodes={mockFileTree}
                selectedId={selectedId}
                onSelect={handleSelect}
                expandedIds={expandedIds}
                onToggleExpand={handleToggleExpand}
              />
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 pt-2"
            >
              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
