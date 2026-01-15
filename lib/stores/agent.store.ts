import { create } from 'zustand';
import { HarnessEvent } from '@/lib/harness/types';
import { AgentStatusMap, AgentStatusInfo } from '@/lib/types';

interface AgentActivityState {
  runId: string | null;
  isRunning: boolean;
  statuses: AgentStatusMap;
  trace: HarnessEvent[];
  cost: number;
  duration: number;
  error: string | null;
  startedAt: number | null;

  startRun: (runId?: string) => void;
  addTraceEvent: (event: HarnessEvent) => void;
  endRun: () => void;
  setError: (error: string) => void;
}

const createDefaultStatuses = (): AgentStatusMap => ({
  supervisor: {
    agentId: 'supervisor',
    status: 'idle',
    message: 'Ready',
    progress: 0,
  },
  dojo: {
    agentId: 'dojo',
    status: 'idle',
    message: 'Ready',
    progress: 0,
  },
  librarian: {
    agentId: 'librarian',
    status: 'idle',
    message: 'Ready',
    progress: 0,
  },
  debugger: {
    agentId: 'debugger',
    status: 'idle',
    message: 'Ready',
    progress: 0,
  },
  builder: {
    agentId: 'builder',
    status: 'idle',
    message: 'Ready',
    progress: 0,
  },
});

export const useAgentStore = create<AgentActivityState>((set) => ({
  runId: null,
  isRunning: false,
  statuses: createDefaultStatuses(),
  trace: [],
  cost: 0,
  duration: 0,
  error: null,
  startedAt: null,

  startRun: (runId) => set({
    runId: runId || crypto.randomUUID(),
    isRunning: true,
    statuses: createDefaultStatuses(),
    trace: [],
    cost: 0,
    duration: 0,
    error: null,
    startedAt: Date.now(),
  }),

  addTraceEvent: (event) => set((state) => {
    const newTrace = [...state.trace, event];
    if (newTrace.length > 1000) {
      newTrace.shift();
    }

    const newCost = state.cost + (event.metadata?.cost_usd || 0);
    
    const newDuration = state.startedAt 
      ? (Date.now() - state.startedAt) / 1000 
      : 0;

    const extractAgentId = (event: HarnessEvent): string | null => {
      return event.metadata?.agent_id || 
             event.inputs?.agent_id || 
             event.outputs?.agent_id || 
             null;
    };

    const newStatuses = { ...state.statuses };

    switch (event.event_type) {
      case 'SESSION_START':
        newStatuses.supervisor = {
          ...newStatuses.supervisor,
          status: 'working',
          message: 'Routing query...',
        };
        break;

      case 'AGENT_ROUTING':
        newStatuses.supervisor = {
          ...newStatuses.supervisor,
          status: 'working',
          message: event.inputs?.message || 'Routing to agent...',
        };
        break;

      case 'AGENT_HANDOFF': {
        const targetAgentId = event.outputs?.agent_id;
        if (targetAgentId && targetAgentId in newStatuses) {
          newStatuses[targetAgentId as keyof AgentStatusMap] = {
            ...newStatuses[targetAgentId as keyof AgentStatusMap],
            status: 'working',
            message: 'Receiving handoff...',
            progress: 0,
          };
        }
        break;
      }

      case 'AGENT_ACTIVITY_START': {
        const agentId = extractAgentId(event);
        if (agentId && agentId in newStatuses) {
          newStatuses[agentId as keyof AgentStatusMap] = {
            ...newStatuses[agentId as keyof AgentStatusMap],
            status: 'working',
            message: event.inputs?.message || 'Starting activity...',
            progress: 0,
          };
        }
        break;
      }

      case 'AGENT_ACTIVITY_PROGRESS': {
        const agentId = extractAgentId(event);
        if (agentId && agentId in newStatuses) {
          newStatuses[agentId as keyof AgentStatusMap] = {
            ...newStatuses[agentId as keyof AgentStatusMap],
            status: 'working',
            message: event.inputs?.message || 'In progress...',
            progress: event.metadata?.progress ?? newStatuses[agentId as keyof AgentStatusMap].progress,
          };
        }
        break;
      }

      case 'AGENT_ACTIVITY_COMPLETE': {
        const agentId = extractAgentId(event);
        if (agentId && agentId in newStatuses) {
          newStatuses[agentId as keyof AgentStatusMap] = {
            ...newStatuses[agentId as keyof AgentStatusMap],
            status: 'idle',
            message: 'Task complete',
            progress: 100,
          };
        }
        break;
      }

      case 'TOOL_INVOCATION': {
        const agentId = extractAgentId(event);
        const toolName = event.inputs?.tool || event.metadata?.tool || 'tool';
        if (agentId && agentId in newStatuses) {
          newStatuses[agentId as keyof AgentStatusMap] = {
            ...newStatuses[agentId as keyof AgentStatusMap],
            status: 'working',
            message: `Using ${toolName}...`,
          };
        }
        break;
      }

      case 'ERROR': {
        const agentId = extractAgentId(event) || 'supervisor';
        if (agentId in newStatuses) {
          newStatuses[agentId as keyof AgentStatusMap] = {
            ...newStatuses[agentId as keyof AgentStatusMap],
            status: 'error',
            message: event.metadata?.error_message || 'An error occurred',
          };
        }
        break;
      }

      case 'SESSION_END':
        Object.keys(newStatuses).forEach((key) => {
          newStatuses[key as keyof AgentStatusMap] = {
            ...newStatuses[key as keyof AgentStatusMap],
            status: 'idle',
            message: 'Run complete',
          };
        });
        break;
    }

    return {
      trace: newTrace,
      cost: newCost,
      duration: newDuration,
      statuses: newStatuses,
    };
  }),

  endRun: () => set({
    isRunning: false,
  }),

  setError: (error) => set((state) => ({
    error,
    isRunning: false,
  })),
}));
