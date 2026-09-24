import { apiClient } from './client';
import { GraphRAGRequest, GraphRAGResponse } from '@/types/graph_rag';

export async function runGraphRAG(
  workspaceId: string,
  request: GraphRAGRequest
): Promise<GraphRAGResponse> {
  // Pass request directly to the backend.
  // Values greater than 2 are NOT silently capped by the frontend;
  // the backend will validate and reject with 422 if max_hops > 2.
  return apiClient.post<GraphRAGResponse>(`/workspaces/${workspaceId}/graph-rag`, request);
}
