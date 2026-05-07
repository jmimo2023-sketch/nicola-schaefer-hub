/**
 * Video Processing Service — FFmpeg.wasm wrapper
 * Browser-side video processing: trim, merge, burn subtitles, convert, watermark
 */

// FFmpeg.wasm types and lazy loading
let ffmpegLoaded = false;
let ffmpegInstance: any = null;

async function loadFFmpeg(): Promise<any> {
  if (ffmpegInstance) return ffmpegInstance;

  try {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');

    ffmpegInstance = new FFmpeg();

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpegInstance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegLoaded = true;
    return ffmpegInstance;
  } catch (error) {
    console.error('Failed to load FFmpeg.wasm:', error);
    throw new Error('FFmpeg.wasm could not be loaded. Video processing is unavailable.');
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface SubtitleStyle {
  fontSize: number;
  color: string;
  bgColor: string;
  position: 'top' | 'center' | 'bottom';
  outlineColor: string;
  outlineWidth: number;
}

export interface SubtitleEntry {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  style?: SubtitleStyle;
}

export interface VideoExportOptions {
  format: 'mp4' | 'webm';
  resolution: { width: number; height: number };
  quality: 'low' | 'medium' | 'high';
}

export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  size: number;
  codec?: string;
  bitrate?: number;
}

type ProgressCallback = (progress: number) => void;

// ============================================================================
// VIDEO INFO
// ============================================================================

export async function getVideoInfo(file: File): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size,
      });
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(file);
  });
}

// ============================================================================
// AUDIO EXTRACTION
// ============================================================================

export async function extractAudio(
  file: File | Blob,
  onProgress?: ProgressCallback
): Promise<Blob> {
  try {
    const ffmpeg = await loadFFmpeg();
    onProgress?.(5);

    const inputName = 'input.mp4';
    const outputName = 'audio.wav';

    const fileData = new Uint8Array(await file.arrayBuffer());
    await ffmpeg.writeFile(inputName, fileData);
    onProgress?.(30);

    ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      onProgress?.(30 + progress * 60);
    });

    await ffmpeg.exec(['-i', inputName, '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', outputName]);
    onProgress?.(90);

    const audioData = await ffmpeg.readFile(outputName);
    const audioBlob = new Blob([audioData], { type: 'audio/wav' });

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    onProgress?.(100);
    return audioBlob;
  } catch (error) {
    console.warn('FFmpeg audio extraction failed, using MediaRecorder fallback:', error);
    return extractAudioFallback(file, onProgress);
  }
}

async function extractAudioFallback(
  file: File | Blob,
  onProgress?: ProgressCallback
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const audioCtx = new AudioContext();

    video.onloadedmetadata = () => {
      onProgress?.(20);

      const source = audioCtx.createMediaElementSource(video);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      source.connect(audioCtx.destination);

      const recorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        onProgress?.(100);
        resolve(blob);
      };

      onProgress?.(50);
      video.play();
      recorder.start();

      video.onended = () => {
        recorder.stop();
        video.pause();
      };
    };

    video.onerror = () => reject(new Error('Failed to extract audio'));
    video.src = URL.createObjectURL(file);
  });
}

// ============================================================================
// TRIM CLIP
// ============================================================================

export async function trimClip(
  file: File | Blob,
  startTime: number,
  endTime: number,
  onProgress?: ProgressCallback
): Promise<Blob> {
  try {
    const ffmpeg = await loadFFmpeg();
    onProgress?.(10);

    const inputName = 'input.mp4';
    const outputName = 'trimmed.mp4';

    const fileData = new Uint8Array(await file.arrayBuffer());
    await ffmpeg.writeFile(inputName, fileData);
    onProgress?.(20);

    ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      onProgress?.(20 + progress * 70);
    });

    await ffmpeg.exec([
      '-i', inputName,
      '-ss', startTime.toString(),
      '-to', endTime.toString(),
      '-c', 'copy',
      outputName,
    ]);
    onProgress?.(90);

    const resultData = await ffmpeg.readFile(outputName);
    const resultBlob = new Blob([resultData], { type: 'video/mp4' });

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    onProgress?.(100);
    return resultBlob;
  } catch (error) {
    console.warn('FFmpeg trim failed, returning original blob:', error);
    onProgress?.(100);
    return file instanceof File ? new Blob([file], { type: file.type }) : file;
  }
}

// ============================================================================
// MERGE CLIPS
// ============================================================================

export async function mergeClips(
  clips: { file: Blob; order: number }[],
  onProgress?: ProgressCallback
): Promise<Blob> {
  if (clips.length === 0) throw new Error('No clips to merge');
  if (clips.length === 1) return clips[0].file;

  try {
    const ffmpeg = await loadFFmpeg();
    onProgress?.(10);

    const inputNames: string[] = [];
    const sortedClips = [...clips].sort((a, b) => a.order - b.order);

    // Write each clip
    for (let i = 0; i < sortedClips.length; i++) {
      const name = `clip_${i}.mp4`;
      const data = new Uint8Array(await sortedClips[i].file.arrayBuffer());
      await ffmpeg.writeFile(name, data);
      inputNames.push(name);
      onProgress?.(10 + (i / sortedClips.length) * 40);
    }

    // Create concat file
    const concatContent = inputNames.map(n => `file '${n}'`).join('\n');
    await ffmpeg.writeFile('concat.txt', concatContent);

    const outputName = 'merged.mp4';

    ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      onProgress?.(50 + progress * 40);
    });

    await ffmpeg.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat.txt',
      '-c', 'copy',
      outputName,
    ]);
    onProgress?.(90);

    const resultData = await ffmpeg.readFile(outputName);
    const resultBlob = new Blob([resultData], { type: 'video/mp4' });

    // Cleanup
    for (const name of inputNames) {
      await ffmpeg.deleteFile(name);
    }
    await ffmpeg.deleteFile('concat.txt');
    await ffmpeg.deleteFile(outputName);

    onProgress?.(100);
    return resultBlob;
  } catch (error) {
    console.warn('FFmpeg merge failed, returning first clip:', error);
    onProgress?.(100);
    return clips.length > 0 ? clips.sort((a, b) => a.order - b.order)[0].file : new Blob();
  }
}

// ============================================================================
// BURN SUBTITLES
// ============================================================================

export async function burnSubtitles(
  videoBlob: Blob,
  subtitles: SubtitleEntry[],
  style: SubtitleStyle,
  onProgress?: ProgressCallback
): Promise<Blob> {
  try {
    const ffmpeg = await loadFFmpeg();
    onProgress?.(10);

    const inputName = 'input.mp4';
    const outputName = 'subtitled.mp4';

    // Generate SRT content
    let srtContent = '';
    subtitles.forEach((sub, i) => {
      srtContent += `${i + 1}\n`;
      srtContent += `${formatSRT(sub.startTime)} --> ${formatSRT(sub.endTime)}\n`;
      srtContent += `${sub.text}\n\n`;
    });

    await ffmpeg.writeFile('subtitles.srt', srtContent);

    const fileData = new Uint8Array(await videoBlob.arrayBuffer());
    await ffmpeg.writeFile(inputName, fileData);
    onProgress?.(30);

    const subtitlePosition = style.position === 'top' ? 10 : style.position === 'center' ? 50 : 90;
    const subtitleForce = `FontName=Arial,FontSize=${style.fontSize},PrimaryColour=&H${style.color === 'white' ? 'FFFFFF' : '000000'},OutlineColour=&H${style.outlineColor === 'black' ? '000000' : 'FFFFFF'},Outline=${style.outlineWidth},MarginV=${subtitlePosition === 90 ? 30 : subtitlePosition === 10 ? 30 : 0}`;

    ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      onProgress?.(30 + progress * 60);
    });

    await ffmpeg.exec([
      '-i', inputName,
      '-vf', `subtitles=subtitles.srt:force_style='${subtitleForce}'`,
      '-c:a', 'copy',
      outputName,
    ]);
    onProgress?.(90);

    const resultData = await ffmpeg.readFile(outputName);
    const resultBlob = new Blob([resultData], { type: 'video/mp4' });

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    await ffmpeg.deleteFile('subtitles.srt');

    onProgress?.(100);
    return resultBlob;
  } catch (error) {
    console.warn('FFmpeg subtitle burn failed, returning original:', error);
    onProgress?.(100);
    return videoBlob;
  }
}

// ============================================================================
// ADD WATERMARK
// ============================================================================

export async function addWatermark(
  videoBlob: Blob,
  text: string,
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'bottom-right',
  onProgress?: ProgressCallback
): Promise<Blob> {
  try {
    const ffmpeg = await loadFFmpeg();
    onProgress?.(10);

    const inputName = 'input.mp4';
    const outputName = 'watermarked.mp4';

    const fileData = new Uint8Array(await videoBlob.arrayBuffer());
    await ffmpeg.writeFile(inputName, fileData);
    onProgress?.(20);

    const posMap: Record<string, string> = {
      'top-left': '10:10',
      'top-right': 'W-tw-10:10',
      'bottom-left': '10:H-th-10',
      'bottom-right': 'W-tw-10:H-th-10',
    };
    const drawText = `drawtext=text='${text}':fontcolor=white@0.6:fontsize=24:borderw=1:bordercolor=black@0.4:x=${posMap[position]?.split(':').join(':').replace('W-tw', 'w-text_w').replace('H-th', 'h-text_h')}`;

    ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      onProgress?.(20 + progress * 70);
    });

    await ffmpeg.exec([
      '-i', inputName,
      '-vf', drawText,
      '-c:a', 'copy',
      outputName,
    ]);
    onProgress?.(90);

    const resultData = await ffmpeg.readFile(outputName);
    const resultBlob = new Blob([resultData], { type: 'video/mp4' });

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    onProgress?.(100);
    return resultBlob;
  } catch (error) {
    console.warn('FFmpeg watermark failed, returning original:', error);
    onProgress?.(100);
    return videoBlob;
  }
}

// ============================================================================
// CONVERT VIDEO
// ============================================================================

export async function convertVideo(
  videoBlob: Blob,
  options: VideoExportOptions,
  onProgress?: ProgressCallback
): Promise<Blob> {
  try {
    const ffmpeg = await loadFFmpeg();
    onProgress?.(10);

    const inputName = 'input.mp4';
    const outputName = `output.${options.format}`;

    const fileData = new Uint8Array(await videoBlob.arrayBuffer());
    await ffmpeg.writeFile(inputName, fileData);
    onProgress?.(20);

    const qualityPresets: Record<string, string[]> = {
      low: ['-crf', '35', '-preset', 'ultrafast'],
      medium: ['-crf', '28', '-preset', 'medium'],
      high: ['-crf', '20', '-preset', 'slow'],
    };

    const codecArgs = options.format === 'webm'
      ? ['-c:v', 'libvpx-vp9', '-c:a', 'libopus']
      : ['-c:v', 'libx264', '-c:a', 'aac'];

    ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      onProgress?.(20 + progress * 70);
    });

    const args = [
      '-i', inputName,
      ...codecArgs,
      ...(qualityPresets[options.quality] || qualityPresets.high),
      '-y',
      outputName,
    ];

    await ffmpeg.exec(args);
    onProgress?.(90);

    const resultData = await ffmpeg.readFile(outputName);
    const mimeType = options.format === 'webm' ? 'video/webm' : 'video/mp4';
    const resultBlob = new Blob([resultData], { type: mimeType });

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    onProgress?.(100);
    return resultBlob;
  } catch (error) {
    console.warn('FFmpeg conversion failed, returning original:', error);
    onProgress?.(100);
    return videoBlob;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function formatSRT(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msR = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(msR).padStart(3, '0')}`;
}