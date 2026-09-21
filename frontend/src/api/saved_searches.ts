import { apiClient } from './client';
import { SavedSearch, CreateSavedSearchRequest, SavedSearchListResponse } from '../types/saved_searches';

export async function getSavedSearches(workspaceId: string): Promise<SavedSearchListResponse> {
  // If the API returns a direct array, we wrap it. If it returns an object with items, we return it.
  const res = await apiClient.get<SavedSearchListResponse | SavedSearch[]>(`/workspaces/${workspaceId}/saved-searches`);
  if (Array.isArray(res)) {
    return { items: res };
  }
  return res;
}

export async function createSavedSearch(
  workspaceId: string,
  request: CreateSavedSearchRequest
): Promise<SavedSearch> {
  return apiClient.post<SavedSearch>(
    `/workspaces/${workspaceId}/saved-searches`,
    request
  );
}

export async function deleteSavedSearch(
  workspaceId: string,
  savedSearchId: string
): Promise<void> {
  return apiClient.delete(`/workspaces/${workspaceId}/saved-searches/${savedSearchId}`);
}
