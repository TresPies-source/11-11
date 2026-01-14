'use client';

import React from 'react';
import { useActivity } from '@/hooks/useActivity';
import { AgentAvatar } from './AgentAvatar';
import { ArrowRight } from 'lucide-react';

type AgentId = 'supervisor' | 'dojo' | 'librarian' | 'debugger';

export const HandoffVisualization = React.memo(function HandoffVisualization() {
  const { history } = useActivity();

  // Extract agent path from history (completed activities only)
  const agentPath = React.useMemo(
    () => history
      .filter((a) => a.status === 'complete')
      .map((a) => a.agent_id)
      .filter((id, i, arr) => i === 0 || id !== arr[i - 1]), // Remove consecutive duplicates
    [history]
  );

  // Hide if path length < 2 (no handoffs)
  if (agentPath.length < 2) {
    return null;
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Agent Path
      </h3>

      <div className="flex items-center gap-2 flex-wrap">
        {agentPath.map((agentId, i) => (
          <div key={`${agentId}-${i}`} className="flex items-center gap-2">
            <AgentAvatar agentId={agentId as AgentId} size="sm" showName />
            {i < agentPath.length - 1 && (
              <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
