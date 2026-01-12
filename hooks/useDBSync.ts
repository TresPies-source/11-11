'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { syncDriveFile } from '@/lib/pglite/prompts';
import type { DriveFile } from '@/lib/types';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  totalFiles: number;
  syncedFiles: number;
  failedFiles: number;
  errors: string[];
}

export interface UseDBSyncOptions {
  userId: string;
  autoSyncInterval?: number;
  syncOnMount?: boolean;
}

export interface UseDBSyncReturn {
  syncStatus: SyncStatus;
  triggerSync: () => Promise<void>;
  isSyncing: boolean;
}

const DEFAULT_AUTO_SYNC_INTERVAL = 5 * 60 * 1000;
const LAST_SYNC_KEY = 'librarian_last_sync_time';

export function useDBSync(options: UseDBSyncOptions): UseDBSyncReturn {
  const { 
    userId, 
    autoSyncInterval = DEFAULT_AUTO_SYNC_INTERVAL,
    syncOnMount = true 
  } = options;

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncTime: null,
    totalFiles: 0,
    syncedFiles: 0,
    failedFiles: 0,
    errors: [],
  });

  const autoSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);

  const getLastSyncTime = useCallback((): Date | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const lastSync = localStorage.getItem(LAST_SYNC_KEY);
      return lastSync ? new Date(lastSync) : null;
    } catch {
      return null;
    }
  }, []);

  const setLastSyncTime = useCallback((time: Date) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(LAST_SYNC_KEY, time.toISOString());
    } catch (err) {
      console.error('Failed to save last sync time:', err);
    }
  }, []);

  const shouldSync = useCallback((): boolean => {
    const lastSync = getLastSyncTime();
    if (!lastSync) return true;
    
    const timeSinceLastSync = Date.now() - lastSync.getTime();
    return timeSinceLastSync >= autoSyncInterval;
  }, [getLastSyncTime, autoSyncInterval]);

  const performSync = useCallback(async (): Promise<void> => {
    if (isSyncingRef.current) {
      console.log('[Sync] Already syncing, skipping...');
      return;
    }

    isSyncingRef.current = true;
    setSyncStatus(prev => ({
      ...prev,
      isSyncing: true,
      totalFiles: 0,
      syncedFiles: 0,
      failedFiles: 0,
      errors: [],
    }));

    try {
      const filesResponse = await fetch('/api/drive/files?folder=prompts');
      if (!filesResponse.ok) {
        throw new Error('Failed to fetch prompts from Drive');
      }

      const { files }: { files: DriveFile[] } = await filesResponse.json();
      
      setSyncStatus(prev => ({
        ...prev,
        totalFiles: files.length,
      }));

      const errors: string[] = [];
      let syncedCount = 0;
      let failedCount = 0;

      for (const file of files) {
        try {
          const contentResponse = await fetch(`/api/drive/content/${file.id}`);
          if (!contentResponse.ok) {
            throw new Error(`Failed to fetch content for ${file.name}`);
          }

          const { content } = await contentResponse.json();
          
          const driveFileWithContent = { ...file, content };
          await syncDriveFile(userId, driveFileWithContent);
          syncedCount++;

          setSyncStatus(prev => ({
            ...prev,
            syncedFiles: syncedCount,
          }));
        } catch (err) {
          failedCount++;
          const errorMsg = `Failed to sync ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg, err);

          setSyncStatus(prev => ({
            ...prev,
            failedFiles: failedCount,
            errors: [...prev.errors, errorMsg],
          }));
        }
      }

      const now = new Date();
      setLastSyncTime(now);

      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: now,
      }));

      console.log(`[Sync] Complete: ${syncedCount}/${files.length} prompts synced, ${failedCount} failed`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown sync error';
      console.error('[Sync] Error:', err);

      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        errors: [...prev.errors, errorMsg],
      }));
    } finally {
      isSyncingRef.current = false;
    }
  }, [userId, setLastSyncTime]);

  const triggerSync = useCallback(async (): Promise<void> => {
    console.log('[Sync] Manual sync triggered');
    await performSync();
  }, [performSync]);

  useEffect(() => {
    const lastSync = getLastSyncTime();
    if (lastSync) {
      setSyncStatus(prev => ({
        ...prev,
        lastSyncTime: lastSync,
      }));
    }

    if (syncOnMount && shouldSync()) {
      console.log('[Sync] Initial sync on mount');
      performSync();
    }
  }, []);

  useEffect(() => {
    if (autoSyncInterval <= 0) return;

    autoSyncIntervalRef.current = setInterval(() => {
      if (shouldSync()) {
        console.log('[Sync] Auto-sync triggered');
        performSync();
      }
    }, autoSyncInterval);

    return () => {
      if (autoSyncIntervalRef.current) {
        clearInterval(autoSyncIntervalRef.current);
      }
    };
  }, [autoSyncInterval, shouldSync, performSync]);

  return {
    syncStatus,
    triggerSync,
    isSyncing: syncStatus.isSyncing,
  };
}
