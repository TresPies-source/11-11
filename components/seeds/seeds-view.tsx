"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Search, Plus, AlertCircle } from "lucide-react";
import { useSeeds } from "@/hooks/useSeeds";
import { useDebounce } from "@/hooks/useDebounce";
import type { SeedRow, SeedFilters, SeedStatus } from "@/lib/seeds/types";
import { SeedCard } from "./seed-card";
import { SeedFiltersPanel } from "./filters-panel";
import { SeedDetailsModal } from "./details-modal";
import { insertSeed, updateSeed, deleteSeed } from "@/lib/pglite/seeds";
import { cn } from "@/lib/utils";

export function SeedsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [selectedSeed, setSelectedSeed] = useState<SeedRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedSeed(null), 200);
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
    [refetch]
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
            handleCloseModal();
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
    [refetch, selectedSeed, handleCloseModal]
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Leaf className="h-8 w-8 text-green-600 dark:text-green-500" />
            🌱 Seed Library
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your knowledge seeds through Keep, Grow, Compost, and Replant
          </p>
        </div>

        <div className="flex gap-6">
          <aside className="w-64 flex-shrink-0">
            <div className="bg-background border border-border rounded-lg p-4 h-96 animate-pulse" />
          </aside>

          <main className="flex-1">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg w-full max-w-md"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Leaf className="h-8 w-8 text-green-600 dark:text-green-500" />
            🌱 Seed Library
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your knowledge seeds through Keep, Grow, Compost, and Replant
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                Unable to load seeds
              </h3>
              <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Leaf className="h-8 w-8 text-green-600 dark:text-green-500" />
          🌱 Seed Library
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your knowledge seeds through Keep, Grow, Compost, and Replant
        </p>
      </div>

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-300">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex gap-6">
        <aside className="w-64 flex-shrink-0">
          <SeedFiltersPanel
            filters={{
              type: typeFilters as any,
              status: statusFilters as any,
            }}
            onFiltersChange={handleFiltersChange}
          />
        </aside>

        <main className="flex-1">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search seeds by name or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  "w-full pl-12 pr-4 py-3 rounded-lg border transition-all duration-200",
                  "bg-background text-foreground",
                  "border-border focus:border-blue-500 dark:focus:border-blue-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20",
                  "placeholder:text-muted-foreground"
                )}
              />
            </div>
          </div>

          {isEmpty ? (
            <div className="bg-secondary/50 border border-border rounded-lg p-12 text-center">
              <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground font-medium text-lg mb-2">
                {hasActiveFilters ? "No seeds match your filters" : "Your seed library is empty"}
              </p>
              <p className="text-muted-foreground text-sm">
                {hasActiveFilters
                  ? "Try adjusting your search or filters"
                  : "Seeds will appear here as you create them in your knowledge garden"}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {seeds.length} {seeds.length === 1 ? "seed" : "seeds"}
              </div>

              <AnimatePresence mode="popLayout">
                <motion.div
                  layout
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
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

      <SeedDetailsModal seed={selectedSeed} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
}
