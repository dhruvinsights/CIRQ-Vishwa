import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity,
  ShieldCheck,
  Zap,
  Globe,
  Leaf,
  Droplets,
  DollarSign,
  Compass,
  CheckCircle2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { systemClient } from '../../api/clients/system.ts';
import { resourceClient } from '../../api/clients/resource.ts';
import { mapClient } from '../../api/clients/map.ts';
import { pathwayClient } from '../../api/clients/pathway.ts';
import { impactClient } from '../../api/clients/impact.ts';
import { StatCard } from '../../components/ui/StatCard.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { RealMaplibreMap } from '../../components/maps/RealMaplibreMap.tsx';
import { RealAgriculturalMap } from '../../components/maps/RealAgriculturalMap.tsx';
import { OperationalMap } from '../../components/maps/OperationalMap.tsx';
import { SankeyFlow } from '../../components/charts/SankeyFlow.tsx';
import { ConfidenceMeter } from '../../components/ui/ConfidenceMeter.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';
import { useSelectionStore } from '../../stores/selectionStore.ts';
import { usePreferencesStore } from '../../stores/preferencesStore.ts';
import { formatCurrency, formatMass, formatCarbon, formatEnergy } from '../../lib/format.ts';

export const OverviewScreen: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedResource, selectedResourceId } = useSelectionStore();
  const { unitSystem, currency, locale } = usePreferencesStore();
  const [activeMapTab, setActiveMapTab] = useState<'MAPLIBRE' | 'SECTOR' | 'GLOBAL'>('MAPLIBRE');
  const [liveEvents, setLiveEvents] = useState<any[]>([]);

  // 1. System Metrics Query
  const { data: metrics, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useQuery({
    queryKey: ['system', 'metrics'],
    queryFn: systemClient.getMetrics
  });

  // 2. Resources Query
  const { data: resourcesRes } = useQuery({
    queryKey: ['resources', 'list'],
    queryFn: () => resourceClient.getResources({ limit: 10 })
  });

  // 3. Map GeoJSON Query for Agricultural Parcels
  const { data: geojson } = useQuery({
    queryKey: ['map', 'geojson'],
    queryFn: mapClient.getGeoJson,
    staleTime: 60000
  });

  // 4. Global Map Data Query
  const { data: mapResources } = useQuery({
    queryKey: ['map', 'resources'],
    queryFn: () => mapClient.getResources()
  });
  const { data: mapProcessors } = useQuery({
    queryKey: ['map', 'processors'],
    queryFn: () => mapClient.getProcessors()
  });
  const { data: mapRoutes } = useQuery({
    queryKey: ['map', 'routes'],
    queryFn: mapClient.getRoutes
  });

  // 5. Pathways Query
  const { data: pathwaysRes } = useQuery({
    queryKey: ['pathways', 'list'],
    queryFn: pathwayClient.getPathways
  });

  // 6. Impact Overview Query
  const { data: impactData } = useQuery({
    queryKey: ['impact', 'overview'],
    queryFn: impactClient.getOverview
  });

  // 7. Events Stream Query & Live Heartbeat
  useEffect(() => {
    systemClient.getEvents().then(res => {
      setLiveEvents(res.events || []);
    });

    const unsub = systemClient.subscribeEventsStream(ev => {
      setLiveEvents(prev => [
        {
          id: ev.id,
          type: 'STREAM_OBSERVATION',
          message: `Live telemetry packet: queue depth ${ev.queueDepth}, throughput ${ev.throughput} msg/s`,
          timestamp: ev.timestamp,
          status: 'LIVE'
        },
        ...prev.slice(0, 5)
      ]);
    });

    return () => unsub();
  }, []);

  const resources = resourcesRes?.data || [];
  const selectedResource = resources.find(r => r.id === selectedResourceId) || resources[0];
  const parcelFeatures = geojson?.features?.filter((f: any) => f.geometry.type === 'Polygon') || [];

  if (metricsLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-[480px]" />
      </div>
    );
  }

  if (metricsError) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <ErrorState
          title="Failed to initialize CIRQ command centre"
          message={(metricsError as any).message || 'Unable to retrieve API telemetry metrics'}
          onRetry={refetchMetrics}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#262B35]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              CIRQ Command Centre
            </h1>
            <span className="text-[10px] font-mono text-[#E0FF20] bg-[#E0FF20]/15 px-2 py-0.5 rounded-full border border-[#E0FF20]/40 font-semibold">
              Live Sector Telemetry
            </span>
          </div>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Real-time biomass tracking, Sentinel-2B NDVI monitoring, semantic ontology resolution, and circular economy optimization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/demo')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#121317] bg-[#E0FF20] hover:bg-[#EEFF52] rounded-md transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Run Circularity Demo Sequence</span>
          </button>
        </div>
      </div>

      {/* Top Metric Tiles with CIRQ styling and sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tracked Feedstock Biomass"
          value={metrics ? formatMass(metrics.totalResourcesAvailableTons, unitSystem, locale) : '2,870 t'}
          caption="Verified via FAO & Ingestion"
          trend={{ value: '+14.2% harvest surge', positive: true }}
          status="LIVE"
          freshness="Updated 2 min ago"
        />
        <StatCard
          label="Cumulative GHG Abatement"
          value={metrics ? formatCarbon(metrics.co2eAvoidedTotalTons, locale) : '74,684 tCO₂e'}
          caption="IPCC Tier 2 avoided burning"
          trend={{ value: '+8.4% vs 2025', positive: true }}
          status="LIVE"
          freshness="Audited October 2026"
        />
        <StatCard
          label="Unlocked Circular Value"
          value={metrics ? formatCurrency(metrics.economicValueGeneratedTotalUsd, 'USD', currency, locale) : '$2,450,800'}
          caption="Biochar & Biomethane Gate Value"
          trend={{ value: 'Avg $52.4 / t', positive: true }}
          status="LIVE"
          freshness="Pink Sheet sync"
        />
        <StatCard
          label="Active Closed Loops"
          value={metrics ? metrics.activeLoopsCount : 3}
          unit="loops"
          caption={`${metrics?.activeProcessorsCount || 5} operational processors`}
          trend={{ value: '92.4% avg circularity', positive: true }}
          status="LIVE"
          freshness="Realtime"
        />
      </div>

      {/* Hero Operational Map with View Switcher */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Map View Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#121317] p-1 rounded-lg border border-[#262B35] text-xs">
            <button
              onClick={() => setActiveMapTab('MAPLIBRE')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeMapTab === 'MAPLIBRE'
                  ? 'bg-[#E0FF20] text-[#121317] shadow-sm font-bold'
                  : 'text-[#9EAAA5] hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Latur Bio-Region (MapLibre GL & Basemap Tiles)</span>
            </button>
            <button
              onClick={() => setActiveMapTab('SECTOR')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeMapTab === 'SECTOR'
                  ? 'bg-[#E0FF20] text-[#121317] shadow-sm font-bold'
                  : 'text-[#9EAAA5] hover:text-white'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>Sector Parcels (Central Valley NDVI)</span>
            </button>
            <button
              onClick={() => setActiveMapTab('GLOBAL')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeMapTab === 'GLOBAL'
                  ? 'bg-[#E0FF20] text-[#121317] shadow-sm font-bold'
                  : 'text-[#9EAAA5] hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Global Logistics Corridors</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/settings/layers')}
              className="text-xs text-[#9EAAA5] hover:text-[#E0FF20] inline-flex items-center gap-1 font-mono transition-colors"
            >
              <Layers className="w-3 h-3" />
              <span>Manage Boundary Layers</span>
            </button>
            <button
              onClick={() => navigate('/map')}
              className="text-xs text-[#E0FF20] hover:underline inline-flex items-center gap-1 font-mono font-medium"
            >
              <span>Full Map Explorer</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* The Active Map Component */}
        {activeMapTab === 'MAPLIBRE' ? (
          <RealMaplibreMap
            height="540px"
            initialLayerId="layer-524-latur"
          />
        ) : activeMapTab === 'SECTOR' ? (
          <RealAgriculturalMap
            selectedParcelId="field-a"
            onSelectParcel={(parcel) => {
              if (parcel.id === 'field-a') setSelectedResource('res-rice-straw-up');
              else if (parcel.id === 'field-c') setSelectedResource('res-sugar-bagasse-br');
              else if (parcel.id === 'field-d') setSelectedResource('res-corn-stover-us');
            }}
          />
        ) : (
          <Card
            title="Global Resource Network & Logistics Corridors"
            subtitle="Multi-layer spatio-temporal map showing registered biomass streams, processing facilities, and optimized transport routes."
          >
            <OperationalMap
              resources={mapResources?.features?.map(f => ({ ...f.properties, location: f.geometry })) || []}
              processors={mapProcessors?.features?.map(f => ({ ...f.properties, location: f.geometry })) || []}
              routes={mapRoutes?.routes || []}
              selectedNodeId={selectedResourceId}
              onSelectNode={(node) => {
                if (node.kind === 'RESOURCE' || node.quantity) {
                  setSelectedResource(node.id);
                }
              }}
            />
          </Card>
        )}
      </div>

      {/* Sector Crops & Biomass Insight Cards (Matching the design in image.png) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Sector Agricultural Crops & Biomass Streams
            </h3>
            <p className="text-xs text-[#9EAAA5]">
              Real-time harvest stages, soil moisture ratings, and valorization pathways from active GeoJSON parcels.
            </p>
          </div>
          <span className="text-xs font-mono text-[#E0FF20]">
            {parcelFeatures.length || 5} Verified Parcels
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parcelFeatures.map((parcel: any) => {
            const p = parcel.properties;
            const isSelected = selectedResource?.id === p.targetProcessorId || p.id === 'field-a';

            return (
              <div
                key={parcel.id}
                onClick={() => {
                  if (p.id === 'field-a') setSelectedResource('res-rice-straw-up');
                  else if (p.id === 'field-c') setSelectedResource('res-sugar-bagasse-br');
                  else if (p.id === 'field-d') setSelectedResource('res-corn-stover-us');
                }}
                className={`p-4 rounded-lg bg-[#181A20] border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#E0FF20] shadow-md shadow-[#E0FF20]/5'
                    : 'border-[#262B35] hover:border-[#343B49]'
                }`}
              >
                <div>
                  {/* Top Row: Field Designation & NDVI Chip */}
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#262B35]">
                    <div>
                      <span className="text-[10px] font-mono text-[#9EAAA5] uppercase block">{p.name}</span>
                      <h4 className="text-sm font-bold text-white tracking-tight">{p.cropType}</h4>
                      <span className="text-[11px] text-[#6B8547] font-medium">{p.variety}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E0FF20]/20 text-[#E0FF20] border border-[#E0FF20]/40 shrink-0">
                      NDVI {p.ndvi}
                    </span>
                  </div>

                  {/* Middle Metrics: Land & Soil & Residue */}
                  <div className="grid grid-cols-2 gap-2 my-3 text-xs font-mono">
                    <div className="p-2 bg-[#1E222B] rounded border border-[#262B35]">
                      <span className="text-[10px] text-[#9EAAA5] block">Acreage</span>
                      <span className="font-bold text-white">{p.acreage} ac</span>
                      <span className="text-[10px] text-[#68756F] block">{p.hectares} ha</span>
                    </div>

                    <div className="p-2 bg-[#1E222B] rounded border border-[#262B35]">
                      <span className="text-[10px] text-[#9EAAA5] block">Soil Moisture</span>
                      <span className="font-bold text-[#E0FF20]">{p.soilMoisturePercent}%</span>
                      <span className="text-[10px] text-[#6B8547] block">{p.healthStatus}</span>
                    </div>

                    <div className="p-2 bg-[#1E222B] rounded border border-[#262B35]">
                      <span className="text-[10px] text-[#9EAAA5] block">Biomass Residue</span>
                      <span className="font-bold text-[#E0FF20]">{p.biomassResidueTons} t</span>
                      <span className="text-[9px] text-[#9EAAA5] block leading-tight">{p.residueType}</span>
                    </div>

                    <div className="p-2 bg-[#1E222B] rounded border border-[#262B35]">
                      <span className="text-[10px] text-[#9EAAA5] block">Carbon Sequestration</span>
                      <span className="font-bold text-white">{p.co2eOffsetTons} t</span>
                      <span className="text-[10px] text-[#9EAAA5] block">CO₂e Offset</span>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="flex items-center justify-between text-xs font-mono p-2 bg-[#121317] rounded border border-[#262B35] mb-3">
                    <div>
                      <span className="text-[10px] text-[#9EAAA5] block">Cost:</span>
                      <span className="font-semibold text-white">${p.productionCostUsd}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9EAAA5] block">Expected Rev:</span>
                      <span className="font-bold text-[#E0FF20]">${p.expectedRevenueUsd}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9EAAA5] block">Biochar Yield:</span>
                      <span className="font-semibold text-white">{p.biocharPotentialTons} t</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/pathways');
                    }}
                    className="w-full py-1.5 px-3 bg-[#1E222B] hover:bg-[#252A36] border border-[#262B35] rounded-md text-xs font-semibold text-white text-center transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Mobilize Residue</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#E0FF20]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Grid: Resource Spotlight & Circular Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Resource Spotlight (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            title="Active Resource Stream Spotlight"
            subtitle="Selected feedstock stream currently driving downstream pathway feasibility."
            headerAction={<Badge status="LIVE" />}
          >
            {selectedResource ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{selectedResource.name}</h4>
                    <span className="text-xs text-[#9EAAA5]">
                      {selectedResource.category} · {selectedResource.sourceType}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold font-mono text-[#E0FF20]">
                      {formatMass(selectedResource.quantity, unitSystem, locale)}
                    </span>
                    <span className="block text-[11px] text-[#68756F]">
                      {selectedResource.location?.address || selectedResource.location?.region}
                    </span>
                  </div>
                </div>

                {/* Proximate Composition Breakdown */}
                <div className="p-3 bg-[#1E222B] rounded-lg border border-[#262B35]">
                  <span className="text-[11px] font-mono uppercase text-[#9EAAA5] block mb-2 font-semibold">
                    Laboratory Proximate Composition
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#68756F] block">Moisture</span>
                      <span className="font-mono text-white">{selectedResource.composition?.moisture?.value}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#68756F] block">Ash</span>
                      <span className="font-mono text-white">{selectedResource.composition?.ash?.value}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#68756F] block">Cellulose</span>
                      <span className="font-mono text-white">{selectedResource.composition?.cellulose?.value || 38}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#68756F] block">Lignin</span>
                      <span className="font-mono text-white">{selectedResource.composition?.lignin?.value || 14}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#68756F] block">C/N Ratio</span>
                      <span className="font-mono text-white">{selectedResource.composition?.cnRatio?.value || 58}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#68756F] block">Energy Potential</span>
                      <span className="font-mono text-[#E0FF20]">{selectedResource.composition?.energyContent?.value || 14.2} GJ/t</span>
                    </div>
                  </div>
                </div>

                {/* Verification Confidence Meter */}
                <ConfidenceMeter
                  score={selectedResource.confidence || 91}
                  evidenceCount={selectedResource.provenance?.length || 3}
                  freshness={selectedResource.freshness || 'Updated 14 min ago'}
                />

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => navigate(`/resources/${selectedResource.id}`)}
                    className="flex-1 py-1.5 px-3 bg-[#1E222B] hover:bg-[#252A36] border border-[#262B35] rounded-md text-xs font-semibold text-white text-center transition-colors"
                  >
                    Open Resource Intelligence
                  </button>
                  <button
                    onClick={() => navigate('/simulator')}
                    className="py-1.5 px-3 bg-[#E0FF20] hover:bg-[#EEFF52] rounded-md text-xs font-bold text-[#121317] transition-colors"
                  >
                    Simulate Pathway
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#9EAAA5]">No resource selected</div>
            )}
          </Card>

          {/* Live Operational Events Feed */}
          <Card title="Live Operational Events" subtitle="Sub-second streaming events from CIRQ engine and OGC sensors.">
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {liveEvents.map((ev, i) => (
                <div key={ev.id || i} className="p-2 bg-[#1E222B] rounded-md border border-[#262B35] text-xs">
                  <div className="flex items-center justify-between text-[10px] text-[#68756F] mb-1">
                    <span className="font-mono text-[#E0FF20] font-semibold">{ev.type}</span>
                    <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-white text-[11px]">{ev.message}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Circular Resource Flow (Sankey) & AI Recommendations (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <SankeyFlow />

          {/* AI Recommended Pathways Table */}
          <Card
            title="Pareto-Ranked Circular Valorization Pathways"
            subtitle="Calculated across technical feasibility, gate economics, carbon abatement, and logistics cost."
            headerAction={
              <button
                onClick={() => navigate('/pathways')}
                className="text-xs text-[#E0FF20] hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>Compare All ({pathwaysRes?.total || 5})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            }
          >
            <div className="divide-y divide-[#262B35]">
              {(pathwaysRes?.data || []).slice(0, 3).map((pw) => (
                <div key={pw.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="text-xs font-semibold text-white leading-snug">{pw.name}</h5>
                      <span className="text-[10px] font-mono text-[#E0FF20] bg-[#E0FF20]/15 px-1.5 py-0.2 rounded-full border border-[#E0FF20]/40 font-semibold shrink-0">
                        {pw.overallScore}/100 Score
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9EAAA5] mt-0.5 leading-snug">{pw.primaryTechnology}</p>
                    <div className="flex items-center gap-3 text-[10px] text-[#68756F] mt-1">
                      <span>Abatement: {pw.co2eAvoidedPerTon} kgCO₂e/t</span>
                      <span aria-hidden="true">·</span>
                      <span>Confidence: {pw.confidence}%</span>
                      <span aria-hidden="true">·</span>
                      <span>{pw.methodology.split('+')[0]}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => navigate('/pathways')}
                      className="px-2.5 py-1 text-xs font-semibold bg-[#1E222B] hover:bg-[#252A36] border border-[#262B35] text-white rounded-md transition-colors"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
