"use client";

import { createContext, useState, useCallback, ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { Toast, ToastData, ToastType, ToastAction } from "@/components/shared/Toast";

interface ToastOptions {
  duration?: number;
  action?: ToastAction;
}

interface ToastContextValue {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
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
    (message: string, type: ToastType, options: ToastOptions = {}) => {
      const { duration = 3000, action } = options;
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastData = { id, message, type, action };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const contextValue: ToastContextValue = {
    success: (message, options) => addToast(message, "success", options),
    error: (message, options) => addToast(message, "error", options),
    info: (message, options) => addToast(message, "info", options),
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
