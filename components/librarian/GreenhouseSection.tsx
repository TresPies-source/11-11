"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flower2, ArrowUpDown, Tag } from "lucide-react";
import type { PromptWithCritique } from "@/lib/pglite/prompts";
import { GreenhouseCard } from "./GreenhouseCard";
import { CardErrorBoundary } from "./CardErrorBoundary";
import { SearchInput } from "@/components/shared/SearchInput";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { cn } from "@/lib/utils";

interface GreenhouseSectionProps {
  prompts: PromptWithCritique[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRefresh?: () => void;
}

type SortOption = "recent" | "title-asc" | "score-desc";

export function GreenhouseSection({
  prompts,
  loading = false,
  error = null,
  onRetry,
  onRefresh,
}: GreenhouseSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    prompts.forEach((p) => {
      p.metadata?.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [prompts]);

  const filteredAndSortedPrompts = useMemo(() => {
    let filtered = prompts;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => {
        const titleMatch = p.title.toLowerCase().includes(query);
        const descMatch = p.metadata?.description?.toLowerCase().includes(query);
        const tagMatch = p.metadata?.tags?.some((tag) =>
          tag.toLowerCase().includes(query)
        );
        const contentMatch = p.content.toLowerCase().includes(query);
        return titleMatch || descMatch || tagMatch || contentMatch;
      });
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((p) => {
        const promptTags = p.metadata?.tags || [];
        return selectedTags.every((tag) => promptTags.includes(tag));
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "score-desc":
          return (b.latestCritique?.score ?? 0) - (a.latestCritique?.score ?? 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [prompts, searchQuery, selectedTags, sortBy]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Flower2 className="h-6 w-6 text-librarian" />
            Saved Prompts
          </h2>
          <p className="text-text-secondary mt-1">Your curated prompt library</p>
        </div>
        <LoadingState count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Flower2 className="h-6 w-6 text-librarian" />
            Saved Prompts
          </h2>
          <p className="text-text-secondary mt-1">Your curated prompt library</p>
        </div>
        <ErrorState
          title="Unable to load saved prompts"
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
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Flower2 className="h-6 w-6 text-librarian" />
            Saved Prompts
          </h2>
          <p className="text-text-secondary mt-1">Your curated prompt library</p>
        </div>
        <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-12 text-center">
          <Flower2 className="h-16 w-16 text-librarian mx-auto mb-4" />
          <p className="text-text-primary font-medium text-lg mb-2">
            Your saved prompts library is empty
          </p>
          <p className="text-text-secondary text-sm">
            Save prompts from your active prompts to build your library
          </p>
          <p className="text-text-tertiary text-xs mt-3 italic">
            Cultivate your best work and watch your prompt garden flourish 🌱
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Flower2 className="h-6 w-6 text-librarian" />
          Saved Prompts
        </h2>
        <p className="text-text-secondary mt-1">
          {prompts.length} saved prompt{prompts.length !== 1 ? "s" : ""} in your library
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search prompts by title, description, tags, or content..."
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <ArrowUpDown className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
            <label htmlFor="greenhouse-sort" className="sr-only">
              Sort saved prompts by
            </label>
            <select
              id="greenhouse-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort saved prompts by"
              className="px-3 py-2 text-sm border border-bg-tertiary rounded-md focus:outline-none focus:ring-2 focus:ring-text-accent focus:border-transparent bg-bg-secondary text-text-primary"
            >
              <option value="recent">Recent</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="score-desc">Score (High to Low)</option>
            </select>
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center" role="group" aria-label="Filter by tags">
            <Tag className="h-4 w-4 text-text-tertiary flex-shrink-0" aria-hidden="true" />
            <span className="text-sm text-text-tertiary font-medium" id="tags-label">Tags:</span>
            {allTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  aria-pressed={isSelected}
                  aria-label={`Filter by tag: ${tag}`}
                  className={cn(
                    "px-3 py-3 min-h-[44px] rounded-full text-xs font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-2",
                    isSelected
                      ? "bg-librarian text-white ring-2 ring-text-accent"
                      : "bg-bg-tertiary text-text-secondary hover:bg-bg-elevated"
                  )}
                >
                  {tag}
                </button>
              );
            })}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                aria-label={`Clear ${selectedTags.length} selected tag filter${selectedTags.length !== 1 ? "s" : ""}`}
                className="text-xs text-librarian hover:text-text-accent font-medium underline ml-2 focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-2 rounded-sm px-1"
              >
                Clear tags
              </button>
            )}
          </div>
        )}
      </div>

      {filteredAndSortedPrompts.length === 0 ? (
        <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-8 text-center" role="status">
          <p className="text-text-secondary mb-2">
            No prompts match your search or filters
          </p>
          <div className="flex gap-3 justify-center">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search query"
                className="text-sm text-librarian hover:text-text-accent font-medium focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-2 rounded-md px-2 py-1"
              >
                Clear search
              </button>
            )}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                aria-label={`Clear ${selectedTags.length} tag filter${selectedTags.length !== 1 ? "s" : ""}`}
                className="text-sm text-librarian hover:text-text-accent font-medium focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-2 rounded-md px-2 py-1"
              >
                Clear tag filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          layout
          role="list"
          aria-label={`${filteredAndSortedPrompts.length} saved prompt${filteredAndSortedPrompts.length !== 1 ? "s" : ""}`}
        >
          <AnimatePresence mode="popLayout">
            {filteredAndSortedPrompts.map((prompt) => (
              <CardErrorBoundary key={prompt.id} cardType="greenhouse">
                <GreenhouseCard
                  prompt={prompt}
                  searchQuery={searchQuery}
                  onStatusChange={onRefresh}
                />
              </CardErrorBoundary>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
