import fs from 'fs/promises';
import path from 'path';

export interface LayerStyle {
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWidth: number;
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
  defaultStyle: LayerStyle;
  visibleByDefault: boolean;
  featureCount: number;
  bounds: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  crs: string;
  createdAt: string;
  metricsAvailable: string[];
}

export interface VillageMetricRecord {
  value: number;
  villageName: string;
  blockName: string;
  district: string;
  cropType: string;
  moisturePercent: number;
  confidence: number;
  updatedAt: string;
}

let regionLayers: RegionLayerConfig[] = [
  {
    id: 'layer-524-latur',
    label: 'Latur District Villages (1,009 Gram Panchayats)',
    source: '/data/524_Latur.geojson',
    idField: 'NEWCD2011',
    nameField: 'VILLNAME',
    hierarchy: ['STNAME', 'DTNAME', 'IPNAME', 'VILLNAME'],
    stateField: 'STNAME',
    districtField: 'DTNAME',
    blockField: 'IPNAME',
    villageField: 'VILLNAME',
    labelField: 'VILLNAME',
    defaultStyle: {
      fillColor: '#6B8547',
      fillOpacity: 0.18,
      strokeColor: '#E0FF20',
      strokeWidth: 0.8
    },
    visibleByDefault: true,
    featureCount: 1009,
    bounds: [76.20, 17.87, 77.34, 18.84],
    crs: 'CRS84',
    createdAt: '2026-10-06T00:00:00Z',
    metricsAvailable: [
      'recoverableBiomassTons',
      'soybeanStrawTons',
      'sugarcaneTrashTons',
      'biocharPotentialTons',
      'soilCarbonGainTons'
    ]
  }
];

// In-memory cache for parsed GeoJSON datasets
const geoJsonCache = new Map<string, any>();
const villageIndexCache = new Map<string, Array<{
  id: string;
  name: string;
  block: string;
  district: string;
  state: string;
  centroid: [number, number];
  bounds: [number, number, number, number];
  properties: Record<string, any>;
}>>();

async function loadGeoJsonFile(sourcePath: string): Promise<any> {
  if (geoJsonCache.has(sourcePath)) {
    return geoJsonCache.get(sourcePath);
  }
  const fullPath = path.resolve(process.cwd(), 'public', sourcePath.replace(/^\//, ''));
  const raw = await fs.readFile(fullPath, 'utf-8');
  const data = JSON.parse(raw);
  geoJsonCache.set(sourcePath, data);
  return data;
}

function computeCentroidAndBbox(coordinates: any): { centroid: [number, number]; bounds: [number, number, number, number] } {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let sumLng = 0;
  let sumLat = 0;
  let totalPts = 0;

  const traverse = (coords: any) => {
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const lng = coords[0];
      const lat = coords[1];
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      sumLng += lng;
      sumLat += lat;
      totalPts++;
    } else {
      for (const item of coords) {
        traverse(item);
      }
    }
  };

  traverse(coordinates);

  const centroid: [number, number] = totalPts > 0
    ? [sumLng / totalPts, sumLat / totalPts]
    : [76.77, 18.35];

  const bounds: [number, number, number, number] = [
    minLng === Infinity ? 76.2 : minLng,
    minLat === Infinity ? 17.87 : minLat,
    maxLng === -Infinity ? 77.34 : maxLng,
    maxLat === -Infinity ? 18.84 : maxLat
  ];

  return { centroid, bounds };
}

export async function getLayersRegistry(): Promise<RegionLayerConfig[]> {
  return regionLayers;
}

export async function getLayerById(layerId: string): Promise<RegionLayerConfig | null> {
  return regionLayers.find(l => l.id === layerId) || null;
}

export async function getLayerGeoJson(layerId: string, bboxStr?: string): Promise<any | null> {
  const layer = regionLayers.find(l => l.id === layerId);
  if (!layer) return null;

  const data = await loadGeoJsonFile(layer.source);
  if (!bboxStr) return data;

  const bbox = bboxStr.split(',').map(Number);
  if (bbox.length !== 4) return data;

  const [bMinLng, bMinLat, bMaxLng, bMaxLat] = bbox;
  const filteredFeatures = data.features.filter((f: any) => {
    const { bounds } = computeCentroidAndBbox(f.geometry.coordinates);
    return bounds[2] >= bMinLng && bounds[0] <= bMaxLng && bounds[3] >= bMinLat && bounds[1] <= bMaxLat;
  });

  return {
    ...data,
    features: filteredFeatures
  };
}

export async function getLayerMetrics(layerId: string, metric: string = 'recoverableBiomassTons'): Promise<{
  layerId: string;
  metric: string;
  unit: string;
  data: Record<string, VillageMetricRecord>;
  min: number;
  max: number;
  avg: number;
  totalTons: number;
} | null> {
  const layer = regionLayers.find(l => l.id === layerId);
  if (!layer) return null;

  const geojson = await loadGeoJsonFile(layer.source);
  const data: Record<string, VillageMetricRecord> = {};

  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let count = 0;

  for (const f of geojson.features) {
    const id = f.properties[layer.idField] || f.properties.NEWCD2011 || f.id;
    if (!id) continue;

    // Deterministic pseudo-random generation based on village code
    const seed = parseInt(String(id).replace(/\D/g, '') || '560000', 10);
    const pseudoRand = ((seed * 9301 + 49297) % 233280) / 233280;

    let value = 0;
    if (metric === 'recoverableBiomassTons') {
      value = Math.round(280 + pseudoRand * 1920); // 280 to 2,200 tons
    } else if (metric === 'soybeanStrawTons') {
      value = Math.round(180 + pseudoRand * 1250);
    } else if (metric === 'sugarcaneTrashTons') {
      value = Math.round(90 + pseudoRand * 980);
    } else if (metric === 'biocharPotentialTons') {
      value = Math.round((280 + pseudoRand * 1920) * 0.35); // 35% biochar yield
    } else if (metric === 'soilCarbonGainTons') {
      value = Math.round((280 + pseudoRand * 1920) * 0.35 * 2.85); // tCO2e offset
    } else {
      value = Math.round(200 + pseudoRand * 1500);
    }

    min = Math.min(min, value);
    max = Math.max(max, value);
    sum += value;
    count++;

    data[id] = {
      value,
      villageName: f.properties[layer.nameField] || f.properties.VILLNAME || 'Village',
      blockName: f.properties[layer.blockField || 'IPNAME'] || f.properties.IPNAME || 'Block',
      district: f.properties[layer.districtField || 'DTNAME'] || f.properties.DTNAME || 'Latur',
      cropType: pseudoRand > 0.4 ? 'Soybean Crop Residue' : 'Sugarcane Bagasse & Trash',
      moisturePercent: Math.round(11 + pseudoRand * 8),
      confidence: Math.round(88 + pseudoRand * 10),
      updatedAt: '2026-10-06T12:00:00Z'
    };
  }

  return {
    layerId,
    metric,
    unit: metric.includes('Carbon') ? 'tCO₂e' : 'tonnes',
    data,
    min: min === Infinity ? 0 : min,
    max: max === -Infinity ? 0 : max,
    avg: count > 0 ? Math.round(sum / count) : 0,
    totalTons: sum
  };
}

export async function searchRegionsInLayer(layerId: string, query: string): Promise<any[]> {
  const layer = regionLayers.find(l => l.id === layerId) || regionLayers[0];
  if (!layer) return [];

  const geojson = await loadGeoJsonFile(layer.source);
  const q = (query || '').toLowerCase().trim();

  const results: any[] = [];
  for (const f of geojson.features) {
    const name = String(f.properties[layer.nameField] || f.properties.VILLNAME || '').toLowerCase();
    const id = String(f.properties[layer.idField] || f.properties.NEWCD2011 || '').toLowerCase();
    const block = String(f.properties[layer.blockField || 'IPNAME'] || f.properties.IPNAME || '').toLowerCase();
    const gp = String(f.properties.GPNAME || '').toLowerCase();

    if (name.includes(q) || id.includes(q) || block.includes(q) || gp.includes(q)) {
      const { centroid, bounds } = computeCentroidAndBbox(f.geometry.coordinates);
      results.push({
        id: f.properties[layer.idField] || f.properties.NEWCD2011,
        name: f.properties[layer.nameField] || f.properties.VILLNAME,
        block: f.properties[layer.blockField || 'IPNAME'] || f.properties.IPNAME,
        district: f.properties[layer.districtField || 'DTNAME'] || f.properties.DTNAME,
        state: f.properties[layer.stateField || 'STNAME'] || f.properties.STNAME,
        gpName: f.properties.GPNAME,
        centroid,
        bounds,
        properties: f.properties
      });

      if (results.length >= 25) break;
    }
  }

  return results;
}

export async function registerNewLayer(payload: {
  label: string;
  geojson?: any;
  sourceUrl?: string;
  idField: string;
  nameField: string;
  hierarchy?: string[];
  blockField?: string;
  districtField?: string;
  stateField?: string;
  defaultStyle?: LayerStyle;
}): Promise<RegionLayerConfig> {
  const layerId = `layer-${Date.now().toString(36)}`;
  let geojson = payload.geojson;
  let sourcePath = payload.sourceUrl || '';

  if (geojson) {
    // Validate CRS
    if (geojson.crs && geojson.crs.properties && geojson.crs.properties.name) {
      const crsName = geojson.crs.properties.name.toLowerCase();
      if (!crsName.includes('crs84') && !crsName.includes('4326')) {
        throw new Error('CRS_NOT_SUPPORTED: Only WGS84 (CRS84 or EPSG:4326) coordinate reference systems are supported.');
      }
    }

    if (!Array.isArray(geojson.features) || geojson.features.length === 0) {
      throw new Error('INVALID_GEOJSON: GeoJSON must contain a non-empty features array.');
    }

    const fileName = `custom_layer_${layerId}.geojson`;
    const targetDir = path.resolve(process.cwd(), 'public', 'data');
    await fs.mkdir(targetDir, { recursive: true });
    const fullPath = path.join(targetDir, fileName);
    await fs.writeFile(fullPath, JSON.stringify(geojson, null, 2), 'utf-8');
    sourcePath = `/data/${fileName}`;
    geoJsonCache.set(sourcePath, geojson);
  } else if (sourcePath) {
    geojson = await loadGeoJsonFile(sourcePath);
  }

  // Compute overall bounds
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const f of geojson.features) {
    const { bounds } = computeCentroidAndBbox(f.geometry.coordinates);
    minLng = Math.min(minLng, bounds[0]);
    minLat = Math.min(minLat, bounds[1]);
    maxLng = Math.max(maxLng, bounds[2]);
    maxLat = Math.max(maxLat, bounds[3]);
  }

  const newConfig: RegionLayerConfig = {
    id: layerId,
    label: payload.label || 'Custom Region Layer',
    source: sourcePath,
    idField: payload.idField,
    nameField: payload.nameField,
    hierarchy: payload.hierarchy || [payload.nameField],
    blockField: payload.blockField,
    districtField: payload.districtField,
    stateField: payload.stateField,
    labelField: payload.nameField,
    defaultStyle: payload.defaultStyle || {
      fillColor: '#6B8547',
      fillOpacity: 0.2,
      strokeColor: '#E0FF20',
      strokeWidth: 1.0
    },
    visibleByDefault: true,
    featureCount: geojson.features.length,
    bounds: [
      minLng === Infinity ? 0 : minLng,
      minLat === Infinity ? 0 : minLat,
      maxLng === -Infinity ? 0 : maxLng,
      maxLat === -Infinity ? 0 : maxLat
    ],
    crs: 'CRS84',
    createdAt: new Date().toISOString(),
    metricsAvailable: ['recoverableBiomassTons', 'biocharPotentialTons']
  };

  regionLayers.push(newConfig);
  return newConfig;
}

export async function updateLayerConfig(layerId: string, patch: Partial<RegionLayerConfig>): Promise<RegionLayerConfig | null> {
  const idx = regionLayers.findIndex(l => l.id === layerId);
  if (idx === -1) return null;

  regionLayers[idx] = {
    ...regionLayers[idx],
    ...patch,
    id: layerId // immutable
  };

  return regionLayers[idx];
}

export async function deleteLayerConfig(layerId: string): Promise<boolean> {
  const initLen = regionLayers.length;
  regionLayers = regionLayers.filter(l => l.id !== layerId);
  return regionLayers.length < initLen;
}
