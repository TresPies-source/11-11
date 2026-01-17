import { getSession } from '@/lib/pglite/sessions';
import { getSessionMessages } from '@/lib/pglite/session-messages';

export interface ExportOptions {
  includeMetadata?: boolean;
  includeTimestamps?: boolean;
}

export async function exportSessionAsMarkdown(
  sessionId: string,
  options: ExportOptions = {}
): Promise<string> {
  const session = await getSession(sessionId);
  const messages = await getSessionMessages(sessionId);

  if (!session) {
    throw new Error('Session not found');
  }

  let markdown = `# ${session.title || 'Untitled Session'}\n\n`;

  if (options.includeMetadata) {
    markdown += `**Created**: ${new Date(session.created_at).toLocaleString()}\n`;
    if (session.mode) {
      markdown += `**Mode**: ${session.mode}\n`;
    }
    if (session.situation) {
      markdown += `**Situation**: ${session.situation}\n`;
    }
    markdown += '\n';
  }

  markdown += `---\n\n`;

  for (const msg of messages) {
    const timestamp = options.includeTimestamps
      ? ` *${new Date(msg.timestamp).toLocaleTimeString()}*`
      : '';
    const role = msg.role === 'user' ? 'You' : 'Dojo';
    const mode = msg.mode ? ` [${msg.mode}]` : '';

    markdown += `### ${role}${mode}${timestamp}\n\n`;
    markdown += `${msg.content}\n\n`;
  }

  return markdown;
}

export function downloadMarkdown(markdown: string, filename: string): void {
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateDefaultFilename(sessionTitle?: string): string {
  const title = sessionTitle || 'session';
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const date = new Date().toISOString().split('T')[0];
  return `${sanitized}-${date}.md`;
}
