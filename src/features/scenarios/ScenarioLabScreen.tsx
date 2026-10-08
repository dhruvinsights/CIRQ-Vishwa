import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FlaskConical,
  Play,
  TrendingUp,
  Sliders,
  DollarSign,
  Leaf,
  Layers,
  ArrowRight
} from 'lucide-react';
import { scenarioClient } from '../../api/clients/scenario.ts';
import { Card } from '../../components/ui/Card.tsx';
import { DemoBanner } from '../../components/ui/DemoBanner.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { KeyValue } from '../../components/ui/KeyValue.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';
import { usePreferencesStore } from '../../stores/preferencesStore.ts';
import { formatCurrency, formatMass, formatCarbon } from '../../lib/format.ts';

export const ScenarioLabScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const { unitSystem, currency, locale } = usePreferencesStore();

  const [quantityMult, setQuantityMult] = useState(1.4); // +40%
  const [transportMult, setTransportMult] = useState(0.85); // -15%
  const [carbonPrice, setCarbonPrice] = useState(45.0); // $45/t

  // Scenarios Query
  const { data: scenRes, isLoading, error, refetch } = useQuery({
    queryKey: ['scenarios', 'list'],
    queryFn: scenarioClient.getScenarios
  });

  // Diff comparison query
  const { data: diffRes } = useQuery({
    queryKey: ['scenarios', 'compare'],
    queryFn: () => scenarioClient.compareScenarios()
  });

  const scenarios = scenRes?.scenarios || [];
  const baseline = scenarios[0]?.baseline || {
    quantity: 480,
    transportCostTotal: 3420,
    co2eAvoidedTotal: 710.4,
    economicValueTotal: 41280,
    recoveryRate: 64
  };

  // Run new scenario mutation
  const runMutation = useMutation({
    mutationFn: (payload: any) => scenarioClient.createScenario(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    }
  });

  const simulatedQuantity = baseline.quantity * quantityMult;
  const simulatedCo2 = baseline.co2eAvoidedTotal * quantityMult;
  const simulatedTransport = baseline.transportCostTotal * transportMult;
  const simulatedGross = baseline.economicValueTotal * quantityMult;
  const simulatedNet = simulatedGross - simulatedTransport;

  return (
    <>
      <DemoBanner
        screen="Scenario Lab"
        reason="Scenarios run on simulated projections — not on real historical farm data."
        docsHint="Connect farm API data and real LCA factors to run evidence-based scenarios."
      />
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#26302C]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">
            Circular Bioeconomy Scenario Lab
          </h1>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            What-if sensitivity analysis modeling regional supply scaling, freight price shocks, and voluntary carbon market swings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge status="LIVE" />
          <span className="text-xs font-mono text-[#68756F]">Active Baseline: Uttar Pradesh 2026</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: What-If Slider Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card title="Scenario Parameter Sliders" subtitle="Adjust scaling factors relative to current regional baseline.">
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-[#9EAAA5] mb-1">
                  <span>Feedstock Aggregation Volume Scale:</span>
                  <span className="font-mono text-[#8BCF45]">
                    {((quantityMult - 1) * 100).toFixed(0)}% ({simulatedQuantity.toFixed(0)} t)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={quantityMult}
                  onChange={(e) => setQuantityMult(Number(e.target.value))}
                  className="w-full accent-[#8BCF45]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#9EAAA5] mb-1">
                  <span>Freight Cost Sensitivity Factor:</span>
                  <span className="font-mono text-[#E5ECE8]">
                    {((transportMult - 1) * 100).toFixed(0)}% (${simulatedTransport.toFixed(0)})
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={transportMult}
                  onChange={(e) => setTransportMult(Number(e.target.value))}
                  className="w-full accent-[#6DA8C8]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#9EAAA5] mb-1">
                  <span>Carbon Credit Valuation ($/tCO₂e):</span>
                  <span className="font-mono text-[#D6D75A]">${carbonPrice.toFixed(0)} / t</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="5"
                  value={carbonPrice}
                  onChange={(e) => setCarbonPrice(Number(e.target.value))}
                  className="w-full accent-[#D6D75A]"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => runMutation.mutate({
                    name: `Scenario Scale ${(quantityMult * 100).toFixed(0)}%`,
                    parameters: { quantityMultiplier: quantityMult, transportCostMultiplier: transportMult, carbonPricePerTon: carbonPrice }
                  })}
                  disabled={runMutation.isPending}
                  className="w-full py-2 bg-[#8BCF45] hover:bg-[#9ED957] text-[#0B0D0D] font-semibold rounded-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>{runMutation.isPending ? 'Saving...' : 'Commit Scenario to Ledger'}</span>
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Baseline vs Scenario Diff Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card
            title="Baseline vs. Scenario Diff Comparison"
            subtitle="Comparing 2026 actual harvest baseline against simulated parameters."
          >
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#151A18] text-[#9EAAA5] font-mono text-[11px] uppercase">
                    <tr>
                      <th className="px-3 py-2">Metric</th>
                      <th className="px-3 py-2 text-right">Baseline (2026)</th>
                      <th className="px-3 py-2 text-right">Simulated Scenario</th>
                      <th className="px-3 py-2 text-right">Net Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#26302C]/60">
                    <tr>
                      <td className="px-3 py-2.5 font-medium text-[#E5ECE8]">Feedstock Mobilized</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#9EAAA5]">{baseline.quantity} t</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#8BCF45]">{simulatedQuantity.toFixed(0)} t</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#8BCF45]">
                        +{(simulatedQuantity - baseline.quantity).toFixed(0)} t
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-medium text-[#E5ECE8]">Avoided CO₂e Emissions</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#9EAAA5]">{baseline.co2eAvoidedTotal} t</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#8BCF45]">{simulatedCo2.toFixed(1)} t</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#8BCF45]">
                        +{(simulatedCo2 - baseline.co2eAvoidedTotal).toFixed(1)} t
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-medium text-[#E5ECE8]">Transport Haulage Cost</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#9EAAA5]">${baseline.transportCostTotal}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#E5ECE8]">${simulatedTransport.toFixed(0)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#6DA8C8]">
                        ${(simulatedTransport - baseline.transportCostTotal).toFixed(0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 font-medium text-[#E5ECE8]">Net Unlocked Value</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#9EAAA5]">${baseline.economicValueTotal}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#8BCF45]">${simulatedNet.toFixed(0)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#8BCF45]">
                        +${(simulatedNet - baseline.economicValueTotal).toFixed(0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
};