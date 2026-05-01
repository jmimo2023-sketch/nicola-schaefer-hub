/**
 * Canva Connect API Service
 * REST API integration for Canva Team/Enterprise
 * Docs: https://www.canva.com/developers/docs/connect/
 */

const CANVA_API_BASE = 'https://api.canva.com/rest/v1';
const CANVA_API_KEY = import.meta.env.VITE_CANVA_API_KEY;

export interface CanvaAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  url: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  size: number;
  created_at: string;
  updated_at: string;
}

export interface CanvaDesign {
  id: string;
  title: string;
  thumbnail?: { url: string };
  urls?: { edit_url: string; view_url: string };
  design_type?: { name: string };
  created_at: string;
  updated_at: string;
}

export interface CanvaBrandTemplate {
  id: string;
  name: string;
  thumbnail: { url: string };
  views: number;
  pages?: { count: number };
}

export interface CanvaExport {
  id: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  urls?: string[];
  error?: { code: string; message: string };
}

class CanvaConnectService {
  private apiKey: string;

  constructor() {
    this.apiKey = CANVA_API_KEY || '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Canva API key not configured. Set VITE_CANVA_API_KEY in .env');
    }

    const response = await fetch(`${CANVA_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Canva API error: ${response.status} - ${error.message || response.statusText}`);
    }

    return response.json();
  }

  // =========================================================================
  // ASSETS
  // =========================================================================

  /**
   * List assets from Canva
   */
  async listAssets(options?: {
    folder_id?: string;
    type?: 'image' | 'video' | 'document';
    limit?: number;
    cursor?: string;
  }): Promise<{ items: CanvaAsset[]; continuation?: string }> {
    const params = new URLSearchParams();
    if (options?.folder_id) params.append('folder_id', options.folder_id);
    if (options?.type) params.append('type', options.type);
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.cursor) params.append('continuation', options.cursor);

    const query = params.toString();
    return this.request(`/assets${query ? `?${query}` : ''}`);
  }

  /**
   * Upload asset to Canva
   */
  async uploadAsset(file: File | Blob, name: string, folderId?: string): Promise<CanvaAsset> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('asset', file);
    if (folderId) formData.append('folder_id', folderId);

    return this.request('/assets/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData
      },
    });
  }

  /**
   * Get asset by ID
   */
  async getAsset(assetId: string): Promise<CanvaAsset> {
    return this.request(`/assets/${assetId}`);
  }

  /**
   * Delete asset
   */
  async deleteAsset(assetId: string): Promise<void> {
    await this.request(`/assets/${assetId}`, { method: 'DELETE' });
  }

  // =========================================================================
  // DESIGNS
  // =========================================================================

  /**
   * Create a new design
   */
  async createDesign(options: {
    title?: string;
    design_type?: { type: string };
    asset_id?: string;
  }): Promise<CanvaDesign> {
    return this.request('/designs', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /**
   * List designs
   */
  async listDesigns(options?: {
    folder_id?: string;
    query?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ items: CanvaDesign[]; continuation?: string }> {
    const params = new URLSearchParams();
    if (options?.folder_id) params.append('folder_id', options.folder_id);
    if (options?.query) params.append('query', options.query);
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.cursor) params.append('continuation', options.cursor);

    const query = params.toString();
    return this.request(`/designs${query ? `?${query}` : ''}`);
  }

  /**
   * Get design by ID
   */
  async getDesign(designId: string): Promise<CanvaDesign> {
    return this.request(`/designs/${designId}`);
  }

  /**
   * Update design
   */
  async updateDesign(designId: string, options: { title?: string }): Promise<CanvaDesign> {
    return this.request(`/designs/${designId}`, {
      method: 'PUT',
      body: JSON.stringify(options),
    });
  }

  /**
   * Delete design
   */
  async deleteDesign(designId: string): Promise<void> {
    await this.request(`/designs/${designId}`, { method: 'DELETE' });
  }

  // =========================================================================
  // BRAND TEMPLATES
  // =========================================================================

  /**
   * List brand templates
   */
  async listBrandTemplates(options?: {
    query?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ items: CanvaBrandTemplate[]; continuation?: string }> {
    const params = new URLSearchParams();
    if (options?.query) params.append('query', options.query);
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.cursor) params.append('continuation', options.cursor);

    const query = params.toString();
    return this.request(`/brand-templates${query ? `?${query}` : ''}`);
  }

  /**
   * Get brand template
   */
  async getBrandTemplate(templateId: string): Promise<CanvaBrandTemplate> {
    return this.request(`/brand-templates/${templateId}`);
  }

  // =========================================================================
  // AUTOFILL
  // =========================================================================

  /**
   * Autofill a brand template with data
   */
  async autofillTemplate(
    templateId: string,
    data: Record<string, { type: 'text' | 'image'; value: string }>
  ): Promise<{ job_id: string }> {
    return this.request(`/brand-templates/${templateId}/autofills`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  /**
   * Get autofill job status
   */
  async getAutofillJobStatus(
    templateId: string,
    jobId: string
  ): Promise<{ status: 'pending' | 'in_progress' | 'success' | 'failed'; result?: CanvaDesign }> {
    return this.request(`/brand-templates/${templateId}/autofills/${jobId}`);
  }

  // =========================================================================
  // EXPORTS
  // =========================================================================

  /**
   * Create export job
   */
  async createExport(
    designId: string,
    format: 'png' | 'jpg' | 'pdf' | 'svg' | 'mp4' | 'mov'
  ): Promise<CanvaExport> {
    return this.request('/exports', {
      method: 'POST',
      body: JSON.stringify({
        design_id: designId,
        format: format.toUpperCase(),
      }),
    });
  }

  /**
   * Get export status
   */
  async getExport(exportId: string): Promise<CanvaExport> {
    return this.request(`/exports/${exportId}`);
  }

  /**
   * Wait for export to complete (poll)
   */
  async waitForExport(
    exportId: string,
    maxWaitMs: number = 60000,
    intervalMs: number = 2000
  ): Promise<CanvaExport> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const result = await this.getExport(exportId);

      if (result.status === 'success') {
        return result;
      }

      if (result.status === 'failed') {
        throw new Error(`Export failed: ${result.error?.message || 'Unknown error'}`);
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Export timed out');
  }

  // =========================================================================
  // STOCK IMAGES
  // =========================================================================

  /**
   * Search stock images
   */
  async searchStockImages(options: {
    query: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ items: { id: string; url: string; thumbnail_url: string }[]; continuation?: string }> {
    const params = new URLSearchParams();
    params.append('query', options.query);
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.cursor) params.append('continuation', options.cursor);

    return this.request(`/stock-images?${params.toString()}`);
  }

  // =========================================================================
  // FOLDERS
  // =========================================================================

  /**
   * List folders
   */
  async listFolders(parentId?: string): Promise<{ items: { id: string; name: string; parent_id?: string }[] }> {
    const params = parentId ? `?parent_id=${parentId}` : '';
    return this.request(`/folders${params}`);
  }

  /**
   * Create folder
   */
  async createFolder(name: string, parentId?: string): Promise<{ id: string; name: string }> {
    return this.request('/folders', {
      method: 'POST',
      body: JSON.stringify({ name, parent_id: parentId }),
    });
  }

  // =========================================================================
  // UTILITIES
  // =========================================================================

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!CANVA_API_KEY;
  }

  /**
   * Get design edit URL
   */
  getDesignEditUrl(designId: string): string {
    return `https://www.canva.com/design/${designId}/edit`;
  }

  /**
   * Get design view URL
   */
  getDesignViewUrl(designId: string): string {
    return `https://www.canva.com/design/${designId}/view`;
  }
}

export const canvaConnect = new CanvaConnectService();
