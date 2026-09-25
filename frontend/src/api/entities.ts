import { apiClient } from './client';
import {
  GraphEntity,
  GraphEntityCreate,
  GraphEntityUpdate,
  EntityProvenanceResponse,
} from '@/types/graph_entity';

export async function createEntity(
  workspaceId: string,
  payload: GraphEntityCreate
): Promise<GraphEntity> {
  return apiClient.post<GraphEntity>(`/workspaces/${workspaceId}/entities`, payload);
}

export async function updateEntity(
  entityId: string,
  payload: GraphEntityUpdate
): Promise<GraphEntity> {
  return apiClient.patch<GraphEntity>(`/entities/${entityId}`, payload);
}

export async function deleteEntity(entityId: string): Promise<void> {
  return apiClient.delete<void>(`/entities/${entityId}`);
}

export async function getEntity(entityId: string): Promise<GraphEntity> {
  return apiClient.get<GraphEntity>(`/entities/${entityId}`);
}

export async function listEntities(
  workspaceId: string,
  params?: { entity_type?: string; cluster_id?: string; limit?: number }
): Promise<GraphEntity[]> {
  const searchParams = new URLSearchParams();
  if (params?.entity_type) searchParams.append('entity_type', params.entity_type);
  if (params?.cluster_id) searchParams.append('cluster_id', params.cluster_id);
  if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
  const qs = searchParams.toString();
  return apiClient.get<GraphEntity[]>(
    `/workspaces/${workspaceId}/entities${qs ? `?${qs}` : ''}`
  );
}

export async function getEntityProvenance(
  entityId: string
): Promise<EntityProvenanceResponse> {
  return apiClient.get<EntityProvenanceResponse>(`/entities/${entityId}/provenance`);
}
