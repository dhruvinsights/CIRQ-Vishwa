import { request } from '../client.ts';

export interface MapQueryParams {
  bbox?: string;
  zoom?: number;
  resourceType?: string;
  country?: string;
  region?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  limit?: number;
}

export interface RegionLayerConfig {
  id: string;
  label: string;
  source: string;
  idField: string;
  nameField: string;
  hierarchy: string[];
  stateField?: string;
  districtField?: string;
  blockField?: string;
  villageField?: string;
  labelField?: string;
  defaultStyle: {
    fillColor: string;
    fillOpacity: number;
    strokeColor: string;
    strokeWidth: number;
  };
  visibleByDefault: boolean;
  featureCount: number;
  bounds: [number, number, number, number];
  crs: string;
  createdAt: string;
  metricsAvailable: string[];
}

export interface RegionMetricResponse {
  layerId: string;
  metric: string;
  unit: string;
  data: Record<string, {
    value: number;
    villageName: string;
    blockName: string;
    district: string;
    cropType: string;
    moisturePercent: number;
    confidence: number;
    updatedAt: string;
  }>;
  min: number;
  max: number;
  avg: number;
  totalTons: number;
}

export const mapClient = {
  getOverview: () => request<{ totalNodes: number; activeRoutes: number; clusterSummary: any; status: string }>('/map/overview'),

  getResources: (params: MapQueryParams = {}) => {
    const sp = new URLSearchParams();
    if (params.bbox) sp.set('bbox', params.bbox);
    if (params.zoom !== undefined) sp.set('zoom', String(params.zoom));
    if (params.resourceType) sp.set('resourceType', params.resourceType);
    if (params.country) sp.set('country', params.country);
    if (params.limit) sp.set('limit', String(params.limit));

    return request<{ type: 'FeatureCollection'; features: any[] }>(`/map/resources?${sp.toString()}`);
  },

  getProcessors: (params: MapQueryParams = {}) => {
    const sp = new URLSearchParams();
    if (params.bbox) sp.set('bbox', params.bbox);
    if (params.limit) sp.set('limit', String(params.limit));
    return request<{ type: 'FeatureCollection'; features: any[] }>(`/map/processors?${sp.toString()}`);
  },

  getDemand: (params: MapQueryParams = {}) => {
    const sp = new URLSearchParams();
    if (params.bbox) sp.set('bbox', params.bbox);
    return request<{ type: 'FeatureCollection'; features: any[] }>(`/map/demand?${sp.toString()}`);
  },

  getRoutes: () => request<{ routes: any[] }>('/map/routes'),
  getLoops: () => request<{ loops: any[] }>('/map/loops'),
  getClusters: () => request<{ clusters: any[] }>('/map/clusters'),
  getGeoJson: () => request<{ type: 'FeatureCollection'; metadata: any; features: any[] }>('/map/geojson'),

  // Config-driven Region Layers
  getLayers: () => request<{ layers: RegionLayerConfig[]; total: number }>('/map/layers'),

  createLayer: (data: Partial<RegionLayerConfig> & { geojson?: any }) =>
    request<{ layer: RegionLayerConfig }>('/map/layers', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getLayer: (layerId: string) =>
    request<{ layer: RegionLayerConfig }>(`/map/layers/${layerId}`),

  updateLayer: (layerId: string, patch: Partial<RegionLayerConfig>) =>
    request<{ layer: RegionLayerConfig }>(`/map/layers/${layerId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    }),

  deleteLayer: (layerId: string) =>
    request<void>(`/map/layers/${layerId}`, {
      method: 'DELETE'
    }),

  getLayerFeatures: async (layerId: string, bbox?: string) => {
    try {
      const url = bbox ? `/map/layers/${layerId}/features?bbox=${encodeURIComponent(bbox)}` : `/map/layers/${layerId}/features`;
      const res = await request<{ type: 'FeatureCollection'; features: any[] }>(url);
      if (res && res.features && res.features.length > 0) return res;
      throw new Error('Empty features');
    } catch {
      // Direct reliable fallback to public/data/524_Latur.geojson
      const staticRes = await fetch('/data/524_Latur.geojson');
      return await staticRes.json();
    }
  },

  getLayerMetrics: (layerId: string, metric: string = 'recoverableBiomassTons') =>
    request<RegionMetricResponse>(`/map/layers/${layerId}/metrics?metric=${encodeURIComponent(metric)}`),

  searchLayerRegions: (q: string, layerId: string = 'layer-524-latur') =>
    request<{ query: string; layerId: string; results: any[]; count: number }>(`/search/regions?layer=${encodeURIComponent(layerId)}&q=${encodeURIComponent(q)}`)
};
