'use client';

import { useState, useCallback } from 'react';
import type { SyncOperation, SyncStatusState } from '@/lib/types';

const MAX_OPERATIONS = 5;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatusState>({
    operations: [],
    lastSync: null,
    isError: false,
    currentOperation: null,
  });

  const addOperation = useCallback((operation: Omit<SyncOperation, 'id' | 'timestamp'>) => {
    const newOperation: SyncOperation = {
      ...operation,
      id: generateId(),
      timestamp: new Date(),
    };

    setStatus((prev) => {
      const operations = [newOperation, ...prev.operations].slice(0, MAX_OPERATIONS);
      const isError = operations.some((op) => op.status === 'error');
      const currentOperation = newOperation.status === 'pending' ? newOperation : null;
      const lastSync = newOperation.status === 'success' ? newOperation.timestamp : prev.lastSync;

      return {
        operations,
        lastSync,
        isError,
        currentOperation,
      };
    });
  }, []);

  const retryLastFailed = useCallback(async () => {
    setStatus((prev) => {
      const lastFailedOp = prev.operations.find((op) => op.status === 'error');
      
      if (!lastFailedOp) {
        return prev;
      }

      const newOperation: SyncOperation = {
        type: lastFailedOp.type,
        status: 'pending',
        fileId: lastFailedOp.fileId,
        fileName: lastFailedOp.fileName,
        id: generateId(),
        timestamp: new Date(),
      };

      const operations = [newOperation, ...prev.operations].slice(0, MAX_OPERATIONS);
      
      return {
        ...prev,
        operations,
        currentOperation: newOperation,
      };
    });
  }, []);

  const clearOperations = useCallback(() => {
    setStatus({
      operations: [],
      lastSync: null,
      isError: false,
      currentOperation: null,
    });
  }, []);

  return {
    status,
    addOperation,
    retryLastFailed,
    clearOperations,
  };
}
