import { request } from '../client.ts';

export const impactClient = {
  getOverview: () => {
    return request<{
      cumulativeWasteDivertedTons: number;
      netCo2eAvoidedTons: number;
      soilCarbonOrganicGainTons: number;
      renewableEnergyGeneratedMwh: number;
      economicValueUnlockedUsd: number;
      participatingFarmersCount: number;
      activeCircularLoops: number;
      methodology: string;
      freshness: string;
      status: string;
    }>('/impact/overview');
  },

  getResourceImpact: (resourceId: string) => {
    return request<{
      resourceId: string;
      resourceName: string;
      wasteDivertedTons: number;
      potentialCo2eOffsetTons: number;
      particulatePm25AvoidedKg: number;
      farmerIncomeBoostUsd: number;
      status: string;
    }>(`/impact/resources/${resourceId}`);
  },

  getPathwayImpact: (pathwayId: string) => {
    return request<{
      pathwayId: string;
      name: string;
      co2eAvoidedPerTon: number;
      energyGeneratedPerTon: number;
      soilHealthRating: number;
      waterFootprintSavedM3PerTon: number;
      status: string;
    }>(`/impact/pathways/${pathwayId}`);
  },

  getProcessorImpact: (processorId: string) => {
    return request<{
      processorId: string;
      annualThroughputTons: number;
      annualCo2eMitigatedTons: number;
      status: string;
    }>(`/impact/processors/${processorId}`);
  },

  calculateImpact: (payload: { resourceId: string; pathwayId: string; quantityTons?: number }) => {
    return request<{
      resourceId: string;
      pathwayId: string;
      quantityTons: number;
      netCo2eAvoidedTons: number;
      energyRecoveredMwh: number;
      economicNetGainUsd: number;
      carbonCreditValueUsd: number;
      methodology: string;
      confidence: number;
      status: string;
    }>('/impact/calculate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getProvenance: (impactId: string) => {
    return request<{
      impactId: string;
      calculationBoundary: string;
      emissionFactors: Array<{ name: string; factor: string; source: string }>;
      status: string;
    }>(`/impact/provenance/${impactId}`);
  }
};
