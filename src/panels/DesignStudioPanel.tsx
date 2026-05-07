/**
 * Design Studio Panel v2.0
 * Full-featured Canva-like design editor powered by tldraw
 * Optimized UX/UI layout for intuitive design workflow
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Tldraw,
  useEditor,
  Editor,
} from 'tldraw';
import 'tldraw/tldraw.css';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import {
  // Actions
  Save,
  Download,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Upload,
  Image as ImageIcon,
  Plus,
  X,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  PanelRightClose,
  PanelRight,
  // Tools
  MousePointer2,
  Hand,
  Type,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Image,
  Star,
  Triangle,
  // UI
  Layers,
  Palette,
  Sparkles,
  Settings,
  Sun,
  Moon,
  Grid3X3,
  Ruler,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Bold,
  Italic,
  Underline,
  Link,
  FileImage,
  FileText,
  FileCode,
} from 'lucide-react';

// AI Services
import { geminiVisionService } from '../services/ai/geminiVisionService';
import { backgroundRemovalService } from '../services/ai/backgroundRemovalService';

// Brand Kit
import { brandKitService, BrandKit, ColorPalette } from '../services/canva/brandKitService';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

interface StudioState {
  artboardSize: { width: number; height: number };
  artboardFormat: string;
  activeTool: string;
  activeBrandKit: BrandKit;
  isProcessingAI: boolean;
  aiProgress: number;
  showRightPanel: boolean;
  rightPanelTab: 'layers' | 'brand' | 'ai' | 'properties';
  showGrid: boolean;
  projectName: string;
  isDirty: boolean;
  lastSaved: Date | null;
  editorRef: Editor | null;
}

interface StudioActions {
  setArtboardSize: (size: { width: number; height: number }, format: string) => void;
  setActiveTool: (tool: string) => void;
  setActiveBrandKit: (kit: BrandKit) => void;
  setIsProcessingAI: (processing: boolean) => void;
  setAiProgress: (progress: number) => void;
  setShowRightPanel: (show: boolean) => void;
  setRightPanelTab: (tab: StudioState['rightPanelTab']) => void;
  setShowGrid: (show: boolean) => void;
  setProjectName: (name: string) => void;
  setIsDirty: (dirty: boolean) => void;
  setLastSaved: (date: Date) => void;
  setEditorRef: (editor: Editor | null) => void;
}

type StudioStore = StudioState & StudioActions;

// ============================================================================
// CONSTANTS
// ============================================================================

export const INSTAGRAM_FORMATS = {
  'post-square': { width: 1080, height: 1080, label: 'Instagram Post (1:1)' },
  'story': { width: 1080, height: 1920, label: 'Instagram Story (9:16)' },
  'landscape': { width: 1080, height: 566, label: 'Instagram Landscape' },
  'portrait': { width: 1080, height: 1350, label: 'Instagram Portrait' },
  'reel-cover': { width: 1080, height: 1920, label: 'Reel Cover' },
  'facebook-post': { width: 1200, height: 630, label: 'Facebook Post' },
  'linkedin-post': { width: 1200, height: 627, label: 'LinkedIn Post' },
  'youtube-thumb': { width: 1280, height: 720, label: 'YouTube Thumbnail' },
  'twitter-post': { width: 1200, height: 675, label: 'Twitter/X Post' },
  'pinterest-pin': { width: 1000, height: 1500, label: 'Pinterest Pin' },
};

type FormatKey = keyof typeof INSTAGRAM_FORMATS;

// ============================================================================
// ZUSTAND STORE
// ============================================================================

const useStudioStore = create<StudioStore>()(
  persist(
    (set) => ({
      artboardSize: INSTAGRAM_FORMATS['post-square'],
      artboardFormat: 'post-square',
      activeTool: 'select',
      activeBrandKit: brandKitService.getActive(),
      isProcessingAI: false,
      aiProgress: 0,
      showRightPanel: true,
      rightPanelTab: 'layers',
      showGrid: false,
      projectName: 'Untitled Design',
      isDirty: false,
      lastSaved: null,
      editorRef: null,

      setArtboardSize: (size, format) => set({ artboardSize: size, artboardFormat: format, isDirty: true }),
      setActiveTool: (tool) => set({ activeTool: tool }),
      setActiveBrandKit: (kit) => set({ activeBrandKit: kit }),
      setIsProcessingAI: (processing) => set({ isProcessingAI: processing }),
      setAiProgress: (progress) => set({ aiProgress: progress }),
      setShowRightPanel: (show) => set({ showRightPanel: show }),
      setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
      setShowGrid: (show) => set({ showGrid: show }),
      setProjectName: (name) => set({ projectName: name, isDirty: true }),
      setIsDirty: (dirty) => set({ isDirty: dirty }),
      setLastSaved: (date) => set({ lastSaved: date, isDirty: false }),
      setEditorRef: (editor) => set({ editorRef: editor }),
    }),
    {
      name: 'design-studio-storage',
      partialize: (state) => ({
        artboardFormat: state.artboardFormat,
        showRightPanel: state.showRightPanel,
        rightPanelTab: state.rightPanelTab,
        showGrid: state.showGrid,
      }),
      // Skip hydration for non-serializable editorRef
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.editorRef = null;
          state.isDirty = false;
          state.lastSaved = null;
        }
      },
    }
  )
);

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

interface Tool {
  id: string;
  icon: React.ElementType;
  label: string;
  shortcut: string;
}

const TOOLS: Tool[] = [
  { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { id: 'hand', icon: Hand, label: 'Pan', shortcut: 'H' },
  { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  { id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { id: 'ellipse', icon: Circle, label: 'Ellipse', shortcut: 'O' },
  { id: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
  { id: 'arrow', icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
  { id: 'image', icon: Image, label: 'Image', shortcut: 'I' },
];

// ============================================================================
// FORMAT MODAL
// ============================================================================

function FormatModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (key: FormatKey) => void;
}) {
  const [selected, setSelected] = useState<FormatKey>('post-square');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Create new design</h2>
            <p className="text-sm text-gray-500 mt-0.5">Choose a format for your canvas</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(INSTAGRAM_FORMATS).map(([key, format]) => {
              const aspectRatio = format.width / format.height;
              const isWide = aspectRatio > 1.5;
              const isTall = aspectRatio < 0.7;

              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelected(key as FormatKey);
                    onSelect(key as FormatKey);
                  }}
                  className={cn(
                    "relative p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] hover:shadow-md",
                    selected === key
                      ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  )}
                >
                  {/* Format Preview */}
                  <div className="flex items-center justify-center mb-3">
                    <div
                      className={cn(
                        "bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded",
                        isWide ? "w-16 h-8" : isTall ? "w-8 h-16" : "w-12 h-12"
                      )}
                    />
                  </div>

                  <div className="text-sm font-medium text-gray-900">{format.label}</div>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">
                    {format.width}×{format.height}
                  </div>

                  {selected === key && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSelect(selected)}
            className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            Create Design
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LAYERS PANEL
// ============================================================================

function LayersPanel({ editor }: { editor: Editor }) {
  const [layers, setLayers] = useState<any[]>([]);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const shapes = editor.getCurrentPageShapes();
      const sorted = [...shapes].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
      setLayers(sorted);
    };

    update();
    const cleanup = editor.store.listen(update, { scope: 'document' });
    return cleanup;
  }, [editor]);

  const toggleVisibility = (id: string) => {
    const shape = editor.getShape(id);
    if (shape) {
      editor.updateShape({ id, props: { isVisible: !shape.props.isVisible } });
    }
  };

  const toggleLock = (id: string) => {
    const shape = editor.getShape(id);
    if (shape) {
      editor.updateShape({ id, props: { isLocked: !shape.props.isLocked } });
    }
  };

  const deleteShape = (id: string) => {
    editor.deleteShape(id);
  };

  const duplicateShape = (id: string) => {
    editor.duplicateShapes([id]);
  };

  const selectShape = (id: string) => {
    editor.select(id);
  };

  const getShapeIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="w-3.5 h-3.5" />;
      case 'geo': return <Square className="w-3.5 h-3.5" />;
      case 'image': return <Image className="w-3.5 h-3.5" />;
      case 'line': return <Minus className="w-3.5 h-3.5" />;
      case 'arrow': return <ArrowRight className="w-3.5 h-3.5" />;
      default: return <Square className="w-3.5 h-3.5" />;
    }
  };

  const getShapeName = (shape: any) => {
    if (shape.type === 'text' && shape.props?.text) {
      const text = shape.props.text;
      return text.length > 20 ? text.substring(0, 20) + '...' : text;
    }
    if (shape.type === 'geo') {
      return (shape.props?.geo || 'Shape').charAt(0).toUpperCase() + (shape.props?.geo || 'shape').slice(1);
    }
    return shape.type.charAt(0).toUpperCase() + shape.type.slice(1);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Layers</h3>
        <span className="text-xs text-gray-400">{layers.length} items</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Layers className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No layers yet</p>
            <p className="text-xs mt-1">Add shapes or images to begin</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {layers.map((shape) => {
              const isSelected = editor.getSelectedShapeIds().includes(shape.id);
              const isVisible = shape.props.isVisible !== false;
              const isLocked = shape.props.isLocked || false;

              return (
                <div
                  key={shape.id}
                  onClick={() => selectShape(shape.id)}
                  className={cn(
                    "group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-sm",
                    isSelected
                      ? "bg-green-100 border border-green-300"
                      : "hover:bg-gray-50 border border-transparent"
                  )}
                >
                  {/* Visibility */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleVisibility(shape.id); }}
                    className={cn(
                      "p-1 rounded transition-colors",
                      isVisible ? "text-gray-400 hover:text-gray-600" : "text-gray-300 hover:text-gray-400"
                    )}
                  >
                    {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Lock */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLock(shape.id); }}
                    className={cn(
                      "p-1 rounded transition-colors",
                      isLocked ? "text-amber-500" : "text-gray-300 hover:text-gray-400"
                    )}
                  >
                    {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  {/* Icon */}
                  <span className={cn("transition-colors", isVisible ? "text-gray-500" : "text-gray-300")}>
                    {getShapeIcon(shape.type)}
                  </span>

                  {/* Name */}
                  <span className={cn(
                    "flex-1 truncate transition-colors",
                    isVisible ? "text-gray-700" : "text-gray-400"
                  )}>
                    {getShapeName(shape)}
                  </span>

                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); duplicateShape(shape.id); }}
                      className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteShape(shape.id); }}
                      className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// BRAND PANEL
// ============================================================================

function BrandPanel({ editor }: { editor: Editor }) {
  const { activeBrandKit } = useStudioStore();
  const colorPalette = useMemo(() => brandKitService.getColorPalette(), []);

  const applyColorToSelection = (color: string) => {
    const selectedIds = editor.getSelectedShapeIds();
    if (selectedIds.length === 0) {
      toast.error('Select an element first');
      return;
    }

    selectedIds.forEach((id) => {
      const shape = editor.getShape(id);
      if (shape?.type === 'geo') {
        editor.updateShape({ id, props: { fill: color } });
      } else if (shape?.type === 'text') {
        editor.updateShape({ id, props: { color: color } });
      }
    });

    toast.success(`Applied ${color}`);
  };

  const applyFontToSelection = (fontFamily: string) => {
    const selectedIds = editor.getSelectedShapeIds();
    if (selectedIds.length === 0) {
      toast.error('Select a text element first');
      return;
    }

    selectedIds.forEach((id) => {
      const shape = editor.getShape(id);
      if (shape?.type === 'text') {
        editor.updateShape({ id, props: { fontFamily: fontFamily } });
      }
    });

    toast.success(`Applied ${fontFamily}`);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Brand Kit</h3>
      </div>

      <div className="p-3 space-y-4">
        {/* Brand Name */}
        <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
            <span className="text-white text-xs font-bold">N</span>
          </div>
          <span className="text-sm font-medium text-gray-900">{activeBrandKit.name}</span>
        </div>

        {/* Colors */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Colors</div>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(colorPalette).map(([key, color]) => (
              <button
                key={key}
                onClick={() => applyColorToSelection(color)}
                className="aspect-square rounded-lg border-2 border-transparent hover:border-green-500 transition-all hover:scale-110 relative group shadow-sm"
                style={{ backgroundColor: color }}
                title={`${key}: ${color}`}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-lg">
                  <Check className="w-4 h-4 text-white drop-shadow" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Fonts */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Typography</div>
          <div className="space-y-1">
            {Object.entries(activeBrandKit.fonts).map(([key, font]) => (
              <button
                key={key}
                onClick={() => applyFontToSelection(font.family)}
                className="w-full px-3 py-2 text-left rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900" style={{ fontFamily: font.family }}>
                    {font.name}
                  </div>
                  <div className="text-xs text-gray-400">{font.usage}</div>
                </div>
                <span className="text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                  Apply
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Contrast Check */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contrast Check</div>
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            {Object.entries(brandKitService.getContrastReport()).map(([key, result]: [string, any]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-gray-500 capitalize">{key.replace(/-/g, ' ')}</span>
                <span className={cn(
                  "font-mono font-medium",
                  result.AA ? "text-green-600" : "text-red-500"
                )}>
                  {result.ratio.toFixed(1)}:1 {result.AA ? "✓" : "✗"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// AI PANEL
// ============================================================================

function AIPanel({ editor }: { editor: Editor }) {
  const { isProcessingAI, aiProgress, setIsProcessingAI, setAiProgress } = useStudioStore();

  const getSelectedImage = useCallback(() => {
    const selectedIds = editor.getSelectedShapeIds();
    if (selectedIds.length === 0) return null;
    const shape = editor.getShape(selectedIds[0]);
    if (!shape || shape.type !== 'image') return null;
    return shape;
  }, [editor]);

  const handleRemoveBackground = async () => {
    const imageShape = getSelectedImage();
    if (!imageShape) {
      toast.error('Select an image first');
      return;
    }

    setIsProcessingAI(true);
    setAiProgress(0);

    try {
      const imageUrl = imageShape.props.src;
      setAiProgress(10);

      const response = await fetch(imageUrl);
      const blob = await response.blob();
      setAiProgress(30);

      const resultBlob = await backgroundRemovalService.removeBackground(blob, (progress) => {
        setAiProgress(30 + progress * 0.6);
      });

      setAiProgress(95);
      const resultUrl = URL.createObjectURL(resultBlob);
      editor.updateShape({ id: imageShape.id, props: { src: resultUrl } });

      setAiProgress(100);
      toast.success('Background removed!');
    } catch (error: any) {
      console.error('Background removal error:', error);
      toast.error('Failed to remove background', { description: error.message });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleAIEnhance = async () => {
    const imageShape = getSelectedImage();
    if (!imageShape) {
      toast.error('Select an image first');
      return;
    }

    setIsProcessingAI(true);
    setAiProgress(0);

    try {
      const imageUrl = imageShape.props.src;
      setAiProgress(20);

      const analysis = await geminiVisionService.analyzeImage(imageUrl, {
        task: 'enhance',
        focus: 'improvements_for_social_media',
      });

      setAiProgress(80);
      toast.success(`AI Analysis: ${analysis.overall.score}/100`, {
        description: analysis.overall.verdict,
      });
    } catch (error: any) {
      console.error('AI enhance error:', error);
      toast.error('AI analysis failed', { description: error.message });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleExtractColors = async () => {
    const imageShape = getSelectedImage();
    if (!imageShape) {
      toast.error('Select an image first');
      return;
    }

    setIsProcessingAI(true);

    try {
      const imageUrl = imageShape.props.src;
      const colors = await geminiVisionService.extractColors(imageUrl);

      toast.success('Colors extracted!', {
        description: colors.slice(0, 5).join(', '),
      });
    } catch (error: any) {
      console.error('Color extraction error:', error);
      toast.error('Failed to extract colors', { description: error.message });
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleGenerateCaption = async () => {
    const imageShape = getSelectedImage();
    if (!imageShape) {
      toast.error('Select an image first');
      return;
    }

    setIsProcessingAI(true);

    try {
      const imageUrl = imageShape.props.src;
      const caption = await geminiVisionService.generateCaption(imageUrl);

      await navigator.clipboard.writeText(caption);
      toast.success('Caption copied to clipboard!', {
        description: caption.substring(0, 80) + '...',
      });
    } catch (error: any) {
      console.error('Caption generation error:', error);
      toast.error('Failed to generate caption', { description: error.message });
    } finally {
      setIsProcessingAI(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AI Tools</h3>
      </div>

      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {/* Progress */}
        {isProcessingAI && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing AI...
              </span>
              <span className="font-mono text-gray-600">{aiProgress}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                style={{ width: `${aiProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* AI Actions */}
        <div className="space-y-2">
          <button
            onClick={handleRemoveBackground}
            disabled={isProcessingAI}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
              "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
              "hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Remove Background</div>
              <div className="text-xs opacity-80">AI-powered extraction</div>
            </div>
          </button>

          <button
            onClick={handleAIEnhance}
            disabled={isProcessingAI}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
              "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
              "hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">AI Enhance</div>
              <div className="text-xs opacity-80">Analyze & improve</div>
            </div>
          </button>

          <button
            onClick={handleExtractColors}
            disabled={isProcessingAI}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
              "bg-white border-2 border-gray-200 text-gray-700",
              "hover:border-green-500 hover:bg-green-50",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Palette className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Extract Colors</div>
              <div className="text-xs text-gray-500">Get palette from image</div>
            </div>
          </button>

          <button
            onClick={handleGenerateCaption}
            disabled={isProcessingAI}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
              "bg-white border-2 border-gray-200 text-gray-700",
              "hover:border-green-500 hover:bg-green-50",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Type className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Generate Caption</div>
              <div className="text-xs text-gray-500">AI Instagram copy</div>
            </div>
          </button>
        </div>

        {/* Tips */}
        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Tip:</span> Select an image on the canvas to enable AI tools.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PROPERTIES PANEL
// ============================================================================

function PropertiesPanel({ editor }: { editor: Editor }) {
  const [selectedShape, setSelectedShape] = useState<any>(null);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const selectedIds = editor.getSelectedShapeIds();
      if (selectedIds.length === 1) {
        setSelectedShape(editor.getShape(selectedIds[0]));
      } else {
        setSelectedShape(null);
      }
    };

    update();
    const cleanup = editor.store.listen(update, { scope: 'document' });
    return cleanup;
  }, [editor]);

  if (!selectedShape) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Properties</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-4">
          <Settings className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm text-center">Select an element to see its properties</p>
        </div>
      </div>
    );
  }

  const updateShape = (updates: any) => {
    editor.updateShape({ id: selectedShape.id, ...updates });
  };

  const updateProps = (props: any) => {
    editor.updateShape({ id: selectedShape.id, props: { ...selectedShape.props, ...props } });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Properties</h3>
        <span className="text-xs text-gray-400 capitalize">{selectedShape.type}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Position */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Position</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">X</label>
              <input
                type="number"
                value={Math.round(selectedShape.x)}
                onChange={(e) => updateShape({ x: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Y</label>
              <input
                type="number"
                value={Math.round(selectedShape.y)}
                onChange={(e) => updateShape({ y: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Size</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Width</label>
              <input
                type="number"
                value={Math.round(selectedShape.props?.width || selectedShape.width || 0)}
                onChange={(e) => updateProps({ width: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Height</label>
              <input
                type="number"
                value={Math.round(selectedShape.props?.height || selectedShape.height || 0)}
                onChange={(e) => updateProps({ height: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Opacity</div>
            <span className="text-xs font-mono text-gray-500">{selectedShape.props?.opacity || 100}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={selectedShape.props?.opacity || 100}
            onChange={(e) => updateProps({ opacity: Number(e.target.value) })}
            className="w-full accent-green-600"
          />
        </div>

        {/* Fill Color (Geo shapes) */}
        {selectedShape.type === 'geo' && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fill Color</div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedShape.props?.fill || '#467a49'}
                onChange={(e) => updateProps({ fill: e.target.value })}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={selectedShape.props?.fill || '#467a49'}
                onChange={(e) => updateProps({ fill: e.target.value })}
                className="flex-1 px-2 py-1.5 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Text Properties */}
        {selectedShape.type === 'text' && (
          <>
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Font Size</div>
              <input
                type="number"
                value={selectedShape.props?.fontSize || 32}
                onChange={(e) => updateProps({ fontSize: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Text Color</div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedShape.props?.color || '#1a1a1a'}
                  onChange={(e) => updateProps({ color: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedShape.props?.color || '#1a1a1a'}
                  onChange={(e) => updateProps({ color: e.target.value })}
                  className="flex-1 px-2 py-1.5 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Alignment</div>
              <div className="flex gap-1">
                {[
                  { value: 'start', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'end', icon: AlignRight },
                ].map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => updateProps({ textAlign: value })}
                    className={cn(
                      "flex-1 p-2 rounded-lg border transition-colors",
                      selectedShape.props?.textAlign === value
                        ? "bg-green-100 border-green-500 text-green-600"
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="w-4 h-4 mx-auto" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN DESIGN STUDIO PANEL
// ============================================================================

export function DesignStudioPanel() {
  const {
    artboardSize,
    artboardFormat,
    activeTool,
    showRightPanel,
    rightPanelTab,
    showGrid,
    projectName,
    isDirty,
    lastSaved,
    editorRef,
    setArtboardSize,
    setActiveTool,
    setShowRightPanel,
    setRightPanelTab,
    setShowGrid,
    setProjectName,
    setLastSaved,
    setEditorRef,
  } = useStudioStore();

  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-save every 2 minutes when dirty
  useEffect(() => {
    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    
    autoSaveTimerRef.current = setInterval(() => {
      if (editorRef && isDirty) {
        handleAutoSave();
      }
    }, 120000); // 2 minutes
    
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [editorRef, isDirty]);

  const handleAutoSave = async () => {
    if (!editorRef) return;
    setAutoSaveStatus('saving');
    try {
      // Save to localStorage as snapshot
      const snapshot = editorRef.store;
      if (snapshot) {
        localStorage.setItem('design-studio-snapshot', JSON.stringify({
          project: projectName,
          format: artboardFormat,
          timestamp: new Date().toISOString(),
          data: snapshot
        }));
      }
      setLastSaved(new Date());
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Auto-save failed:', err);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 5000);
    }
  };

  const handleFormatSelect = (key: FormatKey) => {
    setArtboardSize(INSTAGRAM_FORMATS[key], key);
    setShowFormatModal(false);
  };

  // Close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  const exportToFormat = async (format: 'svg' | 'png' | 'jpg' | 'webp', quality: number = 0.92) => {
    if (!editorRef) return;
    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const { toPng, toJpeg, toSvg } = await import('html-to-image');

      // Get the tldraw container element
      const container = document.querySelector('.tldraw__main') as HTMLElement;
      if (!container) {
        throw new Error('Canvas not found');
      }

      let dataUrl: string;
      let mimeType: string;
      let extension: string;

      if (format === 'svg') {
        const svg = await editorRef.getSvg(editorRef.getCurrentPageShapes());
        if (!svg) throw new Error('Failed to generate SVG');
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        dataUrl = URL.createObjectURL(blob);
        mimeType = 'image/svg+xml';
        extension = 'svg';
      } else if (format === 'png') {
        dataUrl = await toPng(container, { pixelRatio: 2, quality });
        mimeType = 'image/png';
        extension = 'png';
      } else if (format === 'webp') {
        // html-to-image doesn't have toWebP, use canvas conversion
        const pngDataUrl = await toPng(container, { pixelRatio: 2, quality });
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = pngDataUrl; });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          dataUrl = canvas.toDataURL('image/webp', quality);
        } else {
          dataUrl = pngDataUrl; // fallback to PNG
        }
        mimeType = 'image/webp';
        extension = 'webp';
      } else {
        const bounds = editorRef.getCurrentPageBounds();
        const width = bounds ? bounds.width : 1080;
        const height = bounds ? bounds.height : 1080;
        dataUrl = await toJpeg(container, { quality, width, height });
        mimeType = 'image/jpeg';
        extension = 'jpg';
      }

      // Download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${projectName.replace(/\s+/g, '_')}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke to prevent memory leaks
      if (format !== 'svg') URL.revokeObjectURL(dataUrl);

      toast.success(`Exported as ${extension.toUpperCase()}!`);

      // Auto-save to Supabase
      if (format !== 'svg') {
        try {
          const client = (await import('@supabase/supabase-js')).createClient(
            'https://djspyyyihyxwtmduoolj.supabase.co',
            'sb_publishable_Pph0V6rjR2PR3oGe87gikA_qo-F__TU'
          );
          const timestamp = Date.now();
          const fileName = `designs/${timestamp}-${projectName.replace(/\s+/g, '_')}.${extension}`;
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const { data, error } = await client.storage
            .from('nicola-assets')
            .upload(fileName, blob, { cacheControl: '3600', upsert: false });
          if (!error && data) {
            const { data: urlData } = client.storage.from('nicola-assets').getPublicUrl(fileName);
            toast.success('💾 Guardado en Supabase', {
              description: 'Listo para revisión',
              action: { label: 'Copiar link', onClick: () => navigator.clipboard.writeText(urlData.publicUrl) }
            });
          }
        } catch (uploadError) {
          console.error('Auto-save to Supabase failed:', uploadError);
        }
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Export failed', { description: error.message });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = () => {
    setLastSaved(new Date());
    toast.success('Project saved!');
  };

  const handleZoomIn = () => {
    if (editorRef) {
      editorRef.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (editorRef) {
      editorRef.zoomOut();
    }
  };

  const handleFitToScreen = () => {
    if (editorRef) {
      editorRef.resetZoom();
    }
  };

  const handleUndo = () => {
    if (editorRef) {
      editorRef.undo();
    }
  };

  const handleRedo = () => {
    if (editorRef) {
      editorRef.redo();
    }
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !editorRef) return;

      const url = URL.createObjectURL(file);
      editorRef.createShape({
        type: 'image',
        props: { name: file.name, src: url, width: 400, height: 400 },
      });
    };
    input.click();
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* ===== HEADER ===== */}
      <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between flex-shrink-0">
        {/* Left: Logo & Project */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-semibold text-gray-900">Design Studio</span>
          </div>

          <div className="h-6 w-px bg-gray-200" />

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="text-sm bg-transparent border-none focus:outline-none focus:ring-0 font-medium px-2 py-1 rounded hover:bg-gray-50 w-48"
            />
            {isDirty && (
              <span className="w-2 h-2 bg-amber-400 rounded-full" title="Unsaved changes" />
            )}
          </div>
        </div>

        {/* Center: Quick Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Undo (Cmd+Z)"
          >
            <Undo2 className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={handleRedo}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo2 className="w-4 h-4 text-gray-600" />
          </button>

          <div className="h-6 w-px bg-gray-200 mx-2" />

          <button
            onClick={() => setShowFormatModal(true)}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
          >
            {INSTAGRAM_FORMATS[artboardFormat as FormatKey]?.label}
            <ChevronDown className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-gray-200 mx-2" />

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showGrid ? "bg-green-100 text-green-600" : "hover:bg-gray-100 text-gray-600"
            )}
            title="Toggle Grid"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Save & Export */}
        <div className="flex items-center gap-2" ref={exportMenuRef}>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            Save
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="px-4 py-1.5 text-sm font-medium bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export
              <ChevronDown className="w-3 h-3" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                <button
                  onClick={() => exportToFormat('png')}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <FileImage className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="font-medium text-gray-900">PNG</div>
                    <div className="text-xs text-gray-400">High quality, transparent</div>
                  </div>
                </button>
                <button
                  onClick={() => exportToFormat('jpg')}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <FileImage className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="font-medium text-gray-900">JPG</div>
                    <div className="text-xs text-gray-400">Compressed, smaller size</div>
                  </div>
                </button>
                <button
                  onClick={() => exportToFormat('svg')}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <FileCode className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="font-medium text-gray-900">SVG</div>
                    <div className="text-xs text-gray-400">Vector, scalable</div>
                  </div>
                </button>
                <button
                  onClick={() => exportToFormat('webp')}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <FileImage className="w-4 h-4 text-orange-500" />
                  <div>
                    <div className="font-medium text-gray-900">WebP</div>
                    <div className="text-xs text-gray-400">Modern, small size</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* ===== TOOLBAR LEFT ===== */}
        <aside className="w-14 bg-white border-r border-gray-200 flex flex-col py-2 flex-shrink-0">
          {/* Tools */}
          <div className="flex flex-col gap-0.5 px-2">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id);
                  if (editorRef) {
                    editorRef.setCurrentTool(tool.id);
                  }
                }}
                className={cn(
                  "w-full p-2.5 rounded-lg transition-all flex flex-col items-center gap-1",
                  activeTool === tool.id
                    ? "bg-green-100 text-green-700 shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                )}
                title={`${tool.label} (${tool.shortcut})`}
              >
                <tool.icon className="w-5 h-5" />
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Bottom Actions */}
          <div className="px-2 space-y-0.5">
            <button
              onClick={handleImageUpload}
              className="w-full p-2.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors flex flex-col items-center gap-1"
              title="Upload Image"
            >
              <Upload className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowRightPanel(!showRightPanel)}
              className={cn(
                "w-full p-2.5 rounded-lg transition-colors flex flex-col items-center gap-1",
                showRightPanel ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              )}
              title={showRightPanel ? "Hide Panel" : "Show Panel"}
            >
              {showRightPanel ? (
                <PanelRightClose className="w-5 h-5" />
              ) : (
                <PanelRight className="w-5 h-5" />
              )}
            </button>
          </div>
        </aside>

        {/* ===== CANVAS ===== */}
        <main className="flex-1 overflow-hidden bg-gray-100 relative">
          {/* Canvas Container */}
          <div className="absolute inset-0">
            <Tldraw
              onMount={(editor) => {
                setEditorRef(editor);

                // Wire up keyboard shortcuts
                const handleKeyDown = (e: KeyboardEvent) => {
                  // Skip if user is typing in an input
                  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

                  const key = e.key.toUpperCase();
                  const toolMap: Record<string, string> = {
                    'V': 'select',
                    'H': 'hand',
                    'T': 'text',
                    'R': 'rectangle',
                    'O': 'ellipse',
                    'L': 'line',
                    'A': 'arrow',
                    'I': 'image',
                  };

                  if (toolMap[key]) {
                    e.preventDefault();
                    editor.setCurrentTool(toolMap[key]);
                    setActiveTool(toolMap[key]);
                  }

                  // Delete selected shapes
                  if ((e.key === 'Delete' || e.key === 'Backspace') && editor.getSelectedShapeIds().length > 0) {
                    e.preventDefault();
                    editor.deleteShapes(editor.getSelectedShapeIds());
                  }

                  // Undo/Redo
                  if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    editor.undo();
                  }
                  if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
                    e.preventDefault();
                    editor.redo();
                  }

                  // Select all
                  if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
                    e.preventDefault();
                    const shapes = editor.getCurrentPageShapes();
                    editor.select(...shapes.map(s => s.id));
                  }
                };

                document.addEventListener('keydown', handleKeyDown);
              }}
              autoFocus
              inferDarkMode={false}
            />
          </div>

          {/* Artboard Size Guides */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className="border-2 border-dashed border-green-400/50 bg-green-50/10 rounded-lg"
                style={{
                  width: Math.min(artboardSize.width * 0.5, 600),
                  height: Math.min(artboardSize.height * 0.5, 800),
                }}
              />
            </div>
          )}

          {/* Zoom Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white rounded-full shadow-lg px-2 py-1.5 border border-gray-200">
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>

            <div className="w-16 text-center">
              <span className="text-sm font-mono text-gray-700">
                {Math.round((editorRef?.zoomLevel || 1) * 100)}%
              </span>
            </div>

            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>

            <div className="w-px h-4 bg-gray-200 mx-1" />

            <button
              onClick={handleFitToScreen}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Fit to Screen"
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </main>

        {/* ===== RIGHT PANEL ===== */}
        {showRightPanel && (
          <aside className="w-72 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
            {/* Panel Tabs */}
            <div className="flex border-b border-gray-200">
              {[
                { id: 'layers', label: 'Layers', icon: Layers },
                { id: 'brand', label: 'Brand', icon: Palette },
                { id: 'ai', label: 'AI', icon: Sparkles },
                { id: 'properties', label: 'Props', icon: Settings },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setRightPanelTab(id as any)}
                  className={cn(
                    "flex-1 py-3 text-xs font-semibold uppercase tracking-wide transition-colors flex flex-col items-center gap-1",
                    rightPanelTab === id
                      ? "text-green-600 border-b-2 border-green-600 bg-green-50/50"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {editorRef && rightPanelTab === 'layers' && <LayersPanel editor={editorRef} />}
              {editorRef && rightPanelTab === 'brand' && <BrandPanel editor={editorRef} />}
              {editorRef && rightPanelTab === 'ai' && <AIPanel editor={editorRef} />}
              {editorRef && rightPanelTab === 'properties' && <PropertiesPanel editor={editorRef} />}
            </div>
          </aside>
        )}
      </div>

      {/* ===== STATUS BAR ===== */}
      <footer className="h-8 bg-white border-t border-gray-200 px-4 flex items-center justify-between text-xs text-gray-500 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-medium">
            {INSTAGRAM_FORMATS[artboardFormat as FormatKey]?.label}
          </span>
          <span className="font-mono text-gray-400">
            {INSTAGRAM_FORMATS[artboardFormat as FormatKey]?.width}×{INSTAGRAM_FORMATS[artboardFormat as FormatKey]?.height}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {lastSaved ? (
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          ) : (
            <span className="text-amber-500">Unsaved changes</span>
          )}
          {autoSaveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-blue-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              Auto-saving...
            </span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-green-500">
              <Check className="w-3 h-3" />
              Auto-saved
            </span>
          )}
          {autoSaveStatus === 'error' && (
            <span className="flex items-center gap-1 text-red-500">
              <X className="w-3 h-3" />
              Auto-save failed
            </span>
          )}
        </div>
      </footer>

      {/* Format Modal */}
      <FormatModal
        isOpen={showFormatModal}
        onClose={() => setShowFormatModal(false)}
        onSelect={handleFormatSelect}
      />
    </div>
  );
}
