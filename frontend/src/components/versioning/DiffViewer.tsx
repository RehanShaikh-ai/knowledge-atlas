import React, { useState, useEffect } from 'react';
import { getNoteDiff } from '@/api/versions';
import { Loader2, AlertTriangle, FileCode2 } from 'lucide-react';

interface DiffViewerProps {
  noteId: string;
  fromHash: string;
  toHash: string;
  className?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ noteId, fromHash, toHash, className = '' }) => {
  const [diff, setDiff] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    
    getNoteDiff(noteId, fromHash, toHash)
      .then(res => {
        if (mounted) setDiff(res.diff);
      })
      .catch(err => {
        if (mounted) setError(err instanceof Error ? err : new Error('Failed to load diff'));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
      
    return () => { mounted = false; };
  }, [noteId, fromHash, toHash]);

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 text-overlay1 bg-base border border-surface1 rounded-xl ${className}`}>
        <Loader2 size={32} className="animate-spin mb-4 text-blue-400" />
        <p className="text-sm font-medium">Computing differences...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl flex items-start gap-4 ${className}`}>
        <AlertTriangle size={24} className="shrink-0" />
        <div>
          <h3 className="font-semibold text-lg mb-1">Failed to load diff</h3>
          <p className="text-sm opacity-80">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!diff || diff.trim() === '') {
    return (
      <div className={`p-12 text-center text-overlay1 bg-base border border-surface1 rounded-xl flex flex-col items-center ${className}`}>
        <FileCode2 size={48} className="opacity-20 mb-4" />
        <p className="text-lg font-medium text-text mb-1">No Changes</p>
        <p className="text-sm">These versions have identical content.</p>
      </div>
    );
  }

  // Very basic unified diff parser for rendering + and - lines
  const renderDiff = () => {
    const lines = diff.split('\n');
    return lines.map((line, idx) => {
      let lineClass = 'text-overlay1';
      let bgClass = 'hover:bg-surface1/50';
      
      if (line.startsWith('+') && !line.startsWith('+++')) {
        lineClass = 'text-emerald-400';
        bgClass = 'bg-emerald-500/10 hover:bg-emerald-500/20';
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        lineClass = 'text-rose-400';
        bgClass = 'bg-rose-500/10 hover:bg-rose-500/20';
      } else if (line.startsWith('@@')) {
        lineClass = 'text-sky-400 font-bold';
        bgClass = 'bg-sky-500/10';
      }

      return (
        <div key={idx} className={`font-mono text-xs px-4 py-0.5 whitespace-pre-wrap transition-colors ${bgClass}`}>
          <span className={lineClass}>{line}</span>
        </div>
      );
    });
  };

  return (
    <div className={`flex flex-col bg-base border border-surface1 rounded-xl overflow-hidden ${className}`}>
      <div className="bg-surface0 border-b border-surface1 px-4 py-3 flex items-center justify-between">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <FileCode2 size={16} className="text-blue-400" />
          Changes
        </h4>
        <div className="flex items-center gap-4 text-xs font-mono text-overlay1">
          <span className="text-rose-400">-{fromHash.substring(0,7)}</span>
          <span>vs</span>
          <span className="text-emerald-400">+{toHash.substring(0,7)}</span>
        </div>
      </div>
      <div className="overflow-x-auto py-2 h-[400px] overflow-y-auto bg-crust scrollbar-thin scrollbar-thumb-surface1">
        {renderDiff()}
      </div>
    </div>
  );
};
