"use client";

import { StatusDot } from "@/components/ui/StatusDot";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  agentId: 'supervisor' | 'dojo' | 'librarian' | 'debugger';
  name: string;
  icon: string;
  status: 'idle' | 'thinking' | 'working' | 'error';
  message?: string;
  progress?: number;
  isCollapsed: boolean;
}

const AGENT_COLORS = {
  supervisor: 'bg-supervisor/10 border-supervisor/25',
  dojo: 'bg-dojo/10 border-dojo/25',
  librarian: 'bg-librarian/10 border-librarian/25',
  debugger: 'bg-debugger/10 border-debugger/25',
} as const;

const STATUS_LABELS = {
  idle: 'Idle',
  thinking: 'Thinking',
  working: 'Working',
  error: 'Error',
} as const;

const mapStatusToDot = (status: AgentCardProps['status']): 'idle' | 'working' | 'error' | 'default' => {
  if (status === 'thinking') return 'working';
  if (status === 'error') return 'error';
  if (status === 'working') return 'working';
  return 'idle';
};

export function AgentCard({ 
  agentId, 
  name, 
  icon, 
  status, 
  message, 
  progress, 
  isCollapsed 
}: AgentCardProps) {
  const dotStatus = mapStatusToDot(status);
  
  if (isCollapsed) {
    return (
      <div 
        className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-bg-tertiary/50 transition-colors cursor-pointer"
        title={`${name} - ${STATUS_LABELS[status]}`}
        aria-label={`${name} agent is ${STATUS_LABELS[status].toLowerCase()}`}
      >
        <div className="relative">
          <span className="text-2xl" aria-hidden="true">
            {icon}
          </span>
          <div className="absolute -bottom-1 -right-1">
            <StatusDot status={dotStatus} size="md" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "p-3 rounded-lg border transition-all duration-fast",
        AGENT_COLORS[agentId]
      )}
      role="article"
      aria-label={`${name} agent card`}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <span className="text-2xl" aria-hidden="true">
            {icon}
          </span>
          <div className="absolute -bottom-1 -right-1">
            <StatusDot status={dotStatus} size="md" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-medium text-text-primary">
              {name}
            </h3>
          </div>
          
          <div className="text-sm text-text-secondary mb-1">
            {STATUS_LABELS[status]}
          </div>
          
          {message && (
            <div 
              className="text-sm text-text-tertiary truncate" 
              title={message}
            >
              {message}
            </div>
          )}
          
          {progress !== undefined && progress > 0 && (
            <div className="mt-2">
              <div className="w-full bg-bg-tertiary rounded-full h-1.5 overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-normal ease-out",
                    `bg-${agentId}`
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${name} progress: ${progress}%`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
