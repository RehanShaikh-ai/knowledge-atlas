import { apiClient } from './client';
import { SearchRequest, SearchResponse } from '../types/search';

/**
 * Searches notes in a specific workspace using semantic, lexical, or hybrid mode.
 * @param workspaceId - The ID of the workspace to search in
 * @param request - The search request parameters
 * @returns A promise resolving to the search response containing result items
 */
export async function searchNotes(
  workspaceId: string,
  request: SearchRequest
): Promise<SearchResponse> {
  return apiClient.post<SearchResponse>(
    `/workspaces/${workspaceId}/search`,
    request
  );
}
