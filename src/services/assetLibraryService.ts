/**
 * Asset Library Service — Real Supabase + Firestore integration
 * Manages media assets with metadata, search, and organization
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ============================================================================
// TYPES
// ============================================================================

export type AssetType = 'image' | 'video' | 'template' | 'design';
export type ContentPillar = 'emotional_mastery' | 'systematic_method' | 'valley_experience' | 'transformation' | 'community';
export type AssetStatus = 'draft' | 'approved' | 'archived';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  folder: string;
  url: string;          // Supabase public URL
  thumbnailUrl?: string; // Smaller preview
  size: number;          // bytes
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;     // seconds, for videos
  pillar?: ContentPillar;
  tags: string[];
  status: AssetStatus;
  authorId: string;
  createdAt: number;     // timestamp
  updatedAt: number;
  usageCount: number;    // how many times used in posts
  metadata?: Record<string, unknown>; // extra data
}

export interface AssetFolder {
  id: string;
  name: string;
  parentId?: string;
  type: AssetType;
  count: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'nicola-assets';

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

// ============================================================================
// ASSET LIBRARY SERVICE
// ============================================================================

export const assetLibrary = {

  /**
   * Upload a file to Supabase Storage and create metadata in Firestore
   */
  async upload(
    file: File,
    folder: string = 'images',
    metadata?: Partial<Asset>,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Asset | null> {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('Supabase not configured. Asset upload unavailable.');
      return null;
    }

    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Must be authenticated to upload assets');

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${folder}/${timestamp}_${sanitizedName}`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    // Determine asset type
    const assetType: AssetType = file.type.startsWith('video/') ? 'video' 
      : file.type.includes('svg') || file.type.includes('design') ? 'design' 
      : 'image';

    // Get image dimensions if it's an image
    let width: number | undefined, height: number | undefined;
    if (assetType === 'image') {
      const dims = await getImageDimensions(file);
      width = dims.width;
      height = dims.height;
    }

    // Create Firestore metadata document
    const assetDoc = doc(collection(db, 'assets'));
    const asset: Asset = {
      id: assetDoc.id,
      name: file.name,
      type: assetType,
      folder,
      url: publicUrl,
      size: file.size,
      mimeType: file.type,
      width,
      height,
      pillar: metadata?.pillar,
      tags: metadata?.tags || [],
      status: metadata?.status || 'approved',
      authorId: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
      metadata: metadata?.metadata,
    };

    await setDoc(assetDoc, asset);
    return asset;
  },

  /**
   * List all assets with optional filters
   */
  async list(filters?: {
    type?: AssetType;
    folder?: string;
    pillar?: ContentPillar;
    tags?: string[];
    status?: AssetStatus;
    search?: string;
  }): Promise<Asset[]> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    let q = query(collection(db, 'assets'), where('authorId', '==', userId), orderBy('createdAt', 'desc'));

    if (filters?.type) q = query(q, where('type', '==', filters.type));
    if (filters?.folder) q = query(q, where('folder', '==', filters.folder));
    if (filters?.pillar) q = query(q, where('pillar', '==', filters.pillar));
    if (filters?.status) q = query(q, where('status', '==', filters.status));

    const snapshot = await getDocs(q);
    let assets = snapshot.docs.map(d => d.data() as Asset);

    // Client-side search filter
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      assets = assets.filter(a => 
        a.name.toLowerCase().includes(searchLower) ||
        a.tags.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    // Client-side tag filter
    if (filters?.tags && filters.tags.length > 0) {
      assets = assets.filter(a => 
        filters.tags!.some(t => a.tags.includes(t))
      );
    }

    return assets;
  },

  /**
   * Get a single asset by ID
   */
  async get(assetId: string): Promise<Asset | null> {
    const snapshot = await getDoc(doc(db, 'assets', assetId));
    return snapshot.exists() ? (snapshot.data() as Asset) : null;
  },

  /**
   * Update asset metadata
   */
  async update(assetId: string, updates: Partial<Asset>): Promise<void> {
    await updateDoc(doc(db, 'assets', assetId), {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  /**
   * Delete asset from Supabase Storage and Firestore
   */
  async delete(asset: Asset): Promise<void> {
    const supabase = getSupabase();
    
    // Delete from Supabase
    if (supabase) {
      const storagePath = asset.url.split(`/${BUCKET}/`)[1];
      if (storagePath) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
      }
    }

    // Delete from Firestore
    await deleteDoc(doc(db, 'assets', asset.id));
  },

  /**
   * Increment usage count (when asset is used in a post)
   */
  async incrementUsage(assetId: string): Promise<void> {
    const asset = await this.get(assetId);
    if (asset) {
      await this.update(assetId, { usageCount: asset.usageCount + 1 });
    }
  },

  /**
   * Subscribe to real-time asset updates
   */
  subscribe(
    filters: { type?: AssetType; folder?: string } = {},
    callback: (assets: Asset[]) => void
  ): () => void {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) return () => {};

    let q = query(collection(db, 'assets'), where('authorId', '==', userId), orderBy('createdAt', 'desc'));
    if (filters.type) q = query(q, where('type', '==', filters.type));
    if (filters.folder) q = query(q, where('folder', '==', filters.folder));

    return onSnapshot(q, (snapshot) => {
      const assets = snapshot.docs.map(d => d.data() as Asset);
      callback(assets);
    });
  },

  /**
   * Get folders with counts
   */
  async getFolders(): Promise<AssetFolder[]> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    const q = query(collection(db, 'assets'), where('authorId', '==', userId));
    const snapshot = await getDocs(q);
    const assets = snapshot.docs.map(d => d.data() as Asset);

    // Group by folder
    const folderMap = new Map<string, { type: AssetType; count: number }>();
    for (const asset of assets) {
      const existing = folderMap.get(asset.folder);
      if (existing) {
        existing.count++;
      } else {
        folderMap.set(asset.folder, { type: asset.type, count: 1 });
      }
    }

    return Array.from(folderMap.entries()).map(([name, data]) => ({
      id: name,
      name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      type: data.type,
      count: data.count,
    }));
  },

  /**
   * Check if Supabase is configured
   */
  isConfigured(): boolean {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}