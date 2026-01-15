"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { AgentCard } from "@/components/agent/AgentCard";
import { SystemInfo } from "@/components/agents/SystemInfo";
import { ActivityLog } from "@/components/agents/ActivityLog";
import { useAgentStore } from "@/lib/stores/agent.store";
import { HarnessEvent } from "@/lib/harness/types";

const AGENT_METADATA = {
  supervisor: { name: "Supervisor", icon: "👔" },
  dojo: { name: "Dojo", icon: "🥋" },
  librarian: { name: "Librarian", icon: "📚" },
  debugger: { name: "Debugger", icon: "🐛" },
} as const;

const AGENT_ORDER: Array<keyof typeof AGENT_METADATA> = ['supervisor', 'dojo', 'librarian', 'debugger'];

const extractAgentFromEvent = (event: HarnessEvent): 'supervisor' | 'dojo' | 'librarian' | 'debugger' | undefined => {
  const agentId = event.metadata?.agent_id || event.inputs?.agent_id || event.outputs?.agent_id;
  if (agentId && ['supervisor', 'dojo', 'librarian', 'debugger'].includes(agentId)) {
    return agentId as 'supervisor' | 'dojo' | 'librarian' | 'debugger';
  }
  return undefined;
};

const extractMessageFromEvent = (event: HarnessEvent): string => {
  return event.inputs?.message || event.metadata?.message || event.event_type;
};

interface AgentActivityPanelProps {
  onToggle?: () => void;
}

export function AgentActivityPanel({ onToggle }: AgentActivityPanelProps = {}) {
  const { statuses, cost, duration, trace, isRunning } = useAgentStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState(320);
  
  useEffect(() => {
    if (!panelRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setPanelWidth(entry.contentRect.width);
      }
    });
    
    observer.observe(panelRef.current);
    setPanelWidth(panelRef.current.offsetWidth);
    
    return () => observer.disconnect();
  }, []);
  
  const isCollapsed = panelWidth < 150;

  return (
    <div 
      ref={panelRef}
      className="h-full flex flex-col bg-bg-secondary border-l border-bg-tertiary w-full"
    >
      {!isCollapsed && (
        <div className="flex items-center justify-between p-6 border-b border-bg-tertiary">
          <h2 className="text-lg font-medium text-text-primary">Agent Activity</h2>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1.5 rounded-md hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Collapse Agent Activity Panel"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
      {isCollapsed && onToggle && (
        <div className="flex items-center justify-center p-2 border-b border-bg-tertiary">
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Expand Agent Activity Panel"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {AGENT_ORDER.map((agentId) => {
          const metadata = AGENT_METADATA[agentId];
          const status = statuses[agentId];
          
          return (
            <AgentCard
              key={agentId}
              agentId={agentId}
              name={metadata.name}
              icon={metadata.icon}
              status={status.status}
              message={status.message}
              progress={status.progress}
              isCollapsed={isCollapsed}
            />
          );
        })}
      </div>

      <div className={`border-t border-bg-tertiary ${isCollapsed ? 'p-2' : 'p-6'} space-y-4`}>
        <SystemInfo 
          cost={`$${cost.toFixed(4)}`} 
          duration={`${duration.toFixed(1)}s`} 
          isCollapsed={isCollapsed} 
        />
        <div className={`border-t border-bg-tertiary ${isCollapsed ? 'pt-2' : 'pt-4'}`}>
          <ActivityLog 
            activities={trace.slice(-5).reverse().map(event => ({
              agent: extractAgentFromEvent(event),
              message: extractMessageFromEvent(event),
            }))}
            isCollapsed={isCollapsed} 
          />
        </div>
      </div>
    </div>
  );
}
