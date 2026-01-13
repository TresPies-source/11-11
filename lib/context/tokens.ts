import { encoding_for_model, type TiktokenModel } from 'tiktoken';

let encoder: ReturnType<typeof encoding_for_model> | null = null;

export function countTokens(text: string, model: string = 'gpt-4o'): number {
  if (!text || text.length === 0) {
    return 0;
  }

  try {
    if (!encoder) {
      encoder = encoding_for_model(model as TiktokenModel);
    }
    const tokens = encoder.encode(text);
    return tokens.length;
  } catch (error) {
    console.warn('[TOKENS] Tiktoken encoding failed, using fallback estimation');
    return Math.ceil(text.length / 4);
  }
}

export function countMessageTokens(messages: any[], model: string = 'gpt-4o'): number {
  if (!messages || messages.length === 0) {
    return 0;
  }

  const text = messages
    .map(m => `${m.role || 'user'}: ${m.content || ''}`)
    .join('\n\n');
  
  return countTokens(text, model);
}

export function estimateTokensForObject(obj: any, model: string = 'gpt-4o'): number {
  try {
    const json = JSON.stringify(obj);
    return countTokens(json, model);
  } catch (error) {
    console.warn('[TOKENS] Failed to stringify object for token estimation');
    return 0;
  }
}

export function freeEncoder(): void {
  if (encoder) {
    encoder.free();
    encoder = null;
  }
}
