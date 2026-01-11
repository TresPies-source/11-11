"use client";

import { createContext, useState, useCallback, ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { Toast, ToastData, ToastType } from "@/components/shared/Toast";

interface ToastContextValue {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType, duration: number = 3000) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastData = { id, message, type };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const contextValue: ToastContextValue = {
    success: (message, duration) => addToast(message, "success", duration),
    error: (message, duration) => addToast(message, "error", duration),
    info: (message, duration) => addToast(message, "info", duration),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
              {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                  <Toast toast={toast} onDismiss={removeToast} />
                </div>
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
