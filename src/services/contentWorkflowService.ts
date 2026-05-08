/**
 * Content Workflow Service — Draft → Review → Approved → Scheduled → Published
 * Manages the content pipeline with approval flow and scheduling
 */

import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ============================================================================
// TYPES
// ============================================================================

export type ContentStatus = 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'failed';
export type ContentType = 'post' | 'reel' | 'story' | 'carousel' | 'video';
export type ContentPillar = 'emotional_mastery' | 'systematic_method' | 'valley_experience' | 'transformation' | 'community';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  pillar: ContentPillar;
  status: ContentStatus;
  
  // Content
  caption: string;
  hashtags: string[];
  assetIds: string[];       // References to Asset Library
  assetUrls: string[];       // Direct URLs for quick access
  
  // Scheduling
  scheduledDate: string;    // ISO date string "2026-05-10"
  scheduledTime: string;    // "18:00"
  timezone: string;         // "Europe/Berlin"
  
  // Approval workflow
  submittedAt: number | null;    // When sent for review
  approvedAt: number | null;    // When approved
  approvedBy: string | null;    // User who approved
  publishedAt: number | null;   // When published
  publishedUrl: string | null;  // URL of published content
  failureReason: string | null; // If failed, why
  
  // AI generation
  generatedBy: 'manual' | 'ai' | 'template';
  aiPrompt?: string;
  
  // Meta
  authorId: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface StatusTransition {
  from: ContentStatus;
  to: ContentStatus;
  allowed: boolean;
  requiresApproval: boolean;
}

// ============================================================================
// STATUS MACHINE
// ============================================================================

const STATUS_TRANSITIONS: StatusTransition[] = [
  { from: 'draft', to: 'review', allowed: true, requiresApproval: false },
  { from: 'draft', to: 'approved', allowed: true, requiresApproval: false },
  { from: 'draft', to: 'scheduled', allowed: true, requiresApproval: false },
  { from: 'review', to: 'approved', allowed: true, requiresApproval: true },
  { from: 'review', to: 'draft', allowed: true, requiresApproval: false }, // rejected
  { from: 'approved', to: 'scheduled', allowed: true, requiresApproval: false },
  { from: 'approved', to: 'draft', allowed: true, requiresApproval: false },
  { from: 'scheduled', to: 'published', allowed: true, requiresApproval: false },
  { from: 'scheduled', to: 'draft', allowed: true, requiresApproval: false }, // unschedule
  { from: 'scheduled', to: 'failed', allowed: true, requiresApproval: false },
  { from: 'failed', to: 'scheduled', allowed: true, requiresApproval: false }, // retry
  { from: 'failed', to: 'draft', allowed: true, requiresApproval: false },
];

const STATUS_LABELS: Record<ContentStatus, { en: string; es: string; de: string; color: string }> = {
  draft: { en: 'Draft', es: 'Borrador', de: 'Entwurf', color: '#6B7280' },
  review: { en: 'In Review', es: 'En Revisión', de: 'In Überprüfung', color: '#F59E0B' },
  approved: { en: 'Approved', es: 'Aprobado', de: 'Genehmigt', color: '#10B981' },
  scheduled: { en: 'Scheduled', es: 'Programado', de: 'Geplant', color: '#3B82F6' },
  published: { en: 'Published', es: 'Publicado', de: 'Veröffentlicht', color: '#8B5CF6' },
  failed: { en: 'Failed', es: 'Fallido', de: 'Fehlgeschlagen', color: '#EF4444' },
};

// ============================================================================
// CONTENT WORKFLOW SERVICE
// ============================================================================

export const contentWorkflow = {

  /**
   * Create a new content item
   */
  async create(item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'submittedAt' | 'approvedAt' | 'approvedBy' | 'publishedAt' | 'publishedUrl' | 'failureReason'>): Promise<ContentItem> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Must be authenticated');

    const docRef = doc(collection(db, 'content_items'));
    const now = Date.now();
    const contentItem: ContentItem = {
      ...item,
      id: docRef.id,
      authorId: userId,
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
      approvedAt: null,
      approvedBy: null,
      publishedAt: null,
      publishedUrl: null,
      failureReason: null,
    };

    await setDoc(docRef, contentItem);
    return contentItem;
  },

  /**
   * Transition status with validation
   */
  async transitionStatus(itemId: string, newStatus: ContentStatus): Promise<ContentItem> {
    const item = await this.get(itemId);
    if (!item) throw new Error('Content item not found');

    // Validate transition
    const transition = STATUS_TRANSITIONS.find(
      t => t.from === item.status && t.to === newStatus
    );
    if (!transition || !transition.allowed) {
      throw new Error(`Cannot transition from ${item.status} to ${newStatus}`);
    }

    const updates: Partial<ContentItem> = {
      status: newStatus,
      updatedAt: Date.now(),
    };

    // Auto-set timestamps
    if (newStatus === 'review') updates.submittedAt = Date.now();
    if (newStatus === 'approved') {
      updates.approvedAt = Date.now();
      const auth = getAuth();
      updates.approvedBy = auth.currentUser?.uid || null;
    }
    if (newStatus === 'published') updates.publishedAt = Date.now();
    if (newStatus === 'failed') updates.failureReason = 'Publishing failed';

    // Clear failure reason on retry
    if (newStatus === 'scheduled' && item.status === 'failed') {
      updates.failureReason = null;
    }

    await updateDoc(doc(db, 'content_items', itemId), updates);
    return { ...item, ...updates } as ContentItem;
  },

  /**
   * Quick shortcuts
   */
  async sendForReview(itemId: string): Promise<ContentItem> {
    return this.transitionStatus(itemId, 'review');
  },

  async approve(itemId: string): Promise<ContentItem> {
    return this.transitionStatus(itemId, 'approved');
  },

  async reject(itemId: string): Promise<ContentItem> {
    return this.transitionStatus(itemId, 'draft');
  },

  async schedule(itemId: string, date: string, time: string): Promise<ContentItem> {
    await updateDoc(doc(db, 'content_items', itemId), {
      scheduledDate: date,
      scheduledTime: time,
      updatedAt: Date.now(),
    });
    return this.transitionStatus(itemId, 'scheduled');
  },

  async markPublished(itemId: string, publishedUrl?: string): Promise<ContentItem> {
    if (publishedUrl) {
      await updateDoc(doc(db, 'content_items', itemId), { publishedUrl });
    }
    return this.transitionStatus(itemId, 'published');
  },

  async markFailed(itemId: string, reason: string): Promise<ContentItem> {
    await updateDoc(doc(db, 'content_items', itemId), { failureReason: reason });
    return this.transitionStatus(itemId, 'failed');
  },

  /**
   * CRUD operations
   */
  async get(itemId: string): Promise<ContentItem | null> {
    const snapshot = await getDoc(doc(db, 'content_items', itemId));
    return snapshot.exists() ? (snapshot.data() as ContentItem) : null;
  },

  async update(itemId: string, updates: Partial<ContentItem>): Promise<void> {
    await updateDoc(doc(db, 'content_items', itemId), {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  async delete(itemId: string): Promise<void> {
    await deleteDoc(doc(db, 'content_items', itemId));
  },

  /**
   * List items with filters
   */
  async list(filters?: {
    status?: ContentStatus;
    type?: ContentType;
    pillar?: ContentPillar;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ContentItem[]> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    let q = query(collection(db, 'content_items'), where('authorId', '==', userId), orderBy('createdAt', 'desc'));

    if (filters?.status) q = query(q, where('status', '==', filters.status));
    if (filters?.type) q = query(q, where('type', '==', filters.type));
    if (filters?.pillar) q = query(q, where('pillar', '==', filters.pillar));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as ContentItem);
  },

  /**
   * Get items due for publishing (scheduled items where time has passed)
   */
  async getDueForPublishing(): Promise<ContentItem[]> {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const q = query(
      collection(db, 'content_items'),
      where('status', '==', 'scheduled'),
      orderBy('scheduledDate', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(d => d.data() as ContentItem)
      .filter(item => {
        if (!item.scheduledDate) return false;
        if (item.scheduledDate < todayStr) return true; // Past due
        if (item.scheduledDate === todayStr && item.scheduledTime <= currentTime) return true;
        return false;
      });
  },

  /**
   * Subscribe to real-time updates
   */
  subscribe(
    filters: { status?: ContentStatus } = {},
    callback: (items: ContentItem[]) => void
  ): () => void {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) return () => {};

    let q = query(collection(db, 'content_items'), where('authorId', '==', userId), orderBy('createdAt', 'desc'));
    if (filters.status) q = query(q, where('status', '==', filters.status));

    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => d.data() as ContentItem);
      callback(items);
    });
  },

  /**
   * Get status metadata
   */
  getStatusMeta(status: ContentStatus) {
    return STATUS_LABELS[status];
  },

  /**
   * Get allowed next statuses
   */
  getNextStatuses(currentStatus: ContentStatus): ContentStatus[] {
    return STATUS_TRANSITIONS
      .filter(t => t.from === currentStatus && t.allowed)
      .map(t => t.to);
  },

  /**
   * Get stats summary
   */
  async getStats(): Promise<Record<ContentStatus, number>> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) return { draft: 0, review: 0, approved: 0, scheduled: 0, published: 0, failed: 0 };

    const q = query(collection(db, 'content_items'), where('authorId', '==', userId));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(d => d.data() as ContentItem);

    return items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, { draft: 0, review: 0, approved: 0, scheduled: 0, published: 0, failed: 0 } as Record<ContentStatus, number>);
  },
};