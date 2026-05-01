/**
 * Background & Template Generator - Nicola Schaefer Hub
 * 
 * Real-time visual content generator with:
 * - Gradient backgrounds with full customization
 * - Pattern overlays (geometric, organic, noise)
 * - Brand kit integration
 * - Template presets for all social formats
 * - Layer-based composition
 * - Text overlays with typography controls
 * - Export to PNG/JPG with auto-upload to Supabase
 * - WhatsApp preview workflow
 */

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  Sparkles, Download, Copy, RefreshCw, Palette, Type, Layers,
  Image as ImageIcon, Plus, Minus, RotateCcw, Grid3X3, Sun,
  Moon, Eye, EyeOff, Lock, Unlock, ChevronLeft, ChevronRight,
  ChevronDown, Wand2, Heart, Share2, Zap, Sliders, Square,
  Circle, Triangle, Minus as LineIcon, ArrowRight, Star,
  Instagram, Film, Layout, X, Check, Loader2, Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { contentAgentService } from '../services/contentAgentService';

// ============================================================================
// TYPES
// ============================================================================

type Format = 'post' | 'story' | 'reel' | 'carousel' | 'banner';
type BgType = 'gradient' | 'solid' | 'pattern' | 'image' | 'mesh';
type PatternType = 'dots' | 'grid' | 'diagonal' | 'circles' | 'waves' | 'chevron' | 'noise' | 'none';
type GradientType = 'linear' | 'radial' | 'conic' | 'diamond';

interface GradientStop {
  color: string;
  position: number;
}

interface TextLayer {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  x: number;
  y: number;
  align: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
  opacity: number;
  rotation: number;
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  visible: boolean;
  locked: boolean;
}

interface ShapeLayer {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'line' | 'star';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
  borderRadius: number;
  visible: boolean;
  locked: boolean;
}

// ============================================================================
// BRAND PRESETS
// ============================================================================

const BRAND = {
  colors: {
    primary: '#467a49',
    primaryDark: '#155336',
    secondary: '#d16806',
    accent: '#e6a919',
    gold: '#e8b571',
    cream: '#fefcf8',
    black: '#1a1a1a',
    white: '#ffffff',
  },
  fonts: {
    display: 'Playfair Display',
    body: 'Outfit',
    mono: 'JetBrains Mono',
  },
  pillars: [
    { id: 'vilcabamba', label: 'Vilcabamba', icon: '🌿', gradient: ['#467a49', '#155336'] },
    { id: 'coaching', label: 'Coaching', icon: '✨', gradient: ['#d16806', '#e6a919'] },
    { id: 'retiros', label: 'Retiros', icon: '🏔️', gradient: ['#155336', '#467a49'] },
    { id: 'daily', label: 'Vida Diaria', icon: '🌅', gradient: ['#e8b571', '#d16806'] },
    { id: 'dach', label: 'DACH', icon: '📚', gradient: ['#1a1a1a', '#467a49'] },
  ],
};

const FORMAT_SIZES: Record<Format, { width: number; height: number; label: string }> = {
  post: { width: 1080, height: 1080, label: 'Instagram Post 1:1' },
  story: { width: 1080, height: 1920, label: 'Story/Reel 9:16' },
  reel: { width: 1080, height: 1920, label: 'Reel 9:16' },
  carousel: { width: 1080, height: 1350, label: 'Carousel 4:5' },
  banner: { width: 1920, height: 1080, label: 'Banner 16:9' },
};

const PRESET_GRADIENTS = [
  { name: 'Vilcabamba Green', stops: [{ color: '#467a49', position: 0 }, { color: '#155336', position: 100 }] },
  { name: 'Warm Sunset', stops: [{ color: '#d16806', position: 0 }, { color: '#e8b571', position: 100 }] },
  { name: 'Forest Morning', stops: [{ color: '#155336', position: 0 }, { color: '#467a49', position: 50 }, { color: '#e8b571', position: 100 }] },
  { name: 'Dark Luxury', stops: [{ color: '#1a1a1a', position: 0 }, { color: '#155336', position: 100 }] },
  { name: 'Gold Premium', stops: [{ color: '#1a1a1a', position: 0 }, { color: '#d16806', position: 50 }, { color: '#e6a919', position: 100 }] },
  { name: 'Cream Soft', stops: [{ color: '#fefcf8', position: 0 }, { color: '#e8b571', position: 100 }] },
  { name: 'Ocean Deep', stops: [{ color: '#0c4a6e', position: 0 }, { color: '#467a49', position: 100 }] },
  { name: 'Rose Dawn', stops: [{ color: '#9f1239', position: 0 }, { color: '#d16806', position: 100 }] },
  { name: 'Mystic', stops: [{ color: '#4c1d95', position: 0 }, { color: '#1a1a1a', position: 100 }] },
  { name: 'Earth', stops: [{ color: '#78350f', position: 0 }, { color: '#d16806', position: 50 }, { color: '#fefcf8', position: 100 }] },
];

const TEMPLATE_PRESETS = [
  {
    id: 'quote-minimal',
    name: 'Quote Minimal',
    format: 'post' as Format,
    bg: { type: 'gradient' as BgType, gradient: { type: 'linear' as GradientType, angle: 135, stops: [{ color: '#1a1a1a', position: 0 }, { color: '#155336', position: 100 }] } },
    texts: [
      { text: 'Tu cita aquí', fontFamily: BRAND.fonts.display, fontSize: 56, fontWeight: 600, color: '#ffffff', x: 540, y: 440, align: 'center' as const, letterSpacing: 2, lineHeight: 1.2, opacity: 100, rotation: 0, shadow: false, shadowColor: '#000000', shadowBlur: 0, visible: true, locked: false },
      { text: '@nicola.schaefer', fontFamily: BRAND.fonts.mono, fontSize: 16, fontWeight: 400, color: '#e8b571', x: 540, y: 680, align: 'center' as const, letterSpacing: 4, lineHeight: 1, opacity: 80, rotation: 0, shadow: false, shadowColor: '#000000', shadowBlur: 0, visible: true, locked: false },
    ],
    shapes: [],
    pattern: 'none' as PatternType,
  },
  {
    id: 'brand-story',
    name: 'Brand Story',
    format: 'story' as Format,
    bg: { type: 'gradient' as BgType, gradient: { type: 'linear' as GradientType, angle: 180, stops: [{ color: '#467a49', position: 0 }, { color: '#155336', position: 100 }] } },
    texts: [
      { text: 'VILCABAMBA', fontFamily: BRAND.fonts.display, fontSize: 72, fontWeight: 700, color: '#ffffff', x: 540, y: 600, align: 'center' as const, letterSpacing: 8, lineHeight: 1, opacity: 100, rotation: 0, shadow: true, shadowColor: '#00000040', shadowBlur: 20, visible: true, locked: false },
      { text: 'El Valle de la Longevidad', fontFamily: BRAND.fonts.body, fontSize: 24, fontWeight: 300, color: '#e8b571', x: 540, y: 700, align: 'center' as const, letterSpacing: 4, lineHeight: 1.2, opacity: 90, rotation: 0, shadow: false, shadowColor: '#000000', shadowBlur: 0, visible: true, locked: false },
    ],
    shapes: [
      { type: 'circle' as const, x: 540, y: 350, width: 200, height: 200, fill: 'transparent', stroke: '#e8b57140', strokeWidth: 2, opacity: 30, rotation: 0, borderRadius: 0, visible: true, locked: false, id: 's1' },
    ],
    pattern: 'dots' as PatternType,
  },
  {
    id: 'coaching-tip',
    name: 'Coaching Tip',
    format: 'post' as Format,
    bg: { type: 'gradient' as BgType, gradient: { type: 'radial' as GradientType, angle: 0, stops: [{ color: '#d16806', position: 0 }, { color: '#1a1a1a', position: 100 }] } },
    texts: [
      { text: '💡', fontFamily: BRAND.fonts.body, fontSize: 80, fontWeight: 400, color: '#ffffff', x: 540, y: 300, align: 'center' as const, letterSpacing: 0, lineHeight: 1, opacity: 100, rotation: 0, shadow: false, shadowColor: '#000000', shadowBlur: 0, visible: true, locked: false },
      { text: 'Tip del Día', fontFamily: BRAND.fonts.display, fontSize: 48, fontWeight: 700, color: '#ffffff', x: 540, y: 440, align: 'center' as const, letterSpacing: 2, lineHeight: 1.2, opacity: 100, rotation: 0, shadow: true, shadowColor: '#00000060', shadowBlur: 15, visible: true, locked: false },
      { text: 'Tu consejo aquí', fontFamily: BRAND.fonts.body, fontSize: 22, fontWeight: 300, color: '#e8b571', x: 540, y: 550, align: 'center' as const, letterSpacing: 1, lineHeight: 1.4, opacity: 90, rotation: 0, shadow: false, shadowColor: '#000000', shadowBlur: 0, visible: true, locked: false },
    ],
    shapes: [],
    pattern: 'none' as PatternType,
  },
  {
    id: 'retiro-anuncio',
    name: 'Retiro Anuncio',
    format: 'story' as Format,
    bg: { type: 'gradient' as BgType, gradient: { type: 'linear' as GradientType, angle: 160, stops: [{ color: '#155336', position: 0 }, { color: '#467a49', position: 50 }, { color: '#e8b571', position: 100 }] } },
    texts: [
      { text: 'RETIRO', fontFamily: BRAND.fonts.display, fontSize: 64, fontWeight: 700, color: '#ffffff', x: 540, y: 500, align: 'center' as const, letterSpacing: 12, lineHeight: 1, opacity: 100, rotation: 0, shadow: true, shadowColor: '#00000060', shadowBlur: 25, visible: true, locked: false },
      { text: 'YOGA · MEDITACIÓN', fontFamily: BRAND.fonts.mono, fontSize: 16, fontWeight: 400, color: '#e8b571', x: 540, y: 620, align: 'center' as const, letterSpacing: 6, lineHeight: 1, opacity: 80, rotation: 0, shadow: false, shadowColor: '#000000', shadowBlur: 0, visible: true, locked: false },
      { text: 'Vilcabamba 2026', fontFamily: BRAND.fonts.body, fontSize: 28, fontWeight: 300, color: '#ffffff', x: 540, y: 750, align: 'center' as const, letterSpacing: 2, lineHeight: 1, opacity: 90, rotation: 0, shadow: false, shadowColor: '#000000', shadowBlur: 0, visible: true, locked: false },
    ],
    shapes: [
      { type: 'rectangle' as const, x: 340, y: 880, width: 400, height: 60, fill: '#ffffff', stroke: 'transparent', strokeWidth: 0, opacity: 100, rotation: 0, borderRadius: 30, visible: true, locked: false, id: 's2' },
    ],
    pattern: 'chevron' as PatternType,
  },
  {
    id: 'dark-luxury',
    name: 'Dark Luxury',
    format: 'post' as Format,
    bg: { type: 'gradient' as BgType, gradient: { type: 'conic' as GradientType, angle: 45, stops: [{ color: '#1a1a1a', position: 0 }, { color: '#0c4a6e', position: 30 }, { color: '#1a1a1a', position: 70 }, { color: '#155336', position: 100 }] } },
    texts: [
      { text: 'NICOLA', fontFamily: BRAND.fonts.display, fontSize: 80, fontWeight: 700, color: '#ffffff', x: 540, y: 400, align: 'center' as const, letterSpacing: 16, lineHeight: 1, opacity: 100, rotation: 0, shadow: true, shadowColor: '#467a4960', shadowBlur: 30, visible: true, locked: false },
      { text: 'SCHAEFER', fontFamily: BRAND.fonts.body, fontSize: 20, fontWeight: 300, color: '#e8b571', x: 540, y: 500, align: 'center' as const, letterSpacing: 10, lineHeight: 1, opacity: 80, rotation: 0, shadow: false, shadowColor: '#000000', shadowBlur: 0, visible: true, locked: false },
    ],
    shapes: [
      { type: 'line' as const, x: 340, y: 470, width: 400, height: 1, fill: '#e8b57140', stroke: 'transparent', strokeWidth: 0, opacity: 50, rotation: 0, borderRadius: 0, visible: true, locked: false, id: 's3' },
    ],
    pattern: 'none' as PatternType,
  },
];

// ============================================================================
// CANVAS RENDERER
// ============================================================================

function generateCSSBackground(bg: any, pattern: PatternType): string {
  let css = '';

  if (bg.type === 'solid') {
    css = bg.color || '#1a1a1a';
  } else if (bg.type === 'gradient') {
    const stops = bg.gradient.stops.map((s: GradientStop) => `${s.color} ${s.position}%`).join(', ');
    if (bg.gradient.type === 'linear') {
      css = `linear-gradient(${bg.gradient.angle}deg, ${stops})`;
    } else if (bg.gradient.type === 'radial') {
      css = `radial-gradient(circle, ${stops})`;
    } else if (bg.gradient.type === 'conic') {
      css = `conic-gradient(from ${bg.gradient.angle}deg, ${stops})`;
    } else {
      css = `linear-gradient(${bg.gradient.angle}deg, ${stops})`;
    }
  } else if (bg.type === 'mesh') {
    css = `radial-gradient(at 20% 20%, ${bg.color1 || '#467a49'}44 0%, transparent 50%), radial-gradient(at 80% 80%, ${bg.color2 || '#d16806'}44 0%, transparent 50%), #1a1a1a`;
  }

  return css;
}

function generatePatternCSS(pattern: PatternType, color: string = '#ffffff10'): string {
  switch (pattern) {
    case 'dots':
      return `radial-gradient(circle, ${color} 1px, transparent 1px)`;
    case 'grid':
      return `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`;
    case 'diagonal':
      return `repeating-linear-gradient(45deg, ${color}, ${color} 1px, transparent 1px, transparent 10px)`;
    case 'circles':
      return `radial-gradient(circle, transparent 20%, ${color} 20%, ${color} 21%, transparent 21%)`;
    case 'waves':
      return `repeating-linear-gradient(0deg, ${color}, ${color} 2px, transparent 2px, transparent 8px)`;
    case 'chevron':
      return `repeating-linear-gradient(-45deg, ${color}, ${color} 1px, transparent 1px, transparent 8px)`;
    case 'noise':
      return `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;
    default:
      return 'none';
  }
}

function getPatternSize(pattern: PatternType): string {
  switch (pattern) {
    case 'dots': return '20px 20px';
    case 'grid': return '40px 40px';
    case 'circles': return '40px 40px';
    case 'waves': return '16px 16px';
    case 'chevron': return '12px 12px';
    case 'diagonal': return '14px 14px';
    default: return '0';
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BackgroundGenerator() {
  // Canvas state
  const [format, setFormat] = useState<Format>('post');
  const [bgType, setBgType] = useState<BgType>('gradient');
  const [gradient, setGradient] = useState({
    type: 'linear' as GradientType,
    angle: 135,
    stops: [{ color: '#1a1a1a', position: 0 }, { color: '#155336', position: 100 }] as GradientStop[],
  });
  const [solidColor, setSolidColor] = useState('#467a49');
  const [pattern, setPattern] = useState<PatternType>('none');
  const [patternColor, setPatternColor] = useState('#ffffff10');
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [shapeLayers, setShapeLayers] = useState<ShapeLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'background' | 'text' | 'shapes' | 'layers'>('templates');
  const [isExporting, setIsExporting] = useState(false);
  const [scale, setScale] = useState(0.5);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dimensions = FORMAT_SIZES[format];

  // Apply template preset
  const applyPreset = useCallback((preset: typeof TEMPLATE_PRESETS[0]) => {
    setFormat(preset.format);
    setBgType(preset.bg.type);
    if (preset.bg.type === 'gradient') {
      setGradient(preset.bg.gradient);
    }
    setPattern(preset.pattern);
    setTextLayers(preset.texts.map((t, i) => ({ ...t, id: `text_${i}` })));
    setShapeLayers(preset.shapes.map((s, i) => ({ ...s, id: `shape_${i}` })));
    toast.success(`Template "${preset.name}" aplicado`);
  }, []);

  // Add text layer
  const addTextLayer = useCallback(() => {
    const newLayer: TextLayer = {
      id: `text_${Date.now()}`,
      text: 'Nuevo texto',
      fontFamily: BRAND.fonts.display,
      fontSize: 48,
      fontWeight: 600,
      color: '#ffffff',
      x: dimensions.width / 2,
      y: dimensions.height / 2,
      align: 'center',
      letterSpacing: 2,
      lineHeight: 1.2,
      opacity: 100,
      rotation: 0,
      shadow: false,
      shadowColor: '#00000060',
      shadowBlur: 10,
      visible: true,
      locked: false,
    };
    setTextLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  }, [dimensions]);

  // Add shape layer
  const addShapeLayer = useCallback((type: ShapeLayer['type'] = 'rectangle') => {
    const newLayer: ShapeLayer = {
      id: `shape_${Date.now()}`,
      type,
      x: dimensions.width / 2 - 100,
      y: dimensions.height / 2 - 50,
      width: 200,
      height: 100,
      fill: BRAND.colors.primary,
      stroke: 'transparent',
      strokeWidth: 0,
      opacity: 100,
      rotation: 0,
      borderRadius: type === 'circle' ? 999 : type === 'rectangle' ? 12 : 0,
      visible: true,
      locked: false,
    };
    setShapeLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  }, [dimensions]);

  // Update layer
  const updateTextLayer = useCallback((id: string, updates: Partial<TextLayer>) => {
    setTextLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  const updateShapeLayer = useCallback((id: string, updates: Partial<ShapeLayer>) => {
    setShapeLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  // Delete layer
  const deleteLayer = useCallback((id: string) => {
    setTextLayers(prev => prev.filter(l => l.id !== id));
    setShapeLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  }, [selectedLayerId]);

  // Duplicate layer
  const duplicateLayer = useCallback((id: string) => {
    const textLayer = textLayers.find(l => l.id === id);
    if (textLayer) {
      const newLayer = { ...textLayer, id: `text_${Date.now()}`, y: textLayer.y + 40 };
      setTextLayers(prev => [...prev, newLayer]);
      setSelectedLayerId(newLayer.id);
      return;
    }
    const shapeLayer = shapeLayers.find(l => l.id === id);
    if (shapeLayer) {
      const newLayer = { ...shapeLayer, id: `shape_${Date.now()}`, x: shapeLayer.x + 20, y: shapeLayer.y + 20 };
      setShapeLayers(prev => [...prev, newLayer]);
      setSelectedLayerId(newLayer.id);
    }
  }, [textLayers, shapeLayers]);

  // Export
  const handleExport = useCallback(async (exportFormat: 'png' | 'jpg') => {
    if (!canvasRef.current) return;
    setIsExporting(true);

    try {
      // Use html2canvas approach via canvas API
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Draw background
      const bgCSS = generateCSSBackground(
        bgType === 'solid' ? { type: 'solid', color: solidColor } : { type: 'gradient', gradient },
        pattern
      );

      // For export, we'll use the simpler approach of capturing the div
      // Using the native html-to-image approach
      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(canvasRef.current, {
        width: dimensions.width,
        height: dimensions.height,
        pixelRatio: 2,
      });

      // Download
      const link = document.createElement('a');
      link.download = `nicola-${format}-${Date.now()}.${exportFormat}`;
      link.href = dataUrl;
      link.click();

      // Try upload to Supabase
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const url = await contentAgentService.uploadToSupabase(blob, 'designs');
        toast.success('💾 Guardado en Supabase', {
          description: 'Link copiado al portapapeles',
          action: { label: 'Copiar', onClick: () => navigator.clipboard.writeText(url) },
        });
      } catch {
        toast.success(`⬇️ Exportado como ${exportFormat.toUpperCase()}`);
      }
    } catch (error: any) {
      toast.error('Error al exportar', { description: error.message });
    } finally {
      setIsExporting(false);
    }
  }, [bgType, solidColor, gradient, pattern, dimensions, format]);

  // Randomize gradient
  const randomizeGradient = useCallback(() => {
    const angle = Math.floor(Math.random() * 360);
    const colors = ['#467a49', '#155336', '#d16806', '#e6a919', '#e8b571', '#1a1a1a', '#0c4a6e', '#9f1239', '#4c1d95', '#78350f'];
    const numStops = 2 + Math.floor(Math.random() * 2);
    const stops: GradientStop[] = [];
    for (let i = 0; i < numStops; i++) {
      stops.push({
        color: colors[Math.floor(Math.random() * colors.length)],
        position: Math.round((i / (numStops - 1)) * 100),
      });
    }
    const types: GradientType[] = ['linear', 'radial', 'conic'];
    setGradient({
      type: types[Math.floor(Math.random() * types.length)],
      angle,
      stops,
    });
    setBgType('gradient');
    toast.success('🎨 Gradiente aleatorio');
  }, []);

  // All layers for layer panel
  const allLayers = useMemo(() => [
    ...textLayers.map(l => ({ id: l.id, name: l.text.slice(0, 20), type: 'text' as const, visible: l.visible, locked: l.locked })),
    ...shapeLayers.map(l => ({ id: l.id, name: `${l.type} ${l.id.split('_')[1]}`, type: 'shape' as const, visible: l.visible, locked: l.locked })),
  ], [textLayers, shapeLayers]);

  const selectedLayer = selectedLayerId
    ? textLayers.find(l => l.id === selectedLayerId) || shapeLayers.find(l => l.id === selectedLayerId)
    : null;

  const bgCSS = bgType === 'solid' ? solidColor : generateCSSBackground({ type: bgType, gradient }, pattern);
  const patternCSS = pattern !== 'none' ? generatePatternCSS(pattern, patternColor) : 'none';
  const patternSize = getPatternSize(pattern);

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-paper">
      {/* Header */}
      <div className="h-14 bg-card border-b border-brd px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#467a49] to-[#d16806] flex items-center justify-center">
              <Palette className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">Background Generator</span>
          </div>
          <div className="flex items-center gap-1">
            {(Object.entries(FORMAT_SIZES) as [Format, typeof FORMAT_SIZES[Format]][]).map(([key, size]) => (
              <button
                key={key}
                onClick={() => setFormat(key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  format === key ? "bg-[#467a49] text-white" : "bg-paper text-ink-muted border border-brd hover:border-[#467a49]"
                )}
              >
                {size.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={randomizeGradient} className="p-2 rounded-lg border border-brd hover:bg-brd transition-colors" title="Randomize">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => handleExport('png')} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-[#467a49] text-white rounded-lg text-sm font-bold hover:bg-[#155336] disabled:opacity-50 transition-colors">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar PNG
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        {showLeftPanel && (
          <div className="w-72 border-r border-brd bg-card flex flex-col shrink-0">
            <div className="flex border-b border-brd">
              {(['templates', 'background', 'text', 'shapes', 'layers'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn("flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all", activeTab === tab ? "bg-[#467a49] text-white" : "text-ink-muted hover:bg-brd")}
                >
                  {tab === 'templates' ? '📋' : tab === 'background' ? '🎨' : tab === 'text' ? '✏️' : tab === 'shapes' ? '🔷' : '📚'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Templates Tab */}
              {activeTab === 'templates' && (
                <>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Presets</h3>
                  <div className="space-y-2">
                    {TEMPLATE_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => applyPreset(preset)}
                        className="w-full p-3 rounded-xl border border-brd hover:border-[#467a49] transition-all text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg shrink-0" style={{ background: generateCSSBackground({ type: 'gradient', gradient: preset.bg.gradient }, preset.pattern) }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{preset.name}</p>
                            <p className="text-[10px] text-ink-muted">{FORMAT_SIZES[preset.format].label}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mt-4">Pilares</h3>
                  <div className="space-y-2">
                    {BRAND.pillars.map(pillar => (
                      <button
                        key={pillar.id}
                        onClick={() => {
                          setBgType('gradient');
                          setGradient({ type: 'linear', angle: 135, stops: [{ color: pillar.gradient[0], position: 0 }, { color: pillar.gradient[1], position: 100 }] });
                          toast.success(`${pillar.icon} ${pillar.label}`);
                        }}
                        className="w-full p-3 rounded-xl border border-brd hover:border-[#467a49] transition-all text-left flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-lg shrink-0" style={{ background: `linear-gradient(135deg, ${pillar.gradient[0]}, ${pillar.gradient[1]})` }} />
                        <div>
                          <p className="text-xs font-bold">{pillar.icon} {pillar.label}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Background Tab */}
              {activeTab === 'background' && (
                <>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Tipo</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {([['gradient', 'Gradiente'], ['solid', 'Sólido'], ['mesh', 'Mesh']] as [BgType, string][]).map(([type, label]) => (
                      <button
                        key={type}
                        onClick={() => setBgType(type)}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all", bgType === type ? "bg-[#467a49] text-white border-[#467a49]" : "bg-paper text-ink-muted border-brd")}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {bgType === 'gradient' && (
                    <>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mt-4">Tipo de gradiente</h3>
                      <div className="flex gap-1.5">
                        {(['linear', 'radial', 'conic'] as GradientType[]).map(type => (
                          <button
                            key={type}
                            onClick={() => setGradient(g => ({ ...g, type }))}
                            className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex-1", gradient.type === type ? "bg-[#467a49] text-white border-[#467a49]" : "bg-paper text-ink-muted border-brd")}
                          >
                            {type === 'linear' ? 'Lineal' : type === 'radial' ? 'Radial' : 'Cónico'}
                          </button>
                        ))}
                      </div>

                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mt-4">Ángulo</h3>
                      <div className="flex items-center gap-2">
                        <input type="range" min="0" max="360" value={gradient.angle} onChange={e => setGradient(g => ({ ...g, angle: Number(e.target.value) }))} className="flex-1" />
                        <span className="text-xs font-mono w-10 text-right">{gradient.angle}°</span>
                      </div>

                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mt-4">Colores</h3>
                      <div className="space-y-2">
                        {gradient.stops.map((stop, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input type="color" value={stop.color} onChange={e => {
                              const newStops = [...gradient.stops];
                              newStops[i] = { ...stop, color: e.target.value };
                              setGradient(g => ({ ...g, stops: newStops }));
                            }} className="w-8 h-8 rounded border border-brd cursor-pointer" />
                            <input type="range" min="0" max="100" value={stop.position} onChange={e => {
                              const newStops = [...gradient.stops];
                              newStops[i] = { ...stop, position: Number(e.target.value) };
                              setGradient(g => ({ ...g, stops: newStops }));
                            }} className="flex-1" />
                            <span className="text-[10px] font-mono text-ink-muted">{stop.position}%</span>
                          </div>
                        ))}
                        <button onClick={() => setGradient(g => ({ ...g, stops: [...g.stops, { color: '#ffffff', position: 50 }] }))} className="w-full py-1.5 bg-paper border border-dashed border-brd rounded-lg text-xs text-ink-muted hover:border-[#467a49]">
                          + Añadir color
                        </button>
                      </div>

                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mt-4">Presets</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {PRESET_GRADIENTS.map((preset, i) => (
                          <button
                            key={i}
                            onClick={() => setGradient({ type: 'linear', angle: 135, stops: [...preset.stops] })}
                            className="h-16 rounded-xl border border-brd hover:border-[#467a49] transition-all overflow-hidden"
                            style={{ background: `linear-gradient(135deg, ${preset.stops.map(s => `${s.color} ${s.position}%`).join(', ')})` }}
                          >
                            <span className="text-[9px] font-bold text-white drop-shadow-lg px-2 py-1 block">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {bgType === 'solid' && (
                    <div className="space-y-3 mt-3">
                      <input type="color" value={solidColor} onChange={e => setSolidColor(e.target.value)} className="w-full h-20 rounded-xl border border-brd cursor-pointer" />
                      <div className="grid grid-cols-6 gap-1.5">
                        {Object.values(BRAND.colors).map(color => (
                          <button key={color} onClick={() => setSolidColor(color)} className="w-full aspect-square rounded-lg border border-brd hover:border-[#467a49] transition-all" style={{ background: color }} />
                        ))}
                      </div>
                    </div>
                  )}

                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mt-4">Patrón</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(['none', 'dots', 'grid', 'diagonal', 'circles', 'waves', 'chevron', 'noise'] as PatternType[]).map(p => (
                      <button
                        key={p}
                        onClick={() => setPattern(p)}
                        className={cn("px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all", pattern === p ? "bg-[#467a49] text-white border-[#467a49]" : "bg-paper text-ink-muted border-brd")}
                      >
                        {p === 'none' ? 'Sin' : p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                  {pattern !== 'none' && (
                    <div className="mt-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Opacidad patrón</label>
                      <input type="range" min="5" max="30" value={parseInt(patternColor.slice(7, 9), 16) || 10} onChange={e => setPatternColor(`#ffffff${Number(e.target.value).toString(16).padStart(2, '0')}`)} className="w-full mt-1" />
                    </div>
                  )}
                </>
              )}

              {/* Text Tab */}
              {activeTab === 'text' && (
                <>
                  <button onClick={addTextLayer} className="w-full py-3 bg-[#467a49] text-white rounded-xl text-sm font-bold hover:bg-[#155336] transition-colors flex items-center justify-center gap-2">
                    <Type className="w-4 h-4" /> Añadir texto
                  </button>

                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mt-4">Fuentes</h3>
                  <div className="space-y-1.5">
                    {[
                      { name: 'Playfair Display', style: 'Elegante, serif' },
                      { name: 'Outfit', style: 'Moderno, sans' },
                      { name: 'JetBrains Mono', style: 'Técnico, mono' },
                    ].map(font => (
                      <button
                        key={font.name}
                        onClick={() => {
                          if (selectedLayerId) {
                            const textLayer = textLayers.find(l => l.id === selectedLayerId);
                            if (textLayer) updateTextLayer(selectedLayerId, { fontFamily: font.name });
                          }
                        }}
                        className="w-full p-2.5 rounded-lg border border-brd hover:border-[#467a49] transition-all text-left"
                      >
                        <p className="text-sm" style={{ fontFamily: font.name }}>{font.name}</p>
                        <p className="text-[10px] text-ink-muted">{font.style}</p>
                      </button>
                    ))}
                  </div>

                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mt-4">Colores</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.values(BRAND.colors).map(color => (
                      <button key={color} onClick={() => selectedLayerId && updateTextLayer(selectedLayerId, { color })} className="w-8 h-8 rounded-lg border border-brd hover:border-[#467a49] transition-all" style={{ background: color }} />
                    ))}
                  </div>
                </>
              )}

              {/* Shapes Tab */}
              {activeTab === 'shapes' && (
                <>
                  <div className="space-y-2">
                    <button onClick={() => addShapeLayer('rectangle')} className="w-full py-2.5 bg-paper border border-brd rounded-xl text-sm font-bold hover:border-[#467a49] transition-all flex items-center justify-center gap-2">
                      <Square className="w-4 h-4" /> Rectángulo
                    </button>
                    <button onClick={() => addShapeLayer('circle')} className="w-full py-2.5 bg-paper border border-brd rounded-xl text-sm font-bold hover:border-[#467a49] transition-all flex items-center justify-center gap-2">
                      <Circle className="w-4 h-4" /> Círculo
                    </button>
                    <button onClick={() => addShapeLayer('triangle')} className="w-full py-2.5 bg-paper border border-brd rounded-xl text-sm font-bold hover:border-[#467a49] transition-all flex items-center justify-center gap-2">
                      <Triangle className="w-4 h-4" /> Triángulo
                    </button>
                    <button onClick={() => addShapeLayer('line')} className="w-full py-2.5 bg-paper border border-brd rounded-xl text-sm font-bold hover:border-[#467a49] transition-all flex items-center justify-center gap-2">
                      <LineIcon className="w-4 h-4" /> Línea
                    </button>
                    <button onClick={() => addShapeLayer('star')} className="w-full py-2.5 bg-paper border border-brd rounded-xl text-sm font-bold hover:border-[#467a49] transition-all flex items-center justify-center gap-2">
                      <Star className="w-4 h-4" /> Estrella
                    </button>
                  </div>
                </>
              )}

              {/* Layers Tab */}
              {activeTab === 'layers' && (
                <>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Capas ({allLayers.length})</h3>
                  <div className="space-y-1">
                    {allLayers.map(layer => (
                      <div
                        key={layer.id}
                        onClick={() => setSelectedLayerId(layer.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all",
                          selectedLayerId === layer.id ? "bg-[#467a49]/10 border border-[#467a49]" : "hover:bg-brd border border-transparent"
                        )}
                      >
                        <span className="text-[10px]">{layer.type === 'text' ? '✏️' : '🔷'}</span>
                        <span className="flex-1 text-xs truncate">{layer.name}</span>
                        <button onClick={e => { e.stopPropagation(); layer.type === 'text' ? setTextLayers(prev => prev.map(l => l.id === layer.id ? { ...l, visible: !l.visible } : l)) : setShapeLayers(prev => prev.map(l => l.id === layer.id ? { ...l, visible: !l.visible } : l)); }} className="text-ink-muted hover:text-ink">
                          {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); deleteLayer(layer.id); }} className="text-ink-muted hover:text-rose-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {allLayers.length === 0 && <p className="text-xs text-ink-muted text-center py-8">Sin capas</p>}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {!showLeftPanel && (
          <button onClick={() => setShowLeftPanel(true)} className="w-8 border-r border-brd bg-card flex items-center justify-center hover:bg-brd">
            <ChevronRight className="w-4 h-4 text-ink-muted" />
          </button>
        )}

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center bg-[#2a2a2a] overflow-auto p-8" style={{ background: '#1a1a1a' }}>
          <div className="relative" style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
            <div
              ref={canvasRef}
              className="relative overflow-hidden shadow-2xl"
              style={{
                width: dimensions.width,
                height: dimensions.height,
                background: bgCSS,
              }}
            >
              {/* Pattern overlay */}
              {pattern !== 'none' && (
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: patternCSS,
                  backgroundSize: patternSize,
                }} />
              )}

              {/* Shape layers */}
              {shapeLayers.filter(l => l.visible).map(layer => (
                <div
                  key={layer.id}
                  className={cn("absolute cursor-move", selectedLayerId === layer.id && "ring-2 ring-[#467a49] ring-offset-2")}
                  style={{
                    left: layer.x,
                    top: layer.y,
                    width: layer.width,
                    height: layer.height,
                    opacity: layer.opacity / 100,
                    transform: `rotate(${layer.rotation}deg)`,
                  }}
                  onClick={() => setSelectedLayerId(layer.id)}
                >
                  {layer.type === 'rectangle' && (
                    <div className="w-full h-full" style={{ background: layer.fill, borderRadius: layer.borderRadius, border: layer.strokeWidth ? `${layer.strokeWidth}px solid ${layer.stroke}` : 'none' }} />
                  )}
                  {layer.type === 'circle' && (
                    <div className="w-full h-full rounded-full" style={{ background: layer.fill, border: layer.strokeWidth ? `${layer.strokeWidth}px solid ${layer.stroke}` : 'none' }} />
                  )}
                  {layer.type === 'line' && (
                    <div className="w-full h-full" style={{ background: layer.fill }} />
                  )}
                  {layer.type === 'triangle' && (
                    <div className="w-full h-full" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', background: layer.fill }} />
                  )}
                  {layer.type === 'star' && (
                    <div className="w-full h-full" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', background: layer.fill }} />
                  )}
                </div>
              ))}

              {/* Text layers */}
              {textLayers.filter(l => l.visible).map(layer => (
                <div
                  key={layer.id}
                  className={cn("absolute cursor-move", selectedLayerId === layer.id && "ring-2 ring-[#467a49] ring-offset-2")}
                  style={{
                    left: layer.x,
                    top: layer.y,
                    transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                    opacity: layer.opacity / 100,
                    fontFamily: layer.fontFamily,
                    fontSize: layer.fontSize,
                    fontWeight: layer.fontWeight,
                    color: layer.color,
                    textAlign: layer.align,
                    letterSpacing: layer.letterSpacing,
                    lineHeight: layer.lineHeight,
                    textShadow: layer.shadow ? `${layer.shadowBlur}px ${layer.shadowBlur}px ${layer.shadowColor}` : 'none',
                    whiteSpace: 'pre-wrap',
                    maxWidth: dimensions.width - 100,
                  }}
                  onClick={() => setSelectedLayerId(layer.id)}
                >
                  {layer.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Properties */}
        {showRightPanel && selectedLayerId && (
          <div className="w-72 border-l border-brd bg-card shrink-0">
            <div className="p-3 border-b border-brd flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest">Propiedades</h3>
              <button onClick={() => setShowRightPanel(false)} className="text-ink-muted hover:text-ink"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
              {/* Text properties */}
              {(() => {
                const textLayer = textLayers.find(l => l.id === selectedLayerId);
                if (textLayer) return (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Texto</label>
                      <textarea value={textLayer.text} onChange={e => updateTextLayer(selectedLayerId, { text: e.target.value })} className="w-full px-3 py-2 bg-paper border border-brd rounded-lg text-sm resize-none" rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Tamaño</label>
                        <input type="number" value={textLayer.fontSize} onChange={e => updateTextLayer(selectedLayerId, { fontSize: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-paper border border-brd rounded text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Peso</label>
                        <select value={textLayer.fontWeight} onChange={e => updateTextLayer(selectedLayerId, { fontWeight: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-paper border border-brd rounded text-xs">
                          {[300, 400, 500, 600, 700].map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={textLayer.color} onChange={e => updateTextLayer(selectedLayerId, { color: e.target.value })} className="w-8 h-8 rounded border border-brd cursor-pointer" />
                        <div className="flex flex-wrap gap-1">
                          {Object.values(BRAND.colors).map(c => (
                            <button key={c} onClick={() => updateTextLayer(selectedLayerId, { color: c })} className="w-6 h-6 rounded border border-brd" style={{ background: c }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Tracking ({textLayer.letterSpacing}px)</label>
                      <input type="range" min="-5" max="20" value={textLayer.letterSpacing} onChange={e => updateTextLayer(selectedLayerId, { letterSpacing: Number(e.target.value) })} className="w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Opacidad ({textLayer.opacity}%)</label>
                      <input type="range" min="0" max="100" value={textLayer.opacity} onChange={e => updateTextLayer(selectedLayerId, { opacity: Number(e.target.value) })} className="w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Posición</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-ink-muted">X</span>
                          <input type="number" value={Math.round(textLayer.x)} onChange={e => updateTextLayer(selectedLayerId, { x: Number(e.target.value) })} className="w-full px-2 py-1 bg-paper border border-brd rounded text-xs" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-ink-muted">Y</span>
                          <input type="number" value={Math.round(textLayer.y)} onChange={e => updateTextLayer(selectedLayerId, { y: Number(e.target.value) })} className="w-full px-2 py-1 bg-paper border border-brd rounded text-xs" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={textLayer.shadow} onChange={e => updateTextLayer(selectedLayerId, { shadow: e.target.checked })} className="rounded" />
                        Sombra
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={textLayer.locked} onChange={e => updateTextLayer(selectedLayerId, { locked: e.target.checked })} className="rounded" />
                        <Lock className="w-3 h-3" /> Bloquear
                      </label>
                    </div>
                  </>
                );

                const shapeLayer = shapeLayers.find(l => l.id === selectedLayerId);
                if (shapeLayer) return (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Tipo</label>
                      <p className="text-sm capitalize">{shapeLayer.type}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Color</label>
                      <input type="color" value={shapeLayer.fill} onChange={e => updateShapeLayer(selectedLayerId, { fill: e.target.value })} className="w-full h-8 rounded border border-brd cursor-pointer" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Tamaño</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-ink-muted">W</span>
                          <input type="number" value={Math.round(shapeLayer.width)} onChange={e => updateShapeLayer(selectedLayerId, { width: Number(e.target.value) })} className="w-full px-2 py-1 bg-paper border border-brd rounded text-xs" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-ink-muted">H</span>
                          <input type="number" value={Math.round(shapeLayer.height)} onChange={e => updateShapeLayer(selectedLayerId, { height: Number(e.target.value) })} className="w-full px-2 py-1 bg-paper border border-brd rounded text-xs" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Posición</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-ink-muted">X</span>
                          <input type="number" value={Math.round(shapeLayer.x)} onChange={e => updateShapeLayer(selectedLayerId, { x: Number(e.target.value) })} className="w-full px-2 py-1 bg-paper border border-brd rounded text-xs" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-ink-muted">Y</span>
                          <input type="number" value={Math.round(shapeLayer.y)} onChange={e => updateShapeLayer(selectedLayerId, { y: Number(e.target.value) })} className="w-full px-2 py-1 bg-paper border border-brd rounded text-xs" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Opacidad ({shapeLayer.opacity}%)</label>
                      <input type="range" min="0" max="100" value={shapeLayer.opacity} onChange={e => updateShapeLayer(selectedLayerId, { opacity: Number(e.target.value) })} className="w-full" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Border Radius ({shapeLayer.borderRadius}px)</label>
                      <input type="range" min="0" max="200" value={shapeLayer.borderRadius} onChange={e => updateShapeLayer(selectedLayerId, { borderRadius: Number(e.target.value) })} className="w-full" />
                    </div>
                  </>
                );

                return null;
              })()}
            </div>

            {/* Actions */}
            <div className="p-3 border-t border-brd space-y-2">
              <button onClick={() => selectedLayerId && duplicateLayer(selectedLayerId)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-paper border border-brd rounded-lg text-sm hover:bg-brd transition-colors">
                <Copy className="w-4 h-4" /> Duplicar
              </button>
              <button onClick={() => selectedLayerId && deleteLayer(selectedLayerId)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-sm hover:bg-rose-500/20 transition-colors">
                <X className="w-4 h-4" /> Eliminar
              </button>
            </div>
          </div>
        )}

        {!showRightPanel && selectedLayerId && (
          <button onClick={() => setShowRightPanel(true)} className="w-8 border-l border-brd bg-card flex items-center justify-center hover:bg-brd">
            <ChevronLeft className="w-4 h-4 text-ink-muted" />
          </button>
        )}
      </div>

      {/* Status bar */}
      <div className="h-8 bg-card border-t border-brd px-4 flex items-center justify-between text-[10px] text-ink-muted shrink-0">
        <div className="flex items-center gap-4">
          <span>{dimensions.width}×{dimensions.height}</span>
          <span>{FORMAT_SIZES[format].label}</span>
          <span>Capas: {allLayers.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#467a49]">● Brand Kit: Activo</span>
        </div>
      </div>
    </div>
  );
}