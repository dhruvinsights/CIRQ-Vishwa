import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Repeat,
  ShieldCheck,
  TrendingUp,
  CheckCircle,
  Play,
  Layers,
  ArrowRight
} from 'lucide-react';
import { loopClient } from '../../api/clients/loop.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Drawer } from '../../components/ui/Drawer.tsx';
import { KeyValue } from '../../components/ui/KeyValue.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';
import { usePreferencesStore } from '../../stores/preferencesStore.ts';
import { formatCurrency, formatMass, formatCarbon } from '../../lib/format.ts';

export const CircularLoopsScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const { unitSystem, currency, locale } = usePreferencesStore();
  const [inspectLoopId, setInspectLoopId] = useState<string | null>(null);

  const { data: loopsRes, isLoading, error, refetch } = useQuery({
    queryKey: ['loops', 'list'],
    queryFn: loopClient.getLoops
  });

  const validateMutation = useMutation({
    mutationFn: (loopData: any) => loopClient.validateLoop(loopData)
  });

  const simulateMutation = useMutation({
    mutationFn: (id: string) => loopClient.simulateLoop(id)
  });

  const loops = loopsRes?.loops || [];
  const inspected = loops.find(l => l.id === inspectLoopId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#26302C]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">
            Closed-Loop Agro-Ecological Systems
          </h1>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Complete circular material loops reintegrating residues into soil fertility, renewable energy, and animal feed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge status="LIVE" />
          <span className="text-xs font-mono text-[#68756F]">Active Loops: {loops.length}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load circular loops"
          message={(error as any)?.message}
          onRetry={refetch}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loops.map((loop) => (
            <div
              key={loop.id}
              onClick={() => setInspectLoopId(loop.id)}
              className="p-4 rounded-sm bg-[#111615] border border-[#26302C] hover:border-[#8BCF45] cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-semibold text-[#E5ECE8]">{loop.name}</h4>
                  <Badge status="LIVE" />
                </div>

                <div className="text-[11px] font-mono text-[#8BCF45] mb-3">
                  Circularity Index: {loop.circularityIndex}%
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#26302C]/60">
                    <span className="text-[#9EAAA5]">Annual Material Flow:</span>
                    <span className="font-mono text-[#E5ECE8]">{formatMass(loop.annualMaterialLoopTons, unitSystem, locale)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#26302C]/60">
                    <span className="text-[#9EAAA5]">Carbon Sequestration:</span>
                    <span className="font-mono text-[#8BCF45]">{formatCarbon(loop.carbonOffsetTons, locale)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#26302C]/60">
                    <span className="text-[#9EAAA5]">Annual Economic Value:</span>
                    <span className="font-mono text-[#E5ECE8]">{formatCurrency(loop.economicValueAnnual, 'USD', currency, locale)}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-[10px] text-[#68756F] uppercase font-mono block mb-1">Actors Participating:</span>
                  <div className="flex flex-wrap gap-1">
                    {loop.participatingActors.map((actor: string, i: number) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-[#151A18] border border-[#26302C] text-[#9EAAA5] rounded-xs">
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[#26302C] flex justify-between items-center text-xs text-[#8BCF45]">
                <span>Inspect Loop Topology</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loop Inspector Drawer */}
      <Drawer
        isOpen={!!inspectLoopId}
        onClose={() => setInspectLoopId(null)}
        title={inspected?.name || 'Loop Details'}
        subtitle="Agro-Ecological Closed Loop"
      >
        {inspected && (
          <div className="space-y-4">
            <KeyValue label="Circularity Index" value={`${inspected.circularityIndex}%`} />
            <KeyValue label="Annual Biomass Looped" value={formatMass(inspected.annualMaterialLoopTons, unitSystem, locale)} />
            <KeyValue label="Carbon Offset" value={formatCarbon(inspected.carbonOffsetTons, locale)} />
            <KeyValue label="Annual Gate Value" value={formatCurrency(inspected.economicValueAnnual, 'USD', currency, locale)} />
            <KeyValue label="Nodes in Loop Chain" value={`${inspected.nodesCount} physical stages`} />

            <div className="pt-3 border-t border-[#26302C] space-y-2">
              <button
                onClick={() => simulateMutation.mutate(inspected.id)}
                disabled={simulateMutation.isPending}
                className="w-full py-2 bg-[#8BCF45] text-[#0B0D0D] font-semibold text-xs rounded-xs"
              >
                {simulateMutation.isPending ? 'Simulating...' : 'Simulate 5-Year Soil Accumulation'}
              </button>
            </div>

            {simulateMutation.data && (
              <div className="p-3 bg-[#151A18] border border-[#8BCF45]/30 rounded-xs text-xs space-y-1">
                <span className="text-[#8BCF45] font-semibold block">5-Year Simulation Forecast</span>
                <div>Cumulative Soil Carbon: {simulateMutation.data.cumulativeSoilCarbonTons} t</div>
                <div>Fertilizer Cost Savings: ${simulateMutation.data.cumulativeFertilizerSavingsUsd.toLocaleString()}</div>
                <div>Payback Horizon: {simulateMutation.data.paybackPeriodYears} years</div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
