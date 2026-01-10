"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatPanel } from "./ChatPanel";
import { NewSessionButton } from "./NewSessionButton";
import { Session, ChatMessage } from "@/lib/types";
import { MAX_CHAT_PANELS, AGENT_PERSONAS } from "@/lib/constants";

export function MultiAgentView() {
  const [sessions, setSessions] = useState<Session[]>([]);

  const createNewSession = () => {
    if (sessions.length >= MAX_CHAT_PANELS) return;

    const persona = AGENT_PERSONAS[sessions.length % AGENT_PERSONAS.length];
    const newSession: Session = {
      id: `session-${Date.now()}`,
      title: `${persona.name} Session`,
      persona: persona.id,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isMinimized: false,
    };

    setSessions((prev) => [...prev, newSession]);
  };

  const handleMinimize = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isMinimized: true } : s))
    );
  };

  const handleMaximize = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isMinimized: false } : s))
    );
  };

  const handleClose = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSendMessage = (id: string, content: string) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content,
      timestamp: new Date(),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              messages: [...s.messages, userMessage],
              updatedAt: new Date(),
            }
          : s
      )
    );

    setTimeout(() => {
      const session = sessions.find((s) => s.id === id);
      const persona = AGENT_PERSONAS.find((p) => p.id === session?.persona);

      const responses = [
        `I understand. Let me help you with that.`,
        `That's an interesting question. ${persona?.description}`,
        `I'm processing your request. This aligns with my role in ${persona?.description.toLowerCase()}.`,
        `Let me analyze this for you...`,
        `Working on it. I'll provide a comprehensive response shortly.`,
      ];

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        persona: session?.persona,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                messages: [...s.messages, assistantMessage],
                updatedAt: new Date(),
              }
            : s
        )
      );
    }, 800 + Math.random() * 1200);
  };

  const activeSessions = sessions.filter((s) => !s.isMinimized);
  const minimizedSessions = sessions.filter((s) => s.isMinimized);

  return (
    <div className="w-full h-full bg-gray-50 p-6 overflow-auto">
      <div
        className="grid gap-4 auto-rows-fr"
        style={{
          gridTemplateColumns:
            activeSessions.length === 1
              ? "1fr"
              : activeSessions.length === 2
              ? "repeat(2, 1fr)"
              : "repeat(auto-fit, minmax(350px, 1fr))",
        }}
      >
        <AnimatePresence mode="popLayout">
          {activeSessions.map((session) => (
            <ChatPanel
              key={session.id}
              session={session}
              onMinimize={handleMinimize}
              onMaximize={handleMaximize}
              onClose={handleClose}
              onSendMessage={handleSendMessage}
            />
          ))}
        </AnimatePresence>
      </div>

      {minimizedSessions.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Minimized</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <AnimatePresence mode="popLayout">
              {minimizedSessions.map((session) => (
                <ChatPanel
                  key={session.id}
                  session={session}
                  onMinimize={handleMinimize}
                  onMaximize={handleMaximize}
                  onClose={handleClose}
                  onSendMessage={handleSendMessage}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      <NewSessionButton
        onClick={createNewSession}
        disabled={sessions.length >= MAX_CHAT_PANELS}
      />
    </div>
  );
}
