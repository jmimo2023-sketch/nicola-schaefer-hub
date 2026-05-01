/**
 * Shamanic Template Engine - Nicola Schaefer Hub
 * 
 * Visual content generator focused on shamanic/indigenous medicine aesthetics.
 * Features:
 * - Sacred geometry patterns (Flower of Life, mandalas, etc.)
 * - Indigenous-inspired motifs (Andean, Amazonian, pre-Columbian)
 * - Earth-mystic color palettes
 * - Layered pattern composition
 * - Nature element overlays (plants, feathers, smoke)
 * - Multi-format export (post, story, reel)
 * - Real-time preview with customizable parameters
 */

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  Sparkles, Download, Copy, RefreshCw, Palette, Type, Layers,
  ChevronLeft, ChevronRight, ChevronDown, Wand2, Sliders, Eye,
  EyeOff, X, Check, Loader2, Zap, Leaf, Mountain, Sun, Moon,
  Droplets, Wind, Flower2, Gem, CircleDot, Grid3X3, Triangle,
  Hexagon, Star, TreePine, Feather, Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { contentAgentService } from '../services/contentAgentService';

// ============================================================================
// TYPES
// ============================================================================

type Format = 'post' | 'story' | 'reel' | 'carousel';
type Theme = 'andean' | 'amazonian' | 'precolumbian' | 'cosmic' | 'earth' | 'fire' | 'water' | 'jungle';
type SacredPattern = 'flower-of-life' | 'mandala' | 'chakana' | 'sun-gate' | 'serpent' | 'feathers' | 'spiral' | 'tree-of-life' | 'labyrinth' | 'none';
type OverlayType = 'smoke' | 'light-rays' | 'mist' | 'grain' | 'vignette' | 'none';

interface ThemeConfig {
  id: Theme;
  label: string;
  icon: string;
  description: string;
  colors: string[];
  gradient: string[];
  patternDefault: SacredPattern;
}

// ============================================================================
// SHAMANIC THEMES
// ============================================================================

const THEMES: ThemeConfig[] = [
  {
    id: 'andean',
    label: 'Andino',
    icon: '🏔️',
    description: 'Montañas sagradas, chakana, Pachamama',
    colors: ['#467a49', '#155336', '#e8b571', '#d16806', '#8B4513', '#2d1b0e'],
    gradient: ['#155336', '#467a49', '#e8b571'],
    patternDefault: 'chakana',
  },
  {
    id: 'amazonian',
    label: 'Amazónico',
    icon: '🌿',
    description: 'Selva, plantas maestras, ayahuasca',
    colors: ['#0d3b0d', '#1a5c1a', '#2d8b2d', '#467a49', '#5a4a2a', '#3d2b1a'],
    gradient: ['#0d3b0d', '#1a5c1a', '#467a49'],
    patternDefault: 'serpent',
  },
  {
    id: 'precolumbian',
    label: 'Precolombino',
    icon: '🏺',
    description: 'Arte geométrico ancestral, petroglifos',
    colors: ['#8B4513', '#A0522D', '#CD853F', '#d16806', '#1a1a1a', '#fefcf8'],
    gradient: ['#8B4513', '#A0522D', '#CD853F'],
    patternDefault: 'mandala',
  },
  {
    id: 'cosmic',
    label: 'Cósmico',
    icon: '🌌',
    description: 'Cielo nocturno, constelaciones, visiones',
    colors: ['#0a0a2e', '#1a1a4e', '#2d1b69', '#4c1d95', '#7c3aed', '#e8b571'],
    gradient: ['#0a0a2e', '#2d1b69', '#4c1d95'],
    patternDefault: 'flower-of-life',
  },
  {
    id: 'earth',
    label: 'Tierra',
    icon: '🌍',
    description: 'Barro, arcilla, raíces, Pachamama',
    colors: ['#3d2b1a', '#5c3d2e', '#8B4513', '#A0522D', '#467a49', '#d16806'],
    gradient: ['#3d2b1a', '#5c3d2e', '#8B4513'],
    patternDefault: 'tree-of-life',
  },
  {
    id: 'fire',
    label: 'Fuego',
    icon: '🔥',
    description: 'Ceremonia, transformación, temazcal',
    colors: ['#7f1d1d', '#991b1b', '#b91c1c', '#d16806', '#e6a919', '#fefcf8'],
    gradient: ['#7f1d1d', '#d16806', '#e6a919'],
    patternDefault: 'spiral',
  },
  {
    id: 'water',
    label: 'Agua',
    icon: '💧',
    description: 'Ríos sagrados, purificación, flujo',
    colors: ['#0c4a6e', '#0369a1', '#0284c7', '#06b6d4', '#155336', '#e8b571'],
    gradient: ['#0c4a6e', '#0369a1', '#06b6d4'],
    patternDefault: 'spiral',
  },
  {
    id: 'jungle',
    label: 'Selva',
    icon: '🌴',
    description: 'Vegetación densa, misterio, abundancia',
    colors: ['#052e16', '#14532d', '#166534', '#22c55e', '#467a49', '#d16806'],
    gradient: ['#052e16', '#166534', '#467a49'],
    patternDefault: 'feathers',
  },
];

// ============================================================================
// SACRED GEOMETRY SVG PATTERNS
// ============================================================================

const SacredPatternsSVG: Record<SacredPattern, string> = {
  'flower-of-life': `
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.3">
        <circle cx="200" cy="200" r="80"/>
        <circle cx="200" cy="120" r="80"/>
        <circle cx="200" cy="280" r="80"/>
        <circle cx="131" cy="160" r="80"/>
        <circle cx="131" cy="240" r="80"/>
        <circle cx="269" cy="160" r="80"/>
        <circle cx="269" cy="240" r="80"/>
        <circle cx="200" cy="200" r="160"/>
      </g>
    </svg>`,
  'mandala': `
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.3" transform="translate(200,200)">
        <circle r="180"/><circle r="140"/><circle r="100"/><circle r="60"/><circle r="20"/>
        ${Array.from({length: 12}, (_, i) => {
          const a = i * 30 * Math.PI / 180;
          return `<line x1="0" y1="0" x2="${Math.cos(a)*180}" y2="${Math.sin(a)*180}"/>`;
        }).join('')}
        ${Array.from({length: 8}, (_, i) => {
          const a = i * 45 * Math.PI / 180;
          return `<circle cx="${Math.cos(a)*100}" cy="${Math.sin(a)*100}" r="40"/>`;
        }).join('')}
      </g>
    </svg>`,
  'chakana': `
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.25" transform="translate(200,200)">
        <rect x="-150" y="-150" width="300" height="300" transform="rotate(45)"/>
        <rect x="-110" y="-110" width="220" height="220" transform="rotate(45)"/>
        <rect x="-70" y="-70" width="140" height="140" transform="rotate(45)"/>
        ${[-90,-45,0,45].map(a => `<rect x="-40" y="-40" width="80" height="80" transform="rotate(${a})"/>`).join('')}
        <circle r="25"/><circle r="150"/>
        ${Array.from({length: 4}, (_, i) => {
          const a = i * 90 * Math.PI / 180;
          return `<line x1="${Math.cos(a)*25}" y1="${Math.sin(a)*25}" x2="${Math.cos(a)*150}" y2="${Math.sin(a)*150}"/>`;
        }).join('')}
      </g>
    </svg>`,
  'sun-gate': `
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.25" transform="translate(200,200)">
        <circle r="180"/><circle r="150"/><circle r="120"/><circle r="40"/>
        ${Array.from({length: 16}, (_, i) => {
          const a = i * 22.5 * Math.PI / 180;
          return `<line x1="${Math.cos(a)*40}" y1="${Math.sin(a)*40}" x2="${Math.cos(a)*180}" y2="${Math.sin(a)*180}"/>`;
        }).join('')}
        ${Array.from({length: 8}, (_, i) => {
          const a = i * 45 * Math.PI / 180;
          return `<circle cx="${Math.cos(a)*120}" cy="${Math.sin(a)*120}" r="25"/>`;
        }).join('')}
        ${Array.from({length: 8}, (_, i) => {
          const a = (i * 45 + 22.5) * Math.PI / 180;
          return `<circle cx="${Math.cos(a)*90}" cy="${Math.sin(a)*90}" r="15"/>`;
        }).join('')}
      </g>
    </svg>`,
  'serpent': `
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor" stroke-width="1" opacity="0.2">
        <path d="M 50,200 Q 100,100 150,200 Q 200,300 250,200 Q 300,100 350,200"/>
        <path d="M 50,220 Q 100,120 150,220 Q 200,320 250,220 Q 300,120 350,220"/>
        <path d="M 50,180 Q 100,80 150,180 Q 200,280 250,180 Q 300,80 350,180"/>
        <path d="M 80,200 Q 130,100 180,200 Q 230,300 280,200 Q 330,100 380,200" transform="rotate(90 200 200)"/>
        <path d="M 80,220 Q 130,120 180,220 Q 230,320 280,220 Q 330,120 380,220" transform="rotate(90 200 200)"/>
        <circle cx="50" cy="200" r="8"/><circle cx="350" cy="200" r="8"/>
        <circle cx="200" cy="50" r="8"/><circle cx="200" cy="350" r="8"/>
      </g>
    </svg>`,
  'feathers': `
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.2">
        ${Array.from({length: 6}, (_, i) => {
          const x = 60 + i * 56;
          return `<g transform="translate(${x}, 200) rotate(${(i-2.5)*15})">
            <path d="M 0,-120 Q 20,-60 15,0 Q 10,60 0,120 Q -10,60 -15,0 Q -20,-60 0,-120 Z"/>
            <line x1="0" y1="-120" x2="0" y2="120"/>
          </g>`;
        }).join('')}
      </g>
    </svg>`,
  'spiral': `
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.2" transform="translate(200,200)">
        <path d="${Array.from({length: 200}, (_, i) => {
          const a = i * 0.15;
          const r = i * 0.9;
          return `${i===0?'M':'L'} ${(Math.cos(a)*r).toFixed(1)} ${(Math.sin(a)*r).toFixed(1)}`;
        }).join(' ')}"/>
        <path d="${Array.from({length: 200}, (_, i) => {
          const a = i * 0.15 + Math.PI;
          const r = i * 0.9;
          return `${i===0?'M':'L'} ${(Math.cos(a)*r).toFixed(1)} ${(Math.sin(a)*r).toFixed(1)}`;
        }).join(' ')}"/>
      </g>
    </svg>`,
  'tree-of-life': `
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.2" transform="translate(200,200)">
        <line x1="0" y1="-180" x2="0" y2="180"/>
        <path d="M 0,-180 Q -80,-120 -60,-60 Q -40,0 0,0"/>
        <path d="M 0,-180 Q 80,-120 60,-60 Q 40,0 0,0"/>
        <path d="M 0,-60 Q -100,20 -80,80 Q -60,140 0,180"/>
        <path d="M 0,-60 Q 100,20 80,80 Q 60,140 0,180"/>
        <circle r="180"/>
        <circle cx="-50" cy="-100" r="20"/><circle cx="50" cy="-100" r="20"/>
        <circle cx="-70" cy="40" r="25"/><circle cx="70" cy="40" r="25"/>
      </g>
    </svg>`,
  'labyrinth': `
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.2" transform="translate(200,200)">
        <circle r="180"/><circle r="150"/><circle r="120"/><circle r="90"/><circle r="60"/><circle r="30"/>
        ${Array.from({length: 8}, (_, i) => {
          const a = i * 45 * Math.PI / 180;
          const a2 = (i * 45 + 22.5) * Math.PI / 180;
          return `<path d="M ${Math.cos(a)*30} ${Math.sin(a)*30} L ${Math.cos(a)*90} ${Math.sin(a)*90} M ${Math.cos(a2)*60} ${Math.sin(a2)*60} L ${Math.cos(a2)*150} ${Math.sin(a2)*150}"/>`;
        }).join('')}
      </g>
    </svg>`,
  'none': '',
};

// ============================================================================
// FORMAT SIZES
// ============================================================================

const FORMAT_SIZES: Record<Format, { width: number; height: number; label: string }> = {
  post: { width: 1080, height: 1080, label: 'Post 1:1' },
  story: { width: 1080, height: 1920, label: 'Story 9:16' },
  reel: { width: 1080, height: 1920, label: 'Reel 9:16' },
  carousel: { width: 1080, height: 1350, label: 'Carousel 4:5' },
};

// ============================================================================
// TEMPLATE PRESETS
// ============================================================================

const TEMPLATE_PRESETS = [
  {
    id: 'ayahuasca-vision',
    name: 'Visión Ayahuasca',
    theme: 'amazonian' as Theme,
    format: 'post' as Format,
    pattern: 'flower-of-life' as SacredPattern,
    overlay: 'mist' as OverlayType,
    texts: [
      { text: 'La Planta\nMaestra', fontFamily: 'Playfair Display', fontSize: 64, fontWeight: 700, color: '#e8b571', x: 540, y: 440, align: 'center' as const, letterSpacing: 4, lineHeight: 1.1, opacity: 100, shadow: true },
      { text: 'Ve. Siente. Transforma.', fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 400, color: '#ffffff80', x: 540, y: 680, align: 'center' as const, letterSpacing: 6, lineHeight: 1, opacity: 60, shadow: false },
    ],
  },
  {
    id: 'chakana-andes',
    name: 'Chakana Andina',
    theme: 'andean' as Theme,
    format: 'post' as Format,
    pattern: 'chakana' as SacredPattern,
    overlay: 'light-rays' as OverlayType,
    texts: [
      { text: 'CHAKANA', fontFamily: 'Playfair Display', fontSize: 72, fontWeight: 700, color: '#ffffff', x: 540, y: 420, align: 'center' as const, letterSpacing: 12, lineHeight: 1, opacity: 100, shadow: true },
      { text: 'Puerta de los Andes', fontFamily: 'Outfit', fontSize: 22, fontWeight: 300, color: '#e8b571', x: 540, y: 540, align: 'center' as const, letterSpacing: 3, lineHeight: 1, opacity: 80, shadow: false },
    ],
  },
  {
    id: 'temazcal-fuego',
    name: 'Temazcal Fuego',
    theme: 'fire' as Theme,
    format: 'story' as Format,
    pattern: 'spiral' as SacredPattern,
    overlay: 'smoke' as OverlayType,
    texts: [
      { text: 'TEMAZCAL', fontFamily: 'Playfair Display', fontSize: 68, fontWeight: 700, color: '#fefcf8', x: 540, y: 600, align: 'center' as const, letterSpacing: 10, lineHeight: 1, opacity: 100, shadow: true },
      { text: 'Renace en el fuego sagrado', fontFamily: 'Outfit', fontSize: 20, fontWeight: 300, color: '#e6a91990', x: 540, y: 720, align: 'center' as const, letterSpacing: 2, lineHeight: 1, opacity: 70, shadow: false },
    ],
  },
  {
    id: 'pachamama',
    name: 'Pachamama',
    theme: 'earth' as Theme,
    format: 'post' as Format,
    pattern: 'tree-of-life' as SacredPattern,
    overlay: 'grain' as OverlayType,
    texts: [
      { text: 'PACHAMAMA', fontFamily: 'Playfair Display', fontSize: 64, fontWeight: 700, color: '#fefcf8', x: 540, y: 400, align: 'center' as const, letterSpacing: 8, lineHeight: 1, opacity: 100, shadow: true },
      { text: 'Madre Tierra\nMadre Vida', fontFamily: 'Outfit', fontSize: 24, fontWeight: 300, color: '#d16806', x: 540, y: 540, align: 'center' as const, letterSpacing: 2, lineHeight: 1.3, opacity: 90, shadow: false },
    ],
  },
  {
    id: 'vision-cosmica',
    name: 'Visión Cósmica',
    theme: 'cosmic' as Theme,
    format: 'story' as Format,
    pattern: 'mandala' as SacredPattern,
    overlay: 'light-rays' as OverlayType,
    texts: [
      { text: 'VISIÓN\nCÓSMICA', fontFamily: 'Playfair Display', fontSize: 60, fontWeight: 700, color: '#e8b571', x: 540, y: 550, align: 'center' as const, letterSpacing: 6, lineHeight: 1.1, opacity: 100, shadow: true },
      { text: 'Las estrellas guían el camino', fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 400, color: '#7c3aed80', x: 540, y: 780, align: 'center' as const, letterSpacing: 4, lineHeight: 1, opacity: 50, shadow: false },
    ],
  },
  {
    id: 'serpiente-sabiduria',
    name: 'Serpiente Sabiduría',
    theme: 'jungle' as Theme,
    format: 'post' as Format,
    pattern: 'serpent' as SacredPattern,
    overlay: 'mist' as OverlayType,
    texts: [
      { text: 'La Serpiente\ndel Conocimiento', fontFamily: 'Playfair Display', fontSize: 52, fontWeight: 700, color: '#fefcf8', x: 540, y: 420, align: 'center' as const, letterSpacing: 3, lineHeight: 1.15, opacity: 100, shadow: true },
      { text: 'Muda tu piel. Renace.', fontFamily: 'Outfit', fontSize: 18, fontWeight: 400, color: '#22c55e60', x: 540, y: 640, align: 'center' as const, letterSpacing: 2, lineHeight: 1, opacity: 50, shadow: false },
    ],
  },
];

// ============================================================================
// OVERLAY GENERATORS
// ============================================================================

function getOverlayCSS(overlay: OverlayType): React.CSSProperties {
  switch (overlay) {
    case 'smoke':
      return {
        background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at 30% 100%, rgba(255,255,255,0.08) 0%, transparent 50%)',
      };
    case 'light-rays':
      return {
        background: 'conic-gradient(from 180deg, transparent 0%, rgba(255,255,255,0.06) 5%, transparent 10%, rgba(255,255,255,0.04) 15%, transparent 20%, rgba(255,255,255,0.06) 25%, transparent 30%)',
      };
    case 'mist':
      return {
        background: 'linear-gradient(to top, rgba(255,255,255,0.2) 0%, transparent 40%), linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, transparent 30%)',
      };
    case 'grain':
      return {
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.08\'/%3E%3C/svg%3E")',
        backgroundSize: '128px 128px',
      };
    case 'vignette':
      return {
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
      };
    default:
      return {};
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ShamanicTemplateEngine() {
  const [format, setFormat] = useState<Format>('post');
  const [theme, setTheme] = useState<Theme>('andean');
  const [sacredPattern, setSacredPattern] = useState<SacredPattern>('chakana');
  const [patternScale, setPatternScale] = useState(1);
  const [patternOpacity, setPatternOpacity] = useState(25);
  const [patternColor, setPatternColor] = useState('#ffffff');
  const [gradientAngle, setGradientAngle] = useState(135);
  const [customColors, setCustomColors] = useState<string[]>(THEMES[0].gradient);
  const [overlay, setOverlay] = useState<OverlayType>('vignette');
  const [texts, setTexts] = useState(TEMPLATE_PRESETS[1].texts.map(t => ({ ...t, id: `text_0` })));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'themes' | 'pattern' | 'text' | 'overlay'>('themes');
  const [isExporting, setIsExporting] = useState(false);
  const [scale, setScale] = useState(0.45);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dimensions = FORMAT_SIZES[format];
  const themeConfig = THEMES.find(t => t.id === theme) || THEMES[0];

  // Apply theme
  const applyTheme = useCallback((t: Theme) => {
    const config = THEMES.find(th => th.id === t)!;
    setTheme(t);
    setSacredPattern(config.patternDefault);
    setCustomColors([...config.gradient]);
    setPatternColor('#ffffff');
    toast.success(`${config.icon} Tema: ${config.label}`);
  }, []);

  // Apply preset
  const applyPreset = useCallback((preset: typeof TEMPLATE_PRESETS[0]) => {
    setTheme(preset.theme);
    setFormat(preset.format);
    setSacredPattern(preset.pattern);
    setOverlay(preset.overlay);
    const config = THEMES.find(t => t.id === preset.theme)!;
    setCustomColors([...config.gradient]);
    setTexts(preset.texts.map((t, i) => ({ ...t, id: `text_${i}` })));
    toast.success(`📋 "${preset.name}" aplicado`);
  }, []);

  // Text operations
  const addText = useCallback(() => {
    const id = `text_${Date.now()}`;
    setTexts(prev => [...prev, {
      id, text: 'Texto sagrado', fontFamily: 'Playfair Display', fontSize: 48, fontWeight: 600,
      color: '#ffffff', x: dimensions.width / 2, y: dimensions.height / 2, align: 'center' as const,
      letterSpacing: 2, lineHeight: 1.2, opacity: 100, shadow: true,
    }]);
    setSelectedId(id);
  }, [dimensions]);

  const updateText = useCallback((id: string, updates: any) => {
    setTexts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteText = useCallback((id: string) => {
    setTexts(prev => prev.filter(t => t.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  // Export
  const handleExport = useCallback(async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(canvasRef.current, {
        width: dimensions.width,
        height: dimensions.height,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `shamanic-${theme}-${format}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const url = await contentAgentService.uploadToSupabase(blob, 'designs');
        toast.success('💾 Guardado en Supabase', {
          action: { label: 'Copiar link', onClick: () => navigator.clipboard.writeText(url) },
        });
      } catch {
        toast.success('⬇️ PNG exportado');
      }
    } catch (error: any) {
      toast.error('Error al exportar', { description: error.message });
    } finally {
      setIsExporting(false);
    }
  }, [dimensions, theme, format]);

  // Randomize
  const randomize = useCallback(() => {
    const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const patterns = Object.keys(SacredPatternsSVG).filter(p => p !== 'none') as SacredPattern[];
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
    const overlays: OverlayType[] = ['smoke', 'light-rays', 'mist', 'grain', 'vignette'];
    const randomOverlay = overlays[Math.floor(Math.random() * overlays.length)];
    setTheme(randomTheme.id);
    setSacredPattern(randomPattern);
    setOverlay(randomOverlay);
    setCustomColors([...randomTheme.gradient]);
    setGradientAngle(Math.floor(Math.random() * 360));
    setPatternScale(0.8 + Math.random() * 0.8);
    setPatternOpacity(15 + Math.floor(Math.random() * 20));
    toast.success(`${randomTheme.icon} Inspiración chamánica`);
  }, []);

  const bgGradient = `linear-gradient(${gradientAngle}deg, ${customColors.map((c, i) => `${c} ${Math.round((i / (customColors.length - 1)) * 100)}%`).join(', ')})`;
  const selectedText = texts.find(t => t.id === selectedId);

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-paper">
      {/* Header */}
      <div className="h-14 bg-card border-b border-brd px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#467a49] via-[#8B4513] to-[#d16806] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">Medicina Chamánica</span>
            <span className="text-[10px] font-mono text-ink-muted uppercase tracking-widest">Template Engine</span>
          </div>
          <div className="flex items-center gap-1">
            {(Object.entries(FORMAT_SIZES) as [Format, typeof FORMAT_SIZES[Format]][]).map(([key, size]) => (
              <button key={key} onClick={() => setFormat(key)} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all", format === key ? "bg-[#467a49] text-white" : "bg-paper text-ink-muted border border-brd hover:border-[#467a49]")}>
                {size.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={randomize} className="p-2 rounded-lg border border-brd hover:bg-brd transition-colors" title="Inspiración aleatoria">
            <Wand2 className="w-4 h-4" />
          </button>
          <button onClick={handleExport} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-[#467a49] text-white rounded-lg text-sm font-bold hover:bg-[#155336] disabled:opacity-50 transition-colors">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar PNG
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-72 border-r border-brd bg-card flex flex-col shrink-0">
          <div className="flex border-b border-brd">
            {(['themes', 'pattern', 'text', 'overlay'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={cn("flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all", activeTab === tab ? "bg-[#467a49] text-white" : "text-ink-muted hover:bg-brd")}>
                {tab === 'themes' ? '🔥' : tab === 'pattern' ? '✨' : tab === 'text' ? '✏️' : '🌫️'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Themes */}
            {activeTab === 'themes' && (
              <>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Temáticas Chamánicas</h3>
                <div className="space-y-2">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => applyTheme(t.id)}
                      className={cn(
                        "w-full p-3 rounded-xl border transition-all text-left group",
                        theme === t.id ? "border-[#467a49] bg-[#467a49]/5 ring-1 ring-[#467a49]/30" : "border-brd hover:border-[#467a49]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl shrink-0" style={{ background: `linear-gradient(135deg, ${t.gradient.join(', ')})` }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold flex items-center gap-1.5">
                            <span>{t.icon}</span> {t.label}
                          </p>
                          <p className="text-[10px] text-ink-muted mt-0.5">{t.description}</p>
                          <div className="flex gap-1 mt-1.5">
                            {t.colors.slice(0, 6).map(c => (
                              <div key={c} className="w-4 h-4 rounded-full border border-brd/50" style={{ background: c }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mt-4">Plantillas Pre-Hechas</h3>
                <div className="space-y-2">
                  {TEMPLATE_PRESETS.map(preset => {
                    const t = THEMES.find(th => th.id === preset.theme)!;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => applyPreset(preset)}
                        className="w-full p-3 rounded-xl border border-brd hover:border-[#467a49] transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center text-lg" style={{ background: `linear-gradient(135deg, ${t.gradient.join(', ')})` }}>
                            {t.icon}
                          </div>
                          <div>
                            <p className="text-xs font-bold">{preset.name}</p>
                            <p className="text-[10px] text-ink-muted">{t.label} · {FORMAT_SIZES[preset.format].label}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Patterns */}
            {activeTab === 'pattern' && (
              <>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Geometría Sagrada</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(SacredPatternsSVG) as SacredPattern[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setSacredPattern(p)}
                      className={cn(
                        "p-3 rounded-xl border transition-all text-center",
                        sacredPattern === p ? "border-[#467a49] bg-[#467a49]/5 ring-1 ring-[#467a49]/30" : "border-brd hover:border-[#467a49]"
                      )}
                    >
                      <div className="w-10 h-10 mx-auto mb-1" style={{ color: patternColor }} dangerouslySetInnerHTML={{ __html: SacredPatternsSVG[p] || '<div class="text-ink-muted text-xs">Sin</div>' }} />
                      <p className="text-[10px] font-bold">{p === 'none' ? 'Sin patrón' : p.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                    </button>
                  ))}
                </div>

                {sacredPattern !== 'none' && (
                  <>
                    <div className="mt-3 space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Escala ({patternScale.toFixed(1)}x)</label>
                      <input type="range" min="0.3" max="3" step="0.1" value={patternScale} onChange={e => setPatternScale(Number(e.target.value))} className="w-full" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Opacidad ({patternOpacity}%)</label>
                      <input type="range" min="5" max="60" value={patternOpacity} onChange={e => setPatternOpacity(Number(e.target.value))} className="w-full" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Color del patrón</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={patternColor} onChange={e => setPatternColor(e.target.value)} className="w-8 h-8 rounded border border-brd cursor-pointer" />
                        <div className="flex gap-1">
                          {['#ffffff', '#e8b571', '#d16806', '#467a49', '#0a0a2e'].map(c => (
                            <button key={c} onClick={() => setPatternColor(c)} className="w-6 h-6 rounded border border-brd" style={{ background: c }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mt-4">Gradiente</h3>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Ángulo ({gradientAngle}°)</label>
                  <input type="range" min="0" max="360" value={gradientAngle} onChange={e => setGradientAngle(Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Colores</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {customColors.map((c, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <input type="color" value={c} onChange={e => {
                          const newColors = [...customColors];
                          newColors[i] = e.target.value;
                          setCustomColors(newColors);
                        }} className="w-8 h-8 rounded border border-brd cursor-pointer" />
                        {customColors.length > 2 && (
                          <button onClick={() => setCustomColors(prev => prev.filter((_, j) => j !== i))} className="text-ink-muted hover:text-rose-500"><X className="w-3 h-3" /></button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setCustomColors(prev => [...prev, '#ffffff'])} className="w-8 h-8 rounded border border-dashed border-brd hover:border-[#467a49] flex items-center justify-center text-ink-muted text-lg">+</button>
                  </div>
                </div>
              </>
            )}

            {/* Text */}
            {activeTab === 'text' && (
              <>
                <button onClick={addText} className="w-full py-3 bg-[#467a49] text-white rounded-xl text-sm font-bold hover:bg-[#155336] transition-colors flex items-center justify-center gap-2">
                  <Type className="w-4 h-4" /> Añadir texto
                </button>
                <div className="space-y-2 mt-3">
                  {texts.map(t => (
                    <div key={t.id} onClick={() => setSelectedId(t.id)} className={cn("p-2 rounded-lg border cursor-pointer transition-all", selectedId === t.id ? "border-[#467a49] bg-[#467a49]/5" : "border-brd hover:border-[#467a49]")}>
                      <p className="text-xs truncate">{t.text}</p>
                    </div>
                  ))}
                </div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mt-4">Fuentes</h3>
                <div className="space-y-1.5">
                  {['Playfair Display', 'Outfit', 'JetBrains Mono'].map(f => (
                    <button key={f} onClick={() => selectedId && updateText(selectedId, { fontFamily: f })} className="w-full p-2 rounded-lg border border-brd hover:border-[#467a49] text-left">
                      <p className="text-sm" style={{ fontFamily: f }}>{f}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Overlay */}
            {activeTab === 'overlay' && (
              <>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Efecto Overlay</h3>
                <div className="space-y-2">
                  {(['none', 'smoke', 'light-rays', 'mist', 'grain', 'vignette'] as OverlayType[]).map(o => (
                    <button
                      key={o}
                      onClick={() => setOverlay(o)}
                      className={cn(
                        "w-full p-3 rounded-xl border transition-all text-left",
                        overlay === o ? "border-[#467a49] bg-[#467a49]/5" : "border-brd hover:border-[#467a49]"
                      )}
                    >
                      <p className="text-xs font-bold">{o === 'none' ? 'Sin overlay' : o === 'smoke' ? '🌫️ Humo ceremonial' : o === 'light-rays' ? '☀️ Rayos de luz' : o === 'mist' ? '💨 Niebla' : o === 'grain' ? '📺 Grano textura' : '🌑 Viñeta'}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-8" style={{ background: '#1a1a1a' }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
            <div
              ref={canvasRef}
              className="relative overflow-hidden shadow-2xl"
              style={{ width: dimensions.width, height: dimensions.height, background: bgGradient }}
            >
              {/* Sacred Pattern */}
              {sacredPattern !== 'none' && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ opacity: patternOpacity / 100, transform: `scale(${patternScale})`, color: patternColor }}
                  dangerouslySetInnerHTML={{ __html: SacredPatternsSVG[sacredPattern] }}
                />
              )}

              {/* Overlay */}
              {overlay !== 'none' && (
                <div className="absolute inset-0 pointer-events-none" style={getOverlayCSS(overlay)} />
              )}

              {/* Text layers */}
              {texts.filter(t => t.opacity > 0).map(t => (
                <div
                  key={t.id}
                  className={cn("absolute cursor-move", selectedId === t.id && "ring-2 ring-[#467a49] ring-offset-2")}
                  style={{
                    left: t.x,
                    top: t.y,
                    transform: 'translate(-50%, -50%)',
                    fontFamily: t.fontFamily,
                    fontSize: t.fontSize,
                    fontWeight: t.fontWeight,
                    color: t.color,
                    textAlign: t.align,
                    letterSpacing: t.letterSpacing,
                    lineHeight: t.lineHeight,
                    opacity: t.opacity / 100,
                    textShadow: t.shadow ? '0 4px 30px rgba(0,0,0,0.5)' : 'none',
                    whiteSpace: 'pre-wrap',
                    maxWidth: dimensions.width - 100,
                  }}
                  onClick={() => setSelectedId(t.id)}
                >
                  {t.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        {selectedId && selectedText && (
          <div className="w-72 border-l border-brd bg-card shrink-0">
            <div className="p-3 border-b border-brd flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest">Texto</h3>
              <button onClick={() => setSelectedId(null)} className="text-ink-muted hover:text-ink"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Texto</label>
                <textarea value={selectedText.text} onChange={e => updateText(selectedId!, { text: e.target.value })} className="w-full px-3 py-2 bg-paper border border-brd rounded-lg text-sm resize-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Tamaño</label>
                  <input type="number" value={selectedText.fontSize} onChange={e => updateText(selectedId!, { fontSize: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-paper border border-brd rounded text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Peso</label>
                  <select value={selectedText.fontWeight} onChange={e => updateText(selectedId!, { fontWeight: Number(e.target.value) })} className="w-full px-2 py-1.5 bg-paper border border-brd rounded text-xs">
                    {[300, 400, 500, 600, 700].map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={selectedText.color} onChange={e => updateText(selectedId!, { color: e.target.value })} className="w-8 h-8 rounded border border-brd cursor-pointer" />
                  <div className="flex flex-wrap gap-1">
                    {[...themeConfig.colors, '#ffffff', '#fefcf8', '#000000'].map(c => (
                      <button key={c} onClick={() => updateText(selectedId!, { color: c })} className="w-6 h-6 rounded border border-brd" style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Tracking ({selectedText.letterSpacing}px)</label>
                <input type="range" min="-2" max="20" value={selectedText.letterSpacing} onChange={e => updateText(selectedId!, { letterSpacing: Number(e.target.value) })} className="w-full" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Opacidad ({selectedText.opacity}%)</label>
                <input type="range" min="0" max="100" value={selectedText.opacity} onChange={e => updateText(selectedId!, { opacity: Number(e.target.value) })} className="w-full" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Posición</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-ink-muted">X</span>
                    <input type="number" value={Math.round(selectedText.x)} onChange={e => updateText(selectedId!, { x: Number(e.target.value) })} className="w-full px-2 py-1 bg-paper border border-brd rounded text-xs" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-ink-muted">Y</span>
                    <input type="number" value={Math.round(selectedText.y)} onChange={e => updateText(selectedId!, { y: Number(e.target.value) })} className="w-full px-2 py-1 bg-paper border border-brd rounded text-xs" />
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={selectedText.shadow} onChange={e => updateText(selectedId!, { shadow: e.target.checked })} className="rounded" />
                Sombra ceremonial
              </label>
            </div>
            <div className="p-3 border-t border-brd space-y-2">
              <button onClick={() => { if (selectedId) { const t = texts.find(l => l.id === selectedId); if (t) { const id = `text_${Date.now()}`; setTexts(prev => [...prev, { ...t, id, y: t.y + 60 }]); } } }} className="w-full py-2 bg-paper border border-brd rounded-lg text-xs hover:bg-brd flex items-center justify-center gap-2">
                <Copy className="w-3 h-3" /> Duplicar
              </button>
              <button onClick={() => deleteText(selectedId!)} className="w-full py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-xs hover:bg-rose-500/20 flex items-center justify-center gap-2">
                <X className="w-3 h-3" /> Eliminar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="h-8 bg-card border-t border-brd px-4 flex items-center justify-between text-[10px] text-ink-muted shrink-0">
        <div className="flex items-center gap-4">
          <span>{dimensions.width}×{dimensions.height}</span>
          <span>{themeConfig.icon} {themeConfig.label}</span>
          <span>Patrón: {sacredPattern !== 'none' ? sacredPattern : '—'}</span>
          <span>Overlay: {overlay !== 'none' ? overlay : '—'}</span>
        </div>
        <span className="text-[#467a49]">● Medicina Chamánica Engine</span>
      </div>
    </div>
  );
}