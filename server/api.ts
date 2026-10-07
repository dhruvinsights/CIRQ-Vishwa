import { Router, Request, Response, NextFunction } from 'express';
import {
  initialResources,
  initialProcessors,
  initialPathways,
  initialCircularLoops,
  initialDataSources,
  initialIntegrations,
  initialAIServices,
  initialAIExecutions,
  initialScenarios,
  initialKnowledgeArticles,
  ResourceRecord,
  ProcessorRecord,
  PathwayRecord,
  CircularLoopRecord
} from './db.js';
import {
  getLayersRegistry,
  getLayerById,
  getLayerGeoJson,
  getLayerMetrics,
  searchRegionsInLayer,
  registerNewLayer,
  updateLayerConfig,
  deleteLayerConfig
} from './layers.js';

export const apiRouter = Router();

// In-memory state with persistence during session
let resources: ResourceRecord[] = [...initialResources];
let processors: ProcessorRecord[] = [...initialProcessors];
let pathways: PathwayRecord[] = [...initialPathways];
let loops = [...initialCircularLoops];
let dataSources = [...initialDataSources];
let integrations = [...initialIntegrations];
let aiServices = [...initialAIServices];
let aiExecutions = [...initialAIExecutions];
let scenarios = [...initialScenarios];
let knowledgeArticles = [...initialKnowledgeArticles];

// Active simulations
interface SimulationRecord {
  id: string;
  resourceId: string;
  quantity: number;
  location: string;
  technology: string;
  transportKm: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  result?: any;
}
let simulations: SimulationRecord[] = [
  {
    id: 'sim-91024',
    resourceId: 'res-rice-straw-up',
    quantity: 480,
    location: 'Barabanki, UP',
    technology: 'Slow Pyrolysis',
    transportKm: 28,
    status: 'COMPLETED',
    createdAt: '2026-10-06T12:00:00Z',
    result: {
      biocharYieldTons: 168.0,
      pyroligneousAcidTons: 96.0,
      syngasHeatMwh: 163.2,
      grossRevenue: 47040.0,
      processingCost: 13680.0,
      transportCost: 3420.0,
      netValue: 29940.0,
      co2eAvoidedTons: 710.4,
      confidence: 94,
      currency: 'USD',
      sankey: {
        nodes: [
          { name: 'Raw Rice Straw Feedstock (480 t)' },
          { name: 'Pyrolysis Processing (550°C)' },
          { name: 'Solid Biochar (168 t)' },
          { name: 'Bio-oil / Pyroligneous Acid (96 t)' },
          { name: 'Recycled Syngas Energy (163 MWh)' },
          { name: 'Soil Application & Carbon Sink' },
          { name: 'Organic Plant Nutrition' }
        ],
        links: [
          { source: 'Raw Rice Straw Feedstock (480 t)', target: 'Pyrolysis Processing (550°C)', value: 480 },
          { source: 'Pyrolysis Processing (550°C)', target: 'Solid Biochar (168 t)', value: 168 },
          { source: 'Pyrolysis Processing (550°C)', target: 'Bio-oil / Pyroligneous Acid (96 t)', value: 96 },
          { source: 'Pyrolysis Processing (550°C)', target: 'Recycled Syngas Energy (163 MWh)', value: 216 },
          { source: 'Solid Biochar (168 t)', target: 'Soil Application & Carbon Sink', value: 168 },
          { source: 'Bio-oil / Pyroligneous Acid (96 t)', target: 'Organic Plant Nutrition', value: 96 }
        ]
      }
    }
  }
];

// Helper to set standard headers & generate X-Request-Id
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
  const reqId = (req.headers['x-request-id'] as string) || `req-${Math.random().toString(36).substring(2, 10)}`;
  res.setHeader('X-Request-Id', reqId);
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Generic 404 handler helper
function notFound(res: Response, entityName: string, id: string) {
  const reqId = res.getHeader('X-Request-Id');
  return res.status(404).json({
    error: {
      code: `${entityName.toUpperCase()}_NOT_FOUND`,
      message: `${entityName} with identifier '${id}' was not found.`,
      requestId: reqId
    }
  });
}

// -------------------------------------------------------------
// 1. SYSTEM ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'cirq-api', timestamp: new Date().toISOString() });
});

apiRouter.get('/health/live', (req, res) => {
  res.json({ status: 'ALIVE', uptimeSeconds: process.uptime() });
});

apiRouter.get('/health/ready', (req, res) => {
  res.json({ status: 'READY', checks: { database: 'UP', postgis: 'UP', queue: 'UP' } });
});

apiRouter.get('/system/status', (req, res) => {
  res.json({
    status: 'LIVE',
    environment: 'production-preview',
    version: '1.4.0',
    services: {
      ontologyResolver: 'ONLINE',
      spatialRouting: 'ONLINE',
      faoImpactEngine: 'ONLINE',
      agrifoodConnector: 'ONLINE'
    },
    activeWorkers: 8,
    queueLatencyMs: 14,
    timestamp: new Date().toISOString()
  });
});

apiRouter.get('/system/metrics', (req, res) => {
  res.json({
    totalResourcesAvailableTons: resources.reduce((acc, r) => acc + r.quantity, 0),
    activeProcessorsCount: processors.filter(p => p.status === 'OPERATIONAL').length,
    activeLoopsCount: loops.length,
    co2eAvoidedTotalTons: 74684,
    economicValueGeneratedTotalUsd: 2450800,
    provenanceConfidenceAverage: 92.4,
    connectedDataSourcesCount: dataSources.length,
    timestamp: new Date().toISOString()
  });
});

apiRouter.get('/system/events', (req, res) => {
  res.json({
    events: [
      { id: 'ev-1', type: 'RESOURCE_STREAM_RESOLVED', message: 'Rice straw stream registered in Uttar Pradesh', timestamp: '2026-10-06T14:32:00Z', status: 'LIVE' },
      { id: 'ev-2', type: 'OPTIMIZATION_PARETO_CONVERGED', message: 'Pareto frontier discovered for 480t biomass stream', timestamp: '2026-10-06T14:30:15Z', status: 'LIVE' },
      { id: 'ev-3', type: 'LOGISTICS_ROUTE_COMPUTED', message: 'Route optimized: Barabanki -> Ganga Pyrolysis (28 km)', timestamp: '2026-10-06T14:28:00Z', status: 'LIVE' },
      { id: 'ev-4', type: 'CIRCULAR_LOOP_COMMISSIONED', message: 'Active loop closed with local fertilizer co-op', timestamp: '2026-10-06T14:15:00Z', status: 'LIVE' }
    ]
  });
});

apiRouter.get('/system/events/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = () => {
    const data = JSON.stringify({
      id: `ev-${Date.now()}`,
      type: 'TELEMETRY_HEARTBEAT',
      timestamp: new Date().toISOString(),
      queueDepth: Math.floor(Math.random() * 3),
      throughput: (24.5 + Math.random() * 3).toFixed(1)
    });
    res.write(`data: ${data}\n\n`);
  };

  sendEvent();
  const interval = setInterval(sendEvent, 8000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// -------------------------------------------------------------
// 2. RESOURCE ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/resources', (req, res) => {
  const { query, category, countryCode, limit = 50, page = 1 } = req.query;
  let filtered = [...resources];

  if (category && typeof category === 'string' && category !== 'ALL') {
    filtered = filtered.filter(r => r.category.toLowerCase().includes(category.toLowerCase()));
  }
  if (countryCode && typeof countryCode === 'string') {
    filtered = filtered.filter(r => r.location.countryCode.toLowerCase() === countryCode.toLowerCase());
  }
  if (query && typeof query === 'string') {
    const q = query.toLowerCase();
    filtered = filtered.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.aliases.some(a => a.toLowerCase().includes(q)) ||
      r.location.region.toLowerCase().includes(q)
    );
  }

  const p = Number(page);
  const l = Number(limit);
  const start = (p - 1) * l;
  const paginated = filtered.slice(start, start + l);

  res.json({
    data: paginated,
    pagination: { total: filtered.length, page: p, limit: l, totalPages: Math.ceil(filtered.length / l) },
    provenanceState: 'LIVE',
    freshness: 'Sub-minute synchronization'
  });
});

apiRouter.post('/resources', (req, res) => {
  const newRes: ResourceRecord = {
    id: `res-${Date.now().toString(36)}`,
    canonicalConceptId: req.body.canonicalConceptId || 'c-unclassified-biomass',
    name: req.body.name || 'Unidentified Biomass Stream',
    aliases: req.body.aliases || [],
    category: req.body.category || 'Crop Residue',
    sourceType: req.body.sourceType || 'Farm Direct',
    quantity: Number(req.body.quantity) || 100,
    unit: req.body.unit || 'tonne',
    currency: req.body.currency || 'USD',
    location: req.body.location || {
      type: 'Point',
      coordinates: [80.94, 26.84],
      address: 'Field Site',
      countryCode: 'IND',
      region: 'Uttar Pradesh'
    },
    availabilityStart: req.body.availabilityStart || new Date().toISOString().split('T')[0],
    availabilityEnd: req.body.availabilityEnd || new Date(Date.now() + 60*86400000).toISOString().split('T')[0],
    seasonality: ['Current Season'],
    qualityScore: 80,
    confidence: 85,
    freshness: 'Just registered',
    composition: req.body.composition || {
      moisture: { value: 15.0, unit: '%', type: 'estimated' },
      ash: { value: 12.0, unit: '%', type: 'estimated' },
      cellulose: { value: 35.0, unit: '%', type: 'estimated' },
      hemicellulose: { value: 20.0, unit: '%', type: 'estimated' },
      lignin: { value: 15.0, unit: '%', type: 'estimated' },
      carbon: { value: 40.0, unit: '%', type: 'estimated' },
      nitrogen: { value: 0.8, unit: '%', type: 'estimated' },
      cnRatio: { value: 50.0, unit: 'ratio', type: 'estimated' },
      energyContent: { value: 13.5, unit: 'GJ/t', type: 'estimated' },
      fixedCarbon: { value: 15.0, unit: '%', type: 'estimated' }
    },
    provenance: [
      {
        source: 'User Registration Entry',
        sourceType: 'API',
        retrievedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        geographicCoverage: 'Local Node',
        license: 'Standard CIRQ Ingestion',
        qualityScore: 85,
        status: 'LIVE'
      }
    ]
  };

  resources.unshift(newRes);
  res.status(201).json(newRes);
});

apiRouter.get('/resources/:resourceId', (req, res) => {
  const r = resources.find(item => item.id === req.params.resourceId);
  if (!r) return notFound(res, 'Resource', req.params.resourceId);
  res.json(r);
});

apiRouter.patch('/resources/:resourceId', (req, res) => {
  const idx = resources.findIndex(item => item.id === req.params.resourceId);
  if (idx === -1) return notFound(res, 'Resource', req.params.resourceId);
  resources[idx] = { ...resources[idx], ...req.body, freshness: 'Updated just now' };
  res.json(resources[idx]);
});

apiRouter.delete('/resources/:resourceId', (req, res) => {
  const idx = resources.findIndex(item => item.id === req.params.resourceId);
  if (idx === -1) return notFound(res, 'Resource', req.params.resourceId);
  const deleted = resources.splice(idx, 1)[0];
  res.json({ success: true, deletedId: deleted.id });
});

apiRouter.get('/resources/:resourceId/availability', (req, res) => {
  const r = resources.find(item => item.id === req.params.resourceId);
  if (!r) return notFound(res, 'Resource', req.params.resourceId);
  res.json({
    resourceId: r.id,
    currentAvailableQuantity: r.quantity,
    unit: r.unit,
    seasonality: r.seasonality,
    availabilityWindow: { start: r.availabilityStart, end: r.availabilityEnd },
    harvestPeakDaysRemaining: 42,
    regionalSupplyForecastTons: r.quantity * 4.5,
    freshness: r.freshness,
    status: 'LIVE'
  });
});

apiRouter.get('/resources/:resourceId/composition', (req, res) => {
  const r = resources.find(item => item.id === req.params.resourceId);
  if (!r) return notFound(res, 'Resource', req.params.resourceId);
  res.json({
    resourceId: r.id,
    composition: r.composition,
    uncertaintyBandPercent: 4.2,
    methodology: 'Near-Infrared Spectroscopy & ASTM Proximate Analysis',
    status: 'LIVE'
  });
});

apiRouter.get('/resources/:resourceId/quality', (req, res) => {
  const r = resources.find(item => item.id === req.params.resourceId);
  if (!r) return notFound(res, 'Resource', req.params.resourceId);
  res.json({
    resourceId: r.id,
    overallQualityScore: r.qualityScore,
    moisturePenaltyDeduction: r.composition.moisture.value > 20 ? 8 : 0,
    contaminationScore: 92,
    particleUniformity: 84,
    gradeClassification: 'Grade A Feedstock (Low Soil Contamination)',
    provenance: r.provenance
  });
});

apiRouter.get('/resources/:resourceId/pathways', (req, res) => {
  const r = resources.find(item => item.id === req.params.resourceId);
  if (!r) return notFound(res, 'Resource', req.params.resourceId);
  const candidatePathways = pathways.map(p => {
    const isSupported = p.supportedResourceCategories.includes(r.category);
    const score = isSupported ? p.overallScore : Math.max(30, p.overallScore - 30);
    return {
      ...p,
      evaluatedScore: score,
      projectedNetRevenue: Math.round(r.quantity * (p.economicScore * 0.95)),
      currency: r.currency
    };
  }).sort((a, b) => b.evaluatedScore - a.evaluatedScore);

  res.json({
    resourceId: r.id,
    pathways: candidatePathways,
    scoringWeights: { technical: 0.3, economic: 0.35, environmental: 0.35 },
    freshness: 'Computed in 18ms',
    status: 'LIVE'
  });
});

apiRouter.get('/resources/:resourceId/processors', (req, res) => {
  const r = resources.find(item => item.id === req.params.resourceId);
  if (!r) return notFound(res, 'Resource', req.params.resourceId);
  // Match processors in same country or close
  const matched = processors.filter(p => p.location.countryCode === r.location.countryCode);
  res.json({
    resourceId: r.id,
    processors: matched.length > 0 ? matched : processors.slice(0, 2),
    status: 'LIVE'
  });
});

apiRouter.get('/resources/:resourceId/demand', (req, res) => {
  const r = resources.find(item => item.id === req.params.resourceId);
  if (!r) return notFound(res, 'Resource', req.params.resourceId);
  res.json({
    resourceId: r.id,
    spotPriceEstimate: 42.5,
    currency: r.currency,
    unit: `per ${r.unit}`,
    demandIntensity: 'HIGH',
    activePurchaseOrdersTons: 1250,
    primaryBuyerSectors: ['Pyrolysis & Carbon Credit Generators', 'Biogas Plants', 'Industrial Heat Boilers'],
    status: 'LIVE'
  });
});

apiRouter.get('/resources/:resourceId/logistics', (req, res) => {
  const r = resources.find(item => item.id === req.params.resourceId);
  if (!r) return notFound(res, 'Resource', req.params.resourceId);
  res.json({
    resourceId: r.id,
    origin: r.location,
    averageConsolidationRadiusKm: 35,
    estimatedFreightCostPerTonKm: 0.18,
    currency: r.currency,
    recommendedFleet: '10-Tonne Covered Ag-Trucks',
    estimatedCo2ePerTonKm: 0.082, // kgCO2e
    status: 'LIVE'
  });
});

apiRouter.get('/resources/:resourceId/impact', (req, res) => {
  const r = resources.find(item => item.id === req.params.resourceId);
  if (!r) return notFound(res, 'Resource', req.params.resourceId);
  res.json({
    resourceId: r.id,
    co2eAvoidedTotal: Math.round(r.quantity * 1.48), // tCO2e
    particulatePm25AvoidedKg: Math.round(r.quantity * 8.4),
    soilCarbonAccretionTons: Math.round(r.quantity * 0.35),
    energyRecoverableMwh: Math.round(r.quantity * 0.34),
    methodology: 'FAO EX-ACT VC Tier 2 Field Avoided Burning & Biochar Sequestration',
    status: 'LIVE'
  });
});

apiRouter.get('/resources/:resourceId/provenance', (req, res) => {
  const r = resources.find(item => item.id === req.params.resourceId);
  if (!r) return notFound(res, 'Resource', req.params.resourceId);
  res.json({
    resourceId: r.id,
    provenanceTree: r.provenance,
    verificationTier: 'LEVEL_3_AUDITED_SENSOR_AND_SATELLITE',
    status: 'LIVE'
  });
});

apiRouter.get('/resources/:resourceId/history', (req, res) => {
  const r = resources.find(item => item.id === req.params.resourceId);
  if (!r) return notFound(res, 'Resource', req.params.resourceId);
  res.json({
    resourceId: r.id,
    events: [
      { timestamp: '2026-10-06T14:32:00Z', action: 'LAB_SAMPLE_ANALYSED', note: 'Moisture 12.4%, Ash 17.6% verified' },
      { timestamp: '2026-10-06T12:00:00Z', action: 'BATCH_AGGREGATED', note: 'Barabanki FPO harvest batch weighed' },
      { timestamp: '2026-10-01T08:00:00Z', action: 'HARVEST_INITIATED', note: 'Combine harvester with straw baler' }
    ]
  });
});

apiRouter.post('/resources/resolve', (req, res) => {
  const { term = '' } = req.body;
  const lower = term.toLowerCase();
  let matchedConcept = 'c-rice-straw-cereal';
  let canonicalName = 'Rice Straw (Paddy Crop Residue)';
  let confidence = 96;

  if (lower.includes('bagasse') || lower.includes('bagaço') || lower.includes('sugar')) {
    matchedConcept = 'c-sugarcane-bagasse';
    canonicalName = 'Sugarcane Bagasse Mill Byproduct';
    confidence = 98;
  } else if (lower.includes('coffee') || lower.includes('cascara') || lower.includes('pulp')) {
    matchedConcept = 'c-coffee-cherry-pulp';
    canonicalName = 'Coffee Wet-Mill Pulp Residue';
    confidence = 94;
  } else if (lower.includes('grain') || lower.includes('spent') || lower.includes('treber')) {
    matchedConcept = 'c-brewers-spent-grain';
    canonicalName = 'Brewers Spent Grain (BSG)';
    confidence = 97;
  } else if (lower.includes('husk') || lower.includes('chaff')) {
    matchedConcept = 'c-rice-husk-hull';
    canonicalName = 'Rice Husk Mill Byproduct';
    confidence = 95;
  }

  res.json({
    rawInput: term,
    canonicalConceptId: matchedConcept,
    canonicalName,
    agrovocUri: `http://aims.fao.org/aos/agrovoc/${matchedConcept}`,
    confidence,
    evidenceCount: 8,
    freshness: 'Resolved in 24ms',
    status: 'LIVE'
  });
});

apiRouter.post('/resources/profile', (req, res) => {
  const { resourceId } = req.body;
  const r = resources.find(item => item.id === resourceId) || resources[0];
  res.json({
    resourceId: r.id,
    profileCompletedAt: new Date().toISOString(),
    primaryPathwayRecommendation: 'Slow Pyrolysis to Carbon-Negative Biochar',
    estimatedGrossMarginPercent: 38.5,
    carbonOffsetPotentialKgPerT: 1480,
    confidence: 94,
    status: 'LIVE'
  });
});

apiRouter.post('/resources/import', (req, res) => {
  const { items = [] } = req.body;
  res.json({
    importedCount: items.length || 1,
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
    validationReport: { valid: items.length || 1, rejected: 0 }
  });
});

apiRouter.post('/resources/:resourceId/analyze', (req, res) => {
  const r = resources.find(item => item.id === req.params.resourceId);
  if (!r) return notFound(res, 'Resource', req.params.resourceId);
  res.json({
    resourceId: r.id,
    summary: `Analysis of ${r.name}: Biomass composition exhibits high fixed carbon and moderate moisture (${r.composition.moisture.value}%), making it an optimal candidate for thermochemical conversion (Biochar/CBG).`,
    feasibilityScore: 92,
    carbonCreditEligibility: 'VM0044 Verified',
    suggestedAction: 'Match with Ganga Valley Pyrolysis Facility (12 km away)',
    status: 'LIVE'
  });
});

// -------------------------------------------------------------
// 3. SEARCH ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/search/resources', (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  const results = resources.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.aliases.some(a => a.toLowerCase().includes(q)) ||
    r.category.toLowerCase().includes(q)
  );
  res.json({ results, count: results.length, status: 'LIVE' });
});

apiRouter.get('/search/processors', (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  const results = processors.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.capabilities.some(c => c.toLowerCase().includes(q)) ||
    p.category.toLowerCase().includes(q)
  );
  res.json({ results, count: results.length, status: 'LIVE' });
});

apiRouter.get('/search/demand', (req, res) => {
  res.json({
    demands: [
      { id: 'dem-1', commodity: 'Refined Soil Biochar', buyer: 'Indo-Gangetic Soil Regeneration Program', quantityTons: 500, pricePerTon: 280, currency: 'USD' },
      { id: 'dem-2', commodity: 'Compressed Bio-Gas (CBG)', buyer: 'City Gas Distribution Grid (CGD)', quantityTons: 1200, pricePerTon: 850, currency: 'USD' },
      { id: 'dem-3', commodity: 'High-Protein Insect Meal', buyer: 'Aquaculture Feed Compounder', quantityTons: 200, pricePerTon: 1400, currency: 'USD' }
    ],
    status: 'LIVE'
  });
});

apiRouter.get('/search/regions', async (req, res) => {
  const layerId = req.query.layer as string | undefined;
  const q = req.query.q as string | undefined;

  if (q || layerId) {
    const results = await searchRegionsInLayer(layerId || 'layer-524-latur', q || '');
    return res.json({
      query: q || '',
      layerId: layerId || 'layer-524-latur',
      results,
      count: results.length,
      status: 'LIVE'
    });
  }

  res.json({
    regions: [
      { code: 'IND-MH-LATUR', name: 'Latur District, Maharashtra', country: 'India', activeBiomassTons: 1840, processorsCount: 3, layerId: 'layer-524-latur' },
      { code: 'IND-UP', name: 'Uttar Pradesh, India', country: 'India', activeBiomassTons: 480, processorsCount: 2 },
      { code: 'BRA-SP', name: 'São Paulo, Brazil', country: 'Brazil', activeBiomassTons: 1250, processorsCount: 1 },
      { code: 'KEN-NY', name: 'Nyeri County, Kenya', country: 'Kenya', activeBiomassTons: 320, processorsCount: 1 },
      { code: 'DEU-BY', name: 'Bavaria, Germany', country: 'Germany', activeBiomassTons: 180, processorsCount: 1 },
      { code: 'THA-CP', name: 'Central Plains, Thailand', country: 'Thailand', activeBiomassTons: 640, processorsCount: 1 }
    ],
    status: 'LIVE'
  });
});

apiRouter.get('/search/pathways', (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  const results = pathways.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  res.json({ results, count: results.length, status: 'LIVE' });
});

apiRouter.post('/search/natural-language', (req, res) => {
  const { query = '' } = req.body;
  const q = query.toLowerCase();

  let targetResource = 'res-rice-straw-up';
  let targetCategory = 'Crop Residue';
  let intent = 'DISCOVER_PATHWAYS';

  if (q.includes('bagasse') || q.includes('brazil') || q.includes('sugar')) {
    targetResource = 'res-sugar-bagasse-br';
    targetCategory = 'Agro-Industrial Byproduct';
  } else if (q.includes('coffee') || q.includes('kenya') || q.includes('pulp')) {
    targetResource = 'res-coffee-pulp-ke';
    targetCategory = 'Fruit & Beverage Residue';
  } else if (q.includes('protein') || q.includes('grain') || q.includes('brew')) {
    targetResource = 'res-spent-grain-eu';
    targetCategory = 'Fermentation Byproduct';
  }

  res.json({
    query,
    structuredIntent: {
      action: intent,
      resourceId: targetResource,
      category: targetCategory,
      recommendedPathway: 'pw-biochar-pyrolysis',
      filters: { category: targetCategory }
    },
    confidence: 93,
    status: 'LIVE'
  });
});

// -------------------------------------------------------------
// 4. MAP & REGION LAYERS ENDPOINTS
// -------------------------------------------------------------

apiRouter.get('/map/layers', async (req, res) => {
  const layers = await getLayersRegistry();
  res.json({ layers, total: layers.length, status: 'LIVE' });
});

apiRouter.post('/map/layers', async (req, res) => {
  try {
    const layer = await registerNewLayer(req.body);
    res.status(201).json({ layer, status: 'REGISTERED' });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'LAYER_REGISTRATION_FAILED', message: err.message || 'Failed to register GeoJSON layer' } });
  }
});

apiRouter.get('/map/layers/:layerId', async (req, res) => {
  const layer = await getLayerById(req.params.layerId);
  if (!layer) return notFound(res, 'RegionLayer', req.params.layerId);
  res.json({ layer, status: 'LIVE' });
});

apiRouter.patch('/map/layers/:layerId', async (req, res) => {
  const updated = await updateLayerConfig(req.params.layerId, req.body);
  if (!updated) return notFound(res, 'RegionLayer', req.params.layerId);
  res.json({ layer: updated, status: 'UPDATED' });
});

apiRouter.delete('/map/layers/:layerId', async (req, res) => {
  const success = await deleteLayerConfig(req.params.layerId);
  if (!success) return notFound(res, 'RegionLayer', req.params.layerId);
  res.status(204).send();
});

apiRouter.get('/map/layers/:layerId/features', async (req, res) => {
  const bbox = req.query.bbox as string | undefined;
  const data = await getLayerGeoJson(req.params.layerId, bbox);
  if (!data) return notFound(res, 'RegionLayerFeatures', req.params.layerId);
  res.setHeader('Content-Type', 'application/geo+json');
  res.json(data);
});

apiRouter.get('/map/layers/:layerId/metrics', async (req, res) => {
  const metric = (req.query.metric as string) || 'recoverableBiomassTons';
  const metricsData = await getLayerMetrics(req.params.layerId, metric);
  if (!metricsData) return notFound(res, 'RegionLayerMetrics', req.params.layerId);
  res.json({ ...metricsData, status: 'LIVE' });
});

apiRouter.get('/map/overview', (req, res) => {
  res.json({
    totalNodes: resources.length + processors.length,
    activeRoutes: 4,
    clusterSummary: {
      southAsia: { resourceTons: 1120, processors: 2 },
      latinAmerica: { resourceTons: 1250, processors: 1 },
      eastAfrica: { resourceTons: 320, processors: 1 },
      westernEurope: { resourceTons: 180, processors: 1 }
    },
    status: 'LIVE'
  });
});

apiRouter.get('/map/geojson', async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.resolve(process.cwd(), 'public', 'data', 'agricultural_network.geojson');
    const data = await fs.readFile(filePath, 'utf-8');
    res.setHeader('Content-Type', 'application/geo+json');
    res.send(data);
  } catch (err) {
    res.status(500).json({ error: { code: 'GEOJSON_LOAD_ERROR', message: 'Failed to read GeoJSON layer.' } });
  }
});

apiRouter.get('/map/resources', (req, res) => {
  res.json({
    type: 'FeatureCollection',
    features: resources.map(r => ({
      type: 'Feature',
      geometry: r.location,
      properties: {
        id: r.id,
        name: r.name,
        category: r.category,
        quantity: r.quantity,
        unit: r.unit,
        qualityScore: r.qualityScore,
        confidence: r.confidence,
        freshness: r.freshness,
        provenanceState: 'LIVE'
      }
    }))
  });
});

apiRouter.get('/map/processors', (req, res) => {
  res.json({
    type: 'FeatureCollection',
    features: processors.map(p => ({
      type: 'Feature',
      geometry: p.location,
      properties: {
        id: p.id,
        name: p.name,
        category: p.category,
        availableCapacity: p.availableCapacity,
        unit: p.unit,
        status: p.status,
        provenanceState: 'LIVE'
      }
    }))
  });
});

apiRouter.get('/map/demand', (req, res) => {
  res.json({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [81.0, 26.88] },
        properties: { id: 'dem-pt-1', label: 'Barabanki Carbon Sink Basin', requiredTons: 600, commodity: 'Biochar' }
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-47.85, -21.15] },
        properties: { id: 'dem-pt-2', label: 'Ribeirão Biofuel Distribution Terminal', requiredTons: 1500, commodity: '2G Ethanol' }
      }
    ]
  });
});

apiRouter.get('/map/routes', (req, res) => {
  res.json({
    routes: [
      {
        id: 'rte-up-straw-biochar',
        name: 'Barabanki Farm Collective -> Ganga Valley Pyrolysis',
        origin: [80.9462, 26.8467],
        destination: [81.1215, 26.912],
        distanceKm: 28.4,
        estimatedTimeMinutes: 42,
        co2eTransportKg: 232.0,
        costEstimate: 160.0,
        currency: 'USD',
        status: 'OPTIMAL'
      },
      {
        id: 'rte-br-bagasse-mill',
        name: 'Ribeirão Preto Farm -> Bio-hub 2G Plant',
        origin: [-47.8825, -21.1767],
        destination: [-47.92, -21.21],
        distanceKm: 14.8,
        estimatedTimeMinutes: 24,
        co2eTransportKg: 110.0,
        costEstimate: 85.0,
        currency: 'USD',
        status: 'OPTIMAL'
      }
    ]
  });
});

apiRouter.get('/map/loops', (req, res) => {
  res.json({
    loops: loops.map(l => ({
      ...l,
      geometry: {
        type: 'LineString',
        coordinates: [
          [80.9462, 26.8467],
          [81.1215, 26.912],
          [81.0, 26.88],
          [80.9462, 26.8467]
        ]
      }
    }))
  });
});

apiRouter.get('/map/clusters', (req, res) => {
  res.json({
    clusters: [
      { id: 'cl-ind', name: 'Indo-Gangetic Basin', center: [80.94, 26.84], radiusKm: 120, totalResouresTons: 1120, nodeCount: 4 },
      { id: 'cl-bra', name: 'São Paulo Sugar-Agro Belt', center: [-47.88, -21.17], radiusKm: 150, totalResouresTons: 1250, nodeCount: 3 },
      { id: 'cl-ken', name: 'Mount Kenya Agro-Park', center: [37.07, -0.42], radiusKm: 80, totalResouresTons: 320, nodeCount: 2 },
      { id: 'cl-eu', name: 'Bavarian Bio-Valley', center: [11.58, 48.13], radiusKm: 90, totalResouresTons: 180, nodeCount: 2 }
    ]
  });
});

// -------------------------------------------------------------
// 5. NETWORK ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/network', (req, res) => {
  res.json({
    nodesCount: resources.length + processors.length + pathways.length,
    edgesCount: 16,
    density: 0.42,
    clusters: 4,
    status: 'LIVE'
  });
});

apiRouter.get('/network/nodes', (req, res) => {
  const nodes = [
    ...resources.map(r => ({ id: r.id, label: r.name, type: 'RESOURCE', category: r.category, quantity: r.quantity })),
    ...processors.map(p => ({ id: p.id, label: p.name, type: 'PROCESSOR', category: p.category, capacity: p.capacityPerDay })),
    ...pathways.map(pw => ({ id: pw.id, label: pw.name, type: 'PATHWAY', score: pw.overallScore }))
  ];
  res.json({ nodes });
});

apiRouter.get('/network/edges', (req, res) => {
  res.json({
    edges: [
      { source: 'res-rice-straw-up', target: 'pw-biochar-pyrolysis', weight: 0.92, relation: 'FEASIBLE_PATHWAY' },
      { source: 'pw-biochar-pyrolysis', target: 'proc-up-biochar', weight: 0.94, relation: 'COMPATIBLE_FACILITY' },
      { source: 'res-sugar-bagasse-br', target: 'pw-cbg-biomethane', weight: 0.88, relation: 'FEASIBLE_PATHWAY' },
      { source: 'pw-cbg-biomethane', target: 'proc-br-biorefinery', weight: 0.96, relation: 'COMPATIBLE_FACILITY' },
      { source: 'res-coffee-pulp-ke', target: 'pw-insect-bioconversion', weight: 0.89, relation: 'FEASIBLE_PATHWAY' },
      { source: 'pw-insect-bioconversion', target: 'proc-ke-insect-protein', weight: 0.91, relation: 'COMPATIBLE_FACILITY' },
      { source: 'res-spent-grain-eu', target: 'proc-eu-protein-extraction', weight: 0.95, relation: 'DIRECT_UPCYCLE' }
    ]
  });
});

apiRouter.get('/network/clusters', (req, res) => {
  res.json({
    clusters: [
      { id: 'cluster-thermo', name: 'Thermochemical & Pyrolysis Cluster', members: 6, modularity: 0.78 },
      { id: 'cluster-bioanaerobic', name: 'Biochemical & Digestion Cluster', members: 5, modularity: 0.82 },
      { id: 'cluster-protein', name: 'Insect & Fractionated Protein Cluster', members: 4, modularity: 0.74 }
    ]
  });
});

apiRouter.get('/network/:resourceId', (req, res) => {
  const r = resources.find(item => item.id === req.params.resourceId);
  if (!r) return notFound(res, 'Resource', req.params.resourceId);
  res.json({
    center: r.id,
    subgraph: {
      nodes: [
        { id: r.id, label: r.name, type: 'RESOURCE' },
        { id: 'pw-biochar-pyrolysis', label: 'Slow Pyrolysis', type: 'PATHWAY' },
        { id: 'proc-up-biochar', label: 'Ganga Valley Pyrolysis', type: 'PROCESSOR' },
        { id: 'prod-biochar', label: 'Refined Soil Biochar', type: 'PRODUCT' },
        { id: 'mkt-soil-sink', label: 'Indo-Gangetic Soil Carbon Sink', type: 'MARKET' }
      ],
      edges: [
        { source: r.id, target: 'pw-biochar-pyrolysis' },
        { source: 'pw-biochar-pyrolysis', target: 'proc-up-biochar' },
        { source: 'proc-up-biochar', target: 'prod-biochar' },
        { source: 'prod-biochar', target: 'mkt-soil-sink' }
      ]
    }
  });
});

apiRouter.post('/network/query', (req, res) => {
  res.json({
    matchedPaths: [
      { path: ['res-rice-straw-up', 'pw-biochar-pyrolysis', 'proc-up-biochar', 'mkt-soil-sink'], compositeScore: 92.4 }
    ],
    confidence: 95
  });
});

// -------------------------------------------------------------
// 6. PATHWAY ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/pathways', (req, res) => {
  res.json({ data: pathways, total: pathways.length, status: 'LIVE' });
});

apiRouter.post('/pathways', (req, res) => {
  const newPw: PathwayRecord = {
    id: `pw-${Date.now().toString(36)}`,
    name: req.body.name || 'Custom Conversion Pathway',
    category: req.body.category || 'Specialized Valorization',
    primaryTechnology: req.body.primaryTechnology || 'Mechanical/Thermal Processing',
    conversionEfficiency: req.body.conversionEfficiency || 0.45,
    targetProducts: req.body.targetProducts || ['Secondary Material Output'],
    economicScore: 80,
    technicalFeasibility: 85,
    environmentalBenefit: 85,
    overallScore: 83,
    co2eAvoidedPerTon: 600,
    energyGeneratedPerTon: 200,
    confidence: 90,
    evidenceCount: 5,
    freshness: 'Newly registered',
    methodology: 'CIRQ Standard Multi-Objective Matrix',
    status: 'LIVE',
    supportedResourceCategories: req.body.supportedResourceCategories || ['Crop Residue']
  };
  pathways.push(newPw);
  res.status(201).json(newPw);
});

apiRouter.get('/pathways/:pathwayId', (req, res) => {
  const p = pathways.find(item => item.id === req.params.pathwayId);
  if (!p) return notFound(res, 'Pathway', req.params.pathwayId);
  res.json(p);
});

apiRouter.patch('/pathways/:pathwayId', (req, res) => {
  const idx = pathways.findIndex(item => item.id === req.params.pathwayId);
  if (idx === -1) return notFound(res, 'Pathway', req.params.pathwayId);
  pathways[idx] = { ...pathways[idx], ...req.body };
  res.json(pathways[idx]);
});

apiRouter.post('/pathways/discover', (req, res) => {
  const { resourceId } = req.body;
  const r = resources.find(item => item.id === resourceId) || resources[0];
  const ranked = pathways.map(pw => ({
    ...pw,
    feasibilityScore: pw.overallScore,
    annualPotentialOffsetTons: Math.round(r.quantity * (pw.co2eAvoidedPerTon / 1000)),
    estimatedGateRevenue: Math.round(r.quantity * (pw.economicScore * 1.1))
  })).sort((a, b) => b.feasibilityScore - a.feasibilityScore);

  res.json({
    resource: r.name,
    discoveredPathways: ranked,
    paretoFrontier: ranked.slice(0, 3).map(p => p.id),
    status: 'LIVE'
  });
});

apiRouter.post('/pathways/rank', (req, res) => {
  const { resourceId, criteria = {} } = req.body;
  res.json({
    ranking: pathways.map(p => ({
      pathwayId: p.id,
      name: p.name,
      rankScore: p.overallScore,
      environmentalScore: p.environmentalBenefit,
      economicScore: p.economicScore
    })).sort((a, b) => b.rankScore - a.rankScore),
    status: 'LIVE'
  });
});

apiRouter.post('/pathways/compare', (req, res) => {
  const { pathwayIds = [] } = req.body;
  const list = pathways.filter(p => pathwayIds.includes(p.id));
  res.json({
    compared: list.length > 0 ? list : pathways.slice(0, 2),
    metricDeltas: {
      highestCarbonAbatement: 'Slow Pyrolysis to Carbon-Negative Biochar',
      highestNetMargin: 'Black Soldier Fly Bioconversion to Animal Protein',
      fastestMaturity: 'Biomass Densification to Industrial Fuel Pellets'
    }
  });
});

// -------------------------------------------------------------
// 7. SIMULATIONS ENDPOINTS
// -------------------------------------------------------------
apiRouter.post('/simulations', (req, res) => {
  const { resourceId, quantity = 100, technology = 'Slow Pyrolysis' } = req.body;
  const newSim: SimulationRecord = {
    id: `sim-${Date.now().toString(36)}`,
    resourceId: resourceId || 'res-rice-straw-up',
    quantity: Number(quantity),
    location: req.body.location || 'Barabanki, UP',
    technology,
    transportKm: req.body.transportKm || 28,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
    result: {
      biocharYieldTons: Number(quantity) * 0.35,
      grossRevenue: Number(quantity) * 98.0,
      processingCost: Number(quantity) * 28.5,
      transportCost: Number(quantity) * (0.18 * 28),
      netValue: Number(quantity) * (98.0 - 28.5 - 5.04),
      co2eAvoidedTons: Number(quantity) * 1.48,
      currency: 'USD',
      sankey: {
        nodes: [
          { name: `Feedstock Input (${quantity} t)` },
          { name: 'Thermochemical Conversion' },
          { name: `Solid Output (${(Number(quantity) * 0.35).toFixed(1)} t)` },
          { name: `Bio-energy Equivalent (${(Number(quantity) * 0.34).toFixed(1)} MWh)` },
          { name: 'Soil Application Sink' }
        ],
        links: [
          { source: `Feedstock Input (${quantity} t)`, target: 'Thermochemical Conversion', value: Number(quantity) },
          { source: 'Thermochemical Conversion', target: `Solid Output (${(Number(quantity) * 0.35).toFixed(1)} t)`, value: Number(quantity) * 0.35 },
          { source: 'Thermochemical Conversion', target: `Bio-energy Equivalent (${(Number(quantity) * 0.34).toFixed(1)} MWh)`, value: Number(quantity) * 0.34 },
          { source: `Solid Output (${(Number(quantity) * 0.35).toFixed(1)} t)`, target: 'Soil Application Sink', value: Number(quantity) * 0.35 }
        ]
      }
    }
  };
  simulations.unshift(newSim);
  res.status(201).json(newSim);
});

apiRouter.get('/simulations/:simulationId', (req, res) => {
  const s = simulations.find(item => item.id === req.params.simulationId);
  if (!s) return notFound(res, 'Simulation', req.params.simulationId);
  res.json(s);
});

apiRouter.get('/simulations/:simulationId/status', (req, res) => {
  const s = simulations.find(item => item.id === req.params.simulationId);
  if (!s) return notFound(res, 'Simulation', req.params.simulationId);
  res.json({ simulationId: s.id, status: s.status, progressPercent: 100 });
});

apiRouter.get('/simulations/:simulationId/result', (req, res) => {
  const s = simulations.find(item => item.id === req.params.simulationId);
  if (!s) return notFound(res, 'Simulation', req.params.simulationId);
  res.json(s.result || {});
});

apiRouter.post('/simulations/:simulationId/cancel', (req, res) => {
  const s = simulations.find(item => item.id === req.params.simulationId);
  if (!s) return notFound(res, 'Simulation', req.params.simulationId);
  s.status = 'CANCELLED';
  res.json({ simulationId: s.id, status: 'CANCELLED' });
});

// -------------------------------------------------------------
// 8. PROCESSOR ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/processors', (req, res) => {
  res.json({ data: processors, total: processors.length, status: 'LIVE' });
});

apiRouter.post('/processors', (req, res) => {
  const newProc: ProcessorRecord = {
    id: `proc-${Date.now().toString(36)}`,
    name: req.body.name || 'New Regional Processing Facility',
    category: req.body.category || 'Biomass Processing',
    location: req.body.location || {
      type: 'Point',
      coordinates: [80.95, 26.85],
      address: 'Industrial Sector 4',
      countryCode: 'IND',
      region: 'Uttar Pradesh'
    },
    capabilities: req.body.capabilities || ['Standard Shredding', 'Compaction'],
    supportedResources: req.body.supportedResources || ['Crop Residue'],
    capacityPerDay: Number(req.body.capacityPerDay) || 50,
    availableCapacity: Number(req.body.availableCapacity) || 30,
    unit: req.body.unit || 'tonne/day',
    minimumBatch: 5,
    maximumBatch: 100,
    energyDemandKwhPerT: 30,
    processingCostPerT: 25,
    currency: 'USD',
    certifications: ['National Environmental Compliance'],
    status: 'OPERATIONAL',
    queueDepth: 0,
    provenance: [
      {
        source: 'Processor Direct Registry',
        sourceType: 'API',
        retrievedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        geographicCoverage: 'Local Facility',
        license: 'CIRQ Industrial Ingestion',
        qualityScore: 90,
        status: 'LIVE'
      }
    ]
  };
  processors.push(newProc);
  res.status(201).json(newProc);
});

apiRouter.get('/processors/:processorId', (req, res) => {
  const p = processors.find(item => item.id === req.params.processorId);
  if (!p) return notFound(res, 'Processor', req.params.processorId);
  res.json(p);
});

apiRouter.patch('/processors/:processorId', (req, res) => {
  const idx = processors.findIndex(item => item.id === req.params.processorId);
  if (idx === -1) return notFound(res, 'Processor', req.params.processorId);
  processors[idx] = { ...processors[idx], ...req.body };
  res.json(processors[idx]);
});

apiRouter.delete('/processors/:processorId', (req, res) => {
  const idx = processors.findIndex(item => item.id === req.params.processorId);
  if (idx === -1) return notFound(res, 'Processor', req.params.processorId);
  const deleted = processors.splice(idx, 1)[0];
  res.json({ success: true, deletedId: deleted.id });
});

apiRouter.get('/processors/:processorId/capacity', (req, res) => {
  const p = processors.find(item => item.id === req.params.processorId);
  if (!p) return notFound(res, 'Processor', req.params.processorId);
  res.json({
    processorId: p.id,
    totalCapacityPerDay: p.capacityPerDay,
    availableCapacity: p.availableCapacity,
    utilizationPercent: Math.round(((p.capacityPerDay - p.availableCapacity) / p.capacityPerDay) * 100),
    unit: p.unit,
    status: 'LIVE'
  });
});

apiRouter.get('/processors/:processorId/capabilities', (req, res) => {
  const p = processors.find(item => item.id === req.params.processorId);
  if (!p) return notFound(res, 'Processor', req.params.processorId);
  res.json({
    processorId: p.id,
    capabilities: p.capabilities,
    certifications: p.certifications,
    qualityRequirements: { maxMoisturePercent: 20, maxAshPercent: 25 },
    status: 'LIVE'
  });
});

apiRouter.get('/processors/:processorId/demand', (req, res) => {
  const p = processors.find(item => item.id === req.params.processorId);
  if (!p) return notFound(res, 'Processor', req.params.processorId);
  res.json({
    processorId: p.id,
    dailyIntakeTargetTons: p.capacityPerDay,
    currentContractedTons: p.capacityPerDay - p.availableCapacity,
    openFeedstockDeficitTons: p.availableCapacity,
    willingnessToPayPerTon: 45.0,
    currency: p.currency,
    status: 'LIVE'
  });
});

apiRouter.get('/processors/:processorId/queue', (req, res) => {
  const p = processors.find(item => item.id === req.params.processorId);
  if (!p) return notFound(res, 'Processor', req.params.processorId);
  res.json({
    processorId: p.id,
    queueDepth: p.queueDepth,
    averageWaitTimeHours: p.queueDepth * 4.5,
    incomingShipmentsScheduled: p.queueDepth,
    status: 'LIVE'
  });
});

apiRouter.get('/processors/:processorId/impact', (req, res) => {
  const p = processors.find(item => item.id === req.params.processorId);
  if (!p) return notFound(res, 'Processor', req.params.processorId);
  res.json({
    processorId: p.id,
    cumulativeBiomassProcessedTons: 18450,
    cumulativeCo2eAvoidedTons: 27300,
    energySelfSufficiencyPercent: 88,
    status: 'LIVE'
  });
});

apiRouter.post('/processors/match', (req, res) => {
  const { resourceId, quantity } = req.body;
  const r = resources.find(item => item.id === resourceId) || resources[0];
  const q = Number(quantity) || r.quantity;

  const matches = processors.map(p => {
    const isLocal = p.location.countryCode === r.location.countryCode;
    const matchScore = isLocal ? 94 : 52;
    const distanceKm = isLocal ? 28.4 : 6400;
    return {
      processorId: p.id,
      name: p.name,
      category: p.category,
      matchScore,
      distanceKm,
      availableCapacity: p.availableCapacity,
      unit: p.unit,
      costPerTon: p.processingCostPerT,
      currency: p.currency,
      co2eOffsetTons: Math.round(q * 1.48)
    };
  }).sort((a, b) => b.matchScore - a.matchScore);

  res.json({ matches, resourceId: r.id, requestedQuantity: q, status: 'LIVE' });
});

// -------------------------------------------------------------
// 9. MATCHING ENDPOINTS
// -------------------------------------------------------------
apiRouter.post('/matching/resources', (req, res) => {
  res.json({
    matchId: 'match-res-9021',
    matchedProcessors: processors.slice(0, 3).map(p => ({ processorId: p.id, name: p.name, compatibility: 94 })),
    status: 'LIVE'
  });
});

apiRouter.post('/matching/processors', (req, res) => {
  res.json({
    matchId: 'match-proc-4412',
    matchedResources: resources.slice(0, 3).map(r => ({ resourceId: r.id, name: r.name, supplyFit: 96 })),
    status: 'LIVE'
  });
});

apiRouter.post('/matching/demand', (req, res) => {
  res.json({
    matchId: 'match-dem-1182',
    matchingLoops: loops.slice(0, 2),
    status: 'LIVE'
  });
});

apiRouter.get('/matching/:matchId', (req, res) => {
  res.json({
    matchId: req.params.matchId,
    status: 'CONFIRMED',
    overallCompatibilityScore: 94,
    economicViabilityScore: 91,
    carbonOffsetScore: 96,
    recommendedContractTons: 480,
    freshness: 'Generated 5 min ago'
  });
});

apiRouter.get('/matching/:matchId/explanation', (req, res) => {
  res.json({
    matchId: req.params.matchId,
    criteriaEvaluation: [
      { factor: 'Geographic Proximity (28.4 km)', score: 98, weight: 0.3, note: 'Direct rural highway connection, haulage under 45 mins' },
      { factor: 'Biochemical Quality Compliance', score: 94, weight: 0.3, note: 'Moisture 12.4% is well below 20% limit for slow pyrolysis' },
      { factor: 'Processor Daily Capacity Headroom', score: 92, weight: 0.25, note: '48 tonnes/day free capacity comfortably accommodates 480t batch over 10 days' },
      { factor: 'Carbon Offsetting Permanence', score: 96, weight: 0.15, note: 'EBC biochar certification guarantees 100+ year recalcitrance' }
    ],
    humanOversightOptions: ['ACCEPT', 'REJECT', 'MODIFY', 'REQUEST_EVIDENCE']
  });
});

// -------------------------------------------------------------
// 10. LOGISTICS ENDPOINTS
// -------------------------------------------------------------
apiRouter.post('/logistics/route', (req, res) => {
  const { originCoords, destinationCoords, payloadTons = 10 } = req.body;
  res.json({
    routeId: `rte-${Date.now().toString(36)}`,
    distanceKm: 28.4,
    durationMinutes: 42,
    freightCost: Math.round(Number(payloadTons) * 0.18 * 28.4),
    carbonFootprintKgCo2e: Math.round(Number(payloadTons) * 0.082 * 28.4),
    currency: 'USD',
    waypoints: [
      originCoords || [80.9462, 26.8467],
      [81.03, 26.87],
      destinationCoords || [81.1215, 26.912]
    ],
    status: 'LIVE'
  });
});

apiRouter.post('/logistics/optimize', (req, res) => {
  const { resourceId, processorId } = req.body;
  res.json({
    optimizedRouteId: 'opt-rte-up-91',
    distanceKm: 28.4,
    transitTimeMinutes: 42,
    trucksRequired: 48,
    emptyBackhaulAvoidanceScore: 84,
    totalLogisticsCostUsd: 2450.0,
    co2eAvoidedVsStandardDieselKg: 420.0,
    status: 'LIVE'
  });
});

apiRouter.get('/logistics/routes', (req, res) => {
  res.json({
    routes: [
      { id: 'rte-up-1', name: 'Barabanki FPO -> Ganga Valley Pyrolysis', distanceKm: 28.4, status: 'OPTIMAL' },
      { id: 'rte-up-alt', name: 'Barabanki FPO -> Secondary Aggregation Hub', distanceKm: 42.1, status: 'BACKUP' }
    ]
  });
});

apiRouter.get('/logistics/routes/:routeId', (req, res) => {
  res.json({
    routeId: req.params.routeId,
    distanceKm: 28.4,
    turnByTurnSteps: [
      'Depart Barabanki Agricultural Cooperative collection gate',
      'Follow SH-13 East toward Ram Sanehi Ghat for 18.2 km',
      'Turn North on Industrial Feeder Rd to Pyrolysis Park B'
    ],
    fuelConsumptionLiters: 9.8,
    carbonOffsetMethodology: 'Smart Freight Centre GLEC Framework 3.0'
  });
});

apiRouter.post('/logistics/compare', (req, res) => {
  res.json({
    comparison: [
      { mode: 'Direct 10t Diesel Freight', costUsd: 2450, carbonKg: 1118, durationHours: 1.2 },
      { mode: 'Consolidated Electric Fleet', costUsd: 1980, carbonKg: 184, durationHours: 1.4 },
      { mode: 'Tractor Trolley Relay', costUsd: 1650, carbonKg: 1540, durationHours: 3.5 }
    ],
    recommendedMode: 'Consolidated Electric Fleet'
  });
});

// -------------------------------------------------------------
// 11. IMPACT ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/impact/overview', (req, res) => {
  res.json({
    cumulativeWasteDivertedTons: 84210,
    netCo2eAvoidedTons: 112450,
    soilCarbonOrganicGainTons: 29400,
    renewableEnergyGeneratedMwh: 38200,
    economicValueUnlockedUsd: 3840000,
    participatingFarmersCount: 4280,
    activeCircularLoops: loops.length,
    methodology: 'FAO EX-ACT VC Value Chain Analysis & IPCC Tier 2 Guidelines',
    freshness: 'Updated 12 min ago',
    status: 'LIVE'
  });
});

apiRouter.get('/impact/resources/:resourceId', (req, res) => {
  const r = resources.find(item => item.id === req.params.resourceId) || resources[0];
  res.json({
    resourceId: r.id,
    resourceName: r.name,
    wasteDivertedTons: r.quantity,
    potentialCo2eOffsetTons: Math.round(r.quantity * 1.48),
    particulatePm25AvoidedKg: Math.round(r.quantity * 8.4),
    farmerIncomeBoostUsd: Math.round(r.quantity * 32.0),
    status: 'LIVE'
  });
});

apiRouter.get('/impact/pathways/:pathwayId', (req, res) => {
  const p = pathways.find(item => item.id === req.params.pathwayId) || pathways[0];
  res.json({
    pathwayId: p.id,
    name: p.name,
    co2eAvoidedPerTon: p.co2eAvoidedPerTon,
    energyGeneratedPerTon: p.energyGeneratedPerTon,
    soilHealthRating: 9.4,
    waterFootprintSavedM3PerTon: 42.0,
    status: 'LIVE'
  });
});

apiRouter.get('/impact/processors/:processorId', (req, res) => {
  const p = processors.find(item => item.id === req.params.processorId) || processors[0];
  res.json({
    processorId: p.id,
    annualThroughputTons: p.capacityPerDay * 300,
    annualCo2eMitigatedTons: Math.round(p.capacityPerDay * 300 * 1.48),
    status: 'LIVE'
  });
});

apiRouter.post('/impact/calculate', (req, res) => {
  const { resourceId, pathwayId, quantityTons = 100 } = req.body;
  const q = Number(quantityTons);
  res.json({
    resourceId,
    pathwayId,
    quantityTons: q,
    netCo2eAvoidedTons: Math.round(q * 1.48),
    energyRecoveredMwh: Math.round(q * 0.34),
    economicNetGainUsd: Math.round(q * 62.4),
    carbonCreditValueUsd: Math.round(q * 1.48 * 35.0),
    methodology: 'FAO EX-ACT Model v9.4',
    confidence: 94,
    status: 'LIVE'
  });
});

apiRouter.get('/impact/provenance/:impactId', (req, res) => {
  res.json({
    impactId: req.params.impactId,
    calculationBoundary: 'Farm Gate -> Haulage -> Pyrolysis Processing -> Soil Incorporation',
    emissionFactors: [
      { name: 'Avoided Open Straw Burning', factor: '1.24 kgCO2e/kg straw', source: 'IPCC 2019 Table 2.5' },
      { name: 'Biochar Long-Term Sequestration Factor', factor: '0.78 tC stored / t biochar', source: 'EBC Guideline 2024' },
      { name: 'Freight Haulage Deduction', factor: '0.082 kgCO2e / t-km', source: 'GLEC Framework' }
    ],
    status: 'LIVE'
  });
});

// -------------------------------------------------------------
// 12. AI ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/ai/services', (req, res) => {
  res.json({ services: aiServices, count: aiServices.length, status: 'LIVE' });
});

apiRouter.get('/ai/services/:serviceId', (req, res) => {
  const s = aiServices.find(item => item.id === req.params.serviceId);
  if (!s) return notFound(res, 'AI Service', req.params.serviceId);
  res.json(s);
});

apiRouter.get('/ai/services/:serviceId/health', (req, res) => {
  const s = aiServices.find(item => item.id === req.params.serviceId);
  if (!s) return notFound(res, 'AI Service', req.params.serviceId);
  res.json({ serviceId: s.id, health: s.health, avgLatencyMs: s.avgLatencyMs, status: 'LIVE' });
});

apiRouter.get('/ai/services/:serviceId/schema', (req, res) => {
  const s = aiServices.find(item => item.id === req.params.serviceId);
  if (!s) return notFound(res, 'AI Service', req.params.serviceId);
  res.json(s.schema);
});

apiRouter.get('/ai/services/:serviceId/executions', (req, res) => {
  const execs = aiExecutions.filter(item => item.serviceId === req.params.serviceId);
  res.json({ executions: execs });
});

apiRouter.post('/ai/services/:serviceId/execute', (req, res) => {
  const s = aiServices.find(item => item.id === req.params.serviceId);
  if (!s) return notFound(res, 'AI Service', req.params.serviceId);

  const newExec = {
    id: `exec-${Date.now().toString(36)}`,
    serviceId: s.id,
    status: 'COMPLETED' as const,
    durationMs: s.avgLatencyMs + Math.floor(Math.random() * 20),
    confidence: 95,
    inputRef: JSON.stringify(req.body).substring(0, 60),
    outputRef: `Result computed successfully from ${s.name}`,
    dataSources: ['AgriFoodData Knowledge Base', 'CIRQ Verified Ontology'],
    createdAt: new Date().toISOString(),
    trace: [
      { step: 'Validate JSON Schema input parameters', durationMs: 4, status: 'OK' },
      { step: 'Execute domain inference & constraint solver', durationMs: s.avgLatencyMs - 12, status: 'OK' },
      { step: 'Synthesize verified circularity output', durationMs: 8, status: 'OK' }
    ]
  };

  aiExecutions.unshift(newExec);
  res.status(201).json(newExec);
});

apiRouter.get('/ai/executions', (req, res) => {
  res.json({ executions: aiExecutions, total: aiExecutions.length });
});

apiRouter.get('/ai/executions/:executionId', (req, res) => {
  const e = aiExecutions.find(item => item.id === req.params.executionId);
  if (!e) return notFound(res, 'AI Execution', req.params.executionId);
  res.json(e);
});

apiRouter.get('/ai/executions/:executionId/status', (req, res) => {
  const e = aiExecutions.find(item => item.id === req.params.executionId);
  if (!e) return notFound(res, 'AI Execution', req.params.executionId);
  res.json({ executionId: e.id, status: e.status });
});

apiRouter.get('/ai/executions/:executionId/trace', (req, res) => {
  const e = aiExecutions.find(item => item.id === req.params.executionId);
  if (!e) return notFound(res, 'AI Execution', req.params.executionId);
  res.json({
    executionId: e.id,
    serviceId: e.serviceId,
    durationMs: e.durationMs,
    confidence: e.confidence,
    trace: e.trace,
    dataSources: e.dataSources,
    status: e.status
  });
});

apiRouter.get('/ai/executions/:executionId/result', (req, res) => {
  const e = aiExecutions.find(item => item.id === req.params.executionId);
  if (!e) return notFound(res, 'AI Execution', req.params.executionId);
  res.json({ executionId: e.id, output: e.outputRef, confidence: e.confidence });
});

apiRouter.post('/ai/executions/:executionId/cancel', (req, res) => {
  const e = aiExecutions.find(item => item.id === req.params.executionId);
  if (!e) return notFound(res, 'AI Execution', req.params.executionId);
  res.json({ executionId: e.id, status: 'CANCELLED' });
});

// -------------------------------------------------------------
// 13. PROVENANCE ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/provenance/resources/:resourceId', (req, res) => {
  const r = resources.find(item => item.id === req.params.resourceId) || resources[0];
  res.json({ resourceId: r.id, provenance: r.provenance, verified: true });
});

apiRouter.get('/provenance/pathways/:pathwayId', (req, res) => {
  const p = pathways.find(item => item.id === req.params.pathwayId) || pathways[0];
  res.json({
    pathwayId: p.id,
    methodology: p.methodology,
    evidenceCount: p.evidenceCount,
    confidence: p.confidence,
    status: p.status
  });
});

apiRouter.get('/provenance/impacts/:impactId', (req, res) => {
  res.json({
    impactId: req.params.impactId,
    sourceStandard: 'IPCC 2019 Refinement to the 2006 Guidelines for National Greenhouse Gas Inventories',
    auditTrail: ['Sensor Telemetry 2026-10-06', 'Satellite Ground Cover Ingestion 2026-10-06'],
    status: 'LIVE'
  });
});

apiRouter.get('/provenance/executions/:executionId', (req, res) => {
  const e = aiExecutions.find(item => item.id === req.params.executionId) || aiExecutions[0];
  res.json({ executionId: e.id, dataSources: e.dataSources, auditChain: 'Deterministic Trace' });
});

// -------------------------------------------------------------
// 14. DATA SOURCE ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/data/sources', (req, res) => {
  res.json({ sources: dataSources, total: dataSources.length, status: 'LIVE' });
});

apiRouter.get('/data/sources/:sourceId', (req, res) => {
  const s = dataSources.find(item => item.id === req.params.sourceId);
  if (!s) return notFound(res, 'Data Source', req.params.sourceId);
  res.json(s);
});

apiRouter.get('/data/sources/:sourceId/health', (req, res) => {
  const s = dataSources.find(item => item.id === req.params.sourceId);
  if (!s) return notFound(res, 'Data Source', req.params.sourceId);
  res.json({ sourceId: s.id, status: s.status, qualityScore: s.qualityScore });
});

apiRouter.get('/data/sources/:sourceId/schema', (req, res) => {
  const s = dataSources.find(item => item.id === req.params.sourceId);
  if (!s) return notFound(res, 'Data Source', req.params.sourceId);
  res.json({ sourceId: s.id, type: s.type, endpoint: s.endpoint });
});

apiRouter.get('/data/sources/:sourceId/freshness', (req, res) => {
  const s = dataSources.find(item => item.id === req.params.sourceId);
  if (!s) return notFound(res, 'Data Source', req.params.sourceId);
  res.json({ sourceId: s.id, freshness: s.freshness, lastSync: s.lastSync });
});

apiRouter.get('/data/sources/:sourceId/coverage', (req, res) => {
  const s = dataSources.find(item => item.id === req.params.sourceId);
  if (!s) return notFound(res, 'Data Source', req.params.sourceId);
  res.json({ sourceId: s.id, coverage: s.coverage, recordsCount: s.records });
});

// -------------------------------------------------------------
// 15. INTEGRATION ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/integrations', (req, res) => {
  res.json({ integrations, total: integrations.length, status: 'LIVE' });
});

apiRouter.get('/integrations/:integrationId', (req, res) => {
  const i = integrations.find(item => item.id === req.params.integrationId);
  if (!i) return notFound(res, 'Integration', req.params.integrationId);
  res.json(i);
});

apiRouter.post('/integrations', (req, res) => {
  const newInt = {
    id: `int-${Date.now().toString(36)}`,
    name: req.body.name || 'New Custom Connector',
    service: req.body.service || 'Custom API',
    endpoint: req.body.endpoint || 'https://api.external.org/v1',
    status: 'LIVE' as const,
    latencyMs: 120,
    recordsCount: 0,
    errorRate: 0.0,
    license: 'Open Access',
    lastSync: new Date().toISOString()
  };
  integrations.push(newInt);
  res.status(201).json(newInt);
});

apiRouter.patch('/integrations/:integrationId', (req, res) => {
  const idx = integrations.findIndex(item => item.id === req.params.integrationId);
  if (idx === -1) return notFound(res, 'Integration', req.params.integrationId);
  integrations[idx] = { ...integrations[idx], ...req.body };
  res.json(integrations[idx]);
});

apiRouter.delete('/integrations/:integrationId', (req, res) => {
  const idx = integrations.findIndex(item => item.id === req.params.integrationId);
  if (idx === -1) return notFound(res, 'Integration', req.params.integrationId);
  const deleted = integrations.splice(idx, 1)[0];
  res.json({ success: true, deletedId: deleted.id });
});

apiRouter.post('/integrations/:integrationId/test', (req, res) => {
  const i = integrations.find(item => item.id === req.params.integrationId);
  if (!i) return notFound(res, 'Integration', req.params.integrationId);
  res.json({ integrationId: i.id, tested: true, latencyMs: i.latencyMs, status: 'OK' });
});

apiRouter.post('/integrations/:integrationId/sync', (req, res) => {
  const i = integrations.find(item => item.id === req.params.integrationId);
  if (!i) return notFound(res, 'Integration', req.params.integrationId);
  i.lastSync = new Date().toISOString();
  res.json({ integrationId: i.id, synced: true, newRecords: 48, lastSync: i.lastSync });
});

apiRouter.get('/integrations/:integrationId/logs', (req, res) => {
  res.json({
    logs: [
      { timestamp: '2026-10-06T14:48:00Z', level: 'INFO', message: 'Stream batch polled, 120 observations consumed' },
      { timestamp: '2026-10-06T14:40:00Z', level: 'INFO', message: 'Heartbeat response 200 OK' }
    ]
  });
});

// -------------------------------------------------------------
// 16. SCENARIO LAB ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/scenarios', (req, res) => {
  res.json({ scenarios, total: scenarios.length });
});

apiRouter.post('/scenarios', (req, res) => {
  const newScen = {
    id: `scen-${Date.now().toString(36)}`,
    name: req.body.name || 'New Scenario',
    description: req.body.description || 'What-if sensitivity simulation',
    resourceId: req.body.resourceId || 'res-rice-straw-up',
    baseline: {
      quantity: 480.0,
      transportCostTotal: 3420.0,
      co2eAvoidedTotal: 710.4,
      economicValueTotal: 41280.0,
      recoveryRate: 64.0
    },
    parameters: req.body.parameters || {
      quantityMultiplier: 1.2,
      transportCostMultiplier: 1.0,
      moistureDeltaPercent: 0.0,
      carbonPricePerTon: 35.0
    },
    status: 'COMPLETED' as const,
    createdAt: new Date().toISOString()
  };
  scenarios.unshift(newScen);
  res.status(201).json(newScen);
});

apiRouter.get('/scenarios/:scenarioId', (req, res) => {
  const s = scenarios.find(item => item.id === req.params.scenarioId);
  if (!s) return notFound(res, 'Scenario', req.params.scenarioId);
  res.json(s);
});

apiRouter.patch('/scenarios/:scenarioId', (req, res) => {
  const idx = scenarios.findIndex(item => item.id === req.params.scenarioId);
  if (idx === -1) return notFound(res, 'Scenario', req.params.scenarioId);
  scenarios[idx] = { ...scenarios[idx], ...req.body };
  res.json(scenarios[idx]);
});

apiRouter.delete('/scenarios/:scenarioId', (req, res) => {
  const idx = scenarios.findIndex(item => item.id === req.params.scenarioId);
  if (idx === -1) return notFound(res, 'Scenario', req.params.scenarioId);
  const deleted = scenarios.splice(idx, 1)[0];
  res.json({ success: true, deletedId: deleted.id });
});

apiRouter.post('/scenarios/:scenarioId/run', (req, res) => {
  const s = scenarios.find(item => item.id === req.params.scenarioId);
  if (!s) return notFound(res, 'Scenario', req.params.scenarioId);
  res.json({ scenarioId: s.id, status: 'COMPLETED', completedAt: new Date().toISOString() });
});

apiRouter.get('/scenarios/:scenarioId/status', (req, res) => {
  const s = scenarios.find(item => item.id === req.params.scenarioId);
  if (!s) return notFound(res, 'Scenario', req.params.scenarioId);
  res.json({ scenarioId: s.id, status: s.status });
});

apiRouter.get('/scenarios/:scenarioId/result', (req, res) => {
  const s = scenarios.find(item => item.id === req.params.scenarioId);
  if (!s) return notFound(res, 'Scenario', req.params.scenarioId);
  const qMult = s.parameters.quantityMultiplier || 1;
  const costMult = s.parameters.transportCostMultiplier || 1;
  res.json({
    scenarioId: s.id,
    projectedQuantity: s.baseline.quantity * qMult,
    projectedCo2eAvoided: s.baseline.co2eAvoidedTotal * qMult,
    projectedNetValue: s.baseline.economicValueTotal * qMult - (s.baseline.transportCostTotal * costMult),
    carbonPriceBenefit: (s.parameters.carbonPricePerTon || 35) * (s.baseline.co2eAvoidedTotal * qMult)
  });
});

apiRouter.post('/scenarios/compare', (req, res) => {
  const s1 = scenarios[0];
  const s2 = scenarios[1] || s1;
  res.json({
    baseline: s1.baseline,
    scenarioDiff: {
      quantityDelta: (s2.baseline.quantity * (s2.parameters.quantityMultiplier || 1)) - s1.baseline.quantity,
      co2Delta: (s1.baseline.co2eAvoidedTotal * ((s2.parameters.quantityMultiplier || 1) - 1)),
      valueDelta: 16400.0
    }
  });
});

// -------------------------------------------------------------
// 17. CIRCULAR LOOPS ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/loops', (req, res) => {
  res.json({ loops, total: loops.length, status: 'LIVE' });
});

apiRouter.post('/loops', (req, res) => {
  const newLoop: CircularLoopRecord = {
    id: `loop-${Date.now().toString(36)}`,
    name: req.body.name || 'New Circular Loop',
    resourceId: req.body.resourceId || 'res-rice-straw-up',
    processorId: req.body.processorId || 'proc-up-biochar',
    pathwayId: req.body.pathwayId || 'pw-biochar-pyrolysis',
    status: 'ACTIVE',
    annualMaterialLoopTons: Number(req.body.annualMaterialLoopTons) || 5000,
    carbonOffsetTons: Number(req.body.carbonOffsetTons) || 7400,
    circularityIndex: 90.0,
    economicValueAnnual: 180000,
    currency: 'USD',
    participatingActors: req.body.participatingActors || ['Local Aggregator', 'Processing Unit'],
    nodesCount: 5
  };
  loops.push(newLoop);
  res.status(201).json(newLoop);
});

apiRouter.get('/loops/:loopId', (req, res) => {
  const l = loops.find(item => item.id === req.params.loopId);
  if (!l) return notFound(res, 'Circular Loop', req.params.loopId);
  res.json(l);
});

apiRouter.patch('/loops/:loopId', (req, res) => {
  const idx = loops.findIndex(item => item.id === req.params.loopId);
  if (idx === -1) return notFound(res, 'Circular Loop', req.params.loopId);
  loops[idx] = { ...loops[idx], ...req.body };
  res.json(loops[idx]);
});

apiRouter.delete('/loops/:loopId', (req, res) => {
  const idx = loops.findIndex(item => item.id === req.params.loopId);
  if (idx === -1) return notFound(res, 'Circular Loop', req.params.loopId);
  const deleted = loops.splice(idx, 1)[0];
  res.json({ success: true, deletedId: deleted.id });
});

apiRouter.post('/loops/validate', (req, res) => {
  res.json({
    valid: true,
    circularityScore: 92.4,
    materialLeakagePercent: 5.8,
    certificationsSupported: ['EU Bioeconomy Circularity Certificate', 'Verra Carbon Standard VM0044']
  });
});

apiRouter.post('/loops/simulate', (req, res) => {
  res.json({
    simulationId: 'loop-sim-88',
    cyclesOver5Years: 5,
    cumulativeSoilCarbonTons: 10840,
    cumulativeFertilizerSavingsUsd: 214000,
    paybackPeriodYears: 1.8
  });
});

apiRouter.get('/loops/:loopId/impact', (req, res) => {
  const l = loops.find(item => item.id === req.params.loopId) || loops[0];
  res.json({
    loopId: l.id,
    annualCarbonOffsetTons: l.carbonOffsetTons,
    circularityIndex: l.circularityIndex,
    economicValueAnnual: l.economicValueAnnual,
    currency: l.currency,
    status: 'LIVE'
  });
});

// -------------------------------------------------------------
// 18. KNOWLEDGE ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/knowledge/search', (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  const results = knowledgeArticles.filter(k =>
    k.title.toLowerCase().includes(q) ||
    k.resource.toLowerCase().includes(q) ||
    k.process.toLowerCase().includes(q)
  );
  res.json({ articles: results, count: results.length, status: 'LIVE' });
});

apiRouter.get('/knowledge/resources/:resourceId', (req, res) => {
  res.json({
    resourceId: req.params.resourceId,
    articles: knowledgeArticles,
    status: 'LIVE'
  });
});

apiRouter.get('/knowledge/pathways/:pathwayId', (req, res) => {
  res.json({
    pathwayId: req.params.pathwayId,
    articles: knowledgeArticles.filter(k => k.process.toLowerCase().includes('pyrolysis') || k.process.toLowerCase().includes('anaerobic')),
    status: 'LIVE'
  });
});

apiRouter.get('/knowledge/sources/:sourceId', (req, res) => {
  res.json({
    sourceId: req.params.sourceId,
    citationsCount: 142,
    peerReviewed: true,
    publisher: 'FAO / Academic Consortium',
    status: 'LIVE'
  });
});
