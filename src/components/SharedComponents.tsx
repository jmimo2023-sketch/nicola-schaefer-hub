import React from 'react';
import { cn } from '../lib/utils';

export function NavItem({ active, onClick, icon, label, badge, indent }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: string; indent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 lg:py-3 rounded-xl transition-all duration-300 text-sm font-medium",
        indent && "pl-8",
        active
          ? "bg-accent text-white shadow-lg shadow-accent/40"
          : "text-ink-muted hover:bg-brd hover:text-ink"
      )}
    >
      <span className={cn("transition-opacity", active ? "opacity-100" : "opacity-60")}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge && <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold", active ? "bg-white text-accent" : "bg-accent text-white")}>{badge}</span>}
    </button>
  );
}

export function BottomNavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-colors min-w-[60px]",
        active ? "text-accent" : "text-ink-muted"
      )}
    >
      {icon}
      <span className="text-[9px] font-bold">{label}</span>
    </button>
  );
}

export function KPICard({ title, value, delta, sub, color }: { title: string; value: string | undefined; delta?: string; sub?: string; color: 'accent' | 'green' | 'rose' | 'amber' }) {
  return (
    <div className="kpi-card">
      <div className="flex justify-between items-start mb-2 sm:mb-4">
        <h4 className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-ink-muted font-mono">{title}</h4>
        {delta && <div className={cn("text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border tracking-tighter font-mono", color === 'green' ? "bg-green-light border-green-custom text-green-custom" : "bg-accent-light border-accent text-accent")}>{delta}</div>}
      </div>
      <div className="font-mono text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tighter leading-none mb-2 sm:mb-3">
        {value}
      </div>
      {sub && <div className="text-[8px] sm:text-[9px] text-ink-muted font-mono font-bold tracking-widest opacity-60">{sub}</div>}
    </div>
  );
}

export function ChartContainer({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-card border border-brd rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-custom", className)}>
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted mb-4 sm:mb-6 font-mono opacity-80 flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
        {title}
      </h3>
      <div className="w-full">{children}</div>
    </div>
  );
}

export function SliderControl({ label, value, min, max, suffix = '', onChange }: { label: string; value: number; min: number; max: number; suffix?: string; onChange: (v: number) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-ink font-mono opacity-60">{label}</label>
        <span className="text-base sm:text-lg font-mono font-bold text-accent bg-accent/10 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full h-1.5 sm:h-2 bg-paper rounded-full appearance-none cursor-pointer accent-accent border border-brd" />
    </div>
  );
}

export function ScenarioButton({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn("py-2 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-bold border transition-all uppercase tracking-wider font-mono", active ? "bg-accent border-accent text-white shadow-lg shadow-accent/20" : "bg-card border-brd text-ink-muted hover:bg-paper hover:text-ink")}>
      {label}
    </button>
  );
}

export function SEOItem({ kw, loc }: { kw: string; loc: string }) {
  return (
    <div className="flex items-center justify-between py-2 sm:py-3 border-b border-brd last:border-0">
      <div>
        <p className="text-xs sm:text-sm font-semibold">{kw}</p>
        <p className="text-[9px] sm:text-[10px] font-bold tracking-widest text-accent uppercase">{loc}</p>
      </div>
      <span className="text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1 bg-accent-light border border-accent/10 text-accent rounded-full font-mono font-bold">CRITICAL</span>
    </div>
  );
}