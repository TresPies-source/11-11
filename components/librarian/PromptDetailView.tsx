"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User, Clock, FileText } from "lucide-react";
import { getPromptById, type PromptWithCritique } from "@/lib/pglite/prompts";
import type { PromptStatus, StatusHistoryEntry } from "@/lib/pglite/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { CritiqueScore } from "./CritiqueScore";
import { PublicBadge } from "./PublicBadge";
import { LibrarianSkeleton } from "./LibrarianSkeleton";

interface PromptDetailViewProps {
  promptId: string;
}

const STATUS_CONFIG: Record<PromptStatus, { emoji: string; label: string; color: string }> = {
  draft: { emoji: "✏️", label: "Draft", color: "bg-text-tertiary text-text-primary" },
  active: { emoji: "🌱", label: "Active", color: "bg-success/20 text-success" },
  saved: { emoji: "🌺", label: "Saved", color: "bg-librarian/20 text-librarian" },
  archived: { emoji: "📦", label: "Archived", color: "bg-bg-tertiary text-text-secondary" },
};

export function PromptDetailView({ promptId }: PromptDetailViewProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState<PromptWithCritique | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPrompt() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPromptById(promptId);
        if (!data) {
          setError("Prompt not found");
        } else {
          setPrompt(data);
        }
      } catch (err) {
        console.error("Failed to load prompt:", err);
        setError("Failed to load prompt");
      } finally {
        setLoading(false);
      }
    }

    loadPrompt();
  }, [promptId]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main" aria-label="Prompt Detail">
        <LibrarianSkeleton />
      </main>
    );
  }

  if (error || !prompt) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main" aria-label="Prompt Detail">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            aria-label="Back to Librarian"
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Card className="text-center py-12">
            <p className="text-2xl mb-2">❌</p>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              {error || "Prompt not found"}
            </h2>
            <p className="text-text-secondary mb-6">
              The prompt you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button variant="primary" size="md" onClick={handleBack}>
              Back to Librarian
            </Button>
          </Card>
        </motion.div>
      </main>
    );
  }

  const statusConfig = STATUS_CONFIG[prompt.status];
  const tags = prompt.metadata?.tags || [];
  const hasHistory = prompt.status_history && prompt.status_history.length > 0;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main" aria-label="Prompt Detail">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            aria-label="Back to Librarian"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <header>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-4xl flex-shrink-0" role="img" aria-label={`${statusConfig.label} prompt`}>
                {statusConfig.emoji}
              </span>
              <h1 className="text-3xl font-bold text-text-primary break-words">
                {prompt.title}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-16">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}
              role="status"
              aria-label={`Status: ${statusConfig.label}`}
            >
              {statusConfig.label}
            </span>
            {prompt.visibility === "public" && <PublicBadge variant="default" />}
          </div>
        </header>

        {prompt.metadata?.description && (
          <Card>
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-text-tertiary flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-2">
                  Description
                </h2>
                <p className="text-base text-text-secondary">{prompt.metadata.description}</p>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <h2 className="text-xl font-semibold text-text-primary mb-4">Metadata</h2>
          <div className="space-y-3">
            {prompt.author_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
                <span className="text-text-tertiary">Author:</span>
                <span className="text-text-secondary font-medium">{prompt.author_name}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
              <span className="text-text-tertiary">Created:</span>
              <time className="text-text-secondary" dateTime={prompt.created_at}>
                {formatDate(prompt.created_at)}
              </time>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
              <span className="text-text-tertiary">Updated:</span>
              <time className="text-text-secondary" dateTime={prompt.updated_at}>
                {formatDate(prompt.updated_at)}
              </time>
            </div>

            {tags.length > 0 && (
              <div className="pt-3 border-t border-bg-tertiary">
                <p className="text-sm text-text-tertiary mb-2">Tags:</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, index) => (
                    <Tag key={index} label={tag} />
                  ))}
                </div>
              </div>
            )}

            {prompt.latestCritique && (
              <div className="pt-3 border-t border-bg-tertiary">
                <CritiqueScore
                  score={prompt.latestCritique.score}
                  size="md"
                  showLabel={true}
                />
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-text-primary mb-4">Prompt Content</h2>
          <div
            className="bg-bg-primary rounded-lg p-4 border border-bg-tertiary overflow-x-auto"
            role="article"
            aria-label="Prompt content"
          >
            <pre className="font-mono text-sm text-text-secondary whitespace-pre-wrap break-words">
              {prompt.content}
            </pre>
          </div>
        </Card>

        {hasHistory && (
          <Card>
            <h2 className="text-xl font-semibold text-text-primary mb-4">Status History</h2>
            <div className="space-y-3" role="list" aria-label="Status change history">
              {prompt.status_history.map((entry: StatusHistoryEntry, index: number) => {
                const fromConfig = STATUS_CONFIG[entry.from];
                const toConfig = STATUS_CONFIG[entry.to];
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="flex items-start gap-3 pb-3 border-b border-bg-tertiary last:border-b-0 last:pb-0"
                    role="listitem"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg" role="img" aria-label={`From ${fromConfig.label}`}>
                        {fromConfig.emoji}
                      </span>
                      <span className="text-text-tertiary text-sm">→</span>
                      <span className="text-lg" role="img" aria-label={`To ${toConfig.label}`}>
                        {toConfig.emoji}
                      </span>
                      <div className="flex-1">
                        <p className="text-text-secondary text-sm">
                          <span className="font-medium">{fromConfig.label}</span>
                          {" → "}
                          <span className="font-medium">{toConfig.label}</span>
                        </p>
                      </div>
                    </div>
                    <time className="text-text-tertiary text-xs whitespace-nowrap" dateTime={entry.timestamp}>
                      {formatDate(entry.timestamp)}
                    </time>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        )}
      </motion.div>
    </main>
  );
}
