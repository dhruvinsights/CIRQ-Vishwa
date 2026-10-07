import { request } from '../client.ts';
import { ResourceSchema, Resource } from '../schemas/domain.ts';
import { z } from 'zod';

export interface ResourceQueryParams {
  query?: string;
  category?: string;
  countryCode?: string;
  limit?: number;
  page?: number;
}

export const resourceClient = {
  getResources: async (params: ResourceQueryParams = {}) => {
    const sp = new URLSearchParams();
    if (params.query) sp.set('query', params.query);
    if (params.category) sp.set('category', params.category);
    if (params.countryCode) sp.set('countryCode', params.countryCode);
    if (params.limit) sp.set('limit', String(params.limit));
    if (params.page) sp.set('page', String(params.page));

    const res = await request<{ data: any[]; pagination: any; provenanceState: string; freshness: string }>(
      `/resources?${sp.toString()}`
    );
    const parsedData = z.array(ResourceSchema).parse(res.data);
    return { ...res, data: parsedData };
  },

  createResource: async (data: Partial<Resource>) => {
    const res = await request<any>('/resources', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return ResourceSchema.parse(res);
  },

  getResource: async (resourceId: string) => {
    const res = await request<any>(`/resources/${resourceId}`);
    return ResourceSchema.parse(res);
  },

  updateResource: async (resourceId: string, data: Partial<Resource>) => {
    const res = await request<any>(`/resources/${resourceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return ResourceSchema.parse(res);
  },

  deleteResource: (resourceId: string) => {
    return request<{ success: boolean; deletedId: string }>(`/resources/${resourceId}`, {
      method: 'DELETE'
    });
  },

  getAvailability: (resourceId: string) => {
    return request<{
      resourceId: string;
      currentAvailableQuantity: number;
      unit: string;
      seasonality: string[];
      availabilityWindow: { start: string; end: string };
      harvestPeakDaysRemaining: number;
      regionalSupplyForecastTons: number;
      freshness: string;
      status: string;
    }>(`/resources/${resourceId}/availability`);
  },

  getComposition: (resourceId: string) => {
    return request<{
      resourceId: string;
      composition: any;
      uncertaintyBandPercent: number;
      methodology: string;
      status: string;
    }>(`/resources/${resourceId}/composition`);
  },

  getQuality: (resourceId: string) => {
    return request<{
      resourceId: string;
      overallQualityScore: number;
      moisturePenaltyDeduction: number;
      contaminationScore: number;
      particleUniformity: number;
      gradeClassification: string;
      provenance: any[];
    }>(`/resources/${resourceId}/quality`);
  },

  getPathways: (resourceId: string) => {
    return request<{
      resourceId: string;
      pathways: any[];
      scoringWeights: any;
      freshness: string;
      status: string;
    }>(`/resources/${resourceId}/pathways`);
  },

  getProcessors: (resourceId: string) => {
    return request<{
      resourceId: string;
      processors: any[];
      status: string;
    }>(`/resources/${resourceId}/processors`);
  },

  getDemand: (resourceId: string) => {
    return request<{
      resourceId: string;
      spotPriceEstimate: number;
      currency: string;
      unit: string;
      demandIntensity: string;
      activePurchaseOrdersTons: number;
      primaryBuyerSectors: string[];
      status: string;
    }>(`/resources/${resourceId}/demand`);
  },

  getLogistics: (resourceId: string) => {
    return request<{
      resourceId: string;
      origin: any;
      averageConsolidationRadiusKm: number;
      estimatedFreightCostPerTonKm: number;
      currency: string;
      recommendedFleet: string;
      estimatedCo2ePerTonKm: number;
      status: string;
    }>(`/resources/${resourceId}/logistics`);
  },

  getImpact: (resourceId: string) => {
    return request<{
      resourceId: string;
      co2eAvoidedTotal: number;
      particulatePm25AvoidedKg: number;
      soilCarbonAccretionTons: number;
      energyRecoverableMwh: number;
      methodology: string;
      status: string;
    }>(`/resources/${resourceId}/impact`);
  },

  getProvenance: (resourceId: string) => {
    return request<{
      resourceId: string;
      provenanceTree: any[];
      verificationTier: string;
      status: string;
    }>(`/resources/${resourceId}/provenance`);
  },

  getHistory: (resourceId: string) => {
    return request<{
      resourceId: string;
      events: Array<{ timestamp: string; action: string; note: string }>;
    }>(`/resources/${resourceId}/history`);
  },

  resolveResource: (term: string) => {
    return request<{
      rawInput: string;
      canonicalConceptId: string;
      canonicalName: string;
      agrovocUri: string;
      confidence: number;
      evidenceCount: number;
      freshness: string;
      status: string;
    }>('/resources/resolve', {
      method: 'POST',
      body: JSON.stringify({ term })
    });
  },

  profileResource: (resourceId: string) => {
    return request<{
      resourceId: string;
      profileCompletedAt: string;
      primaryPathwayRecommendation: string;
      estimatedGrossMarginPercent: number;
      carbonOffsetPotentialKgPerT: number;
      confidence: number;
      status: string;
    }>('/resources/profile', {
      method: 'POST',
      body: JSON.stringify({ resourceId })
    });
  },

  importResources: (items: any[]) => {
    return request<{
      importedCount: number;
      status: string;
      timestamp: string;
      validationReport: any;
    }>('/resources/import', {
      method: 'POST',
      body: JSON.stringify({ items })
    });
  },

  analyzeResource: (resourceId: string) => {
    return request<{
      resourceId: string;
      summary: string;
      feasibilityScore: number;
      carbonCreditEligibility: string;
      suggestedAction: string;
      status: string;
    }>(`/resources/${resourceId}/analyze`, {
      method: 'POST'
    });
  }
};
