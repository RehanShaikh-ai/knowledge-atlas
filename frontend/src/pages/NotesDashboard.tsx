import React, { useState, useEffect, useCallback } from 'react';
import { Note } from '@/types/note';
import { listNotes } from '@/api/notes';
import { NoteList } from '@/components/NoteList';
import { NoteEditor } from '@/components/NoteEditor';
import { NoteLinks } from '@/components/NoteLinks';
import { SearchBar } from '@/components/SearchBar';
import { TagFilter } from '@/components/TagFilter';
import { FlowHoverButton } from '@/components/ui/flow-hover-button';
import { Plus, Archive, ChevronLeft, AlertTriangle, UploadCloud, LayoutDashboard, Share2, FileText } from 'lucide-react';
import { DashboardView } from './DashboardView';
import { GraphView } from '@/components/GraphView';
import { ImportWizard } from '@/components/ImportWizard';
import { NoteDetailPanel } from '@/components/NoteDetailPanel';
import { cn } from '@/lib/utils';

interface NotesDashboardProps {
  workspaceId: string;
  workspaceName?: string;
  userId?: string;
  onBack?: () => void;
}

type TabType = 'notes' | 'graph' | 'dashboard';

export const NotesDashboard: React.FC<NotesDashboardProps> = ({
  workspaceId,
  workspaceName,
  userId,
  onBack,
}) => {
  const [currentTab, setCurrentTab] = useState<TabType>('notes');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [graphSelectedNoteId, setGraphSelectedNoteId] = useState<string | null>(null);

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
  const [newNoteCounter, setNewNoteCounter] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    setError(null);
    setIsLoadingPinned(true);
    setIsLoadingRecent(true);

    try {
      const [pinnedRes, recentRes] = await Promise.all([
        listNotes(workspaceId, { is_pinned: true, tag: selectedTag, page_size: 100 }),
        listNotes(workspaceId, { is_archived: false, tag: selectedTag, sort: 'updated_at_desc', page_size: 100 }),
      ]);

      setPinnedNotes(pinnedRes.items);
      const pinnedIds = new Set(pinnedRes.items.map((n) => n.id));
      setRecentNotes(recentRes.items.filter((n) => !pinnedIds.has(n.id)));
      setTotalNotes(recentRes.total);
    } catch (err) {
      const apiErr = err as { error?: { message?: string } };
      const msg =
        apiErr?.error?.message ||
        (err instanceof Error ? err.message : 'Failed to load dashboard data');
      setError(new Error(msg));
    } finally {
      setIsLoadingPinned(false);
      setIsLoadingRecent(false);
    }
  }, [workspaceId, selectedTag]);

  const fetchArchivedData = useCallback(async () => {
    setIsLoadingArchived(true);
    try {
      const res = await listNotes(workspaceId, {
        is_archived: true,
        tag: selectedTag,
        sort: 'updated_at_desc',
        page_size: 100,
      });
      setArchivedNotes(res.items);
    } catch (err) {
      const apiErr = err as { error?: { message?: string } };
      const msg =
        apiErr?.error?.message ||
        (err instanceof Error ? err.message : 'Failed to load archived notes');
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
    setNewNoteCounter((c) => c + 1);
  };

  const closeEditor = () => {
    setSelectedNote(null);
    setIsCreatingNote(false);
  };

  const handleNoteSaved = (note: Note) => {
    setSelectedNote(note);
    setIsCreatingNote(false);
    if (isArchivedView) fetchArchivedData();
    else fetchDashboardData();
  };

  const handleNoteDeleted = () => {
    closeEditor();
    if (isArchivedView) fetchArchivedData();
    else fetchDashboardData();
  };

  const handleNavigateToNote = (noteId: string) => {
    const found =
      pinnedNotes.find((n) => n.id === noteId) ||
      recentNotes.find((n) => n.id === noteId) ||
      archivedNotes.find((n) => n.id === noteId);
    if (found) {
      handleNoteSelect(found);
      setCurrentTab('notes');
    } else {
      // Fallback: If not in current view, could fetch it, but for now just close editor
      closeEditor();
    }
  };

  const isEditorOpen = isCreatingNote || selectedNote !== null;
  const isBackendPending =
    error && (error.message.includes('404') || error.message.toLowerCase().includes('not found'));

  const TabButton = ({ tab, label, icon: Icon }: { tab: TabType, label: string, icon: any }) => (
    <button
      onClick={() => setCurrentTab(tab)}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
        currentTab === tab 
          ? "bg-sky-500/15 text-sky-300 border-sky-500/30" 
          : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="notes-layout">
      {/* ── Left: Main Panel ─────────────────────────────── */}
      <div
        className="notes-panel animate-slide-right flex flex-col h-full"
        style={currentTab === 'notes' && isEditorOpen ? { maxWidth: '45%', minWidth: '320px' } : {}}
      >
        {/* Top bar */}
        <header className="notes-topbar flex-wrap gap-y-3">
          <div className="notes-topbar-left w-full sm:w-auto">
            {onBack && (
              <button
                type="button"
                data-testid="back-to-workspaces"
                onClick={onBack}
                className="btn-back"
                title="Back to Workspaces"
              >
                <ChevronLeft size={15} aria-hidden="true" />
                <span className="sr-only">Back</span>
              </button>
            )}
            <nav className="notes-breadcrumb" aria-label="Location">
              {workspaceName && (
                <>
                  <span data-testid="active-workspace-badge">
                    {workspaceName}
                  </span>
                  <span className="notes-breadcrumb-sep" aria-hidden="true">/</span>
                </>
              )}
              <span className="notes-breadcrumb-current">
                Knowledge Base
              </span>
            </nav>
            
            <div className="flex items-center gap-1 ml-2">
              <TabButton tab="notes" label="Notes" icon={FileText} />
              <TabButton tab="graph" label="Graph" icon={Share2} />
              <TabButton tab="dashboard" label="Dashboard" icon={LayoutDashboard} />
            </div>
          </div>

          <div className="notes-topbar-right ml-auto">
            {currentTab === 'notes' && (
              <>
                <SearchBar
                  workspaceId={workspaceId}
                  onNoteSelect={handleNoteSelect}
                />
                <button
                  type="button"
                  onClick={() => setIsArchivedView(!isArchivedView)}
                  className={`btn-ghost-dark${isArchivedView ? ' active' : ''}`}
                  aria-pressed={isArchivedView}
                  title="Toggle archived notes"
                >
                  <Archive size={14} aria-hidden="true" />
                  <span className="hidden xl:inline">Archived</span>
                </button>
              </>
            )}

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="btn-ghost-dark flex items-center gap-2 text-sky-400 hover:text-sky-300"
            >
              <UploadCloud size={15} />
              <span className="hidden lg:inline">Import</span>
            </button>

            {currentTab === 'notes' && (
              <FlowHoverButton
                type="button"
                onClick={handleNewNote}
                icon={<Plus size={15} strokeWidth={2.5} aria-hidden="true" />}
                className="px-3.5 py-1.5 text-xs font-semibold"
              >
                New Note
              </FlowHoverButton>
            )}
          </div>
        </header>

        {currentTab === 'notes' && (
          <>
            {/* Tag strip */}
            <div className="notes-tagstrip" role="navigation" aria-label="Tag filters">
              <TagFilter
                workspaceId={workspaceId}
                selectedTag={selectedTag}
                onSelectTag={setSelectedTag}
              />
            </div>

            {/* Scrollable content */}
            <main className="notes-scroll" aria-label="Notes">
              <div className="notes-container">
                {/* Error banner */}
                {error && (
                  <div className="error-banner" role="alert">
                    <div className="error-banner-icon" aria-hidden="true">
                      <AlertTriangle size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="error-banner-title">
                        {isBackendPending
                          ? 'Backend Notes API Pending (Workstream B)'
                          : 'Error loading notes'}
                      </p>
                      <p className="error-banner-msg">
                        {isBackendPending
                          ? 'Notes endpoints (/api/v1/workspaces/.../notes) are not yet implemented. You can still test the Note Editor and Markdown preview!'
                          : error.message}
                      </p>
                    </div>
                    {isBackendPending && (
                      <button
                        type="button"
                        className="btn-ghost-dark whitespace-nowrap shrink-0"
                        onClick={handleNewNote}
                      >
                        Launch Editor
                      </button>
                    )}
                  </div>
                )}

                {isArchivedView ? (
                  <section aria-labelledby="archived-heading">
                    <h2 id="archived-heading" className="notes-section-heading">
                      <span className="node-dot" aria-hidden="true" />
                      Archived Notes
                    </h2>
                    <NoteList
                      notes={archivedNotes}
                      isLoading={isLoadingArchived}
                      onNoteClick={handleNoteSelect}
                      onNoteUpdated={handleNoteSaved}
                      onNoteDeleted={handleNoteDeleted}
                      emptyStateMessage="No archived notes"
                      emptyStateSubMessage="Notes you archive will appear here."
                    />
                  </section>
                ) : (
                  <>
                    {(pinnedNotes.length > 0 || isLoadingPinned) && (
                      <section aria-labelledby="pinned-heading" style={{ marginBottom: '32px' }}>
                        <h2 id="pinned-heading" className="notes-section-heading">
                          <span className="node-dot amber" aria-hidden="true" />
                          Pinned
                        </h2>
                        <NoteList
                          notes={pinnedNotes}
                          isLoading={isLoadingPinned}
                          onNoteClick={handleNoteSelect}
                          onNoteUpdated={handleNoteSaved}
                          onNoteDeleted={handleNoteDeleted}
                          emptyStateMessage="No pinned notes"
                          emptyStateSubMessage=""
                        />
                      </section>
                    )}

                    <section aria-labelledby="recent-heading">
                      <h2 id="recent-heading" className="notes-section-heading">
                        <span className="node-dot" aria-hidden="true" />
                        Recent Notes
                        {totalNotes > 0 && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontFamily: 'Space Mono, monospace',
                              color: 'var(--overlay0)',
                              marginLeft: '6px',
                            }}
                          >
                            {totalNotes}
                          </span>
                        )}
                      </h2>
                      <NoteList
                        notes={recentNotes}
                        isLoading={isLoadingRecent}
                        onNoteClick={handleNoteSelect}
                        onNoteUpdated={handleNoteSaved}
                        onNoteDeleted={handleNoteDeleted}
                        emptyStateMessage="No recent notes"
                        emptyStateSubMessage="Create your first note to begin building your knowledge atlas."
                      />
                    </section>
                  </>
                )}
              </div>
            </main>
          </>
        )}

        {currentTab === 'graph' && (
          <div className="flex-1 flex p-4 relative">
            <GraphView 
              workspaceId={workspaceId} 
              onNodeClick={setGraphSelectedNoteId} 
              className="flex-1"
            />
            {graphSelectedNoteId && (
              <div className="absolute top-8 right-8 w-[380px] z-20">
                <NoteDetailPanel 
                  noteId={graphSelectedNoteId} 
                  onClose={() => setGraphSelectedNoteId(null)}
                  onEditNote={(note) => {
                    handleNoteSelect(note);
                    setCurrentTab('notes');
                    setGraphSelectedNoteId(null);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {currentTab === 'dashboard' && (
          <DashboardView 
            workspaceId={workspaceId}
            onNavigateToNote={handleNavigateToNote}
          />
        )}
      </div>

      {/* ── Right: Editor Panel (Only visible on Notes tab) ──────────────────────────────── */}
      {currentTab === 'notes' && isEditorOpen && (
        <aside className="editor-panel animate-slide-left" aria-label="Note editor">
          <div className="editor-panel-inner">
            <div style={{ flex: 1, minWidth: 0 }}>
              <NoteEditor
                key={selectedNote ? selectedNote.id : `new-${newNoteCounter}`}
                workspaceId={workspaceId}
                userId={userId}
                initialNote={selectedNote || undefined}
                onClose={closeEditor}
                onSaved={handleNoteSaved}
                onDeleted={handleNoteDeleted}
                className="h-full min-h-[700px]"
              />
            </div>

            {selectedNote && (
              <div style={{ minWidth: 0 }}>
                <NoteLinks
                  workspaceId={workspaceId}
                  noteId={selectedNote.id}
                  onNavigateToNote={handleNavigateToNote}
                  className="sticky top-6"
                />
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ── Import Modal ──────────────────────────────── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 modal-overlay">
          <ImportWizard 
            workspaceId={workspaceId}
            userId={userId || '00000000-0000-0000-0000-000000000000'}
            onClose={() => setIsImportModalOpen(false)}
            onImportComplete={() => {
              fetchDashboardData();
              if (isArchivedView) fetchArchivedData();
            }}
          />
        </div>
      )}
    </div>
  );
};
