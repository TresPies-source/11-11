import { DojoMessage } from '@/lib/stores/dojo.store';
import { ModeBadge } from './ModeBadge';
import { MessageContextMenu } from './MessageContextMenu';

interface ChatMessageProps {
  message: DojoMessage;
  sessionId: string;
}

function formatRelativeTime(timestamp: number): string {
  try {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 10) {
      return "just now";
    } else if (diffSecs < 60) {
      return `${diffSecs}s ago`;
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      const date = new Date(timestamp);
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: diffDays > 365 ? 'numeric' : undefined });
    }
  } catch {
    return "Unknown time";
  }
}

export function ChatMessage({ message, sessionId }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const formattedTime = formatRelativeTime(message.timestamp);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
      <div
        className={`group relative max-w-[80%] rounded-lg px-4 py-3 transition-all duration-150 ${
          isUser
            ? 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        {!isUser && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <MessageContextMenu message={message} sessionId={sessionId} />
          </div>
        )}
        {!isUser && message.mode && (
          <div className="mb-2 flex items-center justify-between">
            <ModeBadge mode={message.mode} />
          </div>
        )}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-sm whitespace-pre-wrap leading-relaxed m-0">{message.content}</p>
        </div>
        <div className={`mt-2 text-xs opacity-60 ${isUser ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
          {formattedTime}
        </div>
      </div>
    </div>
  );
}
