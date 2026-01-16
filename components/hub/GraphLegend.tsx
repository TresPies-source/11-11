'use client';

import { useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, MessageSquare, FileText, Sprout, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ArtifactType, RelationshipType } from '@/lib/hub/types';

interface GraphLegendProps {
  visible?: boolean;
  onToggle?: (visible: boolean) => void;
  className?: string;
}

const ARTIFACT_TYPES: Array<{ type: ArtifactType; label: string; color: string; icon: typeof MessageSquare }> = [
  { type: 'session', label: 'Sessions', color: '#4A90E2', icon: MessageSquare },
  { type: 'prompt', label: 'Prompts', color: '#9B59B6', icon: FileText },
  { type: 'seed', label: 'Seeds', color: '#27AE60', icon: Sprout },
  { type: 'file', label: 'Files', color: '#E67E22', icon: File },
];

const RELATIONSHIP_TYPES: Array<{ type: RelationshipType; label: string }> = [
  { type: 'extracted_from', label: 'Extracted from' },
  { type: 'discussed_in', label: 'Discussed in' },
  { type: 'refined_in', label: 'Refined in' },
  { type: 'created_from', label: 'Created from' },
];

const NODE_SIZES = [
  { label: 'Few connections', size: 4 },
  { label: 'Some connections', size: 6 },
  { label: 'Many connections', size: 8 },
];

export const GraphLegend = memo(function GraphLegend({ visible: controlledVisible, onToggle, className }: GraphLegendProps) {
  const [internalVisible, setInternalVisible] = useState(true);
  
  const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible;
  
  const handleToggle = useCallback(() => {
    const newVisible = !isVisible;
    if (onToggle) {
      onToggle(newVisible);
    } else {
      setInternalVisible(newVisible);
    }
  }, [isVisible, onToggle]);
  
  return (
    <div className={cn('fixed bottom-6 left-6 z-10', className)}>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-bg-primary border border-bg-tertiary rounded-lg shadow-lg overflow-hidden"
            style={{ width: '280px' }}
            role="region"
            aria-labelledby="graph-legend-title"
          >
            <div className="flex items-center justify-between p-3 border-b border-bg-tertiary">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-text-secondary" aria-hidden="true" />
                <h3 id="graph-legend-title" className="text-sm font-semibold text-text-primary">Legend</h3>
              </div>
              <button
                onClick={handleToggle}
                className="text-text-secondary hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-text-accent rounded p-0.5"
                aria-label="Close legend"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-3 space-y-4">
              <div>
                <h4 className="text-xs font-medium text-text-secondary mb-2">Artifact Types</h4>
                <ul className="space-y-1.5" role="list">
                  {ARTIFACT_TYPES.map(({ type, label, color, icon: Icon }) => (
                    <li key={type} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      />
                      <Icon className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" aria-hidden="true" />
                      <span className="text-xs text-text-primary">{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-text-secondary mb-2">Node Size</h4>
                <ul className="space-y-1.5" role="list">
                  {NODE_SIZES.map(({ label, size }) => (
                    <li key={label} className="flex items-center gap-2">
                      <div
                        className="rounded-full bg-text-secondary/40 flex-shrink-0"
                        style={{ width: size, height: size }}
                        aria-hidden="true"
                      />
                      <span className="text-xs text-text-primary">{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-text-secondary mb-2">Connection Types</h4>
                <ul className="space-y-1.5" role="list">
                  {RELATIONSHIP_TYPES.map(({ type, label }) => (
                    <li key={type} className="flex items-center gap-2">
                      <div className="w-8 h-px bg-text-secondary/40 flex-shrink-0" aria-hidden="true" />
                      <span className="text-xs text-text-primary">{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={handleToggle}
          className="bg-bg-primary border border-bg-tertiary rounded-lg p-3 shadow-lg hover:bg-bg-secondary transition-colors"
          aria-label="Show legend"
        >
          <Info className="w-5 h-5 text-text-secondary" />
        </motion.button>
      )}
    </div>
  );
});
