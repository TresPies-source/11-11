'use client';

import { memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import InfiniteScroll from 'react-infinite-scroll-component';
import { motion } from 'framer-motion';
import { RotateCw, Sparkles, Filter } from 'lucide-react';
import { TrailOfThoughtPanel } from './TrailOfThoughtPanel';
import { getArtifactIcon, formatRelativeTime, getArtifactNavigationPath } from '@/lib/hub/utils';
import type { FeedArtifact } from '@/lib/hub/types';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  artifacts: FeedArtifact[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  onLoadMore: () => Promise<void>;
  onRetry: () => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  className?: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
};

export function ActivityFeed({
  artifacts,
  loading,
  error,
  hasMore,
  total,
  onLoadMore,
  onRetry,
  hasActiveFilters = false,
  onClearFilters,
  className,
}: ActivityFeedProps) {
  const router = useRouter();

  const handleArtifactClick = useCallback((artifact: FeedArtifact) => {
    const path = getArtifactNavigationPath(artifact.type, artifact.id);
    router.push(path);
  }, [router]);

  if (loading && artifacts.length === 0) {
    return (
      <div className={cn("space-y-4", className)} role="status" aria-label="Loading artifacts">
        <span className="sr-only">Loading artifacts...</span>
        <FeedSkeleton count={5} />
      </div>
    );
  }

  if (error && artifacts.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)} role="alert">
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    );
  }

  if (!loading && artifacts.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <EmptyState hasActiveFilters={hasActiveFilters} onClearFilters={onClearFilters} />
      </div>
    );
  }

  return (
    <div className={className} id="activity-feed-scrollable">
      <InfiniteScroll
        dataLength={artifacts.length}
        next={onLoadMore}
        hasMore={hasMore}
        loader={<LoadingMoreState />}
        endMessage={<EndOfFeedMessage total={total} />}
        scrollableTarget="activity-feed-scrollable"
        scrollThreshold={0.8}
        style={{ overflow: 'visible' }}
      >
        <div className="space-y-4" role="feed" aria-label="Activity feed of knowledge artifacts" aria-busy={loading}>
          {artifacts.map((artifact, index) => (
            <motion.div
              key={`${artifact.type}-${artifact.id}`}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <ArtifactCard
                artifact={artifact}
                onClick={() => handleArtifactClick(artifact)}
              />
            </motion.div>
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
}

const ArtifactCard = memo(function ArtifactCard({ 
  artifact, 
  onClick 
}: { 
  artifact: FeedArtifact; 
  onClick: () => void;
}) {
  const Icon = getArtifactIcon(artifact.type);
  const typeLabel = artifact.type.charAt(0).toUpperCase() + artifact.type.slice(1);

  return (
    <article className="bg-bg-primary border border-bg-tertiary rounded-lg overflow-hidden hover:border-text-accent/30 transition-colors" role="article" aria-label={`${typeLabel}: ${artifact.title}`}>
      <button
        onClick={onClick}
        className="w-full px-4 py-4 text-left hover:bg-bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-text-accent focus:ring-inset"
        aria-label={`View ${typeLabel.toLowerCase()}: ${artifact.title}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center" aria-hidden="true">
            <Icon className="w-5 h-5 text-text-accent" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                {typeLabel}
              </span>
              <span className="text-xs text-text-secondary/60" aria-hidden="true">•</span>
              <span className="text-xs text-text-secondary">
                <time dateTime={artifact.last_activity}>{formatRelativeTime(artifact.last_activity)}</time>
              </span>
            </div>
            
            <h3 className="text-base font-semibold text-text-primary mb-1 truncate">
              {artifact.title}
            </h3>
            
            {artifact.content_preview && (
              <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                {artifact.content_preview}
              </p>
            )}
            
            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{artifact.connection_count} connections</span>
              </div>
              <span aria-hidden="true">•</span>
              <span>Created <time dateTime={artifact.created_at}>{formatRelativeTime(artifact.created_at)}</time></span>
            </div>
          </div>
        </div>
      </button>

      <div className="px-4 pb-4">
        <TrailOfThoughtPanel
          artifactType={artifact.type}
          artifactId={artifact.id}
          defaultOpen={false}
          maxItems={5}
        />
      </div>
    </article>
  );
});

const FeedSkeleton = memo(function FeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-bg-primary border border-bg-tertiary rounded-lg overflow-hidden"
        >
          <div className="px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-bg-tertiary animate-pulse" />
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-16 bg-bg-tertiary rounded animate-pulse" />
                  <div className="h-3 w-20 bg-bg-tertiary rounded animate-pulse" />
                </div>
                
                <div className="h-5 w-3/4 bg-bg-tertiary rounded animate-pulse" />
                
                <div className="space-y-2">
                  <div className="h-4 w-full bg-bg-tertiary rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-bg-tertiary rounded animate-pulse" />
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-3 w-24 bg-bg-tertiary rounded animate-pulse" />
                  <div className="h-3 w-32 bg-bg-tertiary rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
});

const LoadingMoreState = memo(function LoadingMoreState() {
  return (
    <div className="flex justify-center py-6">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <RotateCw className="w-4 h-4 animate-spin" />
        <span>Loading more artifacts...</span>
      </div>
    </div>
  );
});

const EndOfFeedMessage = memo(function EndOfFeedMessage({ total }: { total: number }) {
  return (
    <div className="text-center py-8">
      <div className="inline-flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-text-accent" />
        </div>
        <p className="text-sm font-medium text-text-primary">
          You&apos;ve reached the end
        </p>
        <p className="text-xs text-text-secondary">
          {total === 0 ? 'No artifacts found' : `Viewed all ${total} artifacts`}
        </p>
      </div>
    </div>
  );
});

const ErrorState = memo(function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4" aria-hidden="true">
        <Sparkles className="w-6 h-6 text-error" />
      </div>
      <p className="text-sm font-medium text-text-primary mb-2">Failed to load feed</p>
      <p className="text-xs text-text-secondary mb-4 max-w-sm">{error}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary hover:bg-bg-tertiary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-text-accent"
        aria-label="Retry loading feed"
      >
        <RotateCw className="w-4 h-4" aria-hidden="true" />
        Retry
      </button>
    </div>
  );
});

const EmptyState = memo(function EmptyState({ 
  hasActiveFilters = false, 
  onClearFilters 
}: { 
  hasActiveFilters?: boolean; 
  onClearFilters?: () => void;
}) {
  if (hasActiveFilters) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center mx-auto mb-4" aria-hidden="true">
          <Filter className="w-8 h-8 text-text-secondary" />
        </div>
        <p className="text-base font-medium text-text-primary mb-2">No matching artifacts</p>
        <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">
          No artifacts match your current filters. Try adjusting your search criteria or date range.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary hover:bg-bg-tertiary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-text-accent"
            aria-label="Clear all active filters"
          >
            Clear All Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center mx-auto mb-4" aria-hidden="true">
        <Sparkles className="w-8 h-8 text-text-secondary" />
      </div>
      <p className="text-base font-medium text-text-primary mb-2">No artifacts yet</p>
      <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">
        Start creating knowledge by having conversations in the Dojo, saving prompts to your Library, or planting seeds in your Garden.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="/dojo"
          className="px-4 py-2 text-sm font-medium text-white bg-text-accent hover:bg-text-accent/90 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-text-accent focus:ring-offset-2"
          aria-label="Start a new Dojo session"
        >
          Start a Dojo Session
        </a>
        <a
          href="/library"
          className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary hover:bg-bg-tertiary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-text-accent focus:ring-offset-2"
          aria-label="Browse your Library"
        >
          Browse Library
        </a>
      </div>
    </div>
  );
});
