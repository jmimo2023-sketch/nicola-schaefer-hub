/**
 * Supabase Storage Service for assets (images, videos, templates)
 * No Google dependencies - uses Supabase directly
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

export interface UploadResult {
  id: string;
  name: string;
  url: string;
  publicUrl: string;
  mimeType: string;
  size: number;
  bucket: string;
  folder: string;
}

export interface Asset {
  id: string;
  name: string;
  url: string;
  publicUrl: string;
  mimeType: string;
  size: number;
  folder: 'images' | 'videos' | 'templates';
  createdAt: string;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadAsset(
  file: File,
  folder: 'images' | 'videos' | 'templates' = 'images'
): Promise<UploadResult> {
  const client = getSupabase();
  const bucket = 'nicola-assets';

  // Generate unique filename
  const timestamp = Date.now();
  const ext = file.name.split('.').pop() || '';
  const fileName = `${folder}/${timestamp}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

  const { data, error } = await client.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Build public URL directly
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`;

  return {
    id: data.id || fileName,
    name: file.name,
    url: publicUrl,
    publicUrl,
    mimeType: file.type,
    size: file.size,
    bucket,
    folder,
  };
}

/**
 * List assets from a folder
 */
export async function listAssets(
  folder: 'images' | 'videos' | 'templates' = 'images'
): Promise<Asset[]> {
  const client = getSupabase();
  const bucket = 'nicola-assets';

  const { data, error } = await client.storage
    .from(bucket)
    .list(folder, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    throw new Error(`List failed: ${error.message}`);
  }

  // Get the public URL base
  const publicUrlBase = `${SUPABASE_URL}/storage/v1/object/public/${bucket}`;

  return (data || [])
    .filter(file => file.id && !file.name.startsWith('.'))
    .map(file => ({
      id: file.id,
      name: file.name,
      url: `${publicUrlBase}/${folder}/${file.name}`,
      publicUrl: `${publicUrlBase}/${folder}/${file.name}`,
      mimeType: file.metadata?.mimetype || 'application/octet-stream',
      size: file.metadata?.size || 0,
      folder,
      createdAt: file.created_at || new Date().toISOString(),
    }));
}

/**
 * Delete an asset
 */
export async function deleteAsset(
  folder: 'images' | 'videos' | 'templates',
  fileName: string
): Promise<void> {
  const client = getSupabase();
  const bucket = 'nicola-assets';

  const fullPath = `${folder}/${fileName}`;

  const { error } = await client.storage.from(bucket).remove([fullPath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Get a signed URL for private assets (if needed)
 */
export async function getSignedUrl(
  folder: string,
  fileName: string
): Promise<string> {
  const client = getSupabase();
  const bucket = 'nicola-assets';

  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(`${folder}/${fileName}`, 3600);

  if (error) {
    throw new Error(`Signed URL failed: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}