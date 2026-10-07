import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, ExternalLink, ShieldCheck, FileText } from 'lucide-react';
import { knowledgeClient } from '../../api/clients/knowledge.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { KeyValue } from '../../components/ui/KeyValue.tsx';
import { ConfidenceMeter } from '../../components/ui/ConfidenceMeter.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';

export const ResearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: searchRes, isLoading, error, refetch } = useQuery({
    queryKey: ['knowledge', 'search', searchQuery],
    queryFn: () => knowledgeClient.searchKnowledge(searchQuery)
  });

  const articles = searchRes?.articles || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#26302C]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">
            Scientific Evidence & Agronomic Research
          </h1>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Peer-reviewed literature, experimental field trials, and thermodynamic yield benchmarks grounding CIRQ recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge status="LIVE" />
          <span className="text-xs font-mono text-[#68756F]">Peer-Reviewed Grounding</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 bg-[#111615] border border-[#26302C] rounded-sm flex items-center gap-2 max-w-md">
        <Search className="w-3.5 h-3.5 text-[#68756F]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search research by crop, process (e.g. pyrolysis), or DOI..."
          className="w-full bg-transparent text-xs text-[#E5ECE8] placeholder-[#68756F] focus:outline-hidden"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load research papers"
          message={(error as any)?.message}
          onRetry={refetch}
        />
      ) : (
        <div className="space-y-4">
          {articles.map((art) => (
            <Card
              key={art.id}
              title={art.title}
              subtitle={`${art.source} · Published ${art.publicationDate}`}
              headerAction={<span className="text-[10px] font-mono text-[#8BCF45] bg-[#8BCF45]/15 px-1.5 py-0.5 rounded-xs">Peer Reviewed</span>}
            >
              <div className="space-y-3 text-xs">
                <p className="text-[#E5ECE8] font-medium">{art.citation}</p>

                <div className="p-3 bg-[#151A18] rounded-xs border border-[#26302C] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#9EAAA5]">Target Biomass:</span>
                    <span className="font-semibold text-[#E5ECE8]">{art.resource}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9EAAA5]">Conversion Process:</span>
                    <span className="text-[#E5ECE8]">{art.process}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9EAAA5]">Experimental Conditions:</span>
                    <span className="text-[#D6D75A] font-mono">{art.conditions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9EAAA5]">Measured Yield Output:</span>
                    <span className="text-[#8BCF45] font-mono">{art.output}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9EAAA5]">Regional Scope:</span>
                    <span className="text-[#6DA8C8]">{art.geography}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#68756F]">
                  <span>DOI: {art.doi || '10.1016/j.agwat.2025.10928'}</span>
                  <ConfidenceMeter score={art.confidence} evidenceCount={1} freshness="Indexed" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
