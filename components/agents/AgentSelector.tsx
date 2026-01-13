"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Search, Bug, Zap, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Agent } from "@/lib/agents/types";
import { ANIMATION_EASE } from "@/lib/constants";

interface AgentSelectorProps {
  selectedAgentId: string | "auto";
  onAgentChange: (agentId: string | "auto") => void;
  availableAgents: Agent[];
  className?: string;
}

const AGENT_ICONS = {
  dojo: Brain,
  librarian: Search,
  debugger: Bug,
  auto: Zap,
} as const;

const AGENT_COLORS = {
  dojo: "text-blue-600 dark:text-blue-400",
  librarian: "text-green-600 dark:text-green-400",
  debugger: "text-amber-600 dark:text-amber-400",
  auto: "text-purple-600 dark:text-purple-400",
} as const;

export function AgentSelector({
  selectedAgentId,
  onAgentChange,
  availableAgents,
  className,
}: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>(availableAgents);

  useEffect(() => {
    if (availableAgents.length > 0) {
      setAgents(availableAgents);
    } else {
      const fetchAgents = async () => {
        try {
          const response = await fetch("/api/supervisor/agents");
          if (response.ok) {
            const data = await response.json();
            setAgents(data.agents || []);
          }
        } catch (error) {
          console.error("Failed to fetch agents:", error);
        }
      };

      fetchAgents();
    }
  }, [availableAgents]);

  const autoRouteAgent = { id: "auto", name: "Auto-Route", description: "Automatically route to the best agent" };
  
  const selectedAgent =
    selectedAgentId === "auto"
      ? autoRouteAgent
      : agents.find((a) => a.id === selectedAgentId) || agents[0] || autoRouteAgent;

  const Icon = AGENT_ICONS[selectedAgent.id as keyof typeof AGENT_ICONS] || Brain;
  const colorClass = AGENT_COLORS[selectedAgent.id as keyof typeof AGENT_COLORS] || 
    "text-gray-600 dark:text-gray-400";

  const handleSelect = (agentId: string | "auto") => {
    onAgentChange(agentId);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Icon className={cn("w-4 h-4", colorClass)} />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {selectedAgent.name}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: ANIMATION_EASE }}
              className="absolute top-full left-0 mt-2 w-96 max-h-[320px] z-20"
            >
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-y-auto h-full">
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => handleSelect("auto")}
                    className={cn(
                      "w-full flex items-start gap-3 px-3 py-2 rounded-md transition-colors text-left",
                      selectedAgentId === "auto"
                        ? "bg-purple-50 dark:bg-purple-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                  >
                    <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Auto-Route
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Automatically route to the best agent
                      </div>
                    </div>
                  </button>

                  <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

                  {agents.map((agent) => {
                    const AgentIcon = AGENT_ICONS[agent.id as keyof typeof AGENT_ICONS] || Brain;
                    const agentColor = AGENT_COLORS[agent.id as keyof typeof AGENT_COLORS];

                    return (
                      <button
                        key={agent.id}
                        onClick={() => handleSelect(agent.id)}
                        className={cn(
                          "w-full flex items-start gap-3 px-3 py-2 rounded-md transition-colors text-left",
                          selectedAgentId === agent.id
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        )}
                      >
                        <AgentIcon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", agentColor)} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {agent.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {agent.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
