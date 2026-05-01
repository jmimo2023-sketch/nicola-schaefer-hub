/**
 * NICOLA CONTENT HUB - CORE EDITOR ENGINE
 * 
 * Unified system for all content creation and editing
 * Replaces: Canva (design), CapCut (video), custom editors
 * 
 * Architecture:
 * - EditorFactory: Creates appropriate editor for content type
 * - BrandKit: Manages brand assets and templates
 * - AssetManager: Handles all media assets (local + Supabase)
 * - ExportPipeline: Multi-format export with WhatsApp integration
 * - ContentVersion: Version control for content
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export type ContentType = 'image' | 'video' | 'story' | 'reel' | 'carousel' | 'post';
export type EditorMode = 'create' | 'edit' | 'preview' | 'export';
export type ExportFormat = 'png' | 'jpg' | 'mp4' | 'pdf' | 'svg';
export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9' | 'story' | 'post' | 'reel';

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  gold: string;
}

export interface BrandFonts {
  display: string;
  heading: string;
  body: string;
  accent: string;
}

export interface BrandTemplate {
  id: string;
  name: string;
  type: ContentType;
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  background: string;
  elements?: TemplateElement[];
}

export interface TemplateElement {
  type: 'text' | 'image' | 'shape' | 'sticker';
  x: number;
  y: number;
  width: number;
  height: number;
  props: Record<string, any>;
}

export interface ContentAsset {
  id: string;
  name: string;
  type: ContentType;
  format: ExportFormat;
  width: number;
  height: number;
  url: string;
  thumbnailUrl?: string;
  metadata: ContentMetadata;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  version: number;
}

export interface ContentMetadata {
  pillar?: string;
  caption?: string;
  hashtags?: string[];
  scheduledAt?: string;
  platform?: 'instagram' | 'facebook' | 'both';
  tags?: string[];
}

export interface EditorState {
  mode: EditorMode;
  contentType: ContentType;
  aspectRatio: AspectRatio;
  dimensions: { width: number; height: number };
  zoom: number;
  selectedElements: string[];
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
}

export interface ContentProject {
  id: string;
  name: string;
  type: ContentType;
  brandKit: BrandKitConfig;
  template: BrandTemplate;
  elements: ContentElement[];
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string;
}

export interface ContentElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'video' | 'audio';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  props: TextProps | ImageProps | ShapeProps | VideoProps;
  locked: boolean;
  visible: boolean;
  opacity: number;
}

export interface TextProps {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
}

export interface ImageProps {
  src: string;
  filter: string;
  blendMode: string;
  crop?: { x: number; y: number; width: number; height: number };
}

export interface ShapeProps {
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'line';
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
}

export interface VideoProps {
  src: string;
  startTime: number;
  endTime: number;
  volume: number;
  playbackSpeed: number;
}

export interface BrandKitConfig {
  name: string;
  colors: BrandColors;
  fonts: BrandFonts;
  logos: string[];
  patterns: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const ASPECT_RATIOS: Record<AspectRatio, { width: number; height: number; label: string }> = {
  '1:1': { width: 1080, height: 1080, label: 'Square Post' },
  '4:5': { width: 1080, height: 1350, label: 'Portrait' },
  '9:16': { width: 1080, height: 1920, label: 'Story/Reel' },
  '16:9': { width: 1920, height: 1080, label: 'Landscape' },
  'story': { width: 1080, height: 1920, label: 'Instagram Story' },
  'post': { width: 1080, height: 1080, label: 'Instagram Post' },
  'reel': { width: 1080, height: 1920, label: 'Instagram Reel' },
};

export const INSTAGRAM_FORMATS: Record<string, { width: number; height: number; label: string }> = {
  'post-square': { width: 1080, height: 1080, label: 'Post Square (1:1)' },
  'post-portrait': { width: 1080, height: 1350, label: 'Post Portrait (4:5)' },
  'story': { width: 1080, height: 1920, label: 'Story (9:16)' },
  'reel': { width: 1080, height: 1920, label: 'Reel Cover' },
  'carousel': { width: 1080, height: 1080, label: 'Carousel' },
};

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

class SupabaseService {
  private client: SupabaseClient | null = null;
  private bucket = 'nicola-assets';

  constructor() {
    this.initClient();
  }

  private initClient() {
    if (!this.client) {
      this.client = createClient(
        'https://djspyyyihyxwtmduoolj.supabase.co',
        'sb_publishable_Pph0V6rjR2PR3oGe87gikA_qo-F__TU'
      );
    }
  }

  getClient(): SupabaseClient {
    this.initClient();
    return this.client!;
  }

  // Asset operations
  async uploadAsset(file: Blob, path: string, contentType: string): Promise<string> {
    const client = this.getClient();
    const { data, error } = await client.storage
      .from(this.bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: urlData } = client.storage.from(this.bucket).getPublicUrl(path);
    return urlData.publicUrl;
  }

  async uploadDesignThumbnail(dataUrl: string, projectId: string): Promise<string> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const path = `thumbnails/${projectId}.png`;
    return this.uploadAsset(blob, path, 'image/png');
  }

  async listAssets(folder: string, limit = 50): Promise<any[]> {
    const client = this.getClient();
    const { data, error } = await client.storage
      .from(this.bucket)
      .list(folder, { limit, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) throw new Error(`List failed: ${error.message}`);
    return data || [];
  }

  async deleteAsset(path: string): Promise<void> {
    const client = this.getClient();
    const { error } = await client.storage.from(this.bucket).remove([path]);
    if (error) throw new Error(`Delete failed: ${error.message}`);
  }

  // Content metadata operations
  async saveContentMetadata(content: ContentAsset): Promise<void> {
    const client = this.getClient();
    const { error } = await client
      .from('content_metadata')
      .upsert({
        id: content.id,
        name: content.name,
        type: content.type,
        format: content.format,
        url: content.url,
        thumbnail_url: content.thumbnailUrl,
        metadata: content.metadata,
        status: content.status,
        created_at: content.createdAt,
        updated_at: content.updatedAt
      });

    if (error) console.warn('Metadata save warning:', error.message);
  }
}

// ============================================================================
// BRAND KIT SERVICE
// ============================================================================

class BrandKitService {
  private brandKit: BrandKitConfig | null = null;

  getDefaultBrandKit(): BrandKitConfig {
    return {
      name: 'Nicola Schaefer',
      colors: {
        primary: '#467a49',
        secondary: '#d16806',
        accent: '#e6a919',
        background: '#fefcf8',
        text: '#1a1a1a',
        gold: '#e8b571'
      },
      fonts: {
        display: 'Cormorant Garamond',
        heading: 'Playfair Display',
        body: 'Outfit',
        accent: 'Montserrat'
      },
      logos: [],
      patterns: []
    };
  }

  loadBrandKit(): BrandKitConfig {
    if (!this.brandKit) {
      this.brandKit = this.getDefaultBrandKit();
    }
    return this.brandKit;
  }

  getBrandColors(): BrandColors {
    return this.loadBrandKit().colors;
  }

  getBrandFonts(): BrandFonts {
    return this.loadBrandKit().fonts;
  }

  getTemplates(): BrandTemplate[] {
    return [
      {
        id: 'vilcabamba-post',
        name: 'Vilcabamba Post',
        type: 'post',
        aspectRatio: '1:1',
        width: 1080,
        height: 1080,
        background: '#467a49'
      },
      {
        id: 'vilcabamba-story',
        name: 'Vilcabamba Story',
        type: 'story',
        aspectRatio: '9:16',
        width: 1080,
        height: 1920,
        background: '#155336'
      },
      {
        id: 'coaching-tip',
        name: 'Coaching Tip',
        type: 'post',
        aspectRatio: '1:1',
        width: 1080,
        height: 1080,
        background: '#d16806'
      },
      {
        id: 'retiro-anuncio',
        name: 'Retiro Anuncio',
        type: 'story',
        aspectRatio: '9:16',
        width: 1080,
        height: 1920,
        background: '#1a1a1a'
      }
    ];
  }

  getTemplate(id: string): BrandTemplate | undefined {
    return this.getTemplates().find(t => t.id === id);
  }
}

// ============================================================================
// CONTENT VERSION SERVICE
// ============================================================================

class ContentVersionService {
  private versions: Map<string, ContentProject[]> = new Map();

  saveVersion(project: ContentProject): void {
    const projectVersions = this.versions.get(project.id) || [];
    projectVersions.push({ ...project, version: projectVersions.length + 1 });
    this.versions.set(project.id, projectVersions);
    
    // Also save to localStorage for persistence
    try {
      localStorage.setItem(`content_versions_${project.id}`, JSON.stringify(projectVersions));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  getVersions(projectId: string): ContentProject[] {
    // Try to load from localStorage first
    try {
      const stored = localStorage.getItem(`content_versions_${projectId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not load from localStorage:', e);
    }
    return this.versions.get(projectId) || [];
  }

  getLatestVersion(projectId: string): ContentProject | null {
    const versions = this.getVersions(projectId);
    return versions[versions.length - 1] || null;
  }
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

class ExportService {
  private supabase: SupabaseService;
  private brandKit: BrandKitService;

  constructor(supabase: SupabaseService, brandKit: BrandKitService) {
    this.supabase = supabase;
    this.brandKit = brandKit;
  }

  async exportToPNG(canvas: HTMLElement, projectName: string): Promise<string> {
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(canvas, { pixelRatio: 2, quality: 0.92 });
    return dataUrl;
  }

  async exportToJPG(canvas: HTMLElement, projectName: string, quality = 0.92): Promise<string> {
    const { toJpeg } = await import('html-to-image');
    const dataUrl = await toJpeg(canvas, { quality, width: canvas.offsetWidth, height: canvas.offsetHeight });
    return dataUrl;
  }

  async exportToSVG(editor: any, projectName: string): Promise<string> {
    const svg = await editor.getSvg(editor.getCurrentPageShapes());
    if (!svg) throw new Error('Failed to generate SVG');
    return new XMLSerializer().serializeToString(svg);
  }

  async saveToSupabase(dataUrl: string, project: ContentProject): Promise<{ url: string; id: string }> {
    const timestamp = Date.now();
    const safeName = project.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const path = `designs/${timestamp}-${safeName}.png`;

    const response = await fetch(dataUrl);
    const blob = await response.blob();

    const url = await this.supabase.uploadAsset(blob, path, 'image/png');

    // Also upload thumbnail
    const thumbDataUrl = await this.exportToPNG(document.querySelector('.canvas-container') as HTMLElement, project.name);
    const thumbPath = `thumbnails/${timestamp}-${safeName}_thumb.png`;
    await this.supabase.uploadAsset(await (await fetch(thumbDataUrl)).blob(), thumbPath, 'image/png');

    return { url, id: path };
  }

  generateWhatsAppMessage(content: ContentAsset): string {
    const caption = content.metadata.caption || `Nuevo contenido: ${content.name}`;
    
    return `🎨 *${content.name}*

📐 Formato: ${content.type} (${content.width}×${content.height})
${content.metadata.pillar ? `🏷️ Pilar: ${content.metadata.pillar}` : ''}

${caption}

📎 Ver: ${content.url}

━━━━━━━━━━━━━━━
¿Aprobar para publicar?

✅ "OK" → Publicar
📝 "Cambios" + nota → Solicitar cambios`;
  }
}

// ============================================================================
// EDITOR FACTORY
// ============================================================================

export class EditorFactory {
  private supabase: SupabaseService;
  private brandKit: BrandKitService;
  private versions: ContentVersionService;
  private exportService: ExportService;

  constructor() {
    this.supabase = new SupabaseService();
    this.brandKit = new BrandKitService();
    this.versions = new ContentVersionService();
    this.exportService = new ExportService(this.supabase, this.brandKit);
  }

  // Getters
  getSupabase(): SupabaseService {
    return this.supabase;
  }

  getBrandKit(): BrandKitService {
    return this.brandKit;
  }

  getVersions(): ContentVersionService {
    return this.versions;
  }

  getExportService(): ExportService {
    return this.exportService;
  }

  // Factory methods
  createNewProject(type: ContentType, templateId?: string): ContentProject {
    const template = templateId ? this.brandKit.getTemplate(templateId) : undefined;
    const dimensions = template 
      ? { width: template.width, height: template.height }
      : { width: 1080, height: 1080 };

    return {
      id: `project_${Date.now()}`,
      name: `Nuevo ${type} ${new Date().toLocaleDateString()}`,
      type,
      brandKit: this.brandKit.loadBrandKit(),
      template: template || {
        id: 'blank',
        name: 'Blank',
        type,
        aspectRatio: '1:1',
        width: dimensions.width,
        height: dimensions.height,
        background: '#467a49'
      },
      elements: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  getAspectRatioDimensions(aspectRatio: AspectRatio): { width: number; height: number } {
    return ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS['1:1'];
  }

  // Content type helpers
  isVideoContent(type: ContentType): boolean {
    return type === 'video' || type === 'reel';
  }

  isImageContent(type: ContentType): boolean {
    return type === 'image' || type === 'post' || type === 'story' || type === 'carousel';
  }

  // Export helpers
  async quickExport(
    canvas: HTMLElement, 
    editor: any,
    project: ContentProject,
    format: ExportFormat
  ): Promise<ContentAsset> {
    let dataUrl: string;

    switch (format) {
      case 'png':
        dataUrl = await this.exportService.exportToPNG(canvas, project.name);
        break;
      case 'jpg':
        dataUrl = await this.exportService.exportToJPG(canvas, project.name);
        break;
      case 'svg':
        dataUrl = await this.exportService.exportToSVG(editor, project.name);
        break;
      default:
        dataUrl = await this.exportService.exportToPNG(canvas, project.name);
    }

    const { url, id } = await this.exportService.saveToSupabase(dataUrl, project);

    const content: ContentAsset = {
      id,
      name: project.name,
      type: project.type,
      format,
      width: project.template.width,
      height: project.template.height,
      url,
      thumbnailUrl: url,
      metadata: {
        pillar: project.template.id,
        caption: ''
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'review',
      version: 1
    };

    toast.success('💾 Guardado en Supabase');
    return content;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const editorEngine = new EditorFactory();
