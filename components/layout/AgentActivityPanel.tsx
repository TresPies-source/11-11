"use client";

import React, { useRef, useState, useEffect } from "react";
import { AgentCard } from "@/components/agent/AgentCard";
import { SystemInfo } from "@/components/agents/SystemInfo";
import { ActivityLog } from "@/components/agents/ActivityLog";
import { useAgentStatus } from "@/hooks/useAgentStatus";

const AGENT_METADATA = {
  supervisor: { name: "Supervisor", icon: "👔" },
  dojo: { name: "Dojo", icon: "🥋" },
  librarian: { name: "Librarian", icon: "📚" },
  debugger: { name: "Debugger", icon: "🐛" },
} as const;

const AGENT_ORDER: Array<keyof typeof AGENT_METADATA> = ['supervisor', 'dojo', 'librarian', 'debugger'];

export function AgentActivityPanel() {
  const { agentStatuses } = useAgentStatus();
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
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {AGENT_ORDER.map((agentId) => {
          const metadata = AGENT_METADATA[agentId];
          const status = agentStatuses[agentId];
          
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
        <SystemInfo isCollapsed={isCollapsed} />
        <div className={`border-t border-bg-tertiary ${isCollapsed ? 'pt-2' : 'pt-4'}`}>
          <ActivityLog isCollapsed={isCollapsed} />
        </div>
      </div>
    </div>
  );
}
