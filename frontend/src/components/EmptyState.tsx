import React from 'react';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No records found.',
}) => {
  return (
    <div data-testid="empty-state" style={styles.container}>
      <p style={styles.text}>{message}</p>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    textAlign: 'center',
    background: '#1e293b',
    border: '1px dashed #334155',
    borderRadius: '8px',
    color: '#94a3b8',
    fontSize: '14px',
  },
  text: {
    margin: 0,
  },
};
