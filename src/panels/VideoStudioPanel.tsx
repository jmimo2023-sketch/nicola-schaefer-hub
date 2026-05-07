/**
 * Video Studio Panel v3.0 — HubNick
 * AI-powered video editing with:
 * - FFmpeg.wasm for browser-side processing
 * - AI transcription (Gemini) with subtitle generation
 * - Smart highlight detection
 * - Visual timeline for clip selection
 * - Direct export to Instagram formats
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Film, Play, Download, Upload, Loader2, Sparkles, Check, X,
  Subtitles, Scissors, Wand2, Eye, Trash2, Clock, Type,
  ChevronDown, ChevronUp, FileVideo, Zap, MessageCircle,
  Send, AlertCircle, Volume2, Settings, Crop, Sun,
  Pause, SkipBack, SkipForward, Maximize2, RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

// New services
import {
  getVideoInfo,
  extractAudio,
  trimClip,
  burnSubtitles,
  convertVideo,
  addWatermark,
  type SubtitleEntry,
  type SubtitleStyle,
  type VideoExportOptions,
} from '../services/videoProcessingService';

import {
  subtitleService,
  type TranscriptionResult,
  type SubtitleConfig,
  DEFAULT_SUBTITLE_CONFIG,
} from '../services/subtitleService';

import {
  highlightAgent,
  type HighlightClip,
  type HighlightConfig,
  DEFAULT_HIGHLIGHT_CONFIG,
} from '../services/highlightAgent';

import { useTranslation } from '../lib/TranslationContext';

// ============================================================================
// TYPES
// ============================================================================

type VideoStudioTab = 'upload' | 'highlights' | 'subtitles' | 'export';
type ProcessingPhase = 'idle' | 'analyzing' | 'transcribing' | 'selecting' | 'processing' | 'completed' | 'error';

interface VideoState {
  file: File | null;
  fileUrl: string;
  duration: number;
  width: number;
  height: number;
  size: number;
}

interface TimelineMarker {
  id: string;
  startTime: number;
  endTime: number;
  label: string;
  type: 'highlight' | 'cut' | 'subtitle';
  color: string;
}

// ============================================================================
// HIGHLIGHT COLORS
// ============================================================================

const HIGHLIGHT_COLORS: Record<string, string> = {
  hook: '#10B981',
  body: '#6366F1',
  cta: '#F59E0B',
  testimonial_peak: '#EC4899',
  emotional_peak: '#EF4444',
  key_insight: '#8B5CF6',
  highlight: '#06B6D4',
};

function getHighlightColor(type: string): string {
  return HIGHLIGHT_COLORS[type] || '#6B7280';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VideoStudioPanel() {
  const { t } = useTranslation();

  // Video state
  const [video, setVideo] = useState<VideoState>({ file: null, fileUrl: '', duration: 0, width: 0, height: 0, size: 0 });
  const [activeTab, setActiveTab] = useState<VideoStudioTab>('upload');
  const [phase, setPhase] = useState<ProcessingPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  // Transcription
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [subtitleConfig, setSubtitleConfig] = useState<SubtitleConfig>(DEFAULT_SUBTITLE_CONFIG);
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
  const [showSubtitles, setShowSubtitles] = useState(true);

  // Highlights
  const [highlights, setHighlights] = useState<HighlightClip[]>([]);
  const [selectedHighlights, setSelectedHighlights] = useState<Set<string>>(new Set());
  const [highlightConfig, setHighlightConfig] = useState<HighlightConfig>(DEFAULT_HIGHLIGHT_CONFIG);

  // Timeline
  const [timelineMarkers, setTimelineMarkers] = useState<TimelineMarker[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Export
  const [exportFormat, setExportFormat] = useState<'mp4' | 'webm'>('mp4');
  const [exportQuality, setExportQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [watermarkText, setWatermarkText] = useState('@nicola.schaefer.life');
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ============================================================================
  // FILE UPLOAD & ANALYSIS
  // ============================================================================

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);

    try {
      const info = await getVideoInfo(file);
      setVideo({
        file,
        fileUrl,
        duration: info.duration,
        width: info.width,
        height: info.height,
        size: info.size,
      });

      toast.success(`Video loaded: ${info.width}×${info.height} · ${Math.round(info.duration)}s`);
      setActiveTab('highlights');

      // Auto-start analysis
      await analyzeVideo(file, info.duration);
    } catch (error) {
      toast.error('Failed to load video');
      console.error(error);
    }
  };

  const analyzeVideo = async (file: File, duration: number) => {
    setPhase('transcribing');
    setProgress(0);
    setProgressMessage('Extracting audio...');

    try {
      // Step 1: Extract audio
      setProgress(10);
      const audioBlob = await extractAudio(file, (p) => setProgress(10 + p * 0.2));

      // Step 2: Transcribe
      setProgressMessage('Transcribing with AI...');
      setProgress(30);
      const result = await subtitleService.transcribeAudio(audioBlob, subtitleConfig.language, (p) => {
        setProgress(30 + p * 0.3);
      });
      setTranscription(result);

      // Step 3: Generate subtitles from transcription segments
      setProgressMessage('Generating subtitles...');
      setProgress(60);
      const subs: SubtitleEntry[] = (result.segments || []).map((seg, i) => ({
        id: `sub_${i}`,
        startTime: seg.startTime,
        endTime: seg.endTime,
        text: seg.text,
        style: {
          fontSize: subtitleConfig.fontSize,
          position: subtitleConfig.position,
          color: 'white',
          bgColor: 'black@0.5',
          outlineColor: 'black',
          outlineWidth: 2,
        }
      }));
      setSubtitles(subs);

      // Step 4: Suggest highlights
      setPhase('selecting');
      setProgressMessage('AI analyzing highlights...');
      setProgress(70);

      const suggestedHighlights = await highlightAgent.suggestHighlights(
        result,
        highlightConfig,
        (p) => setProgress(70 + p * 0.25)
      );
      setHighlights(suggestedHighlights);

      // Select all by default
      setSelectedHighlights(new Set(suggestedHighlights.map(h => h.id)));

      // Build timeline markers
      const markers: TimelineMarker[] = [
        ...suggestedHighlights.map(h => ({
          id: h.id,
          startTime: h.startTime,
          endTime: h.endTime,
          label: h.label,
          type: 'highlight' as const,
          color: getHighlightColor(h.type),
        })),
        ...subs.map((s: SubtitleEntry, i: number) => ({
          id: `sub_${i}`,
          startTime: s.startTime,
          endTime: s.endTime,
          label: s.text.slice(0, 30),
          type: 'subtitle' as const,
          color: '#3B82F6',
        })),
      ];
      setTimelineMarkers(markers);

      setProgress(100);
      setPhase('completed');
      setProgressMessage('Analysis complete!');
      toast.success('Video analyzed! Select highlights and export.');

    } catch (error) {
      console.error('Analysis failed:', error);
      setPhase('error');
      setProgressMessage('Analysis failed. You can still use manual controls.');
      toast.error('AI analysis failed — use manual controls');
      setPhase('idle');
    }
  };

  // ============================================================================
  // HIGHLIGHT MANAGEMENT
  // ============================================================================

  const toggleHighlight = (id: string) => {
    setSelectedHighlights(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getSelectedDuration = (): number => {
    return highlights
      .filter(h => selectedHighlights.has(h.id))
      .reduce((sum, h) => sum + (h.endTime - h.startTime), 0) / 1000;
  };

  // ============================================================================
  // EXPORT
  // ============================================================================

  const handleExport = async () => {
    if (!video.file) return;

    setPhase('processing');
    setProgress(0);
    setProgressMessage('Processing video...');

    try {
      let currentBlob: Blob;

      // Step 1: Trim highlights
      const selectedHls = highlights.filter(h => selectedHighlights.has(h.id));
      if (selectedHls.length > 0) {
        setProgressMessage('Trimming highlight clips...');
        setProgress(10);

        const clips: Blob[] = [];
        for (let i = 0; i < selectedHls.length; i++) {
          const hl = selectedHls[i];
          const startSec = hl.startTime / 1000;
          const endSec = hl.endTime / 1000;

          const clip = await trimClip(video.file, startSec, endSec, (p) => {
            setProgress(10 + ((i + p / 100) / selectedHls.length) * 30);
          });
          clips.push(clip);
        }

        if (clips.length === 1) {
          currentBlob = clips[0];
        } else {
          setProgressMessage('Merging clips...');
          setProgress(40);
          const { mergeClips } = await import('../services/videoProcessingService');
          currentBlob = await mergeClips(
            clips.map((file, order) => ({ file, order })),
            (p) => setProgress(40 + p * 0.1)
          );
        }
      } else {
        currentBlob = video.file;
      }

      // Step 2: Burn subtitles
      if (showSubtitles && subtitles.length > 0) {
        setProgressMessage('Burning subtitles...');
        setProgress(55);

        const filteredSubs = selectedHls.length > 0
          ? subtitles.filter(s => selectedHls.some(h => s.startTime >= h.startTime && s.endTime <= h.endTime))
          : subtitles;

        const style: SubtitleStyle = {
          fontSize: subtitleConfig.fontSize,
          color: 'white',
          bgColor: 'black@0.5',
          position: subtitleConfig.position,
          outlineColor: 'black',
          outlineWidth: 2,
        };

        currentBlob = await burnSubtitles(currentBlob, filteredSubs, style, (p) => {
          setProgress(55 + p * 0.2);
        });
      }

      // Step 3: Watermark
      if (includeWatermark && watermarkText) {
        setProgressMessage('Adding watermark...');
        setProgress(80);
        currentBlob = await addWatermark(currentBlob, watermarkText, 'bottom-right', (p) => {
          setProgress(80 + p * 0.05);
        });
      }

      // Step 4: Convert
      setProgressMessage('Converting to final format...');
      setProgress(90);

      const exportOptions: VideoExportOptions = {
        format: exportFormat,
        resolution: { width: video.width, height: video.height },
        quality: exportQuality,
      };

      currentBlob = await convertVideo(currentBlob, exportOptions, (p) => {
        setProgress(90 + p * 0.1);
      });

      setOutputBlob(currentBlob);
      setProgress(100);
      setPhase('completed');
      setProgressMessage('Export complete!');
      toast.success('Video exported successfully! 🎬');

    } catch (error) {
      console.error('Export failed:', error);
      setPhase('error');
      setProgressMessage('Export failed: ' + (error as Error).message);
      toast.error('Export failed');
    }
  };

  const downloadOutput = () => {
    if (!outputBlob) return;
    const url = URL.createObjectURL(outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nicola_${highlights.length > 0 ? 'highlights' : 'video'}_${Date.now()}.${exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================================================
  // VIDEO PLAYBACK
  // ============================================================================

  const seekTo = (timeMs: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeMs / 1000;
      setCurrentTime(timeMs);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const TABS: { id: VideoStudioTab; label: string; icon: React.ReactNode }[] = [
    { id: 'upload', label: 'Upload', icon: <Upload size={16} /> },
    { id: 'highlights', label: 'Highlights', icon: <Sparkles size={16} /> },
    { id: 'subtitles', label: 'Subtitles', icon: <Subtitles size={16} /> },
    { id: 'export', label: 'Export', icon: <Download size={16} /> },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-paper">
      {/* Header */}
      <header className="px-4 py-3 border-b border-brd flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
            <Film size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Video Studio</h2>
            <p className="text-[10px] text-ink-muted">AI-powered editing · FFmpeg.wasm</p>
          </div>
        </div>

        {video.file && (
          <div className="flex items-center gap-4 text-xs text-ink-muted">
            <span className="font-mono">{video.width}×{video.height}</span>
            <span className="font-mono">{Math.round(video.duration)}s</span>
            <span className="font-mono">{(video.size / 1024 / 1024).toFixed(1)}MB</span>
          </div>
        )}
      </header>

      {/* Tab Navigation */}
      <div className="px-4 py-2 border-b border-brd flex gap-2 flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            disabled={!video.file && tab.id !== 'upload'}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "bg-card border border-brd text-ink-muted hover:text-ink",
              !video.file && tab.id !== 'upload' && "opacity-40 cursor-not-allowed"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.id === 'highlights' && highlights.length > 0 && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">
                {highlights.length}
              </span>
            )}
            {tab.id === 'subtitles' && subtitles.length > 0 && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-500">
                {subtitles.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {activeTab === 'upload' && (
              <UploadTab
                video={video}
                onUpload={handleFileUpload}
                fileInputRef={fileInputRef}
                videoRef={videoRef}
                isPlaying={isPlaying}
                currentTime={currentTime}
                onTogglePlay={togglePlay}
                onTimeUpdate={setCurrentTime}
                phase={phase}
                progress={progress}
                progressMessage={progressMessage}
              />
            )}

            {activeTab === 'highlights' && (
              <HighlightsTab
                highlights={highlights}
                selectedHighlights={selectedHighlights}
                onToggle={toggleHighlight}
                videoDuration={video.duration}
                onSeek={seekTo}
                highlightConfig={highlightConfig}
                onConfigChange={setHighlightConfig}
              />
            )}

            {activeTab === 'subtitles' && (
              <SubtitlesTab
                subtitles={subtitles}
                subtitleConfig={subtitleConfig}
                onConfigChange={setSubtitleConfig}
                transcription={transcription}
                showSubtitles={showSubtitles}
                onToggleSubtitles={setShowSubtitles}
                onSeek={seekTo}
              />
            )}

            {activeTab === 'export' && (
              <ExportTab
                video={video}
                highlights={highlights}
                selectedHighlights={selectedHighlights}
                showSubtitles={showSubtitles}
                exportFormat={exportFormat}
                exportQuality={exportQuality}
                includeWatermark={includeWatermark}
                watermarkText={watermarkText}
                outputBlob={outputBlob}
                phase={phase}
                progress={progress}
                progressMessage={progressMessage}
                onFormatChange={setExportFormat}
                onQualityChange={setExportQuality}
                onWatermarkToggle={setIncludeWatermark}
                onWatermarkTextChange={setWatermarkText}
                onExport={handleExport}
                onDownload={downloadOutput}
                selectedDuration={getSelectedDuration()}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Timeline (always visible when video loaded) */}
      {video.file && (
        <TimelineBar
          duration={video.duration * 1000}
          currentTime={currentTime}
          markers={timelineMarkers}
          onSeek={seekTo}
          selectedHighlights={selectedHighlights}
        />
      )}
    </div>
  );
}

// ============================================================================
// UPLOAD TAB
// ============================================================================

function UploadTab({
  video, onUpload, fileInputRef, videoRef,
  isPlaying, currentTime, onTogglePlay, onTimeUpdate,
  phase, progress, progressMessage,
}: {
  video: VideoState;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  isPlaying: boolean;
  currentTime: number;
  onTogglePlay: () => void;
  onTimeUpdate: (t: number) => void;
  phase: ProcessingPhase;
  progress: number;
  progressMessage: string;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      {!video.file ? (
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-3xl flex items-center justify-center mb-4">
              <Film size={40} className="text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upload your video</h2>
            <p className="text-sm text-ink-muted">AI will analyze, transcribe, and suggest highlights automatically</p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-brd rounded-2xl p-12 hover:border-accent/50 hover:bg-accent/5 transition-all flex flex-col items-center gap-4"
          >
            <Upload size={48} className="text-ink-muted" />
            <div>
              <p className="text-sm font-bold">Click to upload video</p>
              <p className="text-xs text-ink-muted mt-1">MP4, MOV, AVI · Max 2GB</p>
            </div>
          </button>

          <input ref={fileInputRef} type="file" accept="video/*" onChange={onUpload} className="hidden" />
        </div>
      ) : (
        <div className="w-full max-w-2xl">
          {/* Video Player */}
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-4">
            <video
              ref={videoRef}
              src={video.fileUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={() => onTimeUpdate(videoRef.current?.currentTime || 0)}
            />
            <button
              onClick={onTogglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
            >
              {isPlaying ? <Pause size={48} className="text-white" /> : <Play size={48} className="text-white" />}
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onTogglePlay} className="p-2 bg-card border border-brd rounded-xl hover:bg-paper">
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <div className="flex-1 h-2 bg-brd rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${video.duration > 0 ? (currentTime / video.duration) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs font-mono text-ink-muted">
              {formatTime(currentTime)} / {formatTime(video.duration)}
            </span>
          </div>

          {/* Analysis Progress */}
          {phase !== 'idle' && (
            <div className="bg-card border border-brd rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {phase === 'completed' ? (
                    <Check size={16} className="text-green-500" />
                  ) : phase === 'error' ? (
                    <AlertCircle size={16} className="text-rose-500" />
                  ) : (
                    <Loader2 size={16} className="text-accent animate-spin" />
                  )}
                  <span className="text-sm font-bold">{progressMessage}</span>
                </div>
                <span className="text-sm font-mono font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-brd rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="video/*" onChange={onUpload} className="hidden" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HIGHLIGHTS TAB
// ============================================================================

function HighlightsTab({
  highlights, selectedHighlights, onToggle,
  videoDuration, onSeek, highlightConfig, onConfigChange,
}: {
  highlights: HighlightClip[];
  selectedHighlights: Set<string>;
  onToggle: (id: string) => void;
  videoDuration: number;
  onSeek: (ms: number) => void;
  highlightConfig: HighlightConfig;
  onConfigChange: (c: HighlightConfig) => void;
}) {
  const selectAll = () => {
    const all = new Set(highlights.map(h => h.id));
    highlights.forEach(h => all.add(h.id));
    // We can't directly set, so toggle each missing one
    highlights.forEach(h => { if (!selectedHighlights.has(h.id)) onToggle(h.id); });
  };
  const deselectAll = () => {
    highlights.forEach(h => { if (selectedHighlights.has(h.id)) onToggle(h.id); });
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
      {/* Left: Config & Controls */}
      <div className="lg:w-72 space-y-4 flex-shrink-0">
        <div className="bg-card border border-brd rounded-2xl p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-3 flex items-center gap-2">
            <Sparkles size={14} />
            Highlight Settings
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-ink-muted block mb-1">Video Type</label>
              <select
                value={highlightConfig.videoType}
                onChange={e => onConfigChange({ ...highlightConfig, videoType: e.target.value as any })}
                className="w-full bg-paper border border-brd rounded-xl px-3 py-2 text-sm"
              >
                <option value="reel">Instagram Reel (15-60s)</option>
                <option value="story">Instagram Story (15s)</option>
                <option value="testimonial">Testimonial (60s)</option>
                <option value="educational">Educational</option>
                <option value="post">Post Clip</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-muted block mb-1">Target Duration (s)</label>
              <input
                type="number"
                value={highlightConfig.targetDuration}
                onChange={e => onConfigChange({ ...highlightConfig, targetDuration: parseInt(e.target.value) || 30 })}
                className="w-full bg-paper border border-brd rounded-xl px-3 py-2 text-sm font-mono"
                min={5} max={300}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={selectAll} className="flex-1 py-2 bg-accent text-white rounded-xl text-xs font-bold">
            Select All
          </button>
          <button onClick={deselectAll} className="flex-1 py-2 bg-card border border-brd rounded-xl text-xs font-bold">
            Deselect All
          </button>
        </div>

        <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 text-center">
          <p className="text-xs text-ink-muted">Selected Duration</p>
          <p className="text-2xl font-bold text-accent">
            {highlights
              .filter(h => selectedHighlights.has(h.id))
              .reduce((s, h) => s + (h.endTime - h.startTime), 0) / 1000}s
          </p>
          <p className="text-xs text-ink-muted">Target: {highlightConfig.targetDuration}s</p>
        </div>
      </div>

      {/* Right: Highlight Cards */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          {highlights.length === 0 ? (
            <div className="bg-card border border-brd rounded-2xl p-8 text-center">
              <Sparkles size={32} className="mx-auto text-ink-muted/30 mb-3" />
              <p className="text-sm font-bold">No highlights detected</p>
              <p className="text-xs text-ink-muted mt-1">Upload a video to analyze with AI</p>
            </div>
          ) : (
            highlights.map((hl) => {
              const isSelected = selectedHighlights.has(hl.id);
              const startSec = hl.startTime / 1000;
              const endSec = hl.endTime / 1000;
              const duration = endSec - startSec;
              const color = getHighlightColor(hl.type);

              return (
                <motion.div
                  key={hl.id}
                  layout
                  className={cn(
                    'bg-card border-2 rounded-2xl p-4 cursor-pointer transition-all',
                    isSelected ? 'border-accent shadow-lg shadow-accent/20' : 'border-brd hover:border-accent/30'
                  )}
                  onClick={() => onToggle(hl.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                      isSelected ? 'bg-accent text-white' : 'bg-paper border border-brd'
                    )}>
                      {isSelected && <Check size={14} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          {hl.type}
                        </span>
                        <span className="text-xs text-ink-muted font-mono">
                          {formatTime(startSec)} → {formatTime(endSec)} ({duration.toFixed(1)}s)
                        </span>
                      </div>
                      <p className="text-sm font-bold">{hl.label}</p>
                      <p className="text-xs text-ink-muted mt-1">{hl.reason}</p>
                      {hl.tags && hl.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {hl.tags.map((tag: string) => (
                            <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-accent/10 text-accent rounded-full font-bold">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <span className={cn(
                      "text-xs font-bold",
                      hl.confidence >= 0.8 ? 'text-green-500' : hl.confidence >= 0.5 ? 'text-amber-500' : 'text-ink-muted'
                    )}>
                      {Math.round(hl.confidence * 100)}%
                    </span>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); onSeek(hl.startTime); }}
                    className="mt-2 text-xs text-accent hover:underline"
                  >
                    ▶ Preview from {formatTime(startSec)}
                  </button>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUBTITLES TAB
// ============================================================================

function SubtitlesTab({
  subtitles, subtitleConfig, onConfigChange, transcription,
  showSubtitles, onToggleSubtitles, onSeek,
}: {
  subtitles: SubtitleEntry[];
  subtitleConfig: SubtitleConfig;
  onConfigChange: (c: SubtitleConfig) => void;
  transcription: TranscriptionResult | null;
  showSubtitles: boolean;
  onToggleSubtitles: (v: boolean) => void;
  onSeek: (ms: number) => void;
}) {
  const downloadSubFile = (format: 'srt' | 'vtt') => {
    if (subtitles.length === 0) return;
    try {
      const content = generateSubtitleContent(subtitles, format);
      const blob = new Blob([content], { type: format === 'srt' ? 'text/srt' : 'text/vtt' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subtitles.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Subtitles .${format} downloaded`);
    } catch {
      toast.error('Failed to export subtitles');
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
      {/* Left: Config */}
      <div className="lg:w-72 space-y-4 flex-shrink-0">
        <div className={cn(
          'bg-card border-2 rounded-2xl p-4 transition-all',
          showSubtitles ? 'border-accent shadow-lg shadow-accent/20' : 'border-brd'
        )}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
              <Subtitles size={14} />
              Subtitles
            </h3>
            <button
              onClick={() => onToggleSubtitles(!showSubtitles)}
              className={cn(
                'relative w-14 h-7 rounded-full transition-all flex items-center',
                showSubtitles ? 'bg-accent justify-end' : 'bg-brd justify-start'
              )}
            >
              <motion.div layout className="w-5 h-5 bg-white rounded-full shadow-md mx-1" />
            </button>
          </div>

          <AnimatePresence>
            {showSubtitles && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-3"
              >
                <div>
                  <label className="text-xs text-ink-muted block mb-1">Language</label>
                  <select
                    value={subtitleConfig.language}
                    onChange={e => onConfigChange({ ...subtitleConfig, language: e.target.value as any })}
                    className="w-full bg-paper border border-brd rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-ink-muted block mb-1">Font Size: {subtitleConfig.fontSize}px</label>
                  <input type="range" min={16} max={48} value={subtitleConfig.fontSize}
                    onChange={e => onConfigChange({ ...subtitleConfig, fontSize: parseInt(e.target.value) })}
                    className="w-full accent-accent" />
                </div>
                <div>
                  <label className="text-xs text-ink-muted block mb-1">Position</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['top', 'center', 'bottom'] as const).map(pos => (
                      <button key={pos}
                        onClick={() => onConfigChange({ ...subtitleConfig, position: pos })}
                        className={cn('px-2 py-1.5 rounded-lg text-xs font-bold transition-all',
                          subtitleConfig.position === pos ? 'bg-accent text-white' : 'bg-paper border border-brd hover:border-accent/50'
                        )}>
                        {pos === 'top' ? '↑ Top' : pos === 'center' ? '● Mid' : '↓ Bottom'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-ink-muted block mb-1">Max Words/Line: {subtitleConfig.maxWordsPerLine}</label>
                  <input type="range" min={3} max={12} value={subtitleConfig.maxWordsPerLine}
                    onChange={e => onConfigChange({ ...subtitleConfig, maxWordsPerLine: parseInt(e.target.value) })}
                    className="w-full accent-accent" />
                </div>
                <div>
                  <label className="text-xs text-ink-muted block mb-1">Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['default', 'karaoke', 'minimal', 'bold'] as const).map(style => (
                      <button key={style}
                        onClick={() => onConfigChange({ ...subtitleConfig, style })}
                        className={cn('px-2 py-1.5 rounded-lg text-xs font-bold transition-all capitalize',
                          subtitleConfig.style === style ? 'bg-accent text-white' : 'bg-paper border border-brd hover:border-accent/50'
                        )}>
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {transcription && (
          <div className="bg-card border border-brd rounded-2xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-2">Transcription</h3>
            <p className="text-xs text-ink-muted mb-1">Language: {transcription.language}</p>
            <p className="text-xs text-ink-muted mb-2">Duration: {formatTime(transcription.duration / 1000)}</p>
            <div className="max-h-40 overflow-y-auto text-xs text-ink-muted bg-paper border border-brd rounded-xl p-3">
              {transcription.text}
            </div>
          </div>
        )}

        {subtitles.length > 0 && (
          <div className="bg-card border border-brd rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-2">Export Subtitles</h3>
            <button onClick={() => downloadSubFile('srt')}
              className="w-full py-2 bg-paper border border-brd rounded-xl text-xs font-bold hover:border-accent/50">
              Download .SRT
            </button>
            <button onClick={() => downloadSubFile('vtt')}
              className="w-full py-2 bg-paper border border-brd rounded-xl text-xs font-bold hover:border-accent/50">
              Download .VTT
            </button>
          </div>
        )}
      </div>

      {/* Right: Subtitle List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {subtitles.length === 0 ? (
            <div className="bg-card border border-brd rounded-2xl p-8 text-center">
              <Subtitles size={32} className="mx-auto text-ink-muted/30 mb-3" />
              <p className="text-sm font-bold">No subtitles generated</p>
              <p className="text-xs text-ink-muted mt-1">Upload a video to transcribe</p>
            </div>
          ) : (
            subtitles.map((sub, i) => (
              <button
                key={sub.id || i}
                onClick={() => onSeek(sub.startTime)}
                className="w-full bg-card border border-brd rounded-xl p-3 hover:border-accent/30 text-left transition-all flex items-center gap-3"
              >
                <span className="text-xs font-mono text-ink-muted w-8 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{sub.text}</p>
                </div>
                <span className="text-xs font-mono text-ink-muted flex-shrink-0">
                  {formatTime(sub.startTime / 1000)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORT TAB
// ============================================================================

function ExportTab({
  video, highlights, selectedHighlights,
  showSubtitles, exportFormat, exportQuality, includeWatermark,
  watermarkText, outputBlob, phase, progress, progressMessage,
  onFormatChange, onQualityChange, onWatermarkToggle, onWatermarkTextChange,
  onExport, onDownload, selectedDuration,
}: {
  video: VideoState;
  highlights: HighlightClip[];
  selectedHighlights: Set<string>;
  showSubtitles: boolean;
  exportFormat: 'mp4' | 'webm';
  exportQuality: 'low' | 'medium' | 'high';
  includeWatermark: boolean;
  watermarkText: string;
  outputBlob: Blob | null;
  phase: ProcessingPhase;
  progress: number;
  progressMessage: string;
  onFormatChange: (f: 'mp4' | 'webm') => void;
  onQualityChange: (q: 'low' | 'medium' | 'high') => void;
  onWatermarkToggle: (v: boolean) => void;
  onWatermarkTextChange: (t: string) => void;
  onExport: () => void;
  onDownload: () => void;
  selectedDuration: number;
}) {
  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
      {/* Left: Export Config */}
      <div className="lg:w-80 space-y-4 flex-shrink-0">
        <div className="bg-card border border-brd rounded-2xl p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-3 flex items-center gap-2">
            <Settings size={14} />
            Export Settings
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-ink-muted block mb-1">Format</label>
              <div className="grid grid-cols-2 gap-2">
                {(['mp4', 'webm'] as const).map(fmt => (
                  <button key={fmt}
                    onClick={() => onFormatChange(fmt)}
                    className={cn('px-3 py-2 rounded-xl text-xs font-bold transition-all uppercase',
                      exportFormat === fmt ? 'bg-accent text-white' : 'bg-paper border border-brd hover:border-accent/50'
                    )}>
                    .{fmt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-ink-muted block mb-1">Quality</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map(q => (
                  <button key={q}
                    onClick={() => onQualityChange(q)}
                    className={cn('px-3 py-2 rounded-xl text-xs font-bold transition-all capitalize',
                      exportQuality === q ? 'bg-accent text-white' : 'bg-paper border border-brd hover:border-accent/50'
                    )}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={cn(
          'bg-card border-2 rounded-2xl p-4 transition-all',
          includeWatermark ? 'border-accent' : 'border-brd'
        )}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted">Watermark</h3>
            <button onClick={() => onWatermarkToggle(!includeWatermark)}
              className={cn('relative w-14 h-7 rounded-full transition-all flex items-center',
                includeWatermark ? 'bg-accent justify-end' : 'bg-brd justify-start'
              )}>
              <motion.div layout className="w-5 h-5 bg-white rounded-full shadow-md mx-1" />
            </button>
          </div>
          {includeWatermark && (
            <input type="text" value={watermarkText}
              onChange={e => onWatermarkTextChange(e.target.value)}
              className="w-full bg-paper border border-brd rounded-xl px-3 py-2 text-sm"
              placeholder="@nicola.schaefer.life" />
          )}
        </div>

        {/* Summary */}
        <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-3">Export Summary</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-ink-muted">Highlights</span>
              <span className="font-bold">{selectedHighlights.size} clips</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Duration</span>
              <span className="font-bold">{selectedDuration.toFixed(1)}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Subtitles</span>
              <span className={showSubtitles ? 'text-green-500 font-bold' : 'text-ink-muted'}>
                {showSubtitles ? '✓ ON' : '✗ OFF'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Format</span>
              <span className="font-mono font-bold">{exportFormat.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Quality</span>
              <span className="font-bold capitalize">{exportQuality}</span>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={onExport}
          disabled={!video?.file || phase === 'processing'}
          className={cn(
            'w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all',
            video?.file && phase !== 'processing'
              ? 'bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20'
              : 'bg-brd text-ink-muted cursor-not-allowed'
          )}>
          {phase === 'processing' ? (
            <><Loader2 size={16} className="animate-spin" /> Processing...</>
          ) : (
            <><Zap size={16} /> Export Video</>
          )}
        </button>

        {outputBlob && (
          <button
            onClick={onDownload}
            className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-500/90 shadow-lg"
          >
            <Download size={16} />
            Download ({(outputBlob.size / 1024 / 1024).toFixed(1)}MB)
          </button>
        )}
      </div>

      {/* Right: Progress / Result */}
      <div className="flex-1 flex items-center justify-center">
        {phase === 'processing' ? (
          <div className="max-w-md w-full bg-card border border-brd rounded-2xl p-8 text-center">
            <Loader2 size={48} className="mx-auto text-accent animate-spin mb-4" />
            <p className="text-lg font-bold mb-2">{progressMessage}</p>
            <div className="w-full h-3 bg-brd rounded-full overflow-hidden mb-2">
              <motion.div className="h-full bg-accent rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
            </div>
            <p className="text-sm font-mono text-ink-muted">{Math.round(progress)}%</p>
          </div>
        ) : outputBlob ? (
          <div className="max-w-md w-full bg-card border-2 border-green-500/50 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <Check size={40} className="text-green-500" />
            </div>
            <p className="text-xl font-bold mb-2">Export Complete! 🎬</p>
            <p className="text-sm text-ink-muted mb-4">
              {(outputBlob.size / 1024 / 1024).toFixed(1)}MB · {exportFormat.toUpperCase()} · {exportQuality}
            </p>
            <button onClick={onDownload}
              className="px-8 py-3 bg-accent text-white rounded-2xl font-bold text-sm flex items-center gap-2 mx-auto hover:bg-accent/90 shadow-lg shadow-accent/20">
              <Download size={16} />
              Download Video
            </button>
          </div>
        ) : (
          <div className="max-w-md w-full bg-card border border-brd rounded-2xl p-8 text-center">
            <Film size={48} className="mx-auto text-ink-muted/30 mb-4" />
            <p className="text-lg font-bold mb-2">Ready to export</p>
            <p className="text-sm text-ink-muted">Select highlights, configure subtitles, and hit Export</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TIMELINE BAR
// ============================================================================

function TimelineBar({
  duration, currentTime, markers, onSeek, selectedHighlights,
}: {
  duration: number;
  currentTime: number;
  markers: TimelineMarker[];
  onSeek: (ms: number) => void;
  selectedHighlights: Set<string>;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!barRef.current || duration <= 0) return;
    const rect = barRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    onSeek(pct * duration);
  };

  return (
    <div className="h-16 bg-card border-t border-brd px-4 flex items-center gap-3 flex-shrink-0">
      <span className="text-xs font-mono text-ink-muted w-14">{formatTime(currentTime / 1000)}</span>

      <div
        ref={barRef}
        onClick={handleClick}
        className="flex-1 h-10 bg-paper border border-brd rounded-lg overflow-hidden relative cursor-pointer"
      >
        {/* Highlight regions */}
        {markers.filter(m => m.type === 'highlight').map(m => {
          const left = (m.startTime / duration) * 100;
          const width = ((m.endTime - m.startTime) / duration) * 100;
          const isSelected = selectedHighlights.has(m.id);
          return (
            <div
              key={m.id}
              className="absolute top-0 bottom-0"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: m.color,
                opacity: isSelected ? 0.5 : 0.2,
              }}
            />
          );
        })}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-accent z-10"
          style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
        >
          <div className="w-3 h-3 bg-accent rounded-full -ml-1 -mt-0.5" />
        </div>
      </div>

      <span className="text-xs font-mono text-ink-muted w-14 text-right">{formatTime(duration / 1000)}</span>
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function generateSubtitleContent(subtitles: SubtitleEntry[], format: 'srt' | 'vtt'): string {
  const formatTimecode = (ms: number): string => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const ms_ = ms % 1000;
    if (format === 'srt') {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms_).padStart(3, '0')}`;
    }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms_).padStart(3, '0')}`;
  };

  let content = '';
  if (format === 'vtt') content = 'WEBVTT\n\n';

  subtitles.forEach((sub, i) => {
    content += `${i + 1}\n`;
    content += `${formatTimecode(sub.startTime)} --> ${formatTimecode(sub.endTime)}\n`;
    content += `${sub.text}\n\n`;
  });

  return content;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}