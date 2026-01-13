"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ContextMenuItem } from "@/lib/types";

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ isOpen, position, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
      const firstButton = menuRef.current?.querySelector('button:not([disabled])');
      if (firstButton instanceof HTMLElement) {
        firstButton.focus();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const enabledItems = items.filter(item => !item.disabled && !item.separator);
      
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setFocusedIndex(prev => {
            const nextIndex = (prev + 1) % enabledItems.length;
            const buttons = menuRef.current?.querySelectorAll('button:not([disabled])');
            if (buttons && buttons[nextIndex] instanceof HTMLElement) {
              (buttons[nextIndex] as HTMLElement).focus();
            }
            return nextIndex;
          });
          break;
        case "ArrowUp":
          event.preventDefault();
          setFocusedIndex(prev => {
            const nextIndex = prev === 0 ? enabledItems.length - 1 : prev - 1;
            const buttons = menuRef.current?.querySelectorAll('button:not([disabled])');
            if (buttons && buttons[nextIndex] instanceof HTMLElement) {
              (buttons[nextIndex] as HTMLElement).focus();
            }
            return nextIndex;
          });
          break;
        case "Escape":
          event.preventDefault();
          onClose();
          break;
        case "Tab":
          event.preventDefault();
          break;
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, items, onClose]);

  if (!mounted) return null;

  const menu = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          className="fixed z-50 min-w-[200px] rounded-lg bg-white shadow-lg border border-gray-200 py-1"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
          role="menu"
          aria-orientation="vertical"
        >
          {items.map((item, index) => {
            if (item.separator) {
              return (
                <div
                  key={item.id}
                  className="h-px bg-gray-200 my-1"
                  role="separator"
                />
              );
            }

            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick();
                    onClose();
                  }
                }}
                disabled={item.disabled}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                  "focus:outline-none focus:bg-gray-100",
                  item.disabled
                    ? "text-gray-400 cursor-not-allowed"
                    : item.danger
                    ? "text-red-600 hover:bg-red-50 focus:bg-red-50"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                role="menuitem"
                tabIndex={item.disabled ? -1 : 0}
                aria-disabled={item.disabled}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      item.disabled
                        ? "text-gray-400"
                        : item.danger
                        ? "text-red-600"
                        : "text-gray-500"
                    )}
                  />
                )}
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(menu, document.body);
}
