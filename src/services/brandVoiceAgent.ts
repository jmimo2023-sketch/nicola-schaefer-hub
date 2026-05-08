/**
 * Brand Voice RAG Agent — PROMPT_MAESTRO
 * 
 * This agent maintains Nicola's brand voice and generates content that matches
 * the established tone, style, and pillars. It uses Gemini AI with a curated
 * brand voice library to ensure consistency across all content.
 * 
 * Content Pillars:
 * 1. Emotional Mastery — Deep emotional intelligence, vulnerability as strength
 * 2. Systematic Method — Structured approach to growth, frameworks
 * 3. Valley Experience — Lessons from difficult times, resilience
 * 4. Transformation — Before/after stories, personal evolution
 * 5. Community — Building connections, shared experiences
 */

import { geminiService } from './geminiService';
import { db } from './firebase';
import { collection, doc, setDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ============================================================================
// TYPES
// ============================================================================

export type ContentPillar = 'emotional_mastery' | 'systematic_method' | 'valley_experience' | 'transformation' | 'community';
export type ToneVariant = 'vulnerable' | 'empowering' | 'reflective' | 'provocative' | 'warm' | 'direct';
export type ContentType = 'caption' | 'reel_script' | 'story_sequence' | 'carousel' | 'bio' | 'hashtag_set';

export interface BrandVoiceConfig {
  pillars: ContentPillar[];
  defaultTone: ToneVariant;
  language: 'es' | 'de' | 'en';
  emojiStyle: 'minimal' | 'moderate' | 'rich';
  hashtagStrategy: 'branded' | 'mixed' | 'organic';
  includeCTA: boolean;
  includeHook: boolean;
  maxHashtags: number;
}

export interface GeneratedContent {
  id: string;
  type: ContentType;
  pillar: ContentPillar;
  tone: ToneVariant;
  language: string;
  content: string;
  hook?: string;
  cta?: string;
  hashtags: string[];
  variations: string[];  // Alternative versions
  score: number;         // Brand voice match score (0-1)
  createdAt: number;
}

export interface BrandVoiceExample {
  id: string;
  text: string;
  pillar: ContentPillar;
  tone: ToneVariant;
  source: string;       // 'instagram', 'manual', 'template'
  performance?: number;  // Engagement rate if available
}

// ============================================================================
// BRAND VOICE DEFINITION
// ============================================================================

const BRAND_VOICE = {
  name: 'Nicola Schaefer',
  description: 'Vulnerable yet empowering. Deep emotional intelligence with systematic frameworks. Bilingual warmth (DE/ES).',
  
  pillars: {
    emotional_mastery: {
      name: 'Emotional Mastery',
      description: 'Deep emotional intelligence, vulnerability as strength, inner work',
      keywords: ['emociones', 'vulnerabilidad', 'fuerza interior', 'autoconocimiento', 'Gefühle', 'Verletzlichkeit', 'innere Stärke'],
      exampleHooks: [
        '¿Alguna vez sentiste que...',
        'La última vez que lloré...',
        'Ich war lange der Meinung, Schwäche sei...',
      ],
    },
    systematic_method: {
      name: 'Systematic Method',
      description: 'Structured frameworks, step-by-step growth, actionable systems',
      keywords: ['método', 'sistema', 'pasos', 'framework', 'Methode', 'System', 'Schritte'],
      exampleHooks: [
        '3 pasos para...',
        'El sistema que me cambió la vida...',
        'Mein 3-Schritte-System für...',
      ],
    },
    valley_experience: {
      name: 'Valley Experience',
      description: 'Lessons from difficult times, resilience, finding meaning in struggle',
      keywords: ['valle', 'resiliencia', 'adversidad', 'oscuridad', 'Tal', 'Widerstandskraft', 'Dunkelheit'],
      exampleHooks: [
        'En mi momento más oscuro...',
        'Lo que aprendí en el valle...',
        'Als ich am Tiefpunkt war...',
      ],
    },
    transformation: {
      name: 'Transformation',
      description: 'Before/after stories, personal evolution, becoming',
      keywords: ['transformación', 'evolución', 'antes/después', 'cambio', 'Verwandlung', 'Evolution', 'Wandel'],
      exampleHooks: [
        'Yo no era siempre así...',
        'La persona que era vs quién soy...',
        'Ich war nicht immer so...',
      ],
    },
    community: {
      name: 'Community',
      description: 'Building connections, shared experiences, belonging',
      keywords: ['comunidad', 'conexión', 'juntos', 'pertenencia', 'Gemeinschaft', 'Verbindung', 'zusammen'],
      exampleHooks: [
        'No estás solo/a...',
        'Este espacio es para...',
        'Du bist nicht allein...',
      ],
    },
  },

  toneVariants: {
    vulnerable: 'Raw honesty, showing the wound, not the armor',
    empowering: 'Strong, uplifting, "you can do this"',
    reflective: 'Thoughtful, questioning, inviting introspection',
    provocative: 'Challenging assumptions, bold statements',
    warm: 'Cozy, safe, like a close friend',
    direct: 'No bullshit, clear, actionable',
  },

  styleGuide: {
    avoid: ['corporate tone', 'salesy language', 'generic advice', 'perfectionism', 'toxic positivity'],
    embrace: ['vulnerability', 'specific examples', 'personal stories', 'questions over answers', 'bilingual code-switching'],
    formatting: ['Short paragraphs', 'Line breaks for emphasis', 'Strategic emoji', 'Bold for key phrases'],
  },
};

// ============================================================================
// PROMPT MAESTRO SYSTEM
// ============================================================================

export const promptMaestro = {

  /**
   * Generate content matching the brand voice
   */
  async generate(
    type: ContentType,
    pillar: ContentPillar,
    topic: string,
    config?: Partial<BrandVoiceConfig>
  ): Promise<GeneratedContent> {
    const fullConfig: BrandVoiceConfig = {
      pillars: [pillar],
      defaultTone: 'vulnerable',
      language: 'es',
      emojiStyle: 'moderate',
      hashtagStrategy: 'mixed',
      includeCTA: true,
      includeHook: true,
      maxHashtags: 15,
      ...config,
    };

    const pillarInfo = BRAND_VOICE.pillars[pillar];
    const toneInfo = BRAND_VOICE.toneVariants[fullConfig.defaultTone];

    const languageInstruction = fullConfig.language === 'de' 
      ? 'Write in German (Deutsch). Use "du" form. Natural code-switching with Spanish is OK.'
      : fullConfig.language === 'en'
      ? 'Write in English. Natural code-switching with Spanish or German is OK.'
      : 'Write in Spanish (Español). Use "tú" form. Natural code-switching with German is OK.';

    const systemPrompt = `You are the BRAND VOICE AGENT for ${BRAND_VOICE.name}. ${BRAND_VOICE.description}

CONTENT PILLAR: ${pillarInfo.name} — ${pillarInfo.description}
Keywords: ${pillarInfo.keywords.join(', ')}
TONE: ${fullConfig.defaultTone} — ${toneInfo}

STYLE GUIDE:
- AVOID: ${BRAND_VOICE.styleGuide.avoid.join(', ')}
- EMBRACE: ${BRAND_VOICE.styleGuide.embrace.join(', ')}
- FORMATTING: ${BRAND_VOICE.styleGuide.formatting.join(', ')}

${languageInstruction}

Generate a ${type} about: "${topic}"

${fullConfig.includeHook ? 'Include a powerful hook as the first line.' : ''}
${fullConfig.includeCTA ? 'Include a clear call-to-action at the end.' : ''}

Respond in JSON format:
{
  "content": "the main content text",
  "hook": "the opening hook (if requested)",
  "cta": "the call to action (if requested)",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "variations": ["alternative version 1", "alternative version 2"],
  "score": 0.95
}`;

    const result = await geminiService.generateContent(
      `Topic: "${topic}"\nPillar: ${pillar}\nTone: ${fullConfig.defaultTone}`,
      systemPrompt
    );

    try {
      // Try to parse as JSON
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const auth = getAuth();
        const id = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        
        const generated: GeneratedContent = {
          id,
          type,
          pillar,
          tone: fullConfig.defaultTone,
          language: fullConfig.language,
          content: parsed.content || result,
          hook: parsed.hook,
          cta: parsed.cta,
          hashtags: parsed.hashtags || [],
          variations: parsed.variations || [],
          score: parsed.score || 0.8,
          createdAt: Date.now(),
        };

        // Save to Firestore
        await setDoc(doc(db, 'generated_content', id), generated);

        return generated;
      }
    } catch (e) {
      console.warn('Failed to parse brand voice output as JSON, using raw text');
    }

    // Fallback: return raw text
    const id = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      id,
      type,
      pillar,
      tone: fullConfig.defaultTone,
      language: fullConfig.language,
      content: result,
      hook: undefined,
      cta: undefined,
      hashtags: [],
      variations: [],
      score: 0.7,
      createdAt: Date.now(),
    };
  },

  /**
   * Get pillar suggestions for a topic
   */
  async suggestPillar(topic: string, language: 'es' | 'de' | 'en' = 'es'): Promise<ContentPillar[]> {
    const result = await geminiService.generateContent(
      `Topic: "${topic}"\nWhich content pillars does this topic best fit?`,
      `Given these content pillars: emotional_mastery, systematic_method, valley_experience, transformation, community.
       For the topic "${topic}", return the 2-3 most fitting pillars as a JSON array of strings.
       Only return the array, nothing else.`
    );

    try {
      const match = result.match(/\[[\s\S]*?\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return parsed.filter((p: string) => Object.keys(BRAND_VOICE.pillars).includes(p));
      }
    } catch {}

    return ['emotional_mastery', 'transformation'];  // default
  },

  /**
   * Score how well content matches the brand voice
   */
  async scoreContent(content: string, pillar: ContentPillar): Promise<number> {
    const result = await geminiService.generateContent(
      `Content to evaluate:\n"${content}"\n\nPillar: ${pillar}`,
      `Rate how well this content matches the brand voice of ${BRAND_VOICE.name} and the "${BRAND_VOICE.pillars[pillar].name}" pillar.
       Consider: tone consistency, vulnerability, authenticity, pillar alignment.
       Return ONLY a number between 0 and 1 (e.g., 0.85). Nothing else.`
    );

    const score = parseFloat(result.trim());
    return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
  },

  /**
   * Save a brand voice example for future reference
   */
  async saveExample(example: Omit<BrandVoiceExample, 'id'>): Promise<string> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const id = `example_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await setDoc(doc(db, 'brand_voice_examples', id), {
      ...example,
      id,
      authorId: userId,
      createdAt: Date.now(),
    });

    return id;
  },

  /**
   * Get brand voice examples for a pillar
   */
  async getExamples(pillar?: ContentPillar): Promise<BrandVoiceExample[]> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    let q = query(
      collection(db, 'brand_voice_examples'),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    if (pillar) {
      q = query(q, where('pillar', '==', pillar));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as BrandVoiceExample);
  },

  /**
   * Get brand voice configuration
   */
  getBrandVoiceConfig(): typeof BRAND_VOICE {
    return BRAND_VOICE;
  },

  /**
   * Get pillar info
   */
  getPillarInfo(pillar: ContentPillar) {
    return BRAND_VOICE.pillars[pillar];
  },

  /**
   * Get all pillars
   */
  getAllPillars() {
    return Object.entries(BRAND_VOICE.pillars).map(([key, value]) => ({
      id: key,
      ...value,
    }));
  },
};