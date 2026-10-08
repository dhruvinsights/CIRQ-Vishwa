import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, ShieldCheck, AlertTriangle, Database } from 'lucide-react';
import { knowledgeClient } from '../../api/clients/knowledge.ts';
import { request } from '../../api/client.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { ConfidenceMeter } from '../../components/ui/ConfidenceMeter.tsx';
import { Skeleton, ErrorState } from '../../components/ui/States.tsx';

export const ResearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('biochar rice straw pyrolysis');
  const [inputValue, setInputValue] = useState('biochar rice straw pyrolysis');

  const { data: healthReady } = useQuery({
    queryKey: ['health', 'ready'],
    queryFn: () => request<any>('/health/ready'),
    retry: false,
  });

  const chunks = healthReady?.checks?.ragChunks;
  const chunksNum = chunks && chunks !== 'UNKNOWN' ? parseInt(chunks, 10) : null;
  const vectorBackend = healthReady?.checks?.vectorStoreBackend || 'chroma';

  const { data: searchRes, isLoading, error, refetch } = useQuery({
    queryKey: ['knowledge', 'search', searchQuery],
    queryFn: () => knowledgeClient.searchKnowledge(searchQuery),
    enabled: searchQuery.trim().length > 0,
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
            Answers grounded in your ingested documents — every claim cites its source chunk.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={chunksNum && chunksNum > 0 ? 'LIVE' : 'STALE'} />
          <span className="text-xs font-mono text-[#68756F]">
            {chunksNum != null ? `${chunksNum} chunks · ${vectorBackend.toUpperCase()}` : 'Knowledge base'}
          </span>
        </div>
      </div>

      {/* Knowledge base status banner */}
      {chunksNum === 0 || chunksNum === null ? (
        <div className="p-3 rounded-sm border border-yellow-500/40 bg-yellow-500/8 flex items-start gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-yellow-300">Knowledge base is empty</span>
            <p className="text-yellow-200/70 mt-0.5">
              Drop PDF or Markdown files into <code className="text-yellow-300 font-mono">backend/corpus/</code> then call{' '}
              <code className="text-yellow-300 font-mono">POST /api/v1/knowledge/ingest</code> to enable evidence-backed answers.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded-sm border border-[#26302C] bg-[#111615] flex items-center gap-2 text-xs text-[#9EAAA5]">
          <Database className="w-3.5 h-3.5 text-[#8BCF45] shrink-0" />
          <span><span className="text-[#8BCF45] font-mono font-semibold">{chunksNum}</span> document chunks indexed in <span className="font-mono">{vectorBackend.toUpperCase()}</span> — results are retrieved by cosine similarity, not keyword match.</span>
        </div>
      )}

      {/* Search Input */}
      <div className="flex gap-2 max-w-xl">
        <div className="flex-1 p-3 bg-[#111615] border border-[#26302C] rounded-sm flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-[#68756F] shrink-0" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setSearchQuery(inputValue); }}
            placeholder="e.g. biochar yield rice straw 500°C, bagasse ethanol fermentation..."
            className="w-full bg-transparent text-xs text-[#E5ECE8] placeholder-[#68756F] focus:outline-hidden"
          />
        </div>
        <button
          onClick={() => setSearchQuery(inputValue)}
          className="px-3 py-2 bg-[#8BCF45] hover:bg-[#9ED957] text-[#0B0D0D] text-xs font-semibold rounded-sm transition-colors"
        >
          Search
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to search knowledge base"
          message={(error as any)?.message}
          onRetry={refetch}
        />
      ) : articles.length === 0 && searchQuery ? (
        <div className="p-6 rounded-sm border border-[#26302C] bg-[#111615] text-center space-y-2">
          <BookOpen className="w-8 h-8 text-[#68756F] mx-auto" />
          <p className="text-sm font-semibold text-[#9EAAA5]">No evidence found for "{searchQuery}"</p>
          <p className="text-xs text-[#68756F]">
            The knowledge base has no chunks matching this query above the relevance threshold. <br />
            Try a broader term, or ingest more documents via <code className="font-mono">POST /api/v1/knowledge/ingest</code>.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((art) => (
            <Card
              key={art.id}
              title={art.title}
              subtitle={art.source || 'Knowledge base'}
              headerAction={
                <div className="flex items-center gap-1.5">
                  {art.verified ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-[#8BCF45] bg-[#8BCF45]/15 px-1.5 py-0.5 rounded-xs">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#9EAAA5] bg-[#26302C] px-1.5 py-0.5 rounded-xs">
                      Unverified
                    </span>
                  )}
                </div>
              }
            >
              <div className="space-y-3 text-xs">
                <p className="text-[#E5ECE8] leading-relaxed">{art.output}</p>
                <div className="flex items-center justify-between text-[11px] text-[#68756F]">
                  {art.doi ? (
                    <span className="font-mono">DOI: {art.doi}</span>
                  ) : (
                    <span className="italic">No DOI available</span>
                  )}
                  <ConfidenceMeter score={art.confidence} evidenceCount={1} freshness="Vector similarity" />
                </div>
                {art.citation && (
                  <p className="text-[11px] text-[#9EAAA5] border-t border-[#26302C] pt-2">{art.citation}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
