/**
 * Design Editor Panel - Consolidated visual design module
 * Merges: DesignStudioPanel + ImageEditorPanel + BackgroundGenerator + ShamanicTemplateEngine
 * 
 * Full-featured design editor without needing Canva.
 */

import React, { useState } from 'react';
import { Palette, Square, Sparkles, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { DesignStudioPanel } from './DesignStudioPanel';
import { ImageEditorPanel } from './ImageEditorPanel';
import { BackgroundGenerator } from './BackgroundGenerator';
import { ShamanicTemplateEngine } from './ShamanicTemplateEngine';

type DesignTab = 'canvas' | 'editor' | 'backgrounds' | 'shamanic';

const DESIGN_TABS: { id: DesignTab; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'canvas', label: 'Canvas', icon: <Palette size={16} />, badge: 'NEW' },
  { id: 'editor', label: 'Image Editor', icon: <Square size={16} /> },
  { id: 'backgrounds', label: 'BG Generator', icon: <ImageIcon size={16} />, badge: 'AI' },
  { id: 'shamanic', label: 'Templates', icon: <Sparkles size={16} />, badge: '🔮' },
];

export function DesignEditorPanel() {
  const [activeTab, setActiveTab] = useState<DesignTab>('canvas');

  // Canvas and shamanic are fullscreen-like panels
  const isFullscreen = activeTab === 'canvas' || activeTab === 'shamanic';

  return (
    <div className={cn("w-full", isFullscreen ? "h-full" : "space-y-6")}>
      {/* Header - only show for non-fullscreen tabs */}
      {!isFullscreen && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-2 font-mono">
              DESIGN_EDITOR
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold">Design Studio</h2>
            <p className="text-sm text-ink-muted mt-1">
              Create stunning visuals without leaving the app
            </p>
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div className={cn("flex gap-2 overflow-x-auto pb-2 scrollbar-hide", isFullscreen && "px-2 pt-2")}>
        {DESIGN_TABS.map(tab => (
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
      <div className={cn("min-h-[60vh]", isFullscreen && "flex-1")}>
        {activeTab === 'canvas' && <DesignStudioPanel />}
        {activeTab === 'editor' && <ImageEditorPanel />}
        {activeTab === 'backgrounds' && <BackgroundGenerator />}
        {activeTab === 'shamanic' && <ShamanicTemplateEngine />}
      </div>
    </div>
  );
}