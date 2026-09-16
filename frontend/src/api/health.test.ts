import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHealth } from './health';
import { apiClient } from './client';

describe('Frontend API Health Client (§13)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('health success: getHealth returns HealthResponse on HTTP 200', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ status: 'ok' });
    const response = await getHealth();
    expect(response).toEqual({ status: 'ok' });
  });

  it('health failure: throws ApiError shape on error', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValueOnce({
      error: { code: 'NETWORK_ERROR', message: 'fetch failed' },
    });
    await expect(getHealth()).rejects.toEqual({
      error: { code: 'NETWORK_ERROR', message: 'fetch failed' },
    });
  });
});
