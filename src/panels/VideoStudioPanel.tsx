/**
 * Video Studio Panel - AI-powered video editing
 * Merges: VideoEditingPanel (standalone) + future Whisper/FFmpeg.wasm integration
 * 
 * Handles: Upload, edit, highlight selection, subtitles, captions, export
 */

import React from 'react';
import { VideoEditingPanel } from './VideoEditingPanel';

export function VideoStudioPanel() {
  return (
    <div className="w-full h-full">
      <VideoEditingPanel />
    </div>
  );
}