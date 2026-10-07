import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, ShieldAlert } from 'lucide-react';
import { ragClient } from '../../api/clients/rag.ts';
import { Card } from '../../components/ui/Card.tsx';
import { ConfidenceMeter } from '../../components/ui/ConfidenceMeter.tsx';
import { ErrorState } from '../../components/ui/States.tsx';

/** Grounded Q&A over the Db2 knowledge base. Shows citations; shows "insufficient evidence" instead of guessing. */
export const KnowledgeAssistant: React.FC = () => {
  const [question, setQuestion] = useState('');
  const ask = useMutation({ mutationFn: (q: string) => ragClient.ask(q) });
  const submit = () => question.trim() && ask.mutate(question.trim());

  return (
    <Card title="Knowledge Assistant" subtitle="Answers only from indexed, cited documents.">
      <div className="space-y-3 text-xs">
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="e.g. What biochar yield is reported for rice straw?"
            className="flex-1 bg-[#151A18] border border-[#26302C] text-[#E5ECE8] px-2.5 py-1.5 rounded-xs"
          />
          <button
            onClick={submit}
            disabled={ask.isPending}
            className="px-3 py-1.5 bg-[#181D1B] border border-[#26302C] text-[#8BCF45] rounded-xs disabled:opacity-50"
            aria-label="Ask"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {ask.isPending && <div className="text-[#68756F]">Searching evidence…</div>}
        {ask.error && <ErrorState title="Assistant unavailable" message={(ask.error as Error).message} />}

        {ask.data && (
          <div className="space-y-3">
            {ask.data.status === 'INSUFFICIENT_EVIDENCE' ? (
              <div className="flex items-start gap-2 text-[#D6D75A]">
                <ShieldAlert className="w-4 h-4 mt-0.5" />
                <span>{ask.data.answer}</span>
              </div>
            ) : (
              <>
                <p className="text-[#E5ECE8] leading-relaxed whitespace-pre-wrap">{ask.data.answer}</p>
                <ConfidenceMeter
                  score={ask.data.confidence}
                  evidenceCount={ask.data.citations.length}
                  freshness="Retrieval similarity"
                />
              </>
            )}
            {ask.data.citations.length > 0 && (
              <ol className="space-y-1.5 border-t border-[#26302C]/60 pt-2">
                {ask.data.citations.map((c) => (
                  <li key={c.n} className="text-[#9EAAA5]">
                    [{c.n}] <span className="text-[#E5ECE8]">{c.title ?? c.source}</span>
                    {c.doi && <> · DOI {c.doi}</>}
                    {!c.verified && <span className="text-[#D6D75A]"> · unverified source</span>}
                  </li>
                ))}
              </ol>
            )}
            <div className="text-[#68756F] font-mono">
              {ask.data.trace.map((t) => `${t.step} ${t.durationMs}ms`).join(' · ')}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
