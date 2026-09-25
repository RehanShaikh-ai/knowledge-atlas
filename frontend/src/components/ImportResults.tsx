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
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-center">
          <div className="text-emerald-400 text-2xl font-bold">{results.imported}</div>
          <div className="text-emerald-400/80 text-xs font-medium uppercase tracking-wider mt-1">New</div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-center">
          <div className="text-amber-400 text-2xl font-bold">{results.updated}</div>
          <div className="text-amber-400/80 text-xs font-medium uppercase tracking-wider mt-1">Updated</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] p-3 rounded-xl text-center">
          <div className="text-slate-200 text-2xl font-bold">{results.skipped}</div>
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mt-1">Skipped</div>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-center">
          <div className="text-rose-400 text-2xl font-bold">{results.failed}</div>
          <div className="text-rose-400/80 text-xs font-medium uppercase tracking-wider mt-1">Failed</div>
        </div>
      </div>

      <div className="bg-[var(--crust)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-[var(--surface1)] border-b border-[var(--card-border)] text-xs font-semibold text-[var(--overlay1)] uppercase tracking-wider flex justify-between">
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
              <div key={idx} className="flex flex-col p-2 rounded-lg hover:bg-[var(--surface1)] text-sm border border-transparent hover:border-white/[0.08] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden mr-4">
                    <FileText size={14} className="text-slate-500 shrink-0" />
                    <span className="font-medium text-slate-300 truncate">{item.original_path}</span>
                  </div>
                  <div className="shrink-0 text-xs font-mono">{statusEl}</div>
                </div>
                {item.error && (
                  <p className="mt-1.5 text-xs text-rose-300 bg-rose-500/10 p-2 rounded-lg ml-6 border border-rose-500/20">
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
