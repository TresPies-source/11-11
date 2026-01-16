'use client';

import { useEffect, useState } from 'react';
import {
  verifyKnowledgeLinks,
  verifySessionMessages,
  verifyRelationshipDistribution,
  type KnowledgeLinkRow,
  type SessionMessageRow,
  type RelationshipStats,
} from '@/lib/hub/verify-database';

export default function HubVerificationPage() {
  const [knowledgeLinks, setKnowledgeLinks] = useState<KnowledgeLinkRow[]>([]);
  const [sessionMessages, setSessionMessages] = useState<SessionMessageRow[]>([]);
  const [relationshipStats, setRelationshipStats] = useState<RelationshipStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [links, messages, stats] = await Promise.all([
          verifyKnowledgeLinks(),
          verifySessionMessages(),
          verifyRelationshipDistribution(),
        ]);
        setKnowledgeLinks(links);
        setSessionMessages(messages);
        setRelationshipStats(stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Database verification error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Knowledge Hub Database Verification</h1>
          <p className="text-gray-400">Loading database data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Knowledge Hub Database Verification</h1>
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <p className="text-red-400">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Knowledge Hub Database Verification</h1>
          <p className="text-gray-400">Verify data integrity for knowledge_links and session_messages tables</p>
        </div>

        {/* Knowledge Links Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Knowledge Links</h2>
            <span className="text-sm text-gray-400">{knowledgeLinks.length} recent links</span>
          </div>
          
          {knowledgeLinks.length === 0 ? (
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <p className="text-gray-400">No knowledge links found in database</p>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 border-b border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">Source</th>
                      <th className="px-4 py-3 text-left">Target</th>
                      <th className="px-4 py-3 text-left">Relationship</th>
                      <th className="px-4 py-3 text-left">User ID</th>
                      <th className="px-4 py-3 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {knowledgeLinks.map((link) => (
                      <tr key={link.id} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">
                          {link.id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="text-xs text-gray-400">{link.source_type}</div>
                            <div className="font-mono text-xs">{link.source_id.substring(0, 8)}...</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="text-xs text-gray-400">{link.target_type}</div>
                            <div className="font-mono text-xs">{link.target_id.substring(0, 8)}...</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs">
                            {link.relationship}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">
                          {link.user_id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(link.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Relationship Distribution Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Relationship Distribution</h2>
          
          {relationshipStats.length === 0 ? (
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <p className="text-gray-400">No relationship statistics available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relationshipStats.map((stat, idx) => (
                <div key={idx} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="text-lg font-semibold text-blue-400">{stat.count}</div>
                  <div className="text-sm text-gray-400 mt-1">{stat.relationship}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    {stat.source_type} → {stat.target_type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Session Messages Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Session Messages</h2>
            <span className="text-sm text-gray-400">{sessionMessages.length} recent messages</span>
          </div>
          
          {sessionMessages.length === 0 ? (
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <p className="text-gray-400">No session messages found in database</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessionMessages.map((message) => (
                <div key={message.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        message.role === 'user' 
                          ? 'bg-green-900/30 text-green-400' 
                          : 'bg-purple-900/30 text-purple-400'
                      }`}>
                        {message.role}
                      </span>
                      <span className="font-mono text-xs text-gray-500">
                        {message.session_id.substring(0, 8)}...
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-3">{message.content}</p>
                  {message.metadata && Object.keys(message.metadata).length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Metadata: {JSON.stringify(message.metadata)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Verification Summary */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Verification Summary</h2>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${knowledgeLinks.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span className="text-sm">
                Knowledge Links: {knowledgeLinks.length > 0 ? 'Created correctly' : 'No links yet'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${relationshipStats.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span className="text-sm">
                Relationship Types: {relationshipStats.length > 0 ? `${relationshipStats.length} types in use` : 'No relationships yet'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${sessionMessages.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span className="text-sm">
                Session Messages: {sessionMessages.length > 0 ? 'Persisting correctly' : 'No messages yet'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                knowledgeLinks.every(link => link.user_id) ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              <span className="text-sm">
                User IDs: {knowledgeLinks.every(link => link.user_id) ? 'All set properly' : 'Some missing'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                knowledgeLinks.every(link => link.created_at) && sessionMessages.every(msg => msg.timestamp)
                  ? 'bg-green-500' 
                  : 'bg-red-500'
              }`}></span>
              <span className="text-sm">
                Timestamps: {
                  knowledgeLinks.every(link => link.created_at) && sessionMessages.every(msg => msg.timestamp)
                    ? 'Accurate' 
                    : 'Issues detected'
                }
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
