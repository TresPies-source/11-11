'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useGraph } from '@/hooks/hub/useGraph';
import { getArtifactDetails } from '@/lib/hub/graph-queries';
import { GraphLegend } from '@/components/hub/GraphLegend';
import { GraphControls } from '@/components/hub/GraphControls';
import { ArtifactDetailModal } from '@/components/hub/ArtifactDetailModal';
import { OnboardingHint } from '@/components/hub/OnboardingHint';
import { HubErrorBoundary } from '@/components/hub/HubErrorBoundary';
import { AlertCircle } from 'lucide-react';
import type { ArtifactType } from '@/lib/hub/types';
import type { ArtifactDetails } from '@/lib/hub/graph-queries';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
});

const DEV_USER_ID = 'dev@11-11.dev';

const ARTIFACT_COLORS: Record<ArtifactType, string> = {
  session: '#4A90E2',
  prompt: '#9B59B6',
  seed: '#27AE60',
  file: '#E67E22',
};

const MIN_NODE_SIZE = 4;
const MAX_NODE_SIZE = 12;

interface NodeObject {
  id: string;
  type: ArtifactType;
  title: string;
  created_at: string;
  connectionCount?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface LinkObject {
  source: string | NodeObject;
  target: string | NodeObject;
  relationship: string;
  created_at: string;
}

export default function GraphVisualizationPage() {
  const router = useRouter();
  const { nodes, links, stats, loading, error, refetch } = useGraph({ enabled: true });
  const graphRef = useRef<any>(null);

  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  const [hoverNode, setHoverNode] = useState<NodeObject | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const graphData = useMemo(() => {
    const nodeObjects: NodeObject[] = nodes.map((node) => ({
      ...node,
    }));

    const linkObjects: LinkObject[] = links.map((link) => ({
      ...link,
    }));

    return { nodes: nodeObjects, links: linkObjects };
  }, [nodes, links]);

  const showWarning = stats && stats.totalNodes >= 2000;

  const getNodeSize = (connectionCount: number = 0) => {
    if (connectionCount === 0) return MIN_NODE_SIZE;
    const normalized = Math.min(connectionCount / 10, 1);
    return MIN_NODE_SIZE + normalized * (MAX_NODE_SIZE - MIN_NODE_SIZE);
  };

  const handleNodeHover = useCallback((node: any) => {
    if (!node) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      setHoverNode(null);
      return;
    }

    const neighbors = new Set<string>();
    const linkSet = new Set<string>();

    graphData.links.forEach((link) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;

      if (sourceId === node.id) {
        neighbors.add(targetId);
        linkSet.add(`${sourceId}-${targetId}`);
      } else if (targetId === node.id) {
        neighbors.add(sourceId);
        linkSet.add(`${sourceId}-${targetId}`);
      }
    });

    neighbors.add(node.id);
    setHighlightNodes(neighbors);
    setHighlightLinks(linkSet);
    setHoverNode(node as NodeObject);
  }, [graphData.links]);

  const handleNodeClick = useCallback(async (node: any) => {
    try {
      setModalError(null);
      const [typeStr, idStr] = node.id.split(':');
      const type = typeStr as ArtifactType;
      const id = idStr;

      const details = await getArtifactDetails(type, id, DEV_USER_ID);
      if (details) {
        setSelectedArtifact(details);
        setIsModalOpen(true);
      } else {
        setModalError('Artifact not found');
        setIsModalOpen(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load artifact details';
      setModalError(errorMessage);
      setIsModalOpen(true);
      console.error('[GraphPage] Error fetching artifact details:', err);
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom * 1.2, 400);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom / 1.2, 400);
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  }, []);

  const handleBackToFeed = useCallback(() => {
    router.push('/hub');
  }, [router]);

  const handleZoomChange = useCallback((transform: { k: number; x: number; y: number }) => {
    setZoom(transform.k);
  }, []);

  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      const timer = setTimeout(() => {
        handleResetView();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [graphData.nodes.length, handleResetView]);

  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const nodeId = node.id;
      const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(nodeId);
      const size = getNodeSize(node.connectionCount);
      const color = ARTIFACT_COLORS[node.type as ArtifactType];

      ctx.beginPath();
      ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI, false);
      ctx.fillStyle = isHighlighted ? color : `${color}40`;
      ctx.fill();

      if (isHighlighted) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5 / globalScale;
        ctx.stroke();
      }

      if (zoom > 1.5 && isHighlighted) {
        const label = node.title;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#e5e7eb';
        ctx.fillText(label, node.x!, node.y! + size + fontSize);
      }
    },
    [highlightNodes, zoom]
  );

  const paintLink = useCallback(
    (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      const linkId = `${sourceId}-${targetId}`;
      const isHighlighted = highlightLinks.size === 0 || highlightLinks.has(linkId);

      if (!isHighlighted && highlightLinks.size > 0) {
        return;
      }

      const source = typeof link.source === 'string' ? null : link.source;
      const target = typeof link.target === 'string' ? null : link.target;

      if (!source || !target) return;

      ctx.beginPath();
      ctx.moveTo(source.x!, source.y!);
      ctx.lineTo(target.x!, target.y!);
      ctx.strokeStyle = isHighlighted ? '#6b7280' : '#6b728020';
      ctx.lineWidth = isHighlighted ? 2 / globalScale : 1 / globalScale;
      ctx.stroke();
    },
    [highlightLinks]
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary" role="status" aria-label="Loading knowledge graph">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-bg-tertiary border-t-text-primary rounded-full animate-spin mx-auto" aria-hidden="true" />
          <p className="text-text-secondary">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary" role="alert">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-text-primary">Failed to load graph</h2>
          <p className="text-text-secondary">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Retry loading graph"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="w-20 h-20 rounded-full bg-bg-secondary flex items-center justify-center mx-auto">
            <p className="text-5xl">🌱</p>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-text-primary">Your Knowledge Graph Awaits</h2>
            <p className="text-text-secondary">
              As you create artifacts and build connections, they&apos;ll appear here as an interactive visual network.
            </p>
          </div>
          <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-4 text-left space-y-2">
            <p className="text-sm font-medium text-text-primary">Get started by:</p>
            <ul className="text-sm text-text-secondary space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-text-accent">•</span>
                <span>Having conversations in the Dojo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-text-accent">•</span>
                <span>Saving prompts to your Library</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-text-accent">•</span>
                <span>Planting seeds in your Garden</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/dojo"
              className="px-4 py-2 text-sm font-medium text-white bg-text-accent hover:bg-text-accent/90 rounded-lg transition-colors"
            >
              Start Creating
            </a>
            <button
              onClick={handleBackToFeed}
              className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              Back to Hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HubErrorBoundary section="graph">
      <div className="h-screen flex flex-col bg-bg-primary">
        <header className="flex-shrink-0 border-b border-bg-tertiary px-6 py-4 bg-bg-primary z-20" role="banner">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Knowledge Graph</h1>
              <p className="text-sm text-text-secondary mt-1">
                Explore how your ideas connect
              </p>
            </div>
            {stats && (
              <div className="flex items-center gap-6 text-sm" role="status" aria-live="polite" aria-label="Graph statistics">
                <div>
                  <span className="text-text-secondary">Nodes: </span>
                  <span className="font-semibold text-text-primary">{stats.totalNodes}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Connections: </span>
                  <span className="font-semibold text-text-primary">{stats.totalLinks}</span>
                </div>
              </div>
            )}
          </div>
        </header>

        {showWarning && (
          <div className="flex items-center gap-3 px-6 py-3 bg-yellow-500/10 border-b border-yellow-500/20" role="alert">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-yellow-200">
              Graph contains {stats?.totalNodes}+ nodes. Some nodes may not be visible for
              performance reasons.
            </p>
          </div>
        )}

        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 max-w-md">
          <OnboardingHint
            id="graph-interactions"
            title="Explore Your Knowledge Network"
            message="Scroll to zoom, drag to pan, and click nodes to see details. Hover over nodes to highlight their connections."
          />
        </div>

        <div className="flex-1 relative" role="main" aria-label="Interactive knowledge graph visualization">
          <div role="img" aria-label={`Knowledge graph with ${stats?.totalNodes || 0} nodes and ${stats?.totalLinks || 0} connections. Use scroll to zoom, drag to pan, and click nodes to view details.`}>
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              nodeId="id"
              nodeLabel={(node: any) => node.title}
              nodeCanvasObject={paintNode}
              linkCanvasObject={paintLink}
              onNodeHover={handleNodeHover}
              onNodeClick={handleNodeClick}
              onZoom={handleZoomChange}
              cooldownTicks={100}
              warmupTicks={50}
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.3}
              d3AlphaMin={0.001}
              enableNodeDrag={true}
              enableZoomInteraction={true}
              enablePanInteraction={true}
              backgroundColor="#0a0a0a"
              width={typeof window !== 'undefined' ? window.innerWidth : 800}
              height={typeof window !== 'undefined' ? window.innerHeight - 73 : 600}
              nodeRelSize={1}
              linkWidth={1}
              linkDirectionalParticles={0}
            />
          </div>

          <GraphControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetView={handleResetView}
            onBackToFeed={handleBackToFeed}
          />

          <GraphLegend />
        </div>

        <ArtifactDetailModal
          artifact={selectedArtifact}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedArtifact(null);
            setModalError(null);
          }}
          error={modalError}
        />
      </div>
    </HubErrorBoundary>
  );
}
