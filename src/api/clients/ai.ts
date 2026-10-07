import { request } from '../client.ts';
import { AIServiceSchema, AIExecutionSchema, AIService, AIExecution } from '../schemas/domain.ts';
import { z } from 'zod';

export const aiClient = {
  getServices: async () => {
    const res = await request<{ services: any[]; count: number; status: string }>('/ai/services');
    const parsed = z.array(AIServiceSchema).parse(res.services);
    return { ...res, services: parsed };
  },

  getService: async (serviceId: string) => {
    const res = await request<any>(`/ai/services/${serviceId}`);
    return AIServiceSchema.parse(res);
  },

  getServiceHealth: (serviceId: string) => {
    return request<{ serviceId: string; health: string; avgLatencyMs: number; status: string }>(`/ai/services/${serviceId}/health`);
  },

  getServiceSchema: (serviceId: string) => {
    return request<Record<string, any>>(`/ai/services/${serviceId}/schema`);
  },

  getServiceExecutions: (serviceId: string) => {
    return request<{ executions: AIExecution[] }>(`/ai/services/${serviceId}/executions`);
  },

  executeService: async (serviceId: string, payload: any) => {
    const res = await request<any>(`/ai/services/${serviceId}/execute`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return AIExecutionSchema.parse(res);
  },

  getExecutions: async () => {
    const res = await request<{ executions: any[]; total: number }>('/ai/executions');
    const parsed = z.array(AIExecutionSchema).parse(res.executions);
    return { ...res, executions: parsed };
  },

  getExecution: async (executionId: string) => {
    const res = await request<any>(`/ai/executions/${executionId}`);
    return AIExecutionSchema.parse(res);
  },

  getExecutionStatus: (executionId: string) => {
    return request<{ executionId: string; status: string }>(`/ai/executions/${executionId}/status`);
  },

  getExecutionTrace: (executionId: string) => {
    return request<{
      executionId: string;
      serviceId: string;
      durationMs: number;
      confidence: number;
      trace: Array<{ step: string; durationMs: number; status: string }>;
      dataSources: string[];
      status: string;
    }>(`/ai/executions/${executionId}/trace`);
  },

  getExecutionResult: (executionId: string) => {
    return request<{ executionId: string; output: string; confidence: number }>(`/ai/executions/${executionId}/result`);
  },

  cancelExecution: (executionId: string) => {
    return request<{ executionId: string; status: string }>(`/ai/executions/${executionId}/cancel`, {
      method: 'POST'
    });
  }
};
