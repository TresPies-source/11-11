"use client";

import { useFileTree } from "@/hooks/useFileTree";
import { FileTree } from "@/components/shared/FileTree";
import { FileNode } from "@/lib/types";
import { Loader2, AlertCircle, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkbenchFileTreePanelProps {
  onOpenFile?: (node: FileNode) => void;
}

export function WorkbenchFileTreePanel({ onOpenFile }: WorkbenchFileTreePanelProps) {
  const {
    fileTree,
    expandedIds,
    selectedId,
    setSelectedId,
    toggleExpand,
    operationsInProgress,
    isLoading,
    error,
  } = useFileTree();

  const handleSelect = (node: FileNode) => {
    if (node.type === "file") {
      setSelectedId(node.id);
      onOpenFile?.(node);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary border-r border-bg-tertiary">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-bg-tertiary bg-bg-secondary">
        <Folder className="w-4 h-4 text-text-accent" />
        <h2 className="text-sm font-semibold text-text-primary">Files</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-text-accent animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 px-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p className="text-xs text-center text-text-secondary">{error}</p>
          </div>
        ) : fileTree.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-xs text-text-secondary">No files found</p>
          </div>
        ) : (
          <FileTree
            nodes={fileTree}
            selectedId={selectedId}
            onSelect={handleSelect}
            expandedIds={expandedIds}
            onToggleExpand={toggleExpand}
            operationsInProgress={operationsInProgress}
          />
        )}
      </div>
    </div>
  );
}
