/**
 * AI Generator Panel v2 - Improved
 * Generate content with AI - Reels, Captions, Stories, DMs
 * Connected to Calendar for scheduling
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  RefreshCw,
  Plus,
  Check,
  Calendar,
  Save,
  Wand2,
  Video,
  FileText,
  MessageCircle,
  Send,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/TranslationContext';
import { useFirebase } from '../lib/FirebaseProvider';
import { geminiService } from '../services/geminiService';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

interface GeneratedContent {
  id: string;
  type: string;
  pillar: string;
  content: string;
  timestamp: Date;
}

interface GeneratorPanelProps {
  onNavigate?: (tab: string) => void;
}

const CONTENT_TYPES = [
  { id: 'reel_script', label: 'Reel Script', icon: Video, color: 'purple', description: 'Video script with hook, body, CTA' },
  { id: 'caption', label: 'Caption', icon: FileText, color: 'blue', description: 'Engaging post caption' },
  { id: 'story', label: 'Story', icon: MessageCircle, color: 'orange', description: 'Story sequence text' },
  { id: 'dm', label: 'DM Follow-up', icon: Send, color: 'green', description: 'Direct message for leads' },
];

const PILLARS = [
  { id: 'p1', label: 'El vacío del éxito', emoji: '🎯', description: 'Success vs emptiness' },
  { id: 'p2', label: 'Método sistémico', emoji: '🔮', description: 'Systemic method' },
  { id: 'p4', label: 'Historia personal', emoji: '📖', description: 'Personal story' },
  { id: 'p6', label: 'CTA Sesión', emoji: '📅', description: 'Session call-to-action' },
];

const AUDIENCES = [
  { id: 'mixed', label: 'Bilingüe (ES/DE)' },
  { id: 'es', label: 'Español' },
  { id: 'de', label: 'Alemán (DACH)' },
];

const TONES = [
  { id: 'reflexivo', label: 'Reflexivo', emoji: '🤔' },
  { id: 'vulnerable', label: 'Vulnerable', emoji: '💔' },
  { id: 'directo', label: 'Directo', emoji: '⚡' },
  { id: 'invitacion', label: 'Invitación', emoji: '🌟' },
];

export function GeneratorPanel({ onNavigate }: GeneratorPanelProps) {
  const { user } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<GeneratedContent[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [params, setParams] = useState({
    type: 'reel_script',
    pillar: 'p1',
    audience: 'mixed',
    tone: 'reflexivo',
  });

  const selectedType = CONTENT_TYPES.find(t => t.id === params.type);
  const selectedPillar = PILLARS.find(p => p.id === params.pillar);

  const handleGenerate = async () => {
    setLoading(true);
    setIsScheduled(false);
    try {
      const prompt = `Actúa como Nicola Schaefer (@nicola.schaefer.life), coach holística sistémica alemana en Ecuador.
Genera: ${params.type}
Pilar: ${params.pillar}
Audiencia: ${params.audience}
Tono: ${params.tone}
Sigue sus valores: conexión real, no fórmulas mágicas, bilingüe (ES/DE).
Máximo 5 hashtags relevantes.
Escribe en un tono reflexivo y auténtico.`;

      const result = await geminiService.generateContent(prompt);
      setOutput(result);

      // Add to history
      setGenerationHistory(prev => [{
        id: Date.now().toString(),
        type: params.type,
        pillar: params.pillar,
        content: result,
        timestamp: new Date()
      }, ...prev.slice(0, 4)]);
    } catch (err) {
      toast.error('Error generating content. Check API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, index?: number) => {
    await navigator.clipboard.writeText(text);
    if (index !== undefined) setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Copied to clipboard!');
  };

  const handleSchedule = () => {
    if (!output) return;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];

    // Add to Firestore posts collection
    if (user) {
      addDoc(collection(db, 'posts'), {
        title: output.split('\n')[0].replace(/[#*]/g, '').trim().substring(0, 50),
        content: output,
        type: params.type,
        pillar: params.pillar,
        date: dateStr,
        time: '18:00',
        status: 'scheduled',
        authorId: user.uid,
        createdAt: serverTimestamp()
      });
    }

    setIsScheduled(true);
    toast.success('Scheduled for next week!', {
      description: `Posted to Calendar on ${futureDate.toLocaleDateString()}`
    });

    setTimeout(() => onNavigate?.('calendar'), 1500);
  };

  const handleSaveToMethodology = async () => {
    if (!output || !user) return;

    try {
      await addDoc(collection(db, 'methodology'), {
        title: output.split('\n')[0].replace(/[#*]/g, '').trim().substring(0, 50),
        content: output,
        type: params.type.toUpperCase(),
        pillar: params.pillar,
        authorId: user.uid,
        createdAt: serverTimestamp()
      });
      toast.success('Saved to Methodology Hub!');
    } catch (err) {
      toast.error('Failed to save');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-4">
          <Sparkles size={16} className="text-purple-500" />
          <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">AI Content Factory</span>
        </div>
        <h2 className="font-display text-5xl font-bold mb-3">Generate Content</h2>
        <p className="text-ink-muted max-w-xl mx-auto">Create engaging content with AI tailored for your DACH and LatAm audience</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Panel - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Type Selection */}
          <div className="bg-card border border-brd rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4">Content Type</h3>
            <div className="grid grid-cols-2 gap-3">
              {CONTENT_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setParams({ ...params, type: type.id })}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all",
                    params.type === type.id
                      ? "border-accent bg-accent/5"
                      : "border-brd hover:border-accent/50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                    params.type === type.id ? "bg-accent text-white" : "bg-paper"
                  )}>
                    <type.icon size={20} />
                  </div>
                  <p className="font-bold text-sm">{type.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Pillar Selection */}
          <div className="bg-card border border-brd rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4">Content Pillar</h3>
            <div className="space-y-2">
              {PILLARS.map(pillar => (
                <button
                  key={pillar.id}
                  onClick={() => setParams({ ...params, pillar: pillar.id })}
                  className={cn(
                    "w-full p-4 rounded-2xl border-2 flex items-center gap-4 text-left transition-all",
                    params.pillar === pillar.id
                      ? "border-accent bg-accent/5"
                      : "border-brd hover:border-accent/50"
                  )}
                >
                  <span className="text-2xl">{pillar.emoji}</span>
                  <div>
                    <p className="font-bold text-sm">{pillar.label}</p>
                    <p className="text-xs text-ink-muted">{pillar.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Settings */}
          <div className="bg-card border border-brd rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-ink-muted mb-2 block">Audience</label>
                <div className="flex gap-2">
                  {AUDIENCES.map(aud => (
                    <button
                      key={aud.id}
                      onClick={() => setParams({ ...params, audience: aud.id })}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border",
                        params.audience === aud.id
                          ? "bg-accent text-white border-accent"
                          : "bg-paper border-brd hover:border-accent/50"
                      )}
                    >
                      {aud.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-2 block">Tone</label>
                <div className="flex gap-2">
                  {TONES.map(tone => (
                    <button
                      key={tone.id}
                      onClick={() => setParams({ ...params, tone: tone.id })}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1",
                        params.tone === tone.id
                          ? "bg-accent text-white border-accent"
                          : "bg-paper border-brd hover:border-accent/50"
                      )}
                    >
                      <span>{tone.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 size={24} />
                Generate with AI
              </>
            )}
          </button>
        </div>

        {/* Right Panel - Output */}
        <div className="lg:col-span-3 space-y-6">
          {/* Output Preview */}
          <div className="bg-card border border-brd rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-brd bg-paper/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  selectedType?.color === 'purple' && "bg-purple-500/10 text-purple-500",
                  selectedType?.color === 'blue' && "bg-blue-500/10 text-blue-500",
                  selectedType?.color === 'orange' && "bg-orange-500/10 text-orange-500",
                  selectedType?.color === 'green' && "bg-green-500/10 text-green-500"
                )}>
                  {selectedType && <selectedType.icon size={20} />}
                </div>
                <div>
                  <p className="font-bold text-sm">{selectedType?.label}</p>
                  <p className="text-xs text-ink-muted">{selectedPillar?.label}</p>
                </div>
              </div>
              {output && (
                <span className="text-xs bg-green-light text-green-700 px-3 py-1 rounded-full font-bold">
                  Generated
                </span>
              )}
            </div>

            <div className="p-8 min-h-[400px]">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                  <p className="text-accent font-bold animate-pulse">Creating content...</p>
                </div>
              ) : output ? (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {output}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-ink-muted">
                  <Sparkles size={48} className="opacity-20 mb-4" />
                  <p className="font-bold mb-2">No content yet</p>
                  <p className="text-sm">Select options and click Generate</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {output && (
              <div className="p-6 border-t border-brd bg-paper/50 grid grid-cols-4 gap-3">
                <button
                  onClick={() => handleCopy(output)}
                  className="py-3 px-4 bg-card border border-brd rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-brd transition-all"
                >
                  {copiedIndex === 0 ? <Check size={14} /> : <Copy size={14} />}
                  Copy
                </button>
                <button
                  onClick={handleGenerate}
                  className="py-3 px-4 bg-card border border-brd rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-brd transition-all"
                >
                  <RefreshCw size={14} />
                  Regenerate
                </button>
                <button
                  onClick={handleSaveToMethodology}
                  className="py-3 px-4 bg-card border border-brd rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-brd transition-all"
                >
                  <Save size={14} />
                  Save
                </button>
                <button
                  onClick={handleSchedule}
                  disabled={isScheduled}
                  className={cn(
                    "py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all",
                    isScheduled
                      ? "bg-green-light text-green-700 border border-green-500/20"
                      : "bg-accent text-white hover:bg-accent/90"
                  )}
                >
                  {isScheduled ? <Check size={14} /> : <Calendar size={14} />}
                  {isScheduled ? 'Scheduled' : 'Schedule'}
                </button>
              </div>
            )}
          </div>

          {/* History */}
          {generationHistory.length > 0 && (
            <div className="bg-card border border-brd rounded-3xl p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4">Recent Generations</h3>
              <div className="space-y-3">
                {generationHistory.map((item, index) => {
                  const type = CONTENT_TYPES.find(t => t.id === item.type);
                  const pillar = PILLARS.find(p => p.id === item.pillar);

                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-paper rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-brd/50 transition-all"
                      onClick={() => {
                        setOutput(item.content);
                        setParams({ ...params, type: item.type, pillar: item.pillar });
                      }}
                    >
                      <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                        {type && <type.icon size={18} className="text-accent" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{item.content.substring(0, 50)}...</p>
                        <p className="text-xs text-ink-muted">{pillar?.emoji} {type?.label}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(item.content, index + 1);
                        }}
                        className="p-2 hover:bg-card rounded-lg transition-all"
                      >
                        {copiedIndex === index + 1 ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
