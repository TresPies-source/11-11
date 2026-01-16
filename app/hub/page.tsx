'use client';

import { useState, useEffect } from 'react';
import { useFilters } from '@/hooks/hub/useFilters';
import { useFeed } from '@/hooks/hub/useFeed';
import { FiltersSidebar } from '@/components/hub/FiltersSidebar';
import { ActivityFeed } from '@/components/hub/ActivityFeed';
import { GraphPreview } from '@/components/hub/GraphPreview';
import { OnboardingHint } from '@/components/hub/OnboardingHint';
import { HubErrorBoundary } from '@/components/hub/HubErrorBoundary';
import { getAllNodes, getAllLinks } from '@/lib/hub/graph-queries';
import type { GraphNode, GraphLink } from '@/lib/hub/types';

const DEV_USER_ID = 'dev@11-11.dev';

export default function HubPage() {
  const filters = useFilters();
  const { artifacts, loading, error, hasMore, loadMore, refetch, total } = useFeed({
    filters: filters.filters,
    enabled: true,
  });

  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphLinks, setGraphLinks] = useState<GraphLink[]>([]);
  const [graphLoading, setGraphLoading] = useState(true);
  const [graphError, setGraphError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGraphPreviewData() {
      try {
        setGraphLoading(true);
        setGraphError(null);
        const [nodes, links] = await Promise.all([
          getAllNodes(DEV_USER_ID, 100),
          getAllLinks(DEV_USER_ID),
        ]);
        setGraphNodes(nodes);
        setGraphLinks(links);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load graph preview';
        setGraphError(errorMessage);
        console.error('[HubPage] Failed to load graph preview data:', err);
      } finally {
        setGraphLoading(false);
      }
    }

    loadGraphPreviewData();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      <header className="flex-shrink-0 border-b border-bg-tertiary px-6 py-4" role="banner">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Knowledge Hub</h1>
            <p className="text-sm text-text-secondary mt-1">
              Explore your knowledge ecosystem
            </p>
          </div>
          {!loading && (
            <div className="text-sm text-text-secondary" role="status" aria-live="polite">
              {total} {total === 1 ? 'artifact' : 'artifacts'}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[280px,1fr,320px] xl:grid-cols-[320px,1fr,360px]">
        <div className="hidden lg:block overflow-y-auto">
          <HubErrorBoundary section="filters">
            <FiltersSidebar filters={filters} />
          </HubErrorBoundary>
        </div>

        <main className="overflow-y-auto px-4 lg:px-6 py-6" id="activity-feed-scrollable" role="main" aria-label="Activity feed">
          <div className="lg:hidden mb-4">
            <HubErrorBoundary section="filters">
              <FiltersSidebar filters={filters} />
            </HubErrorBoundary>
          </div>
          
          {!loading && artifacts.length > 0 && (
            <OnboardingHint
              id="hub-welcome"
              title="Welcome to the Knowledge Hub!"
              message="This is your activity feed showing all knowledge artifacts. Use filters on the left to narrow down results, or click the graph preview on the right to explore connections visually."
              className="mb-4"
            />
          )}
          
          <HubErrorBoundary section="feed" resetKeys={[filters.filters.types.join(','), filters.filters.search]}>
            <ActivityFeed
              artifacts={artifacts}
              loading={loading}
              error={error}
              hasMore={hasMore}
              total={total}
              onLoadMore={loadMore}
              onRetry={refetch}
              hasActiveFilters={filters.hasActiveFilters}
              onClearFilters={filters.resetFilters}
            />
          </HubErrorBoundary>
        </main>

        <aside className="hidden lg:block overflow-y-auto border-l border-bg-tertiary p-4" role="complementary" aria-label="Graph preview">
          <HubErrorBoundary section="preview">
            {graphLoading && (
              <div className="bg-bg-primary border border-bg-tertiary rounded-lg p-4" role="status" aria-label="Loading graph preview">
                <div className="aspect-square bg-bg-secondary rounded-lg animate-pulse" />
                <span className="sr-only">Loading graph preview...</span>
              </div>
            )}
            {!graphLoading && graphError && (
              <div className="bg-bg-primary border border-red-500/20 rounded-lg p-4 text-center" role="alert">
                <p className="text-sm text-red-400 mb-2">Failed to load preview</p>
                <p className="text-xs text-text-tertiary">{graphError}</p>
              </div>
            )}
            {!graphLoading && !graphError && (
              <GraphPreview
                nodes={graphNodes}
                links={graphLinks}
              />
            )}
          </HubErrorBoundary>
        </aside>
      </div>
    </div>
  );
}
