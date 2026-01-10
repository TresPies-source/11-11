"use client";

import { Cloud, GitBranch } from "lucide-react";
import { SyncStatus as SyncStatusType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SyncStatusProps {
  status?: SyncStatusType;
}

export function SyncStatus({ status }: SyncStatusProps) {
  const mockStatus: SyncStatusType = status ?? {
    googleDrive: {
      connected: true,
      lastSync: new Date(),
      syncing: false,
    },
    github: {
      connected: true,
      lastSync: new Date(),
      syncing: false,
    },
  };

  const getStatusColor = (
    connected: boolean,
    syncing: boolean
  ): string => {
    if (syncing) return "text-yellow-500";
    if (connected) return "text-green-500";
    return "text-gray-400";
  };

  const getStatusText = (
    connected: boolean,
    syncing: boolean
  ): string => {
    if (syncing) return "Syncing...";
    if (connected) return "Synced";
    return "Disconnected";
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <Cloud
          className={cn(
            "h-4 w-4",
            getStatusColor(
              mockStatus.googleDrive.connected,
              mockStatus.googleDrive.syncing
            )
          )}
        />
        <span className="text-xs text-gray-600 hidden sm:inline">
          {getStatusText(
            mockStatus.googleDrive.connected,
            mockStatus.googleDrive.syncing
          )}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <GitBranch
          className={cn(
            "h-4 w-4",
            getStatusColor(
              mockStatus.github.connected,
              mockStatus.github.syncing
            )
          )}
        />
        <span className="text-xs text-gray-600 hidden sm:inline">
          {getStatusText(
            mockStatus.github.connected,
            mockStatus.github.syncing
          )}
        </span>
      </div>
    </div>
  );
}
