"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = 'info',
}: ConfirmationDialogProps) {
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.target instanceof HTMLButtonElement) {
        return;
      }
      if (e.key === "Enter") {
        onConfirm();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleEnter);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleEnter);
    };
  }, [open, onCancel, onConfirm]);

  const variantStyles = {
    danger: {
      icon: AlertTriangle,
      iconColor: "text-red-600",
      iconBg: "bg-red-100",
      confirmBg: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-100",
      confirmBg: "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500",
    },
    info: {
      icon: Info,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      confirmBg: "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500",
    },
  };

  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onCancel}
            aria-hidden="true"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dialog-title"
              aria-describedby="dialog-description"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onCancel}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 rounded-md"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className={cn("flex-shrink-0 rounded-full p-3", style.iconBg)}>
                  <Icon className={cn("h-6 w-6", style.iconColor)} />
                </div>

                <div className="flex-1 pt-1">
                  <h2
                    id="dialog-title"
                    className="text-lg font-semibold text-gray-900 mb-2"
                  >
                    {title}
                  </h2>
                  <p
                    id="dialog-description"
                    className="text-sm text-gray-600 mb-6"
                  >
                    {message}
                  </p>

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={onCancel}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 active:scale-95 transition-all duration-100 focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    >
                      {cancelLabel}
                    </button>
                    <button
                      onClick={onConfirm}
                      className={cn(
                        "px-4 py-2 text-sm font-medium text-white rounded-md active:scale-95 transition-all duration-100 focus-visible:ring-2 focus-visible:ring-offset-2",
                        style.confirmBg
                      )}
                    >
                      {confirmLabel}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
