import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, Cpu, Layers, Sparkles, X } from 'lucide-react';
import { searchClient } from '../../api/clients/search.ts';
import { useSelectionStore } from '../../stores/selectionStore.ts';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [nlResult, setNlResult] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const navigate = useNavigate();
  const { setSelectedResource } = useSelectionStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setNlResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [resRes, nlRes] = await Promise.all([
          searchClient.searchResources(query),
          searchClient.searchNaturalLanguage(query)
        ]);
        setSuggestions(resRes.results || []);
        setNlResult(nlRes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-start justify-center pt-20 px-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#181A20] border border-[#262B35] rounded-lg shadow-2xl overflow-hidden z-10 flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#262B35] bg-[#121317]">
          <Search className="w-4 h-4 text-[#E0FF20] mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agricultural crops, biomass residue, processors, or ask natural language..."
            className="w-full bg-transparent text-sm text-white placeholder-[#68756F] focus:outline-hidden"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#9EAAA5] hover:text-white p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-mono text-[#68756F] bg-[#1E222B] border border-[#262B35] rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-3 space-y-3">
          {loading && (
            <div className="text-center py-6 text-xs text-[#9EAAA5] font-mono">
              Resolving semantic ontology & sector graph...
            </div>
          )}

          {/* Natural Language Intent Block */}
          {nlResult && nlResult.structuredIntent && (
            <div className="p-3 bg-[#1E222B] border border-[#E0FF20]/40 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-[#E0FF20] font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Structured Intent Recognized ({nlResult.confidence}% confidence)</span>
              </div>
              <div className="text-xs text-white">
                Category: <strong className="text-[#E0FF20]">{nlResult.structuredIntent.category}</strong> ·
                Recommended Pathway: <span className="underline decoration-[#E0FF20]">{nlResult.structuredIntent.recommendedPathway}</span>
              </div>
              <button
                onClick={() => {
                  if (nlResult.structuredIntent.resourceId) {
                    setSelectedResource(nlResult.structuredIntent.resourceId);
                    navigate(`/resources/${nlResult.structuredIntent.resourceId}`);
                  } else {
                    navigate('/pathways');
                  }
                  onClose();
                }}
                className="mt-2 text-xs font-bold px-3 py-1 bg-[#E0FF20] text-[#121317] rounded-md hover:bg-[#EEFF52] transition-colors"
              >
                Open Recommended Pathway
              </button>
            </div>
          )}

          {/* Direct Matching Resources */}
          {suggestions.length > 0 && (
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#9EAAA5] mb-1.5 px-2 font-semibold">
                Matching Resource Streams ({suggestions.length})
              </div>
              <div className="space-y-1">
                {suggestions.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedResource(r.id);
                      navigate(`/resources/${r.id}`);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-[#1E222B] flex items-center justify-between text-xs text-white group border border-transparent hover:border-[#262B35] transition-colors"
                  >
                    <div>
                      <div className="font-semibold group-hover:text-[#E0FF20]">{r.name}</div>
                      <div className="text-[11px] text-[#9EAAA5]">
                        {r.category} · {r.quantity} {r.unit} · {r.location?.region}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#E0FF20] bg-[#121317] border border-[#262B35] px-2 py-0.5 rounded-full font-bold">
                      {r.qualityScore}/100 quality
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Route Shortcuts */}
          {!query && (
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#9EAAA5] mb-1.5 px-2 font-semibold">
                Quick Sector Navigation
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Sector & Regional Map', path: '/map', icon: Compass },
                  { label: 'Crops & Residue Feedstock', path: '/resources', icon: Layers },
                  { label: 'Bio-Pathway Simulator', path: '/simulator', icon: Cpu },
                  { label: 'Circularity Demo Sequence', path: '/demo', icon: Sparkles }
                ].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      onClose();
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-[#1E222B] hover:bg-[#252A36] text-xs text-white border border-[#262B35] text-left transition-colors"
                  >
                    <item.icon className="w-4 h-4 text-[#E0FF20]" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
