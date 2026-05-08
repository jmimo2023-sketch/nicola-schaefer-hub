/**
 * Content Pipeline Hook — Connects Generator → Calendar in 1 click
 * "Schedule this" button that takes AI-generated content and creates a calendar item
 */

import { useState, useCallback } from 'react';
import { contentWorkflow, type ContentItem, type ContentType, type ContentPillar, type ContentStatus } from './contentWorkflowService';
import { assetLibrary } from './assetLibraryService';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface GeneratedContent {
  caption: string;
  hashtags: string[];
  type: ContentType;
  pillar: ContentPillar;
  assetUrls?: string[];
  aiPrompt?: string;
}

export interface PipelineResult {
  success: boolean;
  item?: ContentItem;
  error?: string;
}

// ============================================================================
// CONTENT PIPELINE HOOK
// ============================================================================

export function useContentPipeline() {
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Take generated content and create a draft calendar item
   */
  const createDraft = useCallback(async (content: GeneratedContent): Promise<PipelineResult> => {
    setIsCreating(true);
    try {
      const item = await contentWorkflow.create({
        title: content.caption.slice(0, 60) + (content.caption.length > 60 ? '...' : ''),
        description: '',
        type: content.type,
        pillar: content.pillar,
        status: 'draft',
        caption: content.caption,
        hashtags: content.hashtags,
        assetIds: [],
        assetUrls: content.assetUrls || [],
        scheduledDate: '',
        scheduledTime: '',
        timezone: 'Europe/Berlin',
        generatedBy: 'ai',
        aiPrompt: content.aiPrompt,
        tags: [content.pillar, content.type],
      });

      toast.success('Draft created! Find it in your Calendar.');
      return { success: true, item };
    } catch (error: any) {
      console.error('Failed to create draft:', error);
      toast.error('Failed to create draft: ' + (error.message || 'Unknown error'));
      return { success: false, error: error.message };
    } finally {
      setIsCreating(false);
    }
  }, []);

  /**
   * Take generated content and schedule it directly
   */
  const scheduleDirect = useCallback(async (
    content: GeneratedContent,
    date: string,
    time: string
  ): Promise<PipelineResult> => {
    setIsCreating(true);
    try {
      const item = await contentWorkflow.create({
        title: content.caption.slice(0, 60) + (content.caption.length > 60 ? '...' : ''),
        description: '',
        type: content.type,
        pillar: content.pillar,
        status: 'scheduled',
        caption: content.caption,
        hashtags: content.hashtags,
        assetIds: [],
        assetUrls: content.assetUrls || [],
        scheduledDate: date,
        scheduledTime: time,
        timezone: 'Europe/Berlin',
        generatedBy: 'ai',
        aiPrompt: content.aiPrompt,
        tags: [content.pillar, content.type],
      });

      toast.success(`Scheduled for ${date} at ${time}!`);
      return { success: true, item };
    } catch (error: any) {
      console.error('Failed to schedule:', error);
      toast.error('Failed to schedule: ' + (error.message || 'Unknown error'));
      return { success: false, error: error.message };
    } finally {
      setIsCreating(false);
    }
  }, []);

  /**
   * Quick create from generator output
   */
  const quickCreate = useCallback(async (
    caption: string,
    type: ContentType = 'post',
    pillar: ContentPillar = 'emotional_mastery',
    hashtags: string[] = []
  ): Promise<PipelineResult> => {
    return createDraft({
      caption,
      hashtags,
      type,
      pillar,
      generatedBy: 'ai',
    });
  }, [createDraft]);

  return {
    isCreating,
    createDraft,
    scheduleDirect,
    quickCreate,
  };
}