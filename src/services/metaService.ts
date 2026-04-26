/**
 * Meta/Instagram Graph API Service
 *
 * PREPARED - Requires Meta App configuration to work:
 * 1. Create app at https://developers.facebook.com
 * 2. Add Instagram product
 * 3. Configure OAuth redirect URIs
 * 4. Get Page Access Token
 *
 * Documentación: https://developers.facebook.com/docs/instagram-api
 */

import { getSupabase } from './supabaseService';

// Meta API configuration
const META_APP_ID = import.meta.env.VITE_META_APP_ID || '';
const META_APP_SECRET = import.meta.env.VITE_META_APP_SECRET || '';

// Note: Page Access Token should be stored securely in backend in production
// For now, we'll use a stored token from Firestore or localStorage
const getPageAccessToken = (): string => {
  // This will be fetched from Firestore or passed by the user
  return localStorage.getItem('meta_page_token') || '';
};

export interface InstagramProfile {
  id: string;
  username: string;
  name: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  biography: string;
  website: string;
  profile_picture_url: string;
  account_type: 'PERSONAL' | 'BUSINESS' | 'CREATIVE';
}

export interface MediaItem {
  id: string;
  caption: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  reach?: number;
  impressions?: number;
}

export interface Insights {
  impressions: number;
  reach: number;
  profile_views: number;
  website_clicks: number;
  email_contacts: number;
  follower_count: number;
  follows: number;
}

export interface Comment {
  id: string;
  text: string;
  from: { id: string; username: string; profile_picture_url: string };
  timestamp: string;
  like_count: number;
  replies?: Comment[];
}

export interface AutoReplyRule {
  id: string;
  keyword: string;
  replyText: string;
  language: 'es' | 'de' | 'both';
  isActive: boolean;
}

/**
 * Make a request to Meta Graph API
 */
async function metaGet<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const token = getPageAccessToken();
  if (!token) {
    throw new Error('Meta access token not configured. Please connect your Instagram account.');
  }

  const url = new URL(`https://graph.facebook.com/v18.0/${endpoint}`);
  url.searchParams.set('access_token', token);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.error) {
    throw new Error(`Meta API Error: ${data.error.message}`);
  }

  return data;
}

/**
 * Check if Meta is configured
 */
export function isMetaConfigured(): boolean {
  return Boolean(getPageAccessToken());
}

/**
 * Get Instagram Business account info
 */
export async function getInstagramProfile(): Promise<InstagramProfile> {
  // First get the Facebook Page
  const pages = await metaGet<{ data: Array<{ id: string; name: string; instagram_business_account?: { id: string } }> }>(
    'me/accounts'
  );

  if (!pages.data.length || !pages.data[0].instagram_business_account) {
    throw new Error('No Instagram Business account connected to this Facebook Page');
  }

  const igAccountId = pages.data[0].instagram_business_account.id;

  // Then get Instagram account details
  return metaGet<InstagramProfile>(`${igAccountId}?fields=id,username,name,followers_count,follows_count,media_count,biography,website,profile_picture_url,account_type`);
}

/**
 * Get media items (posts)
 */
export async function getMediaList(limit: number = 25): Promise<MediaItem[]> {
  const pages = await metaGet<{ data: Array<{ id: string; name: string; instagram_business_account?: { id: string } }> }>(
    'me/accounts'
  );

  if (!pages.data.length || !pages.data[0].instagram_business_account) {
    throw new Error('No Instagram Business account');
  }

  const igAccountId = pages.data[0].instagram_business_account.id;

  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count';
  const media = await metaGet<{ data: MediaItem[] }>(
    `${igAccountId}/media`,
    { fields, limit: String(limit) }
  );

  return media.data;
}

/**
 * Get insights for a media item
 */
export async function getMediaInsights(mediaId: string): Promise<Partial<MediaItem>> {
  const insights = await metaGet<{ data: Array<{ name: string; values: Array<{ value: number }> }> }>(
    `${mediaId}/insights`,
    { metric: 'reach,impressions,likes,saves' }
  );

  const result: Partial<MediaItem> = {};
  insights.data.forEach(item => {
    if (item.name === 'reach') result.reach = item.values[0].value;
    if (item.name === 'impressions') result.impressions = item.values[0].value;
  });

  return result;
}

/**
 * Get overall account insights
 */
export async function getAccountInsights(): Promise<Insights> {
  const pages = await metaGet<{ data: Array<{ id: string; instagram_business_account?: { id: string } }> }>(
    'me/accounts'
  );

  if (!pages.data.length || !pages.data[0].instagram_business_account) {
    throw new Error('No Instagram Business account');
  }

  const igAccountId = pages.data[0].instagram_business_account.id;

  const metrics = 'impressions,reach,profile_views,website_clicks,email_contacts,follower_count,follows';
  const insights = await metaGet<{ data: Array<{ name: string; values: Array<{ value: number }> }> }>(
    `${igAccountId}/insights`,
    { metric: metrics, period: 'day' }
  );

  const result: Insights = {
    impressions: 0,
    reach: 0,
    profile_views: 0,
    website_clicks: 0,
    email_contacts: 0,
    follower_count: 0,
    follows: 0,
  };

  insights.data.forEach(item => {
    switch (item.name) {
      case 'impressions': result.impressions = item.values[0]?.value || 0; break;
      case 'reach': result.reach = item.values[0]?.value || 0; break;
      case 'profile_views': result.profile_views = item.values[0]?.value || 0; break;
      case 'website_clicks': result.website_clicks = item.values[0]?.value || 0; break;
      case 'email_contacts': result.email_contacts = item.values[0]?.value || 0; break;
      case 'follower_count': result.follower_count = item.values[0]?.value || 0; break;
      case 'follows': result.follows = item.values[0]?.value || 0; break;
    }
  });

  return result;
}

/**
 * Get comments on a media item
 */
export async function getComments(mediaId: string): Promise<Comment[]> {
  const comments = await metaGet<{ data: Comment[] }>(
    `${mediaId}/comments`,
    { fields: 'id,text,from,timestamp,like_count,replies' }
  );
  return comments.data;
}

/**
 * Reply to a comment
 */
export async function replyToComment(commentId: string, message: string): Promise<void> {
  await metaPost(`${commentId}/replies`, { message });
}

/**
 * Post a comment (reply to media)
 */
export async function postComment(mediaId: string, message: string): Promise<void> {
  await metaPost(`${mediaId}/comments`, { message });
}

/**
 * Publish a media container (after creating it)
 */
export async function publishMedia(containerId: string): Promise<{ id: string }> {
  const pages = await metaGet<{ data: Array<{ id: string; instagram_business_account?: { id: string } }> }>(
    'me/accounts'
  );

  if (!pages.data.length || !pages.data[0].instagram_business_account) {
    throw new Error('No Instagram Business account');
  }

  const igAccountId = pages.data[0].instagram_business_account.id;
  return metaPost<{ id: string }>(`${igAccountId}/media_publish`, { creation_id: containerId });
}

/**
 * Create an image media container
 */
export async function createImageMedia(
  imageUrl: string,
  caption: string,
  location?: string
): Promise<{ id: string }> {
  const pages = await metaGet<{ data: Array<{ id: string; instagram_business_account?: { id: string } }> }>(
    'me/accounts'
  );

  if (!pages.data.length || !pages.data[0].instagram_business_account) {
    throw new Error('No Instagram Business account');
  }

  const igAccountId = pages.data[0].instagram_business_account.id;

  return metaPost<{ id: string }>(`${igAccountId}/media`, {
    image_url: imageUrl,
    caption: caption,
    ...(location && { location }),
  });
}

/**
 * Create a video media container
 */
export async function createVideoMedia(
  videoUrl: string,
  caption: string,
  thumbnailUrl?: string
): Promise<{ id: string }> {
  const pages = await metaGet<{ data: Array<{ id: string; instagram_business_account?: { id: string } }> }>(
    'me/accounts'
  );

  if (!pages.data.length || !pages.data[0].instagram_business_account) {
    throw new Error('No Instagram Business account');
  }

  const igAccountId = pages.data[0].instagram_business_account.id;

  // Note: Video publishing requires video_url and optional thumb_url
  return metaPost<{ id: string }>(`${igAccountId}/media`, {
    video_url: videoUrl,
    caption: caption,
    ...(thumbnailUrl && { thumb_url: thumbnailUrl }),
  });
}

/**
 * Send a direct message
 */
export async function sendDirectMessage(
  recipientId: string,
  message: string
): Promise<void> {
  await metaPost('me/messages', {
    recipient: { id: recipientId },
    message: { text: message },
  });
}

// Helper for POST requests
async function metaPost<T>(endpoint: string, body: Record<string, any>): Promise<T> {
  const token = getPageAccessToken();
  if (!token) {
    throw new Error('Meta access token not configured');
  }

  const response = await fetch(`https://graph.facebook.com/v18.0/${endpoint}?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`Meta API Error: ${data.error.message}`);
  }

  return data;
}

/**
 * Auto-reply rules management (stored in Firestore)
 */
export async function saveAutoReplyRule(rule: Omit<AutoReplyRule, 'id'>): Promise<AutoReplyRule> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('auto_reply_rules').insert(rule).select().single();

  if (error) throw new Error(`Failed to save rule: ${error.message}`);
  return data;
}

export async function getAutoReplyRules(): Promise<AutoReplyRule[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('auto_reply_rules').select('*');

  if (error) throw new Error(`Failed to fetch rules: ${error.message}`);
  return data || [];
}

export async function deleteAutoReplyRule(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('auto_reply_rules').delete().eq('id', id);

  if (error) throw new Error(`Failed to delete rule: ${error.message}`);
}

/**
 * Get optimal posting times based on audience engagement
 * Returns hours (0-23) ordered by best time to post
 */
export function getOptimalPostingTimes(insights: Insights): number[] {
  // Based on Instagram analytics, best times are typically:
  // 9-11 AM and 7-9 PM local time
  // This is a placeholder - real implementation would analyze historical data
  const optimalTimes = [9, 10, 11, 19, 20, 21];
  return optimalTimes;
}
