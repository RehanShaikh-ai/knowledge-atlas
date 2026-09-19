import React, { useState, useEffect } from 'react';
import { Tag } from '@/types/tag';
import { listWorkspaceTags } from '@/api/tags';
import { Loader2, X } from 'lucide-react';

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
  className,
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
        if (mounted) setTags(res.items);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err : new Error('Failed to load tags'));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchTags();
    return () => { mounted = false; };
  }, [workspaceId]);

  if (error) {
    return (
      <span
        style={{ fontSize: '11px', color: 'var(--red)', fontFamily: 'Space Mono, monospace' }}
        className={className}
      >
        Failed to load tags
      </span>
    );
  }

  if (isLoading && tags.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--overlay1)' }} className={className}>
        <Loader2 size={12} className="spin" aria-hidden="true" style={{ color: 'var(--blue)' }} />
        <span style={{ fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>Loading tags...</span>
      </div>
    );
  }

  if (tags.length === 0) return null;

  return (
    <div className={`tag-filter-wrap ${className ?? ''}`} role="group" aria-label="Filter by tag">
      <span className="tag-filter-label">Filter</span>

      {selectedTag && (
        <button
          type="button"
          onClick={() => onSelectTag(undefined)}
          className="tag-pill active"
          aria-pressed={true}
          aria-label={`Remove tag filter: ${selectedTag}`}
        >
          {selectedTag}
          <X size={10} strokeWidth={3} aria-hidden="true" />
        </button>
      )}

      {tags.map((tag) => {
        if (tag.name === selectedTag) return null;
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onSelectTag(tag.name)}
            className="tag-pill inactive"
            aria-pressed={false}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
};
