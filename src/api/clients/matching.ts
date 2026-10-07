import { request } from '../client.ts';

export const matchingClient = {
  matchResources: (payload: any) => request<{ matchId: string; matchedProcessors: any[]; status: string }>('/matching/resources', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  matchProcessors: (payload: any) => request<{ matchId: string; matchedResources: any[]; status: string }>('/matching/processors', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  matchDemand: (payload: any) => request<{ matchId: string; matchingLoops: any[]; status: string }>('/matching/demand', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  getMatch: (matchId: string) => request<{
    matchId: string;
    status: string;
    overallCompatibilityScore: number;
    economicViabilityScore: number;
    carbonOffsetScore: number;
    recommendedContractTons: number;
    freshness: string;
  }>(`/matching/${matchId}`),

  getMatchExplanation: (matchId: string) => request<{
    matchId: string;
    criteriaEvaluation: Array<{ factor: string; score: number; weight: number; note: string }>;
    humanOversightOptions: string[];
  }>(`/matching/${matchId}/explanation`)
};
