import { apiClient } from './client';
import {
  GraphRelationship,
  GraphRelationshipCreate,
  GraphRelationshipUpdate,
} from '@/types/graph_relationship';

export async function createRelationship(
  workspaceId: string,
  payload: GraphRelationshipCreate
): Promise<GraphRelationship> {
  return apiClient.post<GraphRelationship>(`/workspaces/${workspaceId}/relationships`, payload);
}

export async function updateRelationship(
  relationshipId: string,
  payload: GraphRelationshipUpdate
): Promise<GraphRelationship> {
  return apiClient.patch<GraphRelationship>(`/relationships/${relationshipId}`, payload);
}

export async function deleteRelationship(relationshipId: string): Promise<void> {
  return apiClient.delete<void>(`/relationships/${relationshipId}`);
}

export async function getRelationship(relationshipId: string): Promise<GraphRelationship> {
  return apiClient.get<GraphRelationship>(`/relationships/${relationshipId}`);
}
