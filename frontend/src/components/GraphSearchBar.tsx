import React, { useState, useEffect, useRef } from 'react';
import { searchGraph } from '@/api/graph';
import { GraphSearchResponse, GraphSearchEntityMatch, GraphSearchNoteMatch } from '@/types/graph_search';
import { getEntityTypeColor } from '@/lib/graph_constants';
import { Search, Loader2, X, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GraphSearchBarProps {
  workspaceId: string;
  onSelectEntity?: (entityId: string) => void;
  onSelectNote?: (noteId: string) => void;
  onHighlightEntities?: (entityIds: string[]) => void;
  className?: string;
  placeholder?: string;
}

export const GraphSearchBar: React.FC<GraphSearchBarProps> = ({
  workspaceId,
  onSelectEntity,
  onSelectNote,
  onHighlightEntities,
  className,
  placeholder = 'Search entities & notes...',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GraphSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHighlightedRef = useRef(false);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setIsSearching(false);
      setIsOpen(false);
      setError(null);
      if (hasHighlightedRef.current && onHighlightEntities) {
        hasHighlightedRef.current = false;
        onHighlightEntities([]);
      }
      return;
    }

    setIsSearching(true);
    setError(null);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await searchGraph(workspaceId, trimmed, 20);
        setResults(res);
        setIsOpen(true);
        if (onHighlightEntities) {
          const ids = res.entities.map((e) => e.id);
          hasHighlightedRef.current = ids.length > 0;
          onHighlightEntities(ids);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Search failed';
        setError(msg);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, workspaceId, onHighlightEntities]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setQuery('');
    setResults(null);
    setIsOpen(false);
    if (onHighlightEntities) {
      onHighlightEntities([]);
    }
  };

  const handleEntityClick = (entity: GraphSearchEntityMatch) => {
    if (onSelectEntity) {
      onSelectEntity(entity.id);
    }
    if (onHighlightEntities) {
      onHighlightEntities([entity.id]);
    }
    setIsOpen(false);
  };

  const handleNoteClick = (note: GraphSearchNoteMatch) => {
    if (onSelectNote) {
      onSelectNote(note.id);
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      data-testid="graph-search-bar"
      className={cn('relative w-72 text-slate-200', className)}
    >
      <div className="relative flex items-center">
        <div className="absolute left-3 text-slate-400 pointer-events-none">
          {isSearching ? (
            <Loader2 size={15} className="animate-spin text-sky-400" />
          ) : (
            <Search size={15} />
          )}
        </div>
        <input
          data-testid="graph-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-slate-950/60 border border-white/[0.08] focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 rounded-xl pl-9 pr-8 py-2 text-xs placeholder-slate-500 focus:outline-none backdrop-blur-xl transition-all shadow-inner text-slate-100"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 text-slate-500 hover:text-slate-300 p-0.5 rounded-full hover:bg-white/[0.08] transition-colors"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results && (
        <div
          data-testid="graph-search-dropdown"
          className="absolute left-0 right-0 mt-2 bg-slate-950/90 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/70 backdrop-blur-2xl overflow-hidden z-40 max-h-80 overflow-y-auto animate-fade-in"
        >
          {error && (
            <div className="p-3 text-xs text-rose-300 bg-rose-950/40 border-b border-rose-900/30">
              {error}
            </div>
          )}

          {results.total === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400" data-testid="graph-search-empty">
              No matching entities or notes found.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {/* Entities Section */}
              {results.entities.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={11} className="text-sky-400" />
                    <span>Entities ({results.entities.length})</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {results.entities.map((entity) => (
                      <button
                        key={entity.id}
                        type="button"
                        data-testid={`search-result-entity-${entity.id}`}
                        onClick={() => handleEntityClick(entity)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: getEntityTypeColor(entity.entity_type) }}
                          />
                          <span className="text-xs font-medium text-slate-200 group-hover:text-sky-300 truncate">
                            {entity.name}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06] shrink-0">
                          {entity.entity_type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {results.notes.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={11} className="text-amber-400" />
                    <span>Related Notes ({results.notes.length})</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {results.notes.map((note) => (
                      <button
                        key={note.id}
                        type="button"
                        data-testid={`search-result-note-${note.id}`}
                        onClick={() => handleNoteClick(note)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] flex flex-col transition-colors group"
                      >
                        <span className="text-xs font-medium text-slate-200 group-hover:text-amber-300 truncate">
                          {note.title}
                        </span>
                        {note.match_reason && (
                          <span className="text-[10px] text-slate-500 truncate mt-0.5">
                            {note.match_reason}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
