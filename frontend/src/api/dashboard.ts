import { apiClient } from './client';
import { DashboardStats } from '@/types/dashboard';

export async function getWorkspaceDashboard(workspaceId: string): Promise<DashboardStats> {
  return apiClient.get(`/workspaces/${workspaceId}/dashboard`);
}
