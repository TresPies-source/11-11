"use client";

import { useState } from "react";
import { Leaf, Search, Plus, Network } from "lucide-react";
import { ArtifactGridView } from "@/components/artifacts/ArtifactGridView";
import { SeedFiltersPanel } from "@/components/seeds/filters-panel";
import { PlantSeedModal } from "@/components/seeds/plant-seed-modal";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { SeedFilters } from "@/lib/seeds/types";

export default function SeedsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const handleFiltersChange = (newFilters: SeedFilters) => {
    setTypeFilters(newFilters.type || []);
    setStatusFilters(newFilters.status || []);
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

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
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Link href="/hub" className="flex-shrink-0 w-full sm:w-auto">
            <Button variant="secondary" size="md" className="w-full">
              <Network className="w-4 sm:w-5 h-4 sm:h-5" />
              View in Hub
            </Button>
          </Link>
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
      </div>

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

        <main className="flex-1 transition-all duration-300 ease-in-out">
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

          <ArtifactGridView
            key={refreshKey}
            filters={{
              types: ["seed"],
              status: statusFilters.length > 0 ? statusFilters : undefined,
              search: debouncedSearch,
              dateFrom: null,
              dateTo: null,
            }}
            emptyState={{
              title: searchTerm || typeFilters.length || statusFilters.length
                ? "No seeds match your filters"
                : "Your seed library is empty",
              message: searchTerm || typeFilters.length || statusFilters.length
                ? "Try adjusting your search or filters"
                : "Seeds will appear here as you create them in your knowledge garden",
            }}
          />
        </main>
      </div>

      <PlantSeedModal
        isOpen={isPlantModalOpen}
        onClose={() => setIsPlantModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
