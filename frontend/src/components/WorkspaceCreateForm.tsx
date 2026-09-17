import React, { useState } from 'react';
import { createWorkspace } from '@/api/workspaces';
import { Workspace } from '@/types/workspaces';
import { User } from '@/types/users';
import { ApiError } from '@/types/api';
import { ErrorState } from './ErrorState';

interface WorkspaceCreateFormProps {
  users: User[];
  onWorkspaceCreated?: (workspace: Workspace) => void;
}

export const WorkspaceCreateForm: React.FC<WorkspaceCreateFormProps> = ({
  users,
  onWorkspaceCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [customOwnerId, setCustomOwnerId] = useState('');
  const [isManualOwner, setIsManualOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | string | null>(null);
  const [successWorkspace, setSuccessWorkspace] = useState<Workspace | null>(null);

  const selectedOwnerId = isManualOwner ? customOwnerId.trim() : (ownerId || (users[0]?.id ?? ''));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Workspace name cannot be empty.');
      return;
    }

    if (!selectedOwnerId) {
      setError('A valid workspace owner is required.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessWorkspace(null);

    try {
      const created = await createWorkspace({
        name: trimmedName,
        description: description.trim() || null,
        owner_id: selectedOwnerId,
      });
      setSuccessWorkspace(created);
      setName('');
      setDescription('');
      if (onWorkspaceCreated) {
        onWorkspaceCreated(created);
      }
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Create Workspace</h3>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label htmlFor="workspace-name" style={styles.label}>
            Workspace Name
          </label>
          <input
            id="workspace-name"
            data-testid="workspace-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Research Hub"
            disabled={loading}
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label htmlFor="workspace-description" style={styles.label}>
            Description (optional)
          </label>
          <input
            id="workspace-description"
            data-testid="workspace-description-input"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Shared workspace for team notes"
            disabled={loading}
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label htmlFor="workspace-owner-select" style={styles.label}>
            Owner
          </label>
          {!isManualOwner && users.length > 0 ? (
            <div style={styles.ownerRow}>
              <select
                id="workspace-owner-select"
                data-testid="workspace-owner-select"
                value={ownerId || users[0]?.id || ''}
                onChange={(e) => setOwnerId(e.target.value)}
                disabled={loading}
                style={styles.select}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name} ({u.id})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsManualOwner(true)}
                style={styles.toggleBtn}
              >
                Enter UUID
              </button>
            </div>
          ) : (
            <div style={styles.ownerRow}>
              <input
                id="workspace-owner-input"
                data-testid="workspace-owner-input"
                type="text"
                value={customOwnerId}
                onChange={(e) => setCustomOwnerId(e.target.value)}
                placeholder="Enter owner UUID (e.g. 123e4567-e89b...)"
                disabled={loading}
                style={styles.input}
              />
              {users.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsManualOwner(false)}
                  style={styles.toggleBtn}
                >
                  Select User
                </button>
              )}
            </div>
          )}
        </div>

        {error && <ErrorState error={error} />}

        {successWorkspace && (
          <div data-testid="workspace-create-success" style={styles.success}>
            Workspace created: <strong>{successWorkspace.name}</strong> (ID: {successWorkspace.id})
          </div>
        )}

        <button
          type="submit"
          data-testid="workspace-create-submit"
          disabled={loading}
          style={styles.button}
        >
          {loading ? 'Creating...' : 'Create Workspace'}
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
  ownerRow: {
    display: 'flex',
    gap: '8px',
  },
  select: {
    flex: 1,
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '4px',
    padding: '8px 12px',
    color: '#f8fafc',
    fontSize: '14px',
  },
  toggleBtn: {
    background: '#334155',
    color: '#e2e8f0',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
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
