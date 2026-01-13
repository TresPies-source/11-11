"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PANEL_TRANSITION_DURATION, ANIMATION_EASE, isDevelopmentMode } from "@/lib/constants";
import { FileTree } from "@/components/shared/FileTree";
import { mockFileTree } from "@/data/mockFileTree";
import { FileNode, DriveFile } from "@/lib/types";
import { useRepository } from "@/hooks/useRepository";

interface SidebarProps {
  collapsed: boolean;
}

function convertDriveFilesToFileNodes(driveFiles: DriveFile[]): FileNode[] {
  const promptsFolder = {
    id: "03_prompts",
    name: "03_Prompts",
    type: "folder" as const,
    path: "/03_Prompts",
    source: "google-drive" as const,
    children: driveFiles
      .filter(f => f.path.startsWith("03_Prompts"))
      .map(f => ({
        id: f.id,
        name: f.name,
        type: "file" as const,
        path: `/${f.path}`,
        source: "google-drive" as const,
        modified: new Date(f.modifiedTime),
      })),
  };

  const prdsFolder = {
    id: "01_prds",
    name: "01_PRDs",
    type: "folder" as const,
    path: "/01_PRDs",
    source: "google-drive" as const,
    children: driveFiles
      .filter(f => f.path.startsWith("01_PRDs"))
      .map(f => ({
        id: f.id,
        name: f.name,
        type: "file" as const,
        path: `/${f.path}`,
        source: "google-drive" as const,
        modified: new Date(f.modifiedTime),
      })),
  };

  const staticFolders = mockFileTree.filter(
    node => !["03_prompts", "01_prds"].includes(node.id)
  );

  return [...staticFolders, prdsFolder, promptsFolder].sort((a, b) => {
    const orderMap: { [key: string]: number } = {
      "journal": 0,
      "00_roadmap": 1,
      "01_prds": 2,
      "02_specs": 3,
      "03_prompts": 4,
      "04_system": 5,
      "05_logs": 6,
    };
    return (orderMap[a.id] || 999) - (orderMap[b.id] || 999);
  });
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { openTab, tabs, activeTabId } = useRepository();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(["00_roadmap", "05_logs"])
  );
  const [fileTree, setFileTree] = useState<FileNode[]>(mockFileTree);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const openFileIds = useMemo(() => {
    return new Set(tabs.map(tab => tab.fileId));
  }, [tabs]);

  useEffect(() => {
    async function loadFiles() {
      if (isDevelopmentMode()) {
        console.log("[Sidebar] Running in dev mode - using mock file tree");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/drive/files");
        
        if (!response.ok) {
          throw new Error(`Failed to fetch files: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.files && Array.isArray(data.files)) {
          const mergedTree = convertDriveFilesToFileNodes(data.files);
          setFileTree(mergedTree);
        } else {
          console.warn("[Sidebar] Invalid response format, using mock data");
          setFileTree(mockFileTree);
        }
      } catch (err) {
        console.error("[Sidebar] Error loading files:", err);
        setError(err instanceof Error ? err.message : "Failed to load files");
        setFileTree(mockFileTree);
      } finally {
        setIsLoading(false);
      }
    }

    loadFiles();
  }, []);

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

  const handleSelect = useCallback(async (node: FileNode) => {
    setSelectedId(node.id);
    await openTab(node);
  }, [openTab]);
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
                  onToggleExpand={handleToggleExpand}
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
