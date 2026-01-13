/**
 * Unit tests for auto-embedding hooks.
 * 
 * Tests:
 * - Auto-embed on create
 * - Auto-embed on update
 * - Configuration management
 * - Error handling
 * 
 * @module lib/librarian/auto-embed.test
 */

import {
  configureAutoEmbed,
  getAutoEmbedConfig,
  isAutoEmbedEnabled,
  autoEmbedOnCreate,
  autoEmbedOnUpdate,
} from './auto-embed';

console.log('🧪 Testing Auto-Embedding Hooks...\n');

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  testsRun++;
  try {
    await fn();
    testsPassed++;
    console.log(`✅ ${name}`);
  } catch (error: any) {
    testsFailed++;
    console.error(`❌ ${name}`);
    console.error(`   ${error.message}`);
  }
}

function assertEquals(actual: any, expected: any, message?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function assertTrue(value: boolean, message?: string) {
  if (!value) {
    throw new Error(message || 'Expected true, got false');
  }
}

function assertFalse(value: boolean, message?: string) {
  if (value) {
    throw new Error(message || 'Expected false, got true');
  }
}

// Run all tests sequentially to avoid state pollution
async function runTests() {
  // Reset config before tests
  configureAutoEmbed({ onCreate: true, onUpdate: true, onlyIfContentChanged: true });

  // Test 1: Default configuration
  await test('Default configuration is correct', () => {
    const config = getAutoEmbedConfig();
    assertEquals(config.onCreate, true, 'onCreate should be true by default');
    assertEquals(config.onUpdate, true, 'onUpdate should be true by default');
    assertEquals(config.onlyIfContentChanged, true, 'onlyIfContentChanged should be true by default');
  });

  // Test 2: Configure auto-embed
  await test('Configuration can be updated', () => {
    configureAutoEmbed({ onCreate: false });
    const config = getAutoEmbedConfig();
    assertEquals(config.onCreate, false, 'onCreate should be false after update');
    assertEquals(config.onUpdate, true, 'onUpdate should still be true');

    // Reset to default
    configureAutoEmbed({ onCreate: true });
  });

  // Test 3: Partial configuration update
  await test('Partial configuration update works', () => {
    configureAutoEmbed({ onUpdate: false, onlyIfContentChanged: false });
    const config = getAutoEmbedConfig();
    assertEquals(config.onCreate, true, 'onCreate should still be true');
    assertEquals(config.onUpdate, false, 'onUpdate should be false');
    assertEquals(config.onlyIfContentChanged, false, 'onlyIfContentChanged should be false');

    // Reset to default
    configureAutoEmbed({ onUpdate: true, onlyIfContentChanged: true });
  });

  // Test 4: isAutoEmbedEnabled
  await test('isAutoEmbedEnabled returns correct values', () => {
    assertTrue(isAutoEmbedEnabled('create'), 'create should be enabled');
    assertTrue(isAutoEmbedEnabled('update'), 'update should be enabled');

    configureAutoEmbed({ onCreate: false });
    assertFalse(isAutoEmbedEnabled('create'), 'create should be disabled');
    assertTrue(isAutoEmbedEnabled('update'), 'update should still be enabled');

    // Reset
    configureAutoEmbed({ onCreate: true });
  });

  // Test 5: autoEmbedOnCreate with disabled config
  await test('autoEmbedOnCreate skips when disabled', async () => {
    configureAutoEmbed({ onCreate: false });

    // Should not throw, just log and return
    await autoEmbedOnCreate('test_prompt_1', 'Test content', 'test_user_1');

    // Reset
    configureAutoEmbed({ onCreate: true });
  });

  // Test 6: autoEmbedOnCreate with empty content
  await test('autoEmbedOnCreate skips empty content', async () => {
    await autoEmbedOnCreate('test_prompt_2', '', 'test_user_1');
    await autoEmbedOnCreate('test_prompt_3', '   ', 'test_user_1');
  });

  // Test 7: autoEmbedOnUpdate with disabled config
  await test('autoEmbedOnUpdate skips when disabled', async () => {
    configureAutoEmbed({ onUpdate: false });

    await autoEmbedOnUpdate('test_prompt_4', 'New content', 'test_user_1');

    // Reset
    configureAutoEmbed({ onUpdate: true });
  });

  // Test 8: autoEmbedOnUpdate with unchanged content
  await test('autoEmbedOnUpdate skips unchanged content', async () => {
    configureAutoEmbed({ onlyIfContentChanged: true });

    // Content is undefined (not changed)
    await autoEmbedOnUpdate('test_prompt_5', undefined, 'test_user_1');
  });

  // Test 9: autoEmbedOnUpdate with empty content
  await test('autoEmbedOnUpdate skips empty content', async () => {
    await autoEmbedOnUpdate('test_prompt_6', '', 'test_user_1');
    await autoEmbedOnUpdate('test_prompt_7', '   ', 'test_user_1');
  });

  // Test 10: Configuration isolation
  await test('Configuration changes are isolated', () => {
    const config1 = getAutoEmbedConfig();
    config1.onCreate = false; // Try to mutate

    const config2 = getAutoEmbedConfig();
    assertEquals(config2.onCreate, true, 'Configuration should not be mutated');
  });

  // Print results
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Tests Run:    ${testsRun}`);
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (testsFailed > 0) {
    console.error('❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error during tests:', error);
  process.exit(1);
});
