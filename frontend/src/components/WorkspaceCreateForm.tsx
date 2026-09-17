import React, { useState } from 'react';
import { createWorkspace } from '@/api/workspaces';
import { Workspace } from '@/types/workspaces';
import { User } from '@/types/users';
import { ApiError } from '@/types/api';
import { ErrorState } from './ErrorState';

interface WorkspaceCreateFormProps {
  users: User[];
  selectedUser?: User;
  onWorkspaceCreated?: (workspace: Workspace) => void;
}

export const WorkspaceCreateForm: React.FC<WorkspaceCreateFormProps> = ({
  users,
  selectedUser,
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

  const selectedOwnerId = selectedUser?.id ?? (isManualOwner ? customOwnerId.trim() : (ownerId || (users[0]?.id ?? '')));

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
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Create Workspace</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="workspace-name">Workspace Name</label>
          <input
            id="workspace-name"
            data-testid="workspace-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Research Hub"
            disabled={loading}
          />
          <div className="input-glow"></div>
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="workspace-description">Description (optional)</label>
          <input
            id="workspace-description"
            data-testid="workspace-description-input"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Shared workspace for team notes"
            disabled={loading}
          />
          <div className="input-glow"></div>
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="workspace-owner-select">Owner</label>
          {selectedUser ? (
            <div data-testid="selected-workspace-owner" style={styles.selectedOwner}>
              {selectedUser.display_name} ({selectedUser.id})
            </div>
          ) : !isManualOwner && users.length > 0 ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                id="workspace-owner-select"
                data-testid="workspace-owner-select"
                value={ownerId || users[0]?.id || ''}
                onChange={(e) => setOwnerId(e.target.value)}
                disabled={loading}
                style={styles.select}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id} style={{ background: '#050505', color: '#fff' }}>
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  id="workspace-owner-input"
                  data-testid="workspace-owner-input"
                  type="text"
                  value={customOwnerId}
                  onChange={(e) => setCustomOwnerId(e.target.value)}
                  placeholder="Enter owner UUID (e.g. 123e4567-e89b...)"
                  disabled={loading}
                  style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--accent)', padding: '12px 0', fontSize: '18px', outline: 'none' }}
                />
                <div className="input-glow"></div>
              </div>
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

        <div className="submit-wrap" style={{ marginTop: '20px' }}>
          <div className="mercury-drop"></div>
          <button
            type="submit"
            data-testid="workspace-create-submit"
            disabled={loading}
            className="btn-base"
          >
            {loading ? 'Creating...' : 'Create Workspace'}
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
  select: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '18px',
    outline: 'none',
    padding: '12px 0',
  },
  toggleBtn: {
    background: 'rgba(255,255,255,0.1)',
    color: '#e2e8f0',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'Space Mono, monospace',
    textTransform: 'uppercase',
  },
  selectedOwner: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'var(--accent)',
    fontFamily: 'Space Mono, monospace',
    fontSize: '13px',
    padding: '12px 0',
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
