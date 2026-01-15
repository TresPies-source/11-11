"use client";

import { PromptDetailView } from "@/components/librarian/PromptDetailView";

interface PromptDetailPageProps {
  params: {
    id: string;
  };
}

export default function PromptDetailPage({ params }: PromptDetailPageProps) {
  return <PromptDetailView promptId={params.id} />;
}
