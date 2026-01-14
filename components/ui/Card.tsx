"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

const Card = React.memo(function Card({
  children,
  className,
  glow = false,
}: CardProps) {
  const baseStyles = "bg-bg-secondary border border-bg-tertiary rounded-xl p-6";
  
  if (glow) {
    return (
      <motion.div
        className={cn(baseStyles, className)}
        whileHover={{
          borderColor: '#f5a623',
          boxShadow: '0 0 20px rgba(245, 166, 35, 0.15)',
          y: -2,
        }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={cn(baseStyles, className)}>
      {children}
    </div>
  );
});

Card.displayName = "Card";

export { Card };
