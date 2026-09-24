import React, { useState, useEffect, useRef } from 'react';
import { JobStatusResponse } from '@/types/jobs';
import { getJobStatus, retryJob } from '@/api/jobs';
import { indexWorkspace } from '@/api/index';
import { JobStatusBadge } from './JobStatusBadge';
import { Database, Play, RefreshCw, AlertTriangle, HelpCircle, CheckCircle2 } from 'lucide-react';

interface IndexingStatusProps {
  workspaceId: string;
  className?: string;
}

export const IndexingStatus: React.FC<IndexingStatusProps> = ({ workspaceId, className = '' }) => {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const pollIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const startPolling = (jobId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        const status = await getJobStatus(jobId);
        setJobStatus(status);
        
        if (status.status === 'completed' || status.status === 'failed') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      } catch (err) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        console.error('Failed to poll job status', err);
      }
    }, 1500); // poll every 1.5 seconds
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleIndexWorkspace = async () => {
    setIsTriggering(true);
    setError(null);
    setJobStatus(null);
    
    try {
      const res = await indexWorkspace(workspaceId);
      setActiveJobId(res.job_id);
      setJobStatus({
        id: res.job_id,
        job_type: 'index_workspace',
        status: res.status,
        workspace_id: workspaceId,
        retry_count: 0,
        max_retries: 3,
        enqueued_at: new Date().toISOString(),
        started_at: null,
        completed_at: null,
        error_message: null
      });
      startPolling(res.job_id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to trigger indexing'));
    } finally {
      setIsTriggering(false);
    }
  };

  const handleRetry = async () => {
    if (!activeJobId) return;
    setIsTriggering(true);
    setError(null);
    try {
      await retryJob(activeJobId);
      startPolling(activeJobId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to retry job'));
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className={`flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-text text-sm font-semibold">
          <Database size={16} className="text-sky-400" />
          <span>Vector & Semantic Index</span>
          <div className="relative inline-block">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
              aria-label="What is Workspace Index?"
            >
              <HelpCircle size={13} />
            </button>
            {showTooltip && (
              <div className="absolute left-0 bottom-full mb-2 w-64 p-2.5 bg-slate-950/90 border border-white/[0.1] backdrop-blur-xl rounded-xl text-xs text-slate-300 shadow-xl z-20 leading-relaxed pointer-events-none">
                <strong className="text-sky-300 block mb-1">What does this do?</strong>
                Splits note markdown into semantic chunks and computes vector embeddings for AI Assistant RAG queries, Hybrid Search, and Semantic Search.
              </div>
            )}
          </div>
        </div>
        
        {jobStatus ? (
          <JobStatusBadge status={jobStatus.status} />
        ) : (
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 size={11} /> Ready
          </span>
        )}
      </div>

      <p className="text-xs text-[var(--subtext0)] leading-relaxed">
        Re-indexes all workspace notes into vector embeddings for semantic search and AI retrieval.
      </p>

      {jobStatus?.status === 'failed' && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-red-400" />
            <span>{jobStatus.error_message || 'The indexing job failed unexpectedly.'}</span>
          </div>
          {jobStatus.retry_count < jobStatus.max_retries && (
            <button
              onClick={handleRetry}
              disabled={isTriggering}
              className="self-start flex items-center gap-1.5 px-3 py-1.5 mt-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors"
            >
              <RefreshCw size={12} className={isTriggering ? 'animate-spin' : ''} />
              Retry Job ({jobStatus.retry_count}/{jobStatus.max_retries})
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-400 flex items-center gap-1.5">
          <AlertTriangle size={12} />
          {error.message}
        </div>
      )}

      {!jobStatus || jobStatus.status === 'completed' || (jobStatus.status === 'failed' && jobStatus.retry_count >= jobStatus.max_retries) ? (
        <button
          onClick={handleIndexWorkspace}
          disabled={isTriggering}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition-all text-xs font-semibold hover:shadow-[0_0_12px_rgba(56,189,248,0.2)]"
        >
          {isTriggering ? (
            <RefreshCw size={13} className="animate-spin" />
          ) : (
            <Play size={13} className="ml-0.5" />
          )}
          Re-index Workspace
        </button>
      ) : (
        <div className="text-xs text-sky-300 bg-sky-500/10 border border-sky-500/20 rounded-xl text-center py-2 font-mono flex items-center justify-center gap-2">
          <RefreshCw size={12} className="animate-spin text-sky-400" />
          {jobStatus.status === 'queued' ? 'Queued in background...' : 'Processing notes & generating vectors...'}
        </div>
      )}
    </div>
  );
};
