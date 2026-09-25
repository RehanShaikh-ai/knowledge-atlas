import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, X, ArrowRight, Layers, Link as LinkIcon, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExtractionResultSummaryProps {
  status: 'completed' | 'failed' | string;
  entityCount?: number;
  relationshipCount?: number;
  notesProcessedCount?: number;
  message?: string | null;
  onDismiss?: () => void;
  onViewGraph?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const ExtractionResultSummary: React.FC<ExtractionResultSummaryProps> = ({
  status,
  entityCount = 0,
  relationshipCount = 0,
  notesProcessedCount = 0,
  message,
  onDismiss,
  onViewGraph,
  onRetry,
  className,
}) => {
  const isSuccess = status === 'completed';

  return (
    <div
      data-testid="extraction-result-summary"
      className={cn(
        'p-5 rounded-2xl border backdrop-blur-2xl shadow-2xl transition-all',
        isSuccess
          ? 'bg-slate-950/80 border-emerald-500/30 text-slate-200'
          : 'bg-slate-950/80 border-rose-500/30 text-slate-200',
        className
      )}
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          ) : (
            <div className="p-1 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle size={16} />
            </div>
          )}
          <h4
            data-testid="extraction-summary-title"
            className="font-semibold text-xs tracking-wide uppercase text-slate-200"
          >
            {isSuccess ? 'Extraction Completed' : 'Extraction Incomplete'}
          </h4>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
            aria-label="Dismiss extraction summary"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {isSuccess ? (
        <div className="py-3 grid grid-cols-3 gap-2.5 text-center">
          <div className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <div
              data-testid="metric-entity-count"
              className="font-bold text-base text-sky-400 font-mono"
            >
              {entityCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider flex items-center justify-center gap-1">
              <Sparkles size={10} className="text-sky-400" /> Entities
            </div>
          </div>
          <div className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <div
              data-testid="metric-relationship-count"
              className="font-bold text-base text-indigo-400 font-mono"
            >
              {relationshipCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider flex items-center justify-center gap-1">
              <LinkIcon size={10} className="text-indigo-400" /> Links
            </div>
          </div>
          <div className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <div
              data-testid="metric-notes-count"
              className="font-bold text-base text-amber-400 font-mono"
            >
              {notesProcessedCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider flex items-center justify-center gap-1">
              <Layers size={10} className="text-amber-400" /> Notes
            </div>
          </div>
        </div>
      ) : (
        <div className="py-3 text-xs text-rose-300/90 leading-relaxed">
          {message || 'The graph extraction pipeline encountered an error while analyzing notes.'}
        </div>
      )}

      {isSuccess && message && (
        <p
          data-testid="extraction-summary-message"
          className="text-xs text-slate-400 italic mb-2 px-1"
        >
          {message}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-white/[0.06]">
        {!isSuccess && onRetry && (
          <button
            onClick={onRetry}
            data-testid="extraction-retry-btn"
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw size={12} />
            <span>Retry Extraction</span>
          </button>
        )}
        {isSuccess && onViewGraph && (
          <button
            onClick={onViewGraph}
            data-testid="view-graph-btn"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Explore Constellation</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
