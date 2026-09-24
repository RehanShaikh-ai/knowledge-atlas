import { apiClient } from './client';
import { GraphResponse, GraphQueryParams } from '@/types/graph';
import { GraphSearchResponse } from '@/types/graph_search';

export async function getWorkspaceGraph(
  workspaceId: string,
  paramsOrTag?: GraphQueryParams | string,
  legacyLimit?: number
): Promise<GraphResponse> {
  const searchParams = new URLSearchParams();

  if (typeof paramsOrTag === 'string') {
    if (paramsOrTag) searchParams.append('tag', paramsOrTag);
    if (legacyLimit) searchParams.append('limit', legacyLimit.toString());
  } else if (paramsOrTag && typeof paramsOrTag === 'object') {
    if (paramsOrTag.entity_type) searchParams.append('entity_type', paramsOrTag.entity_type);
    if (paramsOrTag.cluster_id) searchParams.append('cluster_id', paramsOrTag.cluster_id);
    if (paramsOrTag.note_id) searchParams.append('note_id', paramsOrTag.note_id);
    if (paramsOrTag.relationship_type) searchParams.append('relationship_type', paramsOrTag.relationship_type);
    if (paramsOrTag.min_confidence !== undefined) searchParams.append('min_confidence', paramsOrTag.min_confidence.toString());
    if (paramsOrTag.limit !== undefined) searchParams.append('limit', paramsOrTag.limit.toString());
  }

  const qs = searchParams.toString();
  return apiClient.get<GraphResponse>(`/workspaces/${workspaceId}/graph${qs ? `?${qs}` : ''}`);
}

export async function getEntityNeighborhood(entityId: string): Promise<GraphResponse> {
  return apiClient.get<GraphResponse>(`/entities/${entityId}/neighborhood`);
}

export async function searchGraph(
  workspaceId: string,
  query: string,
  limit?: number
): Promise<GraphSearchResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('q', query);
  if (limit !== undefined) {
    searchParams.append('limit', limit.toString());
  }
  return apiClient.get<GraphSearchResponse>(
    `/workspaces/${workspaceId}/graph/search?${searchParams.toString()}`
  );
}

// Retain note-level neighborhood for backward compatibility if needed
export async function getNoteNeighborhood(noteId: string): Promise<GraphResponse> {
  return apiClient.get<GraphResponse>(`/notes/${noteId}/graph`);
}
