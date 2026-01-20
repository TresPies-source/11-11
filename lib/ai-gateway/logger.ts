import { getDB } from '@/lib/pglite/client';
import type { GatewayRequest, GatewayResponse } from './types';

/**
 * Parameters for logging an AI Gateway request to the database.
 * 
 * @property requestId - Unique identifier for this request (use generateRequestId())
 * @property request - The gateway request object containing messages and options
 * @property response - The gateway response object (optional, null for failed requests)
 * @property providerId - Provider identifier (e.g., 'openai', 'deepseek', 'anthropic')
 * @property modelId - Model identifier (e.g., 'gpt-4o-mini', 'deepseek-chat')
 * @property latencyMs - Request latency in milliseconds
 * @property costUsd - Estimated cost in USD (optional)
 * @property error - Error object if request failed (optional)
 * @property userId - User identifier for tracking usage by user (optional)
 * @property sessionId - Session identifier for tracking usage by session (optional)
 */
export interface LogGatewayRequestParams {
  requestId: string;
  request: GatewayRequest;
  response?: GatewayResponse;
  providerId: string;
  modelId: string;
  latencyMs: number;
  costUsd?: number;
  error?: Error;
  userId?: string;
  sessionId?: string;
}

/**
 * Generates a unique request ID for tracking AI Gateway requests.
 * Uses crypto.randomUUID() when available (browser/Node.js 14.17+),
 * falls back to timestamp-based ID for older environments.
 * 
 * @returns Unique request identifier in UUID format or `req_{timestamp}_{random}` format
 * 
 * @example
 * const requestId = generateRequestId();
 * // Returns: "ca34f345-e412-4240-aace-9ed1122e4bfa" (modern environments)
 * // Or: "req_1737353437123_a8c9d2f4e6b" (fallback)
 */
export function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for environments without crypto.randomUUID
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `req_${timestamp}_${random}`;
}

/**
 * Logs an AI Gateway request to the database for monitoring and analytics.
 * This function is non-blocking and will never throw errors - it gracefully
 * falls back to console logging if database writes fail.
 * 
 * The function captures:
 * - Request metadata (user, session, task type)
 * - Provider and model information
 * - Performance metrics (latency, cost)
 * - Request/response payloads (JSONB format)
 * - Error information for failed requests
 * 
 * @param params - Request logging parameters (see LogGatewayRequestParams)
 * @returns Promise that resolves when logging completes (never throws)
 * 
 * @example
 * // Log a successful request
 * await logGatewayRequest({
 *   requestId: generateRequestId(),
 *   request: { 
 *     messages: [{ role: 'user', content: 'Hello' }], 
 *     taskType: 'general_chat' 
 *   },
 *   response: { content: 'Hi!', usage: { totalTokens: 25 } },
 *   providerId: 'openai',
 *   modelId: 'gpt-4o-mini',
 *   latencyMs: 150,
 *   costUsd: 0.001,
 *   userId: 'user-123',
 *   sessionId: 'session-456',
 * });
 * 
 * @example
 * // Log a failed request
 * await logGatewayRequest({
 *   requestId: generateRequestId(),
 *   request: { messages: [...], taskType: 'code_generation' },
 *   providerId: 'deepseek',
 *   modelId: 'deepseek-chat',
 *   latencyMs: 50,
 *   error: new Error('Rate limit exceeded'),
 * });
 */
export async function logGatewayRequest(params: LogGatewayRequestParams): Promise<void> {
  try {
    const db = await getDB();
    
    // Determine status code and error message
    const statusCode = params.error ? 500 : 200;
    const errorMessage = params.error?.message || null;
    
    // Build request payload (exclude sensitive data, include routing metadata)
    const requestPayload = {
      messages: params.request.messages,        // Chat history
      temperature: params.request.temperature,  // Sampling temperature (0-1)
      maxTokens: params.request.maxTokens,      // Token limit
      tools: params.request.tools,              // Available tool definitions
      taskType: params.request.taskType,        // Routing task classification
      agentName: params.request.agentName,      // Calling agent identifier
    };
    
    // Build response payload (only for successful requests)
    const responsePayload = params.response ? {
      content: params.response.content,         // Generated text
      toolCalls: params.response.toolCalls,     // Tool invocations
      usage: params.response.usage,             // Token usage statistics
      finishReason: params.response.finishReason, // Completion reason
    } : null;
    
    await db.query(
      `INSERT INTO ai_gateway_logs (
        request_id, user_id, session_id, task_type,
        provider_id, model_id, request_payload, response_payload,
        latency_ms, cost_usd, status_code, error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11, $12)`,
      [
        params.requestId,
        params.userId || null,
        params.sessionId || null,
        params.request.taskType || 'default',
        params.providerId,
        params.modelId,
        JSON.stringify(requestPayload),
        responsePayload ? JSON.stringify(responsePayload) : null,
        params.latencyMs,
        params.costUsd || null,
        statusCode,
        errorMessage,
      ]
    );
    
    // Log success (non-blocking, informational only)
    console.log(`[AI_GATEWAY_LOGGER] Logged request ${params.requestId} (${params.providerId}/${params.modelId}, ${params.latencyMs}ms)`);
  } catch (error) {
    // Graceful degradation: log to console if database write fails
    // This ensures we never lose visibility into gateway requests
    console.warn('[AI_GATEWAY_LOGGER] Failed to log to database, using console fallback:', error);
    console.warn('[AI_GATEWAY_LOGGER] Fallback log:', JSON.stringify({
      requestId: params.requestId,
      providerId: params.providerId,
      modelId: params.modelId,
      taskType: params.request.taskType,
      latencyMs: params.latencyMs,
      costUsd: params.costUsd,
      error: params.error?.message,
    }, null, 2));
  }
}
