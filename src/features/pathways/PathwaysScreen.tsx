import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Workflow,
  CheckCircle2,
  XCircle,
  Edit3,
  HelpCircle,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { pathwayClient } from '../../api/clients/pathway.ts';
import { resourceClient } from '../../api/clients/resource.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { ConfidenceMeter } from '../../components/ui/ConfidenceMeter.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';
import { useSelectionStore } from '../../stores/selectionStore.ts';
import { usePreferencesStore } from '../../stores/preferencesStore.ts';
import { formatCurrency, formatMass, formatCarbon } from '../../lib/format.ts';

export const PathwaysScreen: React.FC = () => {
  const navigate = useNavigate();
  const { selectedResourceId, selectedPathwayId, setSelectedPathway } = useSelectionStore();
  const { unitSystem, currency, locale } = usePreferencesStore();

  const [compareMode, setCompareMode] = useState(false);
  const [oversightState, setOversightState] = useState<Record<string, string>>({});
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Pathways query
  const { data: pathwaysRes, isLoading, error, refetch } = useQuery({
    queryKey: ['pathways', 'list'],
    queryFn: pathwayClient.getPathways
  });

  // Resource query to ground active numbers
  const { data: resource } = useQuery({
    queryKey: ['resources', selectedResourceId],
    queryFn: () => resourceClient.getResource(selectedResourceId || 'res-rice-straw-up')
  });

  const pathways = pathwaysRes?.data || [];
  const activePathway = pathways.find(p => p.id === selectedPathwayId) || pathways[0];

  const handleOversight = (pathwayId: string, action: 'ACCEPT' | 'REJECT' | 'MODIFY' | 'REQUEST_MORE_EVIDENCE') => {
    setOversightState(prev => ({ ...prev, [pathwayId]: action }));
    setFeedbackNotice(`Action recorded: ${action} for ${pathways.find(p => p.id === pathwayId)?.name}`);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#26302C]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">
            Circular Pathway Discovery & Evaluation
          </h1>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Multi-objective ranking combining thermochemical/biochemical feasibility, gate economics, carbon permanence, and transport limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-3 py-1.5 text-xs font-medium rounded-xs border transition-colors ${
              compareMode
                ? 'bg-[#181D1B] border-[#8BCF45] text-[#8BCF45]'
                : 'bg-[#151A18] border-[#26302C] text-[#9EAAA5] hover:text-[#E5ECE8]'
            }`}
          >
            {compareMode ? 'Exit Comparison' : 'Side-by-Side Compare'}
          </button>
          <button
            onClick={() => navigate('/simulator')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0B0D0D] bg-[#8BCF45] hover:bg-[#9ED957] rounded-xs"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Open Pathway Simulator</span>
          </button>
        </div>
      </div>

      {feedbackNotice && (
        <div className="p-3 bg-[#151A18] border border-[#8BCF45]/40 text-xs text-[#8BCF45] rounded-xs flex items-center justify-between">
          <span>{feedbackNotice}</span>
          <button onClick={() => setFeedbackNotice(null)} className="text-[#68756F] hover:text-[#E5ECE8]">✕</button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load circular pathways"
          message={(error as any).message}
          onRetry={refetch}
        />
      ) : compareMode ? (
        /* Side by Side Comparison Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pathways.slice(0, 3).map((pw) => (
            <Card key={pw.id} title={pw.name} subtitle={pw.category}>
              <div className="space-y-3 text-xs">
                <div className="text-xl font-bold font-mono text-[#8BCF45]">{pw.overallScore} / 100</div>
                <div className="p-2 bg-[#151A18] rounded-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#9EAAA5]">Technical Feasibility:</span>
                    <span className="font-mono text-[#E5ECE8]">{pw.technicalFeasibility}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9EAAA5]">Economic Gate Score:</span>
                    <span className="font-mono text-[#E5ECE8]">{pw.economicScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9EAAA5]">Carbon Benefit:</span>
                    <span className="font-mono text-[#E5ECE8]">{pw.environmentalBenefit}%</span>
                  </div>
                </div>
                <div>
                  <span className="text-[#9EAAA5] block text-[11px]">CO₂e Abatement:</span>
                  <span className="font-mono text-[#8BCF45] font-semibold">{pw.co2eAvoidedPerTon} kgCO₂e/t</span>
                </div>
                <div>
                  <span className="text-[#9EAAA5] block text-[11px]">Target Outputs:</span>
                  <span className="text-[#E5ECE8]">{pw.targetProducts.join(', ')}</span>
                </div>
                <ConfidenceMeter score={pw.confidence} evidenceCount={pw.evidenceCount} freshness={pw.freshness} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Standard Ranked List + Detail Inspection */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pathways List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {pathways.map((pw) => {
              const isSelected = (selectedPathwayId || pathways[0]?.id) === pw.id;
              const currentAction = oversightState[pw.id];

              return (
                <div
                  key={pw.id}
                  onClick={() => setSelectedPathway(pw.id)}
                  className={`p-4 rounded-sm bg-[#111615] border cursor-pointer transition-all ${
                    isSelected ? 'border-[#8BCF45] shadow-md' : 'border-[#26302C] hover:border-[#303936]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-[#E5ECE8]">{pw.name}</h4>
                        <Badge status={pw.status} />
                      </div>
                      <span className="text-xs text-[#9EAAA5] mt-0.5 block">{pw.category}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xl font-bold font-mono text-[#8BCF45]">
                        {pw.overallScore} <span className="text-xs text-[#68756F]">/ 100</span>
                      </span>
                      <span className="block text-[10px] text-[#68756F]">Composite Rank</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#9EAAA5] mt-2">{pw.primaryTechnology}</p>

                  <div className="grid grid-cols-3 gap-2 my-3 p-2 bg-[#151A18] rounded-xs text-[11px]">
                    <div>
                      <span className="text-[10px] text-[#68756F] block">CO₂e Mitigation</span>
                      <span className="font-mono text-[#8BCF45]">{pw.co2eAvoidedPerTon} kg/t</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#68756F] block">Clean Energy Yield</span>
                      <span className="font-mono text-[#E5ECE8]">{pw.energyGeneratedPerTon} kWh/t</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#68756F] block">Efficiency</span>
                      <span className="font-mono text-[#D6D75A]">{(pw.conversionEfficiency * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Human Oversight Bar (Accept, Reject, Modify, Request Evidence) */}
                  <div className="pt-2 border-t border-[#26302C]/60 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-[#68756F]">
                      Human Oversight Decision:
                    </span>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOversight(pw.id, 'ACCEPT')}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-xs font-medium transition-colors ${
                          currentAction === 'ACCEPT'
                            ? 'bg-[#8BCF45] text-[#0B0D0D]'
                            : 'bg-[#151A18] text-[#9EAAA5] hover:text-[#8BCF45] border border-[#26302C]'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleOversight(pw.id, 'REJECT')}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-xs font-medium transition-colors ${
                          currentAction === 'REJECT'
                            ? 'bg-[#DC2626] text-white'
                            : 'bg-[#151A18] text-[#9EAAA5] hover:text-[#DC2626] border border-[#26302C]'
                        }`}
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleOversight(pw.id, 'MODIFY')}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-xs font-medium transition-colors ${
                          currentAction === 'MODIFY'
                            ? 'bg-[#D6D75A] text-[#0B0D0D]'
                            : 'bg-[#151A18] text-[#9EAAA5] hover:text-[#D6D75A] border border-[#26302C]'
                        }`}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Modify</span>
                      </button>
                      <button
                        onClick={() => handleOversight(pw.id, 'REQUEST_MORE_EVIDENCE')}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-xs font-medium transition-colors ${
                          currentAction === 'REQUEST_MORE_EVIDENCE'
                            ? 'bg-[#6DA8C8] text-[#0B0D0D]'
                            : 'bg-[#151A18] text-[#9EAAA5] hover:text-[#6DA8C8] border border-[#26302C]'
                        }`}
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>More Evidence</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Selected Pathway Inspection Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {activePathway && (
              <Card
                title={`Pathway Analysis: ${activePathway.name}`}
                subtitle="Deep scientific and economic evaluation grounded in IPCC & FAO models."
              >
                <div className="space-y-4">
                  <ConfidenceMeter
                    score={activePathway.confidence}
                    evidenceCount={activePathway.evidenceCount}
                    freshness={activePathway.freshness}
                  />

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-[#26302C]/60">
                      <span className="text-[#9EAAA5]">Methodology Standard</span>
                      <span className="font-mono text-[#E5ECE8]">{activePathway.methodology}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#26302C]/60">
                      <span className="text-[#9EAAA5]">Primary Conversion Tech</span>
                      <span className="text-[#E5ECE8]">{activePathway.primaryTechnology}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#26302C]/60">
                      <span className="text-[#9EAAA5]">Conversion Thermodynamic Efficiency</span>
                      <span className="font-mono text-[#8BCF45]">{(activePathway.conversionEfficiency * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#26302C]/60">
                      <span className="text-[#9EAAA5]">Target Co-Products</span>
                      <span className="text-[#E5ECE8]">{activePathway.targetProducts.join(', ')}</span>
                    </div>
                  </div>

                  {resource && (
                    <div className="p-3 bg-[#151A18] border border-[#26302C] rounded-xs text-xs space-y-2">
                      <span className="text-[11px] font-mono text-[#8BCF45] block uppercase">
                        Active Simulation with {resource.name} ({resource.quantity} t)
                      </span>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#9EAAA5]">Gross Material Offset:</span>
                        <span className="font-mono text-[#E5ECE8]">{formatCarbon((resource.quantity * activePathway.co2eAvoidedPerTon) / 1000, locale)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#9EAAA5]">Clean Energy Recovery:</span>
                        <span className="font-mono text-[#E5ECE8]">{((resource.quantity * activePathway.energyGeneratedPerTon) / 1000).toFixed(1)} MWh</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => navigate('/simulator')}
                    className="w-full py-2 bg-[#8BCF45] text-[#0B0D0D] font-semibold text-xs rounded-xs hover:bg-[#9ED957]"
                  >
                    Launch Interactive Simulator
                  </button>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
