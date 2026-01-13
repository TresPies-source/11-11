"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BookHeart, Sparkles, Leaf, Globe, ArrowRight } from "lucide-react";
import type { PromptStatus } from "@/lib/pglite/types";
import { useLibrarian } from "@/hooks/useLibrarian";
import { usePromptStatus } from "@/hooks/usePromptStatus";
import { useToast } from "@/hooks/useToast";
import { SeedlingSection } from "./SeedlingSection";
import { GreenhouseSection } from "./GreenhouseSection";
import { LibrarianErrorBoundary } from "./LibrarianErrorBoundary";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { cn } from "@/lib/utils";

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
    optimisticRemove: optimisticRemoveSaved,
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

  const handleGreenhouseStatusChange = useCallback(async () => {
    await Promise.all([refreshSaved(), refreshActive()]);
  }, [refreshSaved, refreshActive]);

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

      <motion.nav
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
        aria-label="Librarian navigation"
      >
        <Link
          href="/librarian/greenhouse"
          className={cn(
            "group relative overflow-hidden rounded-lg border-2 border-green-200",
            "bg-gradient-to-br from-green-50 to-emerald-50",
            "p-6 transition-all duration-300",
            "hover:border-green-300 hover:shadow-lg hover:scale-[1.02]",
            "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                <Leaf className="h-6 w-6 text-green-600" />
                My Greenhouse
              </h2>
              <p className="text-gray-600 text-sm">
                Your cultivated prompts ready to bloom
              </p>
              <p className="text-green-700 font-medium text-sm mt-2">
                {savedPrompts.length} {savedPrompts.length === 1 ? 'prompt' : 'prompts'} saved
              </p>
            </div>
            <ArrowRight className="h-6 w-6 text-green-600 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          href="/librarian/commons"
          className={cn(
            "group relative overflow-hidden rounded-lg border-2 border-blue-200",
            "bg-gradient-to-br from-blue-50 to-indigo-50",
            "p-6 transition-all duration-300",
            "hover:border-blue-300 hover:shadow-lg hover:scale-[1.02]",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                <Globe className="h-6 w-6 text-blue-600" />
                The Global Commons
              </h2>
              <p className="text-gray-600 text-sm">
                Discover prompts shared by the community
              </p>
              <p className="text-blue-700 font-medium text-sm mt-2">
                Explore public prompts
              </p>
            </div>
            <ArrowRight className="h-6 w-6 text-blue-600 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </Link>
      </motion.nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
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
              onStatusChange={handleSeedlingStatusChange}
              savingPromptIds={savingPromptIds}
            />
          </LibrarianErrorBoundary>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
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
              onRefresh={handleGreenhouseStatusChange}
            />
          </LibrarianErrorBoundary>
        </motion.section>
      </div>
    </main>
  );
}
