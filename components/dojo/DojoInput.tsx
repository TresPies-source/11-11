"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus, X } from 'lucide-react';
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

export function DojoInput({ onSubmit, isLoading = false, disabled = false }: DojoInputProps) {
  const [situation, setSituation] = useState('');
  const [perspectives, setPerspectives] = useState<string[]>(['']);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border-t border-bg-tertiary">
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
          onChange={(e) => setSituation(e.target.value)}
          placeholder="Describe the situation you're facing..."
          rows={4}
          disabled={isLoading || disabled}
          className="w-full px-3 py-2 bg-bg-tertiary border border-bg-elevated rounded-lg focus:outline-none focus:ring-2 focus:border-text-accent focus:ring-text-accent transition-colors text-text-primary placeholder:text-text-muted resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          required
        />
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
            className="flex items-center gap-1 text-xs text-text-accent hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="p-2 text-text-tertiary hover:text-error transition-colors rounded-lg hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
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
