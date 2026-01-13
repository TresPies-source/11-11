"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Cloud,
  GitBranch,
  Loader2,
  FilePlus,
  FolderPlus,
  Edit2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FileNode, ContextMenuItem } from "@/lib/types";
import { PANEL_TRANSITION_DURATION } from "@/lib/constants";
import { ContextMenu } from "./ContextMenu";
import { CreateFileModal } from "./CreateFileModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { useContextMenu } from "@/hooks/useContextMenu";
import { useFileOperations } from "@/hooks/useFileOperations";

interface FileTreeProps {
  nodes: FileNode[];
  level?: number;
  selectedId?: string;
  onSelect?: (node: FileNode) => void;
  expandedIds?: Set<string>;
  onToggleExpand?: (id: string) => void;
  operationsInProgress?: Set<string>;
}

export function FileTree({
  nodes,
  level = 0,
  selectedId,
  onSelect,
  expandedIds,
  onToggleExpand,
  operationsInProgress,
}: FileTreeProps) {
  const contextMenu = useContextMenu();
  const fileOps = useFileOperations();
  const [createModalState, setCreateModalState] = useState<{
    isOpen: boolean;
    type: "file" | "folder";
    parentNode: FileNode | null;
  }>({ isOpen: false, type: "file", parentNode: null });
  const [deleteDialogState, setDeleteDialogState] = useState<{
    isOpen: boolean;
    node: FileNode | null;
  }>({ isOpen: false, node: null });
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);

  const handleCreateFile = (parentNode: FileNode) => {
    setCreateModalState({ isOpen: true, type: "file", parentNode });
    contextMenu.closeContextMenu();
  };

  const handleCreateFolder = (parentNode: FileNode) => {
    setCreateModalState({ isOpen: true, type: "folder", parentNode });
    contextMenu.closeContextMenu();
  };

  const handleRename = (node: FileNode) => {
    setRenamingNodeId(node.id);
    contextMenu.closeContextMenu();
  };

  const handleDelete = (node: FileNode) => {
    setDeleteDialogState({ isOpen: true, node });
    contextMenu.closeContextMenu();
  };

  const getExistingNames = (parentNode: FileNode | null): string[] => {
    if (!parentNode || !parentNode.children) return [];
    return parentNode.children.map(child => child.name);
  };

  return (
    <>
      <FileTreeNodes
        nodes={nodes}
        level={level}
        selectedId={selectedId}
        onSelect={onSelect}
        expandedIds={expandedIds}
        onToggleExpand={onToggleExpand}
        operationsInProgress={operationsInProgress}
        onContextMenu={contextMenu.openContextMenu}
        renamingNodeId={renamingNodeId}
        onRename={handleRename}
        onFinishRename={() => setRenamingNodeId(null)}
      />

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        items={
          contextMenu.targetNode
            ? getContextMenuItems(
                contextMenu.targetNode,
                () => handleCreateFile(contextMenu.targetNode!),
                () => handleCreateFolder(contextMenu.targetNode!),
                () => handleRename(contextMenu.targetNode!),
                () => handleDelete(contextMenu.targetNode!)
              )
            : []
        }
        onClose={contextMenu.closeContextMenu}
      />

      {createModalState.parentNode && (
        <CreateFileModal
          isOpen={createModalState.isOpen}
          type={createModalState.type}
          existingNames={getExistingNames(createModalState.parentNode)}
          onClose={() => setCreateModalState({ isOpen: false, type: "file", parentNode: null })}
          onCreate={async (name) => {
            if (createModalState.type === "file") {
              await fileOps.createFile(createModalState.parentNode!, name);
            } else {
              await fileOps.createFolder(createModalState.parentNode!, name);
            }
          }}
        />
      )}

      {deleteDialogState.node && (
        <DeleteConfirmDialog
          isOpen={deleteDialogState.isOpen}
          type={deleteDialogState.node.type}
          name={deleteDialogState.node.name}
          isCurrentlyOpen={selectedId === deleteDialogState.node.id}
          onClose={() => setDeleteDialogState({ isOpen: false, node: null })}
          onConfirm={async () => {
            await fileOps.deleteFile(deleteDialogState.node!);
          }}
        />
      )}
    </>
  );
}

interface FileTreeNodesProps {
  nodes: FileNode[];
  level: number;
  selectedId?: string;
  onSelect?: (node: FileNode) => void;
  expandedIds?: Set<string>;
  onToggleExpand?: (id: string) => void;
  operationsInProgress?: Set<string>;
  onContextMenu: (event: React.MouseEvent, node: FileNode) => void;
  renamingNodeId: string | null;
  onRename: (node: FileNode) => void;
  onFinishRename: () => void;
}

function FileTreeNodes({
  nodes,
  level,
  selectedId,
  onSelect,
  expandedIds,
  onToggleExpand,
  operationsInProgress,
  onContextMenu,
  renamingNodeId,
  onRename,
  onFinishRename,
}: FileTreeNodesProps) {
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
          operationsInProgress={operationsInProgress}
          onContextMenu={onContextMenu}
          renamingNodeId={renamingNodeId}
          onRename={onRename}
          onFinishRename={onFinishRename}
        />
      ))}
    </div>
  );
}

function getContextMenuItems(
  node: FileNode,
  onCreateFile: () => void,
  onCreateFolder: () => void,
  onRename: () => void,
  onDelete: () => void
): ContextMenuItem[] {
  if (node.type === "folder") {
    return [
      {
        id: "new-file",
        label: "New File",
        icon: FilePlus,
        onClick: onCreateFile,
      },
      {
        id: "new-folder",
        label: "New Folder",
        icon: FolderPlus,
        onClick: onCreateFolder,
      },
      {
        id: "separator-1",
        label: "",
        onClick: () => {},
        separator: true,
      },
      {
        id: "rename",
        label: "Rename",
        icon: Edit2,
        onClick: onRename,
      },
      {
        id: "delete",
        label: "Delete",
        icon: Trash2,
        onClick: onDelete,
        danger: true,
      },
    ];
  } else {
    return [
      {
        id: "rename",
        label: "Rename",
        icon: Edit2,
        onClick: onRename,
      },
      {
        id: "delete",
        label: "Delete",
        icon: Trash2,
        onClick: onDelete,
        danger: true,
      },
    ];
  }
}

interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  selectedId?: string;
  onSelect?: (node: FileNode) => void;
  expandedIds?: Set<string>;
  onToggleExpand?: (id: string) => void;
  operationsInProgress?: Set<string>;
  onContextMenu: (event: React.MouseEvent, node: FileNode) => void;
  renamingNodeId: string | null;
  onRename: (node: FileNode) => void;
  onFinishRename: () => void;
}

function FileTreeNode({
  node,
  level,
  selectedId,
  onSelect,
  expandedIds,
  onToggleExpand,
  operationsInProgress,
  onContextMenu,
  renamingNodeId,
  onRename,
  onFinishRename,
}: FileTreeNodeProps) {
  const isExpanded = expandedIds?.has(node.id) ?? node.expanded ?? false;
  const isSelected = selectedId === node.id;
  const hasChildren = node.type === "folder" && node.children && node.children.length > 0;
  const isOperationInProgress = operationsInProgress?.has(node.id) ?? false;
  const isRenaming = renamingNodeId === node.id;

  const [renameValue, setRenameValue] = useState(node.name);
  const [lastClickTime, setLastClickTime] = useState(0);
  const renameInputRef = useState<HTMLInputElement | null>(null)[0];
  const fileOps = useFileOperations();

  const handleClick = (e: React.MouseEvent) => {
    if (isRenaming || isOperationInProgress) return;

    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;

    if (timeSinceLastClick < 500 && node.type === "file") {
      onRename(node);
      setLastClickTime(0);
      return;
    }

    setLastClickTime(now);

    if (node.type === "folder") {
      onToggleExpand?.(node.id);
    } else {
      onSelect?.(node);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isOperationInProgress) return;
    onContextMenu(e, node);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isOperationInProgress) return;

    if (!isRenaming && isSelected) {
      if (e.key === "F2") {
        e.preventDefault();
        onRename(node);
      } else if (e.key === "Delete") {
        e.preventDefault();
      }
    }
  };

  const handleRenameSubmit = async () => {
    if (renameValue.trim() && renameValue !== node.name) {
      await fileOps.renameFile(node, renameValue.trim());
    }
    onFinishRename();
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setRenameValue(node.name);
      onFinishRename();
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
          "flex items-center gap-1.5 px-2 py-1.5 rounded-md group transition-colors",
          !isRenaming && !isOperationInProgress && "cursor-pointer hover:bg-gray-100",
          isSelected && "bg-blue-50 hover:bg-blue-100",
          isOperationInProgress && "opacity-60 cursor-wait"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        whileHover={!isRenaming && !isOperationInProgress ? { x: 2 } : {}}
        transition={{ duration: 0.15 }}
        tabIndex={0}
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

        {isRenaming ? (
          <input
            ref={(el) => {
              if (el) {
                el.focus();
                el.select();
              }
            }}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            className="text-sm px-1 py-0.5 border border-blue-500 rounded flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={cn(
              "text-sm truncate flex-1",
              isSelected ? "text-blue-900 font-medium" : "text-gray-700"
            )}
          >
            {node.name}
          </span>
        )}

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isOperationInProgress && (
            <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
          )}
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
            <FileTreeNodes
              nodes={node.children!}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              operationsInProgress={operationsInProgress}
              onContextMenu={onContextMenu}
              renamingNodeId={renamingNodeId}
              onRename={onRename}
              onFinishRename={onFinishRename}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
