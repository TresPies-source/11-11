'use client';

import { useState, useCallback } from 'react';

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface UseProjectsReturn {
  projects: Project[];
  addProject: (name: string, description: string) => void;
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => void;
  deleteProject: (id: string) => void;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);

  const addProject = useCallback((name: string, description: string) => {
    const newProject: Project = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => [newProject, ...prev]);
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id
          ? { ...project, ...updates, updatedAt: new Date().toISOString() }
          : project
      )
    );
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id));
  }, []);

  return {
    projects,
    addProject,
    updateProject,
    deleteProject,
  };
}
