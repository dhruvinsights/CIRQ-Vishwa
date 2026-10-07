import { request } from '../client.ts';
import { subscribeToEvents } from '../sse.ts';

export const systemClient = {
  getHealth: () => request<{ status: string; service: string; timestamp: string }>('/health'),
  getHealthLive: () => request<{ status: string; uptimeSeconds: number }>('/health/live'),
  getHealthReady: () => request<{ status: string; checks: Record<string, string> }>('/health/ready'),
  getStatus: () => request<{ status: string; environment: string; version: string; services: Record<string, string>; activeWorkers: number; queueLatencyMs: number; timestamp: string }>('/system/status'),
  getMetrics: () => request<{ totalResourcesAvailableTons: number; activeProcessorsCount: number; activeLoopsCount: number; co2eAvoidedTotalTons: number; economicValueGeneratedTotalUsd: number; provenanceConfidenceAverage: number; connectedDataSourcesCount: number; timestamp: string }>('/system/metrics'),
  getEvents: () => request<{ events: Array<{ id: string; type: string; message: string; timestamp: string; status: string }> }>('/system/events'),
  subscribeEventsStream: (onMessage: (ev: any) => void) => subscribeToEvents('/system/events/stream', { onMessage })
};
