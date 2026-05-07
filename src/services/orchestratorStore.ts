/**
 * HubNick Orchestrator Store
 * Central state management for the multi-agent system
 * Coordinates Content, Creative, Analytics, and Scheduler agents
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export type AgentId = 'orchestrator' | 'content' | 'creative' | 'analytics' | 'scheduler';
export type TaskStatus = 'idle' | 'pending' | 'running' | 'completed' | 'failed';
export type ContentStatus = 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'failed';

export interface AgentTask {
  id: string;
  agent: AgentId;
  type: string;
  description: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  result?: any;
  error?: string;
}

export interface ContentItem {
  id: string;
  type: 'post' | 'story' | 'reel' | 'carousel';
  status: ContentStatus;
  title: string;
  caption?: string;
  captionDE?: string;
  imageUrl?: string;
  videoUrl?: string;
  scheduledDate?: string;
  publishedDate?: string;
  pillar?: string;
  hashtags?: string[];
  agentSource: AgentId;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentState {
  id: AgentId;
  status: 'idle' | 'busy' | 'error';
  lastActivity: Date | null;
  currentTask: string | null;
  message: string;
}

export interface OrchestratorState {
  // Agent states
  agents: Record<AgentId, AgentState>;
  
  // Content pipeline
  contentItems: ContentItem[];
  
  // Task queue
  tasks: AgentTask[];
  
  // Active agent
  activeAgent: AgentId;
  
  // Notifications
  notifications: OrchestratorNotification[];
  
  // Settings
  autoPublish: boolean;
  autoSaveInterval: number; // minutes
  brandVoice: string;
  preferredLanguage: 'es' | 'de' | 'en';
}

export interface OrchestratorNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  agent: AgentId;
  timestamp: Date;
  read: boolean;
}

interface OrchestratorActions {
  // Agent management
  setAgentStatus: (id: AgentId, status: AgentState['status'], message?: string) => void;
  setActiveAgent: (id: AgentId) => void;
  
  // Task management
  addTask: (task: Omit<AgentTask, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => string;
  updateTask: (id: string, updates: Partial<AgentTask>) => void;
  removeTask: (id: string) => void;
  
  // Content pipeline
  addContentItem: (item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateContentItem: (id: string, updates: Partial<ContentItem>) => void;
  removeContentItem: (id: string) => void;
  
  // Notifications
  addNotification: (notification: Omit<OrchestratorNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  // Settings
  setAutoPublish: (enabled: boolean) => void;
  setAutoSaveInterval: (minutes: number) => void;
  setBrandVoice: (voice: string) => void;
  setPreferredLanguage: (lang: 'es' | 'de' | 'en') => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialAgents: Record<AgentId, AgentState> = {
  orchestrator: { id: 'orchestrator', status: 'idle', lastActivity: null, currentTask: null, message: 'Ready' },
  content: { id: 'content', status: 'idle', lastActivity: null, currentTask: null, message: 'Ready' },
  creative: { id: 'creative', status: 'idle', lastActivity: null, currentTask: null, message: 'Ready' },
  analytics: { id: 'analytics', status: 'idle', lastActivity: null, currentTask: null, message: 'Ready' },
  scheduler: { id: 'scheduler', status: 'idle', lastActivity: null, currentTask: null, message: 'Ready' },
};

// ============================================================================
// STORE
// ============================================================================

let taskCounter = 0;
let contentCounter = 0;
let notifCounter = 0;

export const useOrchestratorStore = create<OrchestratorState & OrchestratorActions>()(
  persist(
    (set, get) => ({
      // State
      agents: initialAgents,
      contentItems: [],
      tasks: [],
      activeAgent: 'orchestrator',
      notifications: [],
      autoPublish: false,
      autoSaveInterval: 5,
      brandVoice: 'nicola_schaefer',
      preferredLanguage: 'es',

      // Actions
      setAgentStatus: (id, status, message) =>
        set((state) => ({
          agents: {
            ...state.agents,
            [id]: {
              ...state.agents[id],
              status,
              message: message || state.agents[id].message,
              lastActivity: new Date(),
            },
          },
        })),

      setActiveAgent: (id) => set({ activeAgent: id }),

      addTask: (task) => {
        const id = `task_${++taskCounter}_${Date.now()}`;
        const now = new Date();
        set((state) => ({
          tasks: [...state.tasks, { ...task, id, createdAt: now, updatedAt: now, status: 'pending' }],
        }));
        return id;
      },

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
          ),
        })),

      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      addContentItem: (item) => {
        const id = `content_${++contentCounter}_${Date.now()}`;
        const now = new Date();
        set((state) => ({
          contentItems: [...state.contentItems, { ...item, id, createdAt: now, updatedAt: now }],
        }));
        return id;
      },

      updateContentItem: (id, updates) =>
        set((state) => ({
          contentItems: state.contentItems.map((item) =>
            item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
          ),
        })),

      removeContentItem: (id) =>
        set((state) => ({
          contentItems: state.contentItems.filter((item) => item.id !== id),
        })),

      addNotification: (notification) => {
        const id = `notif_${++notifCounter}_${Date.now()}`;
        set((state) => ({
          notifications: [
            { ...notification, id, timestamp: new Date(), read: false },
            ...state.notifications,
          ].slice(0, 50), // Keep last 50
        }));
      },

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      clearNotifications: () => set({ notifications: [] }),

      setAutoPublish: (enabled) => set({ autoPublish: enabled }),
      setAutoSaveInterval: (minutes) => set({ autoSaveInterval: minutes }),
      setBrandVoice: (voice) => set({ brandVoice: voice }),
      setPreferredLanguage: (lang) => set({ preferredLanguage: lang }),
    }),
    {
      name: 'hubnick-orchestrator',
      partialize: (state) => ({
        autoPublish: state.autoPublish,
        autoSaveInterval: state.autoSaveInterval,
        brandVoice: state.brandVoice,
        preferredLanguage: state.preferredLanguage,
        contentItems: state.contentItems.map(item => ({
          ...item,
          createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
          updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
        })),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset agents to idle on rehydration
          state.agents = initialAgents;
          state.tasks = [];
          state.notifications = [];
        }
      },
    }
  )
);