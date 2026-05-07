/**
 * Subtitle Service — HubNick
 * Transcription and subtitle generation for videos
 * Uses Web Speech API as primary, Gemini as fallback for higher accuracy
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================================================
// TYPES
// ============================================================================

export interface TranscriptionWord {
  word: string;
  startTime: number; // ms
  endTime: number;    // ms
  confidence: number;
}

export interface TranscriptionResult {
  id: string;
  text: string;
  words: TranscriptionWord[];
  language: string;
  duration: number;   // ms
  segments: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  id: number;
  startTime: number; // ms
  endTime: number;    // ms
  text: string;
  words: TranscriptionWord[];
}

export interface SubtitleConfig {
  maxWordsPerLine: number;
  maxDurationMs: number;
  minDurationMs: number;
  fontSize: number;
  position: 'top' | 'center' | 'bottom';
  style: 'default' | 'karaoke' | 'minimal' | 'bold';
  language: 'es' | 'de' | 'en';
}

export const DEFAULT_SUBTITLE_CONFIG: SubtitleConfig = {
  maxWordsPerLine: 7,
  maxDurationMs: 5000,
  minDurationMs: 1000,
  fontSize: 24,
  position: 'bottom',
  style: 'default',
  language: 'es',
};

// ============================================================================
// TRANSCRIPTION SERVICE
// ============================================================================

class SubtitleService {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
  }

  /**
   * Transcribe audio using Gemini AI
   * Falls back to Web Speech API if no API key
   */
  async transcribeAudio(
    audioBlob: Blob,
    language: 'es' | 'de' | 'en' = 'es',
    onProgress?: (progress: number) => void
  ): Promise<TranscriptionResult> {
    if (this.apiKey) {
      return this.transcribeWithGemini(audioBlob, language, onProgress);
    }
    
    // Fallback: Use Web Speech API (browser-only, limited)
    return this.transcribeWithWebSpeech(audioBlob, language);
  }

  /**
   * Transcribe using Gemini AI — most accurate option
   */
  private async transcribeWithGemini(
    audioBlob: Blob,
    language: 'es' | 'de' | 'en',
    onProgress?: (progress: number) => void
  ): Promise<TranscriptionResult> {
    onProgress?.(10);

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Convert audio to base64
    const audioBase64 = await this.blobToBase64(audioBlob);
    const mimeType = audioBlob.type || 'audio/mp3';

    const languageMap = {
      es: 'Spanish',
      de: 'German',
      en: 'English',
    };

    const prompt = `You are a professional transcription service. Transcribe the following audio accurately in ${languageMap[language]}.

IMPORTANT: Return the transcription in this exact JSON format:
{
  "text": "full transcription text here",
  "segments": [
    {
      "id": 1,
      "startTime": 0,
      "endTime": 3000,
      "text": "First segment text",
      "words": [
        {"word": "First", "startTime": 0, "endTime": 500, "confidence": 0.95},
        {"word": "segment", "startTime": 500, "endTime": 1000, "confidence": 0.92}
      ]
    }
  ],
  "language": "${language}",
  "duration": 30000
}

Rules:
- Estimate timestamps based on word count and average speaking rate (about 2.5 words per second for ${languageMap[language]})
- Each segment should be 3-7 seconds long
- Include all words with estimated timestamps
- Be accurate with the language and punctuation
- If there are multiple speakers, note them as [Speaker 1], [Speaker 2] etc.`;

    onProgress?.(30);

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType,
            data: audioBase64,
          },
        },
      ]);

      onProgress?.(80);

      const responseText = result.response.text();
      
      // Parse JSON from response
      let transcription: TranscriptionResult;
      try {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          transcription = {
            id: `trans_${Date.now()}`,
            text: parsed.text || '',
            words: parsed.segments?.flatMap((s: any) => s.words || []) || [],
            language: language,
            duration: parsed.duration || 0,
            segments: parsed.segments || [],
          };
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        // Fallback: treat entire response as plain text
        transcription = {
          id: `trans_${Date.now()}`,
          text: responseText,
          words: [],
          language: language,
          duration: 0,
          segments: this.textToSegments(responseText, language),
        };
      }

      onProgress?.(100);
      return transcription;
    } catch (error) {
      console.error('Gemini transcription failed:', error);
      throw error;
    }
  }

  /**
   * Fallback: Web Speech API transcription
   * Limited: requires user interaction, doesn't work with audio files directly
   */
  private async transcribeWithWebSpeech(
    audioBlob: Blob,
    language: 'es' | 'de' | 'en'
  ): Promise<TranscriptionResult> {
    // Web Speech API requires live microphone input, not audio files
    // This is a placeholder that creates segments from silence
    const estimatedDuration = 30000; // 30 seconds default
    
    return {
      id: `trans_${Date.now()}`,
      text: 'Transcripción no disponible. Configura VITE_GOOGLE_API_KEY para usar Gemini AI.',
      words: [],
      language,
      duration: estimatedDuration,
      segments: [{
        id: 1,
        startTime: 0,
        endTime: estimatedDuration,
        text: 'Transcripción no disponible. Configura VITE_GOOGLE_API_KEY para usar Gemini AI.',
        words: [],
      }],
    };
  }

  /**
   * Convert transcription segments to subtitle entries
   */
  transcriptionToSubtitles(
    transcription: TranscriptionResult,
    config: SubtitleConfig = DEFAULT_SUBTITLE_CONFIG
  ): Array<{
    id: string;
    startTime: number;
    endTime: number;
    text: string;
  }> {
    const subtitles: Array<{
      id: string;
      startTime: number;
      endTime: number;
      text: string;
    }> = [];

    if (transcription.segments.length > 0) {
      // Use existing segments
      for (const segment of transcription.segments) {
        let text = segment.text.trim();
        
        // Split long segments into multiple lines
        if (text.split(' ').length > config.maxWordsPerLine) {
          const words = text.split(' ');
          for (let i = 0; i < words.length; i += config.maxWordsPerLine) {
            const chunk = words.slice(i, i + config.maxWordsPerLine).join(' ');
            const segmentDuration = segment.endTime - segment.startTime;
            const chunkDuration = Math.min(
              Math.max(config.minDurationMs, segmentDuration * (chunk.length / text.length)),
              config.maxDurationMs
            );
            const startTime = segment.startTime + (i / words.length) * segmentDuration;
            
            subtitles.push({
              id: `sub_${subtitles.length + 1}`,
              startTime,
              endTime: startTime + chunkDuration,
              text: chunk,
            });
          }
        } else {
          subtitles.push({
            id: `sub_${subtitles.length + 1}`,
            startTime: segment.startTime,
            endTime: segment.endTime,
            text,
          });
        }
      }
    } else if (transcription.text) {
      // No segments, create from full text
      const words = transcription.text.split(' ');
      const totalDuration = transcription.duration || words.length * 400;
      
      for (let i = 0; i < words.length; i += config.maxWordsPerLine) {
        const chunk = words.slice(i, i + config.maxWordsPerLine).join(' ');
        const startTime = (i / words.length) * totalDuration;
        const endTime = Math.min(
          startTime + config.maxDurationMs,
          ((i + config.maxWordsPerLine) / words.length) * totalDuration
        );
        
        subtitles.push({
          id: `sub_${subtitles.length + 1}`,
          startTime,
          endTime,
          text: chunk,
        });
      }
    }

    return subtitles;
  }

  /**
   * Generate SRT format string from subtitles
   */
  generateSRT(
    subtitles: Array<{ startTime: number; endTime: number; text: string }>
  ): string {
    return subtitles.map((sub, index) => {
      const startFormatted = this.formatSRTTime(sub.startTime);
      const endFormatted = this.formatSRTTime(sub.endTime);
      return `${index + 1}\n${startFormatted} --> ${endFormatted}\n${sub.text}\n`;
    }).join('\n');
  }

  /**
   * Generate VTT format string from subtitles
   */
  generateVTT(
    subtitles: Array<{ startTime: number; endTime: number; text: string }>
  ): string {
    const entries = subtitles.map((sub) => {
      const startFormatted = this.formatVTTTime(sub.startTime);
      const endFormatted = this.formatVTTTime(sub.endTime);
      return `${startFormatted} --> ${endFormatted}\n${sub.text}`;
    }).join('\n\n');

    return `WEBVTT\n\n${entries}`;
  }

  /**
   * Generate highlight clips suggestions based on video content
   * Uses AI to analyze transcript and suggest best moments
   */
  async suggestHighlights(
    transcription: TranscriptionResult,
    videoDuration: number,
    targetType: 'reel' | 'story' | 'testimonial' | 'educational' = 'reel'
  ): Promise<Array<{
    startTime: number;
    endTime: number;
    reason: string;
    type: 'hook' | 'body' | 'cta' | 'highlight';
  }>> {
    if (!this.apiKey) {
      // Fallback: simple heuristic-based highlights
      return this.heuristicHighlights(transcription, videoDuration, targetType);
    }

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Analyze this video transcript and suggest the best highlight clips for a ${targetType} video.

Transcript:
${transcription.text}

Duration: ${videoDuration}ms

For each highlight, provide:
- startTime (ms)
- endTime (ms)  
- reason (why this is a good clip)
- type: "hook" (attention grabber), "body" (main content), "cta" (call to action), or "highlight" (emotional peak)

Guidelines:
- For reels (15-60s): suggest 1 hook, 2-3 body clips, 1 CTA
- For stories (15s): suggest 1 short clip
- For testimonials: suggest 1 hook, the most impactful quote, 1 result
- For educational: suggest key learning moments

Return JSON array format:
[{"startTime": 0, "endTime": 5000, "reason": "...", "type": "hook"}]`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Highlight suggestion failed:', error);
    }

    return this.heuristicHighlights(transcription, videoDuration, targetType);
  }

  /**
   * Heuristic-based highlight detection (no AI)
   */
  private heuristicHighlights(
    transcription: TranscriptionResult,
    videoDuration: number,
    targetType: string
  ): Array<{
    startTime: number;
    endTime: number;
    reason: string;
    type: 'hook' | 'body' | 'cta' | 'highlight';
  }> {
    const highlights: Array<{
      startTime: number;
      endTime: number;
      reason: string;
      type: 'hook' | 'body' | 'cta' | 'highlight';
    }> = [];

    const durationSec = videoDuration / 1000;

    // Hook: first 5 seconds
    highlights.push({
      startTime: 0,
      endTime: Math.min(5000, videoDuration * 0.15),
      reason: 'Opening — captures attention',
      type: 'hook',
    });

    // Body: middle segments
    if (transcription.segments.length > 0) {
      // Find the longest segment as the main content
      const longest = transcription.segments.reduce((a, b) => 
        (b.endTime - b.startTime) > (a.endTime - a.startTime) ? b : a
      );
      highlights.push({
        startTime: longest.startTime,
        endTime: longest.endTime,
        reason: 'Main content — longest coherent segment',
        type: 'body',
      });
    } else {
      // Default: 30-70% of video
      highlights.push({
        startTime: videoDuration * 0.3,
        endTime: videoDuration * 0.7,
        reason: 'Main content — middle section',
        type: 'body',
      });
    }

    // CTA: last 10%
    if (durationSec > 15) {
      highlights.push({
        startTime: videoDuration * 0.85,
        endTime: videoDuration,
        reason: 'Closing — call to action',
        type: 'cta',
      });
    }

    return highlights;
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private textToSegments(text: string, language: string): TranscriptionSegment[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const segmentDuration = 3000; // 3 seconds per segment

    return sentences.map((sentence, i) => ({
      id: i + 1,
      startTime: i * segmentDuration,
      endTime: (i + 1) * segmentDuration,
      text: sentence.trim(),
      words: sentence.trim().split(' ').map((word, j) => ({
        word,
        startTime: i * segmentDuration + j * (segmentDuration / sentence.split(' ').length),
        endTime: i * segmentDuration + (j + 1) * (segmentDuration / sentence.split(' ').length),
        confidence: 0.8,
      })),
    }));
  }

  private formatSRTTime(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
  }

  private formatVTTTime(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  }
}

export const subtitleService = new SubtitleService();