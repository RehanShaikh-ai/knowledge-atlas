import React from 'react';
import { ApiError } from '@/types/api';

interface ErrorStateProps {
  error: ApiError | string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  const message = typeof error === 'string' ? error : error.error.message;
  const code = typeof error === 'string' ? undefined : error.error.code;

  return (
    <div data-testid="error-state" style={styles.container}>
      {code && <span style={styles.code}>[{code}] </span>}
      <span style={styles.message}>{message}</span>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '12px 16px',
    background: '#451a1a',
    border: '1px solid #7f1d1d',
    borderRadius: '6px',
    color: '#fca5a5',
    fontSize: '14px',
    margin: '8px 0',
  },
  code: {
    fontWeight: 700,
  },
  message: {
    margin: 0,
  },
};
