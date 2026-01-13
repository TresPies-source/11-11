/**
 * Embedding Service Usage Examples
 * 
 * This file demonstrates how to use the embedding service in various scenarios.
 * These are examples only - not meant to be run as tests.
 */

import { generateEmbedding, embedPrompt, embedAllPrompts } from './embeddings';
import { rankBySimilarity } from './vector';

export async function example1_generateSimpleEmbedding() {
  const result = await generateEmbedding('Budget planning for Q1');
  
  console.log('=== Example 1: Generate Simple Embedding ===');
  console.log(`Embedding dimensions: ${result.embedding.length}`);
  console.log(`Tokens used: ${result.tokens_used}`);
  console.log(`Cost: $${result.cost_usd.toFixed(6)}`);
  console.log(`Model: ${result.model}`);
  
  return result;
}

export async function example2_embedPromptToDatabase() {
  const result = await embedPrompt(
    'prompt_123',
    'Help me create a comprehensive budget plan for Q1 2026',
    'user_456',
    'session_abc'
  );
  
  console.log('=== Example 2: Embed Prompt to Database ===');
  console.log(`Prompt embedded successfully`);
  console.log(`Tokens: ${result.tokens_used}, Cost: $${result.cost_usd.toFixed(6)}`);
  
  return result;
}

export async function example3_batchEmbedding() {
  const result = await embedAllPrompts('user_123', 10);
  
  console.log('=== Example 3: Batch Embed All Prompts ===');
  console.log(`Processed: ${result.total_processed} prompts`);
  console.log(`Total tokens: ${result.total_tokens}`);
  console.log(`Total cost: $${result.total_cost_usd.toFixed(4)}`);
  console.log(`Duration: ${(result.duration_ms / 1000).toFixed(1)}s`);
  console.log(`Errors: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log('Failed prompts:');
    result.errors.forEach(err => {
      console.log(`  - ${err.id}: ${err.error}`);
    });
  }
  
  return result;
}

export async function example4_semanticSearch() {
  const queryEmbedding = await generateEmbedding('budget planning');
  
  const documents = [
    {
      id: 'prompt_1',
      title: 'Monthly Budget Planning',
      embedding: await generateEmbedding('Create a monthly budget plan with categories for expenses'),
    },
    {
      id: 'prompt_2',
      title: 'Travel Itinerary',
      embedding: await generateEmbedding('Plan a vacation itinerary for Europe'),
    },
    {
      id: 'prompt_3',
      title: 'Annual Budget Review',
      embedding: await generateEmbedding('Review and analyze annual budget performance'),
    },
  ];
  
  const documentEmbeddings = documents.map(doc => ({
    id: doc.id,
    title: doc.title,
    embedding: doc.embedding.embedding,
  }));
  
  const results = rankBySimilarity(
    queryEmbedding.embedding,
    documentEmbeddings,
    0.7
  );
  
  console.log('=== Example 4: Semantic Search ===');
  console.log(`Query: "budget planning"`);
  console.log(`Found ${results.length} results above 70% similarity:`);
  
  results.forEach((result, index) => {
    const doc = documents.find(d => d.id === result.id);
    console.log(`${index + 1}. ${doc?.title} - ${(result.similarity * 100).toFixed(0)}% match`);
  });
  
  return results;
}

export async function example5_findSimilarPrompts() {
  const currentPrompt = 'Help me create a budget plan for my startup';
  const currentEmbedding = await generateEmbedding(currentPrompt);
  
  const existingPrompts = [
    {
      id: 'p1',
      content: 'Business budget template for small companies',
      embedding: await generateEmbedding('Business budget template for small companies'),
    },
    {
      id: 'p2',
      content: 'Recipe for chocolate chip cookies',
      embedding: await generateEmbedding('Recipe for chocolate chip cookies'),
    },
    {
      id: 'p3',
      content: 'Financial planning for entrepreneurs',
      embedding: await generateEmbedding('Financial planning for entrepreneurs'),
    },
  ];
  
  const promptEmbeddings = existingPrompts.map(p => ({
    id: p.id,
    content: p.content,
    embedding: p.embedding.embedding,
  }));
  
  const similar = rankBySimilarity(
    currentEmbedding.embedding,
    promptEmbeddings,
    0.75
  );
  
  console.log('=== Example 5: Find Similar Prompts ===');
  console.log(`Current prompt: "${currentPrompt}"`);
  console.log(`Similar prompts (>75% match):`);
  
  similar.forEach((result, index) => {
    const prompt = existingPrompts.find(p => p.id === result.id);
    console.log(`${index + 1}. "${prompt?.content}" - ${(result.similarity * 100).toFixed(0)}% match`);
  });
  
  return similar;
}

export async function example6_costTracking() {
  console.log('=== Example 6: Cost Tracking ===');
  
  const embedding1 = await generateEmbedding('Short text');
  console.log(`Short text (${embedding1.tokens_used} tokens): $${embedding1.cost_usd.toFixed(6)}`);
  
  const longText = 'This is a much longer piece of text that contains multiple sentences and various information about different topics. It should use more tokens and cost slightly more to embed.';
  const embedding2 = await generateEmbedding(longText);
  console.log(`Long text (${embedding2.tokens_used} tokens): $${embedding2.cost_usd.toFixed(6)}`);
  
  const totalCost = embedding1.cost_usd + embedding2.cost_usd;
  console.log(`Total cost: $${totalCost.toFixed(6)}`);
  
  console.log('\nNote: All costs are automatically tracked in Cost Guard system');
  
  return { embedding1, embedding2, totalCost };
}

if (require.main === module) {
  console.log('Embedding Service Examples\n');
  console.log('⚠️  These examples require a valid OpenAI API key');
  console.log('⚠️  They will make real API calls and incur small costs\n');
  console.log('Uncomment the examples you want to run:\n');
  
  // example1_generateSimpleEmbedding();
  // example2_embedPromptToDatabase();
  // example3_batchEmbedding();
  // example4_semanticSearch();
  // example5_findSimilarPrompts();
  // example6_costTracking();
}
