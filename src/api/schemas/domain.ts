import { z } from 'zod';

export const ProvenanceSchema = z.object({
  source: z.string(),
  sourceType: z.string(),
  retrievedAt: z.string(),
  publishedAt: z.string(),
  geographicCoverage: z.string(),
  license: z.string(),
  qualityScore: z.number(),
  status: z.enum(['LIVE', 'DEMO', 'CACHED', 'STALE', 'ERROR']).default('LIVE')
});

export const GeoPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
  address: z.string().optional(),
  countryCode: z.string().optional(),
  region: z.string().optional()
});

export const CompositionPropSchema = z.object({
  value: z.number(),
  unit: z.string(),
  type: z.enum(['measured', 'estimated', 'inferred', 'unknown']).default('measured')
});

export const ResourceSchema = z.object({
  id: z.string(),
  canonicalConceptId: z.string().optional(),
  name: z.string(),
  aliases: z.array(z.string()).default([]),
  category: z.string(),
  sourceType: z.string(),
  quantity: z.number(),
  unit: z.string(),
  currency: z.string().default('USD'),
  location: GeoPointSchema,
  availabilityStart: z.string().optional(),
  availabilityEnd: z.string().optional(),
  seasonality: z.array(z.string()).optional(),
  qualityScore: z.number().default(80),
  confidence: z.number().default(90),
  freshness: z.string().default('Just now'),
  composition: z.object({
    moisture: CompositionPropSchema,
    ash: CompositionPropSchema,
    cellulose: CompositionPropSchema.optional(),
    hemicellulose: CompositionPropSchema.optional(),
    lignin: CompositionPropSchema.optional(),
    carbon: CompositionPropSchema.optional(),
    nitrogen: CompositionPropSchema.optional(),
    cnRatio: CompositionPropSchema.optional(),
    energyContent: CompositionPropSchema.optional(),
    fixedCarbon: CompositionPropSchema.optional()
  }).passthrough(),
  provenance: z.array(ProvenanceSchema).default([])
});

export const ProcessorSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  location: GeoPointSchema,
  capabilities: z.array(z.string()).default([]),
  supportedResources: z.array(z.string()).default([]),
  capacityPerDay: z.number(),
  availableCapacity: z.number(),
  unit: z.string(),
  minimumBatch: z.number().optional(),
  maximumBatch: z.number().optional(),
  energyDemandKwhPerT: z.number().optional(),
  processingCostPerT: z.number().optional(),
  currency: z.string().default('USD'),
  certifications: z.array(z.string()).default([]),
  status: z.enum(['OPERATIONAL', 'MAINTENANCE', 'IDLE']).default('OPERATIONAL'),
  queueDepth: z.number().default(0),
  provenance: z.array(ProvenanceSchema).default([])
});

export const PathwaySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  primaryTechnology: z.string(),
  conversionEfficiency: z.number(),
  targetProducts: z.array(z.string()).default([]),
  economicScore: z.number(),
  technicalFeasibility: z.number(),
  environmentalBenefit: z.number(),
  overallScore: z.number(),
  co2eAvoidedPerTon: z.number(),
  energyGeneratedPerTon: z.number(),
  confidence: z.number(),
  evidenceCount: z.number(),
  freshness: z.string(),
  methodology: z.string(),
  status: z.enum(['LIVE', 'DEMO', 'CACHED']).default('LIVE'),
  supportedResourceCategories: z.array(z.string()).default([])
});

export const CircularLoopSchema = z.object({
  id: z.string(),
  name: z.string(),
  resourceId: z.string(),
  processorId: z.string(),
  pathwayId: z.string(),
  status: z.enum(['ACTIVE', 'SIMULATED', 'PROPOSED']),
  annualMaterialLoopTons: z.number(),
  carbonOffsetTons: z.number(),
  circularityIndex: z.number(),
  economicValueAnnual: z.number(),
  currency: z.string().default('USD'),
  participatingActors: z.array(z.string()).default([]),
  nodesCount: z.number().default(5)
});

export const AIServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  version: z.string(),
  description: z.string(),
  health: z.enum(['HEALTHY', 'DEGRADED', 'UNAVAILABLE']).default('HEALTHY'),
  avgLatencyMs: z.number(),
  executionsCount: z.number(),
  schema: z.record(z.string(), z.any())
});

export const AIExecutionSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']),
  durationMs: z.number(),
  confidence: z.number(),
  inputRef: z.string(),
  outputRef: z.string(),
  dataSources: z.array(z.string()).default([]),
  createdAt: z.string(),
  trace: z.array(z.object({
    step: z.string(),
    durationMs: z.number(),
    status: z.string()
  })).default([])
});

export const DataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  type: z.string(),
  coverage: z.string(),
  records: z.number(),
  freshness: z.string(),
  license: z.string(),
  qualityScore: z.number(),
  status: z.enum(['LIVE', 'DEMO', 'CACHED', 'STALE']),
  lastSync: z.string(),
  endpoint: z.string()
});

export const IntegrationSchema = z.object({
  id: z.string(),
  name: z.string(),
  service: z.string(),
  endpoint: z.string(),
  status: z.enum(['LIVE', 'DEMO', 'CACHED', 'STALE', 'ERROR']),
  latencyMs: z.number(),
  recordsCount: z.number(),
  errorRate: z.number(),
  license: z.string(),
  lastSync: z.string()
});

export const ScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  resourceId: z.string(),
  baseline: z.object({
    quantity: z.number(),
    transportCostTotal: z.number(),
    co2eAvoidedTotal: z.number(),
    economicValueTotal: z.number(),
    recoveryRate: z.number()
  }),
  parameters: z.object({
    quantityMultiplier: z.number(),
    transportCostMultiplier: z.number(),
    moistureDeltaPercent: z.number(),
    carbonPricePerTon: z.number()
  }),
  status: z.enum(['COMPLETED', 'RUNNING', 'DRAFT']),
  createdAt: z.string()
});

export const KnowledgeArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string(),
  publicationDate: z.string(),
  resource: z.string(),
  process: z.string(),
  conditions: z.string(),
  output: z.string(),
  geography: z.string(),
  citation: z.string(),
  doi: z.string().optional(),
  confidence: z.number().default(90)
});

export type Resource = z.infer<typeof ResourceSchema>;
export type Processor = z.infer<typeof ProcessorSchema>;
export type Pathway = z.infer<typeof PathwaySchema>;
export type CircularLoop = z.infer<typeof CircularLoopSchema>;
export type AIService = z.infer<typeof AIServiceSchema>;
export type AIExecution = z.infer<typeof AIExecutionSchema>;
export type DataSource = z.infer<typeof DataSourceSchema>;
export type Integration = z.infer<typeof IntegrationSchema>;
export type Scenario = z.infer<typeof ScenarioSchema>;
export type KnowledgeArticle = z.infer<typeof KnowledgeArticleSchema>;
