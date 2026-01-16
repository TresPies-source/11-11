'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPrompt } from '@/lib/pglite/prompts';
import { insertSeed } from '@/lib/pglite/seeds';
import { insertKnowledgeLink } from '@/lib/pglite/knowledge-links';
import { getLineage } from '@/lib/pglite/knowledge-links';
import type { PromptInsert } from '@/lib/pglite/types';
import type { SeedInsert } from '@/lib/seeds/types';

interface PerformanceResult {
  operation: string;
  duration: number;
  status: 'success' | 'error';
  error?: string;
}

export default function PerformanceTestPage() {
  const [results, setResults] = useState<PerformanceResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [modalTestDuration, setModalTestDuration] = useState<number | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const router = useRouter();

  const addResult = (result: PerformanceResult) => {
    setResults(prev => [...prev, result]);
  };

  const testPromptCreation = async () => {
    const start = performance.now();
    try {
      const promptData: PromptInsert = {
        user_id: 'dev@11-11.dev',
        title: `Performance Test Prompt ${Date.now()}`,
        content: 'This is a test prompt for performance testing.',
        status: 'draft',
        visibility: 'private',
      };

      await createPrompt(promptData);
      const duration = performance.now() - start;
      addResult({ operation: 'Create Prompt', duration, status: 'success' });
    } catch (error) {
      const duration = performance.now() - start;
      addResult({
        operation: 'Create Prompt',
        duration,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const testSeedCreation = async () => {
    const start = performance.now();
    try {
      const seedData: SeedInsert = {
        user_id: 'dev@11-11.dev',
        name: `Performance Test Seed ${Date.now()}`,
        content: 'This is a test seed for performance testing.',
        type: 'pattern',
        status: 'new',
        why_matters: 'Testing performance',
      };

      await insertSeed(seedData);
      const duration = performance.now() - start;
      addResult({ operation: 'Create Seed', duration, status: 'success' });
    } catch (error) {
      const duration = performance.now() - start;
      addResult({
        operation: 'Create Seed',
        duration,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const testKnowledgeLinkCreation = async () => {
    const start = performance.now();
    try {
      const prompt = await createPrompt({
        user_id: 'dev@11-11.dev',
        title: 'Test Prompt for Link',
        content: 'Test content',
        status: 'draft',
        visibility: 'private',
      });

      const seed = await insertSeed({
        user_id: 'dev@11-11.dev',
        name: 'Test Seed for Link',
        content: 'Test content',
        type: 'pattern',
        status: 'new',
      });

      await insertKnowledgeLink({
        source_type: 'prompt',
        source_id: prompt.id,
        target_type: 'seed',
        target_id: seed.id,
        relationship: 'extracted_from',
        user_id: 'dev@11-11.dev',
      });

      const duration = performance.now() - start;
      addResult({ operation: 'Create Knowledge Link (with 2 artifacts)', duration, status: 'success' });
    } catch (error) {
      const duration = performance.now() - start;
      addResult({
        operation: 'Create Knowledge Link',
        duration,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const testLineageRetrieval = async () => {
    const start = performance.now();
    try {
      const prompt = await createPrompt({
        user_id: 'dev@11-11.dev',
        title: 'Test Prompt for Lineage',
        content: 'Test content',
        status: 'draft',
        visibility: 'private',
      });

      await insertKnowledgeLink({
        source_type: 'prompt',
        source_id: prompt.id,
        target_type: 'session',
        target_id: crypto.randomUUID(),
        relationship: 'discussed_in',
        user_id: 'dev@11-11.dev',
      });

      await getLineage('prompt', prompt.id, 'dev@11-11.dev');
      
      const duration = performance.now() - start;
      addResult({ operation: 'Get Lineage (client-side)', duration, status: 'success' });
    } catch (error) {
      const duration = performance.now() - start;
      addResult({
        operation: 'Get Lineage',
        duration,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const testModalPerformance = () => {
    const start = performance.now();
    setShowTestModal(true);
    requestAnimationFrame(() => {
      const duration = performance.now() - start;
      setModalTestDuration(duration);
      setTimeout(() => setShowTestModal(false), 1000);
    });
  };

  const testNavigation = () => {
    const start = performance.now();
    addResult({ operation: 'Navigation Test (started)', duration: 0, status: 'success' });
    
    setTimeout(() => {
      router.push('/workbench');
      const duration = performance.now() - start;
      addResult({ operation: 'Navigation to Workbench', duration, status: 'success' });
    }, 100);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    await testPromptCreation();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await testSeedCreation();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await testKnowledgeLinkCreation();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await testLineageRetrieval();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    testModalPerformance();
    
    setIsRunning(false);
  };

  const getStatusColor = (status: 'success' | 'error') => {
    return status === 'success' ? 'text-green-600' : 'text-red-600';
  };

  const getDurationColor = (duration: number, threshold: number) => {
    if (duration < threshold) return 'text-green-600';
    if (duration < threshold * 1.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-2">Knowledge Hub Performance Tests</h1>
          <p className="text-white/70 mb-6">Testing response times for client-side database operations</p>
          
          <div className="flex gap-4 mb-8">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
            <button
              onClick={() => setResults([])}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear Results
            </button>
          </div>

          {modalTestDuration !== null && (
            <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-white">
                <span className="font-semibold">Modal Open Performance:</span>{' '}
                <span className={getDurationColor(modalTestDuration, 50)}>
                  {modalTestDuration.toFixed(2)}ms
                </span>
                {modalTestDuration < 50 && ' ✓ Excellent'}
                {modalTestDuration >= 50 && modalTestDuration < 100 && ' ⚠ Acceptable'}
                {modalTestDuration >= 100 && ' ✗ Slow'}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Test Results</h2>
            
            {results.length === 0 && !isRunning && (
              <p className="text-white/50 italic">No tests run yet. Click &quot;Run All Tests&quot; to begin.</p>
            )}

            {results.map((result, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-lg p-4"
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{result.operation}</span>
                  <div className="flex items-center gap-4">
                    <span className={getDurationColor(result.duration, result.operation.includes('Lineage') ? 500 : 200)}>
                      {result.duration.toFixed(2)}ms
                    </span>
                    <span className={`${getStatusColor(result.status)} font-semibold`}>
                      {result.status === 'success' ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
                {result.error && (
                  <p className="text-red-400 text-sm mt-2">Error: {result.error}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Performance Thresholds</h3>
            <ul className="text-white/80 text-sm space-y-1">
              <li>• Prompt/Seed Creation: &lt; 200ms = Good, &lt; 300ms = Acceptable</li>
              <li>• Knowledge Link Creation: &lt; 200ms = Good (includes 2 artifact creations)</li>
              <li>• Lineage Retrieval: &lt; 500ms = Good, &lt; 750ms = Acceptable</li>
              <li>• Modal Opening: &lt; 50ms = Good, &lt; 100ms = Acceptable</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <h3 className="text-white font-semibold mb-2">⚠️ Known Issue: Lineage API</h3>
            <p className="text-white/80 text-sm">
              The server-side Lineage API at <code className="bg-black/30 px-2 py-1 rounded">/api/hub/lineage/[type]/[id]</code> 
              {' '}cannot work because it tries to access PGlite from Node.js. PGlite only runs in the browser.
              This test uses the client-side <code className="bg-black/30 px-2 py-1 rounded">getLineage()</code> function instead.
            </p>
          </div>
        </div>
      </div>

      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md">
            <h3 className="text-xl font-semibold mb-4">Test Modal</h3>
            <p>This modal is used to test rendering performance.</p>
          </div>
        </div>
      )}
    </div>
  );
}
