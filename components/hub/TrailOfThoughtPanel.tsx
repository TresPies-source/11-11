'use client';

import { useState, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, RotateCw, Sparkles } from 'lucide-react';
import { useLineage } from '@/hooks/hub/useLineage';
import { 
  formatRelativeTime, 
  getArtifactIcon, 
  getRelationshipLabel, 
  getArtifactNavigationPath 
} from '@/lib/hub/utils';
import type { ArtifactType, LineageNode } from '@/lib/hub/types';
import { cn } from '@/lib/utils';

interface TrailOfThoughtPanelProps {
  artifactType: ArtifactType;
  artifactId: string;
  defaultOpen?: boolean;
  className?: string;
  maxItems?: number;
}

const containerVariants = {
  collapsed: { 
    height: 0, 
    opacity: 0,
    transition: {
      height: { duration: 0.2 },
      opacity: { duration: 0.15 }
    }
  },
  expanded: { 
    height: "auto", 
    opacity: 1,
    transition: {
      height: { duration: 0.2 },
      opacity: { duration: 0.15, delay: 0.05 }
    }
  },
};

const nodeVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.2 },
  }),
};

export const TrailOfThoughtPanel = memo(function TrailOfThoughtPanel({
  artifactType,
  artifactId,
  defaultOpen = false,
  className,
  maxItems = 20,
}: TrailOfThoughtPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const router = useRouter();
  const { lineage, loading, error, refetch, count } = useLineage({
    type: artifactType,
    id: artifactId,
    enabled: true,
  });

  const displayedLineage = lineage.slice(0, maxItems);

  const handleNodeClick = useCallback((node: LineageNode) => {
    const path = getArtifactNavigationPath(node.type, node.id);
    router.push(path);
  }, [router]);

  return (
    <div className={cn("border border-bg-tertiary rounded-lg bg-bg-secondary", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-bg-tertiary transition-colors"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-text-secondary" />
          ) : (
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          )}
          <span className="text-sm font-medium text-text-primary">Trail of Thought</span>
          {count > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-text-accent/10 text-text-accent">
              {count}
            </span>
          )}
        </div>
        <Sparkles className="w-4 h-4 text-text-accent" />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={containerVariants}
            className="overflow-hidden"
          >
            <div className="border-t border-bg-tertiary px-4 py-3">
              {loading && <LoadingState />}
              {error && <ErrorState error={error} onRetry={refetch} />}
              {!loading && !error && count === 0 && <EmptyState />}
              {!loading && !error && count > 0 && (
                <TimelineView lineage={displayedLineage} onNodeClick={handleNodeClick} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const LoadingState = memo(function LoadingState() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-5 h-5 rounded bg-bg-tertiary animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-bg-tertiary rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-bg-tertiary rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
});

const ErrorState = memo(function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-6">
      <p className="text-sm text-error mb-3">Failed to load connections</p>
      <p className="text-xs text-text-secondary mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-text-primary bg-bg-tertiary hover:bg-bg-tertiary/80 rounded transition-colors"
      >
        <RotateCw className="w-3.5 h-3.5" />
        Retry
      </button>
    </div>
  );
});

const EmptyState = memo(function EmptyState() {
  return (
    <div className="text-center py-6">
      <p className="text-sm text-text-secondary mb-1">No connections yet</p>
      <p className="text-xs text-text-secondary/70">
        This artifact hasn&apos;t been linked to other knowledge yet
      </p>
    </div>
  );
});

const TimelineView = memo(function TimelineView({ 
  lineage, 
  onNodeClick 
}: { 
  lineage: LineageNode[]; 
  onNodeClick: (node: LineageNode) => void;
}) {
  return (
    <div className="space-y-1">
      {lineage.map((node, index) => {
        const Icon = getArtifactIcon(node.type);
        const relationLabel = node.relationship 
          ? getRelationshipLabel(node.relationship) 
          : 'Connected to';
        const isLast = index === lineage.length - 1;

        return (
          <motion.button
            key={`${node.type}-${node.id}`}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={nodeVariants}
            onClick={() => onNodeClick(node)}
            className="w-full group"
          >
            <div className="flex items-start gap-3 py-2 px-3 rounded hover:bg-bg-tertiary transition-colors text-left">
              <div className="relative flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-bg-tertiary flex items-center justify-center">
                  <Icon className="w-3 h-3 text-text-accent" />
                </div>
                {!isLast && (
                  <div className="absolute left-1/2 top-5 w-px h-6 -translate-x-1/2 bg-bg-tertiary" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs text-text-secondary">{relationLabel}</span>
                </div>
                <p className="text-sm text-text-primary font-medium truncate group-hover:text-text-accent transition-colors">
                  {node.title}
                </p>
                {node.content_preview && (
                  <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                    {node.content_preview}
                  </p>
                )}
                <p className="text-xs text-text-secondary/70 mt-1">
                  {formatRelativeTime(node.created_at)}
                </p>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
});
