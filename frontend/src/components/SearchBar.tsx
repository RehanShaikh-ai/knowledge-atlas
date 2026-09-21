import React, { useState, useEffect, useRef } from 'react';
import { Note } from '@/types/note';
import { searchNotes } from '@/api/search';
import { Search, Loader2, X } from 'lucide-react';

interface SearchBarProps {
  workspaceId: string;
  onNoteSelect?: (note: Note) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ workspaceId, onNoteSelect, className }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    setIsOpen(true);
    try {
      const res = await searchNotes(workspaceId, {
        query: searchQuery,
        mode: 'hybrid',
        limit: 10
      });
      // Map SearchResultItem to Note structure expected by NoteLinks
      setResults(res.results.map(r => ({
        id: r.note_id,
        title: r.title,
        content: r.excerpt,
        workspace_id: workspaceId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_archived: false,
        is_pinned: false
      } as Note)));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Search failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim()) {
      debounceRef.current = setTimeout(() => performSearch(val), 300);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div
      className={`search-container ${className ?? ''}`}
      ref={containerRef}
      style={{ position: 'relative' }}
    >
      <div className={`search-input-wrap${isOpen ? ' open' : ''}`}>
        <Search size={14} className="search-icon" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
          placeholder="Search notes..."
          aria-label="Search notes by title, content, or tag"
          className="search-input"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="search-clear-btn"
            aria-label="Clear search"
          >
            {isLoading
              ? <Loader2 size={13} className="spin" aria-hidden="true" style={{ color: 'var(--blue)' }} />
              : <X size={13} aria-hidden="true" />}
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="search-dropdown" role="listbox" aria-label="Search results">
          {error ? (
            <div className="search-state" style={{ color: 'var(--red)' }}>
              {error.message}
            </div>
          ) : isLoading && results.length === 0 ? (
            <div className="search-state">
              <Loader2 size={18} className="spin" aria-hidden="true" style={{ color: 'var(--blue)', marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '12px' }}>Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="search-state">
              <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--subtext1)' }}>No results found</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--overlay1)' }}>Try adjusting your search terms</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {results.map((note) => (
                <li key={note.id}>
                  <button
                    role="option"
                    aria-selected={false}
                    onClick={() => {
                      setIsOpen(false);
                      onNoteSelect?.(note);
                    }}
                    className="search-result-item"
                  >
                    <span className="search-result-title">{note.title}</span>
                    <span className="search-result-preview">{note.content}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
