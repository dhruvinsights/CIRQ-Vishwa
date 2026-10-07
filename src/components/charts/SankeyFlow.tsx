import React from 'react';
import { useSelectionStore } from '../../stores/selectionStore.ts';

export interface SankeyData {
  nodes: Array<{ name: string }>;
  links: Array<{ source: string; target: string; value: number }>;
}

interface SankeyFlowProps {
  data?: SankeyData;
  height?: number;
  onSelectBranch?: (branch: string) => void;
}

export const SankeyFlow: React.FC<SankeyFlowProps> = ({
  data,
  height = 300,
  onSelectBranch
}) => {
  const { setSelectedPathway } = useSelectionStore();

  const defaultData: SankeyData = {
    nodes: [
      { name: 'Raw Crop Residue (480 t)' },
      { name: 'Thermochemical Pyrolysis' },
      { name: 'Biochar Product (168 t)' },
      { name: 'Recycled Energy (163 MWh)' },
      { name: 'Soil Application & Sink' }
    ],
    links: [
      { source: 'Raw Crop Residue (480 t)', target: 'Thermochemical Pyrolysis', value: 480 },
      { source: 'Thermochemical Pyrolysis', target: 'Biochar Product (168 t)', value: 168 },
      { source: 'Thermochemical Pyrolysis', target: 'Recycled Energy (163 MWh)', value: 312 },
      { source: 'Biochar Product (168 t)', target: 'Soil Application & Sink', value: 168 }
    ]
  };

  const current = data || defaultData;

  // Render SVG Flow Columns
  return (
    <div className="w-full bg-[#181A20] border border-[#262B35] rounded-lg p-4 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-semibold uppercase font-mono tracking-wider text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E0FF20] animate-pulse" />
          Circular Material & Energy Mass Balance Flow
        </h4>
        <span className="text-[11px] text-[#9EAAA5] font-mono">Mass Flow in Tonnes & MWh</span>
      </div>

      <div style={{ height: `${height}px` }} className="relative flex items-center justify-between px-6">
        {/* Column 1: Feedstock Inputs */}
        <div className="flex flex-col justify-center space-y-4 z-10 w-48">
          <div className="p-3 bg-[#1E222B] border border-[#E0FF20]/40 rounded-md shadow-md">
            <span className="text-[10px] font-mono text-[#E0FF20] block uppercase font-bold">1. Feedstock Stream</span>
            <span className="text-xs font-semibold text-white block mt-0.5">
              {current.nodes[0]?.name || 'Biomass Input'}
            </span>
          </div>
        </div>

        {/* Center: Processing Technology */}
        <div className="flex flex-col justify-center space-y-4 z-10 w-52">
          <button
            onClick={() => {
              setSelectedPathway('pw-biochar-pyrolysis');
              onSelectBranch?.('Thermochemical Pyrolysis');
            }}
            className="p-3 bg-[#1E222B] border border-[#343B49] hover:border-[#E0FF20] rounded-md text-left transition-colors shadow-md group"
          >
            <span className="text-[10px] font-mono text-[#9EAAA5] group-hover:text-[#E0FF20] block uppercase font-bold">
              2. Processing Unit
            </span>
            <span className="text-xs font-semibold text-white block mt-0.5">
              {current.nodes[1]?.name || 'Pyrolysis Reactor'}
            </span>
            <span className="text-[10px] text-[#E0FF20] block mt-1 font-mono">Click to inspect pathway →</span>
          </button>
        </div>

        {/* Right: Products and Secondary Sinks */}
        <div className="flex flex-col justify-center space-y-3 z-10 w-52">
          <div className="p-2.5 bg-[#1E222B] border border-[#6DA8C8]/40 rounded-md">
            <span className="text-[10px] font-mono text-[#6DA8C8] block uppercase font-bold">3. Primary Product</span>
            <span className="text-xs font-medium text-white">
              {current.nodes[2]?.name || 'Solid Biochar'}
            </span>
          </div>
          <div className="p-2.5 bg-[#1E222B] border border-[#FFFF00]/40 rounded-md">
            <span className="text-[10px] font-mono text-[#FFFF00] block uppercase font-bold">3. Co-Product / Energy</span>
            <span className="text-xs font-medium text-white">
              {current.nodes[3]?.name || 'Syngas Energy'}
            </span>
          </div>
          <div className="p-2.5 bg-[#1E222B] border border-[#E0FF20]/40 rounded-md">
            <span className="text-[10px] font-mono text-[#E0FF20] block uppercase font-bold">4. Next Circular Loop</span>
            <span className="text-xs font-medium text-white">
              {current.nodes[4]?.name || 'Soil Carbon Sink'}
            </span>
          </div>
        </div>

        {/* Background connecting flow lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          <path
            d="M 210 150 C 270 150, 310 150, 370 150"
            fill="none"
            stroke="#E0FF20"
            strokeWidth="3.5"
            strokeOpacity="0.5"
          />
          <path
            d="M 580 140 C 640 140, 680 90, 740 90"
            fill="none"
            stroke="#6DA8C8"
            strokeWidth="2.5"
            strokeOpacity="0.5"
          />
          <path
            d="M 580 150 C 640 150, 680 150, 740 150"
            fill="none"
            stroke="#FFFF00"
            strokeWidth="2.5"
            strokeOpacity="0.5"
          />
          <path
            d="M 580 160 C 640 160, 680 210, 740 210"
            fill="none"
            stroke="#E0FF20"
            strokeWidth="3"
            strokeOpacity="0.5"
          />
        </svg>
      </div>
    </div>
  );
};
