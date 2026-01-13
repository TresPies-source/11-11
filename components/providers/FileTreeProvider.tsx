"use client";

import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from "react";
import { FileNode, DriveFile } from "@/lib/types";
import { mockFileTree } from "@/data/mockFileTree";
import { isDevelopmentMode } from "@/lib/constants";

export interface FileTreeContextValue {
  fileTree: FileNode[];
  expandedIds: Set<string>;
  selectedId: string | undefined;
  operationsInProgress: Set<string>;
  isLoading: boolean;
  error: string | null;
  
  setSelectedId: (id: string | undefined) => void;
  toggleExpand: (id: string) => void;
  refreshFileTree: () => Promise<void>;
  
  addNode: (parentId: string, node: FileNode) => void;
  updateNode: (id: string, updates: Partial<FileNode>) => void;
  removeNode: (id: string) => void;
  
  startOperation: (id: string) => void;
  endOperation: (id: string) => void;
}

export const FileTreeContext = createContext<FileTreeContextValue | undefined>(undefined);

function findNodeById(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function updateNodeInTree(nodes: FileNode[], id: string, updates: Partial<FileNode>): FileNode[] {
  return nodes.map(node => {
    if (node.id === id) {
      return { ...node, ...updates };
    }
    if (node.children) {
      return {
        ...node,
        children: updateNodeInTree(node.children, id, updates),
      };
    }
    return node;
  });
}

function addNodeToTree(nodes: FileNode[], parentId: string, newNode: FileNode): FileNode[] {
  return nodes.map(node => {
    if (node.id === parentId) {
      const children = node.children || [];
      return {
        ...node,
        children: [...children, newNode].sort((a, b) => {
          if (a.type === b.type) {
            return a.name.localeCompare(b.name);
          }
          return a.type === "folder" ? -1 : 1;
        }),
      };
    }
    if (node.children) {
      return {
        ...node,
        children: addNodeToTree(node.children, parentId, newNode),
      };
    }
    return node;
  });
}

function removeNodeFromTree(nodes: FileNode[], id: string): FileNode[] {
  return nodes
    .filter(node => node.id !== id)
    .map(node => {
      if (node.children) {
        return {
          ...node,
          children: removeNodeFromTree(node.children, id),
        };
      }
      return node;
    });
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

interface FileTreeProviderProps {
  children: ReactNode;
}

export function FileTreeProvider({ children }: FileTreeProviderProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>(mockFileTree);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(["00_roadmap", "05_logs"])
  );
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [operationsInProgress, setOperationsInProgress] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshFileTree = useCallback(async () => {
    if (isDevelopmentMode()) {
      console.log("[FileTreeProvider] Running in dev mode - using mock file tree");
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
        console.warn("[FileTreeProvider] Invalid response format, using mock data");
        setFileTree(mockFileTree);
      }
    } catch (err) {
      console.error("[FileTreeProvider] Error loading files:", err);
      setError(err instanceof Error ? err.message : "Failed to load files");
      setFileTree(mockFileTree);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFileTree();
  }, [refreshFileTree]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const addNode = useCallback((parentId: string, node: FileNode) => {
    setFileTree((prev) => addNodeToTree(prev, parentId, node));
    
    setExpandedIds((prev) => new Set(prev).add(parentId));
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<FileNode>) => {
    setFileTree((prev) => updateNodeInTree(prev, id, updates));
  }, []);

  const removeNode = useCallback((id: string) => {
    setFileTree((prev) => removeNodeFromTree(prev, id));
    
    setSelectedId((prev) => prev === id ? undefined : prev);
  }, []);

  const startOperation = useCallback((id: string) => {
    setOperationsInProgress((prev) => new Set(prev).add(id));
  }, []);

  const endOperation = useCallback((id: string) => {
    setOperationsInProgress((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const value: FileTreeContextValue = {
    fileTree,
    expandedIds,
    selectedId,
    operationsInProgress,
    isLoading,
    error,
    setSelectedId,
    toggleExpand,
    refreshFileTree,
    addNode,
    updateNode,
    removeNode,
    startOperation,
    endOperation,
  };

  return (
    <FileTreeContext.Provider value={value}>
      {children}
    </FileTreeContext.Provider>
  );
}
