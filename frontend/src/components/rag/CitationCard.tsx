import React from 'react';
import { CitedSource } from '@/types/rag';
import { FileText, Quote } from 'lucide-react';

interface CitationCardProps {
  citation: CitedSource;
  index: number;
  onNavigate?: (noteId: string) => void;
}

export const CitationCard: React.FC<CitationCardProps> = ({ citation, index, onNavigate }) => {
  return (
    <div 
      className="note-card group bg-surface0 border border-surface1 hover:border-blue-400/40 p-4 transition-all"
      onClick={() => onNavigate?.(citation.note_id)}
      role={onNavigate ? "button" : "article"}
      tabIndex={onNavigate ? 0 : -1}
      onKeyDown={(e) => { if (e.key === 'Enter' && onNavigate) onNavigate(citation.note_id); }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-mono text-[11px] font-bold mt-0.5">
          {index}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-text font-semibold text-[14px] mb-1.5 truncate">
            <FileText size={14} className="text-overlay1 shrink-0" />
            <span className="truncate">{citation.title}</span>
          </div>
          
          <div className="relative">
            <Quote size={12} className="absolute left-0 top-1 text-overlay2 opacity-50" />
            <p className="text-subtext0 text-[12.5px] leading-relaxed pl-4 line-clamp-3 italic">
              {citation.excerpt}
            </p>
          </div>
          
          <div className="mt-3 flex items-center gap-2">
            <div className="px-2 py-0.5 rounded bg-surface1 border border-surface2 text-overlay1 font-mono text-[10px] tracking-wider uppercase">
              Match: {(citation.score * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
