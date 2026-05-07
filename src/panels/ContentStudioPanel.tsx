/**
 * Content Studio Panel - Consolidated content creation module
 * Merges: GeneratorPanel + AIStudioPanel + ScriptsPanel + StoriesPanel
 * 
 * This is the main content creation hub with AI-powered generation.
 */

import React, { useState } from 'react';
import { Sparkles, PenTool, BookOpen, Film, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { GeneratorPanel } from './GeneratorPanel';
import { AIStudioPanel } from './AIStudioPanel';
import { ScriptsPanel } from './ScriptsPanel';
import { StoriesPanel } from './StoriesPanel';

type ContentTab = 'generate' | 'ai-studio' | 'scripts' | 'stories';

const CONTENT_TABS: { id: ContentTab; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'generate', label: 'AI Generator', icon: <PenTool size={16} />, badge: 'AI' },
  { id: 'ai-studio', label: 'AI Studio', icon: <Sparkles size={16} />, badge: 'NEW' },
  { id: 'scripts', label: 'Scripts', icon: <BookOpen size={16} /> },
  { id: 'stories', label: 'Stories', icon: <Film size={16} /> },
];

export function ContentStudioPanel() {
  const [activeTab, setActiveTab] = useState<ContentTab>('generate');

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-2 font-mono">
            CONTENT_STUDIO
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold">Create with AI</h2>
          <p className="text-sm text-ink-muted mt-1">
            Generate captions, scripts, stories and content with AI-powered tools
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CONTENT_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "bg-card border border-brd text-ink-muted hover:text-ink hover:bg-paper"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={cn(
                "text-[8px] font-bold px-1.5 py-0.5 rounded-full",
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-accent/10 text-accent"
              )}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[60vh]">
        {activeTab === 'generate' && <GeneratorPanel onNavigate={() => {}} />}
        {activeTab === 'ai-studio' && <AIStudioPanel />}
        {activeTab === 'scripts' && <ScriptsPanel />}
        {activeTab === 'stories' && <StoriesPanel />}
      </div>
    </div>
  );
}