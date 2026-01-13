"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Archive, Search } from "lucide-react";
import type { PromptWithCritique } from "@/lib/pglite/prompts";
import { getPromptsByStatus, deletePrompt, updatePromptStatusWithHistory } from "@/lib/pglite/prompts";
import { ArchiveCard } from "@/components/librarian/ArchiveCard";
import { BulkActionBar } from "@/components/librarian/BulkActionBar";
import { ConfirmationDialog } from "@/components/librarian/ConfirmationDialog";
import { CardErrorBoundary } from "@/components/librarian/CardErrorBoundary";
import { SearchInput } from "@/components/shared/SearchInput";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { useToast } from "@/hooks/useToast";

export default function ArchivePage() {
  const toast = useToast();
  const [prompts, setPrompts] = useState<PromptWithCritique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingRestoreId, setPendingRestoreId] = useState<string | null>(null);

  const {
    selectedIds,
    toggleSelection,
    clearSelection,
    isSelected,
    selectedCount,
  } = useBulkSelection();

  const loadPrompts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = "dev-user";
      const archivedPrompts = await getPromptsByStatus(userId, "archived");
      setPrompts(archivedPrompts);
    } catch (err) {
      console.error("Failed to load archived prompts:", err);
      setError(err instanceof Error ? err.message : "Failed to load archived prompts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const filteredPrompts = useMemo(() => {
    if (!searchQuery.trim()) return prompts;

    const query = searchQuery.toLowerCase();
    return prompts.filter((p) => {
      const titleMatch = p.title.toLowerCase().includes(query);
      const descMatch = p.metadata?.description?.toLowerCase().includes(query);
      const tagMatch = p.metadata?.tags?.some((tag) =>
        tag.toLowerCase().includes(query)
      );
      const contentMatch = p.content.toLowerCase().includes(query);
      return titleMatch || descMatch || tagMatch || contentMatch;
    });
  }, [prompts, searchQuery]);

  const handleRestore = useCallback((promptId: string) => {
    setPendingRestoreId(promptId);
    setRestoreConfirmOpen(true);
  }, []);

  const handleDelete = useCallback((promptId: string) => {
    setPendingDeleteId(promptId);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmRestore = useCallback(async () => {
    if (!pendingRestoreId) return;

    try {
      setIsRestoring(true);
      await updatePromptStatusWithHistory(pendingRestoreId, "active", "dev-user");
      setPrompts((prev) => prev.filter((p) => p.id !== pendingRestoreId));
      clearSelection();
      toast.success("Prompt restored to active");
    } catch (err) {
      console.error("Failed to restore prompt:", err);
      toast.error("Failed to restore prompt");
    } finally {
      setIsRestoring(false);
      setPendingRestoreId(null);
      setRestoreConfirmOpen(false);
    }
  }, [pendingRestoreId, clearSelection, toast]);

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;

    try {
      setIsDeleting(true);
      await deletePrompt(pendingDeleteId);
      setPrompts((prev) => prev.filter((p) => p.id !== pendingDeleteId));
      clearSelection();
      toast.success("Prompt deleted permanently");
    } catch (err) {
      console.error("Failed to delete prompt:", err);
      toast.error("Failed to delete prompt");
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
      setDeleteConfirmOpen(false);
    }
  }, [pendingDeleteId, clearSelection, toast]);

  const handleBulkRestore = useCallback(() => {
    if (selectedCount === 0) return;
    setRestoreConfirmOpen(true);
  }, [selectedCount]);

  const handleBulkDelete = useCallback(() => {
    if (selectedCount === 0) return;
    setDeleteConfirmOpen(true);
  }, [selectedCount]);

  const confirmBulkRestore = useCallback(async () => {
    if (selectedCount === 0) return;

    try {
      setIsRestoring(true);
      const idsToRestore = Array.from(selectedIds);
      
      await Promise.all(
        idsToRestore.map((id) =>
          updatePromptStatusWithHistory(id, "active", "dev-user")
        )
      );

      setPrompts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      clearSelection();
      toast.success(`${idsToRestore.length} prompt${idsToRestore.length !== 1 ? 's' : ''} restored`);
    } catch (err) {
      console.error("Failed to restore prompts:", err);
      toast.error("Failed to restore some prompts");
    } finally {
      setIsRestoring(false);
      setRestoreConfirmOpen(false);
    }
  }, [selectedCount, selectedIds, clearSelection, toast]);

  const confirmBulkDelete = useCallback(async () => {
    if (selectedCount === 0) return;

    try {
      setIsDeleting(true);
      const idsToDelete = Array.from(selectedIds);
      
      await Promise.all(
        idsToDelete.map((id) => deletePrompt(id))
      );

      setPrompts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      clearSelection();
      toast.success(`${idsToDelete.length} prompt${idsToDelete.length !== 1 ? 's' : ''} deleted permanently`);
    } catch (err) {
      console.error("Failed to delete prompts:", err);
      toast.error("Failed to delete some prompts");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  }, [selectedCount, selectedIds, clearSelection, toast]);

  const handleConfirmRestore = useCallback(() => {
    if (pendingRestoreId) {
      confirmRestore();
    } else {
      confirmBulkRestore();
    }
  }, [pendingRestoreId, confirmRestore, confirmBulkRestore]);

  const handleConfirmDelete = useCallback(() => {
    if (pendingDeleteId) {
      confirmDelete();
    } else {
      confirmBulkDelete();
    }
  }, [pendingDeleteId, confirmDelete, confirmBulkDelete]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Archive className="h-8 w-8 text-gray-600" />
              Archive
            </h1>
            <p className="text-gray-600 mt-2">Prompts you&apos;ve archived</p>
          </div>
          <LoadingState count={6} />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Archive className="h-8 w-8 text-gray-600" />
              Archive
            </h1>
            <p className="text-gray-600 mt-2">Prompts you&apos;ve archived</p>
          </div>
          <ErrorState
            title="Unable to load archive"
            message={error}
            onRetry={loadPrompts}
            loading={loading}
          />
        </div>
      </main>
    );
  }

  if (prompts.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Archive className="h-8 w-8 text-gray-600" />
              Archive
            </h1>
            <p className="text-gray-600 mt-2">Prompts you&apos;ve archived</p>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-12 text-center">
            <Archive className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 font-medium text-lg mb-2">
              No archived prompts
            </p>
            <p className="text-gray-500 text-sm">
              Your archive is empty. Archived prompts will appear here.
            </p>
            <p className="text-gray-400 text-xs mt-3 italic">
              Archive prompts you&apos;re not actively using to keep your library organized 📦
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Archive className="h-8 w-8 text-gray-600" />
            Archive
          </h1>
          <p className="text-gray-600 mt-2">
            {prompts.length} archived prompt{prompts.length !== 1 ? "s" : ""}
          </p>
        </div>

        <BulkActionBar
          selectedCount={selectedCount}
          onRestore={handleBulkRestore}
          onDelete={handleBulkDelete}
          onClearSelection={clearSelection}
          isRestoring={isRestoring}
          isDeleting={isDeleting}
        />

        <div className="mb-6">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search archived prompts by title, description, tags, or content..."
            className="w-full"
          />
        </div>

        {filteredPrompts.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center" role="status">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">
              No archived prompts match your search
            </p>
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Clear search query"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-md px-2 py-1"
            >
              Clear search
            </button>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            layout
            role="list"
            aria-label={`${filteredPrompts.length} archived prompt${filteredPrompts.length !== 1 ? "s" : ""}`}
          >
            <AnimatePresence mode="popLayout">
              {filteredPrompts.map((prompt) => (
                <CardErrorBoundary key={prompt.id} cardType="archive">
                  <ArchiveCard
                    prompt={prompt}
                    selected={isSelected(prompt.id)}
                    onSelect={toggleSelection}
                    onRestore={handleRestore}
                    onDelete={handleDelete}
                    searchQuery={searchQuery}
                  />
                </CardErrorBoundary>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <ConfirmationDialog
        open={restoreConfirmOpen}
        title="Restore Prompt"
        message={
          pendingRestoreId
            ? "Restore this prompt to active status?"
            : `Restore ${selectedCount} selected prompt${selectedCount !== 1 ? 's' : ''} to active status?`
        }
        confirmLabel="Restore"
        cancelLabel="Cancel"
        onConfirm={handleConfirmRestore}
        onCancel={() => {
          setRestoreConfirmOpen(false);
          setPendingRestoreId(null);
        }}
        variant="info"
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        title="Delete Permanently"
        message={
          pendingDeleteId
            ? "This will permanently delete this prompt. This action cannot be undone."
            : `This will permanently delete ${selectedCount} selected prompt${selectedCount !== 1 ? 's' : ''}. This action cannot be undone.`
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setPendingDeleteId(null);
        }}
        variant="danger"
      />
    </main>
  );
}
