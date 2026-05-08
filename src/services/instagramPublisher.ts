/**
 * Instagram Publisher Service — Publish content directly to Instagram
 * Uses Instagram Graph API (Content Publishing API) for posts, reels, and stories
 * 
 * IMPORTANT: Instagram Content Publishing requires:
 * 1. A Facebook Page linked to an Instagram Business/Creator account
 * 2. A Page Access Token with instagram_content_publish permission
 * 3. Content must follow Instagram's guidelines
 * 
 * Flow for publishing:
 * 1. Upload media to Instagram container (step 1)
 * 2. Create a media container (step 2)
 * 3. Publish the container (step 3)
 */

import { metaOAuth, type MetaToken, type InstagramAccount } from './metaOAuthService';
import { assetLibrary } from './assetLibraryService';

// ============================================================================
// TYPES
// ============================================================================

export type InstagramMediaType = 'FEED' | 'REEL' | 'STORY' | 'CAROUSEL';
export type PublishStatus = 'pending' | 'processing' | 'published' | 'failed';

export interface PublishRequest {
  igUserId: string;           // Instagram Business Account ID
  mediaType: InstagramMediaType;
  caption: string;
  mediaUrls: string[];        // Public URLs (Instagram must be able to fetch these)
  hashtags?: string[];
  locationId?: string;        // Facebook location ID
  altText?: string;           // Image alt text for accessibility
  shareToFeed?: boolean;      // For stories: also share to feed
}

export interface PublishResult {
  id: string;                  // Container/Publish ID
  status: PublishStatus;
  permalink?: string;           // URL of published content
  mediaUrl?: string;
  publishedAt?: number;
  error?: string;
}

export interface InstagramInsights {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const META_GRAPH_VERSION = 'v21.0';
const META_BASE_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

// ============================================================================
// INSTAGRAM PUBLISHER
// ============================================================================

export const instagramPublisher = {

  /**
   * Create a media container (Step 1 of publishing)
   * Returns a container ID that can be used for publishing
   */
  async createMediaContainer(request: PublishRequest): Promise<string> {
    const connection = await metaOAuth.getConnection();
    if (!connection) throw new Error('Instagram not connected. Please connect your account first.');
    if (metaOAuth.isTokenExpired(connection.token)) throw new Error('Instagram token expired. Please reconnect.');

    const accessToken = connection.token.accessToken;

    switch (request.mediaType) {
      case 'FEED':
        return this.createFeedContainer(request, accessToken);
      case 'REEL':
        return this.createReelContainer(request, accessToken);
      case 'STORY':
        return this.createStoryContainer(request, accessToken);
      case 'CAROUSEL':
        return this.createCarouselContainer(request, accessToken);
      default:
        throw new Error(`Unsupported media type: ${request.mediaType}`);
    }
  },

  /**
   * Publish a previously created container (Step 2)
   */
  async publishContainer(igUserId: string, containerId: string): Promise<PublishResult> {
    const connection = await metaOAuth.getConnection();
    if (!connection) throw new Error('Instagram not connected');

    const response = await fetch(
      `${META_BASE_URL}/${igUserId}/media_publish?creation_id=${containerId}&access_token=${connection.token.accessToken}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Publishing failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      status: 'published',
      publishedAt: Date.now(),
    };
  },

  /**
   * Full publish flow: Create container + Publish
   */
  async publish(request: PublishRequest): Promise<PublishResult> {
    try {
      // Step 1: Create container
      const containerId = await this.createMediaContainer(request);
      
      // Step 2: Wait for container to be ready (Instagram needs time to process)
      const isReady = await this.waitForContainerReady(request.igUserId, containerId);
      if (!isReady) {
        throw new Error('Media container failed to process');
      }

      // Step 3: Publish
      const result = await this.publishContainer(request.igUserId, containerId);
      
      // Step 4: Get permalink
      if (result.id) {
        const permalink = await this.getPermalink(result.id, (await metaOAuth.getConnection())!.token.accessToken);
        result.permalink = permalink;
      }

      return result;
    } catch (error: any) {
      return {
        id: '',
        status: 'failed',
        error: error.message,
      };
    }
  },

  /**
   * Get permalink for a published media item
   */
  async getPermalink(mediaId: string, accessToken: string): Promise<string> {
    try {
      const response = await fetch(
        `${META_BASE_URL}/${mediaId}?fields=permalink&access_token=${accessToken}`
      );
      if (response.ok) {
        const data = await response.json();
        return data.permalink || '';
      }
      return '';
    } catch {
      return '';
    }
  },

  /**
   * Get insights for a media item
   */
  async getMediaInsights(mediaId: string): Promise<InstagramInsights | null> {
    const connection = await metaOAuth.getConnection();
    if (!connection) return null;

    try {
      const response = await fetch(
        `${META_BASE_URL}/${mediaId}/insights?metric=impressions,reach,likes,comments,shares,saves&access_token=${connection.token.accessToken}`
      );

      if (!response.ok) return null;

      const data = await response.json();
      const metrics: Record<string, number> = {};
      
      for (const item of data.data || []) {
        metrics[item.name] = item.values?.[0]?.value || 0;
      }

      const reach = metrics.reach || 0;
      const likes = metrics.likes || 0;
      const comments = metrics.comments || 0;
      const shares = metrics.shares || 0;
      const saves = metrics.saves || 0;

      return {
        impressions: metrics.impressions || 0,
        reach,
        likes,
        comments,
        shares,
        saves,
        engagementRate: reach > 0 ? ((likes + comments + shares + saves) / reach) * 100 : 0,
      };
    } catch {
      return null;
    }
  },

  /**
   * Get account-level insights
   */
  async getAccountInsights(igUserId: string, period: 'day' | 'week' | 'days_28' = 'week'): Promise<{
    followers: number;
    impressions: number;
    reach: number;
    profileViews: number;
    emailContacts: number;
  } | null> {
    const connection = await metaOAuth.getConnection();
    if (!connection) return null;

    try {
      const response = await fetch(
        `${META_BASE_URL}/${igUserId}/insights?metric=follower_count,impressions,reach,profile_views,email_contacts&period=${period}&access_token=${connection.token.accessToken}`
      );

      if (!response.ok) return null;

      const data = await response.json();
      const metrics: Record<string, number> = {};
      
      for (const item of data.data || []) {
        const values = item.values || [];
        metrics[item.name] = values.length > 0 ? values[values.length - 1].value : 0;
      }

      return {
        followers: metrics.follower_count || 0,
        impressions: metrics.impressions || 0,
        reach: metrics.reach || 0,
        profileViews: metrics.profile_views || 0,
        emailContacts: metrics.email_contacts || 0,
      };
    } catch {
      return null;
    }
  },

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Create feed post container
   */
  async createFeedContainer(request: PublishRequest, accessToken: string): Promise<string> {
    const params: Record<string, string> = {
      image_url: request.mediaUrls[0],  // Must be publicly accessible URL
      caption: `${request.caption}${request.hashtags?.length ? '\n.\n.\n' + request.hashtags.join(' ') : ''}`,
      access_token: accessToken,
    };

    if (request.altText) {
      params.alt_text = request.altText;
    }

    const response = await fetch(
      `${META_BASE_URL}/${request.igUserId}/media?${new URLSearchParams(params)}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Feed container creation failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  },

  /**
   * Create reel container
   */
  async createReelContainer(request: PublishRequest, accessToken: string): Promise<string> {
    const params: Record<string, string> = {
      media_type: 'REELS',
      video_url: request.mediaUrls[0],
      caption: `${request.caption}${request.hashtags?.length ? '\n.\n.\n' + request.hashtags.join(' ') : ''}`,
      access_token: accessToken,
    };

    if (request.shareToFeed) {
      params.share_to_feed = 'true';
    }

    const response = await fetch(
      `${META_BASE_URL}/${request.igUserId}/media?${new URLSearchParams(params)}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Reel container creation failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  },

  /**
   * Create story container
   */
  async createStoryContainer(request: PublishRequest, accessToken: string): Promise<string> {
    const params: Record<string, string> = {
      media_type: 'STORIES',
      image_url: request.mediaUrls[0],
      access_token: accessToken,
    };

    const response = await fetch(
      `${META_BASE_URL}/${request.igUserId}/media?${new URLSearchParams(params)}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Story container creation failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  },

  /**
   * Create carousel container
   */
  async createCarouselContainer(request: PublishRequest, accessToken: string): Promise<string> {
    // Step 1: Create individual media items
    const childrenIds: string[] = [];
    
    for (const url of request.mediaUrls.slice(0, 10)) {  // Max 10 carousel items
      const params = new URLSearchParams({
        image_url: url,
        is_carousel_item: 'true',
        access_token: accessToken,
      });

      const response = await fetch(
        `${META_BASE_URL}/${request.igUserId}/media?${params}`,
        { method: 'POST' }
      );

      if (!response.ok) continue;
      const data = await response.json();
      childrenIds.push(data.id);
    }

    if (childrenIds.length === 0) {
      throw new Error('Failed to create any carousel items');
    }

    // Step 2: Create carousel container
    const params = new URLSearchParams({
      media_type: 'CAROUSEL',
      children: JSON.stringify(childrenIds),
      caption: `${request.caption}${request.hashtags?.length ? '\n.\n.\n' + request.hashtags.join(' ') : ''}`,
      access_token: accessToken,
    });

    const response = await fetch(
      `${META_BASE_URL}/${request.igUserId}/media?${params}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Carousel container creation failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  },

  /**
   * Wait for container to be ready for publishing
   * Instagram processes media asynchronously
   */
  async waitForContainerReady(igUserId: string, containerId: string, maxAttempts: number = 30): Promise<boolean> {
    const connection = await metaOAuth.getConnection();
    if (!connection) return false;

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(
          `${META_BASE_URL}/${containerId}?fields=status_code&access_token=${connection.token.accessToken}`
        );

        if (!response.ok) continue;

        const data = await response.json();
        
        if (data.status_code === 'FINISHED') return true;
        if (data.status_code === 'ERROR') return false;

        // Wait 3 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    return false;  // Timeout
  },
};