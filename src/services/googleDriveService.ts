/**
 * Service to upload files directly to Google Drive using the Drive API v3.
 * Uses the OAuth2 token from Google authentication.
 */

import { getGoogleAccessToken } from './googleAssetsService';

/**
 * Upload a file to Google Drive
 * Returns the webContentLink (download URL) and the file metadata
 */
export async function uploadToGoogleDrive(
  file: File,
  folderId?: string
): Promise<{
  id: string;
  name: string;
  webContentLink: string;
  webViewLink: string;
  mimeType: string;
  size: number;
}> {
  const accessToken = await getGoogleAccessToken();

  // Build multipart request body
  const metadata = {
    name: file.name,
    mimeType: file.type,
    ...(folderId && { parents: [folderId] }),
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webContentLink,webViewLink,mimeType,size',
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
    throw new Error(`Google Drive upload failed: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Create a folder in Google Drive
 */
export async function createGoogleDriveFolder(name: string, parentFolderId?: string): Promise<string> {
  const accessToken = await getGoogleAccessToken();

  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentFolderId && { parents: [parentFolderId] }),
  };

  const response = await fetch(
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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create folder: ${error.error?.message || response.statusText}`);
  }

  const result = await response.json();
  return result.id;
}

/**
 * List files in a Google Drive folder
 */
export async function listGoogleDriveFiles(folderId?: string): Promise<any[]> {
  const accessToken = await getGoogleAccessToken();

  let query = "mimeType != 'application/vnd.google-apps.folder' and trashed = false";
  if (folderId) {
    query += ` and '${folderId}' in parents`;
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({
      q: query,
      fields: 'files(id,name,mimeType,webViewLink,size,createdTime,thumbnailLink)',
      pageSize: '100',
    })}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to list files: ${error.error?.message || response.statusText}`);
  }

  const result = await response.json();
  return result.files || [];
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFromGoogleDrive(fileId: string): Promise<void> {
  const accessToken = await getGoogleAccessToken();

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.json();
    throw new Error(`Failed to delete file: ${error.error?.message || response.statusText}`);
  }
}