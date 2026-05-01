/**
 * DACH Panel - Market expansion strategy
 * Extracted from App.tsx
 */

import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '../lib/TranslationContext';
import { DACH_PHASES } from '../constants';
import { SEOItem } from '../components/SharedComponents';

export function DACHPanel() {
  const { lang, t } = useTranslation();
  return (
    <div className="w-full space-y-8 sm:space-y-10 lg:space-y-12 pb-20">
      <header>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-4 font-mono">MARKET_EXPANSION</div>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold mb-4 leading-tight">{t('dach')}</h2>
        <p className="text-xs sm:text-sm text-ink-muted max-w-xl font-medium">Strategic positioning within Germany, Austria, and Switzerland (DACH) ecosystem.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {DACH_PHASES.map((phase, i) => (
          <div key={i} className="bg-card border border-brd p-5 sm:p-6 lg:p-8 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent/20 group-hover:bg-accent transition-colors"></div>
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <div className="text-[9px] sm:text-[10px] font-bold text-accent uppercase tracking-[0.2em] font-mono">{phase.date[lang]}</div>
              <h3 className="font-display text-lg sm:text-xl lg:text-2xl font-bold mt-1 sm:mt-2 tracking-tight">{phase.title[lang]}</h3>
            </div>
            <ul className="space-y-2 sm:space-y-3 lg:space-y-4 mb-4 sm:mb-5 lg:mb-6">
              {phase.items[lang].map((item, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-ink/70 flex gap-2 sm:gap-3 font-medium leading-relaxed">
                  <span className="text-accent shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-3 sm:pt-4 border-t border-brd/50 font-mono text-[8px] sm:text-[9px] font-bold text-accent uppercase tracking-widest">
              {phase.metric[lang]}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-card border border-brd p-6 sm:p-8 lg:p-10 rounded-2xl shadow-custom">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted mb-6 sm:mb-8 lg:mb-10 font-mono">Instagram SEO (DE)</h4>
          <div className="space-y-2 sm:space-y-3">
            <SEOItem kw="Nicola | Coach Persönliche Entwicklung" loc="FIELD NAME" />
            <SEOItem kw="systemisches coaching" loc="BIO / CAPTION" />
            <SEOItem kw="innere Freiheit finden" loc="SEO CAPTION" />
          </div>
        </div>
        <div className="bg-accent text-white p-6 sm:p-8 lg:p-10 rounded-2xl flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-10 group-hover:rotate-12 transition-transform">
            <Globe size={160} />
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-display font-bold italic leading-tight mb-4 sm:mb-6 lg:mb-8 relative z-10 font-medium">"The only German coach in South America offering holistic coaching for DACH executives."</p>
          <div className="pt-4 sm:pt-6 lg:pt-8 border-t border-white/20 relative z-10">
            <div className="flex justify-between items-end">
              <div>
                <span className="block text-2xl sm:text-3xl lg:text-4xl font-display font-bold leading-none mb-1 sm:mb-2">100M+</span>
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest opacity-60 font-mono">DACH_SPEAKERS</span>
              </div>
              <div className="text-right">
                <span className="block text-2xl sm:text-3xl lg:text-4xl font-display font-bold leading-none mb-1 sm:mb-2">0</span>
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest opacity-60 font-mono">COMPETITION</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}