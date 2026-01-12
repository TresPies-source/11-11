'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPromptsByStatus, searchPrompts, type PromptWithCritique, type PromptFilters } from '@/lib/supabase/prompts';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { PromptStatus, PromptFile, DriveFile } from '@/lib/types';
import matter from 'gray-matter';

interface UseLibrarianOptions {
  status?: PromptStatus;
  filters?: PromptFilters;
  enableDriveFallback?: boolean;
}

interface UseLibrarianReturn {
  prompts: PromptWithCritique[];
  loading: boolean;
  error: string | null;
  retry: () => void;
  refresh: () => Promise<void>;
  optimisticUpdate: (promptId: string, updates: Partial<PromptWithCritique>) => void;
  optimisticRemove: (promptId: string) => void;
  rollback: () => void;
}

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

async function fetchPromptsFromDrive(status?: PromptStatus): Promise<PromptWithCritique[]> {
  try {
    const filesResponse = await fetch('/api/drive/files?folder=prompts');
    if (!filesResponse.ok) {
      throw new Error('Failed to fetch prompts from Drive');
    }

    const { files } = await filesResponse.json();
    
    const promptsWithContent = await Promise.all(
      files.map(async (file: DriveFile) => {
        try {
          const contentResponse = await fetch(`/api/drive/content/${file.id}`);
          if (!contentResponse.ok) {
            console.warn(`Failed to fetch content for ${file.name}`);
            return null;
          }

          const { content } = await contentResponse.json();
          const { data: metadata, content: rawContent } = matter(content);

          const promptStatus = (metadata.status as PromptStatus) || 'draft';
          
          if (status && promptStatus !== status) {
            return null;
          }

          return {
            id: file.id,
            user_id: 'drive-user',
            title: metadata.title || file.name.replace(/\.md$/, ''),
            content: rawContent,
            status: promptStatus,
            drive_file_id: file.id,
            created_at: file.modifiedTime,
            updated_at: file.modifiedTime,
            latestCritique: null,
            metadata: {
              description: metadata.description || null,
              tags: metadata.tags || null,
              is_public: metadata.public || false,
              author: metadata.author || null,
              version: metadata.version || null,
            },
          } as PromptWithCritique;
        } catch (err) {
          console.error(`Error processing ${file.name}:`, err);
          return null;
        }
      })
    );

    return promptsWithContent.filter((p): p is PromptWithCritique => p !== null);
  } catch (error) {
    console.error('Error fetching prompts from Drive:', error);
    throw error;
  }
}

export function useLibrarian(options: UseLibrarianOptions = {}): UseLibrarianReturn {
  const { status, filters, enableDriveFallback = true } = options;
  
  const [prompts, setPrompts] = useState<PromptWithCritique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [promptsSnapshot, setPromptsSnapshot] = useState<PromptWithCritique[] | null>(null);

  const retry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const useSupabase = isSupabaseConfigured() || isDevMode;

      if (useSupabase && status) {
        const data = await getPromptsByStatus('current-user', status);
        
        if (filters && Object.keys(filters).length > 0) {
          let filteredData = [...data];

          if (filters.tags && filters.tags.length > 0) {
            filteredData = filteredData.filter(
              p => p.metadata?.tags?.some(tag => filters.tags?.includes(tag))
            );
          }

          if (filters.minScore !== undefined) {
            filteredData = filteredData.filter(
              p => (p.latestCritique?.score || 0) >= filters.minScore!
            );
          }

          if (filters.maxScore !== undefined) {
            filteredData = filteredData.filter(
              p => (p.latestCritique?.score || 0) <= filters.maxScore!
            );
          }

          setPrompts(filteredData);
        } else {
          setPrompts(data);
        }
      } else if (useSupabase && filters?.searchQuery) {
        const data = await searchPrompts('current-user', filters.searchQuery, filters);
        
        if (status) {
          setPrompts(data.filter(p => p.status === status));
        } else {
          setPrompts(data);
        }
      } else if (enableDriveFallback) {
        const data = await fetchPromptsFromDrive(status);
        setPrompts(data);
      } else {
        setPrompts([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prompts';
      setError(errorMessage);
      console.error('Error in useLibrarian:', err);
      
      if (enableDriveFallback && isSupabaseConfigured()) {
        try {
          console.log('Falling back to Drive...');
          const data = await fetchPromptsFromDrive(status);
          setPrompts(data);
          setError(null);
        } catch (fallbackErr) {
          console.error('Drive fallback also failed:', fallbackErr);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [status, filters, enableDriveFallback, retryCount]);

  const refresh = useCallback(async () => {
    await fetchPrompts();
  }, [fetchPrompts]);

  const optimisticUpdate = useCallback((promptId: string, updates: Partial<PromptWithCritique>) => {
    setPromptsSnapshot(prompts);
    setPrompts((prev) =>
      prev.map((p) => (p.id === promptId ? { ...p, ...updates } : p))
    );
  }, [prompts]);

  const optimisticRemove = useCallback((promptId: string) => {
    setPromptsSnapshot(prompts);
    setPrompts((prev) => prev.filter((p) => p.id !== promptId));
  }, [prompts]);

  const rollback = useCallback(() => {
    if (promptsSnapshot) {
      setPrompts(promptsSnapshot);
      setPromptsSnapshot(null);
    }
  }, [promptsSnapshot]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  return {
    prompts,
    loading,
    error,
    retry,
    refresh,
    optimisticUpdate,
    optimisticRemove,
    rollback,
  };
}
