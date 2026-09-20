import { apiClient } from './client';
import { GraphResponse } from '@/types/graph';

export async function getWorkspaceGraph(workspaceId: string, tag?: string, limit?: number): Promise<GraphResponse> {
  const params = new URLSearchParams();
  if (tag) params.append('tag', tag);
  if (limit) params.append('limit', limit.toString());
  
  const qs = params.toString();
  return apiClient.get(`/workspaces/${workspaceId}/graph${qs ? `?${qs}` : ''}`);
}

export async function getNoteNeighborhood(noteId: string): Promise<GraphResponse> {
  return apiClient.get(`/notes/${noteId}/graph`);
}
