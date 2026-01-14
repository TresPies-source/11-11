"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Search, AlertCircle } from "lucide-react";
import type { SeedRow, SeedFilters, SeedStatus } from "@/lib/seeds/types";
import { SeedCard } from "@/components/seeds/seed-card";
import { SeedFiltersPanel } from "@/components/seeds/filters-panel";
import { SeedDetailsModal } from "@/components/seeds/details-modal";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

// Mock seed data for testing
const MOCK_SEEDS: SeedRow[] = [
  {
    id: "seed_1",
    name: "Always Test Edge Cases First",
    type: "principle",
    status: "mature",
    content:
      "When implementing new features, always consider and test edge cases before the happy path. Edge cases reveal the true robustness of your solution.",
    why_matters: "Catching edge cases early prevents production bugs and improves code quality",
    revisit_when: "Starting a new feature or fixing a critical bug",
    created_at: new Date("2024-01-10").toISOString(),
    updated_at: new Date("2024-01-15").toISOString(),
    user_id: null,
    session_id: null,
    replanted: false,
    replant_count: 0,
  },
  {
    id: "seed_2",
    name: "Component Composition Pattern",
    type: "pattern",
    status: "growing",
    content:
      "Break down complex UI components into smaller, reusable pieces. Each component should have a single responsibility and compose with others.",
    why_matters: "Improves code reusability, testability, and maintainability",
    revisit_when: "Building a complex UI feature",
    created_at: new Date("2024-01-12").toISOString(),
    updated_at: new Date("2024-01-14").toISOString(),
    user_id: null,
    session_id: null,
    replanted: false,
    replant_count: 0,
  },
  {
    id: "seed_3",
    name: "How to Handle Database Migrations?",
    type: "question",
    status: "new",
    content:
      "What's the best strategy for handling database schema changes in production? Should we use automatic migrations, manual scripts, or a hybrid approach?",
    why_matters: "Critical for zero-downtime deployments",
    revisit_when: "Planning a major database schema change",
    created_at: new Date("2024-01-13").toISOString(),
    updated_at: new Date("2024-01-13").toISOString(),
    user_id: null,
    session_id: null,
    replanted: false,
    replant_count: 0,
  },
  {
    id: "seed_4",
    name: "Move to TypeScript Strict Mode",
    type: "route",
    status: "new",
    content:
      "Gradually enable TypeScript strict mode across the codebase. Start with new files, then incrementally update existing ones.",
    why_matters: "Catches more bugs at compile time and improves type safety",
    revisit_when: "After completing current sprint",
    created_at: new Date("2024-01-11").toISOString(),
    updated_at: new Date("2024-01-11").toISOString(),
    user_id: null,
    session_id: null,
    replanted: false,
    replant_count: 0,
  },
  {
    id: "seed_5",
    name: "Dojo Protocol Design Document",
    type: "artifact",
    status: "mature",
    content:
      "The comprehensive design document outlining the Dojo Protocol's philosophy, patterns, and implementation guidelines.",
    why_matters: "Foundational document that guides all development decisions",
    revisit_when: "Onboarding new team members or making architectural decisions",
    created_at: new Date("2024-01-05").toISOString(),
    updated_at: new Date("2024-01-10").toISOString(),
    user_id: null,
    session_id: null,
    replanted: true,
    replant_count: 2,
  },
  {
    id: "seed_6",
    name: "No Server-Side State in API Routes",
    type: "constraint",
    status: "mature",
    content:
      "API routes must be stateless. All state should be stored in the database or client-side. This ensures horizontal scalability.",
    why_matters: "Enables the application to scale horizontally without issues",
    revisit_when: "Designing new API endpoints",
    created_at: new Date("2024-01-08").toISOString(),
    updated_at: new Date("2024-01-12").toISOString(),
    user_id: null,
    session_id: null,
    replanted: false,
    replant_count: 0,
  },
  {
    id: "seed_7",
    name: "Progressive Enhancement Strategy",
    type: "principle",
    status: "growing",
    content:
      "Build features that work without JavaScript first, then enhance with client-side interactions. This ensures accessibility and resilience.",
    why_matters: "Improves accessibility, SEO, and user experience on slow networks",
    revisit_when: "Implementing user-facing features",
    created_at: new Date("2024-01-09").toISOString(),
    updated_at: new Date("2024-01-13").toISOString(),
    user_id: null,
    session_id: null,
    replanted: false,
    replant_count: 0,
  },
  {
    id: "seed_8",
    name: "Error Boundary Best Practices",
    type: "pattern",
    status: "mature",
    content:
      "Wrap components with error boundaries at strategic points (page level, feature level). Provide fallback UIs and error reporting.",
    why_matters: "Prevents entire app crashes from isolated component failures",
    revisit_when: "Adding new page or complex feature",
    created_at: new Date("2024-01-07").toISOString(),
    updated_at: new Date("2024-01-11").toISOString(),
    user_id: null,
    session_id: null,
    replanted: false,
    replant_count: 0,
  },
  {
    id: "seed_9",
    name: "Should We Cache Database Queries?",
    type: "question",
    status: "growing",
    content:
      "For read-heavy operations, should we implement a caching layer (Redis, in-memory)? What are the trade-offs with data freshness?",
    why_matters: "Could significantly improve performance for read-heavy operations",
    revisit_when: "Performance optimization sprint",
    created_at: new Date("2024-01-10").toISOString(),
    updated_at: new Date("2024-01-14").toISOString(),
    user_id: null,
    session_id: null,
    replanted: false,
    replant_count: 0,
  },
  {
    id: "seed_10",
    name: "Stale Architecture from v0.1",
    type: "artifact",
    status: "compost",
    content:
      "Several architectural decisions from v0.1 are no longer relevant after the migration to Next.js 14 and App Router.",
    why_matters: "Important to document what no longer applies",
    revisit_when: "Never - archived for historical reference only",
    created_at: new Date("2024-01-01").toISOString(),
    updated_at: new Date("2024-01-06").toISOString(),
    user_id: null,
    session_id: null,
    replanted: false,
    replant_count: 0,
  },
];

export default function SeedsTestPage() {
  const [allSeeds, setAllSeeds] = useState<SeedRow[]>(MOCK_SEEDS);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [selectedSeed, setSelectedSeed] = useState<SeedRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Filter seeds client-side
  const filteredSeeds = allSeeds.filter((seed) => {
    if (typeFilters.length > 0 && !typeFilters.includes(seed.type)) return false;
    if (statusFilters.length > 0 && !statusFilters.includes(seed.status)) return false;
    if (
      debouncedSearch &&
      !seed.name.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
      !seed.content.toLowerCase().includes(debouncedSearch.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

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
    (seed: SeedRow, status: SeedStatus) => {
      if (seed.status === status) return;

      setAllSeeds((prev) =>
        prev.map((s) => (s.id === seed.id ? { ...s, status, updated_at: new Date().toISOString() } : s))
      );
    },
    []
  );

  const handleDeleteSeed = useCallback(
    (seed: SeedRow) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${seed.name}"? This action cannot be undone.`
      );

      if (!confirmed) return;

      setAllSeeds((prev) => prev.filter((s) => s.id !== seed.id));
      if (selectedSeed?.id === seed.id) {
        handleCloseModal();
      }
    },
    [selectedSeed, handleCloseModal]
  );

  const hasActiveFilters =
    debouncedSearch || typeFilters.length > 0 || statusFilters.length > 0;
  const isEmpty = filteredSeeds.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Leaf className="h-8 w-8 text-green-600 dark:text-green-500" />
          🌱 Seed Library (Test Mode)
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your knowledge seeds through Keep, Grow, Compost, and Replant
        </p>
        <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              This is a test version with mock data for UI testing and polish
            </p>
          </div>
        </div>
      </div>

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
                Showing {filteredSeeds.length} {filteredSeeds.length === 1 ? "seed" : "seeds"}
              </div>

              <AnimatePresence mode="popLayout">
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSeeds.map((seed) => (
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
