"use client";

import { useState, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Eye, Trash2, Leaf, TrendingUp, CheckCircle, X, FileEdit, MessageSquare,
  Globe, User, PlayCircle, Copy, Check, Pencil, RefreshCw, Archive
} from "lucide-react";
import type { SeedRow } from "@/lib/seeds/types";
import type { PromptWithCritique } from "@/lib/pglite/prompts";
import type { SessionRow } from "@/lib/pglite/types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { TrailOfThoughtPanel } from "@/components/hub/TrailOfThoughtPanel";
import { CritiqueScore } from "@/components/librarian/CritiqueScore";
import { PublicToggle } from "@/components/librarian/PublicToggle";
import { PublicBadge } from "@/components/librarian/PublicBadge";
import { useToast } from "@/hooks/useToast";
import { useWorkbenchStore } from "@/lib/stores/workbench.store";
import { usePromptStatus } from "@/hooks/usePromptStatus";
import { createSessionFromContext } from "@/lib/hub/context-injection";
import { updateSeed, deleteSeed } from "@/lib/pglite/seeds";

export type CardArtifact = SeedRow | PromptWithCritique | SessionRow;

interface ArtifactCardProps {
  artifact: CardArtifact;
  searchQuery?: string;
  onStatusChange?: () => void;
  onDelete?: (artifact: CardArtifact) => void;
}

const isSeed = (artifact: CardArtifact): artifact is SeedRow => {
  return 'type' in artifact && 'name' in artifact && 'why_matters' in artifact;
};

const isPrompt = (artifact: CardArtifact): artifact is PromptWithCritique => {
  return 'title' in artifact && 'content' in artifact && 'status' in artifact && 'visibility' in artifact;
};

const isSession = (artifact: CardArtifact): artifact is SessionRow => {
  return 'situation' in artifact && 'mode' in artifact;
};

const SEED_TYPE_COLORS = {
  principle: {
    bg: "bg-info/10",
    text: "text-info",
    border: "border-info/30",
  },
  pattern: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/30",
  },
  question: {
    bg: "bg-librarian/10",
    text: "text-librarian",
    border: "border-librarian/30",
  },
  route: {
    bg: "bg-dojo/10",
    text: "text-dojo",
    border: "border-dojo/30",
  },
  artifact: {
    bg: "bg-supervisor/10",
    text: "text-supervisor",
    border: "border-supervisor/30",
  },
  constraint: {
    bg: "bg-error/10",
    text: "text-error",
    border: "border-error/30",
  },
};

const SEED_STATUS_CONFIG = {
  new: {
    Icon: Leaf,
    color: "text-muted",
  },
  growing: {
    Icon: TrendingUp,
    color: "text-success",
  },
  mature: {
    Icon: CheckCircle,
    color: "text-info",
  },
  compost: {
    Icon: X,
    color: "text-error",
  },
};

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffInDays / 365)} year${Math.floor(diffInDays / 365) > 1 ? 's' : ''} ago`;
}

export const ArtifactCard = memo(function ArtifactCard({
  artifact,
  searchQuery,
  onStatusChange,
  onDelete,
}: ArtifactCardProps) {
  const router = useRouter();
  const toast = useToast();
  const { setPendingSeedId, setPendingPromptId } = useWorkbenchStore();
  const { transitionStatus, transitioning } = usePromptStatus();
  const [isHovering, setIsHovering] = useState(false);
  const [discussing, setDiscussing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const highlightText = useCallback((text: string, query?: string) => {
    if (!query || !query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/60 text-gray-900 dark:text-yellow-100 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);

  const handleCardClick = useCallback(() => {
    if (isSeed(artifact)) {
      return;
    } else if (isPrompt(artifact)) {
      router.push(`/librarian/${artifact.id}`);
    } else if (isSession(artifact)) {
      router.push(`/dojo/${artifact.id}`);
    }
  }, [artifact, router]);

  if (isSeed(artifact)) {
    const seed = artifact;
    const typeColors = SEED_TYPE_COLORS[seed.type];
    const statusConfig = SEED_STATUS_CONFIG[seed.status];
    const StatusIcon = statusConfig.Icon;

    const handleUpdateStatus = async (status: typeof seed.status) => {
      if (seed.status === status) return;

      try {
        const result = await updateSeed(seed.id, { status });
        if (result) {
          toast.success(`Seed status updated to ${status}`);
          onStatusChange?.();
        } else {
          toast.error("Failed to update seed status");
        }
      } catch (err) {
        console.error("Error updating seed:", err);
        toast.error("Failed to update seed status");
      }
    };

    const handleDelete = async () => {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${seed.name}"? This action cannot be undone.`
      );

      if (!confirmed) return;

      try {
        const success = await deleteSeed(seed.id);
        if (success) {
          toast.success("Seed deleted");
          onDelete?.(seed);
        } else {
          toast.error("Failed to delete seed");
        }
      } catch (err) {
        console.error("Error deleting seed:", err);
        toast.error("Failed to delete seed");
      }
    };

    const handleOpenInWorkbench = () => {
      setPendingSeedId(seed.id);
      router.push("/workbench");
    };

    const handleDiscussInDojo = async () => {
      if (discussing) return;

      setDiscussing(true);
      try {
        const situation = `Let's discuss this seed: "${seed.name}"`;
        const perspectives = seed.why_matters ? [seed.why_matters] : [];

        const result = await createSessionFromContext({
          artifact_type: 'seed',
          artifact_id: seed.id,
          situation,
          perspectives,
          user_id: 'dev-user',
          title: `Discuss: ${seed.name}`,
        });

        toast.success("Dojo session started");
        router.push(`/dojo/${result.session_id}`);
      } catch (error) {
        console.error("Error creating Dojo session:", error);
        toast.error("Failed to start Dojo session");
      } finally {
        setDiscussing(false);
      }
    };

    return (
      <motion.div
        layoutId={`seed-card-${seed.id}`}
        layout
        role="article"
        aria-label={`Seed: ${seed.name}. Type: ${seed.type}. Status: ${seed.status}`}
        className={cn(
          "group bg-bg-secondary rounded-lg border p-4 transition-all duration-200 flex flex-col h-full",
          typeColors.border,
          "hover:shadow-lg"
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.2)" }}
        onHoverStart={() => setIsHovering(true)}
        onHoverEnd={() => setIsHovering(false)}
        transition={{ duration: 0.2 }}
      >
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                  typeColors.bg,
                  typeColors.text
                )}
              >
                {seed.type}
              </span>
              <motion.div
                animate={{
                  scale: isHovering ? 1.1 : 1,
                  rotate: isHovering && seed.status === "growing" ? 180 : 0,
                }}
                transition={{ duration: 0.2 }}
                aria-hidden="true"
              >
                <StatusIcon className={cn("w-4 h-4", statusConfig.color)} />
              </motion.div>
            </div>
          </div>

          <h3 className="font-semibold text-text-primary mb-2 line-clamp-2">
            {highlightText(seed.name, searchQuery)}
          </h3>

          {seed.why_matters && (
            <p className="text-sm text-text-secondary mb-2 line-clamp-2">
              {highlightText(seed.why_matters, searchQuery)}
            </p>
          )}

          {seed.revisit_when && (
            <p className="text-xs text-text-tertiary mb-3">
              <strong>Revisit when:</strong> {seed.revisit_when}
            </p>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-bg-tertiary space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUpdateStatus("new")}
              disabled={seed.status === "new"}
              className={cn(
                "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-100 active:scale-95",
                seed.status === "new"
                  ? "bg-bg-tertiary/30 text-text-muted cursor-not-allowed"
                  : "bg-bg-tertiary/50 text-text-secondary hover:bg-bg-tertiary"
              )}
              aria-label={`Mark ${seed.name} as Keep`}
            >
              Keep
            </button>
            <button
              onClick={() => handleUpdateStatus("growing")}
              disabled={seed.status === "growing"}
              className={cn(
                "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-100 active:scale-95",
                seed.status === "growing"
                  ? "bg-success/20 text-success/50 cursor-not-allowed"
                  : "bg-success/30 text-success hover:bg-success/40"
              )}
              aria-label={`Mark ${seed.name} as Grow`}
            >
              Grow
            </button>
            <button
              onClick={() => handleUpdateStatus("compost")}
              disabled={seed.status === "compost"}
              className={cn(
                "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-100 active:scale-95",
                seed.status === "compost"
                  ? "bg-supervisor/20 text-supervisor/50 cursor-not-allowed"
                  : "bg-supervisor/30 text-supervisor hover:bg-supervisor/40"
              )}
              aria-label={`Mark ${seed.name} as Compost`}
            >
              Compost
            </button>
          </div>

          <button
            onClick={handleOpenInWorkbench}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-supervisor/30 text-supervisor rounded-md hover:bg-supervisor/40 transition-all duration-100 active:scale-95 text-sm font-medium"
            aria-label={`Open ${seed.name} in Workbench`}
          >
            <FileEdit className="w-4 h-4" />
            Open in Workbench
          </button>

          <button
            onClick={handleDiscussInDojo}
            disabled={discussing}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2 bg-dojo/30 text-dojo rounded-md hover:bg-dojo/40 transition-all duration-100 active:scale-95 text-sm font-medium",
              discussing && "opacity-50 cursor-not-allowed"
            )}
            aria-label={`Discuss ${seed.name} in Dojo`}
          >
            <MessageSquare className="w-4 h-4" />
            {discussing ? "Starting..." : "Discuss in Dojo"}
          </button>

          <div className="flex items-center justify-between">
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-error hover:bg-error/10 transition-all duration-100 active:scale-95"
              aria-label={`Delete ${seed.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>

            <div className="text-xs text-text-muted">
              {new Date(seed.updated_at).toLocaleDateString()}
            </div>
          </div>

          <TrailOfThoughtPanel artifactType="seed" artifactId={seed.id} className="mt-2" />
        </div>
      </motion.div>
    );
  }

  if (isPrompt(artifact)) {
    const prompt = artifact;
    const title = prompt.title;
    const description =
      prompt.metadata?.description ||
      prompt.content.split("\n").slice(0, 3).join(" ").slice(0, 150) + "...";
    const tags = prompt.metadata?.tags || [];

    const handleQuickCopy = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (prompt.content) {
        await navigator.clipboard.writeText(prompt.content);
        toast.success("Prompt copied to clipboard");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    const handleRunInChat = (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/?loadPrompt=${prompt.id}`);
    };

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/librarian/greenhouse?edit=${prompt.id}`);
    };

    const handleOpenInWorkbench = (e: React.MouseEvent) => {
      e.stopPropagation();
      setPendingPromptId(prompt.id);
      router.push("/workbench");
    };

    const handleDiscussInDojo = async (e: React.MouseEvent) => {
      e.stopPropagation();
      setDiscussing(true);
      try {
        const { session_id } = await createSessionFromContext({
          artifact_type: "prompt",
          artifact_id: prompt.id,
          situation: `I want to discuss my prompt: "${title}"`,
          user_id: "dev-user",
        });
        router.push(`/dojo/${session_id}`);
      } catch (error) {
        console.error("Failed to create Dojo session:", error);
        toast.error("Failed to start Dojo session");
        setDiscussing(false);
      }
    };

    return (
      <motion.div
        layoutId={`prompt-card-${prompt.id}`}
        layout
        role="article"
        aria-label={`Saved prompt: ${title}. Score: ${prompt.latestCritique?.score ?? 0} out of 100`}
        tabIndex={0}
        onClick={handleCardClick}
        className="cursor-pointer focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card glow={true} className="group flex flex-col h-full">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0" role="img" aria-label="saved prompt">
                  🌺
                </span>
                <h3 className="font-semibold text-text-primary group-hover:text-librarian transition-colors line-clamp-2 flex-1">
                  {highlightText(title, searchQuery)}
                </h3>
              </div>
              {prompt.visibility === 'public' && <PublicBadge variant="compact" />}
            </div>

            <p className="text-sm text-text-secondary mb-3 line-clamp-3 ml-10">
              {highlightText(description, searchQuery)}
            </p>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3 ml-10">
                {tags.map((tag, index) => (
                  <Tag 
                    key={index} 
                    label={tag}
                  />
                ))}
              </div>
            )}

            <div className="ml-10 space-y-2">
              <CritiqueScore
                score={prompt.latestCritique?.score ?? 0}
                size="sm"
                showLabel={false}
              />
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()} className="mt-auto pt-3 border-t border-bg-tertiary space-y-2">
            <PublicToggle
              promptId={prompt.id}
              visibility={prompt.visibility}
              authorName={prompt.author_name || 'Anonymous'}
              className="w-full"
            />

            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunInChat}
                aria-label={`Run ${title} in chat`}
                disabled={transitioning}
                className="flex-1"
              >
                <PlayCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Run</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleQuickCopy}
                aria-label={copied ? `Copied ${title} to clipboard` : `Copy ${title} to clipboard`}
                disabled={transitioning}
                className={cn(
                  "flex-1",
                  copied && "bg-success text-white hover:bg-success/90"
                )}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="hidden sm:inline">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleEdit}
                aria-label={`Edit ${title}`}
                disabled={transitioning}
                className="flex-1"
              >
                <Pencil className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenInWorkbench}
                aria-label={`Open ${title} in Workbench`}
                disabled={transitioning}
                className="flex-1 bg-purple-600 dark:bg-purple-700 text-white hover:bg-purple-700 dark:hover:bg-purple-600"
              >
                <FileEdit className="h-4 w-4" />
                <span className="hidden sm:inline">Workbench</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleDiscussInDojo}
                aria-label={`Discuss ${title} in Dojo`}
                disabled={transitioning || discussing}
                className={cn(
                  "flex-1 bg-orange-600 dark:bg-orange-700 text-white hover:bg-orange-700 dark:hover:bg-orange-600",
                  (transitioning || discussing) && "opacity-50 cursor-not-allowed"
                )}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">{discussing ? "Starting..." : "Dojo"}</span>
              </Button>
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()} className="mt-2">
            <TrailOfThoughtPanel artifactType="prompt" artifactId={prompt.id} />
          </div>
        </Card>
      </motion.div>
    );
  }

  if (isSession(artifact)) {
    const session = artifact;
    const title = session.title || session.situation || 'Untitled Session';
    const description = session.situation?.slice(0, 150) + (session.situation && session.situation.length > 150 ? '...' : '') || '';

    return (
      <motion.div
        layoutId={`session-card-${session.id}`}
        layout
        role="article"
        aria-label={`Session: ${title}`}
        tabIndex={0}
        onClick={handleCardClick}
        className="cursor-pointer focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card glow={true} className="group flex flex-col h-full">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0" role="img" aria-label="dojo session">
                  🥋
                </span>
                <h3 className="font-semibold text-text-primary group-hover:text-dojo transition-colors line-clamp-2 flex-1">
                  {highlightText(title, searchQuery)}
                </h3>
              </div>
            </div>

            <p className="text-sm text-text-secondary mb-3 line-clamp-3 ml-10">
              {highlightText(description, searchQuery)}
            </p>

            {session.mode && (
              <div className="ml-10 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-dojo/10 text-dojo">
                  {session.mode}
                </span>
              </div>
            )}
          </div>

          <div className="mt-auto pt-3 border-t border-bg-tertiary">
            <div className="text-xs text-text-muted">
              {new Date(session.updated_at).toLocaleDateString()}
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()} className="mt-2">
            <TrailOfThoughtPanel artifactType="session" artifactId={session.id} />
          </div>
        </Card>
      </motion.div>
    );
  }

  return null;
});
