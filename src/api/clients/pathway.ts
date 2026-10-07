import { request } from '../client.ts';
import { PathwaySchema, Pathway } from '../schemas/domain.ts';
import { z } from 'zod';

export const pathwayClient = {
  getPathways: async () => {
    const res = await request<{ data: any[]; total: number; status: string }>('/pathways');
    const parsed = z.array(PathwaySchema).parse(res.data);
    return { ...res, data: parsed };
  },

  createPathway: async (data: Partial<Pathway>) => {
    const res = await request<any>('/pathways', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return PathwaySchema.parse(res);
  },

  getPathway: async (pathwayId: string) => {
    const res = await request<any>(`/pathways/${pathwayId}`);
    return PathwaySchema.parse(res);
  },

  updatePathway: async (pathwayId: string, data: Partial<Pathway>) => {
    const res = await request<any>(`/pathways/${pathwayId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return PathwaySchema.parse(res);
  },

  discoverPathways: (resourceId: string) => {
    return request<{
      resource: string;
      discoveredPathways: any[];
      paretoFrontier: string[];
      status: string;
    }>('/pathways/discover', {
      method: 'POST',
      body: JSON.stringify({ resourceId })
    });
  },

  rankPathways: (resourceId: string, criteria?: Record<string, number>) => {
    return request<{
      ranking: Array<{ pathwayId: string; name: string; rankScore: number; environmentalScore: number; economicScore: number }>;
      status: string;
    }>('/pathways/rank', {
      method: 'POST',
      body: JSON.stringify({ resourceId, criteria })
    });
  },

  comparePathways: (pathwayIds: string[]) => {
    return request<{
      compared: Pathway[];
      metricDeltas: Record<string, string>;
    }>('/pathways/compare', {
      method: 'POST',
      body: JSON.stringify({ pathwayIds })
    });
  }
};
