import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  Search,
  Plus,
  Upload,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle,
  X
} from 'lucide-react';
import { resourceClient } from '../../api/clients/resource.ts';
import { Card } from '../../components/ui/Card.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { ConfidenceMeter } from '../../components/ui/ConfidenceMeter.tsx';
import { Skeleton, ErrorState, EmptyState } from '../../components/ui/States.tsx';
import { useSelectionStore } from '../../stores/selectionStore.ts';
import { usePreferencesStore } from '../../stores/preferencesStore.ts';
import { formatMass } from '../../lib/format.ts';

export const ResourcesListScreen: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setSelectedResource, selectedResourceId } = useSelectionStore();
  const { unitSystem, locale } = usePreferencesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [resolveInput, setResolveInput] = useState('');
  const [resolveResult, setResolveResult] = useState<any>(null);

  // Resources query with server-side query params
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['resources', 'list', searchQuery, selectedCategory],
    queryFn: () => resourceClient.getResources({
      query: searchQuery || undefined,
      category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      limit: 50
    })
  });

  // Semantic resolution mutation
  const resolveMutation = useMutation({
    mutationFn: (term: string) => resourceClient.resolveResource(term),
    onSuccess: (res) => {
      setResolveResult(res);
    }
  });

  // Batch import mutation
  const importMutation = useMutation({
    mutationFn: (items: any[]) => resourceClient.importResources(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setImportModalOpen(false);
    }
  });

  const resources = data?.data || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#26302C]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E5ECE8]">
            Resource Streams Catalog
          </h1>
          <p className="text-xs text-[#9EAAA5] mt-0.5">
            Registered agricultural residue, agro-industrial by-products, and biological feedstocks connected to the CIRQ circular graph.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Concept Resolver */}
          <button
            onClick={() => {
              setResolveInput('');
              setResolveResult(null);
              setImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#E5ECE8] bg-[#151A18] hover:bg-[#181D1B] border border-[#26302C] rounded-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8BCF45]" />
            <span>Resolve Concept / Import</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[#111615] border border-[#26302C] rounded-sm">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-[#151A18] border border-[#26302C] rounded-xs px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-[#68756F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by crop, residue alias, region or concept..."
            className="w-full bg-transparent text-xs text-[#E5ECE8] placeholder-[#68756F] focus:outline-hidden"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#9EAAA5] hover:text-[#E5ECE8]">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category Tabs / Filters */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {['ALL', 'Crop Residue', 'Agro-Industrial', 'Fruit & Beverage', 'Fermentation'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-xs whitespace-nowrap text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#181D1B] text-[#8BCF45] border border-[#8BCF45]/30'
                  : 'text-[#9EAAA5] hover:text-[#E5ECE8] hover:bg-[#151A18]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content Table State Matrix */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to retrieve resource catalog"
          message={(error as any).message}
          onRetry={refetch}
        />
      ) : resources.length === 0 ? (
        <EmptyState
          title="No resource streams found"
          description="Try adjusting your search terms or register a new biomass batch using the concept resolver."
          action={{
            label: 'Clear Filters',
            onClick: () => {
              setSearchQuery('');
              setSelectedCategory('ALL');
            }
          }}
        />
      ) : (
        <div className="rounded-sm bg-[#111615] border border-[#26302C] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#151A18] border-b border-[#26302C] text-[#9EAAA5] font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Resource Concept</th>
                  <th className="px-4 py-3">Category & Origin</th>
                  <th className="px-4 py-3 text-right">Available Volume</th>
                  <th className="px-4 py-3">Proximate Composition</th>
                  <th className="px-4 py-3">Quality / Verification</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26302C]/60">
                {resources.map((r) => {
                  const isSelected = selectedResourceId === r.id;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedResource(r.id)}
                      className={`hover:bg-[#151A18]/60 transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#151A18]/90' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-[#E5ECE8]">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{r.name}</span>
                          <Badge status={r.provenance?.[0]?.status || 'LIVE'} />
                        </div>
                        <div className="text-[11px] text-[#68756F] mt-0.5">
                          Concept: <span className="font-mono">{r.canonicalConceptId}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-[#9EAAA5]">
                        <div>{r.category}</div>
                        <div className="text-[11px] text-[#68756F]">
                          {r.location?.address || r.location?.region} ({r.location?.countryCode})
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-semibold text-[#8BCF45] tabular-nums">
                        {formatMass(r.quantity, unitSystem, locale)}
                      </td>

                      <td className="px-4 py-3 text-[#9EAAA5] font-mono text-[11px]">
                        <span>M: {r.composition.moisture.value}%</span> ·{' '}
                        <span>Ash: {r.composition.ash.value}%</span> ·{' '}
                        <span>{r.composition.energyContent?.value || 14.2} GJ/t</span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#E5ECE8]">
                            {r.qualityScore}/100
                          </span>
                          <span className="text-[10px] text-[#68756F] font-mono">
                            ({r.confidence}% conf)
                          </span>
                        </div>
                        <span className="text-[10px] text-[#68756F] block truncate">
                          {r.freshness}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedResource(r.id);
                            navigate(`/resources/${r.id}`);
                          }}
                          className="px-2.5 py-1 text-xs font-medium bg-[#151A18] hover:bg-[#181D1B] border border-[#26302C] text-[#8BCF45] hover:text-[#9ED957] rounded-xs transition-colors inline-flex items-center gap-1"
                        >
                          <span>Intelligence</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Concept Resolver & Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setImportModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#111615] border border-[#26302C] rounded-sm p-6 z-10 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#26302C]">
              <div>
                <h3 className="text-sm font-semibold text-[#E5ECE8]">AGROVOC Semantic Concept Resolver</h3>
                <p className="text-xs text-[#9EAAA5] mt-0.5">
                  Resolve colloquial agricultural residue terms to canonical bioeconomy ontologies.
                </p>
              </div>
              <button onClick={() => setImportModalOpen(false)} className="text-[#9EAAA5] hover:text-[#E5ECE8]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#9EAAA5] mb-1">
                  Colloquial Biomass Name or Dialect Term:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={resolveInput}
                    onChange={(e) => setResolveInput(e.target.value)}
                    placeholder="e.g. 'धान का पुआल', 'bagaço de cana', 'coffee cascara'"
                    className="flex-1 bg-[#151A18] border border-[#26302C] rounded-xs px-3 py-1.5 text-xs text-[#E5ECE8] focus:outline-hidden"
                  />
                  <button
                    onClick={() => resolveMutation.mutate(resolveInput || 'paddy straw')}
                    disabled={resolveMutation.isPending}
                    className="px-3 py-1.5 bg-[#8BCF45] text-[#0B0D0D] text-xs font-semibold rounded-xs hover:bg-[#9ED957]"
                  >
                    {resolveMutation.isPending ? 'Resolving...' : 'Resolve'}
                  </button>
                </div>
              </div>

              {/* Resolved Concept Display */}
              {resolveResult && (
                <div className="p-3 bg-[#151A18] border border-[#8BCF45]/30 rounded-xs text-xs space-y-1.5">
                  <div className="flex items-center gap-1 text-[#8BCF45] font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Ontology Match: {resolveResult.canonicalName}</span>
                  </div>
                  <div className="text-[#9EAAA5]">
                    Concept URI: <code className="text-[#6DA8C8]">{resolveResult.canonicalConceptId}</code>
                  </div>
                  <div className="text-[#68756F] text-[11px]">
                    Confidence: {resolveResult.confidence}% · Evidence sources: {resolveResult.evidenceCount}
                  </div>
                  <button
                    onClick={() => {
                      importMutation.mutate([{ name: resolveResult.canonicalName, canonicalConceptId: resolveResult.canonicalConceptId }]);
                    }}
                    className="mt-2 w-full py-1.5 bg-[#8BCF45] text-[#0B0D0D] font-semibold rounded-xs"
                  >
                    Register Stream to Knowledge Graph
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
