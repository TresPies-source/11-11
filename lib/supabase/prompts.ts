import { getSupabaseClient, isSupabaseConfigured } from './client';
import type { PromptRow, PromptInsert, PromptUpdate, PromptStatus } from './types';
import type { DriveFile, PromptFile } from '@/lib/types';
import matter from 'gray-matter';

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export interface PromptFilters {
  tags?: string[];
  minScore?: number;
  maxScore?: number;
  searchQuery?: string;
}

export interface PromptWithCritique extends PromptRow {
  latestCritique?: {
    score: number;
    conciseness_score: number;
    specificity_score: number;
    context_score: number;
    task_decomposition_score: number;
  } | null;
  metadata?: {
    description: string | null;
    tags: string[] | null;
    is_public: boolean;
    author: string | null;
    version: string | null;
  } | null;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 500,
  maxDelay: 2000,
};

async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.baseDelay * Math.pow(2, attempt),
          config.maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

function generateMockPrompts(): PromptWithCritique[] {
  const mockPrompts: PromptWithCritique[] = [
    {
      id: 'mock-1',
      user_id: 'dev-user',
      title: 'Code Review Assistant',
      content: 'You are a senior software engineer conducting a code review. Analyze the provided code for:\n1. Code quality and maintainability\n2. Security vulnerabilities\n3. Performance issues\n4. Best practices adherence\n\nProvide specific, actionable feedback with examples.',
      status: 'saved',
      drive_file_id: null,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      latestCritique: { score: 88, conciseness_score: 22, specificity_score: 23, context_score: 21, task_decomposition_score: 22 },
      metadata: { description: 'AI assistant for code reviews', tags: ['code', 'review', 'engineering'], is_public: false, author: null, version: '1.0' },
    },
    {
      id: 'mock-2',
      user_id: 'dev-user',
      title: 'SQL Query Optimizer',
      content: 'Help me optimize this SQL query for better performance.',
      status: 'active',
      drive_file_id: null,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      latestCritique: { score: 42, conciseness_score: 18, specificity_score: 8, context_score: 6, task_decomposition_score: 10 },
      metadata: { description: null, tags: ['sql', 'performance'], is_public: false, author: null, version: null },
    },
    {
      id: 'mock-3',
      user_id: 'dev-user',
      title: 'Technical Documentation Writer',
      content: 'You are a technical writer. Create comprehensive documentation for the provided API endpoint.\n\nInclude:\n- Endpoint description and purpose\n- Request parameters (path, query, body)\n- Response format and status codes\n- Authentication requirements\n- Example requests and responses\n- Error handling\n\nTarget audience: Backend developers integrating with this API.',
      status: 'saved',
      drive_file_id: null,
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      latestCritique: { score: 92, conciseness_score: 23, specificity_score: 24, context_score: 23, task_decomposition_score: 22 },
      metadata: { description: 'Generates API documentation', tags: ['documentation', 'api', 'technical writing'], is_public: true, author: 'dev', version: '2.1' },
    },
    {
      id: 'mock-4',
      user_id: 'dev-user',
      title: 'Debug Helper',
      content: 'I have a bug in my code. Can you help me figure out what\'s wrong? The function is supposed to sort an array but it\'s not working correctly.',
      status: 'active',
      drive_file_id: null,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      latestCritique: { score: 35, conciseness_score: 15, specificity_score: 5, context_score: 7, task_decomposition_score: 8 },
      metadata: { description: null, tags: ['debug'], is_public: false, author: null, version: null },
    },
    {
      id: 'mock-5',
      user_id: 'dev-user',
      title: 'React Component Refactor',
      content: 'Refactor this React component to use modern hooks and improve performance. The component manages form state and validation.',
      status: 'active',
      drive_file_id: null,
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      latestCritique: { score: 58, conciseness_score: 18, specificity_score: 14, context_score: 12, task_decomposition_score: 14 },
      metadata: { description: 'Refactoring guidance for React', tags: ['react', 'refactor'], is_public: false, author: null, version: null },
    },
    {
      id: 'mock-6',
      user_id: 'dev-user',
      title: 'Test Case Generator',
      content: 'You are a QA engineer. For the provided function, generate comprehensive test cases including:\n- Happy path scenarios\n- Edge cases\n- Error conditions\n- Boundary value tests\n\nFormat: Jest test suite with descriptive test names and assertions.',
      status: 'saved',
      drive_file_id: null,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      latestCritique: { score: 85, conciseness_score: 21, specificity_score: 22, context_score: 20, task_decomposition_score: 22 },
      metadata: { description: 'Generates comprehensive test cases', tags: ['testing', 'qa', 'jest'], is_public: false, author: null, version: '1.5' },
    },
    {
      id: 'mock-7',
      user_id: 'dev-user',
      title: 'TypeScript Migration',
      content: 'Convert this JavaScript file to TypeScript. Add proper types, interfaces, and handle potential null/undefined cases.',
      status: 'active',
      drive_file_id: null,
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      latestCritique: { score: 52, conciseness_score: 16, specificity_score: 12, context_score: 11, task_decomposition_score: 13 },
      metadata: { description: null, tags: ['typescript', 'migration'], is_public: false, author: null, version: null },
    },
    {
      id: 'mock-8',
      user_id: 'dev-user',
      title: 'Security Audit Checklist',
      content: 'You are a security expert. Review the provided web application code for common security vulnerabilities:\n\n1. SQL Injection\n2. XSS (Cross-Site Scripting)\n3. CSRF (Cross-Site Request Forgery)\n4. Authentication weaknesses\n5. Authorization issues\n6. Sensitive data exposure\n7. Insecure dependencies\n\nFor each vulnerability found:\n- Describe the issue\n- Explain the risk level (Critical/High/Medium/Low)\n- Provide specific remediation steps\n- Include code examples of the fix',
      status: 'saved',
      drive_file_id: null,
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      latestCritique: { score: 95, conciseness_score: 24, specificity_score: 24, context_score: 24, task_decomposition_score: 23 },
      metadata: { description: 'Comprehensive security audit prompt', tags: ['security', 'audit', 'vulnerabilities'], is_public: true, author: 'security-team', version: '3.0' },
    },
    {
      id: 'mock-9',
      user_id: 'dev-user',
      title: 'API Design Review',
      content: 'Review this REST API design. Check if it follows best practices.',
      status: 'active',
      drive_file_id: null,
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      latestCritique: { score: 48, conciseness_score: 16, specificity_score: 10, context_score: 10, task_decomposition_score: 12 },
      metadata: { description: null, tags: ['api', 'rest'], is_public: false, author: null, version: null },
    },
    {
      id: 'mock-10',
      user_id: 'dev-user',
      title: 'Database Schema Designer',
      content: 'You are a database architect. Design a normalized database schema for the described requirements.\n\nInclude:\n- Table definitions with columns and data types\n- Primary keys and foreign keys\n- Indexes for performance\n- Constraints (unique, not null, check)\n- Relationships and cardinality\n\nProvide SQL DDL statements and an ER diagram description.',
      status: 'saved',
      drive_file_id: null,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      latestCritique: { score: 87, conciseness_score: 22, specificity_score: 22, context_score: 21, task_decomposition_score: 22 },
      metadata: { description: 'Database schema design assistant', tags: ['database', 'schema', 'sql'], is_public: false, author: null, version: '1.0' },
    },
    {
      id: 'mock-11',
      user_id: 'dev-user',
      title: 'Git Commit Message',
      content: 'Write a good commit message for these changes.',
      status: 'active',
      drive_file_id: null,
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      latestCritique: { score: 28, conciseness_score: 12, specificity_score: 4, context_score: 5, task_decomposition_score: 7 },
      metadata: { description: null, tags: ['git'], is_public: false, author: null, version: null },
    },
    {
      id: 'mock-12',
      user_id: 'dev-user',
      title: 'Performance Optimization Guide',
      content: 'You are a performance optimization specialist. Analyze the provided code and suggest improvements.\n\nFocus areas:\n1. Algorithm efficiency (time complexity)\n2. Memory usage optimization\n3. Database query optimization\n4. Caching strategies\n5. Lazy loading and code splitting\n\nFor each suggestion:\n- Explain the current issue\n- Provide the optimized version\n- Quantify expected performance gains\n- Note any trade-offs',
      status: 'saved',
      drive_file_id: null,
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      latestCritique: { score: 90, conciseness_score: 23, specificity_score: 23, context_score: 22, task_decomposition_score: 22 },
      metadata: { description: 'Performance optimization consultant', tags: ['performance', 'optimization'], is_public: true, author: 'perf-team', version: '2.0' },
    },
    {
      id: 'mock-13',
      user_id: 'dev-user',
      title: 'CSS Layout Help',
      content: 'I need help centering this div both horizontally and vertically.',
      status: 'active',
      drive_file_id: null,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      latestCritique: { score: 38, conciseness_score: 14, specificity_score: 6, context_score: 8, task_decomposition_score: 10 },
      metadata: { description: null, tags: ['css'], is_public: false, author: null, version: null },
    },
    {
      id: 'mock-14',
      user_id: 'dev-user',
      title: 'Accessibility Auditor',
      content: 'You are an accessibility (a11y) expert. Review the provided UI component for WCAG 2.1 AA compliance.\n\nCheck:\n- Semantic HTML usage\n- ARIA labels and roles\n- Keyboard navigation\n- Color contrast ratios\n- Screen reader compatibility\n- Focus management\n\nProvide:\n- List of accessibility violations\n- Severity of each issue\n- Specific code fixes\n- Testing recommendations',
      status: 'saved',
      drive_file_id: null,
      created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      latestCritique: { score: 91, conciseness_score: 23, specificity_score: 23, context_score: 23, task_decomposition_score: 22 },
      metadata: { description: 'WCAG compliance checker', tags: ['accessibility', 'a11y', 'wcag'], is_public: true, author: 'a11y-team', version: '1.2' },
    },
    {
      id: 'mock-15',
      user_id: 'dev-user',
      title: 'Docker Configuration',
      content: 'Create a Dockerfile for a Node.js application with Express.',
      status: 'active',
      drive_file_id: null,
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      latestCritique: { score: 45, conciseness_score: 15, specificity_score: 9, context_score: 9, task_decomposition_score: 12 },
      metadata: { description: null, tags: ['docker', 'devops'], is_public: false, author: null, version: null },
    },
  ];

  return mockPrompts;
}

export async function getPromptsByStatus(
  userId: string,
  status: PromptStatus
): Promise<PromptWithCritique[]> {
  if (isDevMode) {
    console.log(`[Mock] Fetching prompts for user ${userId} with status ${status}`);
    const mockPrompts = generateMockPrompts();
    return mockPrompts.filter(p => p.status === status);
  }

  if (!isSupabaseConfigured()) {
    console.warn('[Supabase] Not configured - returning empty array');
    return [];
  }

  return withRetry(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('prompts')
      .select(`
        *,
        latestCritique:critiques!critiques_prompt_id_fkey(
          score,
          conciseness_score,
          specificity_score,
          context_score,
          task_decomposition_score
        ),
        metadata:prompt_metadata!prompt_metadata_prompt_id_fkey(
          description,
          tags,
          is_public,
          author,
          version
        )
      `)
      .eq('user_id', userId)
      .eq('status', status)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch prompts: ${error.message}`);
    }

    return (data || []).map((prompt: any) => ({
      ...prompt,
      latestCritique: Array.isArray(prompt.latestCritique) 
        ? prompt.latestCritique[0] || null
        : prompt.latestCritique,
      metadata: Array.isArray(prompt.metadata)
        ? prompt.metadata[0] || null
        : prompt.metadata,
    })) as PromptWithCritique[];
  });
}

export async function updatePromptStatus(
  promptId: string,
  status: PromptStatus
): Promise<void> {
  if (isDevMode) {
    console.log(`[Mock] Updating prompt ${promptId} to status ${status}`);
    return;
  }

  if (!isSupabaseConfigured()) {
    console.warn('[Supabase] Not configured - skipping status update');
    return;
  }

  return withRetry(async () => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase client not available');
    }

    const { error } = await (client as any)
      .from('prompts')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', promptId);

    if (error) {
      throw new Error(`Failed to update prompt status: ${error.message}`);
    }
  });
}

export async function syncPromptFromDrive(
  driveFile: DriveFile,
  userId: string,
  content?: string
): Promise<PromptRow> {
  if (isDevMode) {
    console.log(`[Mock] Syncing prompt from Drive: ${driveFile.name}`);
    return {
      id: `mock-sync-${driveFile.id}`,
      user_id: userId,
      title: driveFile.name.replace('.md', ''),
      content: content || '',
      status: 'draft',
      drive_file_id: driveFile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  if (!isSupabaseConfigured()) {
    console.warn('[Supabase] Not configured - skipping sync');
    throw new Error('Supabase not configured');
  }

  return withRetry(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    let parsedContent = content || '';
    let metadata: any = {};

    if (content) {
      const parsed = matter(content);
      parsedContent = parsed.content;
      metadata = parsed.data;
    }

    const title = metadata.title || driveFile.name.replace('.md', '');
    const status: PromptStatus = metadata.status || 'draft';

    const { data: existingPrompt } = await (supabase as any)
      .from('prompts')
      .select('id')
      .eq('drive_file_id', driveFile.id)
      .eq('user_id', userId)
      .single();

    if (existingPrompt) {
      const { data, error } = await (supabase as any)
        .from('prompts')
        .update({
          title,
          content: parsedContent,
          status,
          updated_at: driveFile.modifiedTime,
        })
        .eq('id', existingPrompt.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update prompt: ${error.message}`);
      }

      if (metadata.description || metadata.tags || metadata.author || metadata.version) {
        await (supabase as any)
          .from('prompt_metadata')
          .upsert({
            prompt_id: existingPrompt.id,
            description: metadata.description || null,
            tags: metadata.tags || null,
            is_public: metadata.public || false,
            author: metadata.author || null,
            version: metadata.version || null,
          });
      }

      return data as PromptRow;
    } else {
      const { data, error } = await (supabase as any)
        .from('prompts')
        .insert({
          user_id: userId,
          title,
          content: parsedContent,
          status,
          drive_file_id: driveFile.id,
          created_at: driveFile.modifiedTime,
          updated_at: driveFile.modifiedTime,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to insert prompt: ${error.message}`);
      }

      if (metadata.description || metadata.tags || metadata.author || metadata.version) {
        await (supabase as any)
          .from('prompt_metadata')
          .insert({
            prompt_id: data.id,
            description: metadata.description || null,
            tags: metadata.tags || null,
            is_public: metadata.public || false,
            author: metadata.author || null,
            version: metadata.version || null,
          });
      }

      return data as PromptRow;
    }
  });
}

export async function searchPrompts(
  userId: string,
  query: string,
  filters: PromptFilters = {}
): Promise<PromptWithCritique[]> {
  if (isDevMode) {
    console.log(`[Mock] Searching prompts for user ${userId} with query "${query}"`);
    let mockPrompts = generateMockPrompts();

    if (query) {
      const lowerQuery = query.toLowerCase();
      mockPrompts = mockPrompts.filter(
        p => 
          p.title.toLowerCase().includes(lowerQuery) ||
          p.content.toLowerCase().includes(lowerQuery) ||
          (p.metadata?.description?.toLowerCase().includes(lowerQuery)) ||
          (p.metadata?.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)))
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      mockPrompts = mockPrompts.filter(
        p => p.metadata?.tags?.some(tag => filters.tags?.includes(tag))
      );
    }

    if (filters.minScore !== undefined) {
      mockPrompts = mockPrompts.filter(
        p => (p.latestCritique?.score || 0) >= filters.minScore!
      );
    }

    if (filters.maxScore !== undefined) {
      mockPrompts = mockPrompts.filter(
        p => (p.latestCritique?.score || 0) <= filters.maxScore!
      );
    }

    return mockPrompts;
  }

  if (!isSupabaseConfigured()) {
    console.warn('[Supabase] Not configured - returning empty array');
    return [];
  }

  return withRetry(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    let queryBuilder = (supabase as any)
      .from('prompts')
      .select(`
        *,
        latestCritique:critiques!critiques_prompt_id_fkey(
          score,
          conciseness_score,
          specificity_score,
          context_score,
          task_decomposition_score
        ),
        metadata:prompt_metadata!prompt_metadata_prompt_id_fkey(
          description,
          tags,
          is_public,
          author,
          version
        )
      `)
      .eq('user_id', userId);

    if (query) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,content.ilike.%${query}%`
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      queryBuilder = queryBuilder.contains('metadata.tags', filters.tags);
    }

    const { data, error } = await queryBuilder.order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search prompts: ${error.message}`);
    }

    let results = (data || []).map((prompt: any) => ({
      ...prompt,
      latestCritique: Array.isArray(prompt.latestCritique) 
        ? prompt.latestCritique[0] || null
        : prompt.latestCritique,
      metadata: Array.isArray(prompt.metadata)
        ? prompt.metadata[0] || null
        : prompt.metadata,
    })) as PromptWithCritique[];

    if (filters.minScore !== undefined) {
      results = results.filter(
        p => (p.latestCritique?.score || 0) >= filters.minScore!
      );
    }

    if (filters.maxScore !== undefined) {
      results = results.filter(
        p => (p.latestCritique?.score || 0) <= filters.maxScore!
      );
    }

    return results;
  });
}
