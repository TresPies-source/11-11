"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, AlertCircle, RefreshCw } from "lucide-react";
import { AgentCard } from "./AgentCard";
import { AgentDetailsModal } from "./AgentDetailsModal";
import { TestAgentInterface } from "./TestAgentInterface";
import type { Agent } from "@/lib/agents/types";

type AgentStatus = "online" | "offline" | "deprecated";

interface AgentWithStatus extends Agent {
  status: AgentStatus;
}

interface AgentWithStats extends AgentWithStatus {
  usage_stats?: {
    query_count: number;
    total_cost_usd: number;
    avg_response_time_ms: number;
    last_used_at: string | null;
  };
}

export function AgentRegistryView() {
  const [agents, setAgents] = useState<AgentWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentWithStats | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTestInterface, setShowTestInterface] = useState(false);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/agents/registry");

      if (!response.ok) {
        throw new Error("Failed to fetch agent registry");
      }

      const data = await response.json();
      setAgents(data.agents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleCardClick = useCallback(async (agent: AgentWithStatus) => {
    setShowTestInterface(false);

    try {
      const response = await fetch(`/api/agents/${agent.id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch agent details");
      }

      const data = await response.json();
      setSelectedAgent(data);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Failed to load agent details:", err);
      setSelectedAgent({
        ...agent,
        usage_stats: undefined,
      });
      setIsModalOpen(true);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setShowTestInterface(false);
    setTimeout(() => {
      setSelectedAgent(null);
    }, 200);
  }, []);

  const handleTestAgent = useCallback((agentId: string, agentName: string) => {
    setShowTestInterface(true);
  }, []);

  if (error && !isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-500" />
            Agent Registry
          </h1>
          <p className="text-muted-foreground mt-2">
            Explore the 11-11 multi-agent system
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Failed to Load Agents
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={fetchAgents}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600 dark:text-blue-500" />
          Agent Registry
        </h1>
        <p className="text-muted-foreground mt-2">
          Explore the 11-11 multi-agent system
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              id={agent.id}
              name={agent.name}
              icon={agent.icon || "🤖"}
              tagline={agent.tagline || agent.description}
              status={agent.status}
              onClick={() => handleCardClick(agent)}
            />
          ))}
        </motion.div>
      )}

      {agents.length === 0 && !isLoading && !error && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No agents found in the registry
          </p>
        </div>
      )}

      <AgentDetailsModal
        agent={selectedAgent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onTestAgent={handleTestAgent}
      />

      {showTestInterface && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Test {selectedAgent.name}
              </h2>
              <button
                onClick={() => setShowTestInterface(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close test interface"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <TestAgentInterface
                agentId={selectedAgent.id}
                agentName={selectedAgent.name}
              />
            </div>

            <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowTestInterface(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Back to Details
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
