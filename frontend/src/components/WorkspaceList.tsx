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
        <ul data-testid="workspace-list" className="flex flex-col gap-3 list-none p-0 m-0">
          {workspaces.map((workspace) => {
            const isSelected = selectedWorkspaceId === workspace.id;
            return (
              <li
                key={workspace.id}
                data-testid="workspace-item"
                className={`p-4 rounded-xl border backdrop-blur-md transition-all flex flex-col gap-3 ${
                  isSelected
                    ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-100 text-sm tracking-tight">{workspace.name}</span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded-full">
                          <Check size={10} strokeWidth={3} /> Selected
                        </span>
                      )}
                    </div>
                    {workspace.description && (
                      <p className="text-xs text-slate-400 m-0 leading-relaxed line-clamp-2">{workspace.description}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono shrink-0">
                    {new Date(workspace.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800/60 mt-1">
                  <span className="text-[11px] text-slate-500 font-mono truncate max-w-[200px] sm:max-w-xs">
                    Owner: {workspace.owner_id}
                  </span>
                  {onSelectWorkspace && (
                    <button
                      type="button"
                      data-testid={`open-workspace-${workspace.id}`}
                      onClick={() => onSelectWorkspace(workspace)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all border ${
                        isSelected
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-sky-500/40'
                      }`}
                    >
                      Open Knowledge Base <ArrowRight size={12} strokeWidth={2.5} />
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
