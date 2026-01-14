"use client";

import React from "react";
import { Bot, Brain, Search, Bug, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

type AgentId = 'supervisor' | 'dojo' | 'librarian' | 'debugger';

interface AgentAvatarProps {
  agentId: AgentId;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  isActive?: boolean;
  className?: string;
}

const AGENT_METADATA = {
  supervisor: {
    name: 'Supervisor',
    icon: GitBranch,
    color: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      ring: 'ring-blue-500 dark:ring-blue-400',
    },
  },
  dojo: {
    name: 'Dojo',
    icon: Brain,
    color: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      ring: 'ring-blue-500 dark:ring-blue-400',
    },
  },
  librarian: {
    name: 'Librarian',
    icon: Search,
    color: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      ring: 'ring-green-500 dark:ring-green-400',
    },
  },
  debugger: {
    name: 'Debugger',
    icon: Bug,
    color: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-600 dark:text-amber-400',
      ring: 'ring-amber-500 dark:ring-amber-400',
    },
  },
} as const;

const SIZE_CLASSES = {
  sm: {
    container: 'w-8 h-8',
    icon: 'w-4 h-4',
    text: 'text-sm',
  },
  md: {
    container: 'w-12 h-12',
    icon: 'w-6 h-6',
    text: 'text-base',
  },
  lg: {
    container: 'w-16 h-16',
    icon: 'w-8 h-8',
    text: 'text-lg',
  },
} as const;

export const AgentAvatar = React.memo(function AgentAvatar({ 
  agentId, 
  size = 'md', 
  showName = false, 
  isActive = false,
  className,
}: AgentAvatarProps) {
  const agent = AGENT_METADATA[agentId] || AGENT_METADATA.supervisor;
  const Icon = agent.icon;
  const sizeConfig = SIZE_CLASSES[size];

  return (
    <div 
      className={cn("flex items-center gap-2", className)}
      role="img"
      aria-label={`${agent.name} agent${isActive ? ' (active)' : ''}`}
    >
      <div
        className={cn(
          sizeConfig.container,
          'rounded-full flex items-center justify-center transition-all duration-200',
          agent.color.bg,
          isActive && [
            'ring-2 ring-offset-2 dark:ring-offset-gray-900',
            agent.color.ring,
            'animate-pulse',
          ]
        )}
      >
        <Icon className={cn(sizeConfig.icon, agent.color.text)} aria-hidden="true" />
      </div>
      {showName && (
        <span 
          className={cn(
            'font-medium text-gray-900 dark:text-gray-100',
            sizeConfig.text
          )}
        >
          {agent.name}
        </span>
      )}
    </div>
  );
});
