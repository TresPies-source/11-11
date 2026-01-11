'use client';

import { useState, useEffect } from 'react';
import matter from 'gray-matter';
import type { PromptFile, DriveFile } from '@/lib/types';

interface UseLibraryReturn {
  prompts: PromptFile[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useLibrary(): UseLibraryReturn {
  const [prompts, setPrompts] = useState<PromptFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = () => setRetryCount((prev) => prev + 1);

  useEffect(() => {
    async function fetchPrompts() {
      try {
        setLoading(true);
        setError(null);

        const filesResponse = await fetch('/api/drive/files?folder=prompts');
        if (!filesResponse.ok) {
          throw new Error('Failed to fetch prompts');
        }

        const { files } = await filesResponse.json();
        
        const promptsWithContent = await Promise.all(
          files.map(async (file: DriveFile) => {
            try {
              const contentResponse = await fetch(`/api/drive/content/${file.id}`);
              if (!contentResponse.ok) {
                console.warn(`Failed to fetch content for ${file.name}`);
                return {
                  ...file,
                  rawContent: '',
                  metadata: {},
                };
              }

              const { content } = await contentResponse.json();
              const { data, content: rawContent } = matter(content);

              return {
                ...file,
                metadata: data,
                rawContent,
              } as PromptFile;
            } catch (err) {
              console.error(`Error processing ${file.name}:`, err);
              return {
                ...file,
                rawContent: '',
                metadata: {},
              } as PromptFile;
            }
          })
        );

        setPrompts(promptsWithContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching prompts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPrompts();
  }, [retryCount]);

  return {
    prompts,
    loading,
    error,
    retry,
  };
}
