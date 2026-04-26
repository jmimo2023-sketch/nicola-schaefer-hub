/**
 * Content Studio Panel v2
 * Uses Supabase Storage for assets (no Google dependencies)
 * Supports images and videos with drag-and-drop upload
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
  Palette,
  FolderOpen,
  RefreshCw,
  X,
  Film,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useFirebase } from '../lib/FirebaseProvider';
import { initCanva, createDesignWithMedia } from '../services/canvaService';
import {
  uploadAsset,
  listAssets,
  deleteAsset,
  isSupabaseConfigured,
  Asset
} from '../services/supabaseService';

interface StudioPanelProps {
  onNavigate?: (tab: string) => void;
}

type AssetType = 'images' | 'videos' | 'templates';
type FilterType = 'all' | 'images' | 'videos';

export function StudioPanel({ onNavigate }: StudioPanelProps) {
  const { user, isTestMode } = useFirebase();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [folder, setFolder] = useState<AssetType>('images');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseReady, setSupabaseReady] = useState(false);

  // Initialize Canva
  useEffect(() => {
    initCanva().catch(console.error);
  }, []);

  // Check Supabase configuration
  useEffect(() => {
    setSupabaseReady(isSupabaseConfigured());
    if (!isSupabaseConfigured()) {
      toast.error('Supabase not configured', {
        description: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
      });
    }
  }, []);

  // Load assets when folder changes
  const loadAssets = useCallback(async () => {
    if (!supabaseReady) return;
    setIsLoading(true);
    try {
      const data = await listAssets(folder);
      setAssets(data);
    } catch (err: any) {
      console.error('Load assets error:', err);
      toast.error('Failed to load assets', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [folder, supabaseReady]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  // Filter assets
  useEffect(() => {
    if (filter === 'all') {
      setFilteredAssets(assets);
    } else {
      setFilteredAssets(assets.filter(a =>
        filter === 'videos'
          ? a.mimeType.startsWith('video/')
          : a.mimeType.startsWith('image/')
      ));
    }
  }, [assets, filter]);

  // Handle file upload via drag-and-drop
  const handleFileUpload = async (file: File) => {
    if (!user) return;

    const assetFolder: AssetType = file.type.startsWith('video/')
      ? 'videos'
      : file.type.startsWith('image/')
        ? 'images'
        : 'images';

    setIsUploading(true);
    try {
      await uploadAsset(file, assetFolder);
      toast.success('File uploaded successfully!');
      await loadAssets();
    } catch (err: any) {
      toast.error('Upload failed', { description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  // Dropzone setup
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleFileUpload(acceptedFiles[0]);
      }
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    },
    multiple: false,
    disabled: isUploading || !supabaseReady,
  });

  // Handle edit with Canva
  const handleEdit = async (asset: Asset) => {
    try {
      await createDesignWithMedia(asset.publicUrl);
    } catch (err) {
      console.error('Canva error:', err);
      toast.error('Failed to open Canva editor');
    }
  };

  // Handle delete
  const handleDelete = async (asset: Asset) => {
    if (!confirm(`Delete "${asset.name}"?`)) return;

    try {
      // Extract filename from path
      const fileName = asset.name.split('/').pop() || asset.name;
      await deleteAsset(asset.folder, fileName);
      toast.success('Asset deleted');
      await loadAssets();
    } catch (err: any) {
      toast.error('Delete failed', { description: err.message });
    }
  };

  // Check if file is video
  const isVideo = (mimeType: string) => mimeType.startsWith('video/');

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="text-center md:text-left">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-4 font-mono">
            CONTENT_STUDIO_V2.0
          </div>
          <h2 className="font-display text-5xl font-semibold mb-4 leading-tight tracking-tight">
            Content Studio
          </h2>
          <p className="text-sm text-ink-muted max-w-xl font-medium leading-relaxed font-sans">
            Upload images and videos from your computer. Edit with Canva. All stored in Supabase.
          </p>
        </div>

        {/* Status */}
        <div className="flex flex-col items-center md:items-end gap-2">
          <div className={cn(
            "text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full border",
            supabaseReady
              ? "text-green-custom bg-green-light border-green-custom/20"
              : "text-rose-500 bg-rose-50 border-rose-100"
          )}>
            {supabaseReady ? 'SUPABASE_READY' : 'SUPABASE_NOT_CONFIGURED'}
          </div>
        </div>
      </header>

      {/* Folder Tabs */}
      <div className="flex gap-2 border-b border-brd pb-4">
        {(['images', 'videos', 'templates'] as AssetType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFolder(f)}
            className={cn(
              "px-6 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2",
              folder === f
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "bg-card border border-brd text-ink-muted hover:border-accent hover:text-accent"
            )}
          >
            {f === 'images' && <ImageIcon size={14} />}
            {f === 'videos' && <Video size={14} />}
            {f === 'templates' && <Layers size={14} />}
            {f}
          </button>
        ))}
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200",
          isDragActive && !isDragReject && "border-accent bg-accent/5 scale-[1.01]",
          isDragReject && "border-red-500 bg-red-50",
          !isDragActive && !isDragReject && "border-brd hover:border-accent hover:bg-accent/5",
          (isUploading || !supabaseReady) && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          {isUploading ? (
            <>
              <RefreshCw className="w-12 h-12 text-accent animate-spin" />
              <p className="text-sm font-medium text-accent">Uploading...</p>
            </>
          ) : isDragActive ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                {isDragReject ? (
                  <X className="w-8 h-8 text-red-500" />
                ) : (
                  <Upload className="w-8 h-8 text-accent" />
                )}
              </div>
              <p className="text-sm font-medium text-accent">
                {isDragReject ? "File type not supported" : "Drop file here"}
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-brd flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-ink-muted" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  Supports: JPG, PNG, GIF, WEBP, MP4, MOV, AVI
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'images', 'videos'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all",
              filter === f
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "bg-card border border-brd text-ink-muted hover:border-accent"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Assets Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="py-20 border-2 border-dashed border-brd rounded-custom flex flex-col items-center justify-center text-ink-muted gap-4">
          <FolderOpen size={48} />
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest">
            No {filter === 'all' ? folder : filter} yet
          </p>
          <p className="text-xs">Upload something to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-card border border-brd p-4 rounded-custom hover:shadow-custom transition-all group relative flex flex-col"
            >
              {/* Thumbnail */}
              <div className="aspect-square bg-paper rounded-2xl mb-4 overflow-hidden relative flex items-center justify-center border border-brd">
                {isVideo(asset.mimeType) ? (
                  <>
                    <Video className="w-12 h-12 text-ink-muted" />
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] px-2 py-1 rounded font-mono">
                      VIDEO
                    </div>
                  </>
                ) : (
                  <img
                    src={asset.publicUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-accent/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                  {!isVideo(asset.mimeType) && (
                    <button
                      onClick={() => handleEdit(asset)}
                      className="p-3 bg-white text-accent rounded-full hover:scale-110 transition-transform shadow-xl"
                      title="Edit with Canva"
                    >
                      <Palette size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(asset)}
                    className="p-3 bg-white text-rose-500 rounded-full hover:scale-110 transition-transform shadow-xl"
                    title="Delete"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-ink truncate" title={asset.name}>
                  {asset.name.split('/').pop()}
                </h4>
                <p className="text-[9px] text-ink-muted font-mono uppercase tracking-widest">
                  {asset.mimeType.split('/')[1]} • {formatBytes(asset.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Backward compatibility
export default StudioPanel;