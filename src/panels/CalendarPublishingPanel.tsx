/**
 * Calendar & Publishing Panel — HubNick Phase 3
 * 
 * Enhanced calendar with:
 * - Instagram connection (Meta OAuth)
 * - Approval workflow (draft → review → approved → scheduled → published)
 * - Direct publishing from calendar
 * - Publishing queue management
 * - Status badges & visual indicators
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, Plus, Clock, Image as ImageIcon, Video,
  Edit2, Trash2, Send, Filter, Instagram, Sparkles, Download, Link2,
  X, Check, Sun, Moon, Repeat, Bell, Tag, Save, Eye, AlertCircle,
  Play, Pause, Upload, Loader2, Globe, ExternalLink, RefreshCw,
  ChevronDown, ChevronUp, Settings, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useFirebase } from '../lib/FirebaseProvider';
import { useTranslation } from '../lib/TranslationContext';
import {
  collection, query, where, onSnapshot, addDoc, updateDoc, doc,
  serverTimestamp, orderBy, deleteDoc, getDocs, Timestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  initiateMetaOAuth,
  getMetaConnection,
  disconnectMeta,
  createPublishingItem,
  updatePublishingItem,
  submitForReview,
  approveForPublishing,
  rejectToDraft,
  schedulePublishing,
  executePublishing,
  deletePublishingItem,
  subscribeToPublishingItems,
  getPublishingStats,
  type PublishingItem,
  type PublishingStatus,
  type MetaConnection,
  type PublishingStats,
} from '../services/publishingService';

// ============================================================================
// STATUS CONFIG
// ============================================================================

const STATUS_CONFIG: Record<PublishingStatus, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  draft: { color: 'text-gray-500', bg: 'bg-gray-100', label: 'Draft', icon: <Edit2 size={12} /> },
  review: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Review', icon: <Eye size={12} /> },
  approved: { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Approved', icon: <Check size={12} /> },
  scheduled: { color: 'text-purple-600', bg: 'bg-purple-50', label: 'Scheduled', icon: <Clock size={12} /> },
  publishing: { color: 'text-orange-600', bg: 'bg-orange-50', label: 'Publishing', icon: <Loader2 size={12} className="animate-spin" /> },
  published: { color: 'text-green-600', bg: 'bg-green-50', label: 'Published', icon: <Check size={12} /> },
  failed: { color: 'text-red-600', bg: 'bg-red-50', label: 'Failed', icon: <AlertCircle size={12} /> },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CalendarPublishingPanel() {
  const { t } = useTranslation();
  const { user } = useFirebase();

  // View state
  const [activeView, setActiveView] = useState<'calendar' | 'queue' | 'review'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Meta connection
  const [metaConnection, setMetaConnection] = useState<MetaConnection>({ connected: false, scopes: [] });
  const [isLoadingConnection, setIsLoadingConnection] = useState(true);

  // Publishing items
  const [items, setItems] = useState<PublishingItem[]>([]);
  const [stats, setStats] = useState<PublishingStats | null>(null);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    caption: '',
    contentType: 'image' as const,
    mediaUrl: '',
    hashtags: '',
    scheduledDate: '',
    scheduledTime: '12:00',
    pillar: '',
  });

  // Listen for Meta OAuth callback
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'meta_page_token') {
        checkMetaConnection();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Also listen for postMessage from OAuth popup
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'meta-oauth-success') {
        checkMetaConnection();
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Load Meta connection
  useEffect(() => {
    checkMetaConnection();
  }, []);

  const checkMetaConnection = async () => {
    setIsLoadingConnection(true);
    try {
      const conn = await getMetaConnection();
      setMetaConnection(conn);
    } catch (e) {
      console.warn('Meta connection check failed:', e);
    }
    setIsLoadingConnection(false);
  };

  // Subscribe to publishing items
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToPublishingItems(user.uid, (items) => {
      setItems(items);
    });
    return () => unsub();
  }, [user?.uid]);

  // Load stats
  useEffect(() => {
    if (!user?.uid) return;
    getPublishingStats(user.uid).then(setStats).catch(console.error);
  }, [items, user?.uid]);

  // ============================================================================
  // CALENDAR GRID
  // ============================================================================

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{ date: string; day: number; isCurrentMonth: boolean; items: PublishingItem[] }> = [];

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ date: dateStr, day, isCurrentMonth: false, items: [] });
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateItems = items.filter(item => {
        const d = item.scheduledAt;
        if (!d) return false;
        const itemDate = d instanceof Date ? d : new Date(d);
        return itemDate.toISOString().slice(0, 10) === dateStr;
      });
      days.push({ date: dateStr, day, isCurrentMonth: true, items: dateItems });
    }

    // Next month padding
    const totalCells = Math.ceil(days.length / 7) * 7;
    for (let i = 1; days.length < totalCells; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ date: dateStr, day: i, isCurrentMonth: false, items: [] });
    }

    return days;
  }, [currentDate, items]);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  // ============================================================================
  // CREATE ITEM
  // ============================================================================

  const handleCreateItem = async () => {
    if (!user?.uid) return;
    if (!newItem.title || !newItem.caption) {
      toast.error('Title and caption are required');
      return;
    }

    try {
      const scheduledAt = newItem.scheduledDate
        ? new Date(`${newItem.scheduledDate}T${newItem.scheduledTime || '12:00'}`)
        : null;

      await createPublishingItem({
        title: newItem.title,
        caption: newItem.caption,
        contentType: newItem.contentType,
        mediaUrls: newItem.mediaUrl ? [newItem.mediaUrl] : [],
        hashtags: newItem.hashtags
          ? newItem.hashtags.split(',').map(h => h.trim()).filter(Boolean)
          : [],
        scheduledAt,
        pillar: newItem.pillar || undefined,
        tags: [],
      });

      toast.success('Content item created!');
      setShowCreateModal(false);
      setNewItem({ title: '', caption: '', contentType: 'image', mediaUrl: '', hashtags: '', scheduledDate: '', scheduledTime: '12:00', pillar: '' });
    } catch (error) {
      toast.error('Failed to create item: ' + (error as Error).message);
    }
  };

  // ============================================================================
  // STATUS ACTIONS
  // ============================================================================

  const handleStatusAction = async (item: PublishingItem, action: string) => {
    try {
      switch (action) {
        case 'submit':
          await submitForReview(item.id);
          toast.success('Submitted for review');
          break;
        case 'approve':
          await approveForPublishing(item.id, user?.uid || 'reviewer');
          toast.success('Approved for publishing');
          break;
        case 'reject':
          await rejectToDraft(item.id, user?.uid || 'reviewer');
          toast.info('Sent back to draft');
          break;
        case 'schedule':
          if (!item.scheduledAt) {
            toast.error('Set a schedule date first');
            return;
          }
          await schedulePublishing(item.id, item.scheduledAt);
          toast.success('Scheduled for publishing');
          break;
        case 'publish':
          await executePublishing(item);
          toast.success('Published to Instagram! 🎉');
          break;
        case 'delete':
          await deletePublishingItem(item.id);
          toast.success('Item deleted');
          break;
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  // ============================================================================
  // REVIEW QUEUE
  // ============================================================================

  const reviewItems = items.filter(i => i.status === 'review');
  const scheduledItems = items.filter(i => i.status === 'scheduled');
  const failedItems = items.filter(i => i.status === 'failed');

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="w-full h-full flex flex-col bg-paper">
      {/* Header */}
      <header className="px-4 py-3 border-b border-brd flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <CalendarIcon size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Calendar & Publishing</h2>
            <p className="text-[10px] text-ink-muted">Schedule · Review · Publish</p>
          </div>
        </div>

        {/* Meta Connection Status */}
        <div className="flex items-center gap-3">
          {isLoadingConnection ? (
            <Loader2 size={16} className="animate-spin text-ink-muted" />
          ) : metaConnection.connected ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-ink-muted">
                @{metaConnection.igProfile?.username || 'Connected'}
              </span>
              <button
                onClick={() => { disconnectMeta(); setMetaConnection({ connected: false, scopes: [] }); }}
                className="text-xs text-red-500 hover:underline"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                try {
                  initiateMetaOAuth();
                  toast.info('Connect your Instagram Business account in the popup');
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-xs font-bold hover:opacity-90"
            >
              <Instagram size={14} />
              Connect Instagram
            </button>
          )}
        </div>
      </header>

      {/* View Tabs */}
      <div className="px-4 py-2 border-b border-brd flex gap-2 flex-shrink-0">
        {[
          { id: 'calendar' as const, label: 'Calendar', icon: <CalendarIcon size={14} />, badge: null },
          { id: 'queue' as const, label: 'Queue', icon: <Clock size={14} />, badge: scheduledItems.length || null },
          { id: 'review' as const, label: 'Review', icon: <Eye size={14} />, badge: reviewItems.length || null },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              activeView === tab.id
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "bg-card border border-brd text-ink-muted hover:text-ink"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">{tab.badge}</span>
            )}
          </button>
        ))}

        <div className="flex-1" />

        {/* Stats badges */}
        {stats && (
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            {stats.published > 0 && <span className="text-green-600 font-bold">{stats.published} published</span>}
            {stats.failed > 0 && <span className="text-red-600 font-bold">{stats.failed} failed</span>}
          </div>
        )}

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent/90 shadow-lg shadow-accent/20"
        >
          <Plus size={14} />
          New
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeView === 'calendar' && (
            <CalendarView
              days={calendarDays}
              monthName={monthName}
              onNavigate={navigateMonth}
              onDayClick={setSelectedDate}
              onStatusAction={handleStatusAction}
            />
          )}

          {activeView === 'queue' && (
            <QueueView
              items={items}
              metaConnection={metaConnection}
              onStatusAction={handleStatusAction}
            />
          )}

          {activeView === 'review' && (
            <ReviewView
              items={reviewItems}
              onStatusAction={handleStatusAction}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateItemModal
            newItem={newItem}
            onChange={setNewItem}
            onSubmit={handleCreateItem}
            onClose={() => setShowCreateModal(false)}
            metaConnected={metaConnection.connected}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// CALENDAR VIEW
// ============================================================================

function CalendarView({
  days, monthName, onNavigate, onDayClick, onStatusAction,
}: {
  days: Array<{ date: string; day: number; isCurrentMonth: boolean; items: PublishingItem[] }>;
  monthName: string;
  onNavigate: (d: number) => void;
  onDayClick: (date: string) => void;
  onStatusAction: (item: PublishingItem, action: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => onNavigate(-1)} className="p-2 bg-card border border-brd rounded-xl hover:bg-paper">
          <ChevronLeft size={16} />
        </button>
        <h3 className="text-lg font-bold">{monthName}</h3>
        <button onClick={() => onNavigate(1)} className="p-2 bg-card border border-brd rounded-xl hover:bg-paper">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-xs font-bold text-ink-muted py-2">{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(dayInfo => {
          const isToday = dayInfo.date === today;
          return (
            <div
              key={dayInfo.date}
              onClick={() => onDayClick(dayInfo.date)}
              className={cn(
                "min-h-[80px] p-1.5 rounded-xl border transition-all cursor-pointer",
                dayInfo.isCurrentMonth
                  ? "bg-card border-brd hover:border-accent/30"
                  : "bg-paper/50 border-transparent",
                isToday && "border-accent ring-1 ring-accent/20"
              )}
            >
              <div className={cn(
                "text-xs font-bold mb-1",
                isToday ? "text-accent" : dayInfo.isCurrentMonth ? "text-ink" : "text-ink-muted/40"
              )}>
                {dayInfo.day}
              </div>

              {/* Items on this day */}
              <div className="space-y-0.5">
                {dayInfo.items.slice(0, 3).map(item => {
                  const config = STATUS_CONFIG[item.status];
                  return (
                    <div
                      key={item.id}
                      className={cn("text-[9px] px-1 py-0.5 rounded truncate", config.bg, config.color)}
                      title={`${item.title} (${config.label})`}
                    >
                      {item.title}
                    </div>
                  );
                })}
                {dayInfo.items.length > 3 && (
                  <div className="text-[9px] text-ink-muted">+{dayInfo.items.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// QUEUE VIEW
// ============================================================================

function QueueView({
  items, metaConnection, onStatusAction,
}: {
  items: PublishingItem[];
  metaConnection: MetaConnection;
  onStatusAction: (item: PublishingItem, action: string) => void;
}) {
  const [filter, setFilter] = useState<PublishingStatus | 'all'>('all');

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);

  return (
    <div className="p-4 space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {(['all', 'draft', 'review', 'approved', 'scheduled', 'published', 'failed'] as const).map(status => {
          const count = status === 'all' ? items.length : items.filter(i => i.status === status).length;
          if (status !== 'all' && count === 0) return null;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
                filter === status
                  ? "bg-accent text-white"
                  : "bg-card border border-brd hover:border-accent/50"
              )}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      {/* Item Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-card border border-brd rounded-2xl p-8 text-center">
            <CalendarIcon size={32} className="mx-auto text-ink-muted/30 mb-3" />
            <p className="text-sm font-bold">No items</p>
            <p className="text-xs text-ink-muted mt-1">Create content to see it here</p>
          </div>
        ) : (
          filtered.map(item => (
            <ItemCard key={item.id} item={item} metaConnection={metaConnection} onAction={onStatusAction} />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// REVIEW VIEW
// ============================================================================

function ReviewView({
  items, onStatusAction,
}: {
  items: PublishingItem[];
  onStatusAction: (item: PublishingItem, action: string) => void;
}) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Review Queue</h3>
        <span className="text-xs text-ink-muted">{items.length} items pending review</span>
      </div>

      {items.length === 0 ? (
        <div className="bg-card border border-brd rounded-2xl p-8 text-center">
          <Eye size={32} className="mx-auto text-ink-muted/30 mb-3" />
          <p className="text-sm font-bold">All clear!</p>
          <p className="text-xs text-ink-muted mt-1">No items waiting for review</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <motion.div
              key={item.id}
              layout
              className="bg-card border-2 border-amber-200 rounded-2xl p-4"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  {item.contentType === 'video' || item.contentType === 'reel' ? (
                    <Video size={18} className="text-amber-600" />
                  ) : (
                    <ImageIcon size={18} className="text-amber-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="text-xs text-ink-muted truncate">{item.caption}</p>
                  {item.pillar && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-accent/10 text-accent rounded-full font-bold mt-1 inline-block">
                      {item.pillar}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onStatusAction(item, 'approve')}
                  className="flex-1 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-500/90 flex items-center justify-center gap-1"
                >
                  <Check size={14} /> Approve
                </button>
                <button
                  onClick={() => onStatusAction(item, 'reject')}
                  className="flex-1 py-2 bg-card border border-brd rounded-xl text-xs font-bold hover:border-red-300 flex items-center justify-center gap-1"
                >
                  <X size={14} /> Reject
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ITEM CARD (used in Queue)
// ============================================================================

function ItemCard({
  item, metaConnection, onAction,
}: {
  item: PublishingItem;
  metaConnection: MetaConnection;
  onAction: (item: PublishingItem, action: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[item.status];

  return (
    <div className={cn("bg-card border rounded-2xl p-4 transition-all", 
      item.status === 'failed' ? 'border-red-200' : 'border-brd'
    )}>
      <div className="flex items-center gap-3">
        {/* Status Badge */}
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bg, config.color)}>
          {config.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold truncate">{item.title}</p>
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold", config.bg, config.color)}>
              {config.label}
            </span>
          </div>
          <p className="text-xs text-ink-muted truncate">{item.caption}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {item.status === 'draft' && (
            <button onClick={() => onAction(item, 'submit')} className="px-2 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-bold">
              Submit
            </button>
          )}
          {item.status === 'approved' && item.scheduledAt && (
            <button onClick={() => onAction(item, 'schedule')} className="px-2 py-1 bg-purple-500 text-white rounded-lg text-[10px] font-bold">
              Schedule
            </button>
          )}
          {item.status === 'scheduled' && metaConnection.connected && (
            <button onClick={() => onAction(item, 'publish')} className="px-2 py-1 bg-green-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1">
              <Zap size={10} /> Publish
            </button>
          )}
          {item.status === 'failed' && (
            <span className="text-[9px] text-red-500">{item.errorMessage?.slice(0, 40)}</span>
          )}
          <button onClick={() => onAction(item, 'delete')} className="p-1 text-ink-muted hover:text-red-500">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-brd space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-ink-muted">Type</span>
            <span className="font-bold capitalize">{item.contentType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Scheduled</span>
            <span className="font-bold">
              {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : 'Not scheduled'}
            </span>
          </div>
          {item.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.hashtags.map(h => (
                <span key={h} className="text-[9px] px-1.5 py-0.5 bg-accent/10 text-accent rounded-full">{h}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <button onClick={() => setExpanded(!expanded)} className="mt-2 text-xs text-accent hover:underline">
        {expanded ? 'Less' : 'More details'}
      </button>
    </div>
  );
}

// ============================================================================
// CREATE ITEM MODAL
// ============================================================================

function CreateItemModal({
  newItem, onChange, onSubmit, onClose, metaConnected,
}: {
  newItem: any;
  onChange: (v: any) => void;
  onSubmit: () => void;
  onClose: () => void;
  metaConnected: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-paper border border-brd rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Create Content</h3>
          <button onClick={onClose} className="p-1 hover:bg-card rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-ink-muted block mb-1">Title *</label>
            <input
              type="text" value={newItem.title}
              onChange={e => onChange({ ...newItem, title: e.target.value })}
              className="w-full bg-card border border-brd rounded-xl px-3 py-2 text-sm"
              placeholder="My Instagram Post"
            />
          </div>

          <div>
            <label className="text-xs text-ink-muted block mb-1">Caption *</label>
            <textarea
              value={newItem.caption}
              onChange={e => onChange({ ...newItem, caption: e.target.value })}
              className="w-full bg-card border border-brd rounded-xl px-3 py-2 text-sm h-24 resize-none"
              placeholder="Write your caption here..."
            />
          </div>

          <div>
            <label className="text-xs text-ink-muted block mb-1">Content Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['image', 'reel', 'story'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => onChange({ ...newItem, contentType: type })}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-bold transition-all capitalize",
                    newItem.contentType === type
                      ? "bg-accent text-white"
                      : "bg-card border border-brd hover:border-accent/50"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-ink-muted block mb-1">Media URL {metaConnected ? '' : '(connect IG to publish)'}</label>
            <input
              type="url" value={newItem.mediaUrl}
              onChange={e => onChange({ ...newItem, mediaUrl: e.target.value })}
              className="w-full bg-card border border-brd rounded-xl px-3 py-2 text-sm"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-[9px] text-ink-muted mt-1">Must be a publicly accessible URL for Instagram API</p>
          </div>

          <div>
            <label className="text-xs text-ink-muted block mb-1">Hashtags (comma separated)</label>
            <input
              type="text" value={newItem.hashtags}
              onChange={e => onChange({ ...newItem, hashtags: e.target.value })}
              className="w-full bg-card border border-brd rounded-xl px-3 py-2 text-sm"
              placeholder="#motivation, #mindset, #erfolg"
            />
          </div>

          <div>
            <label className="text-xs text-ink-muted block mb-1">Content Pillar</label>
            <select
              value={newItem.pillar}
              onChange={e => onChange({ ...newItem, pillar: e.target.value })}
              className="w-full bg-card border border-brd rounded-xl px-3 py-2 text-sm"
            >
              <option value="">None</option>
              <option value="P1">P1 — Éxito vs Vacío</option>
              <option value="P2">P2 — Método Sistémico</option>
              <option value="P3">P3 — Autenticidad Vulnerable</option>
              <option value="P4">P4 — Impacto y Propósito</option>
              <option value="P5">P5 — Liderazgo Consciente</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink-muted block mb-1">Schedule Date</label>
              <input
                type="date" value={newItem.scheduledDate}
                onChange={e => onChange({ ...newItem, scheduledDate: e.target.value })}
                className="w-full bg-card border border-brd rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-ink-muted block mb-1">Time</label>
              <input
                type="time" value={newItem.scheduledTime}
                onChange={e => onChange({ ...newItem, scheduledTime: e.target.value })}
                className="w-full bg-card border border-brd rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            onClick={onSubmit}
            className="w-full py-3 bg-accent text-white rounded-xl font-bold text-sm hover:bg-accent/90 shadow-lg shadow-accent/20"
          >
            Create & Save as Draft
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}