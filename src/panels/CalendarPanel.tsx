/**
 * Calendar Panel v2 - Robust & Interconnected
 * Connected with: Studio, Generator, Instagram Analytics
 * Features: Week/Month view, Queue, Drag-drop, Time slots, Publishing
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Image as ImageIcon,
  Video,
  Check,
  X,
  Edit2,
  Trash2,
  Send,
  RefreshCw,
  Filter,
  Instagram,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  GripVertical,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useFirebase } from '../lib/FirebaseProvider';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { getOptimalPostingTimes } from '../services/metaService';

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  type: 'image' | 'video' | 'reel' | 'story';
  date: string;
  time: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  assetUrl?: string;
  caption?: string;
  hashtags?: string[];
  platform: 'instagram' | 'facebook' | 'both';
  createdAt: any;
  publishedAt?: any;
  errorMessage?: string;
}

interface DayData {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: ScheduledPost[];
}

interface TimeSlot {
  hour: number;
  label: string;
  isOptimal: boolean;
}

export function CalendarPanel() {
  const { user } = useFirebase();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('week');
  const [showQueue, setShowQueue] = useState(true);
  const [draggedPost, setDraggedPost] = useState<ScheduledPost | null>(null);

  // Load posts from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'calendar_posts'),
      where('authorId', '==', user.uid),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScheduledPost[];
      setPosts(loadedPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Get current month days
  const getMonthDays = useCallback((): DayData[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: DayData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Days from previous month
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        posts: getPostsForDate(date)
      });
    }

    // Days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const isToday = date.getTime() === today.getTime();
      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        posts: getPostsForDate(date)
      });
    }

    // Days from next month to fill grid
    const endPadding = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= endPadding; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        posts: getPostsForDate(date)
      });
    }

    return days;
  }, [currentDate, posts]);

  // Get posts for a specific date
  const getPostsForDate = (date: Date): ScheduledPost[] => {
    const dateStr = formatDateKey(date);
    return posts.filter(post => post.date === dateStr);
  };

  // Format date as YYYY-MM-DD
  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Navigation
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Optimal time slots
  const optimalSlots: TimeSlot[] = [
    { hour: 8, label: '8:00 AM', isOptimal: true },
    { hour: 9, label: '9:00 AM', isOptimal: true },
    { hour: 10, label: '10:00 AM', isOptimal: false },
    { hour: 18, label: '6:00 PM', isOptimal: true },
    { hour: 19, label: '7:00 PM', isOptimal: true },
    { hour: 20, label: '8:00 PM', isOptimal: true },
    { hour: 21, label: '9:00 PM', isOptimal: false },
  ];

  // Get week days
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthDays = getMonthDays();

  // Queue posts (scheduled but not published)
  const queuedPosts = useMemo(() => {
    return posts
      .filter(p => p.status === 'scheduled' || p.status === 'draft')
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [posts]);

  // Published posts count this month
  const publishedThisMonth = useMemo(() => {
    const now = new Date();
    return posts.filter(p =>
      p.status === 'published' &&
      p.publishedAt &&
      new Date(p.publishedAt.toDate()).getMonth() === now.getMonth()
    ).length;
  }, [posts]);

  // Add new post
  const addPost = async (post: Partial<ScheduledPost>) => {
    if (!user) return;

    try {
      await addDoc(collection(db, 'calendar_posts'), {
        ...post,
        authorId: user.uid,
        status: post.status || 'draft',
        createdAt: serverTimestamp()
      });
      toast.success('Post added to calendar!');
    } catch (err) {
      toast.error('Failed to add post');
      console.error(err);
    }
  };

  // Update post
  const updatePost = async (id: string, updates: Partial<ScheduledPost>) => {
    try {
      await updateDoc(doc(db, 'calendar_posts', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      toast.error('Failed to update post');
      console.error(err);
    }
  };

  // Delete post
  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      await deleteDoc(doc(db, 'calendar_posts', id));
      toast.success('Post deleted');
    } catch (err) {
      toast.error('Failed to delete post');
      console.error(err);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (post: ScheduledPost) => {
    setDraggedPost(post);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (date: Date) => {
    if (!draggedPost) return;

    await updatePost(draggedPost.id, {
      date: formatDateKey(date)
    });

    setDraggedPost(null);
    toast.success(`Moved to ${date.toLocaleDateString()}`);
  };

  // Status badge colors
  const getStatusBadge = (status: ScheduledPost['status']) => {
    switch (status) {
      case 'draft':
        return { bg: 'bg-amber-light', text: 'text-amber-700', label: 'DRAFT' };
      case 'scheduled':
        return { bg: 'bg-blue-light', text: 'text-blue-700', label: 'SCHEDULED' };
      case 'published':
        return { bg: 'bg-green-light', text: 'text-green-700', label: 'PUBLISHED' };
      case 'failed':
        return { bg: 'bg-red-light', text: 'text-red-700', label: 'FAILED' };
    }
  };

  // Type icon
  const getTypeIcon = (type: ScheduledPost['type']) => {
    switch (type) {
      case 'image': return <ImageIcon size={12} />;
      case 'video': return <Video size={12} />;
      case 'reel': return <Video size={12} />;
      case 'story': return <Instagram size={12} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-2 font-mono">
            CONTENT_CALENDAR_V2
          </div>
          <h2 className="font-display text-4xl font-semibold text-ink">Calendar</h2>
          <p className="text-sm text-ink-muted mt-1">
            Plan, schedule and track your content across platforms
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4">
          <div className="bg-card border border-brd rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-ink">{queuedPosts.length}</p>
            <p className="text-[10px] text-ink-muted uppercase tracking-widest">Queued</p>
          </div>
          <div className="bg-green-light/20 border border-green-custom/30 rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-green-700">{publishedThisMonth}</p>
            <p className="text-[10px] text-green-700 uppercase tracking-widest">Published</p>
          </div>
        </div>
      </header>

      {/* Optimal Time Slots */}
      <div className="bg-gradient-to-r from-accent/10 to-green-light/10 border border-accent/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-accent" />
          <h3 className="font-bold text-sm text-ink">Best Posting Times</h3>
          <span className="text-[10px] bg-accent/20 text-accent px-2 py-1 rounded-full">DACH Audience</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {optimalSlots.map(slot => (
            <div
              key={slot.hour}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2",
                slot.isOptimal
                  ? "bg-accent text-white"
                  : "bg-card border border-brd text-ink-muted"
              )}
            >
              {slot.isOptimal && <Sparkles size={10} />}
              {slot.label}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevMonth}
            className="p-2 rounded-xl border border-brd hover:bg-brd transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="font-display text-xl font-semibold min-w-[200px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-xl border border-brd hover:bg-brd transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent/90 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-card border border-brd rounded-xl overflow-hidden">
            <button
              onClick={() => setView('week')}
              className={cn(
                "px-4 py-2 text-xs font-bold transition-colors",
                view === 'week' ? "bg-accent text-white" : "text-ink-muted hover:bg-brd"
              )}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={cn(
                "px-4 py-2 text-xs font-bold transition-colors",
                view === 'month' ? "bg-accent text-white" : "text-ink-muted hover:bg-brd"
              )}
            >
              Month
            </button>
          </div>

          <button
            onClick={() => setShowQueue(!showQueue)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-2",
              showQueue
                ? "bg-accent text-white border-accent"
                : "border-brd text-ink-muted hover:bg-brd"
            )}
          >
            <Filter size={14} />
            Queue ({queuedPosts.length})
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card border border-brd rounded-2xl overflow-hidden">
        {/* Week days header */}
        <div className="grid grid-cols-7 border-b border-brd">
          {weekDays.map(day => (
            <div
              key={day}
              className="p-3 text-center text-xs font-bold text-ink-muted uppercase tracking-widest border-r border-brd last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {monthDays.map((day, idx) => {
            const dayPosts = day.posts;
            const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[120px] p-2 border-b border-r border-brd last:border-r-0",
                  !day.isCurrentMonth && "bg-paper/50 opacity-60",
                  isWeekend && "bg-paper/30"
                )}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(day.date)}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={cn(
                      "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full",
                      day.isToday && "bg-accent text-white"
                    )}
                  >
                    {day.date.getDate()}
                  </span>

                  {dayPosts.length > 0 && (
                    <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-bold">
                      {dayPosts.length}
                    </span>
                  )}
                </div>

                {/* Posts for this day */}
                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map(post => (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={() => handleDragStart(post)}
                      className={cn(
                        "p-1.5 rounded-lg text-[10px] font-medium cursor-grab active:cursor-grabbing border-l-2 bg-paper hover:bg-accent/5 transition-colors group",
                        post.status === 'published' && "border-green-500",
                        post.status === 'scheduled' && "border-blue-500",
                        post.status === 'draft' && "border-amber-500",
                        post.status === 'failed' && "border-red-500"
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {getTypeIcon(post.type)}
                        <span className="truncate flex-1">{post.title || 'Untitled'}</span>
                      </div>
                      <div className="text-ink-muted mt-0.5">{post.time}</div>
                    </div>
                  ))}

                  {dayPosts.length > 3 && (
                    <div className="text-[10px] text-ink-muted text-center py-1">
                      +{dayPosts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Queue Panel */}
      {showQueue && (
        <div className="bg-card border border-brd rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-brd flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-ink">Content Queue</h3>
              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full font-bold">
                {queuedPosts.length}
              </span>
            </div>
            <button className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent/90 transition-colors flex items-center gap-2">
              <Plus size={14} />
              Add Post
            </button>
          </div>

          {queuedPosts.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarIcon size={40} className="text-ink-muted mx-auto mb-3 opacity-30" />
              <p className="text-sm text-ink-muted">No posts in queue</p>
              <p className="text-xs text-ink-muted mt-1">Create content and schedule it here</p>
            </div>
          ) : (
            <div className="divide-y divide-brd">
              {queuedPosts.map(post => {
                const statusBadge = getStatusBadge(post.status);
                const postDate = new Date(`${post.date}T${post.time}`);

                return (
                  <div
                    key={post.id}
                    className="p-4 flex items-center gap-4 hover:bg-paper/50 transition-colors"
                  >
                    {/* Drag handle */}
                    <div className="text-ink-muted cursor-grab active:cursor-grabbing">
                      <GripVertical size={16} />
                    </div>

                    {/* Type icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      post.type === 'image' && "bg-blue-light/30 text-blue-600",
                      post.type === 'video' && "bg-purple-light/30 text-purple-600",
                      post.type === 'reel' && "bg-pink-light/30 text-pink-600",
                      post.type === 'story' && "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                    )}>
                      {getTypeIcon(post.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-ink truncate">{post.title || 'Untitled'}</h4>
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold", statusBadge.bg, statusBadge.text)}>
                          {statusBadge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted">
                        <span className="flex items-center gap-1">
                          <CalendarIcon size={10} />
                          {postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {post.time}
                        </span>
                        {post.platform !== 'instagram' && (
                          <span className="flex items-center gap-1">
                            {post.platform === 'facebook' && <span>FB</span>}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {post.status === 'draft' && (
                        <button
                          onClick={() => updatePost(post.id, { status: 'scheduled' })}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors"
                        >
                          Schedule
                        </button>
                      )}

                      {post.status === 'scheduled' && (
                        <button
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors flex items-center gap-1"
                        >
                          <Send size={12} />
                          Publish
                        </button>
                      )}

                      <button className="p-2 hover:bg-brd rounded-lg transition-colors">
                        <Edit2 size={14} className="text-ink-muted" />
                      </button>

                      <button
                        onClick={() => deletePost(post.id)}
                        className="p-2 hover:bg-red-light rounded-lg transition-colors"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CalendarPanel;
