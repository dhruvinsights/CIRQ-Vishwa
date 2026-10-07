import React from 'react';

interface ConfidenceMeterProps {
  score: number; // 0 - 100
  evidenceCount?: number;
  freshness?: string;
  className?: string;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  score,
  evidenceCount = 0,
  freshness = 'Unknown',
  className = ''
}) => {
  const getConfidenceLevel = (val: number) => {
    if (val >= 90) return { label: 'High Confidence', color: 'text-[#E0FF20]', bar: 'bg-[#E0FF20]' };
    if (val >= 75) return { label: 'Moderate Confidence', color: 'text-[#FFFF00]', bar: 'bg-[#FFFF00]' };
    return { label: 'Inferred / Low Confidence', color: 'text-[#EF8B44]', bar: 'bg-[#EF8B44]' };
  };

  const level = getConfidenceLevel(score);

  return (
    <div className={`p-2.5 rounded-md bg-[#1E222B] border border-[#262B35] ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#9EAAA5] font-semibold">
          Verification Score
        </span>
        <span className="text-xs font-mono font-bold tabular-nums text-white">
          {score} <span className="text-[#68756F]">/ 100</span>
        </span>
      </div>

      {/* Progress Bar with tick notches */}
      <div className="w-full h-1.5 bg-[#121317] rounded-full overflow-hidden relative mb-2">
        <div
          className={`h-full transition-all duration-300 rounded-full ${level.bar}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>

      {/* Provenance metadata line */}
      <div className="flex items-center justify-between text-[11px] text-[#9EAAA5]">
        <span className={`font-mono font-semibold ${level.color}`}>{level.label}</span>
        <div className="flex items-center gap-1.5 text-[#68756F] font-mono text-[10px]">
          <span>{evidenceCount} sources</span>
          <span aria-hidden="true">·</span>
          <span>{freshness}</span>
        </div>
      </div>
    </div>
  );
};
