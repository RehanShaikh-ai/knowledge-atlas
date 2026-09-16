import { apiClient } from './client';
import { HealthResponse } from '@/types/health';

/**
 * Canonical health function (§13).
 * Requests GET /health — base URL already contains /api/v1 (§14).
 */
export async function getHealth(): Promise<HealthResponse> {
  return apiClient.get<HealthResponse>('/health');
}
