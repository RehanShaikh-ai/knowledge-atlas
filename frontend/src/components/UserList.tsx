import React from 'react';
import { User } from '@/types/users';
import { ApiError } from '@/types/api';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { Check } from 'lucide-react';

interface UserListProps {
  users: User[];
  loading: boolean;
  error: ApiError | string | null;
  onRefresh?: () => void;
  selectedUserId?: string;
  onUserSelect?: (user: User) => void;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  loading,
  error,
  onRefresh,
  selectedUserId,
  onUserSelect,
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Identities ({users.length})</h3>
        {onRefresh && (
          <button
            type="button"
            data-testid="refresh-users-button"
            onClick={onRefresh}
            className="px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      {loading && <LoadingState message="Loading users..." />}
      {error && <ErrorState error={error} />}

      {!loading && !error && users.length === 0 && (
        <EmptyState message="No users created yet." />
      )}

      {!loading && !error && users.length > 0 && (
        <ul data-testid="user-list" className="flex flex-col gap-2.5 list-none p-0 m-0">
          {users.map((user) => {
            const isSelected = selectedUserId === user.id;
            return (
              <li
                key={user.id}
                data-testid="user-item"
                className={`flex justify-between items-center p-3 sm:p-3.5 rounded-xl border backdrop-blur-md transition-all ${
                  isSelected 
                    ? 'bg-sky-500/10 border-sky-500/40 shadow-[0_0_15px_rgba(56,189,248,0.2)]' 
                    : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex flex-col gap-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100 text-sm tracking-tight truncate">{user.display_name}</span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded-full">
                        <Check size={10} strokeWidth={3} /> Active
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono truncate">{user.id}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                  {onUserSelect && (
                    <button
                      type="button"
                      onClick={() => onUserSelect(user)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all border ${
                        isSelected
                          ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border-white/[0.08] hover:border-white/[0.15]'
                      }`}
                      aria-pressed={isSelected}
                      data-testid={`select-user-${user.id}`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
