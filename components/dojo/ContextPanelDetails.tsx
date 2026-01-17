'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Calendar, Hash, MessageSquare, Coins, ChevronDown, ChevronUp } from 'lucide-react';
import { getSession } from '@/lib/pglite/sessions';
import { getSessionMessages } from '@/lib/pglite/session-messages';
import { ModeBadge } from './ModeBadge';
import type { SessionRow } from '@/lib/pglite/types';
import type { DojoMode } from '@/lib/stores/dojo.store';

interface ContextPanelDetailsProps {
  sessionId: string;
}

export function ContextPanelDetails({ sessionId }: ContextPanelDetailsProps) {
  const [session, setSession] = useState<SessionRow | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [situationExpanded, setSituationExpanded] = useState(false);

  useEffect(() => {
    async function loadSessionData() {
      try {
        setLoading(true);
        setError(null);
        
        const [sessionData, messages] = await Promise.all([
          getSession(sessionId),
          getSessionMessages(sessionId),
        ]);

        if (!sessionData) {
          setError('Session not found');
          return;
        }

        setSession(sessionData);
        setMessageCount(messages.length);
      } catch (err) {
        console.error('Error loading session details:', err);
        setError('Failed to load session details');
      } finally {
        setLoading(false);
      }
    }

    if (sessionId && sessionId !== 'new') {
      loadSessionData();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy session ID:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 bg-bg-tertiary rounded animate-pulse" />
            <div className="h-4 w-full bg-bg-tertiary rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-error">{error}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-text-secondary">No session data available</p>
      </div>
    );
  }

  const situationText = session.situation || 'No situation provided';
  const shouldTruncate = situationText.length > 150;
  const displaySituation = shouldTruncate && !situationExpanded 
    ? situationText.slice(0, 150) + '...' 
    : situationText;

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-4">
        <DetailItem
          icon={Hash}
          label="Session ID"
          value={
            <div className="flex items-center gap-2">
              <code className="text-xs text-text-secondary font-mono truncate flex-1">
                {sessionId}
              </code>
              <button
                onClick={handleCopyId}
                className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                aria-label="Copy session ID"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-text-secondary" />
                )}
              </button>
            </div>
          }
        />

        <DetailItem
          icon={Calendar}
          label="Created"
          value={formatDate(session.created_at)}
        />

        <DetailItem
          icon={Calendar}
          label="Last Updated"
          value={formatDate(session.updated_at)}
        />

        {session.mode && (
          <DetailItem
            icon={() => <span className="text-sm">🎯</span>}
            label="Mode"
            value={<ModeBadge mode={session.mode as DojoMode} />}
          />
        )}

        <DetailItem
          icon={MessageSquare}
          label="Messages"
          value={messageCount.toString()}
        />

        {session.total_tokens !== undefined && session.total_tokens > 0 && (
          <DetailItem
            icon={Coins}
            label="Total Tokens"
            value={session.total_tokens.toLocaleString()}
          />
        )}
      </div>

      {session.situation && (
        <div className="pt-4 border-t border-bg-tertiary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              Situation
            </span>
            {shouldTruncate && (
              <button
                onClick={() => setSituationExpanded(!situationExpanded)}
                className="text-xs text-text-accent hover:text-text-accent/80 transition-colors flex items-center gap-1"
              >
                {situationExpanded ? (
                  <>
                    Show less <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    Show more <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-sm text-text-primary whitespace-pre-wrap">
            {displaySituation}
          </p>
        </div>
      )}
    </div>
  );
}

interface DetailItemProps {
  icon: React.ComponentType<{ className?: string }> | (() => JSX.Element);
  label: string;
  value: React.ReactNode;
}

function DetailItem({ icon: Icon, label, value }: DetailItemProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-text-secondary" />
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-sm text-text-primary pl-5">
        {typeof value === 'string' ? value : value}
      </div>
    </div>
  );
}
