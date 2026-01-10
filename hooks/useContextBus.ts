import { useContext, useEffect, useRef } from "react";
import { ContextBusContext } from "@/components/providers/ContextBusProvider";
import { ContextBusEvent } from "@/lib/types";

type EventMap = {
  [K in ContextBusEvent["type"]]: Extract<ContextBusEvent, { type: K }>["payload"];
};

export function useContextBus() {
  const context = useContext(ContextBusContext);
  
  if (!context) {
    throw new Error("useContextBus must be used within ContextBusProvider");
  }
  
  return context;
}

/**
 * Hook that subscribes to a ContextBus event with automatic cleanup on unmount
 */
export function useContextBusSubscription<T extends ContextBusEvent["type"]>(
  event: T,
  handler: (payload: EventMap[T]) => void
) {
  const { on, off } = useContextBus();
  const handlerRef = useRef(handler);

  // Keep handler ref up to date
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const stableHandler = (payload: EventMap[T]) => {
      handlerRef.current(payload);
    };

    on(event, stableHandler);

    return () => {
      off(event, stableHandler);
    };
  }, [event, on, off]);
}
