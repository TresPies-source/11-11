'use client';

import { useEffect, useRef } from 'react';
import { DojoMessage } from '@/lib/stores/dojo.store';
import { ChatMessage } from './ChatMessage';

interface SessionHistoryProps {
  messages: DojoMessage[];
}

export function SessionHistory({ messages }: SessionHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🥋</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Welcome to the Dojo
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Share your situation and perspectives to begin a thinking partnership.
            The Dojo agent will help you explore possibilities and clarify your thoughts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
    >
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          role={message.role}
          content={message.content}
          mode={message.mode}
          timestamp={message.timestamp}
        />
      ))}
    </div>
  );
}
