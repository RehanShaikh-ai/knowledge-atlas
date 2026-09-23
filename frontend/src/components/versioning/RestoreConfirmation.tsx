import React, { useState } from 'react';
import { NoteVersion } from '@/types/versions';
import { restoreNoteVersion } from '@/api/versions';
import { AlertTriangle, RotateCcw, Loader2 } from 'lucide-react';

interface RestoreConfirmationProps {
  noteId: string;
  version: NoteVersion;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RestoreConfirmation: React.FC<RestoreConfirmationProps> = ({
  noteId,
  version,
  onConfirm,
  onCancel
}) => {
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleRestore = async () => {
    setIsRestoring(true);
    setError(null);
    try {
      await restoreNoteVersion(noteId, version.id, version.commit_hash, version.author_id);
      onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to restore version'));
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-base/80 backdrop-blur-sm">
      <div className="bg-surface0 border border-amber-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        
        <div className="p-6 pb-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
            <AlertTriangle size={24} />
          </div>
          
          <h2 className="text-xl font-bold text-text mb-2">Restore Version?</h2>
          
          <p className="text-overlay0 text-sm leading-relaxed mb-4">
            You are about to restore the note to the version from{' '}
            <span className="font-semibold text-text">
              {new Date(version.created_at).toLocaleString()}
            </span>.
          </p>
          
          <div className="bg-surface1 p-3 rounded-lg border border-surface2 text-xs font-mono text-overlay1 flex flex-col gap-1.5 mb-2">
            <div className="flex justify-between">
              <span className="opacity-70">Commit:</span>
              <span className="text-amber-400">{version.commit_hash.substring(0, 7)}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Message:</span>
              <span className="text-text truncate max-w-[200px]" title={version.message}>{version.message}</span>
            </div>
          </div>

          <p className="text-xs text-amber-500/80 mt-4">
            This will create a new commit containing the exact state of this version. Your current work will be safely preserved in history.
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              {error.message}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-surface1 border-t border-surface2 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isRestoring}
            className="px-4 py-2 rounded-lg font-medium text-overlay1 hover:text-text hover:bg-surface2 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleRestore}
            disabled={isRestoring}
            className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium bg-amber-500 text-amber-950 hover:bg-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all disabled:opacity-50"
          >
            {isRestoring ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RotateCcw size={16} />
            )}
            Restore
          </button>
        </div>
      </div>
    </div>
  );
};
