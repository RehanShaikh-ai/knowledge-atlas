import React, { useState, useEffect } from 'react';
import { NoteVersion } from '@/types/versions';
import { getNoteVersions } from '@/api/versions';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Clock, Sparkles, GitCommit, ArrowRight } from 'lucide-react';

interface VersionHistoryPanelProps {
  noteId: string;
  onSelectVersion: (version: NoteVersion) => void;
  currentVersionId?: string;
  className?: string;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  noteId,
  onSelectVersion,
  currentVersionId,
  className = ''
}) => {
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    
    getNoteVersions(noteId)
      .then(res => {
        if (mounted) setVersions(res.items);
      })
      .catch(err => {
        if (mounted) setError(err instanceof Error ? err : new Error('Failed to load history'));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
      
    return () => { mounted = false; };
  }, [noteId]);

  if (isLoading) {
    return <LoadingState message="Loading history..." className={className} />;
  }

  if (error) {
    return <ErrorState error={error.message} className={className} />;
  }

  if (versions.length === 0) {
    return <EmptyState icon={<Clock size={32} />} message="No version history available." className={className} />;
  }

  return (
    <div className={`flex flex-col h-full bg-surface0 border-l border-surface1 overflow-y-auto ${className}`}>
      <div className="p-4 border-b border-surface1 sticky top-0 bg-surface0/95 backdrop-blur z-10 flex items-center justify-between">
        <h3 className="font-semibold text-text flex items-center gap-2">
          <Clock size={16} className="text-overlay1" />
          Version History
        </h3>
        <span className="text-xs font-mono text-overlay2">{versions.length} versions</span>
      </div>
      
      <div className="p-4 space-y-4">
        {versions.map((version, index) => {
          const isActive = version.id === currentVersionId || (index === 0 && !currentVersionId);
          
          return (
            <button
              key={version.id}
              onClick={() => onSelectVersion(version)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                isActive 
                  ? 'bg-blue-500/10 border-blue-500/30' 
                  : 'bg-surface1 border-surface2 hover:border-overlay1/30 hover:bg-surface2/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <GitCommit size={14} className={isActive ? 'text-blue-400' : 'text-overlay1'} />
                  <span className={`text-xs font-mono ${isActive ? 'text-blue-300' : 'text-overlay2'}`}>
                    {version.commit_hash.substring(0, 7)}
                  </span>
                </div>
                
                <span className="text-[10px] text-overlay1 uppercase tracking-wider font-semibold">
                  {new Date(version.created_at).toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <p className={`text-sm mb-2 line-clamp-2 ${isActive ? 'text-text' : 'text-overlay0'}`}>
                {version.message}
              </p>
              
              {version.is_ai_edit && (
                <div className="mt-2">
                  <Badge variant="purple" icon={<Sparkles size={10} />}>
                    AI Generated
                  </Badge>
                </div>
              )}
              
              {version.restored_from && (
                <div className="mt-2">
                  <Badge variant="warning" icon={<ArrowRight size={10} />}>
                    Restored from {version.restored_from.substring(0, 7)}
                  </Badge>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
