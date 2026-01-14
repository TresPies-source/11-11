import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusDot } from '@/components/ui/StatusDot';

interface Agent {
  id: string;
  name: string;
  icon: string;
  status: 'idle' | 'working' | 'error' | 'success';
}

interface ActivityItem {
  id: string;
  description: string;
  timestamp: string;
}

const agents: Agent[] = [
  { id: 'supervisor', name: 'Supervisor', icon: '🎯', status: 'idle' },
  { id: 'dojo', name: 'Dojo', icon: '🧠', status: 'idle' },
  { id: 'librarian', name: 'Librarian', icon: '📚', status: 'idle' },
  { id: 'debugger', name: 'Debugger', icon: '🔍', status: 'idle' },
];

const recentActivity: ActivityItem[] = [
  { id: '1', description: 'Dojo Session: "React performance"', timestamp: '2h ago' },
  { id: '2', description: 'Prompt Saved: "Roadmap Planning"', timestamp: '5h ago' },
  { id: '3', description: 'Librarian Search: "product roadmap"', timestamp: '1d ago' },
];

export default function Dashboard() {
  return (
    <section className="p-12">
      <div className="flex flex-col gap-8">
        <h1 className="text-4xl font-bold text-text-primary mb-8">Dashboard</h1>

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

        <Card>
          <h2 className="text-2xl font-semibold mb-6">Recent Activity</h2>
          <div className="flex flex-col gap-3">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                <span className="text-text-secondary">•</span>
                <div className="flex-1">
                  <span className="text-sm text-text-secondary">{item.description}</span>
                  <span className="text-sm text-text-tertiary ml-2">({item.timestamp})</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
