import {
  LLMClient,
  isDevMode,
  hasValidAPIKey,
  canUseProvider,
} from './client';
import {
  LLMError,
  LLMAuthError,
  LLMRateLimitError,
  LLMTimeoutError,
} from './types';

console.log('Testing LLM Client...\n');

console.log('Test 1: isDevMode returns correct value');
try {
  const devMode = isDevMode();
  const expectedDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  
  if (devMode !== expectedDevMode) {
    throw new Error(`Expected ${expectedDevMode}, got ${devMode}`);
  }
  
  console.log(`✓ Dev mode: ${devMode}`);
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 2: hasValidAPIKey checks DeepSeek key');
try {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const hasKey = hasValidAPIKey('deepseek');
  
  const expectedHasKey = !!(
    deepseekKey &&
    deepseekKey !== 'your-deepseek-api-key-here' &&
    deepseekKey.startsWith('sk-')
  );
  
  if (hasKey !== expectedHasKey) {
    throw new Error(`Expected ${expectedHasKey}, got ${hasKey}`);
  }
  
  console.log(`✓ DeepSeek API key validation: ${hasKey ? 'valid' : 'invalid/missing'}`);
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 3: hasValidAPIKey checks OpenAI key');
try {
  const openaiKey = process.env.OPENAI_API_KEY;
  const hasKey = hasValidAPIKey('openai');
  
  const expectedHasKey = !!(
    openaiKey &&
    openaiKey !== 'your-openai-api-key-here' &&
    openaiKey.startsWith('sk-')
  );
  
  if (hasKey !== expectedHasKey) {
    throw new Error(`Expected ${expectedHasKey}, got ${hasKey}`);
  }
  
  console.log(`✓ OpenAI API key validation: ${hasKey ? 'valid' : 'invalid/missing'}`);
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 4: hasValidAPIKey rejects placeholder keys');
try {
  const originalKey = process.env.DEEPSEEK_API_KEY;
  
  process.env.DEEPSEEK_API_KEY = 'your-deepseek-api-key-here';
  const hasPlaceholder = hasValidAPIKey('deepseek');
  
  process.env.DEEPSEEK_API_KEY = originalKey;
  
  if (hasPlaceholder) {
    throw new Error('Should reject placeholder key');
  }
  
  console.log('✓ Placeholder keys correctly rejected');
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 5: hasValidAPIKey rejects non-sk- keys');
try {
  const originalKey = process.env.DEEPSEEK_API_KEY;
  
  process.env.DEEPSEEK_API_KEY = 'invalid-key-format';
  const hasInvalid = hasValidAPIKey('deepseek');
  
  process.env.DEEPSEEK_API_KEY = originalKey;
  
  if (hasInvalid) {
    throw new Error('Should reject non-sk- prefixed key');
  }
  
  console.log('✓ Non-sk- keys correctly rejected');
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 6: canUseProvider in dev mode');
try {
  const originalDevMode = process.env.NEXT_PUBLIC_DEV_MODE;
  const originalDeepSeekKey = process.env.DEEPSEEK_API_KEY;
  
  process.env.NEXT_PUBLIC_DEV_MODE = 'true';
  process.env.DEEPSEEK_API_KEY = 'sk-test-key';
  
  const canUse = canUseProvider('deepseek');
  
  process.env.NEXT_PUBLIC_DEV_MODE = originalDevMode;
  process.env.DEEPSEEK_API_KEY = originalDeepSeekKey;
  
  if (!canUse) {
    throw new Error('Should be able to use provider with valid key in dev mode');
  }
  
  console.log('✓ Can use provider with valid key in dev mode');
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 7: canUseProvider in dev mode without key');
try {
  const originalDevMode = process.env.NEXT_PUBLIC_DEV_MODE;
  const originalDeepSeekKey = process.env.DEEPSEEK_API_KEY;
  
  process.env.NEXT_PUBLIC_DEV_MODE = 'true';
  process.env.DEEPSEEK_API_KEY = '';
  
  const canUse = canUseProvider('deepseek');
  
  process.env.NEXT_PUBLIC_DEV_MODE = originalDevMode;
  process.env.DEEPSEEK_API_KEY = originalDeepSeekKey;
  
  if (canUse) {
    throw new Error('Should not be able to use provider without key');
  }
  
  console.log('✓ Cannot use provider without key in dev mode');
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 8: LLMClient initialization');
try {
  const client = new LLMClient();
  
  if (!client) {
    throw new Error('Client should be initialized');
  }
  
  console.log('✓ LLMClient initialized successfully');
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 9: LLMClient.resetClients()');
try {
  const client = new LLMClient();
  client.resetClients();
  
  console.log('✓ Client reset without errors');
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 10: LLMAuthError structure');
try {
  const error = new LLMAuthError('Test auth error');
  
  if (error.name !== 'LLMAuthError') {
    throw new Error(`Expected name 'LLMAuthError', got '${error.name}'`);
  }
  
  if (error.code !== 'AUTH_ERROR') {
    throw new Error(`Expected code 'AUTH_ERROR', got '${error.code}'`);
  }
  
  if (error.status !== 401) {
    throw new Error(`Expected status 401, got ${error.status}`);
  }
  
  console.log('✓ LLMAuthError structure correct');
  console.log(`  Name: ${error.name}`);
  console.log(`  Code: ${error.code}`);
  console.log(`  Status: ${error.status}`);
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 11: LLMRateLimitError structure');
try {
  const error = new LLMRateLimitError('Test rate limit error');
  
  if (error.name !== 'LLMRateLimitError') {
    throw new Error(`Expected name 'LLMRateLimitError', got '${error.name}'`);
  }
  
  if (error.code !== 'RATE_LIMIT_ERROR') {
    throw new Error(`Expected code 'RATE_LIMIT_ERROR', got '${error.code}'`);
  }
  
  if (error.status !== 429) {
    throw new Error(`Expected status 429, got ${error.status}`);
  }
  
  console.log('✓ LLMRateLimitError structure correct');
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 12: LLMTimeoutError structure');
try {
  const error = new LLMTimeoutError('Test timeout error');
  
  if (error.name !== 'LLMTimeoutError') {
    throw new Error(`Expected name 'LLMTimeoutError', got '${error.name}'`);
  }
  
  if (error.code !== 'TIMEOUT_ERROR') {
    throw new Error(`Expected code 'TIMEOUT_ERROR', got '${error.code}'`);
  }
  
  if (error.status !== 408) {
    throw new Error(`Expected status 408, got ${error.status}`);
  }
  
  console.log('✓ LLMTimeoutError structure correct');
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 13: LLMError with custom code and status');
try {
  const error = new LLMError('Test error', 'CUSTOM_CODE', 500);
  
  if (error.code !== 'CUSTOM_CODE') {
    throw new Error(`Expected code 'CUSTOM_CODE', got '${error.code}'`);
  }
  
  if (error.status !== 500) {
    throw new Error(`Expected status 500, got ${error.status}`);
  }
  
  console.log('✓ LLMError accepts custom code and status');
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 14: Error inheritance chain');
try {
  const authError = new LLMAuthError('Auth test');
  const rateLimitError = new LLMRateLimitError('Rate limit test');
  const timeoutError = new LLMTimeoutError('Timeout test');
  
  if (!(authError instanceof LLMError)) {
    throw new Error('LLMAuthError should inherit from LLMError');
  }
  
  if (!(rateLimitError instanceof LLMError)) {
    throw new Error('LLMRateLimitError should inherit from LLMError');
  }
  
  if (!(timeoutError instanceof LLMError)) {
    throw new Error('LLMTimeoutError should inherit from LLMError');
  }
  
  if (!(authError instanceof Error)) {
    throw new Error('LLMAuthError should inherit from Error');
  }
  
  console.log('✓ Error inheritance chain correct');
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('Test 15: API key presence check (informational)');
try {
  const deepseekPresent = !!process.env.DEEPSEEK_API_KEY && 
                          process.env.DEEPSEEK_API_KEY !== 'your-deepseek-api-key-here';
  const openaiPresent = !!process.env.OPENAI_API_KEY && 
                        process.env.OPENAI_API_KEY !== 'your-openai-api-key-here';
  
  console.log('ℹ API key status:');
  console.log(`  DeepSeek: ${deepseekPresent ? '✓ present' : '✗ missing'}`);
  console.log(`  OpenAI: ${openaiPresent ? '✓ present' : '✗ missing'}`);
  
  if (!deepseekPresent && !openaiPresent) {
    console.log('\n⚠ Note: No API keys configured. Integration tests will be skipped.');
    console.log('  Add DEEPSEEK_API_KEY or OPENAI_API_KEY to .env.local to enable integration tests.');
  }
} catch (error) {
  console.error('✗ FAIL:', error);
  process.exit(1);
}
console.log();

console.log('✅ All client unit tests passed!\n');

console.log('\n--- Integration Test Section ---\n');

async function runIntegrationTests() {
  const hasDeepSeek = hasValidAPIKey('deepseek');
  const hasOpenAI = hasValidAPIKey('openai');
  
  if (!hasDeepSeek && !hasOpenAI) {
    console.log('⚠ Skipping integration tests - no valid API keys configured');
    return;
  }
  
  const client = new LLMClient();
  
  if (hasDeepSeek) {
    console.log('Integration Test 1: Call deepseek-chat');
    try {
      const response = await client.call('deepseek-chat', [
        { role: 'user', content: 'Say "test" and nothing else.' },
      ], { temperature: 0, maxTokens: 10 });
      
      if (!response.content) {
        throw new Error('Expected content in response');
      }
      
      if (!response.usage) {
        throw new Error('Expected usage in response');
      }
      
      console.log('✓ DeepSeek chat call successful');
      console.log(`  Response: ${response.content}`);
      console.log(`  Tokens used: ${response.usage.total_tokens}`);
    } catch (error) {
      if (error instanceof LLMAuthError) {
        console.log('⚠ DeepSeek API key appears invalid');
      } else if (error instanceof LLMRateLimitError) {
        console.log('⚠ DeepSeek rate limit reached');
      } else {
        console.error('✗ FAIL:', error);
        process.exit(1);
      }
    }
    console.log();
    
    console.log('Integration Test 2: Call with tools');
    try {
      const response = await client.call('deepseek-chat', [
        { role: 'user', content: 'What is 2+2?' },
      ], {
        temperature: 0,
        maxTokens: 100,
        tools: [{
          type: 'function',
          function: {
            name: 'calculate',
            description: 'Perform arithmetic calculation',
            parameters: {
              type: 'object',
              properties: {
                expression: { type: 'string' },
              },
              required: ['expression'],
            },
          },
        }],
      });
      
      console.log('✓ DeepSeek call with tools successful');
      console.log(`  Tool calls: ${response.toolCalls ? response.toolCalls.length : 0}`);
    } catch (error) {
      if (error instanceof LLMAuthError || error instanceof LLMRateLimitError) {
        console.log('⚠ DeepSeek API error (skipping)');
      } else {
        console.error('✗ FAIL:', error);
        process.exit(1);
      }
    }
    console.log();
  }
  
  if (hasOpenAI) {
    console.log('Integration Test 3: Call gpt-4o-mini');
    try {
      const response = await client.call('gpt-4o-mini', [
        { role: 'user', content: 'Say "test" and nothing else.' },
      ], { temperature: 0, maxTokens: 10 });
      
      if (!response.content) {
        throw new Error('Expected content in response');
      }
      
      console.log('✓ GPT-4o-mini call successful');
      console.log(`  Response: ${response.content}`);
      console.log(`  Tokens used: ${response.usage.total_tokens}`);
    } catch (error) {
      if (error instanceof LLMAuthError) {
        console.log('⚠ OpenAI API key appears invalid');
      } else if (error instanceof LLMRateLimitError) {
        console.log('⚠ OpenAI rate limit reached');
      } else {
        console.error('✗ FAIL:', error);
        process.exit(1);
      }
    }
    console.log();
  }
  
  if (hasDeepSeek && hasOpenAI) {
    console.log('Integration Test 4: callWithFallback (primary succeeds)');
    try {
      const response = await client.callWithFallback('supervisor', [
        { role: 'user', content: 'Say "test" and nothing else.' },
      ], { temperature: 0, maxTokens: 10 });
      
      if (!response.content) {
        throw new Error('Expected content in response');
      }
      
      console.log('✓ Fallback call successful (primary used)');
      console.log(`  Response: ${response.content}`);
    } catch (error) {
      console.error('✗ FAIL:', error);
      process.exit(1);
    }
    console.log();
    
    console.log('Integration Test 5: createJSONCompletion');
    try {
      const { data, usage } = await client.createJSONCompletion(
        'deepseek-chat',
        [
          { 
            role: 'system', 
            content: 'You are a helpful assistant. Respond in JSON format.' 
          },
          { 
            role: 'user', 
            content: 'Return a JSON object with a "message" field set to "hello".' 
          },
        ],
        { temperature: 0, maxTokens: 50 }
      );
      
      if (typeof data !== 'object') {
        throw new Error('Expected JSON object in response');
      }
      
      console.log('✓ JSON completion successful');
      console.log(`  Data: ${JSON.stringify(data)}`);
      console.log(`  Tokens used: ${usage.total_tokens}`);
    } catch (error) {
      if (error instanceof LLMError && error.code === 'JSON_PARSE_ERROR') {
        console.log('⚠ Model did not return valid JSON (this can happen)');
      } else if (error instanceof LLMAuthError || error instanceof LLMRateLimitError) {
        console.log('⚠ API error (skipping)');
      } else {
        console.error('✗ FAIL:', error);
        process.exit(1);
      }
    }
    console.log();
  }
  
  console.log('✅ Integration tests completed!\n');
}

runIntegrationTests().catch((error) => {
  console.error('✗ Integration tests failed:', error);
  process.exit(1);
});
