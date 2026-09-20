import React from 'react';
import { Note } from '@/types/note';
import { NoteCard } from './NoteCard';
import { Loader2, FileText } from 'lucide-react';

interface NoteListProps {
  notes: Note[];
  isLoading?: boolean;
  error?: Error | null;
  onNoteClick?: (note: Note) => void;
  onNoteUpdated?: (note: Note) => void;
  onNoteDeleted?: () => void;
  emptyStateMessage?: string;
  emptyStateSubMessage?: string;
  className?: string;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  isLoading,
  error,
  onNoteClick,
  onNoteUpdated,
  onNoteDeleted,
  emptyStateMessage = 'No notes found',
  emptyStateSubMessage = 'Create a new note to start building your knowledge base.',
  className,
}) => {
  if (isLoading) {
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', color: 'var(--overlay1)' }}
        className={className}
      >
        <Loader2 size={22} className="spin" aria-hidden="true" style={{ marginBottom: '12px', color: 'var(--blue)' }} />
        <p style={{ fontSize: '13px', margin: 0 }}>Loading notes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{ padding: '24px', textAlign: 'center', border: '1px solid rgba(243,139,168,0.2)', borderRadius: '8px', background: 'rgba(243,139,168,0.04)' }}
        className={className}
      >
        <p style={{ fontSize: '13px', color: 'var(--red)', fontWeight: 600, margin: '0 0 4px' }}>Failed to load notes</p>
        <p style={{ fontSize: '12px', color: 'var(--overlay1)', margin: 0 }}>{error.message}</p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className={`notes-empty ${className ?? ''}`}>
        <div className="notes-empty-icon" aria-hidden="true">
          <FileText size={20} strokeWidth={1.5} />
        </div>
        <p className="notes-empty-title">{emptyStateMessage}</p>
        {emptyStateSubMessage && (
          <p className="notes-empty-sub">{emptyStateSubMessage}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`notes-grid ${className ?? ''}`}>
      {notes.map((note, idx) => (
        <div key={note.id} className={`animate-fade-in stagger-${(idx % 5) + 1}`}>
          <NoteCard
            note={note}
            onClick={onNoteClick}
            onNoteUpdated={onNoteUpdated}
            onNoteDeleted={onNoteDeleted}
          />
        </div>
      ))}
    </div>
  );
};
