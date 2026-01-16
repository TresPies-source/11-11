'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getFeedArtifacts } from '@/lib/hub/feed-queries';
import type { FeedArtifact, FeedFilters } from '@/lib/hub/types';

const DEV_USER_ID = 'dev@11-11.dev';
const DEFAULT_PAGE_SIZE = 20;

interface UseFeedOptions {
  filters: FeedFilters;
  enabled?: boolean;
  pageSize?: number;
}

interface UseFeedReturn {
  artifacts: FeedArtifact[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => void;
  total: number;
}

export function useFeed(options: UseFeedOptions): UseFeedReturn {
  const { filters, enabled = true, pageSize = DEFAULT_PAGE_SIZE } = options;
  const [artifacts, setArtifacts] = useState<FeedArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  
  const isLoadingRef = useRef(false);

  const refetch = useCallback(() => {
    setCurrentPage(1);
    setArtifacts([]);
    setRetryCount((prev) => prev + 1);
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoadingMore(true);
      setError(null);

      const nextPage = currentPage + 1;
      const response = await getFeedArtifacts(
        DEV_USER_ID,
        filters,
        { page: nextPage, limit: pageSize }
      );

      setArtifacts((prev) => [...prev, ...response.artifacts]);
      setHasMore(response.pagination.hasMore);
      setTotal(response.pagination.total);
      setCurrentPage(nextPage);

      console.log(`[useFeed] Loaded page ${nextPage}, total artifacts: ${artifacts.length + response.artifacts.length}/${response.pagination.total}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more artifacts';
      setError(errorMessage);
      console.error('[useFeed] Error loading more:', err);
    } finally {
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [hasMore, currentPage, filters, pageSize, artifacts.length]);

  useEffect(() => {
    if (!enabled) {
      setArtifacts([]);
      setLoading(false);
      setError(null);
      setHasMore(false);
      setTotal(0);
      return;
    }

    async function fetchInitialFeed() {
      try {
        isLoadingRef.current = true;
        setLoading(true);
        setError(null);

        const response = await getFeedArtifacts(
          DEV_USER_ID,
          filters,
          { page: 1, limit: pageSize }
        );

        setArtifacts(response.artifacts);
        setHasMore(response.pagination.hasMore);
        setTotal(response.pagination.total);
        setCurrentPage(1);

        console.log(`[useFeed] Initial load: ${response.artifacts.length}/${response.pagination.total} artifacts`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch feed';
        setError(errorMessage);
        console.error('[useFeed] Error fetching initial feed:', err);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    }

    fetchInitialFeed();
  }, [
    enabled,
    filters.types.join(','),
    filters.dateFrom,
    filters.dateTo,
    filters.search,
    pageSize,
    retryCount,
  ]);

  return {
    artifacts,
    loading: loading || loadingMore,
    error,
    hasMore,
    loadMore,
    refetch,
    total,
  };
}
