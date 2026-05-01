/**
 * Content Agent Service - Frontend Bridge
 * 
 * Connects the Nicola Hub UI to the Content Agent backend.
 * Handles:
 * - AI content generation (text, images, videos)
 * - NEMO API video editing
 * - Supabase asset storage
 * - WhatsApp approval workflow
 */

// ============================================================
// CONFIGURATION - All secrets from environment variables
// ============================================================

const NEMO_API = import.meta.env.VITE_NEMO_API_URL || 'https://mega-api-prod.nemovideo.ai';
const NEMO_TOKEN = import.meta.env.VITE_NEMO_TOKEN || '';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'nicola-assets';

// ============================================================
// TYPES
// ============================================================

export interface ContentRequest {
  type: 'post' | 'story' | 'reel' | 'carousel';
  pillar: string;
  prompt: string;
  format?: 'png' | 'jpg' | 'mp4';
  language?: 'es' | 'de' | 'en';
}

export interface ContentResult {
  id: string;
  type: 'image' | 'video';
  title: string;
  caption: string;
  captionDE?: string;
  imageUrl: string;
  videoUrl?: string;
  format: 'post' | 'story' | 'reel' | 'carousel';
  pillar: string;
  createdAt: Date;
  supabaseUrl?: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  result?: ContentResult;
  status?: 'thinking' | 'generating' | 'done' | 'error';
}

export interface NemoSession {
  sessionId: string;
  taskId: string;
}

// ============================================================
// BRAND CONFIG
// ============================================================

export const BRAND = {
  primary: '#467a49',
  secondary: '#d16806',
  accent: '#e6a919',
  background: '#fefcf8',
  text: '#1a1a1a',
  gold: '#e8b571',
  fonts: {
    display: 'Playfair Display',
    body: 'Outfit',
    mono: 'JetBrains Mono',
  },
  pillars: [
    { id: 'vilcabamba', label: 'El Valle de Vilcabamba', icon: '🌿', color: '#467a49' },
    { id: 'coaching', label: 'Sanación y Coaching', icon: '✨', color: '#d16806' },
    { id: 'retiros', label: 'Retiros y Experiencias', icon: '🏔️', color: '#e6a919' },
    { id: 'daily', label: 'Vida Diaria', icon: '🌅', color: '#e8b571' },
    { id: 'dach', label: 'Educación DACH', icon: '📚', color: '#155336' },
  ]
};

// ============================================================
// CONTENT AGENT SERVICE
// ============================================================

class ContentAgentService {
  private nemoSession: NemoSession | null = null;
  private isInitialized = false;

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      console.log('🔄 Initializing Content Agent...');
      const credits = await this.checkCredits();
      console.log(`💳 NEMO Credits available: ${credits.available}`);
      this.isInitialized = true;
      console.log('✅ Content Agent ready');
    } catch (error) {
      console.error('❌ Agent init failed:', error);
      // Still mark as ready for demo mode
      this.isInitialized = true;
    }
  }

  // ============================================================
  // NEMO API - VIDEO EDITING
  // ============================================================

  private async createNemoSession(): Promise<NemoSession> {
    const response = await fetch(`${NEMO_API}/api/tasks/me/with-session/nemo_agent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NEMO_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task_name: 'nicola-content',
        language: 'es',
      }),
    });

    if (!response.ok) throw new Error(`Session failed: ${response.status}`);
    const data = await response.json();
    this.nemoSession = { sessionId: data.session_id, taskId: data.task_id };
    return this.nemoSession;
  }

  async sendNemoMessage(message: string): Promise<string> {
    if (!this.nemoSession) await this.createNemoSession();

    const response = await fetch(`${NEMO_API}/run_sse`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NEMO_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        app_name: 'nemo_agent',
        user_id: 'me',
        session_id: this.nemoSession!.sessionId,
        new_message: { parts: [{ text: message }] },
      }),
    });

    if (!response.ok) throw new Error(`NEMO message failed: ${response.status}`);

    // Read SSE stream
    const reader = response.body?.getReader();
    if (!reader) return 'processing';

    let result = '';
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.startsWith('data:'));
      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(5));
          if (data.text) result += data.text;
        } catch {}
      }
    }
    return result || 'processing';
  }

  async uploadVideo(file: File): Promise<string> {
    if (!this.nemoSession) await this.createNemoSession();

    const formData = new FormData();
    formData.append('files', file);

    const response = await fetch(
      `${NEMO_API}/api/upload-video/nemo_agent/me/${this.nemoSession!.sessionId}`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${NEMO_TOKEN}` },
        body: formData,
      }
    );

    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    const data = await response.json();
    return data.url || 'uploaded';
  }

  async checkCredits(): Promise<{ available: number; total: number }> {
    try {
      const response = await fetch(`${NEMO_API}/api/credits/balance/simple`, {
        headers: { 'Authorization': `Bearer ${NEMO_TOKEN}` },
      });
      const data = await response.json();
      return { available: data.available || 0, total: data.total || 0 };
    } catch {
      return { available: 0, total: 0 };
    }
  }

  async getNemoState(): Promise<any> {
    if (!this.nemoSession) return { error: 'No session' };
    const response = await fetch(
      `${NEMO_API}/api/state/nemo_agent/me/${this.nemoSession.sessionId}/latest`,
      { headers: { 'Authorization': `Bearer ${NEMO_TOKEN}` } }
    );
    return response.json();
  }

  // ============================================================
  // SUPABASE STORAGE
  // ============================================================

  async uploadToSupabase(file: File | Blob, folder: 'images' | 'videos' | 'designs'): Promise<string> {
    const timestamp = Date.now();
    const ext = file instanceof File ? file.name.split('.').pop() || 'png' : 'png';
    const fileName = `${folder}/${timestamp}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

    const formData = new FormData();
    formData.append('file', file, fileName);

    // Use Supabase REST API
    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${fileName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: formData,
      }
    );

    if (!response.ok) throw new Error(`Supabase upload failed: ${response.status}`);

    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${fileName}`;
  }

  async listSupabaseAssets(folder: string): Promise<any[]> {
    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/list/${SUPABASE_BUCKET}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefix: folder, limit: 100 }),
      }
    );
    const data = await response.json();
    return data || [];
  }

  // ============================================================
  // CONTENT GENERATION (AI-assisted)
  // ============================================================

  async generateContent(request: ContentRequest): Promise<ContentResult> {
    const id = `content_${Date.now()}`;

    // Build prompt for NEMO
    const pillarInfo = BRAND.pillars.find(p => p.id === request.pillar);
    const nemoPrompt = this.buildPrompt(request, pillarInfo);

    // Try NEMO first
    try {
      const nemoResponse = await this.sendNemoMessage(nemoPrompt);
      return this.parseNemoResponse(id, nemoResponse, request);
    } catch (error) {
      console.warn('NEMO failed, using fallback:', error);
      return this.generateFallback(id, request);
    }
  }

  private buildPrompt(request: ContentRequest, pillar: typeof BRAND.pillars[0] | undefined): string {
    const langMap = { es: 'Spanish', de: 'German', en: 'English' };
    const lang = langMap[request.language || 'de'] || 'German';
    const formatMap = { post: '1080x1080 Instagram post', story: '1080x1920 Instagram story', reel: '1080x1920 Instagram reel', carousel: '1080x1350 Instagram carousel' };
    const format = formatMap[request.format || request.type] || '1080x1080';

    return `Create content for Nicola Schaefer brand.
Pillar: ${pillar?.label || request.pillar}
Format: ${format}
Language: ${lang}
Prompt: ${request.prompt}
Style: Premium, wellness, natural, Vilcabamba-inspired
Colors: Primary #467a49 (green), Accent #d16806 (orange), Gold #e8b571
Fonts: Playfair Display for headers, Outfit for body text

Generate:
1. A visual design concept
2. Caption in ${lang}
3. Hashtags relevant to ${pillar?.label || request.pillar}`;
  }

  private parseNemoResponse(id: string, response: string, request: ContentRequest): ContentResult {
    // Try to extract structured data from NEMO response
    try {
      const parsed = JSON.parse(response);
      return {
        id,
        type: request.type === 'reel' ? 'video' : 'image',
        title: parsed.title || request.prompt.slice(0, 40),
        caption: parsed.caption || response.slice(0, 200),
        captionDE: parsed.captionDE,
        imageUrl: parsed.imageUrl || parsed.image_url || '',
        videoUrl: parsed.videoUrl || parsed.video_url,
        format: request.type,
        pillar: request.pillar,
        createdAt: new Date(),
      };
    } catch {
      return this.generateFallback(id, request);
    }
  }

  private generateFallback(id: string, request: ContentRequest): ContentResult {
    const templates: Record<string, { title: string; caption: string; captionDE: string; image: string }> = {
      vilcabamba: {
        title: 'Vilcabamba Magic',
        caption: '🌿 Donde la naturaleza encuentra tu paz interior\n\n#vilcabamba #ecuador #wellness #natural',
        captionDE: '🌿 Wo die Natur deinen inneren Frieden findet\n\n#vilcabamba #ecuador #wellness #natur',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      },
      coaching: {
        title: 'Coaching Insight',
        caption: '✨ Cada paso cuenta en tu camino de sanación\n\n#coaching #sanación #wellness #mindfulness',
        captionDE: '✨ Jeder Schritt zählt auf deinem Heilungsweg\n\n#coaching #heilung #wellness #mindfulness',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      },
      retiros: {
        title: 'Retiro Experience',
        caption: '🏔️ Transforma tu vida en Vilcabamba\n\n#retiro #yoga #vilcabamba #experiencia',
        captionDE: '🏔️ Verändere dein Leben in Vilcabamba\n\n#retreat #yoga #vilcabamba #erlebnis',
        image: 'https://images.unsplash.com/photo-1517836357463-d25bfe6c56c0?w=800',
      },
      daily: {
        title: 'Daily Moment',
        caption: '🌅 Momentos que inspiran\n\n#vidadiaria #vilcabamba #inspiración',
        captionDE: '🌅 Momente die inspirieren\n\n#alltag #vilcabamba #inspiration',
        image: 'https://images.unsplash.com/photo-1507400492013-162706c8d05e?w=800',
      },
      dach: {
        title: 'DACH Education',
        caption: '📚 Wissen verbindet\n\n#bildung #dach #deutschland #wellness',
        captionDE: '📚 Wissen verbindet\n\n#bildung #dach #deutschland #wellness',
        image: 'https://images.unsplash.com/photo-1545389336-cf09069591e5?w=800',
      },
    };

    const template = templates[request.pillar] || templates.vilcabamba;

    return {
      id,
      type: request.type === 'reel' ? 'video' : 'image',
      title: template.title,
      caption: template.caption,
      captionDE: template.captionDE,
      imageUrl: template.image,
      format: request.type,
      pillar: request.pillar,
      createdAt: new Date(),
    };
  }

  // ============================================================
  // WHATSAPP APPROVAL
  // ============================================================

  async sendToWhatsApp(result: ContentResult, phoneNumber: string = '+573054636733'): Promise<{ success: boolean; message: string }> {
    const message = `🎨 *Nuevo contenido: ${result.title}*

📐 Formato: ${result.format.toUpperCase()}
🏷️ Pilar: ${BRAND.pillars.find(p => p.id === result.pillar)?.label || result.pillar}

📝 Caption:
${result.captionDE || result.caption}

${result.videoUrl ? `🎬 Video: ${result.videoUrl}` : `🖼️ Imagen: ${result.imageUrl}`}

━━━━━━━━━━━━━━━
¿Aprobar para publicar? Responde SÍ o NO`;

    try {
      await navigator.clipboard.writeText(message);
      return { success: true, message: 'Mensaje copiado al portapapeles' };
    } catch {
      return { success: false, message: 'Error al copiar' };
    }
  }

  // ============================================================
  // STATUS
  // ============================================================

  getStatus() {
    return {
      ready: this.isInitialized,
      nemoSession: this.nemoSession?.sessionId || null,
      services: {
        nemo: NEMO_TOKEN ? 'configured' : 'missing',
        supabase: SUPABASE_URL ? 'configured' : 'missing',
      },
    };
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const contentAgentService = new ContentAgentService();