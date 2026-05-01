# Canva Studio Module - SPEC v1.0

## Resumen

Módulo completo de Canva Studio para Nicola Hub - coaching de vida para mercado DACH.

## Stack Tecnológico

```json
{
  "dependencies": {
    "@canva/design": "^2.0.0",           // Canva SDK oficial
    "fabric": "^6.6.0",                    // Canvas manipulation
    "browser-image-compression": "^2.0.2", // Compresión imágenes
    "file-saver": "^2.0.5",                // Exportar archivos
    "html2canvas": "^1.4.1",               // Render HTML to canvas
    "jspdf": "^2.5.2",                     // Export PDF
    "quagga": "^0.12.1",                   // QR code generation
    "color-thief": "^2.4.0",               // Extraer colores de imagen
    "exif-js": "^2.3.0",                   // Leer EXIF data
  }
}
```

---

## 1. ARQUITECTURA DE SERVICIOS

```
src/services/studio/
├── canvaService.ts          # Integración Canva SDK (existente, mejorado)
├── studioService.ts         # Gestión de proyectos, drafts, versiones
├── brandKitService.ts       # Sistema de Brand Kits
├── templateService.ts       # Biblioteca de templates
├── studioAIService.ts       # AI powered features
├── exportService.ts         # Exportación multi-formato
├── assetLibraryService.ts   # Biblioteca inteligente de assets
├── versionControlService.ts # Control de versiones
└── analyticsService.ts      # Analytics por diseño
```

---

## 2. CANVA SERVICE (Mejorado)

### Features
- Design creation con todos los formatos
- Brand template autofill
- Export configurable (PNG, JPG, PDF, WEBP)
- Design metadata management
- Stock images search (Canva API)
- Connect API para assets
- Webhooks para publish

### API Endpoints a usar
```
POST /v1/designs                    # Crear diseño
GET  /v1/designs/:id                # Obtener diseño
PUT  /v1/designs/:id               # Actualizar diseño
POST /v1/designs/:id/autofill       # Autofill con datos
GET  /v1/assets                     # Listar assets
POST /v1/assets/upload             # Subir asset
GET  /v1/stock-images              # Buscar stock
POST /v1/exports                   # Exportar diseño
```

---

## 3. BRAND KIT SERVICE

### Estructura de datos
```typescript
interface BrandKit {
  id: string;
  name: string;
  colors: {
    primary: BrandColor;
    secondary: BrandColor;
    accent: BrandColor;
    background: BrandColor;
    text: BrandColor;
    neutrals: BrandColor[];
  };
  fonts: {
    display: BrandFont;
    heading: BrandFont;
    body: BrandFont;
    accent: BrandFont;
  };
  logos: BrandLogo[];
  patterns: BrandPattern[];
  moodImages: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface BrandColor {
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  usage: string[];  // ['primary_button', 'headings']
  contrast: {
    onWhite: number;
    onBlack: number;
    onPrimary: number;
  };
}

interface BrandFont {
  name: string;
  family: string;
  weights: number[];
  styles: ('normal' | 'italic')[];
  googleFontId?: string;
  url?: string;
  usage: string;
}

interface BrandLogo {
  id: string;
  name: string;
  url: string;
  darkUrl?: string;
  formats: ('svg' | 'png' | 'jpg')[];
  usage: string;
  size: { width: number; height: number };
}

interface BrandPattern {
  id: string;
  name: string;
  svg?: string;
  imageUrl?: string;
  colors: string[];
}
```

### Funcionalidades
- CRUD completo de Brand Kits
- Brand Kit activo por defecto
- Verificación de contraste WCAG
- Extracción de colores de imagen (ColorThief)
- Export/Import de Brand Kit (JSON)
- Aplicar brand kit a diseños
- AI brand consistency checker

---

## 4. TEMPLATE SERVICE

### Estructura
```typescript
interface Template {
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
  createdAt: Date;
  updatedAt: Date;
}

type TemplateCategory =
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

interface TemplateElement {
  type: 'image' | 'text' | 'shape' | 'background';
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, any>;
  placeholder?: boolean;
  placeholderType?: 'text' | 'image' | 'color';
}
```

### Categorías y Subcategorías
```
quotes
├── inspirational
├── motivational
├── affirmation
├── gratitude
└── wisdom

testimonials
├── client_stories
├── results
├── reviews
└── case_studies

announcements
├── event
├── milestone
├── new_offering
└── launch

education
├── tips
├── how_to
├── explainer
├── fact
└── definition

motivation
├── mindset
├── habits
├── goals
├── transformation
└── morning_routine

product
├── feature
├── benefit
├── testimonial_boost
├── comparison
└── showcase

services
├── coaching
├── mentoring
├── workshop
├── retreat
└── consultation

lifestyle
├── morning_routine
├── self_care
├── wellness
├── business
└── travel

seasonal
├── spring
├── summer
├── autumn
├── winter
└── holidays

minimalist
├── typography_only
├── single_image
├── whitespace
└── geometric

bold
├── vibrant_colors
├── large_text
├── contrast
└── statement
```

---

## 5. STUDIO AI SERVICE

### Features
```typescript
interface StudioAI {
  // Content Generation
  generateCaption(topic: string, tone: Tone): Promise<string>;
  generateHashtags(content: string, count: number): Promise<string[]>;
  suggestTitle(content: string, platform: Platform): Promise<string>;

  // Image Enhancement
  enhanceImage(imageUrl: string, options: EnhanceOptions): Promise<string>;
  removeBackground(imageUrl: string): Promise<string>;
  smartCrop(imageUrl: string, aspectRatio: string): Promise<string>;
  extractColors(imageUrl: string): Promise<ColorPalette>;

  // Layout & Design
  suggestLayout(content: string, format: Format): Promise<LayoutSuggestion>;
  suggestBrandColors(content: string): Promise<string[]>;
  checkBrandConsistency(design: Design): Promise<ConsistencyReport>;

  // Posting
  suggestBestTime(platform: Platform): Promise<PostingTime>;
  generateA/BVariants(content: string, count: number): Promise<string[]>;
}

type Tone = 'professional' | 'friendly' | 'inspirational' | 'humorous' | 'educational';
type Platform = 'instagram' | 'facebook' | 'linkedin' | 'youtube' | 'twitter';
type EnhanceOptions = {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  sharpness?: number;
  denoise?: boolean;
  colorize?: boolean;
};
```

### Integraciones
- **Google Gemini AI** - Captions, hashtags, títulos
- **Canva AI** - Background removal, smart crop, enhance
- **ColorThief** - Extracción de paletas de colores
- **Custom ML** - Brand consistency checking

---

## 6. EXPORT SERVICE

### Formatos Soportados
```typescript
const EXPORT_FORMATS = {
  image: {
    PNG: { quality: 1.0, extension: 'png' },
    JPG: { quality: 0.9, extension: 'jpg' },
    WEBP: { quality: 0.85, extension: 'webp' },
    PDF: { type: 'document', extension: 'pdf' },
    SVG: { type: 'vector', extension: 'svg' },
  },
  video: {
    MP4: { codec: 'h264', extension: 'mp4' },
    MOV: { codec: 'prores', extension: 'mov' },
    WEBM: { codec: 'vp9', extension: 'webm' },
  },
};

// Social media optimized sizes
const SOCIAL_SIZES = {
  instagram: {
    post: { width: 1080, height: 1080 },
    story: { width: 1080, height: 1920 },
    reel: { width: 1080, height: 1920 },
    landscape: { width: 1080, height: 566 },
    portrait: { width: 1080, height: 1350 },
  },
  facebook: {
    post: { width: 1200, height: 630 },
    cover: { width: 820, height: 312 },
    event: { width: 1920, height: 1005 },
  },
  linkedin: {
    post: { width: 1200, height: 627 },
    cover: { width: 1584, height: 396 },
  },
  youtube: {
    thumbnail: { width: 1280, height: 720 },
    banner: { width: 2560, height: 1440 },
    shorts: { width: 1080, height: 1920 },
  },
  twitter: {
    post: { width: 1200, height: 675 },
    header: { width: 1500, height: 500 },
  },
  pinterest: {
    pin: { width: 1000, height: 1500 },
  },
};
```

### Features
- Batch export (múltiples formatos a la vez)
- Watermark configurable
- Optimización automática por plataforma
- Compresión inteligente
- Preview antes de exportar
- Export history

---

## 7. ASSET LIBRARY SERVICE

### Estructura
```typescript
interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  dimensions?: { width: number; height: number };
  duration?: number; // for video/audio
  folder: string;
  tags: string[];
  colors?: string[]; // extracted dominant colors
  metadata: {
    exif?: ExifData;
    camera?: string;
    location?: { lat: number; lng: number };
    createdAt: Date;
    uploadedAt: Date;
  };
  usage: {
    usedIn: string[]; // design IDs
    lastUsedAt?: Date;
    useCount: number;
  };
  isFavorite: boolean;
  isArchived: boolean;
}

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
  assetCount: number;
  createdAt: Date;
}
```

### Features
- Upload con drag-drop
- Organization en folders jerárquicos
- Smart search (text, colors, tags, date)
- Auto-tagging basado en contenido (AI)
- Duplicate detection
- Bulk operations
- Recent & Favorites
- Filter por tipo, fecha, colores, tags

---

## 8. VERSION CONTROL SERVICE

### Estructura
```typescript
interface DesignVersion {
  id: string;
  designId: string;
  version: number;
  snapshot: {
    elements: any[];
    canvasSize: { width: number; height: number };
    background: string;
    layers: any[];
  };
  thumbnail: string;
  message?: string;
  createdBy: string;
  createdAt: Date;
  isAutoSave: boolean;
}

interface DesignProject {
  id: string;
  name: string;
  currentVersion: number;
  versions: DesignVersion[];
  collaborators: Collaborator[];
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
  lastEditedAt: Date;
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'archived';
}
```

### Features
- Auto-save cada 30 segundos
- Version history completa
- Restore a versión anterior
- Comparación entre versiones
- Branching (fork de diseño)
- Merge de cambios
- Collaborative editing (future)

---

## 9. ANALYTICS SERVICE

```typescript
interface DesignAnalytics {
  designId: string;
  impressions: number;
  reach: number;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  clickThrough: number;
  audienceRetention?: number; // for videos
  demographics: {
    ageRanges: Record<string, number>;
    genders: Record<string, number>;
    countries: Record<string, number>;
    cities: Record<string, number>;
  };
  bestComment: string;
  createdAt: Date;
  period: 'day' | 'week' | 'month' | 'quarter';
}
```

---

## 10. UI COMPONENTS - STUDIO PANEL

### Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER                                                          │
│ [Logo] Studio v2.0                    [Brand Kit ▼] [Settings]   │
├─────────────────────────────────────────────────────────────────┤
│ TOOLBAR                                                         │
│ [+ New] [Open] [Save] [Undo] [Redo] │ [Zoom] [Grid] [Layers]  │
├──────────────┬──────────────────────────────────┬───────────────┤
│ SIDEBAR      │ CANVAS                           │ PROPERTIES    │
│              │                                  │               │
│ [Projects]   │    ┌──────────────────────┐      │ [Element]     │
│ [Templates]  │    │                      │      │ [Transform]  │
│ [Assets]     │    │      Design          │      │ [Appearance] │
│ [Brand Kit]  │    │      Area            │      │ [Text]       │
│ [Layers]     │    │                      │      │ [Effects]     │
│ [History]    │    └──────────────────────┘      │ [Brand]       │
│              │                                  │               │
├──────────────┴──────────────────────────────────┴───────────────┤
│ FOOTER                                                          │
│ [Format: Instagram Post ▼] [Size: 1080x1080] [Status: Draft]    │
└─────────────────────────────────────────────────────────────────┘
```

### Components
1. **StudioHeader** - Logo, brand selector, settings
2. **StudioToolbar** - Main actions, tools, zoom
3. **StudioSidebar** - Navigation (projects, templates, assets, etc.)
4. **StudioCanvas** - Main editing area with zoom/pan
5. **StudioProperties** - Context-sensitive properties panel
6. **StudioLayers** - Layer management
7. **StudioTimeline** - Video/carousel timeline
8. **ExportModal** - Export options and preview

### Panels dentro del Sidebar
1. **ProjectsPanel** - Grid of projects with thumbnails
2. **TemplatesPanel** - Template library with categories
3. **AssetsPanel** - Asset library with folders
4. **BrandKitPanel** - Brand colors, fonts, logos
5. **LayersPanel** - Layer stack with visibility/lock
6. **HistoryPanel** - Version history timeline

---

## 11. COMMAND STRINGS (Telegram Bot Integration)

```
# Studio Commands
/studio - Abrir Content Studio
/new [formato] - Nuevo diseño
/templates - Ver templates
/brands - Gestionar brand kits
/export [id] [formato] - Exportar diseño

# Template Categories
/quote - Templates de citas
/motivation - Templates motivacionales
/education - Templates educativos
/product - Templates de producto
/service - Templates de servicios

# Quick Actions
/quick [tipo] - Crear diseño rápido
/recent - Diseños recientes
/favorites - Diseños favoritos
/search [query] - Buscar diseños

# Brand Kit
/brand colors - Ver colores de marca
/brand fonts - Ver fuentes de marca
/brand logos - Ver logos de marca
```

---

## 12. FIREBASE FIRESTORE SCHEMA

```
/studio_projects/{projectId}
  - name, description, thumbnail
  - currentVersion, versions[]
  - collaborators[]
  - settings, status
  - createdAt, updatedAt, lastEditedAt
  - brandKitId, tags[]

/studio_templates/{templateId}
  - name, description, thumbnail
  - category, subcategory, tags[]
  - dimensions, format, elements[]
  - brandKitId
  - isPremium, isTrending, usageCount

/brand_kits/{brandKitId}
  - name, colors, fonts, logos[]
  - patterns[], moodImages[]
  - isActive, createdAt, updatedAt

/studio_assets/{assetId}
  - name, type, mimeType, url, thumbnailUrl
  - size, dimensions, folder
  - tags[], colors[]
  - metadata, usage, isFavorite, isArchived

/studio_exports/{exportId}
  - designId, projectId
  - format, quality, size
  - url, createdAt
```

---

## 13. STATE MANAGEMENT

```typescript
// Studio Store (React Context + useReducer)
interface StudioState {
  // Project
  currentProject: DesignProject | null;
  projects: DesignProject[];

  // Canvas
  canvasSize: Dimensions;
  zoom: number;
  pan: { x: number; y: number };
  showGrid: boolean;

  // Elements
  elements: EditorElement[];
  selectedElementId: string | null;
  clipboard: EditorElement[];

  // Layers
  layers: Layer[];
  layerVisibility: Record<string, boolean>;
  layerLock: Record<string, boolean>;

  // History
  history: HistoryState;
  historyIndex: number;

  // UI State
  activePanel: 'projects' | 'templates' | 'assets' | 'brand' | 'layers' | 'history';
  showProperties: boolean;
  showExportModal: boolean;
  showTemplatesModal: boolean;

  // Brand
  activeBrandKit: BrandKit | null;
  brandKits: BrandKit[];

  // Templates
  templates: Template[];
  activeTemplate: Template | null;

  // Assets
  assets: Asset[];
  folders: Folder[];
  activeFolder: string;

  // AI
  aiSuggestions: AISuggestion[];
  isGenerating: boolean;

  // Export
  exportSettings: ExportSettings;

  // Status
  isSaving: boolean;
  isLoading: boolean;
  lastSaved: Date | null;
  autoSaveEnabled: boolean;
}
```

---

## 14. CANVA CONNECT API (EndPoints)

```
Base URL: https://api.canva.com/rest/v1

# Designs
POST   /designs                    # Create design
GET    /designs                    # List designs
GET    /designs/{design_id}        # Get design
PUT    /designs/{design_id}        # Update design
DELETE /designs/{design_id}        # Delete design
POST   /designs/{design_id}/autofill # Autofill template

# Assets
GET    /assets                     # List assets
POST   /assets/upload              # Upload asset
DELETE /assets/{asset_id}          # Delete asset

# Exports
POST   /exports                    # Create export
GET    /exports/{export_id}        # Get export status
GET    /exports/{export_id}/download # Download export

# Brand Templates
GET    /brand-templates            # List brand templates
GET    /brand-templates/{id}       # Get brand template

# Stock Images
GET    /stock-images               # Search stock images
```

---

## 15. WORKFLOW DE USUARIO

```
1. Usuario abre Studio (/studio en Telegram o panel web)
2. Ve dashboard con proyectos recientes + templates
3. Puede:
   a) Abrir proyecto existente
   b) Crear nuevo desde template
   c) Crear desde cero (blank canvas)
   d) Subir imagen para editar

4. En editor:
   - Selecciona tool (select, text, shape, image)
   - Añade/editar elementos
   - Aplica filtros, efectos
   - Gestiona layers
   - Aplica brand kit
   - Guarda (auto-save + manual)

5. Export:
   - Selecciona formato(s)
   - Configura calidad
   - Añade watermark (opcional)
   - Exporta

6. Publish:
   - Directly to Instagram (via Meta API)
   - Save to drafts for later
   - Share link
```

---

## 16. INTEGRACIÓN CON MAKE.COM

```
# Escenario D.2 - Selector de Assets
Trigger: Webhook from Telegram
Actions:
  1. List assets from Canva/Supabase (últimas 2 semanas)
  2. Filter and sort by date
  3. Send to Telegram with numbered options
  4. Wait for user response
  5. Pass selected asset to Scenario #2

# Studio Integration Scenarios
- Studio A: Create design from template
- Studio B: Edit existing design
- Studio C: Export and publish
- Studio D: AI enhancement
```

---

## 17. LIBRERÍAS ADICIONALES NECESARIAS

```json
{
  "fabric": "^6.6.0",              // Canvas manipulation (si no se usa el editor actual)
  "file-saver": "^2.0.5",            // Export files
  "html2canvas": "^1.4.1",           // HTML to canvas
  "jspdf": "^2.5.2",                // PDF export
  "quagga": "^0.12.1",              // QR codes
  "color-thief": "^2.4.0",          // Extract colors from images
  "exif-js": "^2.3.0",             // EXIF metadata
}
```

---

## 18. ROADMAP DE IMPLEMENTACIÓN

### Fase 1: Core (1-2 días)
- [ ] Enhanced canvaService.ts
- [ ] New studioService.ts
- [ ] Enhanced ImageEditorPanel.tsx
- [ ] Basic export functionality

### Fase 2: Brand & Templates (1-2 días)
- [ ] brandKitService.ts
- [ ] templateService.ts (enhanced)
- [ ] Brand Kit UI components
- [ ] Template selector UI

### Fase 3: AI Features (1 día)
- [ ] studioAIService.ts
- [ ] AI integration hooks
- [ ] Smart suggestions UI

### Fase 4: Export & Assets (1 día)
- [ ] exportService.ts
- [ ] assetLibraryService.ts
- [ ] Asset manager UI
- [ ] Export modal UI

### Fase 5: Polish (1 día)
- [ ] Version control
- [ ] Analytics
- [ ] Performance optimization
- [ ] Bug fixes
