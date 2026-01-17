"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { OnboardingPanel } from './OnboardingPanel';
import { ArtifactGridView } from '@/components/artifacts/ArtifactGridView';
import type { FeedFilters } from '@/lib/hub/types';

export function DojoLandingView() {
  const router = useRouter();

  const handleStartNewSession = () => {
    router.push('/dojo/new');
  };

  const sessionFilters: FeedFilters = {
    types: ['session'],
    dateFrom: null,
    dateTo: null,
    search: '',
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary overflow-x-hidden">
      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="max-w-5xl w-full space-y-8 sm:space-y-12">
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="text-5xl sm:text-6xl lg:text-7xl mb-4 sm:mb-6" role="img" aria-label="Dojo">
                🥋
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary px-4">
                Welcome to the Thinking Room
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-text-secondary max-w-2xl mx-auto px-4">
                A space to think deeply with AI
              </p>
            </div>

            <div className="pt-2 sm:pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartNewSession}
                className="text-sm sm:text-base lg:text-lg"
              >
                Start New Session
              </Button>
            </div>
          </div>

          <OnboardingPanel />

          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Recent Sessions
            </h2>
            <ArtifactGridView
              filters={sessionFilters}
              emptyState={{
                title: "Your thinking room is empty",
                message: "Start your first session to begin",
                action: {
                  label: "Start New Session",
                  onClick: handleStartNewSession,
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
