import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Layers } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore.ts';
import { Badge } from '../ui/Badge.tsx';

interface OperationalMapProps {
  resources?: any[];
  processors?: any[];
  demand?: any[];
  routes?: any[];
  loops?: any[];
  onSelectNode?: (node: any) => void;
  selectedNodeId?: string | null;
}

export const OperationalMap: React.FC<OperationalMapProps> = ({
  resources = [],
  processors = [],
  demand = [],
  routes = [],
  loops = [],
  onSelectNode,
  selectedNodeId
}) => {
  const { viewport, setViewport, layers, toggleLayer, resetViewport } = useMapStore();
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Map projection helpers: Equirectangular projection centered around viewport
  const mapWidth = 960;
  const mapHeight = 520;

  const projectCoords = (lng: number, lat: number) => {
    // Zoom factor and center offset
    const scale = Math.pow(1.8, viewport.zoom);
    const x = mapWidth / 2 + (lng - viewport.lng) * (scale * 2.6);
    const y = mapHeight / 2 - (lat - viewport.lat) * (scale * 2.6);
    return { x, y };
  };

  const handleZoom = (delta: number) => {
    const nextZoom = Math.min(10, Math.max(1.8, viewport.zoom + delta));
    setViewport({ zoom: nextZoom });
  };

  return (
    <div className="relative w-full h-[520px] bg-[#121317] border border-[#262B35] rounded-lg overflow-hidden select-none">
      {/* Layer Control Bar */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 p-1 bg-[#181A20]/90 backdrop-blur-md border border-[#262B35] rounded-md text-xs shadow-lg">
        <span className="text-[10px] font-mono uppercase text-[#9EAAA5] px-1.5 flex items-center gap-1">
          <Layers className="w-3 h-3 text-[#E0FF20]" /> Layers:
        </span>
        <button
          onClick={() => toggleLayer('resources')}
          className={`px-2 py-0.5 rounded-sm text-[11px] font-mono transition-colors ${
            layers.resources ? 'bg-[#E0FF20]/20 text-[#E0FF20] border border-[#E0FF20]/40 font-bold' : 'text-[#68756F] hover:text-[#9EAAA5]'
          }`}
        >
          ● Supply Streams ({resources.length})
        </button>
        <button
          onClick={() => toggleLayer('processors')}
          className={`px-2 py-0.5 rounded-sm text-[11px] font-mono transition-colors ${
            layers.processors ? 'bg-[#FFFF00]/20 text-[#FFFF00] border border-[#FFFF00]/40 font-bold' : 'text-[#68756F] hover:text-[#9EAAA5]'
          }`}
        >
          ▲ Processors ({processors.length})
        </button>
        <button
          onClick={() => toggleLayer('routes')}
          className={`px-2 py-0.5 rounded-sm text-[11px] font-mono transition-colors ${
            layers.routes ? 'bg-[#EF8B44]/20 text-[#EF8B44] border border-[#EF8B44]/40 font-bold' : 'text-[#68756F] hover:text-[#9EAAA5]'
          }`}
        >
          — Routes ({routes.length})
        </button>
        <button
          onClick={() => toggleLayer('loops')}
          className={`px-2 py-0.5 rounded-sm text-[11px] font-mono transition-colors ${
            layers.loops ? 'bg-[#E0FF20]/20 text-[#E0FF20] border border-[#E0FF20]/40 font-bold' : 'text-[#68756F] hover:text-[#9EAAA5]'
          }`}
        >
          ⟲ Loops ({loops.length})
        </button>
      </div>

      {/* Map Zoom Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-[#181A20]/90 border border-[#262B35] rounded-md p-1 shadow-lg">
        <button
          onClick={() => handleZoom(0.8)}
          className="p-1.5 text-[#9EAAA5] hover:text-white hover:bg-[#1E222B] rounded-sm transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleZoom(-0.8)}
          className="p-1.5 text-[#9EAAA5] hover:text-white hover:bg-[#1E222B] rounded-sm transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={resetViewport}
          className="p-1.5 text-[#9EAAA5] hover:text-white hover:bg-[#1E222B] rounded-sm transition-colors"
          title="Reset Global View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* SVG Map Canvas */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E0FF20" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#121317" stopOpacity="0" />
          </radialGradient>
          <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#262B35" strokeWidth="0.5" strokeOpacity="0.5" />
          </pattern>
        </defs>

        {/* Global coordinate grid lines */}
        <rect width="100%" height="100%" fill="#121317" />
        <rect width="100%" height="100%" fill="url(#gridPattern)" />
        <rect width="100%" height="100%" fill="url(#mapGlow)" />

        {/* World Coastline Reference Outlines (Simplified continents for context) */}
        <g fill="#181A20" stroke="#262B35" strokeWidth="0.9" opacity="0.8">
          {/* Eurasia & Africa */}
          <path d="M 460 140 Q 520 120 620 140 T 740 180 T 700 320 T 580 340 T 500 310 T 480 230 Z" />
          <path d="M 440 240 Q 510 230 520 320 T 490 420 T 440 370 T 420 280 Z" />
          {/* Americas */}
          <path d="M 210 110 Q 300 120 280 220 T 230 260 T 210 180 Z" />
          <path d="M 260 270 Q 340 300 320 420 T 260 480 T 250 350 Z" />
          {/* Southeast Asia & Australia */}
          <path d="M 690 280 Q 740 300 720 340 Z" />
          <path d="M 720 380 Q 790 380 770 450 T 700 440 Z" />
        </g>

        {/* Logistics Routes */}
        {layers.routes && routes.map((r, i) => {
          const pt1 = projectCoords(r.origin[0], r.origin[1]);
          const pt2 = projectCoords(r.destination[0], r.destination[1]);
          return (
            <g key={r.id || i}>
              <line
                x1={pt1.x}
                y1={pt1.y}
                x2={pt2.x}
                y2={pt2.y}
                stroke="#E0FF20"
                strokeWidth="2"
                strokeDasharray="5 3"
                opacity="0.85"
              />
            </g>
          );
        })}

        {/* Processors Layer (Triangles) */}
        {layers.processors && processors.map((p) => {
          const coords = p.location?.coordinates || [0, 0];
          const pt = projectCoords(coords[0], coords[1]);
          const isSelected = selectedNodeId === p.id;

          return (
            <g
              key={p.id}
              transform={`translate(${pt.x}, ${pt.y})`}
              className="cursor-pointer group"
              onClick={() => onSelectNode?.(p)}
              onMouseEnter={() => setHoveredNode({ ...p, kind: 'PROCESSOR' })}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {isSelected && (
                <circle r="14" fill="none" stroke="#FFFF00" strokeWidth="1.5" className="animate-ping" opacity="0.6" />
              )}
              <polygon
                points="0,-8 7,6 -7,6"
                fill="#FFFF00"
                stroke="#121317"
                strokeWidth="1.5"
                className="group-hover:scale-125 transition-transform"
              />
              <text y="16" textAnchor="middle" fill="#9EAAA5" fontSize="9" className="font-mono">
                {p.name.split(' ')[0]}
              </text>
            </g>
          );
        })}

        {/* Resources Layer (Circles with Pulse) */}
        {layers.resources && resources.map((r) => {
          const coords = r.location?.coordinates || [0, 0];
          const pt = projectCoords(coords[0], coords[1]);
          const isSelected = selectedNodeId === r.id;

          return (
            <g
              key={r.id}
              transform={`translate(${pt.x}, ${pt.y})`}
              className="cursor-pointer group"
              onClick={() => onSelectNode?.(r)}
              onMouseEnter={() => setHoveredNode({ ...r, kind: 'RESOURCE' })}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {isSelected && (
                <circle r="16" fill="none" stroke="#E0FF20" strokeWidth="1.8" className="animate-ping" opacity="0.8" />
              )}
              <circle
                r="6"
                fill="#E0FF20"
                stroke="#121317"
                strokeWidth="1.5"
                className="group-hover:scale-125 transition-transform shadow-sm"
              />
              <text y="-9" textAnchor="middle" fill="#FFFFFF" fontSize="10" className="font-semibold">
                {r.name.split(' ')[0]}
              </text>
              <text y="16" textAnchor="middle" fill="#E0FF20" fontSize="8" className="font-mono">
                {r.quantity} {r.unit}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Hover Card */}
      {hoveredNode && (
        <div className="absolute bottom-3 left-3 z-20 pointer-events-none p-3 bg-[#181A20]/95 border border-[#343B49] rounded-md text-xs shadow-xl max-w-xs backdrop-blur-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-white">{hoveredNode.name}</span>
            <Badge status={hoveredNode.provenanceState || 'LIVE'} />
          </div>
          <div className="text-[11px] text-[#9EAAA5]">
            {hoveredNode.kind === 'RESOURCE' ? (
              <>
                <div>{hoveredNode.category} · {hoveredNode.quantity} {hoveredNode.unit}</div>
                <div>Location: {hoveredNode.location?.address || hoveredNode.location?.region}</div>
                <div className="text-[#E0FF20] mt-1 font-mono">Quality score: {hoveredNode.qualityScore}/100</div>
              </>
            ) : (
              <>
                <div>{hoveredNode.category}</div>
                <div>Cap: {hoveredNode.availableCapacity} / {hoveredNode.capacityPerDay} {hoveredNode.unit}</div>
                <div className="text-[#FFFF00] mt-1 font-mono">{hoveredNode.status}</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-3 px-3 py-1.5 bg-[#181A20]/90 border border-[#262B35] rounded-md text-[11px] text-[#9EAAA5] backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#E0FF20]" />
          <span>Biomass Supply</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 border-t-4 border-l-2 border-r-2 border-[#FFFF00] inline-block" />
          <span>Processor Facility</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t border-dashed border-[#E0FF20]" />
          <span>Logistics Route</span>
        </div>
      </div>
    </div>
  );
};
