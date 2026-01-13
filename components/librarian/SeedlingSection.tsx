"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, ArrowUpDown } from "lucide-react";
import type { PromptWithCritique } from "@/lib/pglite/prompts";
import type { PromptStatus } from "@/lib/pglite/types";
import { SeedlingCard } from "./SeedlingCard";
import { CardErrorBoundary } from "./CardErrorBoundary";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { cn } from "@/lib/utils";

interface SeedlingSectionProps {
  prompts: PromptWithCritique[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSaveToGreenhouse?: (promptId: string) => void;
  onStatusChange?: (promptId: string, newStatus: PromptStatus) => Promise<void>;
  savingPromptIds?: Set<string>;
}

type SortOption = "recent" | "score-asc" | "score-desc";

export function SeedlingSection({
  prompts,
  loading = false,
  error = null,
  onRetry,
  onSaveToGreenhouse,
  onStatusChange,
  savingPromptIds = new Set(),
}: SeedlingSectionProps) {
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [scoreFilter, setScoreFilter] = useState<{ min: number; max: number }>({
    min: 0,
    max: 100,
  });

  const sortedAndFilteredPrompts = useMemo(() => {
    let filtered = prompts.filter((p) => {
      const score = p.latestCritique?.score ?? 0;
      return score >= scoreFilter.min && score <= scoreFilter.max;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case "score-asc":
          return (a.latestCritique?.score ?? 0) - (b.latestCritique?.score ?? 0);
        case "score-desc":
          return (b.latestCritique?.score ?? 0) - (a.latestCritique?.score ?? 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [prompts, sortBy, scoreFilter]);

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sprout className="h-6 w-6 text-green-600 dark:text-green-500" />
            Seedlings
          </h2>
          <p className="text-muted-foreground mt-1">Active prompts in development</p>
        </div>
        <LoadingState count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sprout className="h-6 w-6 text-green-600 dark:text-green-500" />
            Seedlings
          </h2>
          <p className="text-muted-foreground mt-1">Active prompts in development</p>
        </div>
        <ErrorState
          title="Unable to load seedlings"
          message={error}
          onRetry={onRetry || (() => {})}
          loading={loading}
        />
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sprout className="h-6 w-6 text-green-600 dark:text-green-500" />
            Seedlings
          </h2>
          <p className="text-muted-foreground mt-1">Active prompts in development</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border border-green-200 dark:border-green-800 rounded-lg p-12 text-center">
          <Sprout className="h-16 w-16 text-green-400 dark:text-green-600 mx-auto mb-4" />
          <p className="text-foreground font-medium text-lg mb-2">
            No seedlings yet
          </p>
          <p className="text-muted-foreground text-sm">
            Start working on a prompt to see it here
          </p>
        </div>
      </div>
    );
  }

  const scoreRanges = [
    { label: "All", min: 0, max: 100 },
    { label: "Needs Work (0-50)", min: 0, max: 50 },
    { label: "Good (50-75)", min: 50, max: 75 },
    { label: "Excellent (75+)", min: 75, max: 100 },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sprout className="h-6 w-6 text-green-600 dark:text-green-500" />
          Seedlings
        </h2>
        <p className="text-muted-foreground mt-1">
          {prompts.length} active prompt{prompts.length !== 1 ? "s" : ""} in development
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter seedlings by score range">
          <span className="text-sm text-muted-foreground font-medium self-center" id="filter-label">
            Filter:
          </span>
          {scoreRanges.map((range) => {
            const isActive = scoreFilter.min === range.min && scoreFilter.max === range.max;
            return (
              <button
                key={range.label}
                onClick={() => setScoreFilter({ min: range.min, max: range.max })}
                aria-pressed={isActive}
                aria-label={`Filter by ${range.label}`}
                className={cn(
                  "px-3 py-3 min-h-[44px] rounded-md text-xs font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background",
                  isActive
                    ? "bg-green-600 dark:bg-green-600 text-white"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {range.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="seedling-sort" className="sr-only">
            Sort seedlings by
          </label>
          <select
            id="seedling-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Sort seedlings by"
            className="px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-background text-foreground"
          >
            <option value="recent">Recent</option>
            <option value="score-asc">Score (Low to High)</option>
            <option value="score-desc">Score (High to Low)</option>
          </select>
        </div>
      </div>

      {sortedAndFilteredPrompts.length === 0 ? (
        <div className="bg-secondary/50 border border-border rounded-lg p-8 text-center" role="status">
          <p className="text-muted-foreground">
            No seedlings match the selected filters
          </p>
          <button
            onClick={() => setScoreFilter({ min: 0, max: 100 })}
            className="mt-3 text-sm text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 font-medium focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background rounded-md px-2 py-1"
            aria-label="Clear all filters"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          layout
          role="list"
          aria-label={`${sortedAndFilteredPrompts.length} seedling prompt${sortedAndFilteredPrompts.length !== 1 ? "s" : ""}`}
        >
          <AnimatePresence mode="popLayout">
            {sortedAndFilteredPrompts.map((prompt) => (
              <CardErrorBoundary key={prompt.id} cardType="seedling">
                <SeedlingCard
                  prompt={prompt}
                  onSaveToGreenhouse={onSaveToGreenhouse}
                  onStatusChange={onStatusChange}
                  isSaving={savingPromptIds.has(prompt.id)}
                />
              </CardErrorBoundary>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
