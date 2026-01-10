"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Cloud,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FileNode } from "@/lib/types";
import { PANEL_TRANSITION_DURATION } from "@/lib/constants";

interface FileTreeProps {
  nodes: FileNode[];
  level?: number;
  selectedId?: string;
  onSelect?: (node: FileNode) => void;
  expandedIds?: Set<string>;
  onToggleExpand?: (id: string) => void;
}

export function FileTree({
  nodes,
  level = 0,
  selectedId,
  onSelect,
  expandedIds,
  onToggleExpand,
}: FileTreeProps) {
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <FileTreeNode
          key={node.id}
          node={node}
          level={level}
          selectedId={selectedId}
          onSelect={onSelect}
          expandedIds={expandedIds}
          onToggleExpand={onToggleExpand}
        />
      ))}
    </div>
  );
}

interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  selectedId?: string;
  onSelect?: (node: FileNode) => void;
  expandedIds?: Set<string>;
  onToggleExpand?: (id: string) => void;
}

function FileTreeNode({
  node,
  level,
  selectedId,
  onSelect,
  expandedIds,
  onToggleExpand,
}: FileTreeNodeProps) {
  const isExpanded = expandedIds?.has(node.id) ?? node.expanded ?? false;
  const isSelected = selectedId === node.id;
  const hasChildren = node.type === "folder" && node.children && node.children.length > 0;

  const handleClick = () => {
    if (node.type === "folder") {
      onToggleExpand?.(node.id);
    } else {
      onSelect?.(node);
    }
  };

  const getSourceIcon = () => {
    switch (node.source) {
      case "google-drive":
        return <Cloud className="w-3 h-3 text-blue-500" />;
      case "github":
        return <GitBranch className="w-3 h-3 text-gray-700" />;
      default:
        return null;
    }
  };

  return (
    <div>
      <motion.div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer group transition-colors",
          "hover:bg-gray-100",
          isSelected && "bg-blue-50 hover:bg-blue-100"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        whileHover={{ x: 2 }}
        transition={{ duration: 0.15 }}
      >
        {node.type === "folder" ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-600" />
            ) : (
              <Folder className="w-4 h-4 text-blue-600" />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-4 h-4" />
            <File className="w-4 h-4 text-gray-500" />
          </div>
        )}

        <span
          className={cn(
            "text-sm truncate flex-1",
            isSelected ? "text-blue-900 font-medium" : "text-gray-700"
          )}
        >
          {node.name}
        </span>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {node.isModified && (
            <div className="w-2 h-2 rounded-full bg-orange-500" title="Modified" />
          )}
          {getSourceIcon()}
        </div>
      </motion.div>

      <AnimatePresence initial={false}>
        {node.type === "folder" && isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: PANEL_TRANSITION_DURATION, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <FileTree
              nodes={node.children!}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
