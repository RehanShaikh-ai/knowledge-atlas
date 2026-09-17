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
}

export const WorkspaceList: React.FC<WorkspaceListProps> = ({
  workspaces,
  loading,
  error,
  onRefresh,
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
          {workspaces.map((workspace) => (
            <li key={workspace.id} data-testid="workspace-item" style={styles.item}>
              <div style={styles.mainInfo}>
                <span style={styles.name}>{workspace.name}</span>
                {workspace.description && (
                  <p style={styles.description}>{workspace.description}</p>
                )}
                <span style={styles.owner}>Owner ID: {workspace.owner_id}</span>
              </div>
              <span style={styles.timestamp}>
                {new Date(workspace.created_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '20px',
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
    fontSize: '16px',
    fontWeight: 600,
    color: '#e2e8f0',
  },
  refreshBtn: {
    background: '#334155',
    color: '#e2e8f0',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '12px',
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '12px 14px',
    background: '#0f172a',
    borderRadius: '6px',
    border: '1px solid #334155',
  },
  mainInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  name: {
    fontWeight: 600,
    color: '#f8fafc',
    fontSize: '14px',
  },
  description: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '13px',
  },
  owner: {
    fontSize: '11px',
    color: '#64748b',
    fontFamily: 'monospace',
  },
  timestamp: {
    fontSize: '12px',
    color: '#94a3b8',
  },
};
