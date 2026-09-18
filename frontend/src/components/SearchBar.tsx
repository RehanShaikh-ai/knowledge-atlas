import React, { useState, useEffect, useRef } from 'react';
import { Note } from '@/types/note';
import { searchNotes } from '@/api/notes';
import { Search, Loader2, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
      const res = await searchNotes(workspaceId, searchQuery, { page_size: 10 });
      setResults(res.items);
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
      debounceRef.current = setTimeout(() => {
        performSearch(val);
      }, 300);
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
    <div className={cn("relative w-full max-w-md", className)} ref={containerRef}>
      <div className={cn(
        "relative flex items-center bg-white border transition-all duration-200",
        isOpen ? "rounded-t-xl border-indigo-400 ring-4 ring-indigo-50" : "rounded-full border-slate-200 hover:border-slate-300 shadow-sm"
      )}>
        <div className="pl-4 text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
          placeholder="Search notes by title, content, or tag..."
          className="w-full bg-transparent border-none focus:ring-0 py-2.5 px-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none"
        />
        {query && (
          <button 
            onClick={clearSearch}
            className="pr-4 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : <X size={16} />}
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 bg-white border border-t-0 border-slate-200 rounded-b-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          {error ? (
            <div className="p-4 text-center text-sm text-red-500 bg-red-50/50">
              {error.message}
            </div>
          ) : isLoading && results.length === 0 ? (
            <div className="p-8 flex flex-col items-center text-slate-400">
              <Loader2 size={24} className="animate-spin mb-3 text-indigo-400" />
              <p className="text-sm font-medium">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p className="text-sm font-bold text-slate-700 mb-1">No results found</p>
              <p className="text-xs">Try adjusting your search terms</p>
            </div>
          ) : (
            <ul className="py-2">
              {results.map(note => (
                <li key={note.id}>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onNoteSelect?.(note);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex flex-col transition-colors border-b border-slate-50 last:border-0"
                  >
                    <span className="text-sm font-bold text-slate-800 line-clamp-1">{note.title}</span>
                    <span className="text-xs text-slate-500 line-clamp-1 mt-1 font-medium">{note.content}</span>
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
