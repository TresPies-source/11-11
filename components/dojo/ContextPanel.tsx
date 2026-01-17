'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getContextPanelState, 
  setContextPanelState,
  getActiveTab,
  setActiveTab,
  type ContextPanelTab 
} from '@/lib/dojo/storage';
import { ContextPanelDetails } from './ContextPanelDetails';
import { ContextPanelTrail } from './ContextPanelTrail';
import { ContextPanelRelated } from './ContextPanelRelated';

interface ContextPanelProps {
  sessionId: string;
  defaultOpen?: boolean;
  defaultTab?: ContextPanelTab;
  className?: string;
}

const tabs: { id: ContextPanelTab; label: string }[] = [
  { id: 'details', label: 'Details' },
  { id: 'trail', label: 'Trail' },
  { id: 'related', label: 'Related' },
];

export function ContextPanel({ 
  sessionId, 
  defaultOpen, 
  defaultTab,
  className 
}: ContextPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? getContextPanelState());
  const [activeTab, setActiveTabState] = useState<ContextPanelTab>(defaultTab ?? getActiveTab());

  useEffect(() => {
    setContextPanelState(isOpen);
  }, [isOpen]);

  useEffect(() => {
    setActiveTab(activeTab);
  }, [activeTab]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleTabChange = (tab: ContextPanelTab) => {
    setActiveTabState(tab);
  };

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 320 : 0 }}
        transition={{ duration: 0.25, ease: isOpen ? 'easeOut' : 'easeIn' }}
        className={cn(
          'hidden md:flex flex-col border-l border-bg-tertiary bg-bg-secondary overflow-hidden',
          className
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, delay: 0.05, ease: 'easeOut' }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="border-b border-bg-tertiary px-4 py-3 flex items-center justify-between">
                <div className="flex gap-1" role="tablist" aria-label="Session context tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      aria-controls={`${tab.id}-panel`}
                      id={`${tab.id}-tab`}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150',
                        activeTab === tab.id
                          ? 'bg-bg-tertiary text-text-primary'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {activeTab === 'details' && (
                  <div role="tabpanel" id="details-panel" aria-labelledby="details-tab">
                    <ContextPanelDetails sessionId={sessionId} />
                  </div>
                )}
                {activeTab === 'trail' && (
                  <div role="tabpanel" id="trail-panel" aria-labelledby="trail-tab">
                    <ContextPanelTrail sessionId={sessionId} />
                  </div>
                )}
                {activeTab === 'related' && (
                  <div role="tabpanel" id="related-panel" aria-labelledby="related-tab">
                    <ContextPanelRelated sessionId={sessionId} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      <button
        onClick={handleToggle}
        className={cn(
          'hidden md:flex items-center justify-center w-6 h-12 bg-bg-secondary border border-bg-tertiary rounded-l-lg hover:bg-bg-tertiary transition-all duration-150',
          'absolute right-0 top-20 z-10'
        )}
        aria-label={isOpen ? 'Close context panel' : 'Open context panel'}
      >
        {isOpen ? (
          <ChevronRight className="w-4 h-4 text-text-secondary" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-text-secondary" />
        )}
      </button>

      {/* Mobile bottom sheet */}
      <div className="md:hidden">
        <button
          onClick={handleToggle}
          className="fixed bottom-4 right-4 w-12 h-12 bg-text-accent text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-text-accent/90 hover:scale-105 transition-all duration-150"
          aria-label={isOpen ? 'Close context panel' : 'Open context panel'}
        >
          {isOpen ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={handleToggle}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="fixed inset-x-0 bottom-0 h-[70vh] bg-bg-secondary rounded-t-2xl shadow-2xl z-40 flex flex-col overflow-hidden"
              >
                <div className="border-b border-bg-tertiary px-4 py-3">
                  <div className="flex gap-1 mb-2" role="tablist" aria-label="Session context tabs">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`${tab.id}-panel-mobile`}
                        id={`${tab.id}-tab-mobile`}
                        onClick={() => handleTabChange(tab.id)}
                        className={cn(
                          'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150',
                          activeTab === tab.id
                            ? 'bg-bg-tertiary text-text-primary'
                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {activeTab === 'details' && (
                    <div role="tabpanel" id="details-panel-mobile" aria-labelledby="details-tab-mobile">
                      <ContextPanelDetails sessionId={sessionId} />
                    </div>
                  )}
                  {activeTab === 'trail' && (
                    <div role="tabpanel" id="trail-panel-mobile" aria-labelledby="trail-tab-mobile">
                      <ContextPanelTrail sessionId={sessionId} />
                    </div>
                  )}
                  {activeTab === 'related' && (
                    <div role="tabpanel" id="related-panel-mobile" aria-labelledby="related-tab-mobile">
                      <ContextPanelRelated sessionId={sessionId} />
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
