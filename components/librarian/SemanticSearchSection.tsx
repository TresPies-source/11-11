"use client";

import { motion } from "framer-motion";
import { Search as SearchIcon } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { SearchResults } from "./SearchResults";

interface SemanticSearchSectionProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: (query: string) => void;
  searchLoading: boolean;
  searchError: string | null;
  searchResults: any[];
  searchCount: number;
  searchDuration: number;
  onClearSearch: () => void;
}

export function SemanticSearchSection({
  query,
  setQuery,
  onSearch,
  searchLoading,
  searchError,
  searchResults,
  searchCount,
  searchDuration,
  onClearSearch,
}: SemanticSearchSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      className="mb-8"
      aria-label="Semantic search"
    >
      <div className="bg-bg-secondary rounded-xl border-2 border-bg-tertiary p-6">
        <div className="flex items-center gap-3 mb-4">
          <SearchIcon className="h-6 w-6 text-librarian" aria-hidden="true" />
          <h2 className="text-xl font-sans font-bold text-text-primary">Semantic Search</h2>
        </div>
        <p className="text-text-secondary mb-6 text-sm">
          Search your library using AI-powered semantic matching. Find prompts based on meaning, not just keywords.
        </p>

        <SearchBar
          value={query}
          onChange={setQuery}
          onSearch={onSearch}
          loading={searchLoading}
          resultCount={searchCount > 0 ? searchCount : undefined}
          searchDuration={searchDuration > 0 ? searchDuration : undefined}
        />

        <div className="mt-6">
          <SearchResults
            results={searchResults}
            loading={searchLoading}
            error={searchError}
            query={query}
            onClearSearch={onClearSearch}
          />
        </div>
      </div>
    </motion.section>
  );
}
