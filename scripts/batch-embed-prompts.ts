/**
 * Batch Embedding Script
 * 
 * Generates embeddings for all prompts that don't have embeddings yet.
 * Useful for:
 * - Initial setup after installing Librarian Agent
 * - Re-generating embeddings after system updates
 * - Fixing missing embeddings
 * 
 * Usage:
 *   npx tsx scripts/batch-embed-prompts.ts [userId] [--batch-size=10] [--dry-run]
 * 
 * Examples:
 *   npx tsx scripts/batch-embed-prompts.ts user_123
 *   npx tsx scripts/batch-embed-prompts.ts user_123 --batch-size=5
 *   npx tsx scripts/batch-embed-prompts.ts user_123 --dry-run
 * 
 * @module scripts/batch-embed-prompts
 */

import { embedAllPrompts } from '@/lib/librarian/embeddings';
import { getDB } from '@/lib/pglite/client';
import { canUseOpenAI } from '@/lib/openai/client';

interface ScriptOptions {
  userId: string;
  batchSize: number;
  dryRun: boolean;
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Batch Embedding Script
======================

Generates embeddings for all prompts without embeddings.

Usage:
  npx tsx scripts/batch-embed-prompts.ts [userId] [options]

Arguments:
  userId              User ID to embed prompts for (required)

Options:
  --batch-size=N      Number of prompts per batch (default: 10)
  --dry-run           Show what would be done without executing
  --help, -h          Show this help message

Examples:
  npx tsx scripts/batch-embed-prompts.ts user_123
  npx tsx scripts/batch-embed-prompts.ts user_123 --batch-size=5
  npx tsx scripts/batch-embed-prompts.ts user_123 --dry-run

Performance:
  Target: <2 minutes for 100 prompts
  Recommended batch size: 5-10 (avoids rate limits)
    `);
    process.exit(0);
  }

  const userId = args[0];

  if (!userId || userId.startsWith('--')) {
    console.error('Error: userId is required');
    console.log('Run with --help for usage information');
    process.exit(1);
  }

  const options: ScriptOptions = {
    userId,
    batchSize: 10,
    dryRun: false,
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--batch-size=')) {
      const value = parseInt(arg.split('=')[1], 10);
      if (isNaN(value) || value < 1) {
        console.error('Error: batch-size must be a positive integer');
        process.exit(1);
      }
      options.batchSize = value;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else {
      console.warn(`Warning: Unknown option ${arg} (ignored)`);
    }
  }

  return options;
}

async function getDryRunStats(userId: string): Promise<{
  totalPrompts: number;
  promptsWithEmbedding: number;
  promptsWithoutEmbedding: number;
  estimatedCost: number;
  estimatedTime: number;
}> {
  const db = await getDB();

  const totalResult = await db.query(
    'SELECT COUNT(*) as count FROM prompts WHERE user_id = $1',
    [userId]
  );

  const withEmbeddingResult = await db.query(
    'SELECT COUNT(*) as count FROM prompts WHERE user_id = $1 AND embedding IS NOT NULL',
    [userId]
  );

  const withoutEmbeddingResult = await db.query(
    'SELECT COUNT(*) as count FROM prompts WHERE user_id = $1 AND embedding IS NULL',
    [userId]
  );

  const total = parseInt((totalResult.rows[0] as any).count, 10);
  const withEmbedding = parseInt((withEmbeddingResult.rows[0] as any).count, 10);
  const withoutEmbedding = parseInt((withoutEmbeddingResult.rows[0] as any).count, 10);

  // Estimate cost: $0.02 per 1M tokens, avg 500 tokens per prompt
  const estimatedTokens = withoutEmbedding * 500;
  const estimatedCost = (estimatedTokens / 1_000_000) * 0.02;

  // Estimate time: ~500ms per prompt (includes API call + retry)
  const estimatedTime = withoutEmbedding * 0.5;

  return {
    totalPrompts: total,
    promptsWithEmbedding: withEmbedding,
    promptsWithoutEmbedding: withoutEmbedding,
    estimatedCost,
    estimatedTime,
  };
}

async function main() {
  const options = parseArgs();

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          Batch Embedding Script for Librarian Agent       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Check OpenAI API availability
  if (!canUseOpenAI()) {
    console.error('❌ Error: OpenAI API is not configured');
    console.error('   Set OPENAI_API_KEY in .env.local');
    process.exit(1);
  }

  console.log(`📋 Configuration:`);
  console.log(`   User ID:      ${options.userId}`);
  console.log(`   Batch Size:   ${options.batchSize}`);
  console.log(`   Dry Run:      ${options.dryRun ? 'Yes' : 'No'}`);
  console.log();

  // Get statistics
  const stats = await getDryRunStats(options.userId);

  console.log(`📊 Statistics:`);
  console.log(`   Total Prompts:            ${stats.totalPrompts}`);
  console.log(`   With Embedding:           ${stats.promptsWithEmbedding}`);
  console.log(`   Without Embedding:        ${stats.promptsWithoutEmbedding}`);
  console.log();

  if (stats.promptsWithoutEmbedding === 0) {
    console.log('✅ All prompts already have embeddings!');
    console.log('   Nothing to do.');
    process.exit(0);
  }

  console.log(`💰 Estimates:`);
  console.log(`   Estimated Cost:           $${stats.estimatedCost.toFixed(4)}`);
  console.log(`   Estimated Time:           ${stats.estimatedTime.toFixed(1)}s (${(stats.estimatedTime / 60).toFixed(1)}m)`);
  console.log();

  if (options.dryRun) {
    console.log('🔍 Dry run mode - no embeddings will be generated');
    console.log('   Run without --dry-run to execute');
    process.exit(0);
  }

  // Confirm before proceeding
  console.log('⚠️  WARNING: This will generate embeddings and incur OpenAI API costs');
  console.log(`   Estimated cost: $${stats.estimatedCost.toFixed(4)}`);
  console.log();

  // In production, you might want to add a confirmation prompt here
  // For now, we'll proceed automatically

  console.log('🚀 Starting batch embedding...\n');

  const startTime = Date.now();

  try {
    const result = await embedAllPrompts(options.userId, options.batchSize);

    const duration = (Date.now() - startTime) / 1000;

    console.log();
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    Batch Embedding Complete                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`✅ Results:`);
    console.log(`   Processed:          ${result.total_processed}/${stats.promptsWithoutEmbedding}`);
    console.log(`   Total Tokens:       ${result.total_tokens.toLocaleString()}`);
    console.log(`   Total Cost:         $${result.total_cost_usd.toFixed(4)}`);
    console.log(`   Duration:           ${duration.toFixed(1)}s (${(duration / 60).toFixed(1)}m)`);
    console.log(`   Performance:        ${(result.total_processed / duration).toFixed(1)} prompts/sec`);
    console.log();

    if (result.errors.length > 0) {
      console.log(`⚠️  Errors: ${result.errors.length}`);
      console.log();
      result.errors.forEach(err => {
        console.log(`   ❌ ${err.id}: ${err.error}`);
      });
      console.log();
    }

    // Performance check
    const targetTime = (stats.promptsWithoutEmbedding / 100) * 120; // 2 min per 100 prompts
    if (duration <= targetTime) {
      console.log(`✅ Performance target met! (${duration.toFixed(1)}s ≤ ${targetTime.toFixed(1)}s)`);
    } else {
      console.log(`⚠️  Performance target not met (${duration.toFixed(1)}s > ${targetTime.toFixed(1)}s)`);
      console.log(`   Consider reducing batch size or checking network connection`);
    }

    process.exit(result.errors.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Fatal error during batch embedding:');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Unhandled error:');
  console.error(error);
  process.exit(1);
});
