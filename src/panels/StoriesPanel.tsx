/**
 * Stories Panel
 * Bilingual captions optimized for emotional engagement
 */

import React from 'react';
import { Copy } from 'lucide-react';
import { useTranslation } from '../lib/TranslationContext';
import { cn } from '../lib/utils';
import { STORIES_DATA } from '../constants';

export function StoriesPanel() {
  const { lang, t } = useTranslation();
  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <header className="mb-10 text-center md:text-left">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-4 font-mono">STORY_DEPLOYMENT_LOG</div>
        <h2 className="font-display text-5xl font-semibold mb-4 leading-tight">{t('stories')}</h2>
        <p className="text-sm text-ink-muted max-w-xl font-medium leading-relaxed font-sans mx-auto md:mx-0">Bilingual captions optimized for emotional engagement. Perfect for sequences.</p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {STORIES_DATA.map((story, i) => (
          <div key={i} className="bg-card border border-brd p-10 rounded-custom hover:shadow-custom hover:scale-[1.02] transition-all group relative overflow-hidden flex flex-col h-full">
            <div className={cn("absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-[80px] transition-all group-hover:scale-150",
              i % 2 === 0 ? "bg-accent/10" : "bg-green-custom/10")} />
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-2">
                 <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]", i % 2 === 0 ? "text-accent bg-accent" : "text-green-custom bg-green-custom")} />
                 <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-ink/40 font-mono">AUTO_SEQ_{i+1}</span>
               </div>
            </div>
            <p className="flex-1 text-base leading-relaxed text-ink/90 italic mb-10 font-medium font-display">
              "{story[lang]}"
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigator.clipboard.writeText(story[lang])}
                className="p-4 bg-paper border border-brd rounded-2xl hover:bg-brd transition-all shrink-0 active:scale-90 text-ink shadow-sm"
              >
                <Copy size={20} />
              </button>
              <div className="flex-1 text-[9px] font-bold uppercase tracking-[0.2em] text-accent bg-accent/10 border border-accent/20 flex items-center justify-center p-4 rounded-2xl font-mono text-center">
                {story.hash}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
