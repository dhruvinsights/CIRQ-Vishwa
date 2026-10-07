import { request } from '../client.ts';
import { CircularLoopSchema, CircularLoop } from '../schemas/domain.ts';
import { z } from 'zod';

export const loopClient = {
  getLoops: async () => {
    const res = await request<{ loops: any[]; total: number; status: string }>('/loops');
    const parsed = z.array(CircularLoopSchema).parse(res.loops);
    return { ...res, loops: parsed };
  },

  createLoop: async (data: Partial<CircularLoop>) => {
    const res = await request<any>('/loops', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return CircularLoopSchema.parse(res);
  },

  getLoop: async (loopId: string) => {
    const res = await request<any>(`/loops/${loopId}`);
    return CircularLoopSchema.parse(res);
  },

  updateLoop: async (loopId: string, data: Partial<CircularLoop>) => {
    const res = await request<any>(`/loops/${loopId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return CircularLoopSchema.parse(res);
  },

  deleteLoop: (loopId: string) => {
    return request<{ success: boolean; deletedId: string }>(`/loops/${loopId}`, {
      method: 'DELETE'
    });
  },

  validateLoop: (loopData: any) => {
    return request<{
      valid: boolean;
      circularityScore: number;
      materialLeakagePercent: number;
      certificationsSupported: string[];
    }>('/loops/validate', {
      method: 'POST',
      body: JSON.stringify(loopData)
    });
  },

  simulateLoop: (loopId: string) => {
    return request<{
      simulationId: string;
      cyclesOver5Years: number;
      cumulativeSoilCarbonTons: number;
      cumulativeFertilizerSavingsUsd: number;
      paybackPeriodYears: number;
    }>('/loops/simulate', {
      method: 'POST',
      body: JSON.stringify({ loopId })
    });
  },

  getLoopImpact: (loopId: string) => {
    return request<{
      loopId: string;
      annualCarbonOffsetTons: number;
      circularityIndex: number;
      economicValueAnnual: number;
      currency: string;
      status: string;
    }>(`/loops/${loopId}/impact`);
  }
};
