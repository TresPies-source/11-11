"use client";

import { useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Loader2, AlertCircle } from "lucide-react";
import { PANEL_TRANSITION_DURATION, ANIMATION_EASE } from "@/lib/constants";
import { FileTree } from "@/components/shared/FileTree";
import { FileNode } from "@/lib/types";
import { useRepository } from "@/hooks/useRepository";
import { useFileTree } from "@/hooks/useFileTree";

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { openTab, tabs } = useRepository();
  const {
    fileTree,
    selectedId,
    setSelectedId,
    expandedIds,
    toggleExpand,
    operationsInProgress,
    isLoading,
    error,
  } = useFileTree();

  const openFileIds = useMemo(() => {
    return new Set(tabs.map(tab => tab.fileId));
  }, [tabs]);

  const handleSelect = useCallback(async (node: FileNode) => {
    setSelectedId(node.id);
    await openTab(node);
  }, [openTab, setSelectedId]);

  return (
    <div className="h-full bg-background border-r border-border flex flex-col">
      <div className="h-14 border-b border-border flex items-center justify-between px-4">
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
              <FolderOpen className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Files</span>
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
            <FolderOpen className="w-5 h-5 text-primary" />
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
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Failed to load files</p>
                  <p className="text-xs text-muted-foreground">Using local data</p>
                </div>
              ) : (
                <FileTree
                  nodes={fileTree}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpand}
                  operationsInProgress={operationsInProgress}
                  openFileIds={openFileIds}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 pt-2"
            >
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-primary" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
