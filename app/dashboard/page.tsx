"use client";

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusDot } from '@/components/ui/StatusDot';
import { NewProjectModal } from '@/components/dashboard/NewProjectModal';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { useProjects } from '@/hooks/useProjects';

interface Agent {
  id: string;
  name: string;
  icon: string;
  status: 'idle' | 'working' | 'error' | 'success';
}

const agents: Agent[] = [
  { id: 'supervisor', name: 'Supervisor', icon: '🎯', status: 'idle' },
  { id: 'dojo', name: 'Dojo', icon: '🧠', status: 'idle' },
  { id: 'librarian', name: 'Librarian', icon: '📚', status: 'idle' },
  { id: 'debugger', name: 'Debugger', icon: '🔍', status: 'idle' },
];

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { projects, addProject } = useProjects();

  const handleCreateProject = (name: string, description: string) => {
    addProject(name, description);
  };

  return (
    <section className="p-12">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-text-primary">Dashboard</h1>
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="bg-text-accent hover:bg-opacity-90"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </Button>
        </div>

        <Card glow={true}>
          <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary">
              <span>🧠</span>
              <span>New Dojo Session</span>
            </Button>
            <Button variant="secondary">
              <span>✍️</span>
              <span>Write Prompt</span>
            </Button>
            <Button variant="secondary">
              <span>📚</span>
              <span>Search Library</span>
            </Button>
            <Button variant="secondary">
              <span>🌱</span>
              <span>Plant Seed</span>
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold mb-6">Agent Status</h2>
          <div className="flex flex-col gap-4">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-3">
                <span className="text-2xl">{agent.icon}</span>
                <span className="text-base font-medium text-white flex-1">{agent.name}</span>
                <StatusDot status={agent.status} size="md" />
              </div>
            ))}
          </div>
        </Card>

        <RecentActivityFeed />
      </div>

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </section>
  );
}
