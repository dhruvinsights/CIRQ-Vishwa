import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Cpu,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  DollarSign,
  Leaf,
  Layers,
  ArrowRight
} from 'lucide-react';
import { simulationClient } from '../../api/clients/simulation.ts';
import { resourceClient } from '../../api/clients/resource.ts';
import { processorClient } from '../../api/clients/processor.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { SankeyFlow } from '../../components/charts/SankeyFlow.tsx';
import { ConfidenceMeter } from '../../components/ui/ConfidenceMeter.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';
import { useSelectionStore } from '../../stores/selectionStore.ts';
import { usePreferencesStore } from '../../stores/preferencesStore.ts';
import { formatCurrency, formatMass, formatCarbon } from '../../lib/format.ts';

export const SimulatorScreen: React.FC = () => {
  const { selectedResourceId, selectedProcessorId } = useSelectionStore();
  const { unitSystem, currency, locale } = usePreferencesStore();

  // Form State
  const [selectedResource, setSelectedResource] = useState(selectedResourceId || 'res-rice-straw-up');
  const [quantity, setQuantity] = useState(480);
  const [technology, setTechnology] = useState('Slow Pyrolysis');
  const [transportKm, setTransportKm] = useState(28);
  const [energyCostKwh, setEnergyCostKwh] = useState(0.08);
  const [productPricePerTon, setProductPricePerTon] = useState(280);

  // Initial / Active Simulation Query
  const { data: activeSim, isLoading: simLoading, refetch } = useQuery({
    queryKey: ['simulations', 'active'],
    queryFn: () => simulationClient.getSimulation('sim-91024')
  });

  const { data: resourcesRes } = useQuery({
    queryKey: ['resources', 'list'],
    queryFn: () => resourceClient.getResources()
  });

  // Run new simulation mutation
  const runMutation = useMutation({
    mutationFn: (payload: any) => simulationClient.createSimulation(payload),
    onSuccess: (data) => {
      refetch();
    }
  });

  const simResult = runMutation.data?.result || activeSim?.result;

  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    runMutation.mutate({
      resourceId: selectedResource,
      quantity,
      technology,
      transportKm,
      energyCost: energyCostKwh,
      price: productPricePerTon
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#26302C]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">
            Circular Pathway Mass & Energy Balance Simulator
          </h1>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Thermodynamic mass-balance modeling, carbon displacement coefficients, and net gate revenue calculator.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge status="LIVE" />
          <span className="text-xs font-mono text-[#68756F]">Solver: Pareto Frontier v3</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Inputs Form (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card title="Simulation Parameters" subtitle="Adjust feedstock scale, process technology, and transport radius.">
            <form onSubmit={handleRunSimulation} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#9EAAA5] mb-1 font-medium">Feedstock Stream:</label>
                <select
                  value={selectedResource}
                  onChange={(e) => setSelectedResource(e.target.value)}
                  className="w-full bg-[#151A18] border border-[#26302C] text-[#E5ECE8] px-2.5 py-1.5 rounded-xs focus:outline-hidden"
                >
                  {(resourcesRes?.data || []).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.quantity} {r.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-[#9EAAA5] mb-1">
                  <label className="font-medium">Quantity to Mobilize:</label>
                  <span className="font-mono text-[#8BCF45]">{quantity} tonnes</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="10"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full accent-[#8BCF45]"
                />
              </div>

              <div>
                <label className="block text-[#9EAAA5] mb-1 font-medium">Conversion Technology:</label>
                <select
                  value={technology}
                  onChange={(e) => setTechnology(e.target.value)}
                  className="w-full bg-[#151A18] border border-[#26302C] text-[#E5ECE8] px-2.5 py-1.5 rounded-xs focus:outline-hidden"
                >
                  <option value="Slow Pyrolysis">Continuous Slow Pyrolysis (550°C)</option>
                  <option value="Anaerobic Digestion">Thermophilic CSTR Digestion</option>
                  <option value="Biomass Densification">High-Pressure Ring-Die Pelleting</option>
                  <option value="Insect Bioconversion">BSFL Larval Bioreactor</option>
                  <option value="Aerobic Composting">Static Forced-Aeration Windrow</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-[#9EAAA5] mb-1">
                  <label className="font-medium">Haulage Distance:</label>
                  <span className="font-mono text-[#E5ECE8]">{transportKm} km</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="150"
                  step="1"
                  value={transportKm}
                  onChange={(e) => setTransportKm(Number(e.target.value))}
                  className="w-full accent-[#8BCF45]"
                />
              </div>

              <div>
                <label className="block text-[#9EAAA5] mb-1 font-medium">Target Product Price ($/t):</label>
                <input
                  type="number"
                  value={productPricePerTon}
                  onChange={(e) => setProductPricePerTon(Number(e.target.value))}
                  className="w-full bg-[#151A18] border border-[#26302C] text-[#E5ECE8] px-2.5 py-1.5 rounded-xs focus:outline-hidden"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={runMutation.isPending}
                  className="w-full py-2 bg-[#8BCF45] hover:bg-[#9ED957] text-[#0B0D0D] font-semibold rounded-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{runMutation.isPending ? 'Simulating Balance...' : 'Run Simulation'}</span>
                </button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Sankey Diagram + Economic Outputs (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Sankey Flowchart bound to simulation result */}
          <SankeyFlow data={simResult?.sankey} />

          {/* Results Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 bg-[#111615] border border-[#26302C] rounded-sm">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#9EAAA5] block">
                Net Projected Value
              </span>
              <div className="text-xl font-bold font-mono text-[#8BCF45] my-1">
                {formatCurrency(simResult?.netValue || 29940, 'USD', currency, locale)}
              </div>
              <span className="text-[11px] text-[#68756F]">
                Gross: ${simResult?.grossRevenue?.toLocaleString()} · Costs: ${(Number(simResult?.processingCost || 0) + Number(simResult?.transportCost || 0)).toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 bg-[#111615] border border-[#26302C] rounded-sm">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#9EAAA5] block">
                Net CO₂e Abatement
              </span>
              <div className="text-xl font-bold font-mono text-[#E5ECE8] my-1">
                {formatCarbon(simResult?.co2eAvoidedTons || 710.4, locale)}
              </div>
              <span className="text-[11px] text-[#68756F]">
                Avoided burning & 100-yr sink permanence
              </span>
            </div>

            <div className="p-3.5 bg-[#111615] border border-[#26302C] rounded-sm">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#9EAAA5] block">
                Recovered Output Yield
              </span>
              <div className="text-xl font-bold font-mono text-[#D6D75A] my-1">
                {simResult?.biocharYieldTons ? `${simResult.biocharYieldTons.toFixed(1)} t` : '168.0 t'}
              </div>
              <span className="text-[11px] text-[#68756F]">
                + {simResult?.syngasHeatMwh ? `${simResult.syngasHeatMwh.toFixed(1)} MWh` : '163 MWh'} clean energy
              </span>
            </div>
          </div>

          <ConfidenceMeter
            score={simResult?.confidence || 94}
            evidenceCount={6}
            freshness="Simulated against live model coefficients"
          />
        </div>
      </div>
    </div>
  );
};
