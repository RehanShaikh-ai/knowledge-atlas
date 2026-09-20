import React from 'react';
import { SourceImportResult } from '@/types/source';
import { CheckCircle2, RefreshCw, XCircle, FileText } from 'lucide-react';

interface ImportResultsProps {
  results: SourceImportResult;
}

export const ImportResults: React.FC<ImportResultsProps> = ({ results }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl text-center">
          <div className="text-emerald-400 text-2xl font-bold">{results.imported}</div>
          <div className="text-emerald-500/70 text-xs font-semibold uppercase tracking-wider mt-1">New</div>
        </div>
        <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-xl text-center">
          <div className="text-amber-400 text-2xl font-bold">{results.updated}</div>
          <div className="text-amber-500/70 text-xs font-semibold uppercase tracking-wider mt-1">Updated</div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl text-center">
          <div className="text-slate-300 text-2xl font-bold">{results.skipped}</div>
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">Skipped</div>
        </div>
        <div className="bg-rose-950/30 border border-rose-500/30 p-3 rounded-xl text-center">
          <div className="text-rose-400 text-2xl font-bold">{results.failed}</div>
          <div className="text-rose-500/70 text-xs font-semibold uppercase tracking-wider mt-1">Failed</div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-800/40 border-b border-slate-700/50 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
          <span>File Results</span>
          <span>Status</span>
        </div>
        <div className="max-h-64 overflow-y-auto p-2 space-y-1">
          {results.results.map((item, idx) => {
            let statusEl;
            if (item.status === 'completed') {
              statusEl = <span className="text-emerald-400 flex items-center gap-1.5"><CheckCircle2 size={14} /> Completed</span>;
            } else if (item.status === 'failed') {
              statusEl = <span className="text-rose-400 flex items-center gap-1.5"><XCircle size={14} /> Failed</span>;
            } else if (item.status === 'skipped') {
              statusEl = <span className="text-slate-400 flex items-center gap-1.5">Skipped</span>;
            } else {
              statusEl = <span className="text-amber-400 flex items-center gap-1.5"><RefreshCw size={14} /> {item.status}</span>;
            }

            return (
              <div key={idx} className="flex flex-col p-2 rounded-lg hover:bg-slate-800/40 text-sm border border-transparent hover:border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden mr-4">
                    <FileText size={14} className="text-slate-500 shrink-0" />
                    <span className="font-medium text-slate-300 truncate">{item.original_path}</span>
                  </div>
                  <div className="shrink-0 text-xs font-mono">{statusEl}</div>
                </div>
                {item.error && (
                  <p className="mt-1.5 text-xs text-rose-400 bg-rose-950/20 p-2 rounded ml-6 border border-rose-900/50">
                    {item.error}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
