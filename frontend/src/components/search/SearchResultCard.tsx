import React from 'react';
import { SearchResultItem } from '@/types/search';
import { FileText, Database, Zap, Hash } from 'lucide-react';

interface SearchResultCardProps {
  result: SearchResultItem;
  onClick: (noteId: string) => void;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ result, onClick }) => {
  const formatScore = (score: number) => {
    return (score * 100).toFixed(1) + '%';
  };

  const getScoreIcon = () => {
    switch (result.search_mode) {
      case 'semantic': return <Database size={14} className="text-teal-400" />;
      case 'lexical': return <Hash size={14} className="text-blue-400" />;
      case 'hybrid': return <Zap size={14} className="text-purple-400" />;
      default: return <Database size={14} className="text-gray-400" />;
    }
  };

  return (
    <div 
      className="note-card search-result-card group"
      onClick={() => onClick(result.note_id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(result.note_id); }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 text-text font-semibold text-[15px]">
          <FileText size={16} className="text-blue-400 opacity-80" />
          {result.title}
        </div>
        <div 
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface0 border border-surface1 text-[11px] font-mono text-overlay1"
          title={result.score_meaning}
        >
          {getScoreIcon()}
          <span>{formatScore(result.score)}</span>
        </div>
      </div>
      
      <p className="text-subtext0 text-[13px] leading-relaxed line-clamp-3 mb-3">
        {result.excerpt}
      </p>

      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-overlay2">
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${result.search_mode === 'semantic' ? 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]' : result.search_mode === 'hybrid' ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]' : 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]'}`}></span>
          {result.search_mode} match
        </span>
        {result.is_archived && (
          <span className="px-1.5 py-0.5 rounded bg-surface1 text-overlay1 border border-surface2">
            Archived
          </span>
        )}
      </div>
    </div>
  );
};
