"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X, Download, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { exportSessionAsMarkdown, downloadMarkdown, generateDefaultFilename } from "@/lib/dojo/export";

interface SessionExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionTitle?: string;
}

export function SessionExportModal({
  isOpen,
  onClose,
  sessionId,
  sessionTitle,
}: SessionExportModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeTimestamps, setIncludeTimestamps] = useState(false);
  const [filename, setFilename] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFilename(generateDefaultFilename(sessionTitle));
      setIncludeMetadata(true);
      setIncludeTimestamps(false);
      setPreview(null);
      setShowPreview(false);
    }
  }, [isOpen, sessionTitle]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isExporting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isExporting, onClose]);

  const handleGeneratePreview = async () => {
    try {
      setIsExporting(true);
      const markdown = await exportSessionAsMarkdown(sessionId, {
        includeMetadata,
        includeTimestamps,
      });
      setPreview(markdown);
      setShowPreview(true);
    } catch (error) {
      console.error('[EXPORT_MODAL] Error generating preview:', error);
      showError('Failed to generate preview');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const markdown = await exportSessionAsMarkdown(sessionId, {
        includeMetadata,
        includeTimestamps,
      });
      
      downloadMarkdown(markdown, filename);
      success('Session exported successfully!');
      onClose();
    } catch (error) {
      console.error('[EXPORT_MODAL] Error exporting session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to export session';
      showError(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancel = () => {
    if (!isExporting) {
      onClose();
    }
  };

  if (!mounted) return null;

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleCancel}
            aria-hidden="true"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="bg-bg-primary rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-labelledby="export-session-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-bg-primary border-b border-bg-tertiary p-6 flex items-start justify-between z-10">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="w-5 h-5 text-dojo" />
                    <h2
                      id="export-session-modal-title"
                      className="text-xl font-semibold text-text-primary"
                    >
                      Export Session
                    </h2>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Export your session as a Markdown file
                  </p>
                </div>

                <button
                  onClick={handleCancel}
                  disabled={isExporting}
                  className={cn(
                    "p-2 rounded-lg transition-all duration-150",
                    "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary",
                    isExporting && "opacity-50 cursor-not-allowed"
                  )}
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="filename"
                      className="block text-sm font-medium text-text-primary mb-2"
                    >
                      Filename
                    </label>
                    <input
                      id="filename"
                      type="text"
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                      disabled={isExporting}
                      className={cn(
                        "w-full px-4 py-2 rounded-lg border transition-all duration-150",
                        "bg-bg-secondary border-bg-tertiary",
                        "text-text-primary placeholder:text-text-tertiary",
                        "focus:outline-none focus:ring-2 focus:ring-dojo/20 focus:border-dojo",
                        isExporting && "opacity-50 cursor-not-allowed"
                      )}
                      placeholder="session-export.md"
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-text-primary">
                      Export Options
                    </p>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={includeMetadata}
                        onChange={(e) => setIncludeMetadata(e.target.checked)}
                        disabled={isExporting}
                        className={cn(
                          "mt-0.5 w-4 h-4 rounded border-2 border-bg-tertiary",
                          "text-dojo focus:ring-2 focus:ring-dojo/20",
                          "transition-all duration-100 cursor-pointer",
                          isExporting && "opacity-50 cursor-not-allowed"
                        )}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-text-primary group-hover:text-dojo transition-all duration-150">
                          Include metadata
                        </p>
                        <p className="text-xs text-text-tertiary">
                          Add creation date, mode, and situation to the export
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={includeTimestamps}
                        onChange={(e) => setIncludeTimestamps(e.target.checked)}
                        disabled={isExporting}
                        className={cn(
                          "mt-0.5 w-4 h-4 rounded border-2 border-bg-tertiary",
                          "text-dojo focus:ring-2 focus:ring-dojo/20",
                          "transition-all duration-100 cursor-pointer",
                          isExporting && "opacity-50 cursor-not-allowed"
                        )}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-text-primary group-hover:text-dojo transition-all duration-150">
                          Include timestamps
                        </p>
                        <p className="text-xs text-text-tertiary">
                          Add timestamps for each message in the conversation
                        </p>
                      </div>
                    </label>
                  </div>

                  {showPreview && preview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                        <FileText className="w-4 h-4" />
                        Preview
                      </div>
                      <div className="bg-bg-secondary rounded-lg border border-bg-tertiary p-4 max-h-64 overflow-y-auto">
                        <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono">
                          {preview}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-bg-primary border-t border-bg-tertiary p-6 flex flex-col sm:flex-row gap-3 sm:justify-between">
                <button
                  onClick={handleGeneratePreview}
                  disabled={isExporting}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2 rounded-lg",
                    "text-sm font-medium transition-all duration-150",
                    "bg-bg-secondary text-text-primary",
                    "hover:bg-bg-tertiary",
                    isExporting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isExporting && showPreview ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      {showPreview ? 'Refresh Preview' : 'Preview'}
                    </>
                  )}
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    disabled={isExporting}
                    className={cn(
                      "flex-1 sm:flex-none px-6 py-2 rounded-lg",
                      "text-sm font-medium transition-all duration-150",
                      "bg-bg-secondary text-text-primary",
                      "hover:bg-bg-tertiary",
                      isExporting && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleExport}
                    disabled={isExporting || !filename.trim()}
                    className={cn(
                      "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg",
                      "text-sm font-medium transition-all duration-150",
                      "bg-dojo text-white",
                      "hover:bg-dojo/90",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isExporting && !showPreview ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export
                      </>
                    )}
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
