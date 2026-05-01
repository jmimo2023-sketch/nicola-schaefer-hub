/**
 * Simulator Panel - Growth projections
 * Extracted from App.tsx
 */

import React, { useState, useMemo } from 'react';
import { TrendingUp, Zap } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { useTranslation } from '../lib/TranslationContext';
import { SliderControl, ScenarioButton } from '../components/SharedComponents';

export function SimulatorPanel() {
  const { lang, t } = useTranslation();
  const [reels, setReels] = useState(2);
  const [stories, setStories] = useState(5);
  const [collabs, setCollabs] = useState(1);
  const [targetDach, setTargetDach] = useState(40);

  const results = useMemo(() => {
    const baseReach = 1017;
    const baseER = 6.3;
    const reachMultiplier = 1 + (collabs * 0.2) + (reels * 0.1);
    const totalViews = Math.round(reels * 4 * 6 * baseReach * reachMultiplier);
    const convertedFollowers = Math.round(totalViews * (baseER / 100) * 0.08);
    const dachFollowers = Math.round(convertedFollowers * (targetDach / 100));
    const leads = Math.round(dachFollowers * 0.05);
    return { totalViews, convertedFollowers, dachFollowers, leads };
  }, [reels, stories, collabs, targetDach]);

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-20">
      <header className="mb-6 sm:mb-8 text-center md:text-left">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-3 sm:mb-4 font-mono">ENGINE_PROJECTION</div>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold mb-3 sm:mb-4 leading-tight tracking-tight">{t('simulator')}</h2>
        <p className="text-xs sm:text-sm text-ink-muted max-w-xl font-medium leading-relaxed mx-auto md:mx-0">Trajectory models based on 2026 account benchmarks and content frequency.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
        <div className="space-y-6 sm:space-y-8">
          <div className="bg-card border border-brd p-6 sm:p-8 lg:p-10 rounded-2xl shadow-custom relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-all">
              <TrendingUp size={80} className="text-accent" />
            </div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-6 sm:mb-8 lg:mb-10 font-mono flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
              CONTENT_INPUTS
            </h3>
            <div className="space-y-6 sm:space-y-8 relative z-10">
              <SliderControl label="REELS/WEEK" value={reels} min={1} max={7} onChange={setReels} />
              <SliderControl label="STORIES/DAY" value={stories} min={1} max={10} onChange={setStories} />
              <SliderControl label="COLLABS/MO" value={collabs} min={0} max={8} onChange={setCollabs} />
              <SliderControl label="% DACH" value={targetDach} min={0} max={100} suffix="%" onChange={setTargetDach} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <ScenarioButton label="CONSERV." onClick={() => { setReels(1); setStories(3); setCollabs(0); }} />
            <ScenarioButton label="BASE" active onClick={() => { setReels(2); setStories(5); setCollabs(1); }} />
            <ScenarioButton label="EXPONEN." onClick={() => { setReels(4); setStories(7); setCollabs(3); }} />
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="bg-accent text-white p-6 sm:p-8 lg:p-12 rounded-2xl shadow-xl shadow-accent/20 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-32 sm:w-40 lg:w-48 h-32 sm:h-40 lg:h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-6 sm:space-y-8 lg:space-y-10">
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 font-mono">Followers_6m</span>
                <div className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-none mt-2 sm:mt-4 tabular-nums">+{results.convertedFollowers}</div>
                <p className="text-xs mt-2 sm:mt-4 opacity-70 font-medium font-sans uppercase tracking-widest">Projected Growth</p>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-4 sm:gap-6 pt-4 sm:pt-6 lg:pt-8 border-t border-white/20">
                <div className="text-center space-y-1 sm:space-y-2">
                  <div className="text-lg sm:text-xl lg:text-2xl font-display font-bold">{results.totalViews.toLocaleString()}</div>
                  <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest opacity-60 font-mono">VIEWS</div>
                </div>
                <div className="text-center space-y-1 sm:space-y-2">
                  <div className="text-lg sm:text-xl lg:text-2xl font-display font-bold">+{results.dachFollowers}</div>
                  <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest opacity-60 font-mono">DACH</div>
                </div>
                <div className="text-center space-y-1 sm:space-y-2">
                  <div className="text-lg sm:text-xl lg:text-2xl font-display font-bold">{results.leads}</div>
                  <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest opacity-60 font-mono">BOOK</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-brd p-6 sm:p-8 lg:p-10 rounded-2xl">
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="p-2 sm:p-3 bg-green-light text-green-custom rounded-xl sm:rounded-2xl shadow-inner">
                <TrendingUp size={16} />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-ink font-mono opacity-60">Efficiency</h4>
            </div>
            <div className="h-[150px] sm:h-[180px] lg:h-[200px]">
              <ResponsiveContainer>
                <AreaChart data={[
                  { month: 'MAY', v: results.totalViews * 0.1 },
                  { month: 'JUN', v: results.totalViews * 0.25 },
                  { month: 'JUL', v: results.totalViews * 0.45 },
                  { month: 'AUG', v: results.totalViews * 0.65 },
                  { month: 'SEP', v: results.totalViews * 0.85 },
                  { month: 'OCT', v: results.totalViews }
                ]}>
                  <defs>
                    <linearGradient id="colorCurve" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#467a49" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#467a49" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" hide />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #1a1a1a', backgroundColor: '#0a0a0a', color: '#fff', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="v" stroke="#467a49" strokeWidth={2} fill="url(#colorCurve)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}