'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllNodes, getAllLinks, getGraphStats } from '@/lib/hub/graph-queries';
import type { GraphNode, GraphLink, GraphStats } from '@/lib/hub/types';

const DEV_USER_ID = 'dev@11-11.dev';
const DEFAULT_NODE_LIMIT = 2000;

interface UseGraphOptions {
  enabled?: boolean;
  nodeLimit?: number;
}

interface UseGraphReturn {
  nodes: GraphNode[];
  links: GraphLink[];
  stats: GraphStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGraph(options: UseGraphOptions = {}): UseGraphReturn {
  const { enabled = true, nodeLimit = DEFAULT_NODE_LIMIT } = options;
  
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const refetch = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setNodes([]);
      setLinks([]);
      setStats(null);
      setLoading(false);
      setError(null);
      return;
    }

    async function fetchGraph() {
      try {
        setLoading(true);
        setError(null);

        const [nodesData, linksData, statsData] = await Promise.all([
          getAllNodes(DEV_USER_ID, nodeLimit),
          getAllLinks(DEV_USER_ID),
          getGraphStats(DEV_USER_ID),
        ]);

        const nodeKeys = new Set(nodesData.map(n => `${n.type}:${n.id}`));
        const filteredLinks = linksData.filter(
          link => nodeKeys.has(link.source) && nodeKeys.has(link.target)
        );

        setNodes(nodesData);
        setLinks(filteredLinks);
        setStats(statsData);

        console.log(
          `[useGraph] Loaded ${nodesData.length} nodes and ${filteredLinks.length} links`
        );

        if (nodesData.length >= nodeLimit) {
          console.warn(
            `[useGraph] Graph data truncated at ${nodeLimit} nodes. Some nodes may not be visible.`
          );
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch graph data';
        setError(errorMessage);
        console.error('[useGraph] Error fetching graph:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchGraph();
  }, [enabled, nodeLimit, retryCount]);

  return {
    nodes,
    links,
    stats,
    loading,
    error,
    refetch,
  };
}
