/**
 * Video Agent Service - AI-powered video editing for Nicola Schaefer Hub
 * Manages video editing jobs, AI instructions, and file handling
 * Now connects to local Express backend for real processing
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ============ TYPES ============

export const VIDEO_TYPES = {
  testimonial: {
    id: 'testimonial',
    label: 'Testimonial',
    labelDE: 'Testimonial',
    labelES: 'Testimonio',
    icon: '🎬',
    description: 'Client transformation story',
    defaultDuration: 45,
    resolution: { width: 720, height: 1280 },
    segments: [
      { label: 'ANTES', description: 'Before transformation' },
      { label: 'NICKY', description: 'Nicky intervention' },
      { label: 'DESPUES', description: 'After transformation' },
      { label: 'RESULTADO', description: 'Result / CTA' },
    ],
  },
  reel: {
    id: 'reel',
    label: 'Instagram Reel',
    labelDE: 'Instagram Reel',
    labelES: 'Reel de Instagram',
    icon: '📱',
    description: 'Short-form vertical video',
    defaultDuration: 30,
    resolution: { width: 720, height: 1280 },
    segments: [
      { label: 'HOOK', description: 'Attention grabber' },
      { label: 'BODY', description: 'Main content' },
      { label: 'CTA', description: 'Call to action' },
    ],
  },
  story: {
    id: 'story',
    label: 'Instagram Story',
    labelDE: 'Instagram Story',
    labelES: 'Historia de Instagram',
    icon: '📸',
    description: 'Vertical story format',
    defaultDuration: 15,
    resolution: { width: 1080, height: 1920 },
    segments: [
      { label: 'HOOK', description: 'Opening' },
      { label: 'CONTENT', description: 'Main message' },
    ],
  },
  educational: {
    id: 'educational',
    label: 'Educational',
    labelDE: 'Bildung',
    labelES: 'Educativo',
    icon: '📚',
    description: 'Teaching / how-to content',
    defaultDuration: 60,
    resolution: { width: 720, height: 1280 },
    segments: [
      { label: 'INTRO', description: 'Topic introduction' },
      { label: 'EXPLAIN', description: 'Explanation' },
      { label: 'EXAMPLE', description: 'Example / demo' },
      { label: 'CTA', description: 'Call to action' },
    ],
  },
} as const;

export type VideoTypeId = keyof typeof VIDEO_TYPES;

export interface SubtitleConfig {
  enabled: boolean;
  fontSize: number;
  position: 'top' | 'center' | 'bottom';
  bgOpacity: number;
  fontColor: string;
  bgColor: string;
}

export interface AudioConfig {
  noiseReduction: boolean;
  compression: boolean;
  loudnorm: boolean;
  targetLoudness: number;
}

export interface VideoFilterConfig {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpening: boolean;
  denoise: boolean;
}

export interface VideoEditJob {
  id: string;
  status: 'idle' | 'uploaded' | 'transcribing' | 'processing' | 'rendering' | 'completed' | 'error';
  progress: number;
  progressMessage: string;
  videoType: VideoTypeId;
  sourceFile?: string;
  sourceUrl?: string;
  outputUrl?: string;
  outputPath?: string;
  duration: number;
  resolution: { width: number; height: number };
  subtitles: SubtitleConfig;
  audio: AudioConfig;
  filters: VideoFilterConfig;
  fadeIn: number;
  fadeOut: number;
  brandOverlay?: string;
  segments: Array<{ start: number; end: number; label: string }>;
  transcript?: TranscriptSegment[];
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  actions?: AgentAction[];
}

export interface AgentAction {
  type: 'set_video_type' | 'toggle_subtitles' | 'add_segment' | 'set_duration' | 'apply_filter' | 'start_edit';
  label: string;
  params: Record<string, unknown>;
}

export const DEFAULT_SUBTITLE_CONFIG: SubtitleConfig = {
  enabled: true,
  fontSize: 34,
  position: 'bottom',
  bgOpacity: 0.75,
  fontColor: '#FFFFFF',
  bgColor: '#000000',
};

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  noiseReduction: true,
  compression: true,
  loudnorm: true,
  targetLoudness: -16,
};

export const DEFAULT_VIDEO_FILTER_CONFIG: VideoFilterConfig = {
  brightness: 0.08,
  contrast: 1.15,
  saturation: 1.2,
  sharpening: true,
  denoise: true,
};

// ============ SERVER API ============

const API_BASE = '/api/video';

async function apiCall(endpoint: string, options?: RequestInit): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    return await res.json();
  } catch (err: any) {
    if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      throw new Error('Video server not running. Start it with: node server/videoServer.js');
    }
    throw err;
  }
}

// ============ SERVICE ============

class VideoAgentService {
  private genAI: GoogleGenerativeAI | null = null;
  private jobs: Map<string, VideoEditJob> = new Map();
  private pollInterval: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor() {
    this.initGemini();
  }

  private initGemini() {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  createJob(type: VideoTypeId, overrides?: Partial<VideoEditJob>): VideoEditJob {
    const preset = VIDEO_TYPES[type];
    const job: VideoEditJob = {
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: 'idle',
      progress: 0,
      progressMessage: '',
      videoType: type,
      duration: preset.defaultDuration,
      resolution: { ...preset.resolution },
      subtitles: { ...DEFAULT_SUBTITLE_CONFIG },
      audio: { ...DEFAULT_AUDIO_CONFIG },
      filters: { ...DEFAULT_VIDEO_FILTER_CONFIG },
      fadeIn: 2.0,
      fadeOut: 2.0,
      segments: preset.segments.map((s, i) => ({
        start: i * (preset.defaultDuration / preset.segments.length),
        end: (i + 1) * (preset.defaultDuration / preset.segments.length),
        label: s.label,
      })),
      createdAt: new Date(),
      ...overrides,
    };

    this.jobs.set(job.id, job);
    return job;
  }

  getJob(id: string): VideoEditJob | undefined {
    return this.jobs.get(id);
  }

  updateJob(id: string, updates: Partial<VideoEditJob>): VideoEditJob | null {
    const job = this.jobs.get(id);
    if (!job) return null;
    Object.assign(job, updates);
    return job;
  }

  // Upload video file to the backend server
  async uploadVideo(jobId: string, file: File): Promise<VideoEditJob> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');

    job.status = 'uploaded';
    job.progress = 5;
    job.progressMessage = 'Subiendo video...';
    job.sourceFile = file.name;

    const formData = new FormData();
    formData.append('video', file);

    try {
      const result = await apiCall('/upload', {
        method: 'POST',
        body: formData,
      });

      // Update local job with server job ID
      const serverJobId = result.jobId;
      job.id = serverJobId; // Use server's job ID
      this.jobs.set(serverJobId, job);
      this.jobs.delete(jobId);

      // Push config to server
      await apiCall(`/jobs/${serverJobId}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.configFromJob(job)),
      });

      job.progress = 10;
      job.progressMessage = 'Video cargado ✓';
      return job;
    } catch (err: any) {
      job.status = 'error';
      job.error = err.message;
      job.progressMessage = `❌ Error al subir: ${err.message}`;
      throw err;
    }
  }

  // Start processing the video
  async startProcessing(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');

    job.status = 'processing';
    job.progress = 15;
    job.progressMessage = 'Iniciando procesamiento...';

    try {
      await apiCall(`/jobs/${jobId}/process`, { method: 'POST' });
      // Start polling for progress
      this.startPolling(jobId);
    } catch (err: any) {
      job.status = 'error';
      job.error = err.message;
      job.progressMessage = `❌ Error: ${err.message}`;
      throw err;
    }
  }

  // Poll the server for job progress
  private startPolling(jobId: string) {
    if (this.pollInterval.has(jobId)) return;

    const interval = setInterval(async () => {
      try {
        const result = await apiCall(`/jobs/${jobId}`);
        const job = this.jobs.get(jobId);
        if (!job) {
          clearInterval(interval);
          this.pollInterval.delete(jobId);
          return;
        }

        job.status = result.status;
        job.progress = result.progress;
        job.progressMessage = result.message;
        job.error = result.error;

        if (result.outputUrl) {
          job.outputUrl = `${API_BASE.replace('/api/video', '')}${result.outputUrl}`;
        }

        if (result.status === 'completed' || result.status === 'error') {
          clearInterval(interval);
          this.pollInterval.delete(jobId);
          if (result.status === 'completed') {
            job.completedAt = new Date();
          }
        }
      } catch {
        // Server might be temporarily unavailable, keep polling
      }
    }, 2000); // Poll every 2 seconds

    this.pollInterval.set(jobId, interval);
  }

  // Download the processed video
  getDownloadUrl(jobId: string): string {
    return `${API_BASE}/jobs/${jobId}/download`;
  }

  // Delete job and files
  async deleteJob(jobId: string): Promise<void> {
    const pollRef = this.pollInterval.get(jobId);
    if (pollRef) {
      clearInterval(pollRef);
      this.pollInterval.delete(jobId);
    }

    try {
      await apiCall(`/jobs/${jobId}`, { method: 'DELETE' });
    } catch {
      // Ignore errors on delete
    }

    this.jobs.delete(jobId);
  }

  // Check server health
  async checkServerHealth(): Promise<boolean> {
    try {
      await apiCall('/health');
      return true;
    } catch {
      return false;
    }
  }

  // Process natural language instruction
  async processInstruction(
    instruction: string,
    currentJob: VideoEditJob
  ): Promise<{ response: string; actions: AgentAction[] }> {
    const prompt = `You are a video editing AI agent for Nicola Schaefer's content hub. You help users edit videos for Instagram (Reels, Stories, Testimonials, Educational content).

Current job configuration:
- Video type: ${currentJob.videoType}
- Duration: ${currentJob.duration}s
- Resolution: ${currentJob.resolution.width}x${currentJob.resolution.height}
- Subtitles: ${currentJob.subtitles.enabled ? 'ON' : 'OFF'} (font: ${currentJob.subtitles.fontSize}px, position: ${currentJob.subtitles.position})
- Audio: noise reduction=${currentJob.audio.noiseReduction}, compression=${currentJob.audio.compression}, loudnorm=${currentJob.audio.loudnorm}
- Filters: brightness=${currentJob.filters.brightness}, contrast=${currentJob.filters.contrast}, saturation=${currentJob.filters.saturation}
- Fade: in=${currentJob.fadeIn}s, out=${currentJob.fadeOut}s
- Brand overlay: ${currentJob.brandOverlay || 'none'}

User instruction: "${instruction}"

Respond in the user's language (Spanish or German). Be concise and action-oriented.`;

    try {
      if (!this.genAI) {
        return this.localProcessInstruction(instruction, currentJob);
      }

      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const actions: AgentAction[] = [];
      const jsonMatch = text.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed)) {
            parsed.forEach((a: any) => {
              if (a.type && a.label) actions.push(a);
            });
          }
        } catch {}
      }

      return {
        response: text.replace(/\[[\s\S]*?\]/, '').trim(),
        actions,
      };
    } catch (err) {
      console.error('Video agent Gemini error:', err);
      return this.localProcessInstruction(instruction, currentJob);
    }
  }

  private localProcessInstruction(
    instruction: string,
    currentJob: VideoEditJob
  ): { response: string; actions: AgentAction[] } {
    const lower = instruction.toLowerCase();
    const actions: AgentAction[] = [];

    if (lower.includes('subtitulo') || lower.includes('subtitle') || lower.includes('unterschrift')) {
      const enable = !lower.includes('sin') && !lower.includes('ohne') && !lower.includes('no') || lower.includes('activar') || lower.includes('aktivieren') || lower.includes('on');
      actions.push({ type: 'toggle_subtitles', label: enable ? 'Activar subtítulos' : 'Desactivar subtítulos', params: { enabled: enable } });
      return { response: enable ? '✅ Subtítulos activados.' : '⏹️ Subtítulos desactivados.', actions };
    }

    if (lower.includes('testimonial') || lower.includes('transformación') || lower.includes('transformation')) {
      actions.push({ type: 'set_video_type', label: 'Cambiar a Testimonial', params: { videoType: 'testimonial' } });
      return { response: '🎬 Testimonial: 45s, 720×1280. Segmentos: ANTES → NICKY → DESPUES → RESULTADO.', actions };
    }

    if (lower.includes('reel')) {
      actions.push({ type: 'set_video_type', label: 'Cambiar a Reel', params: { videoType: 'reel' } });
      return { response: '📱 Reel: 30s, 720×1280. HOOK → BODY → CTA.', actions };
    }

    if (lower.includes('story') || lower.includes('historia')) {
      actions.push({ type: 'set_video_type', label: 'Cambiar a Story', params: { videoType: 'story' } });
      return { response: '📸 Story: 15s, 1080×1920.', actions };
    }

    if (lower.includes('educativo') || lower.includes('educational') || lower.includes('bildung')) {
      actions.push({ type: 'set_video_type', label: 'Cambiar a Educativo', params: { videoType: 'educational' } });
      return { response: '📚 Educativo: 60s, 720×1280.', actions };
    }

    if (lower.includes('procesar') || lower.includes('editar') || lower.includes('start') || lower.includes('render')) {
      actions.push({ type: 'start_edit', label: 'Iniciar edición', params: {} });
      return { response: '🚀 Iniciando edición de video...', actions };
    }

    return {
      response: `Estoy lista para editar tu video ${currentJob.videoType}. Puedo:\n\n• Cambiar tipo de video\n• Activar/desactivar subtítulos\n• Ajustar filtros y audio\n• Iniciar la edición\n\n¿Qué necesitas?`,
      actions,
    };
  }

  // Convert job config to server format
  private configFromJob(job: VideoEditJob) {
    return {
      videoType: job.videoType,
      duration: job.duration,
      width: job.resolution.width,
      height: job.resolution.height,
      subtitles: job.subtitles.enabled,
      subtitleFontSize: job.subtitles.fontSize,
      subtitlePosition: job.subtitles.position,
      subtitleBgOpacity: job.subtitles.bgOpacity,
      audioNoiseReduction: job.audio.noiseReduction,
      audioCompression: job.audio.compression,
      audioLoudnorm: job.audio.loudnorm,
      audioTargetLoudness: job.audio.targetLoudness,
      filterBrightness: job.filters.brightness,
      filterContrast: job.filters.contrast,
      filterSaturation: job.filters.saturation,
      filterSharpening: job.filters.sharpening,
      filterDenoise: job.filters.denoise,
      fadeIn: job.fadeIn,
      fadeOut: job.fadeOut,
      brandOverlay: job.brandOverlay || '',
    };
  }
}

export const videoAgentService = new VideoAgentService();