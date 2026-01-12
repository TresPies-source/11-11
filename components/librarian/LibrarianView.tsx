"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { BookHeart, Sparkles } from "lucide-react";
import { useLibrarian } from "@/hooks/useLibrarian";
import { usePromptStatus } from "@/hooks/usePromptStatus";
import { useToast } from "@/hooks/useToast";
import { SeedlingSection } from "./SeedlingSection";
import { GreenhouseSection } from "./GreenhouseSection";
import { LibrarianErrorBoundary } from "./LibrarianErrorBoundary";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";

export function LibrarianView() {
  const [savingPromptIds, setSavingPromptIds] = useState<Set<string>>(new Set());
  const { success: showSuccess, error: showError } = useToast();

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
  } = useLibrarian({ status: "saved" });

  const { transitionStatus } = usePromptStatus();

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

  const loading = loadingActive && loadingSaved;
  const error = errorActive || errorSaved;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookHeart className="h-8 w-8 text-pink-600" />
            The Librarian&apos;s Home
          </h1>
          <p className="text-gray-600 mt-2">
            Cultivate your prompts, grow your library
          </p>
        </div>
        <LoadingState count={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookHeart className="h-8 w-8 text-pink-600" />
            The Librarian&apos;s Home
          </h1>
          <p className="text-gray-600 mt-2">
            Cultivate your prompts, grow your library
          </p>
        </div>
        <ErrorState
          title="Unable to load The Librarian's Home"
          message={error}
          onRetry={() => {
            if (errorActive) retryActive();
            if (errorSaved) retrySaved();
          }}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main" aria-label="The Librarian's Home">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BookHeart className="h-8 w-8 text-pink-600" aria-hidden="true" />
          The Librarian&apos;s Home
        </h1>
        <p className="text-gray-600 mt-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" aria-hidden="true" />
          Cultivate your prompts, grow your library, and watch your ideas flourish
        </p>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
          aria-label="Seedlings - Active prompts"
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
              savingPromptIds={savingPromptIds}
            />
          </LibrarianErrorBoundary>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
          aria-label="Greenhouse - Saved prompts"
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
            />
          </LibrarianErrorBoundary>
        </motion.section>
      </div>
    </main>
  );
}
