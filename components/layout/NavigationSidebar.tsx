"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { NavItem } from "./NavItem";
import { cn } from "@/lib/utils";

interface ProjectItem {
  id: string;
  name: string;
}

interface RecentItem {
  id: string;
  name: string;
  type: string;
}

interface NavigationSidebarProps {
  isMobileOpen?: boolean;
  onMobileToggle?: (open: boolean) => void;
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

export function NavigationSidebar({ isMobileOpen = false, onMobileToggle }: NavigationSidebarProps = {}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  return (
    <>
      {/* Mobile hamburger button */}
      {onMobileToggle && (
        <button
          onClick={() => onMobileToggle(!isMobileOpen)}
          className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-bg-secondary border border-bg-tertiary text-text-primary hover:bg-bg-tertiary transition-colors"
          aria-label={isMobileOpen ? "Close navigation" : "Open navigation"}
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      )}
      
      <aside className={cn(
        "h-screen bg-bg-secondary border-r border-bg-tertiary p-4 sm:p-6 flex flex-col justify-between transition-all duration-300",
        isCollapsed ? 'w-[80px]' : 'w-[240px]',
        // Mobile styles
        onMobileToggle && "fixed top-0 left-0 z-40 lg:relative",
        onMobileToggle && !isMobileOpen && "-translate-x-full lg:translate-x-0"
      )}>
      <div className="flex flex-col">
        <div className={`flex items-center mb-2 ${isCollapsed ? 'justify-center' : 'gap-2'}`}>
          {!isCollapsed && <span className="text-2xl">🌳</span>}
          {!isCollapsed && <span className="font-semibold text-lg text-text-primary">Dojo Genesis</span>}
          {isCollapsed && <span className="text-2xl">🌳</span>}
        </div>
        
        {!isCollapsed && (
          <div className="text-sm text-text-secondary mb-6">
            user@example.com
          </div>
        )}
        
        <div className="h-px bg-bg-tertiary mb-6" />

        <button
          onClick={toggleCollapse}
          className="mb-4 p-2 rounded-md hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
        
        <nav className="flex flex-col gap-1">
          <NavItem 
            href="/dashboard" 
            icon="🏠" 
            label="Dashboard" 
            isCollapsed={isCollapsed}
            onClick={() => onMobileToggle?.(false)}
          />
          <NavItem 
            href="/workbench" 
            icon="💼" 
            label="Workbench" 
            isCollapsed={isCollapsed}
            onClick={() => onMobileToggle?.(false)}
          />
          <NavItem 
            href="/hub" 
            icon="🌐" 
            label="Hub" 
            isCollapsed={isCollapsed}
            onClick={() => onMobileToggle?.(false)}
          />
        </nav>
      </div>

      {!isCollapsed && (
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
      )}
    </aside>
    </>
  );
}
