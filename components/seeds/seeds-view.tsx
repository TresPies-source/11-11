"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Search, Plus, AlertCircle } from "lucide-react";
import { useSeeds } from "@/hooks/useSeeds";
import { useDebounce } from "@/hooks/useDebounce";
import type { SeedRow, SeedFilters, SeedStatus } from "@/lib/seeds/types";
import { SeedCard } from "./seed-card";
import { SeedFiltersPanel } from "./filters-panel";
import { SeedDetailView } from "./seed-detail-view";
import { PlantSeedModal } from "./plant-seed-modal";
import { insertSeed, updateSeed, deleteSeed } from "@/lib/pglite/seeds";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function SeedsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedSeed, setSelectedSeed] = useState<SeedRow | null>(null);
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const filters: SeedFilters = {
    search: debouncedSearch,
    type: typeFilters.length > 0 ? (typeFilters as any) : undefined,
    status: statusFilters.length > 0 ? (statusFilters as any) : undefined,
  };

  const { seeds, loading, error, refetch } = useSeeds({ filters });

  const handleFiltersChange = useCallback((newFilters: SeedFilters) => {
    setTypeFilters(newFilters.type || []);
    setStatusFilters(newFilters.status || []);
  }, []);

  const handleViewSeed = useCallback((seed: SeedRow) => {
    setSelectedSeed(seed);
    setViewMode("detail");
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode("list");
    setTimeout(() => setSelectedSeed(null), 300);
  }, []);

  const handleUpdateStatus = useCallback(
    async (seed: SeedRow, status: SeedStatus) => {
      if (seed.status === status) return;

      setIsUpdating(true);
      setErrorMessage(null);

      try {
        const result = await updateSeed(seed.id, { status });

        if (result) {
          await refetch();
          if (selectedSeed?.id === seed.id) {
            setSelectedSeed(result);
          }
        } else {
          setErrorMessage("Failed to update seed status");
        }
      } catch (err) {
        console.error("[SEEDS_VIEW] Error updating seed:", err);
        setErrorMessage("Failed to update seed status. Please try again.");
      } finally {
        setIsUpdating(false);
      }
    },
    [refetch, selectedSeed]
  );

  const handleUpdateStatusFromDetail = useCallback(
    async (status: SeedStatus) => {
      if (!selectedSeed) return;
      await handleUpdateStatus(selectedSeed, status);
    },
    [selectedSeed, handleUpdateStatus]
  );

  const handleDeleteSeed = useCallback(
    async (seed: SeedRow) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${seed.name}"? This action cannot be undone.`
      );

      if (!confirmed) return;

      setIsUpdating(true);
      setErrorMessage(null);

      try {
        const success = await deleteSeed(seed.id);

        if (success) {
          await refetch();
          if (selectedSeed?.id === seed.id) {
            handleBackToList();
          }
        } else {
          setErrorMessage("Failed to delete seed");
        }
      } catch (err) {
        console.error("[SEEDS_VIEW] Error deleting seed:", err);
        setErrorMessage("Failed to delete seed. Please try again.");
      } finally {
        setIsUpdating(false);
      }
    },
    [refetch, selectedSeed, handleBackToList]
  );

  const handleDeleteFromDetail = useCallback(async () => {
    if (!selectedSeed) return;
    await handleDeleteSeed(selectedSeed);
  }, [selectedSeed, handleDeleteSeed]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary flex items-center gap-2 sm:gap-3">
              <Leaf className="h-6 w-6 sm:h-8 sm:w-8 text-success" />
              Seed Library
            </h1>
            <p className="text-sm sm:text-base text-text-secondary mt-1.5 sm:mt-2">
              Manage your knowledge seeds through Keep, Grow, Compost, and Replant
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsPlantModalOpen(true)}
            className="flex-shrink-0 w-full sm:w-auto"
          >
            <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
            Plant New Seed
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-4 h-48 lg:h-96 animate-pulse" />
          </aside>

          <main className="flex-1">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-bg-tertiary/30 rounded-lg w-full max-w-md"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 bg-bg-tertiary/30 rounded-lg"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary flex items-center gap-2 sm:gap-3">
              <Leaf className="h-6 w-6 sm:h-8 sm:w-8 text-success" />
              Seed Library
            </h1>
            <p className="text-sm sm:text-base text-text-secondary mt-1.5 sm:mt-2">
              Manage your knowledge seeds through Keep, Grow, Compost, and Replant
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsPlantModalOpen(true)}
            className="flex-shrink-0 w-full sm:w-auto"
          >
            <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
            Plant New Seed
          </Button>
        </div>

        <div className="bg-error/10 border border-error/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Unable to load seeds
              </h3>
              <p className="text-text-secondary mb-4">{error}</p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveFilters =
    debouncedSearch || typeFilters.length > 0 || statusFilters.length > 0;
  const isEmpty = seeds.length === 0;

  if (viewMode === "detail" && selectedSeed) {
    return (
      <AnimatePresence mode="wait">
        <SeedDetailView
          seed={selectedSeed}
          onBack={handleBackToList}
          onUpdate={handleUpdateStatusFromDetail}
          onDelete={handleDeleteFromDetail}
        />
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="list-view"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 md:p-8 lg:p-12"
      >
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary flex items-center gap-2 sm:gap-3">
              <Leaf className="h-6 w-6 sm:h-8 sm:w-8 text-success" />
              Seed Library
            </h1>
            <p className="text-sm sm:text-base text-text-secondary mt-1.5 sm:mt-2">
              Manage your knowledge seeds through Keep, Grow, Compost, and Replant
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsPlantModalOpen(true)}
            className="flex-shrink-0 w-full sm:w-auto"
          >
            <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
            Plant New Seed
          </Button>
        </div>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 bg-error/10 border border-error/30 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-text-secondary">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-error hover:text-error/80"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <aside className="w-full lg:w-64 flex-shrink-0">
            <SeedFiltersPanel
              filters={{
                type: typeFilters as any,
                status: statusFilters as any,
              }}
              onFiltersChange={handleFiltersChange}
            />
          </aside>

          <main className="flex-1">
            <div className="mb-4 sm:mb-6">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search seeds by name or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    "w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg border transition-all duration-200 text-sm sm:text-base",
                    "bg-bg-secondary text-text-primary",
                    "border-bg-tertiary focus:border-text-accent",
                    "focus:outline-none focus:ring-2 focus:ring-text-accent/20",
                    "placeholder:text-text-muted"
                  )}
                />
              </div>
            </div>

            {isEmpty ? (
              <div className="bg-bg-tertiary/30 border border-bg-tertiary rounded-lg p-8 sm:p-12 text-center">
                <Leaf className="h-16 w-16 text-text-muted mx-auto mb-4" />
                <p className="text-text-primary font-medium text-lg mb-2">
                  {hasActiveFilters ? "No seeds match your filters" : "Your seed library is empty"}
                </p>
                <p className="text-text-secondary text-sm">
                  {hasActiveFilters
                    ? "Try adjusting your search or filters"
                    : "Seeds will appear here as you create them in your knowledge garden"}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-text-secondary">
                  Showing {seeds.length} {seeds.length === 1 ? "seed" : "seeds"}
                </div>

                <AnimatePresence mode="popLayout">
                  <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4"
                  >
                    {seeds.map((seed) => (
                      <motion.div
                        key={seed.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{
                          layout: { duration: 0.3, ease: "easeInOut" },
                          opacity: { duration: 0.2 },
                          scale: { duration: 0.2 },
                        }}
                      >
                        <SeedCard
                          seed={seed}
                          onView={handleViewSeed}
                          onUpdateStatus={handleUpdateStatus}
                          onDelete={handleDeleteSeed}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </>
            )}
          </main>
        </div>

        <PlantSeedModal
          isOpen={isPlantModalOpen}
          onClose={() => setIsPlantModalOpen(false)}
          onSuccess={refetch}
        />
      </motion.div>
    </AnimatePresence>
  );
}
