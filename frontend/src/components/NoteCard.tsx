import React from 'react';
import { Note } from '@/types/note';
import { Pin, Archive } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NoteCardProps {
  note: Note;
  onClick?: (note: Note) => void;
  className?: string;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onClick, className }) => {
  const formattedDate = new Date(note.updated_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={() => onClick?.(note)}
      role="article"
      aria-label={`Note: ${note.title}`}
      className={cn(
        "group relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 ease-out",
        "hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 cursor-pointer",
        note.is_pinned 
          ? "border-amber-200 bg-amber-50/50" 
          : "border-slate-200/60 bg-white hover:border-slate-300/80",
        note.is_archived && "opacity-60 bg-slate-50 border-slate-200 hover:opacity-100",
        className
      )}
    >
      <div className="flex justify-between items-start mb-3 gap-3">
        <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2">
          {note.title}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          {note.is_pinned && (
            <div className="p-1 rounded-full bg-amber-100/80 text-amber-600" title="Pinned">
              <Pin size={14} className="fill-current" />
            </div>
          )}
          {note.is_archived && (
            <div className="p-1 rounded-full bg-slate-100 text-slate-500" title="Archived">
              <Archive size={14} />
            </div>
          )}
        </div>
      </div>
      
      <p className="text-sm text-slate-600 line-clamp-3 mb-5 leading-relaxed font-normal">
        {note.content}
      </p>

      <div className="flex items-end justify-between mt-auto">
        <div className="flex flex-wrap gap-1.5">
          {note.tags.map((tag, i) => i < 3 ? (
            <span 
              key={tag.id} 
              className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wide bg-slate-100/80 text-slate-600 uppercase"
            >
              {tag.name}
            </span>
          ) : null)}
          {note.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium text-slate-500 bg-slate-50">
              +{note.tags.length - 3}
            </span>
          )}
        </div>
        <time dateTime={note.updated_at} className="text-[11px] font-medium text-slate-400 shrink-0 ml-3">
          {formattedDate}
        </time>
      </div>
    </div>
  );
};
