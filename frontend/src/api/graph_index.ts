import { apiClient } from './client';
import { ExtractionJobResponse } from '@/types/jobs';

export async function triggerExtraction(workspaceId: string): Promise<ExtractionJobResponse> {
  return apiClient.post<ExtractionJobResponse>(`/workspaces/${workspaceId}/graph/extract`);
}

export async function triggerReindex(workspaceId: string): Promise<ExtractionJobResponse> {
  return apiClient.post<ExtractionJobResponse>(`/workspaces/${workspaceId}/graph/reindex`);
}
