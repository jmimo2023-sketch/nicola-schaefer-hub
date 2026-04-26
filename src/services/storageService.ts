/**
 * Unified storage service using Google Drive as the backend.
 * Handles local file uploads to Google Drive with a dedicated app folder.
 */

import { uploadToGoogleDrive, listGoogleDriveFiles, deleteFromGoogleDrive } from './googleDriveService';
import { getGoogleAccessToken } from './googleAssetsService';

const APP_FOLDER_NAME = 'Nicola Hub Assets';

// Cache for the app folder ID
let appFolderId: string | null = null;

/**
 * Get or create the app's dedicated folder in Google Drive
 */
async function getAppFolderId(): Promise<string> {
  if (appFolderId) return appFolderId;

  const accessToken = await getGoogleAccessToken();

  // Search for existing folder
  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (searchResponse.ok) {
    const result = await searchResponse.json();
    if (result.files && result.files.length > 0) {
      appFolderId = result.files[0].id;
      return appFolderId;
    }
  }

  // Create the folder
  const metadata = {
    name: APP_FOLDER_NAME,
    mimeType: 'application/vnd.google-apps.folder',
  };

  const createResponse = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!createResponse.ok) {
    throw new Error('Failed to create app folder in Google Drive');
  }

  const createResult = await createResponse.json();
  appFolderId = createResult.id;
  return appFolderId;
}

export interface UploadResult {
  id: string;           // Google Drive file ID
  name: string;         // Original filename
  url: string;          // Direct download URL for img src
  webViewLink: string;  // Web view link for sharing
  mimeType: string;
  size: number;
  source: 'local';
  folderId: string;
}

/**
 * Upload a local file to Google Drive under the app folder
 * Makes the file publicly viewable for img display
 */
export async function uploadAsset(userId: string, file: File): Promise<UploadResult> {
  const folderId = await getAppFolderId();

  const accessToken = await getGoogleAccessToken();

  // Build multipart request body
  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: [folderId],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Upload failed: ${error.error?.message || response.statusText}`);
  }

  const result = await response.json();

  // Make the file publicly accessible by changing permissions
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${result.id}/permissions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    }
  );

  // Direct download URL that works with <img src="">
  const directUrl = `https://drive.google.com/uc?export=view&id=${result.id}`;

  return {
    id: result.id,
    name: result.name,
    url: directUrl,
    webViewLink: result.webContentLink || `https://drive.google.com/file/d/${result.id}/view`,
    mimeType: result.mimeType,
    size: parseInt(result.size, 10),
    source: 'local',
    folderId,
  };
}

/**
 * List all assets uploaded by the current user from Google Drive
 */
export async function listUserAssets(): Promise<any[]> {
  const folderId = await getAppFolderId();
  return listGoogleDriveFiles(folderId);
}

/**
 * Delete an asset from Google Drive by file ID
 */
export async function deleteAsset(fileId: string): Promise<void> {
  await deleteFromGoogleDrive(fileId);
}