/**
 * Content Studio Panel v2.1
 * Uses Supabase Storage for assets (no Google dependencies)
 * Supports images and videos with drag-and-drop upload
 * Integrated with Canva for design editing
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
  Layers,
  Check,
  Sparkles,
  FileVideo,
  Plus,
  Wand2,
  ImagePlus,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useFirebase } from '../lib/FirebaseProvider';
import {
  initCanva,
  createDesignWithMedia,
  createDesignWithCanvaAssets,
  createBrandedDesign,
  isCanvaAvailable,
  BRAND_CONFIG,
  DesignType,
  getDesignTypes,
  PublishedDesign
} from '../services/canvaService';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDesignModal, setShowDesignModal] = useState(false);
  const [selectedDesignType, setSelectedDesignType] = useState<DesignType>('instagram_post');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [canvaReady, setCanvaReady] = useState(false);

  // Initialize Canva
  useEffect(() => {
    const init = async () => {
      try {
        await initCanva();
        setCanvaReady(isCanvaAvailable());
      } catch (err) {
        console.error('Canva init error:', err);
        setCanvaReady(false);
      }
    };
    init();
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

  // Open design type selector
  const handleEdit = async (asset: Asset) => {
    setSelectedAsset(asset);
    setShowDesignModal(true);
  };

  // Start creating a new design directly in Canva
  const handleCreateNew = () => {
    setShowCreateModal(true);
  };

  // Start editing with selected design type
  const startEditing = async (designType: DesignType, assetUrl?: string) => {
    setShowDesignModal(false);
    setShowCreateModal(false);

    if (!canvaReady) {
      toast.error('Canva not available. Check API key configuration.');
      return;
    }

    try {
      await createDesignWithMedia(
        assetUrl || '',
        designType,
        {
          title: assetUrl ? `Edit - ${designType}` : `New - ${designType}`,
          onPublish: (design: PublishedDesign) => {
            toast.success('Design published!', {
              description: 'Your design has been saved to Canva.',
              duration: 5000,
            });
          }
        }
      );
    } catch (err) {
      console.error('Canva error:', err);
      toast.error('Failed to open Canva editor');
    }
  };

  // Open Canva with built-in image picker (browse Canva library)
  const handleBrowseCanvaAssets = async (designType: DesignType) => {
    setShowDesignModal(false);
    setShowCreateModal(false);

    if (!canvaReady) {
      toast.error('Canva not available. Check API key configuration.');
      return;
    }

    try {
      await createDesignWithCanvaAssets(designType, {
        title: `Design from Canva - ${designType}`,
        onPublish: (design: PublishedDesign) => {
          toast.success('Design created from Canva assets!', {
            description: 'Your design has been exported.',
            duration: 5000,
          });
        },
      });
    } catch (err) {
      console.error('Canva error:', err);
      toast.error('Failed to open Canva');
    }
  };

  // Handle delete
  const handleDelete = async (asset: Asset) => {
    if (!confirm(`Delete "${asset.name}"?`)) return;

    try {
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

  const designTypes = getDesignTypes().filter(dt =>
    ['instagram_post', 'instagram_story', 'instagram_reel', 'youtube_thumbnail', 'youtube_shorts', 'facebook_post', 'linkedin_post'].includes(dt.id)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="text-center md:text-left">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-4 font-mono">
            CONTENT_STUDIO_V2.1
          </div>
          <h2 className="font-display text-5xl font-semibold mb-4 leading-tight tracking-tight">
            Content Studio
          </h2>
          <p className="text-sm text-ink-muted max-w-xl font-medium leading-relaxed font-sans">
            Upload assets or create directly in Canva. Edit images and videos.
          </p>
        </div>

        {/* Status */}
        <div className="flex flex-col items-center md:items-end gap-2">
          <div className="flex gap-2">
            <div className={cn(
              "text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full border",
              supabaseReady
                ? "text-green-custom bg-green-light border-green-custom/20"
                : "text-rose-500 bg-rose-50 border-rose-100"
            )}>
              {supabaseReady ? 'SUPABASE_READY' : 'STORAGE_OFF'}
            </div>
            <div className={cn(
              "text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full border",
              canvaReady
                ? "text-accent bg-accent/10 border-accent/20"
                : "text-rose-500 bg-rose-50 border-rose-100"
            )}>
              {canvaReady ? 'CANVA_READY' : 'CANVA_OFF'}
            </div>
          </div>
        </div>
      </header>

      {/* Quick Entry - 3 Main Actions */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4 font-mono">Start Creating</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Upload */}
          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*,video/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFileUpload(file);
              };
              input.click();
            }}
            disabled={isUploading || !supabaseReady}
            className="group bg-card border border-brd rounded-2xl p-8 text-left hover:shadow-custom hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
              <Upload size={28} className="text-accent" />
            </div>
            <h4 className="font-display text-xl font-bold mb-2">Upload Media</h4>
            <p className="text-sm text-ink-muted">Upload photos and videos from your device</p>
            <div className="mt-4 flex items-center gap-2 text-accent text-xs font-bold">
              <span>Browse files</span>
              <ChevronRight size={14} />
            </div>
          </button>

          {/* Create in Canva */}
          <button
            onClick={handleCreateNew}
            disabled={!canvaReady}
            className="group bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8 text-left hover:shadow-custom hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Palette size={28} className="text-white" />
            </div>
            <h4 className="font-display text-xl font-bold mb-2">Create Design</h4>
            <p className="text-sm text-ink-muted">Design posts, stories and reels with Canva</p>
            <div className="mt-4 flex items-center gap-2 text-purple-500 text-xs font-bold">
              <span>Open Canva</span>
              <ChevronRight size={14} />
            </div>
          </button>

          {/* AI Generate */}
          <button
            onClick={() => onNavigate?.('generator')}
            disabled={false}
            className="group bg-gradient-to-br from-amber-500/10 to-green-500/10 border border-amber-500/20 rounded-2xl p-8 text-left hover:shadow-custom hover:-translate-y-1 transition-all"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-green-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sparkles size={28} className="text-white" />
            </div>
            <h4 className="font-display text-xl font-bold mb-2">AI Generate</h4>
            <p className="text-sm text-ink-muted">Generate captions and scripts with AI</p>
            <div className="mt-4 flex items-center gap-2 text-amber-600 text-xs font-bold">
              <span>Try AI</span>
              <ChevronRight size={14} />
            </div>
          </button>
        </div>
      </section>

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

      {/* Canva Assets Button */}
      <div className="flex items-center gap-4 p-6 bg-accent/5 border border-accent/20 rounded-2xl">
        <div className="flex-1">
          <h4 className="text-sm font-bold text-ink flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            Create with Canva
          </h4>
          <p className="text-xs text-ink-muted mt-1">
            Browse thousands of images, templates, and graphics from Canva's library
          </p>
        </div>
        <button
          onClick={() => handleBrowseCanvaAssets('instagram_post')}
          disabled={!canvaReady}
          className={cn(
            "px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2",
            canvaReady
              ? "bg-accent text-white hover:bg-accent/90 shadow-lg"
              : "bg-brd text-ink-muted cursor-not-allowed"
          )}
        >
          <ImagePlus size={16} />
          Browse Canva Library
        </button>
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
          <p className="text-xs">Upload something or create directly in Canva</p>
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
                  <button
                    onClick={() => handleEdit(asset)}
                    className="p-3 bg-white text-accent rounded-full hover:scale-110 transition-transform shadow-xl"
                    title="Edit with Canva"
                  >
                    {isVideo(asset.mimeType) ? <FileVideo size={20} /> : <Palette size={20} />}
                  </button>
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

      {/* Create New Design Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-brd rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-ink">Create New Design</h3>
                  <p className="text-xs text-ink-muted">Start from scratch in Canva</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-brd rounded-lg transition-colors"
              >
                <X size={20} className="text-ink-muted" />
              </button>
            </div>

            {/* Design Type Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {designTypes.map((dt) => (
                <button
                  key={dt.id}
                  onClick={() => startEditing(dt.id)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all hover:border-accent hover:bg-accent/5"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {dt.id.includes('story') || dt.id.includes('reel') ? (
                      <Video size={14} className="text-accent" />
                    ) : dt.id.includes('youtube') ? (
                      <Film size={14} className="text-accent" />
                    ) : (
                      <ImageIcon size={14} className="text-accent" />
                    )}
                    <span className="text-xs font-bold text-ink">{dt.label}</span>
                  </div>
                  <p className="text-[10px] text-ink-muted">
                    {dt.id === 'instagram_post' && '1080 × 1080'}
                    {dt.id === 'instagram_story' && '1080 × 1920'}
                    {dt.id === 'instagram_reel' && '1080 × 1920'}
                    {dt.id === 'youtube_thumbnail' && '1280 × 720'}
                    {dt.id === 'youtube_shorts' && '1080 × 1920'}
                    {dt.id === 'facebook_post' && '1200 × 630'}
                    {dt.id === 'linkedin_post' && '1200 × 627'}
                  </p>
                </button>
              ))}
            </div>

            {/* Brand Colors */}
            <div className="border-t border-brd pt-4">
              <p className="text-xs font-bold text-ink-muted mb-3">BRAND COLORS</p>
              <div className="flex gap-2">
                <div
                  className="w-8 h-8 rounded-lg border border-brd"
                  style={{ backgroundColor: BRAND_CONFIG.colors.primary }}
                  title="Primary Green"
                />
                <div
                  className="w-8 h-8 rounded-lg border border-brd"
                  style={{ backgroundColor: BRAND_CONFIG.colors.secondary }}
                  title="Secondary Orange"
                />
                <div
                  className="w-8 h-8 rounded-lg border border-brd"
                  style={{ backgroundColor: BRAND_CONFIG.colors.background }}
                  title="Background"
                />
                <div
                  className="w-8 h-8 rounded-lg border border-brd"
                  style={{ backgroundColor: BRAND_CONFIG.colors.text }}
                  title="Text"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Existing Asset Modal */}
      {showDesignModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-brd rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <Palette className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-ink">Edit in Canva</h3>
                  <p className="text-xs text-ink-muted">{selectedAsset.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDesignModal(false)}
                className="p-2 hover:bg-brd rounded-lg transition-colors"
              >
                <X size={20} className="text-ink-muted" />
              </button>
            </div>

            {/* Asset Preview */}
            <div className="mb-6 p-4 bg-paper rounded-xl border border-brd">
              {isVideo(selectedAsset.mimeType) ? (
                <div className="flex items-center gap-3">
                  <Video className="w-8 h-8 text-accent" />
                  <span className="text-sm font-medium text-ink">Video file selected</span>
                </div>
              ) : (
                <img
                  src={selectedAsset.publicUrl}
                  alt={selectedAsset.name}
                  className="w-full max-h-48 object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Design Type Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {designTypes.map((dt) => (
                <button
                  key={dt.id}
                  onClick={() => startEditing(dt.id, selectedAsset.publicUrl)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all hover:border-accent hover:bg-accent/5"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {dt.id.includes('story') || dt.id.includes('reel') ? (
                      <Video size={14} className="text-accent" />
                    ) : dt.id.includes('youtube') ? (
                      <Film size={14} className="text-accent" />
                    ) : (
                      <ImageIcon size={14} className="text-accent" />
                    )}
                    <span className="text-xs font-bold text-ink">{dt.label}</span>
                  </div>
                  <p className="text-[10px] text-ink-muted">
                    {dt.id === 'instagram_post' && '1080 × 1080'}
                    {dt.id === 'instagram_story' && '1080 × 1920'}
                    {dt.id === 'instagram_reel' && '1080 × 1920'}
                    {dt.id === 'youtube_thumbnail' && '1280 × 720'}
                    {dt.id === 'youtube_shorts' && '1080 × 1920'}
                    {dt.id === 'facebook_post' && '1200 × 630'}
                    {dt.id === 'linkedin_post' && '1200 × 627'}
                  </p>
                </button>
              ))}
            </div>

            {/* Brand Colors */}
            <div className="border-t border-brd pt-4">
              <p className="text-xs font-bold text-ink-muted mb-3">BRAND COLORS</p>
              <div className="flex gap-2">
                <div
                  className="w-8 h-8 rounded-lg border border-brd"
                  style={{ backgroundColor: BRAND_CONFIG.colors.primary }}
                  title="Primary Green"
                />
                <div
                  className="w-8 h-8 rounded-lg border border-brd"
                  style={{ backgroundColor: BRAND_CONFIG.colors.secondary }}
                  title="Secondary Orange"
                />
                <div
                  className="w-8 h-8 rounded-lg border border-brd"
                  style={{ backgroundColor: BRAND_CONFIG.colors.background }}
                  title="Background"
                />
                <div
                  className="w-8 h-8 rounded-lg border border-brd"
                  style={{ backgroundColor: BRAND_CONFIG.colors.text }}
                  title="Text"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDesignModal(false)}
                className="flex-1 px-4 py-3 border border-brd rounded-xl text-sm font-bold text-ink-muted hover:bg-brd transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => startEditing(selectedDesignType, selectedAsset.publicUrl)}
                className="flex-1 px-4 py-3 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
              >
                <Palette size={16} />
                Open in Canva
              </button>
            </div>
          </div>
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