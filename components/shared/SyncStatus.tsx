"use client";

import { Cloud, GitBranch, RotateCw } from "lucide-react";
import { SyncStatus as SyncStatusType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface SyncStatusProps {
  status?: SyncStatusType;
}

export function SyncStatus({ status }: SyncStatusProps) {
  const { status: syncStatus, retryLastFailed } = useSyncStatus();
  const [isRetrying, setIsRetrying] = useState(false);

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

  const getDriveStatusColor = (): string => {
    if (syncStatus.currentOperation) return "text-yellow-500";
    if (syncStatus.isError) return "text-red-500";
    return "text-green-500";
  };

  const getDriveStatusText = (): string => {
    if (syncStatus.currentOperation) return "Syncing...";
    if (syncStatus.isError) return "Error";
    return "Synced";
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

  const handleRetry = async () => {
    setIsRetrying(true);
    await retryLastFailed();
    setTimeout(() => setIsRetrying(false), 600);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <motion.div
            initial={false}
            animate={{
              scale: 1,
            }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
          >
            <Cloud
              className={cn(
                "h-4 w-4 transition-colors duration-300",
                getDriveStatusColor()
              )}
            />
          </motion.div>
          <AnimatePresence>
            {syncStatus.currentOperation && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.8, 0.4, 0.8],
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-500 rounded-full"
              />
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={getDriveStatusText()}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="text-xs text-gray-600 hidden sm:inline"
          >
            {getDriveStatusText()}
          </motion.span>
        </AnimatePresence>
        <AnimatePresence>
          {syncStatus.isError && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, x: -4 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -4 }}
              transition={{ 
                duration: 0.2,
                ease: "easeOut",
              }}
              onClick={handleRetry}
              className="ml-1 p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Retry sync"
            >
              <motion.div
                animate={isRetrying ? {
                  rotate: 360,
                } : {
                  rotate: 0,
                }}
                transition={{
                  duration: 0.6,
                  ease: "easeInOut",
                }}
              >
                <RotateCw className="h-3 w-3 text-red-500" />
              </motion.div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1.5">
        <motion.div
          initial={false}
          animate={{
            scale: 1,
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
        >
          <GitBranch
            className={cn(
              "h-4 w-4 transition-colors duration-300",
              getStatusColor(
                mockStatus.github.connected,
                mockStatus.github.syncing
              )
            )}
          />
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.span
            key={getStatusText(mockStatus.github.connected, mockStatus.github.syncing)}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="text-xs text-gray-600 hidden sm:inline"
          >
            {getStatusText(
              mockStatus.github.connected,
              mockStatus.github.syncing
            )}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
