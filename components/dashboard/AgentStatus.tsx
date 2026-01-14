"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { AgentStatusIndicator } from "./AgentStatusIndicator";

const AGENT_ORDER = ['supervisor', 'dojo', 'librarian', 'debugger'] as const;

export const AgentStatus = React.memo(function AgentStatus() {
  const { agentStatuses, isLoading } = useAgentStatus();

  return (
    <Card>
      <h2 className="text-2xl font-semibold mb-6">Agent Status</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {AGENT_ORDER.map((agentId) => {
          const status = agentStatuses[agentId];
          return (
            <AgentStatusIndicator
              key={agentId}
              agentId={status.agentId}
              status={status.status}
              message={status.message}
              lastActive={status.lastActive}
              progress={status.progress}
            />
          );
        })}
      </div>
      {isLoading && (
        <div className="sr-only" aria-live="polite">
          Loading agent statuses...
        </div>
      )}
    </Card>
  );
});
