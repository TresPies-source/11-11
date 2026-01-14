import { existsSync } from 'fs';
import { join } from 'path';
import type { AgentId } from './types';

export type AgentStatus = 'online' | 'offline' | 'deprecated';

const AGENT_HANDLER_MAP: Record<string, string> = {
  'librarian': 'librarian-handler.ts',
  'dojo': 'dojo-handler.ts',
  'debugger': 'debugger-handler.ts',
};

export function getAgentStatus(agentId: string): AgentStatus {
  const handlerFile = AGENT_HANDLER_MAP[agentId];
  
  if (!handlerFile) {
    return 'offline';
  }
  
  const handlerPath = join(process.cwd(), 'lib', 'agents', handlerFile);
  
  try {
    return existsSync(handlerPath) ? 'online' : 'offline';
  } catch {
    return 'offline';
  }
}

export function getAllAgentStatuses(agentIds: string[]): Record<string, AgentStatus> {
  const statuses: Record<string, AgentStatus> = {};
  
  for (const agentId of agentIds) {
    statuses[agentId] = getAgentStatus(agentId);
  }
  
  return statuses;
}
