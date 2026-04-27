/**
 * Empty State Component
 * Reusable empty state with guidance
 */

import React from 'react';
import { cn } from '../lib/utils';
import { LucideIcon, Plus, Upload, Palette, Sparkles, Calendar, Image as ImageIcon, Video } from 'lucide-react';

interface EmptyStateProps {
  icon: 'media' | 'calendar' | 'posts' | 'analytics' | 'custom';
  title: string;
  description: string;
  action?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  tip?: string;
  className?: string;
}

const iconMap = {
  media: ImageIcon,
  calendar: Calendar,
  posts: Video,
  analytics: Sparkles,
  custom: Sparkles
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  tip,
  className
}: EmptyStateProps) {
  const IconComponent = iconMap[icon];

  return (
    <div className={cn(
      "bg-card border-2 border-dashed border-brd rounded-3xl p-12 text-center",
      className
    )}>
      <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <IconComponent size={36} className="text-accent" />
      </div>

      <h3 className="font-display text-2xl font-bold mb-3">{title}</h3>
      <p className="text-ink-muted max-w-md mx-auto mb-8">{description}</p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
          >
            {action.icon || <Plus size={18} />}
            {action.label}
          </button>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="inline-flex items-center gap-2 bg-paper border border-brd px-6 py-3 rounded-xl font-bold text-sm hover:bg-brd transition-colors"
          >
            {secondaryAction.icon || <Palette size={18} />}
            {secondaryAction.label}
          </button>
        )}
      </div>

      {tip && (
        <div className="mt-8 bg-accent/5 border border-accent/20 rounded-2xl p-4 inline-block">
          <p className="text-xs text-ink-muted">
            <span className="font-bold text-accent">Pro tip: </span>
            {tip}
          </p>
        </div>
      )}
    </div>
  );
}
