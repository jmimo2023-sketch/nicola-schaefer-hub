/**
 * Client Panel - Target demographics
 * Extracted from App.tsx
 */

import React from 'react';
import { useTranslation } from '../lib/TranslationContext';
import { CLIENTS } from '../constants';

export function ClientPanel() {
  const { lang, t } = useTranslation();
  return (
    <div className="w-full pb-20">
      <header className="mb-8 sm:mb-12">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-4 font-mono">TARGET_DEMOGRAPHICS</div>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold mb-4 leading-tight">{t('client')}</h2>
        <p className="text-sm text-ink-muted max-w-xl font-medium">Mapping high-value archetypes within the DACH executive market seeking holistic shifts.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {CLIENTS.map((client, i) => (
          <div key={i} className="bg-card border border-brd p-6 sm:p-8 lg:p-10 rounded-2xl hover:shadow-custom hover:-translate-y-2 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-accent/5 rounded-bl-full -mr-8 sm:-mr-12 -mt-8 sm:-mt-12 transition-all group-hover:scale-150"></div>
            <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-accent text-white flex items-center justify-center font-display text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 shadow-lg shadow-accent/20 group-hover:rotate-6 transition-transform">
              {client.initials}
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-bold mb-1 tracking-tight">{client.name[lang]}</h3>
            <p className="text-[9px] sm:text-[10px] text-accent font-bold uppercase tracking-[0.2em] mb-6 sm:mb-8 sm:mb-10 font-mono opacity-80">{client.role[lang].toUpperCase()}</p>
            <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 lg:pt-8 border-t border-brd">
              {client.details[lang].map(([key, val], idx) => (
                <div key={idx} className="space-y-1 sm:space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-2.5 sm:h-3 bg-accent rounded-full opacity-40"></div>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase text-ink-muted tracking-widest font-mono">{key}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-ink/80 leading-relaxed font-medium">{val}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}