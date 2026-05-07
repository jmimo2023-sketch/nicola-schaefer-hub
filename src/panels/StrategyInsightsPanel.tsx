/**
 * Strategy & Insights Panel — HubNick Phase 4
 * 
 * Real analytics UI with:
 * - Live Instagram metrics (Meta Graph API)
 * - Growth predictions with confidence intervals
 * - Content pillar performance
 * - Optimal posting times
 * - Strategy recommendations
 * - Quick export of analytics report
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, BarChart3, Users, Clock, Sparkles, Target,
  AlertCircle, RefreshCw, Download, Zap, Eye, Globe,
  ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight,
  Calendar, Instagram, BookOpen, Lightbulb, Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useFirebase } from '../lib/FirebaseProvider';
import { useTranslation } from '../lib/TranslationContext';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  getAccountAnalytics,
  getMediaAnalytics,
  getGrowthPredictions,
  getOptimalPostingTimes,
  getStrategyRecommendations,
  clearAnalyticsCache,
  type AccountAnalytics,
  type MediaAnalytics,
  type GrowthPrediction,
  type OptimalTimeSlot,
  type StrategyRecommendation,
  type AnalyticsReport,
} from '../services/analyticsStrategyService';
import { isMetaConfigured } from '../services/metaService';

// ============================================================================
// TYPES
// ============================================================================

type InsightTab = 'overview' | 'predictions' | 'timing' | 'strategy';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StrategyInsightsPanel() {
  const { t } = useTranslation();
  const { user } = useFirebase();

  const [activeTab, setActiveTab] = useState<InsightTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState<AccountAnalytics | null>(null);
  const [media, setMedia] = useState<MediaAnalytics | null>(null);
  const [predictions, setPredictions] = useState<GrowthPrediction[]>([]);
  const [optimalTimes, setOptimalTimes] = useState<OptimalTimeSlot[]>([]);
  const [recommendations, setRecommendations] = useState<StrategyRecommendation[]>([]);

  const loadAnalytics = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      if (forceRefresh) clearAnalyticsCache();

      const [acc, med, preds, times, recs] = await Promise.all([
        getAccountAnalytics(forceRefresh),
        getMediaAnalytics().catch(() => null),
        getGrowthPredictions(),
        getOptimalPostingTimes(),
        getAccountAnalytics(forceRefresh).then(a =>
          getStrategyRecommendations(a, null).catch(() => [])
        ),
      ]);

      setAccount(acc);
      setMedia(med);
      setPredictions(preds);
      setOptimalTimes(times);

      // Re-generate recommendations with media data
      const recs2 = await getStrategyRecommendations(acc, med).catch(() => []);
      setRecommendations(recs2);

      if (forceRefresh) toast.success('Analytics refreshed');
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExport = () => {
    const report = {
      account: account ? {
        followers: account.insights?.follower_count,
        reach: account.insights?.reach,
        impressions: account.insights?.impressions,
        profileViews: account.insights?.profile_views,
      } : null,
      media: media ? {
        avgEngagement: media.avgEngagement,
        avgReach: media.avgReach,
        totalLikes: media.totalLikes,
        totalComments: media.totalComments,
        bestType: media.bestPerformingType,
      } : null,
      predictions: predictions.map(p => ({
        metric: p.metric,
        current: p.currentValue,
        predicted30d: p.predicted30d,
        predicted90d: p.predicted90d,
        growthRate: p.growthRate,
      })),
      optimalTimes: optimalTimes.map(t => ({ time: t.label, score: t.score })),
      recommendations: recommendations.map(r => ({ title: r.title, impact: r.impact, category: r.category })),
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hubnick_analytics_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported!');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const TABS: { id: InsightTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { id: 'predictions', label: 'Predictions', icon: <TrendingUp size={16} /> },
    { id: 'timing', label: 'Best Times', icon: <Clock size={16} /> },
    { id: 'strategy', label: 'Strategy', icon: <Lightbulb size={16} /> },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-paper">
      {/* Header */}
      <header className="px-4 py-3 border-b border-brd flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Analytics & Strategy</h2>
            <p className="text-[10px] text-ink-muted">
              {isMetaConfigured() ? '✓ Live Instagram data' : '⚠ Connect Instagram for live data'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="p-2 bg-card border border-brd rounded-xl hover:bg-paper" title="Export report">
            <Download size={14} />
          </button>
          <button onClick={() => loadAnalytics(true)} disabled={isLoading} className="p-2 bg-card border border-brd rounded-xl hover:bg-paper" title="Refresh">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-4 py-2 border-b border-brd flex gap-2 flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "bg-card border border-brd text-ink-muted hover:text-ink"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && !account ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw size={32} className="mx-auto text-accent animate-spin mb-3" />
              <p className="text-sm font-bold">Loading analytics...</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}>
              {activeTab === 'overview' && (
                <OverviewTab account={account} media={media} predictions={predictions} />
              )}
              {activeTab === 'predictions' && (
                <PredictionsTab predictions={predictions} />
              )}
              {activeTab === 'timing' && (
                <TimingTab optimalTimes={optimalTimes} />
              )}
              {activeTab === 'strategy' && (
                <StrategyTab recommendations={recommendations} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

function OverviewTab({
  account, media, predictions,
}: {
  account: AccountAnalytics | null;
  media: MediaAnalytics | null;
  predictions: GrowthPrediction[];
}) {
  const kpis = [
    { label: 'Followers', value: account?.insights?.follower_count || 0, icon: <Users size={14} />, color: 'text-blue-500' },
    { label: 'Reach', value: account?.insights?.reach || 0, icon: <Eye size={14} />, color: 'text-emerald-500' },
    { label: 'Impressions', value: account?.insights?.impressions || 0, icon: <Globe size={14} />, color: 'text-purple-500' },
    { label: 'Avg Engagement', value: media?.avgEngagement || 0, icon: <Zap size={14} />, color: 'text-amber-500' },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-card border border-brd rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center bg-paper", kpi.color)}>
                {kpi.icon}
              </div>
              <span className="text-xs text-ink-muted">{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(kpi.value)}</p>
            {kpi.label === 'Followers' && predictions[0] && (
              <p className={cn("text-xs font-bold mt-1",
                predictions[0].growthRate > 0 ? 'text-green-500' : 'text-red-500'
              )}>
                {predictions[0].growthRate > 0 ? <ArrowUpRight size={10} className="inline" /> : <ArrowDownRight size={10} className="inline" />}
                {predictions[0].growthRate.toFixed(1)}%/mo
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Quick Predictions */}
      <div className="bg-card border border-brd rounded-2xl p-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-3 flex items-center gap-2">
          <TrendingUp size={14} />
          Growth Predictions
        </h3>
        <div className="space-y-3">
          {predictions.map(pred => (
            <div key={pred.metric} className="flex items-center justify-between py-2 border-b border-brd/50 last:border-0">
              <span className="text-sm capitalize font-medium">{pred.metric}</span>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-ink-muted">Now: <strong>{formatNumber(pred.currentValue)}</strong></span>
                <span className="text-blue-500">30d: <strong>{formatNumber(pred.predicted30d)}</strong></span>
                <span className="text-emerald-500">90d: <strong>{formatNumber(pred.predicted90d)}</strong></span>
                <span className={cn("font-bold", pred.growthRate > 0 ? 'text-green-500' : 'text-red-500')}>
                  {pred.growthRate > 0 ? '+' : ''}{pred.growthRate.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Posts */}
      {media && media.topPosts.length > 0 && (
        <div className="bg-card border border-brd rounded-2xl p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-3 flex items-center gap-2">
            <Star size={14} />
            Top Performing Posts
          </h3>
          <div className="space-y-2">
            {media.topPosts.slice(0, 5).map((post, i) => (
              <div key={post.id} className="flex items-center gap-3 py-2 border-b border-brd/50 last:border-0">
                <span className="text-xs font-bold text-ink-muted w-6">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{post.caption?.slice(0, 60) || 'No caption'}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-ink-muted">
                  <span>❤️ {post.like_count}</span>
                  <span>💬 {post.comments_count}</span>
                  {post.reach && <span>👁 {post.reach}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Format */}
      {media && (
        <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-1">Best Performing Format</h3>
          <p className="text-lg font-bold text-accent">{media.bestPerformingType}</p>
          <p className="text-xs text-ink-muted">Avg engagement: {media.avgEngagement} | Avg reach: {formatNumber(media.avgReach)}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PREDICTIONS TAB
// ============================================================================

function PredictionsTab({ predictions }: { predictions: GrowthPrediction[] }) {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-card border border-brd rounded-2xl p-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4">
          Growth Trajectory (30 & 90 day forecasts)
        </h3>
        <div className="space-y-6">
          {predictions.map(pred => (
            <div key={pred.metric}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold capitalize">{pred.metric}</span>
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
                  pred.growthRate > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                )}>
                  {pred.growthRate > 0 ? '+' : ''}{pred.growthRate.toFixed(1)}%/mo
                </span>
              </div>

              {/* Visual bar */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-muted w-16">Current</span>
                  <div className="flex-1 h-6 bg-paper border border-brd rounded-lg overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-500 rounded-lg flex items-center pl-2"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (pred.currentValue / Math.max(pred.predicted90d, 1)) * 100)}%` }}
                      transition={{ duration: 0.5 }}
                    >
                      <span className="text-[10px] text-white font-bold">{formatNumber(pred.currentValue)}</span>
                    </motion.div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-muted w-16">30 days</span>
                  <div className="flex-1 h-6 bg-paper border border-brd rounded-lg overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-500 rounded-lg flex items-center pl-2"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (pred.predicted30d / Math.max(pred.predicted90d, 1)) * 100)}%` }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <span className="text-[10px] text-white font-bold">{formatNumber(pred.predicted30d)}</span>
                    </motion.div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-muted w-16">90 days</span>
                  <div className="flex-1 h-6 bg-paper border border-brd rounded-lg overflow-hidden">
                    <motion.div
                      className="h-full bg-purple-500 rounded-lg flex items-center pl-2"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <span className="text-[10px] text-white font-bold">{formatNumber(pred.predicted90d)}</span>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Confidence */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-ink-muted">Confidence:</span>
                <div className="w-24 h-1.5 bg-brd rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${pred.confidence * 100}%` }} />
                </div>
                <span className="text-[10px] font-mono text-ink-muted">{Math.round(pred.confidence * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TIMING TAB
// ============================================================================

function TimingTab({ optimalTimes }: { optimalTimes: OptimalTimeSlot[] }) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4 space-y-4">
      <div className="bg-card border border-brd rounded-2xl p-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4 flex items-center gap-2">
          <Clock size={14} />
          Optimal Posting Times
        </h3>
        <p className="text-xs text-ink-muted mb-4">Based on DACH market patterns and your engagement data</p>

        <div className="space-y-3">
          {optimalTimes.map((slot, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-paper border border-brd rounded-lg flex items-center justify-center text-xs font-bold text-ink-muted">
                {dayNames[slot.dayOfWeek]?.slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold">{slot.hour}:00</span>
                  <span className="text-xs font-bold text-accent">{slot.score}/100</span>
                </div>
                <div className="w-full h-2 bg-brd rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full",
                      slot.score >= 85 ? "bg-green-500" : slot.score >= 70 ? "bg-amber-500" : "bg-gray-400"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${slot.score}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Heatmap concept */}
      <div className="bg-card border border-brd rounded-2xl p-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-3">Weekly Heatmap</h3>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 * 12 }, (_, idx) => {
            const day = idx % 7;
            const hourBlock = Math.floor(idx / 7); // 0-11 (2-hour blocks)
            const hour = hourBlock * 2 + 8; // 8 AM to 10 PM
            const match = optimalTimes.find(s => s.dayOfWeek === day && s.hour === hour);
            const score = match ? match.score : Math.max(10, 50 - Math.abs(hour - 14) * 8);
            return (
              <div
                key={idx}
                className="aspect-square rounded-sm"
                style={{
                  backgroundColor: score >= 85 ? '#10B981' : score >= 70 ? '#F59E0B' : score >= 50 ? '#6B7280' : '#E5E7EB',
                  opacity: 0.3 + (score / 100) * 0.7,
                }}
                title={`${dayNames[day]} ${hour}:00 — Score: ${score}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[9px] text-ink-muted">
          <span>8 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>10 PM</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STRATEGY TAB
// ============================================================================

function StrategyTab({ recommendations }: { recommendations: StrategyRecommendation[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const impactColor: Record<string, string> = {
    high: 'text-green-500 bg-green-50',
    medium: 'text-amber-500 bg-amber-50',
    low: 'text-gray-500 bg-gray-50',
  };

  const categoryIcon: Record<string, React.ReactNode> = {
    content: <BookOpen size={14} />,
    timing: <Clock size={14} />,
    engagement: <Zap size={14} />,
    growth: <TrendingUp size={14} />,
    format: <BarChart3 size={14} />,
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted">AI Recommendations</h3>
        <span className="text-xs text-ink-muted">{recommendations.length} suggestions</span>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-card border border-brd rounded-2xl p-8 text-center">
          <Lightbulb size={32} className="mx-auto text-ink-muted/30 mb-3" />
          <p className="text-sm font-bold">No recommendations yet</p>
          <p className="text-xs text-ink-muted mt-1">Connect Instagram for personalized insights</p>
        </div>
      ) : (
        recommendations.map(rec => (
          <div
            key={rec.id}
            className="bg-card border border-brd rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => setExpanded(expanded === rec.id ? null : rec.id)}
              className="w-full p-4 flex items-center gap-3 text-left"
            >
              <div className="w-8 h-8 bg-paper border border-brd rounded-lg flex items-center justify-center text-ink-muted">
                {categoryIcon[rec.category] || <Sparkles size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{rec.title}</p>
                <div className="flex gap-2 mt-1">
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold capitalize", impactColor[rec.impact])}>
                    {rec.impact} impact
                  </span>
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold capitalize", impactColor[rec.effort])}>
                    {rec.effort} effort
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-paper border border-brd rounded-full font-bold capitalize">
                    {rec.category}
                  </span>
                </div>
              </div>
              {expanded === rec.id ? <ChevronUp size={14} className="text-ink-muted" /> : <ChevronDown size={14} className="text-ink-muted" />}
            </button>

            <AnimatePresence>
              {expanded === rec.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 text-sm text-ink-muted">
                    {rec.description}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))
      )}
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}