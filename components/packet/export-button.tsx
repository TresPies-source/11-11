"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Copy, FileJson, FileText, FileImage, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ExportButtonProps {
  sessionId: string;
  variant?: "icon" | "full";
  className?: string;
}

export function ExportButton({ sessionId, variant = "icon", className }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showMenu]);

  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.right - 200,
      });
    }
  }, [showMenu]);

  async function handleExport(format: "json" | "markdown" | "pdf") {
    setIsExporting(true);
    setShowMenu(false);

    try {
      const res = await fetch("/api/packet/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, format }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dojopacket-${sessionId}.${format === "markdown" ? "md" : format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("[EXPORT]", error);
      alert(error instanceof Error ? error.message : "Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleCopyToClipboard() {
    setIsExporting(true);
    setShowMenu(false);

    try {
      const res = await fetch("/api/packet/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, format: "markdown" }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Copy failed");
      }

      const text = await res.text();
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (error) {
      console.error("[COPY]", error);
      alert(error instanceof Error ? error.message : "Copy failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  const menu = mounted ? (
    <AnimatePresence>
      {showMenu && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          className="fixed z-50 min-w-[200px] rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 py-1"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
          role="menu"
          aria-orientation="vertical"
        >
          <button
            onClick={() => handleExport("json")}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
            role="menuitem"
          >
            <FileJson className="w-4 h-4" />
            Export as JSON
          </button>
          <button
            onClick={() => handleExport("markdown")}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
            role="menuitem"
          >
            <FileText className="w-4 h-4" />
            Export as Markdown
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
            role="menuitem"
          >
            <FileImage className="w-4 h-4" />
            Export as PDF
          </button>
          <hr className="my-1 border-gray-200 dark:border-gray-700" />
          <button
            onClick={handleCopyToClipboard}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
            role="menuitem"
          >
            <Copy className="w-4 h-4" />
            Copy to Clipboard
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  ) : null;

  if (variant === "icon") {
    return (
      <>
        <button
          ref={buttonRef}
          onClick={() => !isExporting && setShowMenu(!showMenu)}
          disabled={isExporting}
          className={cn(
            "p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          title="Export DojoPacket"
          aria-label="Export DojoPacket"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>
        {mounted && createPortal(menu, document.body)}
      </>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => !isExporting && setShowMenu(!showMenu)}
        disabled={isExporting}
        className={cn(
          "flex items-center gap-2 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
          className
        )}
        aria-label="Export DojoPacket"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">Export DojoPacket</span>
      </button>
      {mounted && createPortal(menu, document.body)}
    </>
  );
}
