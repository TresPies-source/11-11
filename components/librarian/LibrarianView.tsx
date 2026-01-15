"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { LibraryBig } from "lucide-react";
import { useLibrarian } from "@/hooks/useLibrarian";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import { useSuggestions } from "@/hooks/useSuggestions";
import { SemanticSearchSection } from "./SemanticSearchSection";
import { SuggestionsPanel } from "./SuggestionsPanel";
import { RecentSearches } from "./RecentSearches";
import { LibrarianNavigation } from "./LibrarianNavigation";
import { PageHeader } from "@/components/shared/PageHeader";

export function LibrarianView() {
  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    query,
    count: searchCount,
    duration: searchDuration,
    setQuery,
    search,
    clearResults,
  } = useSemanticSearch({ autoSearch: false });

  const {
    prompts: savedPrompts,
  } = useLibrarian({ status: "saved" });

  const {
    suggestions,
    loading: suggestionsLoading,
    error: suggestionsError,
    refresh: refreshSuggestions,
    dismiss: dismissSuggestion,
  } = useSuggestions({
    trigger: 'page_load',
    limit: 6,
    autoLoad: true,
  });

  const handleSearch = useCallback(async (searchQuery: string) => {
    await search(searchQuery);
  }, [search]);

  const handleClearSearch = useCallback(() => {
    clearResults();
    setQuery("");
  }, [clearResults, setQuery]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8" role="main" aria-label="The Librarian's Home">
      <PageHeader
        title="Librarian"
        subtitle="Search, discover, and manage your collective intelligence."
        icon={LibraryBig}
        iconClassName="text-librarian"
      />

      <LibrarianNavigation savedPromptsCount={savedPrompts.length} />

      <SemanticSearchSection
        query={query}
        setQuery={setQuery}
        onSearch={handleSearch}
        searchLoading={searchLoading}
        searchError={searchError}
        searchResults={searchResults}
        searchCount={searchCount}
        searchDuration={searchDuration}
        onClearSearch={handleClearSearch}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          aria-label="Suggestions"
        >
          <SuggestionsPanel
            suggestions={suggestions}
            loading={suggestionsLoading}
            error={suggestionsError}
            onDismiss={dismissSuggestion}
            onRefresh={refreshSuggestions}
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.175 }}
          className="bg-bg-secondary rounded-lg border border-bg-tertiary p-4 sm:p-6 shadow-sm"
          aria-label="Recent searches"
        >
          <RecentSearches
            onSearchClick={handleSearch}
            limit={5}
          />
        </motion.section>
      </div>
    </main>
  );
}
