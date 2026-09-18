import React from 'react';
import { Note } from '@/types/note';
import { NoteCard } from './NoteCard';
import { Loader2, FileText } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NoteListProps {
  notes: Note[];
  isLoading?: boolean;
  error?: Error | null;
  onNoteClick?: (note: Note) => void;
  emptyStateMessage?: string;
  emptyStateSubMessage?: string;
  className?: string;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  isLoading,
  error,
  onNoteClick,
  emptyStateMessage = "No notes found",
  emptyStateSubMessage = "Create a new note to start building your knowledge base.",
  className,
}) => {
  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-16 text-slate-400", className)}>
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-slate-300" />
        <p className="text-sm font-medium">Loading notes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-6 text-center border border-red-100 bg-red-50/50 rounded-2xl", className)}>
        <p className="text-sm text-red-600 font-medium">Failed to load notes</p>
        <p className="text-xs text-red-500/80 mt-1.5">{error.message}</p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50", className)}>
        <div className="bg-white p-3 rounded-full shadow-sm mb-4 border border-slate-100 text-slate-300">
          <FileText className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-slate-600">{emptyStateMessage}</p>
        {emptyStateSubMessage && (
          <p className="text-xs text-slate-400 mt-1.5 max-w-[250px] leading-relaxed">
            {emptyStateSubMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 auto-rows-[minmax(180px,auto)]", 
      className
    )}>
      {notes.map(note => (
        <NoteCard 
          key={note.id} 
          note={note} 
          onClick={onNoteClick} 
          className="h-full"
        />
      ))}
    </div>
  );
};
