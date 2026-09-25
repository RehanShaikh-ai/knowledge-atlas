import React from 'react';
import { SourcePreviewResult } from '@/types/source';
import { FileText, AlertCircle, AlertTriangle, Link as LinkIcon, RefreshCw } from 'lucide-react';

interface ImportPreviewProps {
  preview: SourcePreviewResult;
}

export const ImportPreview: React.FC<ImportPreviewProps> = ({ preview }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 bg-sky-500/10 border border-sky-500/25 p-4 rounded-xl">
        <div className="bg-sky-500/20 p-2 rounded-lg text-sky-400">
          <FileText size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-slate-200">Found {preview.detected_notes.length} Notes</h4>
          <p className="text-sm text-slate-400">Ready to be imported into your workspace.</p>
        </div>
      </div>

      {(preview.warnings.length > 0 || preview.errors.length > 0) && (
        <div className="space-y-3">
          {preview.errors.map((error, idx) => (
            <div key={idx} className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 p-3 rounded-lg text-rose-300 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          ))}
          {preview.warnings.map((warning, idx) => (
            <div key={idx} className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-amber-300 text-sm">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <p>{warning}</p>
            </div>
          ))}
        </div>
      )}

      {preview.unresolved_link_count > 0 && (
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] p-3 rounded-lg text-slate-300 text-sm">
          <LinkIcon size={16} className="text-slate-400" />
          <p>{preview.unresolved_link_count} unresolved links detected. These will automatically resolve if the target notes are imported later.</p>
        </div>
      )}

      <div className="bg-[var(--crust)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-[var(--surface1)] border-b border-[var(--card-border)] text-xs font-semibold text-[var(--overlay1)] uppercase tracking-wider flex justify-between">
          <span>Detected Files</span>
          <span>Status</span>
        </div>
        <div className="max-h-64 overflow-y-auto p-2 space-y-1">
          {preview.detected_notes.map((note, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--surface1)] text-sm">
              <div className="flex flex-col overflow-hidden mr-4">
                <span className="font-medium text-slate-200 truncate">{note.title}</span>
                <span className="text-xs text-slate-500 truncate">{note.original_path}</span>
              </div>
              <div className="shrink-0 flex items-center gap-2 text-xs font-mono">
                {note.is_duplicate ? (
                  note.will_update_existing ? (
                    <span className="text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 flex items-center gap-1"><RefreshCw size={12}/> Update</span>
                  ) : (
                    <span className="text-slate-400 bg-slate-400/10 px-2 py-0.5 rounded border border-slate-400/20">Skip (Unchanged)</span>
                  )
                ) : (
                  <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">New</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
