"use client";

import React from "react";
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
  const { toggleAgentPanel } = useWorkbenchStore();

  return (
    <div className="h-full flex flex-col bg-bg-secondary border-l border-bg-tertiary w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-bg-tertiary">
        <h2 className="text-lg font-medium text-text-primary">Agent Activity</h2>
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

      {/* Scrollable Agent Cards Section */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {MOCK_AGENTS.map((agent) => (
          <AgentActivityCard
            key={agent.id}
            agent={agent}
            isCollapsed={false}
          />
        ))}
      </div>

      {/* Footer Section */}
      <div className="border-t border-bg-tertiary p-6 space-y-4">
        <SystemInfo />
        <div className="border-t border-bg-tertiary pt-4">
          <ActivityLog />
        </div>
      </div>
    </div>
  );
}
