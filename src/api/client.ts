/**
 * CIRQ Standard API Client
 * Features:
 * - Base path /api/v1
 * - Generated X-Request-Id header
 * - Cookie session (Application SDK): the browser never holds a token
 * - X-Appext-CSRF header on writing methods (SDK requirement)
 * - 401 handling: consent_required / expired session -> follow the SDK login URL
 * - Standard ApiError mapping with requestId
 */

export interface ApiErrorPayload {
  code: string;
  message: string;
  requestId?: string;
}

export class ApiError extends Error {
  public code: string;
  public requestId?: string;
  public status: number;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message || `API Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = payload.code || 'UNKNOWN_ERROR';
    this.requestId = payload.requestId;
  }
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const requestId = `req-${Math.random().toString(36).substring(2, 10)}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('X-Request-Id', requestId);

  // SDK CSRF rule: a custom header on every writing method. Verify the exact value against
  // docs/MANUAL_STEPS.md (CSRF) when you first run in appext mode.
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    headers.set('X-Appext-CSRF', '1');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin'
    });

    const responseRequestId = response.headers.get('X-Request-Id') || requestId;

    if (response.status === 401 && typeof window !== 'undefined') {
      // SDK answers {error:'consent_required', login_url} or a plain 401 for an ended session.
      const body = await response.clone().json().catch(() => null);
      const here = window.location.pathname + window.location.search;
      const loginUrl: string =
        (body && typeof body.login_url === 'string' && body.login_url) ||
        `/auth/login?return_to=${encodeURIComponent(here)}`;
      window.location.assign(loginUrl);
      return new Promise<T>(() => {}); // page is navigating away
    }

    if (!response.ok) {
      let errPayload: ApiErrorPayload = {
        code: `HTTP_${response.status}`,
        message: response.statusText,
        requestId: responseRequestId
      };

      try {
        const json = await response.json();
        if (json && json.error) {
          errPayload = {
            code: json.error.code || errPayload.code,
            message: json.error.message || errPayload.message,
            requestId: json.error.requestId || responseRequestId
          };
        }
      } catch {
        // Response was not JSON
      }

      throw new ApiError(response.status, errPayload);
    }

    if (response.status === 204) {
      return {} as T;
    }

    // Guard: if the server returned HTML instead of JSON (e.g. Netlify 404 page when
    // BACKEND_API_URL is not set), surface a clear BACKEND_NOT_CONFIGURED error instead
    // of an opaque "Unexpected token '<'" JSON parse crash.
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new ApiError(response.status || 502, {
        code: 'BACKEND_NOT_CONFIGURED',
        message: 'Backend is not reachable. Set BACKEND_API_URL in your Netlify environment variables and redeploy.',
        requestId: responseRequestId
      });
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or client-side failure (offline / DNS)
    throw new ApiError(0, {
      code: 'NETWORK_OFFLINE',
      message: error instanceof Error ? error.message : 'Network connection failed.',
      requestId
    });
  }
}
