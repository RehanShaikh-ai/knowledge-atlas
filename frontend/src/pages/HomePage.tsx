import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

  const blobsData = useMemo(() => {
      return Array.from({ length: 6 }).map(() => ({
          size: Math.random() * 200 + 150,
          left: Math.random() * 80 + 10,
          top: Math.random() * 80 + 10,
          animationDelay: Math.random() * -20,
          animationDuration: Math.random() * 15 + 15,
      }));
  }, []);

  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          const x = e.clientX / window.innerWidth;
          const y = e.clientY / window.innerHeight;
          blobRefs.current.forEach((blob, index) => {
              if (blob) {
                  const speed = (index + 1) * 20;
                  blob.style.marginLeft = `${x * speed}px`;
                  blob.style.marginTop = `${y * speed}px`;
              }
          });
      };
      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="mercury-wrapper">
      <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;800&family=Space+Mono&display=swap');

          :root {
              --bg: #050505;
              --mercury: #e0e0e0;
              --mercury-dark: #666666;
              --accent: #ffffff;
              --text-dim: rgba(255, 255, 255, 0.5);
              --filter-goo: url('#gooey');
          }

          .mercury-wrapper {
              background-color: var(--bg);
              color: var(--accent);
              font-family: 'Inter', sans-serif;
              min-height: calc(100vh - 80px);
              width: 100vw;
              overflow-x: hidden;
              position: relative;
          }

          .mercury-wrapper * {
              box-sizing: border-box;
              -webkit-font-smoothing: antialiased;
          }

          .stage {
              position: absolute;
              width: 100%;
              height: 100%;
              z-index: 0;
              filter: var(--filter-goo);
              opacity: 0.6;
              pointer-events: none;
          }

          .blob {
              position: absolute;
              background: linear-gradient(135deg, var(--mercury), #888);
              border-radius: 50%;
              filter: blur(20px);
              animation: float 20s infinite alternate ease-in-out;
              box-shadow: inset -10px -10px 20px rgba(0,0,0,0.5), 
                          10px 10px 30px rgba(255,255,255,0.2);
              transition: margin 0.1s ease-out;
          }

          @keyframes float {
              0% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(10vw, 20vh) scale(1.2); }
              66% { transform: translate(-5vw, 10vh) scale(0.8); }
              100% { transform: translate(5vw, -10vh) scale(1.1); }
          }

          .auth-container {
              position: relative;
              z-index: 10;
              width: 100%;
              max-width: 1200px;
              margin: 0 auto;
              padding: 40px;
          }

          .brand-id {
              font-family: 'Space Mono', monospace;
              font-size: 10px;
              letter-spacing: 4px;
              text-transform: uppercase;
              color: var(--text-dim);
              margin-bottom: 8px;
              display: block;
          }

          .form-group {
              position: relative;
              transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
          }
          .form-group:focus-within {
              transform: translateX(10px);
          }
          .form-group label {
              display: block;
              font-family: 'Space Mono', monospace;
              font-size: 11px;
              color: var(--text-dim);
              margin-bottom: 12px;
              text-transform: uppercase;
          }
          .form-group input {
              width: 100%;
              background: transparent;
              border: none;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
              color: var(--accent);
              padding: 12px 0;
              font-size: 18px;
              outline: none;
              transition: border-color 0.4s;
          }
          .input-glow {
              position: absolute;
              bottom: 0;
              left: 0;
              width: 0%;
              height: 2px;
              background: var(--mercury);
              transition: width 0.6s cubic-bezier(0.2, 1, 0.3, 1);
              box-shadow: 0 0 15px var(--mercury);
          }
          .form-group input:focus + .input-glow,
          .form-group input:focus-within + .input-glow {
              width: 100%;
          }
          .submit-wrap {
              position: relative;
              filter: var(--filter-goo);
          }
          .btn-base {
              background: var(--accent);
              color: #000;
              border: none;
              padding: 20px 40px;
              font-size: 14px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 2px;
              cursor: pointer;
              width: 100%;
              position: relative;
              z-index: 2;
              transition: letter-spacing 0.3s;
          }
          .btn-base:hover {
              letter-spacing: 4px;
          }
          .mercury-drop {
              position: absolute;
              top: 50%;
              left: 50%;
              width: 100%;
              height: 100%;
              background: var(--mercury);
              transform: translate(-50%, -50%);
              z-index: 1;
              border-radius: 50px;
              transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .submit-wrap:hover .mercury-drop {
              transform: translate(-50%, -50%) scale(1.05, 1.2);
              filter: brightness(1.2);
          }
          .svg-filter-hidden {
              position: absolute;
              width: 0;
              height: 0;
          }
      `}</style>

      <svg className="svg-filter-hidden">
          <defs>
              <filter id="gooey">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
                  <feColorMatrix 
                      in="blur" 
                      mode="matrix" 
                      values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" 
                      result="goo" 
                  />
                  <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
              </filter>
          </defs>
      </svg>

      <div className="stage" id="stage">
          {blobsData.map((data, index) => (
              <div
                  key={index}
                  ref={(el) => (blobRefs.current[index] = el)}
                  className="blob"
                  style={{
                      width: `${data.size}px`,
                      height: `${data.size}px`,
                      left: `${data.left}%`,
                      top: `${data.top}%`,
                      animationDelay: `${data.animationDelay}s`,
                      animationDuration: `${data.animationDuration}s`,
                  }}
              />
          ))}
      </div>

      <main className="auth-container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <span className="brand-id">System Node: 0x992 / Knowledge Atlas</span>
            <h1 style={{ fontWeight: 800, fontSize: '3rem', lineHeight: 0.9, letterSpacing: '-2px', margin: '-4px 0 0 0' }}>
              Dashboard
            </h1>
          </div>
          <div style={styles.statusRow}>
            <span data-testid="health-status" style={{ fontSize: '12px', fontFamily: 'Space Mono, monospace' }}>{displayText}</span>
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
            <button
              type="button"
              onClick={onRefreshHealth}
              style={styles.checkBtn}
            >
              ↻ Refresh
            </button>
          </div>
        </header>

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
      </main>
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
