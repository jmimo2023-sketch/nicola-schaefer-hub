/**
 * Highlight Agent — AI-powered video highlight detection
 * Analyzes transcription to suggest key moments for short-form content
 */

import { geminiService } from './geminiService';
import type { TranscriptionResult } from './subtitleService';

// ============================================================================
// TYPES
// ============================================================================

export interface HighlightClip {
  id: string;
  startTime: number;  // milliseconds
  endTime: number;    // milliseconds
  label: string;
  type: string;       // hook, body, cta, testimonial_peak, emotional_peak, key_insight, highlight
  reason: string;
  confidence: number; // 0-1
  tags: string[];
}

export interface HighlightConfig {
  videoType: 'reel' | 'story' | 'testimonial' | 'educational' | 'post';
  targetDuration: number; // seconds
  maxClips: number;
  minClipDuration: number; // seconds
  includeHook: boolean;
  includeCTA: boolean;
}

export const DEFAULT_HIGHLIGHT_CONFIG: HighlightConfig = {
  videoType: 'reel',
  targetDuration: 30,
  maxClips: 5,
  minClipDuration: 3,
  includeHook: true,
  includeCTA: true,
};

// ============================================================================
// HIGHLIGHT AGENT
// ============================================================================

export const highlightAgent = {
  /**
   * Suggest highlight clips from a transcription
   */
  async suggestHighlights(
    transcription: TranscriptionResult,
    config: HighlightConfig = DEFAULT_HIGHLIGHT_CONFIG,
    onProgress?: (progress: number) => void
  ): Promise<HighlightClip[]> {
    onProgress?.(10);

    try {
      const prompt = buildHighlightPrompt(transcription, config);
      onProgress?.(30);

      const response = await geminiService.generateContent(prompt);

      onProgress?.(70);

      const highlights = parseHighlightResponse(response, transcription.duration);
      onProgress?.(90);

      // Filter by config
      const filtered = filterHighlights(highlights, config);
      onProgress?.(100);

      return filtered;
    } catch (error) {
      console.warn('AI highlight detection failed, generating heuristic highlights:', error);
      return generateHeuristicHighlights(transcription, config);
    }
  },
};

// ============================================================================
// PROMPT BUILDING
// ============================================================================

function buildHighlightPrompt(transcription: TranscriptionResult, config: HighlightConfig): string {
  const typeDescriptions: Record<string, string> = {
    reel: 'Instagram Reel (15-90s, vertical, attention-grabbing)',
    story: 'Instagram Story (15s max, ephemeral, direct)',
    testimonial: 'Client testimonial (60s, authentic, emotional)',
    educational: 'Educational content (explaining, step-by-step)',
    post: 'Instagram post clip (60s, shareable)',
  };

  const segmentText = transcription.segments
    .map((s, i) => `[${formatMs(s.startTime)} - ${formatMs(s.endTime)}] ${s.text}`)
    .join('\n');

  return `Analyze this video transcription and suggest the best highlight clips for a ${typeDescriptions[config.videoType] || 'short video'}.

Transcription (${transcription.language}, ${Math.round(transcription.duration / 1000)}s):
${segmentText}

Target total duration: ${config.targetDuration} seconds
Maximum clips: ${config.maxClips}
${config.includeHook ? 'Must include a hook (first 3 seconds).' : ''}
${config.includeCTA ? 'Must include a call-to-action ending.' : ''}

Return a JSON array with this exact structure:
[
  {
    "startTime": 0,
    "endTime": 5000,
    "label": "Catchy opening hook",
    "type": "hook",
    "reason": "Strong emotional opening that grabs attention",
    "confidence": 0.9,
    "tags": ["engagement", "opening"]
  }
]

Types available: hook, body, cta, testimonial_peak, emotional_peak, key_insight, highlight

Ensure timestamps align with the actual segment times from the transcription.`;
}

// ============================================================================
// PARSING
// ============================================================================

function parseHighlightResponse(response: string, totalDuration: number): HighlightClip[] {
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((h: any, i: number) => ({
        id: `hl_${i}_${Date.now()}`,
        startTime: Math.max(0, h.startTime || 0),
        endTime: Math.min(totalDuration, h.endTime || h.startTime + 5000),
        label: h.label || 'Highlight',
        type: h.type || 'highlight',
        reason: h.reason || '',
        confidence: typeof h.confidence === 'number' ? h.confidence : 0.7,
        tags: Array.isArray(h.tags) ? h.tags : [],
      }));
    }
  } catch (e) {
    console.warn('Failed to parse highlight JSON:', e);
  }

  return [];
}

// ============================================================================
// FILTERING
// ============================================================================

function filterHighlights(highlights: HighlightClip[], config: HighlightConfig): HighlightClip[] {
  let filtered = [...highlights];

  // Sort by confidence
  filtered.sort((a, b) => b.confidence - a.confidence);

  // Limit number of clips
  filtered = filtered.slice(0, config.maxClips);

  // Ensure minimum duration
  filtered = filtered.filter(h => (h.endTime - h.startTime) / 1000 >= config.minClipDuration);

  // Add hook if needed and missing
  if (config.includeHook && !filtered.some(h => h.type === 'hook')) {
    filtered.unshift({
      id: `hl_hook_${Date.now()}`,
      startTime: 0,
      endTime: Math.min(5000, (filtered[0]?.startTime || 5000)),
      label: 'Opening Hook',
      type: 'hook',
      reason: 'Auto-generated hook from video start',
      confidence: 0.6,
      tags: ['auto', 'hook'],
    });
  }

  // Add CTA if needed and missing
  if (config.includeCTA && !filtered.some(h => h.type === 'cta')) {
    filtered.push({
      id: `hl_cta_${Date.now()}`,
      startTime: Math.max(0, (filtered[filtered.length - 1]?.endTime || totalDuration) - 5000),
      endTime: filtered[filtered.length - 1]?.endTime || totalDuration,
      label: 'Call to Action',
      type: 'cta',
      reason: 'Auto-generated CTA from video end',
      confidence: 0.5,
      tags: ['auto', 'cta'],
    });
  }

  return filtered;
}

// ============================================================================
// HEURISTIC FALLBACK
// ============================================================================

function generateHeuristicHighlights(transcription: TranscriptionResult, config: HighlightConfig): HighlightClip[] {
  const highlights: HighlightClip[] = [];
  const segments = transcription.segments;
  const duration = transcription.duration;

  if (segments.length === 0) {
    // No segments, create basic highlights
    const clipDuration = (config.targetDuration * 1000) / config.maxClips;
    for (let i = 0; i < config.maxClips; i++) {
      highlights.push({
        id: `hl_${i}_${Date.now()}`,
        startTime: i * clipDuration,
        endTime: (i + 1) * clipDuration,
        label: `Clip ${i + 1}`,
        type: i === 0 ? 'hook' : i === config.maxClips - 1 ? 'cta' : 'body',
        reason: 'Auto-generated segment',
        confidence: 0.4,
        tags: ['auto'],
      });
    }
    return highlights;
  }

  // Score segments by likely engagement
  const scored = segments.map((seg, i) => {
    let score = 0.5;
    const text = seg.text.toLowerCase();

    // Short sentences often make better clips
    if (seg.text.split(/\s+/).length <= 8) score += 0.1;

    // Questions are engaging
    if (text.includes('?')) score += 0.15;

    // Emotional words
    const emotionalWords = ['amazing', 'incredible', 'love', 'hate', 'best', 'worst', 'never', 'always', 'wow', 'genial', 'increíble', 'amor', 'mejor', 'wahnsinn', 'unglaublich'];
    if (emotionalWords.some(w => text.includes(w))) score += 0.2;

    // First segment is often a hook
    if (i === 0) score += 0.2;

    // Last segment is often a CTA
    if (i === segments.length - 1) score += 0.15;

    return { segment: seg, score, index: i };
  });

  // Sort by score and take top clips
  scored.sort((a, b) => b.score - a.score);
  const topClips = scored.slice(0, config.maxClips);

  // Convert to highlights
  topClips.forEach((clip, i) => {
    const seg = clip.segment;
    let type = 'body';
    if (clip.index === 0) type = 'hook';
    else if (clip.index === segments.length - 1) type = 'cta';
    else if (clip.score >= 0.8) type = 'emotional_peak';
    else if (clip.score >= 0.7) type = 'key_insight';

    highlights.push({
      id: `hl_${i}_${Date.now()}`,
      startTime: seg.startTime,
      endTime: seg.endTime,
      label: seg.text.slice(0, 50) + (seg.text.length > 50 ? '...' : ''),
      type,
      reason: `Confidence score: ${clip.score.toFixed(2)}`,
      confidence: clip.score,
      tags: [type, 'heuristic'],
    });
  });

  // Sort by start time
  highlights.sort((a, b) => a.startTime - b.startTime);

  return highlights;
}

// ============================================================================
// HELPERS
// ============================================================================

let totalDuration = 0;

function formatMs(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, '0')}`;
}