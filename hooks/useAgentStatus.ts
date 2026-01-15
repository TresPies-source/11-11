import { useState, useEffect, useCallback, useMemo } from "react";
import { useActivity } from "./useActivity";
import { AgentStatusInfo, AgentStatusMap, AgentStatusType } from "@/lib/types";

const POLLING_INTERVAL = 2500;

const AGENT_IDS = ['supervisor', 'dojo', 'librarian', 'debugger', 'builder'] as const;

export interface UseAgentStatusReturn {
  agentStatuses: AgentStatusMap;
  fetchAgentStatus: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

function mapActivityStatusToAgentStatus(activityStatus: string): AgentStatusType {
  switch (activityStatus) {
    case 'active':
      return 'working';
    case 'waiting':
      return 'thinking';
    case 'error':
      return 'error';
    case 'idle':
    case 'complete':
    default:
      return 'idle';
  }
}

function deriveAgentStatusFromActivity(
  agentId: string,
  currentActivity: any,
  history: any[]
): AgentStatusInfo {
  if (currentActivity && currentActivity.agent_id === agentId) {
    return {
      agentId: agentId as AgentStatusInfo['agentId'],
      status: mapActivityStatusToAgentStatus(currentActivity.status),
      message: currentActivity.message,
      lastActive: currentActivity.started_at,
      progress: currentActivity.progress,
    };
  }

  const lastActivity = [...history]
    .reverse()
    .find((activity) => activity.agent_id === agentId);

  if (lastActivity) {
    return {
      agentId: agentId as AgentStatusInfo['agentId'],
      status: 'idle',
      message: lastActivity.message,
      lastActive: lastActivity.ended_at || lastActivity.started_at,
    };
  }

  return {
    agentId: agentId as AgentStatusInfo['agentId'],
    status: 'idle',
  };
}

export function useAgentStatus(): UseAgentStatusReturn {
  const { current, history } = useActivity();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatuses, setApiStatuses] = useState<Partial<AgentStatusMap>>({});

  const fetchAgentStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/agents/status');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch agent status: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.agents && Array.isArray(data.agents)) {
        const statusMap: Partial<AgentStatusMap> = {};
        
        data.agents.forEach((agent: any) => {
          const agentId = agent.agent_id as AgentStatusInfo['agentId'];
          if (AGENT_IDS.includes(agentId)) {
            statusMap[agentId] = {
              agentId,
              status: agent.status || 'idle',
              message: agent.message,
              lastActive: agent.last_active,
              progress: agent.progress,
            };
          }
        });

        setApiStatuses(statusMap);
      }
    } catch (err) {
      console.warn('[useAgentStatus] API fetch failed, using derived statuses:', err);
      setApiStatuses({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgentStatus();

    const intervalId = setInterval(fetchAgentStatus, POLLING_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchAgentStatus]);

  const agentStatuses = useMemo<AgentStatusMap>(() => {
    const derivedStatuses: AgentStatusMap = {
      supervisor: deriveAgentStatusFromActivity('supervisor', current, history),
      dojo: deriveAgentStatusFromActivity('dojo', current, history),
      librarian: deriveAgentStatusFromActivity('librarian', current, history),
      debugger: deriveAgentStatusFromActivity('debugger', current, history),
      builder: deriveAgentStatusFromActivity('builder', current, history),
    };

    return {
      supervisor: apiStatuses.supervisor || derivedStatuses.supervisor,
      dojo: apiStatuses.dojo || derivedStatuses.dojo,
      librarian: apiStatuses.librarian || derivedStatuses.librarian,
      debugger: apiStatuses.debugger || derivedStatuses.debugger,
      builder: apiStatuses.builder || derivedStatuses.builder,
    };
  }, [current, history, apiStatuses]);

  return {
    agentStatuses,
    fetchAgentStatus,
    isLoading,
    error,
  };
}
