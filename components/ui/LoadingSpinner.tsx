"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeStyles = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <motion.div
      className={cn("relative", sizeStyles[size], className)}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <svg className="w-full h-full" viewBox="0 0 50 50">
        <motion.circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-text-accent opacity-25"
        />
        <motion.circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-text-accent"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 0.75 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>
    </motion.div>
  );
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-text-accent"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function LoadingPulse({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("w-3 h-3 rounded-full bg-text-accent", className)}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [1, 0.5, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
