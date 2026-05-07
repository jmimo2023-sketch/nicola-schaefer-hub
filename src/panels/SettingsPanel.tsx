/**
 * Settings Panel - Configuration and connections
 * Merges: ConnectionsPanel + profile + preferences + API management
 * 
 * Configure all integrations: Instagram, Google, Supabase, Make.com, etc.
 */

import React, { useState } from 'react';
import { Settings, Link, User, Bell, Shield, Palette } from 'lucide-react';
import { cn } from '../lib/utils';
import { ConnectionsPanel } from './ConnectionsPanel';

type SettingsTab = 'connections' | 'profile' | 'notifications' | 'security' | 'appearance';

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'connections', label: 'Connections', icon: <Link size={16} /> },
  { id: 'profile', label: 'Profile', icon: <User size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'security', label: 'Security', icon: <Shield size={16} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
];

export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('connections');

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-2 font-mono">
          SETTINGS
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold">Settings</h2>
        <p className="text-sm text-ink-muted mt-1">
          Configure your integrations and preferences
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {SETTINGS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "bg-card border border-brd text-ink-muted hover:text-ink hover:bg-paper"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[60vh]">
        {activeTab === 'connections' && <ConnectionsPanel />}
        {activeTab === 'profile' && <ComingSoonCard title="Profile" description="Manage your profile and brand identity" />}
        {activeTab === 'notifications' && <ComingSoonCard title="Notifications" description="Configure WhatsApp, email, and push notifications" />}
        {activeTab === 'security' && <ComingSoonCard title="Security" description="Two-factor auth, session management, API key rotation" />}
        {activeTab === 'appearance' && <ComingSoonCard title="Appearance" description="Theme, language, and display preferences" />}
      </div>
    </div>
  );
}

function ComingSoonCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-card border border-brd rounded-2xl p-8 text-center">
      <Settings size={32} className="mx-auto mb-4 text-ink-muted/30" />
      <h3 className="font-display text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-ink-muted">{description}</p>
      <div className="mt-4 inline-block px-4 py-1.5 bg-accent/10 text-accent text-xs font-bold rounded-full">
        COMING SOON
      </div>
    </div>
  );
}