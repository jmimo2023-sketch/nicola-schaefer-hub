/**
 * Materialization Panel - Automation roadmap
 * Extracted from App.tsx
 */

import React from 'react';
import { Zap, Check } from 'lucide-react';
import { useTranslation } from '../lib/TranslationContext';

export function MaterializationPanel() {
  const { lang, t } = useTranslation();

  const plan = {
    title: { es: "Plan de Materialización", de: "Materialisierungsplan" },
    automation: {
      title: { es: "Ecosistema de Automatización (Make.com)", de: "Automatisierungs-Ökosystem" },
      modules: [
        { name: 'ANALYTICS_SYNC', es: 'Captura automática de métricas de Meta Suite a base de datos externa.', de: 'Automatischer Metrik-Sync von Meta Suite.' },
        { name: 'CONTENT_ENGINE', es: 'IA que redacta borradores de 3-4 stories diarias basadas en el pilar del mes.', de: 'KI-gestützte Story-Drafts basierend auf der Monatssäule.' },
        { name: 'CALENDAR_PUSH', es: 'Envío automático de contenido aprobado a la cola de publicación.', de: 'Automatisches Push freigegebener Inhalte in die Queue.' }
      ]
    }
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 lg:space-y-10 pb-20">
      <header className="text-center md:text-left">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-3 sm:mb-4 font-mono">EXECUTION_LOG</div>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold mb-3 sm:mb-4 leading-tight">{plan.title[lang]}</h2>
        <p className="text-xs sm:text-sm text-ink-muted max-w-xl font-medium">Integration roadmap for Make.com automation and strategic content scaling.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        <div className="bg-card border border-brd p-6 sm:p-8 lg:p-10 rounded-2xl shadow-custom">
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 lg:mb-10">
            <div className="p-3 sm:p-4 bg-accent/10 text-accent rounded-xl sm:rounded-2xl">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="font-display text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">{plan.automation.title[lang]}</h3>
              <p className="text-[9px] sm:text-[10px] text-ink-muted font-mono uppercase tracking-widest">Connective_Node_Make</p>
            </div>
          </div>

          <div className="space-y-5 sm:space-y-6 lg:space-y-8">
            {plan.automation.modules.map((m, i) => (
              <div key={i} className="flex gap-4 sm:gap-5 lg:gap-6 items-start group">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-paper border border-brd flex items-center justify-center text-[10px] sm:text-[11px] font-bold font-mono group-hover:bg-accent group-hover:text-white transition-all shrink-0">
                  0{i + 1}
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-ink">{m.name}</h4>
                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed font-medium">{m[lang]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="bg-paper border border-brd p-6 sm:p-8 lg:p-10 rounded-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-4 sm:space-y-6">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent font-mono opacity-60">NEXT_OPERATIONAL</div>
              <ul className="space-y-3 sm:space-y-4">
                <li className="flex gap-3 sm:gap-4 items-center text-xs sm:text-sm font-semibold">
                  <Check className="text-green-custom shrink-0" size={16} />
                  <span>Bio 100% DE Optimization</span>
                </li>
                <li className="flex gap-3 sm:gap-4 items-center text-xs sm:text-sm font-semibold opacity-40">
                  <div className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] border-2 border-brd rounded-full"></div>
                  <span>Make.com Scenario ID: 4861600</span>
                </li>
                <li className="flex gap-3 sm:gap-4 items-center text-xs sm:text-sm font-semibold opacity-40">
                  <div className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] border-2 border-brd rounded-full"></div>
                  <span>Free Diagnostic Session Form Build</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-accent text-white p-6 sm:p-8 lg:p-10 rounded-2xl flex flex-col justify-center shadow-lg shadow-accent/20">
            <div className="text-xl sm:text-2xl lg:text-3xl font-display font-medium leading-tight italic mb-4 sm:mb-6 lg:mb-8">
              "Automation is not about replacing the human element, but scaling the frequency of authentic connection."
            </div>
            <div className="mt-4 sm:mt-6 lg:mt-8 pt-4 sm:pt-6 lg:pt-8 border-t border-white/20 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-60 font-mono">
              STRATEGIC_2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}