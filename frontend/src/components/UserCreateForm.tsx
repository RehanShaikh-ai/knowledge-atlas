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
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Create User</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="user-display-name">Display Name</label>
          <input
            id="user-display-name"
            data-testid="user-display-name-input"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Alice Smith"
            disabled={loading}
          />
          <div className="input-glow"></div>
        </div>

        {error && <ErrorState error={error} />}

        {successUser && (
          <div data-testid="user-create-success" style={styles.success}>
            User created: <strong>{successUser.display_name}</strong> (ID: {successUser.id})
          </div>
        )}

        <div className="submit-wrap" style={{ marginTop: '20px' }}>
          <div className="mercury-drop"></div>
          <button
            type="submit"
            data-testid="user-create-submit"
            disabled={loading}
            className="btn-base"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'transparent',
    padding: '0',
    marginBottom: '20px',
  },
  success: {
    padding: '8px 12px',
    background: 'rgba(6, 78, 59, 0.5)',
    border: '1px solid #047857',
    borderRadius: '4px',
    color: '#a7f3d0',
    fontSize: '13px',
    fontFamily: 'Space Mono, monospace',
  },
};
