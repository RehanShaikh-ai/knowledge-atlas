import { apiClient } from './client';
import {
  LinkSuggestion,
  LinkSuggestionListResponse,
} from '@/types/link_suggestion';

export async function getLinkSuggestions(
  workspaceId: string,
  params?: { status?: string; page?: number; page_size?: number }
): Promise<LinkSuggestionListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append('status', params.status);
  if (params?.page !== undefined) searchParams.append('page', params.page.toString());
  if (params?.page_size !== undefined) searchParams.append('page_size', params.page_size.toString());

  const qs = searchParams.toString();
  return apiClient.get<LinkSuggestionListResponse>(
    `/workspaces/${workspaceId}/suggestions${qs ? `?${qs}` : ''}`
  );
}

export async function acceptSuggestion(suggestionId: string): Promise<unknown> {
  return apiClient.post<unknown>(`/suggestions/${suggestionId}/accept`);
}

export async function rejectSuggestion(suggestionId: string): Promise<LinkSuggestion> {
  return apiClient.post<LinkSuggestion>(`/suggestions/${suggestionId}/reject`);
}
