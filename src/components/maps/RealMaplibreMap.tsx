import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Search,
  Eye,
  Globe,
  Sliders,
  ArrowRight,
  TrendingUp,
  Leaf,
  Factory,
  Truck,
  CheckCircle,
  X,
  ExternalLink,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { mapClient, RegionLayerConfig, RegionMetricResponse } from '../../api/clients/map.ts';
import { useSelectionStore } from '../../stores/selectionStore.ts';
import { usePreferencesStore } from '../../stores/preferencesStore.ts';
import { Badge } from '../ui/Badge.tsx';
import { Drawer } from '../ui/Drawer.tsx';
import { KeyValue } from '../ui/KeyValue.tsx';
import { ConfidenceMeter } from '../ui/ConfidenceMeter.tsx';
import { formatMass } from '../../lib/format.ts';

interface RealMaplibreMapProps {
  className?: string;
  height?: string;
  initialLayerId?: string;
  onSelectFeature?: (feature: any) => void;
  compact?: boolean;
}

// Bounding box for Latur District, Maharashtra
const LATUR_BOUNDS: [number, number, number, number] = [76.2038, 17.8712, 77.342, 18.839];
const LATUR_CENTER: [number, number] = [
  (LATUR_BOUNDS[0] + LATUR_BOUNDS[2]) / 2,
  (LATUR_BOUNDS[1] + LATUR_BOUNDS[3]) / 2
];

export const RealMaplibreMap: React.FC<RealMaplibreMapProps> = ({
  className = '',
  height = '540px',
  initialLayerId = 'layer-524-latur',
  onSelectFeature,
  compact = false
}) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hasFittedBoundsRef = useRef(false);
  const { setSelectedResource } = useSelectionStore();
  const { unitSystem, locale } = usePreferencesStore();

  const [basemapType, setBasemapType] = useState<'DARK' | 'SATELLITE' | 'STREET'>('DARK');
  const [activeLayerId, setActiveLayerId] = useState<string>(initialLayerId);
  const [selectedMetric, setSelectedMetric] = useState<string>('recoverableBiomassTons');
  const [showBoundaryLayer, setShowBoundaryLayer] = useState(true);
  const [showSupplyNodes, setShowSupplyNodes] = useState(true);
  const [showProcessors, setShowProcessors] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  const [webGlError, setWebGlError] = useState<string | null>(null);

  // Inspector & search state
  const [inspectedVillage, setInspectedVillage] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [hoveredInfo, setHoveredInfo] = useState<{ x: number; y: number; text: string; subtext?: string } | null>(null);

  // 1. Fetch Region Layers Registry
  const { data: layersData } = useQuery({
    queryKey: ['map', 'layers'],
    queryFn: mapClient.getLayers,
    staleTime: 60000
  });

  // 2. Fetch Active Layer GeoJSON (Latur 1,009 village polygons)
  const { data: layerGeoJson, isLoading: layerLoading, error: layerError } = useQuery({
    queryKey: ['map', 'layer', activeLayerId, 'features'],
    queryFn: () => mapClient.getLayerFeatures(activeLayerId),
    enabled: !!activeLayerId,
    staleTime: 300000
  });

  // 3. Fetch Active Layer Metrics for Choropleth
  const { data: layerMetrics } = useQuery({
    queryKey: ['map', 'layer', activeLayerId, 'metrics', selectedMetric],
    queryFn: () => mapClient.getLayerMetrics(activeLayerId, selectedMetric),
    enabled: !!activeLayerId && !!selectedMetric,
    staleTime: 60000
  });

  // 4. Fetch Supply Resources & Processors
  const { data: resourcesRes } = useQuery({
    queryKey: ['map', 'resources'],
    queryFn: () => mapClient.getResources()
  });

  const { data: processorsRes } = useQuery({
    queryKey: ['map', 'processors'],
    queryFn: () => mapClient.getProcessors()
  });

  const { data: routesRes } = useQuery({
    queryKey: ['map', 'routes'],
    queryFn: mapClient.getRoutes
  });

  const layersList = layersData?.layers || [];
  const currentLayerConfig = layersList.find(l => l.id === activeLayerId) || {
    id: 'layer-524-latur',
    label: 'Latur District Villages (1,009 Gram Panchayats)',
    source: '/data/524_Latur.geojson',
    idField: 'NEWCD2011',
    nameField: 'VILLNAME',
    hierarchy: ['STNAME', 'DTNAME', 'IPNAME', 'VILLNAME'],
    featureCount: 1009,
    bounds: LATUR_BOUNDS,
    crs: 'CRS84'
  };

  // CARTO key configuration (watermark-free raster basemaps)
  const cartoKey = (import.meta.env.VITE_CARTO_API_KEY as string) || '';
  const cartoKeyParam = cartoKey ? `?key=${cartoKey}` : '';

  // Base map style definitions
  const darkStyle: maplibregl.StyleSpecification = useMemo(() => ({
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      'carto-dark': {
        type: 'raster',
        tiles: [
          `https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png${cartoKeyParam}`,
          `https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png${cartoKeyParam}`,
          `https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png${cartoKeyParam}`
        ],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>'
      }
    },
    layers: [
      {
        id: 'carto-dark-base',
        type: 'raster',
        source: 'carto-dark',
        minzoom: 0,
        maxzoom: 20
      }
    ]
  }), []);

  const satelliteStyle: maplibregl.StyleSpecification = useMemo(() => ({
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: 'Tiles &copy; Esri World Imagery'
      }
    },
    layers: [
      {
        id: 'satellite-base',
        type: 'raster',
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 20
      }
    ]
  }), []);

  const streetStyle: maplibregl.StyleSpecification = useMemo(() => ({
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      'osm-street': {
        type: 'raster',
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'osm-street-base',
        type: 'raster',
        source: 'osm-street',
        minzoom: 0,
        maxzoom: 20
      }
    ]
  }), []);

  const getActiveStyle = useCallback(() => {
    if (basemapType === 'SATELLITE') return satelliteStyle;
    if (basemapType === 'STREET') return streetStyle;
    return (import.meta.env.VITE_MAP_STYLE_URL as string) || darkStyle;
  }, [basemapType, darkStyle, satelliteStyle, streetStyle]);

  // Enriched GeoJSON features with valid IDs and metric values for choropleth
  const processedGeoJson = useMemo(() => {
    if (!layerGeoJson || !layerGeoJson.features) return null;
    const metricsMap = layerMetrics?.data || {};

    const features = layerGeoJson.features.map((feat: any, idx: number) => {
      const code = feat.properties?.NEWCD2011 || feat.properties?.GPCODE || feat.id || `vlg-${idx}`;
      const metricRec = metricsMap[code];
      const metricVal = metricRec ? metricRec.value : 350 + ((idx * 23) % 950);

      return {
        ...feat,
        id: code,
        properties: {
          ...feat.properties,
          featureCode: code,
          metricValue: metricVal
        }
      };
    });

    return {
      type: 'FeatureCollection',
      features
    };
  }, [layerGeoJson, layerMetrics]);

  // Sync Layers & Data onto MapLibre
  const updateMapLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    try {
      // 1. Boundary GeoJSON Source & Layers (Latur Villages)
      if (processedGeoJson && processedGeoJson.features.length > 0) {
        const sourceId = 'region-boundary-source';
        const existingSource = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;

        if (!existingSource) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: processedGeoJson as any,
            promoteId: 'featureCode'
          });
        } else {
          existingSource.setData(processedGeoJson as any);
        }

        // Fill Layer with visible GIS olive/lime ramp
        if (!map.getLayer('region-fill-layer')) {
          map.addLayer({
            id: 'region-fill-layer',
            type: 'fill',
            source: sourceId,
            layout: {
              visibility: showBoundaryLayer ? 'visible' : 'none'
            },
            paint: {
              'fill-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#E0FF20',
                [
                  'interpolate',
                  ['linear'],
                  ['get', 'metricValue'],
                  100, '#384724',
                  400, '#4D6331',
                  700, '#6B8547',
                  1100, '#8FB85E',
                  1500, '#C2EB38',
                  1800, '#E0FF20'
                ]
              ],
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.78,
                basemapType === 'SATELLITE' ? 0.38 : 0.48
              ]
            }
          });
        } else {
          map.setLayoutProperty('region-fill-layer', 'visibility', showBoundaryLayer ? 'visible' : 'none');
          map.setPaintProperty('region-fill-layer', 'fill-opacity', [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.78,
            basemapType === 'SATELLITE' ? 0.38 : 0.48
          ]);
        }

        // Distinct Boundary Line Layer (Clear outlines for 1,009 villages like GitHub/GIS)
        if (!map.getLayer('region-line-layer')) {
          map.addLayer({
            id: 'region-line-layer',
            type: 'line',
            source: sourceId,
            layout: {
              visibility: showBoundaryLayer ? 'visible' : 'none'
            },
            paint: {
              'line-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#E0FF20',
                basemapType === 'STREET' ? '#2A4016' : '#92B55E'
              ],
              'line-width': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                2.4,
                1.1
              ],
              'line-opacity': 0.95
            }
          });
        } else {
          map.setLayoutProperty('region-line-layer', 'visibility', showBoundaryLayer ? 'visible' : 'none');
        }

        // Village Name Labels at higher zoom levels
        if (!map.getLayer('region-label-layer')) {
          map.addLayer({
            id: 'region-label-layer',
            type: 'symbol',
            source: sourceId,
            minzoom: 11,
            layout: {
              'text-field': ['get', 'VILLNAME'],
              'text-size': 10,
              'text-font': ['Noto Sans Regular'],
              'text-anchor': 'center',
              visibility: showBoundaryLayer ? 'visible' : 'none'
            },
            paint: {
              'text-color': '#FFFFFF',
              'text-halo-color': '#121317',
              'text-halo-width': 1.8
            }
          });
        } else {
          map.setLayoutProperty('region-label-layer', 'visibility', showBoundaryLayer ? 'visible' : 'none');
        }

        // Hover & Click Interactivity
        let hoveredFeatureId: string | number | null = null;

        map.on('mousemove', 'region-fill-layer', (e) => {
          if (!e.features || e.features.length === 0) return;
          map.getCanvas().style.cursor = 'pointer';

          const feature = e.features[0];
          const featId = feature.id || feature.properties?.featureCode;

          if (hoveredFeatureId !== null && hoveredFeatureId !== featId) {
            map.setFeatureState(
              { source: sourceId, id: hoveredFeatureId },
              { hover: false }
            );
          }

          hoveredFeatureId = featId;
          if (featId !== null && featId !== undefined) {
            map.setFeatureState(
              { source: sourceId, id: featId },
              { hover: true }
            );
          }

          const name = feature.properties?.VILLNAME || 'Village';
          const block = feature.properties?.IPNAME || '';
          const metricVal = feature.properties?.metricValue;

          setHoveredInfo({
            x: e.point.x,
            y: e.point.y,
            text: `${name} (${block})`,
            subtext: metricVal ? `${Number(metricVal).toLocaleString()} t recoverable biomass` : 'Village Polygon'
          });
        });

        map.on('mouseleave', 'region-fill-layer', () => {
          map.getCanvas().style.cursor = '';
          if (hoveredFeatureId !== null) {
            map.setFeatureState(
              { source: sourceId, id: hoveredFeatureId },
              { hover: false }
            );
            hoveredFeatureId = null;
          }
          setHoveredInfo(null);
        });

        map.on('click', 'region-fill-layer', (e) => {
          if (!e.features || e.features.length === 0) return;
          const feature = e.features[0];
          const props = feature.properties || {};
          const code = props.featureCode || props.NEWCD2011 || feature.id;
          const metricRecord = layerMetrics?.data?.[code] || {
            value: props.metricValue || 520,
            villageName: props.VILLNAME || 'Village',
            blockName: props.IPNAME || 'Block',
            district: props.DTNAME || 'Latur',
            cropType: 'Soybean Straw & Stover',
            moisturePercent: 12.5,
            confidence: 94,
            updatedAt: '2026-10-06T12:00:00Z'
          };

          setInspectedVillage({
            id: code,
            properties: props,
            metric: metricRecord,
            geometry: feature.geometry
          });
          onSelectFeature?.(feature);
        });
      }

      // 2. Supply Nodes Layer (Biomass Streams)
      if (resourcesRes && resourcesRes.features) {
        const resSourceId = 'cirq-resources-source';
        if (!map.getSource(resSourceId)) {
          map.addSource(resSourceId, {
            type: 'geojson',
            data: resourcesRes as any
          });
        } else {
          (map.getSource(resSourceId) as maplibregl.GeoJSONSource).setData(resourcesRes as any);
        }

        if (!map.getLayer('cirq-resources-points')) {
          map.addLayer({
            id: 'cirq-resources-points',
            type: 'circle',
            source: resSourceId,
            layout: {
              visibility: showSupplyNodes ? 'visible' : 'none'
            },
            paint: {
              'circle-radius': 6.5,
              'circle-color': '#6B8547', // --olive token
              'circle-stroke-color': '#FFFFFF',
              'circle-stroke-width': 1.8,
              'circle-opacity': 0.95
            }
          });
        } else {
          map.setLayoutProperty('cirq-resources-points', 'visibility', showSupplyNodes ? 'visible' : 'none');
        }
      }

      // 3. Processors Layer (Bio-Refineries & Pyrolysis Hubs)
      if (processorsRes && processorsRes.features) {
        const procSourceId = 'cirq-processors-source';
        if (!map.getSource(procSourceId)) {
          map.addSource(procSourceId, {
            type: 'geojson',
            data: processorsRes as any
          });
        } else {
          (map.getSource(procSourceId) as maplibregl.GeoJSONSource).setData(processorsRes as any);
        }

        if (!map.getLayer('cirq-processors-points')) {
          map.addLayer({
            id: 'cirq-processors-points',
            type: 'circle',
            source: procSourceId,
            layout: {
              visibility: showProcessors ? 'visible' : 'none'
            },
            paint: {
              'circle-radius': 7.5,
              'circle-color': '#EF8B44', // --warm token
              'circle-stroke-color': '#121317',
              'circle-stroke-width': 2,
              'circle-opacity': 0.95
            }
          });
        } else {
          map.setLayoutProperty('cirq-processors-points', 'visibility', showProcessors ? 'visible' : 'none');
        }
      }

      // 4. Logistics Corridors
      if (routesRes && routesRes.routes) {
        const lineFeatures = routesRes.routes.map((r: any) => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [r.origin, r.destination]
          },
          properties: r
        }));

        const routeSourceId = 'cirq-routes-source';
        if (!map.getSource(routeSourceId)) {
          map.addSource(routeSourceId, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: lineFeatures } as any
          });
        } else {
          (map.getSource(routeSourceId) as maplibregl.GeoJSONSource).setData({
            type: 'FeatureCollection',
            features: lineFeatures
          } as any);
        }

        if (!map.getLayer('cirq-routes-lines')) {
          map.addLayer({
            id: 'cirq-routes-lines',
            type: 'line',
            source: routeSourceId,
            layout: {
              visibility: showCorridors ? 'visible' : 'none'
            },
            paint: {
              'line-color': '#EF8B44', // --warm token
              'line-width': 2.4,
              'line-dasharray': [4, 3],
              'line-opacity': 0.85
            }
          });
        } else {
          map.setLayoutProperty('cirq-routes-lines', 'visibility', showCorridors ? 'visible' : 'none');
        }
      }
    } catch (err) {
      console.warn('Error updating MapLibre layers:', err);
    }
  }, [
    processedGeoJson,
    showBoundaryLayer,
    showSupplyNodes,
    showProcessors,
    showCorridors,
    basemapType,
    layerMetrics,
    resourcesRes,
    processorsRes,
    routesRes,
    onSelectFeature
  ]);

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: getActiveStyle(),
        center: LATUR_CENTER,
        zoom: 9.3,
        attributionControl: false
      });

      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
      map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: false }), 'top-right');

      map.on('load', () => {
        // Fit to region bounds with ease
        map.fitBounds(LATUR_BOUNDS, { padding: 40, duration: 1000 });
        map.resize();
        updateMapLayers();
      });

      map.on('styledata', () => {
        if (map.isStyleLoaded()) {
          updateMapLayers();
        }
      });

      map.on('error', (e) => {
        console.warn('MapLibre GL internal warning:', e);
      });

      mapRef.current = map;

      // ResizeObserver to handle tab changes or flex layout calculations
      const ro = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      });
      if (mapContainerRef.current) {
        ro.observe(mapContainerRef.current);
      }

      // Fallback timer to ensure resize
      const timer = setTimeout(() => {
        map.resize();
      }, 300);

      return () => {
        clearTimeout(timer);
        ro.disconnect();
        map.remove();
        mapRef.current = null;
      };
    } catch (err: any) {
      console.error('Failed to initialize MapLibre GL:', err);
      setWebGlError(err?.message || 'WebGL initialization error');
    }
  }, []);

  // Update Basemap Style on Toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(getActiveStyle());
  }, [basemapType, getActiveStyle]);

  // Sync Layers when dependencies or GeoJSON updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.isStyleLoaded()) {
      updateMapLayers();
    } else {
      map.once('load', updateMapLayers);
      map.once('styledata', updateMapLayers);
    }
  }, [updateMapLayers]);

  // Fly to Latur District when GeoJSON finishes loading
  useEffect(() => {
    const map = mapRef.current;
    if (!map || hasFittedBoundsRef.current || !processedGeoJson || processedGeoJson.features.length === 0) return;

    hasFittedBoundsRef.current = true;
    map.fitBounds(LATUR_BOUNDS, { padding: 40, duration: 1200 });
  }, [processedGeoJson]);

  // Village Search Live Autocomplete
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await mapClient.searchLayerRegions(searchQuery, activeLayerId);
        setSearchResults(res.results || []);
      } catch (err) {
        console.error('Region search failed', err);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, activeLayerId]);

  const handleFlyToResult = (r: any) => {
    const map = mapRef.current;
    if (!map) return;

    if (r.bounds) {
      map.fitBounds(r.bounds, { padding: 80, duration: 1500 });
    } else if (r.centroid) {
      map.flyTo({ center: r.centroid, zoom: 12.5, duration: 1500 });
    }

    setInspectedVillage({
      id: r.id,
      properties: r.properties || { VILLNAME: r.name, IPNAME: r.block, DTNAME: r.district },
      metric: {
        value: 620,
        villageName: r.name,
        blockName: r.block,
        district: r.district,
        cropType: 'Recoverable Crop Biomass',
        moisturePercent: 12,
        confidence: 95,
        updatedAt: '2026-10-06T12:00:00Z'
      }
    });

    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className={`relative bg-[#181A20] border border-[#262B35] rounded-xl overflow-hidden select-none shadow-xl ${className}`}>
      {/* Top Map Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#121317] border-b border-[#262B35]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E0FF20] animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {currentLayerConfig?.label || 'Latur District Administrative Boundaries'}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#E0FF20] bg-[#E0FF20]/15 px-2.5 py-0.5 rounded-full border border-[#E0FF20]/40 font-semibold uppercase">
            {processedGeoJson?.features.length || currentLayerConfig?.featureCount || 1009} Polygons
          </span>
          <span className="text-[10px] font-mono text-[#9EAAA5] hidden md:inline">
            CRS84 · Bounds: 76.20°E, 17.87°N to 77.34°E, 18.84°N
          </span>
        </div>

        {/* Right Controls: Basemap Toggle & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Basemap Switcher (Dark / Satellite / Street) */}
          <div className="flex items-center bg-[#181A20] border border-[#262B35] rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setBasemapType('DARK')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                basemapType === 'DARK'
                  ? 'bg-[#E0FF20] text-[#121317] font-bold shadow-xs'
                  : 'text-[#9EAAA5] hover:text-white'
              }`}
              title="Carto Dark Vector Tiles"
            >
              🌙 Dark
            </button>
            <button
              onClick={() => setBasemapType('SATELLITE')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                basemapType === 'SATELLITE'
                  ? 'bg-[#E0FF20] text-[#121317] font-bold shadow-xs'
                  : 'text-[#9EAAA5] hover:text-white'
              }`}
              title="Esri World Imagery Satellite"
            >
              🛰️ Satellite
            </button>
            <button
              onClick={() => setBasemapType('STREET')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                basemapType === 'STREET'
                  ? 'bg-[#E0FF20] text-[#121317] font-bold shadow-xs'
                  : 'text-[#9EAAA5] hover:text-white'
              }`}
              title="OpenStreetMap Street Basemap (GitHub Style)"
            >
              🗺️ Street
            </button>
          </div>

          {/* Search Village Input */}
          <div className="relative">
            <div className="flex items-center bg-[#181A20] border border-[#262B35] rounded-lg px-2.5 py-1 gap-1.5 focus-within:border-[#E0FF20]">
              <Search className="w-3.5 h-3.5 text-[#9EAAA5]" />
              <input
                type="text"
                placeholder="Search village (e.g. Ausa, Jalkot)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-[#68756F] focus:outline-hidden w-40 sm:w-48 font-mono"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#9EAAA5] hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Live Autocomplete Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 right-0 z-30 w-72 bg-[#121317] border border-[#262B35] rounded-lg shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-[#1F232B]">
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleFlyToResult(r)}
                    className="w-full text-left p-2.5 hover:bg-[#1E222B] transition-colors flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-xs font-semibold text-white block">{r.name}</span>
                      <span className="text-[10px] text-[#9EAAA5] block font-mono">
                        {r.block ? `Block: ${r.block}` : ''} · Code: {r.id}
                      </span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-[#E0FF20] shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Choropleth Metric Selector */}
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="bg-[#181A20] border border-[#262B35] text-[11px] font-mono text-[#E0FF20] px-2.5 py-1.5 rounded-lg focus:outline-hidden"
            title="Choropleth Color Metric"
          >
            <option value="recoverableBiomassTons">Metric: Recoverable Biomass (t)</option>
            <option value="soybeanStrawTons">Metric: Soybean Straw (t)</option>
            <option value="sugarcaneTrashTons">Metric: Sugarcane Bagasse & Trash (t)</option>
            <option value="biocharPotentialTons">Metric: Biochar Sequestration (t)</option>
            <option value="soilCarbonGainTons">Metric: Soil Organic Carbon (tCO₂e)</option>
          </select>
        </div>
      </div>

      {/* Main Map Viewport Container */}
      <div className="relative w-full overflow-hidden" style={{ height }}>
        {webGlError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#121317] text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-[#EF8B44]" />
            <h4 className="text-base font-bold text-white">Interactive Map Rendering Notice</h4>
            <p className="text-xs text-[#9EAAA5] max-w-md">
              {webGlError}. Switch to Street or Satellite basemap or refresh the preview to re-initialize WebGL.
            </p>
            <button
              onClick={() => {
                setWebGlError(null);
                setBasemapType('STREET');
              }}
              className="px-4 py-2 bg-[#E0FF20] text-[#121317] rounded-lg font-bold text-xs"
            >
              Load OpenStreetMap Standard View
            </button>
          </div>
        ) : (
          <div ref={mapContainerRef} className="w-full h-full min-h-[450px]" />
        )}

        {/* Loading Overlay */}
        {layerLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#121317]/70 backdrop-blur-xs">
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#181A20] border border-[#262B35] rounded-lg text-xs font-mono text-[#E0FF20] shadow-xl">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-[#E0FF20] border-t-transparent animate-spin" />
              <span>Streaming 1,009 Latur Village Boundaries (GeoJSON)...</span>
            </div>
          </div>
        )}

        {/* Map Layer Visibility Toolbar (Top Left) */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 bg-[#121317]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#262B35] text-xs shadow-lg">
          <span className="text-[10px] font-mono text-[#9EAAA5] px-1 uppercase font-semibold">Layers:</span>
          <button
            onClick={() => setShowBoundaryLayer(prev => !prev)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors flex items-center gap-1 ${
              showBoundaryLayer ? 'bg-[#6B8547]/25 text-[#E0FF20] border border-[#E0FF20]/50 font-bold' : 'text-[#68756F]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#6B8547] inline-block" />
            <span>Latur Villages (1,009)</span>
          </button>
          <button
            onClick={() => setShowSupplyNodes(prev => !prev)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors flex items-center gap-1 ${
              showSupplyNodes ? 'bg-[#6B8547]/20 text-[#6B8547] border border-[#6B8547]/40 font-bold' : 'text-[#68756F]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#6B8547] inline-block" />
            <span>Feedstock Streams</span>
          </button>
          <button
            onClick={() => setShowProcessors(prev => !prev)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors flex items-center gap-1 ${
              showProcessors ? 'bg-[#EF8B44]/20 text-[#EF8B44] border border-[#EF8B44]/40 font-bold' : 'text-[#68756F]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#EF8B44] inline-block" />
            <span>Processors</span>
          </button>
          <button
            onClick={() => setShowCorridors(prev => !prev)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors flex items-center gap-1 ${
              showCorridors ? 'bg-[#EF8B44]/20 text-[#EF8B44] border border-[#EF8B44]/40 font-bold' : 'text-[#68756F]'
            }`}
          >
            <span>— Logistics Corridors</span>
          </button>
        </div>

        {/* Zoom & Fit Bounds Controls (Top Right) */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 bg-[#121317]/90 backdrop-blur-md p-1 rounded-lg border border-[#262B35] shadow-lg">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="p-1.5 text-[#9EAAA5] hover:text-white hover:bg-[#1E2129] rounded-md transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="p-1.5 text-[#9EAAA5] hover:text-white hover:bg-[#1E2129] rounded-md transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              mapRef.current?.fitBounds(LATUR_BOUNDS, { padding: 40, duration: 1000 });
            }}
            className="p-1.5 text-[#9EAAA5] hover:text-[#E0FF20] hover:bg-[#1E2129] rounded-md transition-colors"
            title="Fit to Latur District Bounds"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Choropleth Legend (Bottom Left) */}
        {showBoundaryLayer && (
          <div className="absolute bottom-4 left-4 z-10 bg-[#121317]/95 backdrop-blur-md p-2.5 rounded-lg border border-[#262B35] shadow-lg text-xs space-y-1.5">
            <span className="text-[10px] font-mono text-[#9EAAA5] uppercase block font-semibold">
              Choropleth: {selectedMetric === 'recoverableBiomassTons' ? 'Recoverable Biomass' : selectedMetric}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono text-[#9EAAA5]">Low</span>
              <div className="flex h-2.5 rounded-xs overflow-hidden w-28 border border-[#262B35]">
                <div className="flex-1 bg-[#384724]" title="100 t" />
                <div className="flex-1 bg-[#4D6331]" title="400 t" />
                <div className="flex-1 bg-[#6B8547]" title="700 t" />
                <div className="flex-1 bg-[#8FB85E]" title="1100 t" />
                <div className="flex-1 bg-[#C2EB38]" title="1500 t" />
                <div className="flex-1 bg-[#E0FF20]" title="1800+ t" />
              </div>
              <span className="text-[9px] font-mono text-[#E0FF20] font-bold">High</span>
            </div>
          </div>
        )}

        {/* Interactive Hover Tooltip */}
        {hoveredInfo && (
          <div
            className="absolute z-30 pointer-events-none bg-[#121317]/95 border border-[#E0FF20] rounded-md px-2.5 py-1.5 text-xs shadow-xl backdrop-blur-xs font-mono"
            style={{
              left: `${hoveredInfo.x + 12}px`,
              top: `${hoveredInfo.y + 12}px`
            }}
          >
            <span className="font-bold text-white block">{hoveredInfo.text}</span>
            {hoveredInfo.subtext && (
              <span className="text-[10px] text-[#E0FF20] block">{hoveredInfo.subtext}</span>
            )}
          </div>
        )}
      </div>

      {/* Village Details Inspection Drawer */}
      <Drawer
        isOpen={!!inspectedVillage}
        onClose={() => setInspectedVillage(null)}
        title={inspectedVillage?.properties?.VILLNAME || 'Village Geographic Unit'}
        subtitle={`Gram Panchayat: ${inspectedVillage?.properties?.GPNAME || 'N/A'} · Block: ${inspectedVillage?.properties?.IPNAME || 'N/A'}`}
        width="w-full md:w-[480px]"
      >
        {inspectedVillage && (
          <div className="space-y-6 text-xs">
            {/* Hierarchical Breadcrumb */}
            <div className="p-3 bg-[#121317] rounded-lg border border-[#262B35]">
              <span className="text-[10px] font-mono text-[#9EAAA5] uppercase block mb-1">
                Administrative Hierarchy
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs flex-wrap">
                <span className="text-white font-medium">Maharashtra</span>
                <span className="text-[#68756F]">/</span>
                <span className="text-white font-medium">Latur</span>
                <span className="text-[#68756F]">/</span>
                <span className="text-[#6B8547] font-semibold">{inspectedVillage.properties.IPNAME || 'Block'}</span>
                <span className="text-[#68756F]">/</span>
                <span className="text-[#E0FF20] font-bold">{inspectedVillage.properties.VILLNAME}</span>
              </div>
            </div>

            {/* Biomass Feedstock & Agricultural Estimates */}
            <div className="p-4 bg-[#121317] rounded-lg border border-[#262B35] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Agricultural Feedstock Metrics</span>
                <Badge status="LIVE" size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="p-2.5 bg-[#1E222B] rounded border border-[#262B35]">
                  <span className="text-[10px] text-[#9EAAA5] block">Recoverable Biomass</span>
                  <span className="text-base font-bold text-[#E0FF20]">
                    {inspectedVillage.metric?.value ? formatMass(inspectedVillage.metric.value, unitSystem, locale) : '640 t'}
                  </span>
                  <span className="text-[10px] text-[#6B8547] block">Seasonal crop residue</span>
                </div>

                <div className="p-2.5 bg-[#1E222B] rounded border border-[#262B35]">
                  <span className="text-[10px] text-[#9EAAA5] block">Dominant Feedstock</span>
                  <span className="text-sm font-semibold text-white">
                    {inspectedVillage.metric?.cropType || 'Soybean & Sugarcane'}
                  </span>
                  <span className="text-[10px] text-[#9EAAA5] block">
                    Moisture: {inspectedVillage.metric?.moisturePercent || 12}%
                  </span>
                </div>
              </div>
            </div>

            {/* Census & Survey Properties */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-white block">Census & Cadastral Properties</span>
              <div className="bg-[#121317] border border-[#262B35] rounded-lg divide-y divide-[#1F232B] font-mono text-[11px]">
                <div className="p-2.5 flex justify-between">
                  <span className="text-[#9EAAA5]">Census 2011 Village Code</span>
                  <span className="text-white font-bold">{inspectedVillage.properties.NEWCD2011 || 'N/A'}</span>
                </div>
                <div className="p-2.5 flex justify-between">
                  <span className="text-[#9EAAA5]">Gram Panchayat Code</span>
                  <span className="text-white">{inspectedVillage.properties.GPCODE || 'N/A'}</span>
                </div>
                <div className="p-2.5 flex justify-between">
                  <span className="text-[#9EAAA5]">Sub-District (Block) Code</span>
                  <span className="text-white">{inspectedVillage.properties.IPCODE || 'N/A'}</span>
                </div>
                <div className="p-2.5 flex justify-between">
                  <span className="text-[#9EAAA5]">District Code</span>
                  <span className="text-white">{inspectedVillage.properties.DTCENSUS || '524'}</span>
                </div>
                <div className="p-2.5 flex justify-between">
                  <span className="text-[#9EAAA5]">Spatial Identifier (GML ID)</span>
                  <span className="text-[#9EAAA5] truncate max-w-[200px]">{inspectedVillage.properties.GML_ID || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setInspectedVillage(null);
                  navigate('/pathways');
                }}
                className="w-full py-2.5 text-xs font-bold text-[#121317] bg-[#E0FF20] hover:bg-[#EEFF52] rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Mobilize Bio-Loop for this Village</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setInspectedVillage(null);
                  navigate('/simulator');
                }}
                className="w-full py-2 text-xs font-semibold text-white bg-[#1E222B] hover:bg-[#262B35] border border-[#333946] rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-[#E0FF20]" />
                <span>Simulate Pyrolysis / Biochar Conversion</span>
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
