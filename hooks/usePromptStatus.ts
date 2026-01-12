'use client';

import { useState, useCallback, useRef } from 'react';
import { updatePromptStatus } from '@/lib/pglite/prompts';
import matter from 'gray-matter';
import type { PromptStatus } from '@/lib/types';

interface UsePromptStatusReturn {
  transitioning: boolean;
  error: string | null;
  transitionStatus: (promptId: string, newStatus: PromptStatus, driveFileId: string | null) => Promise<boolean>;
}

export function usePromptStatus(): UsePromptStatusReturn {
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateDriveMetadata = useCallback(async (
    driveFileId: string,
    newStatus: PromptStatus
  ): Promise<void> => {
    try {
      const contentResponse = await fetch(`/api/drive/content/${driveFileId}`);
      if (!contentResponse.ok) {
        throw new Error('Failed to fetch file content from Drive');
      }

      const { content } = await contentResponse.json();
      
      const { data: frontmatter, content: markdownContent } = matter(content);
      
      const updatedFrontmatter = {
        ...frontmatter,
        status: newStatus,
      };

      const updatedContent = matter.stringify(markdownContent, updatedFrontmatter);

      const updateResponse = await fetch(`/api/drive/content/${driveFileId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: updatedContent }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update file in Drive');
      }
    } catch (err) {
      console.error('[usePromptStatus] Error updating Drive metadata:', err);
      throw err;
    }
  }, []);

  const transitionStatus = useCallback(async (
    promptId: string,
    newStatus: PromptStatus,
    driveFileId: string | null
  ): Promise<boolean> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setTransitioning(true);
      setError(null);

      await updatePromptStatus(promptId, newStatus);

      if (driveFileId) {
        try {
          await updateDriveMetadata(driveFileId, newStatus);
        } catch (driveError) {
          console.warn('[usePromptStatus] Failed to update Drive metadata, but PGlite update succeeded:', driveError);
        }
      }

      if (controller.signal.aborted) {
        return false;
      }

      return true;
    } catch (err) {
      if (controller.signal.aborted) {
        return false;
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to update prompt status';
      setError(errorMessage);
      console.error('[usePromptStatus] Error transitioning status:', err);
      
      return false;
    } finally {
      if (!controller.signal.aborted) {
        setTransitioning(false);
      }
      
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [updateDriveMetadata]);

  return {
    transitioning,
    error,
    transitionStatus,
  };
}
