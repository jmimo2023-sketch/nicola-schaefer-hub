/**
 * Home Panel v3 - Creator Dashboard (Responsive)
 */

import React from 'react';
import {
  Plus,
  Calendar,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Clock,
  Image as ImageIcon,
  Video,
  FileText,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/TranslationContext';
import { useFirebase } from '../lib/FirebaseProvider';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../services/firebase';

interface UpcomingPost {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'image' | 'video' | 'reel' | 'story';
  status: 'draft' | 'scheduled' | 'published';
}

export function HomePanel({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { t } = useTranslation();
  const { user } = useFirebase();
  const [upcomingPosts, setUpcomingPosts] = React.useState<UpcomingPost[]>([]);
  const [stats, setStats] = React.useState({ postsThisWeek: 3, engagement: '+12%', followers: 245 });

  React.useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'calendar_posts'),
      where('authorId', '==', user.uid),
      orderBy('date', 'asc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((p: any) => p.status !== 'published')
        .slice(0, 3) as UpcomingPost[];
      setUpcomingPosts(posts);
    });

    return () => unsubscribe();
  }, [user]);

  const quickActions = [
    {
      label: t('createPost'),
      icon: <Plus size={20} />,
      description: t('uploadDescription'),
      color: 'accent',
      tab: 'studio'
    },
    {
      label: t('schedule'),
      icon: <Calendar size={20} />,
      description: t('planAndTrack'),
      color: 'green',
      tab: 'calendar'
    },
    {
      label: t('viewAnalytics'),
      icon: <TrendingUp size={20} />,
      description: t('viewAnalytics'),
      color: 'amber',
      tab: 'dashboard'
    }
  ];

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 18) return t('goodAfternoon');
    return t('goodEvening');
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Header - Compact & Centered */}
      <header className="text-center py-4 sm:py-6">
        <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-1">
          {getTimeOfDay()}, Nicola
        </h1>
        <p className="text-ink-muted text-xs sm:text-sm">{t('thisWeek')}</p>
      </header>

      {/* Quick Stats - Compact */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard
          label={t('postsThisWeek')}
          value={stats.postsThisWeek.toString()}
          icon={<FileText size={14} />}
          delta={t('onTrack')}
          color="accent"
        />
        <StatCard
          label={t('engagement')}
          value={stats.engagement}
          icon={<TrendingUp size={14} />}
          delta={t('vsLastWeek')}
          color="green"
        />
        <StatCard
          label={t('newFollowers')}
          value={`+${stats.followers}`}
          icon={<Sparkles size={14} />}
          delta={t('thisMonth')}
          color="amber"
        />
      </div>

      {/* Quick Actions - Compact Grid */}
      <section>
        <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-ink-muted mb-3 font-mono">{t('quickActions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => onNavigate(action.tab)}
              className={cn(
                "group relative bg-card border border-brd rounded-xl sm:rounded-2xl p-4 sm:p-5 text-left transition-all hover:shadow-custom hover:-translate-y-1 overflow-hidden"
              )}
            >
              <div className={cn(
                "absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 rounded-bl-full opacity-10 transition-transform group-hover:scale-150",
                action.color === 'accent' && "bg-accent",
                action.color === 'green' && "bg-green-custom",
                action.color === 'amber' && "bg-amber-custom"
              )} />
              <div className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105",
                action.color === 'accent' && "bg-accent/10 text-accent",
                action.color === 'green' && "bg-green-light text-green-custom",
                action.color === 'amber' && "bg-amber-light text-amber-custom"
              )}>
                {action.icon}
              </div>
              <h3 className="font-display text-sm sm:text-base font-bold mb-1">{action.label}</h3>
              <div className="flex items-center gap-1 text-accent text-[10px] sm:text-xs font-bold">
                <span>{t('viewAll')}</span>
                <ArrowRight size={10} className="transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Upcoming Posts */}
      <section>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-ink-muted font-mono">{t('upcomingPosts')}</h2>
          <button
            onClick={() => onNavigate('calendar')}
            className="text-[10px] sm:text-xs font-bold text-accent hover:underline flex items-center gap-1"
          >
            View all <ChevronRight size={12} />
          </button>
        </div>

        {upcomingPosts.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {upcomingPosts.map((post) => (
              <div
                key={post.id}
                className="bg-card border border-brd rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 flex items-center gap-3 sm:gap-4 hover:shadow-custom transition-all cursor-pointer"
                onClick={() => onNavigate('calendar')}
              >
                <div className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0",
                  post.type === 'image' && "bg-accent/10 text-accent",
                  post.type === 'video' && "bg-rose-light text-rose-500",
                  post.type === 'reel' && "bg-purple-light text-purple-500",
                  post.type === 'story' && "bg-amber-light text-amber-custom"
                )}>
                  {post.type === 'image' && <ImageIcon size={18} />}
                  {post.type === 'video' && <Video size={18} />}
                  {post.type === 'reel' && <Video size={18} />}
                  {post.type === 'story' && <Clock size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm truncate">{post.title || 'Untitled post'}</h4>
                  <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {post.date}
                    </span>
                    {post.time && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {post.time}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className={cn(
                    "text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1 rounded-full uppercase tracking-widest",
                    post.status === 'draft' && "bg-amber-light text-amber-custom border border-amber-custom/20",
                    post.status === 'scheduled' && "bg-green-light text-green-custom border border-green-custom/20"
                  )}>
                    {post.status}
                  </span>
                  <ChevronRight size={14} className="text-ink-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-brd border-dashed rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar size={20} className="text-accent" />
            </div>
            <h3 className="font-display text-sm sm:text-base font-bold mb-1">No upcoming posts</h3>
            <p className="text-[10px] sm:text-xs text-ink-muted mb-4">Start scheduling content</p>
            <button
              onClick={() => onNavigate('studio')}
              className="inline-flex items-center gap-1.5 bg-accent text-white px-4 sm:px-5 py-2 rounded-lg font-bold text-[10px] sm:text-xs hover:bg-accent/90 transition-colors"
            >
              <Plus size={12} />
              Create post
            </button>
          </div>
        )}
      </section>

      {/* AI Insight Card - Compact */}
      <section className="bg-gradient-to-br from-accent/10 to-green-light/10 border border-accent/20 rounded-xl sm:rounded-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-accent/20 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
            <Sparkles size={14} className="text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-sm sm:text-base font-bold mb-1">AI Insight</h3>
            <p className="text-[10px] sm:text-xs text-ink leading-relaxed">
              Best performing: <strong>personal reflection posts</strong> with 8.5% ER. <strong>Thursdays 6PM</strong> get 2x more saves.
            </p>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => onNavigate('generator')}
                className="flex items-center justify-center gap-1.5 bg-accent text-white px-3 sm:px-4 py-1.5 rounded-lg font-bold text-[10px] sm:text-xs hover:bg-accent/90 transition-colors"
              >
                <Sparkles size={12} />
                Generate
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center justify-center gap-1.5 bg-card border border-brd px-3 sm:px-4 py-1.5 rounded-lg font-bold text-[10px] sm:text-xs hover:bg-paper transition-colors"
              >
                Analytics
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon, delta, color }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  delta?: string;
  color: 'accent' | 'green' | 'amber';
}) {
  return (
    <div className="bg-card border border-brd rounded-lg sm:rounded-xl p-2 sm:p-3">
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <span className="text-[9px] sm:text-[10px] text-ink-muted font-medium truncate pr-1">{label}</span>
        <div className={cn(
          "w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center shrink-0",
          color === 'accent' && "bg-accent/10 text-accent",
          color === 'green' && "bg-green-light text-green-custom",
          color === 'amber' && "bg-amber-light text-amber-custom"
        )}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="font-display text-base sm:text-lg lg:text-xl font-bold">{value}</span>
        {delta && (
          <span className="text-[8px] sm:text-[9px] font-bold text-green-custom bg-green-light px-1 sm:px-1.5 py-0.5 rounded-full">
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
