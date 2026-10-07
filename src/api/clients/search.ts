import { request } from '../client.ts';

export const searchClient = {
  searchResources: (q: string) => request<{ results: any[]; count: number; status: string }>(`/search/resources?q=${encodeURIComponent(q)}`),
  searchProcessors: (q: string) => request<{ results: any[]; count: number; status: string }>(`/search/processors?q=${encodeURIComponent(q)}`),
  searchDemand: (q?: string) => request<{ demands: any[]; status: string }>(`/search/demand${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  searchRegions: () => request<{ regions: any[]; status: string }>('/search/regions'),
  searchPathways: (q: string) => request<{ results: any[]; count: number; status: string }>(`/search/pathways?q=${encodeURIComponent(q)}`),
  searchNaturalLanguage: (query: string) => request<{
    query: string;
    structuredIntent: {
      action: string;
      resourceId: string;
      category: string;
      recommendedPathway: string;
      filters: Record<string, any>;
    };
    confidence: number;
    status: string;
  }>('/search/natural-language', {
    method: 'POST',
    body: JSON.stringify({ query })
  })
};
