import React, { useState, useEffect, useCallback } from 'react';
import { Note } from '@/types/note';
import { listNotes } from '@/api/notes';
import { NoteList } from '@/components/NoteList';
import { NoteEditor } from '@/components/NoteEditor';
import { NoteLinks } from '@/components/NoteLinks';
import { SearchBar } from '@/components/SearchBar';
import { TagFilter } from '@/components/TagFilter';
import { Plus, Archive, ChevronLeft, AlertTriangle } from 'lucide-react';

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

  const isEditorOpen = isCreatingNote || selectedNote !== null;
  const isBackendPending =
    error && (error.message.includes('404') || error.message.toLowerCase().includes('not found'));

  return (
    <div className="notes-layout">
      {/* ── Left: Dashboard Panel ─────────────────────────────── */}
      <div
        className="notes-panel animate-slide-right"
        style={isEditorOpen ? { maxWidth: '45%', minWidth: '320px' } : {}}
      >
        {/* Top bar */}
        <header className="notes-topbar">
          <div className="notes-topbar-left">
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
                  <span
                    data-testid="active-workspace-badge"
                  >
                    {workspaceName}
                  </span>
                  <span className="notes-breadcrumb-sep" aria-hidden="true">/</span>
                </>
              )}
              <span className="notes-breadcrumb-current">
                Knowledge Base
              </span>
            </nav>
          </div>

          <div className="notes-topbar-right">
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
              <span>Archived</span>
            </button>

            <button
              type="button"
              onClick={handleNewNote}
              className="btn-primary-dark"
            >
              <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
              <span>New Note</span>
            </button>
          </div>
        </header>

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
          {/* Error banner */}
          {error && (
            <div className="error-banner" role="alert">
              <div className="error-banner-icon" aria-hidden="true">
                <AlertTriangle size={15} />
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
                  className="btn-ghost-dark"
                  onClick={handleNewNote}
                  style={{ flexShrink: 0 }}
                >
                  Test Editor
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
                <section aria-labelledby="pinned-heading" style={{ marginBottom: '28px' }}>
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
        </main>
      </div>

      {/* ── Right: Editor Panel ──────────────────────────────── */}
      {isEditorOpen && (
        <aside className="editor-panel animate-slide-left" aria-label="Note editor">
          <div className="editor-panel-inner">
            {/* Mobile close strip */}
            <div
              style={{
                display: 'none',
                padding: '12px 16px',
                borderBottom: '1px solid var(--card-border)',
              }}
              className="editor-mobile-close"
            >
              <button type="button" onClick={closeEditor} className="btn-back">
                <ChevronLeft size={15} />
                Back to Dashboard
              </button>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <NoteEditor
                workspaceId={workspaceId}
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
                  onNavigateToNote={(id) => {
                    const found =
                      pinnedNotes.find((n) => n.id === id) ||
                      recentNotes.find((n) => n.id === id) ||
                      archivedNotes.find((n) => n.id === id);
                    if (found) {
                      handleNoteSelect(found);
                    } else {
                      closeEditor();
                      alert('Note link clicked. The note might not be in the current view.');
                    }
                  }}
                  className="sticky top-6"
                />
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};
