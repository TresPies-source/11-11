import { DojoMessage, DojoMode } from '@/lib/stores/dojo.store';
import { ModeBadge } from './ModeBadge';

interface ChatMessageProps {
  role: 'user' | 'agent';
  content: string;
  mode?: DojoMode;
  timestamp: number;
}

export function ChatMessage({ role, content, mode, timestamp }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-500 dark:bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
        }`}
      >
        {!isUser && mode && (
          <div className="mb-2">
            <ModeBadge mode={mode} />
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
