/**
 * Connections Panel
 * Manages all API integrations: Canva, Meta/Instagram, Supabase, Make.com, CapCut
 * Allows configuring keys and testing connections
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  Key,
  Zap,
  Eye,
  EyeOff,
  Shield,
  Globe,
  Palette,
  Video,
  Calendar,
  MessageSquare,
  BarChart3,
  Link2,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { isSupabaseConfigured } from '../services/supabaseService';
import { isCanvaAvailable, initCanva } from '../services/canvaService';

interface ServiceConnection {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  status: 'connected' | 'disconnected' | 'error';
  configured: boolean;
  docsUrl: string;
}

interface ApiKeyInput {
  key: string;
  show: boolean;
}

export function ConnectionsPanel() {
  const [apiKeys, setApiKeys] = useState<Record<string, ApiKeyInput>>({
    VITE_CANVA_API_KEY: { key: '', show: false },
    VITE_META_APP_ID: { key: '', show: false },
    VITE_META_APP_SECRET: { key: '', show: false },
    VITE_GOOGLE_CLIENT_ID: { key: '', show: false },
    VITE_GOOGLE_API_KEY: { key: '', show: false },
    VITE_MAKE_WEBHOOK_URL: { key: '', show: false },
    VITE_CAPCUT_API_KEY: { key: '', show: false },
  });

  const [connections, setConnections] = useState<ServiceConnection[]>([
    {
      id: 'supabase',
      name: 'Supabase',
      description: 'Storage for images, videos and assets',
      icon: <Globe size={20} />,
      color: '#3ECF8E',
      status: 'disconnected',
      configured: false,
      docsUrl: 'https://supabase.com/docs',
    },
    {
      id: 'canva',
      name: 'Canva',
      description: 'Design editing and brand templates',
      icon: <Palette size={20} />,
      color: '#00C4CC',
      status: 'disconnected',
      configured: false,
      docsUrl: 'https://www.canva.com/developers/',
    },
    {
      id: 'meta',
      name: 'Meta / Instagram',
      description: 'Publishing, analytics and messaging',
      icon: <Zap size={20} />,
      color: '#1877F2',
      status: 'disconnected',
      configured: false,
      docsUrl: 'https://developers.facebook.com/docs/instagram-api',
    },
    {
      id: 'google',
      name: 'Google',
      description: 'Drive integration for asset import',
      icon: <Globe size={20} />,
      color: '#4285F4',
      status: 'disconnected',
      configured: false,
      docsUrl: 'https://console.cloud.google.com/',
    },
    {
      id: 'make',
      name: 'Make.com',
      description: 'Automation workflows',
      icon: <Zap size={20} />,
      color: '#FF6A00',
      status: 'disconnected',
      configured: false,
      docsUrl: 'https://www.make.com/en/api',
    },
    {
      id: 'capcut',
      name: 'CapCut',
      description: 'Video editing and effects',
      icon: <Video size={20} />,
      color: '#00D4FF',
      status: 'disconnected',
      configured: false,
      docsUrl: 'https://www.capcut.com/business/',
    },
  ]);

  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  // Load saved API keys from localStorage
  useEffect(() => {
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        setApiKeys(prev => {
          const updated = { ...prev };
          Object.keys(parsed).forEach(k => {
            if (updated[k]) {
              updated[k] = { ...updated[k], key: parsed[k] };
            }
          });
          return updated;
        });
      } catch (e) {
        console.error('Failed to load saved API keys');
      }
    }

    // Check current connection status
    checkAllConnections();
  }, []);

  // Save API keys to localStorage
  const saveApiKeys = (keys: Record<string, ApiKeyInput>) => {
    const toSave: Record<string, string> = {};
    Object.entries(keys).forEach(([k, v]) => {
      if (v.key) toSave[k] = v.key;
    });
    localStorage.setItem('apiKeys', JSON.stringify(toSave));
  };

  // Toggle show/hide API key
  const toggleShowKey = (keyId: string) => {
    setApiKeys(prev => ({
      ...prev,
      [keyId]: { ...prev[keyId], show: !prev[keyId].show }
    }));
  };

  // Update API key value
  const updateApiKey = (keyId: string, value: string) => {
    setApiKeys(prev => {
      const updated = {
        ...prev,
        [keyId]: { ...prev[keyId], key: value }
      };
      saveApiKeys(updated);
      return updated;
    });
  };

  // Test a specific connection
  const testConnection = async (serviceId: string) => {
    setTestingConnection(serviceId);

    try {
      switch (serviceId) {
        case 'supabase':
          const supabaseOk = isSupabaseConfigured();
          updateConnectionStatus('supabase', supabaseOk ? 'connected' : 'disconnected');
          if (supabaseOk) toast.success('Supabase connected!');
          else toast.error('Supabase not configured');
          break;

        case 'canva':
          try {
            await initCanva();
            const canvaOk = isCanvaAvailable();
            updateConnectionStatus('canva', canvaOk ? 'connected' : 'disconnected');
            if (canvaOk) toast.success('Canva connected!');
            else toast.error('Canva not configured. Add VITE_CANVA_API_KEY');
          } catch (e) {
            updateConnectionStatus('canva', 'error');
            toast.error('Canva connection failed');
          }
          break;

        case 'meta':
          // Meta requires a valid Page Access Token
          const metaKey = apiKeys.VITE_META_APP_ID?.key;
          updateConnectionStatus('meta', metaKey ? 'connected' : 'disconnected');
          if (metaKey) toast.success('Meta API configured!');
          else toast.error('Add VITE_META_APP_ID to enable Meta');
          break;

        case 'google':
          const googleKey = apiKeys.VITE_GOOGLE_CLIENT_ID?.key;
          updateConnectionStatus('google', googleKey ? 'connected' : 'disconnected');
          if (googleKey) toast.success('Google configured!');
          else toast.error('Add VITE_GOOGLE_CLIENT_ID to enable Google');
          break;

        case 'make':
          const makeKey = apiKeys.VITE_MAKE_WEBHOOK_URL?.key;
          updateConnectionStatus('make', makeKey ? 'connected' : 'disconnected');
          if (makeKey) toast.success('Make.com configured!');
          else toast.error('Add your Make.com webhook URL');
          break;

        case 'capcut':
          const capcutKey = apiKeys.VITE_CAPCUT_API_KEY?.key;
          updateConnectionStatus('capcut', capcutKey ? 'connected' : 'disconnected');
          if (capcutKey) toast.success('CapCut configured!');
          else toast.error('Add VITE_CAPCUT_API_KEY for CapCut');
          break;
      }
    } catch (error) {
      toast.error(`Connection test failed: ${error}`);
      updateConnectionStatus(serviceId, 'error');
    } finally {
      setTestingConnection(null);
    }
  };

  // Update connection status
  const updateConnectionStatus = (serviceId: string, status: 'connected' | 'disconnected' | 'error') => {
    setConnections(prev => prev.map(conn =>
      conn.id === serviceId ? { ...conn, status } : conn
    ));
  };

  // Check all connections
  const checkAllConnections = () => {
    // Supabase
    if (isSupabaseConfigured()) {
      updateConnectionStatus('supabase', 'connected');
    }

    // Canva
    if (isCanvaAvailable()) {
      updateConnectionStatus('canva', 'connected');
    }

    // Meta
    if (apiKeys.VITE_META_APP_ID?.key) {
      updateConnectionStatus('meta', 'connected');
    }

    // Google
    if (apiKeys.VITE_GOOGLE_CLIENT_ID?.key) {
      updateConnectionStatus('google', 'connected');
    }
  };

  // Open documentation
  const openDocs = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <header className="text-center md:text-left">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-4 font-mono">
          SYSTEM_CONFIGURATION
        </div>
        <h2 className="font-display text-5xl font-semibold mb-4 leading-tight tracking-tight">
          Connections
        </h2>
        <p className="text-sm text-ink-muted max-w-xl font-medium leading-relaxed font-sans">
          Configure your API keys and manage integrations with external services.
        </p>
      </header>

      {/* Connection Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {connections.map((conn) => (
          <div
            key={conn.id}
            className={cn(
              "p-4 rounded-xl border text-center transition-all",
              conn.status === 'connected'
                ? "bg-green-light/20 border-green-custom/30"
                : conn.status === 'error'
                  ? "bg-red-light/20 border-red-500/30"
                  : "bg-card border-brd"
            )}
          >
            <div
              className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
              style={{ backgroundColor: `${conn.color}20`, color: conn.color }}
            >
              {conn.icon}
            </div>
            <p className="text-xs font-bold text-ink">{conn.name}</p>
            <div className="mt-1">
              {conn.status === 'connected' && (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-green-600">
                  <CheckCircle2 size={10} /> CONNECTED
                </span>
              )}
              {conn.status === 'disconnected' && (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-ink-muted">
                  <Circle size={10} /> OFFLINE
                </span>
              )}
              {conn.status === 'error' && (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-red-500">
                  <XCircle size={10} /> ERROR
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* API Keys Configuration */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Key size={20} className="text-accent" />
          <h3 className="text-xl font-bold text-ink">API Keys</h3>
        </div>

        {/* Canva */}
        <div className="bg-card border border-brd rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00C4CC]/10 flex items-center justify-center text-[#00C4CC]">
                <Palette size={20} />
              </div>
              <div>
                <h4 className="font-bold text-ink">Canva API</h4>
                <p className="text-xs text-ink-muted">Design Button SDK Key</p>
              </div>
            </div>
            <button
              onClick={() => openDocs('https://www.canva.com/developers/')}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              <ExternalLink size={12} /> Docs
            </button>
          </div>

          <div className="mt-4">
            <label className="text-xs font-bold text-ink-muted mb-2 block">
              VITE_CANVA_API_KEY
            </label>
            <div className="relative">
              <input
                type={apiKeys.VITE_CANVA_API_KEY.show ? 'text' : 'password'}
                value={apiKeys.VITE_CANVA_API_KEY.key}
                onChange={(e) => updateApiKey('VITE_CANVA_API_KEY', e.target.value)}
                placeholder="Enter Canva API Key"
                className="w-full px-4 py-3 bg-paper border border-brd rounded-xl text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent"
              />
              <button
                onClick={() => toggleShowKey('VITE_CANVA_API_KEY')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              >
                {apiKeys.VITE_CANVA_API_KEY.show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => testConnection('canva')}
              disabled={testingConnection === 'canva'}
              className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              {testingConnection === 'canva' ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              Test Connection
            </button>
          </div>
        </div>

        {/* Meta / Instagram */}
        <div className="bg-card border border-brd rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2]">
                <Zap size={20} />
              </div>
              <div>
                <h4 className="font-bold text-ink">Meta / Instagram API</h4>
                <p className="text-xs text-ink-muted">Publishing, analytics and messaging</p>
              </div>
            </div>
            <button
              onClick={() => openDocs('https://developers.facebook.com/docs/instagram-api')}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              <ExternalLink size={12} /> Docs
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-ink-muted mb-2 block">
                VITE_META_APP_ID
              </label>
              <input
                type="text"
                value={apiKeys.VITE_META_APP_ID.key}
                onChange={(e) => updateApiKey('VITE_META_APP_ID', e.target.value)}
                placeholder="App ID"
                className="w-full px-4 py-3 bg-paper border border-brd rounded-xl text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink-muted mb-2 block">
                VITE_META_APP_SECRET
              </label>
              <div className="relative">
                <input
                  type={apiKeys.VITE_META_APP_SECRET.show ? 'text' : 'password'}
                  value={apiKeys.VITE_META_APP_SECRET.key}
                  onChange={(e) => updateApiKey('VITE_META_APP_SECRET', e.target.value)}
                  placeholder="App Secret"
                  className="w-full px-4 py-3 bg-paper border border-brd rounded-xl text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent pr-10"
                />
                <button
                  onClick={() => toggleShowKey('VITE_META_APP_SECRET')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                >
                  {apiKeys.VITE_META_APP_SECRET.show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-light/20 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> After adding your Meta App credentials, you'll need to connect
              your Instagram Business account and generate a Page Access Token.
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => testConnection('meta')}
              disabled={testingConnection === 'meta'}
              className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              {testingConnection === 'meta' ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              Test Connection
            </button>
          </div>
        </div>

        {/* Google */}
        <div className="bg-card border border-brd rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4285F4]/10 flex items-center justify-center text-[#4285F4]">
                <Globe size={20} />
              </div>
              <div>
                <h4 className="font-bold text-ink">Google OAuth</h4>
                <p className="text-xs text-ink-muted">Drive and Photos integration</p>
              </div>
            </div>
            <button
              onClick={() => openDocs('https://console.cloud.google.com/')}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              <ExternalLink size={12} /> Docs
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-ink-muted mb-2 block">
                VITE_GOOGLE_CLIENT_ID
              </label>
              <input
                type="text"
                value={apiKeys.VITE_GOOGLE_CLIENT_ID.key}
                onChange={(e) => updateApiKey('VITE_GOOGLE_CLIENT_ID', e.target.value)}
                placeholder="Client ID"
                className="w-full px-4 py-3 bg-paper border border-brd rounded-xl text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink-muted mb-2 block">
                VITE_GOOGLE_API_KEY
              </label>
              <input
                type="text"
                value={apiKeys.VITE_GOOGLE_API_KEY.key}
                onChange={(e) => updateApiKey('VITE_GOOGLE_API_KEY', e.target.value)}
                placeholder="API Key"
                className="w-full px-4 py-3 bg-paper border border-brd rounded-xl text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => testConnection('google')}
              disabled={testingConnection === 'google'}
              className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              {testingConnection === 'google' ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              Test Connection
            </button>
          </div>
        </div>

        {/* Make.com */}
        <div className="bg-card border border-brd rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF6A00]/10 flex items-center justify-center text-[#FF6A00]">
                <Zap size={20} />
              </div>
              <div>
                <h4 className="font-bold text-ink">Make.com</h4>
                <p className="text-xs text-ink-muted">Webhook URL for automations</p>
              </div>
            </div>
            <button
              onClick={() => openDocs('https://www.make.com/en/api')}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              <ExternalLink size={12} /> Docs
            </button>
          </div>

          <div className="mt-4">
            <label className="text-xs font-bold text-ink-muted mb-2 block">
              VITE_MAKE_WEBHOOK_URL
            </label>
            <input
              type="url"
              value={apiKeys.VITE_MAKE_WEBHOOK_URL.key}
              onChange={(e) => updateApiKey('VITE_MAKE_WEBHOOK_URL', e.target.value)}
              placeholder="https://hook.eu1.make.com/xxxxx"
              className="w-full px-4 py-3 bg-paper border border-brd rounded-xl text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent"
            />
          </div>

          <div className="mt-4 p-3 bg-amber-light/20 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-700">
              <strong>Tip:</strong> Create a webhook in Make.com and paste the URL here to
              trigger automations from this hub.
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => testConnection('make')}
              disabled={testingConnection === 'make'}
              className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              {testingConnection === 'make' ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              Test Connection
            </button>
          </div>
        </div>

        {/* CapCut */}
        <div className="bg-card border border-brd rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF]">
                <Video size={20} />
              </div>
              <div>
                <h4 className="font-bold text-ink">CapCut API</h4>
                <p className="text-xs text-ink-muted">Video editing and effects</p>
              </div>
            </div>
            <button
              onClick={() => openDocs('https://www.capcut.com/business/')}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              <ExternalLink size={12} /> Docs
            </button>
          </div>

          <div className="mt-4">
            <label className="text-xs font-bold text-ink-muted mb-2 block">
              VITE_CAPCUT_API_KEY
            </label>
            <input
              type="password"
              value={apiKeys.VITE_CAPCUT_API_KEY.key}
              onChange={(e) => updateApiKey('VITE_CAPCUT_API_KEY', e.target.value)}
              placeholder="Enter CapCut API Key"
              className="w-full px-4 py-3 bg-paper border border-brd rounded-xl text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-accent"
            />
          </div>

          <div className="mt-4 p-3 bg-blue-light/20 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Coming Soon:</strong> CapCut integration is under development.
              Video editing will be available shortly.
            </p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-4 p-6 bg-paper border border-brd rounded-xl">
        <Shield size={20} className="text-accent mt-0.5" />
        <div>
          <h4 className="font-bold text-ink text-sm">Security Notice</h4>
          <p className="text-xs text-ink-muted mt-1">
            API keys are stored locally in your browser. Never share your API keys or commit
            them to version control. For production, use environment variables on your server.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper for disconnected status
function Circle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

export default ConnectionsPanel;