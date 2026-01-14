"use client";

import React, { useState } from "react";
import { AgentActivityCard } from "@/components/agents/AgentActivityCard";
import { SystemInfo } from "@/components/agents/SystemInfo";
import { ActivityLog } from "@/components/agents/ActivityLog";
import { useWorkbenchStore } from "@/lib/stores/workbench.store";
import { cn } from "@/lib/utils";

const MOCK_AGENTS = [
  {
    id: "agent-1",
    name: "Code Analyzer",
    icon: "🔍",
    status: "working" as const,
    task: "Analyzing dependencies in package.json",
  },
  {
    id: "agent-2",
    name: "Test Runner",
    icon: "🧪",
    status: "idle" as const,
    task: undefined,
  },
  {
    id: "agent-3",
    name: "Build Assistant",
    icon: "🔨",
    status: "success" as const,
    task: "Build completed successfully",
  },
];

export function AgentActivityPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { toggleAgentPanel } = useWorkbenchStore();

  return (
    <div
      className={cn(
        "h-full flex flex-col bg-bg-secondary border-l border-bg-tertiary transition-all duration-300",
        isCollapsed ? "w-0 border-0" : "w-full"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center justify-between p-6 border-b border-bg-tertiary", isCollapsed && "flex-col gap-2 p-4")}>
        {!isCollapsed && (
          <h2 className="text-lg font-medium text-text-primary">Agent Activity</h2>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors text-text-secondary hover:text-text-primary"
            aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
            title={isCollapsed ? "Expand panel" : "Collapse panel"}
          >
            {isCollapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            )}
          </button>
          <button
            onClick={toggleAgentPanel}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors text-text-secondary hover:text-text-primary"
            aria-label="Close panel"
            title="Close panel"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Agent Cards Section */}
      <div className={cn("flex-1 overflow-y-auto p-6 space-y-3", isCollapsed && "px-2")}>
        {MOCK_AGENTS.map((agent) => (
          <AgentActivityCard
            key={agent.id}
            agent={agent}
            isCollapsed={isCollapsed}
          />
        ))}
      </div>

      {/* Footer Section */}
      {!isCollapsed && (
        <div className="border-t border-bg-tertiary p-6 space-y-4">
          <SystemInfo />
          <div className="border-t border-bg-tertiary pt-4">
            <ActivityLog />
          </div>
        </div>
      )}
    </div>
  );
}
