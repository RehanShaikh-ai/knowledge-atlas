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
    <div className="mb-6">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-4">Create Knowledge Workspace</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="form-group mb-5">
          <label htmlFor="workspace-name">Workspace Name</label>
          <input
            id="workspace-name"
            data-testid="workspace-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Quantum Research Notes"
            disabled={loading}
          />
          <div className="input-glow" />
        </div>

        <div className="form-group mb-5">
          <label htmlFor="workspace-description">Description (optional)</label>
          <input
            id="workspace-description"
            data-testid="workspace-description-input"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Distributed team notes and references"
            disabled={loading}
          />
          <div className="input-glow" />
        </div>

        <div className="form-group mb-5">
          <label htmlFor="workspace-owner-select">Owner</label>
          {selectedUser ? (
            <div data-testid="selected-workspace-owner" className="border-b border-slate-800 text-sky-300 font-mono text-xs py-2.5">
              {selectedUser.display_name} ({selectedUser.id})
            </div>
          ) : !isManualOwner && users.length > 0 ? (
            <div className="flex gap-2 items-center">
              <select
                id="workspace-owner-select"
                data-testid="workspace-owner-select"
                value={ownerId || users[0]?.id || ''}
                onChange={(e) => setOwnerId(e.target.value)}
                disabled={loading}
                className="flex-1 bg-transparent border-b border-slate-800 text-slate-100 py-2.5 outline-none font-mono text-xs"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-900 text-slate-100">
                    {u.display_name} ({u.id})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsManualOwner(true)}
                className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 rounded text-xs font-mono uppercase"
              >
                Enter UUID
              </button>
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <input
                  id="workspace-owner-input"
                  data-testid="workspace-owner-input"
                  type="text"
                  value={customOwnerId}
                  onChange={(e) => setCustomOwnerId(e.target.value)}
                  placeholder="Enter owner UUID (e.g. 123e4567-e89b...)"
                  disabled={loading}
                  className="w-full bg-transparent border-b border-slate-800 text-slate-100 py-2.5 font-mono text-xs outline-none"
                />
                <div className="input-glow" />
              </div>
              {users.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsManualOwner(false)}
                  className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 rounded text-xs font-mono uppercase"
                >
                  Select User
                </button>
              )}
            </div>
          )}
        </div>

        {error && <ErrorState error={error} />}

        {successWorkspace && (
          <div 
            data-testid="workspace-create-success" 
            className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-300"
          >
            Workspace created: <strong className="text-emerald-200">{successWorkspace.name}</strong> (ID: {successWorkspace.id})
          </div>
        )}

        <div className="submit-wrap mt-4">
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
