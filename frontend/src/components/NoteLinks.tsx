import React, { useState, useEffect } from 'react';
import { NoteLink } from '@/types/note_link';
import { Note } from '@/types/note';
import { getNoteLinkss, createNoteLink, deleteNoteLink } from '@/api/note_links';
import { getNote } from '@/api/notes';
import { SearchBar } from './SearchBar';
import { Link2, ArrowRight, ArrowLeft, Loader2, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoteLinksProps {
  workspaceId: string;
  noteId: string;
  onNavigateToNote?: (noteId: string) => void;
  className?: string;
}

interface LinkedNoteDetails {
  link: NoteLink;
  noteTitle: string;
  noteId: string;
}

export const NoteLinks: React.FC<NoteLinksProps> = ({ 
  workspaceId, 
  noteId, 
  onNavigateToNote,
  className 
}) => {
  const [incoming, setIncoming] = useState<LinkedNoteDetails[]>([]);
  const [outgoing, setOutgoing] = useState<LinkedNoteDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const fetchLinks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getNoteLinkss(noteId);
        
        const fetchDetails = async (links: NoteLink[], isIncoming: boolean) => {
          return Promise.all(links.map(async (link) => {
            const targetId = isIncoming ? link.source_note_id : link.target_note_id;
            let noteTitle = 'Unknown Note';
            try {
              const note = await getNote(targetId);
              noteTitle = note.title;
            } catch {
              console.warn('Failed to fetch linked note', targetId);
            }
            return { link, noteTitle, noteId: targetId };
          }));
        };
        
        const [incomingDetails, outgoingDetails] = await Promise.all([
          fetchDetails(res.incoming, true),
          fetchDetails(res.outgoing, false)
        ]);
        
        if (mounted) {
          setIncoming(incomingDetails);
          setOutgoing(outgoingDetails);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load links'));
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    
    fetchLinks();
    
    return () => { mounted = false; };
  }, [noteId]);

  const handleCreateLink = async (targetNote: Note) => {
    if (targetNote.id === noteId) {
      setError(new Error("Cannot link a note to itself"));
      return;
    }
    
    try {
      const newLink = await createNoteLink(noteId, targetNote.id);
      setOutgoing(prev => [...prev, {
        link: newLink,
        noteId: targetNote.id,
        noteTitle: targetNote.title
      }]);
      setIsLinking(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create link'));
    }
  };

  const handleDeleteLink = async (targetNoteId: string, isIncoming: boolean) => {
    try {
      if (isIncoming) {
        await deleteNoteLink(targetNoteId, noteId);
        setIncoming(prev => prev.filter(n => n.noteId !== targetNoteId));
      } else {
        await deleteNoteLink(noteId, targetNoteId);
        setOutgoing(prev => prev.filter(n => n.noteId !== targetNoteId));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete link'));
    }
  };

  return (
    <div className={cn("flex flex-col border border-white/[0.08] rounded-2xl bg-slate-950/80 shadow-2xl backdrop-blur-2xl text-slate-100 overflow-hidden", className)}>
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2 text-slate-200 font-bold text-sm tracking-tight">
          <Link2 size={16} className="text-sky-400" />
          Note Links
        </div>
        <button
          type="button"
          onClick={() => setIsLinking(!isLinking)}
          className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-sky-500/15 rounded-lg transition-colors border border-transparent hover:border-sky-500/30"
          title="Add link"
        >
          {isLinking ? <X size={16} strokeWidth={2.5} /> : <Plus size={16} strokeWidth={2.5} />}
        </button>
      </div>
      
      <div className="p-4">
        {error && (
          <div className="mb-4 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-lg font-medium">
            {error.message}
          </div>
        )}
        
        {isLinking && (
          <div className="mb-5 p-3.5 bg-sky-500/[0.06] rounded-xl border border-sky-500/25 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-[11px] font-semibold text-sky-300 uppercase tracking-wider mb-2.5">Search to link note</p>
            <SearchBar 
              workspaceId={workspaceId} 
              onNoteSelect={handleCreateLink}
              className="w-full shadow-none border-sky-500/30"
            />
          </div>
        )}
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Loader2 size={24} className="animate-spin mb-2 text-sky-400" />
            <span className="text-xs font-mono">Loading constellation links...</span>
          </div>
        ) : incoming.length === 0 && outgoing.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs font-mono">
            No linked notes yet
          </div>
        ) : (
          <div className="space-y-5">
            {incoming.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
                  <ArrowRight size={12} strokeWidth={2.5} className="text-sky-400" /> Linked from
                </h4>
                <ul className="space-y-1">
                  {incoming.map(item => (
                    <li key={item.noteId} className="flex items-center justify-between group px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] border border-transparent hover:border-white/[0.08] transition-colors">
                      <button 
                        type="button"
                        onClick={() => onNavigateToNote?.(item.noteId)}
                        className="text-xs sm:text-sm text-slate-300 font-medium hover:text-sky-300 text-left truncate pr-2 transition-colors"
                      >
                        {item.noteTitle}
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteLink(item.noteId, true)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded transition-all"
                        title="Remove link"
                      >
                        <X size={13} strokeWidth={2.5} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {outgoing.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
                  <ArrowLeft size={12} strokeWidth={2.5} className="text-purple-400" /> Links to
                </h4>
                <ul className="space-y-1">
                  {outgoing.map(item => (
                    <li key={item.noteId} className="flex items-center justify-between group px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] border border-transparent hover:border-white/[0.08] transition-colors">
                      <button 
                        type="button"
                        onClick={() => onNavigateToNote?.(item.noteId)}
                        className="text-xs sm:text-sm text-slate-300 font-medium hover:text-sky-300 text-left truncate pr-2 transition-colors"
                      >
                        {item.noteTitle}
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteLink(item.noteId, false)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded transition-all"
                        title="Remove link"
                      >
                        <X size={13} strokeWidth={2.5} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
