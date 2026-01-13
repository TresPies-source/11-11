"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2, File, Folder } from "lucide-react";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  type: "file" | "folder";
  name: string;
  isCurrentlyOpen?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmDialog({
  isOpen,
  type,
  name,
  isCurrentlyOpen = false,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(false);
      
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleConfirm = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onConfirm, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "Enter") {
        event.preventDefault();
        handleConfirm();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, handleConfirm]);

  if (!mounted) return null;

  const Icon = type === "file" ? File : Folder;
  const itemType = type === "file" ? "file" : "folder";

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            aria-hidden="true"
          />
          
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="dialog-title"
              aria-describedby="dialog-description"
            >
              <div className="flex items-center justify-between p-4 border-b border-red-200 bg-red-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h2
                    id="dialog-title"
                    className="text-lg font-semibold text-red-900"
                  >
                    Delete {itemType}?
                  </h2>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 break-words">
                        {name}
                      </p>
                    </div>
                  </div>

                  <p
                    id="dialog-description"
                    className="text-sm text-gray-700"
                  >
                    Are you sure you want to delete <strong>{name}</strong>?
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      This will move the {itemType} to Google Drive Trash. You can restore it from Google Drive.
                    </p>
                  </div>

                  {isCurrentlyOpen && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs text-amber-800 font-medium">
                        ⚠️ This {itemType} is currently open in the editor.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                      "text-gray-700 bg-gray-100 hover:bg-gray-200",
                      "focus:outline-none focus:ring-2 focus:ring-gray-500",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    ref={confirmButtonRef}
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                      "text-white bg-red-600 hover:bg-red-700",
                      "focus:outline-none focus:ring-2 focus:ring-red-500",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "flex items-center gap-2"
                    )}
                    aria-label={`Delete ${itemType} ${name}`}
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
