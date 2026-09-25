export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface IndexJobRequest {
  note_ids?: string[];
}

export interface IndexJobResponse {
  job_id: string;
  status: JobStatus;
}

export interface JobProgress {
  stage?: string;
  processed_notes?: number;
  total_notes?: number;
  current_note_title?: string | null;
  extracted_entities?: number;
  extracted_relationships?: number;
  failed_notes?: Array<{ note_id: string; title: string; error: string }>;
  summary?: string | null;
}

export interface JobStatusResponse {
  id: string;
  job_id?: string;
  job_type: string;
  status: JobStatus;
  workspace_id: string;
  retry_count: number;
  max_retries: number;
  enqueued_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  progress?: JobProgress | null;
}

export interface ExtractionJobResponse {
  id?: string;
  job_id: string;
  job_type?: string;
  status: JobStatus | string;
  error_message?: string | null;
  progress?: JobProgress | null;
}

