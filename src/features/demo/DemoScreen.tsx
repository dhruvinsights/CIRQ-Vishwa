import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Repeat
} from 'lucide-react';
import { resourceClient } from '../../api/clients/resource.ts';
import { pathwayClient } from '../../api/clients/pathway.ts';
import { processorClient } from '../../api/clients/processor.ts';
import { logisticsClient } from '../../api/clients/logistics.ts';
import { impactClient } from '../../api/clients/impact.ts';
import { loopClient } from '../../api/clients/loop.ts';
import { aiClient } from '../../api/clients/ai.ts';
import { Card } from '../../components/ui/Card.tsx';
import { DemoBanner } from '../../components/ui/DemoBanner.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { ConfidenceMeter } from '../../components/ui/ConfidenceMeter.tsx';
import { usePreferencesStore } from '../../stores/preferencesStore.ts';
import { formatCurrency, formatMass, formatCarbon } from '../../lib/format.ts';

interface DemoStep {
  stepNumber: number;
  title: string;
  endpoint: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'ERROR';
  result?: any;
  durationMs?: number;
}

const INITIAL_STEPS: DemoStep[] = [
  { stepNumber: 1, title: 'Semantic Concept Resolution', endpoint: 'POST /resources/resolve', status: 'PENDING' },
  { stepNumber: 2, title: 'Proximate Profile Verification', endpoint: 'POST /resources/profile', status: 'PENDING' },
  { stepNumber: 3, title: 'Circular Pathway Discovery', endpoint: 'POST /pathways/discover', status: 'PENDING' },
  { stepNumber: 4, title: 'Multi-Objective Pathway Ranking', endpoint: 'POST /pathways/rank', status: 'PENDING' },
  { stepNumber: 5, title: 'Regional Facility Matching', endpoint: 'POST /processors/match', status: 'PENDING' },
  { stepNumber: 6, title: 'Green Freight Logistics Optimization', endpoint: 'POST /logistics/optimize', status: 'PENDING' },
  { stepNumber: 7, title: 'FAO EX-ACT Carbon & Bioeconomy LCA', endpoint: 'POST /impact/calculate', status: 'PENDING' },
  { stepNumber: 8, title: 'Closed Circular Loop Simulation', endpoint: 'POST /loops/simulate', status: 'PENDING' },
  { stepNumber: 9, title: 'Deterministic AI Execution Trace', endpoint: 'GET /ai/executions/exec-849202/trace', status: 'PENDING' }
];

export const DemoScreen: React.FC = () => {
  const { unitSystem, currency, locale } = usePreferencesStore();
  const [steps, setSteps] = useState<DemoStep[]>(INITIAL_STEPS);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [summaryOutput, setSummaryOutput] = useState<any>(null);

  const runDemoSequence = async () => {
    setIsRunning(true);
    setSummaryOutput(null);
    const updated = [...INITIAL_STEPS];
    setSteps(updated);

    try {
      // Step 1: Semantic Concept Resolution
      setActiveStepIndex(0);
      updated[0].status = 'RUNNING';
      setSteps([...updated]);
      const t1 = performance.now();
      const r1 = await resourceClient.resolveResource('धान का पुआल'); // Hindi for paddy straw
      updated[0].status = 'COMPLETED';
      updated[0].durationMs = Math.round(performance.now() - t1);
      updated[0].result = r1;
      setSteps([...updated]);

      // Step 2: Proximate Profile
      setActiveStepIndex(1);
      updated[1].status = 'RUNNING';
      setSteps([...updated]);
      const t2 = performance.now();
      const r2 = await resourceClient.profileResource('res-rice-straw-up');
      updated[1].status = 'COMPLETED';
      updated[1].durationMs = Math.round(performance.now() - t2);
      updated[1].result = r2;
      setSteps([...updated]);

      // Step 3: Pathway Discovery
      setActiveStepIndex(2);
      updated[2].status = 'RUNNING';
      setSteps([...updated]);
      const t3 = performance.now();
      const r3 = await pathwayClient.discoverPathways('res-rice-straw-up');
      updated[2].status = 'COMPLETED';
      updated[2].durationMs = Math.round(performance.now() - t3);
      updated[2].result = r3;
      setSteps([...updated]);

      // Step 4: Pathway Ranking
      setActiveStepIndex(3);
      updated[3].status = 'RUNNING';
      setSteps([...updated]);
      const t4 = performance.now();
      const r4 = await pathwayClient.rankPathways('res-rice-straw-up');
      updated[3].status = 'COMPLETED';
      updated[3].durationMs = Math.round(performance.now() - t4);
      updated[3].result = r4;
      setSteps([...updated]);

      // Step 5: Processor Matching
      setActiveStepIndex(4);
      updated[4].status = 'RUNNING';
      setSteps([...updated]);
      const t5 = performance.now();
      const r5 = await processorClient.matchProcessor({ resourceId: 'res-rice-straw-up', quantity: 480 });
      updated[4].status = 'COMPLETED';
      updated[4].durationMs = Math.round(performance.now() - t5);
      updated[4].result = r5;
      setSteps([...updated]);

      // Step 6: Logistics Optimization
      setActiveStepIndex(5);
      updated[5].status = 'RUNNING';
      setSteps([...updated]);
      const t6 = performance.now();
      const r6 = await logisticsClient.optimizeLogistics({ resourceId: 'res-rice-straw-up', processorId: 'proc-up-biochar' });
      updated[5].status = 'COMPLETED';
      updated[5].durationMs = Math.round(performance.now() - t6);
      updated[5].result = r6;
      setSteps([...updated]);

      // Step 7: Impact Calculation
      setActiveStepIndex(6);
      updated[7].status = 'RUNNING';
      setSteps([...updated]);
      const t7 = performance.now();
      const r7 = await impactClient.calculateImpact({ resourceId: 'res-rice-straw-up', pathwayId: 'pw-biochar-pyrolysis', quantityTons: 480 });
      updated[6].status = 'COMPLETED';
      updated[6].durationMs = Math.round(performance.now() - t7);
      updated[6].result = r7;
      setSteps([...updated]);

      // Step 8: Loop Simulation
      setActiveStepIndex(7);
      updated[7].status = 'RUNNING';
      setSteps([...updated]);
      const t8 = performance.now();
      const r8 = await loopClient.simulateLoop('loop-ganga-biochar');
      updated[7].status = 'COMPLETED';
      updated[7].durationMs = Math.round(performance.now() - t8);
      updated[7].result = r8;
      setSteps([...updated]);

      // Step 9: AI Execution Trace
      setActiveStepIndex(8);
      updated[8].status = 'RUNNING';
      setSteps([...updated]);
      const t9 = performance.now();
      // Run the real semantic resolver (live AGROVOC lookup), then read ITS trace — no seeded execution id.
      const exec9 = await aiClient.executeService('srv-semantic-resolver', { rawTerm: 'rice straw', locale: 'en' });
      const r9 = await aiClient.getExecutionTrace(exec9.id);
      updated[8].status = 'COMPLETED';
      updated[8].durationMs = Math.round(performance.now() - t9);
      updated[8].result = r9;
      setSteps([...updated]);

      setSummaryOutput({
        feedstock: 'Rice Straw (Barabanki, UP - 480 tonnes)',
        concept: r1.canonicalName,
        pathway: 'Slow Pyrolysis to Carbon-Negative Biochar',
        facility: 'Ganga Valley Pyrolysis Facility (28.4 km)',
        abatement: `${r7.netCo2eAvoidedTons} tCO₂e avoided`,
        netValue: `$${r7.economicNetGainUsd.toLocaleString()}`,
        loopIndex: '94.2% Circularity Index'
      });
    } catch (err) {
      console.error('Demo sequence error:', err);
    } finally {
      setIsRunning(false);
      setActiveStepIndex(-1);
    }
  };

  return (
    <div className="space-y-0">
      <DemoBanner
        screen="Circularity Demo"
        reason="The 9-step flow calls real API endpoints but summary text is hardcoded — not derived from step results."
        docsHint="Each step result will drive the summary once the Express engine is replaced by the Python backend."
      />
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#26302C]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">
            End-to-End Circular Bioeconomy Demonstration
          </h1>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Executes the complete 9-step physical-to-intelligence loop in real-time against live seeded backend endpoints.
          </p>
        </div>

        <button
          onClick={runDemoSequence}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#8BCF45] hover:bg-[#9ED957] disabled:opacity-50 text-[#0B0D0D] font-bold text-xs rounded-xs shadow-md transition-all"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isRunning ? 'Executing Real Endpoints...' : 'RUN GLOBAL CIRCULARITY DEMO'}</span>
        </button>
      </div>

      {/* Summary KPI Banner if Completed */}
      {summaryOutput && (
        <div className="p-4 rounded-sm bg-[#151A18] border border-[#8BCF45]/50 shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8BCF45]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete Global Circularity Loop Closed Successfully!</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div>
              <span className="text-[10px] text-[#68756F] block">Resolved Concept</span>
              <span className="font-semibold text-[#E5ECE8]">{summaryOutput.concept}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#68756F] block">Matched Facility</span>
              <span className="font-semibold text-[#E5ECE8]">{summaryOutput.facility}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#68756F] block">Net Carbon Offset</span>
              <span className="font-mono text-[#8BCF45] font-semibold">{summaryOutput.abatement}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#68756F] block">Unlocked Net Margin</span>
              <span className="font-mono text-[#8BCF45] font-semibold">{summaryOutput.netValue}</span>
            </div>
          </div>
        </div>
      )}

      {/* 9 Step Real-Time Timeline Grid */}
      <div className="space-y-3">
        {steps.map((st, i) => {
          const isCurrent = activeStepIndex === i;
          return (
            <div
              key={st.stepNumber}
              className={`p-3.5 rounded-sm border transition-all text-xs ${
                st.status === 'COMPLETED'
                  ? 'bg-[#111615] border-[#8BCF45]/50'
                  : isCurrent
                  ? 'bg-[#151A18] border-[#8BCF45] animate-pulse'
                  : 'bg-[#101313] border-[#26302C]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                      st.status === 'COMPLETED'
                        ? 'bg-[#8BCF45] text-[#0B0D0D]'
                        : isCurrent
                        ? 'bg-[#D6D75A] text-[#0B0D0D]'
                        : 'bg-[#151A18] text-[#68756F]'
                    }`}
                  >
                    {st.stepNumber}
                  </span>
                  <div>
                    <span className="font-semibold text-[#E5ECE8] block">{st.title}</span>
                    <code className="text-[10px] text-[#6DA8C8]">{st.endpoint}</code>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {st.durationMs !== undefined && (
                    <span className="font-mono text-[10px] text-[#68756F]">{st.durationMs}ms</span>
                  )}
                  {st.status === 'COMPLETED' && (
                    <span className="text-[11px] font-mono text-[#8BCF45] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Executed</span>
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[11px] font-mono text-[#D6D75A] font-semibold">
                      Running...
                    </span>
                  )}
                  {st.status === 'PENDING' && (
                    <span className="text-[10px] font-mono text-[#68756F]">Queued</span>
                  )}
                </div>
              </div>

              {/* Step Result Payload Summary */}
              {st.result && (
                <div className="mt-2.5 pt-2 border-t border-[#26302C]/60 text-[11px] text-[#9EAAA5] font-mono">
                  {st.stepNumber === 1 && (
                    <div>Input: "धान का पुआल" ➔ Canonical: {st.result.canonicalName} ({st.result.confidence}% confidence)</div>
                  )}
                  {st.stepNumber === 2 && (
                    <div>Biomass profile evaluated: Margin {st.result.estimatedGrossMarginPercent}% · Rec: {st.result.primaryPathwayRecommendation}</div>
                  )}
                  {st.stepNumber === 3 && (
                    <div>Discovered {st.result.discoveredPathways?.length} candidate pathways across thermochemical spectrum</div>
                  )}
                  {st.stepNumber === 4 && (
                    <div>Ranked pathways Pareto frontier: top score {st.result.ranking?.[0]?.rankScore}/100</div>
                  )}
                  {st.stepNumber === 5 && (
                    <div>Matched {st.result.matches?.[0]?.name} (Distance: {st.result.matches?.[0]?.distanceKm} km, {st.result.matches?.[0]?.matchScore}% fit)</div>
                  )}
                  {st.stepNumber === 6 && (
                    <div>Haulage corridor optimized: {st.result.distanceKm} km · Freight cost ${st.result.totalLogisticsCostUsd}</div>
                  )}
                  {st.stepNumber === 7 && (
                    <div>LCA net avoided GHG: {st.result.netCo2eAvoidedTons} tCO₂e · Gate value +${st.result.economicNetGainUsd}</div>
                  )}
                  {st.stepNumber === 8 && (
                    <div>5-Year soil carbon accumulation forecast: {st.result.cumulativeSoilCarbonTons} t permanent sink</div>
                  )}
                  {st.stepNumber === 9 && (
                    <div>Trace confirmed deterministic chain across {st.result.dataSources?.join(', ')} ({st.result.durationMs}ms duration)</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
};
