/**
 * Builder Agent Handler
 * 
 * Handles code generation and modification queries from the Supervisor.
 * Uses a two-step process: Plan -> Generate for safe code creation.
 * 
 * @module lib/agents/builder-handler
 */

import { readFile } from 'fs/promises';
import { join, resolve, isAbsolute } from 'path';
import type { AgentInvocationContext } from './types';
import { AgentError } from './types';
import { logEvent, startSpan, endSpan } from '../harness/trace';
import { LLMClient } from '../llm/client';

export interface CodeArtifact {
  path: string;
  content: string;
  action: 'CREATE' | 'UPDATE';
}

export interface BuilderAgentQuery {
  request: string;
  context_file_paths?: string[];
}

export interface BuilderAgentResponse {
  artifacts: CodeArtifact[];
  summary: string;
}

export interface CodePlan {
  summary: string;
  files_to_modify: Array<{
    path: string;
    action: 'CREATE' | 'UPDATE';
    reason: string;
  }>;
}

export class BuilderAgentError extends AgentError {
  constructor(
    message: string,
    code?: string,
    details?: unknown
  ) {
    super(message, code, 'builder', details);
    this.name = 'BuilderAgentError';
  }
}

/**
 * Reads context files from the filesystem with security validation.
 * 
 * @param filePaths - Array of file paths to read
 * @returns Array of objects containing path and file content
 * @throws BuilderAgentError if path validation fails
 */
async function readContextFiles(
  filePaths: string[]
): Promise<Array<{ path: string; content: string }>> {
  const projectRoot = process.cwd();
  const contextFiles: Array<{ path: string; content: string }> = [];

  for (const filePath of filePaths) {
    try {
      const absolutePath = isAbsolute(filePath)
        ? filePath
        : join(projectRoot, filePath);

      const resolvedPath = resolve(absolutePath);

      if (!resolvedPath.startsWith(projectRoot)) {
        logEvent(
          'ERROR',
          { path: filePath },
          { error: 'Path outside project directory' },
          { agent_id: 'builder', error_message: 'Path outside project directory' }
        );
        throw new BuilderAgentError(
          `Security violation: Path is outside project directory: ${filePath}`,
          'INVALID_PATH',
          { path: filePath, projectRoot }
        );
      }

      const content = await readFile(resolvedPath, 'utf-8');
      contextFiles.push({ path: filePath, content });
    } catch (error) {
      if (error instanceof BuilderAgentError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      logEvent(
        'ERROR',
        { path: filePath },
        { error: errorMessage },
        { agent_id: 'builder', error_message: errorMessage }
      );

      throw new BuilderAgentError(
        `Failed to read context file: ${filePath}`,
        'FILE_READ_ERROR',
        { path: filePath, error }
      );
    }
  }

  return contextFiles;
}

/**
 * Plans which files need to be created or updated for the given request.
 * Makes an LLM call to determine the code generation plan.
 * 
 * @param request - User's code generation request
 * @param contextFiles - Array of context files for reference
 * @returns CodePlan with summary and files to modify
 * @throws BuilderAgentError if planning fails
 */
async function planCodeChanges(
  request: string,
  contextFiles: Array<{ path: string; content: string }>
): Promise<CodePlan> {
  const llmClient = new LLMClient();

  const spanId = startSpan('TOOL_INVOCATION', {
    tool: 'llm',
    operation: 'code_planning',
    model: 'deepseek-chat',
  });

  try {
    const contextText = contextFiles.length > 0
      ? `\n\nContext Files:\n${contextFiles.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n')}`
      : '';

    const systemPrompt = `You are a code planning assistant. Given a user request, determine which files need to be created or updated.

Return a JSON object with this exact structure:
{
  "summary": "Brief description of what will be generated",
  "files_to_modify": [
    {
      "path": "relative/path/to/file.tsx",
      "action": "CREATE" or "UPDATE",
      "reason": "What this file will contain"
    }
  ]
}

Rules:
- Use relative paths from project root
- Only include files that need to be generated
- Be specific about file purposes
- Follow existing project structure conventions if context files are provided`;

    const userPrompt = `Request: ${request}${contextText}`;

    const response = await llmClient.call('deepseek-chat', [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.2,
      responseFormat: { type: 'json_object' },
    });

    const plan = JSON.parse(response.content) as CodePlan;

    endSpan(spanId, {
      success: true,
      file_count: plan.files_to_modify.length,
    }, {
      token_count: response.usage.total_tokens,
    });

    return plan;
  } catch (error) {
    endSpan(spanId, {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, {});

    throw new BuilderAgentError(
      `Planning failed: ${error instanceof Error ? error.message : String(error)}`,
      'PLANNING_FAILED',
      error
    );
  }
}

/**
 * Generates code artifacts based on the plan.
 * Makes an LLM call for each file to generate its full code content.
 * 
 * @param request - User's code generation request
 * @param contextFiles - Array of context files for reference
 * @param plan - The code plan from planCodeChanges
 * @returns Array of CodeArtifact objects
 * @throws BuilderAgentError if generation fails for all files
 */
async function generateCodeArtifacts(
  request: string,
  contextFiles: Array<{ path: string; content: string }>,
  plan: CodePlan
): Promise<CodeArtifact[]> {
  const llmClient = new LLMClient();
  const artifacts: CodeArtifact[] = [];
  const errors: Array<{ path: string; error: string }> = [];

  for (let i = 0; i < plan.files_to_modify.length; i++) {
    const fileSpec = plan.files_to_modify[i];
    
    logEvent(
      'AGENT_ACTIVITY_PROGRESS',
      { 
        agent_id: 'builder',
        progress: `Generating ${fileSpec.path} (${i + 1}/${plan.files_to_modify.length})`
      },
      {},
      { 
        agent_id: 'builder',
        step: i + 1,
        total: plan.files_to_modify.length,
        file_path: fileSpec.path
      }
    );

    const spanId = startSpan('TOOL_INVOCATION', {
      tool: 'llm',
      operation: 'code_generation',
      model: 'deepseek-chat',
      file_path: fileSpec.path,
    });

    try {
      const contextText = contextFiles.length > 0
        ? `\n\nContext Files for Reference:\n${contextFiles.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n')}`
        : '';

      const systemPrompt = `You are an expert code generator. Generate complete, production-ready code for the specified file.

Rules:
- Generate ONLY the file content, no explanations
- Include all necessary imports
- Follow best practices and conventions
- Write clean, well-structured code
- Add minimal comments only for complex logic
- Ensure code is complete and ready to use`;

      const userPrompt = `Generate code for: ${fileSpec.path}

Action: ${fileSpec.action}
Purpose: ${fileSpec.reason}

Original Request: ${request}${contextText}

Generate the complete file content:`;

      const response = await llmClient.call('deepseek-chat', [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.2,
      });

      const artifact: CodeArtifact = {
        path: fileSpec.path,
        content: response.content.trim(),
        action: fileSpec.action,
      };

      artifacts.push(artifact);

      endSpan(spanId, {
        success: true,
        file_path: fileSpec.path,
        content_length: artifact.content.length,
      }, {
        token_count: response.usage.total_tokens,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      endSpan(spanId, {
        success: false,
        file_path: fileSpec.path,
        error: errorMessage,
      }, {});

      errors.push({ path: fileSpec.path, error: errorMessage });

      logEvent(
        'ERROR',
        { file_path: fileSpec.path },
        { error: errorMessage },
        { 
          agent_id: 'builder',
          error_message: errorMessage,
          file_path: fileSpec.path
        }
      );
    }
  }

  if (artifacts.length === 0 && errors.length > 0) {
    throw new BuilderAgentError(
      `Failed to generate any code artifacts. Errors: ${errors.map(e => `${e.path}: ${e.error}`).join('; ')}`,
      'GENERATION_FAILED',
      { errors }
    );
  }

  if (errors.length > 0) {
    logEvent(
      'AGENT_ACTIVITY_PROGRESS',
      { 
        agent_id: 'builder',
        progress: `Generated ${artifacts.length}/${plan.files_to_modify.length} files (${errors.length} failed)`
      },
      {},
      { 
        agent_id: 'builder',
        success_count: artifacts.length,
        error_count: errors.length
      }
    );
  }

  return artifacts;
}

/**
 * Main handler for Builder Agent queries.
 * Orchestrates the full code generation flow: read context -> plan -> generate.
 * 
 * @param query - BuilderAgentQuery containing the user's request and optional context files
 * @returns BuilderAgentResponse with generated code artifacts and summary
 * @throws BuilderAgentError if the query is invalid or generation fails
 */
export async function handleBuilderQuery(
  query: BuilderAgentQuery
): Promise<BuilderAgentResponse> {
  if (!query.request || query.request.trim() === '') {
    throw new BuilderAgentError(
      'Request cannot be empty',
      'INVALID_REQUEST',
      { query }
    );
  }

  const startTime = Date.now();
  
  logEvent(
    'AGENT_ACTIVITY_START',
    { 
      agent_id: 'builder',
      activity: 'code_generation',
      request: query.request
    },
    {},
    { 
      agent_id: 'builder',
      context_files_count: query.context_file_paths?.length || 0
    }
  );

  try {
    const contextFiles = query.context_file_paths && query.context_file_paths.length > 0
      ? await readContextFiles(query.context_file_paths)
      : [];

    logEvent(
      'AGENT_ACTIVITY_PROGRESS',
      { 
        agent_id: 'builder',
        progress: 'Planning code changes...'
      },
      {},
      { 
        agent_id: 'builder',
        context_files_loaded: contextFiles.length
      }
    );

    const plan = await planCodeChanges(query.request, contextFiles);

    logEvent(
      'AGENT_ACTIVITY_PROGRESS',
      { 
        agent_id: 'builder',
        progress: `Generating ${plan.files_to_modify.length} file(s)...`
      },
      {},
      { 
        agent_id: 'builder',
        planned_files: plan.files_to_modify.length
      }
    );

    const artifacts = await generateCodeArtifacts(query.request, contextFiles, plan);

    const duration = Date.now() - startTime;
    
    logEvent(
      'AGENT_ACTIVITY_COMPLETE',
      { 
        agent_id: 'builder',
        activity: 'code_generation',
        duration_ms: duration
      },
      {},
      { 
        agent_id: 'builder',
        artifacts_generated: artifacts.length,
        duration_ms: duration
      }
    );

    return {
      artifacts,
      summary: `Generated ${artifacts.length} file(s) to address the request: ${plan.summary}`,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logEvent(
      'ERROR',
      { 
        agent_id: 'builder',
        activity: 'code_generation',
        duration_ms: duration
      },
      { error: errorMessage },
      { 
        agent_id: 'builder',
        error_message: errorMessage,
        duration_ms: duration
      }
    );

    if (error instanceof BuilderAgentError) {
      throw error;
    }

    throw new BuilderAgentError(
      `Builder agent failed: ${errorMessage}`,
      'HANDLER_ERROR',
      error
    );
  }
}

/**
 * Invokes the Builder Agent from the handoff system.
 * Entry point for the Supervisor to route code generation requests.
 * 
 * @param context - AgentInvocationContext containing user intent and conversation history
 * @returns BuilderAgentResponse with generated code artifacts
 * @throws BuilderAgentError if invocation fails
 */
export async function invokeBuilderAgent(
  context: AgentInvocationContext
): Promise<BuilderAgentResponse> {
  const request = context.user_intent;

  const response = await handleBuilderQuery({ request });

  logEvent(
    'AGENT_ACTIVITY_COMPLETE',
    { 
      agent_id: 'builder',
      activity: 'agent_invocation',
      message: `Builder agent completed: ${response.artifacts.length} artifact(s) generated`
    },
    {},
    { 
      agent_id: 'builder',
      artifacts_count: response.artifacts.length
    }
  );

  return response;
}
