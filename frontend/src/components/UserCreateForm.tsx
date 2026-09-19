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
    <div className="mb-6">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-4">Create New Identity</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="form-group mb-5">
          <label htmlFor="user-display-name">Display Name</label>
          <input
            id="user-display-name"
            data-testid="user-display-name-input"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Ada Lovelace"
            disabled={loading}
          />
          <div className="input-glow" />
        </div>

        {error && <ErrorState error={error} />}

        {successUser && (
          <div 
            data-testid="user-create-success" 
            className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-300"
          >
            User created: <strong className="text-emerald-200">{successUser.display_name}</strong> (ID: {successUser.id})
          </div>
        )}

        <div className="submit-wrap mt-4">
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
