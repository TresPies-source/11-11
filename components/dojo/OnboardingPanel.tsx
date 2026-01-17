"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { DojoMode } from '@/lib/stores/dojo.store';

const STORAGE_KEY = 'dojo:onboarding:collapsed';

interface ModeInfo {
  emoji: string;
  color: string;
  background: string;
  description: string;
}

const MODE_INFO: Record<DojoMode, ModeInfo> = {
  Mirror: {
    emoji: '🪞',
    color: 'text-blue-900 dark:text-blue-300',
    background: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'Reflects your thinking back to you, helping you see blind spots and clarify your thoughts. Use when you need to untangle complex feelings or decisions.',
  },
  Scout: {
    emoji: '🔍',
    color: 'text-purple-900 dark:text-purple-300',
    background: 'bg-purple-100 dark:bg-purple-900/30',
    description: 'Explores possibilities and uncovers hidden connections. Use when you\'re stuck or need to see alternatives.',
  },
  Gardener: {
    emoji: '🌱',
    color: 'text-green-900 dark:text-green-300',
    background: 'bg-green-100 dark:bg-green-900/30',
    description: 'Nurtures ideas and helps them grow. Use when you have a seed of an idea that needs development.',
  },
  Implementation: {
    emoji: '⚙️',
    color: 'text-orange-900 dark:text-orange-300',
    background: 'bg-orange-100 dark:bg-orange-900/30',
    description: 'Turns ideas into action plans. Use when you\'re ready to move from thinking to doing.',
  },
};

export function OnboardingPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setIsCollapsed(stored === 'true');
      }
    }
  }, []);

  const toggleCollapse = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(newValue));
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
      <div className="bg-bg-secondary border border-bg-tertiary rounded-lg overflow-hidden shadow-lg">
        <button
          onClick={toggleCollapse}
          className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-bg-tertiary transition-all duration-150"
          aria-expanded={!isCollapsed}
          aria-controls="onboarding-content"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-left">
            <span className="text-base sm:text-lg font-semibold text-text-primary">
              How the Dojo Works
            </span>
            <span className="text-xs sm:text-sm text-text-tertiary">
              (Four Thinking Modes)
            </span>
          </div>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-text-secondary flex-shrink-0" />
          ) : (
            <ChevronUp className="w-5 h-5 text-text-secondary flex-shrink-0" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              id="onboarding-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ 
                duration: 0.25, 
                ease: [0.32, 0.72, 0, 1],
                opacity: { duration: 0.15 }
              }}
            >
              <div className="px-4 sm:px-6 pb-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {(Object.keys(MODE_INFO) as DojoMode[]).map((mode) => {
                    const info = MODE_INFO[mode];
                    return (
                      <div
                        key={mode}
                        className={`p-3 sm:p-4 rounded-lg border border-bg-elevated ${info.background} backdrop-blur-sm`}
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="text-2xl sm:text-3xl flex-shrink-0">
                            {info.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-sm sm:text-base mb-1 ${info.color}`}>
                              {mode}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-700 dark:text-text-secondary leading-relaxed">
                              {info.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
