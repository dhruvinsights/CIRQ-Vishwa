import React from 'react';

export type ProvenanceStatus = 'LIVE' | 'DEMO' | 'CACHED' | 'STALE' | 'ERROR';

interface BadgeProps {
  status: ProvenanceStatus | string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'sm' }) => {
  const norm = (status || 'LIVE').toUpperCase();

  const colorStyles: Record<string, string> = {
    LIVE: 'text-[#E0FF20] bg-[#E0FF20]/15 border-[#E0FF20]/40',
    DEMO: 'text-[#FFFF00] bg-[#FFFF00]/15 border-[#FFFF00]/40',
    CACHED: 'text-[#6DA8C8] bg-[#6DA8C8]/15 border-[#6DA8C8]/40',
    STALE: 'text-[#EF8B44] bg-[#EF8B44]/15 border-[#EF8B44]/40',
    ERROR: 'text-[#DC2626] bg-[#DC2626]/15 border-[#DC2626]/40'
  };

  const currentStyle = colorStyles[norm] || colorStyles.LIVE;
  const sizeStyle = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider font-semibold border rounded-full ${currentStyle} ${sizeStyle}`}
      title={`Data Provenance: ${norm}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90 animate-pulse" />
      {norm}
    </span>
  );
};
