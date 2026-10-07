import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Leaf,
  ShieldCheck,
  TrendingUp,
  Activity,
  Layers,
  Info,
  DollarSign,
  Droplet,
  Flame,
  ArrowRight
} from 'lucide-react';
import { impactClient } from '../../api/clients/impact.ts';
import { provenanceClient } from '../../api/clients/provenance.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Drawer } from '../../components/ui/Drawer.tsx';
import { KeyValue } from '../../components/ui/KeyValue.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';
import { usePreferencesStore } from '../../stores/preferencesStore.ts';
import { formatCurrency, formatMass, formatCarbon, formatEnergy } from '../../lib/format.ts';

export const ImpactScreen: React.FC = () => {
  const { unitSystem, currency, locale } = usePreferencesStore();
  const [provenanceDrawerOpen, setProvenanceDrawerOpen] = useState(false);

  // Queries
  const { data: overview, isLoading, error, refetch } = useQuery({
    queryKey: ['impact', 'overview'],
    queryFn: impactClient.getOverview
  });

  const { data: provDetail } = useQuery({
    queryKey: ['impact', 'provenance', 'imp-global-01'],
    queryFn: () => impactClient.getProvenance('imp-global-01')
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="p-8">
        <ErrorState
          title="Failed to load impact observatory"
          message={(error as any)?.message}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#26302C]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">
            Sustainability & Climate Impact Observatory
          </h1>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Verified planetary boundaries accounting built on the FAO EX-ACT VC model and IPCC 2019 Refinement Tier 2 inventory factors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge status="LIVE" />
          <button
            onClick={() => setProvenanceDrawerOpen(true)}
            className="px-3 py-1.5 text-xs font-medium bg-[#151A18] hover:bg-[#181D1B] border border-[#26302C] text-[#8BCF45] rounded-xs inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit Lineage & Provenance</span>
          </button>
        </div>
      </div>

      {/* Primary Impact Grid Cards with Full Metadata (Methodology, Source, Scope, Uncertainty) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Metric 1: Net Carbon Avoided */}
        <div className="p-4 rounded-sm bg-[#111615] border border-[#26302C] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs text-[#9EAAA5] mb-1">
              <span className="font-semibold text-[#E5ECE8]">Net Avoided GHG Emissions</span>
              <Badge status="LIVE" size="sm" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#8BCF45] my-1">
              {formatCarbon(overview.netCo2eAvoidedTons, locale)}
            </div>
            <p className="text-[11px] text-[#9EAAA5]">
              Displaced open-field stubble burning + long-term biochar carbon recalcitrance.
            </p>
          </div>
          <div className="p-2 bg-[#151A18] rounded-xs text-[10px] space-y-0.5 text-[#68756F]">
            <div>Scope: <strong className="text-[#E5ECE8]">Scope 1 & 3 Supply Chain</strong></div>
            <div>Methodology: <strong className="text-[#E5ECE8]">IPCC 2019 Tier 2 (Table 2.5)</strong></div>
            <div>Uncertainty: <strong className="text-[#E5ECE8]">± 4.8% (Monte Carlo 10k)</strong></div>
          </div>
        </div>

        {/* Metric 2: Waste Diverted */}
        <div className="p-4 rounded-sm bg-[#111615] border border-[#26302C] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs text-[#9EAAA5] mb-1">
              <span className="font-semibold text-[#E5ECE8]">Feedstock Waste Diverted</span>
              <Badge status="LIVE" size="sm" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#E5ECE8] my-1">
              {formatMass(overview.cumulativeWasteDivertedTons, unitSystem, locale)}
            </div>
            <p className="text-[11px] text-[#9EAAA5]">
              Diverted from unmanaged rotting, landfill dumping, and air-polluting incineration.
            </p>
          </div>
          <div className="p-2 bg-[#151A18] rounded-xs text-[10px] space-y-0.5 text-[#68756F]">
            <div>Boundary: <strong className="text-[#E5ECE8]">Farm Gate &rarr; Pre-Treatment</strong></div>
            <div>Methodology: <strong className="text-[#E5ECE8]">FAO Food Loss & Waste Framework</strong></div>
            <div>Uncertainty: <strong className="text-[#E5ECE8]">± 2.5% (Sensor Scale Records)</strong></div>
          </div>
        </div>

        {/* Metric 3: Soil Organic Carbon Gain */}
        <div className="p-4 rounded-sm bg-[#111615] border border-[#26302C] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs text-[#9EAAA5] mb-1">
              <span className="font-semibold text-[#E5ECE8]">Soil Organic Carbon Accretion</span>
              <Badge status="LIVE" size="sm" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#D6D75A] my-1">
              {formatMass(overview.soilCarbonOrganicGainTons, unitSystem, locale)}
            </div>
            <p className="text-[11px] text-[#9EAAA5]">
              Recalcitrant aromatic carbon fixed into agricultural topsoil via biochar amendment.
            </p>
          </div>
          <div className="p-2 bg-[#151A18] rounded-xs text-[10px] space-y-0.5 text-[#68756F]">
            <div>Permanence: <strong className="text-[#E5ECE8]">&gt; 100 Years (H/Corg &lt; 0.7)</strong></div>
            <div>Methodology: <strong className="text-[#E5ECE8]">Verra VM0044 Methodology</strong></div>
            <div>Uncertainty: <strong className="text-[#E5ECE8]">± 3.2%</strong></div>
          </div>
        </div>

        {/* Metric 4: Renewable Bio-Energy */}
        <div className="p-4 rounded-sm bg-[#111615] border border-[#26302C] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs text-[#9EAAA5] mb-1">
              <span className="font-semibold text-[#E5ECE8]">Clean Bio-Energy Generated</span>
              <Badge status="LIVE" size="sm" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#6DA8C8] my-1">
              {formatEnergy(overview.renewableEnergyGeneratedMwh, locale)}
            </div>
            <p className="text-[11px] text-[#9EAAA5]">
              Syngas process heat and compressed biomethane injected into regional grids.
            </p>
          </div>
          <div className="p-2 bg-[#151A18] rounded-xs text-[10px] space-y-0.5 text-[#68756F]">
            <div>Substituted: <strong className="text-[#E5ECE8]">Industrial Coal & Fossil Gas</strong></div>
            <div>Methodology: <strong className="text-[#E5ECE8]">ISO 14044 LCA Standard</strong></div>
            <div>Uncertainty: <strong className="text-[#E5ECE8]">± 1.9% (Calorimeter Certified)</strong></div>
          </div>
        </div>

        {/* Metric 5: Economic Value Created */}
        <div className="p-4 rounded-sm bg-[#111615] border border-[#26302C] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs text-[#9EAAA5] mb-1">
              <span className="font-semibold text-[#E5ECE8]">Economic Value Unlocked</span>
              <Badge status="LIVE" size="sm" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#8BCF45] my-1">
              {formatCurrency(overview.economicValueUnlockedUsd, 'USD', currency, locale)}
            </div>
            <p className="text-[11px] text-[#9EAAA5]">
              Gross bioeconomy transaction volume across feedstocks, biochar, and bio-gas.
            </p>
          </div>
          <div className="p-2 bg-[#151A18] rounded-xs text-[10px] space-y-0.5 text-[#68756F]">
            <div>Beneficiaries: <strong className="text-[#E5ECE8]">{overview.participatingFarmersCount} Smallholders</strong></div>
            <div>Methodology: <strong className="text-[#E5ECE8]">World Bank Pink Sheet Spot Benchmark</strong></div>
            <div>Uncertainty: <strong className="text-[#E5ECE8]">Audited Monthly</strong></div>
          </div>
        </div>

        {/* Metric 6: Circular Loops Closed */}
        <div className="p-4 rounded-sm bg-[#111615] border border-[#26302C] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs text-[#9EAAA5] mb-1">
              <span className="font-semibold text-[#E5ECE8]">Active Circular Loops</span>
              <Badge status="LIVE" size="sm" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#E5ECE8] my-1">
              {overview.activeCircularLoops} Closed Loops
            </div>
            <p className="text-[11px] text-[#9EAAA5]">
              Complete circular nutrient loops reintegrating by-products into soil fertility.
            </p>
          </div>
          <div className="p-2 bg-[#151A18] rounded-xs text-[10px] space-y-0.5 text-[#68756F]">
            <div>Circularity Index: <strong className="text-[#E5ECE8]">92.4% (Material Circularity)</strong></div>
            <div>Standard: <strong className="text-[#E5ECE8]">Ellen MacArthur Foundation MCI</strong></div>
            <div>Freshness: <strong className="text-[#E5ECE8]">{overview.freshness}</strong></div>
          </div>
        </div>
      </div>

      {/* Provenance and Audit Drawer */}
      <Drawer
        isOpen={provenanceDrawerOpen}
        onClose={() => setProvenanceDrawerOpen(false)}
        title="Impact Provenance & Methodology Standard"
        subtitle="Full audit trail for IPCC and FAO certified emission calculations."
      >
        <div className="space-y-4">
          <KeyValue label="Standard Boundary" value={provDetail?.calculationBoundary || 'Farm Gate -> Haulage -> Pyrolysis -> Soil'} />
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#9EAAA5] block uppercase font-mono">
              Certified Emission Factors
            </span>
            {(provDetail?.emissionFactors || [
              { name: 'Avoided Open Straw Burning', factor: '1.24 kgCO2e/kg straw', source: 'IPCC 2019 Table 2.5' },
              { name: 'Biochar Long-Term Sequestration', factor: '0.78 tC stored / t biochar', source: 'EBC Guideline 2024' },
              { name: 'Freight Haulage Deduction', factor: '0.082 kgCO2e / t-km', source: 'GLEC Framework' }
            ]).map((ef: any, i: number) => (
              <div key={i} className="p-2.5 bg-[#151A18] rounded-xs border border-[#26302C] text-xs">
                <div className="font-semibold text-[#E5ECE8]">{ef.name}</div>
                <div className="text-[#8BCF45] font-mono mt-0.5">{ef.factor}</div>
                <div className="text-[10px] text-[#68756F] mt-0.5">Source: {ef.source}</div>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <button
              onClick={() => setProvenanceDrawerOpen(false)}
              className="w-full py-2 bg-[#8BCF45] text-[#0B0D0D] font-semibold text-xs rounded-xs"
            >
              Close Audit Inspector
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
