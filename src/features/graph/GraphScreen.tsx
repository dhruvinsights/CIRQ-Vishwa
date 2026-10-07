import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Share2, Info, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { networkClient } from '../../api/clients/network.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Drawer } from '../../components/ui/Drawer.tsx';
import { KeyValue } from '../../components/ui/KeyValue.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';
import { useSelectionStore } from '../../stores/selectionStore.ts';

export const GraphScreen: React.FC = () => {
  const { selectedResourceId, setSelectedResource } = useSelectionStore();
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const { data: networkMeta, isLoading: metaLoading } = useQuery({
    queryKey: ['network', 'meta'],
    queryFn: networkClient.getNetwork
  });

  const { data: nodesRes, isLoading: nodesLoading } = useQuery({
    queryKey: ['network', 'nodes'],
    queryFn: networkClient.getNodes
  });

  const { data: edgesRes, isLoading: edgesLoading } = useQuery({
    queryKey: ['network', 'edges'],
    queryFn: networkClient.getEdges
  });

  const nodes = nodesRes?.nodes || [];
  const edges = edgesRes?.edges || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#26302C]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">
            Circular Resource Knowledge Graph
          </h1>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Interconnected ontological nodes spanning Feedstock, Composition, Conversion Process, Processor Facility, Secondary Product, and Carbon Sink.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#9EAAA5]">
          <span>Nodes: {nodes.length}</span> · <span>Edges: {edges.length}</span> · <Badge status="LIVE" />
        </div>
      </div>

      {/* Inspectable Node Graph Viewport */}
      <Card title="Interactive Graph Topology" subtitle="Click any node to inspect semantic properties and linked downstream flows.">
        <div className="w-full h-[480px] bg-[#0B0D0D] border border-[#26302C] rounded-sm relative overflow-hidden flex items-center justify-center p-6">
          <svg viewBox="0 0 900 440" className="w-full h-full">
            <defs>
              <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8BCF45" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6DA8C8" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Connecting Edges */}
            <g stroke="#303936" strokeWidth="1.5">
              <line x1="160" y1="120" x2="420" y2="120" stroke="url(#edgeGrad)" strokeDasharray="3 3" />
              <line x1="420" y1="120" x2="720" y2="120" stroke="url(#edgeGrad)" />
              <line x1="160" y1="240" x2="420" y2="240" stroke="url(#edgeGrad)" strokeDasharray="3 3" />
              <line x1="420" y1="240" x2="720" y2="240" stroke="url(#edgeGrad)" />
              <line x1="160" y1="360" x2="420" y2="360" stroke="url(#edgeGrad)" strokeDasharray="3 3" />
              <line x1="420" y1="360" x2="720" y2="360" stroke="url(#edgeGrad)" />
              {/* Vertical flow linkages */}
              <line x1="420" y1="120" x2="420" y2="240" stroke="#26302C" />
            </g>

            {/* Feedstock Nodes (Column 1) */}
            <g transform="translate(160, 120)" className="cursor-pointer group" onClick={() => setSelectedNode({ label: 'Rice Straw (Barabanki)', type: 'FEEDSTOCK', quantity: '480 t', moisture: '12.4%', concept: 'c-rice-straw-cereal' })}>
              <circle r="22" fill="#151A18" stroke="#8BCF45" strokeWidth="2" className="group-hover:scale-110 transition-transform" />
              <text textAnchor="middle" dy="4" fill="#E5ECE8" fontSize="10" className="font-mono">Straw</text>
              <text textAnchor="middle" dy="36" fill="#9EAAA5" fontSize="11" className="font-medium">Rice Residue (480t)</text>
            </g>
            <g transform="translate(160, 240)" className="cursor-pointer group" onClick={() => setSelectedNode({ label: 'Sugarcane Bagasse (São Paulo)', type: 'FEEDSTOCK', quantity: '1,250 t', moisture: '48.0%', concept: 'c-sugarcane-bagasse' })}>
              <circle r="22" fill="#151A18" stroke="#8BCF45" strokeWidth="2" className="group-hover:scale-110 transition-transform" />
              <text textAnchor="middle" dy="4" fill="#E5ECE8" fontSize="10" className="font-mono">Bagasse</text>
              <text textAnchor="middle" dy="36" fill="#9EAAA5" fontSize="11" className="font-medium">Cane Residue (1,250t)</text>
            </g>
            <g transform="translate(160, 360)" className="cursor-pointer group" onClick={() => setSelectedNode({ label: 'Coffee Cascara (Nyeri)', type: 'FEEDSTOCK', quantity: '320 t', moisture: '76.5%', concept: 'c-coffee-cherry-pulp' })}>
              <circle r="22" fill="#151A18" stroke="#8BCF45" strokeWidth="2" className="group-hover:scale-110 transition-transform" />
              <text textAnchor="middle" dy="4" fill="#E5ECE8" fontSize="10" className="font-mono">Pulp</text>
              <text textAnchor="middle" dy="36" fill="#9EAAA5" fontSize="11" className="font-medium">Coffee Pulp (320t)</text>
            </g>

            {/* Pathway / Process Nodes (Column 2) */}
            <g transform="translate(420, 120)" className="cursor-pointer group" onClick={() => setSelectedNode({ label: 'Slow Pyrolysis', type: 'PROCESS', efficiency: '35%', score: '92/100', tech: 'Continuous Retort (550°C)' })}>
              <rect x="-30" y="-18" width="60" height="36" rx="4" fill="#181D1B" stroke="#D6D75A" strokeWidth="2" className="group-hover:scale-110 transition-transform" />
              <text textAnchor="middle" dy="4" fill="#E5ECE8" fontSize="10" className="font-mono">Pyrolysis</text>
              <text textAnchor="middle" dy="36" fill="#9EAAA5" fontSize="11" className="font-medium">Slow Pyrolysis (550°C)</text>
            </g>
            <g transform="translate(420, 240)" className="cursor-pointer group" onClick={() => setSelectedNode({ label: 'Biochemical 2G Digestion', type: 'PROCESS', efficiency: '52%', score: '88/100', tech: 'CSTR Biomethane Digestion' })}>
              <rect x="-30" y="-18" width="60" height="36" rx="4" fill="#181D1B" stroke="#D6D75A" strokeWidth="2" className="group-hover:scale-110 transition-transform" />
              <text textAnchor="middle" dy="4" fill="#E5ECE8" fontSize="10" className="font-mono">Anaerobic</text>
              <text textAnchor="middle" dy="36" fill="#9EAAA5" fontSize="11" className="font-medium">Biomethane / 2G Ethanol</text>
            </g>
            <g transform="translate(420, 360)" className="cursor-pointer group" onClick={() => setSelectedNode({ label: 'Insect Larval Bioreactor', type: 'PROCESS', efficiency: '22%', score: '89/100', tech: 'BSF Bioconversion' })}>
              <rect x="-30" y="-18" width="60" height="36" rx="4" fill="#181D1B" stroke="#D6D75A" strokeWidth="2" className="group-hover:scale-110 transition-transform" />
              <text textAnchor="middle" dy="4" fill="#E5ECE8" fontSize="10" className="font-mono">Insect</text>
              <text textAnchor="middle" dy="36" fill="#9EAAA5" fontSize="11" className="font-medium">BSFL Bioconversion</text>
            </g>

            {/* Product / Sink Nodes (Column 3) */}
            <g transform="translate(720, 120)" className="cursor-pointer group" onClick={() => setSelectedNode({ label: 'Soil Biochar Carbon Sink', type: 'PRODUCT_SINK', co2e: '1,480 kg/t', buyer: 'Regional Fertilizer Co-op' })}>
              <polygon points="0,-22 24,18 -24,18" fill="#151A18" stroke="#6DA8C8" strokeWidth="2" className="group-hover:scale-110 transition-transform" />
              <text textAnchor="middle" dy="7" fill="#E5ECE8" fontSize="9" className="font-mono">Biochar</text>
              <text textAnchor="middle" dy="36" fill="#9EAAA5" fontSize="11" className="font-medium">Soil Carbon Sink</text>
            </g>
            <g transform="translate(720, 240)" className="cursor-pointer group" onClick={() => setSelectedNode({ label: 'Biofuels & Green Grid', type: 'PRODUCT_SINK', co2e: '840 kg/t', buyer: 'City Gas Distribution Grid' })}>
              <polygon points="0,-22 24,18 -24,18" fill="#151A18" stroke="#6DA8C8" strokeWidth="2" className="group-hover:scale-110 transition-transform" />
              <text textAnchor="middle" dy="7" fill="#E5ECE8" fontSize="9" className="font-mono">Bio-Gas</text>
              <text textAnchor="middle" dy="36" fill="#9EAAA5" fontSize="11" className="font-medium">Clean Biomethane Grid</text>
            </g>
            <g transform="translate(720, 360)" className="cursor-pointer group" onClick={() => setSelectedNode({ label: 'Defatted Insect Meal', type: 'PRODUCT_SINK', co2e: '1,120 kg/t', buyer: 'Aquaculture Feed Compounder' })}>
              <polygon points="0,-22 24,18 -24,18" fill="#151A18" stroke="#6DA8C8" strokeWidth="2" className="group-hover:scale-110 transition-transform" />
              <text textAnchor="middle" dy="7" fill="#E5ECE8" fontSize="9" className="font-mono">Protein</text>
              <text textAnchor="middle" dy="36" fill="#9EAAA5" fontSize="11" className="font-medium">Insect Protein Meal</text>
            </g>
          </svg>
        </div>
      </Card>

      {/* Node Detail Drawer */}
      <Drawer
        isOpen={!!selectedNode}
        onClose={() => setSelectedNode(null)}
        title={selectedNode?.label || 'Node Properties'}
        subtitle={`Type: ${selectedNode?.type}`}
      >
        {selectedNode && (
          <div className="space-y-4">
            <KeyValue label="Node Type" value={selectedNode.type} />
            {selectedNode.concept && <KeyValue label="Ontology Concept" value={selectedNode.concept} />}
            {selectedNode.quantity && <KeyValue label="Volume" value={selectedNode.quantity} />}
            {selectedNode.moisture && <KeyValue label="Moisture Content" value={selectedNode.moisture} />}
            {selectedNode.efficiency && <KeyValue label="Conversion Efficiency" value={selectedNode.efficiency} />}
            {selectedNode.score && <KeyValue label="Feasibility Score" value={selectedNode.score} />}
            {selectedNode.tech && <KeyValue label="Primary Tech" value={selectedNode.tech} />}
            {selectedNode.co2e && <KeyValue label="Carbon Factor" value={selectedNode.co2e} />}
            {selectedNode.buyer && <KeyValue label="Verified Offtaker" value={selectedNode.buyer} />}
            <div className="pt-4">
              <button
                onClick={() => setSelectedNode(null)}
                className="w-full py-2 bg-[#8BCF45] text-[#0B0D0D] font-semibold text-xs rounded-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
