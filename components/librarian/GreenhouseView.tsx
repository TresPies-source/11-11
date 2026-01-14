"use client";

import { useLibrarian } from "@/hooks/useLibrarian";
import { GreenhouseSection } from "./GreenhouseSection";
import { PageHeader } from "@/components/shared/PageHeader";
import { Sprout } from "lucide-react";

export function GreenhouseView() {
  const { prompts, loading, error, retry, refresh } = useLibrarian({
    status: "saved",
    enableDriveFallback: true,
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main" aria-label="Saved Prompts Library">
      <PageHeader
        title="My Saved Prompts"
        subtitle="Your cultivated prompts ready to bloom"
        icon={Sprout}
        iconClassName="text-green-500"
      />

      <GreenhouseSection
        prompts={prompts}
        loading={loading}
        error={error}
        onRetry={retry}
        onRefresh={refresh}
      />
    </main>
  );
}
