import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  Upload,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Compass,
  FileCode,
  Sliders,
  CheckCircle2,
  X
} from 'lucide-react';
import { mapClient, RegionLayerConfig } from '../../api/clients/map.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';

export const RegionLayersScreen: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [detectedProperties, setDetectedProperties] = useState<string[]>([]);
  const [parsedGeoJson, setParsedGeoJson] = useState<any | null>(null);

  // Layer config form state
  const [layerLabel, setLayerLabel] = useState('');
  const [idField, setIdField] = useState('');
  const [nameField, setNameField] = useState('');
  const [blockField, setBlockField] = useState('');
  const [districtField, setDistrictField] = useState('');
  const [stateField, setStateField] = useState('');
  const [fillColor, setFillColor] = useState('#6B8547');
  const [strokeColor, setStrokeColor] = useState('#E0FF20');
  const [fillOpacity, setFillOpacity] = useState(0.2);

  // Query layers
  const { data: layersData, isLoading, error, refetch } = useQuery({
    queryKey: ['map', 'layers'],
    queryFn: mapClient.getLayers
  });

  const layers = layersData?.layers || [];

  // Delete Layer Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => mapClient.deleteLayer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map', 'layers'] });
    }
  });

  // Toggle Visibility Mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) =>
      mapClient.updateLayer(id, { visibleByDefault: visible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['map', 'layers'] });
    }
  });

  // Handle File Upload & Property Detection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);

        if (json.type !== 'FeatureCollection' || !Array.isArray(json.features)) {
          setFileError('INVALID_FORMAT: File must be a valid GeoJSON FeatureCollection.');
          return;
        }

        // Validate CRS
        if (json.crs && json.crs.properties && json.crs.properties.name) {
          const crsName = String(json.crs.properties.name).toLowerCase();
          if (!crsName.includes('crs84') && !crsName.includes('4326')) {
            setFileError('CRS_NOT_SUPPORTED: Only WGS84 (CRS84 or EPSG:4326) coordinate reference systems are supported.');
            return;
          }
        }

        if (json.features.length === 0) {
          setFileError('EMPTY_DATASET: FeatureCollection contains 0 features.');
          return;
        }

        const sampleProps = json.features[0]?.properties || {};
        const keys = Object.keys(sampleProps);
        setDetectedProperties(keys);
        setParsedGeoJson(json);

        // Auto-populate best guesses
        setLayerLabel(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
        setIdField(keys.find(k => /code|id|cd/i.test(k)) || keys[0] || 'id');
        setNameField(keys.find(k => /name|vill|title/i.test(k)) || keys[1] || 'name');
        setBlockField(keys.find(k => /ipname|block|taluka|sub/i.test(k)) || '');
        setDistrictField(keys.find(k => /dtname|dist|county/i.test(k)) || '');
        setStateField(keys.find(k => /stname|state/i.test(k)) || '');
      } catch (err: any) {
        setFileError(`PARSE_ERROR: Failed to parse JSON file - ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Submit Layer Registration
  const handleSubmitLayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedGeoJson || !idField || !nameField) return;

    try {
      await mapClient.createLayer({
        label: layerLabel,
        geojson: parsedGeoJson,
        idField,
        nameField,
        hierarchy: [stateField, districtField, blockField, nameField].filter(Boolean),
        blockField,
        districtField,
        stateField,
        defaultStyle: {
          fillColor,
          fillOpacity,
          strokeColor,
          strokeWidth: 0.8
        }
      });

      queryClient.invalidateQueries({ queryKey: ['map', 'layers'] });
      setShowUploadModal(false);
      setSelectedFile(null);
      setParsedGeoJson(null);
      setDetectedProperties([]);
    } catch (err: any) {
      setFileError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#26302C]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Administrative Region Boundary Layers
            </h1>
            <span className="text-[10px] font-mono text-[#E0FF20] bg-[#E0FF20]/15 px-2 py-0.5 rounded-full border border-[#E0FF20]/40 font-semibold">
              Config-Driven GeoJSON Registry
            </span>
          </div>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Configure administrative boundaries (districts, talukas, village polygons), field mappings, and choropleth metrics.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#121317] bg-[#E0FF20] hover:bg-[#EEFF52] rounded-lg transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          <span>Upload & Register GeoJSON Layer</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load region layer registry"
          message={(error as any).message}
          onRetry={refetch}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="p-5 rounded-xl bg-[#181A20] border border-[#262B35] hover:border-[#333946] transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-[#9EAAA5] uppercase block">{layer.id}</span>
                    <h3 className="text-sm font-bold text-white tracking-tight">{layer.label}</h3>
                    <span className="text-xs font-mono text-[#6B8547] block mt-0.5">
                      {layer.featureCount.toLocaleString()} Polygons · {layer.crs}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleVisibilityMutation.mutate({ id: layer.id, visible: !layer.visibleByDefault })}
                      className={`p-1.5 rounded-md border text-xs transition-colors ${
                        layer.visibleByDefault
                          ? 'bg-[#E0FF20]/15 text-[#E0FF20] border-[#E0FF20]/40'
                          : 'bg-[#121317] text-[#68756F] border-[#262B35]'
                      }`}
                      title={layer.visibleByDefault ? 'Visible on Map' : 'Hidden'}
                    >
                      {layer.visibleByDefault ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    {layer.id !== 'layer-524-latur' && (
                      <button
                        onClick={() => {
                          if (confirm(`Remove layer ${layer.label}?`)) {
                            deleteMutation.mutate(layer.id);
                          }
                        }}
                        className="p-1.5 rounded-md bg-[#121317] text-[#68756F] hover:text-[#DC2626] border border-[#262B35] transition-colors"
                        title="Delete Layer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Properties & Hierarchy Details */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono p-3 bg-[#121317] rounded-lg border border-[#262B35]">
                  <div>
                    <span className="text-[10px] text-[#68756F] block">Primary ID Field</span>
                    <span className="font-semibold text-[#E0FF20]">{layer.idField}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#68756F] block">Display Name Field</span>
                    <span className="font-semibold text-white">{layer.nameField}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#68756F] block">Block / Taluka</span>
                    <span className="text-[#9EAAA5]">{layer.blockField || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#68756F] block">District / State</span>
                    <span className="text-[#9EAAA5]">{layer.districtField || 'N/A'}</span>
                  </div>
                </div>

                {/* Style & Bounds */}
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#68756F]">Style:</span>
                    <span
                      className="w-4 h-4 rounded-xs border"
                      style={{
                        backgroundColor: layer.defaultStyle.fillColor,
                        borderColor: layer.defaultStyle.strokeColor,
                        opacity: layer.defaultStyle.fillOpacity + 0.3
                      }}
                    />
                    <span className="text-[11px] text-[#9EAAA5]">
                      {Math.round(layer.defaultStyle.fillOpacity * 100)}% Opacity
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/map?layer=${layer.id}`)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E0FF20] hover:underline"
                  >
                    <span>Inspect in Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload & Configuration Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#181A20] border border-[#262B35] rounded-xl shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#262B35]">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#E0FF20]" />
                <h2 className="text-sm font-bold text-white">Upload & Configure Region GeoJSON</h2>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setFileError(null);
                  setSelectedFile(null);
                }}
                className="text-[#9EAAA5] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitLayer} className="space-y-4 text-xs">
              {/* File Dropzone */}
              <div>
                <label className="block text-[#9EAAA5] mb-1 font-medium">Select GeoJSON File (.geojson, .json):</label>
                <input
                  type="file"
                  accept=".geojson,.json"
                  onChange={handleFileChange}
                  className="w-full bg-[#121317] border border-[#262B35] rounded-lg p-3 text-white file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#1E2129] file:text-white hover:file:bg-[#252A36]"
                />
              </div>

              {fileError && (
                <div className="p-3 bg-[#DC2626]/15 border border-[#DC2626]/40 text-[#DC2626] rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {detectedProperties.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-[#262B35]">
                  <div className="flex items-center gap-2 text-[#E0FF20] font-mono text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Detected {parsedGeoJson?.features?.length} features with {detectedProperties.length} attribute keys</span>
                  </div>

                  <div>
                    <label className="block text-[#9EAAA5] mb-1 font-medium">Layer Title / Label:</label>
                    <input
                      type="text"
                      required
                      value={layerLabel}
                      onChange={(e) => setLayerLabel(e.target.value)}
                      className="w-full bg-[#121317] border border-[#262B35] rounded-lg px-3 py-2 text-white focus:border-[#E0FF20] focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#9EAAA5] mb-1 font-medium">Unique ID Field (Join Key):</label>
                      <select
                        required
                        value={idField}
                        onChange={(e) => setIdField(e.target.value)}
                        className="w-full bg-[#121317] border border-[#262B35] rounded-lg px-2.5 py-2 text-white"
                      >
                        {detectedProperties.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#9EAAA5] mb-1 font-medium">Village / Polygon Name Field:</label>
                      <select
                        required
                        value={nameField}
                        onChange={(e) => setNameField(e.target.value)}
                        className="w-full bg-[#121317] border border-[#262B35] rounded-lg px-2.5 py-2 text-white"
                      >
                        {detectedProperties.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#9EAAA5] mb-1 font-medium">Sub-District / Block Field:</label>
                      <select
                        value={blockField}
                        onChange={(e) => setBlockField(e.target.value)}
                        className="w-full bg-[#121317] border border-[#262B35] rounded-lg px-2.5 py-2 text-white"
                      >
                        <option value="">None / Not Applicable</option>
                        {detectedProperties.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#9EAAA5] mb-1 font-medium">District Field:</label>
                      <select
                        value={districtField}
                        onChange={(e) => setDistrictField(e.target.value)}
                        className="w-full bg-[#121317] border border-[#262B35] rounded-lg px-2.5 py-2 text-white"
                      >
                        <option value="">None / Not Applicable</option>
                        {detectedProperties.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Styling Tokens */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[#9EAAA5] mb-1 font-medium">Fill Color Token:</label>
                      <select
                        value={fillColor}
                        onChange={(e) => setFillColor(e.target.value)}
                        className="w-full bg-[#121317] border border-[#262B35] rounded-lg px-2.5 py-1.5 text-white"
                      >
                        <option value="#6B8547">Olive (#6B8547)</option>
                        <option value="#E0FF20">Accent Lime (#E0FF20)</option>
                        <option value="#EF8B44">Warm Orange (#EF8B44)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#9EAAA5] mb-1 font-medium">Stroke Color Token:</label>
                      <select
                        value={strokeColor}
                        onChange={(e) => setStrokeColor(e.target.value)}
                        className="w-full bg-[#121317] border border-[#262B35] rounded-lg px-2.5 py-1.5 text-white"
                      >
                        <option value="#E0FF20">Accent Lime (#E0FF20)</option>
                        <option value="#262B35">Subtle Border (#262B35)</option>
                        <option value="#6B8547">Olive (#6B8547)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#9EAAA5] mb-1 font-medium">Opacity ({Math.round(fillOpacity * 100)}%):</label>
                      <input
                        type="range"
                        min="0.05"
                        max="0.8"
                        step="0.05"
                        value={fillOpacity}
                        onChange={(e) => setFillOpacity(parseFloat(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#262B35]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#9EAAA5] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!parsedGeoJson || !!fileError}
                  className="px-5 py-2 text-xs font-bold text-[#121317] bg-[#E0FF20] hover:bg-[#EEFF52] disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-colors shadow-sm"
                >
                  Register Layer in CIRQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
