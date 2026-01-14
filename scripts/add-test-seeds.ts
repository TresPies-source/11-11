import { insertSeed } from "../lib/pglite/seeds";
import type { SeedType, SeedStatus } from "../lib/seeds/types";

async function addTestSeeds() {
  console.log("Adding test seeds...");

  const testSeeds = [
    {
      name: "Always Test Edge Cases First",
      type: "principle" as SeedType,
      status: "mature" as SeedStatus,
      content:
        "When implementing new features, always consider and test edge cases before the happy path. Edge cases reveal the true robustness of your solution.",
      why_matters:
        "Catching edge cases early prevents production bugs and improves code quality",
      revisit_when: "Starting a new feature or fixing a critical bug",
    },
    {
      name: "Component Composition Pattern",
      type: "pattern" as SeedType,
      status: "growing" as SeedStatus,
      content:
        "Break down complex UI components into smaller, reusable pieces. Each component should have a single responsibility and compose with others.",
      why_matters: "Improves code reusability, testability, and maintainability",
      revisit_when: "Building a complex UI feature",
    },
    {
      name: "How to Handle Database Migrations?",
      type: "question" as SeedType,
      status: "new" as SeedStatus,
      content:
        "What's the best strategy for handling database schema changes in production? Should we use automatic migrations, manual scripts, or a hybrid approach?",
      why_matters: "Critical for zero-downtime deployments",
      revisit_when: "Planning a major database schema change",
    },
    {
      name: "Move to TypeScript Strict Mode",
      type: "route" as SeedType,
      status: "new" as SeedStatus,
      content:
        "Gradually enable TypeScript strict mode across the codebase. Start with new files, then incrementally update existing ones.",
      why_matters: "Catches more bugs at compile time and improves type safety",
      revisit_when: "After completing current sprint",
    },
    {
      name: "Dojo Protocol Design Document",
      type: "artifact" as SeedType,
      status: "mature" as SeedStatus,
      content:
        "The comprehensive design document outlining the Dojo Protocol's philosophy, patterns, and implementation guidelines.",
      why_matters: "Foundational document that guides all development decisions",
      revisit_when: "Onboarding new team members or making architectural decisions",
    },
    {
      name: "No Server-Side State in API Routes",
      type: "constraint" as SeedType,
      status: "mature" as SeedStatus,
      content:
        "API routes must be stateless. All state should be stored in the database or client-side. This ensures horizontal scalability.",
      why_matters: "Enables the application to scale horizontally without issues",
      revisit_when: "Designing new API endpoints",
    },
    {
      name: "Progressive Enhancement Strategy",
      type: "principle" as SeedType,
      status: "growing" as SeedStatus,
      content:
        "Build features that work without JavaScript first, then enhance with client-side interactions. This ensures accessibility and resilience.",
      why_matters: "Improves accessibility, SEO, and user experience on slow networks",
      revisit_when: "Implementing user-facing features",
    },
    {
      name: "Error Boundary Best Practices",
      type: "pattern" as SeedType,
      status: "mature" as SeedStatus,
      content:
        "Wrap components with error boundaries at strategic points (page level, feature level). Provide fallback UIs and error reporting.",
      why_matters: "Prevents entire app crashes from isolated component failures",
      revisit_when: "Adding new page or complex feature",
    },
    {
      name: "Should We Cache Database Queries?",
      type: "question" as SeedType,
      status: "growing" as SeedStatus,
      content:
        "For read-heavy operations, should we implement a caching layer (Redis, in-memory)? What are the trade-offs with data freshness?",
      why_matters: "Could significantly improve performance for read-heavy operations",
      revisit_when: "Performance optimization sprint",
    },
    {
      name: "Stale Architecture Decisions from v0.1",
      type: "artifact" as SeedType,
      status: "compost" as SeedStatus,
      content:
        "Several architectural decisions from v0.1 are no longer relevant after the migration to Next.js 14 and App Router.",
      why_matters: "Important to document what no longer applies",
      revisit_when: "Never - archived for historical reference only",
    },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const seed of testSeeds) {
    try {
      const result = await insertSeed(seed);
      if (result) {
        console.log(`✓ Added seed: ${seed.name}`);
        successCount++;
      } else {
        console.error(`✗ Failed to add seed: ${seed.name}`);
        errorCount++;
      }
    } catch (error) {
      console.error(`✗ Error adding seed ${seed.name}:`, error);
      errorCount++;
    }
  }

  console.log(`\n✓ Successfully added ${successCount} seeds`);
  if (errorCount > 0) {
    console.log(`✗ Failed to add ${errorCount} seeds`);
  }
}

addTestSeeds().catch(console.error);
