import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Factory,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Zap,
  ArrowRight,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { processorClient } from '../../api/clients/processor.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Drawer } from '../../components/ui/Drawer.tsx';
import { KeyValue } from '../../components/ui/KeyValue.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';
import { useSelectionStore } from '../../stores/selectionStore.ts';
import { usePreferencesStore } from '../../stores/preferencesStore.ts';
import { formatCurrency, formatMass } from '../../lib/format.ts';

export const ProcessorsScreen: React.FC = () => {
  const { selectedResourceId, selectedProcessorId, setSelectedProcessor } = useSelectionStore();
  const { unitSystem, currency, locale } = usePreferencesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [inspectProcessorId, setInspectProcessorId] = useState<string | null>(null);

  // Processors Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['processors', 'list'],
    queryFn: processorClient.getProcessors
  });

  const processors = data?.data || [];
  const filtered = processors.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.location?.address && p.location.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const inspected = processors.find(p => p.id === inspectProcessorId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#26302C]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">
            Regional Biomass Processing Facilities
          </h1>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Operational bio-refineries, pyrolysis units, anaerobic digesters, and insect bioconversion plants with live daily intake capacities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge status="LIVE" />
          <span className="text-xs font-mono text-[#68756F]">Active Facilities: {processors.length}</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 bg-[#111615] border border-[#26302C] rounded-sm flex items-center gap-2 max-w-md">
        <Search className="w-3.5 h-3.5 text-[#68756F]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by facility name, technology, or region..."
          className="w-full bg-transparent text-xs text-[#E5ECE8] placeholder-[#68756F] focus:outline-hidden"
        />
      </div>

      {/* Grid of Facilities */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load processors registry"
          message={(error as any).message}
          onRetry={refetch}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => {
            const isSelected = selectedProcessorId === p.id;
            const utilization = Math.round(((p.capacityPerDay - p.availableCapacity) / p.capacityPerDay) * 100);

            return (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedProcessor(p.id);
                  setInspectProcessorId(p.id);
                }}
                className={`p-4 rounded-sm bg-[#111615] border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected ? 'border-[#8BCF45]' : 'border-[#26302C] hover:border-[#303936]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-[#E5ECE8]">{p.name}</h4>
                      <span className="text-xs text-[#9EAAA5] block">{p.category}</span>
                    </div>
                    <Badge status={p.status === 'OPERATIONAL' ? 'LIVE' : 'STALE'} />
                  </div>

                  <div className="text-[11px] text-[#68756F] mb-3">
                    {p.location.address} ({p.location.countryCode})
                  </div>

                  {/* Capacity Utilization Progress Meter */}
                  <div className="p-2.5 bg-[#151A18] rounded-xs border border-[#26302C] mb-3">
                    <div className="flex justify-between text-[11px] text-[#9EAAA5] mb-1">
                      <span>Available Headroom:</span>
                      <span className="font-mono text-[#8BCF45] font-semibold">
                        {p.availableCapacity} / {p.capacityPerDay} {p.unit}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#181D1B] rounded-xs overflow-hidden">
                      <div
                        className="h-full bg-[#6DA8C8] transition-all"
                        style={{ width: `${utilization}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#68756F] font-mono mt-1 block">
                      {utilization}% Capacity Contracted
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#26302C]/60">
                      <span className="text-[#9EAAA5]">Processing Cost:</span>
                      <span className="font-mono text-[#E5ECE8]">${p.processingCostPerT}/t</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#26302C]/60">
                      <span className="text-[#9EAAA5]">Energy Consumption:</span>
                      <span className="font-mono text-[#E5ECE8]">{p.energyDemandKwhPerT} kWh/t</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#26302C]/60">
                      <span className="text-[#9EAAA5]">Queue Depth:</span>
                      <span className="font-mono text-[#D6D75A]">{p.queueDepth} batches queued</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-[#26302C] flex items-center justify-between">
                  <span className="text-[11px] text-[#68756F] truncate">
                    {p.certifications[0] || 'Certified'}
                  </span>
                  <button className="text-xs text-[#8BCF45] hover:underline inline-flex items-center gap-1">
                    <span>Inspect Facility</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Facility Drawer */}
      <Drawer
        isOpen={!!inspectProcessorId}
        onClose={() => setInspectProcessorId(null)}
        title={inspected?.name || 'Facility Overview'}
        subtitle={inspected?.category}
      >
        {inspected && (
          <div className="space-y-4">
            <KeyValue label="Location Address" value={inspected.location.address} />
            <KeyValue label="Status" value={inspected.status} />
            <KeyValue label="Daily Intake Capacity" value={`${inspected.capacityPerDay} ${inspected.unit}`} />
            <KeyValue label="Available Idle Capacity" value={`${inspected.availableCapacity} ${inspected.unit}`} />
            <KeyValue label="Processing Gate Fee" value={`$${inspected.processingCostPerT} / tonne`} />
            <KeyValue label="Energy Demand" value={`${inspected.energyDemandKwhPerT} kWh / tonne`} />
            <KeyValue label="Batch Constraints" value={`Min: ${inspected.minimumBatch}t · Max: ${inspected.maximumBatch}t`} />

            <div>
              <span className="text-xs font-semibold text-[#9EAAA5] block mb-1">Capabilities</span>
              <div className="flex flex-wrap gap-1">
                {inspected.capabilities.map((c: string, i: number) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-[#151A18] border border-[#26302C] text-[#E5ECE8] rounded-xs">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-[#9EAAA5] block mb-1">Environmental Standards & Certifications</span>
              <div className="space-y-1">
                {inspected.certifications.map((cert: string, i: number) => (
                  <div key={i} className="p-2 bg-[#151A18] rounded-xs border border-[#26302C] text-xs text-[#8BCF45]">
                    ✓ {cert}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setInspectProcessorId(null)}
                className="w-full py-2 bg-[#8BCF45] text-[#0B0D0D] font-semibold text-xs rounded-xs"
              >
                Close Facility Overview
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
