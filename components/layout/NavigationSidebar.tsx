"use client";

import { NavItem } from "./NavItem";

interface ProjectItem {
  id: string;
  name: string;
}

interface RecentItem {
  id: string;
  name: string;
  type: string;
}

const mockProjects: ProjectItem[] = [
  { id: '1', name: 'Q1 Roadmap' },
  { id: '2', name: 'Blog Posts' },
  { id: '3', name: 'Marketing Campaign' },
];

const mockRecentItems: RecentItem[] = [
  { id: '1', name: 'Product Roadmap Prompt', type: 'prompt' },
  { id: '2', name: 'Email Template', type: 'template' },
  { id: '3', name: 'API Documentation', type: 'doc' },
];

export function NavigationSidebar() {
  return (
    <aside className="w-[240px] h-screen bg-bg-secondary border-r border-bg-tertiary p-6 flex flex-col justify-between">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🌳</span>
          <span className="font-semibold text-lg text-text-primary">Dojo Genesis</span>
        </div>
        
        <div className="text-sm text-text-secondary mb-6">
          user@example.com
        </div>
        
        <div className="h-px bg-bg-tertiary mb-6" />
        
        <nav className="flex flex-col gap-1">
          <NavItem href="/" icon="🏠" label="Dashboard" />
          <NavItem href="/workbench" icon="💼" label="Workbench" />
          <NavItem href="/librarian" icon="📚" label="Librarian" />
          <NavItem href="/seeds" icon="🌱" label="Seeds" />
        </nav>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-3">
            Projects
          </h3>
          <div className="flex flex-col gap-1">
            {mockProjects.map((project) => (
              <div
                key={project.id}
                className="text-sm text-text-secondary pl-2 py-1.5 truncate hover:text-text-primary cursor-pointer transition-colors duration-fast"
              >
                {project.name}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-3">
            Recent
          </h3>
          <div className="flex flex-col gap-1">
            {mockRecentItems.map((item) => (
              <div
                key={item.id}
                className="text-sm text-text-secondary pl-2 py-1.5 truncate hover:text-text-primary cursor-pointer transition-colors duration-fast"
              >
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
