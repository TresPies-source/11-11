"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusDot } from "@/components/ui/StatusDot";

export default function TestComponentsPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingClick = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen p-8 space-y-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Component Test Page</h1>
        <p className="text-text-secondary mb-8">
          Testing all UI components with their variants and states
        </p>

        {/* Button Tests */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-bg-tertiary pb-2">
            Button Component
          </h2>

          {/* Primary Variants */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text-secondary">
              Primary Variant
            </h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="primary" size="sm">
                Small Primary
              </Button>
              <Button variant="primary" size="md">
                Medium Primary
              </Button>
              <Button variant="primary" size="lg">
                Large Primary
              </Button>
              <Button variant="primary" size="md" disabled>
                Disabled
              </Button>
              <Button
                variant="primary"
                size="md"
                isLoading={isLoading}
                onClick={handleLoadingClick}
              >
                Click to Load
              </Button>
            </div>
          </div>

          {/* Secondary Variants */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text-secondary">
              Secondary Variant
            </h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="secondary" size="sm">
                Small Secondary
              </Button>
              <Button variant="secondary" size="md">
                Medium Secondary
              </Button>
              <Button variant="secondary" size="lg">
                Large Secondary
              </Button>
              <Button variant="secondary" size="md" disabled>
                Disabled
              </Button>
              <Button variant="secondary" size="md" isLoading>
                Loading
              </Button>
            </div>
          </div>

          {/* Keyboard Navigation Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text-secondary">
              Keyboard Navigation Test (Try Tab + Enter)
            </h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="primary" onClick={() => alert("Button 1 clicked!")}>
                Focusable 1
              </Button>
              <Button variant="secondary" onClick={() => alert("Button 2 clicked!")}>
                Focusable 2
              </Button>
              <Button variant="primary" onClick={() => alert("Button 3 clicked!")}>
                Focusable 3
              </Button>
            </div>
          </div>
        </section>

        {/* Card Tests */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-bg-tertiary pb-2">
            Card Component
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Standard Card */}
            <Card>
              <h3 className="text-xl font-semibold mb-2">Standard Card</h3>
              <p className="text-text-secondary">
                This is a standard card without the glow effect. It has static
                styling and no hover animations.
              </p>
              <div className="mt-4">
                <Button variant="primary" size="sm">
                  Action Button
                </Button>
              </div>
            </Card>

            {/* Glow Card */}
            <Card glow>
              <h3 className="text-xl font-semibold mb-2">Glow Card</h3>
              <p className="text-text-secondary">
                Hover over this card to see the amber glow effect, border color
                change, and subtle lift animation.
              </p>
              <div className="mt-4">
                <Button variant="secondary" size="sm">
                  Hover Me
                </Button>
              </div>
            </Card>

            {/* Card with StatusDots */}
            <Card>
              <h3 className="text-xl font-semibold mb-3">Agent Status Panel</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <StatusDot status="idle" />
                  <span className="text-text-secondary">Idle Agent</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusDot status="working" />
                  <span className="text-text-secondary">Working Agent</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusDot status="success" />
                  <span className="text-text-secondary">Successful Task</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusDot status="error" />
                  <span className="text-text-secondary">Error State</span>
                </div>
              </div>
            </Card>

            {/* Complex Card */}
            <Card glow>
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <StatusDot status="working" size="lg" />
                Active Task
              </h3>
              <p className="text-text-secondary mb-4">
                This card combines multiple components to test integration and
                styling consistency.
              </p>
              <div className="flex gap-2">
                <Button variant="primary" size="sm">
                  Continue
                </Button>
                <Button variant="secondary" size="sm">
                  Pause
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* StatusDot Tests */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-bg-tertiary pb-2">
            StatusDot Component
          </h2>

          {/* All Status Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text-secondary">
              Status Types
            </h3>
            <Card>
              <div className="flex flex-wrap gap-6 items-center">
                <div className="flex items-center gap-2">
                  <StatusDot status="idle" />
                  <span>Idle</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot status="working" />
                  <span>Working (pulse)</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot status="error" />
                  <span>Error</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot status="success" />
                  <span>Success</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot status="default" />
                  <span>Default</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Size Variants */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text-secondary">
              Size Variants
            </h3>
            <Card>
              <div className="flex flex-wrap gap-6 items-center">
                <div className="flex items-center gap-2">
                  <StatusDot status="working" size="sm" />
                  <span>Small (6px)</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot status="working" size="md" />
                  <span>Medium (8px)</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot status="working" size="lg" />
                  <span>Large (12px)</span>
                </div>
              </div>
            </Card>
          </div>

          {/* All Combinations */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text-secondary">
              All Combinations
            </h3>
            <Card>
              <div className="grid grid-cols-3 gap-4">
                {(['idle', 'working', 'error', 'success', 'default'] as const).map(
                  (status) => (
                    <div key={status} className="space-y-2">
                      <div className="text-sm font-medium capitalize">{status}</div>
                      <div className="flex items-center gap-3">
                        <StatusDot status={status} size="sm" />
                        <StatusDot status={status} size="md" />
                        <StatusDot status={status} size="lg" />
                      </div>
                    </div>
                  )
                )}
              </div>
            </Card>
          </div>
        </section>

        {/* Accessibility Tests */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-bg-tertiary pb-2">
            Accessibility Tests
          </h2>

          <Card>
            <h3 className="text-xl font-semibold mb-4">
              Testing Instructions
            </h3>
            <ul className="space-y-2 text-text-secondary list-disc list-inside">
              <li>Use Tab key to navigate through all interactive elements</li>
              <li>Press Enter or Space to activate focused buttons</li>
              <li>Verify focus rings are visible (amber outline)</li>
              <li>Check ARIA attributes in browser DevTools</li>
              <li>Test with screen reader for proper announcements</li>
              <li>Verify StatusDots have appropriate aria-label attributes</li>
            </ul>
          </Card>
        </section>

        {/* Animation Performance */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-bg-tertiary pb-2">
            Animation Performance
          </h2>

          <Card>
            <h3 className="text-xl font-semibold mb-4">Performance Checklist</h3>
            <ul className="space-y-2 text-text-secondary list-disc list-inside">
              <li>Open browser DevTools Performance tab</li>
              <li>Hover over buttons and glow cards repeatedly</li>
              <li>Verify animations run at ~60fps</li>
              <li>Check for smooth transitions with no jank</li>
              <li>Verify pulse animation on working StatusDots is smooth</li>
              <li>Test on both high-end and lower-end devices if possible</li>
            </ul>
          </Card>
        </section>

        {/* Integration Test */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold border-b border-bg-tertiary pb-2">
            Real-World Integration Example
          </h2>

          <Card glow className="max-w-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <StatusDot status="working" size="lg" />
                <div>
                  <h3 className="text-xl font-semibold">Task Execution</h3>
                  <p className="text-sm text-text-secondary">
                    Running automated workflow
                  </p>
                </div>
              </div>
              <StatusDot status="success" />
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <StatusDot status="success" size="sm" />
                <span>Step 1: Configuration loaded</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <StatusDot status="success" size="sm" />
                <span>Step 2: Dependencies verified</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <StatusDot status="working" size="sm" />
                <span>Step 3: Executing main task...</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <StatusDot status="default" size="sm" />
                <span>Step 4: Pending</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="primary" size="md">
                View Details
              </Button>
              <Button variant="secondary" size="md">
                Cancel
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
