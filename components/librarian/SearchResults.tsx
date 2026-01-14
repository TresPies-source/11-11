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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="status" aria-label="Loading search results">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.05 }}
          className="bg-bg-secondary rounded-lg border border-bg-tertiary p-5"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-6 h-6 bg-bg-tertiary rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-bg-tertiary rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-bg-tertiary rounded w-full animate-pulse" />
              </div>
            </div>
            <div className="w-16 h-8 bg-bg-tertiary rounded-full animate-pulse" />
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-bg-tertiary rounded w-full animate-pulse" />
            <div className="h-4 bg-bg-tertiary rounded w-5/6 animate-pulse" />
          </div>
          <div className="flex gap-4">
            <div className="h-3 bg-bg-tertiary rounded w-20 animate-pulse" />
            <div className="h-3 bg-bg-tertiary rounded w-24 animate-pulse" />
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
      transition={{ duration: 0.2 }}
      className="bg-bg-secondary border border-bg-tertiary rounded-xl p-12 text-center"
      role="status"
      aria-label="No search results found"
    >
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
        >
          <Search className="h-20 w-20 text-librarian mx-auto mb-6" aria-hidden="true" />
        </motion.div>
        <h3 className="text-xl font-bold text-text-primary mb-2">No matches found</h3>
        <p className="text-text-secondary mb-1">
          We couldn&apos;t find any prompts similar to:
        </p>
        <p className="text-librarian font-medium italic mb-6">
          &ldquo;{query}&rdquo;
        </p>
        <div className="text-sm text-text-secondary space-y-2 mb-6">
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
            className="px-6 py-2.5 bg-supervisor text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-supervisor focus:ring-offset-2"
            aria-label="Clear search and start over"
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
      transition={{ duration: 0.2 }}
      className="bg-bg-secondary border border-error rounded-xl p-12 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md mx-auto">
        <AlertCircle className="h-16 w-16 text-error mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-xl font-bold text-text-primary mb-2">Search error</h3>
        <p className="text-text-secondary mb-6">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 bg-error text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2"
            aria-label="Retry search"
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
        <Search className="h-24 w-24 text-librarian mx-auto mb-6" aria-hidden="true" />
      </motion.div>
      <h3 className="text-xl font-semibold text-text-secondary mb-2">
        Search your prompt library
      </h3>
      <p className="text-sm text-text-tertiary max-w-md mx-auto">
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
              <Loader2 className="h-12 w-12 text-librarian animate-spin mb-3" aria-hidden="true" />
              <p className="text-text-secondary" role="status">
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
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
