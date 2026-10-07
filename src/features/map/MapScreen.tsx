import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Compass,
  Filter,
  Layers,
  Table as TableIcon,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Calendar,
  Globe,
  ArrowRight,
  ExternalLink,
  Leaf
} from 'lucide-react';
import { mapClient } from '../../api/clients/map.ts';
import { searchClient } from '../../api/clients/search.ts';
import { resourceClient } from '../../api/clients/resource.ts';
import { RealMaplibreMap } from '../../components/maps/RealMaplibreMap.tsx';
import { OperationalMap } from '../../components/maps/OperationalMap.tsx';
import { RealAgriculturalMap } from '../../components/maps/RealAgriculturalMap.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Drawer } from '../../components/ui/Drawer.tsx';
import { ConfidenceMeter } from '../../components/ui/ConfidenceMeter.tsx';
import { KeyValue } from '../../components/ui/KeyValue.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';
import { useMapStore } from '../../stores/mapStore.ts';
import { useSelectionStore } from '../../stores/selectionStore.ts';
import { usePreferencesStore } from '../../stores/preferencesStore.ts';
import { formatMass } from '../../lib/format.ts';

export const MapScreen: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { viewport, setViewport, layers, toggleLayer, activeInspectNodeId, setActiveInspectNode, drawerOpen, setDrawerOpen } = useMapStore();
  const { setSelectedResource } = useSelectionStore();
  const { unitSystem, locale } = usePreferencesStore();

  const [activeMapType, setActiveMapType] = useState<'MAPLIBRE' | 'SECTOR' | 'GLOBAL'>('MAPLIBRE');
  const [viewMode, setViewMode] = useState<'MAP' | 'TABLE' | 'SPLIT'>('SPLIT');
  const [selectedRegion, setSelectedRegion] = useState(searchParams.get('region') || 'ALL');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'ALL');

  // Sync URL parameters on mount
  useEffect(() => {
    const resId = searchParams.get('resource');
    if (resId) {
      setActiveInspectNode(resId);
    }
  }, [searchParams, setActiveInspectNode]);

  // Queries
  const { data: regionsRes } = useQuery({
    queryKey: ['search', 'regions'],
    queryFn: searchClient.searchRegions
  });

  const { data: resourcesRes, isLoading: resLoading, error: resError, refetch } = useQuery({
    queryKey: ['map', 'resources', selectedRegion, categoryFilter],
    queryFn: () => mapClient.getResources({
      country: selectedRegion !== 'ALL' ? selectedRegion : undefined,
      resourceType: categoryFilter !== 'ALL' ? categoryFilter : undefined
    })
  });

  const { data: processorsRes } = useQuery({
    queryKey: ['map', 'processors'],
    queryFn: () => mapClient.getProcessors()
  });

  const { data: routesRes } = useQuery({
    queryKey: ['map', 'routes'],
    queryFn: mapClient.getRoutes
  });

  const { data: clustersRes } = useQuery({
    queryKey: ['map', 'clusters'],
    queryFn: mapClient.getClusters
  });

  const rawResources = resourcesRes?.features?.map(f => ({ ...f.properties, location: f.geometry })) || [];
  const rawProcessors = processorsRes?.features?.map(f => ({ ...f.properties, location: f.geometry })) || [];
  const rawRoutes = routesRes?.routes || [];

  // Inspect node detail
  const inspectedEntity = rawResources.find(r => r.id === activeInspectNodeId) ||
                          rawProcessors.find(p => p.id === activeInspectNodeId);

  const handleNodeClick = (node: any) => {
    setActiveInspectNode(node.id);
    if (node.quantity) {
      setSelectedResource(node.id);
    }
    // Update URL
    setSearchParams(prev => {
      prev.set('resource', node.id);
      return prev;
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#26302C]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Spatio-Temporal Sector & Global Resource Map
            </h1>
            <span className="text-[10px] font-mono text-[#E0FF20] bg-[#E0FF20]/15 px-2 py-0.5 rounded-full border border-[#E0FF20]/40 font-semibold">
              WGS84 EPSG:4326
            </span>
          </div>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Progressive spatial resolution with layer overlays for supply density, processing capacity, and multimodal logistics corridors.
          </p>
        </div>

        {/* View Switcher & Region Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Map Layer Type Tabs */}
          <div className="flex items-center bg-[#181A20] border border-[#262B35] rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveMapType('MAPLIBRE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeMapType === 'MAPLIBRE'
                  ? 'bg-[#E0FF20] text-[#121317] shadow-sm font-bold'
                  : 'text-[#9EAAA5] hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Latur Region (MapLibre GL)</span>
            </button>
            <button
              onClick={() => setActiveMapType('SECTOR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeMapType === 'SECTOR'
                  ? 'bg-[#E0FF20] text-[#121317] shadow-sm font-bold'
                  : 'text-[#9EAAA5] hover:text-white'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>Sector Parcels</span>
            </button>
            <button
              onClick={() => setActiveMapType('GLOBAL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeMapType === 'GLOBAL'
                  ? 'bg-[#E0FF20] text-[#121317] shadow-sm font-bold'
                  : 'text-[#9EAAA5] hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Global Network</span>
            </button>
          </div>

          {/* Region selector */}
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setSearchParams(prev => {
                if (e.target.value === 'ALL') prev.delete('region');
                else prev.set('region', e.target.value);
                return prev;
              });
            }}
            className="bg-[#181A20] border border-[#26302C] text-xs font-mono text-[#9EAAA5] px-2.5 py-1.5 rounded-md focus:outline-hidden"
          >
            <option value="ALL">All Global Regions</option>
            {(regionsRes?.regions || []).map(reg => (
              <option key={reg.code} value={reg.code}>
                {reg.name} ({reg.activeBiomassTons} t)
              </option>
            ))}
          </select>

          {/* View mode toggle */}
          <div className="flex items-center bg-[#181A20] border border-[#26302C] rounded-md p-0.5">
            <button
              onClick={() => setViewMode('MAP')}
              className={`p-1.5 rounded-sm text-xs ${viewMode === 'MAP' ? 'bg-[#1E222B] text-[#E0FF20]' : 'text-[#9EAAA5]'}`}
              title="Map Only"
            >
              <MapIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('SPLIT')}
              className={`px-2 py-1 rounded-sm text-xs font-mono ${viewMode === 'SPLIT' ? 'bg-[#1E222B] text-[#E0FF20] font-semibold' : 'text-[#9EAAA5]'}`}
              title="Split View"
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-sm text-xs ${viewMode === 'TABLE' ? 'bg-[#1E222B] text-[#E0FF20]' : 'text-[#9EAAA5]'}`}
              title="Table Twin View (Accessible)"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Map + Twin Table View Area */}
      {resError ? (
        <ErrorState
          title="Failed to load geospatial streams"
          message={(resError as any).message}
          onRetry={refetch}
        />
      ) : (
        <div className={`grid gap-6 ${viewMode === 'SPLIT' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
          {/* Map Column */}
          {viewMode !== 'TABLE' && (
            <div className={viewMode === 'SPLIT' ? 'lg:col-span-8' : 'w-full'}>
              {activeMapType === 'MAPLIBRE' ? (
                <RealMaplibreMap
                  height="580px"
                  initialLayerId="layer-524-latur"
                  onSelectFeature={(feature) => {
                    handleNodeClick({
                      id: feature.id || feature.properties?.NEWCD2011,
                      name: feature.properties?.VILLNAME || 'Village Polygon',
                      category: 'Administrative Boundary',
                      quantity: 450,
                      provenanceState: 'LIVE'
                    });
                  }}
                />
              ) : activeMapType === 'SECTOR' ? (
                <RealAgriculturalMap
                  onSelectParcel={(parcel) => {
                    handleNodeClick({
                      id: parcel.id,
                      name: parcel.properties.name,
                      category: parcel.properties.cropType,
                      quantity: parcel.properties.biomassResidueTons,
                      provenanceState: 'LIVE'
                    });
                  }}
                />
              ) : (
                <OperationalMap
                  resources={rawResources}
                  processors={rawProcessors}
                  routes={rawRoutes}
                  selectedNodeId={activeInspectNodeId}
                  onSelectNode={handleNodeClick}
                />
              )}
            </div>
          )}

          {/* Synchronized Twin Table View Column */}
          {viewMode !== 'MAP' && (
            <div className={viewMode === 'SPLIT' ? 'lg:col-span-4' : 'w-full'}>
              <Card
                title="Synchronized Entity Twin List"
                subtitle="Accessible table view mirroring all spatial nodes in active viewport."
                headerAction={
                  <span className="text-[11px] font-mono text-[#E0FF20] font-semibold">
                    {rawResources.length} streams
                  </span>
                }
              >
                <div className="divide-y divide-[#26302C] max-h-[490px] overflow-y-auto pr-1">
                  {rawResources.map((item) => {
                    const isSelected = activeInspectNodeId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleNodeClick(item)}
                        className={`py-2.5 px-2 rounded-md cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#1E222B] border-l-2 border-[#E0FF20]' : 'hover:bg-[#15171D]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-white truncate">{item.name}</span>
                          <span className="font-mono text-[#E0FF20] shrink-0 font-bold">
                            {formatMass(item.quantity, unitSystem, locale)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#9EAAA5]">
                          <span>{item.category}</span>
                          <span className="text-[10px] font-mono">{item.qualityScore}/100 Qual</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Regional Cluster Breakdown Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(clustersRes?.clusters || []).map((cluster) => (
          <div key={cluster.id} className="p-3.5 rounded-lg bg-[#181A20] border border-[#262B35]">
            <div className="flex items-center justify-between text-xs text-[#9EAAA5] mb-1">
              <span className="font-semibold text-white">{cluster.name}</span>
              <span className="font-mono text-[10px] text-[#E0FF20] font-bold">{cluster.nodeCount} nodes</span>
            </div>
            <div className="text-lg font-bold font-mono text-white my-1">
              {formatMass(cluster.totalResouresTons, unitSystem, locale)}
            </div>
            <div className="text-[11px] text-[#68756F]">
              Radius: {cluster.radiusKm} km · Center: {cluster.center.join(', ')}
            </div>
          </div>
        ))}
      </div>

      {/* Inspector Slide-over Drawer for Clicked Node */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={inspectedEntity?.name || 'Node Inspection'}
        subtitle={inspectedEntity?.category}
      >
        {inspectedEntity && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#262B35]">
              <Badge status={inspectedEntity.provenanceState || 'LIVE'} />
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  navigate(`/resources/${inspectedEntity.id}`);
                }}
                className="text-xs text-[#E0FF20] hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>Open Resource Intelligence</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <KeyValue label="Entity Identifier" value={inspectedEntity.id} />
            <KeyValue
              label="Available Quantity"
              value={inspectedEntity.quantity ? formatMass(inspectedEntity.quantity, unitSystem, locale) : 'N/A'}
            />
            <KeyValue
              label="Coordinates [Lng, Lat]"
              value={inspectedEntity.location?.coordinates ? inspectedEntity.location.coordinates.join(', ') : 'Point'}
            />
            <KeyValue
              label="Quality Verification"
              value={`${inspectedEntity.qualityScore || 85} / 100`}
            />

            <ConfidenceMeter
              score={inspectedEntity.confidence || 90}
              evidenceCount={3}
              freshness={inspectedEntity.freshness || 'Updated 15m ago'}
            />

            <div className="pt-4 flex gap-2">
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  navigate('/pathways');
                }}
                className="flex-1 py-2 text-xs font-bold bg-[#E0FF20] text-[#121317] rounded-md hover:bg-[#EEFF52] transition-colors"
              >
                Discover Circular Pathways
              </button>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  navigate('/matching');
                }}
                className="flex-1 py-2 text-xs font-semibold bg-[#1E222B] text-white border border-[#262B35] rounded-md hover:bg-[#252A36] transition-colors"
              >
                Match Regional Processors
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
