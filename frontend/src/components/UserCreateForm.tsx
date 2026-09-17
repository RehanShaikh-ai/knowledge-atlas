import React, { useState } from 'react';
import { createUser } from '@/api/users';
import { User } from '@/types/users';
import { ApiError } from '@/types/api';
import { ErrorState } from './ErrorState';

interface UserCreateFormProps {
  onUserCreated?: (user: User) => void;
}

export const UserCreateForm: React.FC<UserCreateFormProps> = ({ onUserCreated }) => {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | string | null>(null);
  const [successUser, setSuccessUser] = useState<User | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError('Display name cannot be empty.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessUser(null);

    try {
      const created = await createUser({ display_name: trimmed });
      setSuccessUser(created);
      setDisplayName('');
      if (onUserCreated) {
        onUserCreated(created);
      }
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Create User</h3>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label htmlFor="user-display-name" style={styles.label}>
            Display Name
          </label>
          <input
            id="user-display-name"
            data-testid="user-display-name-input"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Alice Smith"
            disabled={loading}
            style={styles.input}
          />
        </div>

        {error && <ErrorState error={error} />}

        {successUser && (
          <div data-testid="user-create-success" style={styles.success}>
            User created: <strong>{successUser.display_name}</strong> (ID: {successUser.id})
          </div>
        )}

        <button
          type="submit"
          data-testid="user-create-submit"
          disabled={loading}
          style={styles.button}
        >
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </form>
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
  title: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#e2e8f0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  input: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '4px',
    padding: '8px 12px',
    color: '#f8fafc',
    fontSize: '14px',
  },
  button: {
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  success: {
    padding: '8px 12px',
    background: '#064e3b',
    border: '1px solid #047857',
    borderRadius: '4px',
    color: '#a7f3d0',
    fontSize: '13px',
  },
};
