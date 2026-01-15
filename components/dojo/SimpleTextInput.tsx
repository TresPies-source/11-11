"use client";

import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Send } from 'lucide-react';

interface SimpleTextInputProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
}

export function SimpleTextInput({ onSubmit, isLoading = false }: SimpleTextInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage || isLoading) {
      return;
    }

    onSubmit(trimmedMessage);
    setMessage('');
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 border-t border-bg-tertiary">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Continue the conversation..."
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-bg-tertiary border border-bg-elevated rounded-lg focus:outline-none focus:ring-2 focus:border-text-accent focus:ring-text-accent transition-colors text-text-primary placeholder:text-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Button
          onClick={handleSubmit}
          variant="primary"
          size="md"
          isLoading={isLoading}
          disabled={!message.trim() || isLoading}
          className="px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
