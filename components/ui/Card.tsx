"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

const Card = React.memo(function Card({
  children,
  className,
  glow = false,
  interactive = false,
  onClick,
}: CardProps) {
  const baseStyles = "bg-bg-secondary border border-bg-tertiary rounded-xl p-6";
  
  if (glow || interactive) {
    return (
      <motion.div
        className={cn(baseStyles, interactive && "cursor-pointer", className)}
        whileHover={{
          borderColor: '#f5a623',
          boxShadow: '0 0 20px rgba(245, 166, 35, 0.15)',
          y: -2,
        }}
        whileTap={interactive ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={cn(baseStyles, className)} onClick={onClick}>
      {children}
    </div>
  );
});

Card.displayName = "Card";

export { Card };
