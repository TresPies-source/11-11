"use client";

import React from "react";
import { Bot, Brain, Search, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import { Agent } from "@/lib/agents/types";

interface AgentStatusBadgeProps {
  agent: Agent;
  className?: string;
}

const AGENT_ICONS = {
  dojo: Brain,
  librarian: Search,
  debugger: Bug,
} as const;

const AGENT_COLORS = {
  dojo: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  librarian: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  debugger: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
} as const;

export function AgentStatusBadge({ agent, className }: AgentStatusBadgeProps) {
  const Icon = AGENT_ICONS[agent.id as keyof typeof AGENT_ICONS] || Bot;
  const colorClass = AGENT_COLORS[agent.id as keyof typeof AGENT_COLORS] || 
    "bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        colorClass,
        className
      )}
      title={agent.description}
    >
      <Icon className="w-3 h-3" />
      <span>{agent.name}</span>
    </div>
  );
}
