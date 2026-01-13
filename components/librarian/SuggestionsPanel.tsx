"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  FileText, 
  Clock, 
  Leaf, 
  X, 
  Loader2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { Suggestion } from "@/lib/librarian/suggestions";
import { cn } from "@/lib/utils";

interface SuggestionsPanelProps {
  suggestions: Suggestion[];
  loading?: boolean;
  error?: string | null;
  onDismiss?: (targetId: string) => void;
  onRefresh?: () => void;
  className?: string;
}

function getSuggestionIcon(type: Suggestion['type']) {
  switch (type) {
    case 'similar_prompt':
      return FileText;
    case 'recent_work':
      return Clock;
    case 'related_seed':
      return Leaf;
    default:
      return FileText;
  }
}

function getSuggestionColor(type: Suggestion['type']) {
  switch (type) {
    case 'similar_prompt':
      return {
        bg: 'bg-purple-50 dark:bg-purple-950/30',
        border: 'border-purple-200 dark:border-purple-800',
        icon: 'text-purple-600 dark:text-purple-400',
        badge: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
      };
    case 'recent_work':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
      };
    case 'related_seed':
      return {
        bg: 'bg-green-50 dark:bg-green-950/30',
        border: 'border-green-200 dark:border-green-800',
        icon: 'text-green-600 dark:text-green-400',
        badge: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
      };
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-950/30',
        border: 'border-gray-200 dark:border-gray-800',
        icon: 'text-gray-600 dark:text-gray-400',
        badge: 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300',
      };
  }
}

function SuggestionCard({ 
  suggestion, 
  index, 
  onDismiss 
}: { 
  suggestion: Suggestion; 
  index: number; 
  onDismiss?: (targetId: string) => void;
}) {
  const Icon = getSuggestionIcon(suggestion.type);
  const colors = getSuggestionColor(suggestion.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      layout
    >
      <Link
        href={`/editor/${suggestion.target_id}`}
        className={cn(
          "group relative block rounded-lg border-2 p-4 transition-all duration-200",
          "hover:shadow-md hover:scale-[1.02]",
          "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-background",
          colors.bg,
          colors.border
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Icon className={cn("h-5 w-5", colors.icon)} aria-hidden="true" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {suggestion.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {suggestion.description}
            </p>

            {suggestion.metadata?.tags && suggestion.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {suggestion.metadata.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      colors.badge
                    )}
                  >
                    {tag}
                  </span>
                ))}
                {suggestion.metadata.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{suggestion.metadata.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <ChevronRight className={cn(
              "h-5 w-5 transition-transform duration-200",
              "group-hover:translate-x-1",
              colors.icon
            )} />
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDismiss(suggestion.target_id);
            }}
            className={cn(
              "absolute -top-2 -right-2 p-1.5 rounded-full shadow-sm",
              "bg-white dark:bg-gray-800 border-2",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500",
              colors.border
            )}
            aria-label="Dismiss suggestion"
          >
            <X className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </Link>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading suggestions">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className="bg-card rounded-lg border-2 border-border p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-purple-200 dark:bg-purple-800 rounded animate-pulse" />
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
      <AlertCircle className="h-10 w-10 text-red-500 dark:text-red-400 mx-auto mb-3" aria-hidden="true" />
      <h3 className="font-semibold text-foreground mb-1">Failed to load suggestions</h3>
      <p className="text-sm text-muted-foreground mb-4">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-background"
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
      className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-8 text-center"
    >
      <Sparkles className="h-12 w-12 text-purple-400 dark:text-purple-500 mx-auto mb-3" aria-hidden="true" />
      <h3 className="font-semibold text-foreground mb-1">No suggestions yet</h3>
      <p className="text-sm text-muted-foreground">
        Start creating prompts to see personalized suggestions
      </p>
    </motion.div>
  );
}

export function SuggestionsPanel({
  suggestions,
  loading = false,
  error = null,
  onDismiss,
  onRefresh,
  className,
}: SuggestionsPanelProps) {
  const hasSuggestions = suggestions.length > 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
          <h2 className="text-lg font-bold text-foreground">Suggested for you</h2>
        </div>
        {onRefresh && !loading && (
          <button
            onClick={onRefresh}
            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors font-medium focus:outline-none focus:underline"
            aria-label="Refresh suggestions"
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
            <ErrorState error={error} onRetry={onRefresh} />
          </motion.div>
        )}

        {!loading && !error && !hasSuggestions && (
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

        {!loading && !error && hasSuggestions && (
          <motion.div
            key="suggestions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {suggestions.map((suggestion, index) => (
                <SuggestionCard
                  key={suggestion.target_id}
                  suggestion={suggestion}
                  index={index}
                  onDismiss={onDismiss}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
