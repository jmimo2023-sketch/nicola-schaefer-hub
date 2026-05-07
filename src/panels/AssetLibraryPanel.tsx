/**
 * Asset Library Panel - Media management
 * Merges: StudioPanel (asset library) + future semantic search
 * 
 * Browse, upload, and manage photos, videos, templates, and brand assets.
 */

import React from 'react';
import { StudioPanel } from './StudioPanel';

export function AssetLibraryPanel() {
  return (
    <div className="w-full">
      <StudioPanel />
    </div>
  );
}