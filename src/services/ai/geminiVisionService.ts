/**
 * Gemini Vision Service
 * Uses Google Gemini AI (free tier - 1500 req/day) for image analysis and design insights
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY;

export interface ImageAnalysis {
  brandConsistency: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  composition: {
    score: number;
    feedback: string;
    suggestions: string[];
  };
  colors: {
    palette: string[];
    dominant: string;
    mood: string;
  };
  text: {
    readable: boolean;
    issues: string[];
  };
  overall: {
    score: number;
    verdict: string;
    improvements: string[];
  };
}

export interface ColorExtraction {
  palette: string[];
  dominant: string;
  suggestions: string[];
}

export interface DesignSuggestions {
  layout: string;
  colorAdjustments: string[];
  typography: string[];
  composition: string[];
}

type AnalysisTask = 'full' | 'enhance' | 'colors' | 'composition' | 'text';

interface AnalyzeOptions {
  task?: AnalysisTask;
  focus?: string;
  brandColors?: string[];
}

class GeminiVisionService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (GEMINI_API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    }
  }

  isReady(): boolean {
    return !!GEMINI_API_KEY;
  }

  private async imageToBase64(image: string | Blob): Promise<string> {
    if (image.startsWith('data:')) {
      return image.split(',')[1];
    }

    if (image.startsWith('http')) {
      const response = await fetch(image);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(image);
    });
  }

  private safetySettings() {
    return [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ];
  }

  /**
   * Analyze an image for design quality and brand consistency
   */
  async analyzeImage(imageUrl: string, options: AnalyzeOptions = {}): Promise<ImageAnalysis> {
    if (!this.ai) {
      throw new Error('Gemini API not configured. Set VITE_GEMINI_API_KEY in .env');
    }

    const base64Image = await this.imageToBase64(imageUrl);
    const prompt = this.buildAnalysisPrompt(options);

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/png', data: base64Image } }
          ]
        }],
        config: {
          safetySettings: this.safetySettings(),
          temperature: 0.4,
          maxOutputTokens: 2048,
        }
      });

      const text = response.text || '';
      return this.parseAnalysisResponse(text);
    } catch (error: any) {
      console.error('Gemini Vision error:', error);
      throw new Error(`Vision analysis failed: ${error.message}`);
    }
  }

  /**
   * Extract dominant colors from an image
   */
  async extractColors(imageUrl: string): Promise<string[]> {
    if (!this.ai) {
      throw new Error('Gemini API not configured. Set VITE_GEMINI_API_KEY in .env');
    }

    const base64Image = await this.imageToBase64(imageUrl);

    const prompt = `Analyze this image and extract the 5-7 dominant colors as hex color codes. Return ONLY a JSON array of hex color codes like ["#467a49", "#d16806", "#fefcf8", "#1a1a1a", "#e6a919"]. Do not include any other text.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/png', data: base64Image } }
          ]
        }],
        config: {
          safetySettings: this.safetySettings(),
          temperature: 0.2,
        }
      });

      const text = response.text?.trim() || '';

      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // Fall through to regex
        }
      }

      const hexCodes = text.match(/#[0-9A-Fa-f]{6}/g);
      return hexCodes || ['#000000'];
    } catch (error: any) {
      console.error('Color extraction error:', error);
      throw new Error(`Color extraction failed: ${error.message}`);
    }
  }

  /**
   * Generate design suggestions for improvement
   */
  async getSuggestions(imageUrl: string, context: string = 'instagram post'): Promise<DesignSuggestions> {
    if (!this.ai) {
      throw new Error('Gemini API not configured. Set VITE_GEMINI_API_KEY in .env');
    }

    const base64Image = await this.imageToBase64(imageUrl);

    const prompt = `Analyze this ${context} and provide specific, actionable suggestions for improvement in these categories:
1. Layout and composition
2. Color adjustments (if needed)
3. Typography improvements (if text is present)
4. Overall composition tips

Return ONLY valid JSON with this structure:
{
  "layout": "specific suggestion about layout",
  "colorAdjustments": ["suggestion 1", "suggestion 2"],
  "typography": ["suggestion 1", "suggestion 2"],
  "composition": ["suggestion 1", "suggestion 2"]
}`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/png', data: base64Image } }
          ]
        }],
        config: {
          safetySettings: this.safetySettings(),
          temperature: 0.4,
        }
      });

      const text = response.text?.trim() || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // Fall through
        }
      }

      throw new Error('Failed to parse suggestions');
    } catch (error: any) {
      console.error('Suggestions error:', error);
      throw new Error(`Failed to get suggestions: ${error.message}`);
    }
  }

  /**
   * Check brand consistency
   */
  async checkBrandConsistency(
    imageUrl: string,
    brandColors: string[]
  ): Promise<{ score: number; issues: string[]; suggestions: string[] }> {
    if (!this.ai) {
      throw new Error('Gemini API not configured. Set VITE_GEMINI_API_KEY in .env');
    }

    const base64Image = await this.imageToBase64(imageUrl);
    const colorsStr = brandColors.join(', ');

    const prompt = `Analyze this image for brand consistency with these brand colors: ${colorsStr}

Evaluate:
1. Are the brand colors used appropriately?
2. Is there color harmony with the brand palette?
3. Are there conflicting colors that don't match the brand?

Return ONLY valid JSON:
{
  "score": number between 0-100,
  "issues": ["specific issue 1", "specific issue 2"],
  "suggestions": ["how to fix issue 1", "how to fix issue 2"]
}`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/png', data: base64Image } }
          ]
        }],
        config: {
          safetySettings: this.safetySettings(),
          temperature: 0.3,
        }
      });

      const text = response.text?.trim() || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // Fall through
        }
      }

      throw new Error('Failed to parse brand consistency check');
    } catch (error: any) {
      console.error('Brand consistency error:', error);
      throw new Error(`Brand consistency check failed: ${error.message}`);
    }
  }

  /**
   * Generate caption for image
   */
  async generateCaption(imageUrl: string, topic?: string): Promise<string> {
    if (!this.ai) {
      throw new Error('Gemini API not configured. Set VITE_GEMINI_API_KEY in .env');
    }

    const base64Image = await this.imageToBase64(imageUrl);
    const topicContext = topic ? `The post should be about: ${topic}` : '';

    const prompt = `Analyze this image and generate an engaging Instagram caption for a life coach/mindset coach. ${topicContext}

Requirements:
- Catchy first line (hook)
- Value proposition or insight
- Call to action
- Use relevant hashtags (5-8)
- Match the mood and content of the image
- Professional but approachable tone

Return ONLY the caption text, no explanations.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/png', data: base64Image } }
          ]
        }],
        config: {
          safetySettings: this.safetySettings(),
          temperature: 0.7,
        }
      });

      return response.text?.trim() || '';
    } catch (error: any) {
      console.error('Caption generation error:', error);
      throw new Error(`Caption generation failed: ${error.message}`);
    }
  }

  /**
   * Generate hashtags for image
   */
  async generateHashtags(imageUrl: string, count: number = 10): Promise<string[]> {
    if (!this.ai) {
      throw new Error('Gemini API not configured. Set VITE_GEMINI_API_KEY in .env');
    }

    const base64Image = await this.imageToBase64(imageUrl);

    const prompt = `Analyze this image and generate ${count} relevant Instagram hashtags for a life coach/mindset coach. Mix of:
- Industry hashtags (#lifecoach, #mindset, etc.)
- Niche hashtags specific to the content
- Location hashtags if relevant (#DACH, #Germany, etc.)

Return ONLY a JSON array of hashtags like ["#lifecoach", "#mindset", "#motivation"]. No other text.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/png', data: base64Image } }
          ]
        }],
        config: {
          safetySettings: this.safetySettings(),
          temperature: 0.5,
        }
      });

      const text = response.text?.trim() || '';

      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // Fall through
        }
      }

      const hashtags = text.match(/#[a-zA-Z0-9_]+/g);
      return hashtags || [];
    } catch (error: any) {
      console.error('Hashtag generation error:', error);
      throw new Error(`Hashtag generation failed: ${error.message}`);
    }
  }

  private buildAnalysisPrompt(options: AnalyzeOptions): string {
    const { task = 'full', focus } = options;

    const basePrompt = 'Analyze this Instagram post design for a life coach/mindset coach. ';

    switch (task) {
      case 'enhance':
        return basePrompt + `Focus area: ${focus || 'overall improvement'}. Provide specific suggestions for making it more engaging and professional. Return valid JSON with "improvements" array.`;

      case 'colors':
        return basePrompt + 'Extract the color palette and analyze color harmony. Is the colors appropriate for a coaching brand? Return valid JSON with "palette", "dominant", "mood", and "suggestions".';

      case 'composition':
        return basePrompt + 'Evaluate the composition, visual hierarchy, and layout. Is it balanced and easy to read? Return valid JSON with "score", "feedback", and "suggestions".';

      case 'text':
        return basePrompt + 'Analyze any text in the image for readability, font choice, and messaging effectiveness. Return valid JSON with "readable", "issues", and "suggestions".';

      case 'full':
      default:
        let fullPrompt = basePrompt + 'Provide a comprehensive analysis including:\n';
        fullPrompt += '- Brand consistency score (0-100) and issues\n';
        fullPrompt += '- Composition score and feedback\n';
        fullPrompt += '- Color palette and mood\n';
        fullPrompt += '- Text readability (if applicable)\n';
        fullPrompt += '- Overall score with verdict\n';
        fullPrompt += '\nReturn ONLY valid JSON with this exact structure:\n';
        fullPrompt += '{\n  "brandConsistency": { "score": number, "issues": [], "suggestions": [] },\n';
        fullPrompt += '  "composition": { "score": number, "feedback": "", "suggestions": [] },\n';
        fullPrompt += '  "colors": { "palette": [], "dominant": "", "mood": "" },\n';
        fullPrompt += '  "text": { "readable": boolean, "issues": [] },\n';
        fullPrompt += '  "overall": { "score": number, "verdict": "", "improvements": [] }\n';
        fullPrompt += '}';
        return fullPrompt;
    }
  }

  private parseAnalysisResponse(text: string): ImageAnalysis {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Failed to parse analysis JSON:', e);
    }

    return {
      brandConsistency: { score: 50, issues: ['Unable to parse full analysis'], suggestions: [] },
      composition: { score: 50, feedback: 'Analysis unavailable', suggestions: [] },
      colors: { palette: [], dominant: '#000000', mood: 'Unknown' },
      text: { readable: true, issues: [] },
      overall: { score: 50, verdict: 'Analysis incomplete', improvements: [] },
    };
  }
}

export const geminiVisionService = new GeminiVisionService();
