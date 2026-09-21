import React, { useState, useEffect, useRef } from 'react';
import { JobStatusResponse } from '@/types/jobs';
import { getJobStatus, retryJob } from '@/api/jobs';
import { indexWorkspace } from '@/api/index';
import { JobStatusBadge } from './JobStatusBadge';
import { Database, Play, RefreshCw, AlertTriangle } from 'lucide-react';

interface IndexingStatusProps {
  workspaceId: string;
  className?: string;
}

export const IndexingStatus: React.FC<IndexingStatusProps> = ({ workspaceId, className = '' }) => {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  
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
    }, 2000); // poll every 2 seconds
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
    <div className={`flex flex-col gap-3 p-4 rounded-xl bg-surface0 border border-surface1 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-text text-sm font-semibold">
          <Database size={16} className="text-blue-400" />
          Workspace Index
        </div>
        
        {jobStatus ? (
          <JobStatusBadge status={jobStatus.status} />
        ) : (
          <span className="text-[11px] font-mono text-overlay1">Ready</span>
        )}
      </div>

      {jobStatus?.status === 'failed' && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-red-400" />
            <span>{jobStatus.error_message || 'The indexing job failed unexpectedly.'}</span>
          </div>
          {jobStatus.retry_count < jobStatus.max_retries && (
            <button
              onClick={handleRetry}
              disabled={isTriggering}
              className="self-start flex items-center gap-1.5 px-3 py-1.5 mt-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors"
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
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all text-sm font-medium"
        >
          {isTriggering ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Play size={14} className="ml-0.5" />
          )}
          Rebuild Index
        </button>
      ) : (
        <div className="text-xs text-overlay1 text-center py-1 font-mono">
          {jobStatus.status === 'queued' ? 'Waiting in queue...' : 'Processing workspace nodes...'}
        </div>
      )}
    </div>
  );
};
