export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface IndexJobRequest {
  note_ids?: string[];
}

export interface IndexJobResponse {
  job_id: string;
  status: JobStatus;
}

export interface JobStatusResponse {
  id: string;
  job_type: string;
  status: JobStatus;
  workspace_id: string;
  retry_count: number;
  max_retries: number;
  enqueued_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export interface ExtractionJobResponse {
  job_id: string;
  status: JobStatus | string;
}
