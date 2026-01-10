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
        emitter.emit(event, payload);
      },
      on: <T extends ContextBusEvent["type"]>(
        event: T,
        handler: (payload: EventMap[T]) => void
      ) => {
        emitter.on(event, handler);
      },
      off: <T extends ContextBusEvent["type"]>(
        event: T,
        handler: (payload: EventMap[T]) => void
      ) => {
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
