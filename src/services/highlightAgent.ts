/**
 * Highlight Agent — HubNick
 * AI-powered highlight detection for video content
 * Analyzes transcripts to find the most engaging moments
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TranscriptionResult } from './subtitleService';

// ============================================================================
// TYPES
// ============================================================================

export interface HighlightClip {
  id: string;
  startTime: number; // ms
  endTime: number;   // ms
  label: string;
  type: 'hook' | 'body' | 'cta' | 'testimonial_peak' | 'emotional_peak' | 'key_insight' | 'custom';
  reason: string;
  confidence: number; // 0-1
  pillar?: string;     // Content pillar this aligns with
  tags?: string[];
}

export interface HighlightConfig {
  videoType: 'reel' | 'story' | 'testimonial' | 'educational' | 'post';
  targetDuration: number; // seconds
  brandVoice: string;
  language: 'es' | 'de' | 'en';
  minClipDuration: number; // seconds
  maxClipDuration: number; // seconds
}

export const DEFAULT_HIGHLIGHT_CONFIG: HighlightConfig = {
  videoType: 'reel',
  targetDuration: 30,
  brandVoice: 'nicola_schaefer',
  language: 'es',
  minClipDuration: 3,
  maxClipDuration: 15,
};

// ============================================================================
// PILLAR DEFINITIONS
// ============================================================================

const CONTENT_PILLARS = {
  P1: {
    es: 'Éxito vs Vacío — La paradoja del logro que no llena',
    de: 'Erfolg vs. Leere — Die Paradoxie des nicht erfüllenden Erfolgs',
    en: 'Success vs Emptiness — The paradox of achievement that doesn\'t fulfill',
  },
  P2: {
    es: 'Método Sistémico — Transformación desde adentro',
    de: 'Systemische Methode — Transformation von innen',
    en: 'Systemic Method — Transformation from within',
  },
  P3: {
    es: 'Autenticidad Vulnerable — Conectar desde la verdad',
    de: 'Verletzliche Authentizität — Verbinden aus der Wahrheit',
    en: 'Vulnerable Authenticity — Connecting from truth',
  },
  P4: {
    es: 'Impacto y Propósito — De la intención al resultado',
    de: 'Impact und Zweck — Von der Absicht zum Ergebnis',
    en: 'Impact and Purpose — From intention to result',
  },
  P5: {
    es: 'Liderazgo Consciente — Guiar desde la conciencia',
    de: 'Bewusste Führung — Führen aus dem Bewusstsein',
    en: 'Conscious Leadership — Leading from awareness',
  },
} as const;

// ============================================================================
// HIGHLIGHT AGENT
// ============================================================================

class HighlightAgent {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
  }

  /**
   * Analyze transcript and suggest highlight clips
   */
  async suggestHighlights(
    transcription: TranscriptionResult,
    config: HighlightConfig = DEFAULT_HIGHLIGHT_CONFIG,
    onProgress?: (progress: number) => void
  ): Promise<HighlightClip[]> {
    onProgress?.(10);

    if (!this.apiKey || !transcription.text) {
      // Fallback: heuristic-based highlights
      return this.heuristicHighlights(transcription, config);
    }

    onProgress?.(20);

    try {
      const highlights = await this.aiHighlights(transcription, config, onProgress);
      onProgress?.(100);
      return highlights;
    } catch (error) {
      console.error('AI highlight suggestion failed, using heuristics:', error);
      const highlights = this.heuristicHighlights(transcription, config);
      onProgress?.(100);
      return highlights;
    }
  }

  /**
   * AI-powered highlight detection using Gemini
   */
  private async aiHighlights(
    transcription: TranscriptionResult,
    config: HighlightConfig,
    onProgress?: (progress: number) => void
  ): Promise<HighlightClip[]> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const langMap = { es: 'Spanish', de: 'German', en: 'English' };

    const prompt = `You are a professional video editor specializing in ${config.videoType} content for Instagram creators.

Analyze this transcript from a video and identify the BEST moments for highlight clips.

BRAND CONTEXT: This is for Nicola Schaefer, a transformational coach in the DACH market. Content pillars:
- P1: Success vs Emptiness
- P2: Systemic Method  
- P3: Vulnerable Authenticity
- P4: Impact and Purpose
- P5: Conscious Leadership

TRANSCRIPT (${langMap[config.language]}):
${transcription.text}

TOTAL DURATION: ${transcription.duration}ms
TARGET CLIP TYPE: ${config.videoType}
TARGET DURATION: ${config.targetDuration} seconds

For each highlight clip, provide:
- startTime: in milliseconds from start
- endTime: in milliseconds from start  
- type: one of "hook", "body", "cta", "testimonial_peak", "emotional_peak", "key_insight"
- reason: brief explanation why this is a good clip
- confidence: 0.0 to 1.0
- pillar: which content pillar this aligns with (P1-P5 or null)
- tags: 2-3 relevant hashtags

RULES:
- Each clip should be ${config.minClipDuration}-${config.maxClipDuration} seconds
- For ${config.videoType}: suggest appropriate number of clips
  - reel (30s): 1 hook + 1-2 body + 1 CTA
  - story (15s): 1 hook + 1 key moment
  - testimonial (60s): 1 hook + transformation + result + CTA
  - educational: 1 hook + key insights + summary
- Prioritize emotional peaks, surprising statements, and actionable insights
- Hooks should start with a provocative question or bold statement

Return ONLY a JSON array:
[{"startTime": 0, "endTime": 5000, "type": "hook", "reason": "...", "confidence": 0.9, "pillar": "P3", "tags": ["#transformación", "#autenticidad"]}]`;

    onProgress?.(40);

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    onProgress?.(80);

    // Parse JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in AI response');
    }

    const rawClips = JSON.parse(jsonMatch[0]);

    const highlights: HighlightClip[] = rawClips.map((clip: any, i: number) => ({
      id: `hl_${Date.now()}_${i}`,
      startTime: clip.startTime || 0,
      endTime: clip.endTime || 5000,
      label: this.generateLabel(clip.type, clip.pillar),
      type: clip.type || 'highlight',
      reason: clip.reason || '',
      confidence: clip.confidence || 0.5,
      pillar: clip.pillar || undefined,
      tags: clip.tags || [],
    }));

    return highlights;
  }

  /**
   * Heuristic-based highlight detection (no AI required)
   */
  private heuristicHighlights(
    transcription: TranscriptionResult,
    config: HighlightConfig
  ): HighlightClip[] {
    const highlights: HighlightClip[] = [];
    const duration = transcription.duration || 30000;

    // 1. Hook: first 5 seconds or first segment
    highlights.push({
      id: `hl_${Date.now()}_hook`,
      startTime: 0,
      endTime: Math.min(5000, duration * 0.15),
      label: 'Hook — Opening',
      type: 'hook',
      reason: 'First moments capture viewer attention',
      confidence: 0.7,
      tags: ['#hook', '#opening'],
    });

    // 2. Key content segments from transcript
    if (transcription.segments.length > 0) {
      // Find most impactful segments (heuristic: longer = more content)
      const sorted = [...transcription.segments].sort(
        (a, b) => (b.endTime - b.startTime) - (a.endTime - a.startTime)
      );

      const topSegments = sorted.slice(0, Math.min(3, sorted.length));
      
      topSegments.forEach((seg, i) => {
        highlights.push({
          id: `hl_${Date.now()}_body_${i}`,
          startTime: seg.startTime,
          endTime: seg.endTime,
          label: `Key Moment ${i + 1}`,
          type: i === 0 ? 'key_insight' : 'body',
          reason: 'Important content segment',
          confidence: 0.6,
        });
      });
    } else {
      // Default body: 20-80% of video
      highlights.push({
        id: `hl_${Date.now()}_body`,
        startTime: duration * 0.2,
        endTime: duration * 0.8,
        label: 'Main Content',
        type: 'body',
        reason: 'Main content section',
        confidence: 0.5,
      });
    }

    // 3. CTA: last 10-15% of video
    if (duration > 15000) {
      highlights.push({
        id: `hl_${Date.now()}_cta`,
        startTime: duration * 0.85,
        endTime: duration,
        label: 'Call to Action',
        type: 'cta',
        reason: 'Closing call to action',
        confidence: 0.6,
        tags: ['#cta', '#action'],
      });
    }

    return highlights;
  }

  /**
   * Generate a human-readable label for a clip type
   */
  private generateLabel(type: string, pillar?: string): string {
    const typeLabels: Record<string, string> = {
      hook: 'Hook — Atención',
      body: 'Contenido Principal',
      cta: 'Call to Action',
      testimonial_peak: 'Momento Testimonial',
      emotional_peak: 'Pico Emocional',
      key_insight: 'Insight Clave',
      highlight: 'Highlight',
    };

    const pillarLabels: Record<string, string> = {
      P1: 'Éxito vs Vacío',
      P2: 'Método Sistémico',
      P3: 'Autenticidad Vulnerable',
      P4: 'Impacto y Propósito',
      P5: 'Liderazgo Consciente',
    };

    const label = typeLabels[type] || 'Clip';
    if (pillar && pillarLabels[pillar]) {
      return `${label} · ${pillarLabels[pillar]}`;
    }
    return label;
  }

  /**
   * Auto-arrange highlights into a final video structure
   */
  arrangeForTarget(
    highlights: HighlightClip[],
    targetType: 'reel' | 'story' | 'testimonial' | 'educational',
    targetDuration: number // seconds
  ): HighlightClip[] {
    const targetMs = targetDuration * 1000;
    
    // Sort by priority: hook first, then confidence
    const sorted = [...highlights].sort((a, b) => {
      const typeOrder = { hook: 0, body: 1, key_insight: 2, emotional_peak: 3, testimonial_peak: 4, cta: 5 };
      const aOrder = typeOrder[a.type as keyof typeof typeOrder] ?? 3;
      const bOrder = typeOrder[b.type as keyof typeof typeOrder] ?? 3;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return b.confidence - a.confidence;
    });

    // Select clips that fit within target duration
    const selected: HighlightClip[] = [];
    let currentDuration = 0;

    for (const clip of sorted) {
      const clipDuration = clip.endTime - clip.startTime;
      if (currentDuration + clipDuration <= targetMs) {
        selected.push(clip);
        currentDuration += clipDuration;
      }
      if (currentDuration >= targetMs * 0.9) break; // Allow 10% tolerance
    }

    // If no clips selected, take the first one that's closest to target
    if (selected.length === 0 && sorted.length > 0) {
      const best = sorted[0];
      selected.push({
        ...best,
        endTime: best.startTime + Math.min(best.endTime - best.startTime, targetMs),
      });
    }

    return selected;
  }
}

export const highlightAgent = new HighlightAgent();