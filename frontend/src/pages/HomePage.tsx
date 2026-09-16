import React from 'react';
import { HealthStatus, HEALTH_DISPLAY_TEXT } from '@/hooks/useHealth';

interface HomePageProps {
  healthStatus: HealthStatus;
  onRefreshHealth: () => void;
}

/**
 * Canonical initial page (§25).
 * Displays system status using the §16 mapping — nothing else for v0.1.1.
 */
export const HomePage: React.FC<HomePageProps> = ({
  healthStatus,
  onRefreshHealth,
}) => {
  const displayText = HEALTH_DISPLAY_TEXT[healthStatus];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>System Status</h2>

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
        </div>

        <button
          type="button"
          onClick={onRefreshHealth}
          style={styles.checkBtn}
        >
          Check Again
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 120px)',
  },
  card: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '32px 40px',
    textAlign: 'center',
    maxWidth: '360px',
    width: '100%',
  },
  heading: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 20px 0',
    color: '#e2e8f0',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '24px',
  },
  indicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  statusText: {
    fontSize: '15px',
    color: '#cbd5e1',
  },
  checkBtn: {
    background: '#334155',
    color: '#e2e8f0',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 20px',
    fontSize: '13px',
    cursor: 'pointer',
  },
};
