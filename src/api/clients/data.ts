import { request } from '../client.ts';
import { DataSourceSchema, DataSource } from '../schemas/domain.ts';
import { z } from 'zod';

export const dataClient = {
  getDataSources: async () => {
    const res = await request<{ sources: any[]; total: number; status: string }>('/data/sources');
    const parsed = z.array(DataSourceSchema).parse(res.sources);
    return { ...res, sources: parsed };
  },

  getDataSource: async (sourceId: string) => {
    const res = await request<any>(`/data/sources/${sourceId}`);
    return DataSourceSchema.parse(res);
  },

  getDataSourceHealth: (sourceId: string) => {
    return request<{ sourceId: string; status: string; qualityScore: number }>(`/data/sources/${sourceId}/health`);
  },

  getDataSourceSchema: (sourceId: string) => {
    return request<{ sourceId: string; type: string; endpoint: string }>(`/data/sources/${sourceId}/schema`);
  },

  getDataSourceFreshness: (sourceId: string) => {
    return request<{ sourceId: string; freshness: string; lastSync: string }>(`/data/sources/${sourceId}/freshness`);
  },

  getDataSourceCoverage: (sourceId: string) => {
    return request<{ sourceId: string; coverage: string; recordsCount: number }>(`/data/sources/${sourceId}/coverage`);
  }
};
