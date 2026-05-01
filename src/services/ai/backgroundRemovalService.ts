/**
 * Background Removal Service
 * Uses @imgly/background-removal for browser-based AI background removal
 * 100% free, runs entirely in browser using WebAssembly/WebGPU
 */

export interface BackgroundRemovalOptions {
  progress?: (progress: number) => void;
  publicPath?: string;
  output?: {
    format?: 'image/png' | 'image/jpeg' | 'image/webp';
    quality?: number;
    type?: 'foreground' | 'mask' | 'foreground-mask';
  };
}

class BackgroundRemovalService {
  private isModelReady: boolean = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the background removal model
   */
  async init(): Promise<void> {
    if (this.isModelReady) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Check WebGL/WebGPU support
        if (!this.hasWebSupport()) {
          console.warn('WebGL/WebGPU not supported, background removal may not work');
        }

        // Pre-load the module
        await import('@imgly/background-removal');
        this.isModelReady = true;
      } catch (error) {
        console.error('Failed to initialize background removal:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Check if model is ready
   */
  async isReady(): Promise<boolean> {
    if (!this.isModelReady) {
      await this.init();
    }
    return this.isModelReady;
  }

  /**
   * Check browser WebGL/WebGPU support
   */
  private hasWebSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      const gpu = canvas.getContext('webgpu');
      return !!gl || !!gpu;
    } catch {
      return false;
    }
  }

  /**
   * Remove background from an image
   */
  async removeBackground(
    input: File | Blob | string,
    progressCallback?: (progress: number) => void,
    options: BackgroundRemovalOptions = {}
  ): Promise<Blob> {
    const fn = await loadRemoveBackground();

    // Build progress callback
    const progressHandler = (key: string, current: number, total: number) => {
      if (progressCallback) {
        let progress = 0;
        if (total > 0) {
          switch (key) {
            case 'fetching-onnx':
              progress = (current / total) * 40;
              break;
            case 'loading-onnx':
              progress = 40 + (current / total) * 30;
              break;
            case 'applying-mask':
              progress = 70 + (current / total) * 30;
              break;
          }
        }
        progressCallback(progress);
      }
    };

    try {
      let inputSource: HTMLImageElement | File | Blob | string = input;

      // If it's a string URL, convert to image element
      if (typeof input === 'string' && !input.startsWith('data:')) {
        inputSource = await loadImage(input);
      } else if (input instanceof Blob || input instanceof File) {
        inputSource = await loadImage(URL.createObjectURL(input));
      }

      const result = await fn(inputSource, {
        progress: progressHandler,
        publicPath: options.publicPath,
        output: options.output,
      });

      this.isModelReady = true;
      return result;
    } catch (error: any) {
      console.error('Background removal error:', error);

      if (error.message?.includes('WebGL') || error.message?.includes('WebGPU')) {
        throw new Error(
          'Your browser does not support WebGL/WebGPU which is required for background removal. ' +
          'Please try Chrome, Edge, or Firefox with hardware acceleration enabled.'
        );
      }

      throw new Error(`Background removal failed: ${error.message}`);
    }
  }

  /**
   * Remove background and return as data URL
   */
  async removeBackgroundAsDataUrl(
    input: File | Blob | string,
    progressCallback?: (progress: number) => void,
    format: 'png' | 'jpeg' | 'webp' = 'png'
  ): Promise<string> {
    const blob = await this.removeBackground(input, progressCallback, {
      output: { format: `image/${format}`, quality: 0.9 },
    });

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Remove background and download directly
   */
  async removeBackgroundAndDownload(
    input: File | Blob | string,
    filename: string = 'no-background.png',
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    const blob = await this.removeBackground(input, progressCallback);
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Replace background with solid color or image
   */
  async replaceBackground(
    input: File | Blob | string,
    replacement: { type: 'color'; value: string } | { type: 'image'; value: string },
    progressCallback?: (progress: number) => void
  ): Promise<Blob> {
    const foregroundBlob = await this.removeBackground(input, (p) => {
      if (progressCallback) progressCallback(p * 0.7);
    });

    const foregroundUrl = URL.createObjectURL(foregroundBlob);
    const foreground = await loadImage(foregroundUrl);

    const canvas = document.createElement('canvas');
    canvas.width = foreground.naturalWidth;
    canvas.height = foreground.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    if (replacement.type === 'color') {
      ctx.fillStyle = replacement.value;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const replacementImg = await loadImage(replacement.value);
      ctx.drawImage(replacementImg, 0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(foreground, 0, 0);
    URL.revokeObjectURL(foregroundUrl);

    if (progressCallback) progressCallback(100);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        'image/png',
        1.0
      );
    });
  }
}

// Helper to load removeBackground function dynamically
let removeBackgroundFn: any = null;

async function loadRemoveBackground(): Promise<any> {
  if (removeBackgroundFn) return removeBackgroundFn;
  const module = await import('@imgly/background-removal');
  removeBackgroundFn = module.default;
  return removeBackgroundFn;
}

// Helper to load image from URL
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

export const backgroundRemovalService = new BackgroundRemovalService();
