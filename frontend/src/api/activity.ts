import { apiClient } from './client';
import { ActivityResponse } from '../types/activity';

/**
 * Retrieves the activity timeline for a workspace.
 */
export async function getWorkspaceActivity(
  workspaceId: string,
  limit: number = 50
): Promise<ActivityResponse> {
  return apiClient.get<ActivityResponse>(`/workspaces/${workspaceId}/activity?limit=${limit}`);
}
