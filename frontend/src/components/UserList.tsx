import React from 'react';
import { User } from '@/types/users';
import { ApiError } from '@/types/api';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

interface UserListProps {
  users: User[];
  loading: boolean;
  error: ApiError | string | null;
  onRefresh?: () => void;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  loading,
  error,
  onRefresh,
}) => {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>Users ({users.length})</h3>
        {onRefresh && (
          <button
            type="button"
            data-testid="refresh-users-button"
            onClick={onRefresh}
            style={styles.refreshBtn}
          >
            Refresh
          </button>
        )}
      </div>

      {loading && <LoadingState message="Loading users..." />}
      {error && <ErrorState error={error} />}

      {!loading && !error && users.length === 0 && (
        <EmptyState message="No users created yet." />
      )}

      {!loading && !error && users.length > 0 && (
        <ul data-testid="user-list" style={styles.list}>
          {users.map((user) => (
            <li key={user.id} data-testid="user-item" style={styles.item}>
              <div style={styles.userMain}>
                <span style={styles.userName}>{user.display_name}</span>
                <span style={styles.userId}>{user.id}</span>
              </div>
              <span style={styles.timestamp}>
                {new Date(user.created_at).toLocaleDateString()}
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
    alignItems: 'center',
    padding: '10px 14px',
    background: '#0f172a',
    borderRadius: '6px',
    border: '1px solid #334155',
  },
  userMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  userName: {
    fontWeight: 600,
    color: '#f8fafc',
    fontSize: '14px',
  },
  userId: {
    fontSize: '11px',
    color: '#64748b',
    fontFamily: 'monospace',
  },
  timestamp: {
    fontSize: '12px',
    color: '#94a3b8',
  },
};
