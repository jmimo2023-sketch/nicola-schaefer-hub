/**
 * Analytics Panel - Consolidated analytics and strategy module
 * Merges: DashboardPanel + SimulatorPanel + ClientPanel + MethodologyPanel + DACHPanel + MaterializationPanel
 * 
 * Real metrics, predictions, strategy, and market analysis.
 */

import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Globe, Zap, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { DashboardPanel } from './DashboardPanel';
import { SimulatorPanel } from './SimulatorPanel';
import { ClientPanel } from './ClientPanel';
import { MethodologyPanel } from './MethodologyPanel';
import { DACHPanel } from './DACHPanel';
import { MaterializationPanel } from './MaterializationPanel';

type AnalyticsTab = 'dashboard' | 'simulator' | 'clients' | 'methodology' | 'dach' | 'automation';

const ANALYTICS_TABS: { id: AnalyticsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Metrics', icon: <BarChart3 size={16} /> },
  { id: 'simulator', label: 'Predictions', icon: <TrendingUp size={16} /> },
  { id: 'clients', label: 'Clients', icon: <Users size={16} /> },
  { id: 'methodology', label: 'Insights', icon: <BookOpen size={16} /> },
  { id: 'dach', label: 'DACH Market', icon: <Globe size={16} /> },
  { id: 'automation', label: 'Automation', icon: <Zap size={16} /> },
];

export function AnalyticsPanel() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('dashboard');

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-2 font-mono">
            ANALYTICS_STRATEGY
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold">Analytics & Strategy</h2>
          <p className="text-sm text-ink-muted mt-1">
            Real metrics, predictions, and marketing strategy
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {ANALYTICS_TABS.map(tab => (
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
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[60vh]">
        {activeTab === 'dashboard' && <DashboardPanel />}
        {activeTab === 'simulator' && <SimulatorPanel />}
        {activeTab === 'clients' && <ClientPanel />}
        {activeTab === 'methodology' && <MethodologyPanel />}
        {activeTab === 'dach' && <DACHPanel />}
        {activeTab === 'automation' && <MaterializationPanel />}
      </div>
    </div>
  );
}