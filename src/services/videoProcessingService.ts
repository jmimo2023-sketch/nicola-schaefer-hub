/**
 * Video Processing Service — HubNick
 * FFmpeg.wasm integration for browser-side video processing
 * Handles: extract audio, trim clips, burn subtitles, merge segments, export
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// ============================================================================
// SINGLETON FFMPEG INSTANCE
// ============================================================================

let ffmpeg: FFmpeg | null = null;
let isLoaded = false;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg && isLoaded) return ffmpeg;

  ffmpeg = new FFmpeg();

  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg]', message);
  });

  ffmpeg.on('progress', ({ progress, time }) => {
    const pct = Math.round(progress * 100);
    console.log(`[FFmpeg] ${pct}% - ${time}ms`);
    // Emit progress event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ffmpeg-progress', { detail: { progress: pct, time } }));
    }
  });

  // Load FFmpeg with WASM from CDN
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  isLoaded = true;
  return ffmpeg;
}

// ============================================================================
// TYPES
// ============================================================================

export interface VideoClip {
  id: string;
  startTime: number; // seconds
  endTime: number; // seconds
  label: string;
  type: 'hook' | 'body' | 'cta' | 'testimonial' | 'highlight' | 'custom';
}

export interface SubtitleEntry {
  id: string;
  startTime: number; // ms
  endTime: number; // ms
  text: string;
  style?: SubtitleStyle;
}

export interface SubtitleStyle {
  fontSize?: number;
  color?: string;
  bgColor?: string;
  position?: 'top' | 'center' | 'bottom';
  font?: string;
  bold?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
}

export interface VideoExportOptions {
  format: 'mp4' | 'webm';
  resolution: { width: number; height: number };
  quality: 'low' | 'medium' | 'high';
  fps?: number;
  includeSubtitles?: boolean;
  subtitleStyle?: SubtitleStyle;
  includeWatermark?: boolean;
  watermarkText?: string;
}

export interface ProcessingJob {
  id: string;
  type: 'extract_audio' | 'trim' | 'merge' | 'burn_subtitles' | 'add_watermark' | 'convert';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  inputFiles: string[];
  outputFiles: string[];
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

// ============================================================================
// VIDEO PROCESSING FUNCTIONS
// ============================================================================

/**
 * Extract audio from video file for transcription
 */
export async function extractAudio(
  videoFile: File | Blob,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();
  const inputName = 'input_video.mp4';
  const outputName = 'audio_output.mp3';

  // Write input file
  const fileData = await fetchFile(videoFile);
  await ff.writeFile(inputName, fileData);

  // Set up progress listener
  if (onProgress) {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      onProgress(detail.progress);
    };
    window.addEventListener('ffmpeg-progress', handler);
  }

  try {
    // Extract audio
    await ff.exec([
      '-i', inputName,
      '-vn',                // No video
      '-acodec', 'libmp3lame',
      '-ab', '192k',
      '-ar', '44100',
      outputName
    ]);

    // Read output
    const data = await ff.readFile(outputName);
    const blob = new Blob([data], { type: 'audio/mp3' });

    // Cleanup
    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);

    return blob;
  } catch (error) {
    console.error('Audio extraction failed:', error);
    throw error;
  }
}

/**
 * Trim video clip between start and end times
 */
export async function trimClip(
  videoFile: File | Blob,
  startTime: number,
  endTime: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();
  const inputName = 'trim_input.mp4';
  const outputName = 'trim_output.mp4';

  const fileData = await fetchFile(videoFile);
  await ff.writeFile(inputName, fileData);

  try {
    await ff.exec([
      '-i', inputName,
      '-ss', startTime.toString(),
      '-to', endTime.toString(),
      '-c', 'copy',          // Fast copy without re-encode
      '-avoid_negative_ts', '1',
      outputName
    ]);

    const data = await ff.readFile(outputName);
    const blob = new Blob([data], { type: 'video/mp4' });

    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);

    return blob;
  } catch (error) {
    console.error('Trim failed:', error);
    throw error;
  }
}

/**
 * Merge multiple video clips into one
 */
export async function mergeClips(
  clips: { file: File | Blob; order: number }[],
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();

  // Write all clips
  const filelist: string[] = [];
  for (let i = 0; i < clips.length; i++) {
    const name = `clip_${i}.mp4`;
    const fileData = await fetchFile(clips[i].file);
    await ff.writeFile(name, fileData);
    filelist.push(`file '${name}'`);
  }

  // Write file list
  const listContent = filelist.join('\n');
  await ff.writeFile('filelist.txt', listContent);

  try {
    await ff.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'filelist.txt',
      '-c', 'copy',
      'merged_output.mp4'
    ]);

    const data = await ff.readFile('merged_output.mp4');
    const blob = new Blob([data], { type: 'video/mp4' });

    // Cleanup
    for (let i = 0; i < clips.length; i++) {
      await ff.deleteFile(`clip_${i}.mp4`);
    }
    await ff.deleteFile('filelist.txt');
    await ff.deleteFile('merged_output.mp4');

    return blob;
  } catch (error) {
    console.error('Merge failed:', error);
    throw error;
  }
}

/**
 * Burn subtitles into video (hardcode SRT-style subtitles)
 */
export async function burnSubtitles(
  videoFile: File | Blob,
  subtitles: SubtitleEntry[],
  style?: SubtitleStyle,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();
  const inputName = 'sub_input.mp4';
  const outputName = 'sub_output.mp4';
  const srtName = 'subtitles.srt';

  const fileData = await fetchFile(videoFile);
  await ff.writeFile(inputName, fileData);

  // Generate SRT content
  const srtContent = subtitles.map((sub, index) => {
    const startFormatted = formatSRTTime(sub.startTime);
    const endFormatted = formatSRTTime(sub.endTime);
    return `${index + 1}\n${startFormatted} --> ${endFormatted}\n${sub.text}\n`;
  }).join('\n');

  await ff.writeFile(srtName, srtContent);

  // Build subtitle filter
  const fontSize = style?.fontSize || 24;
  const color = style?.color || 'white';
  const bgColor = style?.bgColor || 'black@0.5';
  const outlineColor = style?.outlineColor || 'black';
  const outlineWidth = style?.outlineWidth || 2;
  const position = style?.position || 'bottom';

  const marginV = position === 'top' ? 50 : position === 'center' ? 0 : 50;
  const alignment = position === 'top' ? 6 : position === 'center' ? 10 : 2;

  try {
    // Use ASS subtitles for better styling via SRT + force_style
    const forceStyle = `FontName=Arial,FontSize=${fontSize},PrimaryColour=&H${color === 'white' ? 'FFFFFF' : '00FFFF'},OutlineColour=&H${outlineColor === 'black' ? '000000' : 'FFFFFF'},OutlineWidth=${outlineWidth},BackColour=&H${bgColor.includes('black') ? '000000' : 'FFFFFF'},MarginV=${marginV},Alignment=${alignment}`;

    await ff.exec([
      '-i', inputName,
      '-vf', `subtitles=${srtName}:force_style='${forceStyle}'`,
      '-c:a', 'copy',
      outputName
    ]);

    const data = await ff.readFile(outputName);
    const blob = new Blob([data], { type: 'video/mp4' });

    await ff.deleteFile(inputName);
    await ff.deleteFile(srtName);
    await ff.deleteFile(outputName);

    return blob;
  } catch (error) {
    console.error('Subtitle burning failed:', error);
    // Fallback: try without force_style
    try {
      await ff.exec([
        '-i', inputName,
        '-vf', `subtitles=${srtName}`,
        '-c:a', 'copy',
        outputName
      ]);

      const data = await ff.readFile(outputName);
      const blob = new Blob([data], { type: 'video/mp4' });

      await ff.deleteFile(inputName);
      await ff.deleteFile(srtName);
      await ff.deleteFile(outputName);

      return blob;
    } catch (fallbackError) {
      console.error('Fallback subtitle burning also failed:', fallbackError);
      throw error;
    }
  }
}

/**
 * Convert video format or resolution
 */
export async function convertVideo(
  videoFile: File | Blob,
  options: VideoExportOptions,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();
  const inputName = 'convert_input.mp4';
  const ext = options.format === 'webm' ? 'webm' : 'mp4';
  const outputName = `convert_output.${ext}`;

  const fileData = await fetchFile(videoFile);
  await ff.writeFile(inputName, fileData);

  const qualityMap = {
    low: { crf: 28, preset: 'fast', bitrate: '1M' },
    medium: { crf: 23, preset: 'medium', bitrate: '2.5M' },
    high: { crf: 18, preset: 'slow', bitrate: '5M' },
  };
  const q = qualityMap[options.quality];

  const args: string[] = [
    '-i', inputName,
    '-vf', `scale=${options.resolution.width}:${options.resolution.height}:force_original_aspect_ratio=decrease,pad=${options.resolution.width}:${options.resolution.height}:(ow-iw)/2:(oh-ih)/2`,
  ];

  if (options.fps) {
    args.push('-r', options.fps.toString());
  }

  if (options.format === 'webm') {
    args.push('-c:v', 'libvpx-vp9', '-c:a', 'libopus', '-crf', q.crf, '-b:v', q.bitrate);
  } else {
    args.push('-c:v', 'libx264', '-c:a', 'aac', '-crf', q.crf, '-preset', q.preset, '-b:v', q.bitrate);
  }

  args.push(outputName);

  try {
    await ff.exec(args);

    const data = await ff.readFile(outputName);
    const mimeType = options.format === 'webm' ? 'video/webm' : 'video/mp4';
    const blob = new Blob([data], { type: mimeType });

    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);

    return blob;
  } catch (error) {
    console.error('Video conversion failed:', error);
    throw error;
  }
}

/**
 * Add watermark text overlay to video
 */
export async function addWatermark(
  videoFile: File | Blob,
  text: string,
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'bottom-right',
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();
  const inputName = 'wm_input.mp4';
  const outputName = 'wm_output.mp4';

  const fileData = await fetchFile(videoFile);
  await ff.writeFile(inputName, fileData);

  const posMap = {
    'top-left': 'x=10:y=10',
    'top-right': 'x=w-tw-10:y=10',
    'bottom-left': 'x=10:y=h-th-10',
    'bottom-right': 'x=w-tw-10:y=h-th-10',
  };
  const pos = posMap[position];

  try {
    await ff.exec([
      '-i', inputName,
      '-vf', `drawtext=text='${text}':${pos}:fontsize=24:fontcolor=white@0.7:borderw=1:bordercolor=black@0.5`,
      '-c:a', 'copy',
      outputName
    ]);

    const data = await ff.readFile(outputName);
    const blob = new Blob([data], { type: 'video/mp4' });

    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);

    return blob;
  } catch (error) {
    console.error('Watermark failed:', error);
    throw error;
  }
}

/**
 * Get video metadata (duration, resolution, etc.)
 */
export async function getVideoInfo(videoFile: File | Blob): Promise<{
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  size: number;
}> {
  // Use browser's HTMLVideoElement for basic info
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        fps: 30, // Default, can't easily get from browser
        codec: 'h264', // Default
        size: videoFile instanceof File ? videoFile.size : 0,
      });
      video.remove();
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
      video.remove();
    };

    video.src = URL.createObjectURL(videoFile);
  });
}

// ============================================================================
// HELPERS
// ============================================================================

function formatSRTTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}