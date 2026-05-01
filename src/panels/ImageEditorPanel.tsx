/**
 * Image Editor Panel v2.0
 * Full-featured canvas-based image editor with templates and brand kit
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MousePointer,
  Type,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Image as ImageIcon,
  Upload,
  Download,
  Save,
  Trash2,
  Copy,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Grid,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Palette,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  Check,
  Move,
  RotateCcw,
  Sliders,
  Bookmark,
  Wand2,
  Undo,
  Redo,
  FileUp,
  LayersIcon,
  Sun,
  Contrast,
  Droplet,
  Gauge,
  Pipette,
  CheckSquare,
  SquareStack,
  Triangle,
  Star,
  Minus as LineIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import {
  ImageEditorService,
  EditorElement,
  EditorImage,
  EditorText,
  EditorShape,
  Template,
  BrandKit,
  DIMENSIONS,
  generateId,
  DEFAULT_FILTERS,
  FILTER_PRESETS,
  FONT_FAMILIES,
  templateService,
  brandKitService,
  ImageFilters,
} from '../services/imageEditorService';

type Tool = 'select' | 'text' | 'shape' | 'image' | 'pan';
type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow' | 'triangle' | 'star';
type TextAlign = 'left' | 'center' | 'right';

interface LayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  thumbnail?: string;
}

export function ImageEditorPanel() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1080 });
  const [displayScale, setDisplayScale] = useState(1);
  const [service, setService] = useState<ImageEditorService | null>(null);
  const [elements, setElements] = useState<(EditorImage | EditorText | EditorShape)[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [shapeType, setShapeType] = useState<ShapeType>('rectangle');
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBrandKit, setShowBrandKit] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showTextProps, setShowTextProps] = useState(false);
  const [showShapeProps, setShowShapeProps] = useState(false);
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [activeBrandKit, setActiveBrandKit] = useState<BrandKit | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('none');

  // Text properties
  const [textProps, setTextProps] = useState({
    fontSize: 48,
    fontFamily: 'Outfit',
    fontWeight: '600',
    fontStyle: 'normal',
    color: '#ffffff',
    textAlign: 'center' as TextAlign,
    lineHeight: 1.4,
    letterSpacing: 0,
    stroke: 'transparent',
    strokeWidth: 0,
    background: 'transparent',
    padding: 0,
  });

  // Shape properties
  const [shapeProps, setShapeProps] = useState({
    fill: '#467a49',
    stroke: 'transparent',
    strokeWidth: 0,
    borderRadius: 0,
  });

  // Image filter state
  const [filterValues, setFilterValues] = useState<ImageFilters>(DEFAULT_FILTERS);

  // Templates and brand kits
  const [templates, setTemplates] = useState<Template[]>([]);
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);

  // Initialize service and load data
  useEffect(() => {
    const svc = new ImageEditorService(hiddenCanvasRef.current || undefined);
    if (hiddenCanvasRef.current) {
      svc.setCanvas(hiddenCanvasRef.current);
    }
    svc.setDimensions(canvasSize.width, canvasSize.height);
    setService(svc);

    // Load templates and brand kits
    setTemplates(templateService.getAll());
    setActiveBrandKit(brandKitService.getActive());

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Update service dimensions when canvasSize changes
  useEffect(() => {
    if (service) {
      service.setDimensions(canvasSize.width, canvasSize.height);
      renderCanvas();
    }
  }, [canvasSize, service]);

  const renderCanvas = useCallback(() => {
    if (service) {
      service.render();
      setElements(service.getElements());
      setHistory({
        canUndo: service.canUndo(),
        canRedo: service.canRedo(),
      });
    }
  }, [service]);

  // Canvas resize observer for display scale
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width - 32; // padding
        const containerHeight = entry.contentRect.height - 32;
        const scaleX = containerWidth / canvasSize.width;
        const scaleY = containerHeight / canvasSize.height;
        const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%
        setDisplayScale(newScale);
      }
    });

    observer.observe(canvasContainerRef.current);
    return () => observer.disconnect();
  }, [canvasSize]);

  // Canvas mouse handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!service) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / displayScale;
    const y = (e.clientY - rect.top) / displayScale;

    if (tool === 'select') {
      const hitId = service.hitTest(x, y);
      if (hitId) {
        setSelectedId(hitId);
      } else {
        setSelectedId(null);
      }
      renderCanvas();
    } else if (tool === 'text') {
      addTextElement(x, y);
    } else if (tool === 'shape') {
      addShapeElement(x, y);
    }
  };

  const addTextElement = (x: number, y: number) => {
    if (!service) return;

    const textEl: EditorText = {
      id: generateId(),
      type: 'text',
      text: 'Double click to edit',
      x: x - 150,
      y: y - 30,
      width: 300,
      height: 60,
      rotation: 0,
      opacity: 100,
      locked: false,
      visible: true,
      zIndex: elements.length,
      ...textProps,
      padding: 0,
    };

    service.addElement(textEl);
    setSelectedId(textEl.id);
    setTool('select');
    renderCanvas();
  };

  const addShapeElement = (x: number, y: number) => {
    if (!service) return;

    const shapeEl: EditorShape = {
      id: generateId(),
      type: 'shape',
      shapeType,
      x: x - 50,
      y: y - 50,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 100,
      locked: false,
      visible: true,
      zIndex: elements.length,
      fill: shapeProps.fill,
      stroke: shapeProps.stroke,
      strokeWidth: shapeProps.strokeWidth,
      borderRadius: shapeType === 'rectangle' ? shapeProps.borderRadius : 0,
    };

    service.addElement(shapeEl);
    setSelectedId(shapeEl.id);
    setTool('select');
    renderCanvas();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !service) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const src = ev.target?.result as string;

      // Preload image to get dimensions
      const img = new Image();
      img.onload = () => {
        // Scale down if too large
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width *= ratio;
          height *= ratio;
        }

        const imageEl: EditorImage = {
          id: generateId(),
          type: 'image',
          src,
          originalSrc: src,
          x: (canvasSize.width - width) / 2,
          y: (canvasSize.height - height) / 2,
          width,
          height,
          rotation: 0,
          opacity: 100,
          locked: false,
          visible: true,
          zIndex: elements.length,
          filters: DEFAULT_FILTERS,
          crop: { x: 0, y: 0, width: 0, height: 0 },
        };

        service.addElement(imageEl);
        setSelectedId(imageEl.id);
        renderCanvas();
        toast.success('Image added');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const deleteSelected = () => {
    if (!selectedId || !service) return;
    service.deleteElement(selectedId);
    setSelectedId(null);
    renderCanvas();
    toast.success('Element deleted');
  };

  const duplicateSelected = () => {
    if (!selectedId || !service) return;
    const newEl = service.duplicateElement(selectedId);
    if (newEl) {
      setSelectedId(newEl.id);
      renderCanvas();
      toast.success('Element duplicated');
    }
  };

  const undo = () => {
    if (!service) return;
    service.undo();
    renderCanvas();
  };

  const redo = () => {
    if (!service) return;
    service.redo();
    renderCanvas();
  };

  const updateSelectedElement = (updates: Partial<EditorImage | EditorText | EditorShape>) => {
    if (!selectedId || !service) return;
    service.updateElement(selectedId, updates);
    renderCanvas();
  };

  const bringToFront = () => {
    if (!selectedId || !service) return;
    service.bringToFront(selectedId);
    renderCanvas();
  };

  const sendToBack = () => {
    if (!selectedId || !service) return;
    service.sendToBack(selectedId);
    renderCanvas();
  };

  const exportImage = async (format: 'png' | 'jpeg' = 'png') => {
    if (!service) return;

    try {
      const dataUrl = await service.exportToDataURL(format);
      const link = document.createElement('a');
      link.download = `design_${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();
      toast.success('Image exported');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const applyTemplate = (template: Template) => {
    if (!service) return;
    service.loadTemplate(template);
    setActiveTemplate(template);
    setShowTemplates(false);
    renderCanvas();
    toast.success(`Template "${template.name}" applied`);
  };

  const applyFilterPreset = (presetName: string) => {
    if (!selectedId || !service) return;

    const preset = FILTER_PRESETS[presetName as keyof typeof FILTER_PRESETS];
    if (!preset) return;

    setSelectedFilter(presetName);
    setFilterValues(preset);

    const el = service.getElement(selectedId);
    if (el && el.type === 'image') {
      service.updateElement(selectedId, { filters: preset });
      renderCanvas();
    }
  };

  const updateFilter = (key: keyof ImageFilters, value: number) => {
    if (!selectedId || !service) return;

    const newFilters = { ...filterValues, [key]: value };
    setFilterValues(newFilters);

    const el = service.getElement(selectedId);
    if (el && el.type === 'image') {
      service.updateElement(selectedId, { filters: newFilters });
      renderCanvas();
    }
  };

  const selectedElement = elements.find((el) => el.id === selectedId);

  const layers: LayerItem[] = elements
    .slice()
    .reverse()
    .map((el) => ({
      id: el.id,
      name: el.type === 'text' ? (el as EditorText).text.substring(0, 20) : `${el.type} ${el.id.slice(0, 4)}`,
      type: el.type,
      visible: el.visible,
      locked: el.locked,
    }));

  return (
    <div className="h-full flex flex-col bg-paper text-ink overflow-hidden">
      {/* Hidden canvas for rendering */}
      <canvas ref={hiddenCanvasRef} width={canvasSize.width} height={canvasSize.height} className="hidden" />

      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-brd">
        <div className="flex items-center gap-2">
          {/* Tools */}
          <ToolButton active={tool === 'select'} onClick={() => setTool('select')} title="Select">
            <MousePointer size={18} />
          </ToolButton>
          <ToolButton active={tool === 'text'} onClick={() => setTool('text')} title="Text">
            <Type size={18} />
          </ToolButton>
          <ToolButton active={tool === 'shape'} onClick={() => setTool('shape')} title="Shape">
            <Square size={18} />
          </ToolButton>

          {/* Shape picker */}
          {tool === 'shape' && (
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-brd">
              <ToolButton
                active={shapeType === 'rectangle'}
                onClick={() => setShapeType('rectangle')}
                title="Rectangle"
                small
              >
                <Square size={16} />
              </ToolButton>
              <ToolButton
                active={shapeType === 'circle'}
                onClick={() => setShapeType('circle')}
                title="Circle"
                small
              >
                <Circle size={16} />
              </ToolButton>
              <ToolButton
                active={shapeType === 'triangle'}
                onClick={() => setShapeType('triangle')}
                title="Triangle"
                small
              >
                <Triangle size={16} />
              </ToolButton>
              <ToolButton
                active={shapeType === 'line'}
                onClick={() => setShapeType('line')}
                title="Line"
                small
              >
                <LineIcon size={16} />
              </ToolButton>
              <ToolButton
                active={shapeType === 'star'}
                onClick={() => setShapeType('star')}
                title="Star"
                small
              >
                <Star size={16} />
              </ToolButton>
            </div>
          )}

          <div className="w-px h-6 bg-brd mx-2" />

          {/* Undo/Redo */}
          <ToolButton onClick={undo} disabled={!history.canUndo} title="Undo">
            <Undo size={18} />
          </ToolButton>
          <ToolButton onClick={redo} disabled={!history.canRedo} title="Redo">
            <Redo size={18} />
          </ToolButton>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom */}
          <div className="flex items-center gap-1 bg-paper border border-brd rounded-lg px-2 py-1">
            <ToolButton onClick={() => setZoom(Math.max(25, zoom - 25))} small>
              <ZoomOut size={16} />
            </ToolButton>
            <span className="text-xs font-mono w-12 text-center">{zoom}%</span>
            <ToolButton onClick={() => setZoom(Math.min(200, zoom + 25))} small>
              <ZoomIn size={16} />
            </ToolButton>
          </div>

          {/* Actions */}
          <ToolButton onClick={() => exportImage('png')} title="Export PNG">
            <Download size={18} />
          </ToolButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools & Layers */}
        <div className="w-14 lg:w-16 bg-card border-r border-brd flex flex-col">
          {/* Layers */}
          <div className="flex-1 flex flex-col">
            <button
              onClick={() => {
                setShowLayers(!showLayers);
                setShowTemplates(false);
                setShowBrandKit(false);
              }}
              className={cn(
                'p-3 flex items-center justify-center border-b border-brd transition-colors',
                showLayers ? 'bg-accent/10 text-accent' : 'text-ink-muted hover:text-ink'
              )}
            >
              <LayersIcon size={20} />
            </button>

            {showLayers && (
              <div className="flex-1 overflow-y-auto">
                {layers.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => {
                      setSelectedId(layer.id);
                      renderCanvas();
                    }}
                    className={cn(
                      'w-full p-2 flex items-center gap-2 border-b border-brd/50 text-left text-xs',
                      selectedId === layer.id
                        ? 'bg-accent/10 text-accent'
                        : 'text-ink-muted hover:bg-paper'
                    )}
                  >
                    {layer.type === 'text' && <Type size={12} />}
                    {layer.type === 'image' && <ImageIcon size={12} />}
                    {layer.type === 'shape' && <Square size={12} />}
                    <span className="truncate">{layer.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div
          ref={canvasContainerRef}
          className="flex-1 flex items-center justify-center overflow-auto p-4 bg-paper"
          onMouseDown={handleCanvasMouseDown}
        >
          <div
            className="relative bg-card shadow-2xl"
            style={{
              width: canvasSize.width * displayScale,
              height: canvasSize.height * displayScale,
              transform: `scale(1)`,
              transformOrigin: 'center',
            }}
          >
            {/* Grid overlay */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #467a49 1px, transparent 1px),
                    linear-gradient(to bottom, #467a49 1px, transparent 1px)
                  `,
                  backgroundSize: `${20 * displayScale}px ${20 * displayScale}px`,
                }}
              />
            )}

            {/* Actual canvas display */}
            <canvas
              ref={(el) => {
                if (el && service) {
                  const ctx = el.getContext('2d');
                  if (ctx) {
                    el.width = canvasSize.width;
                    el.height = canvasSize.height;
                    service.setCanvas(el);
                    service.render();
                  }
                }
              }}
              className="w-full h-full"
              style={{ width: canvasSize.width, height: canvasSize.height }}
              onClick={(e) => {
                if (tool === 'select') {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left);
                  const y = (e.clientY - rect.top);
                  const hitId = service?.hitTest(x, y);
                  setSelectedId(hitId);
                  renderCanvas();
                }
              }}
            />
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-64 bg-card border-l border-brd overflow-y-auto">
          {/* Templates */}
          <div className="border-b border-brd">
            <button
              onClick={() => {
                setShowTemplates(!showTemplates);
                setShowBrandKit(false);
                setShowFilters(false);
                setShowTextProps(false);
                setShowShapeProps(false);
              }}
              className={cn(
                'w-full p-3 flex items-center justify-between text-left text-xs font-bold uppercase tracking-widest',
                showTemplates ? 'bg-accent/10 text-accent' : 'text-ink-muted hover:bg-paper'
              )}
            >
              <span className="flex items-center gap-2">
                <Bookmark size={14} />
                Templates
              </span>
              {showTemplates ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showTemplates && (
              <div className="p-3 grid grid-cols-2 gap-2">
                {templates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => applyTemplate(tmpl)}
                    className={cn(
                      'p-2 rounded-lg border text-left transition-all',
                      activeTemplate?.id === tmpl.id
                        ? 'border-accent bg-accent/10'
                        : 'border-brd hover:border-accent/50'
                    )}
                  >
                    <div className="w-full h-16 bg-paper rounded mb-2 flex items-center justify-center text-[10px] text-ink-muted">
                      {tmpl.name}
                    </div>
                    <span className="text-[9px] truncate block">{tmpl.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Brand Kit */}
          <div className="border-b border-brd">
            <button
              onClick={() => {
                setShowBrandKit(!showBrandKit);
                setShowTemplates(false);
                setShowFilters(false);
                setShowTextProps(false);
                setShowShapeProps(false);
              }}
              className={cn(
                'w-full p-3 flex items-center justify-between text-left text-xs font-bold uppercase tracking-widest',
                showBrandKit ? 'bg-accent/10 text-accent' : 'text-ink-muted hover:bg-paper'
              )}
            >
              <span className="flex items-center gap-2">
                <Palette size={14} />
                Brand Kit
              </span>
              {showBrandKit ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showBrandKit && activeBrandKit && (
              <div className="p-3 space-y-3">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-ink-muted">
                    Colors
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {activeBrandKit.colors.map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => {
                          if (selectedElement?.type === 'text') {
                            updateSelectedElement({ color: color.hex });
                          } else if (selectedElement?.type === 'shape') {
                            setShapeProps((p) => ({ ...p, fill: color.hex }));
                            updateSelectedElement({ fill: color.hex });
                          }
                        }}
                        className="w-8 h-8 rounded-lg border-2 border-brd hover:scale-110 transition-transform"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-ink-muted">
                    Fonts
                  </span>
                  <div className="mt-1 space-y-1">
                    {activeBrandKit.fonts.map((font) => (
                      <button
                        key={font.name}
                        onClick={() => {
                          setTextProps((p) => ({ ...p, fontFamily: font.family }));
                          if (selectedElement?.type === 'text') {
                            updateSelectedElement({ fontFamily: font.family });
                          }
                        }}
                        className="w-full text-left px-2 py-1 text-xs bg-paper rounded hover:bg-brd"
                        style={{ fontFamily: font.family }}
                      >
                        {font.name} - {font.usage}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filters (for images) */}
          {selectedElement?.type === 'image' && (
            <div className="border-b border-brd">
              <button
                onClick={() => {
                  setShowFilters(!showFilters);
                  setShowBrandKit(false);
                  setShowTemplates(false);
                  setShowTextProps(false);
                  setShowShapeProps(false);
                }}
                className={cn(
                  'w-full p-3 flex items-center justify-between text-left text-xs font-bold uppercase tracking-widest',
                  showFilters ? 'bg-accent/10 text-accent' : 'text-ink-muted hover:bg-paper'
                )}
              >
                <span className="flex items-center gap-2">
                  <Sliders size={14} />
                  Filters
                </span>
                {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showFilters && (
                <div className="p-3 space-y-3">
                  {/* Filter presets */}
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(FILTER_PRESETS).map((name) => (
                      <button
                        key={name}
                        onClick={() => applyFilterPreset(name)}
                        className={cn(
                          'px-2 py-1 text-[9px] rounded border',
                          selectedFilter === name
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-brd hover:border-accent/50'
                        )}
                      >
                        {name}
                      </button>
                    ))}
                  </div>

                  {/* Manual controls */}
                  <div className="space-y-2">
                    <Slider
                      label="Brightness"
                      value={filterValues.brightness}
                      min={-100}
                      max={100}
                      onChange={(v) => updateFilter('brightness', v)}
                    />
                    <Slider
                      label="Contrast"
                      value={filterValues.contrast}
                      min={-100}
                      max={100}
                      onChange={(v) => updateFilter('contrast', v)}
                    />
                    <Slider
                      label="Saturation"
                      value={filterValues.saturation}
                      min={-100}
                      max={100}
                      onChange={(v) => updateFilter('saturation', v)}
                    />
                    <Slider
                      label="Blur"
                      value={filterValues.blur}
                      min={0}
                      max={20}
                      onChange={(v) => updateFilter('blur', v)}
                    />
                    <Slider
                      label="Grayscale"
                      value={filterValues.grayscale}
                      min={0}
                      max={100}
                      onChange={(v) => updateFilter('grayscale', v)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text Properties */}
          {selectedElement?.type === 'text' && (
            <div className="border-b border-brd">
              <button
                onClick={() => {
                  setShowTextProps(!showTextProps);
                  setShowBrandKit(false);
                  setShowTemplates(false);
                  setShowFilters(false);
                  setShowShapeProps(false);
                }}
                className={cn(
                  'w-full p-3 flex items-center justify-between text-left text-xs font-bold uppercase tracking-widest',
                  showTextProps ? 'bg-accent/10 text-accent' : 'text-ink-muted hover:bg-paper'
                )}
              >
                <span className="flex items-center gap-2">
                  <Type size={14} />
                  Text
                </span>
                {showTextProps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showTextProps && (
                <TextPropertiesPanel
                  properties={textProps}
                  onChange={(updates) => {
                    setTextProps((p) => ({ ...p, ...updates }));
                    updateSelectedElement(updates);
                  }}
                />
              )}
            </div>
          )}

          {/* Shape Properties */}
          {selectedElement?.type === 'shape' && (
            <div className="border-b border-brd">
              <button
                onClick={() => {
                  setShowShapeProps(!showShapeProps);
                  setShowBrandKit(false);
                  setShowTemplates(false);
                  setShowFilters(false);
                  setShowTextProps(false);
                }}
                className={cn(
                  'w-full p-3 flex items-center justify-between text-left text-xs font-bold uppercase tracking-widest',
                  showShapeProps ? 'bg-accent/10 text-accent' : 'text-ink-muted hover:bg-paper'
                )}
              >
                <span className="flex items-center gap-2">
                  <Square size={14} />
                  Shape
                </span>
                {showShapeProps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showShapeProps && (
                <ShapePropertiesPanel
                  properties={shapeProps}
                  onChange={(updates) => {
                    setShapeProps((p) => ({ ...p, ...updates }));
                    updateSelectedElement(updates);
                  }}
                />
              )}
            </div>
          )}

          {/* Element Actions */}
          {selectedElement && (
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={deleteSelected}
                  className="px-3 py-2 text-xs bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20 flex items-center justify-center gap-1"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
                <button
                  onClick={duplicateSelected}
                  className="px-3 py-2 text-xs bg-paper border border-brd rounded-lg hover:bg-brd flex items-center justify-center gap-1"
                >
                  <Copy size={12} />
                  Duplicate
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={bringToFront}
                  className="px-3 py-2 text-xs bg-paper border border-brd rounded-lg hover:bg-brd text-center"
                >
                  Front
                </button>
                <button
                  onClick={sendToBack}
                  className="px-3 py-2 text-xs bg-paper border border-brd rounded-lg hover:bg-brd text-center"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-t border-brd">
        <div className="flex items-center gap-2">
          {/* Canvas size */}
          <select
            value={`${canvasSize.width}x${canvasSize.height}`}
            onChange={(e) => {
              const [w, h] = e.target.value.split('x').map(Number);
              setCanvasSize({ width: w, height: h });
            }}
            className="bg-paper border border-brd rounded-lg px-3 py-1.5 text-xs"
          >
            {DIMENSIONS.map((dim) => (
              <option key={`${dim.width}x${dim.height}`} value={`${dim.width}x${dim.height}`}>
                {dim.name} ({dim.width}x{dim.height})
              </option>
            ))}
          </select>

          {/* Grid toggle */}
          <ToolButton
            active={showGrid}
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid"
          >
            <Grid size={18} />
          </ToolButton>
        </div>

        <div className="flex items-center gap-2">
          {/* Upload image */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs bg-paper border border-brd rounded-lg hover:bg-brd flex items-center gap-2"
          >
            <Upload size={14} />
            Upload Image
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function ToolButton({
  active,
  onClick,
  disabled,
  title,
  small,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  small?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-2 rounded-lg transition-colors',
        small ? 'p-1.5' : '',
        active ? 'bg-accent text-white' : 'text-ink-muted hover:bg-paper hover:text-ink',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-ink-muted">{label}</span>
        <span className="font-mono">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-brd rounded-full appearance-none cursor-pointer accent-accent"
      />
    </div>
  );
}

function TextPropertiesPanel({
  properties,
  onChange,
}: {
  properties: {
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    fontStyle: string;
    color: string;
    textAlign: TextAlign;
    lineHeight: number;
    letterSpacing: number;
    stroke: string;
    strokeWidth: number;
    background: string;
    padding: number;
  };
  onChange: (updates: Partial<typeof properties>) => void;
}) {
  return (
    <div className="p-3 space-y-3">
      {/* Font Family */}
      <div className="space-y-1">
        <label className="text-[10px] text-ink-muted uppercase tracking-widest">Font</label>
        <select
          value={properties.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          className="w-full bg-paper border border-brd rounded-lg px-2 py-1.5 text-xs"
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <Slider label="Size" value={properties.fontSize} min={12} max={200} onChange={(v) => onChange({ fontSize: v })} />

      {/* Font Weight */}
      <div className="flex gap-1">
        {['400', '500', '600', '700'].map((w) => (
          <button
            key={w}
            onClick={() => onChange({ fontWeight: w })}
            className={cn(
              'flex-1 py-1 text-xs rounded border',
              properties.fontWeight === w ? 'border-accent bg-accent/10 text-accent' : 'border-brd'
            )}
          >
            {w}
          </button>
        ))}
      </div>

      {/* Text Align */}
      <div className="flex gap-1">
        {(['left', 'center', 'right'] as TextAlign[]).map((align) => (
          <button
            key={align}
            onClick={() => onChange({ textAlign: align })}
            className={cn(
              'flex-1 py-1 rounded border',
              properties.textAlign === align ? 'border-accent bg-accent/10 text-accent' : 'border-brd'
            )}
          >
            {align === 'left' && <AlignLeft size={14} />}
            {align === 'center' && <AlignCenter size={14} />}
            {align === 'right' && <AlignRight size={14} />}
          </button>
        ))}
      </div>

      {/* Color */}
      <div className="space-y-1">
        <label className="text-[10px] text-ink-muted uppercase tracking-widest">Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={properties.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="w-8 h-8 rounded border border-brd cursor-pointer"
          />
          <input
            type="text"
            value={properties.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="flex-1 bg-paper border border-brd rounded px-2 py-1 text-xs font-mono"
          />
        </div>
      </div>

      {/* Line Height */}
      <Slider label="Line Height" value={properties.lineHeight * 100} min={80} max={200} onChange={(v) => onChange({ lineHeight: v / 100 })} />

      {/* Letter Spacing */}
      <Slider label="Letter Spacing" value={properties.letterSpacing} min={-5} max={20} onChange={(v) => onChange({ letterSpacing: v })} />
    </div>
  );
}

function ShapePropertiesPanel({
  properties,
  onChange,
}: {
  properties: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    borderRadius: number;
  };
  onChange: (updates: Partial<typeof properties>) => void;
}) {
  return (
    <div className="p-3 space-y-3">
      {/* Fill Color */}
      <div className="space-y-1">
        <label className="text-[10px] text-ink-muted uppercase tracking-widest">Fill</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={properties.fill}
            onChange={(e) => onChange({ fill: e.target.value })}
            className="w-8 h-8 rounded border border-brd cursor-pointer"
          />
          <input
            type="text"
            value={properties.fill}
            onChange={(e) => onChange({ fill: e.target.value })}
            className="flex-1 bg-paper border border-brd rounded px-2 py-1 text-xs font-mono"
          />
        </div>
      </div>

      {/* Stroke */}
      <div className="space-y-1">
        <label className="text-[10px] text-ink-muted uppercase tracking-widest">Stroke</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={properties.stroke === 'transparent' ? '#000000' : properties.stroke}
            onChange={(e) => onChange({ stroke: e.target.value })}
            className="w-8 h-8 rounded border border-brd cursor-pointer"
          />
          <input
            type="text"
            value={properties.stroke}
            onChange={(e) => onChange({ stroke: e.target.value })}
            className="flex-1 bg-paper border border-brd rounded px-2 py-1 text-xs font-mono"
          />
        </div>
      </div>

      {/* Stroke Width */}
      <Slider label="Stroke Width" value={properties.strokeWidth} min={0} max={20} onChange={(v) => onChange({ strokeWidth: v })} />

      {/* Border Radius (only for rectangles) */}
      <Slider label="Border Radius" value={properties.borderRadius} min={0} max={100} onChange={(v) => onChange({ borderRadius: v })} />
    </div>
  );
}

export default ImageEditorPanel;
