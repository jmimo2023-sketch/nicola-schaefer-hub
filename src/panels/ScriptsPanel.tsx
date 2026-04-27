/**
 * Scripts Panel
 * Bilingual production scripts optimized for DACH market
 */

import React from 'react';
import { Video } from 'lucide-react';
import { useTranslation } from '../lib/TranslationContext';
import { cn } from '../lib/utils';

const SCRIPTS_DATA = [
  {
    pillar: 'P1',
    title: { es: 'Éxito vs Vacío', de: 'Erfolg vs. Leere' },
    es: 'Tienes todo lo que querías, pero el silencio de tu casa dice que algo falta...',
    de: 'Du hast alles, was du wolltest, aber die Stille in deinem Haus sagt dir, dass etwas fehlt...'
  },
  {
    pillar: 'P2',
    title: { es: 'Método Sistémico', de: 'Systemische Methode' },
    es: 'No es motivación, es entender los hilos invisibles que te mueven...',
    de: 'Keine Motivation, sondern das Verständnis der unsichtbaren Fäden que dich bewegen...'
  },
  {
    pillar: 'P4',
    title: { es: 'De Munich a Ecuador', de: 'Von München nach Ecuador' },
    es: 'Tomé la decisión más honesta de mi vida y asustó a todos...',
    de: 'Ich habe die ehrlichste Entscheidung meines Lebens getroffen und sie hat alle erschreckt...'
  },
  {
    pillar: 'P5',
    title: { es: 'Brechas Afectivas', de: 'Affektive Lücken' },
    es: '¿Por qué das tanto pero te cuesta tanto recibir?',
    de: 'Warum gibst du so viel, aber es fällt dir so schwer zu empfangen?'
  }
];

export function ScriptsPanel() {
  const { lang, t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <header className="mb-10">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-4 font-mono">CONTENT_PRODUCTION_LOG</div>
        <h2 className="font-display text-5xl font-semibold mb-4 leading-tight">{t('scripts')}</h2>
        <p className="text-sm text-ink-muted max-w-xl font-medium font-sans leading-relaxed">Bilingual production scripts optimized for the DACH market emotional frequency. Ready to film.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SCRIPTS_DATA.map((script, i) => (
          <div key={i} className="bg-card border border-brd p-10 rounded-custom hover:shadow-custom transition-all group overflow-hidden relative flex flex-col h-full">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-accent opacity-20 group-hover:opacity-100 transition-opacity"></div>
             <div className="flex justify-between items-start mb-8">
               <span className="text-[9px] font-bold bg-accent/20 text-accent px-3 py-1 rounded-full font-mono tracking-widest uppercase">{script.pillar}</span>
               <div className="flex items-center gap-2 text-ink-muted opacity-40 font-mono text-[9px] font-bold uppercase tracking-wider">
                 <Video size={12} />
                 <span>25S // 4K // 30FPS</span>
               </div>
             </div>
             <h3 className="font-display text-3xl mb-8 leading-tight font-bold tracking-tight text-ink">{script.title[lang]}</h3>
             <div className="flex-1 space-y-8 text-sm leading-relaxed text-ink/80 bg-paper/50 p-8 rounded-3xl border border-brd/50 font-medium">
               <div className="space-y-4">
                 <div className="text-[9px] font-bold uppercase text-accent font-mono tracking-[0.2em]">VOICEOVER // SCRIPT</div>
                 <p className="italic leading-relaxed">"{script[lang]}"</p>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4 mt-10">
               <button onClick={() => navigator.clipboard.writeText(script.es)} className="py-4 bg-paper border border-brd text-[10px] font-bold rounded-2xl hover:bg-brd uppercase tracking-[0.2em] transition-all active:scale-95 text-ink-muted hover:text-ink">Copy ES</button>
               <button onClick={() => navigator.clipboard.writeText(script.de)} className="py-4 bg-paper border border-brd text-[10px] font-bold rounded-2xl hover:bg-brd uppercase tracking-[0.2em] transition-all active:scale-95 text-ink-muted hover:text-ink">Copy DE</button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
