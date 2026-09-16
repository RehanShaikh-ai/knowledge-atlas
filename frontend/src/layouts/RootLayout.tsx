import React from 'react';
import { HealthStatus, HEALTH_DISPLAY_TEXT } from '@/hooks/useHealth';

interface RootLayoutProps {
  children: React.ReactNode;
  healthStatus: HealthStatus;
  onRefreshHealth: () => void;
}

/**
 * Canonical layout component (§25).
 * Wraps the application shell and exposes system status.
 */
export const RootLayout: React.FC<RootLayoutProps> = ({
  children,
  healthStatus,
  onRefreshHealth,
}) => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Knowledge Atlas</h1>
        <div style={styles.statusArea}>
          <span
            style={{
              ...styles.dot,
              backgroundColor:
                healthStatus === 'connected'
                  ? '#22c55e'
                  : healthStatus === 'loading'
                    ? '#eab308'
                    : '#ef4444',
            }}
          />
          <span style={styles.statusText}>
            {HEALTH_DISPLAY_TEXT[healthStatus]}
          </span>
          <button
            type="button"
            onClick={onRefreshHealth}
            style={styles.refreshBtn}
            aria-label="Refresh health status"
          >
            ↻
          </button>
        </div>
      </header>
      <main style={styles.main}>{children}</main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid #1e293b',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
  },
  statusArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  statusText: {
    color: '#94a3b8',
  },
  refreshBtn: {
    background: 'none',
    border: '1px solid #334155',
    borderRadius: '4px',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '2px 8px',
    fontSize: '14px',
  },
  main: {
    padding: '24px',
  },
};
