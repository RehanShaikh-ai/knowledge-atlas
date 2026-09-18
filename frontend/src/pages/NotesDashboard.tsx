import React, { useState, useEffect, useCallback } from 'react';
import { Note } from '@/types/note';
import { listNotes } from '@/api/notes';
import { NoteList } from '@/components/NoteList';
import { NoteEditor } from '@/components/NoteEditor';
import { NoteLinks } from '@/components/NoteLinks';
import { SearchBar } from '@/components/SearchBar';
import { TagFilter } from '@/components/TagFilter';
import { Plus, Archive, ChevronLeft } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NotesDashboardProps {
  workspaceId: string;
  workspaceName?: string;
  onBack?: () => void;
}

export const NotesDashboard: React.FC<NotesDashboardProps> = ({
  workspaceId,
  workspaceName,
  onBack,
}) => {
  const [pinnedNotes, setPinnedNotes] = useState<Note[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [isArchivedView, setIsArchivedView] = useState(false);
  const [archivedNotes, setArchivedNotes] = useState<Note[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  
  const [isLoadingPinned, setIsLoadingPinned] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);
  
  const [error, setError] = useState<Error | null>(null);
  
  const [totalNotes, setTotalNotes] = useState(0);

  // Editor State
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setError(null);
    setIsLoadingPinned(true);
    setIsLoadingRecent(true);
    
    try {
      const [pinnedRes, recentRes] = await Promise.all([
        listNotes(workspaceId, { is_pinned: true, tag: selectedTag, page_size: 100 }),
        listNotes(workspaceId, { is_archived: false, tag: selectedTag, sort: 'updated_at_desc', page_size: 100 })
      ]);
      
      setPinnedNotes(pinnedRes.items);
      
      const pinnedIds = new Set(pinnedRes.items.map(n => n.id));
      setRecentNotes(recentRes.items.filter(n => !pinnedIds.has(n.id)));
      
      setTotalNotes(recentRes.total);
    } catch (err) {
      const apiErr = err as { error?: { message?: string } };
      const msg = apiErr?.error?.message || (err instanceof Error ? err.message : 'Failed to load dashboard data');
      setError(new Error(msg));
    } finally {
      setIsLoadingPinned(false);
      setIsLoadingRecent(false);
    }
  }, [workspaceId, selectedTag]);

  const fetchArchivedData = useCallback(async () => {
    setIsLoadingArchived(true);
    try {
      const res = await listNotes(workspaceId, { is_archived: true, tag: selectedTag, sort: 'updated_at_desc', page_size: 100 });
      setArchivedNotes(res.items);
    } catch (err) {
      const apiErr = err as { error?: { message?: string } };
      const msg = apiErr?.error?.message || (err instanceof Error ? err.message : 'Failed to load archived notes');
      setError(new Error(msg));
    } finally {
      setIsLoadingArchived(false);
    }
  }, [workspaceId, selectedTag]);

  useEffect(() => {
    if (isArchivedView) {
      fetchArchivedData();
    } else {
      fetchDashboardData();
    }
  }, [workspaceId, isArchivedView, selectedTag, fetchDashboardData, fetchArchivedData]);

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    setIsCreatingNote(false);
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setIsCreatingNote(true);
  };

  const closeEditor = () => {
    setSelectedNote(null);
    setIsCreatingNote(false);
  };

  const handleNoteSaved = (note: Note) => {
    setSelectedNote(note);
    setIsCreatingNote(false);
    if (isArchivedView) {
      fetchArchivedData();
    } else {
      fetchDashboardData();
    }
  };

  const handleNoteDeleted = () => {
    closeEditor();
    if (isArchivedView) {
      fetchArchivedData();
    } else {
      fetchDashboardData();
    }
  };

  const isEditorOpen = isCreatingNote || selectedNote !== null;

  return (
    <div className="flex h-full bg-slate-50/30 min-h-screen overflow-hidden">
      {/* Main Dashboard Area */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out h-screen overflow-y-auto",
        isEditorOpen ? "w-0 lg:w-1/3 opacity-0 lg:opacity-100 hidden lg:flex" : "w-full"
      )}>
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                data-testid="back-to-workspaces"
                onClick={onBack}
                className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1 text-sm font-medium"
                title="Back to Workspaces"
              >
                <ChevronLeft size={18} />
                <span className="hidden sm:inline">Workspaces</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Knowledge Base</h1>
                {workspaceName && (
                  <span
                    data-testid="active-workspace-badge"
                    className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70 font-semibold font-mono"
                  >
                    {workspaceName}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5 font-medium">
                {totalNotes} {totalNotes === 1 ? 'note' : 'notes'} in workspace
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 overflow-visible w-full sm:w-auto">
            <SearchBar 
              workspaceId={workspaceId} 
              onNoteSelect={handleNoteSelect}
              className="w-full sm:w-64 md:w-80"
            />
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button 
                onClick={() => setIsArchivedView(!isArchivedView)}
                className={cn(
                  "p-2.5 rounded-full transition-all flex items-center justify-center gap-2 text-sm font-semibold shrink-0 min-w-[100px]",
                  isArchivedView 
                    ? "bg-slate-800 text-white shadow-md hover:bg-slate-700" 
                    : "text-slate-600 hover:bg-slate-100 bg-white border border-slate-200 hover:border-slate-300 hover:text-slate-900"
                )}
              >
                <Archive size={16} strokeWidth={2.5} />
                <span>Archived</span>
              </button>
              
              <button 
                onClick={handleNewNote}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-indigo-700 hover:shadow-md hover:-translate-y-0.5 transition-all shrink-0 min-w-[120px]"
              >
                <Plus size={18} strokeWidth={2.5} />
                <span>New Note</span>
              </button>
            </div>
          </div>
        </header>

        <div className="bg-white border-b border-slate-200/50 px-6 py-3">
            <TagFilter 
              workspaceId={workspaceId} 
              selectedTag={selectedTag}
              onSelectTag={setSelectedTag}
            />
        </div>

        <main className="flex-1 p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
          {error && (
            <div className="mb-8 p-4 bg-amber-50/90 border border-amber-200 text-amber-800 rounded-2xl flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg shrink-0 text-amber-700">
                  <Archive size={16} />
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {error.message.includes('404') || error.message.toLowerCase().includes('not found')
                      ? 'Backend Notes API Pending (Workstream B)'
                      : 'Notice loading workspace notes'}
                  </p>
                  <p className="text-xs mt-1 text-amber-700/90 leading-relaxed">
                    {error.message.includes('404') || error.message.toLowerCase().includes('not found')
                      ? 'Backend notes endpoints (/api/v1/workspaces/.../notes) are not yet implemented by Workstream B. You can still test the Note Editor and Markdown preview!'
                      : error.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleNewNote}
                className="shrink-0 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                Test Editor
              </button>
            </div>
          )}

          {isArchivedView ? (
            <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-200/50 rounded-lg text-slate-500">
                  <Archive size={18} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Archived Notes</h2>
              </div>
              <NoteList 
                notes={archivedNotes} 
                isLoading={isLoadingArchived} 
                onNoteClick={handleNoteSelect}
                emptyStateMessage="No archived notes"
                emptyStateSubMessage="Notes you archive will appear here."
              />
            </section>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {(pinnedNotes.length > 0 || isLoadingPinned) && (
                <section className="mb-12">
                  <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 tracking-tight">
                    <div className="w-1.5 h-4 rounded-full bg-amber-400 mr-1" />
                    Pinned
                  </h2>
                  <NoteList 
                    notes={pinnedNotes} 
                    isLoading={isLoadingPinned} 
                    onNoteClick={handleNoteSelect}
                    emptyStateMessage="No pinned notes"
                    emptyStateSubMessage=""
                  />
                </section>
              )}

              <section className="mb-12">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 tracking-tight">
                  <div className="w-1.5 h-4 rounded-full bg-indigo-400 mr-1" />
                  Recent Notes
                </h2>
                <NoteList 
                  notes={recentNotes} 
                  isLoading={isLoadingRecent} 
                  onNoteClick={handleNoteSelect}
                  emptyStateMessage="No recent notes"
                  emptyStateSubMessage="Create your first note to get started building your knowledge atlas."
                />
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Editor Sidebar Panel */}
      {isEditorOpen && (
        <div className="w-full lg:w-2/3 h-screen bg-slate-50/50 flex flex-col border-l border-slate-200/80 shadow-2xl z-30 animate-in slide-in-from-right-8 duration-300">
          <div className="lg:hidden p-4 bg-white border-b border-slate-200">
             <button 
               onClick={closeEditor}
               className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
             >
               <ChevronLeft size={16} /> Back to Dashboard
             </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col xl:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <NoteEditor 
                workspaceId={workspaceId}
                initialNote={selectedNote || undefined}
                onClose={closeEditor}
                onSaved={handleNoteSaved}
                onDeleted={handleNoteDeleted}
                className="h-full min-h-[700px]"
              />
            </div>
            
            {/* Note Links Panel - Only show if editing an existing note */}
            {selectedNote && (
              <div className="w-full xl:w-80 shrink-0">
                <NoteLinks 
                  workspaceId={workspaceId} 
                  noteId={selectedNote.id} 
                  onNavigateToNote={(id) => {
                    // Quick and dirty navigation for MVP - in a real app we'd fetch the note
                    // but we can just use the search API to find it, or listNotes, or just close the editor and let user find it.
                    // Wait, we can fetch it via getNote here if we want, or just trigger a fetch.
                    // Let's implement it correctly.
                    const existingNote = pinnedNotes.find(n => n.id === id) || 
                                       recentNotes.find(n => n.id === id) || 
                                       archivedNotes.find(n => n.id === id);
                    if (existingNote) {
                        handleNoteSelect(existingNote);
                    } else {
                        // If it's not in the current list, we could close the editor and let the dashboard reload,
                        // but ideally we'd fetch it. For now, close and alert.
                        closeEditor();
                        alert("Note link clicked. The note might not be in the current view.");
                    }
                  }}
                  className="sticky top-6"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
