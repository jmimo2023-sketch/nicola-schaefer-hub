/**
 * Dashboard Panel - Analytics overview
 * Extracted from App.tsx for modularity
 */

import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { collection, addDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { useTranslation } from '../lib/TranslationContext';
import { useFirebase } from '../lib/FirebaseProvider';
import { DATA } from '../constants';
import { cn } from '../lib/utils';
import { KPICard, ChartContainer } from '../components/SharedComponents';

export function DashboardPanel() {
  const { t } = useTranslation();
  const { user } = useFirebase();
  const [stats, setStats] = useState<any>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'analytics', 'summary'), (doc) => {
      if (doc.exists()) {
        setStats(doc.data());
      }
    });
    return () => unsub();
  }, []);

  const handleSeedData = async () => {
    if (!user) return;
    setIsSeeding(true);
    try {
      const sampleAssets = [
        { name: 'Lifestyle Desk Aesthetic', url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop', source: 'Sample Import', mimeType: 'image/jpeg' },
        { name: 'Organic Plant Content', url: 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=1974&auto=format&fit=crop', source: 'Sample Import', mimeType: 'image/jpeg' },
        { name: 'Minimalist Branding', url: 'https://images.unsplash.com/photo-1616628188502-413f2fe4cee?q=80&w=1974&auto=format&fit=crop', source: 'Sample Import', mimeType: 'image/jpeg' }
      ];

      for (const asset of sampleAssets) {
        await addDoc(collection(db, 'assets'), {
          ...asset,
          authorId: user.uid,
          createdAt: serverTimestamp()
        });
      }

      const samplePosts = [
        { content: 'Story: Detrás de las cámaras en el taller', type: 'story', date: '2026-05-15', status: 'ready' },
        { content: 'Reel: 3 errores comunes en tu estrategia', type: 'reel_script', date: '2026-05-18', status: 'draft' },
        { content: 'Caption: Reflexión sobre el proceso creativo', type: 'caption', date: '2026-05-20', status: 'ready' }
      ];

      for (const post of samplePosts) {
        await addDoc(collection(db, 'posts'), {
          ...post,
          authorId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      await addDoc(collection(db, 'methodology'), {
        title: 'Estrategia de Pilares May 2026',
        content: '# Pilares de Contenido\n1. **Valor Técnico**: Compartir conocimientos sobre plantas.\n2. **Personal**: Reflexiones sobre el crecimiento.\n\n### Próximos Pasos\nOptimizar los jueves a las 6pm.',
        type: 'ESTRATEGIA',
        authorId: user.uid,
        createdAt: serverTimestamp()
      });

      alert('¡Demo Data cargada con éxito! Revisa la biblioteca y el calendario.');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, 'seed_data');
      alert('Error seeding data: ' + (error.message || 'Check permissions.'));
    } finally {
      setIsSeeding(false);
    }
  };

  const displayStats = stats || DATA.kpis;

  return (
    <div className="w-full space-y-4 sm:space-y-6 pb-20">
      <header className="mb-6 sm:mb-8 lg:mb-10 flex flex-col md:flex-row justify-between items-center md:items-end gap-4 sm:gap-6">
        <div className="text-center md:text-left">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-3 sm:mb-4 font-mono opacity-80 underline underline-offset-8 decoration-accent/40">ANALYTICS_V2.5</div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold mb-3 sm:mb-4 leading-tight tracking-tight">{t('dashboard')}</h2>
          <p className="text-xs sm:text-sm text-ink-muted max-w-xl font-medium leading-relaxed mx-auto md:mx-0">Direct synchronization with Meta Business Suite // Monitoring active performance across bilingual reels and stories.</p>
        </div>

        <button
          onClick={handleSeedData}
          disabled={isSeeding}
          className="bg-accent/10 border border-accent/20 text-accent px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all flex items-center gap-2 group disabled:opacity-50 w-full md:w-auto justify-center"
        >
          <Zap size={14} className="group-hover:animate-pulse" />
          {isSeeding ? 'INIT...' : 'INIT_TEST'}
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <KPICard title={t('viewsTotal')} value={displayStats.total_views?.toLocaleString()} delta="9 REELS" color="accent" />
        <KPICard title={t('engagementRate')} value={`${displayStats.avg_er}%`} delta="STATUS_OK" color="green" />
        <KPICard title={t('followersGained')} value={displayStats.total_follows?.toString() || '+111'} sub="FOLLOWERS" color="accent" />
        <KPICard title={t('savesTotal')} value={displayStats.total_saves?.toString()} sub="VALUE" color="rose" />
        <KPICard title={t('storiesPub')} value={displayStats.total_stories?.toString()} sub={`RETENTION_${displayStats.story_retention || 83}%`} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ChartContainer title="Monthly views + ER">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={DATA.by_month}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#467a49" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#467a49" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} />
              <Tooltip cursor={{ stroke: '#467a49', strokeWidth: 1 }} contentStyle={{ borderRadius: '16px', border: '1px solid #1a1a1a', backgroundColor: '#0a0a0a', color: '#f4f3f3' }} />
              <Area type="monotone" dataKey="views" stroke="#467a49" fillOpacity={1} fill="url(#colorViews)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Publication hourly performance">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DATA.by_hour}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '16px', border: '1px solid #1a1a1a', backgroundColor: '#0a0a0a', color: '#f4f3f3' }} />
              <Bar dataKey="views" fill="#467a49" radius={[8, 8, 0, 0]} barSize={20}>
                {DATA.by_hour.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.hour === '18:00' ? '#e8b571' : '#467a4944'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <ChartContainer title="Top Reels Performance" className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse min-w-[500px]">
          <thead className="text-[10px] font-bold text-ink-muted uppercase tracking-[0.2em] font-mono border-b border-brd opacity-60">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-ink font-bold tracking-[0.3em]">CONTENT</th>
              <th className="px-4 sm:px-6 py-3 text-ink font-bold tracking-[0.3em]">METRICS</th>
              <th className="px-4 sm:px-6 py-3 text-ink font-bold tracking-[0.3em]">ER</th>
              <th className="px-4 sm:px-6 py-3 text-ink font-bold tracking-[0.3em]">CONV</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brd">
            {DATA.top_reels.map((reel, idx) => (
              <tr key={idx} className="hover:bg-paper transition-all group">
                <td className="px-4 sm:px-6 py-4 max-w-xs font-semibold">
                  <div className="flex flex-col gap-1 text-ink">
                    <span className="truncate text-sm">{reel.desc}</span>
                    <span className="text-[9px] text-ink-muted font-mono uppercase tracking-widest">{reel.date}</span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-lg font-bold text-ink">{reel.views.toLocaleString()}</span>
                    <div className="w-full max-w-[100px] h-1 bg-paper rounded-full overflow-hidden border border-brd">
                      <div className="h-full bg-accent" style={{ width: `${(reel.views / DATA.kpis.best_views) * 100}%` }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <span className={cn(
                    "px-2 sm:px-3 py-1 rounded-full font-mono font-bold text-[10px] border",
                    reel.er >= 8 ? "bg-green-light border-green-custom text-green-custom" : "bg-accent-light border-accent text-accent"
                  )}>{reel.er}%</span>
                </td>
                <td className="px-4 sm:px-6 py-4 font-mono font-bold text-green-custom">{reel.follows > 0 ? `+${reel.follows}` : '0.0'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ChartContainer>

      <div className="bg-card border border-brd p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row gap-4 sm:gap-6 items-start shadow-custom relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-accent"></div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-accent shrink-0 group-hover:scale-110 transition-transform">
          <Zap size={20} />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent font-mono mb-2">SYSTEM_INSIGHT</div>
          <p className="text-sm sm:text-base lg:text-lg text-ink leading-relaxed font-medium font-display italic">
            "Content performance benchmarks for May 2026 indicate that <strong>thursdays at 6pm</strong> remain the optimal window for audience engagement //
            Personal reflection content (P1) is achieving an <strong>8.5% ER</strong>, significantly outperforming medical plant content."
          </p>
        </div>
      </div>
    </div>
  );
}