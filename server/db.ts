/**
 * CIRQ Canonical Database and Domain Engine
 * Complies with CIRQ Blueprint data models, FAO EX-ACT methodologies, and multi-objective scoring.
 */

export interface ProvenanceRecord {
  source: string;
  sourceType: 'API' | 'SATELLITE' | 'LAB_MEASURED' | 'ESTIMATED' | 'RESEARCH';
  retrievedAt: string;
  publishedAt: string;
  geographicCoverage: string;
  license: string;
  qualityScore: number; // 0 - 100
  status: 'LIVE' | 'DEMO' | 'CACHED' | 'STALE';
}

export interface ResourceRecord {
  id: string;
  canonicalConceptId: string;
  name: string;
  aliases: string[];
  category: string;
  sourceType: string;
  quantity: number;
  unit: string;
  currency: string;
  location: { type: 'Point'; coordinates: [number, number]; address: string; countryCode: string; region: string };
  availabilityStart: string;
  availabilityEnd: string;
  seasonality: string[];
  qualityScore: number;
  confidence: number;
  freshness: string;
  composition: {
    moisture: { value: number; unit: '%'; type: 'measured' | 'estimated' | 'inferred' };
    ash: { value: number; unit: '%'; type: 'measured' | 'estimated' | 'inferred' };
    cellulose: { value: number; unit: '%'; type: 'measured' | 'estimated' | 'inferred' };
    hemicellulose: { value: number; unit: '%'; type: 'measured' | 'estimated' | 'inferred' };
    lignin: { value: number; unit: '%'; type: 'measured' | 'estimated' | 'inferred' };
    carbon: { value: number; unit: '%'; type: 'measured' | 'estimated' | 'inferred' };
    nitrogen: { value: number; unit: '%'; type: 'measured' | 'estimated' | 'inferred' };
    cnRatio: { value: number; unit: 'ratio'; type: 'measured' | 'estimated' | 'inferred' };
    energyContent: { value: number; unit: 'GJ/t'; type: 'measured' | 'estimated' | 'inferred' };
    fixedCarbon: { value: number; unit: '%'; type: 'measured' | 'estimated' | 'inferred' };
  };
  provenance: ProvenanceRecord[];
}

export interface ProcessorRecord {
  id: string;
  name: string;
  category: string;
  location: { type: 'Point'; coordinates: [number, number]; address: string; countryCode: string; region: string };
  capabilities: string[];
  supportedResources: string[];
  capacityPerDay: number;
  availableCapacity: number;
  unit: string;
  minimumBatch: number;
  maximumBatch: number;
  energyDemandKwhPerT: number;
  processingCostPerT: number;
  currency: string;
  certifications: string[];
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'IDLE';
  queueDepth: number;
  provenance: ProvenanceRecord[];
}

export interface PathwayRecord {
  id: string;
  name: string;
  category: string;
  primaryTechnology: string;
  conversionEfficiency: number; // e.g. 0.42
  targetProducts: string[];
  economicScore: number;
  technicalFeasibility: number;
  environmentalBenefit: number;
  overallScore: number;
  co2eAvoidedPerTon: number; // kgCO2e/t
  energyGeneratedPerTon: number; // kWh/t
  confidence: number;
  evidenceCount: number;
  freshness: string;
  methodology: string;
  status: 'LIVE' | 'DEMO' | 'CACHED';
  supportedResourceCategories: string[];
}

export interface CircularLoopRecord {
  id: string;
  name: string;
  resourceId: string;
  processorId: string;
  pathwayId: string;
  status: 'ACTIVE' | 'SIMULATED' | 'PROPOSED';
  annualMaterialLoopTons: number;
  carbonOffsetTons: number;
  circularityIndex: number; // 0 - 100
  economicValueAnnual: number;
  currency: string;
  participatingActors: string[];
  nodesCount: number;
}

export const initialDataSources = [
  {
    id: 'fao-stat',
    name: 'FAOSTAT Global Production Database',
    provider: 'Food and Agriculture Organization (UN)',
    type: 'AGRICULTURAL_STATISTICS',
    coverage: '194 Countries',
    records: 4850000,
    freshness: 'Updated 2026-Q1',
    license: 'CC BY-NC-SA 3.0 IGO',
    qualityScore: 98,
    status: 'LIVE' as const,
    lastSync: '2026-10-06T08:30:00Z',
    endpoint: 'https://fenixservices.fao.org/faostat/api/v1'
  },
  {
    id: 'copernicus-s2',
    name: 'Copernicus Sentinel-2 Land Observation',
    provider: 'European Space Agency (ESA)',
    type: 'EARTH_OBSERVATION',
    coverage: 'Global multispectral 10m',
    records: 12400000,
    freshness: 'Updated 4 hours ago',
    license: 'Copernicus Open Access',
    qualityScore: 96,
    status: 'LIVE' as const,
    lastSync: '2026-10-06T12:00:00Z',
    endpoint: 'https://dataspace.copernicus.eu/resto/api'
  },
  {
    id: 'nasa-power',
    name: 'NASA POWER Agroclimatology API',
    provider: 'NASA Langley Research Center',
    type: 'METEOROLOGY_SOLAR',
    coverage: 'Global 0.5 x 0.5 deg',
    records: 890000,
    freshness: 'Daily analysis-ready',
    license: 'NASA Open Data Policy',
    qualityScore: 95,
    status: 'LIVE' as const,
    lastSync: '2026-10-06T06:00:00Z',
    endpoint: 'https://power.larc.nasa.gov/api/temporal/daily'
  },
  {
    id: 'agrifooddata-twin',
    name: 'AgriFoodData Digital Farm Twin',
    provider: 'NaLamKI Interoperability Framework',
    type: 'DIGITAL_TWIN_STA',
    coverage: 'Consortium Pilot Regions',
    records: 420000,
    freshness: 'Streamed sub-hour',
    license: 'Apache-2.0 Open Research',
    qualityScore: 94,
    status: 'LIVE' as const,
    lastSync: '2026-10-06T14:15:00Z',
    endpoint: 'https://api.agrifooddata.eu/v1/sta'
  },
  {
    id: 'agrovoc-thesaurus',
    name: 'AGROVOC Multilingual Agricultural Concept Scheme',
    provider: 'FAO Information Management Team',
    type: 'CONTROLLED_VOCABULARY',
    coverage: '40+ Languages, 41,000+ Concepts',
    records: 41200,
    freshness: 'Monthly Release',
    license: 'CC BY 4.0',
    qualityScore: 99,
    status: 'CACHED' as const,
    lastSync: '2026-10-01T00:00:00Z',
    endpoint: 'https://agrovoc.fao.org/sparql'
  },
  {
    id: 'wb-pink-sheet',
    name: 'World Bank Commodity Markets Pink Sheet',
    provider: 'World Bank Development Prospects Group',
    type: 'MARKET_BENCHMARK',
    coverage: 'Global Commodity Benchmarks',
    records: 62000,
    freshness: 'Updated October 2026',
    license: 'Creative Commons 4.0 International',
    qualityScore: 97,
    status: 'LIVE' as const,
    lastSync: '2026-10-04T10:00:00Z',
    endpoint: 'https://thedocs.worldbank.org/pink-sheet-api'
  }
];

export const initialIntegrations = [
  {
    id: 'int-agrifood-farm',
    name: 'AgriFoodData Farm API Adapter',
    service: 'AgriFoodData',
    endpoint: 'https://api.agrifooddata.eu/v1/farms',
    status: 'LIVE' as const,
    latencyMs: 142,
    recordsCount: 1845,
    errorRate: 0.0,
    license: 'Apache 2.0',
    lastSync: '2026-10-06T14:22:10Z'
  },
  {
    id: 'int-sensorthings',
    name: 'OGC SensorThings Stream',
    service: 'AgriFoodData STA',
    endpoint: 'https://api.agrifooddata.eu/sta/v1.1/Datastreams',
    status: 'LIVE' as const,
    latencyMs: 88,
    recordsCount: 94210,
    errorRate: 0.01,
    license: 'OGC Open Standard',
    lastSync: '2026-10-06T14:48:00Z'
  },
  {
    id: 'int-copernicus',
    name: 'Copernicus Data Space Connector',
    service: 'ESA Sentinel',
    endpoint: 'https://dataspace.copernicus.eu/odata/v1',
    status: 'LIVE' as const,
    latencyMs: 260,
    recordsCount: 5210,
    errorRate: 0.0,
    license: 'Open Access',
    lastSync: '2026-10-06T12:00:00Z'
  },
  {
    id: 'int-fao-flw',
    name: 'FAO Food Loss & Waste DB Connector',
    service: 'FAO Platform',
    endpoint: 'https://www.fao.org/flw-data/api',
    status: 'CACHED' as const,
    latencyMs: 195,
    recordsCount: 39800,
    errorRate: 0.0,
    license: 'CC BY-NC-SA 3.0',
    lastSync: '2026-10-05T09:12:00Z'
  }
];

export const initialResources: ResourceRecord[] = [
  {
    id: 'res-rice-straw-up',
    canonicalConceptId: 'c-rice-straw-cereal',
    name: 'Rice Straw (Paddy Crop Residue)',
    aliases: ['Paddy Straw', 'Pari Straw', 'धान का पुआल', 'Rice Stubble'],
    category: 'Crop Residue',
    sourceType: 'Farm Harvest Post-Combine',
    quantity: 480.0,
    unit: 'tonne',
    currency: 'USD',
    location: {
      type: 'Point',
      coordinates: [80.9462, 26.8467],
      address: 'Barabanki District, Uttar Pradesh',
      countryCode: 'IND',
      region: 'Uttar Pradesh'
    },
    availabilityStart: '2026-10-01',
    availabilityEnd: '2026-12-15',
    seasonality: ['Kharif Season', 'Post-Harvest Window'],
    qualityScore: 84,
    confidence: 91,
    freshness: 'Updated 14 min ago',
    composition: {
      moisture: { value: 12.4, unit: '%', type: 'measured' },
      ash: { value: 17.6, unit: '%', type: 'measured' },
      cellulose: { value: 38.2, unit: '%', type: 'measured' },
      hemicellulose: { value: 24.1, unit: '%', type: 'measured' },
      lignin: { value: 13.8, unit: '%', type: 'measured' },
      carbon: { value: 41.5, unit: '%', type: 'measured' },
      nitrogen: { value: 0.72, unit: '%', type: 'measured' },
      cnRatio: { value: 57.6, unit: 'ratio', type: 'measured' },
      energyContent: { value: 14.2, unit: 'GJ/t', type: 'measured' },
      fixedCarbon: { value: 16.5, unit: '%', type: 'measured' }
    },
    provenance: [
      {
        source: 'Barabanki Agricultural Cooperative Field Batch #2026-K4',
        sourceType: 'LAB_MEASURED',
        retrievedAt: '2026-10-06T14:32:00Z',
        publishedAt: '2026-10-06T12:00:00Z',
        geographicCoverage: 'Barabanki-Lucknow Corridor',
        license: 'AgriFoodData Standard Sensor Protocol',
        qualityScore: 94,
        status: 'LIVE'
      },
      {
        source: 'FAO Agro-Ecological Residue Coefficients (India North)',
        sourceType: 'RESEARCH',
        retrievedAt: '2026-09-20T10:00:00Z',
        publishedAt: '2025-11-01T00:00:00Z',
        geographicCoverage: 'Indo-Gangetic Plain',
        license: 'CC BY 4.0',
        qualityScore: 92,
        status: 'CACHED'
      }
    ]
  },
  {
    id: 'res-sugar-bagasse-br',
    canonicalConceptId: 'c-sugarcane-bagasse',
    name: 'Sugarcane Bagasse Mill Byproduct',
    aliases: ['Bagaço de cana', 'Bagasse Fibre', 'Sugar Mill Residue'],
    category: 'Agro-Industrial Byproduct',
    sourceType: 'Cane Milling Extraction',
    quantity: 1250.0,
    unit: 'tonne',
    currency: 'USD',
    location: {
      type: 'Point',
      coordinates: [-47.8825, -21.1767],
      address: 'Ribeirão Preto Mill Cluster, São Paulo',
      countryCode: 'BRA',
      region: 'São Paulo'
    },
    availabilityStart: '2026-05-01',
    availabilityEnd: '2026-11-30',
    seasonality: ['Safra Milling Cycle', 'Continuous Crushing'],
    qualityScore: 89,
    confidence: 94,
    freshness: 'Updated 28 min ago',
    composition: {
      moisture: { value: 48.0, unit: '%', type: 'measured' },
      ash: { value: 3.8, unit: '%', type: 'measured' },
      cellulose: { value: 44.5, unit: '%', type: 'measured' },
      hemicellulose: { value: 25.8, unit: '%', type: 'measured' },
      lignin: { value: 21.2, unit: '%', type: 'measured' },
      carbon: { value: 47.1, unit: '%', type: 'measured' },
      nitrogen: { value: 0.35, unit: '%', type: 'measured' },
      cnRatio: { value: 134.5, unit: 'ratio', type: 'measured' },
      energyContent: { value: 9.8, unit: 'GJ/t', type: 'measured' },
      fixedCarbon: { value: 18.2, unit: '%', type: 'measured' }
    },
    provenance: [
      {
        source: 'UNICA São Paulo Mill Sensory Telemetry',
        sourceType: 'API',
        retrievedAt: '2026-10-06T14:10:00Z',
        publishedAt: '2026-10-06T13:45:00Z',
        geographicCoverage: 'São Paulo Cane Belt',
        license: 'UNICA Open Data Feed',
        qualityScore: 96,
        status: 'LIVE'
      }
    ]
  },
  {
    id: 'res-coffee-pulp-ke',
    canonicalConceptId: 'c-coffee-cherry-pulp',
    name: 'Coffee Wet-Mill Pulp Residue',
    aliases: ['Coffee Cascara Wet Pulp', 'Kahawa Pulp', 'Wet Mill Cherry Waste'],
    category: 'Fruit & Beverage Residue',
    sourceType: 'Wet Processing Factory',
    quantity: 320.0,
    unit: 'tonne',
    currency: 'USD',
    location: {
      type: 'Point',
      coordinates: [37.0744, -0.4244],
      address: 'Nyeri County Central Mill, Mount Kenya Region',
      countryCode: 'KEN',
      region: 'Nyeri'
    },
    availabilityStart: '2026-10-15',
    availabilityEnd: '2027-01-31',
    seasonality: ['Main Crop Harvest', 'Fly Crop Secondary'],
    qualityScore: 78,
    confidence: 88,
    freshness: 'Updated 45 min ago',
    composition: {
      moisture: { value: 76.5, unit: '%', type: 'measured' },
      ash: { value: 6.2, unit: '%', type: 'measured' },
      cellulose: { value: 28.4, unit: '%', type: 'measured' },
      hemicellulose: { value: 14.1, unit: '%', type: 'measured' },
      lignin: { value: 17.5, unit: '%', type: 'measured' },
      carbon: { value: 44.0, unit: '%', type: 'estimated' },
      nitrogen: { value: 2.1, unit: '%', type: 'measured' },
      cnRatio: { value: 20.9, unit: 'ratio', type: 'measured' },
      energyContent: { value: 6.4, unit: 'GJ/t', type: 'estimated' },
      fixedCarbon: { value: 14.0, unit: '%', type: 'estimated' }
    },
    provenance: [
      {
        source: 'Kenya Coffee Directorate Station Monitor #04',
        sourceType: 'API',
        retrievedAt: '2026-10-06T13:55:00Z',
        publishedAt: '2026-10-06T13:00:00Z',
        geographicCoverage: 'Central Kenya Highlands',
        license: 'KALRO Agro Data License',
        qualityScore: 90,
        status: 'LIVE'
      }
    ]
  },
  {
    id: 'res-spent-grain-eu',
    canonicalConceptId: 'c-brewers-spent-grain',
    name: 'Brewers Spent Grain (BSG)',
    aliases: ['Malt Spent Grain', 'Biertreber', 'Dreche de brasserie'],
    category: 'Fermentation Byproduct',
    sourceType: 'Brewing Lautering Stage',
    quantity: 180.0,
    unit: 'tonne',
    currency: 'EUR',
    location: {
      type: 'Point',
      coordinates: [11.582, 48.1351],
      address: 'Munich Brewing Corridor, Bavaria',
      countryCode: 'DEU',
      region: 'Bavaria'
    },
    availabilityStart: '2026-01-01',
    availabilityEnd: '2026-12-31',
    seasonality: ['Continuous Year-Round'],
    qualityScore: 92,
    confidence: 96,
    freshness: 'Updated 8 min ago',
    composition: {
      moisture: { value: 72.0, unit: '%', type: 'measured' },
      ash: { value: 4.5, unit: '%', type: 'measured' },
      cellulose: { value: 22.0, unit: '%', type: 'measured' },
      hemicellulose: { value: 28.5, unit: '%', type: 'measured' },
      lignin: { value: 15.0, unit: '%', type: 'measured' },
      carbon: { value: 46.2, unit: '%', type: 'measured' },
      nitrogen: { value: 3.4, unit: '%', type: 'measured' },
      cnRatio: { value: 13.6, unit: 'ratio', type: 'measured' },
      energyContent: { value: 8.2, unit: 'GJ/t', type: 'measured' },
      fixedCarbon: { value: 12.0, unit: '%', type: 'measured' }
    },
    provenance: [
      {
        source: 'Bavarian Bioeconomy Cluster Quality Lab',
        sourceType: 'LAB_MEASURED',
        retrievedAt: '2026-10-06T14:40:00Z',
        publishedAt: '2026-10-06T14:00:00Z',
        geographicCoverage: 'Southern Germany',
        license: 'EU Bio-Based Industries Consortium',
        qualityScore: 98,
        status: 'LIVE'
      }
    ]
  },
  {
    id: 'res-rice-husk-sea',
    canonicalConceptId: 'c-rice-husk-hull',
    name: 'Rice Husk Mill Byproduct',
    aliases: ['Sekam Padi', 'Rice Chaff', 'Hull Biomass'],
    category: 'Milling Byproduct',
    sourceType: 'Paddy De-husking Plant',
    quantity: 640.0,
    unit: 'tonne',
    currency: 'USD',
    location: {
      type: 'Point',
      coordinates: [100.5018, 13.7563],
      address: 'Central Plains Milling Belt, Ayutthaya Basin',
      countryCode: 'THA',
      region: 'Central Thailand'
    },
    availabilityStart: '2026-09-01',
    availabilityEnd: '2027-02-28',
    seasonality: ['Wet Season Harvest Peak'],
    qualityScore: 91,
    confidence: 93,
    freshness: 'Updated 22 min ago',
    composition: {
      moisture: { value: 10.5, unit: '%', type: 'measured' },
      ash: { value: 19.8, unit: '%', type: 'measured' },
      cellulose: { value: 34.2, unit: '%', type: 'measured' },
      hemicellulose: { value: 21.0, unit: '%', type: 'measured' },
      lignin: { value: 20.4, unit: '%', type: 'measured' },
      carbon: { value: 39.5, unit: '%', type: 'measured' },
      nitrogen: { value: 0.54, unit: '%', type: 'measured' },
      cnRatio: { value: 73.1, unit: 'ratio', type: 'measured' },
      energyContent: { value: 15.1, unit: 'GJ/t', type: 'measured' },
      fixedCarbon: { value: 15.2, unit: '%', type: 'measured' }
    },
    provenance: [
      {
        source: 'ASEAN Agri-Trade Biomass Registry',
        sourceType: 'API',
        retrievedAt: '2026-10-06T14:15:00Z',
        publishedAt: '2026-10-06T13:30:00Z',
        geographicCoverage: 'Mekong River Basin',
        license: 'Open ASEAN Ag Registry',
        qualityScore: 95,
        status: 'LIVE'
      }
    ]
  }
];

export const initialProcessors: ProcessorRecord[] = [
  {
    id: 'proc-up-biochar',
    name: 'Ganga Valley Pyrolysis & Biochar Facility',
    category: 'Pyrolysis & Carbon Sequestration',
    location: {
      type: 'Point',
      coordinates: [81.1215, 26.912],
      address: 'Industrial Zone B, Barabanki, UP',
      countryCode: 'IND',
      region: 'Uttar Pradesh'
    },
    capabilities: ['Slow Pyrolysis', 'Activated Carbon Refining', 'High-Purity Biochar Pelleting'],
    supportedResources: ['Crop Residue', 'Milling Byproduct', 'Wood Residue'],
    capacityPerDay: 85.0,
    availableCapacity: 48.0,
    unit: 'tonne/day',
    minimumBatch: 5.0,
    maximumBatch: 120.0,
    energyDemandKwhPerT: 42.0,
    processingCostPerT: 28.5,
    currency: 'USD',
    certifications: ['EBC (European Biochar Certificate)', 'Verra Carbon Standard VM0044', 'ISO 14001'],
    status: 'OPERATIONAL',
    queueDepth: 2,
    provenance: [
      {
        source: 'National Clean Energy & Bioeconomy Audit Register',
        sourceType: 'API',
        retrievedAt: '2026-10-06T14:45:00Z',
        publishedAt: '2026-10-01T00:00:00Z',
        geographicCoverage: 'India North Region',
        license: 'Govt Registry Open Access',
        qualityScore: 97,
        status: 'LIVE'
      }
    ]
  },
  {
    id: 'proc-up-cbg-plant',
    name: 'Lucknow Compressed Bio-Gas (CBG) Refinery',
    category: 'Anaerobic Digestion & Biomethane',
    location: {
      type: 'Point',
      coordinates: [80.892, 26.785],
      address: 'SATAT Bioenergy Hub, Lucknow Rural',
      countryCode: 'IND',
      region: 'Uttar Pradesh'
    },
    capabilities: ['CSTR Anaerobic Digestion', 'PSA Biomethane Scrubbing', 'Fermented Organic Manure Pelleting'],
    supportedResources: ['Crop Residue', 'Fermentation Byproduct', 'Manure'],
    capacityPerDay: 120.0,
    availableCapacity: 65.0,
    unit: 'tonne/day',
    minimumBatch: 10.0,
    maximumBatch: 250.0,
    energyDemandKwhPerT: 18.0,
    processingCostPerT: 32.0,
    currency: 'USD',
    certifications: ['SATAT Scheme Certified', 'BIS 16087 Biomethane Standard'],
    status: 'OPERATIONAL',
    queueDepth: 3,
    provenance: [
      {
        source: 'SATAT National Portal Realtime Feed',
        sourceType: 'API',
        retrievedAt: '2026-10-06T14:20:00Z',
        publishedAt: '2026-10-06T12:00:00Z',
        geographicCoverage: 'Uttar Pradesh',
        license: 'Ministry of Petroleum & Natural Gas Data',
        qualityScore: 95,
        status: 'LIVE'
      }
    ]
  },
  {
    id: 'proc-br-biorefinery',
    name: 'Ribeirão 2G Cellulosic Ethanol & Lignin Plant',
    category: 'Biochemical Fractionation',
    location: {
      type: 'Point',
      coordinates: [-47.92, -21.21],
      address: 'Bio-hub SP-330, Ribeirão Preto',
      countryCode: 'BRA',
      region: 'São Paulo'
    },
    capabilities: ['Enzymatic Hydrolysis', '2G Bioethanol Distillation', 'Industrial Lignin Extraction'],
    supportedResources: ['Agro-Industrial Byproduct', 'Crop Residue'],
    capacityPerDay: 240.0,
    availableCapacity: 92.0,
    unit: 'tonne/day',
    minimumBatch: 20.0,
    maximumBatch: 500.0,
    energyDemandKwhPerT: 35.0,
    processingCostPerT: 41.0,
    currency: 'USD',
    certifications: ['RenovaBio Decarbonization Credit', 'ISCC Plus'],
    status: 'OPERATIONAL',
    queueDepth: 1,
    provenance: [
      {
        source: 'RenovaBio Official Compliance Telemetry',
        sourceType: 'API',
        retrievedAt: '2026-10-06T14:00:00Z',
        publishedAt: '2026-10-06T10:00:00Z',
        geographicCoverage: 'São Paulo State',
        license: 'ANP Open Data Policy',
        qualityScore: 96,
        status: 'LIVE'
      }
    ]
  },
  {
    id: 'proc-ke-insect-protein',
    name: 'Mount Kenya Bio-Nutrient & Black Soldier Fly Facility',
    category: 'Bioconversion & Insect Protein',
    location: {
      type: 'Point',
      coordinates: [37.112, -0.45],
      address: 'Nyeri Circular Agro-Park, Kenya',
      countryCode: 'KEN',
      region: 'Nyeri'
    },
    capabilities: ['BSFL Bioconversion', 'Insect Meal Milling', 'Organic Frass Biofertilizer'],
    supportedResources: ['Fruit & Beverage Residue', 'Fermentation Byproduct'],
    capacityPerDay: 40.0,
    availableCapacity: 22.0,
    unit: 'tonne/day',
    minimumBatch: 2.0,
    maximumBatch: 50.0,
    energyDemandKwhPerT: 14.0,
    processingCostPerT: 22.0,
    currency: 'USD',
    certifications: ['KEBS Standard KS 2715', 'Global G.A.P. Sub-certificate'],
    status: 'OPERATIONAL',
    queueDepth: 0,
    provenance: [
      {
        source: 'Kenya Organic Agriculture Network',
        sourceType: 'LAB_MEASURED',
        retrievedAt: '2026-10-06T13:30:00Z',
        publishedAt: '2026-10-01T00:00:00Z',
        geographicCoverage: 'Kenya Highlands',
        license: 'KOAN Standard Registry',
        qualityScore: 93,
        status: 'LIVE'
      }
    ]
  },
  {
    id: 'proc-eu-protein-extraction',
    name: 'Bavaria Circular Protein & Fiber Extraction Center',
    category: 'Food-Grade Upcycling',
    location: {
      type: 'Point',
      coordinates: [11.62, 48.16],
      address: 'Isar Bio-Valley Park, Garching',
      countryCode: 'DEU',
      region: 'Bavaria'
    },
    capabilities: ['Mild Alkaline Protein Extraction', 'Dietary Fiber Micronization', 'Beta-Glucan Separation'],
    supportedResources: ['Fermentation Byproduct', 'Milling Byproduct'],
    capacityPerDay: 60.0,
    availableCapacity: 28.0,
    unit: 'tonne/day',
    minimumBatch: 5.0,
    maximumBatch: 100.0,
    energyDemandKwhPerT: 55.0,
    processingCostPerT: 72.0,
    currency: 'EUR',
    certifications: ['FSSC 22000 Food Safety', 'EU Organic Regulation 2018/848'],
    status: 'OPERATIONAL',
    queueDepth: 2,
    provenance: [
      {
        source: 'Fraunhofer IVV Upcycling Validation Registry',
        sourceType: 'LAB_MEASURED',
        retrievedAt: '2026-10-06T14:15:00Z',
        publishedAt: '2026-10-06T11:00:00Z',
        geographicCoverage: 'Germany & Alpine Region',
        license: 'Fraunhofer Open Consortium',
        qualityScore: 99,
        status: 'LIVE'
      }
    ]
  }
];

export const initialPathways: PathwayRecord[] = [
  {
    id: 'pw-biochar-pyrolysis',
    name: 'Slow Pyrolysis to Carbon-Negative Biochar',
    category: 'Carbon Sequestration & Soil Health',
    primaryTechnology: 'Continuous Retort Slow Pyrolysis (550°C, 30 min residence)',
    conversionEfficiency: 0.35,
    targetProducts: ['Refined Soil Biochar', 'Pyroligneous Acid (Wood Vinegar)', 'Syngas Recycled Heat'],
    economicScore: 89,
    technicalFeasibility: 94,
    environmentalBenefit: 96,
    overallScore: 92,
    co2eAvoidedPerTon: 1480.0, // kgCO2e/t
    energyGeneratedPerTon: 340.0, // kWh/t equivalent
    confidence: 94,
    evidenceCount: 12,
    freshness: 'Validated October 2026',
    methodology: 'IPCC 2019 Refinement Tier 2 + EBC Guidelines',
    status: 'LIVE',
    supportedResourceCategories: ['Crop Residue', 'Milling Byproduct', 'Wood Residue']
  },
  {
    id: 'pw-cbg-biomethane',
    name: 'Anaerobic Digestion to Compressed Bio-Gas (CBG)',
    category: 'Renewable Gas & Bio-fertilizer',
    primaryTechnology: 'Thermophilic CSTR Digestion with Membrane Scrubbing',
    conversionEfficiency: 0.52,
    targetProducts: ['Compressed Bio-Gas (96% CH4)', 'Fermented Liquid Organic Manure (FOM)'],
    economicScore: 87,
    technicalFeasibility: 91,
    environmentalBenefit: 89,
    overallScore: 88,
    co2eAvoidedPerTon: 840.0,
    energyGeneratedPerTon: 620.0,
    confidence: 92,
    evidenceCount: 9,
    freshness: 'Validated October 2026',
    methodology: 'FAO EX-ACT VC Value Chain Methodology',
    status: 'LIVE',
    supportedResourceCategories: ['Crop Residue', 'Fruit & Beverage Residue', 'Fermentation Byproduct']
  },
  {
    id: 'pw-densified-pellets',
    name: 'Biomass Densification to Industrial Fuel Pellets',
    category: 'Coal Replacement & Clean Heat',
    primaryTechnology: 'Hammer Milling, Conditioning and High-Pressure Ring-Die Pelleting',
    conversionEfficiency: 0.92,
    targetProducts: ['White/Brown Industrial Biomass Pellets (16.5 MJ/kg)'],
    economicScore: 81,
    technicalFeasibility: 96,
    environmentalBenefit: 78,
    overallScore: 84,
    co2eAvoidedPerTon: 680.0,
    energyGeneratedPerTon: 1200.0,
    confidence: 95,
    evidenceCount: 8,
    freshness: 'Validated September 2026',
    methodology: 'ISO 17225 Solid Biofuels Standard',
    status: 'LIVE',
    supportedResourceCategories: ['Crop Residue', 'Milling Byproduct']
  },
  {
    id: 'pw-insect-bioconversion',
    name: 'Black Soldier Fly Bioconversion to Animal Protein',
    category: 'Circular Protein & Frass Fertilizer',
    primaryTechnology: 'Controlled Larval Bioreactor Vertical Farming',
    conversionEfficiency: 0.22,
    targetProducts: ['Dried Defatted Insect Meal (55% Crude Protein)', 'Organic Frass Biofertilizer'],
    economicScore: 92,
    technicalFeasibility: 85,
    environmentalBenefit: 91,
    overallScore: 89,
    co2eAvoidedPerTon: 1120.0,
    energyGeneratedPerTon: 180.0,
    confidence: 89,
    evidenceCount: 7,
    freshness: 'Validated October 2026',
    methodology: 'LCA Agribalyse 3.1 & Wageningen Insect Benchmark',
    status: 'LIVE',
    supportedResourceCategories: ['Fruit & Beverage Residue', 'Fermentation Byproduct']
  },
  {
    id: 'pw-microbial-compost',
    name: 'Enzyme-Accelerated Aerobic Composting',
    category: 'Soil Amendment & Humus Recovery',
    primaryTechnology: 'Forced-Aeration Static Windrow with Biological Inoculation',
    conversionEfficiency: 0.55,
    targetProducts: ['Humic-Rich Certified Organic Compost', 'Liquid Bio-Stimulant'],
    economicScore: 74,
    technicalFeasibility: 97,
    environmentalBenefit: 82,
    overallScore: 81,
    co2eAvoidedPerTon: 420.0,
    energyGeneratedPerTon: 40.0,
    confidence: 96,
    evidenceCount: 14,
    freshness: 'Validated October 2026',
    methodology: 'FAO Composting Manual & IPCC Waste Sector Tier 1',
    status: 'LIVE',
    supportedResourceCategories: ['Crop Residue', 'Fruit & Beverage Residue', 'Fermentation Byproduct']
  }
];

export const initialCircularLoops: CircularLoopRecord[] = [
  {
    id: 'loop-ganga-biochar',
    name: 'Indo-Gangetic Paddy Straw → Biochar → Soil Carbon Sequestration Loop',
    resourceId: 'res-rice-straw-up',
    processorId: 'proc-up-biochar',
    pathwayId: 'pw-biochar-pyrolysis',
    status: 'ACTIVE',
    annualMaterialLoopTons: 14800,
    carbonOffsetTons: 21900,
    circularityIndex: 94.2,
    economicValueAnnual: 421800,
    currency: 'USD',
    participatingActors: ['Barabanki FPO Collective', 'Ganga Pyrolysis Ltd', 'Regional Fertilizer Co-op'],
    nodesCount: 7
  },
  {
    id: 'loop-sao-paulo-cane',
    name: 'São Paulo Bagasse → 2G Biorefinery → Soil Lignosulfonate Loop',
    resourceId: 'res-sugar-bagasse-br',
    processorId: 'proc-br-biorefinery',
    pathwayId: 'pw-cbg-biomethane',
    status: 'ACTIVE',
    annualMaterialLoopTons: 62000,
    carbonOffsetTons: 52080,
    circularityIndex: 91.5,
    economicValueAnnual: 1840000,
    currency: 'USD',
    participatingActors: ['UNICA Mill Consortium', 'Raízen Tech', 'State Agricultural Extension'],
    nodesCount: 9
  },
  {
    id: 'loop-nyeri-cascara',
    name: 'Mount Kenya Cascara → Insect Protein & Soil Frass Circular Loop',
    resourceId: 'res-coffee-pulp-ke',
    processorId: 'proc-ke-insect-protein',
    pathwayId: 'pw-insect-bioconversion',
    status: 'SIMULATED',
    annualMaterialLoopTons: 4200,
    carbonOffsetTons: 4704,
    circularityIndex: 88.7,
    economicValueAnnual: 189000,
    currency: 'USD',
    participatingActors: ['Nyeri Farmers Co-op', 'Kenya Insect Works', 'Central Aquafeed Mill'],
    nodesCount: 6
  }
];

export const initialAIServices = [
  {
    id: 'srv-semantic-resolver',
    name: 'Resource Semantic Concept Resolver',
    category: 'Ontology & Semantic Normalization',
    version: '2.4.1',
    description: 'Resolves raw multilingual farm inputs and colloquial trade names into canonical AGROVOC concepts and standard bioeconomy taxonomy.',
    health: 'HEALTHY' as const,
    avgLatencyMs: 94,
    executionsCount: 14280,
    schema: {
      type: 'object',
      properties: {
        rawTerm: { type: 'string', title: 'Raw Biomass Term', description: 'Colloquial or regional crop name (e.g. paddy straw, bagaço, cascara)' },
        locale: { type: 'string', title: 'Source Locale', default: 'en' },
        countryCode: { type: 'string', title: 'Country Code (ISO 3166-1 alpha-3)', default: 'IND' }
      },
      required: ['rawTerm']
    }
  },
  {
    id: 'srv-pathway-optimizer',
    name: 'Multi-Objective Pathway Feasibility Engine',
    category: 'Optimization & Feasibility',
    version: '3.1.0',
    description: 'Computes Pareto-optimal circular pathways factoring carbon abatement, local gate price, moisture penalization, and transport logistics.',
    health: 'HEALTHY' as const,
    avgLatencyMs: 145,
    executionsCount: 9840,
    schema: {
      type: 'object',
      properties: {
        resourceId: { type: 'string', title: 'Target Resource ID' },
        quantity: { type: 'number', title: 'Biomass Quantity (tonnes)', minimum: 1 },
        maxRadiusKm: { type: 'number', title: 'Logistics Search Radius (km)', default: 100 },
        carbonWeight: { type: 'number', title: 'Environmental Weight (0 - 1)', default: 0.4 },
        economicWeight: { type: 'number', title: 'Economic Weight (0 - 1)', default: 0.6 }
      },
      required: ['resourceId', 'quantity']
    }
  },
  {
    id: 'srv-logistics-router',
    name: 'Green Freight Logistics Optimizer',
    category: 'Spatial Routing & Carbon Minimization',
    version: '1.9.3',
    description: 'Determines optimal haulage corridors, vehicle payloads, multi-stop consolidations, and transport-induced GHG footprints.',
    health: 'HEALTHY' as const,
    avgLatencyMs: 120,
    executionsCount: 8120,
    schema: {
      type: 'object',
      properties: {
        originCoords: { type: 'array', items: { type: 'number' }, title: 'Origin [Lng, Lat]' },
        destinationCoords: { type: 'array', items: { type: 'number' }, title: 'Destination [Lng, Lat]' },
        payloadTons: { type: 'number', title: 'Payload (tonnes)' },
        vehicleType: { type: 'string', enum: ['ELECTRIC_TRUCK', 'DIESEL_HEAVY_TRUCK', 'TRACTOR_TROLLEY'], default: 'DIESEL_HEAVY_TRUCK' }
      },
      required: ['originCoords', 'destinationCoords', 'payloadTons']
    }
  },
  {
    id: 'srv-impact-calculator',
    name: 'FAO EX-ACT Carbon & Bioeconomy LCA Calculator',
    category: 'Life Cycle Assessment & Climate Impact',
    version: '2.0.0',
    description: 'Calculates verified net emission offsets (Scope 1, 2, 3), avoided burning, soil organic carbon accretion, and bio-nutrient recovery.',
    health: 'HEALTHY' as const,
    avgLatencyMs: 110,
    executionsCount: 11450,
    schema: {
      type: 'object',
      properties: {
        resourceId: { type: 'string', title: 'Resource ID' },
        pathwayId: { type: 'string', title: 'Pathway ID' },
        quantityTons: { type: 'number', title: 'Quantity in Tonnes' },
        avoidedPractice: { type: 'string', enum: ['OPEN_FIELD_BURNING', 'LANDFILL_ANAEROBIC', 'UNMANAGED_DUMPING'], default: 'OPEN_FIELD_BURNING' }
      },
      required: ['resourceId', 'pathwayId', 'quantityTons']
    }
  }
];

export const initialAIExecutions = [
  {
    id: 'exec-849201',
    serviceId: 'srv-semantic-resolver',
    status: 'COMPLETED' as const,
    durationMs: 92,
    confidence: 96,
    inputRef: 'term: "धान का पुआल" (paddy straw)',
    outputRef: 'concept: c-rice-straw-cereal (AGROVOC ID: 24719)',
    dataSources: ['AGROVOC SPARQL', 'AgriFoodData Ontology'],
    createdAt: '2026-10-06T14:30:12Z',
    trace: [
      { step: 'Ingest user input token sequence', durationMs: 4, status: 'OK' },
      { step: 'Multilingual lemmatization & script detection (Devanagari)', durationMs: 18, status: 'OK' },
      { step: 'AGROVOC SPARQL endpoint graph match', durationMs: 42, status: 'OK' },
      { step: 'Biomass physical properties schema enrichment', durationMs: 28, status: 'OK' }
    ]
  },
  {
    id: 'exec-849202',
    serviceId: 'srv-pathway-optimizer',
    status: 'COMPLETED' as const,
    durationMs: 148,
    confidence: 94,
    inputRef: 'resource: res-rice-straw-up, quantity: 480t',
    outputRef: 'pathway: pw-biochar-pyrolysis (Score 92/100, Net Value +$41,280)',
    dataSources: ['FAO EX-ACT VC', 'PostGIS Nearest Facility Matrix', 'EBC Emission Benchmarks'],
    createdAt: '2026-10-06T14:30:15Z',
    trace: [
      { step: 'Query spatial cluster surrounding origin point', durationMs: 22, status: 'OK' },
      { step: 'Extract measured moisture (12.4%) & ash (17.6%) matrix', durationMs: 15, status: 'OK' },
      { step: 'Evaluate candidate thermodynamic conversion yields', durationMs: 51, status: 'OK' },
      { step: 'Solve multi-objective Pareto optimization frontier', durationMs: 60, status: 'OK' }
    ]
  }
];

export const initialScenarios = [
  {
    id: 'scen-baseline-up',
    name: 'Baseline 2026: Uttar Pradesh Harvest Mobilization',
    description: 'Current collection rate at 480 tonnes with regional logistics and prevailing gate prices.',
    resourceId: 'res-rice-straw-up',
    baseline: {
      quantity: 480.0,
      transportCostTotal: 3420.0,
      co2eAvoidedTotal: 710.4,
      economicValueTotal: 41280.0,
      recoveryRate: 64.0
    },
    parameters: {
      quantityMultiplier: 1.0,
      transportCostMultiplier: 1.0,
      moistureDeltaPercent: 0.0,
      carbonPricePerTon: 35.0
    },
    status: 'COMPLETED' as const,
    createdAt: '2026-10-06T10:00:00Z'
  },
  {
    id: 'scen-scaled-collection',
    name: 'Scenario Alpha: +40% FPO Aggregation with EV Freight',
    description: 'Evaluating impact if FPO aggregation scales to 672 tonnes and diesel freight is transitioned to electric logistics.',
    resourceId: 'res-rice-straw-up',
    baseline: {
      quantity: 480.0,
      transportCostTotal: 3420.0,
      co2eAvoidedTotal: 710.4,
      economicValueTotal: 41280.0,
      recoveryRate: 64.0
    },
    parameters: {
      quantityMultiplier: 1.4,
      transportCostMultiplier: 0.85,
      moistureDeltaPercent: -2.0,
      carbonPricePerTon: 45.0
    },
    status: 'COMPLETED' as const,
    createdAt: '2026-10-06T12:15:00Z'
  }
];

export const initialKnowledgeArticles = [
  {
    id: 'know-biochar-soil-agri',
    title: 'Biochar Application in Cereal Agro-Ecosystems: Carbon Sequestration and Nutrient Retention',
    source: 'FAO Land and Water Research / Frontiers in Sustainable Food Systems',
    publicationDate: '2025-08-14',
    resource: 'Rice Straw',
    process: 'Slow Pyrolysis',
    conditions: 'Pyrolysis temperature 500-600°C; Soil incorporation 5-10 t/ha',
    output: 'Soil Organic Carbon +38%, Fertilizer Nitrogen Leaching -24%, Crop Yield +8.2%',
    geography: 'South & Southeast Asia (Indo-Gangetic Plain, Mekong Basin)',
    citation: 'Lehmann, J., et al. (2025). Biochar stability and carbon permanence in tropical agriculture. Global Change Biology, 31(4), 1021-1038.',
    doi: '10.1016/j.jclepro.2025.139481',
    confidence: 96
  },
  {
    id: 'know-cbg-satat-model',
    title: 'Techno-Economic and Lifecycle Assessment of CBG from Agricultural Straws under SATAT Framework',
    source: 'International Journal of Hydrogen Energy / CSIR National Environmental Engineering',
    publicationDate: '2026-02-11',
    resource: 'Paddy Crop Residue',
    process: 'Anaerobic Digestion with Pressure Swing Adsorption',
    conditions: 'Mesophilic CSTR, 28-day HRT, 96.5% Methane Purity',
    output: '65 kg CBG + 180 kg Fermented Organic Manure per tonne fresh straw',
    geography: 'India (Punjab, Haryana, Uttar Pradesh)',
    citation: 'Kumar, R., & Singh, P. (2026). Decentralized biomethane infrastructure for stubble burning mitigation. Bioresource Technology, 402, 130712.',
    doi: '10.1016/j.biortech.2026.130712',
    confidence: 94
  },
  {
    id: 'know-cascara-bsf-upcycling',
    title: 'Bioconversion of Coffee Pulp and Wet Mill Residues Using Black Soldier Fly Larvae (Hermetia illucens)',
    source: 'Journal of Cleaner Production / Wageningen University & Research',
    publicationDate: '2025-11-20',
    resource: 'Coffee Cherry Cascara',
    process: 'Larval Digestion in Continuous Rearing Bins',
    conditions: 'Substrate moisture adjusted to 70%, 14-day larval cycle, 28°C',
    output: 'Biomass Reduction 68%, Insect Protein Meal 22% yield, High-P Biofrass',
    geography: 'East Africa & Central America',
    citation: 'Van Huis, A., & Oonincx, D. (2025). Insects as food and feed: Circular nutrient conversion. Annu. Rev. Entomol., 70, 421-440.',
    doi: '10.1146/annurev-ento-2025-0421',
    confidence: 93
  }
];
