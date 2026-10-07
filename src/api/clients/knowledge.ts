import { request } from '../client.ts';
import { KnowledgeArticleSchema, KnowledgeArticle } from '../schemas/domain.ts';
import { z } from 'zod';

export const knowledgeClient = {
  searchKnowledge: async (q: string = '') => {
    const res = await request<{ articles: any[]; count: number; status: string }>(`/knowledge/search?q=${encodeURIComponent(q)}`);
    const parsed = z.array(KnowledgeArticleSchema).parse(res.articles);
    return { ...res, articles: parsed };
  },

  getResourceKnowledge: async (resourceId: string) => {
    const res = await request<{ resourceId: string; articles: any[]; status: string }>(`/knowledge/resources/${resourceId}`);
    const parsed = z.array(KnowledgeArticleSchema).parse(res.articles);
    return { ...res, articles: parsed };
  },

  getPathwayKnowledge: async (pathwayId: string) => {
    const res = await request<{ pathwayId: string; articles: any[]; status: string }>(`/knowledge/pathways/${pathwayId}`);
    const parsed = z.array(KnowledgeArticleSchema).parse(res.articles);
    return { ...res, articles: parsed };
  },

  getSourceKnowledge: (sourceId: string) => {
    return request<{ sourceId: string; citationsCount: number; peerReviewed: boolean; publisher: string; status: string }>(`/knowledge/sources/${sourceId}`);
  }
};
