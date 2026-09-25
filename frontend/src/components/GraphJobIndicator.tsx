import React from 'react';
import { JobProgress, JobStatus } from '@/types/jobs';
import { Loader2, CheckCircle2, AlertTriangle, Clock, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GraphJobIndicatorProps {
  status: JobStatus | string;
  jobType?: string;
  jobId?: string;
  errorMessage?: string | null;
  progress?: JobProgress | null;
  onRetry?: () => void;
  className?: string;
}

export const GraphJobIndicator: React.FC<GraphJobIndicatorProps> = ({
  status,
  jobType,
  jobId,
  errorMessage,
  progress,
  onRetry,
  className,
}) => {
  const normalizedStatus = (status || 'queued').toLowerCase();

  const getJobTypeLabel = () => {
    switch (jobType) {
      case 'reindex_graph':
        return 'Reindexing Graph';
      case 'extract_entities':
      case 'extract_entities_job':
      case 'extract_relationships':
        return 'Extracting Knowledge Graph';
      case 'cluster_notes':
        return 'Clustering Workspace';
      case 'link_suggestions':
        return 'Generating Suggestions';
      default:
        return jobType ? jobType.replace(/_job$/, '').replace(/_/g, ' ') : 'Graph Job';
    }
  };

  const getStatusConfig = () => {
    switch (normalizedStatus) {
      case 'queued':
        return {
          icon: <Clock size={13} className="animate-pulse" />,
          label:
            jobType === 'extract_entities_job'
              ? 'Extraction Queued'
              : jobType === 'reindex_graph'
              ? 'Reindexing Queued'
              : `${getJobTypeLabel()} (Queued)`,
          classes: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
        };
      case 'running':
        return {
          icon: <Loader2 size={13} className="animate-spin text-sky-400" />,
          label:
            jobType === 'reindex_graph'
              ? 'Reindexing Graph...'
              : !jobType || jobType.startsWith('extract')
              ? 'Extracting Knowledge...'
              : `${getJobTypeLabel()}...`,
          classes: 'bg-sky-500/10 border-sky-500/25 text-sky-300',
        };
      case 'completed':
        return {
          icon: <CheckCircle2 size={13} className="text-emerald-400" />,
          label:
            jobType === 'reindex_graph'
              ? 'Reindexing Complete'
              : jobType && jobType.startsWith('extract')
              ? 'Extraction Complete'
              : 'Graph Up to Date',
          classes: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
        };
      case 'failed':
        return {
          icon: <AlertTriangle size={13} className="text-rose-400" />,
          label:
            jobType === 'reindex_graph'
              ? 'Reindexing Failed'
              : !jobType || jobType.startsWith('extract')
              ? 'Extraction Failed'
              : `${getJobTypeLabel()} Failed`,
          classes: 'bg-rose-500/10 border-rose-500/25 text-rose-300',
        };
      default:
        return {
          icon: <Clock size={13} />,
          label: status,
          classes: 'bg-white/[0.04] border-white/[0.08] text-slate-300',
        };
    }
  };

  const config = getStatusConfig();
  const hasProgress = progress && (progress.total_notes !== undefined || progress.stage || progress.summary || progress.current_note_title);
  const totalNotes = progress?.total_notes;
  const processedNotes = progress?.processed_notes ?? 0;
  const hasValidTotal = totalNotes !== undefined && totalNotes > 0;
  const progressPercent = hasValidTotal ? Math.min(100, Math.max(0, Math.round((processedNotes / totalNotes) * 100))) : null;

  return (
    <div
      data-testid="graph-job-indicator"
      data-status={normalizedStatus}
      className={cn(
        'inline-flex flex-col gap-1 px-3 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md transition-all shadow-sm max-w-md',
        config.classes,
        className
      )}
      title={errorMessage || (jobId ? `Job ID: ${jobId}` : undefined)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="shrink-0">{config.icon}</span>
          <span data-testid="job-status-label" className="font-semibold text-[11px]">{config.label}</span>
          {jobType && (
            <span className="text-[10px] font-mono opacity-70">
              ({jobType.replace(/_job$/, '').replace(/_/g, ' ')})
            </span>
          )}
        </div>
        {normalizedStatus === 'failed' && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            data-testid="job-retry-btn"
            className="ml-1 p-0.5 rounded hover:bg-rose-900/60 text-rose-200 transition-colors"
            title="Retry job"
            aria-label="Retry extraction job"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>

      {/* Progress Bar (Only when real total is available - no faking) */}
      {hasValidTotal && (
        <div className="w-full mt-1 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
            <span data-testid="job-progress-text">{processedNotes} / {totalNotes} notes</span>
            <span data-testid="job-progress-percentage">{progressPercent}%</span>
          </div>
          <div
            data-testid="job-progress-bar-container"
            className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden border border-white/10"
          >
            <div
              data-testid="job-progress-bar"
              role="progressbar"
              aria-valuenow={processedNotes}
              aria-valuemin={0}
              aria-valuemax={totalNotes}
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Real-time Progress Details */}
      {hasProgress && (
        <div className="text-[10px] opacity-90 space-y-0.5 pt-0.5 border-t border-white/10 font-mono">
          {progress.stage && (
            <div data-testid="job-stage-text" className="text-sky-200 font-medium">Stage: {progress.stage}</div>
          )}
          {!hasValidTotal && totalNotes !== undefined && (
            <div data-testid="job-progress-text">
              {processedNotes} / {totalNotes} notes
            </div>
          )}
          {progress.current_note_title && (
            <div className="truncate text-slate-200">
              Current: &ldquo;{progress.current_note_title}&rdquo;
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {progress.extracted_entities !== undefined && (
              <span>Entities: {progress.extracted_entities}</span>
            )}
            {progress.extracted_relationships !== undefined && (
              <span>Relationships: {progress.extracted_relationships}</span>
            )}
            {progress.failed_notes && progress.failed_notes.length > 0 && (
              <span className="text-rose-300 font-semibold">
                Failures: {progress.failed_notes.length}
              </span>
            )}
          </div>
          {progress.summary && normalizedStatus === 'completed' && (
            <div className="text-emerald-300 text-[9.5px] italic">{progress.summary}</div>
          )}
        </div>
      )}
    </div>
  );
};

