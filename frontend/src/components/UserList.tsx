import React from 'react';
import { User } from '@/types/users';
import { ApiError } from '@/types/api';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { FlowHoverButton } from '@/components/ui/flow-hover-button';

interface UserListProps {
  users: User[];
  loading: boolean;
  error: ApiError | string | null;
  onRefresh?: () => void;
  selectedUserId?: string;
  onUserSelect?: (user: User) => void;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  loading,
  error,
  onRefresh,
  selectedUserId,
  onUserSelect,
}) => {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>Users ({users.length})</h3>
        {onRefresh && (
          <FlowHoverButton
            type="button"
            data-testid="refresh-users-button"
            onClick={onRefresh}
            className="text-xs px-2.5 py-1"
          >
            Refresh
          </FlowHoverButton>
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
            <li
              key={user.id}
              data-testid="user-item"
              style={{
                ...styles.item,
                ...(selectedUserId === user.id ? styles.selectedItem : {}),
              }}
            >
              <div style={styles.userMain}>
                <span style={styles.userName}>{user.display_name}</span>
                <span style={styles.userId}>{user.id}</span>
              </div>
              <div style={styles.itemActions}>
                <span style={styles.timestamp}>
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
                {onUserSelect && (
                  <button
                    type="button"
                    onClick={() => onUserSelect(user)}
                    style={styles.selectBtn}
                    aria-pressed={selectedUserId === user.id}
                    data-testid={`select-user-${user.id}`}
                  >
                    {selectedUserId === user.id ? 'Selected' : 'Select'}
                  </button>
                )}
              </div>
            </li>
          ))}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
  },
  selectedItem: {
    border: '1px solid rgba(34, 197, 94, 0.8)',
    background: 'rgba(6, 78, 59, 0.25)',
  },
  userMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  userName: {
    fontWeight: 600,
    color: 'var(--accent)',
    fontSize: '14px',
  },
  userId: {
    fontSize: '11px',
    color: 'var(--text-dim)',
    fontFamily: 'Space Mono, monospace',
  },
  timestamp: {
    fontSize: '11px',
    color: 'var(--text-dim)',
    fontFamily: 'Space Mono, monospace',
  },
  itemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  selectBtn: {
    background: 'rgba(255,255,255,0.1)',
    color: 'var(--accent)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '10px',
    fontFamily: 'Space Mono, monospace',
    cursor: 'pointer',
  },
};
