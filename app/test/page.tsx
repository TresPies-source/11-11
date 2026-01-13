'use client';

import { useEffect, useState } from 'react';

export default function TestPage() {
  const [results, setResults] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const runTests = async () => {
    setRunning(true);
    setResults(['Starting tests...']);

    try {
      // Import and run cost-tracking tests
      setResults(prev => [...prev, '\n=== Running Cost Tracking Tests ===']);
      
      const { runCostTrackingTests } = await import('../../__tests__/agents/cost-tracking-browser');
      const costResults = await runCostTrackingTests();
      setResults(prev => [...prev, ...costResults]);

      // Import and run handoff tests
      setResults(prev => [...prev, '\n=== Running Handoff Tests ===']);
      
      const { runHandoffTests } = await import('../../__tests__/agents/handoff-browser');
      const handoffResults = await runHandoffTests();
      setResults(prev => [...prev, ...handoffResults]);

      setResults(prev => [...prev, '\n✅ All browser tests complete!']);
    } catch (error) {
      setResults(prev => [...prev, `\n❌ Error: ${error}`]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#1e1e1e', color: '#d4d4d4', minHeight: '100vh' }}>
      <h1 style={{ color: '#4ec9b0' }}>Supervisor Router - Browser Tests</h1>
      
      <button
        onClick={runTests}
        disabled={running}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: running ? '#555' : '#0e639c',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: running ? 'not-allowed' : 'pointer',
          marginBottom: '20px',
        }}
      >
        {running ? 'Running Tests...' : 'Run Database Tests'}
      </button>

      <div style={{ 
        backgroundColor: '#252526', 
        padding: '15px', 
        borderRadius: '4px',
        maxHeight: '80vh',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        fontFamily: 'Consolas, monospace',
        fontSize: '14px',
        lineHeight: '1.6',
      }}>
        {results.map((line, i) => (
          <div key={i} style={{ 
            color: line.includes('✓') ? '#4ec9b0' : 
                   line.includes('✗') || line.includes('❌') ? '#f48771' : 
                   line.includes('===') ? '#dcdcaa' : '#d4d4d4'
          }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
