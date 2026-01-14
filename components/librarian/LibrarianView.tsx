"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { BookHeart, Sparkles, LibraryBig } from "lucide-react";
import type { PromptStatus } from "@/lib/pglite/types";
import { useLibrarian } from "@/hooks/useLibrarian";
import { usePromptStatus } from "@/hooks/usePromptStatus";
import { useToast } from "@/hooks/useToast";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import { useSuggestions } from "@/hooks/useSuggestions";
import { SeedlingSection } from "./SeedlingSection";
import { GreenhouseSection } from "./GreenhouseSection";
import { SemanticSearchSection } from "./SemanticSearchSection";
import { SuggestionsPanel } from "./SuggestionsPanel";
import { RecentSearches } from "./RecentSearches";
import { LibrarianErrorBoundary } from "./LibrarianErrorBoundary";
import { LibrarianNavigation } from "./LibrarianNavigation";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";

export function LibrarianView() {
  const [savingPromptIds, setSavingPromptIds] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

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
    prompts: activePrompts,
    loading: loadingActive,
    error: errorActive,
    retry: retryActive,
    refresh: refreshActive,
    optimisticRemove: optimisticRemoveActive,
    rollback: rollbackActive,
  } = useLibrarian({ status: "active" });

  const {
    prompts: savedPrompts,
    loading: loadingSaved,
    error: errorSaved,
    retry: retrySaved,
    refresh: refreshSaved,
    optimisticRemove: optimisticRemoveSaved,
  } = useLibrarian({ status: "saved" });

  const { transitionStatus } = usePromptStatus();

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

  const handleSaveToGreenhouse = useCallback(
    async (promptId: string) => {
      const prompt = activePrompts.find((p) => p.id === promptId);
      if (!prompt) return;

      setSavingPromptIds((prev) => new Set(prev).add(promptId));

      try {
        const driveFileId = prompt.drive_file_id || null;
        const success = await transitionStatus(promptId, "saved", driveFileId);

        if (success) {
          optimisticRemoveActive(promptId);
          showSuccess("🌺 Saved to Greenhouse!");
          
          setTimeout(async () => {
            await refreshSaved();
          }, 300);
        } else {
          showError("Failed to save to Greenhouse. Please try again.");
        }
      } catch (err) {
        console.error("Error saving to greenhouse:", err);
        showError("Failed to save to Greenhouse. Please try again.");
      } finally {
        setSavingPromptIds((prev) => {
          const next = new Set(prev);
          next.delete(promptId);
          return next;
        });
      }
    },
    [activePrompts, transitionStatus, optimisticRemoveActive, refreshSaved, showSuccess, showError]
  );

  const handleGreenhouseStatusChange = useCallback(async () => {
    await Promise.all([refreshSaved(), refreshActive()]);
  }, [refreshSaved, refreshActive]);

  const handleSearch = useCallback(async (searchQuery: string) => {
    await search(searchQuery);
  }, [search]);

  const handleClearSearch = useCallback(() => {
    clearResults();
    setQuery("");
  }, [clearResults, setQuery]);

  const handleSeedlingStatusChange = useCallback(
    async (promptId: string, newStatus: PromptStatus) => {
      const prompt = activePrompts.find((p) => p.id === promptId);
      if (!prompt) return;

      try {
        const driveFileId = prompt.drive_file_id || null;
        const success = await transitionStatus(promptId, newStatus, driveFileId);

        if (success) {
          optimisticRemoveActive(promptId);
          
          const statusLabels: Record<PromptStatus, string> = {
            draft: "Draft",
            active: "Active",
            saved: "Greenhouse",
            archived: "Archive"
          };
          showSuccess(`Moved to ${statusLabels[newStatus]}!`);
          
          setTimeout(async () => {
            await Promise.all([refreshActive(), refreshSaved()]);
          }, 300);
        } else {
          showError("Failed to update status. Please try again.");
        }
      } catch (err) {
        console.error("Error updating status:", err);
        showError("Failed to update status. Please try again.");
      }
    },
    [activePrompts, transitionStatus, optimisticRemoveActive, refreshActive, refreshSaved, showSuccess, showError]
  );

  const criticalError = errorActive && errorSaved;

  if (criticalError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-sans font-bold text-text-primary flex items-center gap-3">
            <BookHeart className="h-8 w-8 text-librarian" aria-hidden="true" />
            The Librarian&apos;s Home
          </h1>
          <p className="text-text-secondary mt-2">
            Cultivate your prompts, grow your library
          </p>
        </div>
        <ErrorState
          title="Unable to load The Librarian's Home"
          message={criticalError}
          onRetry={() => {
            retryActive();
            retrySaved();
          }}
          loading={false}
        />
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main" aria-label="The Librarian's Home">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
          className="bg-bg-secondary rounded-lg border border-bg-tertiary p-6 shadow-sm"
          aria-label="Recent searches"
        >
          <RecentSearches
            onSearchClick={handleSearch}
            limit={5}
          />
        </motion.section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
          className="bg-bg-secondary rounded-lg border border-bg-tertiary p-6 shadow-sm"
          aria-label="Active Prompts"
        >
          <LibrarianErrorBoundary
            section="seedling"
            resetKeys={[activePrompts.length]}
          >
            <SeedlingSection
              prompts={activePrompts}
              loading={loadingActive}
              error={errorActive}
              onRetry={retryActive}
              onSaveToGreenhouse={handleSaveToGreenhouse}
              onStatusChange={handleSeedlingStatusChange}
              savingPromptIds={savingPromptIds}
            />
          </LibrarianErrorBoundary>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.225 }}
          className="bg-bg-secondary rounded-lg border border-bg-tertiary p-6 shadow-sm"
          aria-label="Saved Prompts"
        >
          <LibrarianErrorBoundary
            section="greenhouse"
            resetKeys={[savedPrompts.length]}
          >
            <GreenhouseSection
              prompts={savedPrompts}
              loading={loadingSaved}
              error={errorSaved}
              onRetry={retrySaved}
              onRefresh={handleGreenhouseStatusChange}
            />
          </LibrarianErrorBoundary>
        </motion.section>
      </div>
    </main>
  );
}
