/**
 * Methodology Panel - AI insights vault
 * Extracted from App.tsx
 */

import React, { useState, useEffect } from 'react';
import { Trash2, Copy, Workflow } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { useFirebase } from '../lib/FirebaseProvider';

export function MethodologyPanel() {
  const { user } = useFirebase();
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'methodology'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInsights(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'methodology', id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 lg:space-y-10 pb-20">
      <header className="mb-6 sm:mb-8 lg:mb-10 text-center md:text-left">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-3 sm:mb-4 font-mono">METHODOLOGY_V1.0</div>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold mb-3 sm:mb-4 leading-tight">Methodology Hub</h2>
        <p className="text-xs sm:text-sm text-ink-muted max-w-xl font-medium leading-relaxed">Your personal vault of AI-generated insights, refined methodologies, and strategic prompts.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {insights.map((insight) => (
          <div key={insight.id} className="bg-card border border-brd p-6 sm:p-8 rounded-2xl hover:shadow-custom transition-all group relative flex flex-col h-full overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-accent opacity-20 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <span className="text-[9px] sm:text-[10px] font-bold bg-accent/10 text-accent px-2 sm:px-3 py-1 rounded-full font-mono tracking-widest uppercase">
                {insight.type || 'INSIGHT'}
              </span>
              <button onClick={() => handleDelete(insight.id)} className="text-ink-muted hover:text-rose-500 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
            <h3 className="font-display text-lg sm:text-xl mb-3 sm:mb-4 leading-tight font-bold tracking-tight text-ink">
              {insight.title || 'Untitled Insight'}
            </h3>
            <div className="flex-1 text-sm leading-relaxed text-ink/80 bg-paper/50 p-4 sm:p-6 rounded-xl border border-brd/50 font-medium overflow-auto">
              <div className="markdown-body">
                <ReactMarkdown>{insight.content}</ReactMarkdown>
              </div>
            </div>
            <div className="mt-4 sm:mt-6 flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] text-ink-muted font-mono uppercase tracking-widest">
                {new Date(insight.createdAt?.toDate()).toLocaleDateString()}
              </span>
              <button onClick={() => navigator.clipboard.writeText(insight.content)} className="p-2 hover:bg-paper rounded-lg transition-colors text-ink-muted hover:text-accent">
                <Copy size={16} />
              </button>
            </div>
          </div>
        ))}
        {insights.length === 0 && (
          <div className="col-span-full py-20 sm:py-28 lg:py-32 border-2 border-dashed border-brd rounded-2xl flex flex-col items-center justify-center text-ink-muted gap-3 sm:gap-4 opacity-40">
            <Workflow size={48} />
            <p className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest">No methodology items saved yet</p>
          </div>
        )}
      </div>
    </div>
  );
}