"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Minus,
  Maximize2,
  X,
  Send,
  Sparkles,
  User,
  Bot,
  Check,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage, Session } from "@/lib/types";
import { AGENT_PERSONAS, ANIMATION_EASE, SUPERVISOR_AGENTS } from "@/lib/constants";
import { useContextBus, useContextBusSubscription } from "@/hooks/useContextBus";
import { AgentSelector } from "@/components/agents/AgentSelector";
import { RoutingIndicator } from "@/components/agents/RoutingIndicator";
import { AgentStatusBadge } from "@/components/agents/AgentStatusBadge";
import { ExportButton } from "@/components/packet/export-button";
import type { Agent, RoutingResult } from "@/lib/agents/types";
import { useRoutingActivity } from "@/lib/agents/activity-integration";

interface ChatPanelProps {
  session: Session;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onClose: (id: string) => void;
  onSendMessage: (id: string, content: string, agentId?: string) => void;
}

const ChatPanelComponent = ({
  session,
  onMinimize,
  onMaximize,
  onClose,
  onSendMessage,
}: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const [systemContext, setSystemContext] = useState<string>("");
  const [showContextToast, setShowContextToast] = useState(false);
  const [selectedAgentMode, setSelectedAgentMode] = useState<string | "auto">("auto");
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [routingDecision, setRoutingDecision] = useState<RoutingResult | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const persona = AGENT_PERSONAS.find((p) => p.id === session.persona);
  const { trackRoutingActivity } = useRoutingActivity();

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch("/api/supervisor/agents");
        if (response.ok) {
          const data = await response.json();
          setAvailableAgents(data.agents || []);
          const defaultAgent = data.agents?.find((a: Agent) => a.default);
          if (defaultAgent) {
            setCurrentAgent(defaultAgent);
          }
        }
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      }
    };

    fetchAgents();
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, scrollToBottom]);

  const handlePlanUpdate = useCallback((event: { content: string; timestamp: Date }) => {
    const preview = event.content.substring(0, 100);
    console.log(
      `[ContextBus] Plan update received for Agent: ${persona?.name}`,
      {
        timestamp: event.timestamp.toISOString(),
        contentPreview: preview,
      }
    );
    setSystemContext(event.content);
    setShowContextToast(true);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setShowContextToast(false);
    }, 3000);
  }, [persona?.name]);

  useContextBusSubscription("PLAN_UPDATED", handlePlanUpdate);

  const routeMessage = useCallback(
    async (query: string): Promise<string> => {
      if (selectedAgentMode !== "auto") {
        return selectedAgentMode;
      }

      setIsRouting(true);
      try {
        const conversationContext = session.messages
          .slice(-3)
          .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`);

        const result = await trackRoutingActivity(async () => {
          const response = await fetch("/api/supervisor/route", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query,
              conversation_context: conversationContext,
              session_id: session.id,
            }),
          });

          if (!response.ok) {
            throw new Error("Routing failed");
          }

          return await response.json() as RoutingResult;
        }, {
          onComplete: (agentId, agentName) => {
            console.log(`[Activity] Routing complete: ${agentName} (${agentId})`);
          },
          onError: (error) => {
            console.error("[Activity] Routing error:", error);
          },
        });

        setRoutingDecision(result);

        const agent = availableAgents.find((a) => a.id === result.agent_id);
        if (agent) {
          setCurrentAgent(agent);
        }

        return result.agent_id;
      } catch (error) {
        console.error("Routing error:", error);
        const defaultAgent = availableAgents.find((a) => a.default);
        return defaultAgent?.id || "dojo";
      } finally {
        setIsRouting(false);
      }
    },
    [selectedAgentMode, session.messages, session.id, availableAgents, trackRoutingActivity]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (input.trim()) {
        const agentId = await routeMessage(input.trim());
        onSendMessage(session.id, input.trim(), agentId);
        setInput("");
      }
    },
    [input, routeMessage, onSendMessage, session.id]
  );

  const handleAgentChange = useCallback((agentId: string | "auto") => {
    setSelectedAgentMode(agentId);
    setRoutingDecision(null);

    if (agentId !== "auto") {
      const agent = availableAgents.find((a) => a.id === agentId);
      if (agent) {
        setCurrentAgent(agent);
      }
    }
  }, [availableAgents]);

  if (session.isMinimized) {
    return (
      <motion.div
        layout
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2, ease: ANIMATION_EASE }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onMaximize(session.id)}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                persona?.color === "blue" && "bg-blue-500",
                persona?.color === "purple" && "bg-purple-500",
                persona?.color === "green" && "bg-green-500",
                persona?.color === "amber" && "bg-amber-500"
              )}
            />
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{session.title}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(session.id);
            }}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.2, ease: ANIMATION_EASE }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden relative"
    >
      <AnimatePresence>
        {showContextToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: ANIMATION_EASE }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Context Refreshed</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Sparkles
              className={cn(
                "w-4 h-4 flex-shrink-0",
                persona?.color === "blue" && "text-blue-500",
                persona?.color === "purple" && "text-purple-500",
                persona?.color === "green" && "text-green-500",
                persona?.color === "amber" && "text-amber-500"
              )}
            />
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
              {session.title}
            </span>
            {currentAgent && (
              <AgentStatusBadge agent={currentAgent} />
            )}
          </div>
          <div className="flex items-center gap-1">
            <ExportButton sessionId={session.id} variant="icon" />
            <button
              onClick={() => onMinimize(session.id)}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Minimize"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onClose(session.id)}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="px-4 pb-3">
          <AgentSelector
            selectedAgentId={selectedAgentMode}
            onAgentChange={handleAgentChange}
            availableAgents={availableAgents}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {routingDecision && currentAgent && (
          <RoutingIndicator
            result={routingDecision}
            agent={currentAgent}
            mode="full"
          />
        )}
        {session.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Start a conversation with {persona?.name}</p>
            </div>
          </div>
        ) : (
          session.messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    persona?.color === "blue" && "bg-blue-100",
                    persona?.color === "purple" && "bg-purple-100",
                    persona?.color === "green" && "bg-green-100",
                    persona?.color === "amber" && "bg-amber-100"
                  )}
                >
                  <Bot
                    className={cn(
                      "w-4 h-4",
                      persona?.color === "blue" && "text-blue-600",
                      persona?.color === "purple" && "text-purple-600",
                      persona?.color === "green" && "text-green-600",
                      persona?.color === "amber" && "text-amber-600"
                    )}
                  />
                </div>
              )}
              <div
                className={cn(
                  "rounded-lg px-4 py-2 max-w-[80%]",
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${persona?.name}...`}
            className="flex-1 px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isRouting}
            className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isRouting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

// Custom comparison function to prevent unnecessary re-renders
const arePropsEqual = (
  prevProps: ChatPanelProps,
  nextProps: ChatPanelProps
): boolean => {
  // Compare session properties
  if (prevProps.session.id !== nextProps.session.id) return false;
  if (prevProps.session.isMinimized !== nextProps.session.isMinimized)
    return false;
  if (prevProps.session.title !== nextProps.session.title) return false;
  if (prevProps.session.persona !== nextProps.session.persona) return false;

  // Compare messages array length and content
  if (prevProps.session.messages.length !== nextProps.session.messages.length)
    return false;

  // Deep compare messages
  for (let i = 0; i < prevProps.session.messages.length; i++) {
    const prevMsg = prevProps.session.messages[i];
    const nextMsg = nextProps.session.messages[i];
    if (
      prevMsg.id !== nextMsg.id ||
      prevMsg.content !== nextMsg.content ||
      prevMsg.role !== nextMsg.role
    ) {
      return false;
    }
  }

  // Props are equal if we got here
  return true;
};

export const ChatPanel = React.memo(ChatPanelComponent, arePropsEqual);
