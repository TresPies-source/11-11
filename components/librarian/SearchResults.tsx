"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, AlertCircle } from "lucide-react";
import type { SearchResult } from "@/lib/librarian/search";
import { SearchResultCard } from "./SearchResultCard";
import { cn } from "@/lib/utils";

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  query: string;
  onClearSearch?: () => void;
  className?: string;
}

function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading search results">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className="bg-card rounded-lg border-2 border-border p-5"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-6 h-6 bg-purple-200 dark:bg-purple-800 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
              </div>
            </div>
            <div className="w-16 h-8 bg-purple-200 dark:bg-purple-800 rounded-full animate-pulse" />
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
          </div>
          <div className="flex gap-4">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({ query, onClear }: { query: string; onClear?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-12 text-center"
      role="status"
      aria-label="No search results found"
    >
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
        >
          <Search className="h-20 w-20 text-purple-400 dark:text-purple-500 mx-auto mb-6" aria-hidden="true" />
        </motion.div>
        <h3 className="text-xl font-bold text-foreground mb-2">No matches found</h3>
        <p className="text-muted-foreground mb-1">
          We couldn&apos;t find any prompts similar to:
        </p>
        <p className="text-purple-600 dark:text-purple-400 font-medium italic mb-6">
          &ldquo;{query}&rdquo;
        </p>
        <div className="text-sm text-muted-foreground space-y-2 mb-6">
          <p>Try adjusting your search:</p>
          <ul className="list-disc list-inside space-y-1 text-left max-w-xs mx-auto">
            <li>Use different keywords</li>
            <li>Try broader terms</li>
            <li>Check for typos</li>
            <li>Use semantic concepts instead of exact phrases</li>
          </ul>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="px-6 py-2.5 bg-purple-600 dark:bg-purple-600 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-background"
          >
            Clear search
          </button>
        )}
      </div>
    </motion.div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-2 border-red-200 dark:border-red-800 rounded-xl p-12 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md mx-auto">
        <AlertCircle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-xl font-bold text-foreground mb-2">Search error</h3>
        <p className="text-muted-foreground mb-6">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 bg-red-600 dark:bg-red-600 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-background"
          >
            Try again
          </button>
        )}
      </div>
    </motion.div>
  );
}

function InitialState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="text-center py-16"
    >
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Search className="h-24 w-24 text-purple-300 dark:text-purple-700 mx-auto mb-6" aria-hidden="true" />
      </motion.div>
      <h3 className="text-xl font-semibold text-muted-foreground mb-2">
        Search your prompt library
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Enter a query above to find prompts using semantic search. Our AI will find relevant prompts based on meaning, not just keywords.
      </p>
    </motion.div>
  );
}

export function SearchResults({
  results,
  loading,
  error,
  query,
  onClearSearch,
  className,
}: SearchResultsProps) {
  const hasSearched = query.trim().length > 0;
  const hasResults = results.length > 0;

  return (
    <div className={cn("w-full", className)} role="region" aria-label="Search results">
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center justify-center py-12 mb-8">
              <Loader2 className="h-12 w-12 text-purple-600 dark:text-purple-400 animate-spin mb-3" aria-hidden="true" />
              <p className="text-muted-foreground" role="status">
                Searching your library...
              </p>
            </div>
            <LoadingSkeleton count={3} />
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
            <ErrorState error={error} onRetry={onClearSearch} />
          </motion.div>
        )}

        {!loading && !error && !hasSearched && (
          <motion.div
            key="initial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <InitialState />
          </motion.div>
        )}

        {!loading && !error && hasSearched && !hasResults && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <EmptyState query={query} onClear={onClearSearch} />
          </motion.div>
        )}

        {!loading && !error && hasResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {results.map((result, index) => (
              <SearchResultCard
                key={result.id}
                result={result}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
