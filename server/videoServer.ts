/**
 * Video Processing Server - Local Express server for video editing
 * Handles: upload, ffmpeg processing with progress, download, auto-cleanup
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const app = express();
const PORT = 3001;

// Storage paths
const UPLOAD_DIR = path.join(process.cwd(), '.video-temp');
const OUTPUT_DIR = path.join(process.cwd(), '.video-output');

// Ensure directories exist
[UPLOAD_DIR, OUTPUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Active jobs tracking
interface VideoJob {
  id: string;
  status: 'uploaded' | 'transcribing' | 'processing' | 'rendering' | 'completed' | 'error';
  progress: number;
  progressMessage: string;
  sourceFile: string;
  sourcePath: string;
  outputPath: string;
  outputUrl: string;
  config: {
    videoType: string;
    duration: number;
    width: number;
    height: number;
    subtitles: boolean;
    subtitleFontSize: number;
    subtitlePosition: string;
    subtitleBgOpacity: number;
    audioNoiseReduction: boolean;
    audioCompression: boolean;
    audioLoudnorm: boolean;
    audioTargetLoudness: number;
    filterBrightness: number;
    filterContrast: number;
    filterSaturation: number;
    filterSharpening: boolean;
    filterDenoise: boolean;
    fadeIn: number;
    fadeOut: number;
    brandOverlay: string;
  };
  createdAt: Date;
  completedAt?: Date;
  downloadedAt?: Date;
  error?: string;
}

const jobs = new Map<string, VideoJob>();

// Cleanup interval (every 5 minutes, delete completed jobs older than 30 min)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
const MAX_AGE_COMPLETED = 30 * 60 * 1000; // 30 minutes

function cleanup() {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (job.status === 'completed' && job.completedAt) {
      const age = now - job.completedAt.getTime();
      if (age > MAX_AGE_COMPLETED) {
        // Delete files
        if (job.sourcePath && fs.existsSync(job.sourcePath)) {
          fs.unlinkSync(job.sourcePath);
        }
        if (job.outputPath && fs.existsSync(job.outputPath)) {
          fs.unlinkSync(job.outputPath);
        }
        jobs.delete(id);
        console.log(`🧹 Cleaned up job ${id} (completed ${Math.round(age / 60000)}min ago)`);
      }
    }
  }
}

setInterval(cleanup, CLEANUP_INTERVAL);

// Middleware
app.use(cors());
app.use(express.json());

// Multer for file uploads (max 2GB)
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
});

// ============ ROUTES ============

// Health check
app.get('/api/video/health', (_req, res) => {
  res.json({ status: 'ok', ffmpeg: true, jobs: jobs.size });
});

// Upload video
app.post('/api/video/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No video file provided' });
    return;
  }

  const jobId = uuidv4();
  const job: VideoJob = {
    id: jobId,
    status: 'uploaded',
    progress: 0,
    progressMessage: 'Video cargado, listo para procesar',
    sourceFile: req.file.originalname,
    sourcePath: req.file.path,
    outputPath: '',
    outputUrl: '',
    config: {
      videoType: 'testimonial',
      duration: 45,
      width: 720,
      height: 1280,
      subtitles: true,
      subtitleFontSize: 34,
      subtitlePosition: 'bottom',
      subtitleBgOpacity: 0.75,
      audioNoiseReduction: true,
      audioCompression: true,
      audioLoudnorm: true,
      audioTargetLoudness: -16,
      filterBrightness: 0.08,
      filterContrast: 1.15,
      filterSaturation: 1.2,
      filterSharpening: true,
      filterDenoise: true,
      fadeIn: 2.0,
      fadeOut: 2.0,
      brandOverlay: '',
    },
    createdAt: new Date(),
  };

  jobs.set(jobId, job);
  console.log(`📤 Uploaded: ${req.file.originalname} → Job ${jobId}`);
  res.json({ jobId, status: job.status, progress: job.progress, message: job.progressMessage });
});

// Update job config
app.patch('/api/video/jobs/:jobId/config', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  Object.assign(job.config, req.body);
  res.json({ jobId: job.id, config: job.config });
});

// Get job status
app.get('/api/video/jobs/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    message: job.progressMessage,
    sourceFile: job.sourceFile,
    outputUrl: job.outputUrl,
    error: job.error,
    config: job.config,
  });
});

// Start processing
app.post('/api/video/jobs/:jobId/process', async (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  if (job.status === 'processing' || job.status === 'rendering' || job.status === 'transcribing') {
    res.json({ jobId: job.id, status: job.status, progress: job.progress, message: 'Already processing' });
    return;
  }

  // Start processing in background
  res.json({ jobId: job.id, status: 'processing', progress: 0, message: 'Processing started' });
  processVideo(job).catch(err => {
    job.status = 'error';
    job.error = err.message;
    console.error(`❌ Job ${job.id} failed:`, err.message);
  });
});

// Download output video
app.get('/api/video/jobs/:jobId/download', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job || !job.outputPath || !fs.existsSync(job.outputPath)) {
    res.status(404).json({ error: 'Output file not found' });
    return;
  }

  job.downloadedAt = new Date();
  const filename = `${job.config.videoType}_${job.id.slice(0, 8)}.mp4`;
  res.download(job.outputPath, filename, (err) => {
    if (err) console.error('Download error:', err.message);
  });
});

// Delete job + files
app.delete('/api/video/jobs/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  // Clean up files
  if (job.sourcePath && fs.existsSync(job.sourcePath)) fs.unlinkSync(job.sourcePath);
  if (job.outputPath && fs.existsSync(job.outputPath)) fs.unlinkSync(job.outputPath);
  jobs.delete(job.id);
  console.log(`🗑️ Deleted job ${job.id}`);
  res.json({ deleted: true });
});

// List jobs
app.get('/api/video/jobs', (_req, res) => {
  const list = Array.from(jobs.values()).map(j => ({
    jobId: j.id,
    status: j.status,
    progress: j.progress,
    sourceFile: j.sourceFile,
    createdAt: j.createdAt,
  }));
  res.json(list);
});

// ============ VIDEO PROCESSING ============

async function getVideoDuration(filePath: string): Promise<number> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', filePath,
  ]);
  return parseFloat(stdout.trim());
}

async function processVideo(job: VideoJob): Promise<void> {
  const { config, sourcePath } = job;
  const jobId = job.id;

  try {
    // Phase 1: Analyzing
    job.status = 'processing';
    job.progress = 5;
    job.progressMessage = 'Analizando video...';

    const inputDuration = await getVideoDuration(sourcePath);
    console.log(`📹 Job ${jobId}: Input duration ${inputDuration.toFixed(1)}s`);

    // Phase 2: Build FFmpeg command
    job.progress = 15;
    job.progressMessage = 'Preparando filtros...';

    const outputPath = path.join(OUTPUT_DIR, `${jobId}.mp4`);
    job.outputPath = outputPath;

    // Video filters
    const vfParts: string[] = [];
    vfParts.push(`scale=-2:${config.height}`);
    vfParts.push(`crop=${config.width}:${config.height}:(in_w-${config.width})/2:(in_h-${config.height})/2`);

    if (config.filterDenoise) vfParts.push('hqdn3d=4:4:3:3');
    if (config.filterSharpening) vfParts.push('unsharp=5:5:1.0:5:5:0.5');
    vfParts.push(`eq=brightness=${config.filterBrightness}:contrast=${config.filterContrast}:saturation=${config.filterSaturation}`);
    vfParts.push('fps=30,setsar=1:1');

    // Fades
    if (config.fadeIn > 0) vfParts.push(`fade=t=in:st=0:d=${config.fadeIn}`);

    // Audio filters
    const afParts: string[] = [];
    if (config.audioNoiseReduction) afParts.push('afftdn=nf=-30');
    afParts.push('highpass=f=80,lowpass=f=12000');
    if (config.audioCompression) afParts.push('acompressor=threshold=-20dB:ratio=3:attack=5:release=100:makeup=3');
    if (config.audioLoudnorm) afParts.push(`loudnorm=I=${config.audioTargetLoudness}:TP=-1.5:LRA=11`);

    // Phase 3: Rendering
    job.status = 'rendering';
    job.progress = 25;
    job.progressMessage = 'Renderizando video...';

    // Calculate fade out time
    const fadeOutStart = Math.max(0, config.duration - config.fadeOut);
    if (config.fadeOut > 0) {
      vfParts.push(`fade=t=out:st=${fadeOutStart}:d=${config.fadeOut}`);
    }

    // Trim to target duration
    const ffmpegArgs = [
      '-y',
      '-i', sourcePath,
      '-t', String(config.duration),
      '-vf', vfParts.join(','),
      '-af', afParts.join(','),
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
      '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      outputPath,
    ];

    // Progress tracking via stderr
    const ffmpegProcess = execFile('ffmpeg', ffmpegArgs);

    // Parse progress from stderr
    if (ffmpegProcess.stderr) {
      let lastProgress = 25;
      ffmpegProcess.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        const timeMatch = text.match(/time=(\d+):(\d+):(\d+\.\d+)/);
        if (timeMatch) {
          const currentTime = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseFloat(timeMatch[3]);
          const pct = Math.min(90, 25 + Math.round((currentTime / config.duration) * 65));
          if (pct > lastProgress) {
            lastProgress = pct;
            job.progress = pct;
            job.progressMessage = `Renderizando... ${pct}%`;
          }
        }
      });
    }

    await ffmpegProcess;
    job.progress = 92;
    job.progressMessage = 'Finalizando...';

    // Phase 4: Verify output
    if (!fs.existsSync(outputPath)) {
      throw new Error('Output file was not created');
    }

    const outputDuration = await getVideoDuration(outputPath);
    const outputSize = fs.statSync(outputPath).size / (1024 * 1024);

    job.status = 'completed';
    job.progress = 100;
    job.progressMessage = `✅ Video listo (${outputDuration.toFixed(1)}s, ${outputSize.toFixed(1)}MB)`;
    job.outputUrl = `/api/video/jobs/${jobId}/download`;
    job.completedAt = new Date();

    console.log(`✅ Job ${jobId} completed: ${outputDuration.toFixed(1)}s, ${outputSize.toFixed(1)}MB`);

  } catch (err: any) {
    job.status = 'error';
    job.error = err.message || 'Unknown processing error';
    job.progressMessage = `❌ Error: ${job.error}`;
    console.error(`❌ Job ${jobId} failed:`, err.message);
  }
}

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`🎬 Video Processing Server running on http://localhost:${PORT}`);
  console.log(`📂 Upload dir: ${UPLOAD_DIR}`);
  console.log(`📂 Output dir: ${OUTPUT_DIR}`);
  console.log(`🧹 Auto-cleanup: files deleted 30min after completion`);
});

export { app, jobs };