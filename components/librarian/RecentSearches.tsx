"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Search, TrendingUp, Loader2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentSearch {
  id: string;
  query: string;
  results_count: number;
  filters: Record<string, any>;
  created_at: string;
}

interface RecentSearchesProps {
  onSearchClick?: (query: string) => void;
  className?: string;
  limit?: number;
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}w ago`;
  }
  const months = Math.floor(diffDays / 30);
  return `${months}mo ago`;
}

function SearchHistoryCard({
  search,
  index,
  onSearchClick,
}: {
  search: RecentSearch;
  index: number;
  onSearchClick?: (query: string) => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      layout
      onClick={() => onSearchClick?.(search.query)}
      className={cn(
        "group w-full text-left rounded-lg border-2 border-border p-3.5",
        "bg-card hover:bg-accent/50 transition-all duration-200",
        "hover:shadow-md hover:scale-[1.01]",
        "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-background"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Search className="h-4 w-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {search.query}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
              {search.results_count} {search.results_count === 1 ? 'result' : 'results'}
            </span>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {formatTimeAgo(search.created_at)}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2.5" role="status" aria-label="Loading recent searches">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className="bg-card rounded-lg border-2 border-border p-3.5"
        >
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 bg-purple-200 dark:bg-purple-800 rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-lg p-6 text-center"
      role="alert"
    >
      <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400 mx-auto mb-2" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-foreground mb-1">Failed to load search history</h3>
      <p className="text-xs text-muted-foreground mb-3">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-background"
        >
          Try again
        </button>
      )}
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center"
    >
      <Clock className="h-10 w-10 text-blue-400 dark:text-blue-500 mx-auto mb-2" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-foreground mb-1">No search history</h3>
      <p className="text-xs text-muted-foreground">
        Your recent searches will appear here
      </p>
    </motion.div>
  );
}

export function RecentSearches({
  onSearchClick,
  className,
  limit = 5,
}: RecentSearchesProps) {
  const [searches, setSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentSearches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/librarian/search/history?limit=${limit}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to load search history' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSearches(data.history || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while loading search history';
      setError(errorMessage);
      setSearches([]);
      console.error('Recent searches error:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchRecentSearches();
  }, [fetchRecentSearches]);

  const hasSearches = searches.length > 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <h2 className="text-lg font-bold text-foreground">Recent searches</h2>
        </div>
        {!loading && hasSearches && (
          <button
            onClick={fetchRecentSearches}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium focus:outline-none focus:underline"
            aria-label="Refresh search history"
          >
            Refresh
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LoadingState />
          </motion.div>
        )}

        {!loading && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ErrorState error={error} onRetry={fetchRecentSearches} />
          </motion.div>
        )}

        {!loading && !error && !hasSearches && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <EmptyState />
          </motion.div>
        )}

        {!loading && !error && hasSearches && (
          <motion.div
            key="searches"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2.5"
          >
            <AnimatePresence mode="popLayout">
              {searches.map((search, index) => (
                <SearchHistoryCard
                  key={search.id}
                  search={search}
                  index={index}
                  onSearchClick={onSearchClick}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
