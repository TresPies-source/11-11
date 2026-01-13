/**
 * Integration Tests: Full Routing Flow
 * Tests end-to-end routing from user query to agent selection
 */

import { describe, it, expect } from 'vitest';

describe('Integration: Full Routing Flow', () => {
  const BASE_URL = 'http://localhost:3000';

  describe('POST /api/supervisor/route', () => {
    it('should route search query to Librarian Agent', async () => {
      const response = await fetch(`${BASE_URL}/api/supervisor/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Find prompts about budgeting',
          session_id: 'test-session-1',
          conversation_context: [],
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data).toHaveProperty('agent_id');
      expect(data).toHaveProperty('agent_name');
      expect(data).toHaveProperty('confidence');
      expect(data).toHaveProperty('reasoning');
      expect(data).toHaveProperty('fallback');
      expect(data).toHaveProperty('routing_cost');

      // In dev mode, keyword-based routing should select Librarian
      expect(data.agent_id).toBe('librarian');
      expect(data.agent_name).toBe('Librarian Agent');
      expect(data.confidence).toBeGreaterThan(0);
      expect(data.routing_cost).toHaveProperty('tokens_used');
      expect(data.routing_cost).toHaveProperty('cost_usd');
    });

    it('should route thinking query to Dojo Agent', async () => {
      const response = await fetch(`${BASE_URL}/api/supervisor/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Help me explore perspectives on career planning',
          session_id: 'test-session-2',
          conversation_context: [],
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.agent_id).toBe('dojo');
      expect(data.agent_name).toBe('Dojo Agent');
    });

    it('should route conflict query to Debugger Agent', async () => {
      const response = await fetch(`${BASE_URL}/api/supervisor/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'I have conflicting perspectives on remote vs office work',
          session_id: 'test-session-3',
          conversation_context: [],
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.agent_id).toBe('debugger');
      expect(data.agent_name).toBe('Debugger Agent');
    });

    it('should handle conversation context', async () => {
      const response = await fetch(`${BASE_URL}/api/supervisor/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Show me similar prompts',
          session_id: 'test-session-4',
          conversation_context: [
            'User: I want to plan my budget',
            'Dojo: Let\'s explore perspectives on budgeting',
          ],
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.agent_id).toBe('librarian');
      expect(data.conversation_context_length).toBeGreaterThanOrEqual(0);
    });

    it('should reject empty query', async () => {
      const response = await fetch(`${BASE_URL}/api/supervisor/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: '',
          session_id: 'test-session-5',
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should reject missing session_id', async () => {
      const response = await fetch(`${BASE_URL}/api/supervisor/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Test query',
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should complete routing in <200ms (dev mode)', async () => {
      const start = Date.now();
      
      const response = await fetch(`${BASE_URL}/api/supervisor/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Find prompts about time management',
          session_id: 'test-session-perf',
          conversation_context: [],
        }),
      });

      const elapsed = Date.now() - start;

      expect(response.ok).toBe(true);
      // In dev mode, routing should be very fast (<50ms)
      // Allow 200ms to account for network overhead
      expect(elapsed).toBeLessThan(200);
    });
  });

  describe('GET /api/supervisor/agents', () => {
    it('should return all available agents', async () => {
      const response = await fetch(`${BASE_URL}/api/supervisor/agents`);

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(Array.isArray(data.agents)).toBe(true);
      expect(data.agents.length).toBe(3);

      const agentIds = data.agents.map((a: any) => a.id);
      expect(agentIds).toContain('dojo');
      expect(agentIds).toContain('librarian');
      expect(agentIds).toContain('debugger');

      // Verify agent structure
      data.agents.forEach((agent: any) => {
        expect(agent).toHaveProperty('id');
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('description');
        expect(agent).toHaveProperty('when_to_use');
        expect(agent).toHaveProperty('when_not_to_use');
        expect(agent).toHaveProperty('default');

        expect(Array.isArray(agent.when_to_use)).toBe(true);
        expect(Array.isArray(agent.when_not_to_use)).toBe(true);
      });
    });

    it('should mark Dojo as default agent', async () => {
      const response = await fetch(`${BASE_URL}/api/supervisor/agents`);
      const data = await response.json();

      const dojoAgent = data.agents.find((a: any) => a.id === 'dojo');
      expect(dojoAgent).toBeDefined();
      expect(dojoAgent.default).toBe(true);

      const otherAgents = data.agents.filter((a: any) => a.id !== 'dojo');
      otherAgents.forEach((agent: any) => {
        expect(agent.default).toBe(false);
      });
    });
  });

  describe('Routing Accuracy: 20 Diverse Queries', () => {
    const queries = [
      // Librarian queries (search/find)
      { query: 'Search for prompts about meditation', expected: 'librarian' },
      { query: 'Find similar prompts to my budget planning prompt', expected: 'librarian' },
      { query: 'Show me what I built before', expected: 'librarian' },
      { query: 'Discover prompts related to productivity', expected: 'librarian' },
      { query: 'Look up my previous work on AI agents', expected: 'librarian' },

      // Debugger queries (conflict/error)
      { query: 'I have conflicting perspectives on remote work', expected: 'debugger' },
      { query: 'What\'s wrong with my reasoning about exercise?', expected: 'debugger' },
      { query: 'My logic seems flawed, can you help?', expected: 'debugger' },
      { query: 'I\'m getting contradictory advice about diet', expected: 'debugger' },
      { query: 'Help me resolve this conflict in my thinking', expected: 'debugger' },

      // Dojo queries (thinking/exploration)
      { query: 'Help me explore perspectives on career planning', expected: 'dojo' },
      { query: 'I want to map routes for my startup idea', expected: 'dojo' },
      { query: 'Can you help me prune my ideas?', expected: 'dojo' },
      { query: 'What should be my next move on this project?', expected: 'dojo' },
      { query: 'Let\'s brainstorm some creative solutions', expected: 'dojo' },
      { query: 'I need help thinking through this decision', expected: 'dojo' },
      { query: 'Can we explore different angles on sustainability?', expected: 'dojo' },
      { query: 'Help me organize my thoughts about leadership', expected: 'dojo' },
      { query: 'What are the tradeoffs between these options?', expected: 'dojo' },
      { query: 'I want to generate a next move for my research', expected: 'dojo' },
    ];

    queries.forEach(({ query, expected }, index) => {
      it(`should route query ${index + 1}: "${query.substring(0, 50)}..." to ${expected}`, async () => {
        const response = await fetch(`${BASE_URL}/api/supervisor/route`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            session_id: `test-accuracy-${index}`,
            conversation_context: [],
          }),
        });

        expect(response.ok).toBe(true);
        const data = await response.json();

        expect(data.agent_id).toBe(expected);
      }, 10000); // Allow 10s timeout for potential API calls
    });
  });

  describe('Performance: Concurrent Requests', () => {
    it('should handle 10 concurrent routing requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        fetch(`${BASE_URL}/api/supervisor/route`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `Test query ${i}`,
            session_id: `test-concurrent-${i}`,
          }),
        })
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const elapsed = Date.now() - start;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });

      // Should complete in reasonable time (parallel execution)
      // Allow 500ms for 10 concurrent requests (50ms each * overhead)
      expect(elapsed).toBeLessThan(500);
    });
  });
});
