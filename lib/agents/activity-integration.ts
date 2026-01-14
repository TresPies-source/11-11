import { useActivity } from '@/hooks/useActivity';
import type { AgentActivity } from '@/lib/types';

export interface ActivityTrackingConfig {
  agent_id: string;
  initial_message: string;
  estimated_duration?: number;
  progress_updates?: Array<{
    delay_ms: number;
    progress: number;
    message: string;
  }>;
  complete_message?: (result: any) => string;
  error_message?: (error: Error) => string;
  auto_clear_delay?: number; // ms to wait before clearing activity (default: 1000)
}

export interface ActivityTrackingCallbacks {
  onStart?: () => void;
  onProgress?: (progress: number, message: string) => void;
  onComplete?: (result: any) => void;
  onError?: (error: Error) => void;
}

export interface RoutingActivityCallbacks {
  onStart?: () => void;
  onProgress?: (progress: number, message: string) => void;
  onComplete?: (agentId: string, agentName: string) => void;
  onError?: (error: Error) => void;
}

export interface LibrarianActivityCallbacks {
  onStart?: () => void;
  onProgress?: (progress: number, message: string) => void;
  onComplete?: (resultCount: number) => void;
  onError?: (error: Error) => void;
}

/**
 * Generic higher-order function for tracking agent activity.
 * Wraps any async operation with automatic activity state management.
 * 
 * @example
 * ```tsx
 * const { withActivityTracking } = useActivityTracking();
 * 
 * const result = await withActivityTracking(
 *   async () => {
 *     return await fetch('/api/agents/dojo', { ... });
 *   },
 *   {
 *     agent_id: 'dojo',
 *     initial_message: 'Reflecting on perspectives...',
 *     estimated_duration: 3,
 *     progress_updates: [
 *       { delay_ms: 500, progress: 30, message: 'Analyzing context...' },
 *       { delay_ms: 1500, progress: 70, message: 'Synthesizing insights...' },
 *     ],
 *     complete_message: (result) => `Generated ${result.insights.length} insights`,
 *     error_message: (error) => `Reflection failed: ${error.message}`,
 *   }
 * );
 * ```
 */
export function useActivityTracking() {
  const { setActivity, updateActivity, clearActivity, addToHistory } = useActivity();

  const withActivityTracking = async <T>(
    operation: () => Promise<T>,
    config: ActivityTrackingConfig,
    callbacks?: ActivityTrackingCallbacks
  ): Promise<T> => {
    const startTime = Date.now();
    const autoClearDelay = config.auto_clear_delay ?? 1000;

    // Start activity
    const initialActivity: AgentActivity = {
      agent_id: config.agent_id,
      status: 'active',
      message: config.initial_message,
      progress: config.progress_updates ? 0 : undefined,
      started_at: new Date().toISOString(),
      estimated_duration: config.estimated_duration,
    };

    setActivity(initialActivity);
    callbacks?.onStart?.();

    // Schedule progress updates
    const timeouts: NodeJS.Timeout[] = [];
    if (config.progress_updates) {
      config.progress_updates.forEach((update) => {
        const timeout = setTimeout(() => {
          updateActivity({
            progress: update.progress,
            message: update.message,
          });
          callbacks?.onProgress?.(update.progress, update.message);
        }, update.delay_ms);
        timeouts.push(timeout);
      });
    }

    try {
      // Execute operation
      const result = await operation();
      const duration = (Date.now() - startTime) / 1000;

      // Clear pending timeouts
      timeouts.forEach(clearTimeout);

      // Complete activity
      const completeMessage = config.complete_message
        ? config.complete_message(result)
        : 'Operation complete';

      updateActivity({
        status: 'complete',
        progress: config.progress_updates ? 100 : undefined,
        message: completeMessage,
      });

      callbacks?.onComplete?.(result);

      // Add to history
      addToHistory({
        agent_id: config.agent_id,
        status: 'complete',
        message: `${completeMessage} (${duration.toFixed(1)}s)`,
        started_at: new Date(Date.now() - duration * 1000).toISOString(),
      });

      // Auto-clear after delay
      setTimeout(() => {
        clearActivity();
      }, autoClearDelay);

      return result;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;

      // Clear pending timeouts
      timeouts.forEach(clearTimeout);

      // Error activity
      const errorMessage = config.error_message
        ? config.error_message(error as Error)
        : 'Operation failed';

      updateActivity({
        status: 'error',
        message: errorMessage,
      });

      callbacks?.onError?.(error as Error);

      // Add to history
      addToHistory({
        agent_id: config.agent_id,
        status: 'error',
        message: `${errorMessage} (${duration.toFixed(1)}s)`,
        started_at: new Date(Date.now() - duration * 1000).toISOString(),
      });

      // Auto-clear after longer delay for errors
      setTimeout(() => {
        clearActivity();
      }, autoClearDelay * 2);

      throw error;
    }
  };

  return { withActivityTracking };
}

export function useRoutingActivity() {
  const { setActivity, updateActivity, clearActivity, addToHistory } = useActivity();

  const trackRoutingActivity = async <T>(
    routingFn: () => Promise<T>,
    callbacks?: RoutingActivityCallbacks
  ): Promise<T> => {
    const startTime = Date.now();

    setActivity({
      agent_id: 'supervisor',
      status: 'active',
      message: 'Analyzing query and selecting agent...',
      progress: 0,
      started_at: new Date().toISOString(),
      estimated_duration: 2,
    });

    callbacks?.onStart?.();

    try {
      setTimeout(() => {
        updateActivity({
          progress: 50,
          message: 'Evaluating agent selection...',
        });
        callbacks?.onProgress?.(50, 'Evaluating agent selection...');
      }, 500);

      const result = await routingFn();

      const duration = (Date.now() - startTime) / 1000;

      if (typeof result === 'object' && result !== null && 'agent_id' in result && 'agent_name' in result) {
        const routingResult = result as { agent_id: string; agent_name: string };
        
        updateActivity({
          status: 'complete',
          progress: 100,
          message: `Routed to ${routingResult.agent_name}`,
        });

        callbacks?.onComplete?.(routingResult.agent_id, routingResult.agent_name);

        addToHistory({
          agent_id: 'supervisor',
          status: 'complete',
          message: `Routed to ${routingResult.agent_name} (${duration.toFixed(1)}s)`,
          started_at: new Date(Date.now() - duration * 1000).toISOString(),
        });
      } else {
        updateActivity({
          status: 'complete',
          progress: 100,
          message: 'Routing complete',
        });

        callbacks?.onComplete?.('', '');

        addToHistory({
          agent_id: 'supervisor',
          status: 'complete',
          message: `Routing complete (${duration.toFixed(1)}s)`,
          started_at: new Date(Date.now() - duration * 1000).toISOString(),
        });
      }

      setTimeout(() => {
        clearActivity();
      }, 1000);

      return result;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;

      updateActivity({
        status: 'error',
        message: 'Routing failed',
      });

      callbacks?.onError?.(error as Error);

      addToHistory({
        agent_id: 'supervisor',
        status: 'error',
        message: `Routing failed: ${error instanceof Error ? error.message : 'Unknown error'} (${duration.toFixed(1)}s)`,
        started_at: new Date(Date.now() - duration * 1000).toISOString(),
      });

      setTimeout(() => {
        clearActivity();
      }, 2000);

      throw error;
    }
  };

  return { trackRoutingActivity };
}

export function useLibrarianActivity() {
  const { setActivity, updateActivity, clearActivity, addToHistory } = useActivity();

  const trackLibrarianActivity = async <T>(
    searchFn: () => Promise<T>,
    callbacks?: LibrarianActivityCallbacks
  ): Promise<T> => {
    const startTime = Date.now();

    setActivity({
      agent_id: 'librarian',
      status: 'active',
      message: 'Searching library for relevant prompts...',
      progress: 0,
      started_at: new Date().toISOString(),
      estimated_duration: 5,
    });

    callbacks?.onStart?.();

    try {
      // Progress: Generating query embedding (20%)
      setTimeout(() => {
        updateActivity({
          progress: 20,
          message: 'Generating query embedding...',
        });
        callbacks?.onProgress?.(20, 'Generating query embedding...');
      }, 300);

      // Progress: Searching database (50%)
      setTimeout(() => {
        updateActivity({
          progress: 50,
          message: 'Searching database...',
        });
        callbacks?.onProgress?.(50, 'Searching database...');
      }, 1000);

      // Progress: Ranking results (80%)
      setTimeout(() => {
        updateActivity({
          progress: 80,
          message: 'Ranking results...',
        });
        callbacks?.onProgress?.(80, 'Ranking results...');
      }, 2000);

      const result = await searchFn();

      const duration = (Date.now() - startTime) / 1000;

      // Extract result count if available
      let resultCount = 0;
      if (typeof result === 'object' && result !== null && 'count' in result) {
        resultCount = (result as { count: number }).count;
      }

      updateActivity({
        status: 'complete',
        progress: 100,
        message: `Found ${resultCount} result${resultCount !== 1 ? 's' : ''}`,
      });

      callbacks?.onComplete?.(resultCount);

      addToHistory({
        agent_id: 'librarian',
        status: 'complete',
        message: `Found ${resultCount} result${resultCount !== 1 ? 's' : ''} (${duration.toFixed(1)}s)`,
        started_at: new Date(Date.now() - duration * 1000).toISOString(),
      });

      setTimeout(() => {
        clearActivity();
      }, 1000);

      return result;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;

      updateActivity({
        status: 'error',
        message: 'Search failed',
      });

      callbacks?.onError?.(error as Error);

      addToHistory({
        agent_id: 'librarian',
        status: 'error',
        message: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'} (${duration.toFixed(1)}s)`,
        started_at: new Date(Date.now() - duration * 1000).toISOString(),
      });

      setTimeout(() => {
        clearActivity();
      }, 2000);

      throw error;
    }
  };

  return { trackLibrarianActivity };
}
