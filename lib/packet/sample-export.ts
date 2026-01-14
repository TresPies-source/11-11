import { formatAsJSON, formatAsMarkdown } from './formatters';
import { DojoPacket } from './schema';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const samplePacket: DojoPacket = {
  version: '1.0',
  session: {
    id: 'sample-session-001',
    title: 'Building Authentication System',
    mode: 'Implementation',
    duration: 120,
    created_at: '2026-01-13T10:00:00.000Z',
    updated_at: '2026-01-13T12:00:00.000Z',
    agent_path: ['Supervisor', 'Dojo', 'Implementation'],
  },
  situation: 'Team needs a secure authentication system for the new web application. Current setup uses basic password authentication without 2FA or OAuth support.',
  stake: 'User data security and compliance with industry standards',
  perspectives: [
    {
      text: 'OAuth 2.0 provides better security than traditional password auth',
      source: 'agent',
      timestamp: '2026-01-13T10:15:00.000Z',
    },
    {
      text: 'Users prefer social login options (GitHub, Google)',
      source: 'user',
      timestamp: '2026-01-13T10:20:00.000Z',
    },
    {
      text: 'NextAuth.js integrates seamlessly with Next.js apps',
      source: 'agent',
      timestamp: '2026-01-13T10:25:00.000Z',
    },
  ],
  assumptions: [
    {
      text: 'All users have email addresses',
      challenged: false,
      timestamp: '2026-01-13T10:30:00.000Z',
    },
    {
      text: 'Users will always use modern browsers',
      challenged: true,
      timestamp: '2026-01-13T10:35:00.000Z',
    },
    {
      text: 'Database can handle OAuth token storage',
      challenged: false,
      timestamp: '2026-01-13T10:40:00.000Z',
    },
  ],
  decisions: [
    {
      text: 'Use NextAuth.js for authentication',
      rationale: 'Well-maintained, supports multiple providers, integrates with Next.js, has built-in session management',
      timestamp: '2026-01-13T10:45:00.000Z',
    },
    {
      text: 'Support GitHub and Google OAuth providers initially',
      rationale: 'Most developers have GitHub accounts, and Google is widely used for general users',
      timestamp: '2026-01-13T10:50:00.000Z',
    },
    {
      text: 'Store sessions in database instead of JWT',
      rationale: 'Better control over session invalidation and audit trails',
      timestamp: '2026-01-13T11:00:00.000Z',
    },
  ],
  next_move: {
    action: 'Install NextAuth.js and configure GitHub OAuth provider',
    why: 'Need to set up infrastructure before implementing features',
    smallest_test: 'User can successfully log in with GitHub account',
  },
  artifacts: [
    {
      type: 'code',
      name: 'auth.config.ts',
      content: `import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  providers: [
    {
      id: 'github',
      name: 'GitHub',
      type: 'oauth',
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  ],
  session: {
    strategy: 'database',
  },
} satisfies NextAuthConfig;`,
      url: null,
    },
    {
      type: 'link',
      name: 'NextAuth.js Documentation',
      content: null,
      url: 'https://next-auth.js.org/getting-started/introduction',
    },
    {
      type: 'link',
      name: 'GitHub OAuth Apps Guide',
      content: null,
      url: 'https://docs.github.com/en/developers/apps/building-oauth-apps',
    },
  ],
  trace_summary: {
    total_events: 87,
    agent_transitions: 12,
    cost_total: 0.0456,
    tokens_total: 2850,
  },
  metadata: {
    exported_at: '2026-01-13T12:00:00.000Z',
    exported_by: 'user-789',
    format: 'json',
  },
};

(async () => {
  console.log('Generating sample DojoPacket exports...\n');
  
  console.log('1. Generating JSON export...');
  const jsonOutput = formatAsJSON(samplePacket);
  const jsonPath = join(__dirname, 'sample-export.json');
  await writeFile(jsonPath, jsonOutput, 'utf8');
  console.log(`✓ JSON export saved to: ${jsonPath}`);
  console.log(`  Size: ${jsonOutput.length} bytes\n`);
  
  console.log('2. Generating Markdown export...');
  const markdownOutput = formatAsMarkdown(samplePacket);
  const markdownPath = join(__dirname, 'sample-export.md');
  await writeFile(markdownPath, markdownOutput, 'utf8');
  console.log(`✓ Markdown export saved to: ${markdownPath}`);
  console.log(`  Size: ${markdownOutput.length} bytes\n`);
  
  console.log('✅ Sample exports generated successfully!\n');
})();
