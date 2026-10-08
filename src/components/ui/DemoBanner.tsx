import React, { useState } from 'react';
import { FlaskConical, X, Info } from 'lucide-react';

interface DemoBannerProps {
  screen: string;           // e.g. "Bio-Simulator"
  reason: string;           // e.g. "uses hardcoded seed data — no real computation backend"
  docsHint?: string;        // optional: what's needed to make it real
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ screen, reason, docsHint }) => {
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(`demo-dismissed-${screen}`) === '1'; } catch { return false; }
  });

  if (dismissed) return null;

  return (
    <div className="mx-6 mt-4 p-3 rounded-sm border border-yellow-500/40 bg-yellow-500/8 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        <FlaskConical className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-xs font-semibold text-yellow-300">{screen} — Demo Data</span>
          <p className="text-[11px] text-yellow-200/70 mt-0.5">{reason}</p>
          {docsHint && (
            <p className="text-[11px] text-yellow-200/50 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3 shrink-0" /> {docsHint}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() => {
          try { sessionStorage.setItem(`demo-dismissed-${screen}`, '1'); } catch {}
          setDismissed(true);
        }}
        className="text-yellow-400/60 hover:text-yellow-300 shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
