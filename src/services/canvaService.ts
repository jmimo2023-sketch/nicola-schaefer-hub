/**
 * Enhanced Canva Service with Brand Templates and Video Support
 * Uses Canva Design Button SDK v2
 */

declare const Canva: any;

const CANVA_API_KEY = import.meta.env.VITE_CANVA_API_KEY;

let canvaApi: any = null;

// Brand configuration - customize these for Nicola's brand
export const BRAND_CONFIG = {
  name: 'Nicola Schaefer',
  colors: {
    primary: '#467a49',      // Green accent
    secondary: '#d16806',    // Orange/amber
    background: '#fefcf8',   // Paper
    text: '#1a1a1a',         // Ink
  },
  fonts: {
    display: 'Cormorant Garamond',
    body: 'Outfit',
  },
};

// Supported design types
export type DesignType =
  | 'instagram_post'
  | 'instagram_story'
  | 'instagram_reel'
  | 'facebook_post'
  | 'facebook_cover'
  | 'twitter_post'
  | 'linkedin_post'
  | 'youtube_thumbnail'
  | 'youtube_shorts'
  | 'presentation_wide'
  | 'custom';

export interface DesignConfig {
  type: DesignType;
  title?: string;
  dimensions?: { width: number; height: number };
}

export interface PublishedDesign {
  exportUrl: string;
  designId: string;
  designTitle: string;
  exportWidth?: number;
  exportHeight?: number;
}

// Design type to dimensions mapping
const DESIGN_DIMENSIONS: Record<DesignType, { width: number; height: number }> = {
  instagram_post: { width: 1080, height: 1080 },
  instagram_story: { width: 1080, height: 1920 },
  instagram_reel: { width: 1080, height: 1920 },
  facebook_post: { width: 1200, height: 630 },
  facebook_cover: { width: 820, height: 312 },
  twitter_post: { width: 1600, height: 900 },
  linkedin_post: { width: 1200, height: 627 },
  youtube_thumbnail: { width: 1280, height: 720 },
  youtube_shorts: { width: 1080, height: 1920 },
  presentation_wide: { width: 1920, height: 1080 },
  custom: { width: 1080, height: 1080 },
};

/**
 * Initialize Canva SDK
 */
export async function initCanva(): Promise<void> {
  if (canvaApi) return;

  if (!CANVA_API_KEY) {
    console.warn('Canva API key not configured. Set VITE_CANVA_API_KEY in .env');
    return;
  }

  return new Promise((resolve, reject) => {
    const maxAttempts = 50; // 5 seconds max
    let attempts = 0;

    const check = () => {
      if (typeof Canva !== 'undefined') {
        Canva.DesignButton.initialize({ apiKey: CANVA_API_KEY })
          .then((api: any) => {
            canvaApi = api;
            resolve();
          })
          .catch(reject);
      } else if (attempts >= maxAttempts) {
        reject(new Error('Canva SDK failed to load'));
      } else {
        attempts++;
        setTimeout(check, 100);
      }
    };
    check();
  });
}

/**
 * Check if Canva is available
 */
export function isCanvaAvailable(): boolean {
  return typeof Canva !== 'undefined' && canvaApi !== null;
}

/**
 * Create a design with image or video media
 */
export async function createDesignWithMedia(
  mediaUrl: string,
  type: DesignType = 'instagram_post',
  options?: {
    title?: string;
    onPublish?: (design: PublishedDesign) => void;
  }
): Promise<void> {
  await initCanva();

  if (!canvaApi) {
    throw new Error('Canva not initialized. Check API key configuration.');
  }

  const dimensions = DESIGN_DIMENSIONS[type];
  const isVideo = mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.mov') ||
                  mediaUrl.includes('video') || type.includes('reel') || type.includes('shorts');

  const media = isVideo
    ? [{ type: 'video', url: mediaUrl }]
    : [{ type: 'image', url: mediaUrl }];

  const designConfig: any = {
    designType: type,
    ...(options?.title && { title: options.title }),
    ...(dimensions && { dimensions }),
  };

  if (media.length > 0) {
    designConfig.media = media;
  }

  return new Promise((resolve, reject) => {
    canvaApi
      .createDesign(designConfig)
      .then((design: any) => {
        if (options?.onPublish) {
          design.onDesignPublish((exportUrl: string, exportWidth: number, exportHeight: number) => {
            options.onPublish!({
              exportUrl,
              designId: design.id || 'unknown',
              designTitle: options.title || `Design ${type}`,
              exportWidth,
              exportHeight,
            });
          });
        }
        resolve();
      })
      .catch(reject);
  });
}

/**
 * Create a design from a Canva template
 * Note: Requires Canva Team/Enterprise for template access
 */
export async function createDesignFromTemplate(
  templateId: string,
  mediaUrls?: string[],
  options?: {
    title?: string;
    onPublish?: (design: PublishedDesign) => void;
  }
): Promise<void> {
  await initCanva();

  if (!canvaApi) {
    throw new Error('Canva not initialized');
  }

  const media = mediaUrls?.map((url, i) => ({
    type: url.endsWith('.mp4') || url.endsWith('.mov') ? 'video' : 'image',
    url,
  })) || [];

  const designConfig: any = {
    designType: 'custom',
    ...(options?.title && { title: options.title }),
  };

  if (media.length > 0) {
    designConfig.media = media;
  }

  // Note: createDesign doesn't directly support template IDs
  // This would need Canva Connect API for template management
  console.warn('Template creation requires Canva Connect API. Using default creation.');
  return createDesignWithMedia(mediaUrls?.[0] || '', 'custom', options);
}

/**
 * Open Canva editor with brand colors applied
 * Uses autofill feature if available
 */
export async function createBrandedDesign(
  type: DesignType,
  content: {
    title?: string;
    subtitle?: string;
    backgroundImage?: string;
    brandColor?: string;
  },
  onPublish?: (design: PublishedDesign) => void
): Promise<void> {
  await initCanva();

  const designConfig: any = {
    designType: type,
    title: content.title || `${BRAND_CONFIG.name} - ${type}`,
  };

  // Apply brand color as background if provided
  if (content.brandColor) {
    designConfig.backgroundColor = content.brandColor;
  }

  return new Promise((resolve, reject) => {
    canvaApi
      ?.createDesign(designConfig)
      .then((design: any) => {
        if (onPublish) {
          design.onDesignPublish((exportUrl: string) => {
            onPublish({
              exportUrl,
              designId: design.id || 'unknown',
              designTitle: content.title || type,
            });
          });
        }
        resolve();
      })
      .catch(reject);
  });
}

/**
 * Get available design types
 */
export function getDesignTypes(): { id: DesignType; label: string; category: string }[] {
  return [
    // Instagram
    { id: 'instagram_post', label: 'Instagram Post', category: 'Instagram' },
    { id: 'instagram_story', label: 'Instagram Story', category: 'Instagram' },
    { id: 'instagram_reel', label: 'Instagram Reel Cover', category: 'Instagram' },
    // Facebook
    { id: 'facebook_post', label: 'Facebook Post', category: 'Facebook' },
    { id: 'facebook_cover', label: 'Facebook Cover', category: 'Facebook' },
    // Twitter
    { id: 'twitter_post', label: 'Twitter Post', category: 'Twitter/X' },
    // LinkedIn
    { id: 'linkedin_post', label: 'LinkedIn Post', category: 'LinkedIn' },
    // YouTube
    { id: 'youtube_thumbnail', label: 'YouTube Thumbnail', category: 'YouTube' },
    { id: 'youtube_shorts', label: 'YouTube Shorts', category: 'YouTube' },
    // Other
    { id: 'presentation_wide', label: 'Presentation (16:9)', category: 'Other' },
    { id: 'custom', label: 'Custom Size', category: 'Other' },
  ];
}

/**
 * Export types for the Studio panel
 */
export const EXPORT_FORMATS = {
  image: ['PNG', 'JPG', 'PDF', 'WEBP'],
  video: ['MP4', 'MOV'],
} as const;

export type ExportFormat = typeof EXPORT_FORMATS.image[number] | typeof EXPORT_FORMATS.video[number];

/**
 * Search for stock images in Canva
 * Returns an array of image URLs that can be used in designs
 */
export async function searchCanvaStockImages(query: string): Promise<string[]> {
  await initCanva();

  if (!canvaApi) {
    throw new Error('Canva not initialized');
  }

  // Canva's Design Button SDK supports stock image search
  // Note: This feature may require specific Canva API permissions
  try {
    // This would use Canva's stock API if available
    // For now, return empty - actual implementation depends on Canva API capabilities
    console.warn('Canva stock search requires additional API configuration');
    return [];
  } catch (err) {
    console.error('Canva stock search error:', err);
    return [];
  }
}

/**
 * Open Canva's built-in image picker
 * Allows user to select images from Canva's library
 * Returns the selected image URL
 */
export async function openCanvaImagePicker(): Promise<string | null> {
  await initCanva();

  if (!canvaApi) {
    throw new Error('Canva not initialized');
  }

  return new Promise((resolve) => {
    // Canva Design Button supports image picker
    // The user can select from their Canva library or stock images
    if (canvaApi.createDesign) {
      // Open a minimal design to access Canva's image picker
      canvaApi.createDesign({
        designType: 'instagram_post',
        onDesignPublish: (exportUrl: string) => {
          // User cancelled or selected
          resolve(exportUrl || null);
        },
        onDesignClose: () => {
          resolve(null);
        },
      }).catch(() => {
        resolve(null);
      });
    } else {
      resolve(null);
    }
  });
}

/**
 * Create design with Canva image picker integration
 * Opens Canva with ability to browse and select images
 */
export async function createDesignWithCanvaAssets(
  type: DesignType,
  options?: {
    title?: string;
    onPublish?: (design: PublishedDesign) => void;
  }
): Promise<void> {
  await initCanva();

  if (!canvaApi) {
    throw new Error('Canva not initialized');
  }

  return new Promise((resolve, reject) => {
    canvaApi
      .createDesign({
        designType: type,
        title: options?.title || `Design - ${type}`,
        // This opens Canva with the ability to add images from Canva library
        onDesignPublish: (exportUrl: string, exportWidth: number, exportHeight: number) => {
          if (options?.onPublish) {
            options.onPublish({
              exportUrl,
              designId: 'canva-asset',
              designTitle: options.title || type,
              exportWidth,
              exportHeight,
            });
          }
          resolve();
        },
      })
      .then(() => resolve())
      .catch(reject);
  });
}
