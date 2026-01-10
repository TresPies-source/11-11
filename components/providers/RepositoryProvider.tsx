"use client";

import { createContext, useContext, ReactNode, useState, useCallback } from "react";
import { FileNode, SyncStatusState } from "@/lib/types";
import { useContextBus } from "@/hooks/useContextBus";
import { useSyncStatus } from "@/hooks/useSyncStatus";

export interface RepositoryContextValue {
  activeFile: FileNode | null;
  fileContent: string;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  syncStatus: SyncStatusState;
  
  setActiveFile: (file: FileNode | null) => void;
  setFileContent: (content: string) => void;
  saveFile: () => Promise<void>;
  discardChanges: () => void;
  retrySave: () => Promise<void>;
}

export const RepositoryContext = createContext<RepositoryContextValue | undefined>(undefined);

interface RepositoryProviderProps {
  children: ReactNode;
}

export function RepositoryProvider({ children }: RepositoryProviderProps) {
  const [activeFile, setActiveFileState] = useState<FileNode | null>(null);
  const [fileContent, setFileContentState] = useState<string>("");
  const [savedContent, setSavedContent] = useState<string>("");
  const [rollbackContent, setRollbackContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { emit } = useContextBus();
  const { status: syncStatus, addOperation } = useSyncStatus();
  const isDirty = fileContent !== savedContent;

  const setActiveFile = useCallback(async (file: FileNode | null) => {
    setActiveFileState(file);
    setFileContentState("");
    setSavedContent("");
    setError(null);
    setLastSaved(null);

    if (!file || file.type !== "file") {
      return;
    }

    setIsLoading(true);
    setError(null);

    addOperation({
      type: 'fetch',
      status: 'pending',
      fileId: file.id,
      fileName: file.name,
    });

    try {
      const response = await fetch(`/api/drive/content/${file.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content || "";
      
      setFileContentState(content);
      setSavedContent(content);

      addOperation({
        type: 'fetch',
        status: 'success',
        fileId: file.id,
        fileName: file.name,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load file";
      setError(errorMessage);
      setFileContentState("");
      setSavedContent("");

      addOperation({
        type: 'fetch',
        status: 'error',
        fileId: file.id,
        fileName: file.name,
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [addOperation]);

  const setFileContent = useCallback((content: string) => {
    setFileContentState(content);
  }, []);

  const saveFile = useCallback(async () => {
    if (!activeFile || !isDirty) {
      return;
    }

    setIsSaving(true);
    setError(null);

    setRollbackContent(savedContent);
    setSavedContent(fileContent);

    addOperation({
      type: 'save',
      status: 'pending',
      fileId: activeFile.id,
      fileName: activeFile.name,
    });

    try {
      const response = await fetch(`/api/drive/content/${activeFile.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: fileContent }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save file: ${response.statusText}`);
      }
      
      const now = new Date();
      setRollbackContent("");
      setLastSaved(now);

      addOperation({
        type: 'save',
        status: 'success',
        fileId: activeFile.id,
        fileName: activeFile.name,
      });

      if (activeFile.name === "task_plan.md") {
        console.log(`[ContextBus] Emitting PLAN_UPDATED event for ${activeFile.name} at ${now.toISOString()}`);
        emit('PLAN_UPDATED', {
          content: fileContent,
          timestamp: now
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save file";
      setError(errorMessage);
      setSavedContent(rollbackContent);

      addOperation({
        type: 'save',
        status: 'error',
        fileId: activeFile.id,
        fileName: activeFile.name,
        error: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  }, [activeFile, fileContent, isDirty, emit, addOperation, savedContent, rollbackContent]);

  const discardChanges = useCallback(() => {
    setFileContentState(savedContent);
    setError(null);
  }, [savedContent]);

  const retrySave = useCallback(async () => {
    if (!activeFile || !error) return;
    setError(null);
    await saveFile();
  }, [activeFile, error, saveFile]);

  const value: RepositoryContextValue = {
    activeFile,
    fileContent,
    isDirty,
    isLoading,
    isSaving,
    lastSaved,
    error,
    syncStatus,
    setActiveFile,
    setFileContent,
    saveFile,
    discardChanges,
    retrySave,
  };

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
}
