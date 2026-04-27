/**
 * AI Generator Panel v2 - Nicola Schaefer Brand
 * Generate content with AI tailored to brand voice and target audience
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
  Loader2,
  Heart,
  Target,
  Lightbulb,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useFirebase } from '../lib/FirebaseProvider';
import { geminiService } from '../services/geminiService';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

interface GeneratorPanelProps {
  onNavigate?: (tab: string) => void;
}

// Content types matching Nicky's actual content pillars
const CONTENT_TYPES = [
  { id: 'reel_script', label: 'Reel Script', icon: Video, color: 'purple', description: 'Video script with hook, body, CTA' },
  { id: 'caption', label: 'Caption', icon: FileText, color: 'blue', description: 'Engaging post caption' },
  { id: 'story_sequence', label: 'Story Sequence', icon: MessageCircle, color: 'orange', description: 'Multi-slide story series' },
  { id: 'email', label: 'Email', icon: Send, color: 'green', description: 'Email sequence content' },
];

// Pillars based on actual strategy
const PILLARS = [
  { id: 'emotion', label: 'Emotion als Kompass', emoji: '💔', description: 'Wut ist Information, Angst ist Signal', example: 'Gefühle benennen' },
  { id: 'grenzen', label: 'Grenzen ohne Schuld', emoji: '🔕', description: 'Nein sagen ohne Schuldgefühl', example: 'Grenzen setzen' },
  { id: 'handlung', label: 'Die Lücke schließen', emoji: '⚡', description: 'Vom Wissen zum Tun', example: 'Handlungsimpuls' },
  { id: 'beziehungen', label: 'Beziehungs-Muster', emoji: '🔮', description: 'Innere Anteile, inneres Kind', example: 'Muster erkennen' },
  { id: 'vikilamba', label: 'Vilcabamba Lifestyle', emoji: '🌿', description: 'Was möglich ist wenn man den Schritt wagt', example: 'Lifestyle' },
];

// Audience targeting
const AUDIENCES = [
  { id: 'primary', label: 'Frauen 35-50 DACH', desc: 'High Achiever, innerlich festgefahren' },
  { id: 'secondary', label: 'Therapie-Erfahrene', desc: 'Hat schon viel gemacht, will mehr' },
  { id: 'aspirational', label: 'Auf dem Weg', desc: 'Spirituell interessiert, nicht esoterisch' },
];

// Brand tones based on actual voice
const TONES = [
  { id: 'korpernah', label: 'Körpernah', emoji: '🔥', description: 'Direkt, warm, aus dem Körper' },
  { id: 'mystisch', label: 'Atmosphärisch', emoji: '✨', description: 'Mystisch aber nie esoterisch' },
  { id: 'einladung', label: 'Einladung', emoji: '🌟', description: 'Frage statt Aussage' },
  { id: 'spiegel', label: 'Spiegel', emoji: '🪞', description: 'Sie fühlt sich angesprochen' },
];

// Brand copy examples for context
const COPY_EXAMPLES = [
  'Sie funktioniert. Aber es fühlt sich nicht richtig an.',
  'Dein Körper hat das schon gewusst. Du hast nur aufgehört zuzuhören.',
  'Die Wut die du schluckst — sie hat eine Botschaft.',
  'Das ist kein Mut. Das ist etwas das tiefer ist.',
  'Die Kraft war immer da. Du hörst sie jetzt.',
];

export function GeneratorPanel({ onNavigate }: GeneratorPanelProps) {
  const { user } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [copied, setCopied] = useState(false);

  const [params, setParams] = useState({
    type: 'reel_script',
    pillar: 'emotion',
    audience: 'primary',
    tone: 'korpernah',
  });

  const selectedType = CONTENT_TYPES.find(t => t.id === params.type);
  const selectedPillar = PILLARS.find(p => p.id === params.pillar);

  const buildPrompt = () => {
    const pillar = PILLARS.find(p => p.id === params.pillar);
    const audience = AUDIENCES.find(a => a.id === params.audience);
    const tone = TONES.find(t => t.id === params.tone);

    return `Du bist Nicky Schaefer (@nicola.schaefer.life), systemische Life Coach und Mentorin in Vilcabamba, Ecuador.
Deine Marke: "Die Kraft war immer da. du hörst sie jetzt."
Dein Kernthema: "Ich darf groß sein ohne schuldig zu sein."

ZIELGRUPPE: ${audience?.label} - ${audience?.desc}
${params.audience === 'primary' ? 'Sie funktioniert für alle, für sie selbst bleibt nichts. Sie weiß was sie will, tut es aber nicht. Hat Therapie gemacht, ist trotzdem stuck.' : ''}

PILLAR: ${pillar?.label} - ${pillar?.description}
${pillar?.example ? `Für Content über: ${pillar.example}` : ''}

FORMAT: ${params.type === 'reel_script' ? 'Reel Script mit: Hook (3s), Body (20-25s), CTA. Kurze Sätze. Ein Gedanke pro Satz.' : ''}
${params.type === 'caption' ? 'Caption mit: Hook-Zeile, 2-3 Sätze正文, 3-5 Hashtags. Nie "Transformation Framework" oder "High Vibe".' : ''}
${params.type === 'story_sequence' ? 'Story Sequenz: 5-7 Slides. Slide 1: Frage/Provokation. Slides 2-5: Inhalt. Slide 6: Einladung. Slide 7: CTA.' : ''}
${params.type === 'email' ? 'Email im Stil eines persönlichen Briefs. Mehr Story als Info. Was du auf Instagram nicht sagst.' : ''}

TON: ${tone?.label} - ${tone?.description}
${params.tone === 'korpernah' ? 'Körpernah, direkt, warm. Wie eine kluge ehrliche Freundin die wirklich im Feuer war.' : ''}
${params.tone === 'mystisch' ? 'Mystische Atmosphäre aber nie esoterisch. Kein "Ayahuasca" oder "Schamanismus".' : ''}

REGELN:
- Kurze Sätze. Absätze mit einem Satz.
- Bildreiche Sprache — kein Konzept-Sprech
- Nie: "Transformation Framework", "Nervous System Regulation", "High Vibe", "Manifestation"
- Nie: Schamanismus, Ayahuasca oder spezifische Pflanzen
- Immer: "Zeremonien mit traditioneller Pflanzenmedizin in Südamerika/Ecuador"
- Maximale 5 Hashtags, relevante, keine generischen

Beispiele für deine Stimme:
"Sie funktioniert. Aber es fühlt sich nicht richtig an."
"Dein Körper hat das schon gewusst. Du hast nur aufgehört zuzuhören."
"Die Wut die du schluckst — sie hat eine Botschaft."

Generiere jetzt Content für: ${params.type} mit Pillar ${pillar?.label}`;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setIsScheduled(false);
    try {
      const prompt = buildPrompt();
      const result = await geminiService.generateContent(prompt);
      setOutput(result);
    } catch (err) {
      toast.error('Fehler bei der Generierung. API Key prüfen.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('In Zwischenablage kopiert!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSchedule = () => {
    if (!output || !user) return;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];

    addDoc(collection(db, 'calendar_posts'), {
      title: output.split('\n')[0].replace(/[#*]/g, '').trim().substring(0, 50) || `Generated ${params.type}`,
      content: output,
      type: params.type,
      pillar: params.pillar,
      date: dateStr,
      time: '18:00',
      status: 'scheduled',
      platform: 'instagram',
      authorId: user.uid,
      createdAt: serverTimestamp()
    });

    setIsScheduled(true);
    toast.success('Geplant für nächste Woche!', {
      description: `${futureDate.toLocaleDateString('de-DE')} um 18:00`
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
      toast.success('Gespeichert in Methodology Hub!');
    } catch (err) {
      toast.error('Fehler beim Speichern');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-4">
          <Sparkles size={16} className="text-amber-600" />
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">AI Content Factory — Nicky Schaefer</span>
        </div>
        <h2 className="font-display text-5xl font-bold mb-3">Content Generieren</h2>
        <p className="text-ink-muted max-w-xl mx-auto">Generiere Content mit Nickys Stimme — für die Frauen die schon auf dem Weg sind</p>
      </header>

      {/* Brand Voice Reminder */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Lightbulb size={20} className="text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800 mb-1">Brand Voice Referenz</p>
            <p className="text-xs text-amber-700 italic">"Sie funktioniert. Aber es fühlt sich nicht richtig an."</p>
            <p className="text-xs text-amber-600 mt-1">Körpernah · Direkt · Bildreich · Kurz</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Panel - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Type */}
          <div className="bg-card border border-brd rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4 flex items-center gap-2">
              <Target size={14} />
              Content Format
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {CONTENT_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setParams({ ...params, type: type.id })}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all",
                    params.type === type.id
                      ? "border-amber-500 bg-amber-50"
                      : "border-brd hover:border-amber-200"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                    params.type === type.id ? "bg-amber-500 text-white" : "bg-paper"
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
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4 flex items-center gap-2">
              <Heart size={14} />
              Content Pillar
            </h3>
            <div className="space-y-2">
              {PILLARS.map(pillar => (
                <button
                  key={pillar.id}
                  onClick={() => setParams({ ...params, pillar: pillar.id })}
                  className={cn(
                    "w-full p-4 rounded-2xl border-2 flex items-center gap-4 text-left transition-all",
                    params.pillar === pillar.id
                      ? "border-amber-500 bg-amber-50"
                      : "border-brd hover:border-amber-200"
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

          {/* Audience & Tone */}
          <div className="bg-card border border-brd rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4 flex items-center gap-2">
              <Users size={14} />
              Zielgruppe & Ton
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-ink-muted mb-2 block">Zielgruppe</label>
                <div className="space-y-2">
                  {AUDIENCES.map(aud => (
                    <button
                      key={aud.id}
                      onClick={() => setParams({ ...params, audience: aud.id })}
                      className={cn(
                        "w-full p-3 rounded-xl border-2 text-left transition-all",
                        params.audience === aud.id
                          ? "border-amber-500 bg-amber-50"
                          : "border-brd"
                      )}
                    >
                      <p className="font-bold text-sm">{aud.label}</p>
                      <p className="text-xs text-ink-muted">{aud.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-2 block">Ton</label>
                <div className="flex gap-2">
                  {TONES.map(tone => (
                    <button
                      key={tone.id}
                      onClick={() => setParams({ ...params, tone: tone.id })}
                      className={cn(
                        "flex-1 py-3 px-2 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-1",
                        params.tone === tone.id
                          ? "border-amber-500 bg-amber-50"
                          : "border-brd"
                      )}
                    >
                      <span>{tone.emoji}</span>
                      <span className="text-xs font-bold">{tone.label}</span>
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
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Generiere...
              </>
            ) : (
              <>
                <Wand2 size={24} />
                Generieren
              </>
            )}
          </button>
        </div>

        {/* Right Panel - Output */}
        <div className="lg:col-span-3 space-y-6">
          {/* Output Preview */}
          <div className="bg-card border border-brd rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-brd bg-gradient-to-r from-amber-50/50 to-orange-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    {selectedType && <selectedType.icon size={20} className="text-amber-600" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{selectedType?.label}</p>
                    <p className="text-xs text-ink-muted">{selectedPillar?.label}</p>
                  </div>
                </div>
                {output && (
                  <span className="text-xs bg-green-light text-green-700 px-3 py-1 rounded-full font-bold">
                    Generiert
                  </span>
                )}
              </div>
            </div>

            <div className="p-8 min-h-[400px]">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                  <p className="text-amber-600 font-bold animate-pulse">Generiere Content...</p>
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
                  <p className="font-bold mb-2">Noch kein Content</p>
                  <p className="text-sm">Wähle Format, Pillar und klicke Generieren</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {output && (
              <div className="p-6 border-t border-brd bg-paper/50 grid grid-cols-4 gap-3">
                <button
                  onClick={handleCopy}
                  className="py-3 px-4 bg-card border border-brd rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-50 transition-all"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Kopiert!' : 'Kopieren'}
                </button>
                <button
                  onClick={handleGenerate}
                  className="py-3 px-4 bg-card border border-brd rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-50 transition-all"
                >
                  <RefreshCw size={14} />
                  Nochmal
                </button>
                <button
                  onClick={handleSaveToMethodology}
                  className="py-3 px-4 bg-card border border-brd rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-50 transition-all"
                >
                  <Save size={14} />
                  Speichern
                </button>
                <button
                  onClick={handleSchedule}
                  disabled={isScheduled}
                  className={cn(
                    "py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all",
                    isScheduled
                      ? "bg-green-light text-green-700 border border-green-500/20"
                      : "bg-amber-500 text-white hover:bg-amber-600"
                  )}
                >
                  {isScheduled ? <Check size={14} /> : <Calendar size={14} />}
                  {isScheduled ? 'Geplant!' : 'Planen'}
                </button>
              </div>
            )}
          </div>

          {/* Voice Examples */}
          <div className="bg-card border border-brd rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-4">Beispiele für Nickys Stimme</h3>
            <div className="space-y-3">
              {COPY_EXAMPLES.map((example, i) => (
                <div key={i} className="p-4 bg-paper rounded-xl border-l-4 border-amber-400">
                  <p className="text-sm italic text-ink leading-relaxed">"{example}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
