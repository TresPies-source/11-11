"use client";

import { useRouter } from "next/navigation";
import { Filter } from "lucide-react";
import type { PromptStatus } from "@/lib/pglite/types";
import type { StatusFilterValue } from "@/hooks/useStatusFilter";

interface StatusFilterProps {
  currentStatus?: StatusFilterValue;
  onChange: (status: StatusFilterValue) => void;
  showCounts?: boolean;
  counts?: Record<PromptStatus, number>;
  className?: string;
}

export function StatusFilter({
  currentStatus = 'all',
  onChange,
  showCounts = false,
  counts,
  className = "",
}: StatusFilterProps) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'archive-view') {
      router.push('/librarian/archive');
      return;
    }
    onChange(value as StatusFilterValue);
  };

  const getLabel = (status: StatusFilterValue) => {
    if (!showCounts || !counts) {
      return getStatusLabel(status);
    }

    if (status === 'all') {
      const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      return `All (${total})`;
    }

    return `${getStatusLabel(status)} (${counts[status as PromptStatus] || 0})`;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Filter className="h-4 w-4 text-gray-500" aria-hidden="true" />
      <select
        value={currentStatus}
        onChange={handleChange}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
        aria-label="Filter prompts by status"
      >
        <option value="all">{getLabel('all')}</option>
        <option value="draft">{getLabel('draft')}</option>
        <option value="active">{getLabel('active')}</option>
        <option value="saved">{getLabel('saved')}</option>
        <option value="archive-view" disabled={false}>
          📦 Show Archived
        </option>
      </select>
    </div>
  );
}

function getStatusLabel(status: StatusFilterValue): string {
  switch (status) {
    case 'all':
      return 'All';
    case 'draft':
      return '✏️ Draft';
    case 'active':
      return '🌱 Active';
    case 'saved':
      return '🌺 Saved';
    case 'archived':
      return '📦 Archived';
    default:
      return 'All';
  }
}
