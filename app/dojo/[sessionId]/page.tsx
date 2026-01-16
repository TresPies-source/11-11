"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Save } from 'lucide-react';
import { useDojo } from '@/hooks/useDojo';
import { useDojoStore } from '@/lib/stores/dojo.store';
import { SessionHistory } from '@/components/dojo/SessionHistory';
import { DojoInput, DojoInputData } from '@/components/dojo/DojoInput';
import { SimpleTextInput } from '@/components/dojo/SimpleTextInput';
import { Button } from '@/components/ui/Button';
import { SaveSessionModal } from '@/components/dojo/SaveSessionModal';
import { TrailOfThoughtPanel } from '@/components/hub/TrailOfThoughtPanel';

export default function DojoSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [sessionTitle, setSessionTitle] = useState('Untitled Session');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  
  const { messages, isLoading, sendMessage } = useDojo(sessionId);
  const loadMessages = useDojoStore((state) => state.loadMessages);

  useEffect(() => {
    if (sessionId && sessionId !== 'new') {
      loadMessages(sessionId).catch((err) => {
        console.error('Failed to load messages on mount:', err);
      });
    }
  }, [sessionId, loadMessages]);

  const handleInitialSubmit = (data: DojoInputData) => {
    sendMessage(data.situation, data.perspectives);
  };

  const handleFollowUpSubmit = (message: string) => {
    sendMessage(message);
  };

  const handleSaveSession = () => {
    setIsSaveModalOpen(true);
  };

  const handleSaveSuccess = () => {
    console.log('[DOJO_PAGE] Session saved successfully');
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      <header className="border-b border-bg-tertiary px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            className="w-full px-3 py-2 bg-bg-secondary border border-bg-elevated rounded-lg focus:outline-none focus:ring-2 focus:border-text-accent focus:ring-text-accent transition-colors text-text-primary placeholder:text-text-muted"
            placeholder="Session title..."
          />
        </div>
        <Button
          onClick={handleSaveSession}
          variant="secondary"
          size="sm"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Save Session</span>
        </Button>
      </header>

      {sessionId !== 'new' && (
        <TrailOfThoughtPanel
          artifactType="session"
          artifactId={sessionId}
          defaultOpen={false}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <SessionHistory messages={messages} sessionId={sessionId} />
        
        {!hasMessages ? (
          <DojoInput 
            onSubmit={handleInitialSubmit}
            isLoading={isLoading}
          />
        ) : (
          <SimpleTextInput 
            onSubmit={handleFollowUpSubmit}
            isLoading={isLoading}
          />
        )}
      </div>

      <SaveSessionModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSuccess={handleSaveSuccess}
        sessionId={sessionId}
        messages={messages}
      />
    </div>
  );
}
