'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingHintProps {
  id: string;
  title: string;
  message: string;
  className?: string;
}

export function OnboardingHint({ id, title, message, className }: OnboardingHintProps) {
  const [isVisible, setIsVisible] = useState(false);
  const storageKey = `hub-onboarding-${id}`;

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "bg-blue-500/10 border border-blue-500/20 rounded-lg p-4",
            className
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-blue-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-blue-300 mb-1">
                {title}
              </h3>
              <p className="text-sm text-blue-200/80">
                {message}
              </p>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-blue-300/60 hover:text-blue-300 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Dismiss hint"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
