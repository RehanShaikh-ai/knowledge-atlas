import React, { useState, useEffect, useCallback } from 'react';
import { Note } from '@/types/note';
import { listNotes } from '@/api/notes';
import { NoteList } from '@/components/NoteList';
import { Plus, Search, Tags, Archive } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NotesDashboardProps {
  workspaceId: string;
}

export const NotesDashboard: React.FC<NotesDashboardProps> = ({ workspaceId }) => {
  const [pinnedNotes, setPinnedNotes] = useState<Note[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [isArchivedView, setIsArchivedView] = useState(false);
  const [archivedNotes, setArchivedNotes] = useState<Note[]>([]);
  
  const [isLoadingPinned, setIsLoadingPinned] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);
  
  const [error, setError] = useState<Error | null>(null);
  
  const [totalNotes, setTotalNotes] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    setError(null);
    setIsLoadingPinned(true);
    setIsLoadingRecent(true);
    
    try {
      const [pinnedRes, recentRes] = await Promise.all([
        listNotes(workspaceId, { is_pinned: true, page_size: 100 }),
        listNotes(workspaceId, { is_archived: false, sort: 'updated_at_desc', page_size: 100 })
      ]);
      
      setPinnedNotes(pinnedRes.items);
      
      const pinnedIds = new Set(pinnedRes.items.map(n => n.id));
      setRecentNotes(recentRes.items.filter(n => !pinnedIds.has(n.id)));
      
      setTotalNotes(recentRes.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load dashboard data'));
    } finally {
      setIsLoadingPinned(false);
      setIsLoadingRecent(false);
    }
  }, [workspaceId]);

  const fetchArchivedData = useCallback(async () => {
    setIsLoadingArchived(true);
    try {
      const res = await listNotes(workspaceId, { is_archived: true, sort: 'updated_at_desc', page_size: 100 });
      setArchivedNotes(res.items);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load archived notes'));
    } finally {
      setIsLoadingArchived(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (isArchivedView) {
      fetchArchivedData();
    } else {
      fetchDashboardData();
    }
  }, [workspaceId, isArchivedView, fetchDashboardData, fetchArchivedData]);

  return (
    <div className="flex flex-col h-full bg-slate-50/30 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Knowledge Base</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {totalNotes} {totalNotes === 1 ? 'note' : 'notes'} in workspace
          </p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0">
          <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0" title="Search Notes">
            <Search size={18} strokeWidth={2.5} />
          </button>
          
          <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0" title="Filter by Tags">
            <Tags size={18} strokeWidth={2.5} />
          </button>
          
          <div className="w-px h-6 bg-slate-200 mx-1 shrink-0" />
          
          <button 
            onClick={() => setIsArchivedView(!isArchivedView)}
            className={cn(
              "p-2.5 sm:px-4 rounded-full transition-all flex items-center gap-2 text-sm font-semibold shrink-0",
              isArchivedView 
                ? "bg-slate-800 text-white shadow-md hover:bg-slate-700" 
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Archive size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Archived</span>
          </button>
          
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-full font-semibold hover:bg-indigo-700 hover:shadow-md hover:-translate-y-0.5 transition-all shrink-0 ml-1">
            <Plus size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">New Note</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        {error && (
          <div className="mb-8 p-4 bg-red-50/80 border border-red-200/80 text-red-700 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg shrink-0">
              <Archive className="text-red-600" size={16} />
            </div>
            <div>
              <p className="font-semibold text-sm">Error loading dashboard</p>
              <p className="text-sm mt-1 text-red-600/80 leading-relaxed">{error.message}</p>
            </div>
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
              emptyStateMessage="No archived notes"
              emptyStateSubMessage="Notes you archive will appear here to keep your main workspace clean."
            />
          </section>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Pinned Section */}
            {(pinnedNotes.length > 0 || isLoadingPinned) && (
              <section className="mb-12">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 tracking-tight">
                  <div className="w-1.5 h-4 rounded-full bg-amber-400 mr-1" />
                  Pinned
                </h2>
                <NoteList 
                  notes={pinnedNotes} 
                  isLoading={isLoadingPinned} 
                  emptyStateMessage="No pinned notes"
                  emptyStateSubMessage=""
                />
              </section>
            )}

            {/* Recent Section */}
            <section className="mb-12">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 tracking-tight">
                <div className="w-1.5 h-4 rounded-full bg-indigo-400 mr-1" />
                Recent Notes
              </h2>
              <NoteList 
                notes={recentNotes} 
                isLoading={isLoadingRecent} 
                emptyStateMessage="No recent notes"
                emptyStateSubMessage="Create your first note to get started building your knowledge atlas."
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
