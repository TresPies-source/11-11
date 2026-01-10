"use client";

import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { ANIMATION_EASE } from "@/lib/constants";

interface NewSessionButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function NewSessionButton({ onClick, disabled }: NewSessionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ duration: 0.2, ease: ANIMATION_EASE }}
      className="fixed bottom-8 right-8 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors z-50"
      title={disabled ? "Maximum panels reached (6)" : "New Session"}
    >
      <Plus className="w-6 h-6" />
    </motion.button>
  );
}
