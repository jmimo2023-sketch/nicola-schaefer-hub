/**
 * Image Editor Service v2.0
 * Canvas-based image editing engine with layers, filters, templates, and brand kit
 * Works standalone without external dependencies
 */

import { uploadAsset } from './supabaseService';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface EditorElement {
  id: string;
  type: 'image' | 'text' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  zIndex: number;
}

export interface EditorImage extends EditorElement {
  type: 'image';
  src: string;
  originalSrc: string;
  filters: ImageFilters;
  crop: CropArea;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  grayscale: number;
  sepia: number;
  hue: number;
  invert: number;
}

export interface EditorText extends EditorElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  color: string;
  stroke: string;
  strokeWidth: number;
  background: string;
  padding: number;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
}

export interface EditorShape extends EditorElement {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'line' | 'arrow' | 'triangle' | 'star';
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
  points?: number[][];
}

export interface Template {
  id: string;
  name: string;
  thumbnail: string;
  width: number;
  height: number;
  category: string;
  subcategory: string;
  elements: (EditorImage | EditorText | EditorShape)[];
  createdAt: string;
  updatedAt: string;
}

export interface BrandKit {
  id: string;
  name: string;
  colors: BrandColor[];
  fonts: BrandFont[];
  logos: BrandLogo[];
  createdAt: string;
  updatedAt: string;
}

export interface BrandColor {
  name: string;
  hex: string;
  usage: string;
}

export interface BrandFont {
  name: string;
  family: string;
  weight: string;
  usage: string;
  url?: string;
}

export interface BrandLogo {
  name: string;
  url: string;
  darkUrl?: string;
}

export interface CanvasDimensions {
  name: string;
  width: number;
  height: number;
  category: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

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

export const DEFAULT_FILTERS: ImageFilters = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  hue: 0,
  invert: 0,
};

export const FONT_FAMILIES = [
  'Outfit', 'Cormorant Garamond', 'Inter', 'Playfair Display',
  'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Poppins',
  'Raleway', 'Merriweather', 'Source Sans Pro', 'Ubuntu',
  'Nunito', 'Work Sans', 'Haffer',
];

export const FILTER_PRESETS = {
  none: { brightness: 0, contrast: 0, saturation: 0, blur: 0, grayscale: 0, sepia: 0, hue: 0, invert: 0 },
  vivid: { brightness: 10, contrast: 20, saturation: 30, blur: 0, grayscale: 0, sepia: 0, hue: 0, invert: 0 },
  warm: { brightness: 5, contrast: 10, saturation: 15, blur: 0, grayscale: 0, sepia: 20, hue: 0, invert: 0 },
  cool: { brightness: 0, contrast: 10, saturation: 10, blur: 0, grayscale: 0, sepia: 0, hue: 180, invert: 0 },
  fade: { brightness: 15, contrast: -10, saturation: -20, blur: 0, grayscale: 0, sepia: 0, hue: 0, invert: 0 },
  vintage: { brightness: -5, contrast: 10, saturation: -30, blur: 0, grayscale: 20, sepia: 30, hue: 0, invert: 0 },
  bw: { brightness: 0, contrast: 10, saturation: 0, blur: 0, grayscale: 100, sepia: 0, hue: 0, invert: 0 },
  dramatic: { brightness: -10, contrast: 40, saturation: 20, blur: 0, grayscale: 0, sepia: 0, hue: 0, invert: 0 },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ============================================================================
// 20 TEMPLATES - FULL LIBRARY
// ============================================================================

const createQuoteTemplate = (
  id: string,
  name: string,
  bgColor: string,
  textColor: string,
  accentColor: string,
  fontFamily: string,
  category: string,
  subcategory: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1080,
  category,
  subcategory,
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1080, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'accent_line', type: 'shape', shapeType: 'rectangle', x: 340, y: 280, width: 400, height: 4, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 1, fill: accentColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'text', type: 'text', text: 'Your inspiring quote goes here', x: 100, y: 340, width: 880, height: 400, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 2, fontSize: 52, fontFamily, fontWeight: '700', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.3, letterSpacing: 0 } as EditorText,
    { id: 'accent_line2', type: 'shape', shapeType: 'rectangle', x: 340, y: 800, width: 400, height: 4, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 3, fill: accentColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createTestimonialTemplate = (
  id: string,
  name: string,
  bgColor: string,
  textColor: string,
  accentColor: string,
  category: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1080,
  category,
  subcategory: 'testimonial',
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1080, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'quote_mark', type: 'text', text: '"', x: 80, y: 40, width: 200, height: 200, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 1, fontSize: 200, fontFamily: 'Cormorant Garamond', fontWeight: '700', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1, letterSpacing: 0 } as EditorText,
    { id: 'text', type: 'text', text: 'Your testimonial message here...', x: 100, y: 260, width: 880, height: 400, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 2, fontSize: 36, fontFamily: 'Outfit', fontWeight: '400', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.6, letterSpacing: 0 } as EditorText,
    { id: 'author', type: 'text', text: '— Author Name', x: 100, y: 780, width: 880, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 3, fontSize: 28, fontFamily: 'Outfit', fontWeight: '600', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 2 } as EditorText,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createAnnouncementTemplate = (
  id: string,
  name: string,
  bgColor: string,
  accentColor: string,
  textColor: string,
  category: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1920,
  category,
  subcategory: 'announcement',
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1920, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'accent_bar', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 16, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 1, fill: accentColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'title', type: 'text', text: 'ANNOUNCEMENT', x: 60, y: 180, width: 960, height: 80, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 2, fontSize: 32, fontFamily: 'Outfit', fontWeight: '700', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 8 } as EditorText,
    { id: 'main_title', type: 'text', text: 'Your Event Title', x: 60, y: 320, width: 960, height: 160, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 3, fontSize: 72, fontFamily: 'Cormorant Garamond', fontWeight: '700', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.1, letterSpacing: 2 } as EditorText,
    { id: 'date', type: 'text', text: '📅 May 15, 2026 at 6:00 PM', x: 60, y: 560, width: 960, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 4, fontSize: 32, fontFamily: 'Outfit', fontWeight: '500', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 1 } as EditorText,
    { id: 'description', type: 'text', text: 'Description of your event. Make it compelling and informative for your audience.', x: 80, y: 720, width: 920, height: 300, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 5, fontSize: 28, fontFamily: 'Outfit', fontWeight: '400', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.5, letterSpacing: 0 } as EditorText,
    { id: 'cta', type: 'text', text: 'SAVE YOUR SPOT →', x: 60, y: 1600, width: 960, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 6, fontSize: 28, fontFamily: 'Outfit', fontWeight: '700', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 4 } as EditorText,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createBeforeAfterTemplate = (
  id: string,
  name: string,
  bgColor: string,
  category: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1080,
  category,
  subcategory: 'comparison',
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1080, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'left_label_bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 540, height: 100, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 1, fill: 'rgba(209,104,6,0.2)', stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'left_label', type: 'text', text: 'ANTES', x: 0, y: 0, width: 540, height: 100, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 2, fontSize: 36, fontFamily: 'Outfit', fontWeight: '800', fontStyle: 'normal', color: '#d16806', stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 2.8, letterSpacing: 8 } as EditorText,
    { id: 'right_label_bg', type: 'shape', shapeType: 'rectangle', x: 540, y: 0, width: 540, height: 100, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 3, fill: 'rgba(70,122,73,0.2)', stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'right_label', type: 'text', text: 'DESPUÉS', x: 540, y: 0, width: 540, height: 100, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 4, fontSize: 36, fontFamily: 'Outfit', fontWeight: '800', fontStyle: 'normal', color: '#467a49', stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 2.8, letterSpacing: 8 } as EditorText,
    { id: 'divider', type: 'shape', shapeType: 'line', x: 540, y: 100, width: 0, height: 980, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 5, fill: '#467a49', stroke: '#467a49', strokeWidth: 4, borderRadius: 0 } as EditorShape,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createMinimalTemplate = (
  id: string,
  name: string,
  bgColor: string,
  textColor: string,
  accentColor: string,
  category: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1080,
  category,
  subcategory: 'minimal',
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1080, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'accent_dot', type: 'shape', shapeType: 'circle', x: 490, y: 280, width: 100, height: 100, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 1, fill: accentColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'title', type: 'text', text: 'Minimal Title', x: 100, y: 450, width: 880, height: 100, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 2, fontSize: 56, fontFamily: 'Cormorant Garamond', fontWeight: '600', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 2 } as EditorText,
    { id: 'subtitle', type: 'text', text: 'Your minimal subtitle here', x: 100, y: 580, width: 880, height: 60, rotation: 0, opacity: 70, locked: false, visible: true, zIndex: 3, fontSize: 24, fontFamily: 'Outfit', fontWeight: '400', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 0 } as EditorText,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createBoldTemplate = (
  id: string,
  name: string,
  bgColor: string,
  textColor: string,
  accentColor: string,
  category: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1080,
  category,
  subcategory: 'bold',
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1080, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: accentColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'bg2', type: 'shape', shapeType: 'rectangle', x: 0, y: 700, width: 1080, height: 380, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 1, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'title', type: 'text', text: 'BOLD', x: 100, y: 200, width: 880, height: 300, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 2, fontSize: 180, fontFamily: 'Outfit', fontWeight: '800', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 0.9, letterSpacing: -5 } as EditorText,
    { id: 'subtitle', type: 'text', text: 'Your statement here', x: 100, y: 780, width: 880, height: 80, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 3, fontSize: 36, fontFamily: 'Outfit', fontWeight: '500', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 4 } as EditorText,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createEducationTemplate = (
  id: string,
  name: string,
  bgColor: string,
  textColor: string,
  accentColor: string,
  category: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1920,
  category,
  subcategory: 'education',
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1920, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'header_bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 400, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 1, fill: accentColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'label', type: 'text', text: 'TIP DEL DÍA', x: 60, y: 60, width: 960, height: 40, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 2, fontSize: 20, fontFamily: 'Outfit', fontWeight: '700', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.2, letterSpacing: 6 } as EditorText,
    { id: 'title', type: 'text', text: '3 Strategies for Better Results', x: 60, y: 500, width: 960, height: 200, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 3, fontSize: 64, fontFamily: 'Cormorant Garamond', fontWeight: '700', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.1, letterSpacing: 0 } as EditorText,
    { id: 'num1', type: 'text', text: '01', x: 60, y: 800, width: 80, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 4, fontSize: 48, fontFamily: 'Outfit', fontWeight: '800', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.2, letterSpacing: 0 } as EditorText,
    { id: 'point1', type: 'text', text: 'First key strategy point here', x: 160, y: 800, width: 860, height: 120, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 5, fontSize: 28, fontFamily: 'Outfit', fontWeight: '400', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.4, letterSpacing: 0 } as EditorText,
    { id: 'num2', type: 'text', text: '02', x: 60, y: 1000, width: 80, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 6, fontSize: 48, fontFamily: 'Outfit', fontWeight: '800', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.2, letterSpacing: 0 } as EditorText,
    { id: 'point2', type: 'text', text: 'Second important insight here', x: 160, y: 1000, width: 860, height: 120, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 7, fontSize: 28, fontFamily: 'Outfit', fontWeight: '400', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.4, letterSpacing: 0 } as EditorText,
    { id: 'num3', type: 'text', text: '03', x: 60, y: 1200, width: 80, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 8, fontSize: 48, fontFamily: 'Outfit', fontWeight: '800', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.2, letterSpacing: 0 } as EditorText,
    { id: 'point3', type: 'text', text: 'Third valuable tip here', x: 160, y: 1200, width: 860, height: 120, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 9, fontSize: 28, fontFamily: 'Outfit', fontWeight: '400', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.4, letterSpacing: 0 } as EditorText,
    { id: 'cta', type: 'text', text: 'Swipe up to learn more →', x: 60, y: 1700, width: 960, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 10, fontSize: 24, fontFamily: 'Outfit', fontWeight: '600', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 2 } as EditorText,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createMotivationTemplate = (
  id: string,
  name: string,
  bgColor: string,
  textColor: string,
  accentColor: string,
  category: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1920,
  category,
  subcategory: 'motivation',
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1920, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'gradient_overlay', type: 'shape', shapeType: 'rectangle', x: 0, y: 1200, width: 1080, height: 720, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 1, fill: accentColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'quote_mark', type: 'text', text: '"', x: 60, y: 250, width: 200, height: 200, rotation: 0, opacity: 60, locked: false, visible: true, zIndex: 2, fontSize: 300, fontFamily: 'Cormorant Garamond', fontWeight: '700', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1, letterSpacing: 0 } as EditorText,
    { id: 'text', type: 'text', text: 'Your most motivating message ever written', x: 80, y: 500, width: 920, height: 500, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 3, fontSize: 56, fontFamily: 'Cormorant Garamond', fontWeight: '600', fontStyle: 'italic', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.3, letterSpacing: 0 } as EditorText,
    { id: 'author', type: 'text', text: '— Nicola Schaefer', x: 100, y: 1400, width: 880, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 4, fontSize: 28, fontFamily: 'Outfit', fontWeight: '600', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 3 } as EditorText,
    { id: 'tag', type: 'text', text: '#transformación', x: 100, y: 1600, width: 880, height: 50, rotation: 0, opacity: 80, locked: false, visible: true, zIndex: 5, fontSize: 24, fontFamily: 'Outfit', fontWeight: '500', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 2 } as EditorText,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createProductTemplate = (
  id: string,
  name: string,
  bgColor: string,
  textColor: string,
  accentColor: string,
  category: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1080,
  category,
  subcategory: 'product',
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1080, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'badge', type: 'shape', shapeType: 'circle', x: 800, y: 80, width: 160, height: 160, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 1, fill: accentColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'badge_text', type: 'text', text: '-30%', x: 800, y: 80, width: 160, height: 160, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 2, fontSize: 32, fontFamily: 'Outfit', fontWeight: '800', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 5, letterSpacing: 0 } as EditorText,
    { id: 'product_area', type: 'shape', shapeType: 'rectangle', x: 80, y: 80, width: 680, height: 680, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 3, fill: '#ffffff', stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'title', type: 'text', text: 'PRODUCT NAME', x: 80, y: 820, width: 920, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 4, fontSize: 36, fontFamily: 'Outfit', fontWeight: '800', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 4 } as EditorText,
    { id: 'price', type: 'text', text: '$149', x: 80, y: 900, width: 920, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 5, fontSize: 48, fontFamily: 'Outfit', fontWeight: '700', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 0 } as EditorText,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createStoryTemplate = (
  id: string,
  name: string,
  bgColor: string,
  textColor: string,
  accentColor: string,
  category: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1920,
  category,
  subcategory: 'story',
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1920, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'line1', type: 'shape', shapeType: 'rectangle', x: 80, y: 400, width: 920, height: 2, rotation: 0, opacity: 30, locked: false, visible: true, zIndex: 1, fill: textColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'line2', type: 'shape', shapeType: 'rectangle', x: 80, y: 900, width: 920, height: 2, rotation: 0, opacity: 30, locked: false, visible: true, zIndex: 2, fill: textColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'line3', type: 'shape', shapeType: 'rectangle', x: 80, y: 1400, width: 920, height: 2, rotation: 0, opacity: 30, locked: false, visible: true, zIndex: 3, fill: textColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'swipe', type: 'text', text: 'SWIPE', x: 440, y: 1780, width: 200, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 4, fontSize: 24, fontFamily: 'Outfit', fontWeight: '700', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 6 } as EditorText,
    { id: 'arrow', type: 'text', text: '↓', x: 490, y: 1840, width: 100, height: 40, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 5, fontSize: 28, fontFamily: 'Outfit', fontWeight: '400', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 0 } as EditorText,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createServicesTemplate = (
  id: string,
  name: string,
  bgColor: string,
  textColor: string,
  accentColor: string,
  category: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1920,
  category,
  subcategory: 'services',
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1920, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'header', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 500, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 1, fill: accentColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'label', type: 'text', text: 'MIS SERVICIOS', x: 60, y: 60, width: 960, height: 40, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 2, fontSize: 20, fontFamily: 'Outfit', fontWeight: '700', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.2, letterSpacing: 8 } as EditorText,
    { id: 'title', type: 'text', text: 'Cómo puedo ayudarte', x: 60, y: 140, width: 960, height: 140, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 3, fontSize: 72, fontFamily: 'Cormorant Garamond', fontWeight: '700', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.1, letterSpacing: 0 } as EditorText,
    { id: 'service1', type: 'text', text: '01  Coaching Personal', x: 60, y: 580, width: 960, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 4, fontSize: 32, fontFamily: 'Outfit', fontWeight: '700', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.2, letterSpacing: 0 } as EditorText,
    { id: 'desc1', type: 'text', text: 'Descripción del servicio aquí...', x: 60, y: 660, width: 960, height: 100, rotation: 0, opacity: 80, locked: false, visible: true, zIndex: 5, fontSize: 22, fontFamily: 'Outfit', fontWeight: '400', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.4, letterSpacing: 0 } as EditorText,
    { id: 'service2', type: 'text', text: '02  Coaching Grupal', x: 60, y: 900, width: 960, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 6, fontSize: 32, fontFamily: 'Outfit', fontWeight: '700', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.2, letterSpacing: 0 } as EditorText,
    { id: 'desc2', type: 'text', text: 'Descripción del servicio aquí...', x: 60, y: 980, width: 960, height: 100, rotation: 0, opacity: 80, locked: false, visible: true, zIndex: 7, fontSize: 22, fontFamily: 'Outfit', fontWeight: '400', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.4, letterSpacing: 0 } as EditorText,
    { id: 'cta', type: 'text', text: 'Agenda tu consulta gratuita →', x: 60, y: 1700, width: 960, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 8, fontSize: 26, fontFamily: 'Outfit', fontWeight: '600', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 2 } as EditorText,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createTestimonial2Template = (
  id: string,
  name: string,
  bgColor: string,
  textColor: string,
  accentColor: string,
  category: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1350,
  category,
  subcategory: 'testimonial',
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1350, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'card', type: 'shape', shapeType: 'rectangle', x: 60, y: 60, width: 960, height: 1230, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 1, fill: '#ffffff', stroke: 'transparent', strokeWidth: 0, borderRadius: 24 } as EditorShape,
    { id: 'stars', type: 'text', text: '★★★★★', x: 60, y: 120, width: 960, height: 50, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 2, fontSize: 40, fontFamily: 'Outfit', fontWeight: '400', fontStyle: 'normal', color: '#e8b571', stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 8 } as EditorText,
    { id: 'text', type: 'text', text: 'Your testimonial goes here. Make it impactful and authentic.', x: 120, y: 220, width: 840, height: 400, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 3, fontSize: 36, fontFamily: 'Cormorant Garamond', fontWeight: '500', fontStyle: 'italic', color: '#1a1a1a', stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.5, letterSpacing: 0 } as EditorText,
    { id: 'divider', type: 'shape', shapeType: 'rectangle', x: 440, y: 680, width: 200, height: 2, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 4, fill: accentColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'name', type: 'text', text: 'Client Name', x: 120, y: 740, width: 840, height: 50, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 5, fontSize: 28, fontFamily: 'Outfit', fontWeight: '700', fontStyle: 'normal', color: '#1a1a1a', stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 0 } as EditorText,
    { id: 'role', type: 'text', text: 'CEO, Company Name', x: 120, y: 800, width: 840, height: 40, rotation: 0, opacity: 60, locked: false, visible: true, zIndex: 6, fontSize: 18, fontFamily: 'Outfit', fontWeight: '400', fontStyle: 'normal', color: '#1a1a1a', stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 0 } as EditorText,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createPodcastTemplate = (
  id: string,
  name: string,
  bgColor: string,
  textColor: string,
  accentColor: string,
  category: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1080,
  category,
  subcategory: 'podcast',
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1080, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'mic', type: 'shape', shapeType: 'circle', x: 390, y: 180, width: 300, height: 300, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 1, fill: accentColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'label', type: 'text', text: 'PODCAST', x: 60, y: 560, width: 960, height: 50, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 2, fontSize: 24, fontFamily: 'Outfit', fontWeight: '800', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 10 } as EditorText,
    { id: 'title', type: 'text', text: 'Episode Title Here', x: 60, y: 640, width: 960, height: 140, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 3, fontSize: 48, fontFamily: 'Cormorant Garamond', fontWeight: '700', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 0 } as EditorText,
    { id: 'cta', type: 'text', text: 'Available on Spotify & Apple Podcasts', x: 60, y: 900, width: 960, height: 40, rotation: 0, opacity: 80, locked: false, visible: true, zIndex: 4, fontSize: 20, fontFamily: 'Outfit', fontWeight: '500', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 2 } as EditorText,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createTipsTemplate = (
  id: string,
  name: string,
  bgColor: string,
  textColor: string,
  accentColor: string,
  category: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1920,
  category,
  subcategory: 'tips',
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1920, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'title_bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 600, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 1, fill: accentColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'label', type: 'text', text: 'CONSEJO RÁPIDO', x: 60, y: 80, width: 960, height: 40, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 2, fontSize: 20, fontFamily: 'Outfit', fontWeight: '700', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.2, letterSpacing: 6 } as EditorText,
    { id: 'title', type: 'text', text: '5 Tips to Improve Your Morning Routine', x: 60, y: 160, width: 960, height: 200, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 3, fontSize: 56, fontFamily: 'Cormorant Garamond', fontWeight: '700', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.1, letterSpacing: 0 } as EditorText,
    { id: 'tip1', type: 'text', text: '☀️ Wake up at the same time daily', x: 60, y: 700, width: 960, height: 100, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 4, fontSize: 32, fontFamily: 'Outfit', fontWeight: '500', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.4, letterSpacing: 0 } as EditorText,
    { id: 'tip2', type: 'text', text: '📱 Avoid phone for first hour', x: 60, y: 880, width: 960, height: 100, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 5, fontSize: 32, fontFamily: 'Outfit', fontWeight: '500', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.4, letterSpacing: 0 } as EditorText,
    { id: 'tip3', type: 'text', text: '🧘 Start with 5 minutes meditation', x: 60, y: 1060, width: 960, height: 100, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 6, fontSize: 32, fontFamily: 'Outfit', fontWeight: '500', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.4, letterSpacing: 0 } as EditorText,
    { id: 'tip4', type: 'text', text: '📝 Write down your 3 priorities', x: 60, y: 1240, width: 960, height: 100, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 7, fontSize: 32, fontFamily: 'Outfit', fontWeight: '500', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.4, letterSpacing: 0 } as EditorText,
    { id: 'tip5', type: 'text', text: '💧 Drink water before coffee', x: 60, y: 1420, width: 960, height: 100, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 8, fontSize: 32, fontFamily: 'Outfit', fontWeight: '500', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.4, letterSpacing: 0 } as EditorText,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createTransformationTemplate = (
  id: string,
  name: string,
  bgColor: string,
  textColor: string,
  accentColor: string,
  category: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1920,
  category,
  subcategory: 'transformation',
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1920, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'left_half', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 540, height: 1920, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 1, fill: '#1a1a1a', stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'before_label', type: 'text', text: 'ANTES', x: 0, y: 880, width: 540, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 2, fontSize: 32, fontFamily: 'Outfit', fontWeight: '800', fontStyle: 'normal', color: '#d16806', stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 8 } as EditorText,
    { id: 'after_label', type: 'text', text: 'DESPUÉS', x: 540, y: 880, width: 540, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 3, fontSize: 32, fontFamily: 'Outfit', fontWeight: '800', fontStyle: 'normal', color: '#467a49', stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 8 } as EditorText,
    { id: 'title', type: 'text', text: 'Mi Transformación', x: 60, y: 1600, width: 960, height: 100, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 4, fontSize: 48, fontFamily: 'Cormorant Garamond', fontWeight: '700', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 0 } as EditorText,
    { id: 'cta', type: 'text', text: 'Descubre cómo puedo ayudarte →', x: 60, y: 1760, width: 960, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 5, fontSize: 24, fontFamily: 'Outfit', fontWeight: '600', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 2 } as EditorText,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createFreebieTemplate = (
  id: string,
  name: string,
  bgColor: string,
  textColor: string,
  accentColor: string,
  category: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1920,
  category,
  subcategory: 'freebie',
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1920, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: accentColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'inner_bg', type: 'shape', shapeType: 'rectangle', x: 40, y: 40, width: 1000, height: 1840, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 1, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 24 } as EditorShape,
    { id: 'badge', type: 'text', text: 'GRATIS', x: 390, y: 100, width: 300, height: 50, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 2, fontSize: 24, fontFamily: 'Outfit', fontWeight: '800', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'rgba(70,122,73,0.1)', padding: 12, textAlign: 'center', lineHeight: 1.2, letterSpacing: 6 } as EditorText,
    { id: 'title', type: 'text', text: 'Tu Guía Gratis', x: 80, y: 200, width: 920, height: 160, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 3, fontSize: 64, fontFamily: 'Cormorant Garamond', fontWeight: '700', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.1, letterSpacing: 0 } as EditorText,
    { id: 'description', type: 'text', text: 'Descarga mi guía gratuita sobre cómo alcanzar tus metas.', x: 80, y: 400, width: 920, height: 200, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 4, fontSize: 28, fontFamily: 'Outfit', fontWeight: '400', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.5, letterSpacing: 0 } as EditorText,
    { id: 'bullets', type: 'text', text: '✓ Capítulo 1: Definir tu visión\n✓ Capítulo 2: Eliminar bloqueos\n✓ Capítulo 3: Plan de acción', x: 120, y: 700, width: 840, height: 300, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 5, fontSize: 26, fontFamily: 'Outfit', fontWeight: '400', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'left', lineHeight: 1.8, letterSpacing: 0 } as EditorText,
    { id: 'cta_bg', type: 'shape', shapeType: 'rectangle', x: 80, y: 1500, width: 920, height: 80, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 6, fill: accentColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 40 } as EditorShape,
    { id: 'cta', type: 'text', text: 'DESCARGA GRATIS →', x: 80, y: 1500, width: 920, height: 80, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 7, fontSize: 26, fontFamily: 'Outfit', fontWeight: '700', fontStyle: 'normal', color: bgColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 3.1, letterSpacing: 4 } as EditorText,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createQuoteDarkTemplate = (
  id: string,
  name: string,
  bgColor: string,
  textColor: string,
  accentColor: string,
  category: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1080,
  category,
  subcategory: 'quote',
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1080, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'gradient', type: 'shape', shapeType: 'rectangle', x: 0, y: 600, width: 1080, height: 480, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 1, fill: '#0a0a0a', stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'text', type: 'text', text: 'La única forma de hacer un gran trabajo es amar lo que haces.', x: 80, y: 300, width: 920, height: 400, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 2, fontSize: 48, fontFamily: 'Cormorant Garamond', fontWeight: '600', fontStyle: 'italic', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.3, letterSpacing: 0 } as EditorText,
    { id: 'author', type: 'text', text: '— Nicola Schaefer', x: 80, y: 780, width: 920, height: 50, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 3, fontSize: 24, fontFamily: 'Outfit', fontWeight: '500', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 3 } as EditorText,
    { id: 'accent', type: 'shape', shapeType: 'rectangle', x: 440, y: 880, width: 200, height: 4, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 4, fill: accentColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createSaleTemplate = (
  id: string,
  name: string,
  bgColor: string,
  textColor: string,
  accentColor: string,
  category: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1080,
  category,
  subcategory: 'sale',
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1080, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'flash', type: 'text', text: '⚡', x: 490, y: 80, width: 100, height: 100, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 1, fontSize: 80, fontFamily: 'Outfit', fontWeight: '400', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 0 } as EditorText,
    { id: 'sale', type: 'text', text: 'SALE', x: 60, y: 180, width: 960, height: 200, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 2, fontSize: 140, fontFamily: 'Outfit', fontWeight: '800', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 0.9, letterSpacing: -5 } as EditorText,
    { id: 'percent', type: 'text', text: '50%', x: 60, y: 380, width: 960, height: 200, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 3, fontSize: 120, fontFamily: 'Cormorant Garamond', fontWeight: '700', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1, letterSpacing: 0 } as EditorText,
    { id: 'off', type: 'text', text: 'OFF', x: 60, y: 560, width: 960, height: 80, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 4, fontSize: 48, fontFamily: 'Outfit', fontWeight: '700', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 20 } as EditorText,
    { id: 'code', type: 'text', text: 'Código: TRANSFORMA50', x: 60, y: 720, width: 960, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 5, fontSize: 28, fontFamily: 'Outfit', fontWeight: '600', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 4 } as EditorText,
    { id: 'valid', type: 'text', text: 'Válido hasta el 31 de mayo', x: 60, y: 880, width: 960, height: 40, rotation: 0, opacity: 70, locked: false, visible: true, zIndex: 6, fontSize: 18, fontFamily: 'Outfit', fontWeight: '400', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 2 } as EditorText,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createAboutMeTemplate = (
  id: string,
  name: string,
  bgColor: string,
  textColor: string,
  accentColor: string,
  category: string
): Template => ({
  id,
  name,
  thumbnail: '',
  width: 1080,
  height: 1920,
  category,
  subcategory: 'about',
  elements: [
    { id: 'bg', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 1080, height: 1920, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 0, fill: bgColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'circle', type: 'shape', shapeType: 'circle', x: 290, y: 80, width: 500, height: 500, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 1, fill: accentColor, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 } as EditorShape,
    { id: 'label', type: 'text', text: 'CONÓCEME', x: 60, y: 660, width: 960, height: 50, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 2, fontSize: 22, fontFamily: 'Outfit', fontWeight: '700', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 8 } as EditorText,
    { id: 'name', type: 'text', text: 'Nicola Schaefer', x: 60, y: 740, width: 960, height: 100, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 3, fontSize: 64, fontFamily: 'Cormorant Garamond', fontWeight: '700', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.1, letterSpacing: 0 } as EditorText,
    { id: 'title', type: 'text', text: 'Life Coach & Strategist', x: 60, y: 860, width: 960, height: 50, rotation: 0, opacity: 80, locked: false, visible: true, zIndex: 4, fontSize: 28, fontFamily: 'Outfit', fontWeight: '500', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 2 } as EditorText,
    { id: 'bio', type: 'text', text: 'Ayudo a profesionales y emprendedores a transformar sus vidas encontrando equilibrio entre el éxito profesional y el bienestar personal.', x: 80, y: 1000, width: 920, height: 300, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 5, fontSize: 26, fontFamily: 'Outfit', fontWeight: '400', fontStyle: 'normal', color: textColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.5, letterSpacing: 0 } as EditorText,
    { id: 'cta', type: 'text', text: 'Sígueme @nicola.schaefer', x: 60, y: 1700, width: 960, height: 60, rotation: 0, opacity: 100, locked: false, visible: true, zIndex: 6, fontSize: 26, fontFamily: 'Outfit', fontWeight: '600', fontStyle: 'normal', color: accentColor, stroke: 'transparent', strokeWidth: 0, background: 'transparent', padding: 0, textAlign: 'center', lineHeight: 1.2, letterSpacing: 2 } as EditorText,
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// ============================================================================
// TEMPLATE SERVICE WITH 20 TEMPLATES
// ============================================================================

class TemplateService {
  private templates: Template[] = [];
  private storageKey = 'nicola_hub_templates';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.templates = JSON.parse(stored);
      } else {
        this.templates = this.getDefaultTemplates();
        this.saveToStorage();
      }
    } catch (e) {
      this.templates = this.getDefaultTemplates();
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.templates));
  }

  private getDefaultTemplates(): Template[] {
    return [
      // QUOTE TEMPLATES (4)
      createQuoteTemplate('tmpl_quote_1', 'Inspirational Quote Dark', '#0a0a0a', '#f4f3f3', '#467a49', 'Cormorant Garamond', 'quote', 'inspiration'),
      createQuoteTemplate('tmpl_quote_2', 'Inspirational Quote Light', '#f4f3f3', '#0a0a0a', '#467a49', 'Cormorant Garamond', 'quote', 'inspiration'),
      createQuoteTemplate('tmpl_quote_3', 'Motivational Quote Gold', '#0a0a0a', '#f4f3f3', '#e8b571', 'Outfit', 'quote', 'motivation'),
      createQuoteDarkTemplate('tmpl_quote_4', 'Elegant Quote', '#0a0a0a', '#f4f3f3', '#467a49', 'quote', 'elegant'),

      // TESTIMONIAL TEMPLATES (2)
      createTestimonialTemplate('tmpl_test_1', 'Testimonial Dark', '#0a0a0a', '#f4f3f3', '#467a49', 'testimonial'),
      createTestimonial2Template('tmpl_test_2', 'Testimonial Card', '#f4f3f3', '#1a1a1a', '#467a49', 'testimonial'),

      // ANNOUNCEMENT TEMPLATES (2)
      createAnnouncementTemplate('tmpl_announce_1', 'Event Announcement Dark', '#0a0a0a', '#467a49', '#f4f3f3', 'announcement'),
      createAnnouncementTemplate('tmpl_announce_2', 'Event Announcement Light', '#f4f3f3', '#d16806', '#0a0a0a', 'announcement'),

      // COMPARISON TEMPLATES (2)
      createBeforeAfterTemplate('tmpl_ba_1', 'Before/After Dark', '#0a0a0a', 'comparison'),
      createBeforeAfterTemplate('tmpl_ba_2', 'Before/After Light', '#f4f3f3', 'comparison'),

      // MINIMAL & BOLD TEMPLATES (2)
      createMinimalTemplate('tmpl_min_1', 'Minimal Dark', '#0a0a0a', '#f4f3f3', '#467a49', 'minimal'),
      createBoldTemplate('tmpl_bold_1', 'Bold Statement', '#467a49', '#ffffff', '#0a0a0a', 'bold'),

      // EDUCATION & TIPS TEMPLATES (2)
      createEducationTemplate('tmpl_edu_1', 'Education Post', '#f4f3f3', '#0a0a0a', '#467a49', 'education'),
      createTipsTemplate('tmpl_tips_1', 'Quick Tips', '#0a0a0a', '#f4f3f3', '#467a49', 'tips'),

      // MOTIVATION & TRANSFORMATION (2)
      createMotivationTemplate('tmpl_motiv_1', 'Motivation Story', '#f4f3f3', '#0a0a0a', '#467a49', 'motivation'),
      createTransformationTemplate('tmpl_trans_1', 'Transformation Story', '#f4f3f3', '#0a0a0a', '#467a49', 'transformation'),

      // PRODUCT & SALE TEMPLATES (2)
      createProductTemplate('tmpl_prod_1', 'Product Showcase', '#f4f3f3', '#0a0a0a', '#d16806', 'product'),
      createSaleTemplate('tmpl_sale_1', 'Sale Banner', '#0a0a0a', '#f4f3f3', '#e8b571', 'sale'),

      // SERVICES & ABOUT (2)
      createServicesTemplate('tmpl_serv_1', 'Services Overview', '#f4f3f3', '#0a0a0a', '#467a49', 'services'),
      createAboutMeTemplate('tmpl_about_1', 'About Me', '#f4f3f3', '#0a0a0a', '#467a49', 'about'),
    ];
  }

  getAll(): Template[] {
    return [...this.templates];
  }

  getByCategory(category: string): Template[] {
    return this.templates.filter(t => t.category === category);
  }

  getBySubcategory(subcategory: string): Template[] {
    return this.templates.filter(t => t.subcategory === subcategory);
  }

  getById(id: string): Template | undefined {
    return this.templates.find(t => t.id === id);
  }

  getCategories(): string[] {
    return [...new Set(this.templates.map(t => t.category))];
  }

  create(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Template {
    const newTemplate: Template = {
      ...template,
      id: `tmpl_${generateId()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.templates.push(newTemplate);
    this.saveToStorage();
    return newTemplate;
  }

  update(id: string, updates: Partial<Template>): Template | null {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return null;
    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();
    return this.templates[index];
  }

  delete(id: string): boolean {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.templates.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  duplicate(id: string): Template | null {
    const original = this.getById(id);
    if (!original) return null;
    return this.create({
      ...original,
      name: `${original.name} (Copy)`,
      elements: original.elements.map(el => ({ ...el, id: generateId() })),
    });
  }
}

export const templateService = new TemplateService();

// ============================================================================
// BRAND KIT SERVICE
// ============================================================================

class BrandKitService {
  private brandKits: BrandKit[] = [];
  private activeKitId: string | null = null;
  private storageKey = 'nicola_hub_brand_kits';
  private activeKey = 'nicola_hub_active_brand_kit';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const active = localStorage.getItem(this.activeKey);
      if (stored) {
        this.brandKits = JSON.parse(stored);
      } else {
        this.brandKits = this.getDefaultBrandKits();
        this.saveToStorage();
      }
      this.activeKitId = active || (this.brandKits[0]?.id || null);
    } catch (e) {
      this.brandKits = this.getDefaultBrandKits();
      this.activeKitId = this.brandKits[0]?.id || null;
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.brandKits));
    if (this.activeKitId) {
      localStorage.setItem(this.activeKey, this.activeKitId);
    }
  }

  private getDefaultBrandKits(): BrandKit[] {
    return [
      {
        id: 'brand_nicola',
        name: 'Nicola Schaefer',
        colors: [
          { name: 'Primary Green', hex: '#467a49', usage: 'Main accent, CTAs' },
          { name: 'Deep Black', hex: '#0a0a0a', usage: 'Backgrounds, cards' },
          { name: 'Light Gray', hex: '#f4f3f3', usage: 'Text on dark' },
          { name: 'Muted Gray', hex: '#9A9590', usage: 'Secondary text' },
          { name: 'Warm Orange', hex: '#d16806', usage: 'Highlights, alerts' },
          { name: 'Gold', hex: '#e8b571', usage: 'Premium accents' },
        ],
        fonts: [
          { name: 'Display', family: 'Cormorant Garamond', weight: '700', usage: 'Headlines, titles' },
          { name: 'Body', family: 'Outfit', weight: '400', usage: 'Body text, UI' },
          { name: 'Accent', family: 'Outfit', weight: '600', usage: 'Emphasis, labels' },
        ],
        logos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  getAll(): BrandKit[] {
    return [...this.brandKits];
  }

  getById(id: string): BrandKit | undefined {
    return this.brandKits.find(b => b.id === id);
  }

  getActive(): BrandKit | null {
    if (!this.activeKitId) return null;
    return this.getById(this.activeKitId) || null;
  }

  setActive(id: string): void {
    this.activeKitId = id;
    localStorage.setItem(this.activeKey, id);
  }

  create(brandKit: Omit<BrandKit, 'id' | 'createdAt' | 'updatedAt'>): BrandKit {
    const newBrandKit: BrandKit = {
      ...brandKit,
      id: `brand_${generateId()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.brandKits.push(newBrandKit);
    this.saveToStorage();
    return newBrandKit;
  }

  update(id: string, updates: Partial<BrandKit>): BrandKit | null {
    const index = this.brandKits.findIndex(b => b.id === id);
    if (index === -1) return null;
    this.brandKits[index] = {
      ...this.brandKits[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage();
    return this.brandKits[index];
  }

  delete(id: string): boolean {
    const index = this.brandKits.findIndex(b => b.id === id);
    if (index === -1) return false;
    this.brandKits.splice(index, 1);
    if (this.activeKitId === id) {
      this.activeKitId = this.brandKits[0]?.id || null;
    }
    this.saveToStorage();
    return true;
  }

  addColor(brandKitId: string, color: Omit<BrandColor, never>): boolean {
    const kit = this.getById(brandKitId);
    if (!kit) return false;
    kit.colors.push(color);
    kit.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return true;
  }

  removeColor(brandKitId: string, colorHex: string): boolean {
    const kit = this.getById(brandKitId);
    if (!kit) return false;
    kit.colors = kit.colors.filter(c => c.hex !== colorHex);
    kit.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return true;
  }
}

export const brandKitService = new BrandKitService();

// ============================================================================
// IMAGE EDITOR SERVICE (CANVAS ENGINE)
// ============================================================================

export class ImageEditorService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private elements: (EditorImage | EditorText | EditorShape)[] = [];
  private selectedId: string | null = null;
  private width: number = 1080;
  private height: number = 1080;
  private scale: number = 1;
  private history: string[] = [];
  private historyIndex: number = -1;
  private maxHistory: number = 50;
  private backgroundColor: string = '#0a0a0a';

  // Selection state
  private isDragging: boolean = false;
  private isResizing: boolean = false;
  private resizeHandle: string = '';
  private startX: number = 0;
  private startY: number = 0;
  private startElementState: any = null;

  constructor(canvas?: HTMLCanvasElement) {
    if (canvas) {
      this.setCanvas(canvas);
    }
  }

  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
  }

  setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.saveState();
    this.render();
  }

  setScale(scale: number): void {
    this.scale = Math.max(0.1, Math.min(5, scale));
    if (this.canvas && this.ctx) {
      const displayWidth = this.width * this.scale;
      const displayHeight = this.height * this.scale;
      this.canvas.style.width = `${displayWidth}px`;
      this.canvas.style.height = `${displayHeight}px`;
    }
  }

  setBackgroundColor(color: string): void {
    this.backgroundColor = color;
    this.render();
  }

  // Element Management
  addElement(element: EditorImage | EditorText | EditorShape): void {
    const maxZIndex = this.elements.length > 0
      ? Math.max(...this.elements.map(e => e.zIndex))
      : -1;
    element.zIndex = maxZIndex + 1;
    this.elements.push(element);
    this.saveState();
    this.render();
  }

  updateElement(id: string, updates: Partial<EditorImage | EditorText | EditorShape>): void {
    const index = this.elements.findIndex(e => e.id === id);
    if (index !== -1) {
      const current = this.elements[index];
      if (current.type === 'image') {
        this.elements[index] = { ...current, ...updates } as EditorImage;
      } else if (current.type === 'text') {
        this.elements[index] = { ...current, ...updates } as EditorText;
      } else {
        this.elements[index] = { ...current, ...updates } as EditorShape;
      }
      this.saveState();
      this.render();
    }
  }

  deleteElement(id: string): void {
    this.elements = this.elements.filter(e => e.id !== id);
    if (this.selectedId === id) {
      this.selectedId = null;
    }
    this.saveState();
    this.render();
  }

  duplicateElement(id: string): EditorImage | EditorText | EditorShape | null {
    const element = this.elements.find(e => e.id === id);
    if (!element) return null;

    const duplicate = {
      ...JSON.parse(JSON.stringify(element)),
      id: generateId(),
      x: element.x + 20,
      y: element.y + 20,
      zIndex: Math.max(...this.elements.map(e => e.zIndex)) + 1,
    };

    this.elements.push(duplicate);
    this.saveState();
    this.render();
    return duplicate;
  }

  getElement(id: string): EditorImage | EditorText | EditorShape | undefined {
    return this.elements.find(e => e.id === id);
  }

  getElements(): (EditorImage | EditorText | EditorShape)[] {
    return [...this.elements];
  }

  getSelectedId(): string | null {
    return this.selectedId;
  }

  selectElement(id: string | null): void {
    this.selectedId = id;
    this.render();
  }

  bringToFront(id: string): void {
    const maxZ = Math.max(...this.elements.map(e => e.zIndex));
    this.updateElement(id, { zIndex: maxZ + 1 });
  }

  sendToBack(id: string): void {
    const minZ = Math.min(...this.elements.map(e => e.zIndex));
    this.updateElement(id, { zIndex: minZ - 1 });
  }

  // Rendering
  render(): void {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear and fill background
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, w, h);

    // Sort elements by zIndex
    const sorted = [...this.elements].sort((a, b) => a.zIndex - b.zIndex);

    // Render each element
    for (const element of sorted) {
      if (!element.visible) continue;

      ctx.save();
      ctx.globalAlpha = element.opacity / 100;

      // Apply rotation
      if (element.rotation !== 0) {
        const cx = element.x + element.width / 2;
        const cy = element.y + element.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);
      }

      switch (element.type) {
        case 'image':
          this.renderImage(ctx, element as EditorImage);
          break;
        case 'text':
          this.renderText(ctx, element as EditorText);
          break;
        case 'shape':
          this.renderShape(ctx, element as EditorShape);
          break;
      }

      ctx.restore();
    }

    // Render selection handles
    if (this.selectedId) {
      const selected = this.elements.find(e => e.id === this.selectedId);
      if (selected) {
        this.renderSelectionHandles(ctx, selected);
      }
    }
  }

  private renderImage(ctx: CanvasRenderingContext2D, img: EditorImage): void {
    const imgElement = this.getCachedImage(img.src);
    if (!imgElement || !imgElement.complete) return;

    ctx.save();

    // Apply filters via CSS filter string
    const filterStr = this.buildFilterString(img.filters);
    ctx.filter = filterStr;

    // Handle crop
    if (img.crop && img.crop.width > 0 && img.crop.height > 0) {
      ctx.drawImage(
        imgElement,
        img.crop.x, img.crop.y, img.crop.width, img.crop.height,
        img.x, img.y, img.width, img.height
      );
    } else {
      ctx.drawImage(imgElement, img.x, img.y, img.width, img.height);
    }

    ctx.restore();
  }

  private renderText(ctx: CanvasRenderingContext2D, text: EditorText): void {
    ctx.font = `${text.fontStyle} ${text.fontWeight} ${text.fontSize}px "${text.fontFamily}", sans-serif`;
    ctx.textAlign = text.textAlign;
    ctx.textBaseline = 'top';

    // Word wrap and render
    const lines = this.wrapText(ctx, text.text, text.width - text.padding * 2);
    const lineHeight = text.fontSize * text.lineHeight;

    // Handle stroke
    if (text.strokeWidth > 0 && text.stroke !== 'transparent') {
      ctx.strokeStyle = text.stroke;
      ctx.lineWidth = text.strokeWidth;
      ctx.lineJoin = 'round';
    }

    // Handle background
    if (text.background && text.background !== 'transparent') {
      ctx.fillStyle = text.background;
      const bgHeight = lines.length * lineHeight + text.padding * 2;
      let bgWidth = 0;
      for (const line of lines) {
        const w = ctx.measureText(line).width;
        if (w > bgWidth) bgWidth = w;
      }
      const bgX = text.textAlign === 'center' ? text.x - bgWidth / 2
        : text.textAlign === 'right' ? text.x + text.width - bgWidth
        : text.x;
      ctx.fillRect(bgX - text.padding, text.y, bgWidth + text.padding * 2, bgHeight);
    }

    // Render each line
    ctx.fillStyle = text.color;

    lines.forEach((line, i) => {
      const ly = text.y + text.padding + i * lineHeight;
      const lx = text.textAlign === 'center' ? text.x + text.width / 2
        : text.textAlign === 'right' ? text.x + text.width - text.padding
        : text.x + text.padding;

      if (text.strokeWidth > 0 && text.stroke !== 'transparent') {
        ctx.strokeText(line, lx, ly);
      }
      ctx.fillText(line, lx, ly);
    });
  }

  private renderShape(ctx: CanvasRenderingContext2D, shape: EditorShape): void {
    ctx.fillStyle = shape.fill;
    ctx.strokeStyle = shape.stroke;
    ctx.lineWidth = shape.strokeWidth;

    switch (shape.shapeType) {
      case 'rectangle':
        if (shape.borderRadius > 0) {
          this.roundRect(ctx, shape.x, shape.y, shape.width, shape.height, shape.borderRadius);
        } else {
          ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
          if (shape.strokeWidth > 0) {
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
          }
        }
        break;

      case 'circle':
        ctx.beginPath();
        ctx.ellipse(
          shape.x + shape.width / 2,
          shape.y + shape.height / 2,
          shape.width / 2,
          shape.height / 2,
          0, 0, Math.PI * 2
        );
        ctx.fill();
        if (shape.strokeWidth > 0) ctx.stroke();
        break;

      case 'line':
        ctx.beginPath();
        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        ctx.stroke();
        break;

      case 'arrow':
        this.drawArrow(ctx, shape.x, shape.y, shape.x + shape.width, shape.y + shape.height, shape.strokeWidth);
        break;

      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(shape.x + shape.width / 2, shape.y);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        ctx.lineTo(shape.x, shape.y + shape.height);
        ctx.closePath();
        ctx.fill();
        if (shape.strokeWidth > 0) ctx.stroke();
        break;

      case 'star':
        this.drawStar(ctx, shape.x + shape.width / 2, shape.y + shape.height / 2, 5, shape.width / 2, shape.height / 4);
        ctx.fill();
        if (shape.strokeWidth > 0) ctx.stroke();
        break;
    }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    if (ctx.lineWidth > 0) ctx.stroke();
  }

  private drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, strokeWidth: number): void {
    const headLen = 20;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }

  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerR: number, innerR: number): void {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);

    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }

    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
  }

  private renderSelectionHandles(ctx: CanvasRenderingContext2D, element: EditorImage | EditorText | EditorShape): void {
    const padding = 0;
    const x = element.x - padding;
    const y = element.y - padding;
    const w = element.width + padding * 2;
    const h = element.height + padding * 2;

    // Selection border
    ctx.strokeStyle = '#467a49';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    // Corner handles
    const handleSize = 10;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#467a49';
    ctx.lineWidth = 2;

    const handles = [
      { x: x - handleSize / 2, y: y - handleSize / 2 },
      { x: x + w / 2 - handleSize / 2, y: y - handleSize / 2 },
      { x: x + w - handleSize / 2, y: y - handleSize / 2 },
      { x: x - handleSize / 2, y: y + h / 2 - handleSize / 2 },
      { x: x + w - handleSize / 2, y: y + h / 2 - handleSize / 2 },
      { x: x - handleSize / 2, y: y + h - handleSize / 2 },
      { x: x + w / 2 - handleSize / 2, y: y + h - handleSize / 2 },
      { x: x + w - handleSize / 2, y: y + h - handleSize / 2 },
    ];

    handles.forEach(h => {
      ctx.fillRect(h.x, h.y, handleSize, handleSize);
      ctx.strokeRect(h.x, h.y, handleSize, handleSize);
    });
  }

  // Text utilities
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
  }

  private buildFilterString(filters: ImageFilters): string {
    const parts: string[] = [];
    if (filters.brightness !== 0) parts.push(`brightness(${100 + filters.brightness}%)`);
    if (filters.contrast !== 0) parts.push(`contrast(${100 + filters.contrast}%)`);
    if (filters.saturation !== 0) parts.push(`saturate(${100 + filters.saturation}%)`);
    if (filters.blur > 0) parts.push(`blur(${filters.blur}px)`);
    if (filters.grayscale > 0) parts.push(`grayscale(${filters.grayscale}%)`);
    if (filters.sepia > 0) parts.push(`sepia(${filters.sepia}%)`);
    if (filters.hue !== 0) parts.push(`hue-rotate(${filters.hue}deg)`);
    if (filters.invert > 0) parts.push(`invert(${filters.invert}%)`);
    return parts.length > 0 ? parts.join(' ') : 'none';
  }

  // Image cache
  private imageCache: Map<string, HTMLImageElement> = new Map();

  cacheImage(src: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(src)) {
      return Promise.resolve(this.imageCache.get(src)!);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  private getCachedImage(src: string): HTMLImageElement | null {
    return this.imageCache.get(src) || null;
  }

  // History
  saveState(): void {
    const state = JSON.stringify(this.elements);

    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push(state);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;
  }

  undo(): boolean {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.elements = JSON.parse(this.history[this.historyIndex]);
      this.render();
      return true;
    }
    return false;
  }

  redo(): boolean {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.elements = JSON.parse(this.history[this.historyIndex]);
      this.render();
      return true;
    }
    return false;
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  // Export
  async exportToDataURL(format: 'png' | 'jpeg' | 'webp' = 'png', quality: number = 0.92): Promise<string> {
    if (!this.canvas) throw new Error('No canvas set');

    const prevSelected = this.selectedId;
    this.selectedId = null;
    this.render();

    const dataUrl = this.canvas.toDataURL(`image/${format}`, quality);

    this.selectedId = prevSelected;
    this.render();

    return dataUrl;
  }

  async exportToBlob(format: 'png' | 'jpeg' | 'webp' = 'png', quality: number = 0.92): Promise<Blob> {
    if (!this.canvas) throw new Error('No canvas set');

    return new Promise((resolve, reject) => {
      this.canvas!.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, `image/${format}`, quality);
    });
  }

  async uploadToSupabase(folder: 'images' | 'templates' = 'images'): Promise<string> {
    const blob = await this.exportToBlob('png');
    const file = new File([blob], `design_${Date.now()}.png`, { type: 'image/png' });

    try {
      const result = await uploadAsset(file, folder);
      return result.publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  // Hit testing for element selection
  hitTest(x: number, y: number): string | null {
    const sorted = [...this.elements].sort((a, b) => b.zIndex - a.zIndex);

    for (const element of sorted) {
      if (!element.visible || element.locked) continue;

      if (
        x >= element.x &&
        x <= element.x + element.width &&
        y >= element.y &&
        y <= element.y + element.height
      ) {
        return element.id;
      }
    }

    return null;
  }

  // Clear all
  clear(): void {
    this.elements = [];
    this.selectedId = null;
    this.history = [];
    this.historyIndex = -1;
    this.render();
  }

  // Load template
  loadTemplate(template: Template): void {
    this.clear();
    this.width = template.width;
    this.height = template.height;
    this.elements = template.elements.map(el => ({
      ...el,
      id: generateId(),
    }));
    this.saveState();
    this.render();
  }

  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  ImageEditorService,
  templateService,
  brandKitService,
  generateId,
  DIMENSIONS,
  DEFAULT_FILTERS,
  FILTER_PRESETS,
  FONT_FAMILIES,
};
