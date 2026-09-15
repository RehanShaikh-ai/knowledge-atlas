import { useState, useEffect, useCallback } from 'react';
import { getHealth } from '@/api/health';

/**
 * Canonical status values (§16). No alternatives permitted.
 */
export type HealthStatus = 'loading' | 'connected' | 'error';

/**
 * Canonical displayed text (§16). Single source of truth.
 */
export const HEALTH_DISPLAY_TEXT: Record<HealthStatus, string> = {
  loading: 'Backend: Loading',
  connected: 'Backend: Connected',
  error: 'Backend: Unavailable',
};

export interface UseHealthResult {
  status: HealthStatus;
  displayText: string;
  checkHealth: () => Promise<void>;
}

export function useHealth(pollMs?: number): UseHealthResult {
  const [status, setStatus] = useState<HealthStatus>('loading');

  const checkHealth = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await getHealth();
      setStatus(res && res.status === 'ok' ? 'connected' : 'error');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    checkHealth();
    if (pollMs && pollMs > 0) {
      const id = setInterval(checkHealth, pollMs);
      return () => clearInterval(id);
    }
  }, [checkHealth, pollMs]);

  return {
    status,
    displayText: HEALTH_DISPLAY_TEXT[status],
    checkHealth,
  };
}
