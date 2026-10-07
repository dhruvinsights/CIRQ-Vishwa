import { request } from '../client.ts';

export const logisticsClient = {
  calculateRoute: (payload: { originCoords?: [number, number]; destinationCoords?: [number, number]; payloadTons?: number }) => {
    return request<{
      routeId: string;
      distanceKm: number;
      durationMinutes: number;
      freightCost: number;
      carbonFootprintKgCo2e: number;
      currency: string;
      waypoints: Array<[number, number]>;
      status: string;
    }>('/logistics/route', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  optimizeLogistics: (payload: { resourceId: string; processorId: string }) => {
    return request<{
      optimizedRouteId: string;
      distanceKm: number;
      transitTimeMinutes: number;
      trucksRequired: number;
      emptyBackhaulAvoidanceScore: number;
      totalLogisticsCostUsd: number;
      co2eAvoidedVsStandardDieselKg: number;
      status: string;
    }>('/logistics/optimize', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getRoutes: () => {
    return request<{ routes: Array<{ id: string; name: string; distanceKm: number; status: string }> }>('/logistics/routes');
  },

  getRoute: (routeId: string) => {
    return request<{
      routeId: string;
      distanceKm: number;
      turnByTurnSteps: string[];
      fuelConsumptionLiters: number;
      carbonOffsetMethodology: string;
    }>(`/logistics/routes/${routeId}`);
  },

  compareLogistics: (payload: any = {}) => {
    return request<{
      comparison: Array<{ mode: string; costUsd: number; carbonKg: number; durationHours: number }>;
      recommendedMode: string;
    }>('/logistics/compare', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
