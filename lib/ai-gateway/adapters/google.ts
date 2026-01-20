import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import type { IProviderAdapter } from './base';
import type { GatewayRequest, GatewayResponse } from '../types';
import { LLMError, LLMAuthError, LLMRateLimitError, LLMTimeoutError } from '../types';

const DEFAULT_TIMEOUT = 30000;
const MAX_CONSECUTIVE_FAILURES = 3;

export class GoogleAdapter implements IProviderAdapter {
  readonly id = 'google';
  readonly name = 'Google';
  
  private client: GoogleGenerativeAI | null = null;
  private consecutiveFailures = 0;
  private isConfigured = false;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (apiKey && apiKey !== 'your-google-api-key-here') {
      this.client = new GoogleGenerativeAI(apiKey);
      this.isConfigured = true;
    }
  }

  async call(request: GatewayRequest, model: string): Promise<GatewayResponse> {
    if (!this.client || !this.isConfigured) {
      throw new LLMAuthError('Google API key is invalid or not configured');
    }

    const startTime = Date.now();

    try {
      const genModel = this.client.getGenerativeModel({
        model,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      });

      const messages = request.messages || [];
      const googleMessages = this.convertMessages(messages);
      
      const timeout = request.timeout || DEFAULT_TIMEOUT;
      const chat = genModel.startChat({
        history: googleMessages.history,
      });
      
      const chatPromise = chat.sendMessage(googleMessages.lastMessage);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new LLMTimeoutError(`Request timed out after ${timeout}ms`)), timeout);
      });

      const result = await Promise.race([chatPromise, timeoutPromise]);
      const response = result.response;

      const content = response.text();

      const promptTokens = response.usageMetadata?.promptTokenCount || 0;
      const completionTokens = response.usageMetadata?.candidatesTokenCount || 0;

      const usage = {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      };

      this.consecutiveFailures = 0;

      return {
        content,
        usage,
        finishReason: response.candidates?.[0]?.finishReason,
        toolCalls: undefined,
      };
    } catch (error: any) {
      this.consecutiveFailures++;

      if (error instanceof LLMTimeoutError) {
        throw error;
      }

      if (error?.status === 401 || error?.message?.includes('API key')) {
        throw new LLMAuthError('Google API key is invalid');
      }

      if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
        throw new LLMRateLimitError('Google rate limit exceeded. Please try again later.');
      }

      if (error?.status === 408 || error?.code === 'ETIMEDOUT') {
        throw new LLMTimeoutError('Google request timed out');
      }

      throw new LLMError(
        error?.message || 'Unknown Google error',
        error?.code,
        error?.status,
        error
      );
    }
  }

  private convertMessages(messages: any[]): { history: any[], lastMessage: string } {
    const systemMessages = messages.filter(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    let systemPrefix = '';
    if (systemMessages.length > 0) {
      systemPrefix = systemMessages.map(m => m.content).join('\n\n') + '\n\n';
    }

    if (chatMessages.length === 0) {
      return { history: [], lastMessage: systemPrefix || 'Hello' };
    }

    const lastMsg = chatMessages[chatMessages.length - 1];
    const historyMessages = chatMessages.slice(0, -1);

    const history = historyMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const lastMessage = systemPrefix + (lastMsg.content || '');

    return { history, lastMessage };
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

export const googleAdapter = new GoogleAdapter();
