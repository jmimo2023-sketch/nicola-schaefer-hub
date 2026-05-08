/**
 * Make.com Automation Service — Webhooks for automated workflows
 * 
 * Make.com scenarios can:
 * - Auto-publish scheduled content at the right time
 * - Send WhatsApp/email notifications for approvals
 * - Cross-post to other platforms
 * - Track and sync metrics
 * 
 * Required env vars:
 * - VITE_MAKE_WEBHOOK_URL: Main webhook URL for triggering scenarios
 */

// ============================================================================
// TYPES
// ============================================================================

export type MakeEventType =
  | 'content.scheduled'
  | 'content.published'
  | 'content.failed'
  | 'content.approved'
  | 'content.needs_review'
  | 'analytics.daily_report'
  | 'analytics.weekly_report'
  | 'notification.whatsapp'
  | 'notification.email';

export interface MakeEvent {
  event: MakeEventType;
  timestamp: number;
  payload: Record<string, unknown>;
}

export interface MakeWebhookConfig {
  url: string;
  events: MakeEventType[];
  enabled: boolean;
}

// ============================================================================
// MAKE.COM SERVICE
// ============================================================================

const MAKE_WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL || '';

export const makeAutomation = {

  /**
   * Trigger a Make.com scenario via webhook
   */
  async trigger(event: MakeEventType, payload: Record<string, unknown>): Promise<boolean> {
    if (!MAKE_WEBHOOK_URL) {
      console.warn('Make.com webhook URL not configured. Set VITE_MAKE_WEBHOOK_URL.');
      return false;
    }

    try {
      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          timestamp: Date.now(),
          payload,
        } as MakeEvent),
      });

      return response.ok;
    } catch (error) {
      console.error('Make.com webhook failed:', error);
      return false;
    }
  },

  /**
   * Content scheduled — trigger auto-publish workflow
   */
  async contentScheduled(item: {
    id: string;
    title: string;
    type: string;
    caption: string;
    scheduledDate: string;
    scheduledTime: string;
    assetUrls: string[];
    pillar: string;
    authorId: string;
  }): Promise<boolean> {
    return this.trigger('content.scheduled', item);
  },

  /**
   * Content published — notify and update
   */
  async contentPublished(item: {
    id: string;
    permalink: string;
    publishedAt: number;
    type: string;
  }): Promise<boolean> {
    return this.trigger('content.published', item);
  },

  /**
   * Content failed — alert
   */
  async contentFailed(item: {
    id: string;
    error: string;
    type: string;
  }): Promise<boolean> {
    return this.trigger('content.failed', item);
  },

  /**
   * Content needs review — send approval notification
   */
  async contentNeedsReview(item: {
    id: string;
    title: string;
    type: string;
    caption: string;
    authorId: string;
  }): Promise<boolean> {
    return this.trigger('content.needs_review', item);
  },

  /**
   * Content approved — ready to publish
   */
  async contentApproved(item: {
    id: string;
    title: string;
    approvedBy: string;
  }): Promise<boolean> {
    return this.trigger('content.approved', item);
  },

  /**
   * Send WhatsApp notification
   */
  async sendWhatsApp(to: string, message: string, data?: Record<string, unknown>): Promise<boolean> {
    return this.trigger('notification.whatsapp', {
      to,
      message,
      ...data,
    });
  },

  /**
   * Send email notification
   */
  async sendEmail(to: string, subject: string, body: string, data?: Record<string, unknown>): Promise<boolean> {
    return this.trigger('notification.email', {
      to,
      subject,
      body,
      ...data,
    });
  },

  /**
   * Request daily analytics report
   */
  async requestDailyReport(igUserId: string): Promise<boolean> {
    return this.trigger('analytics.daily_report', { igUserId });
  },

  /**
   * Request weekly analytics report
   */
  async requestWeeklyReport(igUserId: string): Promise<boolean> {
    return this.trigger('analytics.weekly_report', { igUserId });
  },

  /**
   * Check if Make.com is configured
   */
  isConfigured(): boolean {
    return !!MAKE_WEBHOOK_URL;
  },
};