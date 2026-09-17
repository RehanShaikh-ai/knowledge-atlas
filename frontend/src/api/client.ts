import { ApiError } from '@/types/api';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

/**
 * Thin HTTP client. Base URL comes from VITE_API_BASE_URL (§5.2, §14).
 *
 * Malformed-response handling (§13): any non-JSON or non-ApiError body is
 * wrapped into a generic ApiError with code "UNKNOWN_ERROR" so that callers
 * never see an unhandled exception.
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...init?.headers },
        ...init,
      });
    } catch (networkError) {
      const err: ApiError = {
        error: {
          code: 'NETWORK_ERROR',
          message:
            networkError instanceof Error
              ? networkError.message
              : 'Network request failed',
        },
      };
      throw err;
    }

    if (!response.ok) {
      let parsed: ApiError;
      try {
        const body = await response.json();
        if (
          body &&
          typeof body === 'object' &&
          'error' in body &&
          typeof body.error === 'object' &&
          'code' in body.error &&
          'message' in body.error
        ) {
          parsed = body as ApiError;
        } else {
          parsed = {
            error: {
              code: 'UNKNOWN_ERROR',
              message: `HTTP ${response.status}: ${response.statusText || 'Unexpected error'}`,
            },
          };
        }
      } catch {
        parsed = {
          error: {
            code: 'UNKNOWN_ERROR',
            message: `HTTP ${response.status}: Non-JSON response body`,
          },
        };
      }
      throw parsed;
    }

    try {
      return (await response.json()) as T;
    } catch {
      const parseError: ApiError = {
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Malformed response: failed to parse JSON',
        },
      };
      throw parseError;
    }
  }

  get<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...init, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...init,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }
}

export const apiClient = new ApiClient();
