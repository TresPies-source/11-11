import { getDB } from './client';
import type { PromptStatus } from './types';

interface SeedPrompt {
  title: string;
  content: string;
  status: PromptStatus;
  tags: string[];
  description: string;
  critiqueScore: number;
  visibility?: 'private' | 'public' | 'unlisted';
  authorName?: string;
  publishedDaysAgo?: number;
}

const SEED_PROMPTS: SeedPrompt[] = [
  {
    title: 'Code Review Assistant',
    content: 'You are a senior software engineer conducting a code review. Analyze the provided code for:\n1. Code quality and maintainability\n2. Security vulnerabilities\n3. Performance issues\n4. Best practices adherence\n\nProvide specific, actionable feedback with examples.',
    status: 'saved',
    tags: ['code', 'review', 'engineering'],
    description: 'AI assistant for code reviews',
    critiqueScore: 88,
    visibility: 'public',
    authorName: 'Sarah Chen',
    publishedDaysAgo: 3
  },
  {
    title: 'SQL Query Optimizer',
    content: 'Help me optimize this SQL query for better performance.',
    status: 'active',
    tags: ['sql', 'performance'],
    description: 'SQL optimization helper',
    critiqueScore: 42
  },
  {
    title: 'Technical Documentation Writer',
    content: 'You are a technical writer. Create comprehensive documentation for the provided API endpoint.\n\nInclude:\n- Endpoint description and purpose\n- Request parameters (path, query, body)\n- Response format and status codes\n- Authentication requirements\n- Example requests and responses\n- Error handling\n\nTarget audience: Backend developers integrating with this API.',
    status: 'saved',
    tags: ['documentation', 'api', 'technical writing'],
    description: 'Generates API documentation',
    critiqueScore: 92
  },
  {
    title: 'Debug Helper',
    content: 'I have a bug in my code. Can you help me figure out what\'s wrong? The function is supposed to sort an array but it\'s not working correctly.',
    status: 'active',
    tags: ['debug'],
    description: 'Debugging assistance',
    critiqueScore: 35
  },
  {
    title: 'React Component Refactor',
    content: 'Refactor this React component to use modern hooks and improve performance. The component manages form state and validation.',
    status: 'active',
    tags: ['react', 'refactor'],
    description: 'Refactoring guidance for React',
    critiqueScore: 58
  },
  {
    title: 'Test Case Generator',
    content: 'You are a QA engineer. For the provided function, generate comprehensive test cases including:\n- Happy path scenarios\n- Edge cases\n- Error conditions\n- Boundary value tests\n\nFormat: Jest test suite with descriptive test names and assertions.',
    status: 'saved',
    tags: ['testing', 'qa', 'jest'],
    description: 'Generates comprehensive test cases',
    critiqueScore: 85
  },
  {
    title: 'TypeScript Migration',
    content: 'Convert this JavaScript file to TypeScript. Add proper types, interfaces, and handle potential null/undefined cases.',
    status: 'active',
    tags: ['typescript', 'migration'],
    description: 'TypeScript conversion helper',
    critiqueScore: 52
  },
  {
    title: 'Security Audit Checklist',
    content: 'You are a security expert. Review the provided web application code for common security vulnerabilities:\n\n1. SQL Injection\n2. XSS (Cross-Site Scripting)\n3. CSRF (Cross-Site Request Forgery)\n4. Authentication weaknesses\n5. Authorization issues\n6. Sensitive data exposure\n7. Insecure dependencies\n\nFor each vulnerability found:\n- Describe the issue\n- Explain the risk level (Critical/High/Medium/Low)\n- Provide specific remediation steps\n- Include code examples of the fix',
    status: 'saved',
    tags: ['security', 'audit', 'vulnerabilities'],
    description: 'Comprehensive security audit prompt',
    critiqueScore: 95
  },
  {
    title: 'API Design Review',
    content: 'Review this REST API design. Check if it follows best practices.',
    status: 'active',
    tags: ['api', 'rest'],
    description: 'API design feedback',
    critiqueScore: 48
  },
  {
    title: 'Database Schema Designer',
    content: 'You are a database architect. Design a normalized database schema for the described requirements.\n\nInclude:\n- Table definitions with columns and data types\n- Primary keys and foreign keys\n- Indexes for performance\n- Constraints (unique, not null, check)\n- Relationships and cardinality\n\nProvide SQL DDL statements and an ER diagram description.',
    status: 'saved',
    tags: ['database', 'schema', 'sql'],
    description: 'Database schema design assistant',
    critiqueScore: 87
  },
  {
    title: 'Git Commit Message',
    content: 'Write a good commit message for these changes.',
    status: 'active',
    tags: ['git'],
    description: 'Commit message helper',
    critiqueScore: 28
  },
  {
    title: 'Performance Optimization Guide',
    content: 'You are a performance optimization specialist. Analyze the provided code and suggest improvements.\n\nFocus areas:\n1. Algorithm efficiency (time complexity)\n2. Memory usage optimization\n3. Database query optimization\n4. Caching strategies\n5. Lazy loading and code splitting\n\nFor each suggestion:\n- Explain the current issue\n- Provide the optimized version\n- Quantify expected performance gains\n- Note any trade-offs',
    status: 'saved',
    tags: ['performance', 'optimization'],
    description: 'Performance optimization consultant',
    critiqueScore: 90
  },
  {
    title: 'CSS Layout Help',
    content: 'I need help centering this div both horizontally and vertically.',
    status: 'active',
    tags: ['css'],
    description: 'CSS layout assistance',
    critiqueScore: 38
  },
  {
    title: 'Accessibility Auditor',
    content: 'You are an accessibility (a11y) expert. Review the provided UI component for WCAG 2.1 AA compliance.\n\nCheck:\n- Semantic HTML usage\n- ARIA labels and roles\n- Keyboard navigation\n- Color contrast ratios\n- Screen reader compatibility\n- Focus management\n\nProvide:\n- List of accessibility violations\n- Severity of each issue\n- Specific code fixes\n- Testing recommendations',
    status: 'saved',
    tags: ['accessibility', 'a11y', 'wcag'],
    description: 'WCAG compliance checker',
    critiqueScore: 91
  },
  {
    title: 'Docker Configuration',
    content: 'Create a Dockerfile for a Node.js application with Express.',
    status: 'active',
    tags: ['docker', 'devops'],
    description: 'Docker setup helper',
    critiqueScore: 45
  },
  {
    title: 'Algorithm Explanation',
    content: 'You are a computer science instructor. Explain the provided algorithm in simple terms.\n\nInclude:\n- Step-by-step breakdown\n- Time and space complexity analysis\n- Use cases and when to apply it\n- Visual diagrams if helpful\n- Common pitfalls and edge cases\n\nTarget audience: Junior developers learning algorithms.',
    status: 'saved',
    tags: ['algorithms', 'education'],
    description: 'Algorithm teaching assistant',
    critiqueScore: 86
  },
  {
    title: 'Error Message Decoder',
    content: 'Explain this error message and how to fix it.',
    status: 'draft',
    tags: ['debugging', 'errors'],
    description: 'Error explanation helper',
    critiqueScore: 40
  },
  {
    title: 'CI/CD Pipeline Setup',
    content: 'You are a DevOps engineer. Design a CI/CD pipeline for the described project.\n\nInclude:\n- Source control integration (GitHub/GitLab)\n- Build stages and dependencies\n- Testing strategy (unit, integration, e2e)\n- Deployment stages (dev, staging, production)\n- Rollback procedures\n- Environment variables management\n- Notifications and alerts\n\nProvide YAML configuration examples.',
    status: 'saved',
    tags: ['cicd', 'devops', 'automation'],
    description: 'CI/CD pipeline designer',
    critiqueScore: 89
  },
  {
    title: 'Regex Pattern Builder',
    content: 'Help me write a regex pattern to validate email addresses.',
    status: 'active',
    tags: ['regex', 'validation'],
    description: 'Regex helper',
    critiqueScore: 50
  },
  {
    title: 'Code Comment Generator',
    content: 'You are a documentation specialist. Add clear, helpful comments to the provided code.\n\nGuidelines:\n- Explain WHY, not WHAT (code should be self-documenting)\n- Document complex logic and edge cases\n- Include function/method JSDoc comments\n- Note any assumptions or limitations\n- Add TODO/FIXME comments where appropriate\n\nTarget audience: Future maintainers of the codebase.',
    status: 'saved',
    tags: ['documentation', 'comments'],
    description: 'Code commenting assistant',
    critiqueScore: 84
  },
  {
    title: 'API Rate Limiter',
    content: 'Implement rate limiting for this API endpoint.',
    status: 'active',
    tags: ['api', 'security', 'rate-limiting'],
    description: 'Rate limiting implementation',
    critiqueScore: 55
  },
  {
    title: 'Data Migration Script',
    content: 'You are a database migration specialist. Write a safe data migration script for the described schema changes.\n\nInclude:\n- Pre-migration validation checks\n- Transaction management\n- Rollback procedures\n- Data transformation logic\n- Post-migration verification\n- Performance considerations for large datasets\n\nProvide SQL scripts with comments explaining each step.',
    status: 'saved',
    tags: ['database', 'migration', 'sql'],
    description: 'Database migration helper',
    critiqueScore: 88
  },
  {
    title: 'Environment Setup',
    content: 'Help me set up a development environment for this project.',
    status: 'draft',
    tags: ['setup', 'environment'],
    description: 'Dev environment setup',
    critiqueScore: 44
  },
  {
    title: 'GraphQL Schema Designer',
    content: 'You are a GraphQL expert. Design a GraphQL schema for the described API requirements.\n\nInclude:\n- Type definitions (Query, Mutation, Subscription)\n- Custom scalar types\n- Input types and enums\n- Relationships between types\n- Pagination strategy\n- Error handling approach\n\nProvide SDL (Schema Definition Language) code with explanatory comments.',
    status: 'saved',
    tags: ['graphql', 'api', 'schema'],
    description: 'GraphQL schema architect',
    critiqueScore: 87
  },
  {
    title: 'Memory Leak Detector',
    content: 'This application has a memory leak. Help me find it.',
    status: 'active',
    tags: ['debugging', 'performance', 'memory'],
    description: 'Memory leak debugging',
    critiqueScore: 47
  },
  {
    title: 'Microservices Architecture',
    content: 'You are a solutions architect. Design a microservices architecture for the described system.\n\nInclude:\n- Service boundaries and responsibilities\n- Communication patterns (sync vs async)\n- Data storage strategy per service\n- API gateway configuration\n- Service discovery and load balancing\n- Monitoring and observability\n- Failure handling and circuit breakers\n\nProvide architecture diagrams in text format and technology recommendations.',
    status: 'saved',
    tags: ['architecture', 'microservices', 'system-design'],
    description: 'Microservices architect',
    critiqueScore: 93
  },
  {
    title: 'NPM Package Setup',
    content: 'Help me create and publish an NPM package.',
    status: 'draft',
    tags: ['npm', 'packaging'],
    description: 'NPM package helper',
    critiqueScore: 51
  },
  {
    title: 'WebSocket Implementation',
    content: 'You are a real-time systems specialist. Implement a WebSocket connection for the described use case.\n\nInclude:\n- Server-side setup (Node.js/Socket.io)\n- Client-side connection management\n- Message protocol design\n- Reconnection logic\n- Error handling\n- Authentication and authorization\n- Scaling considerations\n\nProvide code examples with best practices.',
    status: 'saved',
    tags: ['websocket', 'real-time', 'networking'],
    description: 'WebSocket implementation guide',
    critiqueScore: 86
  },
  {
    title: 'Logging Strategy',
    content: 'Set up proper logging for this application.',
    status: 'active',
    tags: ['logging', 'observability'],
    description: 'Logging implementation',
    critiqueScore: 53
  },
  {
    title: 'Caching Strategy Designer',
    content: 'You are a performance engineer. Design a caching strategy for the described application.\n\nInclude:\n- Cache layers (client, CDN, application, database)\n- Cache invalidation strategy\n- TTL (Time To Live) recommendations\n- Cache key design\n- Cache warming approach\n- Handling cache stampede\n- Monitoring and metrics\n\nProvide implementation examples using Redis or similar.',
    status: 'saved',
    tags: ['caching', 'performance', 'redis'],
    description: 'Caching strategy consultant',
    critiqueScore: 89
  },
  {
    title: 'Form Validation',
    content: 'Add client-side validation to this form.',
    status: 'archived',
    tags: ['validation', 'forms'],
    description: 'Form validation helper',
    critiqueScore: 49
  }
];

export async function seedDatabase(db: any, userId: string): Promise<void> {
  const countResult = await db.query('SELECT COUNT(*) as count FROM prompts');
  const count = parseInt(countResult.rows[0]?.count || '0');
  
  if (count > 0) {
    console.log('[PGlite] Database already seeded, skipping...');
    return;
  }

  console.log('[PGlite] Seeding database with sample prompts...');

  for (const seed of SEED_PROMPTS) {
    const promptResult = await db.query(`
      INSERT INTO prompts (user_id, title, content, status, author_id, visibility)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [userId, seed.title, seed.content, seed.status, userId, 'private']);

    const promptId = promptResult.rows[0].id;

    await db.query(`
      INSERT INTO prompt_metadata (prompt_id, description, tags, is_public)
      VALUES ($1, $2, $3, $4)
    `, [promptId, seed.description, seed.tags, false]);

    const concisenessScore = Math.min(25, Math.floor(seed.critiqueScore / 4));
    const specificityScore = Math.min(25, Math.floor(seed.critiqueScore / 4));
    const contextScore = Math.min(25, Math.floor(seed.critiqueScore / 4));
    const taskDecompositionScore = Math.max(0, Math.min(25, seed.critiqueScore - concisenessScore - specificityScore - contextScore));

    const feedback = {
      conciseness: {
        score: concisenessScore,
        issues: seed.critiqueScore < 50 ? ['Contains filler words'] : [],
        suggestions: seed.critiqueScore < 50 ? ['Remove unnecessary qualifiers'] : []
      },
      specificity: {
        score: specificityScore,
        issues: seed.critiqueScore < 50 ? ['Uses vague terms'] : [],
        suggestions: seed.critiqueScore < 50 ? ['Add specific metrics or examples'] : []
      },
      context: {
        score: contextScore,
        issues: seed.critiqueScore < 50 ? ['Missing audience specification'] : [],
        suggestions: seed.critiqueScore < 50 ? ['Define target audience'] : []
      },
      taskDecomposition: {
        score: taskDecompositionScore,
        issues: seed.critiqueScore < 50 ? ['Multiple tasks combined'] : [],
        suggestions: seed.critiqueScore < 50 ? ['Break into numbered steps'] : []
      }
    };

    await db.query(`
      INSERT INTO critiques (
        prompt_id, 
        score, 
        conciseness_score, 
        specificity_score, 
        context_score, 
        task_decomposition_score, 
        feedback
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      promptId,
      seed.critiqueScore,
      concisenessScore,
      specificityScore,
      contextScore,
      taskDecompositionScore,
      JSON.stringify(feedback)
    ]);
  }

  console.log(`[PGlite] Successfully seeded ${SEED_PROMPTS.length} prompts`);
}
