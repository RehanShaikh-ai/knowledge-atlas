import React, { useState, useEffect, useCallback } from 'react';
import { HealthStatus, HEALTH_DISPLAY_TEXT } from '@/hooks/useHealth';
import { getUsers } from '@/api/users';
import { getWorkspaces } from '@/api/workspaces';
import { User } from '@/types/users';
import { Workspace } from '@/types/workspaces';
import { ApiError } from '@/types/api';
import { UserCreateForm } from '@/components/UserCreateForm';
import { UserList } from '@/components/UserList';
import { WorkspaceCreateForm } from '@/components/WorkspaceCreateForm';
import { WorkspaceList } from '@/components/WorkspaceList';

interface HomePageProps {
  healthStatus: HealthStatus;
  onRefreshHealth: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  healthStatus,
  onRefreshHealth,
}) => {
  const displayText = HEALTH_DISPLAY_TEXT[healthStatus];

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState<ApiError | null>(null);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<ApiError | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUserError(null);
    try {
      const res = await getUsers();
      setUsers(res.items);
    } catch (err) {
      setUserError(err as ApiError);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchWorkspaces = useCallback(async () => {
    setLoadingWorkspaces(true);
    setWorkspaceError(null);
    try {
      const res = await getWorkspaces();
      setWorkspaces(res.items);
    } catch (err) {
      setWorkspaceError(err as ApiError);
    } finally {
      setLoadingWorkspaces(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchWorkspaces();
  }, [fetchUsers, fetchWorkspaces]);

  const handleUserCreated = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
  };

  const handleWorkspaceCreated = (newWorkspace: Workspace) => {
    setWorkspaces((prev) => [...prev, newWorkspace]);
  };

  return (
    <div style={styles.container}>
      <div style={styles.statusCard}>
        <div style={styles.statusRow}>
          <span
            style={{
              ...styles.indicator,
              backgroundColor:
                healthStatus === 'connected'
                  ? '#22c55e'
                  : healthStatus === 'loading'
                    ? '#eab308'
                    : '#ef4444',
            }}
          />
          <span data-testid="health-status" style={styles.statusText}>
            {displayText}
          </span>
          <button
            type="button"
            onClick={onRefreshHealth}
            style={styles.checkBtn}
          >
            Check Status
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>User Management</h2>
          <UserCreateForm onUserCreated={handleUserCreated} />
          <UserList
            users={users}
            loading={loadingUsers}
            error={userError}
            onRefresh={fetchUsers}
          />
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Workspace Management</h2>
          <WorkspaceCreateForm
            users={users}
            onWorkspaceCreated={handleWorkspaceCreated}
          />
          <WorkspaceList
            workspaces={workspaces}
            loading={loadingWorkspaces}
            error={workspaceError}
            onRefresh={fetchWorkspaces}
          />
        </section>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  statusCard: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '16px 24px',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  indicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  statusText: {
    fontSize: '14px',
    color: '#cbd5e1',
    flex: 1,
  },
  checkBtn: {
    background: '#334155',
    color: '#e2e8f0',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 14px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '24px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#f8fafc',
    marginBottom: '16px',
  },
};
