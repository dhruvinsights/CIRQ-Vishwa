import { request } from '../client.ts';
import { ScenarioSchema, Scenario } from '../schemas/domain.ts';
import { z } from 'zod';

export const scenarioClient = {
  getScenarios: async () => {
    const res = await request<{ scenarios: any[]; total: number }>('/scenarios');
    const parsed = z.array(ScenarioSchema).parse(res.scenarios);
    return { ...res, scenarios: parsed };
  },

  createScenario: async (data: Partial<Scenario>) => {
    const res = await request<any>('/scenarios', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return ScenarioSchema.parse(res);
  },

  getScenario: async (scenarioId: string) => {
    const res = await request<any>(`/scenarios/${scenarioId}`);
    return ScenarioSchema.parse(res);
  },

  updateScenario: async (scenarioId: string, data: Partial<Scenario>) => {
    const res = await request<any>(`/scenarios/${scenarioId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return ScenarioSchema.parse(res);
  },

  deleteScenario: (scenarioId: string) => {
    return request<{ success: boolean; deletedId: string }>(`/scenarios/${scenarioId}`, {
      method: 'DELETE'
    });
  },

  runScenario: (scenarioId: string) => {
    return request<{ scenarioId: string; status: string; completedAt: string }>(`/scenarios/${scenarioId}/run`, {
      method: 'POST'
    });
  },

  getScenarioStatus: (scenarioId: string) => {
    return request<{ scenarioId: string; status: string }>(`/scenarios/${scenarioId}/status`);
  },

  getScenarioResult: (scenarioId: string) => {
    return request<{
      scenarioId: string;
      projectedQuantity: number;
      projectedCo2eAvoided: number;
      projectedNetValue: number;
      carbonPriceBenefit: number;
    }>(`/scenarios/${scenarioId}/result`);
  },

  compareScenarios: (scenarioIds?: string[]) => {
    return request<{
      baseline: any;
      scenarioDiff: {
        quantityDelta: number;
        co2Delta: number;
        valueDelta: number;
      };
    }>('/scenarios/compare', {
      method: 'POST',
      body: JSON.stringify({ scenarioIds })
    });
  }
};
