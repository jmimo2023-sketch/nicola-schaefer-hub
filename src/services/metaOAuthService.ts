/**
 * Meta OAuth Service — Instagram/Meta authentication flow
 * Handles OAuth 2.0 authorization, token exchange, and refresh
 * 
 * Required env vars:
 * - VITE_META_APP_ID
 * - VITE_META_APP_SECRET (server-side only, not in Vite)
 * - META_REDIRECT_URI (server-side)
 * 
 * Flow: User clicks Connect → Meta OAuth → Callback → Token Exchange → Store in Firestore
 */

import { db } from './firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ============================================================================
// TYPES
// ============================================================================

export interface MetaToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;      // seconds until expiration
  expiresAt: number;       // timestamp when token expires
  refreshToken?: string;
  scope: string;
  userId: string;           // Meta user ID
  userName?: string;        // Meta user name
  userPicture?: string;     // profile picture URL
}

export interface InstagramAccount {
  id: string;
  username: string;
  name?: string;
  biography?: string;
  followersCount?: number;
  followsCount?: number;
  mediaCount?: number;
  profilePictureUrl?: string;
  isConnected: boolean;
  connectedAt?: number;
}

export interface MetaPagesResponse {
  data: Array<{
    id: string;
    name: string;
    access_token: string;
    category: string;
    instagram_business_account?: {
      id: string;
      username: string;
      name?: string;
      biography?: string;
      followers_count?: number;
      follows_count?: number;
      media_count?: number;
      profile_picture_url?: string;
    };
  }>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const META_APP_ID = import.meta.env.VITE_META_APP_ID || '';
const META_GRAPH_VERSION = 'v21.0';
const META_BASE_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
const META_AUTH_URL = 'https://www.facebook.com/v21.0/dialog/oauth';
const META_TOKEN_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`;

// Scopes needed for Instagram content management
const REQUIRED_SCOPES = [
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_comments',
  'instagram_manage_insights',
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
].join(',');

// ============================================================================
// META OAUTH SERVICE
// ============================================================================

export const metaOAuth = {

  /**
   * Get the OAuth authorization URL
   * User should be redirected to this URL to authorize the app
   */
  getAuthUrl(redirectUri: string, state?: string): string {
    if (!META_APP_ID) {
      throw new Error('VITE_META_APP_ID is not configured. Add it to your .env file.');
    }

    const params = new URLSearchParams({
      client_id: META_APP_ID,
      redirect_uri: redirectUri,
      scope: REQUIRED_SCOPES,
      response_type: 'code',
      ...(state && { state }),
    });

    return `${META_AUTH_URL}?${params.toString()}`;
  },

  /**
   * Exchange authorization code for access token
   * This should be called from a server endpoint (not client-side)
   * because it requires the app secret.
   */
  async exchangeCode(code: string, redirectUri: string): Promise<MetaToken> {
    // NOTE: This flow requires a backend/proxy. In production, use a Cloud Function
    // or Make.com webhook to exchange the code, since VITE_META_APP_SECRET
    // should NEVER be exposed on the client.
    
    const response = await fetch(
      `${META_TOKEN_URL}?${new URLSearchParams({
        client_id: META_APP_ID,
        client_secret: import.meta.env.VITE_META_APP_SECRET || '',
        redirect_uri: redirectUri,
        code,
      })}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta token exchange failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const token: MetaToken = {
      accessToken: data.access_token,
      tokenType: data.token_type || 'bearer',
      expiresIn: data.expires_in || 5184000, // default 60 days
      expiresAt: Date.now() + (data.expires_in || 5184000) * 1000,
      scope: data.scope || REQUIRED_SCOPES,
      userId: data.user_id || '',
    };

    return token;
  },

  /**
   * Get long-lived access token from a short-lived one
   * Again, this should ideally be done server-side
   */
  async getLongLivedToken(shortLivedToken: string): Promise<MetaToken> {
    const response = await fetch(
      `${META_TOKEN_URL}?${new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: META_APP_ID,
        client_secret: import.meta.env.VITE_META_APP_SECRET || '',
        fb_exchange_token: shortLivedToken,
      })}`
    );

    if (!response.ok) {
      throw new Error('Failed to exchange for long-lived token');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      tokenType: data.token_type || 'bearer',
      expiresIn: data.expires_in || 5184000,
      expiresAt: Date.now() + (data.expires_in || 5184000) * 1000,
      scope: REQUIRED_SCOPES,
      userId: '',
    };
  },

  /**
   * Get the user's Facebook Pages and linked Instagram Business accounts
   */
  async getPagesAndInstagram(accessToken: string): Promise<InstagramAccount[]> {
    try {
      // Get pages
      const pagesResponse = await fetch(
        `${META_BASE_URL}/me/accounts?fields=id,name,access_token,category,instagram_business_account{id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url}&access_token=${accessToken}`
      );

      if (!pagesResponse.ok) {
        throw new Error('Failed to fetch pages');
      }

      const pagesData: MetaPagesResponse = await pagesResponse.json();
      const accounts: InstagramAccount[] = [];

      for (const page of pagesData.data) {
        if (page.instagram_business_account) {
          const ig = page.instagram_business_account;
          accounts.push({
            id: ig.id,
            username: ig.username || '',
            name: ig.name,
            biography: ig.biography,
            followersCount: ig.followers_count,
            followsCount: ig.follows_count,
            mediaCount: ig.media_count,
            profilePictureUrl: ig.profile_picture_url,
            isConnected: true,
            connectedAt: Date.now(),
          });
        }
      }

      return accounts;
    } catch (error) {
      console.error('Failed to fetch Instagram accounts:', error);
      return [];
    }
  },

  /**
   * Save token and account to Firestore
   */
  async saveConnection(token: MetaToken, accounts: InstagramAccount[]): Promise<void> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    await setDoc(doc(db, 'meta_connections', userId), {
      token: {
        accessToken: token.accessToken,
        expiresAt: token.expiresAt,
        scope: token.scope,
        userId: token.userId,
      },
      accounts,
      updatedAt: Date.now(),
    }, { merge: true });
  },

  /**
   * Get stored connection from Firestore
   */
  async getConnection(): Promise<{ token: MetaToken; accounts: InstagramAccount[] } | null> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) return null;

    const snapshot = await getDoc(doc(db, 'meta_connections', userId));
    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    return {
      token: data.token as MetaToken,
      accounts: data.accounts as InstagramAccount[],
    };
  },

  /**
   * Subscribe to connection changes
   */
  subscribeToConnection(
    callback: (connection: { token: MetaToken; accounts: InstagramAccount[] } | null) => void
  ): () => void {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) return () => {};

    return onSnapshot(doc(db, 'meta_connections', userId), (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      const data = snapshot.data();
      callback({
        token: data.token as MetaToken,
        accounts: data.accounts as InstagramAccount[],
      });
    });
  },

  /**
   * Disconnect — remove token from Firestore
   */
  async disconnect(): Promise<void> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'meta_connections', userId));
  },

  /**
   * Check if token is expired and needs refresh
   */
  isTokenExpired(token: MetaToken): boolean {
    return Date.now() > token.expiresAt - 86400000; // 1 day buffer
  },

  /**
   * Check if Meta is configured
   */
  isConfigured(): boolean {
    return !!META_APP_ID;
  },
};