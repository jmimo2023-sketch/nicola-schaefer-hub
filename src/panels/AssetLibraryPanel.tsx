/**
 * AssetLibraryPanel v2 — Real asset library with upload, search, and organize
 * Connected to Supabase Storage + Firestore via assetLibraryService
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload, Search, Grid3x3, List, FolderOpen, Image, Film,
  FileText, Trash2, Download, Eye, MoreHorizontal, Plus,
  X, Check, Filter, SortAsc, SortDesc, Tag, Grid2x2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/TranslationContext';
import { assetLibrary, type Asset, type AssetType } from '../services/assetLibraryService';
import { useFirebase } from '../lib/FirebaseProvider';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'grid' | 'list';
type SortBy = 'newest' | 'oldest' | 'name' | 'size';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AssetLibraryPanel() {
  const { t, lang } = useTranslation();
  const { user } = useFirebase();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Load assets
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsub = assetLibrary.subscribe(
      filterType === 'all' ? {} : { type: filterType },
      (items) => {
        setAssets(items);
        setLoading(false);
      }
    );

    return unsub;
  }, [user, filterType]);

  // Filter and sort
  const filteredAssets = assets
    .filter(a => {
      if (search) {
        const s = search.toLowerCase();
        return a.name.toLowerCase().includes(s) || a.tags.some(t => t.toLowerCase().includes(s));
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest': return b.createdAt - a.createdAt;
        case 'oldest': return a.createdAt - b.createdAt;
        case 'name': return a.name.localeCompare(b.name);
        case 'size': return b.size - a.size;
        default: return 0;
      }
    });

  // Upload handler
  const handleUpload = useCallback(async (files: FileList | File[]) => {
    if (!assetLibrary.isConfigured()) {
      toast.error(lang === 'de' ? 'Supabase nicht konfiguriert' : lang === 'es' ? 'Supabase no configurado' : 'Supabase not configured');
      return;
    }

    setUploading(true);
    let successCount = 0;

    for (const file of Array.from(files)) {
      try {
        const asset = await assetLibrary.upload(file, `${file.type.startsWith('video/') ? 'videos' : 'images'}`);
        if (asset) successCount++;
      } catch (err: any) {
        toast.error(`${file.name}: ${err.message}`);
      }
    }

    if (successCount > 0) {
      toast.success(lang === 'de' ? `${successCount} Dateien hochgeladen` : lang === 'es' ? `${successCount} archivos subidos` : `${successCount} files uploaded`);
    }
    setUploading(false);
  }, [lang]);

  // Delete handler
  const handleDelete = useCallback(async (asset: Asset) => {
    if (!confirm(lang === 'de' ? `"${asset.name}" löschen?` : lang === 'es' ? `¿Eliminar "${asset.name}"?` : `Delete "${asset.name}"?`)) return;

    try {
      await assetLibrary.delete(asset);
      toast.success(lang === 'de' ? 'Gelöscht' : lang === 'es' ? 'Eliminado' : 'Deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [lang]);

  // Bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedAssets.size === 0) return;
    if (!confirm(lang === 'de' ? `${selectedAssets.size} Dateien löschen?` : lang === 'es' ? `¿Eliminar ${selectedAssets.size} archivos?` : `Delete ${selectedAssets.size} files?`)) return;

    for (const id of selectedAssets) {
      const asset = assets.find(a => a.id === id);
      if (asset) await assetLibrary.delete(asset);
    }
    setSelectedAssets(new Set());
  }, [selectedAssets, assets]);

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files);
  };

  const toggleSelect = (id: string) => {
    setSelectedAssets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const typeIcons: Record<string, React.ReactNode> = {
    image: <Image size={16} className="text-blue-400" />,
    video: <Film size={16} className="text-purple-400" />,
    template: <FileText size={16} className="text-green-400" />,
    design: <Grid2x2 size={16} className="text-amber-400" />,
  };

  const typeFilters: { key: AssetType | 'all'; label: string }[] = [
    { key: 'all', label: lang === 'de' ? 'Alle' : lang === 'es' ? 'Todos' : 'All' },
    { key: 'image', label: lang === 'de' ? 'Bilder' : lang === 'es' ? 'Imágenes' : 'Images' },
    { key: 'video', label: lang === 'de' ? 'Videos' : lang === 'es' ? 'Videos' : 'Videos' },
    { key: 'template', label: lang === 'de' ? 'Vorlagen' : lang === 'es' ? 'Plantillas' : 'Templates' },
    { key: 'design', label: lang === 'de' ? 'Designs' : lang === 'es' ? 'Diseños' : 'Designs' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-bold">
            {lang === 'de' ? 'Asset-Bibliothek' : lang === 'es' ? 'Biblioteca de Assets' : 'Asset Library'}
          </h2>
          <p className="text-sm text-ink-muted mt-1">
            {assets.length} {lang === 'de' ? 'Dateien' : lang === 'es' ? 'archivos' : 'files'}
            {selectedAssets.size > 0 && ` · ${selectedAssets.size} selected`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk actions */}
          {selectedAssets.size > 0 && (
            <button onClick={handleBulkDelete} className="px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-bold hover:bg-rose-500/20 transition-colors">
              <Trash2 size={14} className="inline mr-1" />
              {lang === 'de' ? 'Löschen' : lang === 'es' ? 'Eliminar' : 'Delete'} ({selectedAssets.size})
            </button>
          )}

          {/* View mode toggle */}
          <div className="flex bg-paper border border-brd rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={cn("px-2.5 py-1.5", viewMode === 'grid' ? 'bg-accent text-white' : 'text-ink-muted')}>
              <Grid3x3 size={14} />
            </button>
            <button onClick={() => setViewMode('list')} className={cn("px-2.5 py-1.5", viewMode === 'list' ? 'bg-accent text-white' : 'text-ink-muted')}>
              <List size={14} />
            </button>
          </div>

          {/* Upload button */}
          <label className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors cursor-pointer">
            <Plus size={14} />
            {lang === 'de' ? 'Hochladen' : lang === 'es' ? 'Subir' : 'Upload'}
            <input type="file" multiple className="hidden" onChange={e => e.target.files && handleUpload(e.target.files)} />
          </label>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={lang === 'de' ? 'Suchen...' : lang === 'es' ? 'Buscar...' : 'Search assets...'}
            className="w-full pl-9 pr-4 py-2.5 bg-paper border border-brd rounded-xl text-sm focus:outline-none focus:border-accent"
          />
        </div>

        {typeFilters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key)}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors",
              filterType === f.key
                ? "bg-accent text-white border-accent"
                : "bg-paper text-ink-muted border-brd hover:border-accent/30"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Upload Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center mb-4 transition-colors",
          dragOver ? "border-accent bg-accent/5" : "border-brd/50",
          uploading && "opacity-50 pointer-events-none"
        )}
      >
        <Upload size={24} className="mx-auto text-ink-muted/40 mb-2" />
        <p className="text-sm text-ink-muted">
          {uploading
            ? (lang === 'de' ? 'Hochladen...' : lang === 'es' ? 'Subiendo...' : 'Uploading...')
            : (lang === 'de' ? 'Dateien hierher ziehen oder klicken' : lang === 'es' ? 'Arrastra archivos aquí' : 'Drag files here or click to upload')
          }
        </p>
      </div>

      {/* Assets Grid/List */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <FolderOpen size={48} className="text-ink-muted/20 mb-4" />
          <p className="text-lg font-bold text-ink-muted">
            {search ? (lang === 'de' ? 'Keine Ergebnisse' : lang === 'es' ? 'Sin resultados' : 'No results') : (lang === 'de' ? 'Noch keine Assets' : lang === 'es' ? 'Sin assets aún' : 'No assets yet')}
          </p>
          <p className="text-sm text-ink-muted/60 mt-1">
            {lang === 'de' ? 'Lade deine erste Datei hoch' : lang === 'es' ? 'Sube tu primer archivo' : 'Upload your first file to get started'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredAssets.map(asset => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "group relative bg-card border border-brd rounded-2xl overflow-hidden hover:border-accent/30 transition-all cursor-pointer",
                  selectedAssets.has(asset.id) && "ring-2 ring-accent"
                )}
                onClick={() => toggleSelect(asset.id)}
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-paper flex items-center justify-center">
                  {asset.type === 'image' || asset.type === 'design' ? (
                    <img src={asset.thumbnailUrl || asset.url} alt={asset.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      {typeIcons[asset.type] || typeIcons.image}
                      <span className="text-[10px] text-ink-muted font-mono uppercase">{asset.type}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-[11px] font-bold truncate">{asset.name}</p>
                  <p className="text-[9px] text-ink-muted font-mono">{formatSize(asset.size)}</p>
                </div>

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <a href={asset.url} target="_blank" download className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30" onClick={e => e.stopPropagation()}>
                    <Download size={14} className="text-white" />
                  </a>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(asset); }} className="w-8 h-8 bg-rose-500/30 rounded-lg flex items-center justify-center hover:bg-rose-500/50">
                    <Trash2 size={14} className="text-white" />
                  </button>
                </div>

                {/* Type badge */}
                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 rounded-md text-[8px] text-white font-bold uppercase">
                  {asset.type}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        /* List view */
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredAssets.map(asset => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex items-center gap-3 p-3 bg-card border border-brd rounded-xl hover:border-accent/30 transition-colors",
                selectedAssets.has(asset.id) && "ring-2 ring-accent"
              )}
              onClick={() => toggleSelect(asset.id)}
            >
              <div className="w-10 h-10 bg-paper rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {asset.type === 'image' || asset.type === 'design' ? (
                  <img src={asset.thumbnailUrl || asset.url} alt={asset.name} className="w-full h-full object-cover" />
                ) : (
                  typeIcons[asset.type] || typeIcons.image
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{asset.name}</p>
                <div className="flex items-center gap-2 text-[10px] text-ink-muted font-mono">
                  <span className="uppercase">{asset.type}</span>
                  <span>·</span>
                  <span>{formatSize(asset.size)}</span>
                  <span>·</span>
                  <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {asset.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-accent/10 text-accent text-[9px] font-bold rounded-full">{tag}</span>
                ))}
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(asset); }} className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors">
                <Trash2 size={14} className="text-ink-muted hover:text-rose-500" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}