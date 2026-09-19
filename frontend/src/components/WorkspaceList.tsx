import React from 'react';
import { Workspace } from '@/types/workspaces';
import { ApiError } from '@/types/api';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { Check, ArrowRight } from 'lucide-react';

interface WorkspaceListProps {
  workspaces: Workspace[];
  loading: boolean;
  error: ApiError | string | null;
  onRefresh?: () => void;
  onSelectWorkspace?: (workspace: Workspace) => void;
  selectedWorkspaceId?: string;
}

export const WorkspaceList: React.FC<WorkspaceListProps> = ({
  workspaces,
  loading,
  error,
  onRefresh,
  onSelectWorkspace,
  selectedWorkspaceId,
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Workspaces ({workspaces.length})</h3>
        {onRefresh && (
          <button
            type="button"
            data-testid="refresh-workspaces-button"
            onClick={onRefresh}
            className="px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 rounded transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      {loading && <LoadingState message="Loading workspaces..." />}
      {error && <ErrorState error={error} />}

      {!loading && !error && workspaces.length === 0 && (
        <EmptyState message="No workspaces created yet." />
      )}

      {!loading && !error && workspaces.length > 0 && (
        <ul data-testid="workspace-list" className="flex flex-col gap-3.5 list-none p-0 m-0">
          {workspaces.map((workspace) => {
            const isSelected = selectedWorkspaceId === workspace.id;
            return (
              <li
                key={workspace.id}
                data-testid="workspace-item"
                className={`p-4 sm:p-5 rounded-xl border backdrop-blur-md transition-all duration-200 flex flex-col gap-3.5 ${
                  isSelected
                    ? 'bg-sky-500/[0.08] border-sky-500/50 shadow-[0_0_24px_rgba(56,189,248,0.18)]'
                    : 'bg-slate-900/50 border-slate-800/90 hover:border-slate-700/90 hover:bg-slate-900/80 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-slate-100 text-sm tracking-tight m-0">{workspace.name}</h4>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded-full shrink-0">
                          <Check size={10} strokeWidth={3} /> Selected
                        </span>
                      )}
                    </div>
                    {workspace.description && (
                      <p className="text-xs text-slate-400 mt-1.5 mb-0 leading-relaxed line-clamp-2">{workspace.description}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono shrink-0 pt-0.5">
                    {new Date(workspace.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono min-w-0">
                    <span className="text-slate-600">Owner:</span>
                    <span className="truncate max-w-[180px] sm:max-w-[220px] text-slate-400 font-mono">{workspace.owner_id}</span>
                  </div>

                  {onSelectWorkspace && (
                    <button
                      type="button"
                      data-testid={`open-workspace-${workspace.id}`}
                      onClick={() => onSelectWorkspace(workspace)}
                      className={`whitespace-nowrap inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all border shrink-0 ${
                        isSelected
                          ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.35)]'
                          : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border-slate-700 hover:border-sky-500/40'
                      }`}
                    >
                      <span>Open Knowledge Base</span>
                      <ArrowRight size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
