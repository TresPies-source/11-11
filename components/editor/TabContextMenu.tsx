"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  tabId: string;
  totalTabs: number;
  onClose: () => void;
  onCloseTab: (tabId: string) => void;
  onCloseOthers: (tabId: string) => void;
  onCloseAll: () => void;
  onCopyPath: (tabId: string) => void;
}

export function TabContextMenu({
  isOpen,
  position,
  tabId,
  totalTabs,
  onClose,
  onCloseTab,
  onCloseOthers,
  onCloseAll,
  onCopyPath,
}: TabContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const menuItems = [
    {
      label: "Close",
      icon: X,
      onClick: () => handleAction(() => onCloseTab(tabId)),
      disabled: false,
      shortcut: "Ctrl+W",
    },
    {
      label: "Close Others",
      icon: XCircle,
      onClick: () => handleAction(() => onCloseOthers(tabId)),
      disabled: totalTabs <= 1,
      shortcut: null,
    },
    {
      label: "Close All",
      icon: XCircle,
      onClick: () => handleAction(() => onCloseAll()),
      disabled: totalTabs === 0,
      shortcut: null,
    },
    {
      label: "Copy Path",
      icon: Copy,
      onClick: () => handleAction(() => onCopyPath(tabId)),
      disabled: false,
      shortcut: null,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          className="fixed z-50 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                disabled={item.disabled}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-left",
                  "transition-colors duration-150",
                  item.disabled
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100 active:bg-gray-200 cursor-pointer"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                {item.shortcut && (
                  <span className="text-xs text-gray-400">{item.shortcut}</span>
                )}
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
