import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const blobsData = [
  { size: 312, left: 18, top: 24, animationDelay: -16, animationDuration: 22 },
  { size: 248, left: 67, top: 16, animationDelay: -9, animationDuration: 27 },
  { size: 336, left: 43, top: 62, animationDelay: -19, animationDuration: 18 },
  { size: 201, left: 79, top: 48, animationDelay: -4, animationDuration: 25 },
  { size: 287, left: 29, top: 74, animationDelay: -13, animationDuration: 30 },
  { size: 359, left: 58, top: 37, animationDelay: -7, animationDuration: 20 },
];

type WorkflowPhase = 'users' | 'workspaces';

interface HomePageProps {
  healthStatus: HealthStatus;
  onRefreshHealth: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  healthStatus,
  onRefreshHealth,
}) => {
  const displayText = HEALTH_DISPLAY_TEXT[healthStatus];
  const [phase, setPhase] = useState<WorkflowPhase>('users');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState<ApiError | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<ApiError | null>(null);
  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hasRequestedWorkspaces = useRef(false);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUserError(null);
    try {
      const response = await getUsers();
      setUsers(response.items);
    } catch (error) {
      setUserError(error as ApiError);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchWorkspaces = useCallback(async () => {
    setLoadingWorkspaces(true);
    setWorkspaceError(null);
    try {
      const response = await getWorkspaces();
      setWorkspaces(response.items);
    } catch (error) {
      setWorkspaceError(error as ApiError);
    } finally {
      setLoadingWorkspaces(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (phase === 'workspaces' && !hasRequestedWorkspaces.current) {
      hasRequestedWorkspaces.current = true;
      fetchWorkspaces();
    }
  }, [fetchWorkspaces, phase]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      blobRefs.current.forEach((blob, index) => {
        if (blob) {
          const speed = (index + 1) * 20;
          blob.style.marginLeft = x * speed + 'px';
          blob.style.marginTop = y * speed + 'px';
        }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleUserCreated = (user: User) => {
    setUsers((currentUsers) => [...currentUsers, user]);
    setSelectedUser(user);
  };

  const handleWorkspaceCreated = (workspace: Workspace) => {
    setWorkspaces((currentWorkspaces) => [...currentWorkspaces, workspace]);
  };

  return (
    <div className="mercury-wrapper">
      <svg className="svg-filter-hidden" aria-hidden="true">
        <defs>
          <filter id="gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <div className="stage" aria-hidden="true">
        {blobsData.map((data, index) => (
          <div
            key={index}
            ref={(element) => { blobRefs.current[index] = element; }}
            className="blob"
            style={{
              width: data.size + 'px',
              height: data.size + 'px',
              left: data.left + '%',
              top: data.top + '%',
              animationDelay: data.animationDelay + 's',
              animationDuration: data.animationDuration + 's',
            }}
          />
        ))}
      </div>

      <main className="dashboard-shell">
        <header className="dashboard-header">
          <div>
            <span className="brand-id">System Node: 0x992 / Knowledge Atlas</span>
            <h1 className="dashboard-title">Dashboard</h1>
          </div>
          <div className="health-status" aria-live="polite">
            <span data-testid="health-status">{displayText}</span>
            <span
              className="health-indicator"
              style={{ backgroundColor: healthStatus === 'connected' ? '#22c55e' : healthStatus === 'loading' ? '#eab308' : '#ef4444' }}
            />
            <button type="button" onClick={onRefreshHealth} className="secondary-button">↻ Refresh</button>
          </div>
        </header>

        <nav className="workflow-steps" aria-label="Workspace setup progress">
          <div className={'workflow-step ' + (phase === 'users' ? 'is-current' : 'is-complete')} aria-current={phase === 'users' ? 'step' : undefined}>
            <span className="workflow-marker" aria-hidden="true">{phase === 'users' ? '1' : '✓'}</span>
            <span>User Management</span>
            <span className="sr-only">{phase === 'users' ? 'Current phase' : 'Completed phase'}</span>
          </div>
          <span className="workflow-connector" aria-hidden="true" />
          <div className={'workflow-step ' + (phase === 'workspaces' ? 'is-current' : 'is-upcoming')} aria-current={phase === 'workspaces' ? 'step' : undefined}>
            <span className="workflow-marker" aria-hidden="true">2</span>
            <span>Workspace Management</span>
            <span className="sr-only">{phase === 'workspaces' ? 'Current phase' : 'Upcoming phase'}</span>
          </div>
        </nav>

        {phase === 'users' ? (
          <section className="workflow-panel" aria-labelledby="user-management-title">
            <div className="workflow-panel-heading">
              <div>
                <span className="panel-kicker">Phase 01</span>
                <h2 id="user-management-title">User Management</h2>
                <p>Create a user or select an existing identity to own the workspace.</p>
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={() => selectedUser && setPhase('workspaces')}
                disabled={!selectedUser}
                data-testid="continue-to-workspaces"
              >
                Continue to Workspace
              </button>
            </div>
            {selectedUser && <p className="selection-notice" role="status">Selected owner: <strong>{selectedUser.display_name}</strong></p>}
            <UserCreateForm onUserCreated={handleUserCreated} />
            <UserList
              users={users}
              loading={loadingUsers}
              error={userError}
              onRefresh={fetchUsers}
              selectedUserId={selectedUser?.id}
              onUserSelect={setSelectedUser}
            />
          </section>
        ) : (
          <section className="workflow-panel" aria-labelledby="workspace-management-title">
            <div className="workflow-panel-heading">
              <div>
                <span className="panel-kicker">Phase 02</span>
                <h2 id="workspace-management-title">Workspace Management</h2>
                <p>Creating a workspace for <strong>{selectedUser?.display_name}</strong>.</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => setPhase('users')}>← Back to Users</button>
            </div>
            {selectedUser && <WorkspaceCreateForm users={users} selectedUser={selectedUser} onWorkspaceCreated={handleWorkspaceCreated} />}
            <WorkspaceList
              workspaces={workspaces}
              loading={loadingWorkspaces}
              error={workspaceError}
              onRefresh={fetchWorkspaces}
            />
          </section>
        )}
      </main>
    </div>
  );
};
