"use client";

import { useState, useCallback, useContext } from "react";
import { FileNode } from "@/lib/types";
import { FileTreeContext } from "@/components/providers/FileTreeProvider";
import { useSyncStatusContext } from "@/components/providers/SyncStatusProvider";
import { useContextBus } from "@/hooks/useContextBus";
import { useToast } from "@/hooks/useToast";

interface FileOperationError {
  message: string;
  code?: string;
  retry?: () => Promise<unknown>;
}

export function useFileOperations() {
  const fileTreeContext = useContext(FileTreeContext);
  const { addOperation } = useSyncStatusContext();
  const { emit } = useContextBus();
  const toast = useToast();

  const [loadingOperations, setLoadingOperations] = useState<Set<string>>(new Set());
  const [operationErrors, setOperationErrors] = useState<Map<string, FileOperationError>>(new Map());

  if (!fileTreeContext) {
    throw new Error("useFileOperations must be used within FileTreeProvider");
  }

  const {
    addNode,
    updateNode,
    removeNode,
    refreshFileTree,
    startOperation,
    endOperation,
  } = fileTreeContext;

  const setLoading = useCallback((operationId: string, loading: boolean) => {
    setLoadingOperations((prev) => {
      const next = new Set(prev);
      if (loading) {
        next.add(operationId);
      } else {
        next.delete(operationId);
      }
      return next;
    });
  }, []);

  const setError = useCallback((operationId: string, error: FileOperationError | null) => {
    setOperationErrors((prev) => {
      const next = new Map(prev);
      if (error) {
        next.set(operationId, error);
      } else {
        next.delete(operationId);
      }
      return next;
    });
  }, []);

  const createFile = useCallback(
    async (parentNode: FileNode, name: string): Promise<FileNode | null> => {
      const operationId = `create-file-${Date.now()}`;
      const tempId = `temp-file-${Date.now()}`;

      const newNode: FileNode = {
        id: tempId,
        name,
        type: "file",
        path: `${parentNode.path}/${name}`,
        source: "google-drive",
      };

      setLoading(operationId, true);
      setError(operationId, null);
      startOperation(parentNode.id);

      addOperation({
        type: "write",
        status: "pending",
        fileName: name,
      });

      addNode(parentNode.id, newNode);

      try {
        const response = await fetch("/api/drive/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            type: "file",
            folderId: parentNode.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create file: ${response.statusText}`);
        }

        const data = await response.json();
        const createdFile = data.file;

        updateNode(tempId, {
          id: createdFile.id,
          modified: createdFile.modifiedTime ? new Date(createdFile.modifiedTime) : undefined,
        });

        await refreshFileTree();

        addOperation({
          type: "write",
          status: "success",
          fileId: createdFile.id,
          fileName: name,
        });

        toast.success(`File "${name}" created`);
        
        return {
          id: createdFile.id,
          name,
          type: "file",
          path: `${parentNode.path}/${name}`,
          source: "google-drive",
          modified: createdFile.modifiedTime ? new Date(createdFile.modifiedTime) : undefined,
        };
      } catch (error) {
        removeNode(tempId);

        const errorMessage = error instanceof Error ? error.message : "Failed to create file";
        
        addOperation({
          type: "write",
          status: "error",
          fileName: name,
          error: errorMessage,
        });

        const retryFn = () => createFile(parentNode, name);
        setError(operationId, {
          message: errorMessage,
          retry: retryFn,
        });

        toast.error(errorMessage);

        return null;
      } finally {
        setLoading(operationId, false);
        endOperation(parentNode.id);
      }
    },
    [addNode, updateNode, removeNode, refreshFileTree, startOperation, endOperation, addOperation, toast, setLoading, setError]
  );

  const createFolder = useCallback(
    async (parentNode: FileNode, name: string): Promise<FileNode | null> => {
      const operationId = `create-folder-${Date.now()}`;
      const tempId = `temp-folder-${Date.now()}`;

      const newNode: FileNode = {
        id: tempId,
        name,
        type: "folder",
        path: `${parentNode.path}/${name}`,
        source: "google-drive",
        children: [],
      };

      setLoading(operationId, true);
      setError(operationId, null);
      startOperation(parentNode.id);

      addOperation({
        type: "write",
        status: "pending",
        fileName: name,
      });

      addNode(parentNode.id, newNode);

      try {
        const response = await fetch("/api/drive/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            type: "folder",
            folderId: parentNode.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create folder: ${response.statusText}`);
        }

        const data = await response.json();
        const createdFolder = data.file;

        updateNode(tempId, {
          id: createdFolder.id,
          modified: createdFolder.modifiedTime ? new Date(createdFolder.modifiedTime) : undefined,
        });

        await refreshFileTree();

        addOperation({
          type: "write",
          status: "success",
          fileId: createdFolder.id,
          fileName: name,
        });

        toast.success(`Folder "${name}" created`);

        return {
          id: createdFolder.id,
          name,
          type: "folder",
          path: `${parentNode.path}/${name}`,
          source: "google-drive",
          modified: createdFolder.modifiedTime ? new Date(createdFolder.modifiedTime) : undefined,
          children: [],
        };
      } catch (error) {
        removeNode(tempId);

        const errorMessage = error instanceof Error ? error.message : "Failed to create folder";

        addOperation({
          type: "write",
          status: "error",
          fileName: name,
          error: errorMessage,
        });

        const retryFn = () => createFolder(parentNode, name);
        setError(operationId, {
          message: errorMessage,
          retry: retryFn,
        });

        toast.error(errorMessage);

        return null;
      } finally {
        setLoading(operationId, false);
        endOperation(parentNode.id);
      }
    },
    [addNode, updateNode, removeNode, refreshFileTree, startOperation, endOperation, addOperation, toast, setLoading, setError]
  );

  const renameFile = useCallback(
    async (node: FileNode, newName: string): Promise<boolean> => {
      const operationId = `rename-${node.id}`;
      const previousName = node.name;

      setLoading(operationId, true);
      setError(operationId, null);
      startOperation(node.id);

      addOperation({
        type: "write",
        status: "pending",
        fileId: node.id,
        fileName: newName,
      });

      updateNode(node.id, { name: newName });

      try {
        const response = await fetch("/api/drive/rename", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId: node.id,
            newName,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to rename: ${response.statusText}`);
        }

        await refreshFileTree();

        addOperation({
          type: "write",
          status: "success",
          fileId: node.id,
          fileName: newName,
        });

        emit("FILE_RENAMED", {
          fileId: node.id,
          oldName: previousName,
          newName,
        });

        toast.success(`Renamed to "${newName}"`);

        return true;
      } catch (error) {
        updateNode(node.id, { name: previousName });

        const errorMessage = error instanceof Error ? error.message : "Failed to rename";

        addOperation({
          type: "write",
          status: "error",
          fileId: node.id,
          fileName: newName,
          error: errorMessage,
        });

        const retryFn = () => renameFile(node, newName);
        setError(operationId, {
          message: errorMessage,
          retry: retryFn,
        });

        toast.error(errorMessage);

        return false;
      } finally {
        setLoading(operationId, false);
        endOperation(node.id);
      }
    },
    [updateNode, refreshFileTree, startOperation, endOperation, addOperation, emit, toast, setLoading, setError]
  );

  const deleteFile = useCallback(
    async (node: FileNode): Promise<boolean> => {
      const operationId = `delete-${node.id}`;

      setLoading(operationId, true);
      setError(operationId, null);
      startOperation(node.id);

      addOperation({
        type: "write",
        status: "pending",
        fileId: node.id,
        fileName: node.name,
      });

      const previousState = node;
      removeNode(node.id);

      try {
        const response = await fetch("/api/drive/delete", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId: node.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete: ${response.statusText}`);
        }

        await refreshFileTree();

        addOperation({
          type: "write",
          status: "success",
          fileId: node.id,
          fileName: node.name,
        });

        emit("FILE_DELETED", {
          fileId: node.id,
          fileName: node.name,
        });

        toast.success(`"${node.name}" moved to trash`);

        return true;
      } catch (error) {
        const pathParts = previousState.path.split("/");
        const parentPath = pathParts.slice(0, -1).join("/");
        
        if (parentPath) {
          const parentId = previousState.path.split("/").slice(-2, -1)[0] || "root";
          addNode(parentId, previousState);
        }

        const errorMessage = error instanceof Error ? error.message : "Failed to delete";

        addOperation({
          type: "write",
          status: "error",
          fileId: node.id,
          fileName: node.name,
          error: errorMessage,
        });

        const retryFn = () => deleteFile(node);
        setError(operationId, {
          message: errorMessage,
          retry: retryFn,
        });

        toast.error(errorMessage);

        return false;
      } finally {
        setLoading(operationId, false);
        endOperation(node.id);
      }
    },
    [removeNode, addNode, refreshFileTree, startOperation, endOperation, addOperation, emit, toast, setLoading, setError]
  );

  return {
    createFile,
    createFolder,
    renameFile,
    deleteFile,
    isLoading: (operationId: string) => loadingOperations.has(operationId),
    getError: (operationId: string) => operationErrors.get(operationId),
  };
}
