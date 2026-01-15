"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { NewProjectModal } from '@/components/dashboard/NewProjectModal';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { AgentStatus } from '@/components/dashboard/AgentStatus';
import { useProjects } from '@/hooks/useProjects';

export default function Dashboard() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { projects, addProject } = useProjects();

  const handleCreateProject = (name: string, description: string) => {
    addProject(name, description);
  };

  return (
    <section className="p-4 sm:p-6 md:p-8 lg:p-12">
      <div className="flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary">Dashboard</h1>
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="bg-text-accent hover:bg-opacity-90 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </Button>
        </div>

        <Card glow={true}>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
            <Button variant="secondary" onClick={() => router.push('/dojo/new')}>
              <span>🧠</span>
              <span className="hidden sm:inline">New Dojo Session</span>
              <span className="sm:hidden">Dojo Session</span>
            </Button>
            <Button variant="secondary">
              <span>✍️</span>
              <span className="hidden sm:inline">Write Prompt</span>
              <span className="sm:hidden">Write</span>
            </Button>
            <Button variant="secondary">
              <span>📚</span>
              <span className="hidden sm:inline">Search Library</span>
              <span className="sm:hidden">Library</span>
            </Button>
            <Button variant="secondary">
              <span>🌱</span>
              <span className="hidden sm:inline">Plant Seed</span>
              <span className="sm:hidden">Seed</span>
            </Button>
          </div>
        </Card>

        <AgentStatus />

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
