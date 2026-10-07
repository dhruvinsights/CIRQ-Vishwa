import React from 'react';
import { Badge, ProvenanceStatus } from './Badge.tsx';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  caption?: string;
  trend?: { value: string; positive?: boolean };
  sparklineData?: number[];
  status?: ProvenanceStatus | string;
  freshness?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  caption,
  trend,
  sparklineData = [12, 18, 15, 24, 28, 22, 34, 40],
  status = 'LIVE',
  freshness,
  className = ''
}) => {
  // Compute sparkline points for SVG
  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min || 1;
  const width = 120;
  const height = 32;

  const points = sparklineData
    .map((d, i) => {
      const x = (i / (sparklineData.length - 1)) * width;
      const y = height - ((d - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  const lastPoint = sparklineData[sparklineData.length - 1];
  const lastY = height - ((lastPoint - min) / range) * (height - 6) - 3;

  return (
    <div className={`p-4 rounded-lg bg-[#181A20] border border-[#262B35] hover:border-[#343B49] text-white relative overflow-hidden flex flex-col justify-between transition-all shadow-sm ${className}`}>
      {/* Top Header Row */}
      <div className="flex items-start justify-between text-xs mb-2 gap-2">
        <span className="font-medium text-[#9EAAA5] leading-snug">{label}</span>
        <Badge status={status} size="sm" />
      </div>

      {/* Main Numeral & Sparkline */}
      <div className="flex items-baseline justify-between gap-4 my-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-white tabular-nums font-mono">
            {value}
          </span>
          {unit && <span className="text-xs text-[#9EAAA5] font-mono">{unit}</span>}
        </div>

        {/* Minimal Sparkline with tick axis and point marker */}
        <div className="w-[100px] h-8 relative shrink-0">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            {/* Soft gradient area fill */}
            <defs>
              <linearGradient id={`spark-${label.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E0FF20" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#E0FF20" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Area polygon */}
            <polygon
              points={`0,${height} ${points} ${width},${height}`}
              fill={`url(#spark-${label.replace(/\s+/g, '')})`}
            />
            {/* Line */}
            <polyline
              points={points}
              fill="none"
              stroke="#E0FF20"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* End point marker */}
            <circle cx={width} cy={lastY} r="3" fill="#E0FF20" />
          </svg>
        </div>
      </div>

      {/* Bottom Metadata & Caption */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-[#68756F] pt-2 mt-2 border-t border-[#262B35] gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {trend && (
            <span className={`font-mono font-medium ${trend.positive ? 'text-[#E0FF20]' : 'text-[#EF8B44]'}`}>
              {trend.value}
            </span>
          )}
          {caption && <span className="text-[#9EAAA5]">{caption}</span>}
        </div>
        {freshness && (
          <span className="font-mono text-[10px] text-[#68756F] shrink-0">
            {freshness}
          </span>
        )}
      </div>
    </div>
  );
};
