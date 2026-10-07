import { request } from '../client.ts';
import { ProcessorSchema, Processor } from '../schemas/domain.ts';
import { z } from 'zod';

export const processorClient = {
  getProcessors: async () => {
    const res = await request<{ data: any[]; total: number; status: string }>('/processors');
    const parsed = z.array(ProcessorSchema).parse(res.data);
    return { ...res, data: parsed };
  },

  createProcessor: async (data: Partial<Processor>) => {
    const res = await request<any>('/processors', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return ProcessorSchema.parse(res);
  },

  getProcessor: async (processorId: string) => {
    const res = await request<any>(`/processors/${processorId}`);
    return ProcessorSchema.parse(res);
  },

  updateProcessor: async (processorId: string, data: Partial<Processor>) => {
    const res = await request<any>(`/processors/${processorId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return ProcessorSchema.parse(res);
  },

  deleteProcessor: (processorId: string) => {
    return request<{ success: boolean; deletedId: string }>(`/processors/${processorId}`, {
      method: 'DELETE'
    });
  },

  getCapacity: (processorId: string) => {
    return request<{
      processorId: string;
      totalCapacityPerDay: number;
      availableCapacity: number;
      utilizationPercent: number;
      unit: string;
      status: string;
    }>(`/processors/${processorId}/capacity`);
  },

  getCapabilities: (processorId: string) => {
    return request<{
      processorId: string;
      capabilities: string[];
      certifications: string[];
      qualityRequirements: Record<string, any>;
      status: string;
    }>(`/processors/${processorId}/capabilities`);
  },

  getDemand: (processorId: string) => {
    return request<{
      processorId: string;
      dailyIntakeTargetTons: number;
      currentContractedTons: number;
      openFeedstockDeficitTons: number;
      willingnessToPayPerTon: number;
      currency: string;
      status: string;
    }>(`/processors/${processorId}/demand`);
  },

  getQueue: (processorId: string) => {
    return request<{
      processorId: string;
      queueDepth: number;
      averageWaitTimeHours: number;
      incomingShipmentsScheduled: number;
      status: string;
    }>(`/processors/${processorId}/queue`);
  },

  getImpact: (processorId: string) => {
    return request<{
      processorId: string;
      cumulativeBiomassProcessedTons: number;
      cumulativeCo2eAvoidedTons: number;
      energySelfSufficiencyPercent: number;
      status: string;
    }>(`/processors/${processorId}/impact`);
  },

  matchProcessor: (payload: { resourceId: string; quantity?: number }) => {
    return request<{
      matches: Array<{
        processorId: string;
        name: string;
        category: string;
        matchScore: number;
        distanceKm: number;
        availableCapacity: number;
        unit: string;
        costPerTon: number;
        currency: string;
        co2eOffsetTons: number;
      }>;
      resourceId: string;
      requestedQuantity: number;
      status: string;
    }>('/processors/match', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
