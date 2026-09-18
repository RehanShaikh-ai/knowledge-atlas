import React, { useState, useEffect } from 'react';
import { NoteLink } from '@/types/note_link';
import { Note } from '@/types/note';
import { getNoteLinkss, createNoteLink, deleteNoteLink } from '@/api/note_links';
import { getNote } from '@/api/notes';
import { SearchBar } from './SearchBar';
import { Link2, ArrowRight, ArrowLeft, Loader2, X, Plus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
            } catch (e) {
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
    <div className={cn("flex flex-col border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden", className)}>
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm tracking-tight">
          <Link2 size={16} className="text-slate-500" />
          Note Links
        </div>
        <button
          onClick={() => setIsLinking(!isLinking)}
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Add link"
        >
          {isLinking ? <X size={16} strokeWidth={2.5} /> : <Plus size={16} strokeWidth={2.5} />}
        </button>
      </div>
      
      <div className="p-4">
        {error && (
          <div className="mb-4 text-xs text-red-600 bg-red-50/80 border border-red-100 p-2.5 rounded-lg font-medium">
            {error.message}
          </div>
        )}
        
        {isLinking && (
          <div className="mb-5 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-xs font-semibold text-indigo-800/80 uppercase tracking-wide mb-3">Search to link note</p>
            <SearchBar 
              workspaceId={workspaceId} 
              onNoteSelect={handleCreateLink}
              className="w-full shadow-none border-indigo-200/60"
            />
          </div>
        )}
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Loader2 size={24} className="animate-spin mb-2 text-indigo-400" />
            <span className="text-xs font-medium">Loading links...</span>
          </div>
        ) : incoming.length === 0 && outgoing.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm font-medium">
            No linked notes yet
          </div>
        ) : (
          <div className="space-y-6">
            {incoming.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ArrowRight size={12} strokeWidth={2.5} /> Linked from
                </h4>
                <ul className="space-y-1">
                  {incoming.map(item => (
                    <li key={item.noteId} className="flex items-center justify-between group p-1.5 -mx-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <button 
                        onClick={() => onNavigateToNote?.(item.noteId)}
                        className="text-sm text-slate-700 font-medium hover:text-indigo-600 text-left truncate pr-2 transition-colors"
                      >
                        {item.noteTitle}
                      </button>
                      <button 
                        onClick={() => handleDeleteLink(item.noteId, true)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                        title="Remove link"
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {outgoing.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ArrowLeft size={12} strokeWidth={2.5} /> Links to
                </h4>
                <ul className="space-y-1">
                  {outgoing.map(item => (
                    <li key={item.noteId} className="flex items-center justify-between group p-1.5 -mx-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <button 
                        onClick={() => onNavigateToNote?.(item.noteId)}
                        className="text-sm text-slate-700 font-medium hover:text-indigo-600 text-left truncate pr-2 transition-colors"
                      >
                        {item.noteTitle}
                      </button>
                      <button 
                        onClick={() => handleDeleteLink(item.noteId, false)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                        title="Remove link"
                      >
                        <X size={14} strokeWidth={2.5} />
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
