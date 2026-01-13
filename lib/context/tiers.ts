import type { ContextBuildOptions, TierContent, PruningStrategy } from './types';
import { countTokens } from './tokens';
import { getDB } from '../pglite/client';

const SYSTEM_PROMPTS: Record<string, string> = {
  supervisor: `You are the Supervisor agent, responsible for coordinating other agents and managing workflows.
Your role is to analyze user queries, route them to the appropriate agent, and synthesize responses.
You have access to Dojo, Librarian, and Debugger agents.`,
  
  dojo: `You are the Dojo agent, a core thinking partner for exploring perspectives and generating next moves.
Your role is to help users think through complex problems, consider multiple perspectives, and develop actionable plans.
You excel at strategic thinking and creative problem-solving.`,
  
  librarian: `You are the Librarian agent, specialized in semantic search and retrieval.
Your role is to find relevant seed patches and project memory based on user queries.
You provide contextually relevant suggestions and help users discover useful prompts.`,
  
  debugger: `You are the Debugger agent, focused on conflict resolution and reasoning validation.
Your role is to analyze logical inconsistencies, validate reasoning chains, and resolve conflicts.
You excel at critical analysis and identifying edge cases.`,
  
  default: `You are an AI assistant helping users with their tasks.
You provide thoughtful, accurate, and helpful responses.`
};

function getSystemPromptForAgent(agent: string): string {
  return SYSTEM_PROMPTS[agent.toLowerCase()] || SYSTEM_PROMPTS.default;
}

export function buildTier1(options: ContextBuildOptions): TierContent {
  const systemPrompt = getSystemPromptForAgent(options.agent);
  
  const currentQuery = options.messages.length > 0
    ? options.messages[options.messages.length - 1]?.content || ''
    : '';
  
  const content = `${systemPrompt}\n\nCurrent Query: ${currentQuery}`;
  const tokenCount = countTokens(content);
  
  return {
    tier: 'tier1',
    content,
    tokenCount,
    source: 'system_prompt+query',
  };
}

export async function buildTier2(
  options: ContextBuildOptions,
  strategy: PruningStrategy
): Promise<TierContent> {
  try {
    let seeds: string[] = [];
    
    if (strategy.tier2Items === 'all') {
      seeds = await getAllActiveSeeds(options.userId);
    } else if (typeof strategy.tier2Items === 'number' && strategy.tier2Items > 0) {
      seeds = await getTopNSeeds(options.userId, strategy.tier2Items);
    }
    
    const content = seeds.length > 0 ? seeds.join('\n\n---\n\n') : '';
    const tokenCount = countTokens(content);
    
    return {
      tier: 'tier2',
      content,
      tokenCount,
      source: 'seeds',
    };
  } catch (error) {
    console.warn('[TIER2] Failed to build tier 2 context:', error);
    return {
      tier: 'tier2',
      content: '',
      tokenCount: 0,
      source: 'seeds',
    };
  }
}

export async function buildTier3(
  options: ContextBuildOptions,
  strategy: PruningStrategy
): Promise<TierContent> {
  if (strategy.tier3Mode === 'none') {
    return { tier: 'tier3', content: '', tokenCount: 0, source: 'files' };
  }
  
  try {
    const referencedFiles = extractFileReferences(options.messages);
    
    if (referencedFiles.length === 0) {
      return { tier: 'tier3', content: '', tokenCount: 0, source: 'files' };
    }
    
    if (strategy.tier3Mode === 'summary') {
      const summaries = await summarizeFiles(referencedFiles);
      const content = summaries.join('\n\n');
      return {
        tier: 'tier3',
        content,
        tokenCount: countTokens(content),
        source: 'file_summaries',
      };
    }
    
    const fileContents = await loadFiles(referencedFiles);
    const content = fileContents.join('\n\n---\n\n');
    return {
      tier: 'tier3',
      content,
      tokenCount: countTokens(content),
      source: 'files',
    };
  } catch (error) {
    console.warn('[TIER3] Failed to build tier 3 context:', error);
    return {
      tier: 'tier3',
      content: '',
      tokenCount: 0,
      source: 'files',
    };
  }
}

export function buildTier4(
  options: ContextBuildOptions,
  strategy: PruningStrategy
): TierContent {
  const maxMessages = strategy.tier4Messages;
  
  if (maxMessages === 0 || options.messages.length <= 1) {
    return { tier: 'tier4', content: '', tokenCount: 0, source: 'history' };
  }
  
  const historyMessages = options.messages.slice(0, -1);
  const recentMessages = historyMessages.slice(-maxMessages);
  
  const content = recentMessages
    .map(m => `${m.role || 'user'}: ${m.content || ''}`)
    .join('\n\n');
  
  return {
    tier: 'tier4',
    content,
    tokenCount: countTokens(content),
    source: 'history',
  };
}

async function getAllActiveSeeds(userId: string): Promise<string[]> {
  try {
    const db = await getDB();
    const result = await db.query(
      `SELECT title, content FROM prompts 
       WHERE user_id = $1 AND status = 'active' 
       ORDER BY updated_at DESC 
       LIMIT 10`,
      [userId]
    );
    
    return result.rows.map((row: any) => 
      `[${row.title}]\n${row.content}`
    );
  } catch (error) {
    console.warn('[SEEDS] Failed to fetch active seeds:', error);
    return [];
  }
}

async function getTopNSeeds(userId: string, n: number): Promise<string[]> {
  try {
    const db = await getDB();
    const result = await db.query(
      `SELECT title, content 
       FROM prompts 
       WHERE user_id = $1 AND status = 'active'
       ORDER BY updated_at DESC
       LIMIT $2`,
      [userId, n]
    );
    
    return result.rows.map((row: any) => 
      `[${row.title}]\n${row.content}`
    );
  } catch (error) {
    console.warn('[SEEDS] Failed to fetch top N seeds:', error);
    return [];
  }
}

function extractFileReferences(messages: any[]): string[] {
  const filePattern = /(?:^|\s)([a-zA-Z0-9_\-\/]+\.[a-zA-Z0-9]+)(?:\s|$|:)/g;
  const files = new Set<string>();
  
  for (const message of messages) {
    const content = message.content || '';
    const matches = content.matchAll(filePattern);
    
    for (const match of matches) {
      const file = match[1];
      if (file && !file.includes('http') && !file.includes('www')) {
        files.add(file);
      }
    }
  }
  
  return Array.from(files);
}

async function loadFiles(filePaths: string[]): Promise<string[]> {
  const contents: string[] = [];
  
  if (typeof window !== 'undefined') {
    console.warn('[TIER3] File loading is not supported in browser environment');
    return contents;
  }
  
  const fs = await import('fs/promises');
  const path = await import('path');
  
  for (const filePath of filePaths) {
    try {
      const fullPath = path.isAbsolute(filePath) 
        ? filePath 
        : path.join(process.cwd(), filePath);
      
      const content = await fs.readFile(fullPath, 'utf-8');
      contents.push(`File: ${filePath}\n\n${content}`);
    } catch (error) {
      console.warn(`[TIER3] Failed to load file ${filePath}:`, error);
    }
  }
  
  return contents;
}

async function summarizeFiles(filePaths: string[]): Promise<string[]> {
  const summaries: string[] = [];
  
  if (typeof window !== 'undefined') {
    console.warn('[TIER3] File loading is not supported in browser environment');
    return summaries;
  }
  
  const fs = await import('fs/promises');
  const path = await import('path');
  
  for (const filePath of filePaths) {
    try {
      const fullPath = path.isAbsolute(filePath) 
        ? filePath 
        : path.join(process.cwd(), filePath);
      
      const content = await fs.readFile(fullPath, 'utf-8');
      const lines = content.split('\n');
      
      const summary = lines.length > 20
        ? `File: ${filePath} (${lines.length} lines)\n${lines.slice(0, 10).join('\n')}\n...\n${lines.slice(-5).join('\n')}`
        : `File: ${filePath}\n${content}`;
      
      summaries.push(summary);
    } catch (error) {
      console.warn(`[TIER3] Failed to summarize file ${filePath}:`, error);
    }
  }
  
  return summaries;
}
