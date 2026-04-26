/**
 * Service to handle Canva integration via Design Button SDK.
 */

declare const Canva: any;

const CANVA_API_KEY = import.meta.env.VITE_CANVA_API_KEY;

let canvaApi: any = null;

/**
 * Initializes the Canva SDK
 */
export async function initCanva(): Promise<void> {
  if (canvaApi) return;
  
  return new Promise((resolve, reject) => {
    const check = async () => {
      if (typeof Canva !== 'undefined') {
        try {
          canvaApi = await Canva.DesignButton.initialize({
            apiKey: CANVA_API_KEY,
          });
          resolve();
        } catch (err) {
          reject(err);
        }
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

/**
 * Opens Canva editor with a media asset
 */
export async function createDesignWithMedia(imageUrl: string, type: 'instagram_post' | 'instagram_story' = 'instagram_post') {
  await initCanva();
  
  return canvaApi.createDesign({
    designType: type,
    media: [
      {
        type: 'image',
        url: imageUrl,
      }
    ],
    onDesignPublish: (exportUrl: string) => {
      console.log('Design published:', exportUrl);
      // Here you could save the published design URL back to your hub
    }
  });
}
