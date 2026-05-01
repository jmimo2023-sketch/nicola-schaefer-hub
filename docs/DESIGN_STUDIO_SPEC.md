# Nicola Design Studio - SPEC v1.0

**Aplicación de diseño profesional inspirada en Canva, 100% propia.**
Construida con las mejores tecnologías modernas de 2025-2026.

---

## 1. CONCEPTO Y VISIÓN

**Nicola Design Studio** es una herramienta de diseño profesional para crear contenido visual para Instagram y otras redes sociales. Diseñada específicamente para Nicola Schaefer (life coach enfocada en el mercado DACH), combina:

- Potencia de edición profesional (capas, shapes, texto, imágenes)
- AI integrada para mejora automática
- Brand Kit management personalizado
- Templates optimizados para coaching/life coaching
- Export directo a Instagram

**Personalidad:** Profesional pero accesible. Elegante como Canva pero con el toque personal de Nicola. No abruma, guía al usuario.

---

## 2. DESIGN LANGUAGE

### Aesthetic Direction
Inspirado en Canva + Notion: limpio, spacious, con acentos de color de la marca Nicola.
Minimalismo funcional con micro-interacciones deleitantes.

### Color Palette
```
Primary:        #467a49 (Forest Green - headings, buttons)
Secondary:      #d16806 (Warm Orange - CTAs, highlights)
Accent:         #e6a919 (Golden - premium elements)
Background:     #fefcf8 (Warm Paper - main bg)
Surface:        #ffffff (White - cards, panels)
Text Primary:   #1a1a1a (Deep Ink)
Text Secondary: #6b7280 (Gray)
Border:         #e5e7eb (Light Gray)
Success:        #10b981 (Emerald)
Warning:        #f59e0b (Amber)
Error:          #ef4444 (Red)
```

### Typography
```
Display:    Cormorant Garamond (700) - headings, quotes
Headings:   Playfair Display (600) - subheadings
Body:       Outfit (400, 500) - UI text
Mono:       JetBrains Mono (400) - code, technical
```

### Spatial System
```
Base unit: 4px
Spacing:   4, 8, 12, 16, 24, 32, 48, 64, 96
Border radius: 4px (small), 8px (medium), 12px (large), 16px (xl)
```

### Motion Philosophy
- **Transitions:** 200ms ease-out (micro), 300ms ease-out (panels), 400ms ease-out (modals)
- **Entrance:** Fade + subtle scale (0.98 → 1)
- **Hover:** Subtle lift (translateY -2px) + shadow
- **Loading:** Skeleton shimmer, spinners en actions secundaries
- **Canvas:** 60fps, instant feedback, no animation on transform

---

## 3. LAYOUT & STRUCTURE

### Main Layout
```
┌────────────────────────────────────────────────────────────────────┐
│  HEADER (64px)                                                     │
│  [Logo] Design Studio    [Brand ▼]  [Templates]  [Settings] [User] │
├─────────────┬──────────────────────────────────────┬───────────────┤
│  LEFT       │         CANVAS VIEWPORT              │  RIGHT         │
│  SIDEBAR    │                                      │  PANEL         │
│  (280px)    │    ┌─────────────────────────┐      │  (320px)       │
│             │    │                         │      │                │
│  • Tools    │    │      ARTBOARD           │      │  • Properties  │
│  • Layers   │    │      (Instagram Post)   │      │  • Layers       │
│  • Assets   │    │                         │      │  • Brand Kit    │
│  • Templates│    └─────────────────────────┘      │  • AI Tools    │
│             │                                      │                │
│             │    [Zoom: 50%] [Grid] [Rulers]       │                │
├─────────────┴──────────────────────────────────────┴───────────────┤
│  FOOTER BAR (48px)                                                  │
│  [Format: Instagram Post ▼] [1080×1080]  │  [Undo] [Redo]  │ Saved │
└────────────────────────────────────────────────────────────────────┘
```

### Canvas Viewport
- Infinite canvas con pan y zoom
- Artboard centrado con shadow
- Grid snapping opcional
- Guides profesionales (smart guides)

### Responsive Strategy
- **Desktop-first (1280px+):** Full layout como mostrado
- **Tablet (768-1279px):** Collapsible sidebars, floating panels
- **Mobile (< 768px):** View-only mode, edición en desktop

---

## 4. FEATURES & INTERACTIONS

### 4.1 Canvas & Editing

#### Herramientas Principales
| Tool | Shortcut | Descripción |
|------|----------|-------------|
| Select (V) | V | Seleccionar y mover objetos |
| Text (T) | T | Crear texto |
| Rectangle (R) | R | Rectángulos y cuadrados |
| Ellipse (O) | O | Círculos y elipses |
| Line (L) | L | Líneas y flechas |
| Freehand | P | Dibujar a mano alzada |
| Image (I) | I | Insertar imagen |
| Pan | Space+Drag | Mover el viewport |
| Zoom | Scroll / Cmd+/- | Zoom in/out |

#### Interacciones del Canvas
- **Click:** Seleccionar objeto
- **Double-click:** Editar texto / entrar a grupo
- **Drag:** Mover objeto seleccionado
- **Shift+Drag:** Restringir proporciones
- **Alt+Drag:** Duplicar objeto
- **Cmd+D:** Duplicar
- **Delete/Backspace:** Eliminar
- **Cmd+C/V:** Copiar/Pegar
- **Cmd+Z/Shift+Z:** Undo/Redo
- **Arrow keys:** Mover 1px (Shift = 10px)

#### Transformaciones
- Resize desde esquinas y lados
- Rotación desde handle exterior
- Skew con Alt+drag corner
- Flip horizontal/vertical

### 4.2 Layers System

```
┌─────────────────────────────────┐
│ 👁 🔒  🔗 [Layer name]     ⋮  │
│ 👁 🔒  🔗 [Layer name]     ⋮  │
│ 👁 🔒  🔗 [Layer name]     ⋮  │
│ 👁 🔓  🔗 [Layer name]     ⋮  │ ← Selected
│ 👁 🔒  🔗 [Layer name]     ⋮  │
└─────────────────────────────────┘

• Visibility toggle (eye icon)
• Lock toggle (lock icon)
• Link/unlink group (chain icon)
• Drag to reorder
• Right-click: Duplicate, Delete, Flatten, Merge down
• Multi-select with Shift+click
• Group (Cmd+G) / Ungroup (Cmd+Shift+G)
```

### 4.3 Text Tool

#### Propiedades
```
Font Family:     [Cormorant Garamond ▼]
Font Size:       [48] px
Font Weight:     [600 ▼] (Light, Regular, Medium, SemiBold, Bold)
Font Style:      [B] [I] [U] [S]
Alignment:       [≡L] [≡C] [≡R] [≡J]
Line Height:     [1.4] ───○───
Letter Spacing:  [0] ───○───
Color:           [■ #1a1a1a] [Picker]
Fill:            [■ #467a49] [None]
Stroke:          [■ #ffffff] [Width: 2px]
```

#### Text Styles (Brand-preset)
```
Heading Large:   Playfair Display, 64px, Bold
Heading:         Playfair Display, 48px, SemiBold
Body:            Outfit, 18px, Regular
Caption:         Outfit, 14px, Regular
Button:          Outfit, 16px, SemiBold, ALL CAPS
Quote:           Cormorant Garamond, 32px, Italic
```

### 4.4 Shape Tool

#### Shape Options
- **Rectangle:** Corner radius (0-100px), fill, stroke
- **Ellipse:** Fill, stroke
- **Triangle:** Fill, stroke
- **Line:** Stroke color, width (1-20px), dash pattern
- **Arrow:** Same as line + arrowhead options
- **Star:** Points (3-12), inner radius, fill, stroke

### 4.5 Image Tool

#### Upload & Import
- Drag & drop desde desktop
- File picker (PNG, JPG, GIF, WEBP, SVG, MP4)
- Paste from clipboard (Cmd+V)
- URL import
- Google Photos integration
- Canva assets (si conectado)
- Stock images (Unsplash, Pexels)

#### Image Properties
```
Dimensions:     [Original: 1200×800] → [Display: 600×400]
Position:       X: [120]  Y: [80]
Rotation:       [0] °
Opacity:        [100] % ───○───
Filters:        [Brightness] [Contrast] [Saturation] [Blur]
                [Grayscale] [Sepia] [Hue]
Crop:           [Free] [1:1] [4:5] [16:9] [Story]
Remove BG:      [✨ AI Remove Background]
Replace BG:     [🎨 Change Background]
```

### 4.6 AI Tools (@imgly/background-removal)

#### Remove Background
1. Seleccionar imagen
2. Click "Remove Background" o usar shortcut (R+B)
3. Progress indicator (descarga modelo la primera vez ~50MB)
4. Result: imagen con fondo transparente
5. Opciones: download as PNG, replace with color, replace with image

#### AI Enhance (Gemini Vision)
1. Seleccionar imagen
2. Click "AI Enhance"
3. Gemini analiza y sugiere mejoras
4. One-click apply o ajustar manualmente

#### Smart Crop
1. Seleccionar imagen
2. Click "Smart Crop"
3. AI detecta punto focal
4. Seleccionar formato (1:1, 4:5, 16:9, Story)
5. Crop automático manteniendo punto focal

### 4.7 Brand Kit Panel

```
┌─────────────────────────────────────────┐
│ 🌿 Nicola Schaefer Brand Kit        [▼] │
├─────────────────────────────────────────┤
│ COLORS                                  │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐        │
│ │ #4 │ │ #d │ │ #e │ │ #fe│ │ #1a│    │
│ │ 67 │ │ 68 │ │ 6a │ │ fcf│ │ 1a│     │
│ │49  │ │ 06 │ │a19 │ │ 8  │ │1a1│     │
│ └───┘ └───┘ └───┘ └───┘ └───┘        │
│ Primary Secondary Accent Bg   Text      │
│                                         │
│ CONTRAST CHECK                          │
│ ✓ Primary on Bg: 4.2:1 (AA ✓)          │
│ ✓ Text on Bg: 16.1:1 (AAA ✓)          │
│ ✓ White on Primary: 8.1:1 (AAA ✓)     │
│                                         │
│ FONTS                                   │
│ Display:  Cormorant Garamond [Apply]   │
│ Heading:  Playfair Display   [Apply]   │
│ Body:     Outfit            [Apply]   │
│ Accent:   Montserrat        [Apply]   │
│                                         │
│ LOGOS                                   │
│ ┌─────┐ ┌─────┐                         │
│ │ 𝒩  │ │ 𝒩  │                          │
│ └─────┘ └─────┘                         │
│ Light   Dark                            │
│                                         │
│ [+ Add Color] [+ Add Font] [+ Upload Logo]│
└─────────────────────────────────────────┘
```

### 4.8 Templates

#### Categories
```
• All Templates
• Instagram
│   ├── Posts
│   ├── Stories
│   └── Reels Covers
• Quotes
│   ├── Inspirational
│   ├── Motivational
│   └── Affirmations
• Testimonials
• Education
• Product/Service
• Seasonal
│   ├── Spring/Summer
│   └── Autumn/Winter
```

#### Template Card
```
┌──────────────────────────┐
│                          │
│     [Preview Image]       │
│                          │
├──────────────────────────┤
│ Quote Template - Dark     │
│ 1080×1080 • Quote         │
│ [Use] [Preview]          │
└──────────────────────────┘
```

### 4.9 Export

#### Export Modal
```
┌─────────────────────────────────────────┐
│ Export Design                      [×] │
├─────────────────────────────────────────┤
│ FORMAT                                 │
│ ○ PNG (Best quality)                   │
│ ○ JPG (Smaller file)                   │
│ ○ WebP (Modern format)                 │
│ ○ PDF (Document)                        │
│ ○ MP4 (Video/Animated)                 │
│                                         │
│ QUALITY                                 │
│ ─────○──────────────── 90%              │
│                                         │
│ SIZE                                    │
│ ○ Original (1080×1080)                 │
│ ○ 2x (2160×2160) - High quality        │
│ ○ Instagram Optimized                   │
│                                         │
│ ADVANCED                                │
│ ☑ Include bleed (for printing)          │
│ ☑ Flatten layers                       │
│ ☐ Add watermark                         │
│                                         │
│ SOCIAL MEDIA PREVIEW                    │
│ ┌─────────────────────────────────┐    │
│ │  📱 Instagram Post Preview       │    │
│ │                                 │    │
│ └─────────────────────────────────┘    │
│                                         │
│        [Cancel]  [Export]               │
└─────────────────────────────────────────┘
```

---

## 5. COMPONENT INVENTORY

### 5.1 Buttons

| Variant | Use Case | Appearance |
|---------|----------|------------|
| Primary | Main CTAs | Green bg (#467a49), white text, 12px radius |
| Secondary | Secondary actions | White bg, green border, green text |
| Ghost | Tertiary, icon buttons | Transparent, hover: light bg |
| Destructive | Delete actions | Red text/bg |
| Loading | Async actions | Spinner + text disabled |

**States:** Default, Hover (+shadow, -2px Y), Active (pressed), Disabled (50% opacity), Loading (spinner)

### 5.2 Inputs

| Type | Appearance |
|------|------------|
| Text | White bg, gray border, 8px radius, focus: green border |
| Number | Same + increment/decrement buttons |
| Select | Dropdown with chevron |
| Color Picker | Swatch + hex input + picker modal |
| Slider | Track + thumb + value label |
| Toggle | iOS-style switch |
| Checkbox | Custom green check |
| Radio | Custom green dot |

### 5.3 Panels

- **Sidebar:** Fixed 280px, scrollable, collapsible sections
- **Properties Panel:** Fixed 320px, contextual content
- **Modal:** Centered, max 600px, backdrop blur
- **Dropdown:** Absolute positioned, shadow, 8px radius
- **Toast:** Bottom-right, auto-dismiss 5s

### 5.4 Canvas-Specific

- **Artboard:** White/light bg, subtle shadow, format label
- **Selection:** Blue border 2px, corner handles (white circles)
- **Rotation handle:** Above selection, curved arrow icon
- **Guide lines:** Magenta, draggable
- **Grid:** Light gray dots, toggleable
- **Rulers:** Gray, tick marks every 100px

---

## 6. TECHNICAL APPROACH

### Stack
```json
{
  "framework": "React 19 + TypeScript",
  "build": "Vite 6",
  "styling": "Tailwind CSS 4 + CSS Variables",
  "canvas": "tldraw 2.4 (infinite canvas)",
  "state": "Zustand (global) + Jotai (atomic)",
  "ai": {
    "vision": "@google/generative-ai (Gemini 2.5 Flash)",
    "background_removal": "@imgly/background-removal",
    "image_enhancement": "Stirling Image (Docker)"
  },
  "export": "html-to-image + native canvas",
  "icons": "Lucide React",
  "animations": "Motion (Framer Motion 12)"
}
```

### tldraw Configuration

tldraw será el canvas principal, configurado con:
- Custom tools (text, shape, image)
- Brand kit integration
- AI menu items
- Instagram format presets
- Custom UI overrides

```typescript
// Custom tldraw configuration
const customTools = [
  'select',
  'hand', // pan
  'text',
  'rectangle',
  'ellipse',
  'line',
  'arrow',
  'image', // custom
  'ai-background-removal', // custom
]

// Shape presets for Instagram
const instagramPresets = {
  post: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  // ...
}
```

### AI Integration

#### Gemini Vision (Free tier)
```typescript
// Analyze design for brand consistency
const analyzeDesign = async (imageBase64: string) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent([
    {
      inlineData: { mimeType: 'image/png', data: imageBase64 }
    },
    { text: 'Analyze this Instagram post design. Check: 1) Brand colors usage, 2) Typography consistency, 3) Overall composition, 4) Suggestions for improvement' }
  ]);
  return result.response.text();
};
```

#### Background Removal
```typescript
// Browser-based, no server needed
import { removeBackground } from '@imgly/background-removal';

const removeBg = async (file: File) => {
  const blob = await removeBackground(file, {
    publicPath: '/models/', // Self-hosted ONNX models
    progress: (key, current, total) => console.log(`${key}: ${current}/${total}`)
  });
  return URL.createObjectURL(blob);
};
```

### Data Persistence

```typescript
// Projects stored in IndexedDB + Firestore backup
interface Project {
  id: string;
  name: string;
  thumbnail: string;
  tldrawDocument: TLDrawDocument; // Full serialized state
  artboardSize: { width: number; height: number };
  brandKitId: string;
  templateId?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published';
  publishedUrl?: string;
}

// Export to:
// - Local: PNG/JPG/WebP via canvas
// - Cloud: Firebase Storage
// - Instagram: Meta API
```

### API Endpoints (Future Backend)

```
POST /api/projects              Create project
GET  /api/projects/:id          Get project
PUT  /api/projects/:id           Update project
DELETE /api/projects/:id         Delete project

POST /api/export                Export design (server-side rendering for 4K)
POST /api/ai/analyze            Gemini vision analysis
POST /api/ai/enhance            Image enhancement (Stirling API)
POST /api/instagram/publish     Publish to Instagram

GET  /api/templates             List templates
POST /api/templates             Create template
GET  /api/brand-kits            List brand kits
PUT  /api/brand-kits/:id        Update brand kit
```

---

## 7. USER FLOWS

### 7.1 Create New Design

```
1. User clicks [+ New] or presses Cmd+N
2. Modal: "Choose Format"
   ├── Instagram Post (1080×1080)
   ├── Instagram Story (1080×1920)
   ├── Instagram Reel Cover (1080×1920)
   ├── Facebook Post (1200×630)
   ├── LinkedIn Post (1200×627)
   └── Custom Size
3. User selects format
4. Canvas loads with blank artboard
5. User can:
   - Add elements (shapes, text, images)
   - Apply template
   - Use AI tools
   - Save (Cmd+S)
```

### 7.2 AI Background Removal

```
1. User adds/selects image on canvas
2. Clicks [✨ Remove Background] in properties panel
3. First time: "Downloading AI model..." (50MB, one-time)
4. Progress bar shows removal progress
5. Background becomes transparent (checkerboard pattern shows)
6. User can:
   - Keep transparent
   - Add solid color background
   - Add gradient background
   - Add new image as background
```

### 7.3 Apply Brand Kit

```
1. User clicks [Brand Kit] in header or right panel
2. Brand kit panel shows colors, fonts, logos
3. User clicks color → applies to selected element
4. User clicks font → applies to text style
5. User drags logo → drops on canvas
6. "Apply to all text" option for consistent typography
```

### 7.4 Export & Publish

```
1. User clicks [Export] button
2. Export modal shows options (PNG, JPG, quality)
3. User selects Instagram Optimized
4. Click [Export]
5. Preview shows how it will look on Instagram
6. Click [Save] (downloads) or [Publish to Instagram]
7. If publishing: Meta auth → confirms → posts
8. Success: "Published! View post: [link]"
```

---

## 8. KEYBOARD SHORTCUTS

| Action | Shortcut |
|--------|----------|
| New | Cmd+N |
| Open | Cmd+O |
| Save | Cmd+S |
| Undo | Cmd+Z |
| Redo | Cmd+Shift+Z |
| Copy | Cmd+C |
| Paste | Cmd+V |
| Duplicate | Cmd+D |
| Delete | Delete/Backspace |
| Select All | Cmd+A |
| Deselect | Escape |
| Zoom In | Cmd++ |
| Zoom Out | Cmd+- |
| Zoom to Fit | Cmd+0 |
| Group | Cmd+G |
| Ungroup | Cmd+Shift+G |
| Bring Forward | Cmd+] |
| Send Backward | Cmd+[ |
| Bring to Front | Cmd+Shift+] |
| Send to Back | Cmd+Shift+[ |
| Toggle Grid | Cmd+' |
| Toggle Rulers | Cmd+R |

---

## 9. ERROR STATES & EDGE CASES

### Error Handling
- **Canvas load failure:** Retry button + offline indicator
- **Image upload too large:** Suggest compression or resize
- **AI service unavailable:** Graceful degradation, retry option
- **Export failure:** Detailed error, try again, save as draft
- **Session timeout:** Auto-save to localStorage, reconnect prompt

### Empty States
- **No projects:** "Create your first design" + CTA
- **No templates:** "Templates coming soon" + notify option
- **No assets:** "Upload images to get started"
- **No brand kit:** "Set up your brand kit" + wizard

### Loading States
- **Initial load:** Skeleton of layout
- **Canvas loading:** Pulsing artboard placeholder
- **Image processing:** Progress bar + percentage
- **Exporting:** Full-screen overlay with animation

---

## 10. FUTURE ROADMAP

### v1.1 (2 weeks)
- [ ] Core canvas with tldraw
- [ ] Basic shapes and text
- [ ] Image upload
- [ ] Export PNG/JPG
- [ ] Brand kit panel

### v1.2 (2 weeks)
- [ ] AI background removal
- [ ] Templates library
- [ ] Layer management
- [ ] Undo/Redo
- [ ] Keyboard shortcuts

### v1.3 (2 weeks)
- [ ] Gemini AI vision analysis
- [ ] Brand consistency check
- [ ] Smart crop
- [ ] Multiple artboards

### v2.0 (4 weeks)
- [ ] Instagram direct publish
- [ ] Collaborative editing
- [ ] Version history
- [ ] Batch export
- [ ] Mobile preview

---

## 11. FILE STRUCTURE

```
nicola-schaefer-hub/
├── src/
│   ├── components/
│   │   ├── studio/
│   │   │   ├── StudioCanvas.tsx       # tldraw wrapper
│   │   │   ├── StudioToolbar.tsx       # Left tools
│   │   │   ├── StudioProperties.tsx   # Right panel
│   │   │   ├── StudioHeader.tsx       # Top bar
│   │   │   ├── StudioFooter.tsx       # Bottom bar
│   │   │   ├── BrandKitPanel.tsx      # Brand management
│   │   │   ├── TemplatesPanel.tsx     # Template library
│   │   │   ├── LayersPanel.tsx        # Layer management
│   │   │   ├── ExportModal.tsx        # Export dialog
│   │   │   └── AIToolsPanel.tsx       # AI features
│   │   └── ui/                        # Reusable UI components
│   ├── services/
│   │   ├── studio/
│   │   │   ├── projectService.ts     # Project CRUD
│   │   │   ├── exportService.ts       # Export logic
│   │   │   └── historyService.ts     # Undo/redo
│   │   └── ai/
│   │       ├── geminiService.ts       # Gemini API
│   │       └── backgroundRemoval.ts   # @imgly integration
│   ├── stores/
│   │   ├── studioStore.ts             # Zustand store
│   │   └── brandKitStore.ts           # Brand kit state
│   ├── hooks/
│   │   ├── useStudio.ts              # Main studio hook
│   │   ├── useCanvas.ts               # Canvas operations
│   │   └── useAI.ts                   # AI features hook
│   ├── lib/
│   │   ├── constants.ts               # Instagram formats, etc.
│   │   └── utils.ts                  # Helpers
│   └── panels/
│       └── DesignStudioPanel.tsx      # Main panel (replaces StudioPanel)
├── public/
│   ├── models/                        # ONNX models for background removal
│   └── fonts/                        # Brand fonts
├── docs/
│   └── DESIGN_STUDIO_SPEC.md
└── package.json
```
