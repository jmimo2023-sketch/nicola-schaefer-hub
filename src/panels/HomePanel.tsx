/**
 * Home Panel v2 - Creator Dashboard
 * Quick actions, upcoming posts, AI insights
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

interface QuickStat {
  label: string;
  value: string;
  delta?: string;
  icon: React.ReactNode;
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
      label: 'Create Post',
      icon: <Plus size={24} />,
      description: 'Upload or generate new content',
      color: 'accent',
      tab: 'studio'
    },
    {
      label: 'Schedule',
      icon: <Calendar size={24} />,
      description: 'Plan your content calendar',
      color: 'green',
      tab: 'calendar'
    },
    {
      label: 'Analytics',
      icon: <TrendingUp size={24} />,
      description: 'View your performance',
      color: 'amber',
      tab: 'dashboard'
    }
  ];

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="font-display text-4xl font-bold tracking-tight">
          {getTimeOfDay()}, Nicola 👋
        </h1>
        <p className="text-ink-muted text-lg">Here's what's happening with your content</p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Posts this week"
          value={stats.postsThisWeek.toString()}
          icon={<FileText size={20} />}
          delta="On track"
          color="accent"
        />
        <StatCard
          label="Engagement"
          value={stats.engagement}
          icon={<TrendingUp size={20} />}
          delta="vs last week"
          color="green"
        />
        <StatCard
          label="New followers"
          value={`+${stats.followers}`}
          icon={<Sparkles size={20} />}
          delta="This month"
          color="amber"
        />
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4 font-mono">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => onNavigate(action.tab)}
              className={cn(
                "group relative bg-card border border-brd rounded-3xl p-8 text-left transition-all hover:shadow-custom hover:-translate-y-1 overflow-hidden"
              )}
            >
              <div className={cn(
                "absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-10 transition-transform group-hover:scale-150",
                action.color === 'accent' && "bg-accent",
                action.color === 'green' && "bg-green-custom",
                action.color === 'amber' && "bg-amber-custom"
              )} />
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
                action.color === 'accent' && "bg-accent/10 text-accent",
                action.color === 'green' && "bg-green-light text-green-custom",
                action.color === 'amber' && "bg-amber-light text-amber-custom"
              )}>
                {action.icon}
              </div>
              <h3 className="font-display text-xl font-bold mb-2">{action.label}</h3>
              <p className="text-sm text-ink-muted font-medium">{action.description}</p>
              <div className="mt-6 flex items-center gap-2 text-accent text-xs font-bold">
                <span>Get started</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Upcoming Posts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted font-mono">Upcoming Posts</h2>
          <button
            onClick={() => onNavigate('calendar')}
            className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
          >
            View all <ChevronRight size={14} />
          </button>
        </div>

        {upcomingPosts.length > 0 ? (
          <div className="space-y-3">
            {upcomingPosts.map((post) => (
              <div
                key={post.id}
                className="bg-card border border-brd rounded-2xl p-6 flex items-center gap-4 hover:shadow-custom transition-all cursor-pointer"
                onClick={() => onNavigate('calendar')}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  post.type === 'image' && "bg-accent/10 text-accent",
                  post.type === 'video' && "bg-rose-light text-rose-500",
                  post.type === 'reel' && "bg-purple-light text-purple-500",
                  post.type === 'story' && "bg-amber-light text-amber-custom"
                )}>
                  {post.type === 'image' && <ImageIcon size={20} />}
                  {post.type === 'video' && <Video size={20} />}
                  {post.type === 'reel' && <Video size={20} />}
                  {post.type === 'story' && <Clock size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{post.title || 'Untitled post'}</h4>
                  <div className="flex items-center gap-3 text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {post.date}
                    </span>
                    {post.time && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {post.time}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                    post.status === 'draft' && "bg-amber-light text-amber-custom border border-amber-custom/20",
                    post.status === 'scheduled' && "bg-green-light text-green-custom border border-green-custom/20"
                  )}>
                    {post.status}
                  </span>
                  <ChevronRight size={16} className="text-ink-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-brd border-dashed rounded-3xl p-12 text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={28} className="text-accent" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">No upcoming posts</h3>
            <p className="text-sm text-ink-muted mb-6">Start scheduling content to see it here</p>
            <button
              onClick={() => onNavigate('studio')}
              className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors"
            >
              <Plus size={18} />
              Create your first post
            </button>
          </div>
        )}
      </section>

      {/* AI Insight Card */}
      <section className="bg-gradient-to-br from-accent/10 to-green-light/10 border border-accent/20 rounded-3xl p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles size={24} className="text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-xl font-bold mb-2">AI Insight</h3>
            <p className="text-ink leading-relaxed">
              Your best performing content this week was <strong>personal reflection posts</strong> with an 8.5% engagement rate.
              Posts published at <strong>6:00 PM</strong> on Thursdays received 2x more saves than average.
              Consider scheduling more P1 pillar content for optimal reach.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => onNavigate('generator')}
                className="flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors"
              >
                <Sparkles size={16} />
                Generate content
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 bg-card border border-brd px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-paper transition-colors"
              >
                View detailed analytics
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
    <div className="bg-card border border-brd rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-ink-muted font-medium">{label}</span>
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          color === 'accent' && "bg-accent/10 text-accent",
          color === 'green' && "bg-green-light text-green-custom",
          color === 'amber' && "bg-amber-light text-amber-custom"
        )}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="font-display text-3xl font-bold">{value}</span>
        {delta && (
          <span className="text-xs font-bold text-green-custom bg-green-light px-2 py-1 rounded-full">
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
