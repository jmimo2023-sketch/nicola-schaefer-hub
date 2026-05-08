/**
 * Design Studio Panel with Auto-Save to Supabase
 * 
 * This modified version automatically saves designs to Supabase
 * when you export, and sends a notification to WhatsApp.
 * 
 * To integrate:
 * 1. Add this import to DesignStudioPanel.tsx:
 *    import { DesignStudioAutoSave } from './DesignStudioAutoSave';
 * 
 * 2. Replace the exportToFormat function with the wrapped version
 */

import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const BUCKET = 'nicola-assets';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase not configured for auto-save. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    return null;
  }
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

export interface DesignMetadata {
  projectName: string;
  format: string;
  width: number;
  height: number;
  createdAt: string;
  pillar?: string;
  caption?: string;
}

/**
 * Upload image data URL to Supabase
 */
export async function uploadDesignToSupabase(
  dataUrl: string,
  metadata: DesignMetadata,
  format: 'png' | 'jpg'
): Promise<{ url: string; id: string } | null> {
  try {
    const client = getSupabase();
    
    // Convert dataUrl to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    const timestamp = Date.now();
    const safeName = metadata.projectName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const fileName = `designs/${timestamp}-${safeName}.${format}`;
    
    console.log('📤 Uploading to Supabase:', fileName);
    
    const { data, error } = await client.storage
      .from(BUCKET)
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: `image/${format}`,
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      return null;
    }

    const { data: urlData } = client.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    console.log('✅ Uploaded:', urlData.publicUrl);
    return { url: urlData.publicUrl, id: data.id };
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    return null;
  }
}

/**
 * Generate WhatsApp message for design review
 */
export function generateDesignWhatsAppMessage(
  designUrl: string,
  metadata: DesignMetadata
): string {
  return `🎨 *Nuevo Diseño: ${metadata.projectName}*

📐 Formato: ${metadata.format} (${metadata.width}×${metadata.height})
📅 Fecha: ${new Date(metadata.createdAt).toLocaleDateString('es-ES')}
${metadata.pillar ? `🏷️ Pilar: ${metadata.pillar}` : ''}

${metadata.caption || ''}

📎 Ver diseño: ${designUrl}

━━━━━━━━━━━━━━━
¿Aprobar para publicar?

Responde:
✅ "OK" → Publicar
📝 "Cambios" + nota → Solicitar cambios`;
}

/**
 * Wrapped export function with auto-save
 */
export async function exportWithAutoSave(
  originalExportFn: () => Promise<void>,
  dataUrl: string,
  metadata: DesignMetadata,
  format: 'png' | 'jpg'
): Promise<{ success: boolean; url?: string }> {
  try {
    // First, do the original export (download)
    await originalExportFn();
    
    // Then upload to Supabase
    const result = await uploadDesignToSupabase(dataUrl, metadata, format);
    
    if (result) {
      toast.success('💾 Guardado en Supabase', {
        description: 'Listo para revisión',
        action: {
          label: 'Copiar link',
          onClick: () => navigator.clipboard.writeText(result.url),
        },
      });
      
      // Return the URL so the main component can send to WhatsApp
      return { success: true, url: result.url };
    }
    
    return { success: true }; // Export worked even if upload failed
    
  } catch (error) {
    console.error('Export with auto-save failed:', error);
    return { success: false };
  }
}

/**
 * List all designs from Supabase
 */
export async function listDesignsFromSupabase(): Promise<any[]> {
  try {
    const client = getSupabase();
    const { data, error } = await client.storage
      .from(BUCKET)
      .list('designs', { limit: 50 });

    if (error) {
      console.error('List designs error:', error);
      return [];
    }

    return (data || [])
      .filter(f => f.name.match(/\.(png|jpg|jpeg)$/))
      .map(f => ({
        name: f.name,
        id: f.id,
        createdAt: f.created_at,
        url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/designs/${f.name}`
      }));
  } catch (error) {
    console.error('List designs failed:', error);
    return [];
  }
}
