"use client";

import { useState } from "react";
import { Globe, Filter, ArrowUpDown } from "lucide-react";
import { ArtifactGridView } from "@/components/artifacts/ArtifactGridView";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { Button } from "@/components/ui/Button";
import { useDebounce } from "@/hooks/useDebounce";

type FilterOption = "all" | "mine";
type SortOption = "recent" | "score";

export default function CommonsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [sort, setSort] = useState<SortOption>("recent");
  const debouncedSearch = useDebounce(searchTerm, 300);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main" aria-label="Global Commons">
      <PageHeader
        title="The Global Commons"
        subtitle="Discover prompts shared by the community"
        icon={Globe}
        iconClassName="text-blue-500"
      />

      <div className="mb-6 space-y-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search prompts by title, content, or author..."
          aria-label="Search public prompts"
        />

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2" role="group" aria-label="Filter public prompts">
            <Filter className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
            <span className="text-sm font-medium text-text-secondary" id="filter-label-commons">Filter:</span>
            <div className="flex gap-2" aria-labelledby="filter-label-commons">
              <Button
                onClick={() => setFilter("all")}
                variant={filter === "all" ? "default" : "ghost"}
                size="sm"
                aria-label="Show all public prompts"
                aria-pressed={filter === "all"}
              >
                All Public
              </Button>
              <Button
                onClick={() => setFilter("mine")}
                variant={filter === "mine" ? "default" : "ghost"}
                size="sm"
                aria-label="Show only my public prompts"
                aria-pressed={filter === "mine"}
              >
                My Public
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2" role="group" aria-label="Sort public prompts">
            <ArrowUpDown className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
            <span className="text-sm font-medium text-text-secondary" id="sort-label-commons">Sort:</span>
            <div className="flex gap-2" aria-labelledby="sort-label-commons">
              <Button
                onClick={() => setSort("recent")}
                variant={sort === "recent" ? "default" : "ghost"}
                size="sm"
                aria-label="Sort by most recent"
                aria-pressed={sort === "recent"}
              >
                Recent
              </Button>
              <Button
                onClick={() => setSort("score")}
                variant={sort === "score" ? "default" : "ghost"}
                size="sm"
                aria-label="Sort by highest score"
                aria-pressed={sort === "score"}
              >
                Highest Score
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ArtifactGridView
        filters={{
          types: ["prompt"],
          visibility: ["public"],
          search: debouncedSearch,
          dateFrom: null,
          dateTo: null,
        }}
        emptyState={{
          title: "No public prompts yet",
          message: "Be the first to share! Mark your prompts as public: true in frontmatter",
        }}
      />
    </main>
  );
}
