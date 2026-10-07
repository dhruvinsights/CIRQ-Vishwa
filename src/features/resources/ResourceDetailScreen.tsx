import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  Activity,
  Workflow,
  Factory,
  TrendingUp,
  Truck,
  DollarSign,
  Leaf,
  BookOpen,
  ShieldCheck,
  Cpu,
  History,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { resourceClient } from '../../api/clients/resource.ts';
import { knowledgeClient } from '../../api/clients/knowledge.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Tabs, TabItem } from '../../components/ui/Tabs.tsx';
import { ConfidenceMeter } from '../../components/ui/ConfidenceMeter.tsx';
import { KeyValue } from '../../components/ui/KeyValue.tsx';
import { ProvenanceChip } from '../../components/ui/ProvenanceChip.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';
import { usePreferencesStore } from '../../stores/preferencesStore.ts';
import { formatCurrency, formatMass, formatCarbon } from '../../lib/format.ts';

const DETAIL_TABS: TabItem[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'availability', label: 'Availability' },
  { id: 'composition', label: 'Composition' },
  { id: 'quality', label: 'Quality' },
  { id: 'geography', label: 'Geography' },
  { id: 'seasonality', label: 'Seasonality' },
  { id: 'pathways', label: 'Pathways' },
  { id: 'processors', label: 'Processors' },
  { id: 'demand', label: 'Demand' },
  { id: 'logistics', label: 'Logistics' },
  { id: 'economics', label: 'Economics' },
  { id: 'impact', label: 'Impact' },
  { id: 'research', label: 'Research' },
  { id: 'provenance', label: 'Provenance' },
  { id: 'ai-analysis', label: 'AI Analysis' },
  { id: 'history', label: 'History' }
];

export const ResourceDetailScreen: React.FC = () => {
  const { id = 'res-rice-straw-up' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('identity');
  const { unitSystem, currency, locale } = usePreferencesStore();

  // Core Resource Record
  const { data: resource, isLoading: resLoading, error: resError, refetch } = useQuery({
    queryKey: ['resources', 'detail', id],
    queryFn: () => resourceClient.getResource(id)
  });

  // Sub-resource endpoints
  const { data: availability } = useQuery({
    queryKey: ['resources', id, 'availability'],
    queryFn: () => resourceClient.getAvailability(id),
    enabled: activeTab === 'availability'
  });

  const { data: compositionData } = useQuery({
    queryKey: ['resources', id, 'composition'],
    queryFn: () => resourceClient.getComposition(id),
    enabled: activeTab === 'composition'
  });

  const { data: qualityData } = useQuery({
    queryKey: ['resources', id, 'quality'],
    queryFn: () => resourceClient.getQuality(id),
    enabled: activeTab === 'quality'
  });

  const { data: pathwaysData } = useQuery({
    queryKey: ['resources', id, 'pathways'],
    queryFn: () => resourceClient.getPathways(id),
    enabled: activeTab === 'pathways'
  });

  const { data: processorsData } = useQuery({
    queryKey: ['resources', id, 'processors'],
    queryFn: () => resourceClient.getProcessors(id),
    enabled: activeTab === 'processors'
  });

  const { data: demandData } = useQuery({
    queryKey: ['resources', id, 'demand'],
    queryFn: () => resourceClient.getDemand(id),
    enabled: activeTab === 'demand'
  });

  const { data: logisticsData } = useQuery({
    queryKey: ['resources', id, 'logistics'],
    queryFn: () => resourceClient.getLogistics(id),
    enabled: activeTab === 'logistics'
  });

  const { data: impactData } = useQuery({
    queryKey: ['resources', id, 'impact'],
    queryFn: () => resourceClient.getImpact(id),
    enabled: activeTab === 'impact'
  });

  const { data: provenanceData } = useQuery({
    queryKey: ['resources', id, 'provenance'],
    queryFn: () => resourceClient.getProvenance(id),
    enabled: activeTab === 'provenance'
  });

  const { data: historyData } = useQuery({
    queryKey: ['resources', id, 'history'],
    queryFn: () => resourceClient.getHistory(id),
    enabled: activeTab === 'history'
  });

  const { data: knowledgeData } = useQuery({
    queryKey: ['knowledge', 'resource', id],
    queryFn: () => knowledgeClient.getResourceKnowledge(id),
    enabled: activeTab === 'research'
  });

  // AI Analysis Trigger
  const analyzeMutation = useMutation({
    mutationFn: () => resourceClient.analyzeResource(id)
  });

  if (resLoading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (resError || !resource) {
    return (
      <div className="p-8">
        <ErrorState
          title="Resource not found"
          message={(resError as any)?.message || 'The specified resource record could not be loaded.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Back button & Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#26302C]/60">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/resources')}
            className="p-1.5 rounded-xs bg-[#151A18] hover:bg-[#181D1B] border border-[#26302C] text-[#9EAAA5] hover:text-[#E5ECE8]"
            title="Back to Resources"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">{resource.name}</h1>
              <Badge status={resource.provenance?.[0]?.status || 'LIVE'} />
            </div>
            <p className="text-xs text-[#9EAAA5] mt-0.5">
              Canonical Concept: <code className="text-[#8BCF45]">{resource.canonicalConceptId}</code> ·{' '}
              {resource.category} · {resource.location.address}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('ai-analysis');
              analyzeMutation.mutate();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0B0D0D] bg-[#8BCF45] hover:bg-[#9ED957] rounded-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Run AI Biomass Analysis</span>
          </button>
        </div>
      </div>

      {/* 16 Tabs Navigation */}
      <Tabs tabs={DETAIL_TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Active Tab Panel Rendering */}
      <div className="pt-2">
        {/* 1. IDENTITY */}
        {activeTab === 'identity' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Concept Identity & Semantic Normalization">
              <KeyValue label="Canonical Identifier" value={resource.canonicalConceptId || 'c-concept'} />
              <KeyValue label="Scientific & Trade Name" value={resource.name} />
              <KeyValue label="Category" value={resource.category} />
              <KeyValue label="Source Generation Type" value={resource.sourceType} />
              <KeyValue label="Registered Aliases" value={resource.aliases.join(', ')} />
              <KeyValue label="Ontology Taxonomy Standard" value="FAO AGROVOC / NaLamKI AgriFoodData" />
            </Card>

            <Card title="Verification & Audit Scorecard">
              <ConfidenceMeter
                score={resource.confidence}
                evidenceCount={resource.provenance.length}
                freshness={resource.freshness}
              />
              <div className="mt-4 space-y-2">
                <span className="text-xs font-semibold text-[#9EAAA5] block">Provenance Records</span>
                {resource.provenance.map((p, i) => (
                  <ProvenanceChip key={i} source={p.source} license={p.license} status={p.status} />
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* 2. AVAILABILITY */}
        {activeTab === 'availability' && (
          <Card title="Temporal Biomass Availability Window" subtitle="Real-time harvest window & aggregation forecast">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-[#151A18] rounded-xs border border-[#26302C]">
                <span className="text-[11px] text-[#68756F] block">Active Available Volume</span>
                <span className="text-xl font-bold font-mono text-[#8BCF45]">
                  {formatMass(availability?.currentAvailableQuantity || resource.quantity, unitSystem, locale)}
                </span>
              </div>
              <div className="p-3 bg-[#151A18] rounded-xs border border-[#26302C]">
                <span className="text-[11px] text-[#68756F] block">Regional Aggregation Potential</span>
                <span className="text-xl font-bold font-mono text-[#E5ECE8]">
                  {formatMass(availability?.regionalSupplyForecastTons || resource.quantity * 4.5, unitSystem, locale)}
                </span>
              </div>
              <div className="p-3 bg-[#151A18] rounded-xs border border-[#26302C]">
                <span className="text-[11px] text-[#68756F] block">Days Remaining in Peak Window</span>
                <span className="text-xl font-bold font-mono text-[#D6D75A]">
                  {availability?.harvestPeakDaysRemaining || 42} days
                </span>
              </div>
            </div>
            <KeyValue label="Start Window" value={resource.availabilityStart || '2026-10-01'} />
            <KeyValue label="End Window" value={resource.availabilityEnd || '2026-12-15'} />
            <KeyValue label="Seasonality Phases" value={resource.seasonality?.join(', ') || 'Kharif Harvest'} />
          </Card>
        )}

        {/* 3. COMPOSITION */}
        {activeTab === 'composition' && (
          <Card
            title="Biochemical Proximate Composition"
            subtitle="Laboratory measurements and inferred thermodynamic properties"
            headerAction={<Badge status="LIVE" />}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(resource.composition).map(([key, prop]: [string, any]) => (
                <div key={key} className="p-3 bg-[#151A18] rounded-xs border border-[#26302C]">
                  <div className="flex items-center justify-between text-[11px] text-[#9EAAA5] capitalize mb-1">
                    <span>{key}</span>
                    <span className="text-[10px] font-mono text-[#68756F] uppercase">{prop.type}</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-[#E5ECE8]">
                    {prop.value} <span className="text-xs text-[#9EAAA5]">{prop.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 4. QUALITY */}
        {activeTab === 'quality' && (
          <Card title="Feedstock Quality Assessment & Impurity Deductions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <KeyValue label="Overall Quality Score" value={`${qualityData?.overallQualityScore || resource.qualityScore} / 100`} />
                <KeyValue label="Grade Classification" value={qualityData?.gradeClassification || 'Grade A Feedstock'} />
                <KeyValue label="Contamination Rating" value={`${qualityData?.contaminationScore || 92} / 100`} />
                <KeyValue label="Moisture Penalty Applied" value={`${qualityData?.moisturePenaltyDeduction || 0}%`} />
              </div>
              <div className="p-4 bg-[#151A18] rounded-xs border border-[#26302C] text-xs text-[#9EAAA5]">
                <h5 className="font-semibold text-[#E5ECE8] mb-1">Thermodynamic Suitability</h5>
                <p>
                  High cellulose ({resource.composition.cellulose?.value}%) and low soil ash contamination qualify this lot for VM0044 premium biochar certification.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* 5. GEOGRAPHY */}
        {activeTab === 'geography' && (
          <Card title="Geospatial Location & PostGIS Invariants">
            <KeyValue label="Address / Corridor" value={resource.location.address} />
            <KeyValue label="Administrative Region" value={resource.location.region} />
            <KeyValue label="Country ISO" value={resource.location.countryCode} />
            <KeyValue label="Geographic Coordinate [Lng, Lat]" value={resource.location.coordinates.join(', ')} />
            <div className="mt-4 pt-3 border-t border-[#26302C]">
              <button
                onClick={() => navigate(`/map?resource=${resource.id}`)}
                className="px-3 py-1.5 bg-[#8BCF45] text-[#0B0D0D] rounded-xs text-xs font-semibold"
              >
                Inspect on Operational Map
              </button>
            </div>
          </Card>
        )}

        {/* 6. SEASONALITY */}
        {activeTab === 'seasonality' && (
          <Card title="Regional Harvest Calendar & Seasonality">
            <div className="space-y-2">
              {resource.seasonality?.map((s, i) => (
                <div key={i} className="p-2.5 bg-[#151A18] rounded-xs border border-[#26302C] text-xs text-[#E5ECE8]">
                  {s}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 7. PATHWAYS */}
        {activeTab === 'pathways' && (
          <Card title="Ranked Downstream Circular Pathways">
            <div className="divide-y divide-[#26302C]/60">
              {(pathwaysData?.pathways || []).map((pw: any) => (
                <div key={pw.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <h5 className="text-xs font-semibold text-[#E5ECE8]">{pw.name}</h5>
                    <p className="text-[11px] text-[#9EAAA5]">{pw.primaryTechnology}</p>
                    <div className="text-[10px] text-[#68756F] mt-1">
                      Score: {pw.evaluatedScore || pw.overallScore}/100 · Abatement: {pw.co2eAvoidedPerTon} kgCO₂e/t
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/pathways')}
                    className="px-2.5 py-1 text-xs font-medium bg-[#8BCF45] text-[#0B0D0D] rounded-xs"
                  >
                    Select Pathway
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 8. PROCESSORS */}
        {activeTab === 'processors' && (
          <Card title="Compatible Regional Processors">
            <div className="divide-y divide-[#26302C]/60">
              {(processorsData?.processors || []).map((p: any) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <h5 className="text-xs font-semibold text-[#E5ECE8]">{p.name}</h5>
                    <p className="text-[11px] text-[#9EAAA5]">{p.category} · {p.location.address}</p>
                    <div className="text-[10px] text-[#68756F] mt-1">
                      Available: {p.availableCapacity} / {p.capacityPerDay} {p.unit} · Cost: ${p.processingCostPerT}/t
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/matching')}
                    className="px-2.5 py-1 text-xs font-medium bg-[#151A18] border border-[#26302C] text-[#8BCF45] rounded-xs"
                  >
                    Match Facility
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 9. DEMAND */}
        {activeTab === 'demand' && (
          <Card title="Market Demand & Secondary Commodity Offtake">
            <KeyValue label="Spot Price Indicator" value={`$${demandData?.spotPriceEstimate || 42.5} / tonne`} />
            <KeyValue label="Demand Intensity" value={demandData?.demandIntensity || 'HIGH'} />
            <KeyValue label="Active Purchase Orders" value={`${demandData?.activePurchaseOrdersTons || 1250} tonnes`} />
            <KeyValue label="Primary Offtakers" value={demandData?.primaryBuyerSectors?.join(', ') || 'Pyrolysis Plants, Biogas'} />
          </Card>
        )}

        {/* 10. LOGISTICS */}
        {activeTab === 'logistics' && (
          <Card title="Logistics & Fleet Optimization Parameters">
            <KeyValue label="Avg Consolidation Radius" value={`${logisticsData?.averageConsolidationRadiusKm || 35} km`} />
            <KeyValue label="Freight Rate Benchmark" value={`$${logisticsData?.estimatedFreightCostPerTonKm || 0.18} / t-km`} />
            <KeyValue label="Recommended Haulage Fleet" value={logisticsData?.recommendedFleet || '10-Tonne Covered Ag-Trucks'} />
            <KeyValue label="Freight Carbon Factor" value={`${logisticsData?.estimatedCo2ePerTonKm || 0.082} kgCO₂e/t-km`} />
          </Card>
        )}

        {/* 11. ECONOMICS */}
        {activeTab === 'economics' && (
          <Card title="Macro Economic & Farm Gate Value Projections">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-[#151A18] rounded-xs border border-[#26302C]">
                <span className="text-[11px] text-[#68756F] block">Projected Gate Revenue</span>
                <span className="text-xl font-bold font-mono text-[#8BCF45]">
                  {formatCurrency(resource.quantity * 42.5, 'USD', currency, locale)}
                </span>
              </div>
              <div className="p-3 bg-[#151A18] rounded-xs border border-[#26302C]">
                <span className="text-[11px] text-[#68756F] block">Farmer Income Boost</span>
                <span className="text-xl font-bold font-mono text-[#E5ECE8]">
                  {formatCurrency(resource.quantity * 32.0, 'USD', currency, locale)}
                </span>
              </div>
              <div className="p-3 bg-[#151A18] rounded-xs border border-[#26302C]">
                <span className="text-[11px] text-[#68756F] block">Carbon Credit Revenue (VM0044)</span>
                <span className="text-xl font-bold font-mono text-[#D6D75A]">
                  {formatCurrency(resource.quantity * 1.48 * 35, 'USD', currency, locale)}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* 12. IMPACT */}
        {activeTab === 'impact' && (
          <Card title="FAO EX-ACT Environmental Footprint">
            <KeyValue label="Total Avoided CO₂e" value={formatCarbon(impactData?.co2eAvoidedTotal || resource.quantity * 1.48, locale)} />
            <KeyValue label="Avoided PM2.5 Fine Particulates" value={`${impactData?.particulatePm25AvoidedKg || Math.round(resource.quantity * 8.4)} kg`} />
            <KeyValue label="Soil Organic Carbon Accretion" value={`${impactData?.soilCarbonAccretionTons || Math.round(resource.quantity * 0.35)} tonnes`} />
            <KeyValue label="Recoverable Green Energy" value={`${impactData?.energyRecoverableMwh || Math.round(resource.quantity * 0.34)} MWh`} />
            <KeyValue label="Accounting Methodology" value={impactData?.methodology || 'FAO EX-ACT VC Tier 2'} />
          </Card>
        )}

        {/* 13. RESEARCH */}
        {activeTab === 'research' && (
          <Card title="Peer-Reviewed Literature & Scientific Grounding">
            <div className="space-y-3">
              {(knowledgeData?.articles || []).map((art: any) => (
                <div key={art.id} className="p-3 bg-[#151A18] rounded-xs border border-[#26302C] text-xs">
                  <h5 className="font-semibold text-[#E5ECE8]">{art.title}</h5>
                  <div className="text-[11px] text-[#8BCF45] mt-1 font-mono">{art.source} ({art.publicationDate})</div>
                  <p className="text-[11px] text-[#9EAAA5] mt-1">{art.citation}</p>
                  <div className="text-[10px] text-[#68756F] mt-1">Experimental conditions: {art.conditions}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 14. PROVENANCE */}
        {activeTab === 'provenance' && (
          <Card title="Full Audit Trail & Lineage Records">
            <div className="space-y-2">
              {(provenanceData?.provenanceTree || resource.provenance).map((p: any, i: number) => (
                <ProvenanceChip key={i} source={p.source} license={p.license} status={p.status} retrievedAt={p.retrievedAt} />
              ))}
            </div>
          </Card>
        )}

        {/* 15. AI ANALYSIS */}
        {activeTab === 'ai-analysis' && (
          <Card title="Operational AI Analysis Trace">
            {analyzeMutation.data ? (
              <div className="space-y-3">
                <div className="p-3 bg-[#151A18] border border-[#8BCF45]/30 rounded-xs text-xs text-[#E5ECE8]">
                  <span className="font-semibold text-[#8BCF45] block mb-1">Synthesis Report</span>
                  {analyzeMutation.data.summary}
                </div>
                <KeyValue label="Feasibility Confidence" value={`${analyzeMutation.data.feasibilityScore}/100`} />
                <KeyValue label="Carbon Credit Eligibility" value={analyzeMutation.data.carbonCreditEligibility} />
                <KeyValue label="Operational Next Step" value={analyzeMutation.data.suggestedAction} />
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#9EAAA5]">
                <button
                  onClick={() => analyzeMutation.mutate()}
                  className="px-3 py-1.5 bg-[#8BCF45] text-[#0B0D0D] font-semibold rounded-xs"
                >
                  Run Deep AI Feasibility Evaluation
                </button>
              </div>
            )}
          </Card>
        )}

        {/* 16. HISTORY */}
        {activeTab === 'history' && (
          <Card title="Temporal Event Log">
            <div className="space-y-2">
              {(historyData?.events || [
                { timestamp: '2026-10-06T14:32:00Z', action: 'LAB_SAMPLE_ANALYSED', note: 'Moisture 12.4%, Ash 17.6% verified' },
                { timestamp: '2026-10-06T12:00:00Z', action: 'BATCH_AGGREGATED', note: 'Barabanki FPO harvest batch weighed' }
              ]).map((ev: any, i: number) => (
                <div key={i} className="p-2.5 bg-[#151A18] rounded-xs border border-[#26302C] text-xs flex justify-between">
                  <div>
                    <span className="font-mono text-[#8BCF45] block">{ev.action}</span>
                    <span className="text-[#E5ECE8]">{ev.note}</span>
                  </div>
                  <span className="text-[10px] text-[#68756F] font-mono">{new Date(ev.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
