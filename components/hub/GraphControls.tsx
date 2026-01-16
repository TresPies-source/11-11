'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onBackToFeed: () => void;
  className?: string;
}

export const GraphControls = memo(function GraphControls({
  onZoomIn,
  onZoomOut,
  onResetView,
  onBackToFeed,
  className,
}: GraphControlsProps) {
  return (
    <motion.div
      className={cn(
        "fixed top-4 right-4 flex flex-col gap-2 z-10",
        className
      )}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-bg-primary border border-bg-tertiary rounded-lg p-2 shadow-lg">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            className="w-10 h-10 p-0"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            className="w-10 h-10 p-0"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <div className="h-px bg-bg-tertiary my-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetView}
            className="w-10 h-10 p-0"
            aria-label="Reset view"
            title="Reset view"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <Button
        variant="secondary"
        size="sm"
        onClick={onBackToFeed}
        className="gap-2"
        aria-label="Back to feed"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back to Feed</span>
      </Button>
    </motion.div>
  );
});
