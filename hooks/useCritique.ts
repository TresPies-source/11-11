'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from './useDebounce';
import { critiquePromptSync } from '@/lib/critique/engine';
import { saveCritique, getLatestCritique } from '@/lib/pglite/critiques';
import type { CritiqueResult } from '@/lib/types';

interface UseCritiqueOptions {
  debounceMs?: number;
  immediate?: boolean;
  enableCaching?: boolean;
}

interface UseCritiqueReturn {
  critique: CritiqueResult | null;
  loading: boolean;
  error: string | null;
  recalculate: () => void;
}

export function useCritique(
  content: string,
  promptId: string | null,
  options: UseCritiqueOptions = {}
): UseCritiqueReturn {
  const {
    debounceMs = 500,
    immediate = false,
    enableCaching = true,
  } = options;

  const [critique, setCritique] = useState<CritiqueResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forceRecalculate, setForceRecalculate] = useState(0);

  const debouncedContent = useDebounce(content, debounceMs);
  const contentToUse = immediate ? content : debouncedContent;

  const lastCalculatedContent = useRef<string>('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const calculateCritique = useCallback(
    async (currentContent: string) => {
      if (!currentContent.trim()) {
        setCritique(null);
        setLoading(false);
        setError(null);
        return;
      }

      if (currentContent === lastCalculatedContent.current && critique !== null) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (enableCaching && promptId) {
          const cached = await getLatestCritique(promptId);
          if (cached && isMountedRef.current) {
            setCritique(cached);
            lastCalculatedContent.current = currentContent;
            setLoading(false);
            return;
          }
        }

        const result = critiquePromptSync(currentContent);

        if (!isMountedRef.current) return;

        const critiqueResult: Omit<CritiqueResult, 'id' | 'promptId' | 'createdAt'> = {
          score: result.score,
          concisenessScore: result.concisenessScore,
          specificityScore: result.specificityScore,
          contextScore: result.contextScore,
          taskDecompositionScore: result.taskDecompositionScore,
          feedback: result.feedback,
        };

        if (enableCaching && promptId) {
          const saved = await saveCritique(promptId, critiqueResult);
          if (saved && isMountedRef.current) {
            setCritique(saved);
          } else if (isMountedRef.current) {
            setCritique({
              id: 'local-' + Date.now(),
              promptId: promptId,
              ...critiqueResult,
              createdAt: new Date().toISOString(),
            });
          }
        } else if (isMountedRef.current) {
          setCritique({
            id: 'local-' + Date.now(),
            promptId: promptId || 'unknown',
            ...critiqueResult,
            createdAt: new Date().toISOString(),
          });
        }

        lastCalculatedContent.current = currentContent;
      } catch (err) {
        if (!isMountedRef.current) return;
        const errorMessage = err instanceof Error ? err.message : 'Failed to calculate critique';
        setError(errorMessage);
        console.error('[useCritique] Error calculating critique:', err);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [promptId, enableCaching, critique]
  );

  useEffect(() => {
    calculateCritique(contentToUse);
  }, [contentToUse, forceRecalculate, calculateCritique]);

  const recalculate = useCallback(() => {
    lastCalculatedContent.current = '';
    setForceRecalculate((prev) => prev + 1);
  }, []);

  return {
    critique,
    loading,
    error,
    recalculate,
  };
}
