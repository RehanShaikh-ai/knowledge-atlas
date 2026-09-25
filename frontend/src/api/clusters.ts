import { apiClient } from './client';
import { ClusterResponse } from '@/types/cluster';
import { ExtractionJobResponse } from '@/types/jobs';

export async function listClusters(workspaceId: string): Promise<ClusterResponse[]> {
  return apiClient.get<ClusterResponse[]>(`/workspaces/${workspaceId}/clusters`);
}

export async function getCluster(
  workspaceId: string,
  clusterId: string
): Promise<ClusterResponse> {
  return apiClient.get<ClusterResponse>(`/workspaces/${workspaceId}/clusters/${clusterId}`);
}

export async function generateClusters(workspaceId: string): Promise<ExtractionJobResponse> {
  return apiClient.post<ExtractionJobResponse>(`/workspaces/${workspaceId}/clusters/generate`);
}
