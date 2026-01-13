"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const toastColors = {
  success: "bg-green-600",
  error: "bg-red-600",
  info: "bg-blue-600",
};

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const Icon = toastIcons[toast.type];

  const handleAction = () => {
    if (toast.action) {
      toast.action.onClick();
      onDismiss(toast.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`${toastColors[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      {toast.action && (
        <button
          onClick={handleAction}
          className="text-white bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm font-medium transition-colors"
          aria-label={toast.action.label}
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-white/80 hover:text-white transition-colors ml-1"
        aria-label="Dismiss"
      >
        ×
      </button>
    </motion.div>
  );
}
