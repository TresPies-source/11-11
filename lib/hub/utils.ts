import { MessageSquare, FileText, Sprout, File, type LucideIcon } from 'lucide-react';
import type { ArtifactType, RelationshipType } from './types';

export function formatRelativeTime(isoString: string): string {
  try {
    const now = new Date();
    const then = new Date(isoString);
    const diffMs = now.getTime() - then.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 10) {
      return "just now";
    } else if (diffSecs < 60) {
      return `${diffSecs}s ago`;
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  } catch {
    return "Unknown time";
  }
}

export function getArtifactIcon(type: ArtifactType): LucideIcon {
  const icons: Record<ArtifactType, LucideIcon> = {
    session: MessageSquare,
    prompt: FileText,
    seed: Sprout,
    file: File,
  };
  return icons[type];
}

export function getRelationshipLabel(relationship: RelationshipType): string {
  const labels: Record<RelationshipType, string> = {
    extracted_from: 'Extracted from',
    discussed_in: 'Discussed in',
    refined_in: 'Refined in',
    created_from: 'Created from',
  };
  return labels[relationship];
}

export function getArtifactNavigationPath(type: ArtifactType, id: string): string {
  const paths: Record<ArtifactType, string> = {
    session: `/dojo/${id}`,
    prompt: `/library?highlight=${id}`,
    seed: `/seeds?highlight=${id}`,
    file: `/workbench?file=${id}`,
  };
  return paths[type];
}
