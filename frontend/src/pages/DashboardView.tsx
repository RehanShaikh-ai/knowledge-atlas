import React, { useEffect, useState } from 'react';
import { getWorkspaceDashboard } from '@/api/dashboard';
import { DashboardStats } from '@/types/dashboard';
import { DashboardMetricCard } from '@/components/DashboardMetricCard';
import { IndexingStatus } from '@/components/jobs/IndexingStatus';
import { ActivityTimeline } from '@/components/activity/ActivityTimeline';
import { FileText, Link as LinkIcon, Tag as TagIcon, UploadCloud, Activity, Zap, Loader2, AlertTriangle } from 'lucide-react';

interface DashboardViewProps {
  workspaceId: string;
  onNavigateToNote?: (noteId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ workspaceId, onNavigateToNote }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    getWorkspaceDashboard(workspaceId)
      .then(data => {
        if (mounted) setStats(data);
      })
      .catch(err => {
        if (mounted) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    
    return () => { mounted = false; };
  }, [workspaceId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
        <Loader2 size={32} className="animate-spin text-sky-400 mb-4" />
        <p>Loading telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-rose-950/40 border border-rose-800/50 text-rose-300 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold">Failed to load dashboard</h3>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] flex items-center gap-2">
            <Activity className="text-sky-400" />
            Knowledge Telemetry
          </h1>
          <p className="text-[var(--subtext0)] text-sm mt-1">Factual statistics about your workspace.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardMetricCard 
            title="Total Notes" 
            value={stats.total_notes} 
            icon={FileText} 
            description={`${stats.notes_created_last_7_days} created in last 7 days`}
          />
          <DashboardMetricCard 
            title="Relationships" 
            value={stats.total_relationships} 
            icon={LinkIcon} 
          />
          <DashboardMetricCard 
            title="Total Tags" 
            value={stats.total_tags} 
            icon={TagIcon} 
          />
          <DashboardMetricCard 
            title="Imported Sources" 
            value={stats.total_sources} 
            icon={UploadCloud} 
            description={`${stats.import_status_summary.completed} completed imports`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="dashboard-card p-5">
              <h3 className="dashboard-metric-label flex items-center gap-2 mb-4">
                <Zap size={16} className="text-amber-400" />
                Most Connected Notes
              </h3>
              <div className="space-y-2">
                {stats.most_connected_notes.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No relationships formed yet.</p>
                ) : (
                  stats.most_connected_notes.map((note, idx) => (
                    <button 
                      key={note.id}
                      onClick={() => onNavigateToNote?.(note.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50 group text-left"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-xs font-mono text-slate-500 w-4">{idx + 1}.</span>
                        <span className="text-sm font-medium text-slate-200 truncate group-hover:text-sky-300 transition-colors">{note.title}</span>
                      </div>
                      <span className="text-xs font-mono bg-sky-950/50 text-sky-400 px-2 py-1 rounded-md border border-sky-500/20 whitespace-nowrap">
                        degree: {note.degree}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <ActivityTimeline workspaceId={workspaceId} onNavigateToNote={onNavigateToNote} className="dashboard-card p-5" />
          </div>

          <div className="space-y-6">
            <div className="dashboard-card p-5">
              <h3 className="dashboard-metric-label flex items-center gap-2 mb-4">
                <TagIcon size={16} className="text-purple-400" />
                Top Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.tag_distribution.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No tags used yet.</p>
                ) : (
                  stats.tag_distribution.map(td => (
                    <div key={td.tag} className="flex items-center bg-slate-900 border border-slate-700 rounded-md overflow-hidden">
                      <span className="px-2.5 py-1 text-xs text-slate-300 bg-slate-800/50">{td.tag}</span>
                      <span className="px-2 py-1 text-xs font-mono font-semibold bg-sky-950/40 text-sky-400 border-l border-slate-700">{td.note_count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <IndexingStatus workspaceId={workspaceId} />

            <div className="dashboard-card p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-[var(--text)]">Isolated Notes</h3>
                <p className="text-xs text-[var(--subtext0)] mt-0.5">Notes without any connections</p>
              </div>
              <span className="text-2xl font-mono text-slate-400 bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700/50">
                {stats.isolated_notes_count}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
