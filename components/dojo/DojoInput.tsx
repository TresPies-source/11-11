"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus, X, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DojoInputData {
  situation: string;
  perspectives: string[];
}

interface DojoInputProps {
  onSubmit: (data: DojoInputData) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

interface QuickStartTemplate {
  id: string;
  label: string;
  emoji: string;
  situation: string;
  perspectives: string[];
}

const QUICK_START_TEMPLATES: QuickStartTemplate[] = [
  {
    id: 'career',
    label: 'Career Decision',
    emoji: '💼',
    situation: 'I need to decide whether to accept a new job offer at a different company or stay in my current role.',
    perspectives: [
      'What matters to me in my career growth',
      'What my family thinks about the change',
      'Long-term financial impact',
      'Work-life balance considerations'
    ]
  },
  {
    id: 'project',
    label: 'Project Planning',
    emoji: '📋',
    situation: 'I\'m starting a new project and need to figure out the best approach to tackle it.',
    perspectives: [
      'Available resources and constraints',
      'Team capabilities and bandwidth',
      'Stakeholder expectations',
      'Risk factors to consider'
    ]
  },
  {
    id: 'problem',
    label: 'Problem Solving',
    emoji: '🔍',
    situation: 'I\'m facing a recurring problem that I haven\'t been able to solve effectively.',
    perspectives: [
      'Root causes of the problem',
      'Previous attempts and why they failed',
      'Different stakeholders\' viewpoints',
      'Potential unintended consequences'
    ]
  },
  {
    id: 'reflection',
    label: 'Personal Reflection',
    emoji: '🤔',
    situation: 'I want to reflect on a recent experience and understand what I can learn from it.',
    perspectives: [
      'What went well and why',
      'What could have been better',
      'My emotional response',
      'How this relates to my values'
    ]
  },
  {
    id: 'decision',
    label: 'Important Decision',
    emoji: '⚖️',
    situation: 'I need to make an important decision that will impact multiple areas of my life.',
    perspectives: [
      'Short-term vs long-term implications',
      'People who will be affected',
      'My intuition and gut feeling',
      'Alignment with my goals'
    ]
  }
];

const MAX_SITUATION_LENGTH = 2000;

export function DojoInput({ onSubmit, isLoading = false, disabled = false }: DojoInputProps) {
  const [situation, setSituation] = useState('');
  const [perspectives, setPerspectives] = useState<string[]>(['']);
  const [showTips, setShowTips] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleAddPerspective = () => {
    setPerspectives([...perspectives, '']);
  };

  const handleRemovePerspective = (index: number) => {
    if (perspectives.length > 1) {
      setPerspectives(perspectives.filter((_, i) => i !== index));
    }
  };

  const handlePerspectiveChange = (index: number, value: string) => {
    const newPerspectives = [...perspectives];
    newPerspectives[index] = value;
    setPerspectives(newPerspectives);
  };

  const handleTemplateSelect = (template: QuickStartTemplate) => {
    setSituation(template.situation);
    setPerspectives(template.perspectives);
    setShowTemplates(false);
  };

  const handleSituationChange = (value: string) => {
    if (value.length <= MAX_SITUATION_LENGTH) {
      setSituation(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!situation.trim()) {
      return;
    }

    const filteredPerspectives = perspectives.filter(p => p.trim() !== '');
    
    onSubmit({
      situation: situation.trim(),
      perspectives: filteredPerspectives,
    });

    setSituation('');
    setPerspectives(['']);
  };

  const isSubmitDisabled = !situation.trim() || isLoading || disabled;
  const characterCount = situation.length;
  const isNearLimit = characterCount >= MAX_SITUATION_LENGTH * 0.9;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border-t border-bg-tertiary">
      {/* Quick Start Templates Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          disabled={isLoading || disabled}
          className="flex items-center gap-2 px-3 py-2 text-sm text-text-accent hover:text-text-primary bg-bg-tertiary hover:bg-bg-elevated rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Lightbulb className="w-4 h-4" />
          Use Template
          {showTemplates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {showTemplates && (
          <div className="absolute top-full mt-2 left-0 right-0 z-10 bg-bg-elevated border border-bg-tertiary rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {QUICK_START_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateSelect(template)}
                disabled={isLoading || disabled}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-tertiary transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed border-b border-bg-tertiary last:border-b-0"
              >
                <span className="text-2xl">{template.emoji}</span>
                <div>
                  <div className="text-sm font-medium text-text-primary">{template.label}</div>
                  <div className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{template.situation}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tips & Examples Section */}
      <div className="border border-bg-elevated rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTips(!showTips)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-bg-tertiary hover:bg-bg-elevated transition-all duration-150 text-left"
        >
          <span className="text-sm font-medium text-text-secondary">Tips & Examples</span>
          {showTips ? <ChevronUp className="w-4 h-4 text-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-text-tertiary" />}
        </button>
        
        {showTips && (
          <div className="px-4 py-3 bg-bg-secondary space-y-2.5 text-sm text-text-secondary animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex gap-2">
              <span className="text-text-accent">•</span>
              <p><strong className="text-text-primary">Be specific about context:</strong> Include relevant details about timing, people involved, and constraints.</p>
            </div>
            <div className="flex gap-2">
              <span className="text-text-accent">•</span>
              <p><strong className="text-text-primary">Include multiple perspectives:</strong> Consider different stakeholders, timeframes, and viewpoints to get a more complete picture.</p>
            </div>
            <div className="flex gap-2">
              <span className="text-text-accent">•</span>
              <p><strong className="text-text-primary">Focus on what matters:</strong> Describe what&apos;s at stake and why this situation is important to you.</p>
            </div>
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="situation-input"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          Situation <span className="text-error">*</span>
        </label>
        <textarea
          id="situation-input"
          value={situation}
          onChange={(e) => handleSituationChange(e.target.value)}
          placeholder="Describe the situation you're facing..."
          rows={4}
          disabled={isLoading || disabled}
          className="w-full px-3 py-2 bg-bg-tertiary border border-bg-elevated rounded-lg focus:outline-none focus:ring-2 focus:border-text-accent focus:ring-text-accent transition-colors text-text-primary placeholder:text-text-muted resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          required
        />
        <div className={cn(
          "text-xs text-right mt-1 transition-colors",
          isNearLimit ? "text-warning" : "text-text-tertiary"
        )}>
          {characterCount} / {MAX_SITUATION_LENGTH} characters
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-text-secondary">
            Perspectives
          </label>
          <button
            type="button"
            onClick={handleAddPerspective}
            disabled={isLoading || disabled}
            className="flex items-center gap-1 text-xs text-text-accent hover:text-text-primary transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Perspective
          </button>
        </div>

        <div className="space-y-2">
          {perspectives.map((perspective, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={perspective}
                onChange={(e) => handlePerspectiveChange(index, e.target.value)}
                placeholder={`Perspective ${index + 1}`}
                disabled={isLoading || disabled}
                className="flex-1 px-3 py-2 bg-bg-tertiary border border-bg-elevated rounded-lg focus:outline-none focus:ring-2 focus:border-text-accent focus:ring-text-accent transition-colors text-text-primary placeholder:text-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {perspectives.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePerspective(index)}
                  disabled={isLoading || disabled}
                  className="p-2 text-text-tertiary hover:text-error transition-all duration-100 rounded-lg hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={`Remove perspective ${index + 1}`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          disabled={isSubmitDisabled}
        >
          Submit
        </Button>
      </div>
    </form>
  );
}
