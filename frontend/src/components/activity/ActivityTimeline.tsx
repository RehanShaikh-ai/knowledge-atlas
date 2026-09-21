import React, { useState, useEffect } from 'react';
import { ActivityItem } from '@/types/activity';
import { getWorkspaceActivity } from '@/api/activity';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { FilePlus, Edit3, Trash2, RotateCcw, Database, UploadCloud, Clock } from 'lucide-react';

interface ActivityTimelineProps {
  workspaceId: string;
  onNavigateToNote?: (noteId: string) => void;
  className?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  workspaceId,
  onNavigateToNote,
  className = ''
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    
    getWorkspaceActivity(workspaceId, 50)
      .then(res => {
        if (mounted) setActivities(res.items);
      })
      .catch(err => {
        if (mounted) setError(err instanceof Error ? err : new Error('Failed to load activity'));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
      
    return () => { mounted = false; };
  }, [workspaceId]);

  const getEventConfig = (event: ActivityItem) => {
    switch (event.event_type) {
      case 'note_created':
        return { icon: FilePlus, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'created' };
      case 'note_updated':
        return { icon: Edit3, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', text: 'updated' };
      case 'note_deleted':
        return { icon: Trash2, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'deleted' };
      case 'note_restored':
        return { icon: RotateCcw, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'restored' };
      case 'note_indexed':
        return { icon: Database, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'indexed' };
      case 'import_completed':
        return { icon: UploadCloud, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'imported sources' };
      default:
        return { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'performed action' };
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading timeline..." className={className} />;
  }

  if (error) {
    return <ErrorState error={error.message} className={className} />;
  }

  if (activities.length === 0) {
    return (
      <EmptyState 
        icon={<Clock size={32} />} 
        message="Quiet around here" 
        subMessage="No activity has been recorded yet."
        className={className}
      />
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Clock size={16} className="text-overlay1" />
        <h3 className="font-semibold text-text text-sm">Recent Activity</h3>
      </div>
      
      <div className="relative pl-3 space-y-6 before:absolute before:inset-y-0 before:left-[17px] before:w-[2px] before:bg-surface2">
        {activities.map((activity) => {
          const config = getEventConfig(activity);
          const Icon = config.icon;
          
          return (
            <div key={activity.id} className="relative flex items-start gap-4">
              <div className={`relative z-10 flex items-center justify-center w-[20px] h-[20px] rounded-full mt-0.5 ${config.bg} ${config.border} border`}>
                <Icon size={10} className={config.color} />
              </div>
              
              <div className="flex-1 min-w-0 bg-surface0 border border-surface1 rounded-lg p-3 hover:border-surface2 transition-colors">
                <div className="flex items-center gap-2 text-[13px] text-text flex-wrap">
                  <span className="font-medium text-overlay1">You</span>
                  <span className="text-overlay2">{config.text}</span>
                  
                  {activity.note_title && activity.note_id && activity.event_type !== 'note_deleted' ? (
                    <button 
                      onClick={() => onNavigateToNote?.(activity.note_id!)}
                      className={`font-semibold truncate max-w-[200px] hover:underline ${config.color}`}
                    >
                      {activity.note_title}
                    </button>
                  ) : activity.note_title ? (
                    <span className={`font-semibold truncate max-w-[200px] opacity-70 ${config.color}`}>
                      {activity.note_title}
                    </span>
                  ) : null}
                  
                  {activity.event_type === 'import_completed' && activity.metadata?.source_count !== undefined && (
                    <span className="font-semibold text-blue-400">
                      {String(activity.metadata.source_count)} sources
                    </span>
                  )}
                </div>
                
                <div className="mt-1.5 text-[11px] font-mono text-overlay1 flex items-center gap-2">
                  <span>{new Date(activity.created_at).toLocaleString()}</span>
                  {activity.event_type === 'note_restored' && typeof activity.metadata?.commit_hash === 'string' && (
                     <span className="bg-surface1 px-1.5 py-0.5 rounded text-amber-400">
                       from {activity.metadata.commit_hash.substring(0, 7)}
                     </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
