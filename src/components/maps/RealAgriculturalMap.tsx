import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  MapPin,
  CheckCircle,
  TrendingUp,
  Droplets,
  DollarSign,
  Maximize2,
  Layers,
  ArrowRight,
  Plus,
  Eye,
  Check
} from 'lucide-react';
import { mapClient } from '../../api/clients/map.ts';
import { useSelectionStore } from '../../stores/selectionStore.ts';
import { Badge } from '../ui/Badge.tsx';

interface RealAgriculturalMapProps {
  onSelectParcel?: (parcel: any) => void;
  selectedParcelId?: string | null;
  className?: string;
  compact?: boolean;
}

export const RealAgriculturalMap: React.FC<RealAgriculturalMapProps> = ({
  onSelectParcel,
  selectedParcelId = 'field-a',
  className = '',
  compact = false
}) => {
  const navigate = useNavigate();
  const { setSelectedResource, setCommandPaletteOpen } = useSelectionStore();
  const [activeParcel, setActiveParcel] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [activeLayer, setActiveLayer] = useState<'ALL' | 'NDVI' | 'LOGISTICS' | 'FACILITIES'>('ALL');
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldCrop, setNewFieldCrop] = useState('Organic Barley Grain');
  const [newFieldAcreage, setNewFieldAcreage] = useState('160');

  // Load real GeoJSON layer
  const { data: geojson, isLoading } = useQuery({
    queryKey: ['map', 'geojson'],
    queryFn: mapClient.getGeoJson,
    staleTime: 60000
  });

  const features = geojson?.features || [];
  const polygonParcels = features.filter((f: any) => f.geometry.type === 'Polygon');
  const facilityPoints = features.filter((f: any) => f.geometry.type === 'Point');
  const routeLines = features.filter((f: any) => f.geometry.type === 'LineString');
  const metadata = geojson?.metadata || {};

  // Automatically select initial parcel
  useEffect(() => {
    if (polygonParcels.length > 0 && !activeParcel) {
      const match = polygonParcels.find((p: any) => p.id === selectedParcelId) || polygonParcels[0];
      setActiveParcel(match);
    }
  }, [polygonParcels, selectedParcelId, activeParcel]);

  // Project geographic coordinates [Lng, Lat] to SVG canvas
  // Central Valley Bounding Box: Lng [-121.730 to -121.688], Lat [38.745 to 38.775]
  const svgWidth = 920;
  const svgHeight = compact ? 380 : 490;

  const minLng = -121.730;
  const maxLng = -121.688;
  const minLat = 38.745;
  const maxLat = 38.775;

  const projectPoint = (lng: number, lat: number) => {
    const xRatio = (lng - minLng) / (maxLng - minLng);
    const yRatio = (lat - minLat) / (maxLat - minLat);
    const x = xRatio * (svgWidth - 140) + 70 + panOffset.x;
    const y = (1 - yRatio) * (svgHeight - 120) + 60 + panOffset.y;
    return { x, y };
  };

  const handleSelectField = (parcel: any) => {
    if (!parcel) return;
    setActiveParcel(parcel);
    onSelectParcel?.(parcel);
    // Sync with CIRQ resource models
    if (parcel.id === 'field-a') {
      setSelectedResource('res-rice-straw-up');
    } else if (parcel.id === 'field-c') {
      setSelectedResource('res-sugar-bagasse-br');
    } else if (parcel.id === 'field-d') {
      setSelectedResource('res-corn-stover-us');
    } else if (parcel.id === 'field-b') {
      setSelectedResource('res-spent-grain-eu');
    }
  };

  const handleMobilize = () => {
    if (activeParcel?.id === 'field-a') {
      setSelectedResource('res-rice-straw-up');
    } else if (activeParcel?.id === 'field-c') {
      setSelectedResource('res-sugar-bagasse-br');
    }
    navigate('/pathways');
  };

  return (
    <div className={`relative bg-[#181A20] border border-[#262B35] rounded-lg overflow-hidden shadow-2xl select-none ${className}`}>
      {/* Top Sector Map Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#121317]/95 border-b border-[#262B35]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">Sector Map Area</h2>
            <span className="text-[10px] font-mono text-[#E0FF20] bg-[#E0FF20]/15 px-2 py-0.5 rounded-full border border-[#E0FF20]/40 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E0FF20] animate-pulse" />
              Live Satellite NDVI
            </span>
            <span className="text-[10px] font-mono text-[#9EAAA5] hidden sm:inline">
              Copernicus Sentinel-2B (10m BOA)
            </span>
          </div>
          <p className="text-[11px] text-[#9EAAA5] mt-0.5 font-mono">
            Central Valley Sector Grid · Coordinates: {metadata?.centralCoordinates?.dms || '38°45\'57.2"N 121°42\'41.3"W'}
          </p>
        </div>

        {/* Real-time Sector Metrics Pills from image.png */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#1E222B] border border-[#262B35] rounded-md">
            <span className="text-[#9EAAA5] text-[10px]">Total Land Area:</span>
            <span className="font-bold text-white">{metadata.totalAcreage || 1107} ac</span>
            <span className="text-[#E0FF20] font-semibold text-[11px]">{metadata.activeAcreage || 1100} ac active</span>
            <span className="text-[#68756F] text-[11px]">{metadata.fallowAcreage || 7} ac fallow</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-[#1E222B] border border-[#262B35] rounded-md">
            <span className="text-[#9EAAA5] text-[10px]">Avg Health (NDVI):</span>
            <span className="font-bold text-[#E0FF20]">{Math.round((metadata.avgNdvi || 0.83) * 100)}%</span>
            <span className="text-[10px] text-[#6B8547] font-semibold">Optimal</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1E222B] border border-[#262B35] rounded-md">
            <span className="text-[#9EAAA5] text-[10px]">Total Fields:</span>
            <span className="font-bold text-white font-mono">{metadata.totalFieldsCount || 321}</span>
          </div>
        </div>

        {/* CIRQ Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="px-3 py-1.5 text-xs font-medium text-white bg-[#1E222B] hover:bg-[#252A36] border border-[#343B49] rounded-md transition-colors flex items-center gap-1.5"
            title="Ask AI assistant for crop & biomass recommendations"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E0FF20]" />
            <span className="hidden sm:inline">Ask to your AI assistant</span>
            <span className="sm:hidden">AI Query</span>
          </button>

          <button
            onClick={() => setShowAddFieldModal(true)}
            className="px-3 py-1.5 text-xs font-bold text-[#121317] bg-[#E0FF20] hover:bg-[#EEFF52] rounded-md transition-colors flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Field</span>
          </button>
        </div>
      </div>

      {/* Map Layer Toolbar & Map Controls */}
      <div className="absolute top-20 left-4 z-20 flex items-center gap-1.5 bg-[#121317]/90 backdrop-blur-md p-1 rounded-md border border-[#262B35] text-xs shadow-lg">
        <span className="text-[10px] font-mono text-[#9EAAA5] px-1.5 uppercase">Layer:</span>
        <button
          onClick={() => setActiveLayer('ALL')}
          className={`px-2 py-0.5 rounded-sm text-[11px] font-mono transition-colors ${
            activeLayer === 'ALL' ? 'bg-[#E0FF20] text-[#121317] font-bold' : 'text-[#9EAAA5] hover:text-white'
          }`}
        >
          All Parcels
        </button>
        <button
          onClick={() => setActiveLayer('NDVI')}
          className={`px-2 py-0.5 rounded-sm text-[11px] font-mono transition-colors ${
            activeLayer === 'NDVI' ? 'bg-[#6B8547] text-white font-bold' : 'text-[#9EAAA5] hover:text-white'
          }`}
        >
          NDVI Health
        </button>
        <button
          onClick={() => setActiveLayer('LOGISTICS')}
          className={`px-2 py-0.5 rounded-sm text-[11px] font-mono transition-colors ${
            activeLayer === 'LOGISTICS' ? 'bg-[#EF8B44] text-[#121317] font-bold' : 'text-[#9EAAA5] hover:text-white'
          }`}
        >
          Haulage Corridors
        </button>
        <button
          onClick={() => setActiveLayer('FACILITIES')}
          className={`px-2 py-0.5 rounded-sm text-[11px] font-mono transition-colors ${
            activeLayer === 'FACILITIES' ? 'bg-[#6DA8C8] text-[#121317] font-bold' : 'text-[#9EAAA5] hover:text-white'
          }`}
        >
          Processing Hubs
        </button>
      </div>

      {/* Zoom controls & Inspector Toggle */}
      <div className="absolute top-20 right-4 z-20 flex flex-col gap-1 bg-[#121317]/90 backdrop-blur-md p-1 rounded-md border border-[#262B35] shadow-lg">
        <button
          onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
          className="p-1.5 text-[#9EAAA5] hover:text-white hover:bg-[#1E222B] rounded-sm transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
          className="p-1.5 text-[#9EAAA5] hover:text-white hover:bg-[#1E222B] rounded-sm transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            setZoomLevel(1);
            setPanOffset({ x: 0, y: 0 });
          }}
          className="p-1.5 text-[#9EAAA5] hover:text-white hover:bg-[#1E222B] rounded-sm transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setInspectorOpen((prev) => !prev)}
          className={`p-1.5 rounded-sm transition-colors ${
            inspectorOpen ? 'text-[#E0FF20] bg-[#1E222B]' : 'text-[#9EAAA5] hover:text-white hover:bg-[#1E222B]'
          }`}
          title="Toggle Parcel Inspector"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* SVG Agricultural Landscape Viewport */}
      <div className="relative w-full overflow-hidden" style={{ height: `${svgHeight}px` }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full cursor-crosshair"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}
        >
          <defs>
            {/* Satellite Grid pattern */}
            <pattern id="cropFieldGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#262B35" strokeWidth="0.6" strokeOpacity="0.5" />
            </pattern>
            {/* Field Crop Furrow Textures */}
            <pattern id="furrowLines" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#343B49" strokeWidth="1.2" strokeOpacity="0.4" />
            </pattern>
            {/* Glowing filter */}
            <filter id="glowLime" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Deep Dark Satellite Canvas */}
          <rect width="100%" height="100%" fill="#121317" />
          <rect width="100%" height="100%" fill="url(#cropFieldGrid)" />

          {/* Geographic Coordinates Grid Marks */}
          <g opacity="0.4" className="font-mono text-[9px] fill-[#68756F]">
            <text x="12" y="24">38°46'30"N</text>
            <line x1="10" y1="28" x2={svgWidth - 10} y2="28" stroke="#262B35" strokeDasharray="3 6" />
            <text x="12" y="160">38°46'00"N</text>
            <line x1="10" y1="164" x2={svgWidth - 10} y2="164" stroke="#262B35" strokeDasharray="3 6" />
            <text x="12" y="320">38°45'30"N</text>
            <line x1="10" y1="324" x2={svgWidth - 10} y2="324" stroke="#262B35" strokeDasharray="3 6" />
            <text x="12" y="440">38°45'00"N</text>
            <line x1="10" y1="444" x2={svgWidth - 10} y2="444" stroke="#262B35" strokeDasharray="3 6" />

            <text x="180" y={svgHeight - 10}>121°43'00"W</text>
            <text x="450" y={svgHeight - 10}>121°42'30"W</text>
            <text x="720" y={svgHeight - 10}>121°42'00"W</text>
          </g>

          {/* Agricultural Sector Base Contour Landscape */}
          <g opacity="0.45">
            <path
              d="M 50 80 Q 240 40 450 90 T 850 60 L 880 430 Q 640 460 420 420 T 40 440 Z"
              fill="#181A20"
              stroke="#262B35"
              strokeWidth="1.2"
            />
            {/* Irrigation Canal Stream in Dark Olive Green */}
            <path
              d="M 60 240 C 260 220 540 250 870 230"
              fill="none"
              stroke="#6B8547"
              strokeWidth="5"
              strokeDasharray="8 4"
              strokeOpacity="0.6"
            />
          </g>

          {/* Real Logistics Corridors (LineStrings from GeoJSON) */}
          {(activeLayer === 'ALL' || activeLayer === 'LOGISTICS') && routeLines.map((line: any) => {
            const coords = line.geometry.coordinates;
            const points = coords.map((c: any) => {
              const pt = projectPoint(c[0], c[1]);
              return `${pt.x},${pt.y}`;
            }).join(' ');

            return (
              <g key={line.id}>
                {/* Glow route line */}
                <polyline
                  points={points}
                  fill="none"
                  stroke={line.properties.color || '#E0FF20'}
                  strokeWidth="5"
                  strokeOpacity="0.25"
                />
                {/* Animated dash corridor line */}
                <polyline
                  points={points}
                  fill="none"
                  stroke={line.properties.color || '#E0FF20'}
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  strokeOpacity="0.9"
                />
              </g>
            );
          })}

          {/* Agricultural Field Parcels (Polygons from GeoJSON) */}
          {polygonParcels.map((parcel: any) => {
            const ring = parcel.geometry.coordinates[0];
            const isSelected = activeParcel?.id === parcel.id;
            const props = parcel.properties;

            const pointsStr = ring.map((pt: any) => {
              const projected = projectPoint(pt[0], pt[1]);
              return `${projected.x},${projected.y}`;
            }).join(' ');

            // Calculate polygon centroid for label placement
            const ringPoints = ring.slice(0, ring.length - 1);
            const sumLng = ringPoints.reduce((acc: number, p: any) => acc + p[0], 0);
            const sumLat = ringPoints.reduce((acc: number, p: any) => acc + p[1], 0);
            const centerLng = sumLng / ringPoints.length;
            const centerLat = sumLat / ringPoints.length;
            const centerPt = projectPoint(centerLng, centerLat);

            const fillColor = activeLayer === 'NDVI'
              ? (props.ndvi >= 0.85 ? '#E0FF20' : props.ndvi >= 0.70 ? '#6B8547' : '#EF8B44')
              : (props.color || '#E0FF20');

            return (
              <g
                key={parcel.id}
                className="cursor-pointer group"
                onClick={() => handleSelectField(parcel)}
              >
                {/* Parcel Boundary Polygon */}
                <polygon
                  points={pointsStr}
                  fill={fillColor}
                  fillOpacity={isSelected ? 0.45 : props.fillOpacity || 0.25}
                  stroke={isSelected ? '#FFFFFF' : props.strokeColor || '#E0FF20'}
                  strokeWidth={isSelected ? 3 : 1.8}
                  className="transition-all duration-200 group-hover:fill-opacity-50"
                  filter={isSelected ? 'url(#glowLime)' : undefined}
                />

                {/* Crop Furrows Pattern overlay */}
                <polygon
                  points={pointsStr}
                  fill="url(#furrowLines)"
                  pointerEvents="none"
                  opacity={isSelected ? 0.4 : 0.2}
                />

                {/* Parcel Center Label Pin matching image.png */}
                <g transform={`translate(${centerPt.x}, ${centerPt.y})`}>
                  <rect
                    x="-55"
                    y="-16"
                    width="110"
                    height="32"
                    rx="6"
                    fill="#121317"
                    stroke={isSelected ? '#E0FF20' : '#262B35'}
                    strokeWidth={isSelected ? 1.8 : 1.2}
                    className="shadow-lg"
                  />
                  <text
                    textAnchor="middle"
                    y="-3"
                    fill="#FFFFFF"
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {props.name.split('/')[1]?.trim() || props.name}
                  </text>
                  <text
                    textAnchor="middle"
                    y="10"
                    fill="#E0FF20"
                    fontSize="8.5"
                    fontFamily="monospace"
                  >
                    {props.acreage} ac · NDVI {props.ndvi}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Regional Processing Hubs (Point features) */}
          {(activeLayer === 'ALL' || activeLayer === 'LOGISTICS' || activeLayer === 'FACILITIES') && facilityPoints.map((fac: any) => {
            const pt = projectPoint(fac.geometry.coordinates[0], fac.geometry.coordinates[1]);
            return (
              <g key={fac.id} transform={`translate(${pt.x}, ${pt.y})`} className="cursor-pointer">
                <circle r="16" fill={fac.properties.color || '#E0FF20'} fillOpacity="0.15" className="animate-ping" />
                <circle r="12" fill="#121317" stroke={fac.properties.color || '#E0FF20'} strokeWidth="2" />
                <circle r="5" fill={fac.properties.color || '#E0FF20'} />
                <rect
                  x="16"
                  y="-10"
                  width="180"
                  height="20"
                  rx="4"
                  fill="#121317"
                  fillOpacity="0.85"
                  stroke="#262B35"
                  strokeWidth="1"
                />
                <text
                  x="22"
                  y="4"
                  fill="#FFFFFF"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {fac.properties.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Map Legend in Bottom Left */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 bg-[#121317]/90 backdrop-blur-md px-3 py-1.5 rounded-md border border-[#262B35] text-[10px] font-mono text-[#9EAAA5]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#E0FF20]" />
            <span>Rice / Bagasse / Almonds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#6B8547]" />
            <span>Wheat / Cover Rest</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#EF8B44]" />
            <span>Maize Stover</span>
          </div>
        </div>

        {/* Floating CIRQ Parcel Inspection Card */}
        {activeParcel && inspectorOpen && (
          <div className="absolute top-14 right-4 z-20 w-80 p-4 bg-[#121317]/95 border border-[#343B49] rounded-lg shadow-2xl backdrop-blur-md text-xs space-y-3">
            {/* Card Header: Field ID & Health */}
            <div className="flex items-start justify-between pb-2 border-b border-[#262B35]">
              <div>
                <span className="text-[10px] font-mono text-[#9EAAA5] uppercase block">Selected Sector Parcel</span>
                <h3 className="text-sm font-bold text-white tracking-tight">{activeParcel.properties.name}</h3>
                <span className="text-[10px] font-mono text-[#E0FF20] block mt-0.5">
                  Central Valley [{activeParcel.properties.acreage} ac · {activeParcel.properties.hectares} ha]
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E0FF20]/20 text-[#E0FF20] border border-[#E0FF20]/50">
                NDVI {activeParcel.properties.ndvi}
              </span>
            </div>

            {/* Crop & Agronomic KPIs */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 bg-[#181A20] rounded border border-[#262B35]">
                <span className="text-[10px] text-[#9EAAA5] block">Crop Cultivar</span>
                <span className="font-bold text-white truncate block">{activeParcel.properties.cropType}</span>
                <span className="text-[9px] text-[#6B8547] truncate block">{activeParcel.properties.variety}</span>
              </div>
              <div className="p-2 bg-[#181A20] rounded border border-[#262B35]">
                <span className="text-[10px] text-[#9EAAA5] block">Soil Moisture</span>
                <span className="font-bold text-[#E0FF20]">{activeParcel.properties.soilMoisturePercent}%</span>
                <span className="text-[9px] text-[#9EAAA5] block">{activeParcel.properties.pestStatus}</span>
              </div>
            </div>

            {/* Economics & Bioeconomy Potential */}
            <div className="space-y-1.5 p-2.5 bg-[#1E222B] rounded border border-[#262B35] text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-[#9EAAA5]">Production Cost:</span>
                <span className="font-bold text-white">${activeParcel.properties.productionCostUsd}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9EAAA5]">Expected Revenue:</span>
                <span className="font-bold text-[#E0FF20]">${activeParcel.properties.expectedRevenueUsd}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#343B49]">
                <span className="text-[#9EAAA5]">Available Residue:</span>
                <span className="font-bold text-[#E0FF20]">{activeParcel.properties.biomassResidueTons} t ({activeParcel.properties.residueType})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9EAAA5]">Carbon Offset:</span>
                <span className="font-bold text-white">{activeParcel.properties.co2eOffsetTons} tCO₂e</span>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleMobilize}
                className="flex-1 py-1.5 bg-[#E0FF20] hover:bg-[#EEFF52] text-[#121317] font-bold text-xs rounded transition-colors text-center shadow-sm flex items-center justify-center gap-1"
              >
                <span>Mobilize Biomass</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate('/matching')}
                className="py-1.5 px-3 bg-[#1E222B] hover:bg-[#252A36] text-white border border-[#262B35] text-xs rounded transition-colors"
                title="Match with regional processors"
              >
                Match
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Lifecycle Tracking Component from image.png */}
      <div className="p-4 bg-[#121317] border-t border-[#262B35]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Lifecycle Tracking</span>
              <span className="text-[11px] text-[#9EAAA5] font-mono">
                {activeParcel?.properties?.cropType || 'Boro Rice (HYV)'} · Planted {activeParcel?.properties?.plantingDate || 'Mar 26, 2026'}
              </span>
            </div>
          </div>
          <div className="text-xs font-mono text-[#E0FF20] font-bold">
            Progress: {activeParcel?.properties?.stagePercent || 65}% · Days in Stage: {activeParcel?.properties?.stageDays || '82 / 125 days'}
          </div>
        </div>

        {/* Circular Stages Timeline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {[
            { step: '1', name: 'Land Prep', done: true },
            { step: '2', name: 'Transplanting', done: true },
            { step: '3', name: 'Vegetative Phase', done: true },
            { step: '4', name: 'Booting & Panicle', current: activeParcel?.id === 'field-a' },
            { step: '5', name: 'Flowering & Silking', current: activeParcel?.id === 'field-d' },
            { step: '6', name: 'Ripening / Maturation', current: activeParcel?.id === 'field-b' || activeParcel?.id === 'field-c' },
            { step: '7', name: 'Harvest Residue', current: activeParcel?.id === 'field-e', pending: activeParcel?.id !== 'field-e' }
          ].map((phase, idx) => (
            <div
              key={idx}
              className={`p-2 rounded border text-center transition-all ${
                phase.current
                  ? 'bg-[#1E222B] border-[#E0FF20] shadow-sm'
                  : phase.done
                  ? 'bg-[#181A20] border-[#6B8547]'
                  : 'bg-[#15171D] border-[#262B35] opacity-60'
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                    phase.current
                      ? 'bg-[#E0FF20] text-[#121317]'
                      : phase.done
                      ? 'bg-[#6B8547] text-white'
                      : 'bg-[#262B35] text-[#9EAAA5]'
                  }`}
                >
                  {phase.step}
                </span>
              </div>
              <span
                className={`text-[10px] font-medium block truncate ${
                  phase.current ? 'text-[#E0FF20] font-bold' : phase.done ? 'text-white' : 'text-[#68756F]'
                }`}
              >
                {phase.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Field Modal */}
      {showAddFieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#181A20] border border-[#262B35] rounded-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#262B35]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#E0FF20]" />
                Register New Sector Field Parcel
              </h3>
              <button
                onClick={() => setShowAddFieldModal(false)}
                className="text-[#9EAAA5] hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#9EAAA5] block mb-1">Field Label / Sector Designation</label>
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="e.g. Area-6 / Field-F"
                  className="w-full bg-[#121317] border border-[#262B35] rounded px-3 py-1.5 text-white focus:border-[#E0FF20] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[#9EAAA5] block mb-1">Crop Cultivar & Variety</label>
                <input
                  type="text"
                  value={newFieldCrop}
                  onChange={(e) => setNewFieldCrop(e.target.value)}
                  className="w-full bg-[#121317] border border-[#262B35] rounded px-3 py-1.5 text-white focus:border-[#E0FF20] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[#9EAAA5] block mb-1">Acreage (ac)</label>
                <input
                  type="number"
                  value={newFieldAcreage}
                  onChange={(e) => setNewFieldAcreage(e.target.value)}
                  className="w-full bg-[#121317] border border-[#262B35] rounded px-3 py-1.5 text-white focus:border-[#E0FF20] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#262B35]">
              <button
                onClick={() => setShowAddFieldModal(false)}
                className="px-3 py-1.5 text-xs text-[#9EAAA5] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAddFieldModal(false);
                }}
                className="px-4 py-1.5 text-xs font-bold bg-[#E0FF20] hover:bg-[#EEFF52] text-[#121317] rounded"
              >
                Register Field
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
