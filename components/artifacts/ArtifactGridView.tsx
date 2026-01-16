"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, RotateCw } from "lucide-react";
import { useFeed } from "@/hooks/hub/useFeed";
import { ArtifactCard } from "./ArtifactCard";
import type { FeedFilters } from "@/lib/hub/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { getSeed } from "@/lib/pglite/seeds";
import { getPromptById } from "@/lib/pglite/prompts";
import { getSession } from "@/lib/pglite/sessions";
import type { SeedRow } from "@/lib/seeds/types";
import type { PromptWithCritique } from "@/lib/pglite/prompts";
import type { SessionRow } from "@/lib/pglite/types";

interface EmptyStateConfig {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ArtifactGridViewProps {
  filters: FeedFilters;
  emptyState?: EmptyStateConfig;
  header?: React.ReactNode;
  className?: string;
}

export function ArtifactGridView({
  filters,
  emptyState,
  header,
  className,
}: ArtifactGridViewProps) {
  const { artifacts, loading, error, hasMore, loadMore, refetch, total } = useFeed({
    filters,
    enabled: true,
  });

  const [fullArtifacts, setFullArtifacts] = useState<(SeedRow | PromptWithCritique | SessionRow)[]>([]);
  const [loadingFull, setLoadingFull] = useState(true);

  useEffect(() => {
    async function loadFullArtifacts() {
      if (artifacts.length === 0) {
        setFullArtifacts([]);
        setLoadingFull(false);
        return;
      }

      setLoadingFull(true);
      try {
        const loaded = await Promise.all(
          artifacts.map(async (artifact) => {
            if (artifact.type === 'seed') {
              return await getSeed(artifact.id);
            } else if (artifact.type === 'prompt') {
              return await getPromptById(artifact.id);
            } else if (artifact.type === 'session') {
              return await getSession(artifact.id);
            }
            return null;
          })
        );

        setFullArtifacts(loaded.filter((a): a is SeedRow | PromptWithCritique | SessionRow => a !== null));
      } catch (err) {
        console.error('Error loading full artifacts:', err);
      } finally {
        setLoadingFull(false);
      }
    }

    loadFullArtifacts();
  }, [artifacts]);

  const handleDelete = useCallback(() => {
    refetch();
  }, [refetch]);

  if (loading && artifacts.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        {header}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 bg-bg-tertiary/30 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        {header}
        <div className="bg-error/10 border border-error/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Unable to load artifacts
              </h3>
              <p className="text-text-secondary mb-4">{error}</p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = fullArtifacts.length === 0;

  if (isEmpty) {
    const defaultEmptyState: EmptyStateConfig = {
      title: "No artifacts found",
      message: "Try adjusting your filters or create something new",
    };
    const displayEmptyState = emptyState || defaultEmptyState;

    return (
      <div className={cn("space-y-4", className)}>
        {header}
        <div className="bg-bg-tertiary/30 border border-bg-tertiary rounded-lg p-8 sm:p-12 text-center">
          <p className="text-text-primary font-medium text-lg mb-2">
            {displayEmptyState.title}
          </p>
          <p className="text-text-secondary text-sm mb-4">
            {displayEmptyState.message}
          </p>
          {displayEmptyState.action && (
            <Button
              variant="primary"
              size="md"
              onClick={displayEmptyState.action.onClick}
            >
              {displayEmptyState.action.label}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {header}
      
      <div className="mb-4 text-sm text-text-secondary transition-opacity duration-200">
        Showing {fullArtifacts.length} of {total} {total === 1 ? "artifact" : "artifacts"}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {fullArtifacts.map((artifact) => (
          <motion.div
            key={`${'id' in artifact ? artifact.id : ''}`}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <ArtifactCard
              artifact={artifact}
              searchQuery={filters.search}
              onStatusChange={refetch}
              onDelete={handleDelete}
            />
          </motion.div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button
            variant="secondary"
            size="md"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
