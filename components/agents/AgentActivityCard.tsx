"use client";

import React from "react";
import { StatusDot } from "@/components/ui/StatusDot";
import { cn } from "@/lib/utils";

interface AgentActivityCardProps {
  agent: {
    id: string;
    name: string;
    icon: string;
    status: 'idle' | 'working' | 'error' | 'success';
    task?: string;
  };
  isCollapsed: boolean;
}

const statusTextMap = {
  idle: 'Idle',
  working: 'Working',
  error: 'Error',
  success: 'Success',
};

export function AgentActivityCard({ agent, isCollapsed }: AgentActivityCardProps) {
  if (isCollapsed) {
    return (
      <div
        className="flex justify-center items-center p-2 hover:bg-bg-tertiary transition-colors rounded-lg cursor-pointer relative"
        title={agent.name}
      >
        <div className="relative">
          <span className="text-2xl" aria-hidden="true">
            {agent.icon}
          </span>
          <div className="absolute -bottom-0.5 -right-0.5">
            <StatusDot status={agent.status} size="md" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg bg-bg-primary border border-bg-tertiary">
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <span className="text-2xl" aria-hidden="true">
            {agent.icon}
          </span>
          <div className="absolute -bottom-0.5 -right-0.5">
            <StatusDot status={agent.status} size="md" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-medium text-text-primary">
              {agent.name}
            </h3>
          </div>
          
          <div className="text-sm text-text-secondary">
            {statusTextMap[agent.status]}
          </div>
          
          {agent.task && (
            <div className="text-sm text-text-tertiary mt-1 truncate" title={agent.task}>
              {agent.task}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
