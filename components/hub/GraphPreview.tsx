'use client';

import { useEffect, useMemo, useState, memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Network, ArrowRight } from 'lucide-react';
import type { GraphNode, GraphLink, ArtifactType } from '@/lib/hub/types';
import { cn } from '@/lib/utils';

interface GraphPreviewProps {
  nodes: GraphNode[];
  links: GraphLink[];
  highlightedNode?: string | null;
  className?: string;
}

const ARTIFACT_COLORS: Record<ArtifactType, string> = {
  session: '#4A90E2',
  prompt: '#9B59B6',
  seed: '#27AE60',
  file: '#E67E22',
};

const MAX_PREVIEW_NODES = 100;
const SVG_WIDTH = 300;
const SVG_HEIGHT = 300;
const NODE_RADIUS = 3;
const HIGHLIGHTED_RADIUS = 5;

interface NodePosition {
  x: number;
  y: number;
  color: string;
  isHighlighted: boolean;
}

function calculateNodePositions(
  nodes: GraphNode[],
  links: GraphLink[],
  highlightedNode?: string | null
): NodePosition[] {
  const limitedNodes = nodes.slice(0, MAX_PREVIEW_NODES);
  const positions: NodePosition[] = [];
  
  const centerX = SVG_WIDTH / 2;
  const centerY = SVG_HEIGHT / 2;
  const radius = Math.min(SVG_WIDTH, SVG_HEIGHT) * 0.4;
  
  limitedNodes.forEach((node, index) => {
    const angle = (index / limitedNodes.length) * 2 * Math.PI;
    const nodeKey = `${node.type}:${node.id}`;
    
    const distanceFactor = 0.5 + Math.random() * 0.5;
    const x = centerX + Math.cos(angle) * radius * distanceFactor;
    const y = centerY + Math.sin(angle) * radius * distanceFactor;
    
    positions.push({
      x,
      y,
      color: ARTIFACT_COLORS[node.type],
      isHighlighted: highlightedNode === nodeKey,
    });
  });
  
  return positions;
}

function calculateLinkPositions(
  nodes: GraphNode[],
  links: GraphLink[],
  nodePositions: NodePosition[]
): { x1: number; y1: number; x2: number; y2: number }[] {
  const limitedNodes = nodes.slice(0, MAX_PREVIEW_NODES);
  const nodeIndexMap = new Map<string, number>();
  
  limitedNodes.forEach((node, index) => {
    const key = `${node.type}:${node.id}`;
    nodeIndexMap.set(key, index);
  });
  
  return links
    .map(link => {
      const sourceIndex = nodeIndexMap.get(link.source);
      const targetIndex = nodeIndexMap.get(link.target);
      
      if (sourceIndex === undefined || targetIndex === undefined) {
        return null;
      }
      
      return {
        x1: nodePositions[sourceIndex].x,
        y1: nodePositions[sourceIndex].y,
        x2: nodePositions[targetIndex].x,
        y2: nodePositions[targetIndex].y,
      };
    })
    .filter((link): link is { x1: number; y1: number; x2: number; y2: number } => link !== null);
}

export const GraphPreview = memo(function GraphPreview({
  nodes,
  links,
  highlightedNode,
  className,
}: GraphPreviewProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const nodePositions = useMemo(() => {
    if (!mounted) return [];
    return calculateNodePositions(nodes, links, highlightedNode);
  }, [nodes, links, highlightedNode, mounted]);
  
  const linkPositions = useMemo(() => {
    if (!mounted) return [];
    return calculateLinkPositions(nodes, links, nodePositions);
  }, [nodes, links, nodePositions, mounted]);
  
  const displayedNodeCount = Math.min(nodes.length, MAX_PREVIEW_NODES);
  const hasMore = nodes.length > MAX_PREVIEW_NODES;
  
  if (!mounted) {
    return (
      <div className={cn("bg-bg-primary border border-bg-tertiary rounded-lg p-4", className)}>
        <div className="flex items-center gap-2 mb-3">
          <Network className="w-4 h-4 text-text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">Knowledge Graph</h3>
        </div>
        <div className="aspect-square bg-bg-secondary rounded-lg animate-pulse" />
      </div>
    );
  }
  
  if (nodes.length === 0) {
    return (
      <div className={cn("bg-bg-primary border border-bg-tertiary rounded-lg p-4", className)}>
        <div className="flex items-center gap-2 mb-3">
          <Network className="w-4 h-4 text-text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">Knowledge Graph</h3>
        </div>
        
        <div className="aspect-square bg-bg-secondary rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Network className="w-8 h-8 text-text-secondary/50 mx-auto mb-2" />
            <p className="text-xs text-text-secondary">No nodes yet</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn("bg-bg-primary border border-bg-tertiary rounded-lg p-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">Knowledge Graph</h3>
        </div>
        <div className="text-xs text-text-secondary">
          {displayedNodeCount} {hasMore && `/ ${nodes.length}`} nodes
        </div>
      </div>
      
      <p className="text-xs text-text-secondary mb-3">
        A visual preview of how your knowledge artifacts connect together.
      </p>
      
      <div className="relative aspect-square bg-bg-secondary rounded-lg overflow-hidden">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-full"
          role="img"
          aria-labelledby="graph-preview-title graph-preview-desc"
        >
          <title id="graph-preview-title">Knowledge Graph Preview</title>
          <desc id="graph-preview-desc">
            A preview visualization showing {displayedNodeCount} nodes from your knowledge graph. Each colored circle represents an artifact, and lines show connections between them.
          </desc>
          
          <g className="links" opacity={0.2} aria-hidden="true">
            {linkPositions.map((link, i) => (
              <line
                key={i}
                x1={link.x1}
                y1={link.y1}
                x2={link.x2}
                y2={link.y2}
                stroke="currentColor"
                strokeWidth={0.5}
                className="text-text-secondary"
              />
            ))}
          </g>
          
          <g className="nodes" aria-hidden="true">
            {nodePositions.map((node, i) => (
              <motion.circle
                key={i}
                cx={node.x}
                cy={node.y}
                r={node.isHighlighted ? HIGHLIGHTED_RADIUS : NODE_RADIUS}
                fill={node.color}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: node.isHighlighted ? 1 : 0.8, 
                  scale: 1 
                }}
                transition={{ 
                  delay: i * 0.005,
                  duration: 0.2 
                }}
              >
                {node.isHighlighted && (
                  <animate
                    attributeName="r"
                    values={`${HIGHLIGHTED_RADIUS};${HIGHLIGHTED_RADIUS + 2};${HIGHLIGHTED_RADIUS}`}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                )}
              </motion.circle>
            ))}
          </g>
        </svg>
      </div>
      
      <Link
        href="/hub/graph"
        className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary hover:bg-bg-tertiary rounded-lg transition-colors group"
      >
        View Full Graph
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
});
