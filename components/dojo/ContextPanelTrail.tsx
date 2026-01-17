'use client';

import { TrailOfThoughtPanel } from '@/components/hub/TrailOfThoughtPanel';

interface ContextPanelTrailProps {
  sessionId: string;
}

export function ContextPanelTrail({ sessionId }: ContextPanelTrailProps) {
  if (sessionId === 'new') {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-text-secondary">
          Trail will be available after you save this session
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <TrailOfThoughtPanel
        artifactType="session"
        artifactId={sessionId}
        defaultOpen={true}
        className="border-0"
      />
    </div>
  );
}
