/**
 * HomePanel v2 — Unified Dashboard
 * KPIs + Quick Actions + Upcoming Posts + AI Insights
 * This is the landing page after login
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Home, Calendar, PenTool, TrendingUp, Sparkles, Clock,
  ArrowRight, CheckCircle2, AlertCircle, Zap, Plus,
  BarChart3, Image, Film, ChevronRight, ExternalLink,
  Activity, Users, Eye, Heart, MessageCircle, Share2,
  Bookmark, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/TranslationContext';
import { useFirebase } from '../lib/FirebaseProvider';
import { DATA } from '../constants';
import { contentWorkflow, type ContentStatus } from '../services/contentWorkflowService';

// ============================================================================
// TYPES
// ============================================================================

interface HomePanelProps {
  onNavigate: (tab: string) => void;
}

// ============================================================================
// KPI CARDS
// ============================================================================

const kpiCards = [
  { key: 'total_views', label: { en: 'Total Views', es: 'Vistas Totales', de: 'Gesamtansichten' }, icon: Eye, value: '12.6K', change: '+8%', color: 'text-blue-400' },
  { key: 'avg_er', label: { en: 'Engagement', es: 'Engagement', de: 'Engagement' }, icon: Heart, value: '6.3%', change: '+1.2%', color: 'text-rose-400' },
  { key: 'total_follows', label: { en: 'New Followers', es: 'Nuevos Seguidores', de: 'Neue Follower' }, icon: UserPlus, value: '111', change: '+23', color: 'text-green-400' },
  { key: 'avg_reach', label: { en: 'Avg Reach', es: 'Alcance Prom.', de: 'Durchschn. Reichweite' }, icon: Share2, value: '1.0K', change: '+5%', color: 'text-amber-400' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function HomePanel({ onNavigate }: HomePanelProps) {
  const { t, lang } = useTranslation();
  const { user } = useFirebase();
  const [upcomingPosts, setUpcomingPosts] = useState<any[]>([]);
  const [workflowStats, setWorkflowStats] = useState<Record<ContentStatus, number> | null>(null);

  // Subscribe to upcoming posts
  useEffect(() => {
    const unsub = contentWorkflow.subscribe({ status: 'scheduled' }, (items) => {
      setUpcomingPosts(items.slice(0, 5));
    });
    return unsub;
  }, []);

  // Get workflow stats
  useEffect(() => {
    contentWorkflow.getStats().then(setWorkflowStats).catch(console.error);
  }, []);

  const firstName = user?.displayName?.split(' ')[0] || 'Nicola';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return lang === 'de' ? 'Guten Morgen' : lang === 'es' ? 'Buenos días' : 'Good morning';
    if (hour < 18) return lang === 'de' ? 'Guten Tag' : lang === 'es' ? 'Buenas tardes' : 'Good afternoon';
    return lang === 'de' ? 'Guten Abend' : lang === 'es' ? 'Buenas noches' : 'Good evening';
  }, [lang]);

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-display text-3xl lg:text-4xl font-bold">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-ink-muted mt-1">
          {lang === 'de' ? 'Hier ist deine Übersicht für diese Woche.' : lang === 'es' ? 'Aquí está tu resumen de la semana.' : "Here's your overview for this week."}
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-brd rounded-2xl p-4 lg:p-5 hover:border-accent/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <kpi.icon size={18} className={kpi.color} />
              <span className="text-xs font-mono text-green-custom font-bold">{kpi.change}</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold">{kpi.value}</p>
            <p className="text-xs text-ink-muted mt-1">
              {kpi.label[lang as keyof typeof kpi.label] || kpi.label.en}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="font-display text-lg font-bold mb-4">
          {lang === 'de' ? 'Schnellstart' : lang === 'es' ? 'Acciones Rápidas' : 'Quick Actions'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate('create')}
            className="group bg-accent/10 border border-accent/20 rounded-2xl p-5 text-left hover:bg-accent/20 transition-all"
          >
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <PenTool size={20} className="text-white" />
            </div>
            <p className="font-bold text-sm">
              {lang === 'de' ? 'Beitrag erstellen' : lang === 'es' ? 'Crear Contenido' : 'Create Content'}
            </p>
            <p className="text-xs text-ink-muted mt-1">
              {lang === 'de' ? 'KI-gestützter Generator' : lang === 'es' ? 'Generador con IA' : 'AI-powered generator'}
            </p>
          </button>

          <button
            onClick={() => onNavigate('plan')}
            className="group bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 text-left hover:bg-blue-500/20 transition-all"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Calendar size={20} className="text-white" />
            </div>
            <p className="font-bold text-sm">
              {lang === 'de' ? 'Inhalt planen' : lang === 'es' ? 'Programar Publicación' : 'Schedule Post'}
            </p>
            <p className="text-xs text-ink-muted mt-1">
              {lang === 'de' ? 'Kalender & Warteschlange' : lang === 'es' ? 'Calendario y cola' : 'Calendar & queue'}
            </p>
          </button>

          <button
            onClick={() => onNavigate('insights')}
            className="group bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5 text-left hover:bg-purple-500/20 transition-all"
          >
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BarChart3 size={20} className="text-white" />
            </div>
            <p className="font-bold text-sm">
              {lang === 'de' ? 'Analysen' : lang === 'es' ? 'Ver Analíticas' : 'View Analytics'}
            </p>
            <p className="text-xs text-ink-muted mt-1">
              {lang === 'de' ? 'Metriken & Einblicke' : lang === 'es' ? 'Métricas e insights' : 'Metrics & insights'}
            </p>
          </button>
        </div>
      </motion.div>

      {/* Content Pipeline Stats */}
      {workflowStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-brd rounded-2xl p-5"
        >
          <h2 className="font-display text-lg font-bold mb-4">
            {lang === 'de' ? 'Content-Pipeline' : lang === 'es' ? 'Pipeline de Contenido' : 'Content Pipeline'}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['draft', 'review', 'approved', 'scheduled', 'published', 'failed'] as ContentStatus[]).map(status => {
              const meta = contentWorkflow.getStatusMeta(status);
              const count = workflowStats[status];
              if (!count && status === 'failed') return null;
              return (
                <div
                  key={status}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-brd bg-paper"
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                  <span className="text-xs font-bold">{meta[lang as 'es' | 'de' | 'en'] || meta.en}</span>
                  <span className="text-xs font-mono text-accent">{count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Upcoming Posts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">
            {lang === 'de' ? 'Kommende Beiträge' : lang === 'es' ? 'Próximas Publicaciones' : 'Upcoming Posts'}
          </h2>
          <button
            onClick={() => onNavigate('plan')}
            className="text-xs text-accent font-bold flex items-center gap-1 hover:underline"
          >
            {lang === 'de' ? 'Alle anzeigen' : lang === 'es' ? 'Ver todo' : 'View all'}
            <ChevronRight size={14} />
          </button>
        </div>

        {upcomingPosts.length === 0 ? (
          <div className="bg-card border border-brd rounded-2xl p-8 text-center">
            <Clock size={32} className="mx-auto text-ink-muted/30 mb-3" />
            <p className="text-sm font-bold text-ink-muted">
              {lang === 'de' ? 'Keine geplanten Beiträge' : lang === 'es' ? 'No hay publicaciones programadas' : 'No scheduled posts'}
            </p>
            <p className="text-xs text-ink-muted/60 mt-1">
              {lang === 'de' ? 'Erstelle deinen ersten Beitrag im Generator' : lang === 'es' ? 'Crea tu primera publicación en el generador' : 'Create your first post in the generator'}
            </p>
            <button
              onClick={() => onNavigate('create')}
              className="mt-4 bg-accent text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors"
            >
              <Plus size={14} className="inline mr-1.5" />
              {lang === 'de' ? 'Erstellen' : lang === 'es' ? 'Crear' : 'Create'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingPosts.map((post, i) => {
              const meta = contentWorkflow.getStatusMeta(post.status as ContentStatus);
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-brd rounded-xl p-4 flex items-center gap-4 hover:border-accent/30 transition-colors cursor-pointer"
                  onClick={() => onNavigate('plan')}
                >
                  <div className="w-10 h-10 bg-paper rounded-lg flex items-center justify-center flex-shrink-0">
                    {post.type === 'reel' || post.type === 'video' ? <Film size={18} className="text-ink-muted" /> : <Image size={18} className="text-ink-muted" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{post.title}</p>
                    <p className="text-xs text-ink-muted">
                      {post.scheduledDate} • {post.scheduledTime}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-paper border border-brd">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                    <span className="text-[10px] font-bold uppercase">{meta[lang as 'es' | 'de' | 'en'] || meta.en}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* AI Insight of the Day */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-br from-accent/10 via-transparent to-purple-500/10 border border-accent/20 rounded-2xl p-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-accent" />
          </div>
          <div>
            <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">AI Insight</p>
            <p className="text-sm font-medium leading-relaxed">
              {lang === 'de' 
                ? 'Deine beste Postzeit ist 20:00 Uhr. Beiträge über das Tal erleben 40% mehr Engagement. Versuche diese Woche einen Reel über Transformation zu erstellen.'
                : lang === 'es'
                ? 'Tu mejor horario para publicar es 8:00 PM. Los posts sobre la experiencia del valle tienen 40% más engagement. Intenta crear un Reel sobre transformación esta semana.'
                : 'Your best posting time is 8 PM. Valley experience posts get 40% more engagement. Try creating a Reel about transformation this week.'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}