import { apiClient } from './client';
import { JobStatusResponse } from '../types/jobs';

/**
 * Retrieves the current status of an ARQ background job.
 */
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  return apiClient.get<JobStatusResponse>(`/jobs/${jobId}`);
}

/**
 * Retries a failed job.
 */
export async function retryJob(jobId: string): Promise<void> {
  return apiClient.post(`/jobs/${jobId}/retry`);
}
