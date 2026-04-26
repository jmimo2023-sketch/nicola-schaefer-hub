/**
 * Service to handle Google Drive and Photos interaction via Google Picker API.
 */

declare const google: any;
declare const gapi: any;

import { currentAccessToken } from './firebase';

// Helper to get env variables with validation
const getClientId = () => import.meta.env.VITE_GOOGLE_CLIENT_ID;
const getApiKey = () => import.meta.env.VITE_GOOGLE_API_KEY;

// Scopes for Picker
const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/photoslibrary.readonly'
].join(' ');

let internalAccessToken: string | null = null;
let pickerApiLoaded = false;
let gsiLoaded = false;

/**
 * Explicitly set the token (e.g. from Firebase Login)
 */
export function setAccessToken(token: string | null) {
  internalAccessToken = token;
}

// Helper to get origin for Google Picker.
// In AI Studio, the Picker often requires 'https://aistudio.google.com' as origin
const getPickerOrigin = () => {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  
  // AIS specific origins
  if (hostname.includes('ais-dev') || hostname.includes('run.app') || window.location.origin.includes('aistudio.google.com')) {
    return 'https://aistudio.google.com';
  }
  return window.location.origin;
};

let initializationPromise: Promise<void> | null = null;

/**
 * Ensures script libraries are ready
 */
export async function initGoogleLibraries(): Promise<void> {
  if (initializationPromise) return initializationPromise;

  initializationPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      initializationPromise = null;
      reject(new Error('Google libraries load timeout'));
    }, 15000);

    const check = () => {
      if (typeof gapi !== 'undefined' && typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
        gapi.load('picker', { 
          callback: () => {
            clearTimeout(timeout);
            pickerApiLoaded = true;
            gsiLoaded = true;
            resolve();
          },
          onerror: (err: any) => {
            clearTimeout(timeout);
            initializationPromise = null;
            reject(new Error('Failed to load GAPI Picker: ' + err));
          }
        });
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  });
  return initializationPromise;
}

/**
 * Gets the access token, preferring the one from initial login
 */
export async function getGoogleAccessToken(): Promise<string> {
  // 1. Check if we already have a token
  if (internalAccessToken) return internalAccessToken;
  if (currentAccessToken) {
    internalAccessToken = currentAccessToken;
    return internalAccessToken;
  }
  
  // 2. Request a token using GIS
  await initGoogleLibraries();

  const clientId = getClientId();
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID missing.');
  }

  return new Promise((resolve, reject) => {
    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.access_token) {
            internalAccessToken = response.access_token;
            resolve(response.access_token);
          } else {
            console.error('GIS Error:', response);
            reject(new Error('Auth failed: ' + (response.error || 'Unknown')));
          }
        },
      });
      // If we are in an iframe (AI Studio), 'prompt: none' might fail due to 3rd party cookies
      // So we just request it. If they already granted it, the popup might just flicker or close quickly.
      client.requestAccessToken();
    } catch (err) {
      reject(new Error('GIS Init Error: ' + err));
    }
  });
}

/**
 * Opens the Google Picker to select images
 */
export async function openAssetPicker(): Promise<any[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('VITE_GOOGLE_API_KEY no encontrada.');
  }

  const token = await getGoogleAccessToken();
  const origin = getPickerOrigin();
  
  return new Promise((resolve, reject) => {
    try {
      console.log('DEBUG: Cargando Google Picker...', { origin });

      const docsView = new google.picker.DocsView(google.picker.ViewId.DOCS_IMAGES)
        .setIncludeFolders(true)
        .setMimeTypes('image/png,image/jpeg,image/jpg');

      const photosView = new google.picker.DocsView(google.picker.ViewId.PHOTOS)
        .setMimeTypes('image/png,image/jpeg,image/jpg');

      const picker = new google.picker.PickerBuilder()
        .addView(docsView)
        .addView(photosView)
        .setOAuthToken(token)
        .setDeveloperKey(apiKey)
        .setOrigin(origin)
        .setCallback((data: any) => {
          if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
            resolve(data[google.picker.Response.DOCUMENTS]);
          }
          if (data[google.picker.Response.ACTION] === google.picker.Action.CANCEL) {
            resolve([]);
          }
        })
        .build();
      
      picker.setVisible(true);
    } catch (err) {
      console.error('Error opening Picker:', err);
      reject(new Error('Failed to initialize Google Picker: ' + err));
    }
  });
}
