"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Save, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmAction = "save" | "discard" | "cancel";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onAction: (action: ConfirmAction) => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onAction,
}: ConfirmDialogProps) {
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onAction("cancel");
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onAction("save");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onAction]);

  useEffect(() => {
    if (isOpen) {
      saveButtonRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => onAction("cancel")}
          >
            <motion.div
              className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="dialog-title"
              aria-describedby="dialog-message"
              aria-modal="true"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h2
                      id="dialog-title"
                      className="text-lg font-semibold text-gray-900 mb-2"
                    >
                      {title}
                    </h2>
                    <p id="dialog-message" className="text-sm text-gray-600">
                      {message}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => onAction("cancel")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150",
                    "text-gray-700 bg-white border border-gray-300",
                    "hover:bg-gray-50 active:scale-95",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  )}
                  style={{ minWidth: "80px", minHeight: "44px" }}
                >
                  Cancel
                </button>

                <button
                  onClick={() => onAction("discard")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150",
                    "text-red-700 bg-white border border-red-300",
                    "hover:bg-red-50 active:scale-95",
                    "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
                    "flex items-center gap-2"
                  )}
                  style={{ minWidth: "100px", minHeight: "44px" }}
                >
                  <Trash2 className="w-4 h-4" />
                  Discard
                </button>

                <button
                  ref={saveButtonRef}
                  onClick={() => onAction("save")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150",
                    "text-white bg-blue-600 border border-blue-600",
                    "hover:bg-blue-700 active:scale-95",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                    "flex items-center gap-2"
                  )}
                  style={{ minWidth: "80px", minHeight: "44px" }}
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
