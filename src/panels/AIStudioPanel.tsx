/**
 * AI Studio Panel - Nicola Schaefer Hub
 * 
 * AI-powered content generation with real Content Agent integration.
 * Features:
 * - Chat-based content generation via NEMO API
 * - Real Supabase storage
 * - WhatsApp approval workflow
 * - Multi-format output (post, story, reel, carousel)
 * - Brand kit integration
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles, Image, Video, MessageSquare, Send, Download, RefreshCw,
  ExternalLink, Check, X, Loader2, Palette, FileText, Instagram,
  Wand2, ChevronRight, ChevronLeft, Upload, Copy, Share2, Eye,
  Settings, Zap, Clock, Star, Trash2, Film, Layout, Type
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { contentAgentService, BRAND, ContentRequest, ContentResult, AgentMessage } from '../services/contentAgentService';

// ============================================================================
// QUICK TEMPLATES
// ============================================================================

const QUICK_TEMPLATES = [
  {
    id: 'yoga-vilcabamba',
    label: 'Yoga en Vilcabamba',
    labelDE: 'Yoga in Vilcabamba',
    prompt: 'Crea un reel de yoga en Vilcabamba con ambiente relajante',
    icon: '🧘',
    pillar: 'vilcabamba',
    type: 'reel' as const,
  },
  {
    id: 'sunset-quote',
    label: 'Cita de Atardecer',
    labelDE: 'Sonnenuntergang Zitat',
    prompt: 'Diseña un post con cita sobre atardeceres, fondo cálido',
    icon: '🌅',
    pillar: 'daily',
    type: 'post' as const,
  },
  {
    id: 'retiro-anuncio',
    label: 'Anuncio de Retiro',
    labelDE: 'Retreat Ankündigung',
    prompt: 'Crea un story anunciando un retiro de yoga en Vilcabamba',
    icon: '🏔️',
    pillar: 'retiros',
    type: 'story' as const,
  },
  {
    id: 'coaching-tip',
    label: 'Tip de Coaching',
    labelDE: 'Coaching-Tipp',
    prompt: 'Genera un post con tip de coaching, estilo minimalista',
    icon: '💡',
    pillar: 'coaching',
    type: 'post' as const,
  },
  {
    id: 'dach-wissen',
    label: 'Educación DACH',
    labelDE: 'DACH Wissen',
    prompt: 'Crea un carrusel educativo sobre wellness para el mercado DACH',
    icon: '📚',
    pillar: 'dach',
    type: 'carousel' as const,
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AIStudioPanel() {
  // State
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePillar, setActivePillar] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ContentRequest['type']>('post');
  const [selectedLang, setSelectedLang] = useState<'de' | 'es' | 'en'>('de');
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [history, setHistory] = useState<ContentResult[]>([]);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'thinking' | 'generating' | 'done' | 'error'>('idle');
  const [credits, setCredits] = useState<{ available: number; total: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Init
  useEffect(() => {
    contentAgentService.initialize().then(() => {
      contentAgentService.checkCredits().then(setCredits).catch(() => {});
    });
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ============================================================================
  // GENERATION
  // ============================================================================

  const generateContent = useCallback(async (prompt: string, templateId?: string) => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setAgentStatus('thinking');

    // Add user message
    const userMsg: AgentMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Add thinking message
    const thinkingMsg: AgentMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'agent',
      content: '',
      timestamp: new Date(),
      status: 'thinking',
    };
    setMessages(prev => [...prev, thinkingMsg]);

    try {
      // Call Content Agent
      const request: ContentRequest = {
        type: selectedFormat,
        pillar: activePillar || 'vilcabamba',
        prompt,
        language: selectedLang,
      };

      const result = await contentAgentService.generateContent(request);

      // Update with result
      setAgentStatus('generating');

      // Simulate brief processing time for UX
      await new Promise(r => setTimeout(r, 1500));

      const agentMsg: AgentMessage = {
        id: `msg_${Date.now() + 2}`,
        role: 'agent',
        content: `✅ **${result.title}** generado.\n\n📝 Caption:\n${result.captionDE || result.caption}\n\n📐 Formato: ${result.format.toUpperCase()}\n🏷️ Pilar: ${BRAND.pillars.find(p => p.id === result.pillar)?.label || result.pillar}`,
        timestamp: new Date(),
        result,
        status: 'done',
      };

      setMessages(prev => [...prev, agentMsg]);
      setHistory(prev => [result, ...prev]);
      setAgentStatus('done');
      toast.success('✨ Contenido generado');
    } catch (error: any) {
      const errorMsg: AgentMessage = {
        id: `msg_${Date.now() + 2}`,
        role: 'agent',
        content: `❌ Error: ${error.message}. Intenta de nuevo.`,
        timestamp: new Date(),
        status: 'error',
      };
      setMessages(prev => [...prev, errorMsg]);
      setAgentStatus('error');
      toast.error('Error al generar contenido');
    } finally {
      setIsGenerating(false);
      // Remove thinking message
      setMessages(prev => prev.filter(m => m.status !== 'thinking'));
    }
  }, [isGenerating, selectedFormat, activePillar, selectedLang]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const handleSendToWhatsApp = async (result: ContentResult) => {
    try {
      const { message } = await contentAgentService.sendToWhatsApp(result);
      toast.success('📱 Mensaje para WhatsApp copiado', { description: 'Pégalo en tu chat de aprobación' });
    } catch {
      toast.error('Error al enviar a WhatsApp');
    }
  };

  const handleDownload = (result: ContentResult) => {
    window.open(result.imageUrl, '_blank');
    toast.success('⬇️ Abriendo imagen para descargar');
  };

  const handleCopyCaption = async (caption: string) => {
    await navigator.clipboard.writeText(caption);
    toast.success('📝 Caption copiada');
  };

  const handleTemplateClick = (template: typeof QUICK_TEMPLATES[0]) => {
    setSelectedFormat(template.type);
    setActivePillar(template.pillar);
    generateContent(template.prompt, template.id);
  };

  const clearChat = () => {
    setMessages([]);
    setAgentStatus('idle');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-paper">
      {/* Header */}
      <div className="h-14 bg-card border-b border-brd px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#467a49] to-[#155336] flex items-center justify-center shadow-lg shadow-[#467a49]/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink">AI Content Studio</h2>
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                agentStatus === 'thinking' || agentStatus === 'generating' ? "bg-amber-500 animate-pulse" :
                agentStatus === 'error' ? "bg-red-500" : "bg-[#467a49]"
              )} />
              <span className="text-[10px] text-ink-muted font-mono">
                {agentStatus === 'thinking' ? 'Pensando...' :
                 agentStatus === 'generating' ? 'Generando...' :
                 agentStatus === 'error' ? 'Error' :
                 'Agente conectado'}
              </span>
              {credits && (
                <span className="text-[10px] text-ink-muted ml-2">
                  · {credits.available} créditos
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Format selector */}
        <div className="flex items-center gap-1">
          {(['post', 'story', 'reel', 'carousel'] as const).map(format => (
            <button
              key={format}
              onClick={() => setSelectedFormat(format)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                selectedFormat === format
                  ? "bg-[#467a49] text-white"
                  : "bg-paper text-ink-muted border border-brd hover:border-[#467a49]"
              )}
            >
              {format === 'post' ? '▢ Post' : format === 'story' ? '▯ Story' : format === 'reel' ? '▷ Reel' : '⊞ Carousel'}
            </button>
          ))}

          {/* Language */}
          <div className="flex items-center gap-1 ml-2">
            {(['de', 'es', 'en'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={cn(
                  "px-2 py-1.5 rounded-lg text-xs font-bold transition-all uppercase",
                  selectedLang === lang
                    ? "bg-[#d16806] text-white"
                    : "bg-paper text-ink-muted border border-brd hover:border-[#d16806]"
                )}
              >
                {lang}
              </button>
            ))}
          </div>

          <button onClick={clearChat} className="ml-2 p-2 rounded-lg hover:bg-brd text-ink-muted" title="Limpiar chat">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Panel - Templates & Pillars */}
        {showLeftPanel && (
          <div className="w-72 border-r border-brd bg-card flex flex-col shrink-0">
            {/* Pillar filter */}
            <div className="p-3 border-b border-brd">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-2 font-mono">
                🏷️ Pilares
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {BRAND.pillars.map(pillar => (
                  <button
                    key={pillar.id}
                    onClick={() => setActivePillar(activePillar === pillar.id ? null : pillar.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border",
                      activePillar === pillar.id
                        ? "bg-[#467a49] text-white border-[#467a49]"
                        : "bg-paper text-ink-muted border-brd hover:border-[#467a49]"
                    )}
                  >
                    {pillar.icon} {pillar.label.split(' ').slice(-1)[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick templates */}
            <div className="flex-1 overflow-y-auto p-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-3 font-mono">
                ⚡ Templates Rápidos
              </h3>
              <div className="space-y-2">
                {QUICK_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateClick(template)}
                    disabled={isGenerating}
                    className={cn(
                      "w-full p-3 rounded-xl border transition-all text-left group",
                      "bg-paper border-brd hover:border-[#467a49] hover:shadow-sm",
                      isGenerating && "opacity-50 pointer-events-none"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{template.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-ink truncate">
                          {selectedLang === 'de' && template.labelDE ? template.labelDE : template.label}
                        </p>
                        <p className="text-[10px] text-ink-muted">
                          {template.type.toUpperCase()} · {template.pillar}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-[#467a49] transition-colors" />
                    </div>
                  </button>
                ))}
              </div>

              {/* AI Actions */}
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-3 mt-6 font-mono">
                🤖 Comandos
              </h3>
              <div className="space-y-1.5">
                <AIAction
                  icon={<Wand2 className="w-3.5 h-3.5" />}
                  label="Generar caption"
                  prompt="Genera una caption para Instagram en alemán sobre wellness y Vilcabamba"
                  onClick={generateContent}
                />
                <AIAction
                  icon={<Image className="w-3.5 h-3.5" />}
                  label="Diseñar post"
                  prompt="Diseña un post minimalista con fondo verde y texto motivacional"
                  onClick={generateContent}
                />
                <AIAction
                  icon={<Film className="w-3.5 h-3.5" />}
                  label="Crear reel"
                  prompt="Crea un reel de 30 segundos con transiciones suaves y música lofi"
                  onClick={generateContent}
                />
                <AIAction
                  icon={<Layout className="w-3.5 h-3.5" />}
                  label="Carrusel educativo"
                  prompt="Crea un carrusel de 5 slides sobre sanación interior para el mercado DACH"
                  onClick={generateContent}
                />
              </div>
            </div>

            {/* Toggle */}
            <button
              onClick={() => setShowLeftPanel(false)}
              className="p-2 border-t border-brd text-ink-muted hover:text-ink text-xs flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-3 h-3" /> Ocultar
            </button>
          </div>
        )}

        {!showLeftPanel && (
          <button
            onClick={() => setShowLeftPanel(true)}
            className="w-8 border-r border-brd bg-card flex items-center justify-center hover:bg-brd"
          >
            <ChevronRight className="w-4 h-4 text-ink-muted" />
          </button>
        )}

        {/* Center - Chat */}
        <div className="flex-1 flex flex-col bg-paper">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#467a49] to-[#155336] flex items-center justify-center shadow-xl shadow-[#467a49]/20 mb-6">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold text-ink mb-2">AI Content Studio</h3>
                <p className="text-sm text-ink-muted max-w-md mb-8">
                  Describe lo que quieres crear. El agente genera contenido con tu brand kit,
                  lo sube a Supabase, y puedes aprobarlo por WhatsApp.
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-lg">
                  {QUICK_TEMPLATES.slice(0, 4).map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleTemplateClick(t)}
                      className="p-3 bg-card border border-brd rounded-xl text-left hover:border-[#467a49] transition-all group"
                    >
                      <span className="text-lg">{t.icon}</span>
                      <p className="text-xs font-bold mt-1">{selectedLang === 'de' && t.labelDE ? t.labelDE : t.label}</p>
                      <p className="text-[10px] text-ink-muted">{t.type.toUpperCase()}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(message => (
              <div key={message.id} className={cn("flex gap-3", message.role === 'user' ? "justify-end" : "justify-start")}>
                {message.role === 'agent' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#467a49] to-[#155336] flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={cn(
                  "max-w-[75%] rounded-2xl",
                  message.role === 'user'
                    ? "bg-[#467a49] text-white rounded-br-sm px-4 py-3"
                    : "bg-card border border-brd rounded-bl-sm px-4 py-3"
                )}>
                  {message.status === 'thinking' ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#467a49]" />
                      <span className="text-sm text-ink-muted">Pensando...</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                      {/* Result card */}
                      {message.result && (
                        <div className="mt-3 space-y-2">
                          <div className="relative rounded-xl overflow-hidden border border-brd">
                            <img src={message.result.imageUrl} alt={message.result.title} className="w-full h-48 object-cover" />
                            <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold uppercase backdrop-blur-sm">
                              {message.result.format}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSendToWhatsApp(message.result!)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#467a49] text-white rounded-lg text-xs font-bold hover:bg-[#155336] transition-colors"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              WhatsApp
                            </button>
                            <button
                              onClick={() => handleDownload(message.result!)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-paper border border-brd rounded-lg text-xs font-bold hover:bg-brd transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Descargar
                            </button>
                            <button
                              onClick={() => handleCopyCaption(message.result!.captionDE || message.result!.caption)}
                              className="px-3 py-2 bg-paper border border-brd rounded-lg text-xs font-bold hover:bg-brd transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      <span className="text-[10px] opacity-40 mt-2 block">
                        {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-[#d16806] flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">NS</span>
                  </div>
                )}
              </div>
            ))}

            {/* Generating indicator */}
            {isGenerating && !messages.some(m => m.status === 'thinking') && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#467a49] to-[#155336] flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-card border border-brd rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#467a49]" />
                    <span className="text-sm text-ink-muted">
                      {agentStatus === 'thinking' ? 'Pensando...' : 'Generando contenido...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-brd bg-card p-4">
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 bg-paper border border-brd rounded-xl px-3">
                <Wand2 className="w-4 h-4 text-ink-muted shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && inputValue.trim() && generateContent(inputValue)}
                  placeholder={selectedLang === 'de' ? 'Beschreibe den Inhalt...' : 'Describe el contenido que quieres crear...'}
                  className="flex-1 py-3 text-sm bg-transparent focus:outline-none"
                />
              </div>
              <button
                onClick={() => inputValue.trim() && generateContent(inputValue)}
                disabled={!inputValue.trim() || isGenerating}
                className="px-5 py-3 bg-[#467a49] text-white rounded-xl font-bold hover:bg-[#155336] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Generar
              </button>
            </div>

            {/* Format pills */}
            <div className="flex gap-2 mt-2">
              {(['post', 'story', 'reel', 'carousel'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedFormat(f)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold transition-all border",
                    selectedFormat === f ? "bg-[#467a49] text-white border-[#467a49]" : "bg-paper text-ink-muted border-brd"
                  )}
                >
                  {f === 'post' ? '▢' : f === 'story' ? '▯' : f === 'reel' ? '▷' : '⊞'} {f}
                </button>
              ))}
              <div className="h-4 w-px bg-brd mx-1" />
              {(['de', 'es', 'en'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setSelectedLang(l)}
                  className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold transition-all border uppercase",
                    selectedLang === l ? "bg-[#d16806] text-white border-[#d16806]" : "bg-paper text-ink-muted border-brd"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - History */}
        {showRightPanel && (
          <div className="w-64 border-l border-brd bg-card flex flex-col shrink-0">
            <div className="p-3 border-b border-brd flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted font-mono">
                📁 Historial ({history.length})
              </h3>
              <button onClick={() => setShowRightPanel(false)} className="text-ink-muted hover:text-ink">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-8 text-ink-muted">
                  <Image className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Sin diseños aún</p>
                  <p className="text-[10px] mt-1">Genera contenido para verlo aquí</p>
                </div>
              ) : (
                history.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const msg: AgentMessage = {
                        id: `msg_${Date.now()}`,
                        role: 'agent',
                        content: `📂 ${item.title}`,
                        timestamp: new Date(),
                        result: item,
                        status: 'done',
                      };
                      setMessages(prev => [...prev, msg]);
                    }}
                    className="w-full rounded-xl overflow-hidden border border-brd hover:border-[#467a49] transition-all group"
                  >
                    <div className="relative">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-28 object-cover" />
                      <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/60 text-white text-[8px] font-bold uppercase backdrop-blur-sm">
                        {item.format}
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-bold truncate">{item.title}</p>
                      <p className="text-[9px] text-ink-muted">{BRAND.pillars.find(p => p.id === item.pillar)?.label || item.pillar}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Stats */}
            <div className="p-3 border-t border-brd">
              <div className="p-3 bg-paper rounded-xl border border-brd">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-2">Este mes</h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-ink-muted">Generados</span>
                    <span className="font-bold">{history.length}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-ink-muted">NEMO créditos</span>
                    <span className="font-bold text-[#467a49]">{credits?.available ?? '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showRightPanel && (
          <button
            onClick={() => setShowRightPanel(true)}
            className="w-8 border-l border-brd bg-card flex items-center justify-center hover:bg-brd"
          >
            <ChevronLeft className="w-4 h-4 text-ink-muted" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function AIAction({ icon, label, prompt, onClick }: { icon: React.ReactNode; label: string; prompt: string; onClick: (p: string) => void }) {
  return (
    <button
      onClick={() => onClick(prompt)}
      className="w-full flex items-center gap-2 px-3 py-2 bg-paper border border-brd rounded-lg text-xs font-medium text-ink-muted hover:text-ink hover:border-[#467a49] transition-all"
    >
      {icon}
      {label}
    </button>
  );
}