"use client";

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Save } from 'lucide-react';
import { useDojo } from '@/hooks/useDojo';
import { SessionHistory } from '@/components/dojo/SessionHistory';
import { DojoInput, DojoInputData } from '@/components/dojo/DojoInput';
import { SimpleTextInput } from '@/components/dojo/SimpleTextInput';
import { Button } from '@/components/ui/Button';

export default function DojoSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [sessionTitle, setSessionTitle] = useState('Untitled Session');
  
  const { messages, isLoading, sendMessage } = useDojo(sessionId);

  const handleInitialSubmit = (data: DojoInputData) => {
    sendMessage(data.situation, data.perspectives);
  };

  const handleFollowUpSubmit = (message: string) => {
    sendMessage(message);
  };

  const handleSaveSession = () => {
    alert(`Saving session: ${sessionTitle}`);
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <SessionHistory messages={messages} />
        
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
    </div>
  );
}
