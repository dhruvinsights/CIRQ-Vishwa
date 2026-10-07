import { request } from '../client.ts';

export interface SimulationPayload {
  resourceId: string;
  quantity: number;
  location?: string;
  composition?: Record<string, any>;
  processor?: string;
  technology?: string;
  transportKm?: number;
  energyCost?: number;
  price?: number;
  efficiency?: number;
}

export const simulationClient = {
  createSimulation: (payload: SimulationPayload) => {
    return request<any>('/simulations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getSimulation: (simulationId: string) => {
    return request<any>(`/simulations/${simulationId}`);
  },

  getSimulationStatus: (simulationId: string) => {
    return request<{ simulationId: string; status: string; progressPercent?: number }>(`/simulations/${simulationId}/status`);
  },

  getSimulationResult: (simulationId: string) => {
    return request<any>(`/simulations/${simulationId}/result`);
  },

  cancelSimulation: (simulationId: string) => {
    return request<{ simulationId: string; status: string }>(`/simulations/${simulationId}/cancel`, {
      method: 'POST'
    });
  }
};
