import React from 'react';
import { Badge, ProvenanceStatus } from './Badge.tsx';

interface ProvenanceChipProps {
  source: string;
  sourceType?: string;
  retrievedAt?: string;
  license?: string;
  status?: ProvenanceStatus | string;
  className?: string;
}

export const ProvenanceChip: React.FC<ProvenanceChipProps> = ({
  source,
  sourceType,
  retrievedAt,
  license,
  status = 'LIVE',
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 p-2 rounded-sm bg-[#151A18] border border-[#26302C] text-xs text-[#9EAAA5] ${className}`}>
      <div className="flex items-center gap-2 truncate">
        <Badge status={status} />
        <span className="truncate text-[#E5ECE8] font-medium" title={source}>
          {source}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-[#68756F] shrink-0">
        {sourceType && <span>{sourceType}</span>}
        {license && (
          <>
            <span aria-hidden="true">·</span>
            <span>{license}</span>
          </>
        )}
        {retrievedAt && (
          <>
            <span aria-hidden="true">·</span>
            <span>{retrievedAt}</span>
          </>
        )}
      </div>
    </div>
  );
};
