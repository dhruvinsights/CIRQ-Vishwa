import { request } from '../client.ts';
import { IntegrationSchema, Integration } from '../schemas/domain.ts';
import { z } from 'zod';

export const integrationClient = {
  getIntegrations: async () => {
    const res = await request<{ integrations: any[]; total: number; status: string }>('/integrations');
    const parsed = z.array(IntegrationSchema).parse(res.integrations);
    return { ...res, integrations: parsed };
  },

  getIntegration: async (integrationId: string) => {
    const res = await request<any>(`/integrations/${integrationId}`);
    return IntegrationSchema.parse(res);
  },

  createIntegration: async (data: Partial<Integration>) => {
    const res = await request<any>('/integrations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return IntegrationSchema.parse(res);
  },

  updateIntegration: async (integrationId: string, data: Partial<Integration>) => {
    const res = await request<any>(`/integrations/${integrationId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return IntegrationSchema.parse(res);
  },

  deleteIntegration: (integrationId: string) => {
    return request<{ success: boolean; deletedId: string }>(`/integrations/${integrationId}`, {
      method: 'DELETE'
    });
  },

  testIntegration: (integrationId: string) => {
    return request<{ integrationId: string; tested: boolean; latencyMs: number; status: string }>(`/integrations/${integrationId}/test`, {
      method: 'POST'
    });
  },

  syncIntegration: (integrationId: string) => {
    return request<{ integrationId: string; synced: boolean; newRecords: number; lastSync: string }>(`/integrations/${integrationId}/sync`, {
      method: 'POST'
    });
  },

  getIntegrationLogs: (integrationId: string) => {
    return request<{ logs: Array<{ timestamp: string; level: string; message: string }> }>(`/integrations/${integrationId}/logs`);
  }
};
