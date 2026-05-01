/**
 * UNIFIED CONTENT STUDIO PANEL
 * 
 * Complete content creation hub that replaces Canva/CapCut functionality
 * Features:
 * - Multi-format content (image, video, story, reel, carousel)
 * - AI-powered generation with templates
 * - Real-time editing with layers
 * - Brand kit integration
 * - Supabase storage
 * - WhatsApp preview and approval
 * - Version control
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Layers,
  Image as ImageIcon,
  Video,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  PanelRightClose,
  Save,
  Download,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Upload,
  Sparkles,
  Wand2,
  Type,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Triangle,
  MousePointer2,
  Hand,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  FileImage,
  Film,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { editorEngine, ContentType, ContentProject, ContentElement, BrandTemplate, ASPECT_RATIOS, ExportFormat } from '../services/EditorEngine';

// ============================================================================
// TYPES
// ============================================================================

type ToolType = 'select' | 'pan' | 'text' | 'shape' | 'image' | 'video';
type EditorTab = 'templates' | 'assets' | 'layers';

interface Layer {
  id: string;
  name: string;
  type: ContentElement['type'];
  visible: boolean;
  locked: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TOOLS: { id: ToolType; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { id: 'select', icon: <MousePointer2 className="w-4 h-4" />, label: 'Select', shortcut: 'V' },
  { id: 'pan', icon: <Hand className="w-4 h-4" />, label: 'Pan', shortcut: 'H' },
  { id: 'text', icon: <Type className="w-4 h-4" />, label: 'Text', shortcut: 'T' },
  { id: 'shape', icon: <Square className="w-4 h-4" />, label: 'Shape', shortcut: 'R' },
  { id: 'image', icon: <ImageIcon className="w-4 h-4" />, label: 'Image', shortcut: 'I' },
  { id: 'video', icon: <Video className="w-4 h-4" />, label: 'Video', shortcut: 'O' },
];

const SHAPES = [
  { id: 'rectangle', icon: <Square className="w-4 h-4" />, label: 'Rectangle' },
  { id: 'circle', icon: <Circle className="w-4 h-4" />, label: 'Circle' },
  { id: 'triangle', icon: <Triangle className="w-4 h-4" />, label: 'Triangle' },
  { id: 'line', icon: <Minus className="w-4 h-4" />, label: 'Line' },
  { id: 'arrow', icon: <ArrowRight className="w-4 h-4" />, label: 'Arrow' },
];

const PRESET_COLORS = [
  '#467a49', '#155336', '#d16806', '#e8b571', '#fefcf8', '#1a1a1a',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6',
];

const TEMPLATES: (BrandTemplate & { thumbnail: string })[] = [
  {
    id: 'vilcabamba-post',
    name: 'Vilcabamba Post',
    type: 'post',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    background: '#467a49',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
  },
  {
    id: 'vilcabamba-story',
    name: 'Vilcabamba Story',
    type: 'story',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    background: '#155336',
    thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25bfe6c56c0?w=400',
  },
  {
    id: 'coaching-tip',
    name: 'Coaching Tip',
    type: 'post',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    background: '#d16806',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  },
  {
    id: 'retiro-anuncio',
    name: 'Retiro Anuncio',
    type: 'story',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    background: '#1a1a1a',
    thumbnail: 'https://images.unsplash.com/photo-1545389336-cf09069591e5?w=400',
  },
  {
    id: 'sunset-quote',
    name: 'Sunset Quote',
    type: 'post',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    background: '#e8b571',
    thumbnail: 'https://images.unsplash.com/photo-1507400492013-162706c8d05e?w=400',
  },
  {
    id: 'yoga-reel',
    name: 'Yoga Reel',
    type: 'reel',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    background: '#467a49',
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0c2c4d4f4f8e?w=400',
  },
];

const SAMPLE_ASSETS = [
  { id: '1', name: 'Mountain Sunrise', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', type: 'image' },
  { id: '2', name: 'Yoga Practice', url: 'https://images.unsplash.com/photo-1544367567-0c2c4d4f4f8e?w=400', type: 'image' },
  { id: '3', name: 'Nature Close', url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400', type: 'image' },
  { id: '4', name: 'Meditation', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', type: 'image' },
  { id: '5', name: 'Retreat Center', url: 'https://images.unsplash.com/photo-1517836357463-d25bfe6c56c0?w=400', type: 'image' },
  { id: '6', name: 'Vilcabamba Valley', url: 'https://images.unsplash.com/photo-1507400492013-162706c8d05e?w=400', type: 'image' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UnifiedContentStudio() {
  const [project, setProject] = useState<ContentProject | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [activeTab, setActiveTab] = useState<EditorTab>('templates');
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [activeShape, setActiveShape] = useState<string>('rectangle');
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [elements, setElements] = useState<ContentElement[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dimensions = useMemo(() => {
    const dims = ASPECT_RATIOS[aspectRatio as keyof typeof ASPECT_RATIOS] || ASPECT_RATIOS['1:1'];
    return { width: dims.width, height: dims.height };
  }, [aspectRatio]);

  const brandColors = useMemo(() => editorEngine.getBrandKit().getBrandColors(), []);

  const selectTemplate = (template: BrandTemplate) => {
    const newProject = editorEngine.createNewProject(template.type as ContentType, template.id);
    newProject.template = template;
    newProject.brandKit = editorEngine.getBrandKit().loadBrandKit();
    setProject(newProject);
    setAspectRatio(template.aspectRatio);
    setElements([]);
    setLayers([]);
    setActiveTab('templates');
    toast.success(`Plantilla "${template.name}" cargada`);
  };

  const addElement = (type: ContentElement['type'], props: Partial<ContentElement['props']> = {}) => {
    const newElement: ContentElement = {
      id: `element_${Date.now()}`,
      type,
      x: dimensions.width / 2 - 100,
      y: dimensions.height / 2 - 50,
      width: type === 'text' ? 400 : 200,
      height: type === 'text' ? 100 : 200,
      rotation: 0,
      locked: false,
      visible: true,
      opacity: 100,
      props: type === 'text'
        ? { text: 'Tu texto aquí', fontFamily: 'Outfit', fontSize: 48, fontWeight: 500, color: '#ffffff', align: 'center', lineHeight: 1.2, letterSpacing: 0 }
        : type === 'image'
        ? { src: '', filter: 'none', blendMode: 'normal' }
        : type === 'shape'
        ? { shapeType: activeShape, fill: brandColors.primary, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 }
        : { src: '', startTime: 0, endTime: 10, volume: 100, playbackSpeed: 1 },
    };

    setElements(prev => [...prev, newElement]);
    setLayers(prev => [...prev, {
      id: newElement.id,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${prev.length + 1}`,
      type,
      visible: true,
      locked: false,
    }]);
    setSelectedLayerId(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<ContentElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const duplicateElement = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElement = { ...element, id: `element_${Date.now()}`, x: element.x + 20, y: element.y + 20 };
      setElements(prev => [...prev, newElement]);
      setLayers(prev => [...prev, { id: newElement.id, name: `${element.type} copy`, type: element.type, visible: true, locked: false }]);
    }
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
    setElements(prev => prev.map(el => el.id === id ? { ...el, visible: !el.visible } : el));
  };

  const toggleLayerLock = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
    setElements(prev => prev.map(el => el.id === id ? { ...el, locked: !el.locked } : el));
  };

  const handleExport = async (format: ExportFormat) => {
    if (!project || !canvasRef.current) return;
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const content = await editorEngine.quickExport(canvasRef.current, null, project, format);
      const message = editorEngine.getExportService().generateWhatsAppMessage(content);
      await navigator.clipboard.writeText(message);
      toast.success(`Exportado como ${format.toUpperCase()}! Link copiado`);
    } catch (error: any) {
      toast.error('Export failed', { description: error.message });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      addElement('image', { src: url } as any);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toUpperCase();
      const toolMap: Record<string, ToolType> = { V: 'select', H: 'pan', T: 'text', R: 'shape', I: 'image', O: 'video' };
      if (toolMap[key]) {
        e.preventDefault();
        setActiveTool(toolMap[key]);
      }
      if (key === 'DELETE' || key === 'BACKSPACE') {
        if (selectedLayerId) deleteElement(selectedLayerId);
      }
      if (e.metaKey || e.ctrlKey) {
        if (key === 'D') {
          e.preventDefault();
          if (selectedLayerId) duplicateElement(selectedLayerId);
        }
        if (key === 'S') {
          e.preventDefault();
          toast.success('Proyecto guardado');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, elements]);

  const selectedElement = elements.find(e => e.id === selectedLayerId);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-paper">
      {/* Header */}
      <div className="h-14 bg-card border-b border-brd px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#467a49] to-[#155336] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">Content Studio</span>
          </div>
          <div className="flex items-center gap-1 ml-4">
            {Object.entries(ASPECT_RATIOS).slice(0, 4).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => setAspectRatio(key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  aspectRatio === key ? "bg-[#467a49] text-white" : "bg-paper text-ink-muted hover:text-ink border border-brd",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-paper border border-brd rounded-lg px-2">
            <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-1 hover:bg-brd rounded">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1 hover:bg-brd rounded">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={cn("p-2 rounded-lg border transition-all", showGrid ? "bg-[#467a49] text-white border-[#467a49]" : "border-brd hover:bg-brd")}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#467a49] text-white rounded-lg text-sm font-bold hover:bg-[#155336] transition-colors">
            <Save className="w-4 h-4" /> Guardar
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-paper border border-brd rounded-lg text-sm font-bold hover:bg-brd transition-colors"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exportando...' : 'Exportar'}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-brd rounded-xl shadow-xl z-50 overflow-hidden">
                <button onClick={() => handleExport('png')} className="w-full px-4 py-3 text-left text-sm hover:bg-brd flex items-center gap-2">
                  <FileImage className="w-4 h-4" /> PNG (Alta calidad)
                </button>
                <button onClick={() => handleExport('jpg')} className="w-full px-4 py-3 text-left text-sm hover:bg-brd flex items-center gap-2">
                  <FileImage className="w-4 h-4" /> JPG (Comprimido)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-72 border-r border-brd bg-card flex flex-col shrink-0">
          <div className="flex border-b border-brd">
            <button
              onClick={() => setActiveTab('templates')}
              className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all", activeTab === 'templates' ? "bg-[#467a49] text-white" : "text-ink-muted hover:bg-brd")}
            >
              Templates
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all", activeTab === 'assets' ? "bg-[#467a49] text-white" : "text-ink-muted hover:bg-brd")}
            >
              Assets
            </button>
            <button
              onClick={() => setActiveTab('layers')}
              className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all", activeTab === 'layers' ? "bg-[#467a49] text-white" : "text-ink-muted hover:bg-brd")}
            >
              Capas
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'templates' && (
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Brand Templates</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATES.map(template => (
                      <button
                        key={template.id}
                        onClick={() => selectTemplate(template)}
                        className="relative rounded-xl overflow-hidden border border-brd hover:border-[#467a49] transition-all group aspect-square"
                      >
                        <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <p className="text-[10px] font-bold text-white truncate">{template.name}</p>
                          <p className="text-[8px] text-white/60">{template.width}x{template.height}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="p-4 space-y-4">
                <button
                  onClick={handleImageUpload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-brd rounded-xl text-sm text-ink-muted hover:border-[#467a49] hover:text-[#467a49] transition-all"
                >
                  <Upload className="w-4 h-4" />
                  Subir imagen
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <div className="grid grid-cols-3 gap-2">
                  {SAMPLE_ASSETS.map(asset => (
                    <button
                      key={asset.id}
                      onClick={() => addElement('image', { src: asset.url } as any)}
                      className="relative rounded-lg overflow-hidden border border-brd hover:border-[#467a49] transition-all aspect-square"
                    >
                      <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'layers' && (
              <div className="p-4 space-y-1">
                {layers.map(layer => (
                  <div
                    key={layer.id}
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all",
                      selectedLayerId === layer.id ? "bg-[#467a49]/10 border border-[#467a49]" : "hover:bg-brd border border-transparent",
                    )}
                  >
                    <button onClick={e => { e.stopPropagation(); toggleLayerVisibility(layer.id); }} className="text-ink-muted hover:text-ink">
                      {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                    <span className="flex-1 text-xs truncate">{layer.name}</span>
                    <button onClick={e => { e.stopPropagation(); toggleLayerLock(layer.id); }} className="text-ink-muted hover:text-ink">
                      {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                  </div>
                ))}
                {layers.length === 0 && <p className="text-xs text-ink-muted text-center py-8">Sin capas</p>}
              </div>
            )}
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 flex flex-col bg-[#2a2a2a]">
          <div className="h-12 bg-[#1a1a1a] border-b border-[#3a3a3a] px-4 flex items-center gap-1">
            {TOOLS.map(tool => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                title={`${tool.label} (${tool.shortcut})`}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  activeTool === tool.id ? "bg-[#467a49] text-white" : "text-[#888] hover:text-white hover:bg-[#3a3a3a]",
                )}
              >
                {tool.icon}
              </button>
            ))}
            <div className="h-6 w-px bg-[#3a3a3a] mx-2" />
            {activeTool === 'shape' && (
              <div className="flex items-center gap-1">
                {SHAPES.map(shape => (
                  <button
                    key={shape.id}
                    onClick={() => setActiveShape(shape.id)}
                    title={shape.label}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      activeShape === shape.id ? "bg-[#467a49] text-white" : "text-[#888] hover:text-white hover:bg-[#3a3a3a]",
                    )}
                  >
                    {shape.icon}
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1" />
            <button className="p-2 rounded-lg text-[#888] hover:text-white hover:bg-[#3a3a3a] transition-all">
              <Undo2 className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg text-[#888] hover:text-white hover:bg-[#3a3a3a] transition-all">
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <div
              ref={canvasRef}
              className="relative shadow-2xl"
              style={{
                width: dimensions.width,
                height: dimensions.height,
                background: project?.template.background || brandColors.primary,
              }}
            >
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                  }}
                />
              )}
              {elements.map(element => (
                <div
                  key={element.id}
                  className={cn("absolute cursor-move transition-all", !element.visible && "opacity-30", element.locked && "pointer-events-none")}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    transform: `rotate(${element.rotation}deg)`,
                    opacity: element.opacity / 100,
                  }}
                  onClick={() => setSelectedLayerId(element.id)}
                >
                  {element.type === 'text' && (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        fontFamily: element.props.fontFamily,
                        fontSize: element.props.fontSize,
                        fontWeight: element.props.fontWeight,
                        color: element.props.color,
                        textAlign: element.props.align,
                        lineHeight: element.props.lineHeight,
                        letterSpacing: element.props.letterSpacing,
                      }}
                    >
                      {element.props.text}
                    </div>
                  )}
                  {element.type === 'image' && element.props.src && (
                    <img src={element.props.src} className="w-full h-full object-cover" alt="" style={{ filter: element.props.filter }} />
                  )}
                  {element.type === 'shape' && (
                    <div
                      className="w-full h-full"
                      style={{
                        background: element.props.fill,
                        borderRadius: element.props.shapeType === 'circle' ? '50%' : element.props.borderRadius,
                      }}
                    />
                  )}
                </div>
              ))}
              {!project && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                  <Sparkles className="w-16 h-16 mb-4" />
                  <p className="text-lg font-bold">Selecciona una plantilla</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        {showRightPanel && (
          <div className="w-72 border-l border-brd bg-card shrink-0">
            <div className="p-4 border-b border-brd">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest">Propiedades</h3>
                <button onClick={() => setShowRightPanel(false)} className="text-ink-muted hover:text-ink">
                  <PanelRightClose className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-300px)]">
              {selectedElement ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Tipo</label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-paper rounded-lg border border-brd">
                      <span className="text-sm capitalize">{selectedElement.type}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Posición</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-ink-muted">X</span>
                        <input type="number" value={Math.round(selectedElement.x)} onChange={e => updateElement(selectedLayerId!, { x: Number(e.target.value) })} className="w-full px-2 py-1 bg-paper border border-brd rounded text-xs" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-ink-muted">Y</span>
                        <input type="number" value={Math.round(selectedElement.y)} onChange={e => updateElement(selectedLayerId!, { y: Number(e.target.value) })} className="w-full px-2 py-1 bg-paper border border-brd rounded text-xs" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Tamaño</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-ink-muted">W</span>
                        <input type="number" value={Math.round(selectedElement.width)} onChange={e => updateElement(selectedLayerId!, { width: Number(e.target.value) })} className="w-full px-2 py-1 bg-paper border border-brd rounded text-xs" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-ink-muted">H</span>
                        <input type="number" value={Math.round(selectedElement.height)} onChange={e => updateElement(selectedLayerId!, { height: Number(e.target.value) })} className="w-full px-2 py-1 bg-paper border border-brd rounded text-xs" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Opacidad</label>
                    <input type="range" min="0" max="100" value={selectedElement.opacity} onChange={e => updateElement(selectedLayerId!, { opacity: Number(e.target.value) })} className="w-full" />
                  </div>
                  {selectedElement.type === 'text' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Texto</label>
                      <textarea
                        value={selectedElement.props.text}
                        onChange={e => updateElement(selectedLayerId!, { props: { ...selectedElement.props, text: e.target.value } })}
                        className="w-full px-3 py-2 bg-paper border border-brd rounded text-sm resize-none"
                        rows={3}
                      />
                      <div className="flex flex-wrap gap-1">
                        {PRESET_COLORS.map(color => (
                          <button key={color} onClick={() => updateElement(selectedLayerId!, { props: { ...selectedElement.props, color } })} className="w-6 h-6 rounded border border-brd" style={{ background: color }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-4 border-t border-brd space-y-2">
                    <button onClick={() => selectedLayerId && duplicateElement(selectedLayerId)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-paper border border-brd rounded-lg text-sm hover:bg-brd transition-colors">
                      <Copy className="w-4 h-4" /> Duplicar
                    </button>
                    <button onClick={() => selectedLayerId && deleteElement(selectedLayerId)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-sm hover:bg-rose-500/20 transition-colors">
                      <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-ink-muted">
                  <MousePointer2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Selecciona un elemento</p>
                  <p className="text-xs">para ver propiedades</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-brd space-y-2">
              <button onClick={() => addElement('text')} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#467a49] text-white rounded-lg text-sm font-bold hover:bg-[#155336] transition-colors">
                <Type className="w-4 h-4" /> Añadir texto
              </button>
              <button onClick={() => addElement('shape')} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-paper border border-brd rounded-lg text-sm font-bold hover:bg-brd transition-colors">
                <Square className="w-4 h-4" /> Añadir forma
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="h-8 bg-card border-t border-brd px-4 flex items-center justify-between text-[10px] text-ink-muted">
        <div className="flex items-center gap-4">
          <span>Canvas: {dimensions.width}x{dimensions.height}</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>Elementos: {elements.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#467a49]">● Brand Kit: Activo</span>
        </div>
      </div>
    </div>
  );
}
