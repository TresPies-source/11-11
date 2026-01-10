"use client";

import { createContext, useContext, ReactNode, useEffect } from "react";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import type { SyncOperation, SyncStatusState } from "@/lib/types";

export interface SyncStatusContextValue {
  status: SyncStatusState;
  addOperation: (operation: Omit<SyncOperation, 'id' | 'timestamp'>) => void;
  retryLastFailed: () => Promise<void>;
  clearOperations: () => void;
}

export const SyncStatusContext = createContext<SyncStatusContextValue | null>(null);

interface SyncStatusProviderProps {
  children: ReactNode;
}

export function SyncStatusProvider({ children }: SyncStatusProviderProps) {
  const { status, addOperation, retryLastFailed, clearOperations } = useSyncStatus();

  useEffect(() => {
    console.log('[SyncStatus] Shared context initialized');
  }, []);

  const contextValue: SyncStatusContextValue = {
    status,
    addOperation,
    retryLastFailed,
    clearOperations,
  };

  return (
    <SyncStatusContext.Provider value={contextValue}>
      {children}
    </SyncStatusContext.Provider>
  );
}

export function useSyncStatusContext() {
  const context = useContext(SyncStatusContext);
  
  if (!context) {
    throw new Error("useSyncStatusContext must be used within SyncStatusProvider");
  }
  
  return context;
}
