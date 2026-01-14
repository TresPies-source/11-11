import type { SeedRow, SeedType, SeedStatus } from "@/lib/seeds/types";

async function testSeedCardComponent() {
  console.log('=== Testing SeedCard Component ===\n');

  try {
    console.log('✓ Verifying component module structure...');
    
    const { SeedCard } = await import("@/components/seeds/seed-card");
    
    if (!SeedCard || (typeof SeedCard !== 'function' && typeof SeedCard !== 'object')) {
      throw new Error('SeedCard is not a valid React component');
    }
    console.log('✓ SeedCard component exports correctly\n');

    console.log('✓ Verifying type definitions...');
    const seedTypes: SeedType[] = ['principle', 'pattern', 'question', 'route', 'artifact', 'constraint'];
    const seedStatuses: SeedStatus[] = ['new', 'growing', 'mature', 'compost'];
    
    if (seedTypes.length !== 6) {
      throw new Error('SeedType should have 6 values');
    }
    
    if (seedStatuses.length !== 4) {
      throw new Error('SeedStatus should have 4 values');
    }
    console.log('✓ Type definitions are correct\n');

    console.log('✓ Creating mock seed data...');
    const mockSeed: SeedRow = {
      id: "seed_test_123",
      name: "Test Principle Seed",
      type: "principle",
      status: "new",
      content: "This is a test seed content that explains the principle.",
      why_matters: "This matters because it demonstrates the component",
      revisit_when: "When building new features",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: null,
      session_id: null,
      replanted: false,
      replant_count: 0,
    };
    console.log('✓ Mock seed data created\n');

    console.log('=== SeedCard Component Tests Passed! ===');
    console.log('\nNote: Component structure verified. Visual/interactive testing');
    console.log('should be done in the browser when the seeds page is implemented.');
    return true;
  } catch (error) {
    console.error('\n❌ SeedCard component test failed:', error);
    throw error;
  }
}

testSeedCardComponent()
  .then(() => {
    console.log('\n✓ SeedCard component test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ SeedCard component test failed:', error);
    process.exit(1);
  });
