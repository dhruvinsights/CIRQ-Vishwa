import { request } from '../client.ts';

export interface RagCitation {
  n: number;
  title: string | null;
  source: string | null;
  doi: string | null;
  url: string | null;
  license: string | null;
  verified: boolean;
  distance: number;
  excerpt: string;
}

export interface RagAnswer {
  status: 'COMPLETED' | 'INSUFFICIENT_EVIDENCE';
  answer: string;
  citations: RagCitation[];
  trace: Array<{ step: string; durationMs: number; status: string }>;
  confidence: number;
  durationMs: number;
}

export const ragClient = {
  ask: (question: string, topK?: number) =>
    request<RagAnswer>('/ai/ask', { method: 'POST', body: JSON.stringify({ question, topK }) })
};
