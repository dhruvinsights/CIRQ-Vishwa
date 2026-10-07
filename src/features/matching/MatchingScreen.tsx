import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowRightLeft,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { matchingClient } from '../../api/clients/matching.ts';
import { processorClient } from '../../api/clients/processor.ts';
import { resourceClient } from '../../api/clients/resource.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { ConfidenceMeter } from '../../components/ui/ConfidenceMeter.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';
import { useSelectionStore } from '../../stores/selectionStore.ts';
import { usePreferencesStore } from '../../stores/preferencesStore.ts';
import { formatCurrency, formatMass } from '../../lib/format.ts';

export const MatchingScreen: React.FC = () => {
  const { selectedResourceId, selectedProcessorId, setSelectedProcessor } = useSelectionStore();
  const { unitSystem, currency, locale } = usePreferencesStore();

  const [selectedMatchId, setSelectedMatchId] = useState('match-res-9021');
  const [oversightAction, setOversightAction] = useState<string | null>(null);

  // Queries
  const { data: resource } = useQuery({
    queryKey: ['resources', selectedResourceId],
    queryFn: () => resourceClient.getResource(selectedResourceId || 'res-rice-straw-up')
  });

  const { data: matchData, isLoading: matchLoading } = useQuery({
    queryKey: ['matching', 'detail', selectedMatchId],
    queryFn: () => matchingClient.getMatch(selectedMatchId)
  });

  const { data: explanationData } = useQuery({
    queryKey: ['matching', 'explanation', selectedMatchId],
    queryFn: () => matchingClient.getMatchExplanation(selectedMatchId)
  });

  const { data: processorMatches } = useQuery({
    queryKey: ['processors', 'matched', selectedResourceId],
    queryFn: () => processorClient.matchProcessor({ resourceId: selectedResourceId || 'res-rice-straw-up' })
  });

  const matches = processorMatches?.matches || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#26302C]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">
            Biomass Supply-to-Processor Matching Engine
          </h1>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Algorithmic matchmaking factoring moisture thresholds, batch size constraints, transport distance, and gate economics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge status="LIVE" />
          <span className="text-xs font-mono text-[#68756F]">Matching Algorithm: Dual-Primal Simplex</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Matched Candidate Processors (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <Card
            title={`Recommended Facilities for ${resource?.name || 'Biomass Stream'}`}
            subtitle="Ranked by compatibility score and route logistics"
          >
            <div className="space-y-3">
              {matches.map((m) => {
                const isSelected = selectedProcessorId === m.processorId;
                return (
                  <div
                    key={m.processorId}
                    onClick={() => setSelectedProcessor(m.processorId)}
                    className={`p-3.5 rounded-sm bg-[#151A18] border cursor-pointer transition-all ${
                      isSelected ? 'border-[#8BCF45]' : 'border-[#26302C] hover:border-[#303936]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-[#E5ECE8]">{m.name}</h4>
                        <span className="text-xs text-[#9EAAA5] block">{m.category}</span>
                      </div>
                      <span className="text-lg font-bold font-mono text-[#8BCF45]">
                        {m.matchScore}% <span className="text-[10px] text-[#68756F]">Fit</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 my-2 text-[11px] text-[#9EAAA5]">
                      <div>
                        <span className="text-[#68756F] block">Distance:</span>
                        <span className="font-mono text-[#E5ECE8]">{m.distanceKm} km</span>
                      </div>
                      <div>
                        <span className="text-[#68756F] block">Free Cap:</span>
                        <span className="font-mono text-[#E5ECE8]">{m.availableCapacity} {m.unit}</span>
                      </div>
                      <div>
                        <span className="text-[#68756F] block">Gate Fee:</span>
                        <span className="font-mono text-[#E5ECE8]">${m.costPerTon}/t</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#8BCF45] font-mono">
                      Estimated offset: {m.co2eOffsetTons} tCO₂e avoided
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Match Explanation & Oversight Panel (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <Card
            title="Match Explanation & Transparency Matrix"
            subtitle="Deterministic explanation of why this facility is Pareto-optimal."
            headerAction={<Badge status="LIVE" />}
          >
            <div className="space-y-4">
              <ConfidenceMeter score={94} evidenceCount={4} freshness="Calculated 5 min ago" />

              {/* Criteria breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#9EAAA5] block uppercase tracking-wider font-mono">
                  Multi-Factor Evaluation Criteria
                </span>
                {(explanationData?.criteriaEvaluation || [
                  { factor: 'Geographic Proximity (28.4 km)', score: 98, weight: 0.3, note: 'Direct rural highway connection, haulage under 45 mins' },
                  { factor: 'Biochemical Quality Compliance', score: 94, weight: 0.3, note: 'Moisture 12.4% is well below 20% limit for slow pyrolysis' },
                  { factor: 'Processor Daily Capacity Headroom', score: 92, weight: 0.25, note: '48 tonnes/day free capacity accommodates 480t batch' },
                  { factor: 'Carbon Offsetting Permanence', score: 96, weight: 0.15, note: 'EBC biochar certification guarantees 100+ year recalcitrance' }
                ]).map((crit: any, i: number) => (
                  <div key={i} className="p-2.5 bg-[#151A18] rounded-xs border border-[#26302C] text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-[#E5ECE8]">{crit.factor}</span>
                      <span className="font-mono text-[#8BCF45] font-semibold">{crit.score}/100</span>
                    </div>
                    <p className="text-[11px] text-[#9EAAA5]">{crit.note}</p>
                  </div>
                ))}
              </div>

              {/* Human Oversight Decisions */}
              <div className="pt-3 border-t border-[#26302C] space-y-2">
                <span className="text-xs font-semibold text-[#9EAAA5] block">
                  Human Oversight Action:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOversightAction('CONFIRMED_MATCH')}
                    className="py-2 px-3 bg-[#8BCF45] text-[#0B0D0D] font-semibold text-xs rounded-xs hover:bg-[#9ED957]"
                  >
                    Confirm & Commission Route
                  </button>
                  <button
                    onClick={() => setOversightAction('REQUESTED_AUDIT')}
                    className="py-2 px-3 bg-[#151A18] text-[#E5ECE8] border border-[#26302C] font-semibold text-xs rounded-xs hover:bg-[#181D1B]"
                  >
                    Request Physical Sample Audit
                  </button>
                </div>
                {oversightAction && (
                  <div className="p-2 bg-[#8BCF45]/10 border border-[#8BCF45]/30 rounded-xs text-xs text-[#8BCF45] text-center">
                    Action recorded: {oversightAction}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
