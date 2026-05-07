/**
 * Publishing Service — HubNick Phase 3
 * 
 * Orchestrates the full Instagram content publishing pipeline:
 * - Meta OAuth flow for Instagram Business account connection
 * - Content Publishing API (IG Graph API container + publish workflow)
 * - Approval workflow: draft → review → approved → scheduled → publishing → published/failed
 * - Scheduled publishing with polling for container processing status
 * - Token management
 */

import {
  getInstagramProfile,
  createImageMedia,
  createVideoMedia,
  publishMedia,
  isMetaConfigured,
  type InstagramProfile,
} from './metaService';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================================================
// TYPES
// ============================================================================

export type PublishingStatus = 
  | 'draft' | 'review' | 'approved' | 'scheduled' | 'publishing' | 'published' | 'failed';

export type ContentType = 'image' | 'video' | 'reel' | 'story' | 'carousel';

export interface PublishingItem {
  id: string;
  title: string;
  caption: string;
  contentType: ContentType;
  mediaUrls: string[];
  thumbnailUrl?: string;
  hashtags: string[];
  location?: string;
  scheduledAt: Date | null;
  status: PublishingStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  publishedAt?: Date;
  errorMessage?: string;
  containerId?: string;
  mediaId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  pillar?: string;
  tags?: string[];
}

export interface MetaConnection {
  connected: boolean;
  igProfile?: InstagramProfile;
  pageToken?: string;
  tokenExpiresAt?: Date;
  scopes: string[];
}

export interface PublishingStats {
  total: number;
  draft: number;
  review: number;
  approved: number;
  scheduled: number;
  published: number;
  failed: number;
}

// ============================================================================
// META OAUTH FLOW
// ============================================================================

const META_APP_ID = import.meta.env.VITE_META_APP_ID || '';
const META_SCOPES = [
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_comments',
  'instagram_manage_insights',
  'pages_read_engagement',
  'pages_manage_posts',
  'pages_show_list',
].join(',');

const META_REDIRECT_URI = `${window.location.origin}/meta-callback`;

/**
 * Initiate Meta OAuth flow — opens popup
 */
export function initiateMetaOAuth(): void {
  if (!META_APP_ID) {
    throw new Error('VITE_META_APP_ID not configured. Set it in .env');
  }

  const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
  authUrl.searchParams.set('client_id', META_APP_ID);
  authUrl.searchParams.set('redirect_uri', META_REDIRECT_URI);
  authUrl.searchParams.set('scope', META_SCOPES);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', crypto.randomUUID());

  const width = 600;
  const height = 700;
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;

  window.open(
    authUrl.toString(),
    'meta-oauth',
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no`
  );
}

/**
 * Handle Meta OAuth callback — exchanges code for page access token
 * NOTE: In production, code exchange MUST happen server-side to protect APP_SECRET
 */
export async function handleMetaCallback(code: string): Promise<MetaConnection> {
  if (!META_APP_ID) throw new Error('VITE_META_APP_ID not configured');

  // Exchange code for short-lived token
  const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
  tokenUrl.searchParams.set('client_id', META_APP_ID);
  tokenUrl.searchParams.set('redirect_uri', META_REDIRECT_URI);
  tokenUrl.searchParams.set('code', code);

  const response = await fetch(tokenUrl.toString());
  const data = await response.json();
  if (data.error) throw new Error(`Meta OAuth Error: ${data.error.message}`);

  const shortLivedToken = data.access_token;

  // Exchange for long-lived token
  const longLivedUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
  longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
  longLivedUrl.searchParams.set('client_id', META_APP_ID);
  longLivedUrl.searchParams.set('fb_exchange_token', shortLivedToken);

  const longResponse = await fetch(longLivedUrl.toString());
  const longData = await longResponse.json();
  if (longData.error) throw new Error(`Meta Token Exchange Error: ${longData.error.message}`);

  const longLivedToken = longData.access_token;
  const expiresAt = new Date(Date.now() + (longData.expires_in || 5184000) * 1000);

  // Store token
  localStorage.setItem('meta_page_token', longLivedToken);
  localStorage.setItem('meta_token_expires', expiresAt.toISOString());

  // Get IG profile
  let igProfile: InstagramProfile | undefined;
  try { igProfile = await getInstagramProfile(); } catch (e) { console.warn('Could not fetch IG profile:', e); }

  // Persist to Firestore
  try {
    const userId = localStorage.getItem('hubnick_user_id') || 'default';
    await addDoc(collection(db, 'meta_connections'), {
      userId,
      pageToken: longLivedToken,
      tokenExpiresAt: Timestamp.fromDate(expiresAt),
      igProfile: igProfile || null,
      connectedAt: serverTimestamp(),
      scopes: META_SCOPES.split(','),
    });
  } catch (e) { console.warn('Could not save Meta connection to Firestore:', e); }

  return { connected: true, igProfile, pageToken: longLivedToken, tokenExpiresAt: expiresAt, scopes: META_SCOPES.split(',') };
}

/**
 * Get current Meta connection status
 */
export async function getMetaConnection(): Promise<MetaConnection> {
  const token = localStorage.getItem('meta_page_token');
  const expiresStr = localStorage.getItem('meta_token_expires');

  if (!token) return { connected: false, scopes: [] };

  if (expiresStr) {
    const expiresAt = new Date(expiresStr);
    if (expiresAt <= new Date()) {
      localStorage.removeItem('meta_page_token');
      localStorage.removeItem('meta_token_expires');
      return { connected: false, scopes: [] };
    }
  }

  try {
    const igProfile = await getInstagramProfile();
    return { connected: true, igProfile, pageToken: token, tokenExpiresAt: expiresStr ? new Date(expiresStr) : undefined, scopes: META_SCOPES.split(',') };
  } catch {
    localStorage.removeItem('meta_page_token');
    return { connected: false, scopes: [] };
  }
}

/**
 * Disconnect Meta account
 */
export function disconnectMeta(): void {
  localStorage.removeItem('meta_page_token');
  localStorage.removeItem('meta_token_expires');
}

// ============================================================================
// PUBLISHING PIPELINE
// ============================================================================

const COLLECTION_NAME = 'publishing_items';

/**
 * Create a new publishing item (starts as draft)
 */
export async function createPublishingItem(
  item: Omit<PublishingItem, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'createdBy'>
): Promise<PublishingItem> {
  const userId = localStorage.getItem('hubnick_user_id') || 'anonymous';
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...item,
    status: 'draft',
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { ...item, id: docRef.id, status: 'draft', createdBy: userId, createdAt: new Date(), updatedAt: new Date() } as PublishingItem;
}

/**
 * Update a publishing item
 */
export async function updatePublishingItem(id: string, updates: Partial<PublishingItem>): Promise<void> {
  await updateDoc(doc(db, COLLECTION_NAME, id), { ...updates, updatedAt: serverTimestamp() });
}

/**
 * Submit for review (draft → review)
 */
export async function submitForReview(id: string): Promise<void> {
  await updatePublishingItem(id, { status: 'review' } as any);
}

/**
 * Approve for publishing (review → approved)
 */
export async function approveForPublishing(id: string, reviewerId: string): Promise<void> {
  await updatePublishingItem(id, { status: 'approved', reviewedBy: reviewerId, reviewedAt: new Date() } as any);
}

/**
 * Reject back to draft (review → draft)
 */
export async function rejectToDraft(id: string, reviewerId: string, reason?: string): Promise<void> {
  await updatePublishingItem(id, { status: 'draft', reviewedBy: reviewerId, reviewedAt: new Date(), errorMessage: reason } as any);
}

/**
 * Schedule for publishing (approved → scheduled)
 */
export async function schedulePublishing(id: string, scheduledAt: Date): Promise<void> {
  if (!isMetaConfigured()) throw new Error('Instagram account not connected. Please connect your account first.');
  await updatePublishingItem(id, { status: 'scheduled', scheduledAt } as any);
}

/**
 * Execute publishing — the main Meta API pipeline
 */
export async function executePublishing(item: PublishingItem): Promise<PublishingItem> {
  if (!isMetaConfigured()) throw new Error('Instagram account not connected');
  if (!item.mediaUrls || item.mediaUrls.length === 0) throw new Error('No media URLs provided');

  await updatePublishingItem(item.id, { status: 'publishing' } as any);

  try {
    const fullCaption = buildCaption(item.caption, item.hashtags);
    let containerId: string;

    if (item.contentType === 'video' || item.contentType === 'reel') {
      const result = await createVideoMedia(item.mediaUrls[0], fullCaption, item.thumbnailUrl);
      containerId = result.id;
    } else {
      const result = await createImageMedia(item.mediaUrls[0], fullCaption, item.location);
      containerId = result.id;
    }

    await updatePublishingItem(item.id, { containerId } as any);

    // Poll container status
    const isReady = await pollContainerStatus(containerId);
    if (!isReady) throw new Error('Media container processing timed out');

    // Publish
    const published = await publishMedia(containerId);

    const updates: Partial<PublishingItem> = { status: 'published', mediaId: published.id, publishedAt: new Date() };
    await updatePublishingItem(item.id, updates as any);

    return { ...item, ...updates, mediaId: published.id } as PublishingItem;
  } catch (error) {
    await updatePublishingItem(item.id, { status: 'failed', errorMessage: (error as Error).message } as any);
    throw error;
  }
}

function buildCaption(caption: string, hashtags: string[]): string {
  if (!hashtags || hashtags.length === 0) return caption;
  const hashtagStr = hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
  return `${caption}\n\n${hashtagStr}`;
}

/**
 * Poll Meta API container status until finished
 */
async function pollContainerStatus(containerId: string, maxAttempts = 30, intervalMs = 5000): Promise<boolean> {
  const token = localStorage.getItem('meta_page_token') || '';
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const url = `https://graph.facebook.com/v18.0/${containerId}?fields=status_code&access_token=${token}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.error) return false;
    if (data.status_code === 'FINISHED') return true;
    if (data.status_code === 'ERROR') return false;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  return false;
}

// ============================================================================
// SCHEDULER
// ============================================================================

/**
 * Process all scheduled items that are due for publishing
 */
export async function processScheduledItems(): Promise<{ published: number; failed: number; pending: number }> {
  const now = new Date();
  const q = query(collection(db, COLLECTION_NAME), where('status', '==', 'scheduled'), orderBy('scheduledAt', 'asc'));
  const snapshot = await getDocs(q);
  const dueItems: PublishingItem[] = [];

  snapshot.forEach(docSnap => {
    const data = docSnap.data() as any;
    const scheduledAt = data.scheduledAt?.toDate?.() || new Date(data.scheduledAt);
    if (scheduledAt <= now) {
      dueItems.push({ ...data, id: docSnap.id, scheduledAt } as PublishingItem);
    }
  });

  let published = 0, failed = 0;
  for (const item of dueItems) {
    try { await executePublishing(item); published++; }
    catch (error) { console.error(`Failed to publish ${item.id}:`, error); failed++; }
  }

  return { published, failed, pending: snapshot.size - dueItems.length };
}

// ============================================================================
// REAL-TIME LISTENERS
// ============================================================================

/**
 * Subscribe to publishing items for a user
 */
export function subscribeToPublishingItems(userId: string, callback: (items: PublishingItem[]) => void): () => void {
  const q = query(collection(db, COLLECTION_NAME), where('createdBy', '==', userId), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items: PublishingItem[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as any;
      items.push({
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        scheduledAt: data.scheduledAt?.toDate?.() || null,
        publishedAt: data.publishedAt?.toDate?.() || undefined,
        reviewedAt: data.reviewedAt?.toDate?.() || undefined,
      } as PublishingItem);
    });
    callback(items);
  });
}

/**
 * Subscribe to items by status
 */
export function subscribeByStatus(status: PublishingStatus, callback: (items: PublishingItem[]) => void): () => void {
  const q = query(collection(db, COLLECTION_NAME), where('status', '==', status), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items: PublishingItem[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as any;
      items.push({ ...data, id: docSnap.id, createdAt: data.createdAt?.toDate?.() || new Date(), updatedAt: data.updatedAt?.toDate?.() || new Date() } as PublishingItem);
    });
    callback(items);
  });
}

// ============================================================================
// STATS & DELETE
// ============================================================================

export async function getPublishingStats(userId: string): Promise<PublishingStats> {
  const q = query(collection(db, COLLECTION_NAME), where('createdBy', '==', userId));
  const snapshot = await getDocs(q);
  const stats: PublishingStats = { total: 0, draft: 0, review: 0, approved: 0, scheduled: 0, published: 0, failed: 0 };
  snapshot.forEach(docSnap => {
    const data = docSnap.data() as PublishingItem;
    stats.total++;
    if (data.status in stats) (stats as any)[data.status]++;
  });
  return stats;
}

export async function deletePublishingItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}