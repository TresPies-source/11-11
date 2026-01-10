"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import mitt, { Emitter } from "mitt";
import { ContextBusEvent } from "@/lib/types";

type EventMap = {
  [K in ContextBusEvent["type"]]: Extract<ContextBusEvent, { type: K }>["payload"];
};

interface ContextBusContextValue {
  emit: <T extends ContextBusEvent["type"]>(
    event: T,
    payload: EventMap[T]
  ) => void;
  on: <T extends ContextBusEvent["type"]>(
    event: T,
    handler: (payload: EventMap[T]) => void
  ) => void;
  off: <T extends ContextBusEvent["type"]>(
    event: T,
    handler: (payload: EventMap[T]) => void
  ) => void;
}

export const ContextBusContext = createContext<ContextBusContextValue | null>(null);

interface ContextBusProviderProps {
  children: ReactNode;
}

export function ContextBusProvider({ children }: ContextBusProviderProps) {
  const emitter: Emitter<EventMap> = useMemo(() => mitt<EventMap>(), []);

  const contextValue: ContextBusContextValue = useMemo(
    () => ({
      emit: <T extends ContextBusEvent["type"]>(
        event: T,
        payload: EventMap[T]
      ) => {
        const timestamp = new Date().toISOString();
        console.log(`[ContextBus] Emitting ${event} at ${timestamp}`);
        
        if (event === "PLAN_UPDATED" && payload && typeof payload === "object" && "content" in payload) {
          const content = (payload as any).content || "";
          const preview = typeof content === "string" ? content.substring(0, 100) : "";
          console.log(`[ContextBus] PLAN_UPDATED content preview: ${preview}${content.length > 100 ? "..." : ""}`);
        }
        
        emitter.emit(event, payload);
      },
      on: <T extends ContextBusEvent["type"]>(
        event: T,
        handler: (payload: EventMap[T]) => void
      ) => {
        console.log(`[ContextBus] Subscribed to ${event}`);
        emitter.on(event, handler);
      },
      off: <T extends ContextBusEvent["type"]>(
        event: T,
        handler: (payload: EventMap[T]) => void
      ) => {
        console.log(`[ContextBus] Unsubscribed from ${event}`);
        emitter.off(event, handler);
      },
    }),
    [emitter]
  );

  return (
    <ContextBusContext.Provider value={contextValue}>
      {children}
    </ContextBusContext.Provider>
  );
}
