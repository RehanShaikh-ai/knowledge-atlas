import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
}) => {
  return (
    <div data-testid="loading-state" style={styles.container}>
      <span style={styles.spinner} />
      <span style={styles.message}>{message}</span>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    color: '#94a3b8',
    fontSize: '14px',
  },
  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid #334155',
    borderTopColor: '#38bdf8',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
  },
  message: {
    fontStyle: 'italic',
  },
};
