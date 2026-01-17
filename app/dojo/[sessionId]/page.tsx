"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, Download, Trash2 } from 'lucide-react';
import { useDojo } from '@/hooks/useDojo';
import { useDojoStore } from '@/lib/stores/dojo.store';
import { SessionHistory } from '@/components/dojo/SessionHistory';
import { DojoInput, DojoInputData } from '@/components/dojo/DojoInput';
import { SimpleTextInput } from '@/components/dojo/SimpleTextInput';
import { Button } from '@/components/ui/Button';
import { SaveSessionModal } from '@/components/dojo/SaveSessionModal';
import { SessionExportModal } from '@/components/dojo/SessionExportModal';
import { SessionDeleteDialog } from '@/components/dojo/SessionDeleteDialog';
import { ContextPanel } from '@/components/dojo/ContextPanel';
import { ModeBadge } from '@/components/dojo/ModeBadge';

export default function DojoSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [sessionTitle, setSessionTitle] = useState('Untitled Session');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { messages, isLoading, sendMessage } = useDojo(sessionId);
  const loadMessages = useDojoStore((state) => state.loadMessages);
  const currentMode = useDojoStore((state) => state.currentMode);

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

  const handleExportSession = () => {
    setIsExportModalOpen(true);
  };

  const handleSaveSuccess = () => {
    console.log('[DOJO_PAGE] Session saved successfully');
  };

  const handleDeleteSession = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    router.push('/dojo');
  };

  const hasMessages = messages.length > 0;
  const lastMode = messages.length > 0 
    ? messages.filter(m => m.mode).pop()?.mode 
    : null;
  const displayMode = currentMode || lastMode;

  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      <header className="border-b border-bg-tertiary px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3 max-w-2xl">
          <input
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            className="flex-1 px-3 py-2 bg-bg-secondary border border-bg-elevated rounded-lg focus:outline-none focus:ring-2 focus:border-text-accent focus:ring-text-accent transition-colors text-text-primary placeholder:text-text-muted"
            placeholder="Session title..."
          />
          {displayMode && (
            <div className="hidden sm:block">
              <ModeBadge mode={displayMode} />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportSession}
            variant="secondary"
            size="sm"
            disabled={!hasMessages}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            onClick={handleSaveSession}
            variant="secondary"
            size="sm"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button
            onClick={handleDeleteSession}
            variant="secondary"
            size="sm"
            disabled={sessionId === 'new'}
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 flex flex-col overflow-hidden">
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
        </main>

        {sessionId !== 'new' && (
          <ContextPanel sessionId={sessionId} />
        )}
      </div>

      <SaveSessionModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSuccess={handleSaveSuccess}
        sessionId={sessionId}
        messages={messages}
      />

      <SessionExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        sessionId={sessionId}
        sessionTitle={sessionTitle}
      />

      <SessionDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDeleted={handleDeleteSuccess}
        sessionId={sessionId}
        sessionTitle={sessionTitle}
      />
    </div>
  );
}
