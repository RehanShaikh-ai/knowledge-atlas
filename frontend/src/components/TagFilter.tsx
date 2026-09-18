import React, { useState, useEffect } from 'react';
import { Tag } from '@/types/tag';
import { listWorkspaceTags } from '@/api/tags';
import { Loader2, Tag as TagIcon, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TagFilterProps {
  workspaceId: string;
  selectedTag?: string;
  onSelectTag: (tagName: string | undefined) => void;
  className?: string;
}

export const TagFilter: React.FC<TagFilterProps> = ({ 
  workspaceId, 
  selectedTag, 
  onSelectTag, 
  className 
}) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchTags = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await listWorkspaceTags(workspaceId);
        if (mounted) {
          setTags(res.items);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load tags'));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchTags();
    
    return () => { mounted = false; };
  }, [workspaceId]);

  if (error) {
    return (
      <div className={cn("text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-full inline-flex border border-red-100", className)}>
        Failed to load tags
      </div>
    );
  }

  if (isLoading && tags.length === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-slate-400 px-2 py-1", className)}>
        <Loader2 size={14} className="animate-spin text-indigo-400" />
        <span className="font-medium">Loading tags...</span>
      </div>
    );
  }

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2 flex-nowrap overflow-x-auto pb-2 sm:pb-0", className)} style={{ scrollbarWidth: 'none' }}>
      <div className="flex items-center gap-1.5 text-slate-400 shrink-0 mr-1">
        <TagIcon size={16} />
        <span className="text-sm font-semibold tracking-wide uppercase">Filter</span>
      </div>
      
      {selectedTag && (
        <button
          onClick={() => onSelectTag(undefined)}
          className="shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-colors uppercase tracking-wide"
        >
          {selectedTag}
          <X size={12} className="ml-1 opacity-80 hover:opacity-100" strokeWidth={3} />
        </button>
      )}
      
      {tags.map(tag => {
        if (tag.name === selectedTag) return null;
        return (
          <button
            key={tag.id}
            onClick={() => onSelectTag(tag.name)}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-300/50"
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
};
