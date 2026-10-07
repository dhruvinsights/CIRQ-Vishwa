/**
 * CIRQ Server-Sent Events (SSE) Stream Client with auto-reconnect
 */
import { API_BASE_URL } from './client.ts';

export interface SSEOptions<T> {
  onMessage: (data: T) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  reconnectIntervalMs?: number;
}

export function subscribeToEvents<T = any>(
  path: string = '/system/events/stream',
  options: SSEOptions<T>
): () => void {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  let eventSource: EventSource | null = null;
  let isClosed = false;

  function connect() {
    if (isClosed) return;
    eventSource = new EventSource(url);

    eventSource.onopen = () => {
      options.onOpen?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        options.onMessage(parsed);
      } catch (e) {
        console.warn('Failed to parse SSE payload', e);
      }
    };

    eventSource.onerror = (err) => {
      options.onError?.(err);
      if (eventSource) {
        eventSource.close();
      }
      if (!isClosed) {
        setTimeout(connect, options.reconnectIntervalMs || 5000);
      }
    };
  }

  connect();

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
    }
  };
}
