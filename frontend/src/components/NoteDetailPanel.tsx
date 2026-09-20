import React, { useEffect, useState } from 'react';
import { getNote } from '@/api/notes';
import { Note } from '@/types/note';
import { Loader2, AlertTriangle, X, Link as LinkIcon, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNoteNeighborhood } from '@/api/graph';

interface NoteDetailPanelProps {
  noteId: string;
  onClose: () => void;
  onEditNote: (note: Note) => void;
  className?: string;
}

export const NoteDetailPanel: React.FC<NoteDetailPanelProps> = ({ noteId, onClose, onEditNote, className }) => {
  const [note, setNote] = useState<Note | null>(null);
  const [neighborhood, setNeighborhood] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    
    Promise.all([
      getNote(noteId),
      getNoteNeighborhood(noteId)
    ])
      .then(([n, nbh]) => {
        if (mounted) {
          setNote(n);
          setNeighborhood(nbh);
        }
      })
      .catch(err => {
        if (mounted) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
      
    return () => { mounted = false; };
  }, [noteId]);

  if (isLoading) {
    return (
      <div className={cn("bg-[#0c1017]/95 border border-slate-700/60 rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-center", className)}>
        <Loader2 size={24} className="animate-spin text-sky-400 mb-2" />
        <p className="text-slate-400 text-sm">Loading details...</p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className={cn("bg-[#0c1017]/95 border border-slate-700/60 rounded-2xl shadow-2xl p-6 relative", className)}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200">
          <X size={18} />
        </button>
        <div className="flex items-start gap-3 text-rose-400 bg-rose-950/20 p-4 rounded-lg border border-rose-900/50 mt-4">
          <AlertTriangle size={18} className="shrink-0" />
          <p className="text-sm">{error?.message || "Note not found"}</p>
        </div>
      </div>
    );
  }

  const edgesCount = neighborhood?.edges?.length || 0;

  return (
    <div className={cn("bg-[#0c1017]/95 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col", className)}>
      <header className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-start">
        <div className="pr-8">
          <h3 className="font-bold text-slate-100 text-lg leading-tight mb-1">{note.title}</h3>
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            {note.source ? (
              <span className="flex items-center gap-1"><FileText size={12} /> Imported ({note.source.source_type})</span>
            ) : (
              <span>Created manually</span>
            )}
            <span className="flex items-center gap-1"><LinkIcon size={12} /> {edgesCount} connections</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 bg-slate-800/60 rounded-md transition-colors absolute top-4 right-4">
          <X size={16} />
        </button>
      </header>

      <main className="flex-1 p-4 overflow-y-auto space-y-4">
        {note.tags && note.tags.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tags</h4>
            <div className="flex flex-wrap gap-1.5">
              {note.tags.map(t => (
                <span key={t.id} className="px-2 py-0.5 rounded bg-sky-950/40 border border-sky-500/20 text-sky-400 text-xs font-mono lowercase">
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Preview</h4>
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 max-h-32 overflow-hidden relative">
            <div className="line-clamp-4">{note.content || "Empty note"}</div>
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none"></div>
          </div>
        </div>
      </main>

      <footer className="p-3 border-t border-slate-800 bg-slate-900/50">
        <button 
          onClick={() => onEditNote(note)}
          className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Open in Editor
        </button>
      </footer>
    </div>
  );
};
