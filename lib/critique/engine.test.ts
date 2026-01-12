import { critiquePromptSync } from './engine';

const testPrompt2000Chars = `Create a comprehensive web application that handles user authentication, data management, and reporting. The system should be scalable and efficient, with good performance and nice user experience. Build various features including user registration, login, password reset, profile management, and role-based access control. Also implement data entry forms, validation, and storage. Additionally, create reporting dashboards with charts and graphs showing key metrics. Make sure everything works well together and looks good. The application should handle errors gracefully and provide helpful feedback to users. Implement security best practices and ensure data privacy. Add comprehensive testing including unit tests, integration tests, and end-to-end tests. Document the code properly and create user guides. Deploy the application to production with proper monitoring and logging. Set up CI/CD pipelines for automated testing and deployment. Configure database backups and disaster recovery procedures. Optimize performance for high traffic scenarios. Implement caching strategies and load balancing. Add analytics tracking to monitor user behavior and system performance. Create admin tools for managing users and system configuration. Build email notification system for important events. Add support for multiple languages and localization. Implement real-time features using WebSockets. Create mobile-responsive designs that work on all devices. Add accessibility features to support users with disabilities. Implement rate limiting and API throttling. Create comprehensive API documentation. Build integration tests for third-party services. Add logging and error tracking systems. Implement feature flags for gradual rollouts. Create automated backup and restore procedures. Build monitoring dashboards for system health. Add support for multiple database types. Implement data migration scripts. Create performance benchmarking tools. Build automated testing frameworks. Add support for offline functionality. Implement progressive web app features. Create comprehensive security audit procedures. Build user feedback collection system. Add A/B testing capabilities. Implement automated deployment scripts. Create rollback procedures for failed deployments. Build comprehensive logging and monitoring. Add support for microservices architecture. Implement service mesh for communication. Create automated scaling policies. Build disaster recovery procedures. Add compliance and regulatory features. Implement data retention policies. Create automated reporting systems. Build integration with external services. Add support for webhooks and callbacks. Implement queue-based job processing. Create automated cleanup and maintenance tasks. Build comprehensive documentation system.`;

function runTests() {
  console.log('Running critique engine tests...\n');

  console.log('Test 1: Performance - 2000 character prompt');
  const result2000 = critiquePromptSync(testPrompt2000Chars);
  console.log(`  Execution time: ${result2000.executionTime.toFixed(2)}ms`);
  console.log(`  Status: ${result2000.executionTime < 1000 ? '✓ PASS' : '✗ FAIL'} (should be < 1000ms)`);
  console.log();

  console.log('Test 2: Score calculation - total equals sum');
  const expectedTotal =
    result2000.concisenessScore +
    result2000.specificityScore +
    result2000.contextScore +
    result2000.taskDecompositionScore;
  console.log(`  Total score: ${result2000.score}`);
  console.log(`  Sum of dimensions: ${expectedTotal}`);
  console.log(`  Conciseness: ${result2000.concisenessScore}`);
  console.log(`  Specificity: ${result2000.specificityScore}`);
  console.log(`  Context: ${result2000.contextScore}`);
  console.log(`  Task Decomposition: ${result2000.taskDecompositionScore}`);
  console.log(`  Status: ${result2000.score === expectedTotal ? '✓ PASS' : '✗ FAIL'}`);
  console.log();

  console.log('Test 3: All dimensions evaluated');
  const allDimensionsEvaluated =
    result2000.feedback.conciseness &&
    result2000.feedback.specificity &&
    result2000.feedback.context &&
    result2000.feedback.taskDecomposition;
  console.log(`  Status: ${allDimensionsEvaluated ? '✓ PASS' : '✗ FAIL'}`);
  console.log();

  console.log('Test 4: Deterministic results');
  const result2 = critiquePromptSync(testPrompt2000Chars);
  const isDeterministic =
    result2000.score === result2.score &&
    result2000.concisenessScore === result2.concisenessScore &&
    result2000.specificityScore === result2.specificityScore &&
    result2000.contextScore === result2.contextScore &&
    result2000.taskDecompositionScore === result2.taskDecompositionScore;
  console.log(`  Status: ${isDeterministic ? '✓ PASS' : '✗ FAIL'}`);
  console.log();

  console.log('Test 5: Empty input handling');
  const emptyResult = critiquePromptSync('');
  console.log(`  Score: ${emptyResult.score}`);
  console.log(`  Execution time: ${emptyResult.executionTime.toFixed(2)}ms`);
  console.log(`  Status: ${emptyResult.executionTime < 100 ? '✓ PASS' : '✗ FAIL'} (should be very fast)`);
  console.log();

  console.log('Test 6: Short prompt performance');
  const shortPrompt = 'Create a simple login form with email and password fields.';
  const shortResult = critiquePromptSync(shortPrompt);
  console.log(`  Execution time: ${shortResult.executionTime.toFixed(2)}ms`);
  console.log(`  Status: ${shortResult.executionTime < 100 ? '✓ PASS' : '✗ FAIL'} (should be < 100ms)`);
  console.log();

  console.log('Test 7: Feedback structure');
  const hasFeedback =
    Array.isArray(result2000.feedback.conciseness.issues) &&
    Array.isArray(result2000.feedback.conciseness.suggestions) &&
    Array.isArray(result2000.feedback.specificity.issues) &&
    Array.isArray(result2000.feedback.specificity.suggestions) &&
    Array.isArray(result2000.feedback.context.issues) &&
    Array.isArray(result2000.feedback.context.suggestions) &&
    Array.isArray(result2000.feedback.taskDecomposition.issues) &&
    Array.isArray(result2000.feedback.taskDecomposition.suggestions);
  console.log(`  Status: ${hasFeedback ? '✓ PASS' : '✗ FAIL'}`);
  console.log();

  console.log('Sample feedback from 2000-char test:');
  console.log('\nConciseness:');
  console.log(`  Issues: ${result2000.feedback.conciseness.issues.slice(0, 2).join('; ')}`);
  console.log(`  Suggestions: ${result2000.feedback.conciseness.suggestions.slice(0, 2).join('; ')}`);
  console.log('\nSpecificity:');
  console.log(`  Issues: ${result2000.feedback.specificity.issues.slice(0, 2).join('; ')}`);
  console.log(`  Suggestions: ${result2000.feedback.specificity.suggestions.slice(0, 2).join('; ')}`);
  console.log('\nTask Decomposition:');
  console.log(`  Issues: ${result2000.feedback.taskDecomposition.issues.slice(0, 2).join('; ')}`);
  console.log(`  Suggestions: ${result2000.feedback.taskDecomposition.suggestions.slice(0, 2).join('; ')}`);

  console.log('\n✅ All tests completed!');
}

runTests();
