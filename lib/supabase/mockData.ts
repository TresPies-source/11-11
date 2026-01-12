import type {
  PromptRow,
  PromptMetadataRow,
  CritiqueRow,
  CritiqueFeedbackJson,
  PromptStatus,
} from './types';

export interface MockPromptWithRelations {
  prompt: PromptRow;
  metadata: PromptMetadataRow;
  critique: CritiqueRow;
}

const MOCK_USER_ID = 'mock-user-dev-123';

const mockPrompts: Array<{
  title: string;
  content: string;
  status: PromptStatus;
  description: string;
  tags: string[];
  score: number;
}> = [
  {
    title: 'Code Review Guidelines',
    content: `Review the following code and provide feedback on:
- Code quality and best practices
- Potential bugs or issues
- Performance optimizations
- Security concerns

Please be thorough in your analysis.`,
    status: 'saved',
    description: 'A comprehensive prompt for conducting code reviews with AI assistance',
    tags: ['code-review', 'quality', 'best-practices'],
    score: 85,
  },
  {
    title: 'API Documentation Generator',
    content: `Generate API documentation for the following endpoints. Include request/response examples, parameter descriptions, and error codes.`,
    status: 'active',
    description: 'Generates structured API documentation from endpoint definitions',
    tags: ['documentation', 'api', 'technical-writing'],
    score: 62,
  },
  {
    title: 'User Story Expander',
    content: `Take this user story and expand it into:
1. Detailed acceptance criteria
2. Test cases
3. Edge cases to consider
4. Technical implementation notes

User Story: As a user, I want to be able to export my data so that I can use it elsewhere.`,
    status: 'saved',
    description: 'Expands user stories into actionable development tasks',
    tags: ['agile', 'requirements', 'planning'],
    score: 78,
  },
  {
    title: 'Quick Bug Report',
    content: `Write a bug report for this issue. Make it good.`,
    status: 'active',
    description: 'Template for creating bug reports',
    tags: ['bugs', 'reporting'],
    score: 28,
  },
  {
    title: 'Database Schema Optimizer',
    content: `Analyze the following database schema and suggest optimizations for:
- Query performance (indexes, partitioning)
- Data normalization and relationships
- Storage efficiency
- Scalability considerations

Provide specific SQL migration scripts for recommended changes.

Schema: [Paste your schema here]`,
    status: 'saved',
    description: 'Analyzes database schemas and provides optimization recommendations',
    tags: ['database', 'performance', 'sql', 'optimization'],
    score: 92,
  },
  {
    title: 'Meeting Notes Summarizer',
    content: `Summarize the key points from the meeting notes below. Include action items and decisions made.`,
    status: 'draft',
    description: 'Summarizes meeting notes into actionable items',
    tags: ['productivity', 'meetings', 'summary'],
    score: 45,
  },
  {
    title: 'Test Case Generator for E-commerce Checkout',
    content: `Generate comprehensive test cases for an e-commerce checkout flow, covering:

Functional Requirements:
- Shopping cart management (add/remove/update items)
- Payment processing (credit card, PayPal, Apple Pay)
- Shipping address validation
- Order confirmation and email notifications

Non-functional Requirements:
- Performance under load (1000+ concurrent users)
- Security (PCI compliance, data encryption)
- Accessibility (WCAG 2.1 AA compliance)

Include:
- Positive and negative test scenarios
- Edge cases (empty cart, invalid payment, timeout scenarios)
- Test data requirements
- Expected outcomes for each test case

Format as a structured test plan with priority levels (P0/P1/P2).`,
    status: 'saved',
    description: 'Comprehensive test case generator for e-commerce checkout flows',
    tags: ['testing', 'e-commerce', 'qa', 'automation'],
    score: 95,
  },
  {
    title: 'Refactoring Suggestions',
    content: `Look at this code and tell me how to make it better. It works but seems messy.`,
    status: 'active',
    description: 'Get refactoring suggestions for code',
    tags: ['refactoring', 'code-quality'],
    score: 22,
  },
  {
    title: 'Email Template Generator',
    content: `Create a professional email template for [purpose]. Include:
- Subject line variations (3 options)
- Opening paragraph
- Main body with key points
- Call-to-action
- Closing signature

Tone: [Professional/Friendly/Formal]
Audience: [Specify target audience]`,
    status: 'saved',
    description: 'Generates professional email templates with multiple variations',
    tags: ['communication', 'templates', 'email'],
    score: 71,
  },
  {
    title: 'Security Audit Checklist',
    content: `Perform a security audit on the application with focus on:

Authentication & Authorization:
- Password policies and storage
- Session management
- Role-based access control (RBAC)
- OAuth/SSO implementation

Data Protection:
- Encryption at rest and in transit
- PII handling and GDPR compliance
- Database security (SQL injection prevention)
- API security (rate limiting, input validation)

Infrastructure:
- Server hardening
- Network security
- Dependency vulnerabilities
- Container security

For each category, provide:
1. Current implementation assessment
2. Identified vulnerabilities (severity: Critical/High/Medium/Low)
3. Remediation recommendations with code examples
4. Compliance requirements (OWASP Top 10, GDPR, SOC 2)`,
    status: 'saved',
    description: 'Comprehensive security audit framework for web applications',
    tags: ['security', 'audit', 'compliance', 'best-practices'],
    score: 88,
  },
  {
    title: 'Onboarding Documentation',
    content: `Write documentation to help new developers get started with the project.`,
    status: 'draft',
    description: 'Create onboarding documentation for new team members',
    tags: ['documentation', 'onboarding'],
    score: 38,
  },
  {
    title: 'Performance Optimization Report',
    content: `Analyze the application performance metrics and create a detailed optimization report including:
- Load time analysis (initial load, time to interactive)
- Bundle size breakdown and recommendations
- Runtime performance bottlenecks
- Database query optimization opportunities
- Caching strategy improvements
- CDN and asset delivery optimization

Provide before/after metrics and implementation priority.`,
    status: 'active',
    description: 'Comprehensive performance analysis and optimization recommendations',
    tags: ['performance', 'optimization', 'metrics', 'web-vitals'],
    score: 81,
  },
  {
    title: 'Marketing Copy Ideas',
    content: `Generate marketing copy for our new product. Make it engaging and persuasive. Target audience is tech-savvy professionals.`,
    status: 'archived',
    description: 'Marketing copy generator for product launches',
    tags: ['marketing', 'copywriting'],
    score: 52,
  },
  {
    title: 'Accessibility Compliance Checker',
    content: `Review the following component/page for WCAG 2.1 Level AA compliance:

Check for:
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Color contrast ratios (minimum 4.5:1 for text)
- Focus indicators and tab order
- Screen reader compatibility
- Form labels and error messages
- Alternative text for images

For each issue found, provide:
1. Specific violation description
2. WCAG criterion reference
3. Code example showing the fix
4. Testing method to verify compliance`,
    status: 'saved',
    description: 'WCAG compliance checker with detailed remediation guidance',
    tags: ['accessibility', 'wcag', 'a11y', 'compliance'],
    score: 87,
  },
  {
    title: 'Project Timeline Estimator',
    content: `Estimate timeline for implementing this feature. Consider development, testing, and deployment phases. Include buffer time for unexpected issues.`,
    status: 'active',
    description: 'Estimates project timelines with buffer considerations',
    tags: ['planning', 'estimation', 'project-management'],
    score: 58,
  },
];

function generateCritiqueFeedback(totalScore: number): CritiqueFeedbackJson {
  const scoreDistribution = distributeScore(totalScore);

  return {
    conciseness: generateDimensionFeedback(
      scoreDistribution.conciseness,
      'conciseness'
    ),
    specificity: generateDimensionFeedback(
      scoreDistribution.specificity,
      'specificity'
    ),
    context: generateDimensionFeedback(scoreDistribution.context, 'context'),
    taskDecomposition: generateDimensionFeedback(
      scoreDistribution.taskDecomposition,
      'taskDecomposition'
    ),
  };
}

function distributeScore(totalScore: number) {
  const base = Math.floor(totalScore / 4);
  const remainder = totalScore % 4;

  const scores = {
    conciseness: base,
    specificity: base,
    context: base,
    taskDecomposition: base,
  };

  const dimensions = Object.keys(scores) as Array<keyof typeof scores>;
  for (let i = 0; i < remainder; i++) {
    scores[dimensions[i]]++;
  }

  return scores;
}

function generateDimensionFeedback(
  score: number,
  dimension: string
): { score: number; issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (score < 15) {
    if (dimension === 'conciseness') {
      issues.push('Contains excessive filler words (very, really, just, basically)');
      issues.push('Multiple redundant phrases that convey the same meaning');
      suggestions.push('Remove filler words and tighten language');
      suggestions.push('Eliminate redundant phrases');
    } else if (dimension === 'specificity') {
      issues.push('Uses vague terms like "good", "better", "nice"');
      issues.push('Lacks concrete examples or constraints');
      suggestions.push('Replace vague terms with specific criteria');
      suggestions.push('Add concrete examples or success metrics');
    } else if (dimension === 'context') {
      issues.push('Missing audience or user persona definition');
      issues.push('No clear input/output specifications');
      suggestions.push('Define the target audience clearly');
      suggestions.push('Specify expected inputs and outputs');
    } else if (dimension === 'taskDecomposition') {
      issues.push('Task is too broad without clear subtasks');
      issues.push('Missing structured breakdown of work');
      suggestions.push('Break down into numbered steps or subtasks');
      suggestions.push('Add clear structure with sections or phases');
    }
  } else if (score < 20) {
    if (dimension === 'conciseness') {
      issues.push('Some unnecessary words detected');
      suggestions.push('Review for conciseness opportunities');
    } else if (dimension === 'specificity') {
      issues.push('Could benefit from more specific examples');
      suggestions.push('Add 1-2 concrete examples');
    } else if (dimension === 'context') {
      issues.push('Context could be more detailed');
      suggestions.push('Add more background information');
    } else if (dimension === 'taskDecomposition') {
      issues.push('Structure could be more organized');
      suggestions.push('Consider using numbered lists or sections');
    }
  } else if (score < 23) {
    suggestions.push(`${dimension.charAt(0).toUpperCase() + dimension.slice(1)} is good. Minor improvements possible.`);
  }

  return { score, issues, suggestions };
}

export function generateMockData(): MockPromptWithRelations[] {
  const now = new Date();

  return mockPrompts.map((mockPrompt, index) => {
    const promptId = `mock-prompt-${index + 1}`;
    const createdAt = new Date(
      now.getTime() - (mockPrompts.length - index) * 24 * 60 * 60 * 1000
    ).toISOString();
    const updatedAt = new Date(
      now.getTime() - (mockPrompts.length - index) * 12 * 60 * 60 * 1000
    ).toISOString();

    const prompt: PromptRow = {
      id: promptId,
      user_id: MOCK_USER_ID,
      title: mockPrompt.title,
      content: mockPrompt.content,
      status: mockPrompt.status,
      drive_file_id: null,
      created_at: createdAt,
      updated_at: updatedAt,
    };

    const metadata: PromptMetadataRow = {
      id: `mock-metadata-${index + 1}`,
      prompt_id: promptId,
      description: mockPrompt.description,
      tags: mockPrompt.tags,
      is_public: false,
      author: 'Mock User',
      version: '1.0',
      created_at: createdAt,
    };

    const scoreDistribution = distributeScore(mockPrompt.score);
    const feedback = generateCritiqueFeedback(mockPrompt.score);

    const critique: CritiqueRow = {
      id: `mock-critique-${index + 1}`,
      prompt_id: promptId,
      score: mockPrompt.score,
      conciseness_score: scoreDistribution.conciseness,
      specificity_score: scoreDistribution.specificity,
      context_score: scoreDistribution.context,
      task_decomposition_score: scoreDistribution.taskDecomposition,
      feedback,
      created_at: updatedAt,
    };

    return { prompt, metadata, critique };
  });
}

export function getMockPromptById(id: string): MockPromptWithRelations | null {
  const allMockData = generateMockData();
  return allMockData.find((data) => data.prompt.id === id) || null;
}

export function getMockPromptsByStatus(
  status: PromptStatus
): MockPromptWithRelations[] {
  const allMockData = generateMockData();
  return allMockData.filter((data) => data.prompt.status === status);
}

export function getMockUserId(): string {
  return MOCK_USER_ID;
}
