import React from 'react';
import { Workspace } from '@/types/workspaces';
import { ApiError } from '@/types/api';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

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
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>Workspaces ({workspaces.length})</h3>
        {onRefresh && (
          <button
            type="button"
            data-testid="refresh-workspaces-button"
            onClick={onRefresh}
            style={styles.refreshBtn}
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
        <ul data-testid="workspace-list" style={styles.list}>
          {workspaces.map((workspace) => {
            const isSelected = selectedWorkspaceId === workspace.id;
            return (
              <li
                key={workspace.id}
                data-testid="workspace-item"
                style={{
                  ...styles.item,
                  ...(isSelected ? styles.itemSelected : {}),
                }}
              >
                <div style={styles.topRow}>
                  <div style={styles.mainInfo}>
                    <span style={styles.name}>{workspace.name}</span>
                    {workspace.description && (
                      <p style={styles.description}>{workspace.description}</p>
                    )}
                  </div>
                  <span style={styles.timestamp}>
                    {new Date(workspace.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={styles.actionsRow}>
                  <span style={styles.owner}>Owner: {workspace.owner_id}</span>
                  {onSelectWorkspace && (
                    <button
                      type="button"
                      data-testid={`open-workspace-${workspace.id}`}
                      onClick={() => onSelectWorkspace(workspace)}
                      style={styles.openBtn}
                    >
                      Open Knowledge Base →
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

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'transparent',
    padding: '0',
    marginBottom: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    margin: 0,
    fontSize: '11px',
    fontFamily: 'Space Mono, monospace',
    textTransform: 'uppercase',
    color: 'var(--text-dim)',
    letterSpacing: '2px',
  },
  refreshBtn: {
    background: 'rgba(255,255,255,0.1)',
    color: 'var(--accent)',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '10px',
    fontFamily: 'Space Mono, monospace',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    gap: '8px',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  workspaceMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  workspaceName: {
    fontWeight: 600,
    color: 'var(--accent)',
    fontSize: '14px',
  },
  workspaceId: {
    fontSize: '11px',
    color: 'var(--text-dim)',
    fontFamily: 'Space Mono, monospace',
  },
  timestamp: {
    fontSize: '11px',
    color: 'var(--text-dim)',
    fontFamily: 'Space Mono, monospace',
  },
  description: {
    fontSize: '13px',
    color: 'var(--text-dim)',
    margin: 0,
  },
  owner: {
    fontSize: '11px',
    color: 'var(--text-dim)',
    marginTop: '4px',
    fontFamily: 'Space Mono, monospace',
  },
  mainInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  name: {
    fontWeight: 600,
    color: 'var(--accent)',
    fontSize: '14px',
  },
  itemSelected: {
    borderColor: '#38bdf8',
    background: 'rgba(56, 189, 248, 0.08)',
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '6px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  openBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 255, 255, 0.12)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: '4px',
    padding: '5px 12px',
    fontSize: '11px',
    fontFamily: 'Space Mono, monospace',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};
