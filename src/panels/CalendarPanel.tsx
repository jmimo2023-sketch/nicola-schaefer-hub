/**
 * Calendar Panel v5 - Ultimate Calendar Experience
 * Features: Manual task creation, Full CRUD, Hover previews, Rich tooltips, Drag-drop, ICS Export, Google Calendar
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Image as ImageIcon,
  Video,
  Edit2,
  Trash2,
  Send,
  Filter,
  Instagram,
  Sparkles,
  GripVertical,
  Download,
  Link2,
  Unlink,
  X,
  Check,
  Sun,
  Moon,
  Repeat,
  Bell,
  Tag,
  FileText,
  Camera,
  Type,
  Save
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
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { SkeletonCalendarGrid } from '../components/SkeletonComponents';

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  type: 'image' | 'video' | 'reel' | 'story' | 'task';
  date: string;
  time: string;
  status: 'draft' | 'scheduled' | 'published' | 'completed' | 'failed';
  assetUrl?: string;
  caption?: string;
  hashtags?: string[];
  platform: 'instagram' | 'facebook' | 'both';
  createdAt: any;
  publishedAt?: any;
  errorMessage?: string;
  // Extended fields
  description?: string;
  location?: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  reminder?: 'none' | '5min' | '15min' | '30min' | '1hour' | '1day';
  priority?: 'low' | 'medium' | 'high';
  color?: string;
  tags?: string[];
  duration?: number; // minutes
}

interface DayData {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  posts: ScheduledPost[];
}

interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  post: ScheduledPost | null;
  day: Date | null;
}

// Date range: 2024-2030
const MIN_YEAR = 2024;
const MAX_YEAR = 2030;

const OPTIMAL_SLOTS = [
  { hour: 8, label: '8:00 AM', isOptimal: true },
  { hour: 9, label: '9:00 AM', isOptimal: true },
  { hour: 10, label: '10:00 AM', isOptimal: false },
  { hour: 18, label: '6:00 PM', isOptimal: true },
  { hour: 19, label: '7:00 PM', isOptimal: true },
  { hour: 20, label: '8:00 PM', isOptimal: true },
  { hour: 21, label: '9:00 PM', isOptimal: false },
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CONTENT_TYPES = [
  { value: 'image', label: 'Image Post', icon: ImageIcon },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'reel', label: 'Reel', icon: Instagram },
  { value: 'story', label: 'Story', icon: Instagram },
  { value: 'task', label: 'Task', icon: Check },
] as const;

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-amber-100 text-amber-700' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-700' },
  { value: 'published', label: 'Published', color: 'bg-green-100 text-green-700' },
  { value: 'completed', label: 'Completed', color: 'bg-purple-100 text-purple-700' },
  { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-700' },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-600' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700' },
] as const;

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'No repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

const REMINDER_OPTIONS = [
  { value: 'none', label: 'No reminder' },
  { value: '5min', label: '5 minutes before' },
  { value: '15min', label: '15 minutes before' },
  { value: '30min', label: '30 minutes before' },
  { value: '1hour', label: '1 hour before' },
  { value: '1day', label: '1 day before' },
] as const;

const POST_COLORS = [
  { name: 'Default', value: 'accent' },
  { name: 'Red', value: 'red' },
  { name: 'Orange', value: 'orange' },
  { name: 'Yellow', value: 'yellow' },
  { name: 'Green', value: 'green' },
  { name: 'Blue', value: 'blue' },
  { name: 'Purple', value: 'purple' },
  { name: 'Pink', value: 'pink' },
];

export function CalendarPanel() {
  const { user } = useFirebase();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month'>('month');
  const [showQueue, setShowQueue] = useState(true);
  const [draggedPost, setDraggedPost] = useState<ScheduledPost | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Tooltip state
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    post: null,
    day: null
  });
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Form state
  const [formData, setFormData] = useState<Partial<ScheduledPost>>({
    title: '',
    content: '',
    description: '',
    type: 'task',
    date: '',
    time: '09:00',
    status: 'draft',
    platform: 'instagram',
    priority: 'medium',
    recurrence: 'none',
    reminder: 'none',
    color: 'accent',
    tags: [],
    duration: 60
  });

  // Load posts from Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'calendar_posts'),
      where('authorId', '==', user.uid),
      orderBy('date', 'asc'),
      orderBy('time', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ScheduledPost[];
        setPosts(loadedPosts);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError('Failed to load calendar data');
        setLoading(false);
        toast.error('Failed to load calendar');
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (filterStatus !== 'all' && post.status !== filterStatus) return false;
      if (filterType !== 'all' && post.type !== filterType) return false;
      return true;
    });
  }, [posts, filterStatus, filterType]);

  // Queue posts
  const queuedPosts = useMemo(() => {
    return filteredPosts
      .filter(p => p.status === 'draft' || p.status === 'scheduled')
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [filteredPosts]);

  // Published this month
  const publishedThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return posts.filter(p => {
      if (p.status !== 'published' && p.status !== 'completed') return false;
      const pubDate = p.publishedAt?.toDate ? p.publishedAt.toDate() : new Date(p.publishedAt || p.date);
      return pubDate.getMonth() === currentMonth && pubDate.getFullYear() === currentYear;
    }).length;
  }, [posts]);

  // Format date key
  const formatDateKey = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Get posts for date
  const getPostsForDate = useCallback((date: Date, allPosts: ScheduledPost[]): ScheduledPost[] => {
    const dateStr = formatDateKey(date);
    return allPosts.filter(post => post.date === dateStr);
  }, [formatDateKey]);

  // Month days
  const monthDays = useMemo((): DayData[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: DayData[] = [];

    // Previous month padding
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        posts: getPostsForDate(date, filteredPosts)
      });
    }

    // Current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        posts: getPostsForDate(date, filteredPosts)
      });
    }

    // Next month padding (42 cells = 6 rows)
    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        posts: getPostsForDate(date, filteredPosts)
      });
    }

    return days;
  }, [currentDate, filteredPosts, getPostsForDate]);

  // Navigation
  const goToPrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());
  const goToYear = (year: number) => setCurrentDate(new Date(year, currentDate.getMonth(), 1));
  const goToMonth = (month: number) => setCurrentDate(new Date(currentDate.getFullYear(), month, 1));

  // Tooltip handlers
  const showTooltip = useCallback((e: React.MouseEvent, post: ScheduledPost | null, day: Date | null) => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        post,
        day
      });
    }, 200);
  }, []);

  const hideTooltip = useCallback(() => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  // Open modal for new post
  const openNewPostModal = useCallback((date?: Date) => {
    setEditingPost(null);
    const targetDate = date || new Date();
    setSelectedDate(targetDate);
    setFormData({
      title: '',
      content: '',
      description: '',
      type: 'task',
      date: formatDateKey(targetDate),
      time: '09:00',
      status: 'draft',
      platform: 'instagram',
      priority: 'medium',
      recurrence: 'none',
      reminder: 'none',
      color: 'accent',
      tags: [],
      duration: 60
    });
    setShowModal(true);
  }, [formatDateKey]);

  // Open modal for editing
  const openEditModal = useCallback((post: ScheduledPost) => {
    setEditingPost(post);
    setSelectedDate(new Date(post.date));
    setFormData({
      title: post.title,
      content: post.content,
      description: post.description || '',
      type: post.type,
      date: post.date,
      time: post.time,
      status: post.status,
      platform: post.platform,
      priority: post.priority || 'medium',
      recurrence: post.recurrence || 'none',
      reminder: post.reminder || 'none',
      color: post.color || 'accent',
      tags: post.tags || [],
      duration: post.duration || 60,
      assetUrl: post.assetUrl
    });
    setShowModal(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingPost(null);
  }, []);

  // Save post
  const savePost = async () => {
    if (!user) return;
    if (!formData.title?.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      if (editingPost) {
        await updateDoc(doc(db, 'calendar_posts', editingPost.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        toast.success('Post updated');
      } else {
        await addDoc(collection(db, 'calendar_posts'), {
          ...formData,
          authorId: user.uid,
          createdAt: serverTimestamp()
        });
        toast.success('Post created');
      }
      closeModal();
    } catch (err) {
      toast.error('Failed to save');
      console.error(err);
    }
  };

  // Delete post
  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      await deleteDoc(doc(db, 'calendar_posts', id));
      toast.success('Deleted');
      if (editingPost?.id === id) closeModal();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  // Update status
  const updateStatus = async (id: string, status: ScheduledPost['status']) => {
    try {
      await updateDoc(doc(db, 'calendar_posts', id), { status, updatedAt: serverTimestamp() });
      toast.success(`Status: ${status}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Drag handlers
  const handleDragStart = (post: ScheduledPost) => setDraggedPost(post);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (date: Date) => {
    if (!draggedPost) return;
    try {
      await updateDoc(doc(db, 'calendar_posts', draggedPost.id), {
        date: formatDateKey(date),
        updatedAt: serverTimestamp()
      });
      toast.success(`Moved to ${date.toLocaleDateString()}`);
    } catch (err) {
      toast.error('Failed to move');
    }
    setDraggedPost(null);
  };

  // ICS Export
  const generateICS = useCallback((postsToExport: ScheduledPost[]): string => {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nicola Schaefer Hub//Content Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Nicola Schaefer Content Calendar',
      'X-WR-TIMEZONE:Europe/Berlin'
    ];

    postsToExport.forEach(post => {
      const startDate = new Date(`${post.date}T${post.time}`);
      const duration = post.duration || 60;
      const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
      const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${post.id}@nicola-schaefer-hub`);
      lines.push(`DTSTAMP:${fmt(new Date())}`);
      lines.push(`DTSTART:${fmt(startDate)}`);
      lines.push(`DTEND:${fmt(endDate)}`);
      lines.push(`SUMMARY:${post.title || 'Untitled'}`);
      if (post.description) lines.push(`DESCRIPTION:${post.description.substring(0, 500)}`);
      if (post.location) lines.push(`LOCATION:${post.location}`);
      lines.push(`CATEGORIES:${post.type.toUpperCase()}`);
      lines.push(`STATUS:${post.status === 'published' || post.status === 'completed' ? 'CONFIRMED' : 'TENTATIVE'}`);
      if (post.assetUrl) lines.push(`ATTACH:${post.assetUrl}`);
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }, []);

  const downloadICS = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const exportAll = useCallback(() => {
    if (posts.length === 0) { toast.info('No posts to export'); return; }
    downloadICS(generateICS(posts), `nicola-calendar-${formatDateKey(new Date())}.ics`);
    toast.success(`Exported ${posts.length} posts`);
    setShowExportMenu(false);
  }, [posts, generateICS, downloadICS, formatDateKey]);

  const exportMonth = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthPosts = posts.filter(p => {
      const d = new Date(p.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    if (monthPosts.length === 0) { toast.info('No posts this month'); return; }
    downloadICS(generateICS(monthPosts), `nicola-${year}-${String(month + 1).padStart(2, '0')}.ics`);
    toast.success(`Exported ${monthPosts.length} posts`);
    setShowExportMenu(false);
  }, [posts, currentDate, generateICS, downloadICS]);

  const exportWeek = useCallback(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const weekPosts = posts.filter(p => {
      const d = new Date(p.date);
      return d >= startOfWeek && d < endOfWeek;
    });

    if (weekPosts.length === 0) { toast.info('No posts this week'); return; }
    downloadICS(generateICS(weekPosts), `nicola-week-${formatDateKey(startOfWeek)}.ics`);
    toast.success(`Exported ${weekPosts.length} posts`);
    setShowExportMenu(false);
  }, [posts, currentDate, generateICS, downloadICS, formatDateKey]);

  // Google Calendar
  const connectGoogle = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    if (!apiKey) { toast.error('VITE_GOOGLE_API_KEY not configured'); return; }
    try {
      if (!window.gapi) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://apis.google.com/js/api.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load'));
          document.body.appendChild(script);
        });
      }
      await new Promise<void>(resolve => window.gapi.load('client', () => resolve()));
      await window.gapi.client.init({
        apiKey,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
      });
      setGoogleConnected(true);
      toast.success('Google Calendar connected');
    } catch (err) {
      toast.error('Failed to connect Google Calendar');
    }
  }, []);

  const disconnectGoogle = useCallback(() => {
    setGoogleConnected(false);
    toast.info('Google Calendar disconnected');
  }, []);

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon size={12} />;
      case 'video': return <Video size={12} />;
      case 'reel': return <Video size={12} />;
      case 'story': return <Instagram size={12} />;
      default: return <Check size={12} />;
    }
  };

  // Get border color based on type/status
  const getBorderColor = (post: ScheduledPost) => {
    if (post.color && post.color !== 'accent') return `border-${post.color}-500`;
    switch (post.status) {
      case 'published': case 'completed': return 'border-green-500';
      case 'scheduled': return 'border-blue-500';
      case 'draft': return 'border-amber-500';
      case 'failed': return 'border-red-500';
      default: return 'border-accent';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-2 font-mono">CONTENT_CALENDAR_V5</div>
            <h2 className="font-display text-4xl font-semibold text-ink">Calendar</h2>
          </div>
        </header>
        <SkeletonCalendarGrid />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20" onClick={() => setShowExportMenu(false)}>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-2 font-mono">CONTENT_CALENDAR_V5</div>
          <h2 className="font-display text-4xl font-semibold text-ink">Calendar</h2>
          <p className="text-sm text-ink-muted mt-1">
            {posts.length} items • {queuedPosts.length} queued • {publishedThisMonth} published this month
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => openNewPostModal()}
            className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Task
          </button>
          <div className="bg-card border border-brd rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-ink">{queuedPosts.length}</p>
            <p className="text-[10px] text-ink-muted uppercase tracking-widest">Queued</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
            <p className="text-2xl font-bold text-green-700">{publishedThisMonth}</p>
            <p className="text-[10px] text-green-700 uppercase tracking-widest">Done</p>
          </div>
        </div>
      </header>

      {/* Best Times */}
      <div className="bg-gradient-to-r from-accent/10 to-purple-50 border border-accent/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-accent" />
          <h3 className="font-bold text-sm">Best Posting Times</h3>
          <span className="text-[10px] bg-accent/20 text-accent px-2 py-1 rounded-full">DACH</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {OPTIMAL_SLOTS.map(slot => (
            <div
              key={slot.hour}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2",
                slot.isOptimal ? "bg-accent text-white" : "bg-card border border-brd text-ink-muted"
              )}
            >
              {slot.isOptimal && <Sparkles size={10} />}
              {slot.label}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={goToPrevMonth} className="p-2 rounded-xl border border-brd hover:bg-brd transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h3 className="font-display text-xl font-semibold min-w-[200px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={goToNextMonth} className="p-2 rounded-xl border border-brd hover:bg-brd transition-colors">
            <ChevronRight size={20} />
          </button>
          <button onClick={goToToday} className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent/90">
            Today
          </button>
          <select
            value={currentDate.getFullYear()}
            onChange={(e) => goToYear(parseInt(e.target.value))}
            className="px-3 py-2 bg-card border border-brd rounded-xl text-xs font-bold cursor-pointer"
          >
            {Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          {/* Filters */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-card border border-brd rounded-xl text-xs font-bold cursor-pointer"
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-card border border-brd rounded-xl text-xs font-bold cursor-pointer"
          >
            <option value="all">All Types</option>
            {CONTENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Export */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-brd text-ink-muted hover:bg-brd transition-colors flex items-center gap-2"
            >
              <Download size={14} />
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-brd rounded-xl shadow-xl z-50 overflow-hidden">
                <button onClick={exportAll} className="w-full px-4 py-3 text-left text-sm hover:bg-brd flex items-center gap-2">
                  <CalendarIcon size={14} /> Export All
                </button>
                <button onClick={exportMonth} className="w-full px-4 py-3 text-left text-sm hover:bg-brd flex items-center gap-2">
                  <CalendarIcon size={14} /> Export Month
                </button>
                <button onClick={exportWeek} className="w-full px-4 py-3 text-left text-sm hover:bg-brd flex items-center gap-2">
                  <CalendarIcon size={14} /> Export Week
                </button>
              </div>
            )}
          </div>

          {/* Google */}
          {googleConnected ? (
            <button onClick={disconnectGoogle} className="px-4 py-2 rounded-xl text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-2">
              <Unlink size={14} /> Disconnect
            </button>
          ) : (
            <button onClick={connectGoogle} className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2">
              <Link2 size={14} /> Connect Google
            </button>
          )}

          {/* Queue */}
          <button
            onClick={() => setShowQueue(!showQueue)}
            className={cn("px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2",
              showQueue ? "bg-accent text-white border-accent" : "border-brd text-ink-muted hover:bg-brd"
            )}
          >
            <Filter size={14} />
            Queue ({queuedPosts.length})
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card border border-brd rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-brd">
          {WEEK_DAYS.map(day => (
            <div key={day} className="p-3 text-center text-xs font-bold text-ink-muted uppercase tracking-widest border-r border-brd last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthDays.map((day, idx) => (
            <div
              key={idx}
              className={cn(
                "min-h-[120px] p-2 border-b border-r border-brd last:border-r-0 relative cursor-pointer group",
                !day.isCurrentMonth && "bg-muted/30",
                day.isWeekend && "bg-muted/10",
                draggedPost && "bg-accent/5"
              )}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(day.date)}
              onClick={() => openNewPostModal(day.date)}
              onMouseEnter={(e) => day.posts.length > 0 && showTooltip(e, null, day.date)}
              onMouseLeave={hideTooltip}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full",
                    day.isToday && "bg-accent text-white"
                  )}
                >
                  {day.date.getDate()}
                </span>
                {day.posts.length > 0 && (
                  <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-bold">
                    {day.posts.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {day.posts.slice(0, 4).map(post => (
                  <div
                    key={post.id}
                    draggable
                    onDragStart={() => handleDragStart(post)}
                    onClick={(e) => { e.stopPropagation(); openEditModal(post); }}
                    onMouseEnter={(e) => showTooltip(e, post, null)}
                    onMouseLeave={hideTooltip}
                    className={cn(
                      "p-1.5 rounded-lg text-[10px] cursor-grab active:cursor-grabbing border-l-2 bg-muted/50 hover:bg-accent/10 transition-colors truncate",
                      getBorderColor(post)
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {getTypeIcon(post.type)}
                      <span className="truncate font-medium">{post.title || 'Untitled'}</span>
                    </div>
                  </div>
                ))}
                {day.posts.length > 4 && (
                  <div className="text-[10px] text-ink-muted text-center py-0.5 bg-muted/30 rounded">
                    +{day.posts.length - 4} more
                  </div>
                )}
              </div>

              {/* Quick add hint */}
              <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus size={12} className="text-ink-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Queue Panel */}
      {showQueue && (
        <div className="bg-card border border-brd rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-brd flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold">Content Queue</h3>
              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full font-bold">{queuedPosts.length}</span>
            </div>
            <button
              onClick={() => openNewPostModal()}
              className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent/90 flex items-center gap-2"
            >
              <Plus size={14} /> Add Task
            </button>
          </div>

          {queuedPosts.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarIcon size={40} className="text-ink-muted mx-auto mb-3 opacity-30" />
              <p className="text-sm text-ink-muted">No tasks in queue</p>
              <p className="text-xs text-ink-muted mt-1">Create a task to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-brd max-h-[500px] overflow-y-auto">
              {queuedPosts.map(post => (
                <div
                  key={post.id}
                  className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                  onMouseEnter={(e) => showTooltip(e, post, null)}
                  onMouseLeave={hideTooltip}
                >
                  <div className="text-ink-muted cursor-grab">
                    <GripVertical size={16} />
                  </div>
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    post.type === 'image' && "bg-blue-100 text-blue-600",
                    (post.type === 'video' || post.type === 'reel') && "bg-purple-100 text-purple-600",
                    post.type === 'story' && "bg-gradient-to-br from-purple-500 to-pink-500 text-white",
                    post.type === 'task' && "bg-green-100 text-green-600"
                  )}>
                    {getTypeIcon(post.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm truncate">{post.title || 'Untitled'}</h4>
                      <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold",
                        STATUS_OPTIONS.find(s => s.value === post.status)?.color || 'bg-gray-100 text-gray-600'
                      )}>
                        {STATUS_OPTIONS.find(s => s.value === post.status)?.label || post.status}
                      </span>
                      {post.priority === 'high' && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">HIGH</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted">
                      <span className="flex items-center gap-1">
                        <CalendarIcon size={10} />
                        {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {post.time}
                      </span>
                      {post.duration && (
                        <span className="flex items-center gap-1">
                          <Repeat size={10} />
                          {post.duration}m
                        </span>
                      )}
                      {post.recurrence !== 'none' && (
                        <span className="flex items-center gap-1">
                          <Repeat size={10} />
                          {RECURRENCE_OPTIONS.find(r => r.value === post.recurrence)?.label}
                        </span>
                      )}
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {post.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {post.status === 'draft' && (
                      <button
                        onClick={() => updateStatus(post.id, 'scheduled')}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600"
                      >
                        Schedule
                      </button>
                    )}
                    {post.status === 'scheduled' && (
                      <button className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 flex items-center gap-1">
                        <Send size={12} /> Publish
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(post)}
                      className="p-2 hover:bg-brd rounded-lg"
                    >
                      <Edit2 size={14} className="text-ink-muted" />
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="p-2 hover:bg-red-100 rounded-lg"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tooltip */}
      {tooltip.visible && tooltip.post && (
        <div
          className="fixed z-[100] bg-card border border-brd rounded-xl shadow-2xl p-4 max-w-sm pointer-events-none"
          style={{
            left: Math.min(tooltip.x + 16, window.innerWidth - 320),
            top: tooltip.y + 16,
          }}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              tooltip.post.type === 'image' && "bg-blue-100 text-blue-600",
              (tooltip.post.type === 'video' || tooltip.post.type === 'reel') && "bg-purple-100 text-purple-600",
              tooltip.post.type === 'story' && "bg-gradient-to-br from-purple-500 to-pink-500 text-white",
              tooltip.post.type === 'task' && "bg-green-100 text-green-600"
            )}>
              {getTypeIcon(tooltip.post.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm truncate">{tooltip.post.title || 'Untitled'}</h4>
              <p className="text-xs text-ink-muted mt-1 line-clamp-2">{tooltip.post.description || tooltip.post.content || 'No description'}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-brd grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1 text-ink-muted">
              <CalendarIcon size={12} />
              {new Date(tooltip.post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-1 text-ink-muted">
              <Clock size={12} />
              {tooltip.post.time}
              {tooltip.post.duration && ` (${tooltip.post.duration}m)`}
            </div>
            {tooltip.post.location && (
              <div className="flex items-center gap-1 text-ink-muted col-span-2">
                <Sun size={12} />
                {tooltip.post.location}
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <span className={cn("text-[10px] px-2 py-1 rounded-full font-bold",
              STATUS_OPTIONS.find(s => s.value === tooltip.post!.status)?.color || 'bg-gray-100 text-gray-600'
            )}>
              {STATUS_OPTIONS.find(s => s.value === tooltip.post!.status)?.label}
            </span>
            <span className="text-[10px] bg-accent/10 text-accent px-2 py-1 rounded-full font-bold capitalize">
              {tooltip.post.type}
            </span>
            {tooltip.post.priority === 'high' && (
              <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">HIGH PRIORITY</span>
            )}
          </div>

          {tooltip.post.tags && tooltip.post.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tooltip.post.tags.map((tag, i) => (
                <span key={i} className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {tooltip.post.recurrence !== 'none' && (
            <div className="mt-2 text-[10px] text-ink-muted flex items-center gap-1">
              <Repeat size={10} />
              Repeats {RECURRENCE_OPTIONS.find(r => r.value === tooltip.post!.recurrence)?.label}
            </div>
          )}

          {tooltip.post.reminder !== 'none' && (
            <div className="mt-1 text-[10px] text-ink-muted flex items-center gap-1">
              <Bell size={10} />
              Reminder: {REMINDER_OPTIONS.find(r => r.value === tooltip.post!.reminder)?.label}
            </div>
          )}
        </div>
      )}

      {/* Day Tooltip (when hovering empty space) */}
      {tooltip.visible && !tooltip.post && tooltip.day && (
        <div
          className="fixed z-[100] bg-card border border-brd rounded-xl shadow-2xl p-3 max-w-xs pointer-events-none"
          style={{
            left: Math.min(tooltip.x + 16, window.innerWidth - 280),
            top: tooltip.y + 16,
          }}
        >
          <div className="text-xs font-bold text-ink mb-2">
            {tooltip.day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <button
            onClick={() => { closeModal(); openNewPostModal(tooltip.day); hideTooltip(); }}
            className="w-full px-3 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:bg-accent/90 flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Add Task
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4" onClick={closeModal}>
          <div
            className="bg-card border border-brd rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-brd flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold">{editingPost ? 'Edit Task' : 'New Task'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-brd rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title..."
                  className="w-full px-4 py-3 bg-paper border border-brd rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {CONTENT_TYPES.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.value}
                        onClick={() => setFormData({ ...formData, type: t.value as ScheduledPost['type'] })}
                        className={cn(
                          "p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-colors",
                          formData.type === t.value ? "bg-accent text-white border-accent" : "bg-paper border-brd hover:bg-brd"
                        )}
                      >
                        <Icon size={16} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-paper border border-brd rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Time</label>
                  <input
                    type="time"
                    value={formData.time || '09:00'}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 bg-paper border border-brd rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              {/* Duration & Recurrence */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Duration</label>
                  <select
                    value={formData.duration || 60}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-paper border border-brd rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Repeat</label>
                  <select
                    value={formData.recurrence || 'none'}
                    onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as ScheduledPost['recurrence'] })}
                    className="w-full px-4 py-3 bg-paper border border-brd rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {RECURRENCE_OPTIONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={formData.status || 'draft'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ScheduledPost['status'] })}
                    className="w-full px-4 py-3 bg-paper border border-brd rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Priority</label>
                  <select
                    value={formData.priority || 'medium'}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as ScheduledPost['priority'] })}
                    className="w-full px-4 py-3 bg-paper border border-brd rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {PRIORITY_OPTIONS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Color</label>
                <div className="flex gap-2">
                  {POST_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setFormData({ ...formData, color: c.value })}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        formData.color === c.value ? "border-ink scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: c.value === 'accent' ? undefined : c.value }}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add details about this task..."
                  rows={4}
                  className="w-full px-4 py-3 bg-paper border border-brd rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Add location (optional)..."
                  className="w-full px-4 py-3 bg-paper border border-brd rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Reminder */}
              <div>
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Reminder</label>
                <select
                  value={formData.reminder || 'none'}
                  onChange={(e) => setFormData({ ...formData, reminder: e.target.value as ScheduledPost['reminder'] })}
                  className="w-full px-4 py-3 bg-paper border border-brd rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {REMINDER_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Tags</label>
                <input
                  type="text"
                  value={(formData.tags || []).join(', ')}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  placeholder="Enter tags separated by commas..."
                  className="w-full px-4 py-3 bg-paper border border-brd rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-brd flex items-center justify-between">
              {editingPost ? (
                <button
                  onClick={() => deletePost(editingPost.id)}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-sm font-bold hover:bg-red-200 flex items-center gap-2"
                >
                  <Trash2 size={14} /> Delete
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-brd rounded-xl text-sm font-bold hover:bg-brd"
                >
                  Cancel
                </button>
                <button
                  onClick={savePost}
                  className="px-6 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent/90 flex items-center gap-2"
                >
                  <Save size={14} />
                  {editingPost ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPanel;
