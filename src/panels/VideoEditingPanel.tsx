/**
 * Video Editing Panel v2 - Nicola Schaefer Hub
 * AI-powered video editing with real processing, progress tracking, and download
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Film,
  Play,
  Download,
  Mail,
  MessageCircle,
  Send,
  Loader2,
  Settings,
  Sparkles,
  Upload,
  Clock,
  Subtitles,
  Volume2,
  Sun,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  FileVideo,
  Type,
  Crop,
  Wand2,
  Eye,
  Trash2,
  AlertCircle,
  Server,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useFirebase } from '../lib/FirebaseProvider';
import {
  videoAgentService,
  VIDEO_TYPES,
  DEFAULT_SUBTITLE_CONFIG,
  DEFAULT_AUDIO_CONFIG,
  DEFAULT_VIDEO_FILTER_CONFIG,
  type VideoTypeId,
  type VideoEditJob,
  type AgentMessage,
  type SubtitleConfig,
  type AudioConfig,
  type VideoFilterConfig,
} from '../services/videoAgentService';
import { useTranslation } from '../lib/TranslationContext';

// ============ MAIN COMPONENT ============

export function VideoEditingPanel() {
  const { t } = useTranslation();
  const { user } = useFirebase();

  const [job, setJob] = useState<VideoEditJob | null>(null);
  const [selectedType, setSelectedType] = useState<VideoTypeId>('testimonial');
  const [serverOnline, setServerOnline] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    subtitles: true,
    audio: false,
    filters: false,
    resolution: false,
    branding: false,
  });

  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: 'welcome',
      role: 'agent',
      content: '🎬 ¡Hola! Soy tu agente de edición de video. Sube un video y yo me encargo del resto.\n\nTipos: Testimonial, Reel, Story, Educativo.',
      timestamp: new Date(),
      status: 'sent',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check server health on mount
  useEffect(() => {
    const check = async () => {
      const ok = await videoAgentService.checkServerHealth();
      setServerOnline(ok);
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  // ============ JOB MANAGEMENT ============

  const createNewJob = useCallback((type: VideoTypeId) => {
    const newJob = videoAgentService.createJob(type);
    setJob(newJob);
    setSelectedType(type);
  }, []);

  const updateJob = useCallback((updated: VideoEditJob | null) => {
    if (updated) setJob({ ...updated });
  }, []);

  const handleTypeSelect = (type: VideoTypeId) => {
    setSelectedType(type);
    if (job) {
      const updated = videoAgentService.updateJob(job.id, {
        videoType: type,
        duration: VIDEO_TYPES[type].defaultDuration,
        resolution: { ...VIDEO_TYPES[type].resolution },
        segments: VIDEO_TYPES[type].segments.map((s, i) => ({
          start: i * (VIDEO_TYPES[type].defaultDuration / VIDEO_TYPES[type].segments.length),
          end: (i + 1) * (VIDEO_TYPES[type].defaultDuration / VIDEO_TYPES[type].segments.length),
          label: s.label,
        })),
      });
      updateJob(updated);
    } else {
      createNewJob(type);
    }
  };

  const updateSubtitles = (updates: Partial<SubtitleConfig>) => {
    if (!job) return;
    updateJob(videoAgentService.updateJob(job.id, { subtitles: { ...job.subtitles, ...updates } }));
  };

  const updateAudio = (updates: Partial<AudioConfig>) => {
    if (!job) return;
    updateJob(videoAgentService.updateJob(job.id, { audio: { ...job.audio, ...updates } }));
  };

  const updateFilters = (updates: Partial<VideoFilterConfig>) => {
    if (!job) return;
    updateJob(videoAgentService.updateJob(job.id, { filters: { ...job.filters, ...updates } }));
  };

  const updateJobField = (updates: Partial<VideoEditJob>) => {
    if (!job) return;
    updateJob(videoAgentService.updateJob(job.id, updates));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // ============ FILE UPLOAD ============

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!job) createNewJob(selectedType);
    const currentJob = job || videoAgentService.createJob(selectedType);

    setIsUploading(true);
    toast.loading('Subiendo video...', { id: 'upload' });

    try {
      const updated = await videoAgentService.uploadVideo(currentJob.id, file);
      updateJob(updated);
      toast.success('Video cargado ✓', { id: 'upload' });
    } catch (err: any) {
      toast.error(`Error: ${err.message}`, { id: 'upload' });
    } finally {
      setIsUploading(false);
    }
  };

  // ============ PROCESSING ============

  const startProcessing = async () => {
    if (!job || job.status === 'processing' || job.status === 'rendering') return;

    try {
      await videoAgentService.startProcessing(job.id);
      toast.success('Procesamiento iniciado');
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  // ============ DOWNLOAD / SEND ============

  const handleDownload = () => {
    if (!job) return;
    const url = videoAgentService.getDownloadUrl(job.id);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job.videoType}_${job.id.slice(0, 8)}.mp4`;
    a.click();
  };

  const handleSendEmail = () => {
    if (!job) return;
    const url = videoAgentService.getDownloadUrl(job.id);
    const subject = encodeURIComponent('Tu video editado - Nicola Schaefer');
    const body = encodeURIComponent(`Hola,\n\nAquí tienes tu video editado.\n\nDescarga: ${url}\n\nSaludos,\nNicola Schaefer Hub`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleSendWhatsApp = () => {
    if (!job) return;
    const url = videoAgentService.getDownloadUrl(job.id);
    const text = encodeURIComponent(`🎬 Tu video editado está listo: ${url}`);
    window.open(`https://wa.me/?text=${text}`);
  };

  // ============ DELETE JOB ============

  const handleDeleteJob = async () => {
    if (!job) return;
    await videoAgentService.deleteJob(job.id);
    setJob(null);
    toast.success('Video eliminado del servidor');
  };

  // ============ CHAT ============

  const sendMessage = async () => {
    if (!chatInput.trim() || isProcessing) return;
    const text = chatInput.trim();
    setChatInput('');

    const userMsg: AgentMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
      status: 'sent',
    };
    setMessages(prev => [...prev, userMsg]);

    if (!job) createNewJob(selectedType);

    setIsProcessing(true);
    try {
      const currentJob = job || videoAgentService.createJob(selectedType);
      const result = await videoAgentService.processInstruction(text, currentJob);

      for (const action of result.actions) {
        switch (action.type) {
          case 'toggle_subtitles':
            updateSubtitles({ enabled: action.params.enabled as boolean });
            break;
          case 'set_video_type':
            handleTypeSelect(action.params.videoType as VideoTypeId);
            break;
          case 'start_edit':
            await startProcessing();
            break;
        }
      }

      const agentMsg: AgentMessage = {
        id: `agent_${Date.now()}`,
        role: 'agent',
        content: result.response,
        timestamp: new Date(),
        status: 'sent',
      };
      setMessages(prev => [...prev, agentMsg]);
    } catch {
      toast.error('Error procesando instrucción');
    } finally {
      setIsProcessing(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ============ PROGRESS BAR COLORS ============

  const getProgressColor = () => {
    if (!job) return 'bg-accent';
    if (job.status === 'completed') return 'bg-green-custom';
    if (job.status === 'error') return 'bg-rose-500';
    return 'bg-accent';
  };

  const getStatusIcon = () => {
    if (!job) return null;
    switch (job.status) {
      case 'processing':
      case 'rendering':
      case 'transcribing':
        return <Loader2 size={16} className="animate-spin text-accent" />;
      case 'completed':
        return <Check size={16} className="text-green-custom" />;
      case 'error':
        return <AlertCircle size={16} className="text-rose-500" />;
      default:
        return null;
    }
  };

  // ============ RENDER ============

  const videoTypeEntries = Object.entries(VIDEO_TYPES) as [VideoTypeId, typeof VIDEO_TYPES[VideoTypeId]][];
  const preset = VIDEO_TYPES[selectedType];
  const isJobActive = job?.status === 'processing' || job?.status === 'rendering' || job?.status === 'transcribing';
  const isCompleted = job?.status === 'completed';
  const hasError = job?.status === 'error';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <header className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-4">
          <Film size={16} className="text-purple-600" />
          <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">
            AI Video Editor — Nicky Schaefer
          </span>
        </div>
        <h2 className="font-display text-4xl lg:text-5xl font-bold mb-3">
          {t('videoEditTitle') || 'Edición de Video'}
        </h2>
        <p className="text-ink-muted max-w-xl mx-auto">
          {t('videoEditDesc') || 'Edita videos con IA. Testimonials, Reels, Stories y más.'}
        </p>
      </header>

      {/* Server Status */}
      <div className={cn(
        'flex items-center justify-center gap-2 text-xs font-bold',
        serverOnline ? 'text-green-custom' : 'text-amber-500'
      )}>
        <Server size={12} />
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: serverOnline ? '#467a49' : '#f59e0b' }} />
        {serverOnline ? 'Servidor de video conectado' : 'Servidor offline — inicia: node server/videoServer.js'}
      </div>

      {/* Video Type Selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {videoTypeEntries.map(([key, vt]) => (
          <button
            key={key}
            onClick={() => handleTypeSelect(key)}
            className={cn(
              'relative p-4 rounded-2xl border-2 transition-all text-left',
              selectedType === key
                ? 'border-accent bg-accent/10 shadow-lg shadow-accent/20'
                : 'border-brd bg-card hover:border-accent/50 hover:bg-accent/5'
            )}
          >
            <span className="text-2xl">{vt.icon}</span>
            <p className="font-bold text-sm mt-2">{vt.label}</p>
            <p className="text-[10px] text-ink-muted mt-1">{vt.defaultDuration}s · {vt.resolution.width}×{vt.resolution.height}</p>
            {selectedType === key && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                <Check size={12} className="text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* ============ PROGRESS BAR (when active) ============ */}
      <AnimatePresence>
        {job && (isJobActive || isCompleted || hasError) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              'bg-card border-2 rounded-2xl p-4',
              isCompleted ? 'border-green-custom/50' : hasError ? 'border-rose-500/50' : 'border-accent/30'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="text-sm font-bold">{job.progressMessage}</span>
              </div>
              <span className="text-sm font-mono font-bold">{job.progress}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-paper rounded-full overflow-hidden border border-brd">
              <motion.div
                className={cn('h-full rounded-full', getProgressColor())}
                initial={{ width: 0 }}
                animate={{ width: `${job.progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>

            {/* Status details */}
            <div className="flex items-center justify-between mt-2 text-xs text-ink-muted">
              <span>{job.sourceFile}</span>
              <span>{job.videoType} · {job.duration}s · {job.resolution.width}×{job.resolution.height}</span>
            </div>

            {/* Action buttons for completed/error */}
            {isCompleted && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 bg-accent text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent/90"
                >
                  <Download size={16} />
                  Descargar Video
                </button>
                <button onClick={handleSendEmail} className="py-2.5 px-4 bg-paper border border-brd rounded-xl hover:border-accent/50">
                  <Mail size={16} />
                </button>
                <button onClick={handleSendWhatsApp} className="py-2.5 px-4 bg-paper border border-brd rounded-xl hover:border-accent/50">
                  <MessageCircle size={16} />
                </button>
                <button onClick={handleDeleteJob} className="py-2.5 px-4 bg-paper border border-brd rounded-xl hover:border-rose-500/50 text-ink-muted hover:text-rose-500">
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            {hasError && (
              <div className="flex gap-2 mt-3">
                <p className="flex-1 text-xs text-rose-500">{job.error}</p>
                <button onClick={handleDeleteJob} className="py-2 px-4 bg-paper border border-brd rounded-xl hover:border-rose-500/50 text-ink-muted hover:text-rose-500 text-xs font-bold">
                  Cerrar
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Configuration */}
        <div className="lg:col-span-1 space-y-4">
          {/* Duration & Fade */}
          <div className="bg-card border border-brd rounded-2xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-3 flex items-center gap-2">
              <Clock size={14} />
              {t('videoEditDuration') || 'Duración y Transiciones'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-ink-muted block mb-1">{t('videoEditTargetDuration') || 'Duración objetivo (s)'}</label>
                <input
                  type="number"
                  value={job?.duration || preset.defaultDuration}
                  onChange={e => updateJobField({ duration: parseInt(e.target.value) || preset.defaultDuration })}
                  className="w-full bg-paper border border-brd rounded-xl px-3 py-2 text-sm font-mono"
                  min={5} max={300}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-ink-muted block mb-1">{t('videoEditFadeIn') || 'Fade in (s)'}</label>
                  <input
                    type="number"
                    value={job?.fadeIn ?? 2.0}
                    onChange={e => updateJobField({ fadeIn: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-paper border border-brd rounded-xl px-3 py-2 text-sm font-mono"
                    min={0} max={5} step={0.5}
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-muted block mb-1">{t('videoEditFadeOut') || 'Fade out (s)'}</label>
                  <input
                    type="number"
                    value={job?.fadeOut ?? 2.0}
                    onChange={e => updateJobField({ fadeOut: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-paper border border-brd rounded-xl px-3 py-2 text-sm font-mono"
                    min={0} max={5} step={0.5}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Subtitles Toggle - PROMINENT */}
          <div className={cn(
            'bg-card border-2 rounded-2xl p-4 transition-all',
            job?.subtitles.enabled ? 'border-accent shadow-lg shadow-accent/20' : 'border-brd'
          )}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                <Subtitles size={14} />
                {t('videoEditSubtitles') || 'Subtítulos'}
              </h3>
              <button
                onClick={() => updateSubtitles({ enabled: !job?.subtitles.enabled })}
                className={cn(
                  'relative w-14 h-7 rounded-full transition-all flex items-center',
                  job?.subtitles.enabled ? 'bg-accent justify-end' : 'bg-brd justify-start'
                )}
              >
                <motion.div layout className="w-5 h-5 bg-white rounded-full shadow-md mx-1" />
              </button>
            </div>
            <AnimatePresence>
              {job?.subtitles.enabled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-3"
                >
                  <div>
                    <label className="text-xs text-ink-muted block mb-1">Tamaño de fuente</label>
                    <input
                      type="range" min={24} max={48}
                      value={job?.subtitles.fontSize || DEFAULT_SUBTITLE_CONFIG.fontSize}
                      onChange={e => updateSubtitles({ fontSize: parseInt(e.target.value) })}
                      className="w-full accent-accent"
                    />
                    <span className="text-xs font-mono text-ink-muted">{job?.subtitles.fontSize || DEFAULT_SUBTITLE_CONFIG.fontSize}px</span>
                  </div>
                  <div>
                    <label className="text-xs text-ink-muted block mb-1">Posición</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['top', 'center', 'bottom'] as const).map(pos => (
                        <button
                          key={pos}
                          onClick={() => updateSubtitles({ position: pos })}
                          className={cn(
                            'px-2 py-1.5 rounded-lg text-xs font-bold transition-all',
                            job?.subtitles.position === pos ? 'bg-accent text-white' : 'bg-paper border border-brd hover:border-accent/50'
                          )}
                        >
                          {pos === 'top' ? '↑ Arriba' : pos === 'center' ? '● Centro' : '↓ Abajo'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-ink-muted block mb-1">Opacidad del fondo</label>
                    <input
                      type="range" min={0} max={100}
                      value={Math.round((job?.subtitles.bgOpacity || DEFAULT_SUBTITLE_CONFIG.bgOpacity) * 100)}
                      onChange={e => updateSubtitles({ bgOpacity: parseInt(e.target.value) / 100 })}
                      className="w-full accent-accent"
                    />
                    <span className="text-xs font-mono text-ink-muted">{Math.round((job?.subtitles.bgOpacity || 0.75) * 100)}%</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Audio Processing */}
          <div className="bg-card border border-brd rounded-2xl p-4">
            <button onClick={() => toggleSection('audio')} className="flex items-center justify-between w-full">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                <Volume2 size={14} />
                {t('videoEditAudio') || 'Procesamiento de Audio'}
              </h3>
              {expandedSections.audio ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {expandedSections.audio && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3 mt-3">
                  <ToggleRow label="Reducción de ruido" sublabel="afftdn" enabled={job?.audio.noiseReduction ?? DEFAULT_AUDIO_CONFIG.noiseReduction} onToggle={() => updateAudio({ noiseReduction: !job?.audio.noiseReduction })} />
                  <ToggleRow label="Compresión" sublabel="Dynamic range" enabled={job?.audio.compression ?? DEFAULT_AUDIO_CONFIG.compression} onToggle={() => updateAudio({ compression: !job?.audio.compression })} />
                  <ToggleRow label="Loudness norm" sublabel={`${job?.audio.targetLoudness ?? DEFAULT_AUDIO_CONFIG.targetLoudness} LUFS`} enabled={job?.audio.loudnorm ?? DEFAULT_AUDIO_CONFIG.loudnorm} onToggle={() => updateAudio({ loudnorm: !job?.audio.loudnorm })} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Video Filters */}
          <div className="bg-card border border-brd rounded-2xl p-4">
            <button onClick={() => toggleSection('filters')} className="flex items-center justify-between w-full">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                <Sun size={14} />
                {t('videoEditFilters') || 'Filtros de Video'}
              </h3>
              {expandedSections.filters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {expandedSections.filters && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3 mt-3">
                  <SliderRow label="Brillo" value={job?.filters.brightness ?? DEFAULT_VIDEO_FILTER_CONFIG.brightness} min={-0.5} max={0.5} step={0.01} displayValue={(job?.filters.brightness ?? 0.08).toFixed(2)} onChange={v => updateFilters({ brightness: v })} />
                  <SliderRow label="Contraste" value={job?.filters.contrast ?? DEFAULT_VIDEO_FILTER_CONFIG.contrast} min={0.5} max={2} step={0.05} displayValue={(job?.filters.contrast ?? 1.15).toFixed(2)} onChange={v => updateFilters({ contrast: v })} />
                  <SliderRow label="Saturación" value={job?.filters.saturation ?? DEFAULT_VIDEO_FILTER_CONFIG.saturation} min={0} max={3} step={0.1} displayValue={(job?.filters.saturation ?? 1.2).toFixed(1)} onChange={v => updateFilters({ saturation: v })} />
                  <ToggleRow label="Enfoque (sharpening)" enabled={job?.filters.sharpening ?? DEFAULT_VIDEO_FILTER_CONFIG.sharpening} onToggle={() => updateFilters({ sharpening: !job?.filters.sharpening })} />
                  <ToggleRow label="Reducción de ruido" enabled={job?.filters.denoise ?? DEFAULT_VIDEO_FILTER_CONFIG.denoise} onToggle={() => updateFilters({ denoise: !job?.filters.denoise })} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Resolution */}
          <div className="bg-card border border-brd rounded-2xl p-4">
            <button onClick={() => toggleSection('resolution')} className="flex items-center justify-between w-full">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                <Crop size={14} />
                {t('videoEditResolution') || 'Resolución'}
              </h3>
              {expandedSections.resolution ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {expandedSections.resolution && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3 mt-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '720×1280 IG Reel', w: 720, h: 1280 },
                      { label: '1080×1920 IG Story', w: 1080, h: 1920 },
                    ].map(res => (
                      <button key={res.label} onClick={() => updateJobField({ resolution: { width: res.w, height: res.h } })}
                        className={cn('px-3 py-2 rounded-xl text-xs font-bold transition-all',
                          job?.resolution.width === res.w && job?.resolution.height === res.h ? 'bg-accent text-white' : 'bg-paper border border-brd hover:border-accent/50'
                        )}
                      >
                        {res.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-ink-muted block mb-1">Ancho</label>
                      <input type="number" value={job?.resolution.width ?? preset.resolution.width}
                        onChange={e => updateJobField({ resolution: { ...job!.resolution, width: parseInt(e.target.value) || 720 } })}
                        className="w-full bg-paper border border-brd rounded-xl px-3 py-2 text-sm font-mono" />
                    </div>
                    <div>
                      <label className="text-xs text-ink-muted block mb-1">Alto</label>
                      <input type="number" value={job?.resolution.height ?? preset.resolution.height}
                        onChange={e => updateJobField({ resolution: { ...job!.resolution, height: parseInt(e.target.value) || 1280 } })}
                        className="w-full bg-paper border border-brd rounded-xl px-3 py-2 text-sm font-mono" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Brand Overlay */}
          <div className="bg-card border border-brd rounded-2xl p-4">
            <button onClick={() => toggleSection('branding')} className="flex items-center justify-between w-full">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                <Type size={14} />
                {t('videoEditBranding') || 'Marca / Overlay'}
              </h3>
              {expandedSections.branding ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
              {expandedSections.branding && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
                  <input type="text" value={job?.brandOverlay || ''} onChange={e => updateJobField({ brandOverlay: e.target.value })}
                    placeholder="Nicola Schaefer — @nicola.schaefer.life"
                    className="w-full bg-paper border border-brd rounded-xl px-3 py-2 text-sm" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CENTER: Upload + Preview */}
        <div className="lg:col-span-1 space-y-4">
          {/* Upload Area */}
          <div className="bg-card border border-brd rounded-2xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-3 flex items-center gap-2">
              <Upload size={14} />
              {t('videoEditUpload') || 'Video Fuente'}
            </h3>
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} className="hidden" />

            {job?.sourceFile ? (
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-center gap-3">
                <FileVideo size={24} className="text-accent" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{job.sourceFile}</p>
                  <p className="text-xs text-ink-muted">{job.status === 'idle' ? 'Listo para procesar' : job.progressMessage}</p>
                </div>
                {job.status === 'idle' || job.status === 'uploaded' ? (
                  <button onClick={() => updateJob({ ...job, sourceFile: undefined, status: 'idle' })} className="text-ink-muted hover:text-rose-500">
                    <X size={16} />
                  </button>
                ) : null}
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={cn(
                  'w-full border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center gap-3',
                  isUploading ? 'border-accent bg-accent/5' : 'border-brd hover:border-accent/50 hover:bg-accent/5'
                )}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={32} className="text-accent animate-spin" />
                    <p className="text-sm font-bold">Subiendo...</p>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-ink-muted" />
                    <p className="text-sm font-bold">{t('videoEditDrop') || 'Arrastra o haz clic para subir'}</p>
                    <p className="text-xs text-ink-muted">MP4, MOV, AVI · Máx 2GB</p>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Preview */}
          <div className="bg-card border border-brd rounded-2xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-3 flex items-center gap-2">
              <Eye size={14} />
              {t('videoEditPreview') || 'Vista Previa'}
            </h3>
            <div className="aspect-[9/16] bg-paper rounded-xl border border-brd flex items-center justify-center overflow-hidden">
              {isCompleted ? (
                <div className="flex flex-col items-center gap-3 p-4 text-center">
                  <div className="w-16 h-16 bg-green-custom/20 rounded-full flex items-center justify-center">
                    <Check size={32} className="text-green-custom" />
                  </div>
                  <p className="text-sm font-bold text-green-custom">✅ Video listo para descargar</p>
                  <p className="text-xs text-ink-muted">{job.duration}s · {job.resolution.width}×{job.resolution.height}</p>
                </div>
              ) : isJobActive ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="text-accent animate-spin" />
                  <p className="text-sm font-bold">{job.progressMessage}</p>
                  <div className="w-32 h-2 bg-brd rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', getProgressColor())} style={{ width: `${job.progress}%` }} />
                  </div>
                  <p className="text-xs text-ink-muted">{job.progress}%</p>
                </div>
              ) : hasError ? (
                <div className="flex flex-col items-center gap-3 p-4 text-center">
                  <AlertCircle size={32} className="text-rose-500" />
                  <p className="text-sm font-bold text-rose-500">Error en procesamiento</p>
                  <p className="text-xs text-ink-muted">{job.error}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-ink-muted">
                  <Film size={48} className="opacity-30" />
                  <p className="text-xs">{t('videoEditNoPreview') || 'Sube un video para empezar'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={startProcessing}
            disabled={!job?.sourceFile || isJobActive || !serverOnline}
            className={cn(
              'w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all',
              job?.sourceFile && !isJobActive && serverOnline
                ? 'bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20'
                : 'bg-brd text-ink-muted cursor-not-allowed'
            )}
          >
            <Wand2 size={16} />
            {isJobActive ? 'Procesando...' : t('videoEditStart') || 'Iniciar Edición con IA'}
          </button>

          {/* Config Summary */}
          {job && (
            <div className="bg-paper border border-brd rounded-2xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-2">Configuración</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-ink-muted">Tipo</span><span className="font-bold">{VIDEO_TYPES[job.videoType].icon} {VIDEO_TYPES[job.videoType].label}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Duración</span><span className="font-mono">{job.duration}s</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Resolución</span><span className="font-mono">{job.resolution.width}×{job.resolution.height}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Subtítulos</span><span className={job.subtitles.enabled ? 'text-green-custom font-bold' : 'text-ink-muted'}>{job.subtitles.enabled ? '✓ ON' : '✗ OFF'}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Audio</span><span className="font-mono">{job.audio.loudnorm ? `${job.audio.targetLoudness} LUFS` : 'Sin norm'}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Fade</span><span className="font-mono">{job.fadeIn}s → {job.fadeOut}s</span></div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: AI Chat */}
        <div className="lg:col-span-1 flex flex-col">
          <div className="bg-card border border-brd rounded-2xl flex flex-col h-[700px]">
            <div className="px-4 py-3 border-b border-brd flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold">Video Agent</p>
                <p className="text-[10px] text-ink-muted flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-custom rounded-full animate-pulse"></span>
                  {t('videoEditAgentOnline') || 'En línea'}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('max-w-[85%]', msg.role === 'user' ? 'ml-auto' : 'mr-auto')}
                >
                  <div className={cn(
                    'rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap',
                    msg.role === 'user' ? 'bg-accent text-white rounded-br-md' : 'bg-paper border border-brd rounded-bl-md'
                  )}>
                    {msg.content}
                  </div>
                  <p className={cn('text-[9px] text-ink-muted mt-1', msg.role === 'user' ? 'text-right' : 'text-left')}>
                    {msg.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </motion.div>
              ))}
              {isProcessing && (
                <div className="mr-auto max-w-[85%]">
                  <div className="bg-paper border border-brd rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-accent" />
                    <span className="text-xs text-ink-muted">Pensando...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="px-4 py-2 border-t border-brd/50 flex gap-2 overflow-x-auto">
              {[
                { label: '🎬 Testimonial', action: () => handleTypeSelect('testimonial') },
                { label: '📱 Reel', action: () => handleTypeSelect('reel') },
                { label: '📸 Story', action: () => handleTypeSelect('story') },
                { label: '📝 Subtítulos', action: () => updateSubtitles({ enabled: !job?.subtitles.enabled }) },
                { label: '🚀 Procesar', action: startProcessing },
              ].map(btn => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  className="whitespace-nowrap px-3 py-1.5 bg-paper border border-brd rounded-full text-xs font-bold hover:border-accent/50 transition-all"
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-brd">
              <div className="flex gap-2">
                <input
                  type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder={t('videoEditChatPlaceholder') || 'Describe el video que necesitas...'}
                  className="flex-1 bg-paper border border-brd rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                  disabled={isProcessing}
                />
                <button
                  onClick={sendMessage}
                  disabled={!chatInput.trim() || isProcessing}
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                    chatInput.trim() && !isProcessing ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-brd text-ink-muted'
                  )}
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ REUSABLE COMPONENTS ============

function ToggleRow({ label, sublabel, enabled, onToggle }: {
  label: string; sublabel?: string; enabled: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {sublabel && <p className="text-[10px] text-ink-muted">{sublabel}</p>}
      </div>
      <button
        onClick={onToggle}
        className={cn('relative w-11 h-6 rounded-full transition-all flex items-center', enabled ? 'bg-accent justify-end' : 'bg-brd justify-start')}
      >
        <motion.div layout className="bg-white rounded-full shadow mx-0.5" style={{ width: 18, height: 18 }} />
      </button>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, displayValue, onChange }: {
  label: string; value: number; min: number; max: number; step: number; displayValue: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs font-mono text-ink-muted">{displayValue}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-accent" />
    </div>
  );
}