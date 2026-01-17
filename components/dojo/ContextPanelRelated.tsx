'use client';

import { Sparkles } from 'lucide-react';

interface ContextPanelRelatedProps {
  sessionId: string;
}

export function ContextPanelRelated({ sessionId }: ContextPanelRelatedProps) {
  return (
    <div className="p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg-tertiary mb-4">
        <Sparkles className="w-6 h-6 text-text-accent" />
      </div>
      <h3 className="text-sm font-medium text-text-primary mb-2">
        No related artifacts yet
      </h3>
      <p className="text-xs text-text-secondary max-w-sm mx-auto">
        As you continue working, related sessions, seeds, and other artifacts will appear here.
      </p>
    </div>
  );
}
