/**
 * Brand Kit Service v2.0
 * Complete brand management for Nicola's coaching brand
 * Provides colors, fonts, logos, and contrast checking
 */

import { BrandKit, BrandColor, BrandFont, BrandLogo, BrandPattern } from './types';

// ============================================================================
// TYPES (re-exported)
// ============================================================================

export type { BrandKit, BrandColor, BrandFont, BrandLogo, BrandPattern };

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  neutrals: string[];
}

export interface ContrastResult {
  ratio: number;
  AA: boolean;
  AA_large: boolean;
  AAA: boolean;
  AAA_large: boolean;
}

// ============================================================================
// DEFAULT BRAND CONFIGURATION
// ============================================================================

const DEFAULT_BRAND_KIT: BrandKit = {
  id: 'nicola-default',
  name: 'Nicola Schaefer Coaching',
  colors: {
    primary: {
      name: 'Forest Green',
      hex: '#467a49',
      rgb: { r: 70, g: 122, b: 73 },
      hsl: { h: 123, s: 27, l: 38 },
      usage: ['headings', 'buttons', 'links', 'highlights'],
      contrast: { onWhite: 4.2, onBlack: 8.1, onPrimary: 0 },
    },
    secondary: {
      name: 'Warm Orange',
      hex: '#d16806',
      rgb: { r: 209, g: 104, b: 6 },
      hsl: { h: 30, s: 94, l: 42 },
      usage: ['accents', 'CTAs', 'alerts', 'badges'],
      contrast: { onWhite: 3.8, onBlack: 7.2, onPrimary: 2.1 },
    },
    accent: {
      name: 'Golden Yellow',
      hex: '#e6a919',
      rgb: { r: 230, g: 169, b: 25 },
      hsl: { h: 42, s: 80, l: 50 },
      usage: ['stars', 'premium', 'special'],
      contrast: { onWhite: 2.1, onBlack: 10.5, onPrimary: 1.4 },
    },
    background: {
      name: 'Warm Paper',
      hex: '#fefcf8',
      rgb: { r: 254, g: 252, b: 248 },
      hsl: { h: 40, s: 100, l: 98 },
      usage: ['backgrounds', 'cards'],
      contrast: { onWhite: 0, onBlack: 19.2, onPrimary: 17.5 },
    },
    text: {
      name: 'Deep Ink',
      hex: '#1a1a1a',
      rgb: { r: 26, g: 26, b: 26 },
      hsl: { h: 0, s: 0, l: 10 },
      usage: ['body_text', 'headings_dark'],
      contrast: { onWhite: 16.1, onBlack: 0, onPrimary: 12.8 },
    },
    neutrals: [
      {
        name: 'Light Gray',
        hex: '#f5f5f5',
        rgb: { r: 245, g: 245, b: 245 },
        hsl: { h: 0, s: 0, l: 96 },
        usage: ['dividers', 'disabled'],
        contrast: { onWhite: 0, onBlack: 18.1, onPrimary: 15.2 },
      },
      {
        name: 'Medium Gray',
        hex: '#9ca3af',
        rgb: { r: 156, g: 163, b: 175 },
        hsl: { h: 220, s: 11, l: 65 },
        usage: ['muted_text', 'placeholders'],
        contrast: { onWhite: 2.8, onBlack: 11.5, onPrimary: 2.2 },
      },
      {
        name: 'Dark Gray',
        hex: '#4b5563',
        rgb: { r: 75, g: 85, b: 99 },
        hsl: { h: 220, s: 14, l: 34 },
        usage: ['secondary_text'],
        contrast: { onWhite: 5.8, onBlack: 1.6, onPrimary: 4.2 },
      },
    ],
  },
  fonts: {
    display: {
      name: 'Cormorant Garamond',
      family: 'Cormorant Garamond',
      weights: [400, 500, 600, 700],
      styles: ['normal', 'italic'],
      googleFontId: 'cormorant-garamond',
      usage: 'headings, quotes, elegant text',
    },
    heading: {
      name: 'Playfair Display',
      family: 'Playfair Display',
      weights: [400, 500, 600, 700],
      styles: ['normal', 'italic'],
      googleFontId: 'playfair-display',
      usage: 'subheadings, titles',
    },
    body: {
      name: 'Outfit',
      family: 'Outfit',
      weights: [300, 400, 500, 600, 700],
      styles: ['normal'],
      googleFontId: 'outfit',
      usage: 'body text, UI elements',
    },
    accent: {
      name: 'Montserrat',
      family: 'Montserrat',
      weights: [400, 500, 600, 700],
      styles: ['normal', 'italic'],
      googleFontId: 'montserrat',
      usage: 'buttons, labels, caps',
    },
  },
  logos: [],
  patterns: [
    {
      id: 'dots-green',
      name: 'Green Dots',
      svg: '<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><circle cx="2" cy="2" r="1.5" fill="#467a49"/></svg>',
      colors: ['#467a49'],
    },
    {
      id: 'dots-orange',
      name: 'Orange Dots',
      svg: '<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><circle cx="2" cy="2" r="1.5" fill="#d16806"/></svg>',
      colors: ['#d16806'],
    },
  ],
  moodImages: [],
  isActive: true,
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date().toISOString(),
};

// ============================================================================
// CONTRAST CALCULATION
// ============================================================================

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const hex2rgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 0, g: 0, b: 0 };
  };
  const rgb1 = hex2rgb(hex1);
  const rgb2 = hex2rgb(hex2);
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function checkContrast(foreground: string, background: string): ContrastResult {
  const ratio = getContrastRatio(foreground, background);
  return {
    ratio: Math.round(ratio * 100) / 100,
    AA: ratio >= 4.5,
    AA_large: ratio >= 3,
    AAA: ratio >= 7,
    AAA_large: ratio >= 4.5,
  };
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) / 6;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function generateComplementary(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `#${(255 - r).toString(16).padStart(2, '0')}${(255 - g).toString(16).padStart(2, '0')}${(255 - b).toString(16).padStart(2, '0')}`;
}

export function generateAnalogous(hex: string): string[] {
  const { h, s, l } = hexToHsl(hex);
  return [
    hslToHex((h - 30 + 360) % 360, s, l),
    hex,
    hslToHex((h + 30) % 360, s, l),
  ];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ============================================================================
// BRAND KIT SERVICE CLASS
// ============================================================================

class BrandKitService {
  private brandKits: Map<string, BrandKit> = new Map();
  private activeKitId: string = 'nicola-default';
  private storageKey = 'nicola_brand_kits';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data.kits).forEach(([id, kit]) => {
          this.brandKits.set(id, kit as BrandKit);
        });
        this.activeKitId = data.activeKitId || 'nicola-default';
      } else {
        this.brandKits.set(DEFAULT_BRAND_KIT.id, DEFAULT_BRAND_KIT);
        this.saveToStorage();
      }
    } catch (e) {
      console.error('Failed to load brand kits:', e);
      this.brandKits.set(DEFAULT_BRAND_KIT.id, DEFAULT_BRAND_KIT);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        kits: Object.fromEntries(this.brandKits),
        activeKitId: this.activeKitId,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save brand kits:', e);
    }
  }

  // CRUD
  getAll(): BrandKit[] {
    return Array.from(this.brandKits.values());
  }

  getById(id: string): BrandKit | undefined {
    return this.brandKits.get(id);
  }

  getActive(): BrandKit {
    return this.brandKits.get(this.activeKitId) || DEFAULT_BRAND_KIT;
  }

  setActive(id: string): boolean {
    if (this.brandKits.has(id)) {
      this.activeKitId = id;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  create(kit: Omit<BrandKit, 'id' | 'createdAt' | 'updatedAt'>): BrandKit {
    const newKit: BrandKit = {
      ...kit,
      id: `brand-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.brandKits.set(newKit.id, newKit);
    this.saveToStorage();
    return newKit;
  }

  update(id: string, updates: Partial<BrandKit>): BrandKit | null {
    const kit = this.brandKits.get(id);
    if (!kit) return null;
    const updated: BrandKit = {
      ...kit,
      ...updates,
      id: kit.id,
      createdAt: kit.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.brandKits.set(id, updated);
    this.saveToStorage();
    return updated;
  }

  delete(id: string): boolean {
    if (id === 'nicola-default') return false;
    const deleted = this.brandKits.delete(id);
    if (deleted && this.activeKitId === id) {
      this.activeKitId = 'nicola-default';
    }
    this.saveToStorage();
    return deleted;
  }

  duplicate(id: string, newName?: string): BrandKit | null {
    const kit = this.brandKits.get(id);
    if (!kit) return null;
    return this.create({
      ...kit,
      name: newName || `${kit.name} (Copy)`,
      isActive: false,
    });
  }

  // Color utilities
  getColorPalette(): ColorPalette {
    const kit = this.getActive();
    return {
      primary: kit.colors.primary.hex,
      secondary: kit.colors.secondary.hex,
      accent: kit.colors.accent.hex,
      background: kit.colors.background.hex,
      text: kit.colors.text.hex,
      neutrals: kit.colors.neutrals.map((c) => c.hex),
    };
  }

  getContrastReport(): Record<string, ContrastResult> {
    const kit = this.getActive();
    const bg = kit.colors.background.hex;
    return {
      'primary-on-background': checkContrast(kit.colors.primary.hex, bg),
      'secondary-on-background': checkContrast(kit.colors.secondary.hex, bg),
      'text-on-background': checkContrast(kit.colors.text.hex, bg),
      'white-on-primary': checkContrast('#ffffff', kit.colors.primary.hex),
      'black-on-secondary': checkContrast('#000000', kit.colors.secondary.hex),
    };
  }

  reset(): void {
    this.brandKits.clear();
    this.brandKits.set(DEFAULT_BRAND_KIT.id, DEFAULT_BRAND_KIT);
    this.activeKitId = DEFAULT_BRAND_KIT.id;
    this.saveToStorage();
  }
}

export const brandKitService = new BrandKitService();
