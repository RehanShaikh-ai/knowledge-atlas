import React from 'react';
import { JobStatus } from '@/types/jobs';
import { Loader2, CheckCircle2, AlertTriangle, Clock, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GraphJobIndicatorProps {
  status: JobStatus | string;
  jobType?: string;
  jobId?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  className?: string;
}

export const GraphJobIndicator: React.FC<GraphJobIndicatorProps> = ({
  status,
  jobType,
  jobId,
  errorMessage,
  onRetry,
  className,
}) => {
  const normalizedStatus = (status || 'queued').toLowerCase();

  const getStatusConfig = () => {
    switch (normalizedStatus) {
      case 'queued':
        return {
          icon: <Clock size={12} className="animate-pulse" />,
          label: 'Extraction Queued',
          classes: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
        };
      case 'running':
        return {
          icon: <Loader2 size={12} className="animate-spin text-sky-400" />,
          label: 'Extracting Knowledge...',
          classes: 'bg-sky-500/10 border-sky-500/25 text-sky-300',
        };
      case 'completed':
        return {
          icon: <CheckCircle2 size={12} className="text-emerald-400" />,
          label: 'Graph Up to Date',
          classes: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
        };
      case 'failed':
        return {
          icon: <AlertTriangle size={12} className="text-rose-400" />,
          label: 'Extraction Failed',
          classes: 'bg-rose-500/10 border-rose-500/25 text-rose-300',
        };
      default:
        return {
          icon: <Clock size={12} />,
          label: status,
          classes: 'bg-white/[0.04] border-white/[0.08] text-slate-300',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      data-testid="graph-job-indicator"
      data-status={normalizedStatus}
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs font-medium backdrop-blur-md transition-all shadow-sm',
        config.classes,
        className
      )}
      title={errorMessage || (jobId ? `Job ID: ${jobId}` : undefined)}
    >
      <span className="shrink-0">{config.icon}</span>
      <span className="font-semibold text-[11px]">{config.label}</span>
      {jobType && (
        <span className="text-[10px] font-mono opacity-70">
          ({jobType.replace(/_job$/, '').replace(/_/g, ' ')})
        </span>
      )}
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
  );
};
