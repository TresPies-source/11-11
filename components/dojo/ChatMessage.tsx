import { DojoMessage } from '@/lib/stores/dojo.store';
import { ModeBadge } from './ModeBadge';
import { MessageContextMenu } from './MessageContextMenu';

interface ChatMessageProps {
  message: DojoMessage;
  sessionId: string;
}

export function ChatMessage({ message, sessionId }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
      <div
        className={`group relative max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-500 dark:bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
        }`}
      >
        {!isUser && (
          <div className="absolute top-2 right-2">
            <MessageContextMenu message={message} sessionId={sessionId} />
          </div>
        )}
        {!isUser && message.mode && (
          <div className="mb-2">
            <ModeBadge mode={message.mode} />
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
