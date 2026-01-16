"use client";

import { useState, useMemo } from "react";
import { Sprout, ArrowUpDown, Tag } from "lucide-react";
import { ArtifactGridView } from "@/components/artifacts/ArtifactGridView";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { useLibrarian } from "@/hooks/useLibrarian";

type SortOption = "recent" | "title-asc" | "score-desc";

export default function GreenhousePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { prompts } = useLibrarian({
    status: "saved",
    enableDriveFallback: true,
  });

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    prompts.forEach((p) => {
      p.metadata?.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [prompts]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main" aria-label="Saved Prompts Library">
      <PageHeader
        title="My Saved Prompts"
        subtitle="Your cultivated prompts ready to bloom"
        icon={Sprout}
        iconClassName="text-green-500"
      />

      <ArtifactGridView
        filters={{
          types: ["prompt"],
          status: ["saved"],
          search: debouncedSearch,
          dateFrom: null,
          dateTo: null,
        }}
        emptyState={{
          title: "Your saved prompts library is empty",
          message: "Save prompts from your active prompts to build your library",
        }}
        header={
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
        }
      />
    </main>
  );
}
