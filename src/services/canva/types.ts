/**
 * Canva/Studio Module Types
 * Shared type definitions for Brand Kit, Templates, and Studio components
 */

// ============================================================================
// BRAND KIT TYPES
// ============================================================================

export interface BrandKit {
  id: string;
  name: string;
  colors: BrandColors;
  fonts: BrandFonts;
  logos: BrandLogo[];
  patterns: BrandPattern[];
  moodImages: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandColors {
  primary: BrandColor;
  secondary: BrandColor;
  accent: BrandColor;
  background: BrandColor;
  text: BrandColor;
  neutrals: BrandColor[];
}

export interface BrandColor {
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  usage: string[];
  contrast: {
    onWhite: number;
    onBlack: number;
    onPrimary: number;
  };
}

export interface BrandFonts {
  display: BrandFont;
  heading: BrandFont;
  body: BrandFont;
  accent: BrandFont;
}

export interface BrandFont {
  name: string;
  family: string;
  weights: number[];
  styles: ('normal' | 'italic')[];
  googleFontId?: string;
  url?: string;
  usage: string;
}

export interface BrandLogo {
  id: string;
  name: string;
  url: string;
  darkUrl?: string;
  formats: ('svg' | 'png' | 'jpg')[];
  usage: string;
  size: { width: number; height: number };
}

export interface BrandPattern {
  id: string;
  name: string;
  svg?: string;
  imageUrl?: string;
  colors: string[];
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: TemplateCategory;
  subcategory: string;
  tags: string[];
  dimensions: { width: number; height: number };
  format: 'image' | 'video' | 'carousel';
  elements: TemplateElement[];
  brandKitId?: string;
  isPremium: boolean;
  isTrending: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export type TemplateCategory =
  | 'quotes'
  | 'testimonials'
  | 'announcements'
  | 'education'
  | 'motivation'
  | 'product'
  | 'services'
  | 'lifestyle'
  | 'seasonal'
  | 'minimalist'
  | 'bold';

export interface TemplateElement {
  type: 'image' | 'text' | 'shape' | 'background';
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, any>;
  placeholder?: boolean;
  placeholderType?: 'text' | 'image' | 'color';
}

// ============================================================================
// STUDIO TYPES
// ============================================================================

export interface StudioProject {
  id: string;
  name: string;
  description?: string;
  thumbnail: string;
  dimensions: { width: number; height: number };
  format: string;
  brandKitId?: string;
  templateId?: string;
  tldrawDocument?: any; // Serialized tldraw state
  createdAt: string;
  updatedAt: string;
  lastEditedAt: string;
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'archived';
  publishedUrl?: string;
  tags: string[];
  collaborators?: Collaborator[];
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  avatar?: string;
  addedAt: string;
}

export interface StudioSettings {
  gridEnabled: boolean;
  snapToGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;
  autoSave: boolean;
  autoSaveInterval: number; // seconds
}

// ============================================================================
// CANVAS TYPES (for tldraw integration)
// ============================================================================

export interface CanvasDimensions {
  name: string;
  width: number;
  height: number;
  category: string;
}

export const DIMENSIONS: CanvasDimensions[] = [
  { name: 'Instagram Post', width: 1080, height: 1080, category: 'instagram' },
  { name: 'Instagram Story', width: 1080, height: 1920, category: 'instagram' },
  { name: 'Instagram Landscape', width: 1080, height: 566, category: 'instagram' },
  { name: 'Instagram Portrait', width: 1080, height: 1350, category: 'instagram' },
  { name: 'Facebook Post', width: 1200, height: 630, category: 'facebook' },
  { name: 'Facebook Cover', width: 820, height: 312, category: 'facebook' },
  { name: 'Facebook Event', width: 1920, height: 1080, category: 'facebook' },
  { name: 'LinkedIn Post', width: 1200, height: 627, category: 'linkedin' },
  { name: 'LinkedIn Banner', width: 1584, height: 396, category: 'linkedin' },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, category: 'youtube' },
  { name: 'YouTube Banner', width: 2560, height: 1440, category: 'youtube' },
  { name: 'Pinterest Pin', width: 1000, height: 1500, category: 'pinterest' },
  { name: 'Twitter Post', width: 1200, height: 675, category: 'twitter' },
  { name: 'Twitter Header', width: 1500, height: 500, category: 'twitter' },
  { name: 'HD Banner', width: 1920, height: 1080, category: 'general' },
  { name: 'Square', width: 1000, height: 1000, category: 'general' },
  { name: 'A4 Document', width: 2480, height: 3508, category: 'general' },
];

// ============================================================================
// EXPORT TYPES
// ============================================================================

export interface ExportSettings {
  format: 'png' | 'jpg' | 'webp' | 'pdf' | 'svg';
  quality: number; // 0-100
  size: 'original' | '2x' | 'instagram-optimized';
  includeBleed: boolean;
  flattenLayers: boolean;
  addWatermark: boolean;
  watermarkText?: string;
}

export interface ExportResult {
  success: boolean;
  url?: string;
  blob?: Blob;
  filename?: string;
  size?: { width: number; height: number };
  error?: string;
}

// ============================================================================
// AI TYPES
// ============================================================================

export interface AIAnalysis {
  brandConsistency: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  composition: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
  colors: {
    palette: string[];
    dominant: string;
    mood: string;
  };
  text: {
    readable: boolean;
    issues: string[];
  };
  overall: {
    score: number;
    verdict: string;
    improvements: string[];
  };
}

export interface AIGeneratedContent {
  caption?: string;
  hashtags?: string[];
  title?: string;
  suggestions?: string[];
}

// ============================================================================
// FORMATTING CONSTANTS
// ============================================================================

export const FONT_FAMILIES = [
  'Outfit',
  'Cormorant Garamond',
  'Inter',
  'Playfair Display',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Lato',
  'Poppins',
  'Raleway',
  'Merriweather',
  'Source Sans Pro',
  'Ubuntu',
  'Nunito',
  'Work Sans',
  'Haffer',
] as const;

export const FILTER_PRESETS = {
  none: { brightness: 0, contrast: 0, saturation: 0, blur: 0, grayscale: 0, sepia: 0, hue: 0, invert: 0 },
  vivid: { brightness: 10, contrast: 20, saturation: 30, blur: 0, grayscale: 0, sepia: 0, hue: 0, invert: 0 },
  warm: { brightness: 5, contrast: 10, saturation: 15, blur: 0, grayscale: 0, sepia: 20, hue: 0, invert: 0 },
  cool: { brightness: 0, contrast: 10, saturation: 10, blur: 0, grayscale: 0, sepia: 0, hue: 180, invert: 0 },
  fade: { brightness: 15, contrast: -10, saturation: -20, blur: 0, grayscale: 0, sepia: 0, hue: 0, invert: 0 },
  vintage: { brightness: -5, contrast: 10, saturation: -30, blur: 0, grayscale: 20, sepia: 30, hue: 0, invert: 0 },
  bw: { brightness: 0, contrast: 10, saturation: 0, blur: 0, grayscale: 100, sepia: 0, hue: 0, invert: 0 },
  dramatic: { brightness: -10, contrast: 40, saturation: 20, blur: 0, grayscale: 0, sepia: 0, hue: 0, invert: 0 },
} as const;

export type FilterPreset = keyof typeof FILTER_PRESETS;
