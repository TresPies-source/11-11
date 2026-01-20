import Anthropic from '@anthropic-ai/sdk';
import type { IProviderAdapter } from './base';
import type { GatewayRequest, GatewayResponse } from '../types';
import { LLMError, LLMAuthError, LLMRateLimitError, LLMTimeoutError } from '../types';

const DEFAULT_TIMEOUT = 30000;
const MAX_CONSECUTIVE_FAILURES = 3;

export class AnthropicAdapter implements IProviderAdapter {
  readonly id = 'anthropic';
  readonly name = 'Anthropic';
  
  private client: Anthropic | null = null;
  private consecutiveFailures = 0;
  private isConfigured = false;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey !== 'your-anthropic-api-key-here' && apiKey.startsWith('sk-ant-')) {
      this.client = new Anthropic({
        apiKey,
        timeout: DEFAULT_TIMEOUT,
        maxRetries: 2,
      });
      this.isConfigured = true;
    }
  }

  async call(request: GatewayRequest, model: string): Promise<GatewayResponse> {
    if (!this.client || !this.isConfigured) {
      throw new LLMAuthError('Anthropic API key is invalid or not configured');
    }

    const startTime = Date.now();

    try {
      const messages = request.messages || [];
      const anthropicMessages = this.convertMessages(messages);
      
      const messageParams: Anthropic.MessageCreateParams = {
        model,
        messages: anthropicMessages.messages,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.7,
      };

      if (anthropicMessages.system) {
        messageParams.system = anthropicMessages.system;
      }

      if (request.tools && request.tools.length > 0) {
        messageParams.tools = this.convertTools(request.tools);
      }

      const timeout = request.timeout || DEFAULT_TIMEOUT;
      const messagePromise = this.client.messages.create(messageParams);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new LLMTimeoutError(`Request timed out after ${timeout}ms`)), timeout);
      });

      const message = await Promise.race([messagePromise, timeoutPromise]);

      const content = message.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      const toolCalls = message.content
        .filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
        .map(block => ({
          id: block.id,
          type: 'function' as const,
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input),
          },
        }));

      const usage = {
        prompt_tokens: message.usage.input_tokens,
        completion_tokens: message.usage.output_tokens,
        total_tokens: message.usage.input_tokens + message.usage.output_tokens,
      };

      this.consecutiveFailures = 0;

      return {
        content,
        usage,
        finishReason: message.stop_reason || undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    } catch (error: any) {
      this.consecutiveFailures++;

      if (error instanceof LLMTimeoutError) {
        throw error;
      }

      if (error?.status === 401 || error?.error?.type === 'authentication_error') {
        throw new LLMAuthError('Anthropic API key is invalid');
      }

      if (error?.status === 429 || error?.error?.type === 'rate_limit_error') {
        throw new LLMRateLimitError('Anthropic rate limit exceeded. Please try again later.');
      }

      if (error?.status === 408 || error?.code === 'ETIMEDOUT') {
        throw new LLMTimeoutError('Anthropic request timed out');
      }

      throw new LLMError(
        error?.message || 'Unknown Anthropic error',
        error?.error?.type || error?.code,
        error?.status,
        error
      );
    }
  }

  private convertMessages(messages: any[]): { messages: Anthropic.MessageParam[], system?: string } {
    const systemMessages = messages.filter(m => m.role === 'system');
    const nonSystemMessages = messages.filter(m => m.role !== 'system');

    const system = systemMessages.length > 0
      ? systemMessages.map(m => m.content).join('\n\n')
      : undefined;

    const anthropicMessages: Anthropic.MessageParam[] = nonSystemMessages.map(msg => {
      if (msg.role === 'assistant' && msg.tool_calls) {
        return {
          role: 'assistant',
          content: msg.tool_calls.map((tc: any) => ({
            type: 'tool_use' as const,
            id: tc.id,
            name: tc.function.name,
            input: JSON.parse(tc.function.arguments),
          })),
        };
      }

      if (msg.role === 'tool') {
        return {
          role: 'user' as const,
          content: [{
            type: 'tool_result' as const,
            tool_use_id: msg.tool_call_id,
            content: msg.content,
          }],
        };
      }

      return {
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      };
    });

    return { messages: anthropicMessages, system };
  }

  private convertTools(tools: any[]): Anthropic.Tool[] {
    return tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description || '',
      input_schema: tool.function.parameters || { type: 'object', properties: {} },
    }));
  }

  isAvailable(): boolean {
    return this.isConfigured && this.consecutiveFailures < MAX_CONSECUTIVE_FAILURES;
  }

  getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  resetHealth(): void {
    this.consecutiveFailures = 0;
  }
}

export const anthropicAdapter = new AnthropicAdapter();
